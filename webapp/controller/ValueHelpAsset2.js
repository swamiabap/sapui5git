/* global _ */
/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvCommonService"
], function (ManagedObject, MobxModel, InvCommonService) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.ValueHelpAsset2", {

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
                    "sg.gov.jtc.JTC-InvoiceApp.view.ValueHelpAsset2",
                    this
                );
                this.valueHelpDialog.setModel(this.searchModel, "assetSearch");
                this.valueHelpDialog.addStyleClass(oView.getController().getOwnerComponent().getContentDensityClass());
                oView.getController().changeDialogButton(this.valueHelpDialog);
                oView.addDependent(this.valueHelpDialog);
            }
            this.searchState.setAssets([]);
            this.valueHelpDialog.setBusy(true);
            this.valueHelpDialog.open("");

            // Read value help from backend
            this.invCommonService.retrieveAssets(sCompanyCode)
                .then(results => {
                    const aAssets = results.map((obj) => {
                        return _.omit(obj, ["__metadata"]);
                    });
                    this.searchState.setAssets(aAssets);
                    this.valueHelpDialog.setBusy(false);
                })
                .catch(() => this.valueHelpDialog.setBusy(false));

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
                const sPathSelected = oSelectedItem.getBindingContext("assetSearch").getPath();
                const oAsset = _.cloneDeep(this.searchModel.getProperty(sPathSelected));
                this._resolve(oAsset);
            }
            this.searchState.setSearchTerm("");
        },

        setupObservable: function () {
            const searchState = mobx.observable({
                assets: [],
                searchTerm: "",
                get assetsFiltered() {
                    if (!this.searchTerm) {
                        return this.assets;
                    }
                    const sSearchRegEx = new RegExp(this.searchTerm, "i");
                    const aAssets = this.assets; //.toJS();
                    return aAssets.filter((oAsset) => {
                        const aValues = _.values(oAsset);
                        const bTermFound = _.some(aValues, (value) => {
                            if (_.isEmpty(value)) {
                                return false;
                            }
                            value = typeof value === "number" ? value.toString() : value;
                            return (value.match(sSearchRegEx) || []).length > 0;
                        });
                        return bTermFound;
                    });
                },

                setAssets(aAssets) {
                    this.assets = aAssets;
                },

                setSearchTerm(sTerm) {
                    this.searchTerm = sTerm;
                }

            }, {
                assets: mobx.observable.ref,
                setAssets: mobx.action,
                setSearchTerm: mobx.action
            });

            this.searchModel = new MobxModel(searchState);
            this.searchState = searchState;
        }
    });
});