sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/model/formatter",
    "sap/ui/model/json/JSONModel",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvMaintainService"
], function (ManagedObject, formatter, JSONModel, InvMaintenanceService) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.TrainingSearch", {
        formatter: formatter,

        constructor: function () {
            this._oSearchModel = new JSONModel({
                DateFormat: "dd.MM.YYYY",
                StartDateLow: undefined,
                StartDateHigh: undefined,
                CourseTitle: undefined,
                EmployeeName: undefined,
            }, false);
            this._InvMaintainService = new InvMaintenanceService();
            this._oTrainingFieldMap = {
                zzpernr: "PersonnelNumber",
                zzcrsid: "CourseId",
                zzename: "NameOfParticipant",
                zzcrsname: "CourseTitle",
                zzdesig: "Designation",
                zzcludiv: "ClusterDivision",
                zzdeptmt: "Department",
                zzscheme: "SchemeOfService",
                zzcostcentr: "CostCentre",
                zzglacnt: "GlAccountDerivedFromCostCentre",
                zzapprvcode: "ApprovalCode",
                zzsedate: "StartDate",
                zzedate: "EndDate",
                zztrnghours: "TrainingHours",
                zzcrsorg: "CourseOrganiser",
                zzestcost: "EstimatedCourseFees",
                zzactcost: "ActualCourseFeesLocal",
                zzactcostOst: "OverseasClaims",
                zztotalCost: "TotalActualOverseasCost",
                zztaxcode: "TaxCode",
                zzsdf: "SdfAmount",
                zzpenaltycost: "EstimatedPenaltyAmount",
                zzactpenalty: "ActualPenalty",
                zzpaydate: "PostingOrApprovalDate",
                zzstatus: "StatusOfTrainingEnrolment",
                zzaoname: "NameOfAo",
                zzaodesig: "DesignationOfAo",
                zzpsdfund: "PsdFunding",
                zzairfare: "Airfare",
                zzoscoursefee: "OverseasCourseFees",
                zzentrydat: "EntryDate"
            }
        },

        exit: function () {
            this._oSearchModel.destroy();
            delete this._oSearchModel;
            this._TrainingSearchDialog.destroy();
            delete this._TrainingSearchDialog;
            delete this._InvMaintainService;
            delete this._sInvoiceID;
            delete this._oView;
            delete this._oSelection;
            delete this._resolve;
            delete this._oTrainingFieldMap;
        },

        open: function (oView, sInvoiceID) {
            this._oView = oView;
            this._sInvoiceID = sInvoiceID;
            this._oSearchModel.setData({
                DateFormat: "dd.MM.YYYY",
                StartDateLow: undefined,
                StartDateHigh: undefined,
                CourseTitle: undefined,
                EmployeeName: undefined,
            });
            this._oSearchModel.setProperty("/TrainingInformation", []);
            this._oSelection = {};
            return new Promise((resolve, reject) => {
                this._resolve = resolve;
                if (!this._TrainingSearchDialog) {
                    this._TrainingSearchDialog = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.TrainingSearch", this);
                    oView.addDependent(this._TrainingSearchDialog);
                    jQuery.sap.syncStyleClass(oView.getController().getOwnerComponent().getContentDensityClass(), oView, this._TrainingSearchDialog);
                }
                this._TrainingSearchDialog.setModel(this._oSearchModel, "tsearch");
                this._TrainingSearchDialog.open();
            });
        },

        handleSearchTrainingLive: function () {
            if (!this.searchTrainingDebounced) {
                this.searchTrainingDebounced = _.debounce(this.handleSearchTraining.bind(this), 1000);
            }
            this.searchTrainingDebounced();
        },

        handleSearchTraining: function () {
            this._oSelection = {};
            this._oSearchModel.setProperty("/ResultTableBusy", true);
            const oSearchData = _.cloneDeep(this._oSearchModel.getData());
            this._InvMaintainService.searchTraining(this._sInvoiceID, oSearchData.CourseTitle, oSearchData.StartDateLow, oSearchData.StartDateHigh, oSearchData.EmployeeName)
                .then(aSearchResults => {
                    let aTrainingInfoSearch = [];
                    const oTrainingSearch = _.find(aSearchResults, {Name: "GT_UTI"});
                    if (oTrainingSearch) {
                        aTrainingInfoSearch = JSON.parse(oTrainingSearch.Value);
                        // const aTrainingInfo = aTrainingInfoSearch.map(oValue => {
                        //     return _.mapKeys(oValue, (value, key) => {
                        //         return _.get(this._oTrainingFieldMap, key, key);
                        //     });
                        // }) || [];
                    }
                    this._oSearchModel.setProperty("/TrainingInformation", aTrainingInfoSearch);
                    this._oSearchModel.setProperty("/ResultTableBusy", false);
                }).catch(() => {
                this._oSearchModel.setProperty("/ResultTableBusy", false);
            });
        },

        convertTrainingInfoToInternalFormat: function (aTrainInfoExternal) {
            return aTrainInfoExternal.map(oInfo => {
                let oInfoInternal = _.mapKeys(oInfo, (infoValue, infoKey) => {
                    return _.findKey(this._oTrainingFieldMap, mapValue => {
                        return mapValue === infoKey;
                    });

                });
                delete oInfoInternal.undefined;
                return oInfoInternal;
            });
        },

        handleSelectionChange: function (oEvent) {
            const aParams = oEvent.getParameters();
            aParams.listItems.forEach(v => {
                _.set(this._oSelection, v.getBindingContextPath("tsearch"), aParams.selected);
            });
        },

        handleAddTrainingInfo: function (oEvent) {
            const oSelected = _.pickBy(this._oSelection, (value) => value);
            const aSelectedPaths = _.map(oSelected, (value, key) => key);
            const aSelectedData = aSelectedPaths.map(path => {
               return this._oSearchModel.getProperty(path);
            });
            this._resolve(aSelectedData);
            this._TrainingSearchDialog.close();
        },

        handleCancelSearch: function (oEvent) {
            this._TrainingSearchDialog.close();
        }
    });
});