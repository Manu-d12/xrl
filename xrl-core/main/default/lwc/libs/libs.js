import apexInterface from '@salesforce/apex/infrastructure.dispatcherAura';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';

let globalVars = {};

export let libs = {
	loadConfig: function(uniqKey) {
		let localConfig = localStorage.getItem(uniqKey);
		if (localConfig != null && typeof(localConfig) !== 'undefined') {
			try {
				let cfg = JSON.parse(localConfig);
				return cfg;
			} catch (e) {
				console.log('Saved config is broken');
			}
		}
		return undefined;
	},
	saveConfig: function(uniqKey, value) {
		if (typeof(value) !== 'string') value = JSON.stringify(value);
		localStorage.setItem(uniqKey, value);
	},
	sortRecords: function(records, fieldName, isASCSort, referenceField) {
		let keyValue;
		if(referenceField){
			keyValue = (a) => {
				return a[referenceField][fieldName];
			};
		}else{
			keyValue = (a) => {
				return a[fieldName];
			};
		}

		let isReverse = isASCSort ? 1 : -1;

		records.sort((x, y) => {
			x = keyValue(x) ? keyValue(x) : ''; // handling null values
			y = keyValue(y) ? keyValue(y) : '';
			return isReverse * ((x > y) - (y > x));
		});

		let ind = 1;
		records.forEach(rec => {rec.index = ind++;});
		
		return records;
	},
	setGlobalVar: function(varName, value) {

		let node = (varName.indexOf(':') > -1) ? globalVars[varName.split(':')[0]] : globalVars;
		node[(varName.indexOf(':') > -1) ? varName.split(':')[1] : varName] = value; //JSON.parse(JSON.stringify(value));
		console.log('GLOBAL VARS', globalVars);
	},
	getGlobalVar: function(varName) {
		//console.log(globalVars);
		return globalVars[varName];
	},
	uuidv4() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0,
				v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	},
	getLookupValue: function(item, field) {
		let fields = field.split('.');
		let obj = item;
		for (let i = 0; i < fields.length; i++) {
			obj = obj[fields[i]];
		}
		return obj;
	},
	getLookupRow: function(item, field) {
		let fields = field.split('.');
		let obj = item;
		let row = item;
		for (let i = 0; i < fields.length; i++) {
			if (i < fields.length) {
				//console.log(fields[i]);
				if (fields[i].endsWith('Id')) {
					row = obj[fields[i].replace(/Id/, '')];
				}
				if (fields[i].endsWith('__c')) {
					row = obj[fields[i].replace(/__c/, '__r')];
				}
			}
			if(obj[fields[i]] !== undefined)
				obj = obj[fields[i]];
			else
				obj = '';
		}
		return [row ? row : {}, obj];
	},
	formatStr: function(template, args) {
			if (typeof(arguments[0]) === 'object') args = args[0];
			return template.replace(/{(\d+)}/g, function(match, number) {
				return typeof args[number] != 'undefined' ?
					args[number] :
					match;
			}).replace(/{\d+}/g, '');
	},
	colModelItem: function(colModelItem) {
		let _labels = globalVars[Object.keys(globalVars)[0]]._LABELS;
		let defParams = {
			"fieldName": {
				"type": "text",
				"label": _labels.lbl_fieldApiName,
				"tooltip": _labels.tooltip_fieldApiName
			},
			"label": {
				"type": "text",
				"label": _labels.lbl_fieldLabel,
				"tooltip": _labels.tooltip_fieldLabel
			},
			"formatter": {
				"type": "function",
				"params": "(row, col, val)",
				"label": _labels.lbl_customFunctionForFormatting,
				"placeHolder" : _labels.lbl_customFunctionExample,
				"useExample":true
			},
			"uStyle": {
				"type": "function",
				"params": "(row, col, val)",
				"label": _labels.lbl_customFunctionForStyle,
				"placeHolder" : _labels.lbl_customFunctionStyleExample,
				"useExample":true
			},
			"isHidden": {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_isColumnHidden
			},
			"isFilterable": {
				"defValue": true,
				"type": "checkbox",
				"label": _labels.lbl_isColumnFilterable
			},
			"isSortable": {
				"defValue": true,
				"type": "checkbox",
				"label": _labels.lbl_isColumnSortable
			},
			"isEditable": {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_isColumnEditable
			},
			"isWrapable": {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_isColumnWrapable
			},
			/*'isEditableMethod': {
				"defValue": false,
				"type": "function",
				"params": "(value)",
				"label" : "isEditable Method",
				"tooltip": "Can edit column or not method. We can implement dynamic properties"
			},*/
			"width": {
				"type": "string",
				"label" : _labels.lbl_width,
				"tooltip": _labels.tooltip_widthExample
			}
		};
		if (colModelItem !== undefined) {
			let result = {}
			for (let key in defParams) {
				result[key] = defParams[key].defValue;
				if (key === 'fieldName') result[key] = colModelItem;
			}
			return result;
		} else return defParams;
	},
	tableItem: function() {
		let _labels = globalVars[Object.keys(globalVars)[0]]._LABELS;
		let defParams = {
			"isShowNumeration" : {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_showNumeration,
				"tooltip": _labels.tooltip_addNumerationColumnToTable,
				"cmd" : "dialog:setTableParam"
			},
			"isShowCheckBoxes": {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_showCheckBoxes,
				"tooltip": _labels.tooltip_addCheckBoxColumnToTable,
				"cmd" : "dialog:setTableParam",
			},
			"isGlobalSearch": {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_enableGlobalSearch,
				"tooltip": _labels.tooltip_showGlobalTableSearch,
				"cmd" : "dialog:setTableParam",
			},
			"pagerTop" : {
				"defValue": true,
				"type": "checkbox",
				"label": _labels.lbl_enableTopPagination,
				"tooltip": _labels.tooltip_showTopPagination,
				"cmd" : "dialog:setPagerParam"
			},
			"pagerBottom" : {
				"defValue": true,
				"type": "checkbox",
				"label": _labels.lbl_enableBottomPagination,
				"tooltip": _labels.tooltip_showBottomPagination,
				"cmd" : "dialog:setPagerParam",
			},
			"showStandardEdit" : {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_showStandardEdit,
				"tooltip": _labels.tooltip_replaceInlineEditWithStandardEdit,
				"cmd" : "dialog:setTableParam",
			},
			"rollBack" : {
				"defValue": false,
				"type": "checkbox",
				"label": "Rollback?",
				"tooltip": "In case of bulk edit if any exception occurs should the entire transaction rolled back?",
				"cmd" : "dialog:setTableParam",
			},
			"groupFieldName" : {
				"type": "combobox",
				"label": "Field Name to group records",
				"tooltip": "Enter the field name by which the records will be grouped",
				"cmd" : "dialog:setTableParam",
			},
			"groupOrder" : {
				"defValue": "ASC",
				"type": "combobox",
				"label": "Grouping Orders",
				"tooltip": "ASC for Ascending and DESC for Descending",
				"options": [{label:'ASC',value:'ASC'},{label:'DESC',value:'DESC'}],
				"cmd" : "dialog:setTableParam",
			},
			"saveChunkSize" : {
				"defValue": 200,
				"type": "string",
				"label": _labels.lbl_chunkSizeForSave,
				"tooltip": _labels.tooltip_numbersOfRecordInChunk,
				"cmd" : "dialog:setTableParam",
			},
			"beforeSaveValidation": {
				"type": "function",
				"label": _labels.lbl_beforeSaveValidation,
				"tooltip": _labels.tooltip_beforeSaveValidation,
				"placeHolder": _labels.placeHolder_beforeSaveValidation,
				"cmd" : "dialog:setTableParam"
			},
			"beforeSaveApexAction": {
				"type": "string",
				"label": _labels.lbl_beforeSaveApexAction,
				"tooltip": _labels.tooltip_beforeSaveApexAction,
				"cmd" : "dialog:setTableParam"
			},
			"deleteChunkSize" : {
				"defValue": 200,
				"type": "string",
				"label": _labels.lbl_deleteChunkSize,
				"tooltip": _labels.tooltip_deleteChunkSize,
				"cmd" : "dialog:setTableParam",
			},
			"beforeDeleteValidation": {
				"type": "function",
				"label": _labels.lbl_beforeDeleteValidation,
				"tooltip": _labels.tooltip_beforeDeleteValidation,
				"placeHolder": _labels.placeHolder_beforeDeleteValidation,
				"cmd" : "dialog:setTableParam"
			},
			"displayOptionListSize" : {
				"defValue": 20,
				"type": "string",
				"label": _labels.lbl_listSizeOptionsDropdown,
				"tooltip": _labels.tooltip_numbersOfOptionsShown,
				"cmd" : "dialog:setTableParam",
			},
			"rowCss": {
				"type": "function",
				"label": _labels.lbl_rowCss,
				"tooltip": _labels.tooltip_changeRowStyleByFunction,
				"placeHolder": _labels.placeHolder_rowCss,
				"cmd" : "dialog:setTableParam"
			}
			
			
		}
		return defParams;
	},
	customActions:function(){
		let _labels = globalVars[Object.keys(globalVars)[0]]._LABELS;
		let defParams = {
			"actionId" : {
				"defValue": ':idNew',
				"type": "text",
				"label": _labels.lbl_actionId,
				"tooltip": _labels.tooltip_actionTooltip
			},
			"actionLabel" : {
				"type": "text",
				"label": _labels.lbl_actionLabel,
				"tooltip": _labels.tooltip_actionLabelTooltip
			},
			"actionTip" : {
				"defValue":'Tip Representation',
				"type": "text",
				"label": _labels.lbl_actionTip,
				"tooltip": _labels.tooltip_actionTipTooltip

			},
			"actionCallBack" : {
				"defValue":'',
				"type": "function",
				"label": _labels.lbl_actionCallback,
				"placeHolder" : _labels.placeholder_actionCallback
			},
			"actionIsHidden" : {
				"defValue":false,
				"type": "checkbox",
				"label": _labels.lbl_actionIsHidden,
				"tooltip": _labels.tooltip_actionIsHidden

			},
			"actionVisibleOnRecordSelection" : {
				"defValue":false,
				"type": "checkbox",
				"label": _labels.lbl_actionVisibleOnRecords,
				"tooltip": _labels.tooltip_actionVisibleOnRecords

			},
			"actionIconName" : {
				"type": "text",
				"label": _labels.lbl_actionIconName,
				"tooltip": _labels.tooltip_actionIconName
			},
			"actionOrder" : {
				"type": "text",
				"label": _labels.lbl_actionOrder,
				"tooltip":_labels.tooltip_actionOrder
			},
			"actionFlowName" : {
				"defValue":"",
				"type": "text",
				"label": _labels.lbl_actionFlowName
			}
		}
		return defParams;
	},
	remoteAction: async function(scope, cmd, params) {
		scope.config.isSpinner = true;
		let outParams = {};
		Object.assign(outParams, params, { recordId: scope.recordId });
		delete outParams.callback;
		await apexInterface({ cmd: cmd, data: outParams }).then(result => {
			console.log(result);
			scope.config.isSpinner = false;
			if ('exception' in result) {
				console.error(result.exception, result.log);
				//HYPER-247
				let formattedErrMsg = '';
				if(result.exception.message.includes('Update failed') && result.exception.message.includes('max length')){
					formattedErrMsg = (result.exception.message.substring(
						result.exception.message.indexOf(";") + 1, 
						result.exception.message.lastIndexOf("):")
					) + ')').replaceAll('&quot;','"');
				}else{
					formattedErrMsg = result.exception.message;
				}
				const event = new ShowToastEvent({
					title: result.exception.title,
					message: formattedErrMsg,
					variant: 'error'
				});
				scope.dispatchEvent(event);
			} else {
				if (typeof(params.callback) === 'function') {
					params.callback.bind(scope)(cmd + 'Result', result);
				}
			}
		})
	},
	help : function(index, params) {
		// Need to open a new tab and redirect user to specific article
		return 'in test';
	},
	currencyMap: function(cur) {
		let map = {
			AED: 'د.إ',
			AFN: '؋',
			ALL: 'L',
			AMD: '֏',
			ANG: 'ƒ',
			AOA: 'Kz',
			ARS: '$',
			AUD: '$',
			AWG: 'ƒ',
			AZN: '₼',
			BAM: 'KM',
			BBD: '$',
			BDT: '৳',
			BGN: 'лв',
			BHD: '.د.ب',
			BIF: 'FBu',
			BMD: '$',
			BND: '$',
			BOB: '$b',
			BOV: 'BOV',
			BRL: 'R$',
			BSD: '$',
			BTC: '₿',
			BTN: 'Nu.',
			BWP: 'P',
			BYN: 'Br',
			BYR: 'Br',
			BZD: 'BZ$',
			CAD: '$',
			CDF: 'FC',
			CHE: 'CHE',
			CHF: 'CHF',
			CHW: 'CHW',
			CLF: 'CLF',
			CLP: '$',
			CNY: '¥',
			COP: '$',
			COU: 'COU',
			CRC: '₡',
			CUC: '$',
			CUP: '₱',
			CVE: '$',
			CZK: 'Kč',
			DJF: 'Fdj',
			DKK: 'kr',
			DOP: 'RD$',
			DZD: 'دج',
			EEK: 'kr',
			EGP: '£',
			ERN: 'Nfk',
			ETB: 'Br',
			ETH: 'Ξ',
			EUR: '€',
			FJD: '$',
			FKP: '£',
			GBP: '£',
			GEL: '₾',
			GGP: '£',
			GHC: '₵',
			GHS: 'GH₵',
			GIP: '£',
			GMD: 'D',
			GNF: 'FG',
			GTQ: 'Q',
			GYD: '$',
			HKD: '$',
			HNL: 'L',
			HRK: 'kn',
			HTG: 'G',
			HUF: 'Ft',
			IDR: 'Rp',
			ILS: '₪',
			IMP: '£',
			INR: '₹',
			IQD: 'ع.د',
			IRR: '﷼',
			ISK: 'kr',
			JEP: '£',
			JMD: 'J$',
			JOD: 'JD',
			JPY: '¥',
			KES: 'KSh',
			KGS: 'лв',
			KHR: '៛',
			KMF: 'CF',
			KPW: '₩',
			KRW: '₩',
			KWD: 'KD',
			KYD: '$',
			KZT: '₸',
			LAK: '₭',
			LBP: '£',
			LKR: '₨',
			LRD: '$',
			LSL: 'M',
			LTC: 'Ł',
			LTL: 'Lt',
			LVL: 'Ls',
			LYD: 'LD',
			MAD: 'MAD',
			MDL: 'lei',
			MGA: 'Ar',
			MKD: 'ден',
			MMK: 'K',
			MNT: '₮',
			MOP: 'MOP$',
			MRO: 'UM',
			MRU: 'UM',
			MUR: '₨',
			MVR: 'Rf',
			MWK: 'MK',
			MXN: '$',
			MXV: 'MXV',
			MYR: 'RM',
			MZN: 'MT',
			NAD: '$',
			NGN: '₦',
			NIO: 'C$',
			NOK: 'kr',
			NPR: '₨',
			NZD: '$',
			OMR: '﷼',
			PAB: 'B/.',
			PEN: 'S/.',
			PGK: 'K',
			PHP: '₱',
			PKR: '₨',
			PLN: 'zł',
			PYG: 'Gs',
			QAR: '﷼',
			RMB: '￥',
			RON: 'lei',
			RSD: 'Дин.',
			RUB: '₽',
			RWF: 'R₣',
			SAR: '﷼',
			SBD: '$',
			SCR: '₨',
			SDG: 'ج.س.',
			SEK: 'kr',
			SGD: 'S$',
			SHP: '£',
			SLL: 'Le',
			SOS: 'S',
			SRD: '$',
			SSP: '£',
			STD: 'Db',
			STN: 'Db',
			SVC: '$',
			SYP: '£',
			SZL: 'E',
			THB: '฿',
			TJS: 'SM',
			TMT: 'T',
			TND: 'د.ت',
			TOP: 'T$',
			TRL: '₤',
			TRY: '₺',
			TTD: 'TT$',
			TVD: '$',
			TWD: 'NT$',
			TZS: 'TSh',
			UAH: '₴',
			UGX: 'USh',
			USD: '$',
			UYI: 'UYI',
			UYU: '$U',
			UYW: 'UYW',
			UZS: 'лв',
			VEF: 'Bs',
			VES: 'Bs.S',
			VND: '₫',
			VUV: 'VT',
			WST: 'WS$',
			XAF: 'FCFA',
			XBT: 'Ƀ',
			XCD: '$',
			XOF: 'CFA',
			XPF: '₣',
			XSU: 'Sucre',
			XUA: 'XUA',
			YER: '﷼',
			ZAR: 'R',
			ZMW: 'ZK',
			ZWD: 'Z$',
			ZWL: '$'
		}
		if (cur in map) return map[cur];
		return "UNKNOWN CURRENCY";
	}
	
}