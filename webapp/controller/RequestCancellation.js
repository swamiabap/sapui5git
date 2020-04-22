/* global _ */
/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel"
], function (ManagedObject, MobxModel) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.RerouteDialog", {

        constructor: function (oView) {
            this.view = oView;
            this.appState = oView.getController().getOwnerComponent().getModel().getData();
        },

        exit: function () {
            this.takedownObservable();
        },

        handleAfterClose: function() {
            this.takedownObservable();
        },

        open: function (sStatus, sVerifyingOfficer, sRemarks) {
            return new Promise((resolve) => {
                // Create dialog
                this.setupObservable()
                    .then(() => {
                        if (!this.cancellationDialog) {
                            this.cancellationDialog = sap.ui.xmlfragment(
                                "sg.gov.jtc.JTC-InvoiceApp.view.RequestCancellation",
                                this
                            );
                            this.cancellationDialog.addStyleClass(this.view.getController().getOwnerComponent().getContentDensityClass());
                            this.view.addDependent(this.cancellationDialog);
                        }
                        this.cancellationDialog.setModel(this.model, "req");
                        this.cancellationDialog.open("");
                        const cancellationState = this.cancellationState;
                        cancellationState.status = sStatus;
                        cancellationState.verifyingOfficer = sVerifyingOfficer;
                        cancellationState.remarks = sRemarks;
                        this.resolveOpenPromise = resolve;
                    })
                    .catch(sError => {
                        resolve(false);
                    });
            });
        },

        handleRequestCancellation: function() {
            const cancellationState = this.cancellationState;
            this.appState.invDoc.remarks = cancellationState.remarks;
            cancellationState.verifyingOfficerInputBusy = true;
            cancellationState.dialogBusy = true;

            this.executeRequestCancellation(cancellationState.verifyingOfficer)
                .then(oAction => {
                    if (oAction.responseCode === "OK") {
                        this.resolveOpenPromise(true);
                    } else {
                        this.view.getController().extractAndDisplayActionResponse(oAction);
                        this.resolveOpenPromise(false);
                    }
                    this.cancellationDialog.close();
                })
                .catch(() => {
                    this.view.processViewBusy = false;
                    cancellationState.verifyingOfficerInputBusy = false;
                    this.handleClose();
                });
        },

        handleClose: function () {
            this.cancellationDialog.close();
            //Return false to signal no actual rerouting
            this.resolveOpenPromise(false);
        },

        setupObservable: function () {
            return new Promise((resolve, reject) => {
                const appState = this.appState;

                const cancellationState = mobx.observable({
                    status: "",
                    verifyingOfficer: "",
                    verifyingOfficers: [],
                    verifyingOfficerInputBusy: false,
                    dialogBusy: false,
                    get statusText() {
                        if (!this.status) {
                            return "";
                        }
                        return appState.statusStore.textOf(this.status);
                    },
                    remarks: ""
                });

                cancellationState.verifyingOfficerInputBusy = true;
                cancellationState.verifyingOfficer = "";
                this.retrieveData()
                    .then(oAction => {
                        const oController = this.view.getController();
                        const aVerifyingOfficers = oController.getActionField(oAction.responseData, "GT_FIO_REQ_CANC_VO");
                        cancellationState.verifyingOfficers =  aVerifyingOfficers;
                        console.log("VO List: ", aVerifyingOfficers);
                        cancellationState.verifyingOfficerInputBusy = false;
                        resolve(oAction);
                    })
                    .catch(sError => {
                        cancellationState.verifyingOfficerInputBusy = false;
                        reject(sError);
                    });

                this.model = new MobxModel(cancellationState);
                this.cancellationState = cancellationState;
            });
        },

        takedownObservable: function() {
            delete this.cancellationState;
            delete this.model;
        },

        retrieveData: function () {
            return this.appState.requestCancellationInit();
        },

        executeRequestCancellation: function (sVerifyingOfficer) {
            return this.appState.requestCancellation({
                GV_VO: sVerifyingOfficer
            });
        }
    });
});