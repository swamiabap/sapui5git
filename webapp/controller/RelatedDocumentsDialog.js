/* global _ */
/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel",
    "sap/m/MessageToast"
], function (ManagedObject, MobxModel, MessageToast) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.RelatedDocumentsDialog", {

        constructor: function (oView) {
            this.view = oView;
        },

        exit: function () {
            this.takedownObservable();
        },

        handleAfterClose: function() {
            this.takedownObservable();
        },

        open: function (mParameters) {
            return new Promise((resolve) => {
                // Create dialog
                this.setupObservable(mParameters)
                    .then(() => {
                        if (!this.relatedDocumentsDialog) {
                            this.relatedDocumentsDialog = sap.ui.xmlfragment(
                                "sg.gov.jtc.JTC-InvoiceApp.view.RelatedDocumentsDialog",
                                this
                            );
                            this.relatedDocumentsDialog.addStyleClass(this.view.getController().getOwnerComponent().getContentDensityClass());
                            this.view.addDependent(this.relatedDocumentsDialog);
                        }
                        this.relatedDocumentsDialog.setModel(this.model, "rel");
                        this.relatedDocumentsDialog.open("");
                        this.resolveOpenPromise = resolve;
                    })
                    .catch(sError => {
                        resolve(false);
                    });
            });
        },

        handleClose: function () {
            this.relatedDocumentsDialog.close();
        },

        handleSelect: function (oEvent) {
            const selectedDocument = oEvent.getSource().getBindingContext("rel").getObject();
            if (!selectedDocument) {
                return;
            }
            let sModule = selectedDocument.moduleText || "";
            sModule = sModule.includes("Invoice") ? "INV" : sModule;
            const sDocNo = selectedDocument.docNum;
            let sAppName = "";
            let sAppPath = "";
            let sAction = "";

            switch(sModule) {
                case "AOR":
                    sAppName = "Z_AOR_REQ_V1";
                    sAppPath = "&/view/AorHeaderSet('" +  sDocNo + "')" ;
                    sAction = "display";
                    break;
                case "GR/SE":
                    sAppName = selectedDocument.docType === "SE" ? "Z_SE_REQ_V1" : "Z_GR_REQ_V1";
                    sAppPath = "&/HeaderSet/" + sDocNo;
                    sAction = "change";
                    break;
                case "PO/WO":
                    sAppName = "Z_POWO_REQ_V1";
                    sAppPath = "&/PO/Change/" + sDocNo;
                    sAction = "change";
                    break;
                case "INV":
                    //Comment this out inside INV app
                    //sAppName = "Z_INV_REQ_V1";
                    //sAppPath = "&/disp/InvoiceSet('" + invoice_id + "')";
                    //sAction = "display";
                    break;
                default:
                    MessageToast.show(`Navigation to ${sModule} is not yet supported.`);
                    break;
            }

            if(sModule === "AOR" || sModule === "GR/SE" || sModule === "PO/WO" || sModule === "INV") {
                this.onNavCrossApp(sAppName, sAction, sAppPath);
            }
        },

        onNavCrossApp : function(sAppName, sAction, sAppPath) {
            try {
                const oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                oCrossAppNavigator.isIntentSupported([sAppName + "-" + sAction])
                    .done(function(aResponses) {

                    })
                    .fail(function() {
                        new sap.m.MessageToast("Provide corresponding intent to navigate");
                    });
                // Generate the Hash to navigate
                const hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: sAppName,
                        action: sAction
                    }
                })) || "";

                //Generate a  URL for the second application
                const url = window.location.href.split("#")[0] + hash;
                //Navigate to second app
                //Second parameter "true" means to open in new page
                sap.m.URLHelper.redirect(url + sAppPath , true);
            }
            catch (e) {
                console.error(e);
                this.relatedDocumentsDialog.close();
            }
        },

        setupObservable: function (mParameters) {
            return new Promise((resolve, reject) => {
                const relatedDocState = mobx.observable({
                    relatedDocuments: mParameters.relatedDocuments
                });

                this.model = new MobxModel(relatedDocState);
                this.relatedDocState = relatedDocState;
                resolve();
            });
        },

        takedownObservable: function() {
            delete this.relatedDocState;
            delete this.model;
        }
    });
});