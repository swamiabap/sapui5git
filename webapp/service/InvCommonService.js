/* global _ */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function(BaseObject, Filter, FilterOperator) {
    
    return BaseObject.extend("sg.gov.jtc.JTC-InvoiceApp.service.InvCommonService", {

        constructor: function() {
            this.mAssets = new Map();
            this.model = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: "/sap/opu/odata/sap/ZMMP_INV_COMMON_SRV/",
                useBatch: true  //set to true for production
            });
        },

        destroy: function() {
            delete this._mAors;
        },

        // Retrieve Verifying Officers
        retrieveVerifyingOfficers: function(sInvoiceID, sPurchasingGroup) {
            const mParameters = {
                "InvoiceID": sInvoiceID,
                "PurchasingGroup": sPurchasingGroup
            };

            return new Promise((resolve, reject) => {
                this.model.callFunction("/RetrieveVerifyingOfficers", {
                    method: "GET",
                    urlParameters: mParameters,
                    success: (data, response) => {
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        // Retrieve Approving Authorities
        retrieveApprovingAuthorities: function(sInvoiceID, sPurchasingGroup) {
            const mParameters = {
                "InvoiceID": sInvoiceID,
                "PurchasingGroup": sPurchasingGroup
            };

            return new Promise((resolve, reject) => {
                this.model.callFunction("/RetrieveApprovingAuthorities", {
                    method: "GET",
                    urlParameters: mParameters,
                    success: (data, response) => {
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        // Retrieve Asset numbers
        retrieveAssets: function(sCompanyCode) {

            const aAssets = _.cloneDeep(this.mAssets.get(sCompanyCode));
            if (aAssets) {
                return Promise.resolve(aAssets);
            }

            return new Promise((resolve, reject) => {

                let aFilter = [];
                aFilter.push(new Filter("CompanyCode", FilterOperator.EQ, sCompanyCode));
                aFilter.push(new Filter("AssetLockIndicator", FilterOperator.EQ, false));
                let today = new Date();
                today.setHours(0, 0, 0, 0);

                this.model.read("/AssetSet", {
                    // urlParameters: {
                    // 	"$top": 5,
                    // 	"$skip": 1
                    // },
                    filters: aFilter,
                    success: (data, response) => {
                        //Filter date
                        let copy = data.results.filter(e => {
                            if (e.DeactivationDate === null || e.DeactivationDate > today) {
                                return true;
                            } else {
                                return false;
                            }
                        }).map(e => _.cloneDeep(e));

                        this.mAssets.set(sCompanyCode, copy);
                        resolve(copy);
                    },
                    error: reject
                });
            });
        },

        retrieveEstates: function(sCompanyCode) {
            if (!this._estatesCache) {
                this._estatesCache = new Map();
            }
            if (this._estatesCache.has(sCompanyCode)) {
                return Promise.resolve(this._estatesCache.get(sCompanyCode));
            }
            return new Promise((resolve, reject) => {
                this.model.callFunction("/RetrieveEstates", {
                    method: "GET",
                    urlParameters: {
                        CompanyCode: sCompanyCode
                    },
                    success: (data) => {
                        this._estatesCache.set(sCompanyCode, data.results);
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        retrieveBuildings: function(sCompanyCode, sEstate) {
            if (!this._buildingsCache) {
                this._buildingsCache = new Map();
            }
            const resultsCache = this._buildingsCache;

            if (resultsCache.has(sCompanyCode + sEstate)) {
                return Promise.resolve(resultsCache.get(sCompanyCode + sEstate));
            }
            return new Promise((resolve, reject) => {
                this.model.callFunction("/RetrieveBuildings", {
                    method: "GET",
                    urlParameters: {
                        CompanyCode: sCompanyCode,
                        Estate: sEstate
                    },
                    success: (data) => {
                        resultsCache.set(sCompanyCode + sEstate, data.results);
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        retrieveLands: function(sCompanyCode, sEstate) {
            if (!this._landsCache) {
                this._landsCache = new Map();
            }
            const resultsCache = this._landsCache;

            if (resultsCache.has(sCompanyCode + sEstate)) {
                return Promise.resolve(resultsCache.get(sCompanyCode + sEstate));
            }
            return new Promise((resolve, reject) => {
                this.model.callFunction("/RetrieveLands", {
                    method: "GET",
                    urlParameters: {
                        CompanyCode: sCompanyCode,
                        Estate: sEstate
                    },
                    success: (data) => {
                        resultsCache.set(sCompanyCode + sEstate, data.results);
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        retrieveRentalObjects: function(sCompanyCode, sEstate) {
            if (!this._rentalObjectCache) {
                this._rentalObjectCache = new Map();
            }
            const resultsCache = this._rentalObjectCache;

            if (resultsCache.has(sCompanyCode + sEstate)) {
                return Promise.resolve(resultsCache.get(sCompanyCode + sEstate));
            }
            return new Promise((resolve, reject) => {
                this.model.callFunction("/RetrieveRentalObjects", {
                    method: "GET",
                    urlParameters: {
                        CompanyCode: sCompanyCode,
                        Estate: sEstate
                    },
                    success: (data) => {
                        resultsCache.set(sCompanyCode + sEstate, data.results);
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        /////
        // Retrieve tax code mapping
        retrieveTaxCodeMap: function () {
            return new Promise((resolve, reject) => {
                this.model.read("/TaxCodeMapSet", {
                    success: (data, response) => {
                        resolve(data.results.map(o => _.omit(o, "__metadata")));
                    },
                    error: reject
                });
            });
        },

        //***
        // Retrieve company codes
        //***
        retrieveCompanyCodes: function () {
            return new Promise((resolve, reject) => {
                this.model.callFunction("/RetrieveCompanyCodes", {
                    method: "GET",
                    success: (data, response) => {
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        retrieveAors: function(sInvoiceID) {
            return new Promise((resolve, reject) => {
                if (!this._mAors) {
                    this._mAors = new Map();
                }
                const mAors = this._mAors;
                if (mAors.has(sInvoiceID)) {
                    resolve(mAors.get(sInvoiceID));
                }

                this.model.read("/VHAorSet", {
                    success: (data) => {
                        mAors.set(sInvoiceID, data.results);
                        resolve(mAors.get(sInvoiceID));
                    },
                    error: reject
                });
            });
        },

        retrieveFundCategories: function(sAorNo) {
            return new Promise((resolve, reject) => {
                if (!this._mFundCategories) {
                    this._mFundCategories = new Map();
                }
                const mFundCategories = this._mFundCategories;
                if (mFundCategories.has(sAorNo)) {
                    resolve(mFundCategories.get(sAorNo));
                }

                this.model.callFunction("/RetrieveFundCategories", {
                    method: "GET",
                    urlParameters: {
                        AorNo: sAorNo
                    },
                    success: (data) => {
                        mFundCategories.set(sAorNo, data.results);
                        resolve(mFundCategories.get(sAorNo));
                    },
                    error: reject
                });

            });
        },

        retrieveGLAccounts: function (sCompanyCode) {
            return new Promise((resolve, reject) => {
                if (!this._mGlAccounts) {
                    this._mGlAccounts = new Map();
                }
                const mGlAccounts = this._mGlAccounts;
                if (mGlAccounts.has(sCompanyCode)) {
                    resolve(mGlAccounts.get(sCompanyCode));
                    return;
                }

                this.model.callFunction("/RetrieveValidGLAccounts", {
                    method: "GET",
                    urlParameters: {
                        CompanyCode: sCompanyCode
                    },
                    success: (data) => {
                        mGlAccounts.set(sCompanyCode, data.results);
                        resolve(mGlAccounts.get(sCompanyCode));
                    },
                    error: reject
                });
            });
        },

        retrieveCostCenters: function (sCompanyCode) {
            return new Promise((resolve, reject) => {
                if (!this._mCostCenters) {
                    this._mCostCenters = new Map();
                }
                const mCostCenters = this._mCostCenters;
                if (mCostCenters.has(sCompanyCode)) {
                    resolve(mCostCenters.get(sCompanyCode));
                    return;
                }

                let aFilter = [];
                if (sCompanyCode) {
                    aFilter.push(new Filter('CompanyCode', FilterOperator.EQ, sCompanyCode));
                }

                // Read from backend
                this.model.read("/VHCostCenterSet", {
                    filters: aFilter,
                    success: (data) => {
                        mCostCenters.set(sCompanyCode, data.results);
                        resolve(mCostCenters.get(sCompanyCode));
                    },
                    error: reject
                });
            });
        },

        retrieveExpenseTypes: function () {
            return new Promise((resolve, reject) => {
                this.model.read("/ExpenseTypeSet", {
                    success: data => {
                        const aExpenseTypes = data.results.map(o => {
                            let out =_.pick(o, ["expenseType", "subExpenseType"]);
                            out.key = out.expenseType + "@" + out.subExpenseType;
                            return out;
                        });
                        resolve(aExpenseTypes);
                    },
                    error: reject
                });
            });
        },

        //***
        // Retrieve Status Texts
        //***
        retrieveStatuses: function () {
            return new Promise((resolve, reject) => {
                const aFilter = [];
                aFilter.push(new Filter("DomainName", FilterOperator.EQ, "ZPR_INVSTATUS"));
                aFilter.push(new Filter("Language", FilterOperator.EQ, "EN"));

                this.model.read("/DomainFixedValueSet", {
                    filters: aFilter,
                    success: (data, response) => {
                        if (data.results.length > 0) {
                            let aStatuses = data.results.map(v => {
                                return {
                                    Status: v.DomainValue,
                                    StatusText: v.Description
                                };
                            });
                            // aStatuses.push({
                            //     Status: "ALL",
                            //     StatusText: "All statuses"
                            // });
                            resolve(aStatuses);
                            return;
                        }
                        resolve([]);
                    },
                    error: reject
                });
            });
        },

        retrievePromptUsers: function () {
            return new Promise((resolve, reject) => {
                this.model.read("/PromptUserSet", {
                    success: (data, response) => {
                        if (data.results.length > 0) {
                            let aUsers = data.results.map(v => {
                                return {
                                    FullName: v.FullName || v.UserID,
                                    UserID: v.UserID
                                };
                            });
                            aUsers = _.filter(aUsers, (obj) => {
                                return !_.isEmpty(obj.UserID);
                            });
                            let aSortedUsers = _.sortBy(aUsers, ["FullName"]);
                            // aSortedUsers = _.concat({
                            //     FullName: "Any requestor",
                            //     UserID: "ALLUSERS"
                            // }, aSortedUsers);
                            resolve(aSortedUsers);
                            return;
                        }
                        resolve([]);
                    },
                    error: reject
                });
            });
        },

        //////////////////
        // Account Assignment Values
        retrieveAccountAssignments: function () {
            return new Promise((resolve, reject) => {
                const aFilter = [];

                aFilter.push(new Filter("DomainName", FilterOperator.EQ, "ZPR_ACCT_ASSIGNMENT"));
                aFilter.push(new Filter("Language", FilterOperator.EQ, "EN"));

                this.model.read("/DomainFixedValueSet", {
                    filters: aFilter,
                    success: (data, response) => {
                        resolve(data.results.map(o => _.omit(o, "__metadata")));
                    },
                    error: reject
                });
            });
        },

        //***
        // Retrieve Invoice Types
        //***
        retrieveInvoiceTypes: function () {
            return new Promise((resolve, reject) => {
                const aFilter = [];
                aFilter.push(new Filter("DomainName", FilterOperator.EQ, "ZPR_TYPE"));
                aFilter.push(new Filter("Language", FilterOperator.EQ, "EN"));

                this.model.read("/DomainFixedValueSet", {
                    filters: aFilter,
                    success: (data, response) => {
                        const aInvoiceTypes = data.results.map(v => {
                            return {
                                InvoiceType: v.DomainValue,
                                InvoiceTypeDescription: v.Description
                            };
                        });
                        resolve(aInvoiceTypes);
                    },
                    error: reject
                });
            });
        },

        //***
        // Retrieve Invoice Categories
        //***
        retrieveInvoiceCategories: function () {
            return new Promise((resolve, reject) => {
                const aFilter = [];
                aFilter.push(new Filter("DomainName", FilterOperator.EQ, "ZPR_CATEGORY"));
                aFilter.push(new Filter("Language", FilterOperator.EQ, "EN"));

                this.model.read("/DomainFixedValueSet", {
                    filters: aFilter,
                    success: (data, response) => {
                        const aCategories = data.results.map(v => {
                            return {
                                InvoiceCategory: v.DomainValue,
                                InvoiceCategoryDescription: v.Description
                            };
                        });
                        resolve(aCategories);
                    },
                    error: reject
                });
            });
        }
    });
});