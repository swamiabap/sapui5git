sap.ui.define([
	"sap/ui/base/ManagedObject",
    "sap/m/MessageToast",
    "sg/gov/jtc/JTC-InvoiceApp/controller/Estate",
    "sg/gov/jtc/JTC-InvoiceApp/controller/BuildingVH",
    "sg/gov/jtc/JTC-InvoiceApp/controller/LandVH",
    "sg/gov/jtc/JTC-InvoiceApp/controller/RentalObjectVH",
    "sap/ui/model/json/JSONModel",
    "sg/gov/jtc/JTC-InvoiceApp/model/formatter"
], function(ManagedObject, MessageToast, Estate, BuildingVH, LandVH, RentalObjectVH, JSONModel, formatter) {
	return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.RealEstate", {
		constructor: function(oView) {
            this._oView = oView;
            this._estateVH = new Estate(oView);
            this._buildingVH = new BuildingVH(oView);
            this._landVH = new LandVH(oView);
            this._rentalObjectVH = new RentalObjectVH(oView);

            this._realEstateModel = new JSONModel({
                CompanyCode: "",
                Estate: "",
                Building: "",
                Land: "",
                RentalObject: ""
            });
			
			sap.ui.jsfragment("jtc.REValueHelp", {
				createContent: function (oController) {
                    const labelWidth = "7rem";
                    const inputWidth = "12rem";
					const vboxWidth = "auto";
                    const hboxMargin = "jtcSmallMarginLeft jtcSmallMarginRight";
                    const view = oController._oView;

                    const aPath = ["CompanyCode", "Estate", "Building", "Land", "RentalObject"];

                    const inputItems = ["Company Code", "Business Entity", "Building No.",
                     "Land No.", "Rental Object"].map((sLabel, index) => {
                        return new sap.m.HBox(view.createId(_.kebabCase(`re-hbox ${sLabel}`)), {
                            alignItems: "Center",
                            items: [
                                new sap.m.Label({
                                    text: sLabel,
                                    width: labelWidth
                                }),
                                new sap.m.Input(view.createId(_.kebabCase(`re-in- ${sLabel}`)), {
                                    width: inputWidth,
                                    editable: (sLabel === "Company Code" ? false : true),
                                    showValueHelp: true,
                                    value: { path: `${aPath[index]}`, formatter: formatter.removeLeadingZeros }
                                }).bindElement("/")
                            ]
                        }).addStyleClass(hboxMargin);
                    });

                    const realEstateModel = oController._realEstateModel;
                    const sCompany = realEstateModel.getProperty("/CompanyCode");

                    // Estate
                    inputItems[1].addStyleClass("sapUiSmallMarginBottom");
                    inputItems[1].getItems()[1].attachValueHelpRequest(() => {
                        oController._estateVH.open(sCompany)
                            .then(sEstate => {
                                const sEstateOld = realEstateModel.getProperty("/Estate");
                                if (sEstate !== sEstateOld) {
                                    realEstateModel.setProperty("/Building", "");
                                    realEstateModel.setProperty("/Land", "");
                                    realEstateModel.setProperty("/RentalObject", "");
                                }
                                realEstateModel.setProperty("/Estate", sEstate);
                            });
                    });
                    // Building
                    inputItems[2].getItems()[1].attachValueHelpRequest(() => {
                        const sEstate = realEstateModel.getProperty("/Estate");
                        oController._buildingVH.open(sCompany, sEstate)
                            .then(sBuilding => {
                                realEstateModel.setProperty("/Building", sBuilding);
                                realEstateModel.setProperty("/Land", "");
                                realEstateModel.setProperty("/RentalObject", "");
                            });
                    });

                    // Land
                    inputItems[3].getItems()[1].attachValueHelpRequest(() => {
                        const sEstate = realEstateModel.getProperty("/Estate");
                        oController._landVH.open(sCompany, sEstate)
                            .then(sLand => {
                                realEstateModel.setProperty("/Building", "");
                                realEstateModel.setProperty("/Land", sLand);
                                realEstateModel.setProperty("/RentalObject", "");
                            });
                    });

                    // Rental Object
                    inputItems[4].getItems()[1].attachValueHelpRequest(() => {
                        const sEstate = realEstateModel.getProperty("/Estate");
                        oController._rentalObjectVH.open(sCompany, sEstate)
                            .then(sRentalObject => {
                                realEstateModel.setProperty("/Building", "");
                                realEstateModel.setProperty("/Land", "");
                                realEstateModel.setProperty("/RentalObject", sRentalObject);
                            });
                    });
                                        
					return new sap.m.ResponsivePopover(view.createId("re-pop-group"), {
                        title: "Real Estate",
                        modal: true,
                        placement: sap.m.PlacementType.HorizontalPreferredLeft,
						content: new sap.m.VBox({
							width: vboxWidth,
							items: inputItems
						}).addStyleClass("sapUiContentPadding"),
						beginButton: new sap.m.Button({
                            text: "Cancel",
                            type: "Ghost",
                            press: () => {
								oController._oView.byId("re-pop-group").close();
                            }
						}),
						endButton: new sap.m.Button({
							text: "Apply",
							type: "Emphasized",
							press: () => {
                                const oRealEstate = realEstateModel.getProperty("/");
                                oController._resolve(oRealEstate);
								oController._oView.byId("re-pop-group").close();
							}
						})
					}).addStyleClass("jtcInvRealEstatePopover");
				}
			});
		},
		
		exit: function() {
            delete this._oView;
            delete this._realEstateModel;
            delete this._estateVH;
            delete this._buildingVH;
            delete this._landVH;
            delete this._rentalObjectVH;
            delete this._resolve;
		},
		
		openBy: function(oSource, sCompany, oLinkNA) {
            return new Promise(resolve => {
                this._resolve = resolve;
                var oView = this._oView;
                var oPopover = oView.byId("re-pop-group");
    
                this._realEstateModel.setProperty("/", {
                    CompanyCode: sCompany,
                    Estate: oLinkNA.Estate,
                    Building: oLinkNA.NumberOfBuilding,
                    Land: oLinkNA.NumberOfLand,
                    RentalObject: oLinkNA.NumberOfRentalObject
                });
    
                // create dialog lazily
                if (!oPopover) {
                    // create dialog via fragment factory
                    oPopover = sap.ui.jsfragment(oView.getId(), "jtc.REValueHelp", this);
                    oPopover.setModel(this._realEstateModel);
                    // connect dialog to the root view of this component (models, lifecycle)
                    oView.addDependent(oPopover);
                }
                oPopover.openBy(oSource);
            });
        }
	});
});