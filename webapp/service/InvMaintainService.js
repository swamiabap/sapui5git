/* global _:true */
/* global moment */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter"
], function (BaseObject, Filter, FilterOperator, Sorter) {

    return BaseObject.extend("sg.gov.jtc.JTC-InvoiceApp.service.InvMaintainService", {
        bSetUseBatch: true,

        constructor: function () {
            this.model = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: "/sap/opu/odata/sap/ZMMP_INV_MAINTAIN_SRV/",
                useBatch: true  //set to true for production
            });
            //Will hold the return object of a running search
            this.runningSearch = undefined;
        },

        getModel: function () {
            return this.model;
        },

        //Retrieve text for remark
        retrieveRemark: function (sInvoiceID) {
            if (sInvoiceID === undefined || sInvoiceID === null || sInvoiceID.length < 1) {
                return Promise.reject();
            }

            let aFilter = [];
            aFilter.push(new Filter("InvoiceID", FilterOperator.EQ, sInvoiceID));

            return new Promise((resolve, reject) => {
                this.model.read("/RemarkSet", {
                    filters: aFilter,
                    success: (data, response) => {
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        retrieveInitialization: function () {
            return new Promise(function (resolve, reject) {
                this.model.callFunction("/RetrieveInitialization", {
                    method: "GET",
                    success: function (data, response) {
                        resolve(data.results);
                    },
                    error: reject
                });
            }.bind(this));
        },

        loadInvoice: function (sInvoiceID, sMode) {
            return new Promise((resolve, reject) => {
                this.model.callFunction("/LoadInvoice", {
                    method: "GET",
                    urlParameters: {
                        InvoiceID: sInvoiceID,
                        Mode: sMode
                    },
                    success: (data, response) => resolve(data.results),
                    error: reject
                });
            });
        },

        retrieveCreditNotes: function (sInvoiceID) {
            return new Promise((resolve, reject) => {
                let aFilter = [];
                aFilter.push(new Filter("InvoiceType", FilterOperator.EQ, "CN"));
                aFilter.push(new Filter("LinkInvoiceID", FilterOperator.EQ, sInvoiceID));

                this.model.read("/InvoiceSet", {
                    filters: aFilter,
                    success: (data) => {
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        retrieveAdditionalCreditNotes: function (sVendorID, sPurchasingGroup) {
            return new Promise((resolve, reject) => {
                let aFilter = [];
                aFilter.push(new Filter("InvoiceType", FilterOperator.EQ, "CN"));
                aFilter.push(new Filter("Status", FilterOperator.EQ, "01"));
                aFilter.push(new Filter("VendorID", FilterOperator.EQ, sVendorID));
                aFilter.push(new Filter("PurchasingGroup", FilterOperator.EQ, sPurchasingGroup));
                aFilter.push(new Filter({
                    filters: [
                        new Filter("InvoiceCategory", FilterOperator.EQ, "PAYR"),
                        new Filter("InvoiceCategory", FilterOperator.EQ, "EINV")
                    ],
                    and: false
                }));

                this.model.read("/InvoiceSet", {
                    urlParameters: {
                        "$select": "InvoiceID,InvoiceReference,InvoiceReferenceDate,Description,Status,"
                            + "RequestorID,AmountBeforeGst,GstAmount,AmountAfterGst"
                    },
                    filters: aFilter,
                    sorters: [new Sorter("InvoiceReference")],
                    success: (data, response) => {
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        saveInvoice: function (oInvoice, sOperation) {
            this.model.setUseBatch(true);

            const aDeferred = this.model.getDeferredGroups();
            const aNewDeferred = aDeferred.concat(["deferred_save"]);
            this.model.setDeferredGroups(aNewDeferred);

            const mDefaultParameters = {
                groupId: "deferred_save",
                changeSetId: "save_action",
                headers: {
                    "Content-ID": sOperation
                }
            };

            // Invoice, ToInvoiceLinkNA, ToRemark
            let oInvoiceParameters = _.defaults({
                success: (data, response) => {
                    // MessageBox.information(`Invoice ${oInvoice.Invoice.InvoiceReference} ${sAction}.`);
                    // console.log("Invoice Set Create", response);
                },
                error: (error) => {
                    // const oError = JSON.parse(error.responseText);
                    // const msg = _.get(oError, "error.message.value", `Error. Invoice ${oInvoice.Invoice.InvoiceReference} not ${sAction}.`);
                    // MessageBox.error(msg);
                    // console.log("Invoice Set Error", error);
                }
            }, mDefaultParameters);

            this.model.create("/InvoiceSet", oInvoice, oInvoiceParameters);

            return new Promise((resolve, reject) => {
                this.model.submitChanges({
                    groupId: "deferred_save",
                    success: (data, response) => {
                        resolve(data, response);
                    },
                    error: (error) => {
                        reject(error);
                    }
                });
            }).finally(() => {
                this.model.setUseBatch(this._bSetUseBatch); //false is for development only
            });
        },

        validateAddCreditNote: function (oCreditNoteBundle) {
            this.model.setUseBatch(true);

            const aDeferred = this.model.getDeferredGroups();
            const aNewDeferred = aDeferred.concat(["deferred_check"]);
            this.model.setDeferredGroups(aNewDeferred);

            const mDefaultParameters = {
                groupId: "deferred_check",
                changeSetId: "deferred_check",
                headers: {
                    "Content-ID": "CHECK_CN"
                }
                // success: (data, response) => {
                //     console.log("Check CN", response);
                // },
                // error: (error) => {
                //     const oError = JSON.parse(error.responseText);
                //     console.log("Check CN Error", oError);
                // }
            };

            // Invoice currently being edited
            this.model.create("/InvoiceSet", oCreditNoteBundle.Invoice, _.defaults({
                headers: {"Content-ID": "CN_CHECK_01_INV"}
            }, mDefaultParameters));

            // Current credit notes, if any
            oCreditNoteBundle.CurrentCreditNotes.forEach(oCN => {
                this.model.create("/InvoiceSet", oCN, _.defaults({
                    headers: {"Content-ID": "CN_CHECK_02_CN"}
                }, mDefaultParameters));
            });

            // The credit note to be added (to be verified, not actually added at this time)
            this.model.create("/InvoiceSet", oCreditNoteBundle.CreditNoteToBeAdded, _.defaults({
                headers: {"Content-ID": "CN_CHECK_03_ADD_CN"}
            }, mDefaultParameters));

            return new Promise((resolve, reject) => {
                this.model.submitChanges({
                    groupId: "deferred_check",
                    success: (data) => {
                        // console.log("Check CN Response", data);
                        resolve(data);
                    },
                    error: (error) => {
                        // console.log("Check CN Error", error);
                        reject(error);
                    }
                });
            }).finally(() => {
                this.model.setUseBatch(this._bSetUseBatch); //false is for development only
            });
        },

        executePowoFunction: function (oPowoBundle) {
            this.model.setUseBatch(true);

            const aDeferred = this.model.getDeferredGroups();
            const aNewDeferred = aDeferred.concat(["deferred_check"]);
            this.model.setDeferredGroups(aNewDeferred);

            this.model.create("/InvoiceSet", oPowoBundle.Invoice, {
                groupId: "deferred_check",
                changeSetId: "deferred_check",
                headers: {
                    "Content-ID": "EXECUTE_POWO_FUNCTION"
                }
            });

            return new Promise((resolve, reject) => {
                this.model.submitChanges({
                    groupId: "deferred_check",
                    success: (data) => {
                        resolve(data);
                    },
                    error: (error) => {
                        reject(error);
                    }
                });
            }).finally(() => {
                this.model.setUseBatch(this._bSetUseBatch); //false is for development only
            });
        },

        executeInvoiceFunction: function (oInvoiceDeep) {
            this.model.setUseBatch(true);

            const aDeferred = this.model.getDeferredGroups();
            const aNewDeferred = aDeferred.concat(["deferred_exec"]);
            this.model.setDeferredGroups(aNewDeferred);

            this.model.create("/InvoiceSet", oInvoiceDeep, {
                groupId: "deferred_exec",
                changeSetId: "deferred_exec",
                headers: {
                    "Content-ID": "EXECUTE_FUNCTION"
                }
            });

            return new Promise((resolve, reject) => {
                this.model.submitChanges({
                    groupId: "deferred_exec",
                    success: (data) => {
                        resolve(data);
                    },
                    error: (error) => {
                        reject(error);
                    }
                });
            }).finally(() => {
                this.model.setUseBatch(this._bSetUseBatch); //false is for development only
            });
        },

        executeAction: function (oAction) {
            return new Promise((resolve, reject) => {
                this.model.create("/ActionSet", oAction, {
                    success: resolve,
                    error: reject
                });
            });
        },

        retrieveInvoicePDF: function (sInvoiceID, sFormat, nGstAmount) {
            return new Promise((resolve, reject) => {
                let aFilters = [];
                aFilters.push(new Filter("Format", FilterOperator.EQ, sFormat));
                aFilters.push(new Filter("GstAmount", FilterOperator.EQ, nGstAmount));

                this.model.read(`/InvoicePDFSet(InvoiceID='${sInvoiceID}')/$value`, {
                    filters: aFilters,
                    success: (data, response) => resolve(data, response),
                    error: reject
                });
            });
        },

        getNewInvoiceLinkNA: function () {
            const oContext = this.model.createEntry("/InvoiceLinkNASet");
            const newEntry = _.cloneDeep(this.model.getProperty(oContext.getPath()));
            delete newEntry.__metadata;
            this.model.deleteCreatedEntry(oContext);
            return newEntry;
        },

        getNewEntry: function (sPath) {
            const oContext = this.model.createEntry(sPath);
            const newEntry = _.cloneDeep(this.model.getProperty(oContext.getPath()));
            delete newEntry.__metadata;
            this.model.deleteCreatedEntry(oContext);
            return newEntry;
        },

        searchTraining: function (sInvoiceID, sCourseTitle, dStartDateLow, dStartDateHigh, sEmployeeName) {
            return new Promise((resolve, reject) => {
                const aDate = [dStartDateLow, dStartDateHigh].map(dDate => {
                   if (!dDate) {
                       return "";
                   } else {
                       return moment(dDate).format("YYYYMMDD");
                   }
                });
                this.model.callFunction("/SearchTraining", {
                    method: "GET",
                    urlParameters: {
                        InvoiceID: sInvoiceID || "",
                        CourseTitle: sCourseTitle || "",
                        StartDateLow: aDate[0],
                        StartDateHigh: aDate[1],
                        EmployeeName: sEmployeeName || ""
                    },
                    success: function (data, response) {
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        searchPowo: function (sPurchasingGroup, sVendorID, sPoFrom, sPoTo, sContractFrom, sContractTo) {
            return new Promise((resolve, reject) => {
                this.model.callFunction("/SearchPowo", {
                    method: "GET",
                    urlParameters: {
                        PurchasingGroup: sPurchasingGroup || "",
                        VendorID: sVendorID || "",
                        PowoNumberFrom: sPoFrom,
                        PowoNumberTo: sPoTo,
                        ContractNoFrom: sContractFrom || "",
                        ContractNoTo: sContractTo || ""
                    },
                    success: function (data, response) {
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        searchInvoices: function(sSearchTerm, aUsers, sStatus, dFrom, dTo, sUserId, sPurchasingGroup, sActionRequiredBy, aRequestors) {
            if (!this.searchByTextCached) {
                this.searchByTextCached = _.memoize(this.searchByText);
            }

            return new Promise((resolve, reject) => {
                this.searchByTextCached("")
                    .then(aInvoice => {
                        let aInvoiceFiltered = _.cloneDeep(aInvoice);

                        if (sSearchTerm) {
                            aInvoiceFiltered = aInvoice.filter(inv => {
                                const bTextFound = ["InvoiceReference", "VendorNameInterface", "Description"].some(fieldName => {
                                    return RegExp(sSearchTerm, "i").test(inv[fieldName]);
                                });
                                let bTextInNameFound = false;
                                if (!bTextFound) {
                                    if (aUsers.length > 0) {
                                        bTextInNameFound = _.some(aUsers, {UserID: inv.RequestorID});
                                    }
                                }
                                return bTextFound || bTextInNameFound;
                            });
                        }

                        if (sStatus) {
                            aInvoiceFiltered = aInvoiceFiltered.filter(inv => inv.Status === sStatus);
                        }

                        if (!_.isNil(dTo) && !_.isNil(dFrom)) {
                            dTo.setHours(8);
                            dFrom.setHours(8);
                            const sFrom = moment(dFrom).format("YYYYMMDD");
                            const sTo = moment(dTo).format("YYYYMMDD");
                            aInvoiceFiltered = aInvoiceFiltered.filter(inv => inv.InvoiceReferenceDate >= sFrom && inv.InvoiceReferenceDate <= sTo);
                        } else if (!_.isNil(dFrom)) {
                            dFrom.setHours(8);
                            const sFrom = moment(dFrom).format("YYYYMMDD");
                            aInvoiceFiltered = aInvoiceFiltered.filter(inv => inv.InvoiceReferenceDate === sFrom);
                        }

                        // if (sUserId !== "ALLUSERS") {
                        //     aInvoiceFiltered = aInvoiceFiltered.filter(inv => inv.RequestorID === sUserId);
                        // }

                        if (aRequestors.length > 0) {
                            aInvoiceFiltered = aInvoiceFiltered.filter(inv => {
                                return aRequestors.some(req => req.UserID === inv.RequestorID);
                            });
                        }

                        if (sPurchasingGroup) {
                            aInvoiceFiltered = aInvoiceFiltered.filter(inv => inv.PurchasingGroup === sPurchasingGroup);
                        }

                        if (sActionRequiredBy) {
                            aInvoiceFiltered = aInvoiceFiltered.filter(inv => inv.InvoiceApprovingOfficer === sActionRequiredBy);
                        }

                        resolve(aInvoiceFiltered);
                    });
            });
        },

        searchByText: function (sSearchTerm) {
            return new Promise((resolve, reject) => {
                let aFinalFilter = [new Filter("InvoiceCategory", FilterOperator.EQ, "EINV")];
                // Sort by invoice reference date, descending
                let aSorter = [];
                aSorter.push(new Sorter("Status"));
                aSorter.push(new Sorter("InvoiceReferenceDate", true));
                this.model.read("/InvoiceSet", {
                    urlParameters: {
                        // "$top": 100,
                        "$inlinecount": "allpages",
                        "$select": "InvoiceID,InvoiceReference,InvoiceReferenceDate,VendorNameInterface,Description,RequestorID,Status,AmountBeforeGst,AmountAfterGst,InvoiceApprovingOfficer,PurchasingGroup,Currency,ToCreditNote/AmountAfterGst"
                    },
                    filters: aFinalFilter,
                    sorters: aSorter,
                    success: (data) => {
                        resolve(data.results);
                    },
                    error: (oError) => {
                        reject(oError);
                    }
                });
            });
        },

        retrieveInvoices: function (aInvoiceIds, bRetrieveAll) {
            if (!bRetrieveAll && _.isEmpty(aInvoiceIds)) {
                return Promise.resolve([]);
            }
            return new Promise((resolve, reject) => {
                let aFinalFilter = [new Filter("InvoiceCategory", FilterOperator.EQ, "EINV")];
                let aInvIds = [];
                let aFilterInv = [];
                if (!bRetrieveAll && !_.isEmpty(aInvoiceIds)) {
                    aInvIds = aInvoiceIds.map(oInvoice => new Filter("InvoiceID", FilterOperator.EQ, oInvoice.invId));
                    aFilterInv = new Filter({
                        filters: aInvIds,
                        and: false
                    });
                    aFinalFilter.push(aFilterInv);
                }

                let aSorter = [];
                aSorter.push(new Sorter("Status"));
                aSorter.push(new Sorter("InvoiceReferenceDate", true));
                this.model.read("/InvoiceSet", {
                    urlParameters: {
                        "$inlinecount": "allpages",
                        // "$expand": "ToCreditNote",
                        "$select": "InvoiceID,InvoiceReference,InvoiceReferenceDate,VendorNameInterface,Description,RequestorID,Status,AmountBeforeGst,AmountAfterGst,InvoiceApprovingOfficer,PurchasingGroup,Currency"
                    },
                    filters: aFinalFilter,
                    sorters: aSorter,
                    success: (data) => {
                        resolve(data.results);
                    },
                    error: (oError) => {
                        reject(oError);
                    }
                });
            });
        },

        retrieveUpdatedValues: function (invId) {
            if (!invId) {
                return Promise.reject();
            }

            return new Promise((resolve, reject) => {
                this.model.read(`/InvoiceSet('${invId}')`, {
                    urlParameters: {
                        "$select": "RequestorID,Status,InvoiceApprovingOfficer"
                    },
                    success: (data) => {
                        resolve(data);
                    },
                    error: (oError) => {
                        reject(oError);
                    }
                });
            });
        },

        retrieveRelatedDocuments: function (sInvoiceID) {
            return new Promise((resolve, reject) => {
                this.model.callFunction("/RetrieveRelatedDocumentsList", {
                    method: "GET",
                    urlParameters: {
                        InvoiceID: sInvoiceID
                    },
                    success: resolve,
                    error: reject
                });
            });
        },

        retrieveAttachmentList: function (sInvoiceID) {
            if (!sInvoiceID) {
                return Promise.resolve([]);
            }
            return new Promise((resolve, reject) => {
                let aFilters = [];
                aFilters.push(new Filter("ObjNo", FilterOperator.EQ, sInvoiceID));
                this.model.read("/AttachmentListSet", {
                    filters: aFilters,
                    success: data => resolve(data.results),
                    error: reject
                });
            });
        },

        retrieveWorkFlowHistoryLog: function (sInvoiceID) {
            if (!sInvoiceID) {
                return Promise.resolve([]);
            }
            return new Promise((resolve, reject) => {
                let aFilters = [];
                aFilters.push(new Filter("ObjNo", FilterOperator.EQ, sInvoiceID));
                this.model.read("/WorkFlow_LogSet", {
                    filters: aFilters,
                    success: data => resolve(data.results),
                    error: reject
                });
            });
        },

        refreshSecurityToken: function () {
            return new Promise((resolve, reject) => {
                this.model.refreshSecurityToken(resolve, reject);
            });
        }
    });
});