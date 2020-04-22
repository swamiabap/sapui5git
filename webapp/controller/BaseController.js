/* global _ */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sg/gov/jtc/JTC-InvoiceApp/model/formatter",
	"sap/m/UploadCollectionParameter",
	"sap/m/BusyDialog"
], function(Controller, formatter, UploadCollectionParameter, BusyDialog) {
	
	var BaseController = Controller.extend("sg.gov.jtc.JTC-InvoiceApp.controller.BaseController", {
		formatter: formatter,
		_bSetUseBatch: true, //dev=false, prod=true

		getEditPostDetailNA: function(sAccountAssignment) {
			const postDetail = _.clone(this.getView().getModel("help").getProperty("/EditPostDetailNA"));
			let oEditPostDetailNA = _.find(postDetail, {AccountAssignment: sAccountAssignment});
			if (!_.isEmpty(oEditPostDetailNA)) {
				return oEditPostDetailNA;
			}
			return _.find(postDetail, {AccountAssignment: "DEFAULT"});
		},
		
		//
		// Handler for not yet implemented functions
		//
		handleNotYetImplemented: function(oEvent) {
			// const bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			// MessageBox.information(
			// 	"Functionality will be implemented soon.",
			// 	{
			// 		styleClass: bCompact ? "sapUiSizeCompact" : ""
			// 	}
			// );
			
			if (!this._oPopoverNYI) {
				this._oPopoverNYI = sap.ui.xmlfragment("sg.gov.jtc.JTC-InvoiceApp.view.NotYetImplemented");
				this.getView().addDependent(this._oPopoverNYI);
			}
			this._oPopoverNYI.openBy(oEvent.getSource());
		},
		
		//
		// Retrieve default timeout for odata read
		//
		_retrieveOdataReadTimeout: function() {
			try {
				return parseInt(this.getView().getModel("help").getProperty("/odataReadTimeOut"), 10);
			} catch (ex) {
				return 60000; //60 seconds
			}
		},

		onBuildObjectURLForReview: function(fileMime, fileName, fileDetails, UploadId) {
			var reader = new FileReader();
			reader.onload = function(e) {
				sap.ui.getCore().fileUploadArr.push({
					"UploadId": UploadId,
					"MimeType": fileMime,
					"FileName": fileName,
					"Name": fileName.substring(0, fileName.lastIndexOf(".") ),
					"Extention": fileName.substring(fileName.lastIndexOf(".") + 1 ,  fileName.length ),
					"Blob" : fileDetails
				});
			};
			reader.readAsArrayBuffer(fileDetails);
		},

		onReviewFile: function(oEvent) {
			if(sap.ui.getCore().fileUploadArr[0]){
				var fileName = oEvent.getSource().getParent().getFileName(),
					arrFiles = sap.ui.getCore().fileUploadArr;

				arrFiles.forEach(function(file) {
					if(file.FileName === fileName) {
						sap.ui.core.util.File.save(file.Blob, file.Name, file.Extention, file.MimeType , true);
					}
				});
			}
		},

		onAddAttachment: function(oEvent) {
			if (!this.invMaintainService) {
				return;
			}

			var filesList = oEvent.getParameter("files"),
				uploadId = oEvent.getParameter("id");
			for(var i = 0 ; i < filesList.length ; i++){
				var fileDetail = filesList[i];
				if (fileDetail) {
					var mimeDet = fileDetail.type,
						fileName = fileDetail.name;

					// Calling method....
					this.onBuildObjectURLForReview(mimeDet, fileName, fileDetail, uploadId, this);
				}
			}

			this.appState.view.attachmentSectionBusy = true;
			const oUploadCollection = oEvent.getSource();
			// Gets the latest token from the oDataModel
			this.invMaintainService.refreshSecurityToken()
				.then(() => {
					const sCSRFToken = this.invMaintainService.getModel().getSecurityToken();
					let aHeaderParameters = oUploadCollection.getHeaderParameters();
					// Finds the HTTP request header with "x-csrf-token", if found, updates the value to the latest one.
					const oParamSecurityToken = _.find(aHeaderParameters, param => {
						return param.getName() === "x-csrf-token";
					});
					if (oParamSecurityToken) {
						oParamSecurityToken.setValue(sCSRFToken);
					} else {
						// If the HTTP request header with "x-csrf-token" has not yet been set, the corresponding new header has to
						oUploadCollection.addHeaderParameter(new UploadCollectionParameter({
							name: "x-csrf-token",
							value: sCSRFToken
						}));
					}
					this.appState.view.attachmentSectionBusy = false;
					return sCSRFToken;
				});
		},

		onStartUpload: function(oEvent) {
			// Resolves to true if upload was triggered, otherwise resolves to false
			return new Promise (resolve => {
				// const sUploadUrl= `${window.location.origin}/sap/opu/odata/sap/ZMMP_INV_MAINTAIN_SRV/AttachmentListSet(ObjNo='${this.appState.invDoc.header.invId}',Zattchid='0')`;
				// const sUploadUrl= `${window.location.origin}/sap/opu/odata/sap/ZMMP_INV_MAINTAIN_SRV/AttachmentListSet`;

				try {
					const sServiceUrl = this.invMaintainService.getModel().sServiceUrl;
					const sUploadUrl = sServiceUrl + "/AttachmentListSet";
					const oUploadCollection = this.getView().byId("UploadCollection");
					const sEventUploaderID = oUploadCollection._oFileUploader.getId();
					const cFiles = oUploadCollection._aFileUploadersForPendingUpload.length;
					const uploadInfo = cFiles + " file(s)";

					// set upload URL
					oUploadCollection._aFileUploadersForPendingUpload.forEach(oPending => {
						oPending.setUploadUrl(sUploadUrl);
					});

					if (cFiles > 0) {
						this.fnStartUploadResolve = resolve;
						if (!this.uploadBusyDialog) {
							this.uploadBusyDialog = new BusyDialog({
								text: "Uploading attachments to server. Do not close this window."
							});
							this.getView().addDependent(this.uploadBusyDialog);
						}
						jQuery.sap.syncStyleClass(this.contentDensityClass, this.getView(), this.uploadBusyDialog);
						this.uploadBusyDialog.open();
						this.uploadingFilesCount = 0;
						oUploadCollection._oFileUploader.setUploadUrl(sUploadUrl);
						oUploadCollection.upload();
					} else {
						resolve(false);
					}
				}
				catch (e) {
					console.error(e);
					resolve(false);
				}
			});
		},

		onBeforeUploadStarts: function(oEvent) {
			const oUploadCollection = this.getView().byId("UploadCollection");
			if (!oUploadCollection) {
				console.error("UploadCollection control not found. Attachments not uploaded.");
				return;
			}

			const aHeaderParameters = oUploadCollection.getHeaderParameters();
			const oSecurityToken = _.find(aHeaderParameters, param => {
				return param.getName() === "x-csrf-token";
			});
			if (oSecurityToken) {
				const oUploadSecurityToken = _.find(oEvent.getParameters().getHeaderParameter(), param => {
					return param.getName() === "x-csrf-token";
				});
				if (oUploadSecurityToken) {
					oUploadSecurityToken.setValue(oSecurityToken.getValue());
				} else {
					oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
						name: "x-csrf-token",
						value: oSecurityToken.getValue()
					}));
				}
			}

			// let sPendingUploaderID = "";
			// let aItems = oUploadCollection.getItems();

			// Header Slug
			const fileName = oEvent.getParameter("fileName");
			oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
				name: "slug",
				value: fileName
			}));

			// Invoice ID
			oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
				name: "invId",
				value: this.appState.invDoc.header.invId
			}));

			// Description
			const attDesc = fileName.substr(0, fileName.lastIndexOf('.'));
			oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
				name: "desc",
				value: attDesc
			}));

			this.uploadingFilesCount++;

			// oUploadCollection._aFileUploadersForPendingUpload.forEach(pending => {
			// 	if (pending._bUploading) {
			// 		sPendingUploaderID = pending.oFileUpload.id;
			// 	}
			// });
			//
			// aItems.forEach(item => {
			// 	if (sPendingUploaderID.includes(item.getFileUploader())) {
			// 		// Header Description
			// 		const oCustomerHeaderDesc = new UploadCollectionParameter({
			// 			name: "desc",
			// 			value: attDesc
			// 		});
			// 		oEvent.getParameters().addHeaderParameter(oCustomerHeaderDesc);
			// 	}
			// });
		},

		onUploadCompleteBase: function(oEvent) {
			this.uploadingFilesCount--;

			return new Promise(resolve => {
				// const sEventUploaderID = oEvent.getParameters().getParameters().id;
				// const oUploadCollection = this.getView().byId("UploadCollection");
				// oUploadCollection._aFileUploadersForPendingUpload.forEach(oPending => {
				// 	const sPendingUploaderID = oPending.oFileUpload.id;
				// 	if (sPendingUploaderID.includes(sEventUploaderID)) {
				// 		oPending._resetValueAfterUploadStart();
				// 		oPending.setValue("");
				// 	}
				// });
				if (this.uploadBusyDialog && this.uploadingFilesCount === 0) {
					this.uploadBusyDialog.close();
					this.fnStartUploadResolve(true);
				}
				resolve();
			});
		},

		changeDialogButton: function (oDialog) {
			try {
				if (oDialog) {
					this.setDialogButtonType(oDialog._getCancelButton());
					this.setDialogButtonType(oDialog._getOkButton());
				}
			} catch (e) {
				console.error(e);
			}
		},

		setDialogButtonType: function (oButton) {
			try {
				if (oButton) {
					oButton.setType("Ghost");
				}
			} catch (e) {
				console.error(e);
			}
		},

		navToRelatedDocument: function (sModule, sDocNo, sDocType) {
			let sAppName = "";
			let sAppPath = "";
			let sAction = "";

			switch(sModule) {
				case "AOR":
					sAppName = "Z_AOR_REQ_V1";
					sAppPath = "&/view/AorHeaderSet('" +  sDocNo + "')" ;
					sAction = "display";
					break;
				case "GR/SE":
					sAppName = sDocType === "SE" ? "Z_SE_REQ_V1" : "Z_GR_REQ_V1";
					sAppPath = "&/HeaderSet/" + sDocNo;
					sAction = "change";
					break;
				case "PO/WO":
					sAppName = "Z_POWO_REQ_V1";
					sAppPath = "&/PO/Change/" + sDocNo;
					sAction = "change";
					break;
				case "INV":
					sAppName = "Z_INV_REQ_V1";
					sAppPath = "&/disp/InvoiceSet('" + sDocNo + "')";
					sAction = "display";
					break;
				default:
					sap.m.MessageToast.show(`Navigation to ${sModule} is not yet supported.`);
					break;
			}

			if(sModule === "AOR" || sModule === "GR/SE" || sModule === "PO/WO" || sModule === "INV") {
				this.onNavCrossApp(sAppName, sAction, sAppPath);
			}
		},

		onNavCrossApp: function (sAppName, sAction, sAppPath) {
			try {
				const oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				oCrossAppNavigator.isIntentSupported([sAppName + "-" + sAction])
					.done(function(aResponses) {

					})
					.fail(function() {
						new sap.m.MessageToast("Provide corresponding intent to navigate");
					});
				// Generate the Hash to navigate
				const hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
					target: {
						semanticObject: sAppName,
						action: sAction
					}
				})) || "";

				//Generate a  URL for the second application
				const url = window.location.href.split("#")[0] + hash;
				//Navigate to second app
				//Second parameter "true" means to open in new page
				sap.m.URLHelper.redirect(url + sAppPath , true);
			}
			catch (e) {
				console.log("Cross app navigation not supported in this environment");
			}
		}
	});
	
	return BaseController;
	
});