import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from "lightning/navigation"
import { encodeDefaultFieldValues, decodeDefaultFieldValues } from 'lightning/pageReferenceUtils'
import { FlowNavigationFinishEvent } from 'lightning/flowSupport'

import resource from '@salesforce/resourceUrl/extRelList';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';


export default class extRelList extends NavigationMixin(LightningElement) {

	@api apiName;
	@api name; // already part of managed package and can't be removed
	@api recordId;
	@api defaultListView;	
	@api configuration;
	@api addTemplate;
	@api isFullscreen;
	@api flexipageRegionWidth;

	@track config = {};
	@track localConfig = {};
	@track listViews = [];
	LABELS = {};
	allRecords = [];

	@track showDialog = false;
	@track dialogCfg;

	constructor() {
		super();

		Promise.all([
			loadStyle(this, resource + '/css/extRelList.css'),
			loadScript(this, resource + '/js/xlsx.full.min.js'),
			//loadScript(this, leaflet + '/leaflet.js')
		]).then(() => {
			console.log('Resources are loaded');
		});

		window.addEventListener('beforeunload', (event) => {
			if (this.config.listViewConfig !== undefined && this.config.listViewConfig[0]._changedRecords) {
				event.preventDefault();
				event.returnValue = '';
			}
		});
		//postMessage listener to communicate between different Layout components
		//need to listen improve the security concerns to block messages from unauthorized access
		if(!window.location.href.includes('flexipageEditor')){
			window.addEventListener(
				"message",this.listenEvent.bind(this),
				false,
			);
		}
	}
	@api 
	updateGridView(newApiName){
		this.apiName = newApiName;
		this.loadCfg(true);
	}

	connectedCallback() {
		this.name = libs.getGlobalVarsCount().toString();
		console.log('RENDERED');
		this._flowSupport =  FlowNavigationFinishEvent;
		this.loadCfg(true);
	}
	listenEvent(event){
		// console.log("Message received0 XRL", [...event.data.keys()],this.name);
		let isMatchingUniqueName = libs.findMatchingKey(event.data,[{uniqueName:this.name}]);
		if(isMatchingUniqueName !== undefined && isMatchingUniqueName.length > 0) {
			console.log("Message received", event.data);
			this.loadCfg(true);
			// if(event.data.get(this.configId)){
			// 	console.log('Acknowledgement',event.data.get(this.configId)['status']);
			// 	return;
			// }
			// this.handlePostMessageEvents(event.data,isMatchingUniqueName);
		}
	}

	setCustomLabels(cmd, data) {
		console.log('CustomLabes are loaded', data[cmd]);
		this.config._LABELS = data[cmd];
	}

	get gridHeader() {
		return this.config.listViewConfig && this.config.listViewConfig[0].overrideGridHeader !== undefined && this.config.listViewConfig[0].overrideGridHeader !== "" ?
		this.config.listViewConfig[0].overrideGridHeader : this.config.sObjLabel;
	}

	loadCfg(isInit) {
		libs.remoteAction(this, 'getCustomLabels', {callback: this.setCustomLabels.bind(this) });
		let apiNames = this.apiName.split('::');
		console.log(apiNames);
		if(apiNames[1] === undefined) return;
		this.localConfig = {};

		let cfg = libs.loadConfig(this.name);
		if (cfg !== undefined) {
			this.localConfig = cfg;
			libs.setGlobalVar(this.name, {
				"sObjLabel": apiNames[0],
				"sObjApiName": apiNames[1],
				"relField": apiNames[2],
				//"fields": ['Id', 'LastModifiedDate'],
				"iconName": "/img/icon/t4v35/standard/custom_120.png"
			});
		} else {
			libs.setGlobalVar(this.name, {
				"sObjLabel": apiNames[0],
				"sObjApiName": apiNames[1],
				"relField": apiNames[2],
				"fields": ['Id', 'LastModifiedDate'],
				"iconName": "/img/icon/t4v35/standard/custom_120.png"
			});
		}
		this.config = libs.getGlobalVar(this.name);
		console.log(this.name);
		console.log(JSON.parse(JSON.stringify(this.config)));

		// let listViewName = isInit && this.defaultListView !== undefined ? this.defaultListView : (!isInit && this.name !== undefined ? this.name : undefined);
		let listViewName = apiNames.length>3 && apiNames[3] ? apiNames[3] : (libs.loadUserPreferredView(this.name) != undefined ? libs.loadUserPreferredView(this.name) : '');
		if (apiNames.length>3) this.config.isDisabledListView = true;
		console.log(this.defaultListView);
		console.log('listViewName ',listViewName);
		if (this.configuration) {
			this.setConfig('getConfigResult', this.configuration);
		} else {
			libs.remoteAction(this, 'getConfig', { sObjApiName: this.config.sObjApiName, relField: this.config.relField, listViewName: listViewName, callback: this.setConfig.bind(this) });
		}
	}

	setConfig(cmd, data) {
		console.log(cmd, JSON.parse(JSON.stringify(data)), JSON.parse(JSON.stringify(data[cmd])));
		libs.getGlobalVar(this.name).userInfo = data.userInfo;
		libs.getGlobalVar(this.name).financial = data[cmd].Financial;
		libs.getGlobalVar(this.name).recordId = this.recordId;
		libs.getGlobalVar(this.name).componentWidth = this.flexipageRegionWidth;
		this.config.describe = data[cmd].describe ? JSON.parse(data[cmd].describe) : {};
		this.config.describeObject = data[cmd].describeSObject ? JSON.parse(data[cmd].describeSObject) : {};
		libs.getGlobalVar(this.name).iconName = data[cmd].iconMap.iconURL === undefined ? "/img/icon/t4v35/standard/custom_120.png" : data[cmd].iconMap.iconURL;
		libs.getGlobalVar(this.name).iconStyle = libs.getGlobalVar(this.name).iconName?.includes('custom_120.png') ? 'width:32px;height:32px;margin: 5px;background-color:#d8c760;' : 'width:32px;height:32px;margin: 5px;';
		this.config.isIconUrl = data[cmd].iconMap.iconURL?.includes('https') || libs.getGlobalVar(this.name).iconName?.includes('custom_120.png');
		let options =  [{label : "None", value : ""}];
		if (data[cmd].staticResourceList) {
			data[cmd].staticResourceList.forEach(e=>{
				options.push({label : e.split('/')[3], value: e})	
			});
		}	
		this.config._staticResourceList = options;
		this.config.actionsBar = {};

		let adminConfig = (data[cmd].baseConfig) ? JSON.parse(data[cmd].baseConfig) : [];
		let userConfig = (data[cmd].userConfig) ? JSON.parse(JSON.stringify(data[cmd].userConfig)) : [];
		this.isHistoryGrid();

		console.log('adminConfig', adminConfig);
		// console.log('userConfig', userConfig);

		let adminDataTableConfig = adminConfig;
		if(userConfig.length !== 0){
			userConfig = JSON.parse(userConfig);
			userConfig.forEach((el)=>{
				if(el.cmpName === 'dataTable') {
					this.config.dataTableConfig = el;
				}
			});
		}
		

		if (this.config.dataTableConfig === undefined){
			this.config.dataTableConfig = {};
			this.config.dataTableConfig.cmpName = 'dataTable';
			this.config.dataTableConfig.colModel = libs.setDefaultColumns();
			if(this.config.sObjApiName.toLowerCase().includes('history')){
				this.config.dataTableConfig.colModel = libs.historyGrid(this.apiName);
				let changedField = this.config.dataTableConfig.colModel.find(field => field.fieldName === 'Field');
				changedField.options = [];
				this.config.describe[changedField.fieldName].picklistValues.forEach((e)=>{
					changedField.options.push({label: e.label, value: e.value});
				});
				this.config.dataTableConfig.orderBy = " ORDER BY CreatedDate DESC NULLS FIRST";
				this.config.dataTableConfig.orderMap=  [
				  {
					"field": {
							"label": "Created Date",
							"fieldName": "CreatedDate",
							"css": "slds-item slds-theme_alt-inverse",
							"type": "datetime",
							"updateable": false,
							"isNameField": false,
							"isEditable": false,
							"isFilterable": true,
							"isSortable": true,
							"index": 4
					},
					"emptyField": "NULLS FIRST",
					"sortOrder": "DESC"
				  }
				];
			}
		} 
		if(this.config.dataTableConfig.colModel === undefined){
			this.config.dataTableConfig.colModel = libs.setDefaultColumns();
		}
		console.log('dataTable Config: ', this.config.dataTableConfig.colModel);

		let mergedConfig = {};
		Object.assign(mergedConfig, this.config.dataTableConfig);
		mergedConfig.colModel = [];

		let baseColMap = new Map();
		adminDataTableConfig[0]?.colModel?.forEach(col => {
			baseColMap.set(col.fieldName, col);
		});
		this.config.dataTableConfig?.colModel?.forEach(col => {
			if (baseColMap.has(col.fieldName)) {
				let mergedCol = Object.assign(baseColMap.get(col.fieldName), col);
				mergedConfig.colModel.push(mergedCol);
				baseColMap.delete(col.fieldName)
			} else {
				mergedConfig.colModel.push(col);
			}
		});
		mergedConfig.colModel.push(...Array.from(baseColMap.values()));
		this.config.dataTableConfig.colModel = mergedConfig.colModel;
		// Object.assign(mergedConfig, userConfig);
		userConfig[0] = this.config.dataTableConfig;
		console.log('mergedConfig', userConfig);

		this.config.listViewConfig = userConfig;
		let listViewName = libs.loadUserPreferredView(this.name) != undefined ? libs.loadUserPreferredView(this.name) : '';
		if(listViewName !== ''){
			this.config.listView = data[cmd].listViews.find(v => { return v.name === listViewName;});
		}
		if(listViewName === '' || this.config.listView === undefined){
			this.config.listView = data[cmd].listViews.findLast(v => { return v.isUserConfig;});
		}
		console.log(JSON.stringify(this.config.listView));
		this.config.currency =  data[cmd].currency;
		//if (this.config.userInfo.isAdminAccess === true) delete this.localConfig.listViewName;
		// if (this.config.userInfo.isAdminAccess) {
		// 	this.listViews = data[cmd].listViews.map(v => {return {label: v.label ? v.label + ' - ' + v.createdBy : v.name, value: v.name};});
		// } else {
		// 	this.listViews = data[cmd].listViews.filter(v => { return !v.isAdminConfig;}).map(v => {return {label: v.label ? v.label + ' - ' + v.createdBy : v.name, value: v.name};});
		// }
		console.log('ListViews ', data[cmd].listViews);
		if(data[cmd].listViews.length !== 0){
			this.listViews = data[cmd].listViews.map(v => {return {label: v.label ? v.label + ' - ' + v.createdBy : v.name, value: v.name};});		
		}else{
			this.config.listView = {
				'hasEditAccess':true
			}
		}
		this.config.listView.title = this.config.listView.label + ' - ' + this.config.listView.createdBy;
		this.config.fields = [];
		this.config.lockedFields = [];
		
		this.config.isGlobalSearch=this.config.listViewConfig[0].isGlobalSearch;
		this.loadExternalScript();
			
		let notAllowedActions = ['std:delete','std:new'];
		if(!this.config.listViewConfig[0].actions){
			this.config.listViewConfig[0].actions = libs.standardActions();
			//disabling delete and new standard action incase of history grid or non power user
			if(this.config.sObjApiName.toLowerCase().includes('history') ||!this.config.userInfo.isAdminAccess){
				this.config.listViewConfig[0].actions = this.config.listViewConfig[0].actions.filter( (el) =>{
					if(notAllowedActions.includes(el.actionId)) return false;
					return true;
				} );
			}
		}
		//disabling delete and new standard action, checkboxes incase of user with only read access
		if(!this.config.listView.hasEditAccess){
			this.config.listViewConfig[0].actions = this.config.listViewConfig[0].actions.filter( (el) =>{
				if(notAllowedActions.includes(el.actionId)) return false;
				return true;
			} );
			this.config.listViewConfig[0].isShowCheckBoxes = false;
		}
		this.config.listViewConfig[0].rowChecked = false;
		//HYPER-382
		const expandAction = this.config.listViewConfig[0].actions.find((el) => el.actionId === 'std:expand_view');
		this.config._expandIcon = expandAction.actionIconName;
		this.config._expandTip = expandAction.actionTip;
		if(this.isFullscreen){
			// expandAction.actionTip = this.config._LABELS.lbl_collapseView;
			expandAction.actionTip = this.config._LABELS.title_expandView.split('/')[1];
			expandAction.actionIconName = this.config._expandIcon.split('/')[1];
		}else{
			expandAction.actionTip = this.config._LABELS.title_expandView.split('/')[0];
			expandAction.actionIconName = this.config._expandIcon.split('/')[0];
		}
		this.config.actionsBar = {
			'actions':this.config.listViewConfig[0].actions,
			'_handleEvent':this.handleEvent.bind(this),
			'_handleEventFlow': this.handleEventFlow.bind(this),
			'_cfgName': this.name
		};
		if(this.config.listViewConfig[0].advanced !== undefined && this.config.listViewConfig[0].advanced !== ''){
			this.config._advanced = eval('['+ this.config.listViewConfig[0].advanced + ']')[0];
		}
		console.log('this.config', this.config);
		this.loadRecords();		
	}
	
	async loadRecords() {
		await this.prepareFieldsToFetch();

		if(this.config.isHistoryGrid){
			this.config.describeMap = new Map();
			let parentSObjName = libs.getParentHistorySObjName(this.name);
			await libs.remoteAction(this, 'objectFieldList', { sObjApiName: parentSObjName, 
				callback: function(func,result){
					let objectFields = JSON.parse(result[func].describe);
					libs.getGlobalVar(this.name).describeMap[parentSObjName] = objectFields;   
				} });
		}
		if(this.config.listViewConfig[0].loadChunkSize !== undefined && this.config.listViewConfig[0].loadChunkSize !== ''){
			try{
				await this.loadBulkData();
			}catch(e){
				console.error('Error in bulk loading', e);
			}
		}else{
			await libs.remoteAction(this, 'query', {
				isNeedDescribe: true,
				sObjApiName: this.config.sObjApiName,
				relField: this.config.relField,
				addCondition: libs.replaceLiteralsInStr(this.config.listViewConfig[0].addCondition,this.name),
				orderBy: this.config.listViewConfig[0].orderBy,
				fields: this.config.fields,
				listViewName: this.config?.listView?.name,
				callback: ((nodeName, data) => {
					console.log('length', data[nodeName].records);
					this.config.inaccessibleFields= data[nodeName].removedFields;
					this.config.query = data[nodeName].SOQL;
					
					libs.getGlobalVar(this.name).records = data[nodeName].records.length > 0 ? data[nodeName].records : undefined;
					if(this.config?._advanced?.afterloadTransformation !== undefined && this.config?._advanced?.afterloadTransformation !== ""){
						try {
							this.config.records = eval('(' + this.config?._advanced?.afterloadTransformation + ')')(this,libs, libs.getGlobalVar(this.name).records);
						} catch(err){
							console.log('EXCEPTION', err);
						}
					} else {
						this.config.records = libs.getGlobalVar(this.name).records;
					}
					this.allRecords = this.config.records;
					this.config.listViewConfig[0]._loadCfg = this.loadCfg.bind(this);
					
					console.log('loadRecords', libs.getGlobalVar(this.name));
					this.generateColModel();
				})
			});
		}

	}
	afterLoadTransformation(records){
		if(this.config?._advanced?.afterloadTransformation !== undefined && this.config?._advanced?.afterloadTransformation !== ""){
			try {
				records = eval('(' + this.config?._advanced?.afterloadTransformation + ')')(this,libs, records);
			} catch(err){
				console.log('EXCEPTION', err);
			}
		} 
		return records;
	}
	async loadBulkData(){
		let soqlRel = '';
		if(this.config.relField !== undefined && this.config.relField !== ''){
			soqlRel = " WHERE " + this.config.relField + "='" + this.recordId + "' " + libs.replaceLiteralsInStr(this.config.listViewConfig[0].addCondition,this.name);
		}
		await libs.remoteAction(this, 'customSoql', {
			isNeedDescribe: true,
			sObjApiName: this.config.sObjApiName,
			SOQL: 'SELECT Count(Id) totalRecordsCount FROM ' + this.config.sObjApiName + soqlRel,
			isAggregateResult: true,
			callback: ((nodeName, data) => {
				console.log('Returned records', data[nodeName].records);
				this.config.totalRecordsCount = data[nodeName].records[0].totalRecordsCount;
			})
		});
		console.log('Total records', this.config.totalRecordsCount);
		this.config.listOfRecordIds = [];
		this.config.fetchIdLimit = 49950;
		for (let i = 1; i < ((parseInt(this.config.totalRecordsCount) / parseInt(this.config.fetchIdLimit)) + 1);i++) {
			if(i === 1) await this.getBulkRecordsId(libs.replaceLiteralsInStr(this.config.listViewConfig[0].addCondition,this.name),this.config.fetchIdLimit);
			else{
				await this.getBulkRecordsId(" AND Id > '" + this.config.listOfRecordIds[parseInt(this.config.listOfRecordIds.length)-1].Id+"' " + libs.replaceLiteralsInStr(this.config.listViewConfig[0].addCondition,this.name),this.config.fetchIdLimit);
			}
			console.log('Verifying loop', i);
		}
		console.log('All records Id fetched successfully', this.config.listOfRecordIds.length);
		this.config.loadChunkSize = this.config.listViewConfig[0].loadChunkSize === undefined ? 20000 : this.config.listViewConfig[0].loadChunkSize;
		this.config.listOfBulkRecords = [];
		let startIndex = 0;
		let endIndex = parseInt(this.config.loadChunkSize) - 1;
		for (let i = 1; i < ((parseInt(this.config.totalRecordsCount) / parseInt(this.config.loadChunkSize)) + 1);i++) {
			let recordsIds = [];
			let chunkRecords = this.config.listOfRecordIds.slice(startIndex, endIndex);
			chunkRecords.forEach(e => {
				recordsIds.push(e.Id);
			});
			startIndex = startIndex + parseInt(recordsIds.length);
			endIndex = endIndex + parseInt(recordsIds.length);
			let con = libs.replaceLiteralsInStr(this.config.listViewConfig[0].addCondition,this.name);
			let condition = " AND Id IN ('" + recordsIds.join("','") + "') " + (con !== undefined ? con : '');
			// console.log('condition',condition, i);
			await this.getBulkRecords(this.config.fields,this.config.sObjApiName,condition,this.config.listViewConfig[0].orderBy,this.config.loadChunkSize);
		}
		console.log('All records fetched successfully', JSON.parse(JSON.stringify(this.config.listOfBulkRecords)));
		libs.getGlobalVar(this.name).records = JSON.parse(JSON.stringify(this.config.listOfBulkRecords)).length > 0 ? JSON.parse(JSON.stringify(this.config.listOfBulkRecords)) : undefined;
		this.config.records = JSON.parse(JSON.stringify(this.afterLoadTransformation(libs.getGlobalVar(this.name).records)));
		this.allRecords = this.config.records;
		this.config.listViewConfig[0]._loadCfg = this.loadCfg.bind(this);
		
		console.log('loadRecords', libs.getGlobalVar(this.name));
		this.generateColModel();
	}
	async getBulkRecordsId(whereCondition,limit){
		await libs.remoteAction(this, 'query', {
			isNeedDescribe: true,
			sObjApiName: this.config.sObjApiName,
			relField: this.config.relField,
			addCondition: whereCondition,
			orderBy: ' ORDER BY Id ASC',
			fields: ['Id'],
			listViewName: this.config?.listView?.name,
			callback: ((nodeName, data) => {
				console.log('record Ids chunk size', data[nodeName].records);
				this.config.listOfRecordIds = this.config.listOfRecordIds.concat(data[nodeName].records);
			})
		});
	}
	async getBulkRecords(fields,sObjApiName,whereCondition,orderBy,limit){
		await libs.remoteAction(this, 'query', {
			isNeedDescribe: true,
			sObjApiName: this.config.sObjApiName,
			relField: this.config.relField,
			addCondition: whereCondition,
			orderBy: this.config.listViewConfig[0].orderBy === undefined ? '' : this.config.listViewConfig[0].orderBy,
			fields: this.config.fields,
			limit: 'LIMIT ' + limit,
			listViewName: this.config?.listView?.name,
			callback: ((nodeName, data) => {
				console.log('records chunk size', data[nodeName].records);
				this.config.inaccessibleFields= data[nodeName].removedFields;
				this.config.query = data[nodeName].SOQL;
				this.config.listOfBulkRecords = this.config.listOfBulkRecords.concat(data[nodeName].records);
			})
		});
	}
	async loadExternalScript(){
		//need to fetch this static resource list here because, every time the external JS file is uploaded the url(url gets updated with latest timestamp) changes but the name remains the same, 
		// so to make sure it loads correctly needs to get the list beforehand
		// await libs.remoteAction(this, 'getStaticResource', {
		// 	callback: ((nodeName, data11) => {
		// 		let options =  [{label : "None", value : ""}];
		// 		if (data11[nodeName]) {
		// 			data11[nodeName].forEach(e=>{
		// 				options.push({label : e.split('/')[3], value: e})	
		// 			});
		// 		}
		// 		this.config._staticResourceList = options;
		// 	})
		// });
		if(this.config.listViewConfig[0].externalJS !== undefined && this.config.listViewConfig[0].externalJS !== ''){
			try{
				this.config.listViewConfig[0].externalJS = libs.getCurrentStaticResourceURLWithSameName(this.config._staticResourceList,this.config.listViewConfig[0].externalJS);
				const response = await fetch(this.config.listViewConfig[0].externalJS+'?'+Date.now());
				const code = await response.text();
				libs.getGlobalVar(this.name)._externalJS = eval('['+ code + ']')[0];
			}catch(e){
				console.error('Error in loading external JS', e);
			}
		}
	}

	generateColModel() {
		this.config.listViewConfig[0].colModel.forEach(e => {
			if(e.fieldName.split('.')[1]){
				if(this.config.inaccessibleFields[e.fieldName.split('.')[0]] && this.config.inaccessibleFields[e.fieldName.split('.')[0]].includes(e.fieldName.split('.')[1])){
					e._skipFieldFromDisplay = true;
				}else{
					e._skipFieldFromDisplay = false;
				}
			}else{
				if(this.config.inaccessibleFields && this.config.inaccessibleFields[this.config.sObjApiName] && this.config.inaccessibleFields[this.config.sObjApiName].includes(e.fieldName)){
					e._skipFieldFromDisplay = true;
				}else{
					e._skipFieldFromDisplay = false;
				}
			}
			let describe = this.config.describe[e.fieldName];
			if(describe !== undefined || describe !== null){
				if (e.label === undefined) e.label = describe.label;
				if (e.type === undefined) e.type = describe.type;
				if (e.updateable === undefined) e.updateable = describe.updateable;
				if (e.isNameField === undefined) e.isNameField = describe && describe.nameField === true;
				if(e.type === 'picklist' || e.type === 'multipicklist'){
                    e.options = [];
                    if(describe.nillable){
                        e.options.push(
                            { label: '--None--', value: 'NONE' }
                        )
                    }
                    describe.picklistValues.forEach(field => {
                        e.options.push(
                            { label: field.label != null ? field.label : field.value, value: field.value }
                        )
                    });
                }
				// if (e.isEditable && describe.updateable) {
				// 	if (e.type === 'picklist' || e.type === 'reference') {
				// 		e.isEditableAsPicklist = true;
				// 		console.log('picklist', e);
				// 	} else if (e.type === 'boolean') {
				// 		e.isEditableBool = true;
				// 	} else if (e.type === 'textarea') {
				// 		e.isEditableTextArea = true;
				// 	} else {
				// 		e.isEditableRegular = true;
				// 	}
				// } else {
				// 	e.isEditable = false;
				// }
			}
		});
		console.log('ColModel', JSON.parse(JSON.stringify(this.config.listViewConfig[0].colModel)));
	}

	async prepareFieldsToFetch(){
		let refFieldsObject = [];
		this.config.objectNameFieldsMap = new Map();

		this.config.listViewConfig[0]?.colModel?.forEach(e => {
			if (e.type === 'reference') {
				refFieldsObject.push(e.referenceTo);
			}
		});

		if(refFieldsObject.length > 0) {
			const resultString = refFieldsObject.join("','");

			const finalString = "'" + resultString + "'";
			await libs.remoteAction(this, 'customSoql', {
				SOQL: "SELECT EntityDefinition.QualifiedApiName,QualifiedApiName FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName IN (" + finalString + ") AND IsNameField = TRUE",
				callback: ((nodeName, data1) => {
					data1[nodeName].records.forEach(obj => {
						this.config.objectNameFieldsMap.set(obj.EntityDefinitionId, obj.QualifiedApiName);
					});
				})
			});
			console.log('this.config.objectNameFieldsMap: ', this.config.objectNameFieldsMap);
		}
		
		this.config.listViewConfig[0]?.colModel?.forEach(e => {
			let describe = this.config.describe[e.fieldName];
			if (e.type === 'reference') {
				let nameField = this.config.objectNameFieldsMap.get(e.referenceTo) ? '.'+this.config.objectNameFieldsMap.get(e.referenceTo) : '.Name';
				this.config.fields.push(describe.relationshipName ? describe.relationshipName + nameField : e.fieldName);
				if (e.locked) this.config.lockedFields.push(describe.relationshipName ? describe.relationshipName + '.Name' : e.fieldName);
			}
			if(e.type==="picklist"){
				this.config.fields.push('toLabel(' +e.fieldName + ')');
			}else{
				this.config.fields.push(e.fieldName);
			}
			if (e.locked) this.config.lockedFields.push(e.fieldName);
		});
	}

	isHistoryGrid(){
		if(this.config.sObjApiName.toLowerCase().includes('history')){
			this.config.isHistoryGrid = true;
		}else{
			this.config.isHistoryGrid = false;
		}
	}

	get changedRecords() {
		return 'Count of changed records ' + this.config.listViewConfig[0]._changedRecords.size;
	}

	get hasDynamicActions() {
		return this.config?.listViewConfig?.dynamicActions !== undefined;
	}

	resetChangedRecords(validatedRecordSize) {
		if(this.template.querySelector('c-Data-Table') && (validatedRecordSize - this.config.countOfFailedRecords) > 0){
			this.template.querySelector('c-Data-Table').setUpdateInfo('• ' + (validatedRecordSize - this.config.countOfFailedRecords) + ' ' +this.config._LABELS.msg_itemsUpdated);
			const toast = new ShowToastEvent({
				title: 'Success',
				message: (validatedRecordSize - this.config.countOfFailedRecords) + ' of ' + validatedRecordSize + ' ' + this.config._LABELS.msg_itemsUpdated,
				variant: 'success'
			});
			this.dispatchEvent(toast);
			setTimeout((() => { this.template.querySelector('c-Data-Table')?.setUpdateInfo(''); }), 3000);
		}
		if(this.config.countOfFailedRecords > 0){
			const toast = new ShowToastEvent({
				title: 'Error',
				message: libs.formatStr('{0} ' + this.config._LABELS.msg_itemsUpdateFailed,[this.config.countOfFailedRecords]) + this.config.errorList.toString(),
				variant: 'error'
			});
			this.dispatchEvent(toast);
			const errorIds = [];
			this.config.errorList.forEach((el) => {
				errorIds.push(el.split(':')[0]); //getting the IDs of the records that caused the error
			});
			for (let key of this.config.listViewConfig[0]._changedRecords.keys()) {
				if (!errorIds.includes(key)) {
					this.config.listViewConfig[0]._changedRecords.delete(key);
				}
			}
			console.error(JSON.parse(JSON.stringify(this.config.errorList)));
		}else{
			this.config.listViewConfig[0]._changedRecords = undefined;
			this.config.records.forEach((record) => {
				delete record._cellCss;
			});
			libs.getGlobalVar(this.name).records = this.config.records;
		}
		this.template.querySelector('c-Data-Table').updateView();
	}

	handleEvent(event) {
		let val = event.target.getAttribute('data-id');
		console.log(val);
		// if (val.startsWith('help:')) libs.help(val, {});
		if (val === 'globalSearch') this.handleGlobalSearch(event);
		if (val.startsWith('cfg:')) this.handleEventCfg(event);
		if (val.startsWith('dialog:')) this.handleEventDialog(event);
		if (val.startsWith('std:refresh')) {
			if(!this.isThereUnsavedRecords()){
				let action = this.config.listViewConfig[0].actions.find((el)=>{
					return el.actionId == 'std:refresh';
				});
				const tempParam = {}; // parameter for the refresh action callback
				tempParam.action = action;
				tempParam.selectedRecords = this.template.querySelector('c-Data-Table')?.getSelectedRecords(); // getting the records here as the c/dataTable component is not yet loaded when called from the handler 
				this.loadCfg(false);
				this.handleStandardCallback('std:refresh', tempParam);
			}else{
				const eventErr = new ShowToastEvent({
					title: 'Error',
					message: this.config._LABELS.msg_unsaveRecordsCannotPerformOtherAction,
					variant: 'error'
				});
				this.dispatchEvent(eventErr);
			}
		}

		if (val.startsWith('std:')) this.handleEventActions(event, val);

		if (val.startsWith(':save')) {
			this.prepareRecordsForSave();
		}
		if (val.startsWith(':cancelRecordSave')) {
			this.config.listViewConfig[0]._changedRecords = undefined;
			this.config.records = undefined;
			this.loadRecords();
		}

		if (val.startsWith(':change_view')) {
			if(!this.isThereUnsavedRecords()){
				libs.userListViewPreference(this.name,event.target.value);
				// this.name = event.target.value;
				this.loadCfg(false);
			}else{
				event.target.value = this.config.listView.name;
				const eventErr = new ShowToastEvent({
					title: 'Error',
					message: this.config._LABELS.msg_unsaveRecordsCannotPerformOtherAction,
					variant: 'error'
				});
				this.dispatchEvent(eventErr);
			}
		}
		if (val.startsWith('std:request_open')) {
			if(!this.isThereUnsavedRecords()){
				this.dialogCfg = {
					title: this.config._LABELS.title_reqAFeature,
					contents: [
						{
							isIframe: true,
							name: 'featureText',
							url: libs.replaceLiteralsInStr(this.config._LABELS.url_reqFeature,this.name),
							style: "border:0; width:100%; height:470px; float:left;"
						}
					],
					buttons: [
						{
							name: 'cancel',
							label: 'Close',
							variant: 'neutral'
						}
					],
					data_id: "reqFeature:dialog"
				};
				this.showDialog = true;
			}else{
				const eventErr = new ShowToastEvent({
					title: 'Error',
					message: this.config._LABELS.msg_unsaveRecordsCannotPerformOtherAction,
					variant: 'error'
				});
				this.dispatchEvent(eventErr);
			}
		}
		if (val.startsWith('reqFeature:dialog')) {
			if (event.detail.action === 'cancel') this.showDialog = false;
			else {
				event.target.setLoading(true);
				libs.remoteAction(this, 'requestFeature', {
					text: event.detail.data.featureText, callback: ((cmd, result) => {
						if (result.requestFeatureResult.isSuccess) {
							const toast = new ShowToastEvent({
								title: 'Success',
								message: this.config._LABELS.msg_requestWasSent,
								variant: 'success'
							});
							this.dispatchEvent(toast);
							this.showDialog = false;
						} else {
							const toast = new ShowToastEvent({
								title: 'Error',
								message: result.requestFeatureResult.error,
								variant: 'error'
							});
							this.dispatchEvent(toast);
						}
					})
				});
			}
			this.handleStandardCallback('std:request_open');
		}
		if (val.startsWith('delete:dialog')) {
			if (event.detail.action === 'cancel') this.showDialog = false;
			else {
				this.showDialog = false;
				this.prepareRecordsToDelete();
				this.handleStandardCallback('std:delete');
			}
		}
		//config delete
		if (val.startsWith('deleteConfig:dialog')) {
			if (event.detail.action === 'cancel') this.showDialog = false;
			else{
				console.log('Deleting Config ',this.config.listView.id + ' ' + this.config.listView.label);
				libs.remoteAction(this, 'deleteConfig', { 
					configId: this.config.listView.id,  
					callback: function(cmd,data){
						// console.log('Status: ',data[cmd].status);
						if(data[cmd].status.includes('Success')){
							const evnt = new ShowToastEvent({
								title: 'Success',
								message: this.config.listView.label + ' ' +this.config._LABELS.msg_successfullyDeleted,
								variant: 'Success'
							});
							this.dispatchEvent(evnt);
							this.loadCfg(true);
						}else{
							const evnt = new ShowToastEvent({
								title: 'Error',
								message: data[cmd].status,
								variant: 'error'
							});
							this.dispatchEvent(evnt);
						}
					} 
				});
				this.showDialog = false;
			}
		}
	}
	async prepareRecordsToDelete(){
		let records = this.template.querySelector('c-Data-Table').getSelectedRecords();
		console.log(records);

		let allRecordsValidation = true;

		//user validation callback
		if(this.config?._advanced?.beforeDeleteValidation !== undefined && 
			this.config?._advanced?.beforeDeleteValidation !== ""){
			records.forEach((el)=>{
				try{
					let rec = eval('('+this.config._advanced.beforeDeleteValidation+')')(this,libs,el);
					if(!rec){
						console.error('Failed Validation for ',JSON.parse(JSON.stringify(el)));
						allRecordsValidation = false;
					}
				}catch(e){
					allRecordsValidation = false;
					libs.showToast(this,{
						title: 'Error',
						message: e.toString(),
						variant: 'error'
					});
					console.log('Error', e);
				}
			});
		}

		if(!allRecordsValidation){
			libs.showToast(this,{
				title: 'Error',
				message: this.config._LABELS.msg_failedValidationCallback,
				variant: 'error'
			});
			console.error('Validation Not passed');
			return;
		}

		//chunking the data and sending it to apex
		this.config.deleteIndex = 0;
		this.config.recordsLen = records.length;
		let deleteChunk = this.config.listViewConfig[0].deleteChunkSize ? this.config.listViewConfig[0].deleteChunkSize : 200; //200 is the default value for saveChunk
		let index = 0;

		this.config.isExceptionInRemoteAction = false;

		while(index < records.length){
			let chunk = records.slice(index,records[(parseInt(index)+parseInt(deleteChunk))] ? (parseInt(index)+parseInt(deleteChunk)) : (records.length));
			index += records[(parseInt(index)+parseInt(deleteChunk))] ? parseInt(deleteChunk) : (records.length);
			await this.deleteRecords(chunk);
		}
		if(this.config.isExceptionInRemoteAction === false){
			const toast = new ShowToastEvent({
				title: 'Success',
				message: this.config._LABELS.msg_successfullyDeleted,
				variant: 'success'
			});
			this.dispatchEvent(toast);
		}
		this.showDialog = false;
		if(records.length < 1000){
			this.config.records = libs.flattenRecordsWithChildren(this.config.records);
			this.config.records = this.config.records.filter(ar => !records.find(rm => (rm.Id === ar.Id) ));
			this.config.records = this.afterLoadTransformation(this.config.records);
			// //HYPER-243
			this.allRecords = libs.flattenRecordsWithChildren(this.allRecords);
			this.allRecords = this.allRecords.filter(ar => !records.find(rm => (rm.Id === ar.Id) ));
			this.allRecords = this.afterLoadTransformation(this.allRecords);
			this.template.querySelector('c-Data-Table').updateView();
			this.config.listViewConfig[0].rowChecked = false;
		}else{
			this.loadCfg(false);
		}
	}

	async deleteRecords(chunkIn){
		let chunk = chunkIn.map((item)=>{return {Id:item.Id}});
		try{
			const a = await libs.remoteAction(this, 'delRecords', { records: chunk, 
				sObjApiName: this.config.sObjApiName
			});
		} catch (error) {
			console.log(error);
		}
	}
	// flattenRecordsWithChildren(records) {
	// 	const singleLevelRecords = [];
	
	// 	function flatten(record) {
	// 		const { Id, childRecords } = record;
	
	// 		if (!singleLevelRecords.some(r => r.Id === Id)) {
	// 			singleLevelRecords.push({ ...record, childRecords: [] });
	
	// 			if (childRecords) {
	// 				childRecords.forEach(childRecord => flatten(childRecord));
	// 			}
	// 		}
	// 	}
	
	// 	records.forEach(record => {
	// 		flatten(record);
	// 	});
	
	// 	return singleLevelRecords;
	// }

	mapSerialNumberField(records, field){
		records.forEach(rec => {
			if(rec[field] === undefined){
				rec[field] = "";
			}
			rec[field] = rec.sl.trim();
			this.config.listViewConfig[0]._changedRecords.add(rec.Id);

		});
		return records;
	}

	async prepareRecordsForSave(){
		let records = libs.flattenRecordsWithChildren(this.template.querySelector('c-Data-Table').getRecords());
		if(this.config.listViewConfig[0].isRecordsDragDropEnabled && this.config.listViewConfig[0].fieldToMapToIndex !== undefined && this.config.listViewConfig[0].fieldToMapToIndex !== ""){
			records = this.mapSerialNumberField(records, this.config.listViewConfig[0].fieldToMapToIndex);
		}
		let changedItems = records.filter(el => {
			return this.config.listViewConfig[0]._changedRecords.has(el.Id)
		});
		
		let allRecordsValidation = true;

		if(this.config?._advanced?.beforeSaveValidation !== undefined && 
			this.config?._advanced?.beforeSaveValidation !== ""){
			changedItems.forEach((el)=>{
				try{
					let rec = eval('('+this.config._advanced.beforeSaveValidation+')')(this,libs,el);
					if(!rec){
						console.error('Failed Validation for ',JSON.parse(JSON.stringify(el)));
						allRecordsValidation = false;
					}
				}catch(e){
					libs.showToast(this,{
						title: 'Error',
						message: e.toString(),
						variant: 'error'
					});
					console.log('Error', e);
				}
			});
		}

		let saveChunk = this.config.listViewConfig[0].saveChunkSize ? this.config.listViewConfig[0].saveChunkSize : 200; //200 is the default value for saveChunk
		let index = 0;

		if(!allRecordsValidation){
			libs.showToast(this,{
				title: 'Error',
				message: this.config._LABELS.msg_failedValidationCallback,
				variant: 'error'
			});
			console.error('Validation Not passed');
			return;
		}

		this.config.saveStatus = 0;
		this.config.countOfFailedRecords = 0;
		this.config.errorList = [];
		let chunkCount = 0;

		while(changedItems.length > 0 && index < changedItems.length){
			let lIndex = changedItems[(parseInt(index)+parseInt(saveChunk))] ? (parseInt(index)+parseInt(saveChunk)) : (changedItems.length);
			let chunk = changedItems.slice(index,lIndex);
			index += changedItems[(parseInt(index)+parseInt(saveChunk))] ? parseInt(saveChunk) : (changedItems.length);
			chunkCount +=1;
			await this.saveRecords(chunk);
		}
		if(chunkCount === this.config.saveStatus)
			this.resetChangedRecords(changedItems.length);
	}
	async saveRecords(chunkIn){
		try{
			//[DR] in case of saving custom settings need delete all nested attributes inside records, otherwise we will get EXCEPTION "Cannot deserialize instance of <unknown> from null value null or request may be missing a required field"
			let chunk = this.stripChunk(chunkIn);
			await libs.remoteAction(this, 'saveRecords', { records: chunk, 
				sObjApiName: this.config.sObjApiName,
				rollback:this.config.listViewConfig[0].rollBack ? this.config.listViewConfig[0].rollBack : false,
				beforeSaveAction: this.config.listViewConfig[0].beforeSaveApexAction ? this.config.listViewConfig[0].beforeSaveApexAction : '',
				callback: function(nodename,data){
					this.config.saveStatus += 1;
					this.config.countOfFailedRecords += parseInt(data[nodename].countOfFailedRecords);
					this.config.errorList = this.config.errorList.concat(data[nodename].listOfErrors);
					console.log('From callback ', data[nodename]);
				}
			});
		} catch (error) {
			console.log(error);
		}
	}
	stripChunk(chunkIn) {
		let chunk = [];
		chunkIn.forEach((item) =>{
			chunk.push(JSON.parse(JSON.stringify(item, (key, value) => {return typeof(value) === 'object' && key!=="" ? null : value;})))
		});
		return chunk;
	}
	isThereUnsavedRecords(){
		return this.config.listViewConfig[0]._changedRecords ? true : false;
	}
	generateDialogTitle(){
		let lViewName = this.config?.listView?.label === undefined || this.config?.listView?.label === false ? '' : this.config?.listView?.label;
		let title = this.config.userInfo.isAdminAccess === true ? 
			(lViewName !== '' ? 
			this.config._LABELS.title_listViewConfiguration + ' ' +  lViewName : this.config._LABELS.title_listViewConfiguration.slice(0, -2))
			:(lViewName !== '' ? 
			this.config._LABELS.title_selectFieldToDisplay + ' ' +  lViewName : this.config._LABELS.title_selectFieldToDisplay.slice(0, -2));
		return title;
		}

	handleEventCfg(event) {
		if(!this.isThereUnsavedRecords()){
			this.config = libs.getGlobalVar(this.name);
			let variant = this.config.userInfo.isAdminAccess === true ? 'error' : 'shade'; // shade, error, warning, info, confirm
			this.config._tabs = {};
			this.config.dialog = {
				"title": this.generateDialogTitle(),
				"variant": variant,
				"css": 'slds-modal__header slds-theme_{1} slds-theme_alert-texture'.replace('{1}', variant),
				"selectedFields": this.config.fields,
				"requiredOptions": this.config.lockedFields,
				"lockedFields": this.config.lockedFields,
				"handleEvent": this.handleEventDialog.bind(this),
				"handleHelpEvent": this.handleHelpEvent.bind(this),
				"listViewConfig": JSON.parse(JSON.stringify(this.config.listViewConfig[0])),
				"listViewName": this.config?.listView?.name,
				"listViewLabel": this.config?.listView?.label,
				"listViewAdmin": this.config?.listView?.isAdminConfig ?? false
			};
		}else{
			const eventErr = new ShowToastEvent({
				title: 'Error',
				message: this.config._LABELS.msg_unsaveRecordsCannotPerformOtherAction,
				variant: 'error'
			});
			this.dispatchEvent(eventErr);
		}
	}

	handleEventDialog(event) {
		// let clModel = [];
		// this.config.dialog.listViewConfig.forEach((el)=>{
		// 	if(el.cmpName === 'dataTable') {
		// 		clModel = el.colModel;
		// 	}
		// });
		let val = event.target.getAttribute('data-id');
		if (val === 'dialog:close') this.config.dialog = undefined;
		if(val === 'dialog:config_delete'){
			if(this.config.listView.id != undefined){
				this.dialogCfg = {
					title: this.config._LABELS.lbl_confirmDelete,
					headerStyle: 'slds-modal__header slds-theme_error',
					contents: [
						{
							isMessage: true,
							name: 'deleteConfigConfirm',
							text: this.config._LABELS.msg_confirmConfigDelete
						}
					],
					buttons: [
						{
							name: 'cancel',
							label: this.config._LABELS.lbl_cancel,
							variant: 'neutral'
						},
						{
							name: 'Delete',
							label: this.config._LABELS.title_delete,
							variant: 'brand',
							class: 'slds-m-left_x-small'
						}
					],
					data_id: "deleteConfig:dialog"
				};
				this.showDialog = true;
			}else{
				const evnt = new ShowToastEvent({
					title: 'Error',
					message: this.config._LABELS.msg_noListViewFound,
					variant: 'error'
				});
				this.dispatchEvent(evnt);
			}
		}
		if(val === 'dialog:config_share'){
			console.log(this.config.listView.id);
			this[NavigationMixin.Navigate]({
				type: 'standard__webPage',
				attributes:{
					"url": window.location.origin +"/lightning/r/extRelListConfig__c/"+ this.config.listView.id +"/recordShare"
				},
			});
		}
		if (val === 'dialog:setFields') {
			this.config.dialog.selectedFields = event.detail.value;

			this.config.dialog.field = undefined;
			let tmpColModel = [];
			this.config.dialog.selectedFields.forEach((selItem, index) => {
				let colModelItem = !this.colModel
					? undefined
					: this.colModel.find(cItem => {
						return cItem.fieldName == selItem;
					})
				if (colModelItem) tmpColModel.push(colModelItem)
				else tmpColModel.push(libs.colModelItem(selItem));
			});

			console.log(JSON.parse(JSON.stringify(this.config.dialog.listViewConfig.colModel)));
			this.config.dialog.listViewConfig.colModel = tmpColModel;

			console.log(this.config.dialog.selectedFields);
		}
		if (val === 'dialog:setLockedFields') {
			this.config.dialog.lockedFields = event.detail.value;

			console.log(JSON.parse(JSON.stringify(this.config.dialog.lockedFields)));

			this.config.dialog.listViewConfig.colModel.forEach((col, index) => {
				if (this.config.dialog.lockedFields.includes(col.fieldName)) col.locked = true;
				else col.locked = undefined;
			});

			console.log(JSON.parse(JSON.stringify(this.config.dialog.listViewConfig.colModel)));
		}

		if (val === 'dialog:setField') {
			this.config.dialog.field = false;
			//this is done to refresh the colModelItem. HYPER-355
			let fn = (scope,e) => {
				scope.config.dialog.field = e.detail.value;
			};
			fn(this,event);
		}
		if (val === 'dialog:setAction') {
			console.log('called',JSON.parse(JSON.stringify(event.detail)));
			this.config.dialog.action = event.detail.value;
		}
		if (val === 'dialog:setActionParam') {
			let param = event.target.getAttribute('data-param');
			let type = event.target.getAttribute('data-type');
			let value = (type === 'checkbox') ? event.target.checked : event.target.value;
			console.log(type, param, value);

			let field = this.config.dialog.listViewConfig.actions.find(e => {
				return e.actionId === this.config.dialog.action;
			});
			//checking if other actions has same order
			if(param === 'actionOrder'){
				let isOtherActionExists = this.config.dialog.listViewConfig.actions.find(e => {
					return e.actionOrder == value;
				});
				if(isOtherActionExists !== undefined){
					const msgEvent = new ShowToastEvent({
						title: 'Error',
						message: this.config._LABELS.lbl_actionWithThisOrderAlreadyExists,
						variant: 'error'
					});
					this.dispatchEvent(msgEvent);
					event.target.value = field.actionOrder;
					value = field.actionOrder;
				}
			}

			if(param === 'actionVisibleOnRecordSelection' && value && field.actionIsHidden){
				event.target.checked = false;
				const msgEvent = new ShowToastEvent({
					title: 'Error',
					message: this.config._LABELS.msg_actionVisibleOnRecordSelectionError,
					variant: 'error'
				});
				this.dispatchEvent(msgEvent);
			}else if(param === 'actionIsHidden' && value && field.actionVisibleOnRecordSelection){
				const msgEvent2 = new ShowToastEvent({
					title: 'Error',
					message: this.config._LABELS.msg_actionHideError,
					variant: 'error'
				});
				this.dispatchEvent(msgEvent2);
				event.target.checked = false;
			}else{

				if (field) {
					field[param] = value;
				}
			}
			const expandAction0 = this.config.dialog.listViewConfig.actions.find((el) => el.actionId === 'std:expand_view');
			this.config._expandIcon = expandAction0.actionIconName;
			this.config._expandTip = expandAction0.actionTip;
		}
		if (val === 'dialog:setFieldParam') {
			let param = event.target.getAttribute('data-param');
			let type = event.target.getAttribute('data-type');
			let value = (type === 'checkbox') ? event.target.checked : event.target.value;
			console.log(type, param, value);

			let field = this.config.dialog.listViewConfig.colModel.find(e => {
				return e.fieldName === this.config.dialog.field;
			})
			if (field) {
				field[param] = value;
			}
		}
		if (val === 'dialog:setTableParam') {
			

			let param = event.target.getAttribute('data-param');
			let type = event.target.getAttribute('data-type');
			let value = (type === 'checkbox') ? event.target.checked : event.target.value;
			console.log(type, param, value);

			if(param === 'displayOptionListSize' && value !== undefined && value !== null && (value.startsWith('-') || isNaN(value))) {
				const msgEvent3 = new ShowToastEvent({
					title: 'Error',
					message: 'Only accepts positive numbers',
					variant: 'error'
				});
				this.dispatchEvent(msgEvent3);
				event.target.value = this.config.dialog.listViewConfig[param] ?? '20';
				return;
			} 
			this.config.dialog.listViewConfig[param] = value;

		}
		if (val === 'dialog:setPagerParam') {
			

			let param = event.target.getAttribute('data-param');
			let type = event.target.getAttribute('data-type');
			let value = (type === 'checkbox') ? event.target.checked : event.target.value;

			console.log(type, param, value);

			this.config.dialog.listViewConfig.pager[param] = value;

			console.log('saving table params', param, this.config.dialog.listViewConfig[param]);
		}
		if (val === 'dialog:setAddCondition') {
			this.config.dialog.listViewConfig.addCondition = event.detail.value;
		}

		if (val === 'dialog:saveAs') {
			this.config.dialog.title = this.config._LABELS.title_newListView;
			this.config.dialog.saveAs = true;
		}
		if (val === 'dialog:saveAsCancel') {
			this.config.dialog.title = this.generateDialogTitle();
			this.config.dialog.saveAs = false;
		}
		//HYPER-455
		// if (val === 'dialog:saveAsName') {
		// 	this.config.dialog.listViewName = event.target.value.substring(0,20);
		// }
		if (val === 'dialog:saveAsLabel') {
			this.config.dialog.listViewLabel = event.target.value.substring(0,20);
		}
		if (val === 'dialog:saveAsFinish') {
			this.config.dialog.listViewName = libs.uuidv4(); //HYPER-455
			console.log('SaveAs Finish', this.config.dialog.listViewName);
			console.log(JSON.parse(JSON.stringify(this.config.dialog)));
			//

			libs.remoteAction(this, 'saveListView', { config: this.prepareConfigForSave(), listViewName: this.config.dialog.listViewName, listViewLabel: this.config.dialog.listViewLabel, sObjApiName: this.config.sObjApiName, relField: this.config.relField, addCondition: /*this.AddCondition*/this.config.dialog.listViewConfig.addCondition, listViewAdmin: this.config.dialog.listViewAdmin, callback: this.saveListView });

		}
		if (val === 'dialog:save') {
			console.log(JSON.parse(JSON.stringify(this.config.dialog)));
			console.log(JSON.parse(JSON.stringify(this.config.dialog.selectedFields)), JSON.parse(JSON.stringify(this.config.dialog.listViewConfig)));
			if (this.config.dialog.listViewName) {
				libs.remoteAction(this, 'saveListView', { config: this.prepareConfigForSave(), listViewName: this.config.dialog.listViewName, listViewLabel: this.config.dialog.listViewLabel, sObjApiName: this.config.sObjApiName, relField: this.config.relField, addCondition: /*this.AddCondition*/this.config.dialog.listViewConfig.addCondition, listViewAdmin: this.config.dialog.listViewAdmin, callback: this.saveListView });
			} else {
				this.config.dialog.saveAs = true;
			}

			
			/*this.config.fields = this.config.dialog.selectedFields;
			
			this.config.tableData = undefined;
			let config = JSON.parse(JSON.stringify(this.config));
			config.tableData = undefined;
			config.dialog = undefined;
			libs.saveConfig(this.ApiName, config);
			libs.remoteAction(this, 'query', {isNeedDescribe : true, sObjApiName: this.config.sObjApiName, relField : this.config.relField, addCondition : this.AddCondition, fields: this.config.fields, callback : this.loadRecords});*/
		}
	}

	handleGlobalSearch(event) {
		const isEnterKey = event.keyCode === 13;
		if(event.target.value.length == 0){
			libs.getGlobalVar(this.name).records = this.allRecords;
			this.template.querySelector('c-Data-Table').updateView();
			return;
		}
        if (isEnterKey) {
            this.config.queryTerm = event.target.value;
			// Need run search on table
			if(this.config.queryTerm !== ''){
				let searchableRecords = JSON.parse(JSON.stringify(this.allRecords));
				let searchTerm = this.config.queryTerm.toLowerCase();
				const searchResults = new Set();
				searchableRecords.forEach((el) => {
						if(this.searchOnObjectValues(el,searchTerm)){
							searchResults.add(el);
						}
				});
				libs.getGlobalVar(this.name).records = [...searchResults];
				this.config.records = libs.getGlobalVar(this.name).records;
			}else{
				libs.getGlobalVar(this.name).records = this.allRecords;
			}
			this.config.listViewConfig[0].pager.curPage = 1;
			this.template.querySelector('c-Data-Table').updateView();
        }
	}
	searchOnObjectValues(obj,sTerm){
		let dateFields = [];
		dateFields = this.config.listViewConfig[0].colModel.filter((el)=> el.type === 'date' || el.type === 'datetime');
		/* eslint-disable */
		for(let key in obj){
			if(obj[key] && typeof obj[key] === 'object'){
				if(this.searchOnObjectValues(obj[key],sTerm)) return true;
			}
			else if(obj[key] && obj[key].toString().toLowerCase().indexOf(sTerm)!=-1) {
				return true;
			}
			//to search on date fields with timezone adjusted
			let field = {};
			dateFields.forEach((el)=>{
				if(el.fieldName === key){
					field = el;
				}
			});
			if(field.type === 'date'){
				let val = new Date(obj[key]).toLocaleString(this.config.userInfo.locale,{
					month : "2-digit",
					day : "2-digit",
					year: "numeric",
					timeZone: this.config.userInfo.timezone
				});
				if(val.toString().toLowerCase().indexOf(sTerm)!=-1) {
					return true;
				}
			}
		}
		return false;
	}

	handleGlobalSearchClear(event) {
		if (!event.target.value.length) {
			this.config.queryTerm = undefined;
			libs.getGlobalVar(this.name).records = this.allRecords;
			this.template.querySelector('c-Data-Table').updateView();
		}
	}

	prepareConfigForSave() {
		let exAction = this.config.dialog.listViewConfig.actions.find((el) => el.actionId === 'std:expand_view');
		if(this.config._expandIcon !== exAction.actionIconName){
			exAction.actionIconName = this.config._expandIcon;
			exAction.actionTip = this.config._expandTip;
		}
		let tmp = JSON.parse(JSON.stringify(this.config.dialog.listViewConfig));
		//to delete the recordsToShow mistakenly added to config
		if(tmp.recordsToShow !== undefined || tmp.isAnyRecordsHaveChildren !== undefined){
			delete tmp.isAnyRecordsHaveChildren;
			delete tmp.recordsToShow;
		}
		tmp = this.deleteKeysStartingWithUnderscore(tmp);
		let cnfg = [];
		cnfg.push(tmp);
		return JSON.stringify(cnfg, null, '\t');
	}
	deleteKeysStartingWithUnderscore(obj) {
		if (Array.isArray(obj)) {
		  for (let i = 0; i < obj.length; i++) {
			if (typeof obj[i] === 'object' && obj[i] !== null) {
				this.deleteKeysStartingWithUnderscore(obj[i]);
			}
		  }
		} else if (typeof obj === 'object' && obj !== null) {
		  for (let key in obj) {
			if (key.startsWith('_')) {
			  delete obj[key];
			}else if(key === 'options'){
				delete obj[key];
			} else {
			  if (typeof obj[key] === 'object' && obj[key] !== null) {
				this.deleteKeysStartingWithUnderscore(obj[key]);
			  }
			}
		  }
	  
		  // Check if any child object is empty after deletion and remove it
		  for (let key in obj) {
			if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && obj[key] !== null && Object.keys(obj[key]).length === 0) {
			  delete obj[key];
			}
		  }
		}
		return obj;
	  }

	saveListView(nodeName, data) {
		const event = new ShowToastEvent({
			title: 'success',
			message: this.config._LABELS.msg_lisViewWasUpdated,
			variant: 'success'
		});
		this.dispatchEvent(event);
		console.log(nodeName, JSON.parse(JSON.stringify(data)));
		if (this.config.listView) this.config.listView.name = data[nodeName].listViewName;
		console.log(this.apiName);
		console.log(JSON.parse(JSON.stringify(this.localConfig)));
		libs.saveConfig(this.apiName, this.localConfig);
		this.config.dialog = undefined;
		this.config.records = undefined;
		this.loadCfg(false);
		// libs.remoteAction(this, 'getConfig', { sObjApiName: this.config.sObjApiName, relField: this.config.relField, listViewName: this.config?.listView?.name, callback: this.setConfig });
	}

	handleEventActions(event, val) {
		if (val.startsWith('std:export')) {
			if(!this.isThereUnsavedRecords()){				
				// HYPER-381
				this.config.isSpinner = true;
				const event = new ShowToastEvent({
					title: 'Success',
					message: this.config._LABELS.msg_yourFileWillStartDownloadingShortly,
					variant: 'success'
				});
				this.dispatchEvent(event);
				setTimeout(async () => { 
					this.handleEventExport(event);
					this.handleStandardCallback(val);
				}, 100);
			}else{
				const event = new ShowToastEvent({
					title: 'Error',
					message: this.config._LABELS.msg_unsaveRecordsCannotPerformOtherAction,
					variant: 'error'
				});
				this.dispatchEvent(event);
			}
		}
		if (val.startsWith('std:delete')) {
			if(!this.isThereUnsavedRecords()){
				let records = this.template.querySelector('c-Data-Table').getSelectedRecords();

				if(records.length > 0){
					this.dialogCfg = {
						title: this.config._LABELS.lbl_confirmDelete,
						headerStyle: 'slds-modal__header slds-theme_error',
						contents: [
							{
								isMessage: true,
								name: 'deleteConfirm',
								text: this.config._LABELS.msg_deleteConfirm1 + ' ' + records.length + ' ' + this.config._LABELS.msg_deleteConfirm2
							}
						],
						buttons: [
							{
								name: 'cancel',
								label: this.config._LABELS.lbl_cancel,
								variant: 'neutral'
							},
							{
								name: 'Delete',
								label: this.config._LABELS.title_delete,
								variant: 'brand',
								class: 'slds-m-left_x-small'
							}
						],
						data_id: "delete:dialog"
					};
					this.showDialog = true;
				}else{
					const event = new ShowToastEvent({
						title: 'Error',
						message: this.config._LABELS.lbl_deleteNoRecordSelectedError,
						variant: 'error'
					});
					this.dispatchEvent(event);
				}
			}else{
				const event = new ShowToastEvent({
					title: 'Error',
					message: this.config._LABELS.msg_unsaveRecordsCannotPerformOtherAction,
					variant: 'error'
				});
				this.dispatchEvent(event);
			}
		}

		if (val.startsWith('std:new')) {
			if(!this.isThereUnsavedRecords()){

				let defValue = {};
				defValue[this.config.relField] = this.recordId;

				this[NavigationMixin.Navigate]({
					type: 'standard__objectPage',
					attributes: {
						/*recordId: this.recordId, // pass the record id here.*/
						objectApiName: this.config.sObjApiName,
						actionName: 'new',
					},
					state: {
						defaultFieldValues: encodeDefaultFieldValues(defValue),
				        useRecordTypeCheck: 1
					}
				});
				this.handleStandardCallback(val);
			}else{
				const event = new ShowToastEvent({
					title: 'Error',
					message: this.config._LABELS.msg_unsaveRecordsCannotPerformOtherAction,
					variant: 'error'
				});
				this.dispatchEvent(event);
			}
		}
		if (val.startsWith('std:expand_view')) {

			if(!this.isThereUnsavedRecords()){
				if(this.isFullscreen){
					window.close();
					history.back();
				}else{
					let url = '/lightning/n/XRL__EXRL?c__apiName='+ btoa(this.apiName) + '&c__name='+ btoa(this.name);
					if(this.recordId !== undefined && this.recordId !== null){
						url += '&c__recordId='+btoa(this.recordId);
					}
					window.open(url,"_self");
				}
				this.handleStandardCallback(val);
			}else{
				const event = new ShowToastEvent({
					title: 'Error',
					message: this.config._LABELS.msg_unsaveRecordsCannotPerformOtherAction,
					variant: 'error'
				});
				this.dispatchEvent(event);
			}
		}
		if (val.startsWith('std:reset_filters')) {
			if(!this.isThereUnsavedRecords()){
				this.config.isSpinner = true;
				let recs = [... this.config.records];
				this.config.records = false;
				const actionsBar = Object.assign({}, this.config.actionsBar);
				this.config.actionsBar = false;
				this.config.listViewConfig[0].colModel.forEach( e=>  {
					if(e._filterStrLastChangeDate !== undefined){
						e._isFilterOptions = undefined;
						e._filterStrLastChangeDate = undefined;
						e.filterStr = '';
						e.filterStrTo = '';
						e.isShowClearBtn = false;
						e._filterCondition = '';
						e._filterVariant = '';
						e._filterStr = [];
						e._filterOption = undefined;
					}
				});
				setTimeout(function(that) {
					that.config.records = recs; //refreshing the dataTable component
					that.config.actionsBar = actionsBar;//refreshing the action bar component
					that.config.isSpinner = false;
				},1,this);
			}else{
				const event = new ShowToastEvent({
					title: 'Error',
					message: this.config._LABELS.msg_unsaveRecordsCannotPerformOtherAction,
					variant: 'error'
				});
				this.dispatchEvent(event);
			}
		}

	}
	handleHelpEvent(event){
		try{
			let val = event.target.getAttribute('data-id');
			let url = event.target.getAttribute('data-url') ? event.target.getAttribute('data-url') : undefined;
			if(val ==='help:extRelList'){
				libs.help(val,undefined);
				return;
			}
			let tabNo = this.config._tabs?.currentOpenedTab;
			//tab no = 1 denotes the field selection tab
			if(tabNo === "1" && this.config._tabs?.sqlBuilderTab !== undefined){
				tabNo = this.config._tabs?.sqlBuilderTab;
			}
			val = 'help:' + tabNo;
			console.log('Help Id ',val);
			libs.help(val, url);
		}catch(e){
			console.log('Error in handleHelpEvent:', e);
			//opening index url of help page
			libs.help('help:extRelList', undefined);
		}
	}
	handleFlowStatusChange(event) {
		console.log('FLOW', event.detail.status);
		if(event.detail.status === 'STARTED') {
			this.config.flowApiClass = "slds-modal__container slds-scrollable_y";
		}
		if(event.detail.status === 'FINISHED') {
			delete this.config.flowApiName;
			delete this.config.flowInputVariables;
            const outputVariables = event.detail.outputVariables;
			console.log('FLOW OUTPUT PARAMS',outputVariables)
			this.loadCfg();
		}
	}

	handleEventFlow(action){
		
		if (action.target) {
			let val = action.target.getAttribute('data-id');
			if (val === 'flow:close') {
				delete this.config.flowApiName;
				delete this.config.flowInputVariables;
				return;
			}
		}

		let records = this.template.querySelector('c-Data-Table')?.getSelectedRecords();

		let recordIdList;
		if (records && records.length !== 0) {
			recordIdList = records.map(rec => rec.Id);
			if (action.name.startsWith('AutoLaunchedFlow')) {
				libs.remoteAction(this, 'invokeAction', { name: action.name.split(/::/)[1], recordIdList: recordIdList, callback: (cmd, data) => {
					console.log(cmd, data);
					let res = JSON.parse(data.invokeActionResult);
					if (res.isSuccess) {
						const event = new ShowToastEvent({
							title: 'Success',
							message: res.message ? res.message : (action.label + ' execution finished'),
							variant: 'success'
						});
						this.dispatchEvent(event);
						this.loadCfg();
					} else {
						const event = new ShowToastEvent({
							title: 'Error',
							message: res.message ? res.message : (action.label + ' execution failed'),
							variant: 'error'
						});
						this.dispatchEvent(event);
					}				
				}});
			} else {
				this.config.flowApiName = action.name.split(/::/)[1];
				this.config.flowApiClass = "slds-modal__container slds-scrollable_y slds-hidden"
				this.config.flowInputVariables = [
					{
						name : "records",
     					type : "SObject",
     					value : JSON.parse(JSON.stringify(records))
					}
				];
				//Need to run screen flow
			}
		}else{
			if (!action.name.startsWith('AutoLaunchedFlow')) {
				this.config.flowApiName = action.name.split(/::/)[1];
				this.config.flowApiClass = "slds-modal__container slds-scrollable_y slds-hidden"
				this.config.flowInputVariables = [
					{
						name : "records",
     					type : "SObject",
     					value : records ? JSON.parse(JSON.stringify(records)) : []
					}
				];
			}
			
		}
	}
	handleDownloadJSONFile(records,fileName) {
        let data = JSON.stringify({
			"sObjApiName" : this.config.sObjApiName,
			"SOQL" : this.config.query,
			"records" : records
		  });
        // Creating anchor element to download
        let downloadElement = document.createElement('a');
        // This  encodeURI encodes special characters, except: , / ? : @ & = + $ # (Use encodeURIComponent() to encode these characters).
        downloadElement.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(data);
        downloadElement.target = '_self';
        downloadElement.download = fileName+'.JSON';
        // below statement is required if you are using firefox browser
        document.body.appendChild(downloadElement);
        downloadElement.click();
    }

	async handleEventExport(event) {
		let dataTable = this.template.querySelector('c-Data-Table');
		let records = dataTable.getSelectedRecords().length ? dataTable.getSelectedRecords() : dataTable.getRecords();
		let locale = libs.getGlobalVar(this.name).userInfo.locale;
		const groupedRecords = libs.getGlobalVar(this.name)?.groupedRecords;
		console.log('libs.getGlobalVar(this.name)', libs.getGlobalVar(this.name));
		const newRecords = []; // to store records with group title, cannot use the old array as serial won't match
		if (groupedRecords && groupedRecords.length > 0) {
			const isRecordsSelected = dataTable.getSelectedRecords().length > 0;
			groupedRecords.forEach(group => {
				if (group && group.records) {
					const recordsToBeCopied = isRecordsSelected ?
						group.records.filter(rec => {
							return records.find(r => r.Id === rec.Id); // filter records which are present in the records array
						}) :
						group.records; // if no records are selected, then all records of the group will be exported
					if (recordsToBeCopied && recordsToBeCopied.length > 0) {
						recordsToBeCopied[0].groupTitle = group.title;
						newRecords.push(...recordsToBeCopied);
					}
				}
			});
		}
		records = newRecords.length > 0 ? newRecords : records;
		let fileName = this.config.sObjLabel + ' ' + this.config?.listView?.label;
		console.log(JSON.parse(JSON.stringify(this.config)));
		console.log(JSON.parse(JSON.stringify(records)));
		let exportActionData = this.config.listViewConfig[0].actions.find((el) => el.actionId === 'std:export');
		let _advanced = eval('[' + exportActionData.advanced + ']')[0];
		if(_advanced?.outputFormat === 'JSON'){
			this.handleDownloadJSONFile(records,fileName);
		}else{

			let wb = XLSX.utils.book_new();
			wb.cellStyles = true;
			wb.Props = {
				Title: fileName,
				Subject: this.config.sObjLabel + " Export",
				Author: "Extended Related List",
				CreatedDate: new Date(),

			};
			let wrapText = { wrapText: '0' };
			let evenStyle = { alignment: wrapText, bold: false, color: { rgb: 0 }, fgColor: { rgb: 15658734 } };
			let oddStyle = { alignment: wrapText, bold: false, color: { rgb: 0 } };

			let ws = {
				'!cols': []
			};
			let columns = this.config.listViewConfig[0].colModel.filter(col => { return !col.isHidden && !col._skipFieldFromDisplay; });
			let groupNumber = 0; // to keep track of group title and shift the rows accordingly
			const merges = [];
			records.forEach(async (rec, i) => {
				i+=groupNumber;
				if(rec.groupTitle !== undefined){
					groupNumber++;
					i++;
					const cell_ref = XLSX.utils.encode_cell({ c: 0, r: i });
					ws[cell_ref] = {
						v: rec.groupTitle, s: { bold: true, fgColor: { rgb: 272822 }, color: { rgb: 16777215 } }
					}
					const merge = {s: {c: 0, r: i}, e: {c: columns.length-1, r: i}};
					merges.push(merge);
					ws['!cols'].push({ wch: 40 });
				}
				columns.forEach(async (col, j) => {
					if (i-groupNumber === 0) {
						let cell_ref = XLSX.utils.encode_cell({ c: j, r: i-groupNumber }); // -groupNumber to skip the group title row without modyfying the existing logic
						ws[cell_ref] = {
							v: col.label, s: { bold: true, fgColor: { rgb: 0 }, color: { rgb: 16777215 } }
						}
						ws['!cols'].push({ wch: 40 });
					}
					let cell_ref = XLSX.utils.encode_cell({ c: j, r: i + 1 });
					ws[cell_ref] = {
						s: i % 2 ? evenStyle : oddStyle
					};
					let fieldValue;
					if (col.fieldName.includes('.')) {
					const [refFieldName, refChildFieldName] = col.fieldName.split('.');
					if (rec[refFieldName] && (rec[refFieldName][refChildFieldName] || rec[refFieldName][refChildFieldName]==0)) {
						fieldValue = rec[refFieldName][refChildFieldName];
					} else if (col.referenceTo !== undefined && rec[col.referenceTo] && rec[col.referenceTo][refChildFieldName]) {
						fieldValue = rec[col.referenceTo][refChildFieldName];
					} else {
						fieldValue = '';
					}
					}else {
					fieldValue = (rec[col.fieldName] || rec[col.fieldName]==0) ? rec[col.fieldName] : '';
					}
					if (col.formatter !== undefined && col.formatter!=="") {
						let row,val;
						[row,val] = libs.getLookupRow(rec, col.fieldName);
						try{
							fieldValue = eval('(' + col.formatter + ')')(row, col, val);
						}catch(e) {
							fieldValue = fieldValue;
							console.error(e);
						}
					}

					switch (col.type) {
					case 'reference':
						if((col.formatter === undefined || col.formatter==="")){
							//in case it is a reference and no formatting is defined, otherwise treat it as normal string value
							const [lookupRow, lookupId] = libs.getLookupRow(rec, col.fieldName);
							ws[cell_ref].v = lookupRow.Name || '';
							ws[cell_ref].l = {
							Target: window.location.origin + '/' + lookupId,
							Tooltip: window.location.origin + '/' + lookupId
							};
						}else{
							ws[cell_ref].v = fieldValue;
						}
						ws[cell_ref].t = 's';
						break;
					case 'date':
						ws[cell_ref].v = fieldValue ? new Date(fieldValue) : '';
						ws[cell_ref].t = fieldValue ? 'd' : 's';
						break;
					case 'datetime':
						ws[cell_ref].v = fieldValue ? new Date(fieldValue) : '';
						ws[cell_ref].t = fieldValue ? 'dt' : 's';
						break;
					case 'number':
						ws[cell_ref].v = fieldValue ? Number(fieldValue) : '';
						ws[cell_ref].t = 'n';
						break;
					case 'boolean':
						ws[cell_ref].v = Boolean(fieldValue);
						ws[cell_ref].t = 'b';
						break;
					default:
						ws[cell_ref].v = fieldValue;
						ws[cell_ref].t = 's';
						break;
					}

				});
			});
			ws['!merges'] = merges; // merges the group title cells
			ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: columns.length, r: records.length + groupNumber } }); // +groupNumber to include the group title row
			XLSX.utils.book_append_sheet(wb, ws, (this.config.sObjLabel + ' '  + this.config?.listView?.label).length > 30 ? (this.config.sObjLabel + ' '  + this.config?.listView?.label).substring(0,30):(this.config.sObjLabel + ' '  + this.config?.listView?.label));
			XLSX.writeFile(wb, this.config.sObjLabel + ' ' + this.config?.listView?.label + '.xlsx', { cellStyles: true, WTF: 1 });
		}
		this.config.isSpinner = false;
	}



	handleStandardCallback(val, listViewAction){
		let actionCallBack;
		let selectedRecords;
		if(val !== 'std:refresh'){
			let action = this.config.listViewConfig[0].actions.find((el)=>{
				return el.actionId == val;
			});
			let _advanced = eval('['+action?.advanced + ']')[0];
			actionCallBack = _advanced?.actionCallBack;
			selectedRecords = this.template.querySelector('c-Data-Table')?.getSelectedRecords();
			// if(action.actionCallBack != undefined && action.actionCallBack != ''){
			// 	console.log('Callback defined: ', action.actionCallBack);
			// 	eval('(' + action.actionCallBack + ')')(this.template.querySelector('c-Data-Table').getSelectedRecords());
			// }
		}else{
			actionCallBack = eval('['+listViewAction?.action?.advanced?.actionCallBack+ ']')[0];
			selectedRecords = listViewAction?.selectedRecords; // the selected records are coming from the caller function
			// The loadCfg method and the c/dataTable component are still not ready to be used
			// at the time of this function call, so we have to handle the refresh action differently
		}
		if(actionCallBack != undefined && actionCallBack != ''){
			console.log('Callback defined: ', actionCallBack);
			eval('(' + actionCallBack + ')')(selectedRecords?selectedRecords:[]);
		}
	}
}