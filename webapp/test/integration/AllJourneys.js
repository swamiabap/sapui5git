/* global QUnit*/

sap.ui.define([
	"sap/ui/test/Opa5",
	"sg/gov/jtc/JTC-InvoiceApp/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"sg/gov/jtc/JTC-InvoiceApp/test/integration/pages/App",
	"sg/gov/jtc/JTC-InvoiceApp/test/integration/navigationJourney"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "sg.gov.jtc.JTC-InvoiceApp.view.",
		autoWait: true
	});
});