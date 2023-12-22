import apexInterface from '@salesforce/apex/infrastructure.dispatcherAura';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';

let globalVars = {};

export let libs = {
	portalUrl : function(){
		return libs.getGlobalVar('portalUrl');
	},
	getNameSpace: function(){
		//it will be helpful for development
		return 'XRL__';
	},
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
	loadUserPreferredView: function(uniqKey) {
		let localViewName = localStorage.getItem(uniqKey);
		if (localViewName != null && typeof(localViewName) !== 'undefined') {
			try {
				let cfg = localViewName;
				return cfg;
			} catch (e) {
				console.log('Saved View Name is broken');
			}
		}
		return undefined;
	},
	userListViewPreference: function(uniqKey, value) {
		if (typeof(value) !== 'string') value = JSON.stringify(value);
		localStorage.setItem(uniqKey, value);
	},
	sortRecords: function(records, fieldName, isASCSort, referenceField) {
		let keyValue;
		if(referenceField){
			keyValue = (a) => {
				return a[referenceField] ? a[referenceField][fieldName] : '';
			};
		}else{
			keyValue = (a) => {
				return a[fieldName];
			};
		}

		let isReverse = isASCSort ? 1 : -1;

		//in case of number it will sort normally but in case of string it will convert it to lower case
		records.sort((x, y) => {
			let xKeyValue = keyValue(x);
			let yKeyValue = keyValue(y);
			x = xKeyValue ? (typeof xKeyValue === 'number' ? xKeyValue : xKeyValue.toLowerCase()) : ''; // handling null values
			y = yKeyValue ? (typeof yKeyValue === 'number' ? yKeyValue : yKeyValue.toLowerCase()) : '';
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
	getGlobalVarsCount : function() {
		let url = (window.location.pathname.indexOf('/s/')>-1 ? window.location.pathname.replace(/\/(.*?\/)s\/.*/,'$1') : '');
		libs.setGlobalVar('portalUrl', url);
		return Object.keys(globalVars).length;
	},
	getGlobalVar: function(varName) {
		//console.log(globalVars);
		return globalVars[varName];
	},
	setLocalStorageVar: function(varName, value) {
		localStorage.setItem(varName, value);
	},
	getLocalStorageVar: function(varName) {
		return localStorage.getItem(varName);
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
	/* 
	isReadOnly (Boolean) - This flag is used for the History grid view. 
							Items with value 'True' will be hidden from the grid field settings
	*/
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
			"isHidden": {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_isColumnHidden,
				"tooltip": _labels.tooltip_isColumnHidden
			},
			"isFilterable": {
				"defValue": true,
				"type": "checkbox",
				"label": _labels.lbl_isColumnFilterable,
				"tooltip": _labels.tooltip_isColumnFilterable,
				"helpArticleUrl": _labels.hlpUrl_isFilterable
			},
			"isSortable": {
				"defValue": true,
				"type": "checkbox",
				"label": _labels.lbl_isColumnSortable,
				"tooltip": _labels.tooltip_isColumnSortable,
				"helpArticleUrl": _labels.hlpUrl_isSortable
			},
			"isEditable": {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_isColumnEditable,
				"isReadOnly": true,
				"helpArticleUrl": _labels.hlpUrl_isEditable,
			},
			"isWrapable": {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_isColumnWrapable,
				"tooltip": _labels.tooltip_isColumnWrapable
			},
			"width": {
				"type": "string",
				"label" : _labels.lbl_width,
				"tooltip": _labels.tooltip_widthExample
			},
			"advanced": {
				"type": "function",
				"label": _labels.lbl_advancedFieldSettings,
				"tooltip" : _labels.tooltip_advancedFieldSettings,
				"isAdvanced" : true
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
	/* 
	isReadOnly (Boolean) - This flag is used for the History grid view. 
							Items with value 'True' will be hidden from the grid table settings
	*/
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
				"helpArticleUrl": _labels.hlpUrl_isShowCheckBoxes
			},
			"isGlobalSearch": {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_enableGlobalSearch,
				"tooltip": _labels.tooltip_showGlobalTableSearch,
				"cmd" : "dialog:setTableParam",
				"helpArticleUrl": _labels.hlpUrl_isGlobalSearch,
			},
			"pagerTop" : {
				"defValue": true,
				"type": "checkbox",
				"label": _labels.lbl_enableTopPagination,
				"tooltip": _labels.tooltip_showTopPagination,
				"cmd" : "dialog:setPagerParam",
				"helpArticleUrl": _labels.hlpUrl_pagerTop,
			},
			"pagerBottom" : {
				"defValue": true,
				"type": "checkbox",
				"label": _labels.lbl_enableBottomPagination,
				"tooltip": _labels.tooltip_showBottomPagination,
				"cmd" : "dialog:setPagerParam",
				"helpArticleUrl": _labels.hlpUrl_pagerTop,
			},
			"enableColumnHeaderWrap" : {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_enableColumnHeaderWrap,
				"tooltip": _labels.tooltip_enableColumnHeaderWrap,
				"cmd" : "dialog:setTableParam",
			},
			"showStandardEdit" : {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_showStandardEdit,
				"tooltip": _labels.tooltip_replaceInlineEditWithStandardEdit,
				"isReadOnly": true,
				"cmd" : "dialog:setTableParam",
			},
			"rollBack" : {
				"defValue": false,
				"type": "checkbox",
				"label": _labels.lbl_rollback,
				"tooltip": _labels.tooltip_rollback,
				"isReadOnly": true,
				"cmd" : "dialog:setTableParam",
			},
			"overrideGridHeader" : {
				"type": "string",
				"label": _labels.lbl_overrideGridHeader,
				"tooltip": _labels.tooltip_overrideGridHeader,
				"cmd" : "dialog:setTableParam",
			},
			"groupFieldName" : {
				"defValue": "",
				"type": "combobox",
				"optionsCallBack" : function(scope, sFields){
					return sFields;
				},
				"label": _labels.lbl_groupFieldName,
				"tooltip": _labels.tooltip_groupFieldName,
				"cmd" : "dialog:setTableParam",
				"helpArticleUrl": _labels.hlpUrl_groupFieldName,
			},
			"groupOrder" : {
				"defValue": "ASC",
				"type": "combobox",
				"label": _labels.lbl_groupOrder,
				"tooltip": _labels.tooltip_groupOrder,
				"options": [{label:'ASC',value:'ASC'},{label:'DESC',value:'DESC'}],
				"cmd" : "dialog:setTableParam",
			},
			/*"isRecordsDragDropEnabled": { // Kuntal, we need to remove this checkbox, and check callback on advanced section
				"defValue": false,
				"type": "checkbox",
				"label": "Enable drag & drop on records?",
				"tooltip": "If you enable this, you will be create hierarchy with records just by drag and drop",
				"cmd" : "dialog:setTableParam",
			},*/
			/*"fieldToMapToIndex" : { // Kuntal, we need to remove this checkbox, and check callback on advanced section
				"type": "string",
				"label": _labels.lbl_fieldToMapToIndex,
				"tooltip": _labels.tooltip_fieldToMapToIndex,
				"isReadOnly": true,
				"cmd" : "dialog:setTableParam",
			},
			},*/
			// "recordsDragDropCallback": {
			// 	"type": "function",
			// 	"label": "Callback for record drag drop",
			// 	"tooltip": "Callback for record drag drop",
			// 	"placeHolder": "function(scope,records,draggedRecord,droppedRecord,libs){ return records; }",
			// 	"isReadOnly": true,
			// 	"cmd" : "dialog:setTableParam",
			// 	"useExample":true,
			// },
			"saveChunkSize" : {
				"defValue": 200,
				"type": "string",
				"label": _labels.lbl_chunkSizeForSave,
				"tooltip": _labels.tooltip_numbersOfRecordInChunk,
				"isReadOnly": true,
				"cmd" : "dialog:setTableParam",
			},
			"deleteChunkSize" : {
				"defValue": 200,
				"type": "string",
				"label": _labels.lbl_deleteChunkSize,
				"tooltip": _labels.tooltip_deleteChunkSize,
				"isReadOnly": true,
				"cmd" : "dialog:setTableParam",
			},
			"loadChunkSize" : {
				//"defValue": 200,
				"type": "string",
				"label": _labels.lbl_loadChunkSize,
				"tooltip": _labels.tooltip_loadChunkSize,
				"isReadOnly": true,
				"cmd" : "dialog:setTableParam",
			},
			// "beforeSaveValidation": {
			// 	"type": "function",
			// 	"label": _labels.lbl_beforeSaveValidation,
			// 	"tooltip": _labels.tooltip_beforeSaveValidation,
			// 	"placeHolder": _labels.placeHolder_beforeSaveValidation,
			// 	"isReadOnly": true,
			// 	"cmd" : "dialog:setTableParam",
			// 	"helpArticleUrl": _labels.hlpUrl_beforeSaveValidation,
			// 	"useExample":true,
			// },
			"beforeSaveApexAction": { // Temporary removed
				"defValue": "",
				"type": "combobox",
				"optionsCallBack" : function(scope){
					return scope.config.apexInterfaceList;
				},
				"label": _labels.lbl_beforeSaveApexAction,
				"tooltip": _labels.tooltip_beforeSaveApexAction,
				"isReadOnly": true,
				"cmd" : "dialog:setTableParam"
			},
			// "beforeDeleteValidation": {
			// 	"type": "function",
			// 	"label": _labels.lbl_beforeDeleteValidation,
			// 	"tooltip": _labels.tooltip_beforeDeleteValidation,
			// 	"placeHolder": _labels.placeHolder_beforeDeleteValidation,
			// 	"isReadOnly": true,
			// 	"cmd" : "dialog:setTableParam",
			// 	"helpArticleUrl": _labels.hlpUrl_beforeDeleteValidation,
			// 	"useExample":true,
			// },
			"displayOptionListSize" : {
				"defValue": 20,
				"type": "string",
				"label": _labels.lbl_listSizeOptionsDropdown,
				"tooltip": _labels.tooltip_numbersOfOptionsShown,
				"cmd" : "dialog:setTableParam",
			},
			//moved to advanced config JSON
			// "rowCss": {
			// 	"type": "function",
			// 	"label": _labels.lbl_rowCss,
			// 	"tooltip": _labels.tooltip_changeRowStyleByFunction,
			// 	"placeHolder": _labels.placeHolder_rowCss,
			// 	"cmd" : "dialog:setTableParam",
			// 	"useExample":true,
			// },
			// "afterloadTransformation": {
			// 	"type": "function",
			// 	"label": _labels.lbl_afterloadTransformation,
			// 	"tooltip": _labels.tooltip_afterloadTransformation,
			// 	"placeHolder": _labels.placeHolder_afterloadTransformation,
			// 	"cmd" : "dialog:setTableParam",
			// 	"useExample":true,
			// },
			"rowRecalcApex": { // Temporary removed
				"defValue": "",
				"type": "combobox",
				"optionsCallBack" : function(scope){
					return scope.config.apexInterfaceList;
				},
				"label": 'Apex class for row recalculation',
				"tooltip": 'Apex class for row recalculation',
				"placeHolder": 'Apex class for row recalculation',
				"cmd" : "dialog:setTableParam"
			},
			/*"externalJS": {
				"defValue": "",
				"type": "combobox",
				"optionsCallBack" : function(scope){
					return scope.config._staticResourceList;
				},
				"label": _labels.lbl_externalJS,
				"tooltip": _labels.tooltip_externalJS,
				"placeHolder": _labels.lbl_externalJS,
				"cmd" : "dialog:setTableParam"
			},*/
			"advanced": {
				"type": "function",
				"label": _labels.lbl_advancedTableSettings,
				"tooltip" : _labels.tooltip_advancedTableSettings,
				"cmd" : "dialog:setTableParam",
				"isAdvanced" : true
			}
			
			
		}
		return defParams;
	},
	jsonParse: function(input){
		return JSON.parse(JSON.stringify(input));
	},
	setDefaultColumns: function(){
		let columns = [{
			"fieldName" : "Id",
			"updateable": false,
			"isNameField": false,
			"isEditable": false,
			"isFilterable": true,
			"isSortable": true,
			"helpText": 'Id (id)'
		}];
		return columns;
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
				"defValue":'',
				"type": "text",
				"label": _labels.lbl_actionTip,
				"tooltip": _labels.tooltip_actionTipTooltip

			},
			"actionCallBack" : {
				"defValue":'',
				"type": "function",
				"label": _labels.lbl_actionCallback,
				"placeHolder" : _labels.placeholder_actionCallback,
				"useExample":true,
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
			"actionVariant" : {
				"type": "combobox",
				"defValue": "bare",
				"options" : [{label : "bare", value : "bare"}, {label : "bare-inverse", value : "bare-inverse"}, {label : "border", value : "border"},{label : "border-filled", value : "border-filled"},{label : "border-inverse", value : "border-inverse"},{label : "brand", value : "brand"},{label : "container", value : "container"}],
				"label": 'variant',
				"tooltip": 'variant'
			},

			"actionIconName" : {
				"type": "text",
				"label": _labels.lbl_actionIconName,
				"tooltip": _labels.tooltip_actionIconName
			},
			"refreshAfterCustomActionExecution" : { 
				"defValue":false,
				"type": "checkbox",
				"label": _labels.lbl_refreshAfterCustomActionExecution,
				"tooltip": _labels.tooltip_refreshAfterCustomActionExecution
			},
			"actionOrder" : {
				"type": "text",
				"label": _labels.lbl_actionOrder,
				"tooltip":_labels.tooltip_actionOrder
			},
			"actionFlowName" : {
				"defValue":"",
				"type": "combobox",
				"optionsCallBack" : function(scope){
					return scope.config.flowList;
				},
				"label": _labels.lbl_actionFlowName
			},
			"advanced": {
				"type": "function",
				"label": _labels.lbl_advancedActionSettings,
				"tooltip" : _labels.tooltip_advancedActionSettings,
				"isAdvanced" : true
			}
		}
		return defParams;
	},
	remoteAction: async function(scope, cmd, params) {
		if (scope.config) scope.config.isSpinner = true;
		let outParams = {};
		if (scope.recordId!=undefined) libs.setGlobalVar('recordId', scope.recordId);
		Object.assign(outParams, params, { recordId: scope.recordId });
		if (cmd === 'query' && scope.config?.dataTableConfig && scope.config?.dataTableConfig.loadChunkSize) {
			console.log('query', scope.config.dataTableConfig.loadChunkSize);
			outParams.loadChunkSize = scope.config.dataTableConfig.loadChunkSize;
		}
		delete outParams.callback;
		if(cmd === 'orchestrator'){
			libs.orchestratorResult(null);
		}
		if((cmd === 'invokeApex' || cmd === 'orchestrator') && outParams._chunkSize !== undefined){ //if it is invokeApex and chunk size is defined then we will split the records into chunks before sending it into apex
			let allRecords = outParams?.recordsPath ? JSON.parse(JSON.stringify(outParams[outParams.recordsPath.split('.')[0]][outParams.recordsPath.split('.')[1]])) : JSON.parse(JSON.stringify(outParams.data.records));
			this.splitRecordsIntoChunks(scope,allRecords,parseInt(outParams._chunkSize),async function(scope,chunk,isFirstChunk,isLastChunk) {
				if(outParams.data === undefined) {
					outParams.data = {};
				}
				if(cmd === 'orchestrator'){
					outParams.orchestratorRequest.relatedRecordIds = chunk;
					outParams.orchestratorRequest.isFirstChunk = isFirstChunk;
					outParams.orchestratorRequest.isLastChunk = isLastChunk;
				}
				// outParams.data.records = chunk;
				outParams.data.isFirstChunk = isFirstChunk;
				outParams.data.isLastChunk = isLastChunk;
				await callToApexInterface();
			},outParams);
		}else{
			await callToApexInterface();
		}
		async function callToApexInterface(){
			await apexInterface({ cmd: cmd, data: outParams }).then(result => {
				console.log(result);
				if (scope.config) scope.config.isSpinner = false;
				if ('exception' in result) {
					scope.config.isExceptionInRemoteAction = true;
					console.error(result.exception, result.log);
					//HYPER-247
					let formattedErrMsg = libs.formatErrMessage(result.exception.message);				
					const event = new ShowToastEvent({
						title: result.exception.title,
						message: formattedErrMsg,
						variant: 'error'
					});
					if (formattedErrMsg.includes('License is expired')) {
						scope.config._tableLevelErrors = '<b style="color:red">XRL:</b> Package License Expired';
					}
					else if(formattedErrMsg.includes('Permission Set')){
						scope.config._tableLevelErrors = '<b>XRL:</b> No permission set assigned';
					}
				} else {
					if (typeof(params.callback) === 'function') {
						result.isLastChunk = outParams.data?.isLastChunk;
						params.callback.bind(scope)(cmd + 'Result', result);
					}
				}
			})
		}
	},
	formatErrMessage: function(errMsg) {
		let message = '';
		if(errMsg.includes('Update failed') && errMsg.includes('max length')){
			message = (errMsg.substring(
				errMsg.indexOf(";") + 1, 
				errMsg.lastIndexOf("):")
			) + ')').replaceAll('&quot;','"');
		}
		else if(errMsg.includes('ENTITY_IS_DELETED: entity is deleted')){
			message = globalVars[Object.keys(globalVars)[0]]._LABELS.msg_entityIsDeleted;
		}
		else{
			message = errMsg;
		}
		return message;
	},
	getMacros: function(){
		return [{"label":'recordId',"value":'%%recordId%%'}, {"label":'userId',"value":'%%userId%%'},{"label":'sObjApiName',"value":'%%sObjApiName%%'},{"label":'urlParam',"value":'%%urlParam%%'}];
	},
	getDateLiterals: function(){
		return [{"label":'CUSTOM',"value":'CUSTOM'},{"label":'YESTERDAY',"value":'YESTERDAY'},{"label":'TODAY',"value":'TODAY'},{"label":'TOMORROW',"value":'TOMORROW'},{"label":'LAST WEEK',"value":'LAST_WEEK'},{"label":'THIS WEEK',"value":'THIS_WEEK'},{"label":'LAST MONTH',"value":'LAST_MONTH'},{"label":'THIS MONTH',"value":'THIS_MONTH'},{"label":'THIS YEAR',"value":'THIS_YEAR'},{"label":'LAST YEAR',"value":'LAST_YEAR'}];
	},
	showToast : function(scope, params) {
		const event = new ShowToastEvent(params);
		scope.dispatchEvent(event);
	},
	findRecordWithChild:function(records, targetId) {
		for (const record of records) {
			if (record.Id === targetId) {
				return record;
			}
	
			if (record.childRecords) {
				const foundInChild = libs.findRecordWithChild(record.childRecords, targetId);
				if (foundInChild) {
					return foundInChild;
				}
			}
		}
	
		return null;
	},
	flattenRecordsWithChildren:function(records) {
		const singleLevelRecords = [];
	
		function flatten(record) {
			const { Id, childRecords } = record;
	
			if (!singleLevelRecords.some(r => r.Id === Id)) {
				singleLevelRecords.push({ ...record, childRecords: [] });
	
				if (childRecords) {
					childRecords.forEach(childRecord => flatten(childRecord));
				}
			}
		}
	
		records.forEach(record => {
			flatten(record);
		});
	
		return singleLevelRecords;
	},
	broadcastMessage: function(scope, messageObject, target) {
		// every broadcast message should have a Id which will be used to identify if the message is for any specific
		// component when receiving
		try{
			if(target === undefined) {
				target = "*";
			}
			console.log('Sending Message: ', messageObject, " to ", target);
			window.postMessage(messageObject, target);
		}catch(e){
			console.error("Error in postMessage", e);
		}
	},
	findMatchingKey: function(map, array) {
		try{
			if(map.size === 0) return [];
			const matchingObjects = [];
			for (const obj of array) {
				const uniqueName = obj.uniqueName;
				if (map?.has(uniqueName)) {
					matchingObjects.push(obj);
				}
			}
			return matchingObjects.length > 0 ? matchingObjects : [];
		}catch(e){
			console.log('No message received');
		}
	},
	isFunction: function (param) {
        return param && (typeof (param) === 'function' || typeof param === "string" && param.trim().startsWith('function'))
    },
	help : function(index, articleUrl) {
		const baseUrl = 'https://help.hypercomps.com/';
		let labels = globalVars[Object.keys(globalVars)[0]]?._LABELS;
		let url = baseUrl;
		/*
			Tab Numbering logic
			11 - The first character denotes the parent tab number & second character denotes the child tab number,
				so 11 means that it is the 'Configure' tab of 'Field Selection'
			4 - As this tab does not have any children tab, so it is a single digit which represents parent tab number
				This is a example of "Locked Field" tab
		*/
		if(articleUrl === undefined){
			switch(index.split(':')[1]){
				case 'extRelList':
					url += labels.hlpUrl_extRelListInterfaceUnderstanding;
					break;
				case '11': //Configure
					url += labels.hlpUrl_sqlBuilderFieldSelection;
					break;
				case '12': //Apply Condition 
					url += labels.hlpUrl_sqlBuilderApplyCondition;
					break;
				case '13': //Apply Ordering
					url += labels.hlpUrl_sqlBuilderApplyOrdering;
					break;
				case '2': //Field Settings
					url += labels.hlpUrl_fieldSettings;
					break;
				case '3': //Table Settings
					url += labels.hlpUrl_tableSettings;
					break;
				case '4': //Locked fields
					url += labels.hlpUrl_lockedFields;
					break;
				case '5': //Actions
					url += labels.hlpUrl_actions;
					break;
				default:
					url = baseUrl;
			}
		}else{
			url += articleUrl;
		}
		window.open(url, "_blank");
		return 'in test';
	},
	replaceLiteralsInStr : function(str, name){
		if (str === undefined) return str;
		let GLOBALVARS = globalVars[name];
		const regex = /%%.*?%%/g;
		let result = str.replace(regex, function(x){
			let field = x.replaceAll('%','');
			let value = libs.getLookupValue(GLOBALVARS, field);
			return value;
		});
		return result;
	},	
	standardActions: function(){
		let _labels = globalVars[Object.keys(globalVars)[0]]._LABELS || {};
		let actions = [
			{
				"actionId": "std:reset_filters",
				"actionLabel": _labels.altTxt_resetFilters,
				"actionTip": _labels.title_resetFilters,
				"actionCallBack": "",
				"actionIsHidden": false,
				"actionIconName": "utility:filterList",
				"isActionStandard":true,
				"actionOrder":5
			  },
			  {
				"actionId": "std:delete",
				"actionLabel": _labels.altTxt_delete,
				"actionTip": _labels.title_delete,
				"actionCallBack": "",
				"actionIsHidden": false,
				"actionVisibleOnRecordSelection":true,
				"actionIconName": "utility:delete",
				"isActionStandard":true,
				"actionOrder":10
			},
			{
			  "actionId": "std:export",
			  "actionLabel": _labels.altTxt_export,
			  "actionTip": _labels.title_export,
			  "actionCallBack": "",
			  "actionIsHidden": false,
			  "actionIconName": "utility:download",
			  "isActionStandard":true,
			  "actionOrder":20
			},
			{
			  "actionId": "std:new",
			  "actionLabel": _labels.altTxt_new,
			  "actionTip": _labels.title_newRecord,
			  "actionCallBack": "",
			  "actionIsHidden": false,
			  "actionIconName": "utility:new",
			  "isActionStandard":true,
			  "actionOrder":30
			},
			{
			  "actionId": "std:refresh",
			  "actionLabel": _labels.title_refresh,
			  "actionTip": _labels.altTxt_refreshListView,
			  "actionCallBack": "",
			  "actionIsHidden": false,
			  "actionIconName": "utility:refresh",
			  "isActionStandard":true,
			  "actionOrder":40
			},
			{
			  "actionId": "std:request_open",
			  "actionLabel": _labels.altTxt_requestAFeature,
			  "actionTip": _labels.title_requestAFeature,
			  "actionCallBack": "",
			  "actionIsHidden": false,
			  "actionIconName": "utility:email",
			  "isActionStandard":true,
			  "actionOrder":50
			},
			{
			  "actionId": "std:expand_view",
			  "actionLabel": _labels.altTxt_expandView,
			  "actionTip": _labels.title_expandView,
			  "actionCallBack": "",
			  "actionIsHidden": false,
			  "actionIconName": "utility:expand/utility:contract",
			  "isActionStandard":true,
			  "actionOrder":60
			}
		  ];
		  return actions;
	},
	getParentHistorySObjName: function(name){
		let config = globalVars[name];
		return config.sObjApiName.toLowerCase().endsWith('__history') ? 
				config.sObjApiName.replace('__History','__c') :
				config.sObjApiName.replace('History','');
	},
	historyGrid: function(apiName){
		//apiName.split('::')[2].split('.')[1] === false means that it is the current object's history
		//otherwise it is the history grid for parent child.
		let isChildObjectHistory = apiName.split('::')[2].split('.')[1] !== undefined;
		let fieldName = isChildObjectHistory ? apiName.split('::')[2].split('.')[0] + "Id"
		: apiName.split('::')[2].split('.')[0].slice(0,-2) + ".Id";
		if(apiName.split('::')[1] === 'OpportunityHistory'){
			let defFields = [
				{
					"label": "Opportunity ",
					"fieldName": "OpportunityId",
					"type": "reference",
					"updateable": false,
					"isNameField": false,
					"referenceTo": "Opportunity",
					"filterable": true,
					"sortable": true,
					"nillable": false,
					"helpText": "OpportunityId (reference)",
					"isEditable": false,
					"isFilterable": true,
					"isSortable": true,
					"relationshipName": "Opportunity",
				},
				{
					"label": "Amount",
					"fieldName": "Amount",
					"type": "currency",
					"updateable": false,
					"isNameField": false,
					"filterable": true,
					"sortable": true,
					"nillable": true,
					"helpText": "Amount (currency)",
					"isEditable": false,
					"isFilterable": true,
					"isSortable": true,
				},
				{
					"label": "Stage Name",
					"fieldName": "StageName",
					"type": "picklist",
					"updateable": false,
					"isNameField": false,
					"filterable": true,
					"sortable": true,
					"nillable": false,
					"helpText": "StageName (picklist)",
					"isEditable": false,
					"isFilterable": true,
					"isSortable": true,
				},
				{
					"label": "Previous Amount",
					"fieldName": "PrevAmount",
					"type": "currency",
					"updateable": false,
					"isNameField": false,
					"filterable": true,
					"sortable": true,
					"nillable": true,
					"helpText": "PrevAmount (currency)",
					"isEditable": false,
					"isFilterable": true,
					"isSortable": true,
				},
				{
					"label": "Previous Close Date",
					"fieldName": "PrevCloseDate",
					"type": "date",
					"updateable": false,
					"isNameField": false,
					"filterable": true,
					"sortable": true,
					"nillable": true,
					"helpText": "PrevCloseDate (date)",
					"isEditable": false,
					"isFilterable": true,
					"isSortable": true,
				},
				{
					"label": "Close Date",
					"fieldName": "CloseDate",
					"type": "date",
					"updateable": false,
					"isNameField": false,
					"filterable": true,
					"sortable": true,
					"nillable": true,
					"helpText": "CloseDate (date)",
					"isEditable": false,
					"isFilterable": true,
					"isSortable": true,
				},
				{
					"label": "Created By ",
					"fieldName": "CreatedById",
					"type": "reference",
					"updateable": false,
					"isNameField": false,
					"referenceTo": "User",
					"filterable": true,
					"sortable": true,
					"nillable": false,
					"helpText": "CreatedById (reference)",
					"isEditable": false,
					"isFilterable": true,
					"isSortable": true,
					"relationshipName": "CreatedBy",
				},
				{
					"label": "Created Date",
					"fieldName": "CreatedDate",
					"type": "datetime",
					"updateable": false,
					"isNameField": false,
					"filterable": true,
					"sortable": true,
					"nillable": false,
					"helpText": "CreatedDate (datetime)",
					"isEditable": false,
					"isFilterable": true,
					"isSortable": true,
				}
			];
			return defFields;
		}
		let defFields = [
			{
				"label": "New Value",
				"fieldName": "NewValue",
				"type": "anyType",
				"updateable": false,
				"isFilterable": true,
				"isSortable": true,
				"isNameField": false,
				"isEditable": false,
				"helpText": 'NewValue (anyType)',
			},
			{
				"label": "Old Value",
				"fieldName": "OldValue",
				"type": "anyType",
				"updateable": false,
				"isFilterable": true,
				"isSortable": true,
				"isNameField": false,
				"isEditable": false,
				"helpText": 'OldValue (anyType)',
			},
			{
				"label": "Created Date",
				"fieldName": "CreatedDate",
				"type": "datetime",
				"updateable": false,
				"isFilterable": true,
				"isSortable": true,
				"isNameField": false,
				"isEditable": false,
				"helpText": 'CreatedDate (dateTime)',
			},
			{
				"label": "Changed Field",
				"fieldName": "Field",
				"type": "picklist",
				"updateable": false,
				"isFilterable": true,
				"isSortable": true,
				"isNameField": false,
				"isEditable": false,
				"helpText": 'Field (picklist)',
			},
			{
				"label": "Changed By",
				"fieldName": "CreatedBy.Name",
				"css": "slds-item",
				"type": "string",
				"updateable": false,
				"isNameField": true,
				"referenceTo": "User",
				"isEditable": false,
				"isFilterable": true,
				"isSortable": true,
				"helpText": 'CreatedBy.Name (string)',
			}
		];
		if(isChildObjectHistory){
			defFields.splice(0,0,{
				"label": apiName.split('::')[2].split('.')[0] +  " ID",
				"fieldName": fieldName,
				"type": "reference",
				"referenceTo": apiName.split('::')[2].split('.')[0],
				"isFilterable": true,
				"isSortable": true,
				"helpText": fieldName + ' (reference)',
				"relationshipName": apiName.split('::')[2].split('.')[0],
			});
		}
		return defFields;
	},
	formatAddress: function(addressObject,locale){
		let address;
		if(addressObject === undefined || addressObject === '') return '';
		if(locale === "en-US" || locale === "en-IN"){
			address = addressObject?.street + " " + addressObject?.city + ", " + addressObject?.state + ", " + addressObject?.country;
		}else{
			address = addressObject?.street + " " + addressObject?.city + " " + addressObject?.state + " " + addressObject?.country;
		}
		return address;
	},
	getCurrentStaticResourceURLWithSameName: function(staticURLLists, currentURL){
		let updatedURL = currentURL;
		staticURLLists.forEach((url) => { 
			if(url.value.split('/')[3] !== undefined && url.value.split('/')[3] === currentURL.split('/')[3]) {
				updatedURL = url.value;
			}
		});
		return updatedURL;
	},
	splitRecordsIntoChunks: async function (scope,records,chunkSize, callback, outParams) {
		let index = 0;
		let chunkCount = 0;
		let isFirstChunk = false;
		let isLastChunk = false;
		while(records.length > 0 && index < records.length){
			if(libs.getGlobalVar(outParams.operation) !== undefined && !libs.getGlobalVar(outParams.operation).isQuickActionDialogOpen) break;
			let lIndex = records[(parseInt(index)+parseInt(chunkSize))] ? (parseInt(index)+parseInt(chunkSize)) : (records.length);
			let chunk = records.slice(index,lIndex);
			index += records[(parseInt(index)+parseInt(chunkSize))] ? parseInt(chunkSize) : (records.length);
			if(chunkCount === 0) isFirstChunk = true;
			chunkCount +=1;
			if(index >= records.length) isLastChunk = true;
			await callback(scope,chunk,isFirstChunk,isLastChunk);
			isFirstChunk = false;
		}
		// function(scope,libs,allResults) {
		//let allResults = globalVars.orchestratorResult;
		if(libs.getGlobalVar(outParams.operation) !== undefined && libs.getGlobalVar(outParams.operation).isQuickActionDialogOpen && outParams?.finishCallback){
			eval( '(' + outParams.finishCallback + ')' )(scope,libs,libs.orchestratorResult());
		}
		return chunkCount;
	},
	stripChunk(chunkIn) {
		let chunk = [];
		chunkIn.forEach((item) =>{
			chunk.push(JSON.parse(JSON.stringify(item, (key, value) => {return typeof(value) === 'object' && key!=="" ? null : value;})))
		});
		return chunk;
	},
	formatCallbackErrorMessages: function(error,errorIn,errorJSONName) {
		/*
			error = error is the error string that is caught by the catch block
			errorIn = table or column level error
		*/ 
		console.error(error);
		let message = '<b style="color:red;">#ERROR</b>';
		if(errorIn === 'table') {
			return '<b style="color:red;">#ERROR:</b> in "' + errorJSONName + '". Check console for more details';
		}else if(errorIn === 'field') {
			return '<b style="color:red;">#ERROR:</b> in "' + errorJSONName + '". Check console for more details';
		}
		return message;
	},
	orchestratorResult : function(data) {
		if (data === null) libs.setGlobalVar('orchestratorResult',{totalRecords : 0, errorRecords : 0, results:[]});
		else if (data!= undefined) {
			if (libs.getGlobalVar('orchestratorResult') == undefined) libs.setGlobalVar('orchestratorResult',{totalRecords : 0, errorRecords : 0, results:[]});
			libs.getGlobalVar('orchestratorResult').results.push(data);
			libs.getGlobalVar('orchestratorResult').totalRecords += data.recordsCount;
			libs.getGlobalVar('orchestratorResult').errorRecords += data.invalidCount;
		}
		return libs.getGlobalVar('orchestratorResult');
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