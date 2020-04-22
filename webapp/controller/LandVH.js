sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvCommonService",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sg/gov/jtc/JTC-InvoiceApp/model/formatter"
], function(ManagedObject, InvCommonService, Filter, FilterOperator, formatter) {
    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.LandVH", {
        constructor: function(oView) {
            this._oView = oView;
            this._InvCommonService = new InvCommonService();
            this._landModel = new sap.ui.model.json.JSONModel();

            sap.ui.jsfragment("jtc.LandVH", {
                createContent: function(oController) {

                    const itemTemplate = new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({ text: { path: "CompanyCode" }}),
                            new sap.m.Text({ text: { path: "Estate" }}),
                            new sap.m.Text({ text: { path: "Land", formatter: formatter.removeLeadingZeros }}),
                            new sap.m.Text({ text: { path: "LandName" }})
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

                    const colLand = new sap.m.Column({
                        header: new sap.m.Label({ text: "Land" }),
                        width: "5rem"
                    });

                    const colLandName = new sap.m.Column({
                        header: new sap.m.Label({ text: "Name of Land" })
                    });

                    const landTable = new sap.m.TableSelectDialog(oView.createId("land-vh-table"), {
                        noDataText: "No land found",
		                title: "Select Land",
                        search: oController._handleValueHelpSearchLand,
                        liveChange: oController._handleValueHelpSearchLand,
                        confirm: oController._handleValueHelpCloseLand.bind(oController),
                        cancel: oController._handleValueHelpCloseLand.bind(oController),
                        multiSelect: false,
                        contentWidth: "40rem",
                        items: { 
                            path: "/Lands",
                            template: itemTemplate,
                            templateShareable: false
                        },
                        columns: [colCompany, colEstate, colLand, colLandName]
                    });
                    landTable.bindElement("/");
                    landTable.addStyleClass(oView.getController().getOwnerComponent().getContentDensityClass());
                    oView.getController().changeDialogButton(landTable);
                    return landTable;
                }
            });
        },

        exit: function() {
            delete this._oView;
            delete this._InvCommonService;
            delete this._landModel;
            delete this._resolve;
        },

        open: function(sCompanyCode, sEstate) {
            return new Promise(resolve => {
                this._resolve = resolve;
                const oView = this._oView;
                let oDialog = oView.byId("land-vh-table");
                if (!oDialog) {
                    oDialog = sap.ui.jsfragment(oView.getId(), "jtc.LandVH", this);
                    oDialog.setModel(this._landModel);
                    oView.addDependent(oDialog);
                }
    
                this._InvCommonService.retrieveLands(sCompanyCode, sEstate)
                    .then((aLands) => {
                        const aLandsVH = _.map(aLands, (oLand) => _.pick(oLand, ["CompanyCode", "Estate", "Land", "LandName"]));
                        this._landModel.setProperty("/Lands", aLandsVH);
                    });
    
                oDialog.open();
            });
        },

        _handleValueHelpSearchLand: function(oEvent) {
            var sValue = oEvent.getParameter("value");
            const aFilters = ["Estate", "Land", "LandName"].map(field => {
                return new Filter(field, FilterOperator.Contains, sValue);
            });
            var oFilter = new Filter({
                filters: aFilters,
                and: false
            });
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        _handleValueHelpCloseLand: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                const sPathSelected = oSelectedItem.getBindingContext().getPath();
                const oLand = this._landModel.getProperty(sPathSelected);
                this._resolve(oLand.Land);
            }
            oEvent.getSource().getBinding("items").filter([]);
        }
    });    
});