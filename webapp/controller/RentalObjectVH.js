sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvCommonService",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sg/gov/jtc/JTC-InvoiceApp/model/formatter"
], function(ManagedObject, InvCommonService, Filter, FilterOperator, formatter) {
    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.RentalObjectVH", {
        constructor: function(oView) {
            this._oView = oView;
            this._InvCommonService = new InvCommonService();
            this._rentalObjectModel = new sap.ui.model.json.JSONModel();

            sap.ui.jsfragment("jtc.RentalObjectVH", {
                createContent: function(oController) {

                    const itemTemplate = new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({ text: { path: "CompanyCode" }}),
                            new sap.m.Text({ text: { path: "Estate" }}),
                            new sap.m.Text({ text: { path: "RentalObject", formatter: formatter.removeLeadingZeros }}),
                            new sap.m.Text({ text: { path: "RentalObjectName" }})
                        ]
                    });

                    const colCompany = new sap.m.Column({
                        header: new sap.m.Label({ text: "Company Code" }),
                        width: "6.1rem"
                    });

                    const colEstate = new sap.m.Column({
                        header: new sap.m.Label({ text: "Estate" }),
                        width: "5rem"
                    });

                    const colRentalObject = new sap.m.Column({
                        header: new sap.m.Label({ text: "Rental Object" }),
                        width: "5.5rem"
                    });

                    const colRentalObjectName = new sap.m.Column({
                        header: new sap.m.Label({ text: "Rental Object Name" })
                    });

                    const rentalObjectTable = new sap.m.TableSelectDialog(oView.createId("ro-vh-table"), {
                        noDataText: "No rental object found",
		                title: "Select Rental Object",
                        search: oController._handleValueHelpSearchRentalObject,
                        liveChange: oController._handleValueHelpSearchRentalObject,
                        confirm: oController._handleValueHelpCloseRentalObject.bind(oController),
                        cancel: oController._handleValueHelpCloseRentalObject.bind(oController),
                        multiSelect: false,
                        contentWidth: "40rem",
                        items: { 
                            path: "/RentalObjects",
                            template: itemTemplate,
                            templateShareable: false
                        },
                        columns: [colCompany, colEstate, colRentalObject, colRentalObjectName]
                    });
                    rentalObjectTable.bindElement("/");
                    rentalObjectTable.addStyleClass(oView.getController().getOwnerComponent().getContentDensityClass());
                    oView.getController().changeDialogButton(rentalObjectTable);
                    return rentalObjectTable;
                }
            });
        },

        exit: function() {
            delete this._oView;
            delete this._InvCommonService;
            delete this._rentalObjectModel;
            delete this._resolve;
        },

        open: function(sCompanyCode, sEstate) {
            return new Promise(resolve => {
                this._resolve = resolve;
                const oView = this._oView;
                let oDialog = oView.byId("ro-vh-table");
                if (!oDialog) {
                    oDialog = sap.ui.jsfragment(oView.getId(), "jtc.RentalObjectVH", this);
                    oDialog.setModel(this._rentalObjectModel);
                    oView.addDependent(oDialog);
                }
    
                this._rentalObjectModel.setProperty("/RentalObjects", {});
                this._InvCommonService.retrieveRentalObjects(sCompanyCode, sEstate)
                    .then((aRentalObjects) => {
                        const aRentalObjectsVH = _.map(aRentalObjects, (oRentalObject) => _.pick(oRentalObject, ["CompanyCode", "Estate", "RentalObject", "RentalObjectName"]));
                        this._rentalObjectModel.setProperty("/RentalObjects", aRentalObjectsVH);
                    });
    
                oDialog.open();
            });  
        },

        _handleValueHelpSearchRentalObject: function(oEvent) {
            var sValue = oEvent.getParameter("value");
            const aFilters = ["Estate", "RentalObject", "RentalObjectName"].map(field => {
                return new Filter(field, FilterOperator.Contains, sValue);
            });
            var oFilter = new Filter({
                filters: aFilters,
                and: false
            });
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        _handleValueHelpCloseRentalObject: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                const sPathSelected = oSelectedItem.getBindingContext().getPath();
                const oRentalObject = this._rentalObjectModel.getProperty(sPathSelected);
                this._resolve(oRentalObject.RentalObject);
            }
            oEvent.getSource().getBinding("items").filter([]);
        }
    });    
});