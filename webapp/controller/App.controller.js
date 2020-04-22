/* global mobx */
sap.ui.define([
	"sg/gov/jtc/JTC-InvoiceApp/controller/BaseController",
	"sg/gov/jtc/JTC-InvoiceApp/libs/mobxModel/MobxModel",
	"sg/gov/jtc/JTC-InvoiceApp/model/AppStore"
], function (BaseController, MobxModel, appStore) {
	

	return BaseController.extend("sg.gov.jtc.JTC-InvoiceApp.controller.App", {
		onInit: function () {
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this.setupObservable();
		},

		onAfterRendering: function () {
			var oModel = this.getOwnerComponent();
			oModel.getService("ShellUIService").then(
				function (oShellUIService) {
					if (oShellUIService) {
						oModel.getModel("inv").read("/AppNavigationSet", {
							filters: [],	//[new sap.ui.model.Filter('AppModule','EQ', 'AO')],
							success: function(oData, response) {
								var aHierarchy = [],
									arrElement = {};
								if (oData !== undefined) {
									for(var i = 0;i < oData.results.length;i++){
										arrElement = oData.results[i];
										delete arrElement.__metadata;
										if(arrElement.AppModule !== 'IP') {
											aHierarchy.push(arrElement);
										}
									}
									console.log("APP Hierarchy: ", aHierarchy);
									oShellUIService.setHierarchy(aHierarchy);
								}
							},
							error: function(oError) {
								console.error(oError);
							}
						});
					}
				},
				function (sError) {
					jQuery.sap.log.error(
						sError,
						"perhaps the manifest.json of this application was misconfigured"
					);
				}
			);
		},

		setupObservable() {
			const that = this;
			this.appState = appStore;
			// this.uiState = mobx.observable({
			// 	invoices: [],
			// 	users: [],
			// 	createInvoiceRx(oInvoice) {
			// 		return mobx.extendObservable(oInvoice, {
			// 			get requestorName() {
			// 				const user = _.find(that.uiState.users, ["UserID", this.RequestorID]);
			// 				if (user) {
			// 					return user.FullName;
			// 				}
			// 				return this.RequestorID;
			// 			}
			// 		});
			// 	}
			// },{
			// 	createInvoiceRx: mobx.action
			// },{
			// 	name: "uiState"
			// });
			this.appModel = new MobxModel(this.appState);
			this.appModel.setSizeLimit(10000);
			this.getOwnerComponent().setModel(this.appModel);
			this.appState.callbackModelRefresh = _.debounce(() => this.appModel.refresh(), 500);
		}
	});
});