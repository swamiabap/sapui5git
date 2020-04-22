/* global _ */
/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (ManagedObject, MobxModel, Filter, FilterOperator) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.ValueHelpAsset2", {

        constructor: function () {
            this.setupModel();
        },

        exit: function () {
            delete this._resolve;
            delete this._reject;
            this.valueHelpDialog.destroy();
            delete this.valueHelpDialog;
            delete this.searchState;
            delete this.searchModel;
        },

        open: function (oView, aRequestors) {

            // create value help dialog
            if (!this.valueHelpDialog) {
                this.valueHelpDialog = sap.ui.xmlfragment(
                    "sg.gov.jtc.JTC-InvoiceApp.view.ValueHelpRequestor",
                    this
                );
                this.valueHelpDialog.setModel(this.searchModel, "req");
                this.valueHelpDialog.addStyleClass(oView.getController().getOwnerComponent().getContentDensityClass());
                oView.getController().changeDialogButton(this.valueHelpDialog);
                oView.addDependent(this.valueHelpDialog);
            }
            this.searchModel.setProperty("/requestors", aRequestors);
            this.valueHelpDialog.open("");

            return new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
            });
        },

        handleSearch: function(oEvent) {
            const sValue = oEvent.getParameter("value");
            const aFilters = ["UserID", "FullName"].map(fieldName => new Filter(fieldName, FilterOperator.Contains, sValue));
            const oFilter = new Filter({
                filters: aFilters,
                and: false
            });
            const oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
            // this.searchState.setSearchTerm(sValue);
        },

        handleClose: function (oEvent) {
            const aSelectedContexts = oEvent.getParameter("selectedContexts");
            if (aSelectedContexts && aSelectedContexts.length > -1) {
                this._resolve(aSelectedContexts.map(ctx => ctx.getObject().UserID));
            }
            oEvent.getSource().getBinding("items").filter([]);
        },

        setupModel: function () {
            this.searchModel = new sap.ui.model.json.JSONModel({
                requestors: []
            }, false);
        }
    });
});