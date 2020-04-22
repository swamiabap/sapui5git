sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
	

	return Controller.extend("sg.gov.jtc.JTC-InvoiceApp.controller.Create", {

		onInit: function () {
			
			this._oRouter = UIComponent.getRouterFor(this);
			this._linkingPanel = this.byId("linkingPanel");

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
		
		onClosePress: function() {
			this._oRouter.navTo("master");
		},
		
		onAddFragment: function() {
			if (!this._oPOWOSelectionFragment) {
				this._oPOWOSelectionFragment = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.POWOSelection");
			}
			this._linkingPanel.removeAllContent();
			this._linkingPanel.addContent(this._oPOWOSelectionFragment);
			this._linkingPanel.setVisible(true);
		},
		
		onRemoveFragment: function() {
			this._linkingPanel.removeAllContent();
			this._linkingPanel.setVisible(false);
		},
		
		onLinkToChange: function(oEvent) {
			const selected = oEvent.getSource().getSelectedKey();
			if (selected === "POWO") {
				if (!this._oPOWOSelectionFragment) {
					this._oPOWOSelectionFragment = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.POWOSelection");
				}
				this._linkingPanel.removeAllContent();
				this._linkingPanel.addContent(this._oPOWOSelectionFragment);
				this._linkingPanel.setVisible(true);				
			} else {
				this._linkingPanel.removeAllContent();
				this._linkingPanel.setVisible(false);
			}
		},
		
		onInvoiceLinkSelected: function(oEvent) {
			const selected = oEvent.getSource().getSelectedKey();
			if (selected === "linkPOWO") {
				if (!this._oPOWOSelectionFragment) {
					this._oPOWOSelectionFragment = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.POWOSelection");
				}
				this._linkingPanel.removeAllContent();
				this._linkingPanel.addContent(this._oPOWOSelectionFragment);
				this._linkingPanel.setVisible(true);				
			} else {
				this._linkingPanel.removeAllContent();
				this._linkingPanel.setVisible(false);
			}		
}
	});

});