sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sg/gov/jtc/JTC-InvoiceApp/service/InvCommonService",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function(ManagedObject, InvCommonService, Filter, FilterOperator) {
    return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.Estate", {
        constructor: function(oView) {
            this._oView = oView;
            this._InvCommonService = new InvCommonService();
            this._estateModel = new sap.ui.model.json.JSONModel({}, false);

            sap.ui.jsfragment("jtc.EstateVH", {
                createContent: function(oController) {
                    
                    const itemTemplate = new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({ text: { path: "CompanyCode" }}),
                            new sap.m.Text({ text: { path: "Estate" }}),
                            new sap.m.Text({ text: { path: "EstateName" }})
                        ]
                    });

                    const colCompany = new sap.m.Column({
                        header: new sap.m.Label({ text: "Company Code" }),
                        width: "6.5rem"
                    });

                    const colEstate = new sap.m.Column({
                        header: new sap.m.Label({ text: "Estate" }),
                        width: "6.5rem"
                    });

                    const colEstateName = new sap.m.Column({
                        header: new sap.m.Label({ text: "Estate Description" })
                    });

                    const estateTable = new sap.m.TableSelectDialog(oView.createId("estate-vh-table"), {
                        noDataText: "No estate found",
		                title: "Select Estate",
                        search: oController._handleValueHelpSearchEstate,
                        liveChange: oController._handleValueHelpSearchEstate,
                        confirm: oController._handleValueHelpCloseEstate.bind(oController),
                        cancel: oController._handleValueHelpCloseEstate.bind(oController),
                        multiSelect: false,
                        contentWidth: "32rem",
                        items: { 
                            path: "/Estates",
                            template: itemTemplate,
                            templateShareable: false
                        },
                        columns: [colCompany, colEstate, colEstateName]
                    });
                    estateTable.bindElement("/");
                    estateTable.addStyleClass(oView.getController().getOwnerComponent().getContentDensityClass());
                    oView.getController().changeDialogButton(estateTable);
                    return estateTable;
                }
            });
        },

        exit: function() {
            delete this._oView;
            delete this._InvCommonService;
            delete this._estateModel;
            delete this._resolve;
        },

        open: function(sCompanyCode) {
            return new Promise((resolve) => {
                this._resolve = resolve;

                const oView = this._oView;
                let oDialog = oView.byId("estate-vh-table");
                if (!oDialog) {
                    oDialog = sap.ui.jsfragment(oView.getId(), "jtc.EstateVH", this);
                    oDialog.setModel(this._estateModel);
                    oView.addDependent(oDialog);
                }
    
                this._estateModel.setProperty("/Estates", {});
                this._InvCommonService.retrieveEstates(sCompanyCode)
                    .then((aEstates) => {
                        const aEstatesVH = _.map(aEstates, (oEstate) => _.pick(oEstate, ["CompanyCode", "Estate", "EstateName"]));
                        this._estateModel.setProperty("/Estates", aEstatesVH);
                    });
    
                oDialog.open();
            });
        },

        _handleValueHelpSearchEstate: function(oEvent) {
            var sValue = oEvent.getParameter("value");
            const aFilters = ["Estate", "EstateName"].map(field => {
                return new Filter(field, FilterOperator.Contains, sValue);
            });
            var oFilter = new Filter({
                filters: aFilters,
                and: false
            });
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        _handleValueHelpCloseEstate: function(oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                const sPathSelected = oSelectedItem.getBindingContext().getPath();
                const oEstate = this._estateModel.getProperty(sPathSelected);

                this._resolve(oEstate.Estate);
            }
            oEvent.getSource().getBinding("items").filter([]);
        }

    });    
});