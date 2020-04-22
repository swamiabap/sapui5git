/* global _ */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/model/formatter",
    "sap/ui/model/json/JSONModel",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvMaintainService",
    "sg/gov/jtc/JTC-InvoiceApp/controller/POWOSearch",
    "sap/m/MessageBox"
], function (ManagedObject, formatter, JSONModel, InvMaintenanceService, POWOSearch, MessageBox) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.POWOSelection", {
        formatter: formatter,

        constructor: function (oController, oPowoModel, oSystemMessageModel) {
            this._oPowoModel = oPowoModel;
            this._oSystemMessageModel = oSystemMessageModel;
            this._InvMaintainService = new InvMaintenanceService();
            this.powoFormatter = {
                taxCodeToDescription: formatter.taxCodeToDescription.bind(oController)
            }
        },

        exit: function () {
            delete this._InvMaintainService;
            this._oPOWOSelectionFragment.destroy();
            delete this._oPOWOSelectionFragment;
            this._POWOSearch.destroy();
            delete this._POWOSearch;
            delete this._oInvoice;
        },

        getFragment: function (oView, sInvoiceID) {
            this._oView = oView;
            this._sInvoiceID = sInvoiceID;
            if (!this._oPOWOSelectionFragment) {
                this._oPOWOSelectionFragment = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.POWOSelection", this);
            }
            // Bind and return
            // this._oPOWOSelectionFragment.bindElement({path: "/", model: "po"});
            return this._oPOWOSelectionFragment;
        },

        handleGrSelection: function (oEvent) {
            const sSelected = oEvent.getParameter("selected") ? "X" : "";
            const aSelectedItems = oEvent.getParameter("listItems");
            let aGrseModified = _.clone(this._oPowoModel.getProperty("/Grse"));
            aSelectedItems.forEach(oListItem => {
                const sPath = oListItem.getBindingContextPath();
                const oGrseToModify = _.clone(this._oPowoModel.getProperty(sPath));
                aGrseModified = aGrseModified.map(oGrse => {
                        if (oGrse.mblnr === oGrseToModify.mblnr) {
                            oGrse.selcl = sSelected;
                        }
                        return oGrse;
                    });
            });
            this._oPowoModel.setProperty("/Grse", aGrseModified);
            this.afterGrSelectionChanged();
            // const oController = this._oView.getController();
            // oController.updateApproversList();
            // oController.executePaiEvent({
            //     GV_OK_CODE: ""
            // }).then((aProcessingLog) => {
            //     console.log("handleGrSelection pai: ", aProcessingLog);
            //     // Update related contract information section
            //     const poState = oController._uiState.po;
            //     const aAssignee = oController._getField(aProcessingLog, "GT_ASSIGNEE_1");
            //     poState.setAssignee(aAssignee);
            //     const aJudgement = oController._getField(aProcessingLog, "GT_JUDGEMENT_1");
            //     poState.setJudgement(aJudgement);
            // });
        },

        afterGrSelectionChanged: function () {
            const oController = this._oView.getController();
            oController.updateApproversList();
            oController.executePaiEvent({
                GV_OK_CODE: ""
            }).then((aProcessingLog) => {
                console.log("handleGrSelection pai: ", aProcessingLog);
                // Update related contract information section
                const poState = oController._uiState.po;
                const aAssignee = oController._getField(aProcessingLog, "GT_ASSIGNEE_1");
                poState.setAssignee(aAssignee);
                const aJudgement = oController._getField(aProcessingLog, "GT_JUDGEMENT_1");
                poState.setJudgement(aJudgement);
            });
        },

        handleGrCheckbox: function (oEvent) {
            // oEvent.getSource().getBindingContext("po").getObject()
            const sPath = oEvent.getSource().getBindingContext("po").getPath();
            let oGrse = _.clone(this._oPowoModel.getProperty(sPath));
            oGrse.selcl = oEvent.getParameter("selected") ? "X" : "";
            this._oPowoModel.setProperty(sPath, oGrse);
            this.afterGrSelectionChanged();
        },

        handleGrCheckboxSelectAll: function (oEvent) {
            const sSelected = oEvent.getParameter("selected") ? "X" : "";
            const aGrse = _.clone(this._oPowoModel.getProperty("/Grse"));
            const aGrseUpdated = aGrse.map(oGr => {
               oGr.selcl = sSelected;
               return oGr;
            });
            this._oPowoModel.setProperty("/Grse", aGrseUpdated);
            this.afterGrSelectionChanged();
        },

        handleAddPowo: function (oEvent) {
            this._POWOSearch.open(this._oView)
                .then(oPowo => {
                    const sPoNumber = _.get(oPowo, "ebeln", "");
                    this._callPowoFunction("ADDPO", {"ebeln": sPoNumber});
                });
        },

        handleRemovePowo: function (oEvent) {
            const sPath = oEvent.getParameter("listItem").getBindingContextPath();
            this._callPowoFunction("RMVPO", {"path": sPath})
                .then(function(){
                    this._oView.getController().updateApproversList();
                }.bind(this));
        },

        _callPowoFunction: function (sFunction, mParameter) {
            let oPowoBundle = {};
            oPowoBundle.Invoice = _.cloneDeep(this._InvMaintainService.getNewEntry("/InvoiceSet"));
            oPowoBundle.Invoice.InvoiceID = this._oInvoice.InvoiceID;
            // Attach Parameters
            const oPowoModel = this._oView.getModel("po");
            const oParameterInitial = this._InvMaintainService.getNewEntry("/ParameterSet");
            oParameterInitial.InvoiceID = oPowoBundle.Invoice.InvoiceID;
            let aParameters = [];
            if (sFunction === "RMVPO") {
                const sPathToRemove = _.get(mParameter, "path");
                const oPowoToRemove = _.clone(oPowoModel.getProperty(sPathToRemove));
                oPowoToRemove.selcl = "X";
                oPowoModel.setProperty(sPathToRemove, oPowoToRemove);
            }
            // GT_TC_POWO
            aParameters.push(_.defaults({}, oParameterInitial, {
                "Group": "FIELDS",
                "Sequence": aParameters.length,
                "Name": "GT_TC_POWO",
                "Value": JSON.stringify(oPowoModel.getProperty("/Powo") || [])
            }));
            // GT_TC_GRSE
            aParameters.push(_.defaults({}, oParameterInitial, {
                "Group": "FIELDS",
                "Sequence": aParameters.length,
                "Name": "GT_TC_GRSE",
                "Value": JSON.stringify(oPowoModel.getProperty("/Grse") || [])
            }));
            if (sFunction === "ADDPO") {
                // GV_EBELN <-- powo to add/validate
                aParameters.push(_.defaults({}, oParameterInitial, {
                    "Group": "FIELDS",
                    "Sequence": aParameters.length,
                    "Name": "GV_EBELN",
                    "Value": _.get(mParameter, "ebeln")
                }));
            }
            // Function to run/execute
            aParameters.push(_.defaults({}, oParameterInitial, {
                "Group": "FUNCTION",
                "Sequence": aParameters.length,
                "Name": "FUNCTION",
                "Value": sFunction
            }));

            oPowoBundle.Invoice.ToParameter = aParameters;

            // Attach empty ToProcessingLog to act as container of processing log
            oPowoBundle.Invoice.ToProcessingLog = [];
            this._oView.byId("linkingPanel").getItems()[0].setBusy(true);
            return this._InvMaintainService.executePowoFunction(oPowoBundle)
                .then(data => {
                    //Check for error messages
                    const sStatus = _.get(data, "__batchResponses.0.response.statusCode", "");
                    if (sStatus === "400") {
                        const oResBody = JSON.parse(_.get(data, "__batchResponses.0.response.body", ""));
                        const sError = _.get(oResBody, "error.message.value", "");
                        if (sError) {
                            MessageBox.error(sError);
                        }
                    } else {
                        //Parse response and update POWO section
                        const oResponse = _.get(data, "__batchResponses.0.__changeResponses.0", {});
                        const aProcessingLog = _.get(oResponse, "data.ToProcessingLog.results", []);
                        if (_.findIndex(aProcessingLog, {LogType: "EXECUTE_POWO_FUNCTION", MessageType: "S"}) > -1) {
                            const sFields = _.chain(aProcessingLog).find({LogType: "GT_FIO_FIELDS"}).get("Message", "[]").value();
                            const aFields = JSON.parse(sFields);
                            const aPowo = _.chain(aFields).find({fname: "GT_TC_POWO"}).get("fvalue", []).value();
                            this._oPowoModel.setProperty("/Powo", aPowo);
                            const aGrse = _.chain(aFields).find({fname: "GT_TC_GRSE"}).get("fvalue", []).value();
                            this._oPowoModel.setProperty("/Grse", aGrse);
                            const aSystemMessages = _.chain(aFields).find({fname: "GT_SYSTEM_MSG"}).get("fvalue", []).value();
                            this._oSystemMessageModel.setProperty("/SystemMessages", aSystemMessages);
                            this._oSystemMessageModel.setProperty("/SystemMessageVisible", aSystemMessages.length > 0);
                        }
                    }
                    const oMessageManager = sap.ui.getCore().getMessageManager();
                    const oMessageModel = oMessageManager.getMessageModel();
                    const aUniqueMessages = _.uniqBy(oMessageModel.getData(), "message");
                    oMessageManager.removeAllMessages();
                    oMessageModel.setData(aUniqueMessages);
                    this._oView.byId("linkingPanel").getItems()[0].setBusy(false);
                });
        },

        setInvoice: function (oInvoice) {
            this._oInvoice = oInvoice;
            this._POWOSearch = new POWOSearch(oInvoice);
        }
    });
});