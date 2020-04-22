sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvCommonService",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sg/gov/jtc/JTC-InvoiceApp/model/formatter"
], function(ManagedObject, InvCommonService, Filter, FilterOperator, formatter) {
    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.BuildingVH", {
        constructor: function(oView) {
            this._oView = oView;
            this._InvCommonService = new InvCommonService();
            this._buildingModel = new sap.ui.model.json.JSONModel();

            sap.ui.jsfragment("jtc.BuildingVH", {
                createContent: function(oController) {

                    const itemTemplate = new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({ text: { path: "CompanyCode" }}),
                            new sap.m.Text({ text: { path: "Estate" }}),
                            new sap.m.Text({ text: { path: "Building", formatter: formatter.removeLeadingZeros }}),
                            new sap.m.Text({ text: { path: "BuildingName" }})
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

                    const colBuilding = new sap.m.Column({
                        header: new sap.m.Label({ text: "Building" }),
                        width: "5rem"
                    });

                    const colBuildingName = new sap.m.Column({
                        header: new sap.m.Label({ text: "Building Name" })
                    });

                    const buildingTable = new sap.m.TableSelectDialog(oView.createId("building-vh-table"), {
                        noDataText: "No building found",
		                title: "Select Building",
                        search: oController._handleValueHelpSearchBuilding,
                        liveChange: oController._handleValueHelpSearchBuilding,
                        confirm: oController._handleValueHelpCloseBuilding.bind(oController),
                        cancel: oController._handleValueHelpCloseBuilding.bind(oController),
                        multiSelect: false,
                        contentWidth: "40rem",
                        items: { 
                            path: "/Buildings",
                            template: itemTemplate,
                            templateShareable: false
                        },
                        columns: [colCompany, colEstate, colBuilding, colBuildingName]
                    });
                    buildingTable.bindElement("/");
                    buildingTable.addStyleClass(oView.getController().getOwnerComponent().getContentDensityClass());
                    oView.getController().changeDialogButton(buildingTable);
                    return buildingTable;
                }
            });
        },

        exit: function() {
            delete this._oView;
        },

        open: function(sCompanyCode, sEstate) {
            return new Promise((resolve) => {
                this._resolve = resolve;
                const oView = this._oView;
                let oDialog = oView.byId("building-vh-table");
                if (!oDialog) {
                    oDialog = sap.ui.jsfragment(oView.getId(), "jtc.BuildingVH", this);
                    oDialog.setModel(this._buildingModel);
                    oView.addDependent(oDialog);
                }

                this._buildingModel.setProperty("/Buldings", {});
                this._InvCommonService.retrieveBuildings(sCompanyCode, sEstate)
                    .then((aBuildings) => {
                        const aBuildingsVH = _.map(aBuildings, (oBuilding) => _.pick(oBuilding, ["CompanyCode", "Estate", "Building", "BuildingName"]));
                        this._buildingModel.setProperty("/Buildings", aBuildingsVH);
                    });

                oDialog.open();
            });
        },

        _handleValueHelpSearchBuilding: function(oEvent) {
            var sValue = oEvent.getParameter("value");
            const aFilters = ["Estate", "Building", "BuildingName"].map(field => {
                return new Filter(field, FilterOperator.Contains, sValue);
            });
            var oFilter = new Filter({
                filters: aFilters,
                and: false
            });
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        _handleValueHelpCloseBuilding: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                const sPathSelected = oSelectedItem.getBindingContext().getPath();
                const oBuilding = this._buildingModel.getProperty(sPathSelected);
                this._resolve(oBuilding.Building);
            }
            oEvent.getSource().getBinding("items").filter([]);
        }
    });    
});