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
	sortRecords: function(records, fieldName, isASCSort) {
		let keyValue = (a) => {
			return a[fieldName];
		};

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
			}
			obj = obj[fields[i]];
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
		let defParams = {
			"fieldName": {
				"type": "text",
				"label": "Field Api Name",
				"tooltip": "You can use different constructions like a 'Account.Name' or '(SELECT Id FROM Accounts WHERE CreatedDate=TODAY)' "
			},
			"label": {
				"type": "text",
				"label": "Field Label",
				"tooltip": "If You want to use label from describe, please leave this field empty"
			},
			"formatter": {
				"type": "function",
				"params": "(row, col, val)",
				"label": "Custom function for formatting"
			},
			"uStyle": {
				"type": "function",
				"params": "(row, col, val)",
				"label": "Custom function for style"
			},
			"isHidden": {
				"defValue": false,
				"type": "checkbox",
				"label": "Is column Hidden?"
			},
			"isFilterable": {
				"defValue": true,
				"type": "checkbox",
				"label": "Is column Filterable?"
			},
			"isSortable": {
				"defValue": true,
				"type": "checkbox",
				"label": "Is column Sortable?"
			},
			"isEditable": {
				"defValue": false,
				"type": "checkbox",
				"label": "Is column Editable?"
			},
			/*'isEditable': {
				"defValue": false,
				"type": "checkbox",
				"label" : "Is column Editable?",
				"tooltip": "Can edit column or not"
			},*/
			/*'isEditableMethod': {
				"defValue": false,
				"type": "function",
				"params": "(value)",
				"label" : "isEditable Method",
				"tooltip": "Can edit column or not method. We can implement dynamic properties"
			},*/
			"width": {
				"type": "string",
				"label" : "Width",
				"tooltip": "You can user % or px for definition. Ex: 20px or 5%"
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
		let defParams = {
			"isShowNumeration" : {
				"defValue": true,
				"type": "checkbox",
				"label": "Is need show numeration?",
				"tooltip": "Add Numeration column to table",
				"cmd" : "dialog:setTableParam"
			},
			"isShowCheckBoxes": {
				"defValue": true,
				"type": "checkbox",
				"label": "Is need show checkboxes?",
				"tooltip": "Add checkbox column to table",
				"cmd" : "dialog:setTableParam",
			},
			"isGlobalSearch": {
				"defValue": true,
				"type": "checkbox",
				"label": "Is show global search for a table?",
				"tooltip": "Show/Hide global table search",
				"cmd" : "dialog:setTableParam",
			},
			"pagerTop" : {
				"defValue": true,
				"type": "checkbox",
				"label": "Is show pagination on the top?",
				"tooltip": "Show/Hide top pager",
				"cmd" : "dialog:setPagerParam"
			},
			"pagerBottom" : {
				"defValue": false,
				"type": "checkbox",
				"label": "Is show pagination on the bottom?",
				"tooltip": "Show/Hide bottom pager",
				"cmd" : "dialog:setPagerParam",
			},
			"rowCss": {
				"type": "function",
				"label": "rowCss",
				"tooltip": "Change style by data",
				"cmd" : "dialog:setTableParam"
			}
			
			
		}
		return defParams;
	},
	remoteAction: function(scope, cmd, params) {
		scope.config.isSpinner = true;
		let outParams = {};
		Object.assign(outParams, params, { recordId: scope.recordId });
		delete outParams.callback;
		apexInterface({ cmd: cmd, data: outParams }).then(result => {
			console.log(result);
			scope.config.isSpinner = false;
			if ('exception' in result) {
				console.error(result.exception, result.log);
				const event = new ShowToastEvent({
					title: result.exception.title,
					message: result.exception.message,
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