/* global _:true */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function(BaseObject, Filter, FilterOperator) {
    "use strict";

    return BaseObject.extend("sg.gov.jtc.JTC-InvoiceApp.service.InvApprovalService", {

        constructor: function() {
            this.model = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: "/sap/opu/odata/sap/ZMMP_INV_ODATA_SRV/",
                useBatch: true  //set to true for production
            });
        },

        //Retrieve workflow history log
        retrieveWorkFlowHistoryLog: function(sInvoiceID) {
            if (!sInvoiceID) {
                return Promise.resolve([]);
            }

            return new Promise((resolve, reject) => {
                this.model.read(`/Header('${sInvoiceID}')/WorkFlow_LogSet`, {
                    success: (data, response) => {
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        },

        retrieveAttachmentSet: function(sInvoiceID) {
            if (sInvoiceID === undefined || sInvoiceID === null || sInvoiceID.length < 1) {
                return Promise.reject();
            }

            return new Promise((resolve, reject) => {
                this.model.read(`/Header('${sInvoiceID}')/AttachmentSet`, {
                    success: (data, response) => {
                        resolve(data.results);
                    },
                    error: reject
                });
            });
        }
    });
});