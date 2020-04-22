/* global _ */
/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/model/formatter",
    "sap/ui/model/json/JSONModel",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvMaintainService",
    "sap/m/MessageBox",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvCommonService",
    "sg/gov/jtc/JTC-InvoiceApp/controller/ValueHelpAOR",
    "sg/gov/jtc/JTC-InvoiceApp/controller/ValueHelpFundCategory",
    "sg/gov/jtc/JTC-InvoiceApp/controller/ValueHelpGL2",
    "sg/gov/jtc/JTC-InvoiceApp/controller/ValueHelpCostCenter2",
    "sg/gov/jtc/JTC-InvoiceApp/controller/RealEstate",
    "sg/gov/jtc/JTC-InvoiceApp/controller/ValueHelpAsset2",
], function (ManagedObject, formatter, JSONModel, InvMaintenanceService, MessageBox, MobxModel,
             InvCommonService, ValueHelpAOR, ValueHelpFundCategory, ValueHelpGL2, ValueHelpCostCenter2,
             RealEstate, ValueHelpAsset2) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.AORSelection", {
        formatter: formatter,

        constructor: function (oController, oAorModel, oSystemMessageModel) {
            this._oAorModel = oAorModel;
            this._oSystemMessageModel = oSystemMessageModel;
            this._InvMaintainService = new InvMaintenanceService();
            this._InvCommonService = new InvCommonService();
            this._valueHelpAOR = new ValueHelpAOR();
            this._valueHelpFundCategory = new ValueHelpFundCategory();
            this._valueHelpGL2 = new ValueHelpGL2();
            this._valueHelpCostCenter2 = new ValueHelpCostCenter2();
            this._oRealEstate = new RealEstate(oController.getView());
            this._valueHelpAsset2 = new ValueHelpAsset2();
        },

        exit: function () {
            delete this._InvMaintainService;
            this._oAorSelectionFragment.destroy();
            delete this._oAorSelectionFragment;
            this._POWOSearch.destroy();
            delete this._POWOSearch;
            delete this._oInvoice;
            this._valueHelpAOR.destroy();
            delete this._valueHelpAOR;
            this._valueHelpFundCategory.destroy();
            delete this._valueHelpFundCategory;
            this._valueHelpGL2.destroy();
            delete this._valueHelpGL2;
            this._valueHelpCostCenter2.destroy();
            delete this._valueHelpCostCenter2;
            this._valueHelpAsset2.destroy();
            delete this._valueHelpAsset2;
        },

        getFragment: function (oView, sInvoiceID) {
            this._oView = oView;
            this._sInvoiceID = sInvoiceID;
            if (!this._oAorSelectionFragment) {
                this._oAorSelectionFragment = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.AORSelection", this);
            }
            // Bind and return
            //this._oAorSelectionFragment.bindElement({path: "/", model: "aor"});
            return this._oAorSelectionFragment;
        },

        handleAddAor: function() {
            const oController = this._oView.getController();
            const state = oController._aorState;
            const oAorNew = state.getNewAor();
            state.addAor(oAorNew);
        },

        handleDeleteAor: function(oEvent) {
            const oController = this._oView.getController();
            const state = oController._aorState;
            const toRemove = oEvent.getParameter("listItem").getBindingContext("aor").getObject();
            state.removeAor(toRemove);
        },

        handleValueHelpAor: function (oEvent) {
            const sInvoiceID = this._oView.getModel("local").getProperty("/InvoiceID") || "";
            this.valueHelpAorCallerObject = oEvent.getSource().getBindingContext("aor").getObject();
            this._valueHelpAOR.open(this._oView, sInvoiceID)
                .then(sAorNo => {
                    if (this.valueHelpAorCallerObject) {
                        this.valueHelpAorCallerObject.banfnRx = sAorNo;
                    }
                });
        },

        handleValueHelpFundCategory: function (oEvent) {
            this.valueHelpFundCategoryCallerObject = oEvent.getSource().getBindingContext("aor").getObject();
            const sAorNo =  this.valueHelpFundCategoryCallerObject.banfn;
            this._valueHelpFundCategory.open(this._oView, sAorNo)
                .then(oFundCategory => {
                    const oCaller = this.valueHelpFundCategoryCallerObject;
                    if (oCaller) {
                        oCaller.fundCategory = oFundCategory.ktext;
                        oCaller.assetNo = oFundCategory.asset;
                        oCaller.subAssetNo = oFundCategory.assetSubNumber;
                        if (!oCaller.assetNo) {
                            oCaller.glAccount = oFundCategory.glAccount;
                            oCaller.costCenter = oFundCategory.costCenter;
                            if (!oCaller.costCenter) {
                                oCaller.estateRx = oFundCategory.estate;
                                oCaller.landRx = oFundCategory.land;
                                oCaller.buildingRx = oFundCategory.building;
                                oCaller.reobjectentityRx = oFundCategory.reobjectentity;
                            }
                        }

                        // Determine Account Assignment and Real Estate
                        if (oCaller.assetNo) {
                            oCaller.accntAssign = "ASSET";
                        } else if (oCaller.costCenter) {
                            oCaller.accntAssign = "GLCC";
                        } else {
                            oCaller.accntAssign = "GLRE";
                        }
                        //this._oView.getController().updateAorLine();
                    }
                });
        },

        handleValueHelpGL: function (oEvent) {
            const sCompanyCode = this._oView.getModel("local").getProperty("/CompanyCode") || "";
            const oAor = oEvent.getSource().getBindingContext("aor").getObject();
            this._valueHelpGL2.open(this._oView, sCompanyCode)
                .then(sGlAccountNumber => {
                    if (oAor) {
                        oAor.glAccount = sGlAccountNumber;
                    }
                });
        },

        handleValueHelpCostCenter: function (oEvent) {
            const sCompanyCode = this._oView.getModel("local").getProperty("/CompanyCode") || "";
            const oAor = oEvent.getSource().getBindingContext("aor").getObject();
            this._valueHelpCostCenter2.open(this._oView, sCompanyCode)
                .then(sCostCenter => {
                    if (oAor) {
                        oAor.costCenter = sCostCenter;
                    }
                });
        },

        handleValueHelpRealEstate: function (oEvent) {
            const sCompanyCode = this._oView.getModel("local").getProperty("/CompanyCode") || "";
            const oAor = oEvent.getSource().getBindingContext("aor").getObject();
            const oRealEstate = {
                Estate: oAor.estate,
                Building: oAor.building,
                Land: oAor.land,
                RentalObject: oAor.reobjectentity
            };
            this._oRealEstate.openBy(oEvent.getSource(), sCompanyCode, oRealEstate)
                .then(oRealEstate => {
                    mobx.runInAction("updateRealEstate", () => {
                        oAor.buildingRx = oRealEstate.Building;
                        oAor.landRx = oRealEstate.Land;
                        oAor.reobjectentityRx = oRealEstate.RentalObject;
                        oAor.estateRx = oRealEstate.Estate;
                        // Call backend to derive real estate key
                        const oController = this._oView.getController();
                        oController.updateAorLine();
                    });
                });
        },

        handleValueHelpAsset: function (oEvent) {
            const sCompanyCode = this._oView.getModel("local").getProperty("/CompanyCode") || "";
            const oAor = oEvent.getSource().getBindingContext("aor").getObject();
            this._valueHelpAsset2.open(this._oView, sCompanyCode)
                .then(oAsset => {
                    if (oAor) {
                        oAor.assetNo = oAsset.MainAssetNumber;
                        oAor.subAssetNo = oAsset.AssetSubnumber;
                    }
                });
        }
    });
});