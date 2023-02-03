import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from "lightning/navigation"
import { encodeDefaultFieldValues, decodeDefaultFieldValues } from 'lightning/pageReferenceUtils'

import resource from '@salesforce/resourceUrl/extRelList';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';


export default class extRelList extends NavigationMixin(LightningElement) {

	@api apiName;
	@api name;
	@api recordId;
	@api defaultListView;	
	@api configuration;
	@api addTemplate;
	@api isFullscreen;

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
			if (this.config.listViewConfig[0]._changedRecords) {
				event.preventDefault();
				event.returnValue = '';
			}
		});
	}
	@api 
	updateGridView(newApiName){
		this.apiName = newApiName;
		this.loadCfg(true);
	}

	connectedCallback() {
		console.log('RENDERED');
		this.loadCfg(true);
	}

	setCustomLabels(cmd, data) {
		console.log('CustomLabes are loaded', data[cmd]);
		this.config._LABELS = data[cmd];
	}

	loadCfg(isInit) {
		libs.remoteAction(this, 'getCustomLabels', {callback: this.setCustomLabels.bind(this) });
		let apiNames = this.apiName.split('::');
		console.log(apiNames);
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
		
		let listViewName = isInit && this.defaultListView !== undefined ? this.defaultListView : (!isInit && this.name !== undefined ? this.name : undefined);
		console.log(this.defaultListView);
		console.log(listViewName);
		if (this.configuration) {
			this.setConfig('getConfigResult', this.configuration);
		} else {
			libs.remoteAction(this, 'getConfig', { sObjApiName: this.config.sObjApiName, relField: this.config.relField, listViewName: listViewName, callback: this.setConfig.bind(this) });
		}
	}

	setConfig(cmd, data) {
		console.log(cmd, JSON.parse(JSON.stringify(data)), JSON.parse(JSON.stringify(data[cmd])));
		libs.getGlobalVar(this.name).userInfo = data.userInfo;
		libs.getGlobalVar(this.name).iconName = data[cmd].iconMap.iconURL;
		libs.getGlobalVar(this.name).iconStyle = data[cmd].iconMap.iconURL.includes('img/icon') ? 'width:32px;height:32px;background-color: #d8c760;margin: 10px;'
		 : 'width:32px;height:32px;margin: 10px;';
		 this.config.actionsBar = {};

		let adminConfig = (data[cmd].baseConfig) ? JSON.parse(data[cmd].baseConfig) : [];
		let userConfig = (data[cmd].userConfig) ? JSON.parse(JSON.stringify(data[cmd].userConfig)) : [];

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
			this.config.dataTableConfig.colModel = [{
				"fieldName" : "Id",
				"updateable": false,
				"isNameField": false,
				"isEditable": false,
				"isFilterable": true,
				"isSortable": true
			}];
			if(this.config.sObjApiName.toLowerCase().includes('history')){
				this.config.dataTableConfig.colModel = libs.historyGrid(this.apiName);
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
		this.config.listView = data[cmd].listViews.findLast(v => { return v.isUserConfig;});
		console.log(JSON.stringify(this.config.listView));
		this.config.currency =  data[cmd].currency;
		//if (this.config.userInfo.isAdminAccess === true) delete this.localConfig.listViewName;
		this.config.describe = data[cmd].describe ? JSON.parse(data[cmd].describe) : {};
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
		this.config.fields = [];
		this.config.lockedFields = [];
		
		this.config.listViewConfig[0]?.colModel?.forEach(e => {
			let describe = this.config.describe[e.fieldName];
			if (describe && describe.type === 'reference') {
				this.config.fields.push(describe.relationshipName ? describe.relationshipName + '.Name' : e.fieldName);
				if (e.locked) this.config.lockedFields.push(describe.relationshipName ? describe.relationshipName + '.Name' : e.fieldName);
			}
			this.config.fields.push(e.fieldName);
			if (e.locked) this.config.lockedFields.push(e.fieldName);
		});
		
		this.config.isGlobalSearch=this.config.listViewConfig[0].isGlobalSearch;
		if(!this.config.listViewConfig[0].actions){
			this.config.listViewConfig[0].actions = libs.standardActions();
			//disabling delete and new standard action incase of history grid
			let notAllowedActions = ['std:delete','std:new'];
			if(this.config.sObjApiName.toLowerCase().includes('history')){
				this.config.listViewConfig[0].actions = this.config.listViewConfig[0].actions.filter( (el) =>{
					if(notAllowedActions.includes(el.actionId)) return false;
					else return true;
				} );
			}
		}
		this.config.listViewConfig[0].rowChecked = false;
		this.config.actionsBar = {
			'actions':this.config.listViewConfig[0].actions,
			'_handleEvent':this.handleEvent.bind(this),
			'_handleEventFlow': this.handleEventFlow.bind(this),
			'_cfgName': this.name
		};

		console.log('this.config', this.config);
		this.loadRecords();		
	}

	loadRecords() {
		libs.remoteAction(this, 'query', {
			isNeedDescribe: true,
			sObjApiName: this.config.sObjApiName,
			relField: this.config.relField,
			addCondition: this.config.listViewConfig[0].addCondition,
			orderBy: this.config.listViewConfig[0].orderBy,
			fields: this.config.fields,
			listViewName: this.config?.listView?.name,
			callback: ((nodeName, data) => {
				console.log('length', data[nodeName].records);
				
				libs.getGlobalVar(this.name).records = data[nodeName].records.length > 0 ? data[nodeName].records : undefined;
				
				this.config.records = libs.getGlobalVar(this.name).records;
				this.allRecords = this.config.records;
				
				console.log('loadRecords', libs.getGlobalVar(this.name));
				this.generateColModel();
			})
		});
	}

	generateColModel() {
		this.config.listViewConfig[0].colModel.forEach(e => {
			if(e.fieldName === 'Id'){
				let describe = this.config.describe[e.fieldName];
				if (e.label === undefined) e.label = describe.label;
				if (e.type === undefined) e.type = describe.type;
				if (e.updateable === undefined) e.updateable = describe.updateable;
				if (e.isNameField === undefined) e.isNameField = describe && describe.nameField === true;
				if (e.type === 'picklist' && e.options === undefined) {
					e.options = [];
					describe.picklistValues.forEach(field => {
						e.options.push(
							{ label: field.label, value: field.value }
						)
					});
				}
				if (e.isEditable && describe.updateable) {
					if (e.type === 'picklist' || e.type === 'reference') {
						e.isEditableAsPicklist = true;
						console.log('picklist', e);
					} else if (e.type === 'boolean') {
						e.isEditableBool = true;
					} else {
						e.isEditableRegular = true;
					}
				} else {
					e.isEditable = false;
				}
			}
		});
		console.log('ColModel', JSON.parse(JSON.stringify(this.config.listViewConfig[0].colModel)));
	}

	get changedRecords() {
		return 'Count of changed records ' + this.config.listViewConfig[0]._changedRecords.length;
	}

	get hasDynamicActions() {
		return this.config?.listViewConfig?.dynamicActions !== undefined;
	}

	resetChangedRecords() {
		// this.config.resetIndex += 1;
		if(this.template.querySelector('c-Data-Table')){
			this.template.querySelector('c-Data-Table').setUpdateInfo('• ' + this.config.listViewConfig[0]._changedRecords.length + ' ' +this.config._LABELS.msg_itemsUpdated);
		}
		setTimeout((() => { this.template.querySelector('c-Data-Table').setUpdateInfo(''); }), 3000);
		const toast = new ShowToastEvent({
			title: 'Success',
			message: this.config.listViewConfig[0]._changedRecords.length + ' ' +this.config._LABELS.msg_itemsUpdated,
			variant: 'success'
		});
		this.dispatchEvent(toast);
		this.config.listViewConfig[0]._changedRecords = undefined;
		this.template.querySelector('c-Data-Table').updateView();
	}

	handleEvent(event) {
		let val = event.target.getAttribute('data-id');
		console.log(val);
		if (val.startsWith('help:')) libs.help(val, {});
		if (val === 'globalSearch') this.handleGlobalSearch(event);
		if (val.startsWith('cfg:')) this.handleEventCfg(event);
		if (val.startsWith('dialog:')) this.handleEventDialog(event);
		if (val.startsWith('std:refresh')) {
			if(!this.isThereUnsavedRecords()){
				let action = this.config.listViewConfig[0].actions.find((el)=>{
					return el.actionId == 'std:refresh';
				});
				this.loadCfg(false);
				this.handleStandardCallback(action,'std:refresh');
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
			//libs.getGlobalVar(this.name).records = undefined;

			// let changedItems = this.template.querySelector('c-Data-Table').getRecords().filter(el => {
			// 	// In thiscase need merge to libs.getGlobalVar(this.name).records;
			// 	return this.config.listViewConfig[0]._changedRecords.indexOf(el.Id) > -1
			// })
			
			// if(this.config.listViewConfig[0].beforeSaveValidation !== undefined && 
			// 	this.config.listViewConfig[0].beforeSaveValidation !== ""){
			// 	changedItems.forEach((el)=>{
			// 		let rec = eval('('+this.config.listViewConfig[0].beforeSaveValidation+')')(el);
			// 		if(rec){
			// 			el = rec;
			// 		}
			// 	});
			// }

			// this.config.loopIndex = 0;
			// this.config.resetIndex = 0;
			// let saveChunk = this.config.listViewConfig[0].saveChunkSize ? this.config.listViewConfig[0].saveChunkSize : 200; //200 is the default value for saveChunk
			// let index = 0;
			// // console.log("rollback",this.config.listViewConfig[0].rollBack);
			// while(index <= changedItems.length){
			// 	let lIndex = changedItems[(parseInt(index)+parseInt(saveChunk))] ? (parseInt(index)+parseInt(saveChunk)) : (changedItems.length);
			// 	let chunk = changedItems.slice(index,lIndex);
			// 	index += changedItems[(parseInt(index)+parseInt(saveChunk))] ? parseInt(saveChunk) : (changedItems.length);
			// 	// index += chunk.length;
			// 	this.config.loopIndex += 1;
			// 	libs.remoteAction(this, 'saveRecords', { records: chunk, 
			// 		sObjApiName: this.config.sObjApiName,
			// 		rollback:this.config.listViewConfig[0].rollBack ? this.config.listViewConfig[0].rollBack : true,
			// 		callback: this.resetChangedRecords });
			// }
		}

		if (val.startsWith(':change_view')) {
			if(!this.isThereUnsavedRecords()){
				this.name = event.target.value;
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
							required: true,
							isTextarea: true,
							name: 'featureText',
							variant: 'label-hidden',
							placeholder: this.config._LABELS.lbl_pleaseDescribeFeature,
							messageWhenValueMissing: this.config._LABELS.errMsg_anEmptyMsgCannotBeSent
						}
					],
					buttons: [
						{
							name: 'cancel',
							label: 'Cancel',
							variant: 'neutral'
						},
						{
							name: 'send',
							label: 'Send',
							variant: 'brand',
							class: 'slds-m-left_x-small'
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
			this.handleStandardCallback(event,'std:request_open');
		}
		if (val.startsWith('delete:dialog')) {
			if (event.detail.action === 'cancel') this.showDialog = false;
			else {
				event.target.setLoading(true);
				this.prepareRecordsToDelete();
				this.handleStandardCallback(event,'std:delete');
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

		//user validation callback
		if(this.config.listViewConfig[0].beforeDeleteValidation !== undefined && 
			this.config.listViewConfig[0].beforeDeleteValidation !== ""){
			let copyRecords = records;
			records = [];
			copyRecords.forEach((el)=>{
				let rec = eval('('+this.config.listViewConfig[0].beforeDeleteValidation+')')(el);
				if(rec){
					records.push(el);
				}
			});
		}

		//chunking the data and sending it to apex
		this.config.deleteIndex = 0;
		this.config.recordsLen = records.length;
		let deleteChunk = this.config.listViewConfig[0].deleteChunkSize ? this.config.listViewConfig[0].deleteChunkSize : 200; //200 is the default value for saveChunk
		let index = 0;

		while(index < records.length){
			let chunk = records.slice(index,records[(parseInt(index)+parseInt(deleteChunk))] ? (parseInt(index)+parseInt(deleteChunk)) : (records.length));
			index += records[(parseInt(index)+parseInt(deleteChunk))] ? parseInt(deleteChunk) : (records.length);
			await this.deleteRecords(chunk);
			// libs.remoteAction(this, 'delRecords', { records: chunk, 
			// 	sObjApiName: this.config.sObjApiName,
			// 	callback: function(cmd,result){
			// 		if(result.delRecordsResult.error.startsWith('Error')){
			// 			const toast = new ShowToastEvent({
			// 				title: 'Error',
			// 				message: result.delRecordsResult.error,
			// 				variant: 'error'
			// 			});
			// 			this.dispatchEvent(toast);
			// 		}else{
			// 			this.config.deleteIndex += result.delRecordsResult.length;
			// 		}
			// 		if(!result.delRecordsResult.error.startsWith('Error') && this.config.deleteIndex === (parseInt(this.config.recordsLen))){
			// 			const toast = new ShowToastEvent({
			// 				title: 'Success',
			// 				message: "Successfully deleted",
			// 				variant: 'success'
			// 			});
			// 			this.dispatchEvent(toast);
			// 			this.showDialog = false;
			// 			this.config.records = this.config.records.filter(ar => !records.find(rm => (rm.Id === ar.Id) ));
			// 			//HYPER-243
			// 			this.allRecords = this.allRecords.filter(ar => !records.find(rm => (rm.Id === ar.Id) ));
			// 			this.template.querySelector('c-Data-Table').updateView();
			// 			this.config.listViewConfig[0].rowChecked = false;
			// 		}
			// 	} 
			// });
		}
		const toast = new ShowToastEvent({
			title: 'Success',
			message: this.config._LABELS.msg_successfullyDeleted,
			variant: 'success'
		});
		this.dispatchEvent(toast);
		this.showDialog = false;
		if(records.length < 1000){
			this.config.records = this.config.records.filter(ar => !records.find(rm => (rm.Id === ar.Id) ));
			// //HYPER-243
			this.allRecords = this.allRecords.filter(ar => !records.find(rm => (rm.Id === ar.Id) ));
			this.template.querySelector('c-Data-Table').updateView();
			this.config.listViewConfig[0].rowChecked = false;
		}else{
			this.loadCfg(false);
		}
	}
	async deleteRecords(chunk){
		try{
			const a = await libs.remoteAction(this, 'delRecords', { records: chunk, 
				sObjApiName: this.config.sObjApiName
			});
		} catch (error) {
			console.log(error);
		}
	}
	async prepareRecordsForSave(){
		let changedItems = this.template.querySelector('c-Data-Table').getRecords().filter(el => {
			return this.config.listViewConfig[0]._changedRecords.indexOf(el.Id) > -1
		});
		
		let validatedRecords = [];

		if(this.config.listViewConfig[0].beforeSaveValidation !== undefined && 
			this.config.listViewConfig[0].beforeSaveValidation !== ""){
			changedItems.forEach((el)=>{
				let rec = eval('('+this.config.listViewConfig[0].beforeSaveValidation+')')(el);
				if(rec){
					validatedRecords.push(el);
				}
			});
		}else{
			validatedRecords = changedItems;
		}

		let saveChunk = this.config.listViewConfig[0].saveChunkSize ? this.config.listViewConfig[0].saveChunkSize : 200; //200 is the default value for saveChunk
		let index = 0;


		while(index <= validatedRecords.length){
			let lIndex = validatedRecords[(parseInt(index)+parseInt(saveChunk))] ? (parseInt(index)+parseInt(saveChunk)) : (validatedRecords.length);
			let chunk = validatedRecords.slice(index,lIndex);
			index += validatedRecords[(parseInt(index)+parseInt(saveChunk))] ? parseInt(saveChunk) : (validatedRecords.length);
			await this.saveRecords(chunk);
		}
		this.resetChangedRecords();
	}
	async saveRecords(chunk){
		try{
			await libs.remoteAction(this, 'saveRecords', { records: chunk, 
				sObjApiName: this.config.sObjApiName,
				rollback:this.config.listViewConfig[0].rollBack ? this.config.listViewConfig[0].rollBack : true,
				beforeSaveAction: this.config.listViewConfig[0].beforeSaveApexAction ? this.config.listViewConfig[0].beforeSaveApexAction : ''
			});
		} catch (error) {
			console.log(error);
		}
	}
	isThereUnsavedRecords(){
		return this.config.listViewConfig[0]._changedRecords ? true : false;
	}

	handleEventCfg(event) {
		if(!this.isThereUnsavedRecords()){
			this.config = libs.getGlobalVar(this.name);
			let variant = this.config.userInfo.isAdminAccess === true ? 'error' : 'shade'; // shade, error, warning, info, confirm
			let fields = [];
			for (let key in this.config.describe) {
				fields.push({ label: this.config.describe[key].label, value: this.config.describe[key].name });
			}
			let lockedOptions = [];
			for (let col of this.config.listViewConfig[0].colModel) {
				lockedOptions.push({ label: col.label, value: col.fieldName });
			}
			//this.config.listViewConfig.isShowCheckBoxes = true;
			this.config.dialog = {
				"title": this.config.userInfo.isAdminAccess === true ? this.config._LABELS.title_listViewConfiguration + ' ' +  this.config?.listView?.name: this.config._LABELS.title_selectFieldToDisplay + ' ' +  this.config?.listView?.name,
				"variant": variant,
				"css": 'slds-modal__header slds-theme_{1} slds-theme_alert-texture'.replace('{1}', variant),
				"options": libs.sortRecords(fields, 'label', true),
				"selectedFields": this.config.fields,
				"requiredOptions": this.config.lockedFields,
				"lockedOptions": libs.sortRecords(lockedOptions, 'label', true),
				"lockedFields": this.config.lockedFields,
				"handleEvent": this.handleEventDialog.bind(this),
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
			this.config.dialog.field = event.detail.value;
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
			} /*else {
				field = { 'fieldName': this.config.dialog.field };
				field[param] = value;
				this.config.dialog.listViewConfig.colModel.push(field);
			}*/ //we will return this part in case that we will have a fieldPiecker component
		}
		if (val === 'dialog:setTableParam') {
			

			let param = event.target.getAttribute('data-param');
			let type = event.target.getAttribute('data-type');
			let value = (type === 'checkbox') ? event.target.checked : event.target.value;
			console.log(type, param, value);

			this.config.dialog.listViewConfig[param] = value;

			console.log('saving table params', param, this.config.dialog.listViewConfig[param]);
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
			this.config.dialog.title = this.config.userInfo.isAdminAccess === true ? this.config._LABELS.title_listViewConfiguration + ' ' +  this.config?.listView?.name: this.config._LABELS.title_selectFieldToDisplay + ' ' +  this.config?.listView?.name;
			this.config.dialog.saveAs = false;
		}
		if (val === 'dialog:saveAsName') {
			this.config.dialog.listViewName = event.target.value;
		}
		if (val === 'dialog:saveAsLabel') {
			this.config.dialog.listViewLabel = event.target.value;
		}
		if (val === 'dialog:saveAsFinish') {
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
		let tmp = JSON.parse(JSON.stringify(this.config.dialog.listViewConfig));
		for (let key in tmp) {
			if (key.startsWith('_')) delete tmp[key];
		}
		console.log(tmp);
		let cnfg = [];
		cnfg.push(tmp);
		return JSON.stringify(cnfg, null, '\t');
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
				this.handleEventExport(event);
				this.handleStandardCallback(event,val);
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
						defaultFieldValues: encodeDefaultFieldValues(defValue)
					}
				});
				this.handleStandardCallback(event,val);
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
					history.back();
				}else{
					this[NavigationMixin.Navigate]({
						type: 'standard__navItemPage',
						attributes: {
							apiName: 'XRL__EXRL',
						},
						state: {
							c__apiName: btoa(this.apiName),
							c__name: btoa(this.name),
							c__recordId: btoa(this.recordId)
						}
					});
				}
				this.handleStandardCallback(event,val);
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
				this.template.querySelector('c-Data-Table').updateView();
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

	handleEventFlow(action){	
		let records = this.template.querySelector('c-Data-Table').getSelectedRecords();

		let recordIdList;
		if (records.length !== 0) {
			recordIdList = records.map(rec => rec.Id);
			
			libs.remoteAction(this, 'invokeAction', { name: action.name, recordIdList: recordIdList, callback: (cmd, data) => {
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
		}else{
			const event = new ShowToastEvent({
				title: 'Error',
				message: this.config._LABELS.lbl_deleteNoRecordSelectedError,
				variant: 'error'
			});
			this.dispatchEvent(event);
		}
	}

	handleEventExport(event) {

		let records = this.template.querySelector('c-Data-Table').getSelectedRecords().length != 0 ?
						this.template.querySelector('c-Data-Table').getSelectedRecords() :
						this.template.querySelector('c-Data-Table').getRecords();
		let locale = libs.getGlobalVar(this.name).userInfo.locale;

		console.log(JSON.parse(JSON.stringify(this.config)));
		console.log(JSON.parse(JSON.stringify(records)));

		let wb = XLSX.utils.book_new();
		wb.cellStyles = true;
		wb.Props = {
			Title: this.config.sObjLabel + ' ' + this.config?.listView?.label,
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
		let columns = this.config.listViewConfig[0].colModel.filter(col => { return !col.isHidden; });
		records.forEach((rec, i) => {
			columns.forEach((col, j) => {
				if (i === 0) {
					let cell_ref = XLSX.utils.encode_cell({ c: j, r: i });
					ws[cell_ref] = {
						v: col.label, s: { bold: true, fgColor: { rgb: 0 }, color: { rgb: 16777215 } }
					}
					ws['!cols'].push({ wch: 40 });
				}
				let cell_ref = XLSX.utils.encode_cell({ c: j, r: i + 1 });
				ws[cell_ref] = {
					s: i % 2 ? evenStyle : oddStyle
				};
				console.log('HERE',rec[col.referenceTo] ? JSON.parse(JSON.stringify(rec[col.referenceTo]))[col.fieldName.split('.')[1]] : 'null');
				switch (col.type) {
					case 'reference':
						let [r, v] = libs.getLookupRow(rec, col.fieldName);
						ws[cell_ref].v = r.Name;
						ws[cell_ref].l = { Target: window.location.origin + '/' + v, Tooltip: window.location.origin + '/' + v };

						break;
					case 'date':
					case 'datetime':
						// ws[cell_ref].v = col.referenceTo ? new Date(rec[col.fieldName.split('.')[0]][col.fieldName.split('.')[1]]) : new Date(rec[col.fieldName]);
						//.toLocaleString(locale);
						if(rec[col.fieldName.split('.')[0]] && rec[col.fieldName.split('.')[0]][col.fieldName.split('.')[1]]){
							ws[cell_ref].v = new Date(rec[col.fieldName.split('.')[0]][col.fieldName.split('.')[1]]);
						}else{
							ws[cell_ref].v = col.referenceTo != undefined ? rec[col.referenceTo][col.fieldName.split('.')[1]] ? new Date(rec[col.referenceTo][col.fieldName.split('.')[1]]) : '' : rec[col.fieldName] ? new Date(rec[col.fieldName]) : '';
						}
						ws[cell_ref].t = 'd';

						break;
					case 'number':
						// ws[cell_ref].v = rec[col.fieldName] ? Number(rec[col.fieldName]) : '';
						if(rec[col.fieldName.split('.')[0]] && rec[col.fieldName.split('.')[0]][col.fieldName.split('.')[1]]){
							ws[cell_ref].v = Number(rec[col.fieldName.split('.')[0]][col.fieldName.split('.')[1]]);
						}else{
							ws[cell_ref].v = col.referenceTo != undefined ? rec[col.referenceTo][col.fieldName.split('.')[1]] ? Number(rec[col.referenceTo][col.fieldName.split('.')[1]]) : '' : rec[col.fieldName] ? Number(rec[col.fieldName]) : '';
						}
						ws[cell_ref].t = 'n';
						break;
					case 'boolean':
						// ws[cell_ref].v = Boolean(rec[col.fieldName]);
						if(rec[col.fieldName.split('.')[0]] && rec[col.fieldName.split('.')[0]][col.fieldName.split('.')[1]]){
							ws[cell_ref].v = Boolean(rec[col.fieldName.split('.')[0]][col.fieldName.split('.')[1]]);
						}else{
							ws[cell_ref].v = col.referenceTo != undefined ? rec[col.referenceTo][col.fieldName.split('.')[1]] ? Boolean(rec[col.referenceTo][col.fieldName.split('.')[1]]) : '' : rec[col.fieldName] ? Boolean(rec[col.fieldName]) : '';
						}
						ws[cell_ref].t = 'b';
						break;
					default:
						if(rec[col.fieldName.split('.')[0]] && rec[col.fieldName.split('.')[0]][col.fieldName.split('.')[1]]){
							ws[cell_ref].v = rec[col.fieldName.split('.')[0]][col.fieldName.split('.')[1]];
						}else{
							ws[cell_ref].v = col.referenceTo != undefined ? rec[col.referenceTo][col.fieldName.split('.')[1]] ? rec[col.referenceTo][col.fieldName.split('.')[1]] : '' : rec[col.fieldName] ? rec[col.fieldName] : '';
						}
						ws[cell_ref].t = 's';
				}
			});
		});
		ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: columns.length, r: records.length } });
		console.log(ws);
		console.log(ws['!cols']);
		console.log(ws['!ref']);
		XLSX.utils.book_append_sheet(wb, ws, (this.config.sObjLabel + ' '  + this.config?.listView?.label).length > 30 ? (this.config.sObjLabel + ' '  + this.config?.listView?.label).substring(0,30):(this.config.sObjLabel + ' '  + this.config?.listView?.label));
		XLSX.writeFile(wb, this.config.sObjLabel + ' ' + this.config?.listView?.label + '.xlsx', { cellStyles: true, WTF: 1 });
		
		//deselecting the records if there is any
		this.template.querySelector('c-Data-Table').updateView();
	}

	handleStandardCallback(actionData,val){
		let action = actionData ? actionData : this.config.listViewConfig[0].actions.find((el)=>{
			return el.actionId == val;
		});
		if(action.actionCallBack != ''){
			eval('(' + action.actionCallBack + ')')(this.template.querySelector('c-Data-Table').getSelectedRecords());
		}
	}
}