sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast"
], function(Controller, MessageToast ) {
	"use strict";

	return Controller.extend("Zdemo.controller.View1", {
		
		onInit: function(){
			setTimeout(function(){
				MessageToast.show("welcome to swami's git depository");	
			}, 3000);
		}

	});
});