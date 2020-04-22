/* global _ */
/* global mobx */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvMaintainService"
], function (ManagedObject, MobxModel, InvMaintainService) {
    "use strict";

    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.RerouteDialog", {

        constructor: function (oView) {
            this.view = oView;
            this.InvMaintainService = new InvMaintainService();
            this.appState = oView.getController().appState;
        },

        exit: function () {
            this.takedownObservable();
        },

        handleAfterClose: function() {
            this.takedownObservable();
        },

        open: function (sPurchasingGroup, sStatus, sRemarks, sVerifyingOfficer, sApprovingAuthority) {
            // Create dialog
            this.setupObservable();
            if (!this.rerouteDialog) {
                this.rerouteDialog = sap.ui.xmlfragment(
                    "sg.gov.jtc.JTC-InvoiceApp.view.RerouteDialog",
                    this
                );
                this.rerouteDialog.addStyleClass(this.view.getController().getOwnerComponent().getContentDensityClass());
                this.view.addDependent(this.rerouteDialog);
            }
            this.rerouteDialog.setModel(this.model, "reroute");
            this.rerouteDialog.open("");
            const rerouteState = this.rerouteState;
            rerouteState.status = sStatus;
            rerouteState.purchGroup = sPurchasingGroup;
            rerouteState.requestor = "";
            rerouteState.verifyingOfficer = "";
            rerouteState.approvingAuthority = sApprovingAuthority;
            rerouteState.remarks = sRemarks;
            rerouteState.purchGroupInputBusy = false;
            rerouteState.requestorInputBusy = false;
            rerouteState.verifyingOfficerInputBusy = false;
            rerouteState.approvingAuthorityInputBusy = false;

            return new Promise((resolve, reject) => {
                this.resolveOpenPromise = resolve;
                this.rejectOpenPromise = reject;
            });
        },

        handleReroute: function(oEvent) {
            const rerouteState = this.rerouteState;
            this.appState.invDoc.remarks = rerouteState.remarks;
            rerouteState.purchGroupInputBusy = true;
            rerouteState.requestorInputBusy = true;
            rerouteState.rerouteDialogBusy = true;
            this.executeReroute()
                .then(oAction => {
                    this.view.getController().extractAndDisplayActionResponse(oAction);
                    if (oAction.responseCode === "OK") {
                        this.rerouteDialog.close();
                        //Return true to signal rerouting executed
                        this.resolveOpenPromise(true);
                    }
                })
                .catch(() => {
                    this.appState.view.processViewBusy = false;
                    rerouteState.purchGroupInputBusy = false;
                    rerouteState.requestorInputBusy = false;
                    rerouteState.rerouteDialogBusy = false;
                    this.resolveOpenPromise(false);
                });
        },

        handleClose: function () {
            this.rerouteDialog.close();
            //Return false to signal no actual rerouting
            this.resolveOpenPromise(false);
        },

        setupObservable: function () {
            const appState = this.appState;

            const rerouteState = mobx.observable({
                purchGroups: [],
                purchGroup: "",
                requestor: "",
                status: "",
                requestors: [],
                verifyingOfficer: "",
                verifyingOfficers: [],
                approvingAuthority: "",
                approvingAuthorities: [],
                requestorInputBusy: false,
                purchGroupInputBusy: false,
                rerouteDialogBusy: false,
                verifyingOfficerInputBusy: false,
                approvingAuthorityInputBusy: false,
                get aaSelectVisible() {
                    return this.status === "03"; //Pending approval
                },
                get aaTextVisible() {
                    return this.status === "02"; //Pending verification
                },
                get aaVisible() {
                    return this.aaSelectVisible || this.aaTextVisible;
                },
                get purchGroupVisible() {
                    // Draft/Error draft
                    return this.status === "01" || this.status === "12";
                },
                get requestorVisible() {
                    // Draft/Error draft
                    return this.status === "01" || this.status === "12";
                },
                get verifyingOfficerVisible() {
                    // Pending verification/cancellation
                    return this.status === "02" || this.status === "09";
                },
                get statusText() {
                    if (!this.status) {
                        return "";
                    }
                    return appState.statusStore.textOf(this.status);
                },
                get aaFullname() {
                    return appState.userStore.fullnameOf(this.approvingAuthority);
                },
                remarks: ""
            });

            rerouteState.updatePurchGroups = _.once((aPurchasingGroups) => {
                rerouteState.purchGroups = aPurchasingGroups;
            });

            this.disposePurchGroupRx = mobx.autorun(() => {
                if (!rerouteState.purchGroup && rerouteState.status !== "12") {
                    return;
                }
                rerouteState.requestorInputBusy = true;
                rerouteState.verifyingOfficerInputBusy = true;
                rerouteState.approvingAuthorityInputBusy = true;
                rerouteState.requestor = "";
                this.retrieveData(rerouteState.purchGroup)
                    .then(oAction => {
                        if (oAction.responseCode === "ERROR") {
                            return null;
                        }
                        const oController = this.view.getController();
                        const aOfficers = oController.getActionField(oAction.responseData, "GT_FIO_LISTBOX");
                        // Draft/Error Draft
                        if (rerouteState.status === "01" || rerouteState.status === "12") {
                            rerouteState.requestors =  aOfficers;
                        }
                        // Pending verification/Pending cancellation
                        if (rerouteState.status === "02" || rerouteState.status === "09") {
                            rerouteState.verifyingOfficer = "";
                            rerouteState.verifyingOfficers = aOfficers;
                        }
                        // Pending approval
                        if (rerouteState.status === "03") {
                            rerouteState.approvingAuthority = "";
                            rerouteState.approvingAuthorities = aOfficers;
                        }
                        console.log("Officers: ", aOfficers);
                        const aPurchasingGroups = oController.getActionField(oAction.responseData, "GT_FIO_REROUTE_PURCH_GRP");
                        rerouteState.updatePurchGroups(aPurchasingGroups);
                        console.log("Purch Groups: ", aPurchasingGroups);
                        rerouteState.requestorInputBusy = false;
                        rerouteState.verifyingOfficerInputBusy = false;
                        rerouteState.approvingAuthorityInputBusy = false;
                    })
                    .catch(() => {
                        rerouteState.requestorInputBusy = false;
                        rerouteState.verifyingOfficerInputBusy = false;
                        rerouteState.approvingAuthorityInputBusy = false;
                    });
            }, { name: "Purchasing group selected", delay: 1000 });

            this.model = new MobxModel(rerouteState);
            this.model.setSizeLimit(10000);
            this.rerouteState = rerouteState;
        },

        takedownObservable: function() {
            //Run each reaction functions
            [this.disposePurchGroupRx].forEach(fn => {
                if (typeof fn === "function") {
                    fn();
                }
            });
            delete this.rerouteState;
            delete this.model;
        },

        retrieveData: function (sPurchasingGroup) {
            return this.appState.rerouteInvoiceInit({
                GV_ROUTE_OK_CODE: "PURCH",
                GV_PURCH_GRP: sPurchasingGroup
            });
        },

        executeReroute: function () {
            return new Promise ((resolve, reject) => {
                const rerouteState = this.rerouteState;
                let mParameters = {
                    GV_PURCH_GRP: rerouteState.purchGroup
                };
                // Draft/Error draft
                if (rerouteState.status === "01" || rerouteState.status === "12") {
                    mParameters.GV_RO = rerouteState.requestor;
                }
                //Pending verification/Pending cancellation
                if (rerouteState.status === "02" || rerouteState.status === "09") {
                    mParameters.GV_VO = rerouteState.verifyingOfficer;
                }
                //Pending approval
                if (rerouteState.status === "03") {
                    mParameters.GV_AA = rerouteState.approvingAuthority;
                }
                this.appState.rerouteInvoice(mParameters).then(resolve);
            });
        }
    });
});