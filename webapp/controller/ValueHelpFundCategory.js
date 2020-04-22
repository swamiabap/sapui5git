/* global _ */
/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvCommonService"
], function (ManagedObject, MobxModel, InvCommonService) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.ValueHelpFundCategory", {

        constructor: function () {
            this._InvCommonService = new InvCommonService();
            this._setupObservable();
        },

        exit: function () {
            delete this._InvCommonService;
            delete this._resolve;
            delete this._reject;
            this._valueHelpDialogFundCategory.destroy();
            delete this._valueHelpDialogFundCategory;
            delete this.aorSearchState;
        },

        open: function (oView, sAorNo) {
            //this.valueHelpAorCallerObject = oEvent.getSource().getBindingContext("aor").getObject();
            //const sInputValue = oEvent.getSource().getValue();

            // create value help dialog
            if (!this._valueHelpDialogFundCategory) {
                this._valueHelpDialogFundCategory = sap.ui.xmlfragment(
                    "sg.gov.jtc.JTC-InvoiceApp.view.ValueHelpFundCategory",
                    this
                );
                this._valueHelpDialogFundCategory.setModel(this.fcSearchModel, "fcSearch");
                oView.addDependent(this._valueHelpDialogFundCategory);
                const sDensityClass = oView.getController().getOwnerComponent().getContentDensityClass();
                if (sDensityClass) {
                    this._valueHelpDialogFundCategory.addStyleClass(sDensityClass);
                }
                oView.getController().changeDialogButton(this._valueHelpDialogFundCategory);
            }
            this.fcSearchState.setFundCategories([]);
            this._valueHelpDialogFundCategory.setBusy(true);
            this._valueHelpDialogFundCategory.open("");

            // Read value help from backend
            this._InvCommonService.retrieveFundCategories(sAorNo)
                .then(results => {
                    const sFields = _.chain(results).find({Name: "GT_FIO_FIELDS"}).get("Value", "[]").value();
                    const aFields = JSON.parse(sFields);
                    const aFundCategories = _.chain(aFields).find({fname: "GT_FUNDCATGY"}).get("fvalue", []).value();
                    this.fcSearchState.setFundCategories(aFundCategories);
                    this._valueHelpDialogFundCategory.setBusy(false);
                })
                .catch(() => {
                    this._valueHelpDialogFundCategory.setBusy(false);
                });

            return new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
            });
        },

        handleSearchFundCategory: function(oEvent) {
            const sValue = oEvent.getParameter("value");
            this.fcSearchState.setSearchTerm(sValue);
        },

        handleCloseFundCategoryVH: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                const sPathSelected = oSelectedItem.getBindingContext("fcSearch").getPath();
                const oFundCategorySelected = this.fcSearchModel.getProperty(sPathSelected);
                this._resolve(oFundCategorySelected);
            }
        },

        _setupObservable: function () {
            const fundCategory = {
                get glAccountFormatted() {
                    return _.trimStart(this.glAccount, "0");
                },
                get assetCombined() {
                    let combined = _.trimStart(this.asset, "0");
                    if (combined === "") {
                        return combined;
                    }
                    if (this.assetSubNumber) {
                        let subAssetNoTrimmed = _.trimStart(this.assetSubNumber, "0");
                        subAssetNoTrimmed = subAssetNoTrimmed === "" ? "0" : subAssetNoTrimmed;
                        combined = combined + "/" + subAssetNoTrimmed;
                    }
                    return combined;
                }
            }

            const fcSearchState = mobx.observable({
                fundCategories: [],
                searchTerm: "",
                get fcFiltered () {
                    if (!this.searchTerm) {
                        return this.fundCategories;
                    }
                    const sSearchRegEx = new RegExp(this.searchTerm, "i");
                    const aFundCategories = this.fundCategories.toJS();
                    return aFundCategories.filter((oFundCategory) => {
                        const aValues = _.values(oFundCategory);
                        const bTermFound = _.some(aValues, (value) => {
                            return (value.match(sSearchRegEx) || []).length > 0;
                        });
                        return bTermFound;
                    });
                }
            });

            fcSearchState.setFundCategories = mobx.action("setFundCategories", function (aFundCategories) {
                const aFcObservables = aFundCategories.map(function (obj) {
                    const obx = mobx.observable(fundCategory);
                    mobx.extendObservable(obx, obj);
                    return obx;
                });
                this.fundCategories.replace(aFcObservables);
            });

            fcSearchState.setSearchTerm = mobx.action("setSearchTerm", function (sTerm) {
                this.searchTerm = sTerm;
            });

            this.fcSearchModel = new MobxModel(fcSearchState);
            this.fcSearchState = fcSearchState;
        }
    });
});