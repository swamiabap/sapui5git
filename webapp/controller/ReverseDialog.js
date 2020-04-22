/* global _ */
/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel"
], function (ManagedObject, MobxModel) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.ReverseDialog", {

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
                        if (!this.reverseDialog) {
                            this.reverseDialog = sap.ui.xmlfragment(
                                "sg.gov.jtc.JTC-InvoiceApp.view.ReverseDialog",
                                this
                            );
                            this.reverseDialog.addStyleClass(this.view.getController().getOwnerComponent().getContentDensityClass());
                            this.view.addDependent(this.reverseDialog);
                        }
                        this.reverseDialog.setModel(this.model, "rev");
                        this.reverseDialog.open("");
                        this.resolveOpenPromise = resolve;
                    })
                    .catch(sError => {
                        resolve(false);
                    });
            });
        },

        handleReverse: function() {
            //Return true to signal to do actual reversal
            this.resolveOpenPromise({
                reverse: true,
                postingDate: this.reverseState.postingDate,
                reversalReason: this.reverseState.reversalReason,
                remarks: this.reverseState.remarks
            });
            this.reverseDialog.close();
        },

        handleClose: function () {
            //Return false to signal not to reverse
            this.resolveOpenPromise({
                reverse: false,
                postingDate: undefined,
                reversalReason: undefined,
                remarks: ""
            });
            this.reverseDialog.close();
        },

        setupObservable: function (mParameters) {
            return new Promise((resolve, reject) => {
                const postingDate = moment(mParameters.postingDate).isValid() ? mParameters.postingDate : moment().format("YYYY-MM-DD");
                const reverseState = mobx.observable({
                    reversalReason: "",
                    postingDate: postingDate,
                    remarks: mParameters.remarks,
                    reversalReasons: mParameters.reversalReasons,
                    reversalReasonInputBusy: false,
                    dateDisplayFormat: "dd.MM.YYYY",
                    dateValueFormat: "YYYY-MM-dd"
                });

                this.model = new MobxModel(reverseState);
                this.reverseState = reverseState;
                resolve();
            });
        },

        takedownObservable: function() {
            delete this.reverseState;
            delete this.model;
        }
    });
});