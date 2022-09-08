import { LightningElement, api, track,wire } from 'lwc';
import { libs } from 'c/libs';
import {subscribe,MessageContext} from "lightning/messageService";
import ACCOUNT_CHANNEL from "@salesforce/messageChannel/AccountDataMessageChannel__c";

export default class LoadConfig extends LightningElement {
    @track apiName;
	@track name;
	@api recordId;
	@api defaultListView;	
	@api configuration;

	@track config = {};
	@track localConfig = {};
	@track listViews = [];
	LABELS = {};
	allRecords = [];

	@track showDialog = false;
	@track dialogCfg;
	@track dataTableConfig;
    @track components;

    @wire(MessageContext)
  		messageContext;
	receivedMessage;
	subscription = null;
    handleSubscribe() {
		console.log("in handle subscribe");
		console.log(this.subscription);
		if (this.subscription) {
		  	return;
		}
	
		//4. Subscribing to the message channel
		this.subscription = subscribe(
		  this.messageContext,
		  ACCOUNT_CHANNEL,
		  (message) => {
			this.handleMessage(message);
		  }
		);
	  }
	
	handleMessage(message) {
		this.receivedMessage = message ? message : "no message";
		console.log(this.receivedMessage);
		if(this.receivedMessage){
			console.log(JSON.parse(this.receivedMessage.apiName));
			this.apiName = this.receivedMessage.apiName;
            this.name = this.receivedMessage.name;
			this.loadCfg(true);
		}
	}
    connectedCallback() {
		console.log('RENDERED');
        this.handleSubscribe();
		// this.loadCfg(true);
	}

	setCustomLabels(cmd, data) {
		console.log('CustomLabes are loaded', data[cmd]);
		this.config._LABELS = data[cmd];
	}

	loadCfg(isInit) {
		libs.remoteAction(this, 'getCustomLabels', {callback: this.setCustomLabels.bind(this) });
		let apiNames = this.apiName.split(':');
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

		let adminConfig = (data[cmd].baseConfig) ? JSON.parse(data[cmd].baseConfig) : {};
		let userConfig = (data[cmd].userConfig) ? JSON.parse(JSON.stringify(data[cmd].userConfig)) : {};

		console.log('adminConfig', adminConfig);
		console.log('userConfig', JSON.parse(userConfig));

		let dataTableConfig;
		let adminDataTableConfig = adminConfig;
		// adminConfig = JSON.parse(adminConfig);
		// adminConfig.forEach((el)=>{
		// 	if(el.cmpName === 'dataTable') {
		// 		adminDataTableConfig = el;
		// 	}
		// });
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
}