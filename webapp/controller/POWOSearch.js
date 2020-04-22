/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/model/formatter",
    "sap/ui/model/json/JSONModel",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvMaintainService",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel"
], function (ManagedObject, formatter, JSONModel, InvMaintenanceService, Filter, FilterOperator, MobxModel) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.POWOSearch", {
        formatter: formatter,

        constructor: function () {
            this.searchState = mobx.observable({
                searchTerm: "",
                ResultsTableBusy: false,
                poAll: [],
                get SearchPowo() {
                    const regex = RegExp(this.searchTerm, "i");
                    return this.poAll.filter(po => {
                        return regex.test(po.ebeln) || regex.test(po.txz01) || regex.test(po.name1);
                    });
                }
            });
            this._oSearchModel = new MobxModel(this.searchState);

            this._InvMaintainService = new InvMaintenanceService();
        },

        exit: function () {
            delete this._oSearchModel;
            this._PowoSearchDialog.destroy();
            delete this._PowoSearchDialog;
            delete this._InvMaintainService;
            delete this._powoSearchPromise;
            delete this.initialSearchValue;
        },

        open: function (oView, mParameters) {
            return new Promise((resolve, reject) => {
                this._oView = oView;
                const oController = oView.getController();
                if (!this._PowoSearchDialog) {
                    this._PowoSearchDialog = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.PowoSearch", this);
                    oView.addDependent(this._PowoSearchDialog);
                    jQuery.sap.syncStyleClass(oView.getController().getOwnerComponent().getContentDensityClass(), oView, this._PowoSearchDialog);
                    oController.setDialogButtonType(this._PowoSearchDialog._getCancelButton());
                    this._PowoSearchDialog.setModel(this._oSearchModel, "psearch"); //.bindElement("/");
                }
                //Attaching the confirm event handler manually here instead of in the xml fragment
                //mainly so that we can pass the "current" this (with the new promise) as the context (2nd argument)
                // oController._PowoSearchDialog.attachConfirm(this._handleClose, this);
                this.searchState.ResultsTableBusy = true;
                this._InvMaintainService.searchPowo(mParameters.PurchasingGroup, mParameters.VendorID, "", "", "", "")
                    .then(aSearchResults => {
                        const oPowoSearch = _.find(aSearchResults, {Name: "SearchPowo"});
                        const aPowoSearch = JSON.parse(oPowoSearch.Value);
                        this.searchState.poAll.replace(aPowoSearch);
                        this.searchState.ResultsTableBusy = false;
                        return aSearchResults;
                    }).finally(() => {
                        this.searchState.ResultsTableBusy = false;
                    });
                this.searchState.searchTerm = mParameters.ReferenceDocNumber;
                this._PowoSearchDialog.open(mParameters.ReferenceDocNumber);
                this._resolve = resolve;
            });
        },

        _handleSearch: function (oEvent) {
            this.searchState.searchTerm = oEvent.getParameter("value");
            // const aFilters = ["ebeln", "txz01", "konnr", "lifnr", "name1", "fullName"].map(field => {
            //     return new Filter(field, FilterOperator.Contains, sValue);
            // });
            // const oFilter = new Filter({
            //     filters: aFilters,
            //     and: false
            // });
            // oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        _handleClose: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                const oPowo = mobx.toJS(oSelectedItem.getBindingContext("psearch").getObject());
                this._resolve(oPowo);
            }
            // oEvent.getSource().getBinding("items").filter([]);
            // this._oView.getController()._PowoSearchDialog.detachConfirm(this._handleClose, this);
        }
    });
});