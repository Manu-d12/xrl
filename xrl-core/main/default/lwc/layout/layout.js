import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';

export default class Layout extends LightningElement {
	@api recordId;
	@api defaultListView;	
	@api configuration;
	@api configId;

	@track config = {};
	@track localConfig = {};
	@track listViews = [];
	LABELS = {};
	allRecords = [];

	@track showDialog = false;
	@track dialogCfg;
	@track dataTableConfig;
    @track components;
	@track name;

    connectedCallback() {
		console.log('RENDERED');
		this.name = this.configId.split('::')[1];
		this.configId = this.configId.split('::')[0];
		this.loadCfg(true);
	}

	setCustomLabels(cmd, data) {
		console.log('CustomLabes are loaded', data[cmd]);
		this.config._LABELS = data[cmd];
	}

	loadCfg(isInit) {
		libs.remoteAction(this, 'getCustomLabels', {callback: this.setCustomLabels.bind(this) });
		this.localConfig = {};

		let cfg = libs.loadConfig(this.name);
		if (cfg !== undefined) {
			this.localConfig = cfg;
			libs.setGlobalVar(this.name, {});
		} else {
			libs.setGlobalVar(this.name, {});
		}
		this.config = libs.getGlobalVar(this.name);
		

		if (this.configuration) {
			this.setConfig('getConfigResult', this.configuration);
		} else {
			libs.remoteAction(this, 'getConfigById', { configId: this.configId, callback: this.getWholeConfig.bind(this) });
		}
	}
	getWholeConfig(cmd,data){
		let jsonDetails = JSON.parse(JSON.stringify(data[cmd].listViews));
		this.config.listViewName = jsonDetails[0].name;
		this.config.sObjApiName = jsonDetails[0].sObjApiName;
		this.config.relField = jsonDetails[0].relFieldName;
		libs.remoteAction(this, 'getConfig', { sObjApiName: jsonDetails[0].sObjApiName, relField: jsonDetails[0].relFieldName, listViewName: jsonDetails[0].name, callback: this.setConfig.bind(this) });
	}

	setConfig(cmd, data) {
		console.log(cmd, JSON.parse(JSON.stringify(data)), JSON.parse(JSON.stringify(data[cmd])));
		libs.getGlobalVar(this.name).userInfo = data.userInfo;

		let adminConfig = (data[cmd].baseConfig) ? JSON.parse(data[cmd].baseConfig) : {};
		let userConfig = (data[cmd].userConfig) ? JSON.parse(JSON.stringify(data[cmd].userConfig)) : {};

		console.log('adminConfig', adminConfig);
		console.log('userConfig', JSON.parse(userConfig));

		let dataTableConfig;
		let adminDataTableConfig = adminConfig;
		userConfig = JSON.parse(userConfig);
		userConfig.forEach((el)=>{
			if(el.cmpName === 'dataTable') {
				dataTableConfig = el;
			}
		});

		if (dataTableConfig.colModel === undefined){
			dataTableConfig.colModel = [{
				"fieldName" : "Id"
			}];
		} 

		let mergedConfig = {};
		Object.assign(mergedConfig, dataTableConfig);
		mergedConfig.colModel = [];

		let baseColMap = new Map();
		adminDataTableConfig?.colModel?.forEach(col => {
			baseColMap.set(col.fieldName, col);
		});
		dataTableConfig?.colModel?.forEach(col => {
			if (baseColMap.has(col.fieldName)) {
				let mergedCol = Object.assign(baseColMap.get(col.fieldName), col);
				mergedConfig.colModel.push(mergedCol);
				baseColMap.delete(col.fieldName)
			} else {
				mergedConfig.colModel.push(col);
			}
		});
		mergedConfig.colModel.push(...Array.from(baseColMap.values()));
		dataTableConfig.colModel = mergedConfig.colModel;
		// Object.assign(mergedConfig, userConfig);
		userConfig.forEach((el)=>{
			if(el.cmpName === 'dataTable') {
				el = dataTableConfig;
			}
		});
		console.log('mergedConfig', userConfig);

		this.config.listViewConfig = userConfig;
		this.config.listViewConfig.forEach((el)=>{
			if(el.cmpName === 'dataTable') {
				this.dataTableConfig =  el;
			}
		});
		this.config.listView = data[cmd].listViews.find(v => { return v.isUserConfig;});
		console.log(JSON.stringify(this.config.listView));
		this.config.currency =  data[cmd].currency;
		//if (this.config.userInfo.isAdminAccess === true) delete this.localConfig.listViewName;
		this.config.describe = data[cmd].describe ? JSON.parse(data[cmd].describe) : {};
		if (this.config.userInfo.isAdminAccess) {
			this.listViews = data[cmd].listViews.map(v => {return {label: v.label ? v.label : v.name, value: v.name};});
		} else {
			this.listViews = data[cmd].listViews.filter(v => { return !v.isAdminConfig;}).map(v => {return {label: v.label ? v.label : v.name, value: v.name};});
		}		

		this.config.fields = [];
		this.config.lockedFields = [];
		
		this.dataTableConfig?.colModel?.forEach(e => {
			let describe = this.config.describe[e.fieldName];
			if (describe && describe.type === 'reference') {
				this.config.fields.push(describe.relationshipName + '.Name');
				if (e.locked) this.config.lockedFields.push(describe.relationshipName + '.Name');
			}
			this.config.fields.push(e.fieldName);
			if (e.locked) this.config.lockedFields.push(e.fieldName);
		});
		
		// Temporary
		this.config.isGlobalSearch=this.dataTableConfig.isGlobalSearch;

		console.log('this.config', this.config);

		this.loadRecords();		
	}

	loadRecords() {
		libs.remoteAction(this, 'query', {
			isNeedDescribe: true,
			sObjApiName: this.config.sObjApiName,
			relField: this.config.relField,
			addCondition: this.config.listViewConfig.addCondition,
			fields: this.config.fields,
			listViewName: this.config?.listViewName,
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
		this.dataTableConfig.colModel.forEach(e => {
			let describe = this.config.describe[e.fieldName];
			if (e.label === undefined) e.label = describe.label;
			if (e.type === undefined) e.type = describe.type;
			e.updateable = describe.updateable;
			e.isNameField = describe && describe.nameField === true;
			if (e.type === 'picklist') {
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
		});
		this.config.listViewConfig.forEach((el)=>{
			if(el.cmpName === 'dataTable') {
				el=this.dataTableConfig;
			}
		});
        this.components = [];
        this.config.listViewConfig.forEach((el,index)=>{
			if(el.cmpName === 'dataTable') this.components.push({isDataTable:true,key:'sFilter'+index});
            if(el.cmpName === 'serversideFilter') this.components.push({isServerFilter:true,key:'dataTable'+index});
		});
	}
	handleChildMessage(event){
		if(event.detail.cmd.startsWith('dataTable:')) {
			this.template.querySelector('c-Data-Table').handleEventMessage(event);
		}
		if(event.detail.cmd.startsWith('global:')) this.handleGlobalMessage(event);
	}
	handleGlobalMessage(event){

	}
}