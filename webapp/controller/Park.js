/* global _ */
/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel"
], function (ManagedObject, MobxModel) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.Park", {

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
                        if (!this.parkDialog) {
                            this.parkDialog = sap.ui.xmlfragment(
                                "sg.gov.jtc.JTC-InvoiceApp.view.Park",
                                this
                            );
                            this.parkDialog.addStyleClass(this.view.getController().getOwnerComponent().getContentDensityClass());
                            this.view.addDependent(this.parkDialog);
                        }
                        this.parkDialog.setModel(this.model, "park");
                        this.parkDialog.open("");
                        this.resolveOpenPromise = resolve;
                    })
                    .catch(sError => {
                        resolve(false);
                    });
            });
        },

        handlePark: function() {
            //Return true to signal to do actual rerouting
            this.resolveOpenPromise({
                bPark: true,
                invoiceApprovingOfficer: this.parkState.invoiceApprovingOfficer,
                remarks: this.parkState.remarks
            });
            this.parkDialog.close();
        },

        handleClose: function () {
            //Return false to signal no actual rerouting
            this.resolveOpenPromise({
                bPark: false,
                invoiceApprovingOfficer: undefined,
                remarks: undefined
            });
            this.parkDialog.close();
        },

        setupObservable: function (mParameters) {
            return new Promise((resolve, reject) => {
                const parkState = mobx.observable({
                    invoiceApprovingOfficer: mParameters.invoiceApprovingOfficer,
                    invoiceApprovingOfficerInputBusy: false,
                    invoiceApprovingOfficers: mParameters.aInvoiceApprovingOfficers,
                    remarks: ""
                });

                this.model = new MobxModel(parkState);
                this.parkState = parkState;
                resolve();
            });
        },

        takedownObservable: function() {
            delete this.parkState;
            delete this.model;
        }
    });
});