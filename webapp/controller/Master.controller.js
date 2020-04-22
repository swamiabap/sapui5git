/* global moment */
/* global _ */
sap.ui.define([
    "sg/gov/jtc/JTC-InvoiceApp/controller/BaseController",
    "sap/ui/core/UIComponent",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageBox",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvMaintainService",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvCommonService",
    "sap/ui/export/SpreadSheet",
    "sap/m/MessageToast"
], function (BaseController, UIComponent, Filter, FilterOperator, Sorter, MessageBox,
    InvMaintainService, InvCommonService, SpreadSheet, MessageToast) {
    "use strict";

    return BaseController.extend("sg.gov.jtc.JTC-InvoiceApp.controller.Master", {

        onInit: function () {
            this.appState = this.getOwnerComponent().getModel().getData();
            //Hoist app state to global temporarily for troubleshooting/debugging. Remove in production.
            //TODO: remove these 2 lines later
            globalThis.app = this.appState;
            globalThis.appModel = this.getOwnerComponent().getModel();
            globalThis.masterController = this;
            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

            // Odata services
            this._InvCommonService = new InvCommonService();
            this._InvMaintainService = new InvMaintainService();

            // Retrieve initializations
            this._InvMaintainService.retrieveInitialization()
                .then(function (aMessages) {
                    // At the moment backend will return user and roles only
                    // Some other initializations might be added in the future
                    const sUserID = _.chain(aMessages).find({ Name: "UserID" }).get("Value", "").value();

                    const jsonstr = _.chain(aMessages)
                        .find({ Name: "ROLES" })
                        .get("Value", "")
                        .value();
                    const aJson = JSON.parse(jsonstr);

                    const aRoles = _.chain(aJson)
                        .uniqBy("low")
                        .map(function (obj) {
                            return {
                                "UserID": sUserID,
                                "Role": obj.low
                            }
                        }).value()
                    // Save the user roles to auxilliary object of our app state
                    mobx.set(this.appState.aux, "roles", aRoles);
                    mobx.set(this.appState.search, "userId", sUserID);
                    mobx.set(this.appState.view, "frontendUser", sUserID);
                    this.appState.search.addRequestorToken(sUserID);
                }.bind(this));
        },

        //	onBeforeRendering: function() {
        //
        //	},

        //	onAfterRendering: function() {
        //
        //	},

        //	onExit: function() {
        //
        //	}

        onCreatePress: function (oEvent) {
            this.handleNotYetImplemented(oEvent);
            // const oRouter = UIComponent.getRouterFor(this);
            // oRouter.navTo("create");
        },

        onInvoiceSelect: function (oEvent) {
            const oItem = oEvent.getSource();
            let oBindingContext = oItem.getBindingContext();
            if (!oBindingContext) {
                oBindingContext = oEvent.getParameter("rowBindingContext");
            }
            if (oBindingContext) {
                const invoice = oBindingContext.getObject();
                const sInvPath = "InvoiceSet('" + invoice.InvoiceID + "')";
                const oRouter = UIComponent.getRouterFor(this);
                oRouter.navTo("display", {
                    path: sInvPath
                });
            }
        },

        handleRequestorsChange: function (oEvent) {
            const oParameters = oEvent.getParameters();
            if (oParameters.type === "added") {
                oParameters.addedTokens.forEach(token => {
                    this.appState.search.addRequestorToken(token.getKey());
                });
            }
            if (oParameters.type === "removed") {
                oParameters.removedTokens.forEach(token => {
                    this.appState.search.removeRequestorToken(token.getKey());
                });
            }
        },

        handleResetFilters: function () {
            this.appState.resetSearch();
        },

        handleToggleAdvancedSearch: function () {
            this.appState.toggleAdvancedSearch();
        },

        handleValueHelpRequestors: function () {
            sap.ui.require(["sg/gov/jtc/JTC-InvoiceApp/controller/ValueHelpRequestor"], function (ValueHelpRequestor) {
                "use strict";
                if (!this.valueHelpRequestor) {
                    this.valueHelpRequestor = new ValueHelpRequestor();
                }
                this.valueHelpRequestor.open(this.getView(), this.appState.userStore.users)
                    .then(aRequestorIDs => {
                        if (aRequestorIDs && aRequestorIDs.length > -1) {
                            this.appState.search.requestors.clear();
                            aRequestorIDs.map(reqId => this.appState.search.addRequestorToken(reqId));
                        }
                    });
            }.bind(this));
        },

        //***
        // Export invoice list to Excel spreadsheet
        //***
        handleExport: function () {
            this.handleExport2();
            return;

            const aColumns = [
                {
                    label: "Invoice",
                    property: "InvoiceReference"
                }, {
                    label: "Invoice Date",
                    property: "invoiceReferenceDateFormatted"
                }, {
                    label: "Vendor",
                    property: "VendorNameInterface"
                }, {
                    label: "Description",
                    property: "Description"
                }, {
                    label: "Requestor",
                    property: "requestorName"
                }, {
                    label: "Status",
                    property: "statusText"
                }, {
                    label: "Amount ($)",
                    property: "amountBeforeGstFormatted"
                }, {
                    label: "Action Required By",
                    property: "actionRequiredBy"
                }, {
                    label: "Purchasing Group",
                    property: "PurchasingGroup"
                }];

            const aInvoices = this.appState.masterExportList;

            new SpreadSheet({
                workbook: {
                    columns: aColumns,
                    context: {
                        sheetName: "Invoices"
                    }
                },
                dataSource: aInvoices,
                fileName: "InvoiceSearchResults.xlsx"
                })
                .build()
                .then(function () {
                    MessageToast.show("Export invoice list to Excel spreadsheet.");
                });
        },

        handleExport2: function () {
            const aColumns = [
                {
                    label: "Inv/CN No.",
                    property: "InvoiceReference"
                }, {
                    label: "Inv/CN Date",
                    property: "invoiceReferenceDateFormatted",
                    type: "date"
                }, {
                    label: "Vendor",
                    property: "VendorNameInterface"
                }, {
                    label: "Description",
                    property: "Description"
                }, {
                    label: "Requestor",
                    property: "requestorName"
                }, {
                    label: "Status",
                    property: "statusText"
                }, {
                    label: "Amount ($)",
                    property: "netAmountFormatted"
                }, {
                    label: "Action Required By",
                    property: "actionRequiredBy"
                }, {
                    label: "Purchasing Group",
                    property: "PurchasingGroup"
                }];
            const aInvoices = this.appState.masterExportList;
            const aKeys = aColumns.map(col => col.property);
            const aHeaders = aColumns.map(col => col.label);
            const aHeaderRow = _.reduce(aColumns, (result, col) => {
                result[col.property] = col.label;
                return result;
            }, {});
            const aInvoiceRows = aInvoices.map(oInvoice => {
                return _.pick(oInvoice, aKeys);
            });
            const aInvoicesExport = [aHeaderRow, ...aInvoiceRows];
            const worksheet = XLSX.utils.json_to_sheet(aInvoicesExport, {header: aKeys, skipHeader: true});
            const workBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workBook, worksheet, "Invoices");
            XLSX.writeFile(workBook, "InvoiceSearchResults.xlsx");
        },

        //***
        // Delete draft invoice
        //***
        handleDeleteInvoice: function (oEvent) {
            try {
                const oContext = oEvent.getSource().getBindingContext("local");
                const sPath = oContext.getPath();
                // eslint-disable-next-line no-unused-vars
                const oData = oContext.getProperty(sPath);
                // Delete handling here
            } catch (ex) {
                // Error handling here
            }

            this.handleNotYetImplemented(oEvent);
        },

        handleHelpPress: function (oEvent) {
            this.handleNotYetImplemented(oEvent);
        }

    });

});