sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"sap/ui/core/util/MockServer",
	"sap/ui/model/json/JSONModel"
], function(jqueryName, MockServer, JSONModel) {
	

	return {
		init: function() {
			// create
			var oMockServer = new MockServer({
				rootUri: "/sap/opu/odata/sap/ZMMP_INV_MAINTAIN_SRV/"
			});

			var oMockServer2 = new MockServer({
				rootUri: "/sap/opu/odata/sap/ZMMP_INV_COMMON_SRV/"
			});

			var oMockServer3 = new MockServer({
				rootUri: "/sap/opu/odata/sap/ZMMP_INV_ODATA_SRV/"
			});

			var oUriParameters = jQuery.sap.getUriParameters();

			// configure mock server with a delay
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: oUriParameters.get("serverDelay") || 500
			});

			// simulate
			var sPath = jQuery.sap.getModulePath("sg.gov.jtc.JTC-InvoiceApp.localService");
			oMockServer.simulate(sPath + "/metadata.xml", sPath + "/mockdata");

			oMockServer2.simulate(sPath + "/metadata-ZMMP_INV_COMMON_SRV.xml", sPath + "/mockdata");
			// handling mocking a function import call step
			const oModel = new JSONModel(sPath + "/mockdata/GLAccounts.json");
			oModel.attachRequestCompleted(() => {
				// console.log("completed");
			});
			var aRequests = oMockServer2.getRequests();
			aRequests.push({
				method: "GET",
				path: new RegExp("RetrieveValidGLAccounts(.*)"),
				response: function(oXhr, sUrlParams) {
					jQuery.sap.log.debug("Incoming request for RetrieveValidGLAccounts");
					jQuery.ajax({
						url: sPath + "/mockdata/GLAccounts.json",
						dataType : 'json',
						async: false,
						success : function(oData) {
							oXhr.respondJSON(200, {}, JSON.stringify(oData));
						}
					});
					return true;
				}
			});
			
			aRequests.push({
				method: "GET",
				path: new RegExp("RetrieveCompanyCodes(.*)"),
				response: function(oXhr, sUrlParams) {
					jQuery.sap.log.debug("Incoming request for RetrieveCompanyCodes");
					jQuery.ajax({
						url: sPath + "/mockdata/RetrieveCompanyCodes.json",
						dataType : 'json',
						async: false,
						success : function(oData) {
							oXhr.respondJSON(200, {}, JSON.stringify(oData));
						}
					});
					return true;
				}
			});
			
			aRequests.push({
				method: "GET",
				path: new RegExp("RetrieveApprovingAuthorities(.*)"),
				response: function(oXhr, sUrlParams) {
					jQuery.sap.log.debug("Incoming request for RetrieveApprovingAuthorities");
					jQuery.ajax({
						url: sPath + "/mockdata/RetrieveApprovingAuthorities.json",
						dataType : 'json',
						async: false,
						success : function(oData) {
							oXhr.respondJSON(200, {}, JSON.stringify(oData));
						}
					});
					return true;
				}
			});
			
			aRequests.push({
				method: "GET",
				path: new RegExp("RetrieveVerifyingOfficers(.*)"),
				response: function(oXhr, sUrlParams) {
					jQuery.sap.log.debug("Incoming request for RetrieveVerifyingOfficers");
					jQuery.ajax({
						url: sPath + "/mockdata/RetrieveVerifyingOfficers.json",
						dataType : 'json',
						async: false,
						success : function(oData) {
							oXhr.respondJSON(200, {}, JSON.stringify(oData));
						}
					});
					return true;
				}
			});
			
			aRequests.push({
				method: "GET",
				path: new RegExp("RetrieveText(.*)"),
				response: function(oXhr, sUrlParams) {
					jQuery.sap.log.debug("Incoming request for RetrieveText");
					jQuery.ajax({
						url: sPath + "/mockdata/RetrieveText.json",
						dataType : 'json',
						async: false,
						success : function(oData) {
							oXhr.respondJSON(200, {}, JSON.stringify(oData));
						}
					});
					return true;
				}
			});
			
			oMockServer2.setRequests(aRequests);

			oMockServer3.simulate(sPath + "/metadata-ZMMP_INV_ODATA_SRV.xml", sPath + "/mockdata");

			// start
			oMockServer.start();
			oMockServer2.start();
			oMockServer3.start();
		}
	};

});