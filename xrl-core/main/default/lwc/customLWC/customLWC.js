import { LightningElement,track,api } from 'lwc';
import { libs } from 'c/libs';

export default class CustomLWC extends LightningElement {
    @api apiName;
    @api name;
    @api defaultListView;
    @api recordId;
    @track config ={};

    connectedCallback(){
        libs.remoteAction(this, 'getCustomLabels', {callback: 
        function(cmd,data){
            this.config._LABELS = data[cmd];
        } });
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
        console.log(JSON.parse(JSON.stringify(this.config)));
        libs.remoteAction(this, 'getConfig', { sObjApiName: this.config.sObjApiName, relField: this.config.relField, listViewName: 'user1', callback: this.setConfig.bind(this) });
    }
    setConfig(cmd, data) {
		console.log(cmd, JSON.parse(JSON.stringify(data)), JSON.parse(JSON.stringify(data[cmd])));
		libs.getGlobalVar(this.name).userInfo = data.userInfo;

		let adminConfig = (data[cmd].baseConfig) ? JSON.parse(data[cmd].baseConfig) : {};
		let userConfig = (data[cmd].userConfig) ? JSON.parse(data[cmd].userConfig) : {};
		if (userConfig.colModel === undefined){
			userConfig.colModel = [{
				"fieldName" : "Id"
			}];
		} 

		let mergedConfig = {};
		Object.assign(mergedConfig, userConfig);
		mergedConfig.colModel = [];

		let baseColMap = new Map();
		adminConfig?.colModel?.forEach(col => {
			baseColMap.set(col.fieldName, col);
		});
		userConfig?.colModel?.forEach(col => {
			if (baseColMap.has(col.fieldName)) {
				let mergedCol = Object.assign(baseColMap.get(col.fieldName), col);
				mergedConfig.colModel.push(mergedCol);
				baseColMap.delete(col.fieldName)
			} else {
				mergedConfig.colModel.push(col);
			}
		});
		mergedConfig.colModel.push(...Array.from(baseColMap.values()));

		this.config.listViewConfig = mergedConfig;
		this.config.listView = data[cmd].listViews.find(v => { return v.isUserConfig;});

		this.config.describe = data[cmd].describe ? JSON.parse(data[cmd].describe) : {};
		if (this.config.userInfo.isAdminAccess) {
			this.listViews = data[cmd].listViews.map(v => {return {label: v.label ? v.label : v.name, value: v.name};});
		} else {
			this.listViews = data[cmd].listViews.filter(v => { return !v.isAdminConfig;}).map(v => {return {label: v.label ? v.label : v.name, value: v.name};});
		}		

		this.config.fields = [];
		this.config.listViewConfig?.colModel?.forEach(e => {
			let describe = this.config.describe[e.fieldName];
			if (describe && describe.type === 'reference') {
				this.config.fields.push(describe.relationshipName + '.Name');
			}
			this.config.fields.push(e.fieldName);
		});
		
		this.loadRecords();		
	}
    loadRecords() {
		libs.remoteAction(this, 'query', {
			isNeedDescribe: true,
			sObjApiName: this.config.sObjApiName,
			relField: this.config.relField,
			addCondition: '',
			fields: this.config.fields,
			listViewName: this.defaultListView,
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
		this.config.listViewConfig.colModel.forEach(e => {
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
        this.config.isServerFilter = true;
	}
}