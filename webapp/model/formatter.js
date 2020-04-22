/* global _:true */
sap.ui.define([], function() {
	"use strict";

	return {

		currencyValue: function(sValue) {
			if (!sValue) {
				return "";
			}
			return ("$ " + parseFloat(sValue, 10).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString());
			// return parseFloat(sValue).toFixed(2);
		},
		currencyValueNoSign: function(sValue) {
			if (!sValue) {
				return "";
			}
			try {
				return (parseFloat(sValue).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString());
			} catch (e) {
				return sValue;
			}
		},
		exchangeRate: function(sValue) {
			if (!sValue) {
				return "";
			}
			try {
				return (parseFloat(sValue).toFixed(5).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString());
			} catch (e) {
				return sValue;
			}
		},
		formatItemNo: function(sItemNo) {
			var s = sItemNo.replace(/^0+/, "");
			return s;
		},
		formatIconBlue: function(sOn) {
			// if (sOn) {
			return "#0077db";
			// } else {
			// 	return 'blue'; //'grey';
			// }
		},
		formatIconRed: function(sOn) {
			// if (sOn) {
			return "#e60000";
			// } else {
			// 	return 'grey';
			// }
		},
		formatIconGreen: function(sOn) {
			// if (sOn) {
			return "#00cc00"; //green';
			// } else {
			// 	return 'grey';
			// }
		},
		formatIconVisible: function(sOn) {
			// if (sOn) {
			// 	return true;
			// } else {
			// 	return false;
			// }
			return sOn;
		},
		getIcon: function(sMimeType) {
			if (!sMimeType) {
				return "";
			}
			return sap.ui.core.IconPool.getIconForMimeType(sMimeType);
			// return parseFloat(sValue).toFixed(2);
		},
		getLink: function(ObjNo, Zattchid) {
			// var oView = this.getView().getModel();
			// oElementBinding = oView.getElementBinding();
			// var oModel = this.getOwnerComponent().getModel();
			// var oMasterView = this.getView("masterView");
			// var sPath = oMasterView.getPath();
			// var oModel = this.getView().getModel();
			var sPath = window.location.href;
			var link = sPath + "/FileContentSet(ObjNo=" + ObjNo + ",Zattchid=" + Zattchid + ")/$value";
			return link;
		},
		shortenFilename: function(Zfname, Filetype) {
			var firstWord = Zfname.substring(0, 5); //split(' ')[0];
			var filename = firstWord + "..." + Filetype;
			return filename;
		},
		returnAttachmentName: function(Zfname, Filetype, Zdesc) {
			var name = "";
			if (Zdesc === "") {
				name = Zfname;
			} else {
				name = Zdesc;
			}
			var filename = name.substring(0, 15);
			if (name.length > 15) {
				filename = filename + "...";
			}
			return filename;
		},

		formatDate: function(v) {
			if (!v) {
				return v;
			}
			try {
				sap.ui.require("sap.ui.core.format.DateFormat");
				const oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "dd.MM.YYYY"
				});
				return oDateFormat.format(new Date(v));
			} catch (ex) {
				return v;
			}
		},

		truncateDescription: function(sDescription) {

			if (sDescription) {
				if (sDescription.length > 70) {
					// return sDescription.substring(0, 70) + '...';
				}
			}

			return sDescription;
		},

		removeLeadingZeros: function(sValue) {
			if (sValue) {
				try {
					return sValue.replace(/\b0+/g, "");
				} catch (ex) {
					return sValue;
				}
			}
			return sValue;
		},

		statusText: function(sValue) {
			if (sValue) {
				try {
					const aStatus = this.getView().getModel("help").getProperty("/Statuses").filter(v => v.Status === sValue);
					if (aStatus.length > 0) {
						return aStatus[0].StatusText;
					}
				} catch (ex) {
					return sValue;
				}
			}
			return sValue;
		},

		statusColor: function (sStatus) {
			switch (sStatus) {
				case '01':
					return 5;
				case '02':
					return 2;
				case '03':
					return 1;
				case '04':
					return 7;
				default:
					return 9;
			}
		},

		fullName: function(sUserID) {
			if (sUserID) {
				try {
					const oUser = this.getView().getModel("help").getProperty("/PromptUsers").find(v => v.UserID === sUserID);
					return oUser.FullName;
				} catch (ex) {
					return sUserID;
				}
			}
			return sUserID;
		},

		taxCodeSequence: function(sValue) {
			if (sValue) {
				try {
					// Try to map to Description first, if found return the sequence code
					const tcm = this.getView().getModel("help").getProperty("/TaxCodeMap");
					const taxcode = _.find(tcm, {TaxCodeDescription: sValue});
					//const oTaxCodeMap = this.getView().getModel("help").getProperty("/TaxCodeMap").find(v => v.TaxCodeDescription === sValue);
					if (taxcode) {
						return taxcode.Sequence;
					}
				} catch (ex) {
					return sValue;
				}
			}
			return sValue;
		},

		taxCodeDescription: function(sDescription) {
			if (sDescription) {
				try {
					const oTaxCodeMap = this.getView().getModel("help").getProperty("/TaxCodeMap").find(v => v.Sequence === sDescription);
					if (oTaxCodeMap) {
						return oTaxCodeMap.TaxCodeDescription;
					}
				} catch (ex) {
					return sDescription;
				}
			}
			return sDescription;
		},

		taxCodeToDescription: function(sTaxCode) {
			if (_.isEmpty(sTaxCode)) {
				return sTaxCode;
			}
			return _.chain(this._oHelpModel.getProperty("/TaxCodeMap"))
				.find({TaxCode: sTaxCode})
				.get("TaxCodeDescription", sTaxCode)
				.value();
		},

		accountAssignment: function(sAssignment) {
			if (sAssignment) {
				try {
					const oAccountAssignment = this.getView().getModel("help").getProperty("/Assignments")
						.find(v => v.DomainValue === sAssignment);
					return oAccountAssignment.Description;
				} catch (ex) {
					return sAssignment;
				}
			}
			return sAssignment;
		},

		assetNumber: function(sMain, sSub) {
			try {
				if (sMain && sSub) {
					if (sSub.length > 0) {
						return sMain + "/" + sSub;
					} else {
						return sMain;
					}
				} else {
					return sMain ? sMain : "";
				}
			} catch (ex) {
				return "";
			}
			// return sMain + "/" + sSub;
		},

		invoiceType: function(sInvType, sLinkTo) {
			try {
				if (sInvType) {
					const oInvoiceType = this.getView().getModel("help").getProperty("/InvoiceTypes").find(v => v.InvoiceType === sInvType);
					if (sLinkTo) {
						return oInvoiceType.InvoiceTypeDescription + "-" + sLinkTo;
					} else {
						return oInvoiceType.InvoiceTypeDescription;
					}
				} else {
					return sInvType;
				}
			} catch (ex) {
				return sInvType;
			}
			// return sInvType;
		},
		
		invoiceCategory: function(sInvCat, sInvType, sLinkTo) {
			let sDescription = "";
			if (typeof sInvCat === "string" && sInvCat.length > 0) {
				try {
					const aCategories = this._oHelpModel.getProperty("/InvoiceCategories");
					const oCategory = aCategories.find(e => e.InvoiceCategory === sInvCat);
					sDescription = sDescription + oCategory.InvoiceCategoryDescription;
				} catch (ex) {
					sDescription = sDescription + sInvCat;
				}
			}
			if (typeof sInvType === "string" && sInvType.length > 0) {
				try {
					const aInvoiceTypes = this._oHelpModel.getProperty("/InvoiceTypes");
					const oInvoicetype = aInvoiceTypes.find(e => e.InvoiceType === sInvType);
					sDescription = sDescription + " (" + oInvoicetype.InvoiceTypeDescription;
				} catch (ex) {
					sDescription = sDescription + " (" + sInvType;
				}
			}
			if (typeof sLinkTo === "string" && sLinkTo.length > 0) {
				sDescription = sDescription + "-" + sLinkTo + ")";
			} else {
				sDescription = sDescription + ")";
			}
			return sDescription;
		},
		
		invoiceCategory2: function(sInvCat) {
			if (typeof sInvCat === "string" && sInvCat.length > 0) {
				try {
					const aCategories = this._oHelpModel.getProperty("/InvoiceCategories");
					const oCategory = aCategories.find(e => e.InvoiceCategory === sInvCat);
					return oCategory.InvoiceCategoryDescription;
				} catch (ex) {
					return sInvCat;
				}
			}
			return sInvCat;
		},

		getRealEstate: function(sLand, sBuilding, sRentalObject, sEstate) {
			let sRealEstate = sEstate;
			if (sLand && sLand !== "") {
				sRealEstate = sLand;
			} else if (sBuilding && sBuilding !== "") {
				sRealEstate = sBuilding;
			} else if (sRentalObject && sRentalObject !== "") {
				sRealEstate = sRentalObject;
			} else {
				sRealEstate = sEstate;
			}
			return _.trimStart(sRealEstate, "0");
		},

		abapXfeldToBoolean: function (sValue) {
			if (_.isEmpty(sValue)) {
				return false;
			}
			return sValue === "X";
		},

		toSystemMessageIcon: function (sType) {
			if (!sType) {
				return "sap-icon://messsage-information";
			}
			switch (sType) {
				case 'E':
					return "sap-icon://message-error";
				case 'W':
					return "sap-icon://message-warning";
				default:
					return "sap-icon://message-information";
			}
		}
	};
});