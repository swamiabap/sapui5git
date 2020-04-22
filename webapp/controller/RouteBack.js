/* global _ */
/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel"
], function (ManagedObject, MobxModel) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.RouteBack", {

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
                        if (!this.routeBackDialog) {
                            this.routeBackDialog = sap.ui.xmlfragment(
                                "sg.gov.jtc.JTC-InvoiceApp.view.RouteBack",
                                this
                            );
                            this.routeBackDialog.addStyleClass(this.view.getController().getOwnerComponent().getContentDensityClass());
                            this.view.addDependent(this.routeBackDialog);
                        }
                        this.routeBackDialog.setModel(this.model, "rb");
                        this.routeBackDialog.open("");
                        this.resolveOpenPromise = resolve;
                    })
                    .catch(sError => {
                        resolve(false);
                    });
            });
        },

        handleRouteBack: function() {
            //Return true to signal to do actual rerouting
            this.resolveOpenPromise({
                routeBack: true,
                remarks: this.routeBackState.remarks,
                routeBackButtonText: this.routeBackState.routeBackButtonText,
                dialogTitle: this.routeBackState.dialogTitle
            });
            this.routeBackDialog.close();
        },

        handleClose: function () {
            //Return false to signal no actual rerouting
            this.resolveOpenPromise({
                routeBack: false,
                remarks: undefined,
                routeBackButtonText: undefined,
                dialogTitle: undefined
            });
            this.routeBackDialog.close();
        },

        setupObservable: function (mParameters) {
            return new Promise((resolve, reject) => {
                const that = this;

                const routeBackState = mobx.observable({
                    remarks: mParameters.remarks,
                    dialogTitle: mParameters.dialogTitle ? mParameters.dialogTitle : "Route Back",
                    routeBackButtonText: mParameters.routeBackButtonText ? mParameters.routeBackButtonText : "Route Back"
                });

                this.model = new MobxModel(routeBackState);
                this.routeBackState = routeBackState;
                resolve();
            });
        },

        takedownObservable: function() {
            delete this.routeBackState;
            delete this.model;
        }
    });
});