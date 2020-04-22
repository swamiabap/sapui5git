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
            this.InvCommonService = new InvCommonService();
            this.setupObservable();
        },

        exit: function () {
            delete this.InvCommonService;
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
                    "sg.gov.jtc.JTC-InvoiceApp.view.ValueHelpGL2",
                    this
                );
                this.valueHelpDialog.setModel(this.searchModel, "glSearch");
                this.valueHelpDialog.addStyleClass(oView.getController().getOwnerComponent().getContentDensityClass());
                oView.getController().changeDialogButton(this.valueHelpDialog);
                oView.addDependent(this.valueHelpDialog);
            }
            this.searchState.setGl([]);
            this.searchState.setSearchTerm("");
            this.valueHelpDialog.setBusy(true);
            this.valueHelpDialog.open("");

            // Read value help from backend
            this.InvCommonService.retrieveGLAccounts(sCompanyCode)
                .then(results => {
                    const aGlAccounts = results.map((obj) => {
                        return _.omit(obj, ["__metadata"]);
                    });
                    this.searchState.setGl(aGlAccounts);
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
                const sPathSelected = oSelectedItem.getBindingContext("glSearch").getPath();
                const sGlSelected = this.searchModel.getProperty(sPathSelected).GLAccountNumber;
                this._resolve(sGlSelected);
            }
        },

        setupObservable: function () {
            const oGlAccount = {
                get glAccountFormatted() {
                    return _.trimStart(this.GLAccountNumber, "0");
                }
            };
            const searchState = mobx.observable({
                gl: [],
                searchTerm: "",
                get glFiltered () {
                    if (!this.searchTerm) {
                        return this.gl;
                    }
                    const sSearchRegEx = new RegExp(this.searchTerm, "i");
                    const aGl = this.gl.toJS();
                    return aGl.filter((oGl) => {
                        const aValues = _.values(oGl);
                        const bTermFound = _.some(aValues, (value) => {
                            return (value.match(sSearchRegEx) || []).length > 0;
                        });
                        return bTermFound;
                    });
                },

                setGl(aGl) {
                    const aGlObservables = aGl.map(function (obj) {
                        const obx = mobx.observable(oGlAccount);
                        mobx.extendObservable(obx, obj);
                        return obx;
                    });
                    this.gl.replace(aGlObservables);
                },

                setSearchTerm(sTerm) {
                    this.searchTerm = sTerm;
                }
            }, {
                setGl: mobx.action,
                setSearchTerm: mobx.action
            });

            this.searchModel = new MobxModel(searchState);
            this.searchState = searchState;
        }
    });
});