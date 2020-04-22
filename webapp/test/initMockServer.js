sap.ui.define([
	"../localService/mockserver"
], function (mockserver) {
	"use strict";

	// initialize the mock server
	mockserver.init();

	// initialize the embedded component on the HTML page
	// sap.ui.require(["sap/ui/core/ComponentSupport"]);
	new sap.m.Shell({
		app: new sap.ui.core.ComponentContainer({
			height : "100%",
			name : "sg.gov.jtc.JTC-InvoiceApp"
		})
	}).placeAt("content");
	
});