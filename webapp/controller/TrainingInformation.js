/* global moment:true */
/* global mobx */
/* global $ */
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sap/ui/unified/FileUploader",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/export/SpreadSheet",
    "sg/gov/jtc/JTC-InvoiceApp/model/formatter",
    "sg/gov/jtc/JTC-InvoiceApp/controller/TrainingSearch"
], function(ManagedObject, FileUploader, JSONModel, MessageBox, SpreadSheet, formatter,
                     TrainingSearch) {
   "use strict";

   return ManagedObject.extend("sg.gov.jtc.JTC-InvoiceApp.controller.TrainingInformation", {
       formatter: formatter,

       constructor: function (oView) {
           this._oView = oView;
           this._TrainingSearch = new TrainingSearch();
           this.appState = oView.getController().getOwnerComponent().getModel().getData();
       },

       exit: function () {
           this._popoverTrainingInformationTemplate.destroy();
           delete this._popoverTrainingInformationTemplate;

           delete this._oView;

           this._TrainingSearch.destroy();
           delete this._TrainingSearch;
           delete this._sInvoiceID;
       },

       open: function (sInvoiceID) {
           return new Promise((resolve) => {
               this.openPromiseResolver = resolve;
               this._sInvoiceID = sInvoiceID;
               if (!this._TrainingDialog) {
                   this._TrainingDialog = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.TrainingInformation", this);
                   this._oView.addDependent(this._TrainingDialog);
                   jQuery.sap.syncStyleClass(this._oView.getController().getOwnerComponent().getContentDensityClass(), this._oView, this._TrainingDialog);
                   const oTable = sap.ui.getCore().byId("jtc-training-info-table");
                   if (oTable) {
                       oTable.addEventDelegate({
                           onAfterRendering: function () {
                               $("span[id*='-imgDel-img']").attr("data-sap-ui-icon-content", "");
                           }
                       });
                   }
               }
               this._TrainingDialog.open();
           });
       },

       handleTrainingTemplate: function (oEvent) {
           const aColumns = [
               {
                   label: "Course Title",
                   property: "zzcrsname"
               }, {
                   label: "Start Date",
                   property: "zzsedateRx"
               }, {
                   label: "End Date",
                   property: "zzedateRx"
               }, {
                   label: "Employee Name",
                   property: "zzename"
               }, {
                   label: "Approved Course Fees $",
                   property: "zzestcost"
               }, {
                   label: "Status",
                   property: "zzstatus"
               }, {
                   label: "Organiser",
                   property: "zzcrsorg"
               }, {
                   label: "Actual Course Fees $",
                   property: "zzactcost"
               }, {
                   label: "Subsidy (if any) $",
                   property: "zzsdf"
               }, {
                   label: "Penalty (if any) $",
                   property: "zzactpenalty"
               }];

           sap.ui.jsfragment("jtc.training.template.fragment", {
               createContent: function (oController) {
                   return new sap.m.Popover({
                       showHeader: false,
                       placement: "Bottom",
                       content: new sap.m.VBox({
                           items: [
                               new FileUploader(this.createId("uploader-ti"), {
                                   uploadUrl: "",
                                   buttonText: "Upload Training Information",
                                   fileType: "xlsx",
                                   maximumFileSize: 1,
                                   buttonOnly: true,
                                   style: "Transparent",
                                   multiple: false,
                                   icon: "sap-icon://upload",
                                   change: function (e) {
                                       const file = e.getParameter("files") && e.getParameter("files")[0];
                                       if (file && window.FileReader) {
                                           const reader = new FileReader();
                                           reader.onload = function (event) {
                                               try {
                                                   const data = new Uint8Array(event.target.result);
                                                   const workbook = XLSX.read(data, {type: 'array'});
                                                   const oExcelData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: "A"});

                                                   const aTrainingInformation = this.appState.invDoc.trainingInfo;

                                                   //For each row (except the header) in the excel sheet,
                                                   //create an training information entry
                                                   const oExcelDataCopy = _.drop(oExcelData); //drop the header row
                                                   const aColumnIndex = ["A","B","C","D","E","F","G","H","I","J"];

                                                   //Transform the data to be keyed like the TrainingInformationInternal object
                                                   const oExcelDataTransformed = oExcelDataCopy.map((rowData) => {
                                                       return _.mapKeys(rowData, (field, key) => {
                                                           const index = _.findIndex(aColumnIndex, value => value === key);
                                                           return aColumns[index].property;
                                                       });
                                                   });

                                                   //Update the training information array with data from excel file
                                                   aTrainingInformation.forEach(oTi => {
                                                       const excelData = _.find(oExcelDataTransformed, {zzcrsname: oTi.zzcrsname, zzename: oTi.zzename});
                                                       if (excelData) {
                                                           oTi.zzactcost = excelData.zzactcost;
                                                           oTi.zzsdf = excelData.zzsdf;
                                                           oTi.zzactpenalty = excelData.zzactpenalty;
                                                       }
                                                       return oTi;
                                                   });

                                                   //Clear the content of the FileUploader
                                                   this._popoverTrainingInformationTemplate.getContent()[0].getItems()[0].clear();
                                               } catch (error) {
                                                   MessageBox.error("Failed to read excel file.");
                                               }
                                           }.bind(oController);
                                           reader.readAsArrayBuffer(file);
                                       }
                                       oController._popoverTrainingInformationTemplate.close();
                                   },
                                   typeMissmatch: function (oEvent) {
                                       MessageBox.error(`${oEvent.getParameter("fileName")} doesn't seem to be an Excel file.`);
                                   }
                               }),
                               new sap.m.Button(this.createId("btn-down-ti"), {
                                   text: "Download Template",
                                   icon: "sap-icon://download",
                                   type: "Transparent",
                                   press: function (oEvent) {
                                       const aTrainingInfo = this.appState.invDoc.trainingInfo || [];
                                       const aKeys = aColumns.map(col => col.property);
                                       const aHeaderRow = _.reduce(aColumns, (result, col) => {
                                           result[col.property] = col.label;
                                           return result;
                                       }, {});
                                       const aTrainingInfoRows = aTrainingInfo.map(info => _.pick(info, aKeys));
                                       const aTrainingInfoExport = [aHeaderRow, ...aTrainingInfoRows];
                                       const worksheet = XLSX.utils.json_to_sheet(aTrainingInfoExport, {header: aKeys, skipHeader: true});
                                       const workBook = XLSX.utils.book_new();
                                       XLSX.utils.book_append_sheet(workBook, worksheet, "Training Information");
                                       XLSX.writeFile(workBook, "Training Information.xlsx");
                                       this._popoverTrainingInformationTemplate.close();
                                   }.bind(oController)
                               })
                           ]
                       })//.addStyleClass("sapUiContentPadding")
                   }).addStyleClass("jtcRoundActionSheet");
               }
           });

           if (!this._popoverTrainingInformationTemplate) {
               this._popoverTrainingInformationTemplate = sap.ui.jsfragment("jtc.training.template.fragment", this);
               this._oView.addDependent(this._popoverTrainingInformationTemplate);
               jQuery.sap.syncStyleClass(this._oView.getController().getOwnerComponent().getContentDensityClass(), this._oView, this._popoverTrainingInformationTemplate);
           }
           this._popoverTrainingInformationTemplate.openBy(oEvent.getSource());
       },

       handlePopulateAmounts: function () {
           //Handler for auto population of amounts
           let aTrainingInfo = this.appState.invDoc.trainingInfo;
           if (aTrainingInfo.length > 1) {
               aTrainingInfo.forEach(oTrainingInfo => {
                   oTrainingInfo.zzactcost = aTrainingInfo[0].zzactcost;
                   oTrainingInfo.zzsdf = aTrainingInfo[0].zzsdf;
                   oTrainingInfo.zzactpenalty = aTrainingInfo[0].zzactpenalty;
               });
               this.appState.callbackModelRefresh();
           }
       },

       handleAddTrainingItem: function () {
           this._TrainingSearch.open(this._oView, this.appState.invDoc.header.invId)
               .then(aSelectedData => {
                   //Add new instead of completely replacing data
                   let aTrainingInfo = _.cloneDeep(mobx.toJS(this.appState.invDoc.trainingInfo, {detectCycles: false})) || [];
                   aSelectedData.forEach(oTrainingInfo => {
                       const index = _.findIndex(aTrainingInfo, {zzcrsid: oTrainingInfo.zzcrsid, zzpernr: oTrainingInfo.zzpernr});
                       if (index < 0) {
                           aTrainingInfo.push(oTrainingInfo);
                       }
                   });
                   this.appState.invDoc.trainingInfo.replace(aTrainingInfo);
               });
       },

       handleDeleteTrainingItem: function (oEvent) {
           const sPath = oEvent.getParameter("listItem").getBindingContext().getPath();
           const indexToDelete = parseInt(sPath.split("/").pop(), 10);
           this.appState.invDoc.trainingInfo.splice(indexToDelete, 1);
       },

       handleCloseTrainingInfo: function () {
           this._TrainingDialog.close();
           if (this.appState.view.roEditMode) {
               const aTrainingInformation = _.cloneDeep(mobx.toJS(this.appState.invDoc.trainingInfo, {detectCycles: false}));
               this.openPromiseResolver(aTrainingInformation);
           }
       }
   });
});