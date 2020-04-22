sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvMaintainService",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sg/gov/jtc/JTC-InvoiceApp/model/formatter"
], function(ManagedObject, InvMaintainService, Filter, FilterOperator, formatter) {
    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.CreditNoteVH", {
        constructor: function(oView) {
            this._oView = oView;
            this._InvMaintainService = new InvMaintainService();
            this._creditNoteModel = new sap.ui.model.json.JSONModel();

            sap.ui.jsfragment("jtc.CreditNoteVH", {
                createContent: function(oController) {
                    const theRealController = oController._oView.getController();
                    
                    const itemTemplate = new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({ text: { path: "InvoiceReference" }}),
                            new sap.m.Text({ text: { path: "Description" }}),
                            new sap.m.Text({ text: { path: "RequestorID", formatter: formatter.fullName.bind(theRealController) }}),
                            new sap.m.Text({ text: { path: "Status", formatter: formatter.statusText.bind(theRealController) }}),
                            new sap.m.Text({ text: { path: "AmountBeforeGst" }})
                        ]
                    });

                    const colCreditNote = new sap.m.Column({
                        header: new sap.m.Label({ text: "Credit Note No." }),
                        width: "12rem"
                    });

                    const colRequestor = new sap.m.Column({
                        header: new sap.m.Label({ text: "Requestor" }),
                        width: "8rem"
                    });

                    const colDescription = new sap.m.Column({
                        header: new sap.m.Label({ text: "Description" }),
                        width: "auto"
                    });

                    const colStatus = new sap.m.Column({
                        header: new sap.m.Label({ text: "Status" }),
                        width: "5rem"
                    });

                    const colAmount = new sap.m.Column({
                        header: new sap.m.Label({ text: "Amount" }),
                        width: "5rem",
                        hAlign: "End"
                    });

                    const creditNotesTable = new sap.m.TableSelectDialog(oView.createId("cn-vh-table"), {
                        noDataText: "No credit note found",
		                title: "Select Credit Note",
                        search: oController._handleValueHelpSearchCreditNote,
                        liveChange: oController._handleValueHelpSearchCreditNote,
                        confirm: oController._handleValueHelpCloseCreditNote.bind(oController),
                        cancel: oController._handleValueHelpCloseCreditNote.bind(oController),
                        multiSelect: false,
                        contentWidth: "55rem",
                        items: { 
                            path: "/CreditNotes",
                            template: itemTemplate,
                            templateShareable: false
                        },
                        columns: [colCreditNote, colDescription, colRequestor, colStatus, colAmount]
                    });
                    creditNotesTable.bindElement("/");
                    creditNotesTable.addStyleClass(oView.getController().getOwnerComponent().getContentDensityClass());
                    oView.getController().changeDialogButton(creditNotesTable);
                    return creditNotesTable;
                }
            });
        },

        exit: function() {
            delete this._oView;
            delete this._InvMaintainService;
            delete this._creditNoteModel;
            delete this._resolve;
        },

        open: function(sVendorID, sPurchasingGroup) {
            return new Promise((resolve) => {
                this._resolve = resolve;

                const oView = this._oView;
                let oDialog = oView.byId("cn-vh-table");
                if (!oDialog) {
                    oDialog = sap.ui.jsfragment(oView.getId(), "jtc.CreditNoteVH", this);
                    oDialog.setModel(this._creditNoteModel);
                    oView.addDependent(oDialog);
                }
    
                this._creditNoteModel.setProperty("/CreditNotes", {});
                oDialog.setBusy(true);
                this._InvMaintainService.retrieveAdditionalCreditNotes(sVendorID, sPurchasingGroup)
                    .then((aCreditNotes) => {
                        this._creditNoteModel.setProperty("/CreditNotes", aCreditNotes);
                    })
                    .finally(() => {
                        oDialog.setBusy(false);
                    });
    
                oDialog.open();
            });
        },

        _handleValueHelpSearchCreditNote: function(oEvent) {
            var sValue = oEvent.getParameter("value");
            const aFilters = ["CreditNoteNumber", "Requestor"].map(field => {
                return new Filter(field, FilterOperator.Contains, sValue);
            });
            var oFilter = new Filter({
                filters: aFilters,
                and: false
            });
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        _handleValueHelpCloseCreditNote: function(oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                const sPathSelected = oSelectedItem.getBindingContext().getPath();
                const oCreditNote = _.clone(this._creditNoteModel.getProperty(sPathSelected));

                this._resolve(oCreditNote);
            }
            oEvent.getSource().getBinding("items").filter([]);
        }

    });    
});