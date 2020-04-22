/* global _ */
/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvCommonService"
], function (ManagedObject, MobxModel, InvCommonService) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.ValueHelpGL2", {

        constructor: function () {
            this.invCommonService = new InvCommonService();
            this.setupObservable();
        },

        exit: function () {
            delete this.invCommonService;
            delete this._resolve;
            delete this._reject;
            this.valueHelpDialog.destroy();
            delete this.valueHelpDialog;
            delete this.searchState;
            delete this.searchModel;
        },

        open: function (oView, sCompanyCode) {
            // create value help dialog
            if (!this.valueHelpDialog) {
                this.valueHelpDialog = sap.ui.xmlfragment(
                    "sg.gov.jtc.JTC-InvoiceApp.view.ValueHelpCostCenter2",
                    this
                );
                this.valueHelpDialog.setModel(this.searchModel, "costCenterSearch");
                this.valueHelpDialog.addStyleClass(oView.getController().getOwnerComponent().getContentDensityClass());
                oView.getController().changeDialogButton(this.valueHelpDialog);
                oView.addDependent(this.valueHelpDialog);
            }
            this.searchState.setCostCenters([]);
            this.valueHelpDialog.setBusy(true);
            this.valueHelpDialog.open("");

            // Read value help from backend
            this.invCommonService.retrieveCostCenters(sCompanyCode)
                .then(results => {
                    const aCostCenters = results.map((obj) => {
                        return _.omit(obj, ["__metadata"]);
                    });
                    this.searchState.setCostCenters(aCostCenters);
                    this.valueHelpDialog.setBusy(false);
                })
                .catch(() => {
                    this.valueHelpDialog.setBusy(false);
                });

            return new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
            });
        },

        handleSearch: function(oEvent) {
            const sValue = oEvent.getParameter("value");
            this.searchState.setSearchTerm(sValue);
        },

        handleClose: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                const sPathSelected = oSelectedItem.getBindingContext("costCenterSearch").getPath();
                const sCostCenterSelected = this.searchModel.getProperty(sPathSelected).CostCenter;
                this._resolve(sCostCenterSelected);
            }
            this.searchState.setSearchTerm("");
        },

        setupObservable: function () {
            const searchState = mobx.observable({
                costCenters: [],
                searchTerm: "",
                get costCentersFiltered() {
                    if (!this.searchTerm) {
                        return this.costCenters;
                    }
                    const sSearchRegEx = new RegExp(this.searchTerm, "i");
                    const aCostCenters = this.costCenters; //.toJS();
                    return aCostCenters.filter((oCostCenter) => {
                        const aValues = _.values(oCostCenter);
                        const bTermFound = _.some(aValues, (value) => {
                            return (value.match(sSearchRegEx) || []).length > 0;
                        });
                        return bTermFound;
                    });
                },

                setCostCenters(aCostCenters) {
                    this.costCenters = aCostCenters;
                },

                setSearchTerm(sTerm) {
                    this.searchTerm = sTerm;
                }
            }, {
                costCenters: mobx.observable.ref,
                setCostCenters: mobx.action,
                setSearchTerm: mobx.action
            });

            this.searchModel = new MobxModel(searchState);
            this.searchState = searchState;
        }
    });
});