/* global moment:true */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sap/ui/model/json/JSONModel",
    "sg/gov/jtc/JTC-InvoiceApp/model/formatter",
    "sap/m/MessageBox"
], function(ManagedObject, JSONModel, formatter, MessageBox) {
   "use strict";

   return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.Payee", {
       formatter: formatter,

       constructor: function (oView) {
           this.view = oView;
           this.appState = oView.getController().appState;
       },

       exit: function () {

       },

       open: function () {
           return new Promise((resolve) => {
               this.openPromiseResolver = resolve;
               // Save the original multiple payees table in case the user presses Cancel and not Save
               this.multiplePayeesBeforeEdit = mobx.toJS(this.appState.invDoc.multiplePayees);
               const iDifference = this.appState.view.fvoEditMode ? 5 - this.appState.invDoc.multiplePayees.length : 0;
               _.times(iDifference, i => {
                   this.appState.invDoc.multiplePayees.push({
                       lifnr: undefined,
                       name1: "",
                       postGstAmt: 0
                   });
               });
               if (!this.payeeDialog) {
                   this.payeeDialog = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.Payee", this);
                   this.view.addDependent(this.payeeDialog);
                   jQuery.sap.syncStyleClass(this.view.getController().getOwnerComponent().getContentDensityClass(), this.view, this.payeeDialog);
               }
               this.payeeDialog.open();
           });
       },

       handleChangePayeeId: function (oEvent) {
           try {
               const indexToModify = parseInt(oEvent.getSource().getBindingContext().getPath().split("/").pop(), 10);
               const oSelectedItem = oEvent.getParameter("selectedItem").mProperties;
               let oPayee = this.appState.invDoc.multiplePayees[indexToModify];
               if (oPayee) {
                   oPayee.name1 = oSelectedItem.key ? oSelectedItem.additionalText : "";
               }
           }
           catch (e) {
               console.error(e);
           }
       },

       handleAddPayee: function () {
           this.appState.invDoc.multiplePayees.push({
               lifnr: undefined,
               name1: "",
               postGstAmt: 0
           });
       },

       handleDeletePayee: function (oEvent) {
           const sId = oEvent.getParameter("id");
           const iIndexToDelete = parseInt(sId.split("-").pop(), 10);
           this.appState.invDoc.multiplePayees.splice(iIndexToDelete, 1);
       },

       handleSavePayees: function () {

           if (this.appState.view.fvoEditMode) {
               if (this.validateTable()) {
                   _.remove(this.appState.invDoc.multiplePayees, oPayee => {
                       return _.isEmpty(oPayee.lifnr);
                   });
                   this.openPromiseResolver();
                   this.payeeDialog.close();
               }
           }
       },

       handleCancel: function () {
           // User doesn't want to save, restore the entries before edit
           this.appState.invDoc.multiplePayees.replace(this.multiplePayeesBeforeEdit);
           this.payeeDialog.close();
       },

       validateTable: function () {
           const invDoc = this.appState.invDoc;
           //If amount is entered, payee ID cannot be blank
           const indexOfInvalid = _.findIndex(invDoc.multiplePayees, payee => payee.postGstAmt !== 0 && !payee.lifnr);
           if (indexOfInvalid > -1) {
               MessageBox.error("Specify Payee ID.",
                   {styleClass: this.view.getController().contentDensityClass});
               return false;
           }
           //Validate: total payee amount must equal invoice amount (after GST)
           const invoiceAmount = invDoc.header.currency === "SGD" ? invDoc.total.netPayment.postGstAmtRaw : invDoc.header.actualPostGst;
           const payeesTotalAmount = invDoc.total.multiplePayees.postGstAmt;
           const bAtLeastOneEntry = _.some(invDoc.multiplePayees, payee => !_.isEmpty(payee.lifnr ));
           if (bAtLeastOneEntry && invoiceAmount !== payeesTotalAmount) {
               MessageBox.error("Total amount for all payees does not tally with invoice amount (after GST).",
                   {styleClass: this.view.getController().contentDensityClass});
               return false;
           }
           // At this point all validations passed
           return true;
       }
   });
});