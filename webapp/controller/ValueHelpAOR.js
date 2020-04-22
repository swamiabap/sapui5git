/* global _ */
/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvCommonService"
], function (ManagedObject, MobxModel, InvCommonService) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.ValueHelpAOR", {

        constructor: function () {
            this._InvCommonService = new InvCommonService();
            this._setupObservable();
        },

        exit: function () {
            delete this._InvCommonService;
            delete this._resolve;
            delete this._reject;
            this._valueHelpDialogAor.destroy();
            delete this._valueHelpDialogAor;
            delete this.aorSearchState;
        },

        open: function (oView, sInvoiceID) {
            //this.valueHelpAorCallerObject = oEvent.getSource().getBindingContext("aor").getObject();
            //const sInputValue = oEvent.getSource().getValue();
            const oController = oView.getController();

            // create value help dialog
            if (!this._valueHelpDialogAor) {
                this._valueHelpDialogAor = sap.ui.xmlfragment(
                    "sg.gov.jtc.JTC-InvoiceApp.view.ValueHelpAOR",
                    this
                );
                this._valueHelpDialogAor.setModel(this.aorSearchModel, "aorSearch");
                this._valueHelpDialogAor.addStyleClass(oController.contentDensityClass);
                oController.setDialogButtonType(this._valueHelpDialogAor._getCancelButton());
                oView.addDependent(this._valueHelpDialogAor);
            }
            this.aorSearchState.setAor([]);
            this.aorSearchState.setSearchTerm("");
            this._valueHelpDialogAor.setBusy(true);
            this._valueHelpDialogAor.open("");

            // Read value help from backend
            this._InvCommonService.retrieveAors(sInvoiceID)
                .then(results => {
                    const aAor = results.map((obj) => {
                        return _.omit(obj, ["__metadata"]);
                    });
                    this.aorSearchState.setAor(aAor);
                    this._valueHelpDialogAor.setBusy(false);
                })
                .catch(() => {
                    this._valueHelpDialogAor.setBusy(false);
                });

            return new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
            });
        },

        handleSearchAor: function(oEvent) {
            const sValue = oEvent.getParameter("value");
            this.aorSearchState.setSearchTerm(sValue);
        },

        handleCloseAorVH: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                const sPathSelected = oSelectedItem.getBindingContext("aorSearch").getPath();
                const sAorSelected = this.aorSearchModel.getProperty(sPathSelected).AorNo;
                this._resolve(sAorSelected);
            }
        },

        _setupObservable: function () {
            const aorSearchState = mobx.observable({
                aor: [],
                searchTerm: "",
                get aorFiltered () {
                    if (!this.searchTerm) {
                        return this.aor;
                    }
                    const sSearchRegEx = new RegExp(this.searchTerm, "i");
                    const aAor = this.aor.toJS();
                    return aAor.filter((oAor) => {
                        const aValues = _.values(oAor);
                        const bTermFound = _.some(aValues, (value) => {
                            return (value.match(sSearchRegEx) || []).length > 0;
                        });
                        return bTermFound;
                    });
                }
            });

            aorSearchState.setAor = mobx.action("setAor", function (aAor) {
                const aAorObservables = aAor.map(function (obj) {
                    const obx = mobx.observable(obj);
                    return obx;
                });
                this.aor.replace(aAorObservables);
            });

            aorSearchState.setSearchTerm = mobx.action("setSearchTerm", function (sTerm) {
                this.searchTerm = sTerm;
            });

            this.aorSearchModel = new MobxModel(aorSearchState);
            this.aorSearchState = aorSearchState;
        }
    });
});