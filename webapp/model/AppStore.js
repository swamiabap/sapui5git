/* global mobx */
/* global mobxUtils */
/* global _ */
/* global moment */
sap.ui.define([
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobx.umd",
    "sg/gov/jtc/JTC-InvoiceApp/libs/lodash",
    "sg/gov/jtc/JTC-InvoiceApp/libs/moment",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvMaintainService",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvCommonService",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvApprovalService"
], function (MobxJS, LodashJS, MomentJS, InvMaintainService, InvCommonService, InvApprovalService) {
    "use strict";

    const invMaintainService = new InvMaintainService();
    const invCommonService = new InvCommonService();
    const invApprovalService = new InvApprovalService();

    const RootStore = {
        createAppStore: function () {
            const rootStore = this;
            //App state
            let dToday = new Date();
            dToday.setHours(8, 0, 0, 0);
            let d3MonthsAgo = moment().subtract(3, "months").toDate();
            d3MonthsAgo.setHours(8, 0, 0, 0);

            const _accountAssignments = mobxUtils.fromPromise(invCommonService.retrieveAccountAssignments());
            const _companyCodes = mobxUtils.fromPromise(invCommonService.retrieveCompanyCodes());
            const _invoiceCategories = mobxUtils.fromPromise(invCommonService.retrieveInvoiceCategories());
            const _invoiceTypes = mobxUtils.fromPromise(invCommonService.retrieveInvoiceTypes());
            const _taxCodes = mobxUtils.fromPromise(invCommonService.retrieveTaxCodeMap());
            const _expenseTypes = mobxUtils.fromPromise(invCommonService.retrieveExpenseTypes());
            const _paymentMethods = mobxUtils.lazyObservable(sink => {
                RootStore.doAction({
                    action: "~COMMON~PAY_METHOD_VH",
                    subAction: "PAY_METHOD_VH",
                    actionParameters: {
                        GV_OK_CODE: ""
                    }
                }).then(oAction => {
                    const aPaymentMethods = RootStore.getActionField(oAction.responseData, "GT_FIO_PAY_METHOD");
                    console.log("Payment Methods:", aPaymentMethods);
                    sink(aPaymentMethods);
                });
            }, []);

            const _specialGlIndicators = mobxUtils.lazyObservable(sink => {
                RootStore.doAction({
                    action: "~COMMON~SPECIAL_GL_INDICATOR_VH",
                    subAction: "SPECIAL_GL_INDICATOR_VH",
                    actionParameters: {
                        GV_OK_CODE: ""
                    }
                }).then(oAction => {
                    const aSpecialGlIndicators = RootStore.getActionField(oAction.responseData, "GT_FIO_SPECIAL_GL_IND");
                    console.log("Special GL Indicators:", aSpecialGlIndicators);
                    sink(aSpecialGlIndicators);
                });
            }, []);

            const _purchasingGroups = mobxUtils.lazyObservable(sink => {
                RootStore.doAction({
                    action: "~COMMON~PURCH_GROUP_VH",
                    subAction: "PURCH_GROUP_VH",
                    actionParameters: {
                        GV_OK_CODE: ""
                    }
                }).then(oAction => {
                    const aPurchasingGroups = RootStore.getActionField(oAction.responseData, "GT_VALID_EKGRP");
                    console.log("All purch groups:", aPurchasingGroups);
                    sink(aPurchasingGroups);
                });
            }, []);

            const _invoiceApprovingOfficersAll = mobxUtils.lazyObservable(sink => {
                RootStore.doAction({
                    action: "~COMMON~IAO_VH",
                    subAction: "IAO_VH",
                    actionParameters: {
                        GV_OK_CODE: ""
                    }
                }).then(oAction => {
                    const aIaoAll = RootStore.getActionField(oAction.responseData, "IAO_ALL");
                    console.log("All IAO:", aIaoAll);
                    sink(aIaoAll);
                });
            }, []);

            rootStore.appStore = mobx.observable({
                aux: {
                    accountAssignment: {
                        get accountAssignments() {
                            return _accountAssignments.value;
                        },

                        descriptionOf(accountAssignment) {
                            const o = _.find(this.accountAssignments, ["DomainValue", accountAssignment]);
                            if (o) {
                                return o.Description;
                            }
                            return accountAssignment;
                        }
                    },

                    approvingAuthorities: [],
                    approvingAuthoritiesAll: [],

                    companyCode: {
                        get companyCodes() {
                            return _companyCodes.value;
                        }
                    },

                    customerAccountingTaxCode: "",

                    get expenseTypesAll() {
                        return _expenseTypes.case({
                            pending: () => [],
                            fulfilled: value => value
                        });
                    },

                    expenseTypesForDocument: [],

                    get expenseTypes() {
                        return this.expenseTypesForDocument.length > 0 ? this.expenseTypesForDocument : this.expenseTypesAll;
                    },

                    get invoiceApprovingOfficersAll() {
                        return _invoiceApprovingOfficersAll.current();
                    },

                    invoiceCategory: {
                        get invoiceCategories() {
                            return _invoiceCategories.value;
                        },

                        descriptionOf(category) {
                            const oInvCategory = _.find(this.invoiceCategories, ["InvoiceCategory", category]);
                            return oInvCategory ? oInvCategory.InvoiceCategoryDescription : category;
                        }
                    },

                    invoiceType: {
                        get invoiceTypes() {
                            return _invoiceTypes.value;
                        },

                        descriptionOf(invoiceType) {
                            const oInvoiceType = _.find(this.invoiceTypes, ["InvoiceType", invoiceType]);
                            return oInvoiceType ? oInvoiceType.InvoiceTypeDescription : invoiceType;
                        }
                    },

                    get paymentMethods() {
                        return _paymentMethods.current();
                    },

                    get purchasingGroups() {
                        return _purchasingGroups.current();
                    },

                    get specialGlIndicators() {
                        return _specialGlIndicators.current();
                    },

                    taxCode: {
                        get taxCodes() {
                            return _taxCodes.case({
                                pending: () => [],
                                fulfilled: value => (value)
                            });
                        },

                        get fuse() {
                            return _taxCodes.case({
                                pending: () => undefined,
                                fulfilled: aTaxCodes => {
                                    return new Fuse(aTaxCodes, {
                                        shouldSort: true,
                                        tokenize: true,
                                        matchAllTokens: true,
                                        threshold: 0.6,
                                        location: 0,
                                        distance: 100,
                                        maxPatternLength: 32,
                                        minMatchCharLength: 1,
                                        keys: [
                                            "TaxCodeDescription"
                                        ]
                                    });
                                }
                            });
                        },

                        descriptionOf(sequence) {
                            const oTaxCode = _.find(this.taxCodes, ["Sequence", sequence]);
                            if (oTaxCode) {
                                return oTaxCode.TaxCodeDescription;
                            }
                            return sequence;
                        },

                        taxCodeOf(sequence) {
                            const oTaxCode = _.find(this.taxCodes, ["Sequence", sequence]);
                            if (oTaxCode) {
                                return oTaxCode.TaxCode;
                            }
                            return sequence;
                        }
                    },

                    verifyingOfficers: [],
                    verifyingOfficersAll: []
                },
                ecc: {
                    GR_ROLES: [],
                    GV_PAY_DOCNUM: "",
                    GV_FMAS_POSTDT: "",
                    GV_PAY_CLEARDT: "",
                    GV_PERMIT_PAYEE_NM: "",
                    get gvFmasPostdt() {
                        if (!moment(this.GV_FMAS_POSTDT).isValid()) {
                            return "";
                        }
                        return moment(this.GV_FMAS_POSTDT).format("DD.MM.YYYY");
                    },
                    get gvPayCleardt() {
                        if (!moment(this.GV_PAY_CLEARDT).isValid()) {
                            return "";
                        }
                        return moment(this.GV_PAY_CLEARDT).format("DD.MM.YYYY");
                    }
                },
                invDoc: {
                    header: {},
                    lines: [],
                    assignees: [],
                    attachments: [],
                    creditNotes: [],
                    judgements: [],
                    linkAor: [],
                    linkNa: [],
                    linkPo: {
                        summary: [],
                        po: [],
                        gr: [],
                        grExtra: [],
                        get grAllSelected() {
                            return this.gr.length < 1 ? false : !this.gr.some(oGr => oGr.selcl === "");
                        }
                    },
                    multiplePayees: [],
                    permittedPayees: [],
                    relatedDocuments: [],
                    remarks: "",
                    systemMessages: [],
                    total: {
                        creditNotes: {
                            get preGstAmt() {
                                const sum = _.sumBy(rootStore.appStore.invDoc.creditNotes, "preGstAmt");
                                return rootStore.amountOutputFormat(sum);
                            },

                            get gstAmt() {
                                const sum = _.sumBy(rootStore.appStore.invDoc.creditNotes, "gstAmt");
                                return rootStore.amountOutputFormat(sum);
                            },

                            get postGstAmt() {
                                const sum = _.sumBy(rootStore.appStore.invDoc.creditNotes, "postGstAmt");
                                return rootStore.amountOutputFormat(sum);
                            }
                        },

                        lines: {
                            get preGstAmt() {
                                const sum = _.sumBy(rootStore.appStore.invDoc.lines, "preGstAmt");
                                return rootStore.amountOutputFormat(sum);
                            },

                            get gstAmt() {
                                const sum = _.sumBy(rootStore.appStore.invDoc.lines, "gstAmt");
                                return rootStore.amountOutputFormat(sum);
                            },

                            get postGstAmt() {
                                const sum = _.sumBy(rootStore.appStore.invDoc.lines, "postGstAmt");
                                return rootStore.amountOutputFormat(sum);
                            }
                        },

                        linkNa: {
                            get preGstAmt() {
                                return rootStore.amountOutputFormat(rootStore.appStore.invDoc.linkNa
                                    .map(na => parseFloat(na.preGstAmt))
                                    .reduce((sum, amount) => {
                                        return sum + amount;
                                    }, 0));
                            }
                        },

                        multiplePayees: {
                            get postGstAmt() {
                                return rootStore.appStore.invDoc.multiplePayees
                                    .map(mp => parseFloat(mp.postGstAmt))
                                    .reduce((sum, amount) => {
                                        return sum + amount;
                                    }, 0);
                            }
                        },

                        netPayment: {
                            get preGstAmt() {
                                const sumCn = _.sumBy(rootStore.appStore.invDoc.creditNotes, "preGstAmt");
                                const sumLine = _.sumBy(rootStore.appStore.invDoc.lines, "preGstAmt");
                                return rootStore.amountOutputFormat(sumLine + sumCn);
                            },

                            get gstAmt() {
                                const sumCn = _.sumBy(rootStore.appStore.invDoc.creditNotes, "gstAmt");
                                const sumLine = _.sumBy(rootStore.appStore.invDoc.lines, "gstAmt");
                                return rootStore.amountOutputFormat(sumLine + sumCn);
                            },

                            get postGstAmt() {
                                const sumCn = _.sumBy(rootStore.appStore.invDoc.creditNotes, "postGstAmt");
                                const sumLine = _.sumBy(rootStore.appStore.invDoc.lines, "postGstAmt");
                                return rootStore.amountOutputFormat(sumLine + sumCn);
                            },

                            get postGstAmtRaw() {
                                const sumCn = _.sumBy(rootStore.appStore.invDoc.creditNotes, "postGstAmt");
                                const sumLine = _.sumBy(rootStore.appStore.invDoc.lines, "postGstAmt");
                                return sumLine + sumCn;
                            }
                        }
                    },
                    trainingInfo: [],
                    workflowHistory: []
                },
                invoiceStore: rootStore.createInvoiceStore(rootStore),
                search: {
                    searchTerm: "",
                    dateFormat: "dd.MM.YYYY",
                    invDateLow: d3MonthsAgo,
                    invDateHigh: dToday,
                    userId: "ALLUSERS",
                    status: "",
                    purchasingGroup: "",
                    actionRequiredBy: "",
                    requestors: [],
                    addRequestorToken: function (sRequestorId) {
                        const oRequestor = mobx.observable({
                            UserID: sRequestorId,
                            get FullName() {
                                return rootStore.appStore.userStore.fullnameOf(this.UserID);
                            }
                        });
                        this.requestors.push(oRequestor);
                    },
                    removeRequestorToken: function (sRequestorId) {
                        const tokenToRemove = this.requestors.find(req => req.UserID === sRequestorId);
                        if (tokenToRemove) {
                            this.requestors.remove(tokenToRemove);
                        }
                    }
                },
                statusStore: rootStore.createStatusStore(rootStore),
                view: {
                    aaListIsUpdating: false,
                    advancedSearchVisible: false,
                    attachmentSectionBusy: true,
                    cnButtonVisible: true,
                    editButton: false,
                    frontendUser: "",
                    masterTableBusy: false,
                    mode: "display",
                    naTableMode: "None",
                    processViewBusy: false,
                    procurementDetailsBusy: false,
                    searchIsRunning: false,
                    voListIsUpdating: false,
                    wfHistoryBusy: false,
                    wfHistoryIndex: 0,

                    get approversEditable() {
                        if (appStore.invDoc.header.purchGrp !== "UTY") {
                            return this.roEditMode;
                        }
                        return false;
                    },

                    get attachmentSectionVisible() {
                        return this.roEditMode || appStore.invDoc.attachments.length > 0;
                    },

                    get cnSectionVisible() {
                        return appStore.invDoc.header.invType !== "CN" && (appStore.invDoc.creditNotes.length > 0 || !this.cnButtonVisible);
                    },

                    get cnTableMode() {
                        return this.roEditMode ? "Delete" : "None";
                    },

                    get displayMode() {
                        return !this.editMode;
                    },

                    get expenseTypeVisible() {
                        // return appStore.invDoc.header.linkInvoice === "POWO" || appStore.invDoc.header.linkInvoice === "AOR";
                        // Now applicable to all types of link
                        return true;
                    },

                    get financeInfoVisible() {
                        const status = parseInt(rootStore.appStore.invDoc.header.status, 10);
                        // Visible if user is FVO/IAO and status is at least 04/Approved
                        const bFvoVisible = rootStore.appStore.userIsFvo && status >= 4 && status < 8;
                        const bIaoVisible = rootStore.appStore.userIsIao && status >= 4 && status < 8;
                        // Or if user is FVO and purchasing group is UTY (utility)
                        const bFvoVisibleUty = rootStore.appStore.invDoc.header.purchGrp === "UTY" && rootStore.appStore.userIsFvo;
                        return bFvoVisible || bIaoVisible || bFvoVisible;
                    },

                    get editMode() {
                        // Returns true if invoice is RO editable or FVO editable
                        return this.roEditMode || this.fvoEditMode;
                    },

                    get docIsForeignCurrency() {
                        return rootStore.appStore.invDoc.header.currency !== "SGD";
                    },

                    get fvoEditMode() {
                        if (rootStore.appStore.invDoc.header.purchGrp === "UTY") {
                            //For UTY invoice, editable if user is FVO and status is Draft
                            return rootStore.appStore.userIsFvo && rootStore.appStore.invDoc.header.status === "01";
                        }
                        // Editable if user has FVO role and status of invoice is Approved/04
                        return rootStore.appStore.userIsFvo && rootStore.appStore.invDoc.header.status === "04";
                    },

                    get iconMultiplePayee() {
                        return "";
                        // return rootStore.appStore.invDoc.multiplePayees.length > 0 ? "sap-icon://circle-task-2" : "";
                    },

                    linkEntry: {
                        get aorVisible() {
                            return rootStore.appStore.invDoc.header.linkInvoice === "AOR";
                        },

                        get naVisible() {
                            return rootStore.appStore.invDoc.header.linkInvoice === "NA";
                        },

                        get poVisible() {
                            return rootStore.appStore.invDoc.header.linkInvoice === "POWO";
                        },

                        get index() {
                            switch (rootStore.appStore.invDoc.header.linkInvoice) {
                                case "POWO":
                                    return 0;
                                case "AOR":
                                    return 1;
                                case "NA":
                                    return 2;
                                default:
                                    return 0;
                            }
                        }
                    },

                    get masterTableTitle() {
                        const count = rootStore.appStore.invoiceStore.invoices.length;
                        return count ? "Invoice List (" + count.toString() + ")" : "Invoice List";
                    },

                    get moreInfoMultiplePayeeVisible() {
                        const invDoc = rootStore.appStore.invDoc;
                        const iStatus = parseInt(invDoc.header.status, 10);
                        //Visible if status is at least Parked and multiple payees were entered
                        return iStatus >= 5 && invDoc.multiplePayees.length > 0 && !this.moreInfoPermittedPayeeVisible;
                    },

                    get moreInfoPermittedPayeeVisible() {
                        return !_.isEmpty(rootStore.appStore.invDoc.header.permitPayee);
                    },

                    get offsetButtonVisible() {
                        return this.roEditMode && _.toNumber(rootStore.appStore.invDoc.total.netPayment.postGstAmt) === 0;
                    },

                    get permittedPayeesValueHelp() {
                        return rootStore.appStore.invDoc.permittedPayees.filter(payee => payee.empfk);
                    },

                    relatedContracts: {
                        get assigneeVisible() {
                            try {
                                return rootStore.appStore.invDoc.assignees.length > 0;
                            } catch (e) {
                                return false;
                            }
                        },

                        get judgementVisible() {
                            try {
                                return rootStore.appStore.invDoc.judgements.length > 0;
                            } catch (e) {
                                return false;
                            }
                        },

                        get visible() {
                            return this.assigneeVisible || this.judgementVisible;
                        }
                    },

                    get roDisplayMode() {
                        return !this.roEditMode;
                    },

                    get roEditMode() {
                        // Editable only by RO if status is Draft
                        if (appStore.invDoc.header.purchGrp !== "UTY") {
                            return appStore.userIsRo && appStore.invDoc.header.status === "01" && !appStore.userIsFvo;
                        }
                        return appStore.invDoc.header.status === "01" && appStore.userIsFvo;
                    },

                    get roTableMode() {
                        return this.roEditMode ? "Delete" : "None";
                    },

                    get sumAmountOthers() {
                        return rootStore.amountOutputFormat(rootStore.appStore.invDoc.linkNa
                            .map(na => parseFloat(na.preGstAmt))
                            .reduce((sum, amount) => {
                                return sum + amount;
                            }, 0));
                    },

                    get systemMessagesVisible() {
                        return rootStore.appStore.invDoc.systemMessages.length > 0;
                    },

                    get tableMode() {
                        return this.editMode ? "Delete" : "None";
                    },

                    get textMultiplePayee() {
                        const payeeCount = rootStore.appStore.invDoc.multiplePayees.length;
                        return payeeCount > 0 ? `Multiple Payees (${payeeCount})` : "Multiple Payees";
                    },

                    get textTrainingInfo() {
                        const trainingInfoCount = rootStore.appStore.invDoc.trainingInfo.length;
                        return trainingInfoCount > 0 ? `Training Information (${trainingInfoCount})` : "Training Information";
                    },

                    get uploadEnabled() {
                        return this.roEditMode;
                    },

                    get wfHistorySelected() {
                        if (rootStore.appStore.invDoc.workflowHistory.length < 1) {
                            return {}
                        }
                        return rootStore.appStore.invDoc.workflowHistory[this.wfHistoryIndex];
                    }
                },
                userStore: rootStore.createUserStore(rootStore),

                get blankAorEntry() {
                    //Return a blank AOR object
                    const sFields = "accntAssign assetNo banfn building costCenter delInd estate fundCategory fundcat " +
                        "glAccount imkey invId invRefnum itemno land lineNumber mandt preGstAmt realEstate " +
                        "reobjectentity selcl subAssetNo taxCode taxDescr zzcrsid zzpernr";
                    const oAor = sFields.split(" ")
                        .reduce((obj, name) => {
                            obj[name] = (name === "preGstAmt") ? 0 : "";
                            return obj;
                        }, {});
                    return oAor;
                },

                get blankOtherEntry() {
                    //Return a blank NA or Other object
                    return {
                        "mandt": "",
                        "invId": this.invDoc.header.invId,
                        "lineNumber": "",
                        "invRefnum": "",
                        "accntAssign": "",
                        "assetNo": "",
                        "subAssetNo": "",
                        "glAccount": "",
                        "costCenter": "",
                        "estate": "",
                        "land": "",
                        "building": "",
                        "reobjectentity": "",
                        "preGstAmt": "",
                        "taxCode": "",
                        "delInd": "",
                        "taxDescr": "",
                        "zzpernr": "",
                        "zzcrsid": "",
                        "selcl": "",
                        "itemno": "",
                        "realEstate": "",
                        "imkey": ""
                    };
                },

                // get fuseTaxCode() {
                //
                // },

                get masterExportList() {
                    //Return array of objects for use in Export to excel functionality
                    return this.invoiceStore.invoices.map(inv => {
                        let invTransformed = {};
                        _.forOwn(inv, (value, key) => {
                            invTransformed[key] = value;
                        });
                        ["requestorName", "actionRequiredBy", "statusText", "invoiceReferenceDateFormatted",
                            "netAmountFormatted"].forEach(prop => {
                            invTransformed[prop] = mobx.get(inv, prop);
                        });
                        return invTransformed;
                    });
                },

                get userIsFvo() {
                    // Returns true if user has FVO role
                    return _.findIndex(this.ecc.GR_ROLES, ["low", "PR_IP_FVO"]) > -1;
                },

                get userIsIao() {
                    // Returns true if user has IAO role
                    return _.findIndex(this.ecc.GR_ROLES, ["low", "PR_IP_IAO"]) > -1;
                },

                get userIsRo() {
                    // Returns true if user has requestor role
                    return _.findIndex(this.ecc.GR_ROLES, ["low", "PR_IP_RO"]) > -1;
                },

                // Actions
                addBlankAor: function () {
                    //Add new line to invDoc.linkAor array.
                    let aAor = _.cloneDeep(mobx.toJS(this.invDoc.linkAor));
                    let newAor = this.blankAorEntry;
                    newAor.lineNumber = _.padStart(aAor.length + 1, 5, "0");
                    newAor.itemno = _.padStart((aAor.length + 1) * 10, "0");
                    aAor.push(newAor);
                    this.setLinkAor(aAor);
                },

                addBlankOthers: function() {
                    //Add new line to invDoc.linkNa array.
                    let aNa = _.cloneDeep(this.invDoc.linkNa.toJS());
                    aNa.push({
                        "mandt": "",
                        "invId": this.invDoc.header.invId,
                        "lineNumber": _.padStart(aNa.length + 1, 5, "0"),
                        "invRefnum": "",
                        "accntAssign": "",
                        "assetNo": "",
                        "subAssetNo": "",
                        "glAccount": "",
                        "costCenter": "",
                        "estate": "",
                        "land": "",
                        "building": "",
                        "reobjectentity": "",
                        "preGstAmt": 0,
                        "taxCode": "",
                        "delInd": "",
                        "taxDescr": "",
                        "zzpernr": "",
                        "zzcrsid": "",
                        "selcl": "",
                        "itemno": _.padStart((aNa.length + 1) * 10, 5, "0"),
                        "realEstate": "",
                        "imkey": ""
                    });
                    this.setLinkOthers(aNa);
                },

                addPo: function (sPoNumber) {
                    //Call backend action “ADDPO” and add the returned PO details to invDoc.linkPo.po, invDoc.linkPo.gr,
                    // invDoc.assignees, invDoc.judgements, and invDoc.systemMessages arrays
                    if (!sPoNumber) {
                        return;
                    }
                    this.view.procurementDetailsBusy = true;
                    rootStore.doAction({
                        action: "ADDPO",
                        subAction: "ADDPO",
                        actionParameters: {
                            GV_EBELN: sPoNumber
                        }
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            this.updatePoInformation(oAction);
                        }
                    }).finally(() => this.view.procurementDetailsBusy = false);
                },

                callbackGetUpdatedAttachmentList: function() {
                    //Callback function to update the invDoc.attachments array.
                    //Default logic below if no call back attached
                    return this.invDoc.attachments.toJS().map(o => _.omit(o, "__metadata"));
                },

                callbackModelRefresh: function () {
                    //Callback function to refresh the app state model after modification of values to force re-render of XML views
                },

                cancelInvoice: function(mParameters) {
                    //Call backend action “CANCEL” to trigger invoice cancellation
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "CANCEL",
                        subAction: "CANCEL",
                        actionParameters: _.assign({}, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                initializeDocument: function () {
                    //Initialize invDoc app state object an relevant/related app state properties
                    mobx.keys(this.invDoc).forEach(key => {
                        switch (key) {
                            case "linkPo":
                                ["summary", "po", "gr", "grExtra"].forEach(k => {
                                    const obxArray = mobx.get(this.invDoc.linkPo, k);
                                    if (obxArray) {
                                        obxArray.clear();
                                    }
                                });
                                break;
                            case "remarks":
                                mobx.set(this.invDoc, key, "");
                                break;
                            case "total":
                                //do nothing
                                break;
                            default:
                                const obx = mobx.get(this.invDoc, key);
                                if (mobx.isObservableObject(obx)) {
                                    mobx.set(this.invDoc, key, {});
                                } else if (mobx.isObservableArray(obx)) {
                                    obx.clear();
                                }
                                break;
                        }
                    });
                    this.view.cnButtonVisible = true;
                    this.aux.verifyingOfficers.clear();
                    this.aux.verifyingOfficersAll.clear();
                    this.aux.approvingAuthorities.clear();
                    this.aux.approvingAuthoritiesAll.clear();
                },

                loadInvoice: function(mParameters) {
                    //Call backend action, "LOAD", and update app state with returned data
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "LOAD",
                        subAction: "LOAD",
                        actionParameters: _.assign({}, mParameters)
                    }, true).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            // User roles
                            const aRoles = rootStore.getActionField(oAction.responseData, "GR_ROLES") || [];
                            mobx.set(this.ecc, "GR_ROLES", aRoles);
                            console.log("User Roles:", aRoles);

                            //Check button subscreen being used
                            const sButtonSubscreen = rootStore.getActionField(oAction.responseData, "GV_BUTTON_SUBSCR") || "";
                            const aScreenTable = rootStore.getActionField(oAction.responseData, "GT_FIO_SCREENS") || [];
                            switch (sButtonSubscreen) {
                                case "9080":
                                    //Requestor
                                    let sButtonGroup = rootStore.getActionField(oAction.responseData,"BUTTON_GROUP") || "EXT";
                                    if (sButtonGroup === "CN") {
                                        //Change it to the normal RO buttons, "Submit" will act as ECC "Offset"
                                        sButtonGroup = "10";
                                    }
                                    mobx.set(this.view, "buttonGroup", {Group: sButtonGroup, Type: "Requestor"});
                                    break;
                                default:
                                    //Non-Requestor (e.g. FVO)
                                    const sFvoButtonGroup = _.chain(aScreenTable).find({name: sButtonSubscreen}).get("screenTab.0.group1", "EXT").value();
                                    mobx.set(this.view, "buttonGroup", {Group: sFvoButtonGroup, Type: sButtonSubscreen});
                                    break;
                            }

                            // Valid expense types for the document
                            this.updateExpenseTypesForDoc(rootStore.getActionField(oAction.responseData, "GT_FIO_EXPENSE_TYPES"));

                            // Invoice Header
                            this.setHeader(rootStore.getActionField(oAction.responseData, "ZPR_INVOICE") || {});
                            // Invoice Lines
                            this.setInvLines(rootStore.getActionField(oAction.responseData, "GT_INV_LINE") || []);

                            // Customer accounting
                            const sCustomerAccountingTaxCode = rootStore.getActionField(oAction.responseData, "GV_CA_TXCD") || "";
                            console.log("Customer Accounting tax code:", sCustomerAccountingTaxCode);
                            mobx.set(this.aux, "customerAccountingTaxCode", sCustomerAccountingTaxCode);

                            // Credit Notes
                            this.setCreditNotes(rootStore.getActionField(oAction.responseData, "GT_FIO_CREDITNOTES") || []);

                            // Link to PO information
                            const aPowo = rootStore.getActionField(oAction.responseData, "GT_TC_POWO") || [];
                            this.setLinkPo(aPowo);

                            const aGrse = rootStore.getActionField(oAction.responseData, "GT_TC_GRSE") || [];
                            this.setLinkGr(aGrse);

                            const aPowoLink = rootStore.getActionField(oAction.responseData, "GT_TC_POWOLINK") || [];
                            this.invDoc.linkPo.summary.replace(aPowoLink);

                            const aAssignee = rootStore.getActionField(oAction.responseData, "GT_ASSIGNEE_1") || [];
                            this.invDoc.assignees.replace(aAssignee);

                            const aJudgement = rootStore.getActionField(oAction.responseData, "GT_JUDGEMENT_1") || [];
                            this.invDoc.judgements.replace(aJudgement);

                            const aGrseDetails = rootStore.getActionField(oAction.responseData, "GT_FIO_GRSE_DETAILS") || [];
                            this.invDoc.linkPo.grExtra.replace(aGrseDetails);

                            //Parse and display system messages: GT_SYSTEM_MSG
                            let aSystemMessages = rootStore.getActionField(oAction.responseData, "GT_SYSTEM_MSG") || [];
                            aSystemMessages = _.uniqBy(aSystemMessages, "description");
                            this.setSystemMessages(aSystemMessages);

                            // Link to AOR information
                            const aAor = rootStore.getActionField(oAction.responseData, "GT_TC_AOR") || [];
                            this.setLinkAor(aAor);
                            const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ") || [];
                            this.setEcc("GT_AOR_PROJ", aAorProj);

                            // Link to NA/Others information
                            const aOthers = rootStore.getActionField(oAction.responseData, "GT_TC_NA") || [];
                            this.setLinkOthers(aOthers);

                            // Training information
                            const aTrainingInfoInternal = rootStore.getActionField(oAction.responseData, "GT_UTI_FINAL") || [];
                            mobx.set(this.invDoc, "trainingInfo", aTrainingInfoInternal);

                            // Finance Information
                            ["GV_PAY_DOCNUM", "GV_FMAS_POSTDT", "GV_PAY_CLEARDT", "GV_PERMIT_PAYEE_NM"].forEach(sPath => {
                                const sValue = rootStore.getActionField(oAction.responseData, sPath) || "";
                                this.setEcc(sPath, sValue);
                            });

                            // Multiple Payees
                            const aPayees = rootStore.getActionField(oAction.responseData, "GT_TC_MULTIPAYEE") || [];
                            this.invDoc.multiplePayees.replace(aPayees);

                            // Remarks
                            const aRemarks = rootStore.getActionField(oAction.responseData, "GT_TABLE_LINE2") || [];
                            const sRemarks = aRemarks.reduce((remarks, remLine) => remarks + remLine.line, "") || "";
                            this.invDoc.remarks = sRemarks;

                            // Default link to PO, if blank (for Draft only)
                            if (!this.invDoc.header.linkInvoice && this.invDoc.header.status === "01") {
                                this.invDoc.header.linkInvoice = "POWO";
                            }
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                offsetInvoice: function (mParameters) {
                    //Call backend action "OFFSET_INVOICE" to trigger offset functionality
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "OFFSET_INVOICE",
                        subAction: "OFFSET_INVOICE",
                        actionParameters: _.assign({}, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                parkInvoiceValidate: function (mParameters) {
                    //Call backend action "PARK" to trigger parking validation prior to actual parking of invoice
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "PARK",
                        subAction: "PARK_VALIDATION",
                        actionParameters: _.assign({}, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                parkInvoice: function (mParameters) {
                    //Call backend "PARK" action to trigger parking of invoice
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "PARK",
                        subAction: "PARK_ACTION",
                        actionParameters: _.assign({}, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                postInvoice: function (mParameters) {
                    //Call backend action "POST" to trigger the posting of invoice to FMAS
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "POST",
                        subAction: "POST_ACTION",
                        actionParameters: _.assign({}, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                refreshAttachmentList() {
                    //Retrieve odata AttachmentListSet
                    invMaintainService.retrieveAttachmentList(this.invDoc.header.invId)
                        .then(aAttachments => {
                            this.invDoc.attachments.replace(aAttachments);
                        });
                },

                refreshInvoice() {
                    //Call backend action "REFRESH" and update invDoc.assignees an invDoc.judgements arrays
                    return rootStore.doAction({
                        action: "REFRESH",
                        subAction: "REFRESH",
                        actionParameters: {
                            GV_INVOICE_NUM: rootStore.appStore.invDoc.header.invId,
                            GV_OK_CODE: ""
                        }
                    }, false).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                removeAor(index) {
                    //Remove invDoc.linkAor entry specified by index
                    this.invDoc.linkAor.splice(index, 1);
                    this.invDoc.linkAor.forEach((aor, aorIndex) => {
                        aor.lineNumber = _.padStart(aorIndex + 1, 5, "0");
                        aor.itemno = _.padStart((aorIndex + 1) * 10, 5, "0");
                    });
                },

                removePo: function (index) {
                    //Call backend action "RMVPO" to remove PO line
                    this.view.procurementDetailsBusy = true;
                    this.invDoc.linkPo.po[index].selcl = "X";
                    rootStore.doAction({
                        action: "RMVPO",
                        subAction: "RMVPO"
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            this.updatePoInformation(oAction);
                        }
                        this.view.procurementDetailsBusy = false;
                    }).finally(() => this.view.procurementDetailsBusy = false);
                },

                removeOthers(index) {
                    //Remove invDoc.linkNa specified by index
                    this.invDoc.linkNa.splice(index, 1);
                    this.invDoc.linkNa.forEach((na, naIndex) => {
                        na.lineNumber = _.padStart(naIndex + 1, 5, "0");
                        na.itemno = _.padStart((naIndex + 1) * 10, 5, "0");
                    });
                },

                requestCancellationInit: function (mParameters) {
                    //Call backend action "REQ_CANC" to trigger validation prior to proceeding to request cancellation
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "REQ_CANC",
                        subAction: "REQ_CANC_POPUP",
                        actionParameters: _.assign({
                            GV_REQCAN_OK_CODE: ""
                        }, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                requestCancellation: function (mParameters) {
                    //Call backend action "REQ_CAN" to trigger request for cancellation
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "REQ_CANC",
                        subAction: "REQ_CANC_ACTION",
                        actionParameters: _.assign({
                            GV_REQCAN_OK_CODE: "REQCANC"
                        }, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                rerouteInvoice: function (mParameters) {
                    //Call backend action "REROUTE" to trigger rerouting of invoice
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "REROUTE",
                        subAction: "REROUTE_ACTION",
                        actionParameters: _.assign({
                            GV_ROUTE_OK_CODE: "REROUTE"
                        }, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                rerouteInvoiceInit: function (mParameters) {
                    //Call backend action "REROUTE" to retrieve values to be used in popup prior to actual rerouting
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "REROUTE",
                        subAction: "REROUTE_POPUP",
                        actionParameters: _.assign({}, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                resetSearch() {
                    //Reset appState.search properties to their default values
                    this.search.searchTerm = "";
                    this.search.invDateLow = d3MonthsAgo;
                    this.search.invDateHigh = dToday;
                    this.search.userId = this.view.frontendUser;
                    this.search.status = "";
                    this.search.purchasingGroup = "";
                    this.search.actionRequiredBy = "";
                    this.search.requestors.clear();
                    this.search.addRequestorToken(this.view.frontendUser);
                },

                reverseInvoice: function (mParameters) {
                    //Call backend action "REVERSE" trigger reversal of invoice posting
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "REVERSE",
                        subAction: "REVERSE_ACTION",
                        actionParameters: _.assign({}, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                reverseInvoiceValidate: function (mParameters) {
                    //Call backend action "REVERSE" to run validation prior to actual invoice reversal
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "REVERSE",
                        subAction: "REVERSE_VALIDATION",
                        actionParameters: _.assign({}, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                routeBackInvoice: function (mParameters) {
                    //Call backend action "ROUTE_BACK" to trigger routing back of invoice
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "ROUTE_BACK",
                        subAction: "ROUTE_BACK_ACTION",
                        actionParameters: _.assign({}, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                saveInvoice: function() {
                    //Call backend action "SAVE" to save invoice as draft
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "SAVE",
                        subAction: "SAVE"
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },

                submitInvoice: function(mParameters) {
                    //Call backend action "SUBMIT" to submit invoice for verification or approval
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "SUBMIT",
                        subAction: "SUBMIT",
                        actionParameters: {
                            GV_FIO_POPUP_RES_MULTASSIGN: mParameters.multipleAssigneesOk ? true : false,
                            GT_FIO_FUTUREPOREMARKS: [{line: mParameters.futurePoRemark}] || [],
                            GV_FIO_USER_CONFIRMED: mParameters.userConfirmed ? true : false
                        }
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                },
                
                searchInvoice: function () {
                    //Call backend action "~COMMON~SEARCH" to execute invoice search

                    // if (!this.search.searchTerm && !this.search.invDateLow && !this.search.invDateHigh && !this.search.status && !this.search.purchasingGroup && !this.search.actionRequiredBy && _.isEmpty(this.search.requestors)) {
                    //     return Promise.resolve(undefined);
                    // }
                    return rootStore.doAction({
                        action: "~COMMON~SEARCH",
                        subAction: "SEARCH",
                        actionParameters: {
                            GS_FIO_SEARCH: {
                                invCategory: "EINV",
                                searchTerm: this.search.searchTerm,
                                invDateLow: _.isNil(this.search.invDateLow) ? undefined : moment(this.search.invDateLow).format("YYYYMMDD"),
                                invDateHigh: _.isNil(this.search.invDateHigh) ? undefined : moment(this.search.invDateHigh).format("YYYYMMDD"),
                                status: this.search.status,
                                purchasingGroup: this.search.purchasingGroup,
                                actionRequiredBy: this.search.actionRequiredBy
                            },
                            GT_FIO_SEARCH_REQ: this.search.requestors.map(req => ({requestor: req.UserID}))
                        }
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        return oAction;
                    });
                },

                setCreditNotes(aCreditNotes) {
                    //Set invDoc.creditNotes array
                    const defaultCreditNote = {
                        get cnDateRx() {
                            return moment(this.cnDate).format("DD.MM.YYYY");
                        },

                        get preGstAmtRx() {
                            return rootStore.amountOutputFormat(this.preGstAmt);
                        },

                        get gstAmtRx() {
                            return rootStore.amountOutputFormat(this.gstAmt);
                        },

                        get postGstAmtRx() {
                            return rootStore.amountOutputFormat(this.postGstAmt);
                        },

                        get sgdEquivRx() {
                            return rootStore.amountOutputFormat(this.sgdEquiv);
                        }
                    };

                    const aCreditNotesObx = aCreditNotes.map(cn => {
                        cn.preGstAmt = _.toNumber(cn.preGstAmt);
                        cn.gstAmt = _.toNumber(cn.gstAmt);
                        cn.postGstAmt = _.toNumber(cn.postGstAmt);
                        let cnObx = mobx.observable(defaultCreditNote);
                        mobx.extendObservable(cnObx, cn);
                        return cnObx;
                    });

                    this.invDoc.creditNotes.replace(aCreditNotesObx);
                },

                setEcc(key, value) {
                    //Set appState.ecc key-value pair
                    mobx.set(this.ecc, key, value);
                },

                setHeader(oHeader) {
                    //Set invDoc.header object representing the invoice header
                    const defaultHeader = {
                        get actualPreGstRx() {
                            return rootStore.amountOutputFormat(this.actualPreGst);
                        },
                        set actualPreGstRx(amount) {
                            mobx.set(this, "actualPreGst", rootStore.numberInputFormat(amount));
                        },

                        get actualPostGstRx() {
                            return rootStore.amountOutputFormat(this.actualPostGst);
                        },
                        set actualPostGstRx(amount) {
                            mobx.set(this, "actualPostGst", rootStore.numberInputFormat(amount));
                            this.actualPreGst = this.actualPostGst - this.gstAmtSgd;
                        },

                        get downloadDateRx() {
                            return moment(this.downloadDate).format("DD.MM.YYYY");
                        },

                        get expenseTypeRx() {
                            return this.expenseType + "@" + this.subexpenseType;
                        },

                        set expenseTypeRx(value) {
                            if (!value) {
                                this.expenseType = "";
                                this.subexpenseType = "";
                                return;
                            }
                            const aExpenseType = value.split("@");
                            if (aExpenseType.length > 0) {
                                this.expenseType = aExpenseType[0];
                            }
                            if (aExpenseType.length > 1) {
                                this.subexpenseType = aExpenseType[1];
                            }
                        },

                        get invCategoryRx() {
                            //Will return either "e-Invoice" or "e-Invoice/Credit Note"
                            const sCategory = rootStore.appStore.aux.invoiceCategory.descriptionOf(this.invCategory);
                            const sType = this.invType === "CN" ? "Credit Note" : "";
                            return sType ? sCategory + "/" + sType : sCategory;
                        },

                        get invRefdateRx() {
                            return moment(this.invRefdate).format("DD.MM.YYYY");
                        },

                        get exRateRx() {
                            return rootStore.exchangeRateOutputFormat(this.exRate);
                        },

                        set exRateRx(exRate) {
                            mobx.set(this, "exRate", rootStore.numberInputFormat(exRate));
                        },

                        get multiplePayeeButtonVisible() {
                            return this.permitPayee === "";
                        },
                        
                        get nricVisible() {
                            return this.caye === "Y";
                        },

                        get permitPayeeEditable() {
                            return appStore.view.fvoEditMode && appStore.invDoc.multiplePayees.length < 1;
                        },

                        get permitPayeeRxId() {
                            return _.trimStart(this.permitPayee, "0");
                        },

                        get permitPayeeRx() {
                            const payee = _.find(rootStore.appStore.invDoc.permittedPayees, ["empfk", this.permitPayee]);
                            if (payee) {
                                return payee.name;
                            }
                            if (!this.permitPayee) {
                                return "";
                            }
                            return _.trimStart(this.permitPayee, "0");
                        },

                        get preGstAmtRx() {
                            return rootStore.amountOutputFormat(this.preGstAmt);
                        },

                        set preGstAmtRx(amount) {
                            this.preGstAmt = rootStore.numberInputFormat(amount);
                        },

                        get sgdEquivRx() {
                            return rootStore.amountOutputFormat(this.sgdEquiv);
                        },

                        get gstAmtSgdRx() {
                            return rootStore.amountOutputFormat(this.gstAmtSgd);
                        },
                        set gstAmtSgdRx(amount) {
                            mobx.set(this, "gstAmtSgd", rootStore.numberInputFormat(amount));
                            this.actualPreGst = this.actualPostGst - this.gstAmtSgd;
                        },

                        get statusText() {
                            return rootStore.appStore.statusStore.textOf(this.status);
                        },

                        get vendorIdRx() {
                            return _.trimStart(this.vendorId, "0");
                        }
                    };

                    let oHeaderObx = mobx.observable(defaultHeader);
                    mobx.extendObservable(oHeaderObx, oHeader);
                    this.invDoc.header = oHeaderObx;
                },

                setInvLines(aLines) {
                    //Set invDoc.lines array representing the invoice lines
                    const arrObx = aLines.map(line => {
                        let lineObx = mobx.observable({
                            get invLineNoRx() {
                                return _.trimStart(this.invLineNo, "0");
                            },

                            get preGstAmtRx() {
                                return rootStore.amountOutputFormat(this.preGstAmt);
                            },

                            get gstAmtRx() {
                                return rootStore.amountOutputFormat(this.gstAmt);
                            },

                            get postGstAmtRx() {
                                return rootStore.amountOutputFormat(this.postGstAmt);
                            }
                        });
                        mobx.extendObservable(lineObx, line);
                        return lineObx;
                    });

                    this.invDoc.lines.replace(arrObx);
                },

                setLinkAor(aAor) {
                    //Set invDoc.linkAor array (for invoice linked to AOR)
                    const appStore = this;
                    const defaultAor = {
                        get editMode() {
                            return appStore.view.editMode && !_.isEmpty(this.banfn);
                        },

                        get accntAssignEditable() {
                            return this.editMode && !this.projRelated;
                        },
                        get accntAssignRx() {
                            return this.accntAssign;
                        },
                        set accntAssignRx(value) {
                            this.accntAssign = value;
                            if (value !== "ASSET") {
                                this.assetCombined = "";
                            }
                            if (!_.startsWith(value, "GL")) {
                                this.glAccount = "";
                            }
                            if (value !== "GLRE") {
                                this.estateRx = "";
                                this.landRx = "";
                                this.buildingRx = "";
                                this.reobjectentityRx = "";
                                this.imkey = "";
                            }
                            if (value !== "GLCC") {
                                this.costCenter = "";
                            }
                        },

                        get assetNoEditable() {
                            return this.editMode && this.accntAssignEditable && this.accntAssign === "ASSET";
                        },
                        get glAccountEditable() {
                            return this.editMode && this.accntAssignEditable && _.startsWith(this.accntAssign, "GL");
                        },
                        get costCenterEditable() {
                            return this.editMode && this.accntAssignEditable && _.endsWith(this.accntAssign, "CC");
                        },

                        get estateRx() {
                            return this.estate;
                        },
                        set estateRx(value) {
                            this.estate = value;
                            if (!value) {
                                this.realEstate = "";
                                return;
                            }
                            if (value && !this.building && !this.land && !this.reobjectentity) {
                                this.realEstate = value;
                            }
                        },

                        get landRx() {
                            return this.land;
                        },
                        set landRx(value) {
                            this.land = value;
                            if (value && !this.building) {
                                this.realEstate = value;
                            }
                        },

                        get buildingRx() {
                            return this.building;
                        },
                        set buildingRx(value) {
                            this.building = value;
                            if (value) {
                                this.realEstate = value;
                            }
                        },

                        get reobjectentityRx() {
                            return this.reobjectentity;
                        },
                        set reobjectentityRx(value) {
                            this.reobjectentity = value;
                            if (value && !this.land && !this.building) {
                                this.realEstate = value;
                            }
                        },

                        get preGstAmtEditable() {
                            const iStatus = parseInt(appStore.invDoc.header.status);
                            return iStatus < 4 && iStatus > 0 && appStore.view.editMode && !_.isEmpty(this.banfn);
                        },
                        get banfnEditable() {
                            const iStatus = parseInt(appStore.invDoc.header.status);
                            return iStatus < 4 && iStatus > 0 && appStore.view.editMode;
                        },
                        // "taxCode": "P7",
                        get fundCategoryEditable() {
                            return this.editMode && this.projRelated;
                        },
                        get taxDescrEditable() {
                            return this.editMode;
                        },
                        get realEstateEditable() {
                            return this.editMode && this.accntAssignEditable && _.endsWith(this.accntAssign, "RE");
                        },

                        get itemnoFormatted() {
                            return _.trimStart(this.itemno, "0");
                        },

                        get assetCombined() {
                            let combined = _.trimStart(this.assetNo, "0");
                            if (combined === "") {
                                return combined;
                            }
                            if (this.subAssetNo) {
                                let subAssetNoTrimmed = _.trimStart(this.subAssetNo, "0");
                                subAssetNoTrimmed = subAssetNoTrimmed === "" ? "0" : subAssetNoTrimmed;
                                combined = combined + "/" + subAssetNoTrimmed;
                            }
                            return combined;
                        },

                        set assetCombined(value) {
                            if (value === "") {
                                this.assetNo = "";
                                this.subAssetNo = "";
                                return;
                            }
                            let asset = value.split("/");
                            if (asset.length > 0) {
                                this.assetNo = asset[0];
                                this.subAssetNo = asset[1] || "0";
                            }
                        },

                        get glAccountFormatted() {
                            return _.trimStart(this.glAccount, "0");
                        },
                        set glAccountFormatted(value) {
                            this.glAccount = value;
                        },

                        get preGstAmtFormatted() {
                            if (!this.preGstAmt) {
                                return "";
                            }
                            return rootStore.amountOutputFormat(this.preGstAmt);
                        },
                        set preGstAmtFormatted(value) {
                            this.preGstAmt = rootStore.numberInputFormat(value);
                        },

                        get realEstateComputed() {
                            return this.realEstate;
                        },

                        set realEstateComputed(value) {
                            this.realEstate = value;
                        },

                        get banfnRx() {
                            return this.banfn;
                        },
                        set banfnRx(value) {
                            this.banfn = value;
                        },

                        get projRelated() {
                            try {
                                const aorProj = mobx.get(appStore.ecc, "GT_AOR_PROJ");
                                if (aorProj) {
                                    const oAorProj = _.find(aorProj.toJS(), {aorNo: this.banfn});
                                    if (oAorProj) {
                                        return oAorProj.projRelExp === "YES";
                                    }
                                }
                            } catch (e) {
                                console.error(e);
                            }
                            return false;
                        }
                    };

                    this.invDoc.linkAor.replace(aAor.map(oAor => {
                        let oAorObx = mobx.observable(defaultAor);
                        mobx.extendObservable(oAorObx, oAor);
                        return oAorObx;
                    }));
                },

                setLinkGr(aGr) {
                    //Set invDoc.linkPo.gr array (for invoice linked to POWO)
                    const aGrObx = aGr.map(oGr => {
                        let oGrObx = mobx.observable({
                            get dmbtrRx() {
                                return rootStore.amountOutputFormat(this.dmbtr);
                            },

                            get ebelpRx() {
                                return _.trimStart(this.ebelp, "0");
                            },

                            get erfmgRx() {
                                return rootStore.quantityOutputFormat(this.erfmg);
                            }
                        });
                        mobx.extendObservable(oGrObx, oGr);
                        return oGrObx;
                    });
                    this.invDoc.linkPo.gr.replace(aGrObx);
                },

                setLinkOthers: function (aOthers) {
                    //Set invDoc.linkNa array (for invoice linked to Others, previously referred to as NA)
                    const defaultOthers = {
                        get lineNumberRx() {
                            return _.trimStart(this.lineNumber, "0");
                        },

                        get accntAssignRx() {
                            return appStore.aux.accountAssignment.descriptionOf(this.accntAssign);
                        },

                        get assetCombined() {
                            let combined = _.trimStart(this.assetNo, "0");
                            if (combined === "") {
                                return combined;
                            }
                            if (this.subAssetNo) {
                                let subAssetNoTrimmed = _.trimStart(this.subAssetNo, "0");
                                subAssetNoTrimmed = subAssetNoTrimmed === "" ? "0" : subAssetNoTrimmed;
                                combined = combined + "/" + subAssetNoTrimmed;
                            }
                            return combined;
                        },

                        set assetCombined(value) {
                            if (value === "") {
                                this.assetNo = "";
                                this.subAssetNo = "";
                                return;
                            }
                            let asset = value.split("/");
                            if (asset.length > 0) {
                                this.assetNo = asset[0];
                                this.subAssetNo = asset[1] || "0";
                            }
                        },

                        get glAccountRx() {
                            return _.trimStart(this.glAccount, "0");
                        },
                        set glAccountRx(value) {
                            this.glAccount = value;
                        },

                        get estateRx() {
                            return this.estate;
                        },
                        set estateRx(value) {
                            this.estate = value;
                            if (!value) {
                                this.realEstate = "";
                                return;
                            }
                            if (value && !this.building && !this.land && !this.reobjectentity) {
                                this.realEstate = value;
                            }
                        },

                        get landRx() {
                            return this.land;
                        },
                        set landRx(value) {
                            this.land = value;
                            if (value && !this.building) {
                                this.realEstate = value;
                            }
                        },

                        get buildingRx() {
                            return this.building;
                        },
                        set buildingRx(value) {
                            this.building = value;
                            if (value) {
                                this.realEstate = value;
                            }
                        },

                        get reobjectentityRx() {
                            return this.reobjectentity;
                        },
                        set reobjectentityRx(value) {
                            this.reobjectentity = value;
                            if (value && !this.land && !this.building) {
                                this.realEstate = value;
                            }
                        },

                        get preGstAmtFormatted() {
                            if (!this.preGstAmt) {
                                return "";
                            }
                            return rootStore.amountOutputFormat(this.preGstAmt);
                        },
                        set preGstAmtFormatted(value) {
                            this.preGstAmt = rootStore.numberInputFormat(value);
                        },

                        get taxDescrEnglish() {
                            return appStore.aux.taxCode.descriptionOf(this.taxDescr);
                        },
                        get taxDescrRx() {
                            return this.taxDescr;
                        },
                        set taxDescrRx(seq) {
                            this.taxDescr = seq;
                            this.taxCode = appStore.aux.taxCode.taxCodeOf(seq);
                        },

                        get editMode() {
                            return appStore.view.editMode;
                        },
                        get assetNoEditable() {
                            return this.editMode && this.accntAssign === "ASSET";
                        },
                        get glAccountEditable() {
                            return this.editMode && _.startsWith(this.accntAssign, "GL");
                        },
                        get costCenterEditable() {
                            return this.editMode && _.endsWith(this.accntAssign, "CC");
                        },
                        get realEstateEditable() {
                            return this.editMode && _.endsWith(this.accntAssign, "RE");
                        }
                    };

                    const aOtherObx = aOthers.map((other, index) => {
                        let otherObx = mobx.observable(defaultOthers);
                        other.lineNumber = _.padStart(index + 1, 5, "0");
                        other.itemno = _.padStart((index + 1) * 10, 5, "0");
                        mobx.extendObservable(otherObx, other);
                        return otherObx;
                    });
                    this.invDoc.linkNa.replace(aOtherObx);
                },

                setLinkPo: function (aPo) {
                    //Set invDoc.linkPo.po array (for invoices linked to POWO)
                    const aPoObx = aPo.map(po => {
                        let poObx = mobx.observable({
                            get ebelpRx() {
                                return _.trimStart(this.ebelp, "0");
                            },

                            get mengeRx() {
                                return rootStore.quantityOutputFormat(this.menge);
                            },

                            get netwrRx() {
                                return rootStore.amountOutputFormat(this.netwr);
                            }
                        });
                        mobx.extendObservable(poObx, po);
                        return poObx;
                    });
                    this.invDoc.linkPo.po.replace(aPoObx);
                },

                setSystemMessages(aSystemMessages) {
                    //Set invDoc.systemMessages array
                    const aSysteMessagesObx = aSystemMessages.map(sm => {
                        let smObx = mobx.observable({
                            get icon() {
                                switch (this.type) {
                                    case 'E':
                                        return "sap-icon://message-error";
                                    case 'W':
                                        return "sap-icon://message-warning";
                                    default:
                                        return "sap-icon://message-information";
                                }
                            }
                        });
                        mobx.extendObservable(smObx, sm);
                        return smObx;
                    });
                    this.invDoc.systemMessages.replace(aSysteMessagesObx);
                },

                toggleAdvancedSearch: function () {
                    //Toggle visibility of advanced search filter
                    this.view.advancedSearchVisible = !this.view.advancedSearchVisible;
                },

                updateAorLine: function () {
                    //Call backend action "ADDAORLINE" to update invDoc.linkAor with computed values from backend
                    this.view.procurementDetailsBusy = true;
                    rootStore.doAction({
                        action: "ADDAORLINE",
                        subAction: "ADDAORLINE"
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                            mobx.set(this.ecc, "GT_AOR_PROJ", aAorProj);
                            console.log("GT_AOR_PROJ: ", aAorProj);
                            const aAor = rootStore.getActionField(oAction.responseData, "GT_TC_AOR");
                            this.setLinkAor(aAor);
                            console.log("GT_TC_AOR: ", aAor);
                            // Valid expense types for the document
                            this.updateExpenseTypesForDoc(rootStore.getActionField(oAction.responseData, "GT_FIO_EXPENSE_TYPES"));
                        }
                    }).finally(() => this.view.procurementDetailsBusy = false);
                },

                updateLinkNaWithTraining: function () {
                    //Call backend action "UTAC" to update invDoc.linkNa with computed values based on training info
                    this.view.procurementDetailsBusy = true;
                    rootStore.doAction({
                        action: "UTAC",
                        subAction: "APPLY_UTI",
                        actionParameters: {
                            GV_TR_MODE: "E"
                        }
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            const aOthers = rootStore.getActionField(oAction.responseData, "GT_TC_NA");
                            this.setLinkOthers(aOthers);
                            console.log("GT_TC_NA: ", aOthers);
                        }
                    }).finally(() => this.view.procurementDetailsBusy = false);
                },

                updatePoInformation: function (oAction) {
                    //Update invDoc.linkPo and related data with data returned from backend
                    if (oAction.responseCode !== "OK") {
                        return;
                    }
                    const aPowo = rootStore.getActionField(oAction.responseData, "GT_TC_POWO");
                    this.setLinkPo(aPowo);

                    const aGrse = rootStore.getActionField(oAction.responseData, "GT_TC_GRSE");
                    this.setLinkGr(aGrse);

                    const aAssignee = rootStore.getActionField(oAction.responseData, "GT_ASSIGNEE_1") || [];
                    this.invDoc.assignees.replace(aAssignee);

                    const aJudgement = rootStore.getActionField(oAction.responseData, "GT_JUDGEMENT_1") || [];
                    this.invDoc.judgements.replace(aJudgement);

                    const aSystemMessages = rootStore.getActionField(oAction.responseData, "GT_SYSTEM_MSG");
                    this.setSystemMessages(aSystemMessages);
                    // Valid expense types for the document
                    this.updateExpenseTypesForDoc(rootStore.getActionField(oAction.responseData, "GT_FIO_EXPENSE_TYPES"));
                },

                updateApproversList: function () {
                    //Call backend action "GETAALIST" to update approvers list based on backend computation of approval
                    this.view.aaListIsUpdating = true;
                    this.view.voListIsUpdating = true;
                    rootStore.doAction({
                        action: "GETAALIST",
                        subAction: "GETAALIST"
                    }).then(oAction => {
                        //Check for error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //Parse response and extract list of approvers
                            const aApprovers = rootStore.getActionField(oAction.responseData, "GT_AA_VRM");
                            console.log("GT_AA_VRM: ", aApprovers);
                            const aApprovingAuthorities = aApprovers.map(oApprover => {
                                return {
                                    AAUserID: oApprover.key,
                                    AAFullName: oApprover.text
                                };
                            });
                            // mobx.set(rootStore.appStore.aux, "approvingAuthorities", _.reject(aApprovingAuthorities, {"AAUserID": rootStore.appStore.invDoc.header.verifyOfcr}));
                            this.aux.approvingAuthoritiesAll.replace(aApprovingAuthorities);
                            this.aux.approvingAuthorities.replace(_.reject(aApprovingAuthorities, {"AAUserID": rootStore.appStore.invDoc.header.verifyOfcr}));

                            const oApprover = _.find(aApprovingAuthorities, {AAUserID: this.invDoc.header.approveAuth});
                            if (this.view.roEditMode && !oApprover) {
                                //TODO: revisit this logic
                                mobx.set(this.invDoc.header, "approveAuth", "");
                            }
                            const aVO = rootStore.getActionField(oAction.responseData, "GT_FIO_VO_VRM");
                            console.log("GT_FIO_VO_VRM: ", aVO);
                            const aVerifyingOfficers = aVO.map(oVO => {
                                return {
                                    VOUserID: oVO.key,
                                    VOFullName: oVO.text
                                };
                            });
                            mobx.set(this.aux, "verifyingOfficers", aVerifyingOfficers);
                            mobx.set(this.aux, "verifyingOfficersAll", _.cloneDeep(aVerifyingOfficers));
                        }
                    }).finally(() => {
                        this.view.aaListIsUpdating = false;
                        this.view.voListIsUpdating = false;
                    });
                },

                updateExpenseTypesForDoc: function (aExpenseTypesInput) {
                    // Update appState.aux.expenseTypesForDocument with valid expense types for the invoice
                    const aExpenseTypes = aExpenseTypesInput.map(oExpense => {
                            return {
                                expenseType: oExpense.expenseType,
                                subExpenseType: oExpense.subexpenseType,
                                key: oExpense.expenseType + "@" + oExpense.subexpenseType
                            }
                        });
                    this.aux.expenseTypesForDocument.replace(aExpenseTypes);
                    const header = this.invDoc.header;
                    if (aExpenseTypes.length > 0 && !_.find(aExpenseTypes, {expenseType: header.expenseType, subExpenseType: header.subexpenseType})) {
                        // Comment out to remove default, user must select entry
                        // header.expenseType = aExpenseTypes[0].expenseType;
                        // header.subexpenseType = aExpenseTypes[0].subExpenseType;
                    }
                },

                withdrawInvoice: function (mParameters) {
                    //Call backend action "WITHDRAW" to trigger withdraw invoice submission
                    this.view.processViewBusy = true;
                    return rootStore.doAction({
                        action: "WITHDRAW",
                        subAction: "WITHDRAW",
                        actionParameters: _.assign({}, mParameters)
                    }).then(oAction => {
                        //Check and log error messages
                        rootStore.logActionResponse(oAction);
                        if (oAction.responseCode === "OK") {
                            //const aAorProj = rootStore.getActionField(oAction.responseData, "GT_AOR_PROJ");
                        }
                        this.view.processViewBusy = false;
                        return oAction;
                    });
                }
            }, {
                addBlankAor: mobx.action,
                addBlankOthers: mobx.action,
                callbackGetUpdatedAttachmentList: mobx.action,
                callbackModelRefresh: mobx.action,
                cancelInvoice: mobx.action,
                initializeDocument: mobx.action,
                loadInvoice: mobx.action,
                parkInvoice: mobx.action,
                parkInvoiceValidate: mobx.action,
                postInvoice: mobx.action,
                refreshAttachmentList: mobx.action,
                removeAor: mobx.action,
                removePo: mobx.action,
                removeOthers: mobx.action,
                requestCancellation: mobx.action,
                requestCancellationInit: mobx.action,
                rerouteInvoice: mobx.action,
                rerouteInvoiceInit: mobx.action,
                resetSearch: mobx.action,
                reverseInvoice: mobx.action,
                reverseInvoiceValidate: mobx.action,
                routeBackInvoice: mobx.action,
                saveInvoice: mobx.action,
                submitInvoice: mobx.action,
                searchInvoice: mobx.action,
                setCreditNotes: mobx.action,
                setEcc: mobx.action,
                setHeader: mobx.action,
                setInvLines: mobx.action,
                setLinkAor: mobx.action,
                setLinkGr: mobx.action,
                setLinkOthers: mobx.action,
                setLinkPo: mobx.action,
                setSystemMessages: mobx.action,
                toggleAdvancedSearch: mobx.action,
                updateAorLine: mobx.action,
                updateApproversList: mobx.action,
                updateExpenseTypesForDoc: mobx.action,
                updatePoInformation: mobx.action,
                withdrawInvoice: mobx.action
            }, {
                name: "AppStore"
            });

            return rootStore.appStore;
        },

        createInvoiceStore: function (rootStore) {
            return mobx.observable({
                invoices: [],

                createInvoice(oInvoice) {
                    let oInvoiceObx = mobx.observable({
                        get requestorName() {
                            return rootStore.appStore.userStore.fullnameOf(this.RequestorID);
                        },

                        get actionRequiredBy() {
                            return rootStore.appStore.userStore.fullnameOf(this.InvoiceApprovingOfficer);
                        },

                        get statusText() {
                            return rootStore.appStore.statusStore.textOf(this.Status);
                        },

                        get amountBeforeGstFormatted() {
                            return parseFloat(this.AmountBeforeGst).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString();
                        },

                        get invoiceReferenceDateFormatted() {
                            return moment(this.InvoiceReferenceDate).format("DD.MM.YYYY");
                        },

                        get netAmountFormatted() {
                            return rootStore.amountOutputFormat(this.netAmount);
                        }
                    });
                    mobx.extendObservable(oInvoiceObx, oInvoice);
                    return oInvoiceObx;
                },

                setInvoices(aInvoices) {
                    if (aInvoices.length < 1) {
                        this.invoices.clear();
                    } else {
                        this.invoices.replace(aInvoices.map(this.createInvoice));
                    }
                }
            }, {
                createInvoice: mobx.action.bound,
                setInvoices: mobx.action.bound
            }, {
                name: "InvoiceStore"
            });
        },

        createStatusStore: function (rootStore) {
            const _statuses = mobxUtils.fromPromise(invCommonService.retrieveStatuses());

            return mobx.observable({
                get statuses() {
                    return _statuses.value;
                },

                textOf(statusId) {
                    const status = _.find(this.statuses, {Status: statusId});
                    if (status) {
                        return status.StatusText;
                    }
                    return statusId;
                }
            }, {}, {name: "StatusStore"});
        },

        createUserStore: function (rootStore) {
            const _users = mobxUtils.fromPromise(invCommonService.retrievePromptUsers());

            return mobx.observable({
                get users() {
                    return _users.value;
                },

                fullnameOf(userId) {
                    const user = _.find(this.users, ["UserID", userId]);
                    if (user) {
                        return user.FullName;
                    }
                    return userId;
                }
            }, {}, {
                name: "UserStore"
            });
        },

        numberInputFormat: function (amountExternal) {
            if (typeof amountExternal === "string") {
                let amountInternal = parseFloat(amountExternal.replace(/,/g, ""));
                if (_.isNaN(amountInternal)) {
                    return 0;
                }
                return amountInternal;
            }
            return amountExternal;
        },

        amountOutputFormat: function (amount) {
            return parseFloat(amount).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString();
        },

        dateOutputFormat: function (inDate) {
            return moment(inDate).format("DD.MM.YYYY");
        },

        doAction: function (mParameters, bBareRequest=false) {
            if (_.startsWith(mParameters.action, "~COMMON~") || bBareRequest) {
                return this.doActionCommon(mParameters);
            }

            return new Promise((resolve, reject) => {
                if (_.isEmpty(this.appStore.invDoc.header)) {
                    reject("Invoice header is blank. Action cannot continue.");
                    return;
                }
                // Initialize Action entity properties
                let oAction = {
                    action: mParameters.action,
                    subAction: mParameters.subAction,
                    requestData: "",
                    responseCode: "",
                    responseMessage: "",
                    responseData: ""
                };

                let aRequestData = [];

                // Header
                aRequestData.push({
                    name: "ZPR_INVOICE",
                    value: JSON.stringify(this.appStore.invDoc.header)
                });

                // Table control: Link to NA
                aRequestData.push({
                    name: "GT_FIO_LINK_NA",
                    value: JSON.stringify(this.appStore.invDoc.linkNa.filter(na => !_.isEmpty(na.accntAssign)))
                });

                // Table control: Link to POWO
                aRequestData.push({
                    name: "GT_TC_POWO",
                    value: JSON.stringify(this.appStore.invDoc.linkPo.po.toJS() || [])
                });
                aRequestData.push({
                    name: "GT_TC_GRSE",
                    value: JSON.stringify(this.appStore.invDoc.linkPo.gr.toJS() || [])
                });

                // Table control: Link to AOR
                aRequestData.push({
                    name: "GT_TC_AOR",
                    value: JSON.stringify(this.appStore.invDoc.linkAor.toJS() || [])
                });

                // Training Information
                aRequestData.push({
                    name: "GT_UTI_FINAL",
                    value: JSON.stringify(this.appStore.invDoc.trainingInfo.toJS() || [])
                });

                // Credit notes section
                aRequestData.push({
                    name: "GT_FIO_CREDITNOTES",
                    value: JSON.stringify(this.appStore.invDoc.creditNotes.toJS() || [])
                });

                // Multiple Payees
                aRequestData.push({
                    name: "GT_TC_MULTIPAYEE",
                    value: JSON.stringify(this.appStore.invDoc.multiplePayees.toJS() || [])
                });

                // Attachment list (updated) for Save/Submit only, same as in ECC program
                if (mParameters.action === "SAVE" || mParameters.action === "SUBMIT") {
                    aRequestData.push({
                        name: "GT_FIO_ATTACHMENTS",
                        value: JSON.stringify(this.appStore.callbackGetUpdatedAttachmentList())
                    });
                }

                // Remarks as a parameter
                const aRemarksSplit = this.appStore.invDoc.remarks.match(/.{1,132}/g) || [];
                const remarksTab = aRemarksSplit.map(function (value) {
                    return {
                        tdformat: "*",
                        tdline: value
                    }
                });
                aRequestData.push({
                    name: "GT_FIO_REMARKS",
                    value: JSON.stringify(remarksTab || [])
                });

                //Remarks as a table of lines of 128 char each
                const sRemarks = this.appStore.invDoc.remarks;
                const aRemarkLine128 = sRemarks.match(/.{1,128}/g) || [];
                const aRemarkLineTab = aRemarkLine128.map((remarkLine) => {
                    return {line: remarkLine};
                });
                aRequestData.push({
                    name: "GT_TABLE_LINE2",
                    value: JSON.stringify(aRemarkLineTab)
                });

                // Other global fields for backend program (always sent regardless of action/subAction)
                const sTrMode = _.get(mParameters, "actionParameters.GV_TR_MODE", "D");
                const sOkCode = _.get(mParameters, "actionParameters.GV_OK_CODE", oAction.action);
                aRequestData.push(...[{
                    name: "GV_INVOICE_NUM",
                    value: JSON.stringify(this.appStore.invDoc.header.invId)
                }, {
                    name: "GV_TR_MODE",
                    value: JSON.stringify(sTrMode)
                }, {
                    name: "GV_OK_CODE",
                    value: JSON.stringify(sOkCode)
                }, {
                    name: "GV_FIO_SUBFUNCTION",
                    value: JSON.stringify(oAction.subAction)
                }, {
                    name: "GV_FIO_WILL_UPDATE_POWO",
                    value: JSON.stringify(true)
                }]);

                // Other action parameters specifically for the action to be executed
                _.forOwn(mParameters.actionParameters, (value, key) => {
                    aRequestData.push({
                        name: key,
                        value: JSON.stringify(value)
                    });
                });

                // Convert request data to JSON string
                oAction.requestData = JSON.stringify(aRequestData);
                invMaintainService.executeAction(oAction)
                    .then(resolve)
                    .catch(reject);
            });
        },

        doActionCommon: function (mParameters) {
            //Common actions that are not related to a specific document/invoice
            //Or any action that doesn't need any invoice details
            return new Promise((resolve, reject) => {

                // Initialize Action entity properties
                let oAction = {
                    action: mParameters.action,
                    subAction: mParameters.subAction,
                    requestData: "",
                    responseCode: "",
                    responseMessage: "",
                    responseData: ""
                };

                let aRequestData = [{
                    name: "GV_FIO_SUBFUNCTION",
                    value: JSON.stringify(oAction.subAction)
                }];

                // Other action parameters specifically for the action to be executed
                _.forOwn(mParameters.actionParameters, (value, key) => {
                    aRequestData.push({
                        name: key,
                        value: JSON.stringify(value)
                    });
                });

                // Convert request data to JSON string
                oAction.requestData = JSON.stringify(aRequestData);
                invMaintainService.executeAction(oAction)
                    .then(resolve)
                    .catch(reject);
            });
        },

        exchangeRateOutputFormat: function (exRate) {
            return parseFloat(exRate).toFixed(5).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString();
        },

        getActionField: function (sResponseData, sFieldName) {
            const aResponseData = JSON.parse(sResponseData);
            const aData = _.chain(aResponseData).find({name: sFieldName}).get("value").value();
            if (aData) {
                return JSON.parse(aData);
            }
            return undefined;
        },

        logActionResponse: function (oAction) {
            const sAction = oAction.action + "/" + oAction.subAction;
            console.log(`${sAction} response code: `, oAction.responseCode);
            console.log(`${sAction} response message: `, oAction.responseMessage);
            const aResponseData = JSON.parse(oAction.responseData);
            console.log(`${sAction} response: `, aResponseData);

            if (oAction.responseCode === "ERROR") {
                const aErrors = this.getActionField(oAction.responseData, "GT_FIO_ACTION_MSG");
                console.log(`${sAction} errors: `, aErrors);
            }
        },

        quantityOutputFormat: function (quantity) {
            return parseFloat(quantity).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString();
        }
    };

    const appStore = RootStore.createAppStore();

    // Reaction: Do an invoice search if any of the search term changes
    mobx.reaction(
        () => {
            // let search = {};
            // _.forOwn(appStore.search, (value, key) => {
            //     search[key] = value;
            // });
            // return search;
            let search = _.pick(appStore.search, ["status", "invDateLow", "invDateHigh", "searchTerm", "userId", "purchasingGroup", "actionRequiredBy"]);
            search.requestors = appStore.search.requestors.map(req => _.pick(req, ["UserID", "FullName"]));
            return search;
        },
        _.debounce((search) => {
            appStore.view.searchIsRunning = true;
            const sStatus = search.status;
            const dFrom = search.invDateLow;
            const dTo = search.invDateHigh;
            const sSearchTerm = search.searchTerm;
            const sUserId = search.userId;
            const sPurchasingGroup = search.purchasingGroup;
            const sActionRequiredBy = search.actionRequiredBy;
            const aRequestors = search.requestors;

            let aUsers = [];
            if (sSearchTerm) {
                aUsers = appStore.userStore.users.filter((oUser) => {
                    return RegExp(sSearchTerm, "i").test(oUser.FullName);
                });
            }

            appStore.view.masterTableBusy = true;

            appStore.searchInvoice()
                .then(oAction => {
                    // const aResultInvoices = RootStore.getActionField(oAction.responseData, 'INVOICES');
                    // const aResultCreditNotes = RootStore.getActionField(oAction.responseData, 'CREDIT_NOTES');
                    // const aInvoices = aResultInvoices.map(inv => {
                    //     const oInvoice = {
                    //         InvoiceID: inv.invId,
                    //         InvoiceReference: inv.invRefnum,
                    //         InvoiceReferenceDate: inv.invRefdate,
                    //         VendorNameInterface: inv.vendorNameInt,
                    //         Description: inv.description,
                    //         RequestorID: inv.requestor,
                    //         Status: inv.status,
                    //         AmountBeforeGst: inv.preGstAmt,
                    //         AmountAfterGst: inv.postGstAmt,
                    //         InvoiceApprovingOfficer: inv.iao,
                    //         PurchasingGroup: inv.purchGroup,
                    //         Currency: inv.currency
                    //     };
                    //
                    //     //Summarize credit notes if any
                    //     const totalCreditNoteAmt = _.sumBy(aResultCreditNotes.filter(rcn => rcn.linkInvoiceId === inv.invId), cn => parseFloat(cn.postGstAmt));
                    //     oInvoice.netAmount = parseFloat(inv.postGstAmt) + totalCreditNoteAmt;
                    //     return oInvoice;
                    // });
                    // appStore.invoiceStore.setInvoices(aInvoices);
                    // appStore.view.masterTableBusy = false;
                    // appStore.view.searchIsRunning = false;
                    let bRetrieveAll = false;
                    const search = appStore.search;
                    if (!search.searchTerm && !search.invDateLow && !search.invDateHigh && !search.status && !search.purchasingGroup && !search.actionRequiredBy && _.isEmpty(search.requestors)) {
                        bRetrieveAll = true;
                    }

                    let aInvoiceIds = [];
                    let aCreditNotes = [];
                    if (oAction) {
                        aInvoiceIds = RootStore.getActionField(oAction.responseData, 'INVOICE_IDS');
                        aCreditNotes = RootStore.getActionField(oAction.responseData, 'CREDIT_NOTES');
                    }

                    invMaintainService.retrieveInvoices(aInvoiceIds, bRetrieveAll)
                        .then(results => {
                            const aInvoices = results.map((obj) => {
                                const oInv = _.omit(obj, ["__metadata"]);
                                //Summarize credit notes if any
                                const totalCreditNoteAmt = _.sumBy(aCreditNotes.filter(cn => cn.linkInvoiceId === oInv.InvoiceID), cn => parseFloat(cn.postGstAmt));
                                oInv.netAmount = parseFloat(obj.AmountAfterGst) + totalCreditNoteAmt;
                                return oInv;
                            });
                            appStore.invoiceStore.setInvoices(_.cloneDeep(aInvoices));
                            appStore.view.masterTableBusy = false;
                            appStore.view.searchIsRunning = false;
                        });

                });
        }, 1000),
        {name: "Invoice Search", compareStructural: true});

    // mobx.reaction(
    //     () => appStore.search.userId,
    //     (sUserId) => {
    //         appStore.selectedRequestors.replace([sUserId]);
    //     },
    //     {delay: 500}
    // );

    mobx.reaction(
        () => {
            return appStore.invDoc.creditNotes.length;
        },
        (cnCount) => {
            if (cnCount > 0) {
                appStore.view.cnButtonVisible = false;
            }
        },
        {name: "CN Section Visibility", delay: 10}
    );

    mobx.autorun(() => {
        if (appStore.view.cnButtonVisible && appStore.invDoc.header.invType === "CN") {
            appStore.view.cnButtonVisible = false;
        }
    }, {name: "CN button visibility"});

    // Reaction: Default company code to JTC1 if blank
    mobx.reaction(
        () => appStore.invDoc.header.compCode,
        (sCompanyCode) => {
            if (!sCompanyCode) {
                mobx.set(appStore.invDoc.header, "compCode", "JTC1");
            }
        }, {name: "Set default company code"});

    // Reaction: calculate SGD equivalent
    mobx.reaction(
        () => {
            return {
                foreignAmount: parseFloat(appStore.invDoc.header.preGstAmt) || 0,
                exchangeRate: parseFloat(appStore.invDoc.header.exRate) || 1
            }
        },
        (mValue) => {
            mobx.set(appStore.invDoc.header, "sgdEquiv", (mValue.foreignAmount * mValue.exchangeRate));
        },
        {name: "Compute SGD equivalent"}
    );

    // Reaction: retrieve related documents
    mobx.reaction(
        () => {
            return appStore.invDoc.header.invId;
        },
        (invId) => {
            appStore.invDoc.relatedDocuments.clear();
            if (invId) {
                invMaintainService.retrieveRelatedDocuments(invId)
                    .then((data) => {
                        appStore.invDoc.relatedDocuments.replace(JSON.parse(data.results[0].Value));
                    });
            }
        },
        {
            name: "Retrieve related documents"
        }
    );

// Reaction: retrieve workflow log
    mobx.reaction(
        () => appStore.invDoc.header.invId,
        (invId) => {
            appStore.invDoc.workflowHistory.clear();
            if (invId) {
                appStore.view.wfHistoryIndex = 0;
                if (!invId) {
                    return;
                }
                invMaintainService.retrieveWorkFlowHistoryLog(invId)
                    .then((aWorkflowLog) => {
                        if (aWorkflowLog.length < 1) {
                            aWorkflowLog.push({
                                "CssWf": "",
                                "ObjNo": "",
                                "ObjType": "",
                                "State": "Warning",
                                "Wiid": "          1",
                                "Action": appStore.invDoc.header.statusText,
                                "Icon": "sap-icon://lateness",
                                "Agentid": "",
                                "AgentName": "",
                                "AgentDesc": "",
                                "Remark": "",
                                "AgentDept": ""
                            });
                        }
                        appStore.invDoc.workflowHistory.replace(aWorkflowLog.map(wfh => _.omit(wfh, "__metadata")));
                    });
            }
        },
        {
            name: "Retrieve work flow history"
        }
    );

// Reaction: retrieve attachment list
    mobx.reaction(
        () => appStore.invDoc.header.invId,
        (invId) => {
            appStore.invDoc.attachments.clear();
            if (!invId) {
                return;
            }
            appStore.refreshAttachmentList();
            // invMaintainService.retrieveAttachmentList(invId)
            //     .then(aAttachments => {
            //         appStore.invDoc.attachments.replace(aAttachments);
            //     });
        },
        {name: "Retrieve attachment list"}
    );

    // Reaction: Change of link invoice to
    mobx.reaction(
        () => appStore.invDoc.header.linkInvoice,
        (linkInvoice) => {
            if (linkInvoice !== "POWO") {
                appStore.invDoc.linkPo.po.clear();
                appStore.invDoc.linkPo.gr.clear();
                appStore.invDoc.linkPo.summary.clear();
                appStore.invDoc.assignees.clear();
                appStore.invDoc.judgements.clear();
            }
            if (linkInvoice !== "AOR") {
                appStore.invDoc.linkAor.clear();
            }
            if (linkInvoice !== "NA") {
                appStore.invDoc.linkNa.clear();
            }
        },
        {name: "Change Invoice Link To"}
    );

    // Reaction: Auto add 1 blank line of Link to Others/NA
    mobx.reaction(
        () => {
            return {
                count: appStore.invDoc.linkNa.length,
                // aAccountAssignments: appStore.invDoc.linkNa.map(na => na.accntAssign),
                countNonBlankAcAs: appStore.invDoc.linkNa.reduce((sum, na) => {
                    if (na.accntAssign) {
                        return sum += 1;
                    }
                    return sum;
                }, 0)
            };
        },
        (mParameters) => {
            // const countNonBlankAssignments = mParameters.aAccountAssignments.reduce((sum, aa) => {
            //     if (aa) {
            //         return sum += 1;
            //     }
            //     return sum;
            // }, 0);
            // if (countNonBlankAssignments >= mParameters.count) {
            //     appStore.addBlankOthers();
            // }
            const sLinkInvoice = appStore.invDoc.header.linkInvoice;
            if (!sLinkInvoice || !sLinkInvoice === "NA" || !appStore.view.editMode) {
                return;
            }
            if (mParameters.countNonBlankAcAs >= mParameters.count) {
                appStore.addBlankOthers();
            }
        },
        {name: "Auto Add Blank NA", compareStructural: true}
    );

    // Reaction: Update approvers list
    mobx.reaction(
        () => {
            return {
                aNaWatchList: appStore.invDoc.linkNa.map(na => {
                    return {
                        accntAssign: na.accntAssign,
                        preGstAmt: na.preGstAmt
                    }
                }),
                aAorWatchList: appStore.invDoc.linkAor.map(aor => {
                    return {
                        accntAssign: aor.accntAssign
                    }
                }),
                aPoWatchList: appStore.invDoc.linkPo.gr.map(gr => {
                    return {
                        selcl: gr.selcl
                    }
                }),
                editMode: appStore.view.approversEditable
            }
        },
        (mParameters) => {
            if (!mParameters.editMode) {
                return;
            }
            appStore.updateApproversList();
        },
        {name: "Update approvers list", compareStructural: true, delay: 500}
    );

    // Reaction: Change of verifying officer
    mobx.reaction(
        () => appStore.invDoc.header.verifyOfcr,
        (sVerifyingOfficer) => {
            appStore.aux.approvingAuthorities.replace(_.filter(appStore.aux.approvingAuthoritiesAll, aa => aa.AAUserID !== sVerifyingOfficer));
            if (!sVerifyingOfficer) {
                return;
            }
            if (sVerifyingOfficer === appStore.invDoc.header.approveAuth) {
                appStore.invDoc.header.approveAuth = "";
            }
        },
        {name: "Change of invDoc.header.verifyOfcr", delay: 500}
    );

    // Reaction: Change of approving authority
    mobx.reaction(
        () => appStore.invDoc.header.approveAuth,
        (sApprovingAuthority) => {
            appStore.aux.verifyingOfficers.replace(_.filter(appStore.aux.verifyingOfficersAll, vo => vo.VOUserID !== sApprovingAuthority));
            if (!sApprovingAuthority) {
                return;
            }
            if (sApprovingAuthority === appStore.invDoc.header.verifyOfcr) {
                appStore.invDoc.header.verifyOfcr = "";
            }
        },
        {name: "Change of invDoc.header.approveAuth", delay: 500}
    );

    // Reaction: Update AOR line - change real estate
    mobx.reaction(
        () => {
            return appStore.invDoc.linkAor.map(oAor => _.pick(oAor, ["banfn", "estate", "land", "building", "reobjectentity", "realEstate"]));
        },
        (aAor) => {
            if (appStore.invDoc.header.linkInvoice !== "AOR") {
                return;
            }
            if (_.some(aAor, oAor => !oAor.banfn)) {
                return;
            };
            appStore.updateAorLine();
        },
        {name: "Update AOR line", compareStructural: true}
    );

    // Reaction: Add computed fields to invDoc.linkPo.summary object
    mobx.reaction(
        () => {
            return appStore.invDoc.linkPo.summary.map(po => _.pick(po, ["ebeln", "ebelp", "mblnr", "mblpo"]));
        },
        (aDummyObject) => {
            appStore.invDoc.linkPo.summary.forEach((po, index) => {
                const defaultSummary = {
                    get dmbtrRx() {
                        return RootStore.amountOutputFormat(this.dmbtr);
                    },

                    get ebelpRx() {
                        return _.trimStart(this.ebelp, "0");
                    },

                    get erfmgRx() {
                        return RootStore.quantityOutputFormat(this.erfmg);
                    }
                };

                mobx.extendObservable(po, defaultSummary);
            });
            appStore.callbackModelRefresh();
        },
        {name: "invDoc.linkPo.summary Add computed values", compareStructural: true}
    );

    // Reaction: Add computed values to Training Information
    mobx.reaction(
        () => {
            return appStore.invDoc.trainingInfo.map(info => _.pick(info, ["zzpernr", "zzcrsid"]));
        },
        (aDummyTrainingObjects) => {
            appStore.invDoc.trainingInfo.forEach(info => {
                if (mobx.has(info, "zzsedateRx")) {
                    // Existing entry; already has computed values.
                    return;
                }
                const defaultTrainingInfo = {
                    get zzsedateRx() {
                        return RootStore.dateOutputFormat(this.zzsedate);
                    },

                    get zzedateRx() {
                        return RootStore.dateOutputFormat(this.zzedate);
                    },

                    get zzestcostRx() {
                        return RootStore.amountOutputFormat(this.zzestcost);
                    },

                    get zzactcostRx() {
                        return RootStore.amountOutputFormat(this.zzactcost);
                    },

                    set zzactcostRx(cost) {
                        this.zzactcost = RootStore.numberInputFormat(cost);
                    },

                    get zzsdfRx() {
                        return RootStore.amountOutputFormat(this.zzsdf);
                    },

                    set zzsdfRx(subsidy) {
                        this.zzsdf = RootStore.numberInputFormat(subsidy);
                    },

                    get zzactpenaltyRx() {
                        return RootStore.amountOutputFormat(this.zzactpenalty);
                    },

                    set zzactpenaltyRx(penalty) {
                        this.zzactpenalty = RootStore.numberInputFormat(penalty);
                    }
                };

                mobx.extendObservable(info, defaultTrainingInfo);
            });
            appStore.callbackModelRefresh();
        },
        {name: "invDoc.trainingInfo Add computed values", compareStructural: true, delay: 500}
    );

    // Reaction: Transform english tax description (if any) to tax code sequence
    mobx.reaction(
        () => {
            return appStore.invDoc.linkNa.map(na => na.taxDescr);
        },
        (aTaxDescr) => {
            appStore.invDoc.linkNa.forEach(na => {
                if (na.taxDescr && na.taxDescr.search(/^[0-9]{4}$/) < 0 && appStore.aux.taxCode.fuse) {
                    const searchResultTax = appStore.aux.taxCode.fuse.search(na.taxDescr);
                    if (searchResultTax) {
                        na.taxDescr = _.get(searchResultTax, "0.Sequence", na.taxDescr);
                        na.taxCode = _.get(searchResultTax, "0.TaxCode", na.taxCode);
                    }
                }
            });
        },
        {name: "Tax Descr transformation to Sequence", compareStructural: true, delay: 500}
    );

    // Reaction: Update permitted payees
    mobx.reaction(
        () => appStore.invDoc.header.vendorId,
        (sVendorId) => {
            if (!sVendorId) {
                return;
            }
            RootStore.doAction({
                action: "PERMITTED_PAYEE_VH",
                subAction: "PERMITTED_PAYEE_VH"
            }).then(oAction => {
                const aPermittedPayees = RootStore.getActionField(oAction.responseData, "GT_FIO_PERMITTED_PAYEE");
                let aPermittedPayeesTransformed = aPermittedPayees.map(payee => {
                    return _.assign({text: _.trimStart(payee.empfk, "0")}, payee);
                });
                // if (aPermittedPayeesTransformed.length > 1) {
                    if (appStore.invDoc.header.permitPayee && !_.find(aPermittedPayeesTransformed, ["empfk", appStore.invDoc.header.permitPayee])) {
                        aPermittedPayeesTransformed.push({
                            text: _.trimStart(appStore.invDoc.header.permitPayee, "0"),
                            empfk: appStore.invDoc.header.permitPayee,
                            name: appStore.ecc.GV_PERMIT_PAYEE_NM
                        });
                    };
                    aPermittedPayeesTransformed.push({text: "", empfk: "", name: ""});
                // }
                appStore.invDoc.permittedPayees.replace(aPermittedPayeesTransformed);
                // // If there's only 1 permitted payee, set it as the payee of invoice
                // if (aPermittedPayeesTransformed.length === 1) {
                //     appStore.invDoc.header.permitPayee = aPermittedPayeesTransformed[0].empfk;
                // }
            });
        },
        {name: "Update permitted payees"}
    );

    // Reaction: Add computed values to Multiple Payees table
    mobx.reaction(
        () => appStore.invDoc.multiplePayees.map(payee => _.pick(payee, ["lifnr", "postGstAmt"])),
        (aPayees) => {
            appStore.invDoc.multiplePayees.forEach(payee => {
                // Check if it already has the computed values
                if (mobx.has(payee, "lifnrRx")) {
                    return;
                }
                const payeeExtension = {
                    get lifnrRx() {
                        return _.trimStart(this.lifnr, "0");
                    },
                    get lifnrValueState() {
                        if (this.postGstAmt !== 0 && !this.lifnr) {
                            return "Error";
                        }
                        return "None";
                    },
                    get lifnrValueStateText() {
                        if (this.postGstAmt !== 0 && !this.lifnr) {
                            return "Specify Payee ID";
                        }
                        return "";
                    },
                    get postGstAmtRx() {
                        return RootStore.amountOutputFormat(this.postGstAmt);
                    },
                    set postGstAmtRx(amount) {
                        this.postGstAmt = RootStore.numberInputFormat(amount);
                    }
                }
                mobx.extendObservable(payee, payeeExtension);
            });
            appStore.callbackModelRefresh();
        },
        {name: "Extend invDoc.multiplePayees", delay: 500, compareStructural: true}
    );

    // mobx.reaction(
    //     () => appStore.invDoc.multiplePayees.map(payee => {
    //         return {
    //             amount: payee.postGstAmt
    //         };
    //     }),
    //     (aPayees) => {
    //         appStore.callbackModelRefresh();
    //     },
    //     {compareStructural: true}
    // );

    // Reaction: Extend assignee objects with computed values
    mobx.reaction(
        () => appStore.invDoc.assignees.map(as => _.pick(as, ["contractno", "assigneeId"])),
        (aAssignee) => {
            if (appStore.invDoc.header.linkInvoice !== "POWO") {
                return;
            }
            appStore.invDoc.assignees.forEach(as => {
                if (mobx.has(as, "assigneeAmtPayRx")) {
                    return;
                }
                const assigneeExtension = {
                    get assigneeAmtPayRx() {
                        return RootStore.amountOutputFormat(this.assigneeAmtPay);
                    }
                };
                mobx.extendObservable(as, assigneeExtension);
            });
            appStore.callbackModelRefresh();
        },
        {name: "Extend invDoc.assignees"}
    );

    // Reaction: Extend judgement objects with computed values
    mobx.reaction(
        () => appStore.invDoc.judgements.map(jm => _.pick(jm, ["contractno", "judgementId"])),
        (aJudgements) => {
            if (appStore.invDoc.header.linkInvoice !== "POWO") {
                return;
            }
            appStore.invDoc.judgements.forEach(jm => {
                if (mobx.has(jm, "judgementAmtPayRx")) {
                    return;
                }
                const judgementExtension = {
                    get judgementAmtPayRx() {
                        return RootStore.amountOutputFormat(this.judgementAmtPay);
                    },
                    get effectivedatRx() {
                        return RootStore.dateOutputFormat(this.effectivedat);
                    }
                };
                mobx.extendObservable(jm, judgementExtension);
            });
            appStore.callbackModelRefresh();
        },
        {name: "Extend invDoc.judgements"}
    );

    // Reaction: Update related contracts
    mobx.reaction(
        () => appStore.invDoc.linkPo.gr.map(gr => gr.selcl),

        (aGrSel) => {
            if (!appStore.view.approversEditable) {
                return;
            }
            appStore.refreshInvoice()
                .then(oAction => {
                    if (oAction.responseCode === "OK") {
                        const aAssignee = RootStore.getActionField(oAction.responseData, "GT_ASSIGNEE_1") || [];
                        appStore.invDoc.assignees.replace(aAssignee);

                        const aJudgement = RootStore.getActionField(oAction.responseData, "GT_JUDGEMENT_1") || [];
                        appStore.invDoc.judgements.replace(aJudgement);
                    }
                });
        },
        {name: "Update related contracts", compareStructural: true, delay: 500}
    );

    return appStore;
});