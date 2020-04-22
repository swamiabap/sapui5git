/* global _:true */
/* global mobx */

sap.ui.define([
    "sg/gov/jtc/JTC-InvoiceApp/controller/BaseController",
    "sap/ui/core/UIComponent",
    "sap/ui/core/Fragment",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/export/SpreadSheet",
    "sap/ui/unified/FileUploader",
    "sg/gov/jtc/JTC-InvoiceApp/model/formatter",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvMaintainService",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvCommonService",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvApprovalService",
    "sg/gov/jtc/JTC-InvoiceApp/controller/RealEstate",
    "sg/gov/jtc/JTC-InvoiceApp/controller/CreditNoteVH",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel",
    "sap/ui/core/message/Message",
    "sap/ui/core/MessageType"
], function (BaseController, UIComponent, Fragment, History, MessageToast, MessageBox,
             Filter, FilterOperator, SpreadSheet, FileUploader, formatter, InvMaintainService,
             InvCommonService, InvApprovalService, RealEstate, CreditNoteVH, MobxModel, Message,
             MessageType) {

    "use strict";

    return BaseController.extend("sg.gov.jtc.JTC-InvoiceApp.controller.Process", {

        formatter: formatter,

        onInit: function () {
            const appState = this.getOwnerComponent().getModel().getData();
            appState.callbackGetUpdatedAttachmentList = this.getUpdatedAttachmentList.bind(this);
            this.appState = appState;

            //TODO: remove these 2 lines later
            globalThis.app = appState;
            globalThis.appModel = this.getOwnerComponent().getModel();
            globalThis.processController = this;

            this.contentDensityClass = this.getOwnerComponent().getContentDensityClass();
            mobx.set(appState.view, "contentDensityClass", this.contentDensityClass);

            this.getView().addStyleClass(this.contentDensityClass);
            // set message model
            const oMessageManager = sap.ui.getCore().getMessageManager();
            this.getView().setModel(oMessageManager.getMessageModel(), "message");

            // activate automatic message generation for complete view
            oMessageManager.registerMessageProcessor(this.getOwnerComponent().getModel("inv"));
            this.oMessageManager = oMessageManager;

            this.oRouter = UIComponent.getRouterFor(this);
            this.procurementInfoPanel = this.byId("linkingPanel");

            // Inv Maintain Service
            this.invMaintainService = new InvMaintainService();

            // Inv Common service:
            this.invCommonModel = this.getOwnerComponent().getModel("invCommon");
            this.invCommonService = new InvCommonService();

            // Inv Approval service
            this._oInvApprovalModel = this.getOwnerComponent().getModel("invApproval");
            this._invApprovalService = new InvApprovalService();

            // Helper model
            this._oHelpModel = this.getOwnerComponent().getModel("help");

            // // Retrieve tax code mapping if not yet set in helper model
            // mobx.autorun(() => {
            //     this._oHelpModel.setProperty("/TaxCodeMap", appState.aux.taxCode.taxCodes);
            // }, {name: "help.TaxCodeMap set"});
            //
            // // Retrieve company codes if not yet set in the helper model
            // mobx.autorun(() => {
            //     this._oHelpModel.setProperty("/CompanyCodes", appState.aux.companyCode.companyCodes);
            // }, {name: "help.CompanyCodes set"})

            // Local Model
            this._oLocalModel = new sap.ui.model.json.JSONModel();
            // this.getView().setModel(this._oLocalModel, "local");

            // // Credit Notes model
            // this._oCreditNoteModel = new sap.ui.model.json.JSONModel();
            // this.getView().setModel(this._oCreditNoteModel, "cn");
            //
            // // POWO model
            // this._oPowoModel = new sap.ui.model.json.JSONModel({
            //     relatedContractsVisible: false,
            //     assigneeTableVisible: false,
            //     judgementTableVisible: false
            //
            // }, false);
            // this.getView().setModel(this._oPowoModel, "po");
            //
            // // System Message model
            // this._oSystemMessageModel = new sap.ui.model.json.JSONModel({}, false);
            // this.getView().setModel(this._oSystemMessageModel, "sm");
            //
            // // Training Information model
            // this._oTrainingInformationModel = new sap.ui.model.json.JSONModel();
            //
            // // Workflow Log model
            // this._oWorkFlowLog = new sap.ui.model.json.JSONModel();
            // this.getView().setModel(this._oWorkFlowLog, "wf");
            //
            // // Attachment model
            // this._oAttachmentModel = new sap.ui.model.json.JSONModel();
            // this.getView().setModel(this._oAttachmentModel, "att");

            // View Model
            this._viewModel = new sap.ui.model.json.JSONModel({
                mode: "display",
                editMode: false,
                editButton: false,
                displayMode: true,
                naTableMode: "None",
                cnTableMode: "None",
                cnSectionVisible: false,
                processViewBusy: false,
                wfHistoryBusy: false,
                procurementDetailsBusy: false,
                cnButtonVisible: false,
                financeInfoVisible: false
            }, false);
            // this.getView().setModel(this._viewModel, "view");

            // Real Estate Helper Object
            this._oRealEstate = new RealEstate(this.getView());

            this.oRouter.getRoute("display").attachPatternMatched(this.onObjectMatched, this);
            // TODO: clean up
            // this._oLocalModel.attachPropertyChange((oEvent) => {
            //     const sPath = oEvent.getParameter("context").getPath();
            //     const oModel = oEvent.getParameter("context").getModel();
            //     if (sPath && sPath.search(/^\/ToInvoiceLinkNA\//) === 0) {
            //         const sAncestorPath = sPath.replace(/^(\/ToInvoiceLinkNA\/)(\d+)$/, "$1");
            //         const aNALines = _.cloneDeep(oModel.getProperty(sAncestorPath)) || [];
            //         const bSomeEmpty = _.some(aNALines, (oNA) => {
            //             return _.isEmpty(oNA.AccountAssignment);
            //         });
            //         if (!bSomeEmpty) {
            //             this.handleAddPostingDetailNA(null);
            //         }
            //     }
            // });
            //Experimental
            //this._setupObservable();
            // AOR model
            //this._aorState = mobx.observable({});
            // this._oAorModel = new MobxModel(this._aorState);
            // this.getView().setModel(this._oAorModel, "aor");
            // this._setupAorObservable();

            sap.ui.getCore().fileUploadArr = [];
            this.attachmentSyncer();
            // const scrollContainer = this.getView().byId("scroll-wf-history");
            // if (scrollContainer) {
            //     scrollContainer.scrollTo(1000, 0, 0);
            // }
        },

        onBeforeRendering: function () {

        },

        onAfterRendering: function () {
            this.uploadCollection = this.byId("UploadCollection");
            var that = this;
            this.uploadCollection._oFileUploader.setIconOnly(false);
            this.uploadCollection._oFileUploader.setIconOnly(false);
            this.uploadCollection._oFileUploader.setButtonText("File Upload");
            this.uploadCollection._oFileUploader.setIconFirst(true);
            this.uploadCollection._oFileUploader.setIcon("sap-icon://upload-to-cloud");
            this.uploadCollection._oFileUploader.setStyle("Emphasized");
            this.uploadCollection.addEventDelegate({
                onBeforeRendering: function () {
                    this.uploadCollection._oFileUploader.setIconOnly(false);
                    this.uploadCollection._oFileUploader.setIconOnly(false);
                    this.uploadCollection._oFileUploader.setButtonText("File Upload");
                    this.uploadCollection._oFileUploader.setIconFirst(true);
                    this.uploadCollection._oFileUploader.setIcon("sap-icon://upload-to-cloud");
                    this.uploadCollection._oFileUploader.setStyle("Emphasized");

                    // Support preview new attachment
                    const oFiles = this.uploadCollection.getItems();
                    // for (var i = 0; i < oFiles.length; i++) {
                    //     if (oFiles[i]._status === "pendingUploadStatus" && oFiles[i].getAttributes().length === 1) {
                    //         var //sFileName = oFiles[i].getFileName(),
                    //             //sTitle = sFileName.substring(0, sFileName.lastIndexOf("."));
                    //             sTitle = "Pending Upload";
                    //         oFiles[i].addAttribute(
                    //             new sap.m.ObjectAttribute({
                    //                 title: sTitle,
                    //                 text: "Preview",
                    //                 active: true,
                    //                 press: this.onReviewFile
                    //             })
                    //         );
                    //     }
                    // }

                    oFiles
                        .filter(item => item._status === "pendingUploadStatus" && item.getAttributes().length === 1)
                        .forEach(item => {
                            item.addAttribute(
                                new sap.m.ObjectAttribute({
                                    title: "Pending Upload",
                                    text: "Preview",
                                    active: true,
                                    press: this.onReviewFile
                                })
                            )
                        });

                    //that.byId("UploadCollection").refresh();
                    // /*for(var i = 0; i < that.byId("UploadCollection").getItems().length; i++) {
                    //     if (that.byId("UploadCollection").getItems()[i].getAttributes().length === 1
                    //         && that.byId("UploadCollection").getItems()[i].getStatuses().length === 0) {
                    //         var sFileName = that.byId("UploadCollection").getItems()[i].getFileName(),
                    //             sTitle = sFileName.substring(0, sFileName.lastIndexOf(".") );
                    //       that.byId("UploadCollection").getItems()[i].addAttribute(
                    //           new sap.m.ObjectAttribute({
                    //               title: sTitle ,
                    //               text: "Edit" ,
                    //               active: true ,
                    //               press: that.onChangeAttDes })
                    //           );
                    //     }
                    // }*/
                }.bind(this),
                onAfterRendering: function () {
                    $("span[id*='-deleteButton-img']").attr("data-sap-ui-icon-content", "");
                }
            }, this);

            try {
                ["table-po", "table-aor", "tablePostingDetailsNA", "idCreditNotesTable"].forEach(sId => {
                    const oTable = this.getView().byId(sId);
                    if (oTable) {
                        oTable.addEventDelegate({
                            onAfterRendering: function () {
                                $("span[id*='-imgDel-img']").attr("data-sap-ui-icon-content", "");
                            }
                        })
                    }
                });
            } catch (e) {
                console.error(e);
            }

            const oWorkFlowLog = this.getView().byId("idWorkFlowHistoryLog");
            if (oWorkFlowLog) {
                oWorkFlowLog.addEventDelegate({
                    onAfterRendering: function () {
                        try {
                            if ($("div.sapSuiteUiCommonsMicroProcessFlowContent")[0].scrollWidth !== undefined) {
                                $("div.sapSuiteUiCommonsMicroProcessFlowContent")[0].scrollLeft = $("div.sapSuiteUiCommonsMicroProcessFlowContent")[0].scrollWidth - 200;
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                });
            }

            const oInputAor = this.getView().byId("in-aor");
            const oProcessController = this;
            if (oInputAor) {
                oInputAor.addEventDelegate({
                    onAfterRendering: function () {
                        try {
                            $("input[id*='in-aor']").first().unbind("dblclick").dblclick(function () {
                                let sAorNo = this.value;
                                if (sAorNo) {
                                    sAorNo = sAorNo.trim();
                                    oProcessController.navToRelatedDocument("AOR", sAorNo, "");
                                }
                            });
                        } catch (e) {
                            console.error(e);
                        }
                    }
                });
            }
            // if (oInputAor) {
            //     oInputAor.attachBrowserEvent("dblclick", function() {
            //         debugger;
            //         let sAorNo = this.getValue();
            //         if (sAorNo) {
            //             sAorNo = sAorNo.trim();
            //             oProcessController.navToRelatedDocument("AOR", sAorNo, "");
            //         }
            //     });
            // }
        },

        onExit: function () {

        },

        _scrollWfHistory: function () {
            // const scrollContainer = this.getView().byId("scroll-wf-history");
            // if (scrollContainer) {
            //     scrollContainer.scrollTo(1000, 0, 0);
            // }
            // if($("[id$='scroll-wf-history']")[0].scrollWidth !== undefined) {
            //     $("[id$='scroll-wf-history']")[0].scrollLeft = $("[id$='scroll-wf-history']")[0].scrollWidth;
            // }
            // // if($("div.sapSuiteUiCommonsMicroProcessFlowContent")[0].scrollWidth !== undefined) {
            // //     $("div.sapSuiteUiCommonsMicroProcessFlowContent")[0].scrollLeft = $("div.sapSuiteUiCommonsMicroProcessFlowContent")[0].scrollWidth - 200;
            // // }
        },

        _aFooterButtons: ["btnSave", "btnCancel", "btnSubmit", "btnReroute",
            "btnRequestCancel", "btnWithdraw", "btnSendCancel", "btnExit",
            "btnPark", "btnPost", "btnReverse", "btnRouteBack", "btnRouteBackRO", "btnRouteBackFVO"],

        _setDefaultFooterButtonStates: function () {
            this._aFooterButtons.forEach(btn => {
                this.getView().byId(btn).setVisible(false);
                if (btn !== "btnSave") {
                    this.getView().byId(btn).setType("Ghost");
                    this.getView().byId(btn).addStyleClass("jtcInvGhostButton");
                }
            });
            this.getView().byId("btnExit").setVisible(true);
        },

        _setActiveFooterButtons: function (sInvoiceStatus) {
            // Set the state of the footer buttons
            this._setDefaultFooterButtonStates();

            // Get the footer contents
            const oFooter = this.getView().byId("proc-foot-buttons");

            const helpModel = this.getView().getModel("help");
            const aButtonGroups = helpModel.getProperty("/ButtonGroups");

            const oButtonGroupType = this.appState.view.buttonGroup;
            console.log("ButtonGroup: ", oButtonGroupType);

            const oButtonGroup = _.find(aButtonGroups, oButtonGroupType);
            console.log("Button Group buttons: ", oButtonGroup);
            const aButtons = _.get(oButtonGroup, "Buttons", [{Button: "btnExit"}]);
            const aButtonId = aButtons.map(function (oButton) {
                return oButton.Button;
            });

            aButtonId.forEach((sId, index) => {
                this.getView().byId(sId).setVisible(true);
                if (index === 0) {
                    this.getView().byId(sId).setType("Emphasized");
                    this.getView().byId(sId).addStyleClass("jtcInvFooterButton");
                }
            });

            //Re-arrange the footer buttons as they appear in the ECC dialog program, except the first 2 controls that
            //are specific to the frontend app.
            const aOrderedFooterControlIds = ["btnMessages", "proc-foot-spacer", ...aButtonId]
                .map(sId => this.getView().createId(sId));

            const aFooterContents = oFooter.removeAllContent();
            aFooterContents.sort((itemA, itemB) => {
                const indexA = _.indexOf(aOrderedFooterControlIds, itemA.getId());
                const indexB = _.indexOf(aOrderedFooterControlIds, itemB.getId());
                return indexA - indexB;
            });

            aFooterContents.forEach(footerControl => oFooter.addContent(footerControl));

            // //0: Messages Button, 1: Toolbar Spacer
            // const aFirstElements = _.pullAt(aFooterContents, [0, 1]);
            // aFirstElements.forEach(oFooterControl => {
            //     oFooter.addContent(oFooterControl);
            // });
            // //Button order as found in help.json grouping
            // aButtonId.forEach((sId, index) => {
            //     const buttonIndex = _.findIndex(aFooterContents, val => {
            //         return val.getId() === this.getView().createId(sId);
            //     });
            //     if (buttonIndex > -1) {
            //         const aButtons = _.pullAt(aFooterContents, [buttonIndex]);
            //         if (index === 0) {
            //             // Not working correctly
            //             //aButtons[0].setType("Emphasized");
            //         }
            //         oFooter.addContent(aButtons[0]);
            //     }
            // });
            // //Add back remaining elements
            // aFooterContents.forEach(oFooterControl => {
            //     oFooter.addContent(oFooterControl);
            // });

            // // Draft, Pending Requestor
            // if (["01", "08"].some(s => s === sInvoiceStatus)) {
            //     ["btnSave", "btnSubmit", "btnReroute", "btnRequestCancel"].forEach(buttonId => this.getView().byId(
            //         buttonId).setVisible(true));

            //     // Pending Verification, Pending Approval, Pending Cancellation
            // } else if (["02", "03", "09"].some(s => s === sInvoiceStatus)) {
            //     ["btnWithdraw"].forEach(buttonId => this.getView().byId(buttonId).setVisible(true));

            // }
        },

        onClosePress: function () {
            this.oRouter.navTo("master");
        },

        onLinkToChange: function (oEvent) {
            const selected = oEvent.getSource().getSelectedKey();
            if (selected === "POWO") {
                this._showPOWOLink();
            } else if (selected === "NA") {
                this._showNALink();
            } else if (selected === "AOR") {
                this._showAORLink();
            } else {
                this.procurementInfoPanel.removeAllItems();
                this.procurementInfoPanel.setVisible(false);
            }
        },

        _showPOWOLink: function () {
            return;
            sap.ui.require([
                "sg/gov/jtc/JTC-InvoiceApp/controller/POWOSelection"
            ], function (POWOSelection) {
                //this._uiState.updateLinkTo("POWO");
                if (!this._oPOWOSelectionFragment) {
                    this._powoSelection = new POWOSelection(this, this._oPowoModel, this._oSystemMessageModel);
                    this._oPOWOSelectionFragment = this._powoSelection.getFragment(this.getView(), "");
                }
                const oInvoice = this._oLocalModel.getProperty("/");
                this._powoSelection.setInvoice(oInvoice);
                this.procurementInfoPanel.removeAllItems();
                this.procurementInfoPanel.addItem(this._oPOWOSelectionFragment);
                this.procurementInfoPanel.setVisible(true);
            }.bind(this));
        },

        _showAORLink: function () {
            return;
            sap.ui.require([
                "sg/gov/jtc/JTC-InvoiceApp/controller/AORSelection"
            ], function (AORSelection) {
                if (!this._oAORSelectionFragment) {
                    this._aorSelection = new AORSelection(this, this._oAorModel, this._oSystemMessageModel);
                    this._oAORSelectionFragment = this._aorSelection.getFragment(this.getView(), "");
                }
                const oInvoice = this._oLocalModel.getProperty("/");
                this.procurementInfoPanel.removeAllItems();
                this.procurementInfoPanel.addItem(this._oAORSelectionFragment);
                this.procurementInfoPanel.setVisible(true);
            }.bind(this));
        },

        _showNALink: function () {
            return;
            //this._uiState.updateLinkTo("NA");
            if (!this._oNASelectionFragment) {
                this._oNASelectionFragment = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.NASelection", this);
            }
            this.procurementInfoPanel.removeAllItems();
            this.procurementInfoPanel.addItem(this._oNASelectionFragment);
            this.procurementInfoPanel.setVisible(true);
        },

        updateApproversList: function () {
            return;
            // Only continue updating the list of valid approvers for draft invoice
            if (this.appState.invDoc.header.status !== "01") {
                return;
            }
            this.getView().byId("selApprovingAuthorities").setBusy(true);
            this.getView().byId("selVerifyingOfficer").setBusy(true);
            // const oInvoiceDeep = this._prepareInvoiceBundle({
            //     "InvoiceDeep": _.cloneDeep(this._oLocalModel.getData()),
            //     "ViewData": _.cloneDeep(this._viewModel.getData()) || [],
            //     "CreditNotes": _.clone(this._oCreditNoteModel.getProperty("/CreditNotes")) || [],
            //     "PowoModel": this._oPowoModel,
            //     "AorState": this._aorState
            // });
            //
            // oInvoiceDeep.ToParameter.push({
            //     "InvoiceID": oInvoiceDeep.InvoiceID,
            //     "Group": "FUNCTION",
            //     "Sequence": oInvoiceDeep.ToParameter.length,
            //     "Name": "FUNCTION",
            //     "Value": "GETAALIST"
            // });

            this.doActionAppState({
                action: "GETAALIST",
                subAction: "GETAALIST"
            })
                .then(oAction => {
                    //Check for error messages
                    this.extractAndDisplayActionResponse(oAction);
                    if (oAction.responseCode === "OK") {
                        //Parse response and extract list of approvers
                        const aApprovers = this.getActionField(oAction.responseData, "GT_AA_VRM");
                        console.log("GT_AA_VRM: ", aApprovers);
                        const aApprovingAuthorities = aApprovers.map(oApprover => {
                            return {
                                AAUserID: oApprover.key,
                                AAFullName: oApprover.text
                            };
                        });
                        mobx.set(this.appState.aux, "approvingAuthorities", _.reject(aApprovingAuthorities, {"AAUserID": this.appState.invDoc.header.verifyOfcr}));

                        const oApprover = _.find(aApprovingAuthorities, {AAUserID: this.appState.invDoc.header.approveAuth});
                        if (!oApprover) {
                            mobx.set(this.appState.invDoc.header, "approveAuth", "");
                        }
                        const aVO = this.getActionField(oAction.responseData, "GT_FIO_VO_VRM");
                        console.log("GT_FIO_VO_VRM: ", aVO);
                        const aVerifyingOfficers = aVO.map(oVO => {
                            return {
                                VOUserID: oVO.key,
                                VOFullName: oVO.text
                            };
                        });
                        mobx.set(this.appState.aux, "verifyingOfficers", aVerifyingOfficers);
                        mobx.set(this.appState.aux, "verifyingOfficersAll", _.cloneDeep(aVerifyingOfficers));
                    }
                    this.getView().byId("selApprovingAuthorities").setBusy(false);
                    this.getView().byId("selVerifyingOfficer").setBusy(false);
                });
        },

        updateAorLine: function () {
            const oInvoiceDeep = this._prepareInvoiceBundle({
                "InvoiceDeep": _.cloneDeep(this._oLocalModel.getData()),
                "ViewData": _.cloneDeep(this._viewModel.getData()) || [],
                "CreditNotes": _.clone(this._oCreditNoteModel.getProperty("/CreditNotes")) || [],
                "PowoModel": this._oPowoModel,
                "AorState": this._aorState
            });

            oInvoiceDeep.ToParameter.push({
                "InvoiceID": oInvoiceDeep.InvoiceID,
                "Group": "FUNCTION",
                "Sequence": oInvoiceDeep.ToParameter.length,
                "Name": "FUNCTION",
                "Value": "ADDAORLINE"
            });

            this.invMaintainService.executeInvoiceFunction(oInvoiceDeep)
                .then(data => {
                    //Check for error messages
                    const sErrorMessage = this._getErrorMessage(data);
                    if (sErrorMessage) {
                        MessageBox.error(sErrorMessage, {
                            styleClass: this.contentDensityClass
                        });
                    } else {
                        //Parse response and extract list of approvers
                        const oResponse = _.get(data, "__batchResponses.0.__changeResponses.0", {});
                        const aProcessingLog = _.get(oResponse, "data.ToProcessingLog.results", []);
                        if (_.findIndex(aProcessingLog, {LogType: "EXECUTE_FUNCTION", MessageType: "S"}) > -1) {
                            const aAor = this._getField(aProcessingLog, "GT_TC_AOR");
                            this._aorState.setAor(aAor);
                            this.appState.setLinkAor(aAor);
                            console.log("GT_TC_AOR: ", aAor);
                            const aAorProj = this._getField(aProcessingLog, "GT_AOR_PROJ");
                            this._aorState.setAorProj(aAorProj);
                            mobx.set(this.appState.ecc, "GT_AOR_PROJ", aAorProj);
                            console.log("GT_AOR_PROJ: ", aAorProj);
                        }
                    }

                });
        },

        removeDuplicateMessages: function (oMessageManager) {
            const oMessageModel = oMessageManager.getMessageModel();
            const aUniqueMessages = _.uniqBy(oMessageModel.getData(), "message");
            oMessageManager.removeAllMessages();
            oMessageModel.setData(aUniqueMessages);
        },

        executePaiEvent: function (mParameters) {
            return new Promise((resolve, reject) => {
                const oInvoiceDeep = this._prepareInvoiceBundle({
                    "InvoiceDeep": _.cloneDeep(this._oLocalModel.getData()),
                    "ViewData": _.cloneDeep(this._viewModel.getData()) || [],
                    "CreditNotes": _.clone(this._oCreditNoteModel.getProperty("/CreditNotes")) || [],
                    "PowoModel": this._oPowoModel,
                    "AorState": this._aorState
                });

                oInvoiceDeep.ToParameter.push({
                    "InvoiceID": oInvoiceDeep.InvoiceID,
                    "Group": "FUNCTION",
                    "Sequence": oInvoiceDeep.ToParameter.length,
                    "Name": "FUNCTION",
                    "Value": "PAIEVENT"
                });

                _.forOwn(mParameters, (value, key) => {
                    oInvoiceDeep.ToParameter.push({
                        "InvoiceID": oInvoiceDeep.InvoiceID,
                        "Group": "FIELDS",
                        "Sequence": oInvoiceDeep.ToParameter.length,
                        "Name": key,
                        "Value": JSON.stringify(value)
                    });
                });

                // oInvoiceDeep.ToParameter.push({
                //     "InvoiceID": oInvoiceDeep.InvoiceID,
                //     "Group": "FIELDS",
                //     "Sequence": oInvoiceDeep.ToParameter.length,
                //     "Name": "GV_OK_CODE",
                //     "Value": JSON.stringify(_.get(mParameters, "okCode", ""))
                // });

                this.invMaintainService.executeInvoiceFunction(oInvoiceDeep)
                    .then(data => {
                        //Check for error messages
                        const sErrorMessage = this._getErrorMessage(data);
                        if (sErrorMessage) {
                            MessageBox.error(sErrorMessage, {
                                styleClass: this.contentDensityClass
                            });
                            reject(sErrorMessage);
                        } else {
                            //Extract processing log and return as promise value
                            const oResponse = _.get(data, "__batchResponses.0.__changeResponses.0", {});
                            const aProcessingLog = _.get(oResponse, "data.ToProcessingLog.results", []);
                            resolve(aProcessingLog);
                        }

                    })
                    .catch(error => {
                        console.error("PAI Event Exception: ", error);
                    })
                    .finally(() => {
                        this.removeDuplicateMessages(this.oMessageManager);
                    });
            });
        },

        _prepareInvoiceBundle: function (mParameters) {
            const oInvoiceDeep = mParameters.InvoiceDeep;
            const oViewData = mParameters.ViewData;
            const aCreditNotes = mParameters.CreditNotes;
            const oPowoModel = mParameters.PowoModel;
            const aorState = mParameters.AorState;
            const trainingInfoModel = mParameters.trainingInfoModel;

            let oInvoice = {};
            oInvoice = _.omit(oInvoiceDeep, ["__metadata", "ToInvoiceLine", "ToInvoiceLinkAOR",
                "ToInvoiceLinkNA", "ToInvoiceLinkPOWO", "ToCreditNote", "ToTrainingInformation",
                "NATotalAmountBeforeGst", "TotalBaseAmount", "TotalGST", "TotalNetAmount"
            ]);

            // Create an empty credit note object (values = undefined) based on Invoice header object
            // This will be used later to populate ToCreditNote navigation property
            // Odata requires that all fields must be in the entity to be created
            const oCreditNoteEmpty = _.mapValues(oInvoice.Invoice, () => undefined);

            // Sanitize ToInvoiceLinkNA navigation property (remove extra properties not in the Odata model)
            _.remove(oInvoiceDeep.ToInvoiceLinkNA, o => {
                return _.isEmpty(o.AccountAssignment);
            });

            oInvoice.ToInvoiceLinkNA = _.map(oInvoiceDeep.ToInvoiceLinkNA, (na) => {
                let tempNA = _.omit(na, ["EditPostDetailNA"]);
                tempNA.AmountBeforeGst = _.toString(tempNA.AmountBeforeGst);
                if (_.isEmpty(tempNA.AccountAssignment)) {
                    return {};
                }
                return tempNA;
            });
            _.remove(oInvoice.ToInvoiceLinkNA, _.isEmpty);

            // Build the ToRemark navigation property of Invoice
            const sRemarks = _.get(oViewData, "Remarks", "");
            if (sRemarks) {
                const aRemarksSplit = sRemarks.match(/.{1,132}/g);
                oInvoice.ToRemark = _.map(aRemarksSplit, function (value, index) {
                    return {
                        InvoiceID: oInvoice.InvoiceID,
                        LineNumber: index,
                        LineText: value
                    };
                });
            } else {
                oInvoice.ToRemark = [];
            }

            // Attach the credit notes table to ToCreditNote navigation property
            // const aCreditNotes = _.clone(this._oCreditNoteModel.getProperty("/CreditNotes")) || [];
            if (aCreditNotes.length > 0) {
                oInvoice.ToCreditNote = _.map(aCreditNotes, (oCreditNote) => {
                    return _.defaults({}, oCreditNote, oCreditNoteEmpty);
                });
            }

            // ToParameter navigation property
            // POWO section
            let aParameters = [];
            aParameters.push({
                "InvoiceID": oInvoice.InvoiceID,
                "Group": "FIELDS",
                "Sequence": aParameters.length,
                "Name": "GT_TC_POWO",
                "Value": JSON.stringify(oPowoModel.getProperty("/Powo") || {})
            });
            aParameters.push({
                "InvoiceID": oInvoice.InvoiceID,
                "Group": "FIELDS",
                "Sequence": aParameters.length,
                "Name": "GT_TC_GRSE",
                "Value": JSON.stringify(oPowoModel.getProperty("/Grse") || {})
            });

            // AOR section
            aParameters.push({
                "InvoiceID": oInvoice.InvoiceID,
                "Group": "FIELDS",
                "Sequence": aParameters.length,
                "Name": "GT_TC_AOR",
                "Value": JSON.stringify(aorState.Aor || {})
            });

            // Training Information
            if (trainingInfoModel) {
                const aTrainingInfoInternal = trainingInfoModel.getProperty("/TrainingInformationInternal");
                aParameters.push({
                    "InvoiceID": oInvoice.InvoiceID,
                    "Group": "FIELDS",
                    "Sequence": aParameters.length,
                    "Name": "GT_UTI_FINAL",
                    "Value": JSON.stringify(aTrainingInfoInternal)
                });
            }

            // Remarks as a parameter
            const remarksTab = oInvoice.ToRemark.map(function (value) {
                return {
                    tdformat: "*",
                    tdline: value.LineText
                }
            });
            aParameters.push({
                "InvoiceID": oInvoice.InvoiceID,
                "Group": "FIELDS",
                "Sequence": aParameters.length,
                "Name": "GT_FIO_REMARKS",
                "Value": JSON.stringify(remarksTab)
            });

            //ECC - fields based on appState
            const invDoc = this.appState.invDoc;
            //ECC - header
            aParameters.push({
                "InvoiceID": invDoc.header.invId,
                "Group": "FIELDS",
                "Sequence": aParameters.length,
                "Name": "ZPR_INVOICE",
                "Value": JSON.stringify(mobx.toJS(invDoc.header))
            });
            //ECC - signal update of POWO table control
            aParameters.push({
                "InvoiceID": invDoc.header.invId,
                "Group": "FIELDS",
                "Sequence": aParameters.length,
                "Name": "GV_FIO_WILL_UPDATE_POWO",
                "Value": JSON.stringify(invDoc.header.linkInvoice === "POWO")
            });
            //ECC - Link NA/Others
            aParameters.push({
                "InvoiceID": invDoc.header.invId,
                "Group": "FIELDS",
                "Sequence": aParameters.length,
                "Name": "GT_TC_NA",
                "Value": JSON.stringify(mobx.toJS(invDoc.linkNa))
            });
            //ECC - Credit Notes
            aParameters.push({
                "InvoiceID": invDoc.header.invId,
                "Group": "FIELDS",
                "Sequence": aParameters.length,
                "Name": "GT_TC_CREDIT_NOTE",
                "Value": JSON.stringify(mobx.toJS(invDoc.creditNotes))
            });
            oInvoice.ToParameter = aParameters;

            // Empty ToProcessingLog to act as container of messages
            oInvoice.ToProcessingLog = [];

            return oInvoice;
        },

        getUpdatedAttachmentList: function () {
            let oldAttachments = _.cloneDeep(this.appState.invDoc.attachments.toJS()).map(o => _.omit(o, "__metadata"));
            const oUploadCollection = this.getView().byId("UploadCollection");
            const aUploadItems = oUploadCollection.getItems();
            const aUploadIds = aUploadItems.map(item => {
                try {
                    return item.getDocumentId();
                } catch (e) {
                    return "";
                }
            });
            return _.filter(oldAttachments, att => {
                return _.findIndex(aUploadIds, id => id === att.Zattchid) > -1;
            });
        },

        _getErrorMessage: function (dataFromBatch) {
            const sStatus = _.get(dataFromBatch, "__batchResponses.0.response.statusCode", "");
            let sError = "";
            if (sStatus === "400") {
                const oResBody = JSON.parse(_.get(dataFromBatch, "__batchResponses.0.response.body", ""));
                sError = _.get(oResBody, "error.message.value", "");
            }
            return sError;
        },

        _getField: function (aProcessingLog, sFieldName) {
            const sFields = _.chain(aProcessingLog).find({LogType: "GT_FIO_FIELDS"}).get("Message", "[]").value();
            const aFields = JSON.parse(sFields);
            return _.chain(aFields).find({fname: sFieldName}).get("fvalue").value();
        },

        getActionField: function (sResponseData, sFieldName) {
            const aResponseData = JSON.parse(sResponseData);
            return JSON.parse(_.chain(aResponseData).find({name: sFieldName}).get("value", "[]").value());
        },

        onMoreInfoPress: function (oEvent) {
            // Create Popover locally
            this._oPopoverDetails = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.MoreInfoDialog", this);
            this.getView().addDependent(this._oPopoverDetails);
            // var oView = this.getView(),
            // 	oElementBinding = oView.getElementBinding();
            // var sPath = oElementBinding.getPath();
            // this._oPopoverDetails.bindElement(oEvent.getSource().getBindingContext().getPath());
            // this._oPopoverDetails.bindElement(sPath);
            this._oPopoverDetails.openBy(oEvent.getSource());

        },

        onPressSubmitNode: function (oEvent) {
            const sPath = oEvent.getSource().getBindingContext().getPath();
            const index = sPath.split("/").pop();
            this.appState.view.wfHistoryIndex = parseInt(index, 10);

            // Create Popover locally
            // If warning, dont show
            if (this._oPopoverSubmit !== undefined) {
                this._oPopoverSubmit.destroy();
            }
            const node = oEvent.getSource();
            if (node.getMetadata().getName() === "sap.m.Link"
                || node.getProperty("state") !== "Warning") {
                this._oPopoverSubmit = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.PopoverSubmit", this);
                this.getView().addDependent(this._oPopoverSubmit);
                this._oPopoverSubmit.openBy(oEvent.getSource());
            }
        },

        onMessagePopoverPress: function (oEvent) {
            this._getMessagePopover().openBy(oEvent.getSource());
        },

        _getMessagePopover: function () {
            // create popover lazily (singleton)
            if (!this._oMessagePopover) {
                // create popover lazily (singleton)
                this._oMessagePopover = sap.ui.xmlfragment(this.getView().getId(), "sg.gov.jtc.JTC-InvoiceApp.view.MessagePopover", this);
                this.getView().addDependent(this._oMessagePopover);
            }
            return this._oMessagePopover;
        },

        onObjectMatched: function (oEvent) {
            this.appState.view.processViewBusy = true;
            this.oMessageManager.removeAllMessages();
            //Footer buttons
            this._setDefaultFooterButtonStates();

            // // Set view to busy and initialize view model properties
            // //this.getView().setBusy(true);
            // this._viewModel.setProperty("/processViewBusy", true);
            // this._viewModel.setProperty("/editMode", false);
            // this._viewModel.setProperty("/editButton", false);
            // this._viewModel.setProperty("/displayMode", true);
            // this._viewModel.setProperty("/mode", "display");
            // this._viewModel.setProperty("/naTableMode", "None");
            // this._viewModel.setProperty("/cnTableMode", "None");
            // this._viewModel.setProperty("/cnSectionVisible", false);
            // this._viewModel.setProperty("/financeInfoVisible", false);

            const that = this;
            this._argPath = oEvent.getParameter("arguments").path;

            const sInvoicePath = "/" + this._argPath;
            // const sInvoiceLinePath = sInvoicePath + "/ToInvoiceLine";
            this._oInvModel = this.getView().getModel("inv");
            this._oInvModel.attachRequestFailed(() => {
                this.appState.view.processViewBusy = false;
            });

            // this._uiState.resetState();

            // function fnSuccess(data, response) {
            //     that.getView().getModel("inv").refresh(false);
            //     that._setActiveFooterButtons(data.Status);
            //
            //     // // Edit Button for Draft status
            //     // if (data.Status === "01") {
            //     //     that._viewModel.setProperty("/editButton", true);
            //     //     // Set company code to JTC1 if editable and no value set yet
            //     //     if (!data.CompanyCode) {
            //     //         data.CompanyCode = "JTC1";
            //     //     }
            //     // }
            //
            //     // //Show appropriate Invoice Link panel
            //     // const sLinkTo = data.LinkInvoiceTo || "POWO";
            //     // that._uiState.updateLinkTo(sLinkTo);
            //
            //     // todo: Cleanup
            //     // if (data.LinkInvoiceTo === "POWO") {
            //     //     that._showPOWOLink();
            //     // } else if (data.LinkInvoiceTo === "NA") {
            //     //     that._showNALink();
            //     // }
            //
            //     // //Bind the new record to the form fields
            //     // const localModel = that.getView().getModel("local");
            //     //
            //     // //Foreign currency
            //     // const exchangeRate = parseFloat(data.ExchangeRate) || 0;
            //     // if (exchangeRate !== 0) {
            //     //     const amount = parseFloat(data.AmountBeforeGst) || 0;
            //     //     data.SgdEquivalentRate = that.getSgdEquivalentString(exchangeRate, amount);
            //     // }
            //     // localModel.setProperty("/", data);
            //     // const oInvoiceGenerated = that.oInvoiceGenerated;
            //     // if (oInvoiceGenerated) {
            //     //     if (!data.PaymentMethod) {
            //     //         data.PaymentMethod = oInvoiceGenerated.payMethod;
            //     //     }
            //     // }
            //     // localModel.setProperty("/ToInvoiceLine", data.ToInvoiceLine.results);
            //     // localModel.setProperty("/ToInvoiceLinkAOR", data.ToInvoiceLinkAOR.results);
            //     //
            //     // const aToInvoiceLinkNA = _.cloneDeep(data.ToInvoiceLinkNA.results);
            //     // const aEditPostDetail = _.clone(that._oHelpModel.getProperty("/EditPostDetailNA"));
            //     // const aToInvoiceLinkNAModified = _.map(aToInvoiceLinkNA, (item) => {
            //     //     delete item.__metadata;
            //     //     item.EditPostDetailNA = _.find(aEditPostDetail, {AccountAssignment: item.AccountAssignment});
            //     //     return item;
            //     // });
            //     //
            //     // localModel.setProperty("/ToInvoiceLinkNA", aToInvoiceLinkNAModified);
            //     // that._uiState.na.updateAmounts(_.map(aToInvoiceLinkNAModified, "AmountBeforeGst"));
            //     // that._uiState.updateCurrency(data.Currency);
            //     // // todo Clean up
            //     // // var sumNATotalAmountBeforeGst = _.sumBy(aToInvoiceLinkNAModified, function (na) {
            //     // //     return parseFloat(na.AmountBeforeGst);
            //     // // });
            //     // // localModel.setProperty("/NATotalAmountBeforeGst", sumNATotalAmountBeforeGst);
            //     //
            //     // const aPowoData = _.filter(data.ToInvoiceLinkPOWO.results, ["DeletionIndicator", ""]);
            //     // localModel.setProperty("/ToInvoiceLinkPOWO", aPowoData);
            //     // that.getView().bindElement({
            //     //     path: "/",
            //     //     model: "local"
            //     // });
            //     //
            //     // //Credit Notes
            //     // const aCreditNotes = _.get(data, "ToCreditNote.results", []);
            //     // const aCreditNotesCopy = aCreditNotes.map(oCreditNote => _.omit(oCreditNote, "__metadata"));
            //     // that._oCreditNoteModel.setProperty("/CreditNotes", aCreditNotesCopy);
            //     // // ["AmountBeforeGst", "GstAmount", "AmountAfterGst"].forEach(sPath => {
            //     // //     const sum = _.sumBy(aCreditNotesCopy, cn => parseFloat(cn[sPath]));
            //     // //     that._oCreditNoteModel.setProperty(`/Total${sPath}`, sum);
            //     // // });
            //     //
            //     // that._viewModel.setProperty("/cnSectionVisible", aCreditNotesCopy.length > 0);
            //     // const invoiceType = that._oLocalModel.getProperty("/InvoiceType");
            //     // if (invoiceType !== "CN" && aCreditNotesCopy.length < 1) {
            //     //     that._viewModel.setProperty("/cnButtonVisible", true);
            //     // } else {
            //     //     that._viewModel.setProperty("/cnButtonVisible", false);
            //     // }
            //     //
            //     // //Training Information
            //     // const aTrainingInfo = _.chain(data)
            //     //     .get("ToTrainingInformation.results", [])
            //     //     .map(oTrainingInfo => _.omit(oTrainingInfo, "__metadata"))
            //     //     .value();
            //     // that._oTrainingInformationModel.setProperty("/TrainingInformation", aTrainingInfo);
            //     //
            //     // //Summation
            //     // let sumAmount = data.ToInvoiceLine.map(obj => parseFloat(obj.AmountBeforeGst)).reduce((sum, amt) => sum +
            //     //     amt, 0);
            //     // sumAmount = sumAmount ? sumAmount : 0;
            //     // localModel.setProperty("/TotalBaseAmount", sumAmount);
            //     //
            //     // sumAmount = data.ToInvoiceLine.map(obj => parseFloat(obj.GstAmount)).reduce((sum, amt) => sum + amt, 0);
            //     // sumAmount = sumAmount ? sumAmount : 0;
            //     // localModel.setProperty("/TotalGST", sumAmount);
            //     //
            //     // sumAmount = data.ToInvoiceLine.map(obj => parseFloat(obj.AmountAfterGst)).reduce((sum, amt) => sum +
            //     //     amt, 0);
            //     // sumAmount = sumAmount ? sumAmount : 0;
            //     // localModel.setProperty("/TotalNetAmount", sumAmount);
            //     // that.computeNetPayment(aCreditNotesCopy);
            //     //
            //     // const bCanSave = that.getView().byId("btnSave").getVisible();
            //     // if (data.Status === "01" && bCanSave) {
            //     //     //Edit mode immediately if status is Draft and Save button is enabled/visible
            //     //     //User can display draft invoices but not save them if user doesn't have authorization to the
            //     //     // purchasing group of the invoice.
            //     //     that.handleEditInvoice();
            //     // }
            //     //
            //     // //Show appropriate Invoice Link panel
            //     // const sLinkTo = data.LinkInvoiceTo || "POWO";
            //     // that._uiState.updateLinkTo(sLinkTo);
            //     //
            //     // //Payment Methods value help
            //     // that.retrievePaymentMethods();
            //     //
            //     // //Special GL Indicators value help
            //     // that.retrieveSpecialGlIndicators();
            //     //
            //     // //Permitted payee value help
            //     // that.retrievePermittedPayee();
            //     // that._uiState.updatePermittedPayee(data.PermitPayee);
            //     //
            //     // //Sets view to not busy
            //     // //that.getView().setBusy(false);
            //     // that._viewModel.setProperty("/processViewBusy", false);
            //     //
            //     // const sInvoiceID = that._oLocalModel.getProperty("/InvoiceID");
            //     // const sPurchasingGroup = that._oLocalModel.getProperty("/PurchasingGroup");
            //     // const sStatusText = that.formatter.statusText.call(that, that._oLocalModel.getProperty("/Status"));
            //
            //     //TODO: Clean up (Retrieval of work flow history log)
            //     //Retrieve workflow history log
            //     // that._viewModel.setProperty("/wfHistoryBusy", true);
            //     // that._invApprovalService.retrieveWorkFlowHistoryLog(sInvoiceID)
            //     //     .then(oWorkFlowHistoryLog => {
            //     //         const oLog = _.cloneDeep(oWorkFlowHistoryLog);
            //     //         if (oLog.length < 1) {
            //     //             that._oWorkFlowLog.setProperty("/WorkFlow_LogSet", [{
            //     //                 "CssWf": "",
            //     //                 "ObjNo": "",
            //     //                 "ObjType": "",
            //     //                 "State": "Warning",
            //     //                 "Wiid": "          1",
            //     //                 "Action": sStatusText,
            //     //                 "Icon": "sap-icon://lateness",
            //     //                 "Agentid": "",
            //     //                 "AgentName": "",
            //     //                 "AgentDesc": "",
            //     //                 "Remark": "",
            //     //                 "AgentDept": ""
            //     //             }]);
            //     //         } else {
            //     //             that._oWorkFlowLog.setProperty("/WorkFlow_LogSet", oLog);
            //     //             that._scrollWfHistory();
            //     //         }
            //     //         that._viewModel.setProperty("/wfHistoryBusy", false);
            //     //     });
            //
            //     //TODO: Clean up retrieval of attachments. Will now use own odata service for this
            //     //Retrieve attachments
            //     // that.getView().byId("idBtnAttachment").setBusy(true);
            //     // that.getView().byId("idAttachmentBox").setBusy(true);
            //     // that.invMaintainService.retrieveAttachmentSet(sInvoiceID)
            //     //     .then(oAttachments => {
            //     //         const oAttachmentSet = _.cloneDeep(oAttachments);
            //     //         that._oAttachmentModel.setProperty("/AttachmentSet", oAttachmentSet);
            //     //         if (oAttachmentSet.length > 0) {
            //     //             that._oAttachmentModel.setProperty("/Total", `(${oAttachmentSet.length})`);
            //     //         } else {
            //     //             that._oAttachmentModel.setProperty("/Total", "");
            //     //         }
            //     //
            //     //     }).finally(() => {
            //     //     that.getView().byId("idBtnAttachment").setBusy(false);
            //     //     that.getView().byId("idAttachmentBox").setBusy(false);
            //     // });
            //
            //     // //Retrieve verifying officers
            //     // that.getView().byId("selVerifyingOfficer").setBusy(true);
            //     // that.invCommonService.retrieveVerifyingOfficers(sInvoiceID, sPurchasingGroup)
            //     //     .then(oDataVO => {
            //     //         // Set VO list in Helper model
            //     //         let copy = oDataVO.map(e => {
            //     //             return {
            //     //                 VOUserID: e.UserID,
            //     //                 VOFullName: e.FullName
            //     //             };
            //     //         });
            //     //         that._oHelpModel.setProperty("/VerifyingOfficers", copy);
            //     //         that._oHelpModel.setProperty("/VerifyingOfficersAll", _.clone(copy));
            //     //     }).finally(() => {
            //     //     that.getView().byId("selVerifyingOfficer").setBusy(false);
            //     // });
            //     //
            //     // //Retrieve approving authorities
            //     // that.getView().byId("selApprovingAuthorities").setBusy(true);
            //     // that.invCommonService.retrieveApprovingAuthorities(sInvoiceID, sPurchasingGroup)
            //     //     .then(oDataAA => {
            //     //         // Set AA list in Helper Model
            //     //         let copy = oDataAA.map(e => {
            //     //             return {
            //     //                 AAUserID: e.UserID,
            //     //                 AAFullName: e.FullName
            //     //             };
            //     //         });
            //     //         that._oHelpModel.setProperty("/ApprovingAuthorities", copy);
            //     //         that._oHelpModel.setProperty("/ApprovingAuthoritiesAll", _.clone(copy));
            //     //     }).finally(() => {
            //     //     that.getView().byId("selApprovingAuthorities").setBusy(false);
            //     // });
            //     //
            //     // //Retrieve asset numbers
            //     // const sCompanyCode = that._oLocalModel.getProperty("/CompanyCode");
            //     // that.invCommonService.retrieveAssets(sCompanyCode)
            //     //     .then(aAssets => {
            //     //         // Set Asset list in Helper Model
            //     //         let copy = _.cloneDeep(aAssets);
            //     //         delete copy.__metadata;
            //     //         that._oHelpModel.setProperty("/Assets", copy);
            //     //     });
            //     //
            //     // //Retrieve remarks
            //     // that._viewModel.setProperty("/Remarks", "");
            //     // that.invMaintainService.retrieveRemark(sInvoiceID)
            //     //     .then(remark => {
            //     //         const remarkString = remark.map(e => e.LineText)
            //     //             .reduce((s, e) => s + e, "");
            //     //         that._viewModel.setProperty("/Remarks", remarkString);
            //     //         that.appState.invDoc.remarks = remarkString;
            //     //     })
            //     //     .catch(() => that._viewModel.setProperty("/Remarks", ""));
            // }

            const aInvoice = /\d{10}/.exec(sInvoicePath);
            if (aInvoice.length < 1) {
                return;
            }

            this.appState.initializeDocument();
            const sInvoiceID = aInvoice[0];
            this.appState.loadInvoice({GV_INVOICE_NUM: sInvoiceID})
                .then(oAction => {
                    if (oAction.responseCode === "ERROR") {
                        MessageBox.error(oAction.responseMessage, {
                            onClose: () => {
                                this.handleExit();
                            },
                            styleClass: this.contentDensityClass
                        });
                        return null;
                    }
                    this.appState.view.processViewBusy = true;
                    this._setActiveFooterButtons(this.appState.invDoc.header.status);
                    this.appState.view.processViewBusy = false;
                });

            // this.invMaintainService.loadInvoice(sInvoiceID, "")
            //     .then(aProcessingLog => {
            //         this.appState.view.processViewBusy = true;
            //         console.log("Load Invoice", aProcessingLog);
            //         const oError = _.find(aProcessingLog, {MessageType: "E"});
            //         if (oError) {
            //             MessageBox.error(oError.Message, {
            //                 onClose: () => {
            //                     this.handleExit();
            //                 },
            //                 styleClass: this.contentDensityClass
            //             });
            //
            //         } else {
            //             // User roles
            //             const aRoles = this._getField(aProcessingLog, "GR_ROLES") || [];
            //             mobx.set(this.appState.ecc, "GR_ROLES", aRoles);
            //             console.log("User Roles:", aRoles);
            //
            //             //Check button subscreen being used
            //             const sButtonSubscreen = this._getField(aProcessingLog, "GV_BUTTON_SUBSCR") || "";
            //             const aScreenTable = this._getField(aProcessingLog, "GT_FIO_SCREENS") || [];
            //             switch (sButtonSubscreen) {
            //                 case "9080":
            //                     //Requestor
            //                     const oButtons = _.find(aProcessingLog, (item) => {
            //                         return item.Message.match(/ButtonGroup=/);
            //                     });
            //                     const sButtonString = _.get(oButtons, "Message", "ButtonGroup=EXT");
            //                     let sButtonGroup = sButtonString.split("=").pop();
            //                     if (!sButtonGroup) {
            //                         sButtonGroup = "EXT";
            //                     }
            //                     mobx.set(this.appState.view, "buttonGroup", {Group: sButtonGroup, Type: "Requestor"});
            //                     break;
            //                 default:
            //                     //Non-Requestor (e.g. FVO)
            //                     const sFvoButtonGroup = _.chain(aScreenTable).find({name: sButtonSubscreen}).get("screenTab.0.group1", "EXT").value();
            //                     mobx.set(this.appState.view, "buttonGroup", {Group: sFvoButtonGroup, Type: sButtonSubscreen});
            //                     break;
            //             }
            //             this._setActiveFooterButtons(this.appState.invDoc.header.status);
            //
            //             // Invoice Header
            //             this.appState.setHeader(this._getField(aProcessingLog, "ZPR_INVOICE") || {});
            //             // Invoice Lines
            //             this.appState.setInvLines(this._getField(aProcessingLog, "GT_INV_LINE") || []);
            //
            //             // Customer accounting
            //             const sCustomerAccountingTaxCode = this._getField(aProcessingLog, "GV_CA_TXCD") || "";
            //             console.log("Customer Accounting tax code:", sCustomerAccountingTaxCode);
            //             mobx.set(this.appState.aux, "customerAccountingTaxCode", sCustomerAccountingTaxCode);
            //
            //             const sFields = _.chain(aProcessingLog).find({LogType: "GT_FIO_FIELDS"}).get("Message", "[]").value();
            //             const aFields = JSON.parse(sFields);
            //             console.log("Load Invoice Fields: ", aFields);
            //
            //             // Credit Notes
            //             this.appState.setCreditNotes(this._getField(aProcessingLog, "GT_FIO_CREDITNOTES") || []);
            //
            //             // Link to PO information
            //             const aPowo = this._getField(aProcessingLog, "GT_TC_POWO") || [];
            //             this.appState.setLinkPo(aPowo);
            //
            //             const aGrse = this._getField(aProcessingLog, "GT_TC_GRSE") || [];
            //             this.appState.setLinkGr(aGrse);
            //
            //             const aPowoLink = this._getField(aProcessingLog, "GT_TC_POWOLINK") || [];
            //             this.appState.invDoc.linkPo.summary.replace(aPowoLink);
            //
            //             const aAssignee = this._getField(aProcessingLog, "GT_ASSIGNEE_1") || [];
            //             this.appState.invDoc.assignees.replace(aAssignee);
            //
            //             const aJudgement = this._getField(aProcessingLog, "GT_JUDGEMENT_1") || [];
            //             this.appState.invDoc.judgements.replace(aJudgement);
            //
            //             //Parse and display system messages: GT_SYSTEM_MSG
            //             const aSystemMessages = this._getField(aProcessingLog, "GT_SYSTEM_MSG") || [];
            //             this.appState.setSystemMessages(aSystemMessages);
            //
            //             // Link to AOR information
            //             const aAor = this._getField(aProcessingLog, "GT_TC_AOR") || [];
            //             this.appState.setLinkAor(aAor);
            //             const aAorProj = this._getField(aProcessingLog, "GT_AOR_PROJ") || [];
            //             this.appState.setEcc("GT_AOR_PROJ", aAorProj);
            //
            //             // Link to NA/Others information
            //             const aOthers = this._getField(aProcessingLog, "GT_TC_NA") || [];
            //             this.appState.setLinkOthers(aOthers);
            //
            //             // Training information
            //             const aTrainingInfoInternal = this._getField(aProcessingLog, "GT_UTI_FINAL") || [];
            //             mobx.set(this.appState.invDoc, "trainingInfo", aTrainingInfoInternal);
            //
            //             // Finance Information
            //             ["GV_PAY_DOCNUM", "GV_FMAS_POSTDT", "GV_PAY_CLEARDT", "GV_PERMIT_PAYEE_NM"].forEach(sPath => {
            //                 const sValue = this._getField(aProcessingLog, sPath) || "";
            //                 this.appState.setEcc(sPath, sValue);
            //             });
            //
            //             // Multiple Payees
            //             const aPayees = this._getField(aProcessingLog, "GT_TC_MULTIPAYEE") || [];
            //             this.appState.invDoc.multiplePayees.replace(aPayees);
            //
            //             // Remarks
            //             const aRemarks = this._getField(aProcessingLog, "GT_TABLE_LINE2") || [];
            //             const sRemarks = aRemarks.reduce((remarks, remLine) => remarks + remLine.line, "") || "";
            //             this.appState.invDoc.remarks = sRemarks;
            //         }
            //         this.appState.view.processViewBusy = false;
            //     });
        },

        handleChangeVerifyingOfficer: function (oEvent) {
            const sVerifyingOfficer = oEvent.getSource().getSelectedKey();
            const sApprovingAuthority = this._oLocalModel.getProperty("/ApprovingAuthority");
            if (sVerifyingOfficer === sApprovingAuthority) {
                this._oLocalModel.setProperty("/ApprovingAuthority", "");
            }

            const oApprovingAuthoritiesAll = this._oHelpModel.getProperty("/ApprovingAuthoritiesAll");
            const oNewApprovingAuthorities = _.filter(oApprovingAuthoritiesAll, _.negate(_.matchesProperty("AAUserID",
                sVerifyingOfficer)));
            this._oHelpModel.setProperty("/ApprovingAuthorities", oNewApprovingAuthorities);
        },

        handleChangeApprovingAuthority: function (oEvent) {
            const sApprovingAuthority = oEvent.getSource().getSelectedKey();
            const oVerifyingOfficersAll = this._oHelpModel.getProperty("/VerifyingOfficersAll");
            const oNewVerifyingOfficers = _.filter(oVerifyingOfficersAll, _.negate(_.matchesProperty("VOUserID",
                sApprovingAuthority)));
            this._oHelpModel.setProperty("/VerifyingOfficers", oNewVerifyingOfficers);
        },

        handleChangeExchangeRate: function (exchangeRate) {
            const amount = parseFloat(this._oLocalModel.getProperty("/AmountBeforeGst")) || 0;
            const sgdEquivalent = this.getSgdEquivalentString(exchangeRate, amount);
            this._oLocalModel.setProperty("/ExchangeRate", exchangeRate);
            this._oLocalModel.setProperty("/SgdEquivalentRate", sgdEquivalent);
        },

        getSgdEquivalentString: function (sExchangeRate, sAmount) {
            const newExchangeRate = parseFloat(sExchangeRate) || 0;
            const amount = parseFloat(sAmount) || 0;
            return (amount * newExchangeRate).toString(10);
        },

        handleUpdateInvoiceField: function (sPath, sValue) {
            try {
                this._oLocalModel.setProperty("/" + sPath, sValue);
                if (sPath === "GstAmountSgd" || sPath === "ActualAmountAfterGst") {
                    this.computeActualAmountBeforeGst();
                }
            } catch (e) {
                console.error(e);
            }
        },

        computeActualAmountBeforeGst: function () {
            const gstAmountSgd = parseFloat(this._oLocalModel.getProperty("/GstAmountSgd")) || 0;
            const actualAmountAfterGst = parseFloat(this._oLocalModel.getProperty("/ActualAmountAfterGst")) || 0;
            const actualAmountBeforeGst = actualAmountAfterGst - gstAmountSgd;
            this._oLocalModel.setProperty("/ActualAmountBeforeGst", actualAmountBeforeGst.toString(10));
        },

        handleAddCreditNote: function (oEvent) {
            const invDoc = this.appState.invDoc;
            const sStatus = invDoc.header.status || "";
            if (sStatus !== "01") {
                MessageBox.error("Invoice and Credit Note must be in draft status.", {
                    styleClass: this.contentDensityClass
                });
                return;
            }

            const sVendorID = invDoc.header.vendorId || "";
            const sPurchasingGroup = invDoc.header.purchGrp || "";
            if (!this._creditNoteVH) {
                this._creditNoteVH = new CreditNoteVH(this.getView());
            }
            this._creditNoteVH.open(sVendorID, sPurchasingGroup)
                .then(oCreditNote => {
                    console.log("Selected Credit Note", oCreditNote);
                    this.getView().byId("idCreditNotesTable").setBusy(true);
                    this.validateAddCreditNote(oCreditNote.InvoiceReference)
                        .then((oAction) => {
                            this.extractAndDisplayActionResponse(oAction);
                            if (oAction.responseCode === "OK") {
                                // Add the selected credit note to the credit notes table
                                const creditNotes = _.cloneDeep(invDoc.creditNotes.toJS());
                                creditNotes.push({
                                    creditNoteId: oCreditNote.InvoiceID,
                                    creditNoteNo: oCreditNote.InvoiceReference,
                                    cnDate: oCreditNote.InvoiceReferenceDate,
                                    preGstAmt: oCreditNote.AmountBeforeGst,
                                    gstAmt: oCreditNote.GstAmount,
                                    postGstAmt: oCreditNote.AmountAfterGst,
                                    sgdEquiv: 0,
                                    selcl: "",
                                    description: oCreditNote.Description
                                });
                                this.appState.setCreditNotes(creditNotes);
                            }
                        })
                        .catch(this.popupSystemError.bind(this))
                        .finally(() => {
                            this.getView().byId("idCreditNotesTable").setBusy(false);
                            this.removeDuplicateMessages(this.oMessageManager);
                        });
                });
        },

        validateAddCreditNote: function (creditNoteId) {
            return this.doActionAppState({
                action: "VALIDATE_ADD_CN",
                subAction: "VALIDATE_ADD_CN",
                actionParameters: {
                    GV_CREDIT_NOTE_NO: creditNoteId
                }
            });
        },

        handleRemoveCreditNote: function (oEvent) {
            // const sPath = oEvent.getParameters().listItem.getBindingContext("cn").getPath();
            // const oToRemove = this._oCreditNoteModel.getProperty(sPath);
            // const aCreditNotes = _.clone(this._oCreditNoteModel.getProperty("/CreditNotes"));
            // const aNewCreditNoteLines = _.reject(aCreditNotes, oToRemove);
            // this._oCreditNoteModel.setProperty("/CreditNotes", aNewCreditNoteLines);
            // this.computeNetPayment(aNewCreditNoteLines);

            try {
                const indexToDelete = parseInt(oEvent.getParameter("listItem").getBindingContextPath().split("/").pop(), 10);
                _.remove(this.appState.invDoc.creditNotes, (v, i) => i === indexToDelete);
            } catch (e) {
                console.error("Unable to remove credit note from table");
            }

        },

        computeNetPayment: function (aCreditNotes) {
            const aInvoiceItemTotals = ["/TotalBaseAmount", "/TotalGST", "/TotalNetAmount"];
            ["AmountBeforeGst", "GstAmount", "AmountAfterGst"].forEach((sPath, index) => {
                const sum = _.sumBy(aCreditNotes, cn => parseFloat(cn[sPath]));
                this._oCreditNoteModel.setProperty(`/Total${sPath}`, sum);
                const amount = this._oLocalModel.getProperty(aInvoiceItemTotals[index]) || 0;
                this._oCreditNoteModel.setProperty(`/Net${sPath}`, amount + sum);
            });
        },

        handleSelectLinkToRadioButton: function (bSelected, sLinkTo) {
            if (!bSelected) {
                this.previousLinkTo = sLinkTo;
                return;
            }

            let prevProcurementDetailsCount = 0;
            switch(this.previousLinkTo) {
                case "POWO":
                    prevProcurementDetailsCount = this.appState.invDoc.linkPo.po.length;
                    break;
                case "AOR":
                    prevProcurementDetailsCount = this.appState.invDoc.linkAor.filter(aor => aor.banfn !== "").length;
                    break;
                case "NA":
                    prevProcurementDetailsCount = this.appState.invDoc.linkNa.filter(na => na.accntAssign !== "").length;
                    break;
                default:
                    //Do nothing
                    break;
            }

            const dialog = new sap.m.Dialog({
                title: "Change Procurement Details",
                type: "Message",
                content: new sap.m.Text({text: `Changing link from ${this.previousLinkTo} to ${sLinkTo === "NA" ? "Others" : sLinkTo} will delete the current procurement/posting information. Do you want to continue?`}),
                beginButton: new sap.m.Button({
                    text: "Continue",
                    press: function () {
                        this.appState.invDoc.header.linkInvoice = sLinkTo;
                        // this._uiState.updateLinkTo(sLinkTo);
                        dialog.close();
                    }.bind(this)
                }),
                endButton: new sap.m.Button({
                    text: "Cancel",
                    press: function () {
                        //Revert to previously selected radio button
                        const rbgLinkTo = this.getView().byId("rbg-linkto");
                        if (rbgLinkTo) {
                            rbgLinkTo.setSelectedIndex(this.appState.view.linkEntry.index);
                        }
                        dialog.close();
                    }.bind(this)
                }),
                afterClose: function () {
                    dialog.destroy();
                }
            }).addStyleClass(this.contentDensityClass);

            if (prevProcurementDetailsCount > 0) {
                dialog.open();
            } else {
                this.appState.invDoc.header.linkInvoice = sLinkTo;
            }
        },

        handleAddPostingDetailNA: function (oEvent) {
            this.appState.addBlankOthers();
        },

        handleDeleteNALine: function (oEvent) {
            const sPath = oEvent.getParameters().listItem.getBindingContext().getPath();
            const iIndex = parseInt(sPath.split("/").pop(), 10);
            this.appState.removeOthers(iIndex);
        },

        handleAccountAssignmentChange: function (oEvent) {
            // TODO: clean up
            // this.updateApproversList();
        },

        handleChangeNAAmountBeforeGst: function (oEvent) {
            // const oNA = this._oLocalModel.getProperty("/ToInvoiceLinkNA");
            // this._uiState.na.updateAmounts(_.map(oNA, "AmountBeforeGst"));
            // this.updateApproversList();
            //todo Clean up
            //if (oNA) {
            //    const sum = _.chain(oNA).map("AmountBeforeGst").map(_.toNumber).sum().value();
            //    this._oLocalModel.setProperty("/NATotalAmountBeforeGst", sum);
            //}

            // _.chain(arr).map("AmountBeforeGst").map(_.toNumber).sum().value();
        },

        handleTaxCodeChange: function (oEvent) {
            // TODO: clean up
            // const oSource = oEvent.getSource();
            // // "/ToInvoiceLinkNA/0"
            // const tcm = this._oHelpModel.getProperty("/TaxCodeMap");
            // const taxcode = _.find(tcm, {
            //     Sequence: oSource.getSelectedKey()
            // });
            //
            // const sPath = oSource.getBindingContext("local").getPath();
            // this._oLocalModel.setProperty(sPath + "/TaxCode", taxcode.TaxCode);
            // this._oLocalModel.setProperty(sPath + "/TaxCodeDescription", taxcode.Sequence);
        },

        handleTemplateNA: function (oEvent) {
            sap.ui.jsfragment("templateFragment", {
                createContent: function (oController) {
                    const aColumns = [
                        {
                            label: "Asset No.",
                            property: "assetNo",
                            type: "number",
                            scale: "0"
                        }, {
                            label: "Sub Asset No.",
                            property: "subAssetNo",
                            type: "number",
                            scale: "0"
                        }, {
                            label: "GL",
                            property: "glAccount",
                            type: "number",
                            scale: "0"
                        }, {
                            label: "Cost Center",
                            property: "costCenter"
                        }, {
                            label: "Business Entity",
                            property: "estate"
                        }, {
                            label: "Building",
                            property: "building"
                        }, {
                            label: "Property",
                            property: "land"
                        }, {
                            label: "Rental Object",
                            property: "reobjectentity"
                        }, {
                            label: "Amount (Before GST)",
                            property: "preGstAmtFormatted"
                        }, {
                            label: "Tax Code",
                            property: "taxDescrEnglish"
                        }];

                    const oColMapping = {
                        A: "assetNo",
                        B: "subAssetNo",
                        C: "glAccount",
                        D: "costCenter",
                        E: "estate",
                        F: "building",
                        G: "land",
                        H: "reobjectentity",
                        I: "preGstAmt",
                        J: "taxDescr"
                    };

                    return new sap.m.Popover({
                        showHeader: false,
                        placement: "Bottom",
                        content: new sap.m.VBox({
                            items: [
                                new FileUploader(this.createId("idUploaderNA"), {
                                    uploadUrl: "",
                                    buttonText: "Upload Posting Details",
                                    fileType: "xlsx",
                                    maximumFileSize: 1,
                                    buttonOnly: true,
                                    style: "Transparent",
                                    multiple: false,
                                    icon: "sap-icon://upload",
                                    change: function (e) {
                                        var file = e.getParameter("files") && e.getParameter("files")[0];
                                        if (file && window.FileReader) {
                                            var reader = new FileReader();
                                            reader.onload = function (event) {
                                                try {
                                                    var data = new Uint8Array(event.target.result);
                                                    var workbook = XLSX.read(data, {type: 'array'});
                                                    const oExcelData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: "A"});
                                                    console.log("Excel Upload:", oExcelData);

                                                    let countNA = this.appState.invDoc.linkNa.length;

                                                    //Use fuzzy logic to convert tax code description to tax code sequence
                                                    //and get the equivalent SAP 2-character tax code
                                                    const aTaxCode = mobx.toJS(this.appState.aux.taxCode.taxCodes, {detectCycles: false});
                                                    const fuseTaxCode = new Fuse(aTaxCode, {
                                                        shouldSort: true,
                                                        tokenize: true,
                                                        matchAllTokens: true,
                                                        threshold: 0.6,
                                                        location: 0,
                                                        distance: 100,
                                                        maxPatternLength: 32,
                                                        minMatchCharLength: 1,
                                                        keys: [
                                                            "TaxCodeDescription"
                                                        ]
                                                    });

                                                    //For each row (except the header) in the excel sheet, create an NA entry
                                                    const oExcelDataCopy = _.drop(oExcelData); //drop the header row
                                                    const oInvoiceLinkNAToAdd = _.map(oExcelDataCopy, (item) => {
                                                        const step1 = _.mapKeys(item, (value, key) => _.get(oColMapping, key, key));
                                                        const step2 = _.mapValues(step1, (value) => _.toString(value));
                                                        let step3 = _.defaults({}, step2, this.appState.blankOtherEntry);
                                                        if (step3.assetNo !== "") {
                                                            step3.accntAssign = "ASSET";
                                                            step3.glAccount = "";
                                                            step3.costCenter = "";
                                                            step3.estate = "";
                                                            step3.building = "";
                                                            step3.land = "";
                                                            step3.reobjectentity = "";
                                                        } else if (step3.glAccount !== "") {
                                                            step3.assetNo = "";
                                                            step3.subAssetNo = "";
                                                            if (step3.costCenter !== "") {
                                                                step3.accntAssign = "GLCC";
                                                                step3.estate = "";
                                                                step3.building = "";
                                                                step3.land = "";
                                                                step3.reobjectentity = "";
                                                            } else {
                                                                step3.accntAssign = "GLRE";
                                                                step3.costCenter = "";
                                                            }
                                                        }
                                                        step3.lineNumber = _.toString(++countNA);
                                                        step3.itemno = countNA * 10;
                                                        if (typeof step3.preGstAmt === "string") {
                                                            step3.preGstAmt = parseFloat(step3.preGstAmt.replace(/,/g, ''));
                                                        }

                                                        //fuzzy search, see above definition of fuseTaxCode()
                                                        const searchResultTax = fuseTaxCode.search(step3.taxDescr);
                                                        if (searchResultTax) {
                                                            step3.taxDescr = _.get(searchResultTax, "0.Sequence", step3.taxDescr);
                                                            step3.taxCode = _.get(searchResultTax, "0.TaxCode", step3.taxCode);
                                                        }
                                                        return step3;
                                                    });

                                                    const copyNA = _.cloneDeep(mobx.toJS(this.appState.invDoc.linkNa));
                                                    const newNA = copyNA.concat(oInvoiceLinkNAToAdd);
                                                    this.appState.setLinkOthers(newNA);

                                                    console.log("Invoice Link NA uploaded:", oInvoiceLinkNAToAdd);
                                                    //Clear the content of the FileUploader
                                                    this._popoverTemplate.getContent()[0].getItems()[0].clear();
                                                } catch (error) {
                                                    MessageBox.error("Failed to read excel file.", {
                                                        styleClass: this.contentDensityClass
                                                    });
                                                }
                                            }.bind(oController);
                                            reader.readAsArrayBuffer(file);
                                        }
                                        oController._popoverTemplate.close();
                                    },
                                    typeMissmatch: function (oEvent) {
                                        MessageBox.error(`${oEvent.getParameter("fileName")} doesn't seem to be an Excel file.`, {
                                            styleClass: this.contentDensityClass
                                        });
                                    }
                                }),
                                new sap.m.Button(this.createId("btnDownloadTemplate"), {
                                    text: "Download Template",
                                    icon: "sap-icon://download",
                                    type: "Transparent",
                                    width: "180px",
                                    press: function (oEvent) {
                                        const naLines = this.appState.invDoc.linkNa
                                            .filter(oNa => !_.isEmpty(oNa.accntAssign))
                                            .map(oNA => _.pick(oNA, aColumns.map(c => c.property)));
                                        new SpreadSheet({
                                            workbook: {
                                                columns: aColumns,
                                                context: {
                                                    sheetName: "Template_Others"
                                                }
                                            },
                                            dataSource: naLines,
                                            fileName: "Template_Others.xlsx"
                                        }).build();
                                    }.bind(oController)
                                }).addStyleClass("jtcInvActionSheetButton")
                            ]
                        }).addStyleClass("sapUiContentPadding")
                    });
                }
            });

            if (!this._popoverTemplate) {
                this._popoverTemplate = sap.ui.jsfragment("templateFragment", this);
                this.getView().addDependent(this._popoverTemplate);
            }
            this._popoverTemplate.openBy(oEvent.getSource());
        },

        //
        // Value Help
        //

        handleValueHelpAor: function (oEvent) {
            const sourceObject = oEvent.getSource().getBindingContext().getObject();
            if (!sourceObject) {
                console.error("Source object for AOR value help cannot be determined.");
                return;
            }
            sap.ui.require(["sg/gov/jtc/JTC-InvoiceApp/controller/ValueHelpAOR"], function (ValueHelpAOR) {
                if (!this.valueHelpAOR) {
                    this.valueHelpAOR = new ValueHelpAOR();
                }
                this.valueHelpAOR.open(this.getView(), this.appState.invDoc.header.invId)
                    .then(sAorNo => {
                        if (sourceObject) {
                            sourceObject.banfnRx = sAorNo;
                        }
                    });
            }.bind(this));
        },

        handleValueHelpFundCategory: function (oEvent) {
            const sourceObject = oEvent.getSource().getBindingContext().getObject();
            if (!sourceObject) {
                console.error("Source object for Funding Category value help cannot be determined.");
                return;
            }
            sap.ui.require(["sg/gov/jtc/JTC-InvoiceApp/controller/ValueHelpFundCategory"], function (ValueHelpFundCategory) {
                if (!this.valueHelpFundCategory) {
                    this.valueHelpFundCategory = new ValueHelpFundCategory();
                }
                this.valueHelpFundCategory.open(this.getView(), sourceObject.banfn)
                    .then(oFundCategory => {
                        if (sourceObject) {
                            ["assetNo", "subAssetNo", "glAccount", "costCenter", "estateRx", "landRx", "buildingRx",
                                "reobjectentityRx", "imkey", "realEstate"]
                                .forEach(prop => {
                                    sourceObject[prop] = "";
                                });
                            sourceObject.fundCategory = oFundCategory.ktext;
                            sourceObject.assetNo = oFundCategory.asset;
                            sourceObject.subAssetNo = oFundCategory.assetSubNumber;
                            if (!sourceObject.assetNo) {
                                sourceObject.glAccount = oFundCategory.glAccount;
                                sourceObject.costCenter = oFundCategory.costCenter;
                                if (!sourceObject.costCenter) {
                                    sourceObject.estateRx = oFundCategory.estate;
                                    sourceObject.landRx = oFundCategory.land;
                                    sourceObject.buildingRx = oFundCategory.building;
                                    sourceObject.reobjectentityRx = oFundCategory.reobjectentity;
                                }
                            }

                            // Determine Account Assignment and Real Estate
                            if (sourceObject.assetNo) {
                                sourceObject.accntAssign = "ASSET";
                            } else if (sourceObject.costCenter) {
                                sourceObject.accntAssign = "GLCC";
                            } else {
                                sourceObject.accntAssign = "GLRE";
                            }
                        }
                    });
            }.bind(this));
        },

        handleValueHelpGL: function (oEvent, sLinkInvoice) {
            const sourceObject = oEvent.getSource().getBindingContext().getObject();
            if (!sourceObject) {
                console.error("Source object for GL value help cannot be determined.");
                return;
            }
            sap.ui.require(["sg/gov/jtc/JTC-InvoiceApp/controller/ValueHelpGL2"], function (ValueHelpGL2) {
                if (!this.valueHelpGL2) {
                    this.valueHelpGL2 = new ValueHelpGL2();
                }
                this.valueHelpGL2.open(this.getView(), this.appState.invDoc.header.compCode)
                    .then(sGlAccountNumber => {
                        if (sourceObject) {
                            switch (sLinkInvoice) {
                                case "NA":
                                    sourceObject.glAccount = sGlAccountNumber;
                                    break;
                                case "AOR":
                                    sourceObject.glAccount = sGlAccountNumber;
                                    break;
                                default:
                                    console.error(`Link Invoice ${sLinkInvoice} not recognized. GL value help failed.`);
                                    break;
                            }
                        }
                    });
            }.bind(this));
        },

        // Value Help: Cost Center

        handleValueHelpCostCenter: function (oEvent, sLinkInvoice) {
            const sourceObject = oEvent.getSource().getBindingContext().getObject();
            if (!sourceObject) {
                console.error("Source object for Cost Center value help cannot be determined.");
                return;
            }
            sap.ui.require(["sg/gov/jtc/JTC-InvoiceApp/controller/ValueHelpCostCenter2"], function (ValueHelpCostCenter2) {
                if (!this.valueHelpCostCenter2) {
                    this.valueHelpCostCenter2 = new ValueHelpCostCenter2();
                }
                this.valueHelpCostCenter2.open(this.getView(), this.appState.invDoc.header.compCode)
                    .then(sCostCenter => {
                        if (sourceObject) {
                            switch (sLinkInvoice) {
                                case "NA":
                                    sourceObject.costCenter = sCostCenter;
                                    break;
                                case "AOR":
                                    sourceObject.costCenter = sCostCenter;
                                    break;
                                default:
                                    console.error(`Link Invoice ${sLinkInvoice} not recognized. Cost Center value help failed.`);
                                    break;
                            }
                        }
                    });
            }.bind(this));
        },

        // Value Help: Asset

        handleValueHelpAsset: function (oEvent, sLinkInvoice) {
            const sourceObject = oEvent.getSource().getBindingContext().getObject();
            if (!sourceObject) {
                console.error("Source object for asset value help cannot be determined.");
                return;
            }
            sap.ui.require(["sg/gov/jtc/JTC-InvoiceApp/controller/ValueHelpAsset2"], function (ValueHelpAsset2) {
                "use strict";
                if (!this.valueHelpAsset2) {
                    this.valueHelpAsset2 = new ValueHelpAsset2();
                }
                this.valueHelpAsset2.open(this.getView(), this.appState.invDoc.header.compCode)
                    .then(oAsset => {
                        if (sourceObject) {
                            switch (sLinkInvoice) {
                                case "NA":
                                    sourceObject.assetNo = oAsset.MainAssetNumber;
                                    sourceObject.subAssetNo = oAsset.AssetSubnumber;
                                    break;
                                case "AOR":
                                    sourceObject.assetNo = oAsset.MainAssetNumber;
                                    sourceObject.subAssetNo = oAsset.AssetSubnumber;
                                    break;
                                default:
                                    console.error(`Result of ValueHelpAsset2 cannot be set correctly. Type ${sLinkInvoice} not recognized.`);
                                    break;
                            }
                        }
                    });
            }.bind(this));
        },

        //Value Help for Real Estate
        handleValueHelpRE: function (oEvent, sLinkTo) {
            const source = oEvent.getSource();
            const sourceObject = oEvent.getSource().getBindingContext().getObject();
            if (!sourceObject) {
                console.error("Source object for Real Estate value help cannot be determined.");
                return;
            }
            const realEstate = {
                Estate: sourceObject.estate,
                Building: sourceObject.building,
                Land: sourceObject.land,
                RentalObject: sourceObject.reobjectentity
            };
            sap.ui.require(["sg/gov/jtc/JTC-InvoiceApp/controller/RealEstate"], function (RealEstate) {
                if (!this.oRealEstate) {
                    this.oRealEstate = new RealEstate(this.getView());
                }
                this.oRealEstate.openBy(source, this.appState.invDoc.header.compCode, realEstate)
                    .then(retRealEstate => {
                        if (sourceObject) {
                            mobx.set(sourceObject, {
                                buildingRx: retRealEstate.Building,
                                landRx: retRealEstate.Land,
                                reobjectentityRx: retRealEstate.RentalObject,
                                estateRx: retRealEstate.Estate
                            });
                        }
                    });
            }.bind(this));
        },

        // Attachment
        handleAttachment: function (oEvent) {
            var visible = this.getView().byId("idAttachmentBox");
            switch (visible.getVisible()) {
                case false:
                    visible.setVisible(true);
                    break;
                case true:
                    visible.setVisible(false);
                    break;
                default:
                    visible.setVisible(false);
                    break;
            }
        },

        getLink: function (oEvent) {
            var source = oEvent.getSource();
            var context = source.getBindingContext("att");
            var sPath = context.getPath();
            const oAttachment = this._oAttachmentModel.getProperty(sPath);

            var link = `/sap/opu/odata/sap/ZMMP_INV_ODATA_SRV/FileContentSet(ObjNo='${oAttachment.ObjNo}',Zattchid='${oAttachment.Zattchid}')/$value`;
            window.open(link, "_blank");
        },

        // Exit
        handleExit: function () {
            //Update the landing page search result list if current invoice being edited is found there
            const invToBeUpdated = _.find(app.invoiceStore.invoices, {InvoiceID: this.appState.invDoc.header.invId});
            if (invToBeUpdated) {
                this.invMaintainService.retrieveUpdatedValues(this.appState.invDoc.header.invId)
                    .then(updatedValues => {
                        invToBeUpdated.Status = updatedValues.Status;
                        invToBeUpdated.RequestorID = updatedValues.RequestorID;
                        invToBeUpdated.InvoiceApprovingOfficer = updatedValues.InvoiceApprovingOfficer;
                    })
                    .finally(() => {
                        this.doActualExit();
                    });
            } else {
                this.doActualExit();
            }
        },

        doActualExit: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.oRouter.navTo("master", {}, true);
            }
        },

        handleTrainingPress: function (oEvent) {
            // this.handleNotYetImplemented(oEvent);
            sap.ui.require([
                "sg/gov/jtc/JTC-InvoiceApp/controller/TrainingInformation"
            ], function (TrainingInformation) {
                if (!this.trainingInformationDialog) {
                    this.trainingInformationDialog = new TrainingInformation(this.getView());
                }
                const sInvoiceID = this.appState.invDoc.header.invId || "";
                this.trainingInformationDialog.open(sInvoiceID)
                    .then(this.updateTrainingInformation.bind(this));
            }.bind(this));
        },

        updateTrainingInformation: function (aTrainingInfo) {
            // TODO: clean up
            // this._oTrainingInformationModel.setProperty("/TrainingInformationInternal", aTrainingInfo);
            // For link to AOR and NA, update sub tables
            this.appState.view.procurementDetailsBusy = true;
            this.appState.updateLinkNaWithTraining();
            // this._viewModel.setProperty("/procurementDetailsBusy", true);
            // this.executePaiEvent({
            //     GV_OK_CODE: "UTAC",
            //     GV_FIO_SUBFUNCTION: "APPLY_UTI",
            //     GT_UTI_FINAL: aTrainingInfo
            // }).then(this.updateProcurementDetails.bind(this));
        },

        handleMultiplePayees: function () {
            // this.handleNotYetImplemented(oEvent);
            sap.ui.require([
                "sg/gov/jtc/JTC-InvoiceApp/controller/Payee"
            ], function (Payee) {
                if (!this.Payee) {
                    this.Payee = new Payee(this.getView());
                }
                this.Payee.open()
                    .then(this.updateMultiplePayees.bind(this));
            }.bind(this));
        },

        updateMultiplePayees: function () {
            //Do nothing, logic moved to Payee.js
        },

        retrievePaymentMethods: function () {
            this.executePaiEvent({
                GV_OK_CODE: "",
                GV_FIO_SUBFUNCTION: "PAY_METHOD_VH",
            }).then((aProcessingLog) => {
                const aPaymentMethods = this._getField(aProcessingLog, "GT_FIO_PAY_METHOD");
                console.log("Payment Methods: ", aPaymentMethods);
                this._oHelpModel.setProperty("/PaymentMethods", aPaymentMethods);
            });
        },

        retrieveSpecialGlIndicators: function () {
            this.executePaiEvent({
                GV_OK_CODE: "",
                GV_FIO_SUBFUNCTION: "SPECIAL_GL_INDICATOR_VH",
            }).then((aProcessingLog) => {
                const aSpecialGlIndicators = this._getField(aProcessingLog, "GT_FIO_SPECIAL_GL_IND");
                aSpecialGlIndicators.push({shbkz: "", ltext: ""});
                console.log("Special GL Indicators: ", aSpecialGlIndicators);
                this._oHelpModel.setProperty("/SpecialGlIndicators", aSpecialGlIndicators);
            });
        },

        retrievePermittedPayee: function () {
            this.executePaiEvent({
                GV_OK_CODE: "",
                GV_FIO_SUBFUNCTION: "PERMITTED_PAYEE_VH",
            }).then((aProcessingLog) => {
                const aPermittedPayees = this._getField(aProcessingLog, "GT_FIO_PERMITTED_PAYEE");
                aPermittedPayees.push({empfk: "", name: "Multiple payees"});
                console.log("Permitted Payees: ", aPermittedPayees);
                this._oHelpModel.setProperty("/PermittedPayees", aPermittedPayees);
            });
        },

        // handleChangePermittedPayee: function (oEvent) {
        //     // try {
        //     //     const oItem = oEvent.getParameters("selectedItem");
        //     //     const oSelected = oItem.selectedItem.oBindingContexts.help.getObject();
        //     //     mobx.set(this.appState.ecc, "GV_PERMIT_PAYEE_NM", oSelected.empfk ? oSelected.name : "Multiple payees");
        //     // } catch (e) {
        //     //     console.error(e);
        //     // }
        // },

        updateProcurementDetails: function (aProcessingLog) {
            const getField = this._getField.bind(this);
            const sLinkTo = this._oLocalModel.getProperty("/LinkInvoiceTo");
            switch (sLinkTo) {
                case "AOR":
                    const aAor = getField(aProcessingLog, "GT_TC_AOR");
                    this._aorState.setAor(aAor);
                    break;
                case "NA":
                    const aNa = getField(aProcessingLog, "GT_TC_NA");
                    const aNaExternal = this.convertNaToExternalFormat(aNa);
                    this._oLocalModel.setProperty("/ToInvoiceLinkNA", aNaExternal);
                    this._uiState.na.updateAmounts(_.map(aNaExternal, "AmountBeforeGst"));
                    break;
            }
            this.updateApproversList();
            this._viewModel.setProperty("/procurementDetailsBusy", false);
        },

        convertNaToExternalFormat: function (aNaInternal) {
            const naKeyMap = {
                invId: "InvoiceID",
                lineNumber: "LineNumber",
                invRefnum: "InvoiceReference",
                accntAssign: "AccountAssignment",
                assetNo: "MainAssetNumber",
                subAssetNo: "AssetSubnumber",
                glAccount: "GLAccountNumber",
                costCenter: "CostCenter",
                estate: "Estate",
                land: "NumberOfLand",
                building: "NumberOfBuilding",
                reobjectentity: "NumberOfRentalObject",
                preGstAmt: "AmountBeforeGst",
                taxCode: "TaxCode",
                delInd: "DeletionIndicator",
                taxDescr: "TaxCodeDescription",
                zzpernr: "PersonnelNumber",
                zzcrsid: "CourseID"
            };

            const aEditPostDetail = _.clone(this._oHelpModel.getProperty("/EditPostDetailNA"));
            return aNaInternal.map((oNa, iNaIndex) => {
                let oNaExternal = _.mapKeys(oNa, (value, key) => {
                    return _.get(naKeyMap, key, key);
                });
                ["imkey", "itemno", "mandt", "realEstate", "selcl"].map(k => {
                    delete oNaExternal[k];
                });
                oNaExternal.EditPostDetailNA = _.find(aEditPostDetail, {AccountAssignment: oNaExternal.AccountAssignment});
                oNaExternal.LineNumber = _.padStart(iNaIndex + 1, 5, "0");
                oNaExternal.GLAccountNumber = _.trimStart(oNaExternal.GLAccountNumber, "0");
                return oNaExternal;
            });
        },

        handleUpdateFinished: function () {
            this._scrollWfHistory();
        },

        //****************
        // Data Processing
        //****************

        // Save Invoice
        handleSaveInvoice: function (sOperation) {
            if (sOperation === "SAVE") {
                this.handleSaveInvoiceActual();
                return;
            }
            if (sOperation === "SUBMIT" && this.appState.view.offsetButtonVisible) {
                this.handleOffsetInvoice();
                return;
            }
            if (sOperation === "SUBMIT") {
                this.handleSubmitInvoiceActual({});
                return;
            }
        },

        handleSaveInvoiceActual: function () {
            this.appState.saveInvoice()
                .then(oAction => {
                    this.extractAndDisplayActionResponse(oAction);
                    if (oAction.responseCode === "OK") {
                        // Upload attachments
                        this.onStartUpload()
                            .then(bUploadTriggered => {
                                MessageBox.information(oAction.responseMessage, {
                                    onClose: null,
                                    styleClass: this.contentDensityClass
                                });
                                // Retrieve updated attachment list from server
                                this.appState.refreshAttachmentList();
                            });
                    }
                })
                .catch(this.popupSystemError.bind(this));
        },

        handleSubmitInvoiceActual: function (mParameters) {
            if (_.isEmpty(mParameters)) {
                //Prompt the user whether to continue submit or not (just like in ECC)
                new Promise((resolve) => {
                    MessageBox.confirm("Submit?", {
                        actions: ["Continue", "Exit"],
                        onClose: resolve,
                        styleClass: this.contentDensityClass
                    });
                }).then(sAnswer => {
                    if (sAnswer === "Continue") {
                        if (this.submitFrontendValidation()) {
                            this.doActualSubmit(mParameters);
                        };
                    }
                });
            }
        },

        submitFrontendValidation: function () {
            const oMessageManager = this.oMessageManager;
            oMessageManager.removeAllMessages();
            // Expense type cannot be blank
            if (!this.appState.invDoc.header.expenseType) {
                const errorMessage = "Select a valid expense type.";
                oMessageManager.addMessages(new Message({
                    type: MessageType.Error,
                    message: errorMessage
                }));
                MessageBox.error(errorMessage, {styleClass: this.contentDensityClass});
                return false;
            }
            // Expense type must be from one of the valid values for the document
            const indexFind = _.findIndex(this.appState.aux.expenseTypesForDocument, (e) => {
                const sKey = this.appState.invDoc.header.expenseType + "@" + this.appState.invDoc.header.subexpenseType;
                return sKey === e.key;
            });
            if (indexFind < 0) {
                const errorMessage = "Selected expense type is not allowed for this invoice.";
                oMessageManager.addMessages(new Message({
                    type: MessageType.Error,
                    message: errorMessage
                }));
                MessageBox.error(errorMessage, {styleClass: this.contentDensityClass});
                return false;
            }
            return true;
        },

        doActualSubmit: function (mParameters) {
            this.appState.submitInvoice(mParameters)
                .then(oAction => {
                    if (oAction.responseCode === "ERROR") {
                        if (oAction.responseMessage === "POPUP=MULTIPLE ASSIGNEES") {
                            new Promise((resolve) => {
                                MessageBox.confirm("The payment has multiple assignees for different contracts.", {
                                    title: "Choose Action",
                                    actions: ["Continue", "Exit"],
                                    onClose: resolve,
                                    styleClass: this.contentDensityClass
                                });
                            }).then(sAnswer => {
                                if (sAnswer === "Continue") {
                                    this.doActualSubmit(_.assign(mParameters, {multipleAssigneesOk: true}));
                                }
                            });
                            return null;
                        }

                        if (oAction.responseMessage === "POPUP=FUTURE_REMARKS") {
                            const dPowoDate = this.getActionField(oAction.responseData, "GV_PO_DATE");
                            const aRemarks = this.getActionField(oAction.responseData, "GT_TABLE_LINE3");
                            const sRemark = aRemarks.reduce(function (remark, oRemark) {
                                return remark + (oRemark.line || "");
                            }, "");
                            return this._getFutureRemarks(this.appState.invDoc.header.invRefdate, dPowoDate, sRemark)
                                .then(sFuturePoRemarks => {
                                    if (sFuturePoRemarks) {
                                        this.doActualSubmit(_.assign(mParameters, {
                                            futurePoRemark: sFuturePoRemarks,
                                            userConfirmed: true
                                        }));
                                    }
                                });
                        }
                    }
                    ;
                    this.extractAndDisplayActionResponse(oAction);
                    if (oAction.responseCode === "OK") {
                        // Upload attachments
                        this.onStartUpload()
                            .then(bUploadTriggered => {
                                MessageBox.information(oAction.responseMessage, {
                                    onClose: this.handleExit.bind(this),
                                    styleClass: this.contentDensityClass
                                });
                                // Retrieve updated attachment list from server
                                this.appState.refreshAttachmentList();
                            });
                    }
                })
                .catch(this.popupSystemError.bind(this));
        },

        handleOffsetInvoice: function () {
            //Popup to confirm
            new Promise((resolve) => {
                MessageBox.confirm("Submit for offset? This will clear any link to PO/AOR/Others.", {
                    actions: ["Continue", "Exit"],
                    onClose: resolve,
                    styleClass: this.contentDensityClass
                });
            }).then(sAnswer => {
                if (sAnswer === "Continue") {
                    this.appState.invDoc.header.linkInvoice = "";
                    if (this.offsetValidation()) {
                        this.doActualOffset();
                    };
                }
            });
        },

        offsetValidation: function () {
            // Validation
            const oMessageManager = this.oMessageManager;
            oMessageManager.removeAllMessages();
            if (this.appState.invDoc.header.linkInvoice === "POWO") {
                const errorMessage = "Invoice linked to PO/WO cannot be submitted for Offset.";
                oMessageManager.addMessages(new Message({ type: MessageType.Error, message: errorMessage }));
                MessageBox.error(errorMessage, {styleClass: this.contentDensityClass});
                return false;
            }
            //Validation passed
            return true;
        },

        doActualOffset: function () {
            this.appState.offsetInvoice()
                .then(oAction => {
                    this.extractAndDisplayActionResponse(oAction);
                    if (oAction.responseCode === "OK") {
                        // Upload attachments
                        this.onStartUpload()
                            .then(bUploadTriggered => {
                                MessageBox.information(oAction.responseMessage, {
                                    onClose: null,
                                    styleClass: this.contentDensityClass
                                });
                                // Retrieve updated attachment list from server
                                this.appState.refreshAttachmentList();
                            });
                    }
                })
                .catch(this.popupSystemError.bind(this));
        },

        // TODO: Clean up these lines, no longer needed
        // _resubmitInvoice: function (mParameters) {
        //     this._saveInvoice("SUBMIT", mParameters);
        // },
        //
        // _saveInvoice: function (sOperation, mParameters) {
        //     const bHasUserConfirmed = _.get(mParameters, "userConfirmed", false);
        //     // For submit, request for user confirmation
        //     let userConfirmation = Promise.resolve("Continue");
        //     if (sOperation === "SUBMIT" && !bHasUserConfirmed) {
        //         userConfirmation = new Promise((resolve) => {
        //             MessageBox.confirm("Submit?", {
        //                 actions: ["Continue", "Exit"],
        //                 onClose: resolve,
        //                 styleClass: this.contentDensityClass
        //             });
        //         });
        //     }
        //     userConfirmation.then(sAction => {
        //         if (sAction === "Exit" || _.isEmpty(sAction)) {
        //             // MessageToast.show("Action cancelled");
        //             return;
        //         }
        //
        //         const oInvoiceDeep = this._prepareInvoiceBundle({
        //             "InvoiceDeep": _.cloneDeep(this._oLocalModel.getData()),
        //             "ViewData": _.cloneDeep(this._viewModel.getData()) || [],
        //             "CreditNotes": _.clone(this._oCreditNoteModel.getProperty("/CreditNotes")) || [],
        //             "PowoModel": this._oPowoModel,
        //             "AorState": this._aorState,
        //             "trainingInfoModel": this._oTrainingInformationModel
        //         });
        //
        //         const aNaLines = _.cloneDeep(this._oLocalModel.getProperty("/ToInvoiceLinkNA"));
        //         const aNaLinesNew = _.filter(aNaLines, (oNa) => {
        //             return !_.isEmpty(oNa.AccountAssignment);
        //         });
        //         this._oLocalModel.setProperty("/ToInvoiceLinkNA", aNaLinesNew);
        //         this._uiState.na.updateAmounts(_.map(oInvoiceDeep.ToInvoiceLinkNA, "AmountBeforeGst"));
        //         this._oLocalModel.refresh(true);
        //
        //         //Additional parameters to be sent to the backend service
        //         //Common parameters added in _prepareInvoiceBundle function
        //         let aParameters = oInvoiceDeep.ToParameter || [];
        //         // Powo: Future PO remarks
        //         if (mParameters) {
        //             if (mParameters.linkTo === "POWO" && mParameters.userConfirmed) {
        //                 aParameters.push({
        //                     "InvoiceID": oInvoiceDeep.InvoiceID,
        //                     "Group": "FIELDS",
        //                     "Sequence": aParameters.length,
        //                     "Name": "GV_FIO_USER_CONFIRMED",
        //                     "Value": JSON.stringify(true)
        //                 });
        //                 aParameters.push({
        //                     "InvoiceID": oInvoiceDeep.InvoiceID,
        //                     "Group": "FIELDS",
        //                     "Sequence": aParameters.length,
        //                     "Name": "GT_FIO_FUTUREPOREMARKS",
        //                     "Value": JSON.stringify([{line: mParameters.futurePoRemark}])
        //                 });
        //             }
        //         }
        //
        //         //Remarks as a table of lines of 128 char each
        //         const sRemarks = _.get(this._viewModel.getData(), "Remarks", "");
        //         const aRemarkLine128 = sRemarks.match(/.{1,128}/g) || [];
        //         const aRemarkLineTab = aRemarkLine128.map((remarkLine) => {
        //             return {line: remarkLine};
        //         });
        //         aParameters.push({
        //             "InvoiceID": oInvoiceDeep.InvoiceID,
        //             "Group": "FIELDS",
        //             "Sequence": aParameters.length,
        //             "Name": "GT_TABLE_LINE2",
        //             "Value": JSON.stringify(aRemarkLineTab)
        //         });
        //
        //         //ECC - Attachment List
        //         aParameters.push({
        //             "InvoiceID": oInvoiceDeep.InvoiceID,
        //             "Group": "FIELDS",
        //             "Sequence": aParameters.length,
        //             "Name": "GT_FIO_ATTACHMENTS",
        //             "Value": JSON.stringify(this.getUpdatedAttachmentList())
        //         });
        //
        //         // this.getView().setBusy(true);
        //         this._viewModel.setProperty("/processViewBusy", true);
        //         this.invMaintainService.saveInvoice(oInvoiceDeep, sOperation)
        //             .then((data, response) => {
        //                 const sStatus = _.get(data, "__batchResponses.0.response.statusCode", "");
        //                 if (sStatus === "400") {
        //                     const oResBody = JSON.parse(_.get(data, "__batchResponses.0.response.body", ""));
        //                     const sError = _.get(oResBody, "error.message.value", "");
        //                     if (sError) {
        //                         MessageBox.error(sError, {
        //                             title: "Validation Failed",
        //                             styleClass: this.contentDensityClass
        //                         });
        //                     }
        //                 } else {
        //                     const oData = _.get(data, "__batchResponses.0.__changeResponses.0.data");
        //                     const aProcessingLog = _.get(oData, "ToProcessingLog.results", []);
        //                     //Check if we need popup dialog for future remarks
        //                     const index = _.findIndex(aProcessingLog, {
        //                         LogType: "PO_SUBMIT_VALIDATION",
        //                         Message: "POPUP_FUTURE_REMARKS"
        //                     });
        //                     if (index > -1) {
        //                         //Popup message dialog, send user response "remarks" (max 120 char) in GT_TABLE_LINE3
        //                         //Backend to parse future remarks in GT_TABLE_LINE3 (each 'line' property is 128 char)
        //                         //User can also choose to cancel submission
        //                         const dPowoDate = this._getField(aProcessingLog, "GV_PO_DATE");
        //                         const aRemarks = this._getField(aProcessingLog, "GT_TABLE_LINE3");
        //                         const sRemark = aRemarks.reduce(function (remark, oRemark) {
        //                             return remark + (oRemark.line || "");
        //                         }, "");
        //                         this._getFutureRemarks(oInvoiceDeep.InvoiceReferenceDate, dPowoDate, sRemark);
        //                         return;
        //                     }
        //                     //Here, everything is OK
        //                     // Upload attachments
        //                     this.onStartUpload()
        //                         .then(bUploadTriggered => {
        //                             const sAction = sOperation === "SAVE" ? "saved" : "submitted";
        //                             const fnCallback = sOperation === "SAVE" ? this.afterSave : this.afterSubmit;
        //                             MessageBox.information(`Invoice ${oInvoiceDeep.InvoiceReference} ${sAction}.`, {
        //                                 onClose: fnCallback.bind(this),
        //                                 styleClass: this.contentDensityClass
        //                             });
        //                             //TODO: Retrieve updated attachment list from server
        //                             this.appState.refreshAttachmentList();
        //                             if (bUploadTriggered) {
        //                                 const oUploadCollection = this.getView().byId("UploadCollection");
        //                                 if (oUploadCollection) {
        //                                     // oUploadCollection.refreshAggregation("items");
        //                                 }
        //                             }
        //                         });
        //
        //                     // if (sOperation !== "SAVE") {
        //                     //     this.handleExit();
        //                     // }
        //                 }
        //             })
        //             .catch(error => {
        //                 const oError = JSON.parse(error.responseText);
        //                 const msg = _.get(oError, "error.message.value", `Error. Invoice ${oInvoiceDeep.InvoiceReference} not ${sAction}.`);
        //                 MessageBox.error(msg, {
        //                     styleClass: this.contentDensityClass
        //                 });
        //                 console.log(`${sOperation} Error:`, error);
        //             })
        //             .finally(() => {
        //                 this.removeDuplicateMessages(this.oMessageManager);
        //                 // todo: cleanup
        //                 // const oMessageManager = sap.ui.getCore().getMessageManager();
        //                 // const oMessageModel = oMessageManager.getMessageModel();
        //                 // const aUniqueMessages = _.uniqBy(oMessageModel.getData(), "message");
        //                 // oMessageManager.removeAllMessages();
        //                 // oMessageModel.setData(aUniqueMessages);
        //                 // this.getView().setBusy(false);
        //                 this._viewModel.setProperty("/processViewBusy", false);
        //             });
        //     });
        // },
        //
        // afterSave: function () {
        //     // Do nothing
        // },
        //
        // afterSubmit: function () {
        //     this.handleExit();
        // },

        handleWithdraw: function (oEvent) {
            sap.ui.require([
                "sg/gov/jtc/JTC-InvoiceApp/controller/RouteBack"
            ], function (RouteBack) {
                if (!this.routeBackDialog) {
                    this.routeBackDialog = new RouteBack(this.getView());
                }
                this.routeBackDialog.open({
                    dialogTitle: "Withdraw",
                    routeBackButtonText: "Withdraw"
                }).then(mParameters => {
                    if (mParameters.routeBack) {
                        this.appState.invDoc.remarks = mParameters.remarks;
                        this.doActualWithdrawal();
                    }
                });
            }.bind(this));
        },

        doActualWithdrawal: function (mParameters) {
            this.appState.withdrawInvoice({})
                .then(oAction => {
                    if (oAction.responseCode === "OK") {
                        this.displayMessageAndExit("Withdraw", oAction);
                    } else {
                        this.extractAndDisplayActionResponse(oAction);
                    }
                    return null;
                })
                .catch(this.popupSystemError.bind(this))
                .finally(() => this.appState.processViewBusy = false);
        },

        handleRerouteInvoice: function () {
            sap.ui.require([
                "sg/gov/jtc/JTC-InvoiceApp/controller/RerouteDialog"
            ], function (RerouteDialog) {
                if (!this._rerouteDialog) {
                    this._rerouteDialog = new RerouteDialog(this.getView());
                }
                const sPurchasingGroup = this.appState.invDoc.header.purchGrp;
                const sStatus = this.appState.invDoc.header.status;
                const sRemarks = this.appState.invDoc.remarks;
                this._rerouteDialog.open(sPurchasingGroup, sStatus, sRemarks)
                    .then(this.afterReroute.bind(this));
            }.bind(this));
        },

        afterReroute: function (bRerouted) {
            if (bRerouted) {
                const sInvReference = this.appState.invDoc.header.invRefnum;
                MessageBox.information(`Invoice ${sInvReference} is re-routed.`, {
                    onClose: this.handleExit.bind(this),
                    styleClass: this.contentDensityClass
                });
            }
        },

        handleRequestCancel: function () {
            sap.ui.require([
                "sg/gov/jtc/JTC-InvoiceApp/controller/RequestCancellation"
            ], function (RequestCancellation) {
                if (!this._requestCancellationDialog) {
                    this._requestCancellationDialog = new RequestCancellation(this.getView());
                }
                const sStatus = this.appState.invDoc.header.status;
                const sVerifyingOfficer = this.appState.invDoc.header.verifyOfcr;
                const sRemarks = this.appState.invDoc.remarks;
                this._requestCancellationDialog.open(sStatus, sVerifyingOfficer, sRemarks)
                    .then(this.afterRequestCancellation.bind(this));
            }.bind(this));
        },

        afterRequestCancellation: function (bCancellationRequested) {
            if (bCancellationRequested) {
                const sInvReference = this.appState.invDoc.header.invRefnum;
                MessageBox.information(`Invoice ${sInvReference} is submitted for cancellation.`, {
                    onClose: this.handleExit.bind(this),
                    styleClass: this.contentDensityClass
                });
            }
        },

        handleCancelInvoice: function (oEvent) {
            MessageBox.confirm("Are you sure you want to cancel?", {
                title: "Cancel Invoice",
                actions: ["Yes", "No"],
                onClose: this.afterCancelInvoiceConfirmation.bind(this),
                styleClass: this.contentDensityClass
            });
        },

        afterCancelInvoiceConfirmation: function (sResponse) {
            if (sResponse === "Yes") {
                this.appState.cancelInvoice({})
                    .then(oAction => {
                        this.extractAndDisplayActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            this.displayMessageAndExit("Cancel Invoice", oAction);
                        }
                    }).catch(this.popupSystemError.bind(this));
            }
        },

        handlePark: function () {
            this.doParkingValidation();
        },

        doParkingValidation: function () {
            this.appState.parkInvoiceValidate({})
                .then(oAction => {
                    this.extractAndDisplayActionResponse(oAction);
                    if (oAction.responseCode === "OK") {
                        const aInvoiceApprovingOfficers = this.getActionField(oAction.responseData, "GT_FIO_LISTBOX");
                        const sInvoiceApprovingOfficer = this.appState.invDoc.header.iao;
                        // Display dialog box
                        sap.ui.require([
                            "sg/gov/jtc/JTC-InvoiceApp/controller/Park"
                        ], function (Park) {
                            if (!this.parkDialog) {
                                this.parkDialog = new Park(this.getView());
                            }
                            this.parkDialog.open({
                                aInvoiceApprovingOfficers: aInvoiceApprovingOfficers,
                                invoiceApprovingOfficer: sInvoiceApprovingOfficer
                            }).then(this.afterParkDialog.bind(this));
                        }.bind(this));
                    }
                }).catch(this.popupSystemError.bind(this));
        },

        afterParkDialog: function (mParameters) {
            if (mParameters.bPark) {
                this.appState.invDoc.remarks = mParameters.remarks;
                this.appState.invDoc.header.iao = mParameters.invoiceApprovingOfficer;
                this.doActualParking()
                    .then(oAction => {
                        if (oAction.responseCode === "OK") {
                            this.displayMessageAndExit("Park", oAction);
                        } else {
                            this.extractAndDisplayActionResponse(oAction);
                        }
                        return null;
                    })
                    .catch(this.popupSystemError.bind(this))
                    .finally(() => this.appState.view.processViewBusy = false);
            }
        },

        doActualParking: function () {
            return this.appState.parkInvoice({});
        },

        handlePost: function () {
            sap.ui.require([
                "sg/gov/jtc/JTC-InvoiceApp/controller/RouteBack"
            ], function (RouteBack) {
                if (!this.routeBackDialog) {
                    this.routeBackDialog = new RouteBack(this.getView());
                }
                this.routeBackDialog.open({
                    dialogTitle: "Post",
                    routeBackButtonText: "Post",
                    remarks: this.appState.invDoc.remarks
                }).then(mParameters => {
                    if (mParameters.routeBack) {
                        this.appState.invDoc.remarks = mParameters.remarks;
                        this.appState.postInvoice({}).then(this.afterPost.bind(this))
                            .catch(this.popupSystemError.bind(this))
                            .finally(() => this.appState.view.processViewBusy = false);
                    }
                });
            }.bind(this));
        },

        afterPost: function (oAction, response) {
            this.extractAndDisplayActionResponse(oAction);
            if (oAction.responseCode === "OK") {
                this.displayMessageAndExit("Post", oAction);
            }
        },

        handleReverse: function (oEvent) {
            // this.handleNotYetImplemented(oEvent);
            this.appState.reverseInvoiceValidate({})
                .then(this.afterReverseValidation.bind(this))
                .catch(this.popupSystemError.bind(this))
                .finally(() => {
                    this.appState.view.processViewBusy = false;
                });
        },

        afterReverseValidation: function (oAction, response) {
            this.extractAndDisplayActionResponse(oAction);
            if (oAction.responseCode === "OK") {
                // Show dialog to get reversal reason and posting date
                sap.ui.require([
                    "sg/gov/jtc/JTC-InvoiceApp/controller/ReverseDialog"
                ], function (ReverseDialog) {
                    const aReversalReasons = this.getActionField(oAction.responseData, "GT_FIO_REVERSAL_REASON");
                    const postingDate = this.getActionField(oAction.responseData, "GV_BUDAT");
                    if (!this.reverseDialog) {
                        this.reverseDialog = new ReverseDialog(this.getView());
                    }
                    this.reverseDialog.open({
                        reversalReasons: aReversalReasons,
                        postingDate: postingDate,
                        remarks: this.appState.invDoc.remarks
                    }).then(this.doActualReversal.bind(this));
                }.bind(this));
            }
        },

        doActualReversal: function (mParameters) {
            if (!mParameters.reverse) {
                return;
            }
            this.appState.invDoc.remarks = mParameters.remarks;
            this.appState.reverseInvoice({
                GV_STGRD: mParameters.reversalReason,
                GV_BUDAT: mParameters.postingDate
            }).then(this.afterReversal.bind(this))
                .catch(this.popupSystemError.bind(this))
                .finally(() => {
                    this.appState.view.processViewBusy = false;
                });
        },

        afterReversal: function (oAction, response) {
            this.extractAndDisplayActionResponse(oAction);
            if (oAction.responseCode === "OK") {
                this.displayMessageAndExit("Reverse", oAction);
            }
        },

        extractAndDisplayActionResponse: function (oAction) {
            // console.log(`${oAction.action} response code: `, oAction.responseCode);
            // console.log(`${oAction.action} response message: `, oAction.responseMessage);
            // const aResponseData = JSON.parse(oAction.responseData);
            // console.log(`${oAction.action} response: `, aResponseData);

            if (oAction.responseCode === "ERROR") {
                MessageBox.error(oAction.responseMessage, {
                    styleClass: this.contentDensityClass
                });
                let aErrors = this.getActionField(oAction.responseData, "GT_FIO_ACTION_MSG");
                if (aErrors.length < 1) {
                    aErrors.push({
                        type: "E",
                        message: oAction.responseMessage
                    });
                }
                console.log(`${oAction.action} errors: `, aErrors);
                const aMessages = aErrors.map(this.convertToUiMessage.bind(this));
                this.oMessageManager.removeAllMessages();
                this.oMessageManager.addMessages(aMessages);
            }
        },

        convertToUiMessage: function (oMessage) {
            let sMessageType = MessageType.None;
            switch (oMessage.type) {
                case "E":
                    sMessageType = MessageType.Error;
                    break;
                case "W":
                    sMessageType = MessageType.Warning;
                    break;
                case "S":
                    sMessageType = MessageType.Success;
                    break;
                case "I":
                    sMessageType = MessageType.Information;
                    break;
                default:
                    sMessageType = MessageType.None;
                    break;
            }

            return new Message({
                type: sMessageType,
                message: oMessage.message,
                processor: this.getOwnerComponent().getModel("inv")
            });
        },

        doAction: function (mParameters) {
            return new Promise((resolve, reject) => {
                // Initialize Action entity properties
                let oAction = {
                    action: mParameters.action,
                    subAction: mParameters.subAction,
                    requestData: "",
                    responseCode: "",
                    responseMessage: "",
                    responseData: ""
                };

                let aRequestData = [];

                const oInvoiceDeep = this._prepareInvoiceBundle({
                    "InvoiceDeep": _.cloneDeep(this._oLocalModel.getData()),
                    "ViewData": _.cloneDeep(this._viewModel.getData()) || [],
                    "CreditNotes": _.clone(this._oCreditNoteModel.getProperty("/CreditNotes")) || [],
                    "PowoModel": this._oPowoModel,
                    "AorState": this._aorState
                });

                // Header
                let oInvoiceHeader = {};
                const oHeaderFields = this._oHelpModel.getProperty("/zpr_invoice");
                if (!_.isEmpty(oHeaderFields)) {
                    oInvoiceHeader = _.pick(oInvoiceDeep, _.keys(oHeaderFields));
                    const oInvoiceHeaderInternal = _.mapKeys(oInvoiceHeader, (value, key) => {
                        return _.get(oHeaderFields, key, key);
                    });
                    aRequestData.push({
                        name: "ZPR_INVOICE",
                        value: JSON.stringify(oInvoiceHeaderInternal)
                    });
                }
                if (_.isEmpty(oInvoiceHeader)) {
                    return;
                }

                // Table control: Link to NA
                const oNaFields = this._oHelpModel.getProperty("/zpr_invlink_na");
                if (!_.isEmpty(oNaFields)) {
                    const oNaKeys = _.keys(oNaFields);
                    const aToNaInternal = oInvoiceDeep.ToInvoiceLinkNA.map(oNa => {
                        let oNaTransformed = _.pick(oNa, _.keys(oNaFields));
                        return _.mapKeys(oNaTransformed, (value, key) => {
                            return _.get(oNaFields, key, key);
                        });
                    });
                    aRequestData.push({
                        name: "GT_FIO_LINK_NA",
                        value: JSON.stringify(aToNaInternal)
                    });
                }

                // Table control: Link to POWO
                aRequestData.push({
                    name: "GT_TC_POWO",
                    value: JSON.stringify(this._oPowoModel.getProperty("/Powo") || {})
                });
                aRequestData.push({
                    name: "GT_TC_GRSE",
                    value: JSON.stringify(this._oPowoModel.getProperty("/Grse") || {})
                });

                // Table control: Link to AOR
                aRequestData.push({
                    name: "GT_TC_AOR",
                    value: JSON.stringify(this._aorState.Aor || {})
                });

                // Training Information
                const trainingInfoModel = this._oTrainingInformationModel;
                if (trainingInfoModel) {
                    const aTrainingInfoInternal = trainingInfoModel.getProperty("/TrainingInformationInternal") || [];
                    aRequestData.push({
                        name: "GT_UTI_FINAL",
                        value: JSON.stringify(aTrainingInfoInternal)
                    });
                }

                // Credit notes section
                const aCreditNotes = _.clone(this._oCreditNoteModel.getProperty("/CreditNotes")) || [];
                const aCreditNotesInternal = aCreditNotes.map(oCn => {
                    return {
                        invId: oCN.InvoiceID
                    };
                });
                aRequestData.push({
                    name: "GT_FIO_CREDIT_NOTES",
                    value: JSON.stringify(aCreditNotesInternal)
                });

                // Remarks as a parameter
                const remarksTab = oInvoiceDeep.ToRemark.map(function (value) {
                    return {
                        tdformat: "*",
                        tdline: value.LineText
                    }
                });
                aRequestData.push({
                    name: "GT_FIO_REMARKS",
                    value: JSON.stringify(remarksTab)
                });

                //Remarks as a table of lines of 128 char each
                const sRemarks = this._viewModel.getProperty("/Remarks");
                const aRemarkLine128 = sRemarks.match(/.{1,128}/g) || [];
                const aRemarkLineTab = aRemarkLine128.map((remarkLine) => {
                    return {line: remarkLine};
                });
                aRequestData.push({
                    name: "GT_TABLE_LINE2",
                    value: JSON.stringify(aRemarkLineTab)
                });

                // Other global fields for backend program (always sent regardless of action/subAction)
                aRequestData.push(...[{
                    name: "GV_INVOICE_NUM",
                    value: JSON.stringify(oInvoiceHeader.InvoiceID)
                }, {
                    name: "GV_TR_MODE",
                    value: JSON.stringify("D")
                }, {
                    name: "GV_OK_CODE",
                    value: JSON.stringify(oAction.action)
                }, {
                    name: "GV_FIO_SUBFUNCTION",
                    value: JSON.stringify(oAction.subAction)
                }, {
                    name: "GV_FIO_WILL_UPDATE_POWO",
                    value: JSON.stringify(true)
                }]);

                // Other action parameters specifically for the action to be executed
                _.forOwn(mParameters.actionParameters, (value, key) => {
                    aRequestData.push({
                        name: key,
                        value: JSON.stringify(value)
                    });
                });

                // Convert request data to JSON string
                oAction.requestData = JSON.stringify(aRequestData);
                this.invMaintainService.executeAction(oAction)
                    .then(resolve)
                    .catch(reject);
            });
        },

        doActionAppState: function (mParameters) {
            return new Promise((resolve, reject) => {
                if (_.isEmpty(this.appState.invDoc.header)) {
                    reject("Invoic header is blank. Action cannot continue.");
                    return;
                }
                // Initialize Action entity properties
                let oAction = {
                    action: mParameters.action,
                    subAction: mParameters.subAction,
                    requestData: "",
                    responseCode: "",
                    responseMessage: "",
                    responseData: ""
                };

                let aRequestData = [];

                // Header
                aRequestData.push({
                    name: "ZPR_INVOICE",
                    value: JSON.stringify(this.appState.invDoc.header)
                });

                // Table control: Link to NA
                aRequestData.push({
                    name: "GT_FIO_LINK_NA",
                    value: JSON.stringify(this.appState.invDoc.linkNa.toJS())
                });

                // Table control: Link to POWO
                aRequestData.push({
                    name: "GT_TC_POWO",
                    value: JSON.stringify(this.appState.invDoc.linkPo.po.toJS() || [])
                });
                aRequestData.push({
                    name: "GT_TC_GRSE",
                    value: JSON.stringify(this.appState.invDoc.linkPo.gr.toJS() || [])
                });

                // Table control: Link to AOR
                aRequestData.push({
                    name: "GT_TC_AOR",
                    value: JSON.stringify(this.appState.invDoc.linkAor.toJS() || [])
                });

                // Training Information
                aRequestData.push({
                    name: "GT_UTI_FINAL",
                    value: JSON.stringify(this.appState.invDoc.trainingInfo.toJS() || [])
                });

                // Credit notes section
                aRequestData.push({
                    name: "GT_FIO_CREDITNOTES",
                    value: JSON.stringify(this.appState.invDoc.creditNotes.toJS() || [])
                });

                // Remarks as a parameter
                const aRemarksSplit = this.appState.invDoc.remarks.match(/.{1,132}/g) || [];
                const remarksTab = aRemarksSplit.map(function (value) {
                    return {
                        tdformat: "*",
                        tdline: value
                    }
                });
                aRequestData.push({
                    name: "GT_FIO_REMARKS",
                    value: JSON.stringify(remarksTab || [])
                });

                //Remarks as a table of lines of 128 char each
                const sRemarks = this.appState.invDoc.remarks;
                const aRemarkLine128 = sRemarks.match(/.{1,128}/g) || [];
                const aRemarkLineTab = aRemarkLine128.map((remarkLine) => {
                    return {line: remarkLine};
                });
                aRequestData.push({
                    name: "GT_TABLE_LINE2",
                    value: JSON.stringify(aRemarkLineTab)
                });

                // Other global fields for backend program (always sent regardless of action/subAction)
                aRequestData.push(...[{
                    name: "GV_INVOICE_NUM",
                    value: JSON.stringify(this.appState.invDoc.header.invId)
                }, {
                    name: "GV_TR_MODE",
                    value: JSON.stringify("D")
                }, {
                    name: "GV_OK_CODE",
                    value: JSON.stringify(oAction.action)
                }, {
                    name: "GV_FIO_SUBFUNCTION",
                    value: JSON.stringify(oAction.subAction)
                }, {
                    name: "GV_FIO_WILL_UPDATE_POWO",
                    value: JSON.stringify(true)
                }]);

                // Other action parameters specifically for the action to be executed
                _.forOwn(mParameters.actionParameters, (value, key) => {
                    aRequestData.push({
                        name: key,
                        value: JSON.stringify(value)
                    });
                });

                // Convert request data to JSON string
                oAction.requestData = JSON.stringify(aRequestData);
                this.invMaintainService.executeAction(oAction)
                    .then(resolve)
                    .catch(reject);
            });
        },

        handleRouteBack: function (sText) {
            // this.handleNotYetImplemented(oEvent);
            sap.ui.require([
                "sg/gov/jtc/JTC-InvoiceApp/controller/RouteBack"
            ], function (RouteBack) {
                if (!this.routeBackDialog) {
                    this.routeBackDialog = new RouteBack(this.getView());
                }
                this.routeBackDialog.open({
                    dialogTitle: sText,
                    routeBackButtonText: sText,
                    remarks: this.appState.invDoc.remarks,
                }).then(this.afterRouteBackDialog.bind(this));
            }.bind(this));
        },

        afterRouteBackDialog: function (mParameters) {
            if (mParameters.routeBack) {
                this.appState.invDoc.remarks = mParameters.remarks;
                this.doActualRouteBack(mParameters.routeBackButtonText)
                    .then(oAction => {
                        if (oAction.responseCode === "OK") {
                            this.displayMessageAndExit(mParameters.dialogTitle, oAction);
                        } else {
                            this.extractAndDisplayActionResponse(oAction);
                        }
                        return null;
                    })
                    .catch(this.popupSystemError.bind(this))
                    .finally(() => this.appState.view.processViewBusy = false);
            }
        },

        doActualRouteBack: function (sButtonText) {
            let sOkCode = "ROUTEBAC";
            switch (sButtonText) {
                case "Route Back":
                    sOkCode = "ROUTEBAC";
                    break;
                case "Route Back to RO":
                    sOkCode = "ROUTEBAC";
                    break;
                case "Route Back to FVO":
                    sOkCode = "ROUTEBAC_FVO";
                    break;
                default:
                    sOkCode = "ROUTEBAC";
                    break;
            }
            return this.appState.routeBackInvoice({
                GV_OK_CODE: sOkCode
            });
        },

        handleRelatedDocuments: function (oEvent) {
            // this.handleNotYetImplemented(oEvent);
            sap.ui.require([
                "sg/gov/jtc/JTC-InvoiceApp/controller/RelatedDocumentsDialog"
            ], function (RelatedDocumentsDialog) {
                if (!this.relatedDocumentsDialog) {
                    this.relatedDocumentsDialog = new RelatedDocumentsDialog(this.getView());
                }
                this.relatedDocumentsDialog.open({
                    relatedDocuments: this.appState.invDoc.relatedDocuments
                });
            }.bind(this));
        },

        displayMessageAndExit: function (sTitle, oAction) {
            const aGtMessage = this.getActionField(oAction.responseData, "GT_MESSAGE");
            console.log("GT_MESSAGE: ", aGtMessage);
            let sMessage = this.getActionField(oAction.responseData, "GV_FIO_RETURN_INFO_MSG") || oAction.responseMessage;
            if (!sMessage) {
                console.warn("Unable to find success/info message to display in dialog. Exiting anyway.");
                this.handleExit();
                return;
            }
            if (sMessage) {
                MessageBox.information(sMessage, {
                    title: sTitle,
                    onClose: this.handleExit.bind(this),
                    styleClass: this.contentDensityClass
                });
            }
        },

        _getFutureRemarks: function (dInvoiceDate, dPowoDate, sRemark) {
            return new Promise((resolve, reject) => {
                const sInvoiceDate = moment(dInvoiceDate).format("DD.MM.YYYY");
                const sPowoDate = moment(dPowoDate).format("DD.MM.YYYY");

                const dialog = new sap.m.Dialog({
                    title: "Enter Remarks",
                    type: "Message",
                    content: [
                        new sap.m.VBox({
                            items: [
                                new sap.m.HBox({
                                    items: [
                                        new sap.m.Text({text: "Invoice Date:", width: "6rem"}),
                                        new sap.m.Text({text: sInvoiceDate})
                                    ]
                                }),
                                new sap.m.HBox({
                                    items: [
                                        new sap.m.Text({text: "PO/WO Date:", width: "6rem"}),
                                        new sap.m.Text({text: sPowoDate})
                                    ]
                                }).addStyleClass("sapUiTinyMarginTop"),
                                new sap.m.Label({
                                    text: "Indicate the reason that PO/WO was raised after the invoice was issued:",
                                    labelFor: "futurePoRemarksTextarea"
                                }).addStyleClass("sapUiSmallMarginTop"),
                                new sap.m.TextArea("futurePoRemarksTextarea", {
                                    liveChange: function (oEvent) {
                                        const sText = oEvent.getParameter("value");
                                        dialog.getBeginButton().setEnabled(sText.length > 0);
                                    },
                                    width: "100%",
                                    placeholder: "Add remarks (required, max. 120 characters)",
                                    maxLength: 120,
                                    value: sRemark
                                }).addStyleClass("sapUiTinyMarginTop")
                            ]
                        })
                    ],
                    beginButton: new sap.m.Button({
                        text: "Submit",
                        type: "Emphasized",
                        enabled: !_.isEmpty(sRemark),
                        press: function () {
                            var sNewFuturePoRemark = sap.ui.getCore().byId("futurePoRemarksTextarea").getValue();
                            resolve(sNewFuturePoRemark);
                            dialog.close();
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        type: "Ghost",
                        press: function () {
                            resolve("");
                            dialog.close();
                        }
                    }).addStyleClass("jtcSmallMarginRight"),
                    afterClose: function () {
                        dialog.destroy();
                    }
                }).addStyleClass(this.contentDensityClass);
                dialog.open();
            });
        },

        // Edit Invoice
        handleEditInvoice: function (oEvent) {
            this._uiState.editMode = true;
            //this._viewModel.setProperty("/editMode", true);
            this._viewModel.setProperty("/displayMode", false);
            this._viewModel.setProperty("/editButton", false);
            this._viewModel.setProperty("/naTableMode", "Delete");
            this._viewModel.setProperty("/cnTableMode", "Delete");
            this._viewModel.setProperty("/PoTableMode", "Delete");
            this._viewModel.setProperty("/GrTableMode", "MultiSelect");
            this._viewModel.setProperty("/AorTableMode", "Delete");
        },

        // Display Mode
        handleDisplayInvoice: function (oEvent) {
            this._uiState.editMode = false;
            //this._viewModel.setProperty("/editMode", false);
            this._viewModel.setProperty("/displayMode", true);
            // Edit button for Draft status
            if (this._oLocalModel.getProperty("/Status") === "01") {
                this._viewModel.setProperty("/editButton", true);
            }
            this._viewModel.setProperty("/naTableMode", "None");
            this._viewModel.setProperty("/cnTableMode", "None");
            this._viewModel.setProperty("/PoTableMode", "None");
            this._viewModel.setProperty("/GrTableMode", "None");
            this._viewModel.setProperty("/AorTableMode", "None");
        },

        handlePrintInvoice: function (oEvent) {
            const oView = this.getView();
            const sButtonIdInternal = "btn-print-internal";
            const sButtonIdExternal = "btn-print-external";
            const sButtonIdItemDetail = "btn-print-item";
            const sFragmentName = "jtc.print.inv.fragment";
            if (!this._printSheet) {
                const oPrintController = {
                    handlePrintFormat: function (oEvent) {
                        const whichButton = oEvent.getSource().getId();
                        let sFormat = "";
                        switch (whichButton) {
                            case this.getView().createId(sButtonIdInternal):
                                sFormat = "I";
                                break;
                            case this.getView().createId(sButtonIdExternal):
                                sFormat = "E";
                                break;
                            default:
                                sFormat = "D";
                                break;
                        }
                        const sInvoiceID = this.appState.invDoc.header.invId;
                        const sLinkTo = this.appState.invDoc.header.linkInvoice; // _oLocalModel.getProperty("/LinkInvoiceTo");
                        const sCATaxCode = this.appState.aux.customerAccountingTaxCode || "Dummy"; //this._viewModel.getProperty("/CustomerAccountingTaxCode") || "Dummy";
                        let nGstAmount = 0;

                        if (sLinkTo === "NA") {
                            const aToInvoiceLinkNA = this.appState.invDoc.linkNa; //this._oLocalModel.getProperty("/ToInvoiceLinkNA");
                            const aCustomerAccounting = _.filter(aToInvoiceLinkNA, _.matchesProperty("taxCode", sCATaxCode));
                            if (aCustomerAccounting.length > 0) {
                                nGstAmount = _.sumBy(aCustomerAccounting, "preGstAmt");
                            }
                        }
                        if (sInvoiceID) {
                            const sUrl = `/sap/opu/odata/sap/ZMMP_INV_MAINTAIN_SRV/InvoicePDFSet(InvoiceID='${sInvoiceID}')/$value` +
                                `?$filter=Format eq '${sFormat}' and GstAmount eq ${nGstAmount}`;
                            // const sIframeUrl = `pdfjs/web/viewer.html?file=${sUrl}`;
                            // this._viewModel.setProperty("/PdfViewer", `<iframe width="100%" height="500px" src="${sIframeUrl}"></iframe>`);
                            if (!this._pdfViewer) {
                                this._pdfViewer = new sap.m.PDFViewer({
                                    errorPlaceholderMessage: "PDF not loaded",
                                    title: "Print Invoice"
                                });
                                this.getView().addDependent(this._pdfViewer);
                            }
                            //todo: data/blob uri not supported by IE11
                            const oDevice = this.getOwnerComponent().getModel("device");
                            this._pdfViewer.setSource(sUrl);
                            const bInternetExplorer = oDevice.getProperty("/browser/msie") || false;
                            if (bInternetExplorer) {
                                // window.open(sUrl, "_blank");
                                this._pdfViewer.downloadPDF();
                            } else {
                                this._pdfViewer.open();
                            }

                            // if (!this.draggableDialog) {
                            //     this.draggableDialog = new sap.m.Dialog({
                            //         title: 'Print Invoice',
                            //         contentWidth: "99%",
                            //         contentHeight: "99%",
                            //         draggable: true,
                            //         content: new sap.m.ScrollContainer({
                            //             height: "100%",
                            //             width: "100%",
                            //             horizontal: false,
                            //             vertical: true,
                            //             content: new sap.m.FlexBox({
                            //                 direction: "Column",
                            //                 renderType: "Div",
                            //                 class: "sapUiSmallMargin",
                            //                 items: new sap.ui.core.HTML({
                            //                     content: { path: "/PdfViewer", model: "view" }
                            //                 })
                            //             })
                            //         }),
                            //         beginButton: new sap.m.Button({
                            //             text: 'Close',
                            //             press: function () {
                            //                 this.draggableDialog.close();
                            //             }.bind(this)
                            //         })
                            //     });
                            //
                            //     //to get access to the global model
                            //     this.getView().addDependent(this.draggableDialog);
                            // }
                            // this.draggableDialog.open();
                        }
                    }.bind(this)
                };
                sap.ui.jsfragment(sFragmentName, {
                    createContent: function (oController) {

                        const print_sel = new sap.m.ActionSheet(oView.createId("print-select"), {
                            title: "Select format",
                            showCancelButton: true,
                            placement: "Bottom",
                            buttons: [
                                new sap.m.Button({
                                    id: oView.createId(sButtonIdInternal),
                                    text: "Internal Format",
                                    press: oController.handlePrintFormat
                                }),
                                new sap.m.Button({
                                    id: oView.createId(sButtonIdExternal),
                                    text: "External Format",
                                    press: oController.handlePrintFormat
                                }),
                                new sap.m.Button({
                                    id: oView.createId(sButtonIdItemDetail),
                                    text: "Item Detail",
                                    press: oController.handlePrintFormat
                                })
                            ]
                        });
                        return print_sel;
                    }
                });

                this._printSheet = sap.ui.jsfragment(oView.createId("jtc-print-inv"), sFragmentName, oPrintController);
                oView.addDependent(this._printSheet);
            }
            this._printSheet.openBy(oEvent.getSource());
        },

        handleShowCreditNotes: function () {
            // Toggle "Add Credit Note" button visibility
            mobx.set(this.appState.view, "cnButtonVisible", false);
        },

        _setupObservable: function () {
            const oController = this;
            // State
            this._uiState = mobx.observable({
                status: "",
                linkTo: "",
                fvoEditMode: false,
                get fvoOrRoEditMode() {
                    return this.editMode || this.fvoEditMode;
                },
                get editMode() {
                    //return oController._viewModel.getProperty("/editMode");
                    return this.status === "01"; //Draft
                },
                set editMode(value) {
                    oController._viewModel.setProperty("/editMode", value);
                },
                get displayMode() {
                    return !this.fvoOrRoEditMode;
                },
                get naTableMode() {
                    return this.fvoOrRoEditMode ? "Delete" : "None";
                },
                get linkToIndex() {
                    return _.findIndex(oController._oHelpModel.getProperty("/Links"), {Key: this.linkTo});
                },
                na: {
                    amounts: [],
                    get totalAmountBeforeGst() {
                        return _.sum(this.amounts);
                    }
                },
                po: {
                    assignee: [],
                    judgement: [],
                    get relatedContractsVisible() {
                        return this.assigneeTableVisible || this.judgementTableVisible;
                    },
                    get assigneeTableVisible() {
                        return this.assignee.length > 0;
                    },
                    get judgementTableVisible() {
                        return this.judgement.length > 0;
                    }
                },
                eccComputedFields: {
                    GV_PAY_DOCNUM: "",
                    GV_FMAS_POSTDT: "",
                    GV_PAY_CLEARDT: "",
                    GV_PERMIT_PAYEE_NM: "",
                    get gvFmasPostdt() {
                        if (!moment(this.GV_FMAS_POSTDT).isValid()) {
                            return "";
                        }
                        return moment(this.GV_FMAS_POSTDT).format("DD.MM.YYYY");
                    },
                    get gvPayCleardt() {
                        if (!moment(this.GV_PAY_CLEARDT).isValid()) {
                            return "";
                        }
                        return moment(this.GV_PAY_CLEARDT).format("DD.MM.YYYY");
                    }
                },
                permitPayee: "",
                get multiplePayeeButtonVisible() {
                    return this.permitPayee === "";
                },
                multiplePayees: [],
                currency: "SGD",
                get bForeignCurrency() {
                    return this.currency !== "SGD";
                },
                get expenseTypeVisible() {
                    return this.linkTo === "POWO" || this.linkTo === "AOR";
                },
                invoiceId: "",
                _relatedDocuments: [],
                get relatedDocuments() {
                    if (!this.invoiceId) {
                        return [];
                    }
                    oController.invMaintainService.retrieveRelatedDocuments(this.invoiceId)
                        .then((data) => {
                            this._relatedDocuments.replace(JSON.parse(data.results[0].Value));
                        });
                    return this._relatedDocuments;
                }
            });

            // Actions
            this._uiState.na.updateAmounts = mobx.action("na.updateAmounts", (aAmounts) => {
                this._uiState.na.amounts = aAmounts.map((amount) => parseFloat(amount));
            });

            this._uiState.updateLinkTo = mobx.action("updateLinkTo", (sLinkTo) => {
                this._uiState.linkTo = sLinkTo;
            });

            this._uiState.setEditMode = mobx.action("updateEditMode", (bEditMode) => {
                this._uiState.editMode = bEditMode;
            });

            this._uiState.setFvoEditMode = mobx.action("setFvoEditMode", (bFvoEditMode) => {
                this._uiState.fvoEditMode = bFvoEditMode;
            });

            this._uiState.po.setAssignee = mobx.action("setAssignee", (aAssignee) => {
                this._uiState.po.assignee = aAssignee;
                this._oPowoModel.setProperty("/Assignee", aAssignee);
            });

            this._uiState.po.setJudgement = mobx.action("setJudgement", (aJudgement) => {
                this._uiState.po.judgement = aJudgement;
                this._oPowoModel.setProperty("/Judgement", aJudgement);
            });

            this._uiState.resetState = mobx.action("resetSate", () => {
                const uiState = this._uiState;
                uiState.linkTo = "";
                uiState.na.amounts = [];
                uiState.po.assignee = [];
                uiState.po.judgement = [];
            });

            this._uiState.updateEccComputedField = mobx.action("updateEccComputedField", (sPath, sValue) => {
                const eccComputedFields = this._uiState.eccComputedFields;
                if (_.has(eccComputedFields, sPath)) {
                    _.set(eccComputedFields, sPath, sValue);
                }
            });

            this._uiState.updatePermittedPayee = mobx.action("updatePermittedPayee", sPermittedPayee => {
                this._uiState.permitPayee = sPermittedPayee;
                if (!sPermittedPayee) {
                    this._uiState.eccComputedFields.GV_PERMIT_PAYEE_NM = "Multiple payees";
                }
            });

            this._uiState.updateMultiplePayees = mobx.action("updateMultiplePayees", aMultiplePayees => {
                this._uiState.multiplePayees.replace(_.clone(aMultiplePayees));
            });

            this._uiState.updateCurrency = mobx.action("updateCurrency", sCurrency => {
                this._uiState.currency = sCurrency;
            });

            // Reactions
            this._disposeLinkWatcher = mobx.reaction(
                () => {
                    return this._uiState.linkTo;
                },
                (sLinkTo) => {
                    this._oLocalModel.setProperty("/LinkInvoiceTo", sLinkTo);
                    const linkToRadioButtonGroup = this.getView().byId("rbg-linkto");
                    linkToRadioButtonGroup.setSelectedIndex(oController._uiState.linkToIndex);
                    this._refreshProcurementDetails(sLinkTo);

                    if (sLinkTo !== "NA") {
                        if (typeof this._disposeUpdateSum === "function") {
                            this._disposeUpdateSum();
                        }
                        this._uiState.na.amounts = [];
                    }

                    if (sLinkTo !== "POWO") {
                        this._disposePowoRx();
                        this._uiState.po.assignee = [];
                        this._uiState.po.judgement = [];
                    }

                    // Setup reactions
                    const oViewModel = this._viewModel;
                    switch (sLinkTo) {
                        case "POWO":
                            this._showPOWOLink();
                            this._disposeRelatedContractsRx = mobx.autorun(() => {
                                this._oPowoModel.setProperty("/relatedContractsVisible", this._uiState.po.relatedContractsVisible);
                            }, {name: "updateRelatedContractsVisible"});
                            this._disposeAssigneeRx = mobx.autorun(() => {
                                this._oPowoModel.setProperty("/assigneeTableVisible", this._uiState.po.assigneeTableVisible);
                            }, {name: "updateAssigneeTableVisible"});
                            this._disposeJudgementRx = mobx.autorun(() => {
                                this._oPowoModel.setProperty("/judgementTableVisible", this._uiState.po.judgementTableVisible);
                            }, {name: "updateJudgementTableVisible"});
                            break;
                        case "AOR":
                            this._showAORLink();
                            break;
                        case "NA":
                            this._showNALink();
                            this._disposeUpdateSum = mobx.autorun(
                                () => {
                                    console.log("Update Sum:", this._uiState.na.totalAmountBeforeGst);
                                    this._oLocalModel.setProperty("/NATotalAmountBeforeGst", this._uiState.na.totalAmountBeforeGst);
                                },
                                {name: "updateNaSum"}
                            );
                            break;
                    }

                },
                {name: "watchLinkTo"}
            );
            this._uiModel = new MobxModel(this._uiState);
            this.getView().setModel(this._uiModel, "ui");
        },

        _disposePowoRx: function () {
            [this._disposeRelatedContractsRx, this._disposeAssigneeRx, this._disposeJudgementRx].map((fn) => {
                if (typeof fn === "function") {
                    fn();
                }
            });
        },

        _refreshProcurementDetails: function (sLinkTo) {
            if (sLinkTo !== "POWO") {
                this._oLocalModel.setProperty("/ToInvoiceLinkPOWO", []);
                const po = this._oPowoModel;
                po.setProperty("/relatedContractsVisible", false);
                po.setProperty("/assigneeTableVisible", false);
                po.setProperty("/judgementTableVisible", false);
                po.setProperty("/Powo", []);
                po.setProperty("/Grse", []);
                po.setProperty("/PowoLink", []);
                po.setProperty("/Assignee", []);
                po.setProperty("/Judgement", []);
            }
            if (sLinkTo !== "AOR") {
                this._oLocalModel.setProperty("/ToInvoiceLinkAOR", []);
            }
            if (sLinkTo !== "NA") {
                this._oLocalModel.setProperty("/ToInvoiceLinkNA", []);
                this._uiState.na.updateAmounts([]);
            }
            this.updateApproversList();
        },

        _setupAorObservable: function () {
            //Experimental
            const aorState = this._aorState;
            const uiState = this._uiState;
            const oViewModel = this.getView().getModel("view");
            const oController = this;
            const defaults = {
                get editMode() {
                    return uiState.fvoOrRoEditMode && !_.isEmpty(this.banfn);
                },

                get accntAssignEditable() {
                    return this.editMode && !this.projRelated;
                },
                get accntAssignRx() {
                    return this.accntAssign;
                },
                set accntAssignRx(value) {
                    this.accntAssign = value;
                    if (value !== "ASSET") {
                        this.assetCombined = "";
                    }
                    if (!_.startsWith(value, "GL")) {
                        this.glAccount = "";
                    }
                    if (value !== "GLRE") {
                        this.estateRx = "";
                        this.landRx = "";
                        this.buildingRx = "";
                        this.reobjectentityRx = "";
                        this.imkey = "";

                    }
                    if (value !== "GLCC") {
                        this.costCenter = "";
                    }
                },

                get assetNoEditable() {
                    return this.editMode && this.accntAssignEditable && this.accntAssign === "ASSET";
                },
                get glAccountEditable() {
                    return this.editMode && this.accntAssignEditable && _.startsWith(this.accntAssign, "GL");
                },
                get costCenterEditable() {
                    return this.editMode && this.accntAssignEditable && _.endsWith(this.accntAssign, "CC");
                },

                get estateRx() {
                    return this.estate;
                },
                set estateRx(value) {
                    this.estate = value;
                    if (!value) {
                        this.realEstate = "";
                        return;
                    }
                    if (value && !this.building && !this.land && !this.reobjectentity) {
                        this.realEstate = value;
                    }
                },

                get landRx() {
                    return this.land;
                },
                set landRx(value) {
                    this.land = value;
                    if (value && !this.building) {
                        this.realEstate = value;
                    }
                },

                get buildingRx() {
                    return this.building;
                },
                set buildingRx(value) {
                    this.building = value;
                    if (value) {
                        this.realEstate = value;
                    }
                },

                get reobjectentityRx() {
                    return this.reobjectentity;
                },
                set reobjectentityRx(value) {
                    this.reobjectentity = value;
                    if (value && !this.land && !this.building) {
                        this.realEstate = value;
                    }
                },

                get preGstAmtEditable() {
                    return uiState.editMode && !_.isEmpty(this.banfn);
                },
                get banfnEditable() {
                    return uiState.editMode;
                },
                // "taxCode": "P7",
                get fundCategoryEditable() {
                    return this.editMode && this.projRelated;
                },
                get taxDescrEditable() {
                    return this.editMode;
                },
                get realEstateEditable() {
                    return this.editMode && this.accntAssignEditable && _.endsWith(this.accntAssign, "RE");
                },

                get itemnoFormatted() {
                    return _.trimStart(this.itemno, "0");
                },

                get assetCombined() {
                    let combined = _.trimStart(this.assetNo, "0");
                    if (combined === "") {
                        return combined;
                    }
                    if (this.subAssetNo) {
                        let subAssetNoTrimmed = _.trimStart(this.subAssetNo, "0");
                        subAssetNoTrimmed = subAssetNoTrimmed === "" ? "0" : subAssetNoTrimmed;
                        combined = combined + "/" + subAssetNoTrimmed;
                    }
                    return combined;
                },

                set assetCombined(value) {
                    if (value === "") {
                        this.assetNo = "";
                        this.subAssetNo = "";
                        return;

                    }
                    let asset = value.split("/");
                    if (asset.length > 0) {
                        this.assetNo = asset[0];
                        this.subAssetNo = asset[1] || "0";
                    }
                },

                get glAccountFormatted() {
                    return _.trimStart(this.glAccount, "0");
                },
                set glAccountFormatted(value) {
                    this.glAccount = value;
                },

                get preGstAmtFormatted() {
                    if (!this.preGstAmt) {
                        return "";
                    }
                    return (parseFloat(this.preGstAmt).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString());
                },
                set preGstAmtFormatted(value) {
                    this.preGstAmt = value;
                },

                get realEstateComputed() {
                    return this.realEstate;
                },

                set realEstateComputed(value) {
                    this.realEstate = value;
                    const iIndex = oController._aorState.Aor.indexOf(this);
                    oController.updateAorLine();
                },

                get banfnRx() {
                    return this.banfn;
                },
                set banfnRx(value) {
                    this.banfn = value;
                    const iIndex = oController._aorState.Aor.indexOf(this);
                    oController.updateAorLine();
                },

                get projRelated() {
                    const aorProj = oController._aorState.AorProj.toJS();
                    const oAorProj = _.find(aorProj, {aorNo: this.banfn});
                    if (oAorProj) {
                        return oAorProj.projRelExp === "YES";
                    }
                    return false;
                }
            };

            aorState.setAor = mobx.action("setAor", function (aAor) {
                const aAorObservables = aAor.map(function (obj) {
                    const obx = mobx.observable(defaults);
                    mobx.extendObservable(obx, obj);
                    return obx;
                });
                aorState.Aor.replace(mobx.observable(aAorObservables));
            });

            aorState.addAor = mobx.action("addAor", function (oAor) {
                const itemno = (this.Aor.length + 1) * 10;
                oAor.itemno = itemno;
                const obx = mobx.observable(defaults);
                mobx.extendObservable(obx, oAor);
                this.Aor.push(obx);
            });

            aorState.removeAor = mobx.action("removeAor", function (aorToRemove) {
                this.Aor.remove(aorToRemove);
                this.Aor.forEach((oAor, index) => {
                    oAor.itemno = _.padStart((index + 1) * 10, 5, "0");
                });
            });

            aorState.getNewAor = function () {
                const sFields = "accntAssign assetNo banfn building costCenter delInd estate fundCategory fundcat " +
                    "glAccount imkey invId invRefnum itemno land lineNumber mandt preGstAmt realEstate " +
                    "reobjectentity selcl subAssetNo taxCode taxDescr zzcrsid zzpernr";
                const oAor = sFields.split(" ")
                    .reduce((obj, name) => {
                        obj[name] = (name === "preGstAmt") ? 0 : "";
                        return obj;
                    }, {});
                return oAor;
            }

            aorState.setAorProj = mobx.action("setAorProj", function (aAorProj) {
                const aAorProjObservables = aAorProj.map(function (obj) {
                    const obx = mobx.observable(obj);
                    return obx;
                });
                this.AorProj.replace(mobx.observable(aAorProjObservables));
            });

            aorState.Aor = mobx.observable.array([aorState.getNewAor()]);
            aorState.AorProj = mobx.observable.array([]);

            this.disposeChangeAccountAssignmentRx = mobx.reaction(
                () => {
                    return aorState.Aor.map(o => o.accntAssign);
                },
                (aAccountAssignments) => {
                    this.updateApproversList();
                },
                {
                    name: "Update approvers list",
                    delay: 500
                }
            );

            //for debugging only
            // mobx.autorun(() => {
            //     const aAcctAssign = aorState.Aor.map(value => value.accntAssign) || [];
            //     console.log("Account Assignments: ", aAcctAssign);
            // });
            // mobx.autorun(() => {
            //     const aTax = aorState.Aor.map(value => value.taxDescr) || [];
            //     console.log("Tax Desc: ", aTax);
            // });
        },

        retrieveExpenseTypes: function () {
            this.invCommonService.retrieveExpenseTypes()
                .then(aExpenseTypes => {
                    this._oHelpModel.setProperty("/ExpenseTypes", aExpenseTypes);
                });
        },

        handleChangeExpenseType: function (oEvent) {
            // try {
            //     const oExpenseType = oEvent.getParameter("selectedItem").getBindingContext().getObject();
            //     this.appState.invDoc.header.expenseType = oExpenseType.expenseType;
            //     this.appState.invDoc.header.subexpenseType = oExpenseType.subExpenseType;
            // } catch (e) {
            //     console.error(e);
            // }
        },

        // onAddAttachment: function (oEvent) {
        //     // debugger;
        //     // MOVED to BaseController.js
        // },

        onDeleteAttachment: function (oEvent) {
            console.log("Delete Attachment");
        },

        onFileRenamed: function (oEvent) {
        },

        onUploadComplete: function (oEvent) {
            this.onUploadCompleteBase(oEvent)
                .then(() => {
                    //Any processing after upload, we will put here
                });
        },

        attachmentSyncer: function () {
            mobx.autorun(() => {
                const attachments = this.appState.invDoc.attachments.map(att => att);
                this.syncUploadCollectionItems(attachments);
            }, {name: "Attachment/UploadCollection Sync"})
        },

        syncUploadCollectionItems: function (aAttachments) {
            const oUploadCollection = this.getView().byId("UploadCollection");
            if (!oUploadCollection) {
                console.error("UploadCollection control not found. This is unexpected.")
                return;
            }
            this.appState.view.attachmentSectionBusy = true;
            oUploadCollection.removeAllItems().forEach(removed => {
                removed.destroy();
            });
            aAttachments.forEach((att, index) => {
                const sId = this.getView().createId("att-" + index.toString());
                const itemControl = this.getView().byId(sId);
                if (itemControl) {
                    itemControl.destroy();
                }
                oUploadCollection.addItem(new sap.m.UploadCollectionItem(sId, {
                    documentId: att.Zattchid,
                    fileName: att.Zfname,
                    mimeType: att.Filetype,
                    url: att.__metadata.media_src,
                    statuses: [
                        new sap.m.ObjectStatus({
                            title: "Status",
                            text: "Uploaded"
                        })
                    ]
                }));
            });
            this.appState.view.attachmentSectionBusy = false;
        },

        handleGrCheckbox: function (oEvent) {
            try {
                const oGr = oEvent.getSource().getBindingContext().getObject();
                if (oGr) {
                    oGr.selcl = oEvent.getParameter("selected") ? "X" : "";
                }
            } catch (e) {
                console.error(e);
            }
        },

        handleGrCheckboxSelectAll: function (oEvent) {
            const sSelected = oEvent.getParameter("selected") ? "X" : "";
            this.appState.invDoc.linkPo.gr.forEach(oGr => {
                oGr.selcl = sSelected;
            });
        },

        handleAddPowo: function (oEvent) {
            sap.ui.require(["sg/gov/jtc/JTC-InvoiceApp/controller/POWOSearch"], function (POWOSearch) {
                if (!this.powoSearch) {
                    this.powoSearch = new POWOSearch();
                }
                let sRefDocNo = "";
                if (this.appState.invDoc.linkPo.po.length < 1) {
                    sRefDocNo = this.appState.invDoc.header.refDocNo;
                }
                this.powoSearch.open(this.getView(), {
                    PurchasingGroup: this.appState.invDoc.header.purchGrp,
                    VendorID: this.appState.invDoc.header.vendorId,
                    ReferenceDocNumber: sRefDocNo
                }).then(oPowo => {
                    const sPoNumber = _.get(oPowo, "ebeln", "");
                    if (!sPoNumber) {
                        return;
                    }
                    this.appState.addPo(sPoNumber);
                });
            }.bind(this));
        },

        handleRemovePowo: function (oEvent) {
            const sPath = oEvent.getParameter("listItem").getBindingContextPath();
            const indexToRemove = parseInt(sPath.split("/").pop(), 10);
            this.appState.removePo(indexToRemove);
        },

        handleAddAor: function () {
            this.appState.addBlankAor();
        },

        handleDeleteAor: function (oEvent) {
            const sPath = oEvent.getParameters().listItem.getBindingContext().getPath();
            const iIndex = parseInt(sPath.split("/").pop(), 10);
            this.appState.removeAor(iIndex);
        },

        popupSystemError: function () {
            const sSystemError = "System error. Try again or contact system administrator.";
            MessageBox.error(sSystemError, {
                styleClass: this.contentDensityClass
            });
            this.oMessageManager.addMessages(new Message({
                type: MessageType.Error,
                message: sSystemError
            }));
        },

        handleOpenDocument: function (sModule, sDocumentNo) {
            let sDocType = "";
            if (sModule === "GR/SE") {
                const oGrExtra = _.find(this.appState.invDoc.linkPo.grExtra, {grseNum: sDocumentNo});
                if (oGrExtra) {
                    sDocType = oGrExtra.doctyp;
                }
            }
            this.navToRelatedDocument(sModule, sDocumentNo, sDocType);
        }
    });
});