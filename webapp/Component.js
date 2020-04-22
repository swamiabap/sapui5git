sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sg/gov/jtc/JTC-InvoiceApp/model/models",
	"sg/gov/jtc/JTC-InvoiceApp/libs/core-js"
], function (UIComponent, Device, models, CoreJS) {
	

	return UIComponent.extend("sg.gov.jtc.JTC-InvoiceApp.Component", {

		metadata: {
			manifest: "json"
		},

		init: function () {
			Promise.config({
				// Disable long stack traces
				longStackTraces: false
			});

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		},
		
		getContentDensityClass: function() {
			if (!this._sContentDensityClass) {
				if (!Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}
	});
});