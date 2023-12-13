import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';
import { NavigationMixin } from "lightning/navigation"
import { encodeDefaultFieldValues, decodeDefaultFieldValues } from 'lightning/pageReferenceUtils'

export default class Layout extends NavigationMixin(LightningElement) {
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
	@track tabConfigName;

    connectedCallback() {
		console.log('RENDERED');
		this.name = this.configId.replaceAll(':','');
		this.tabConfigName = this.name;
		// this.configId = this.configId;
		this.loadCfg(true);
		libs.getGlobalVar(this.tabConfigName).componentsInLayout = [];
		libs.getGlobalVar(this.tabConfigName).componentsInLayout.push({uniqueName: this.configId});
		window.addEventListener("resize", this.handleResize.bind(this));
		//postMessage listener to communicate between different Layout components
		//need to listen improve the security concerns to block messages from unauthorized access
		if(!window.location.href.includes('flexipageEditor')){
			window.addEventListener(
				"message",this.listenEvent.bind(this),
				false,
			);
		}
	}
	// function(selectedRecords,scope,libs){
	// 	const message = new Map();
	// 		message.set('master_Item_table',
	// 		{
	// 			'refresh':{
	// 			  'sendAcknowledgementTo': 'StrataVAR__MasterItem__c:Id:true:StrataVAR__MasterItem__c_Bundletab',
	// 				'sObjApiName': "pqwqa15__Master_Item__c",
	// 				fields: ['Id', 'Name', 'pqwqa15__Part_Number__c', 'pqwqa15__Description__c', 'pqwqa15__Source__c', 'pqwqa15__Vendor__c', 'pqwqa15__Manufacturer__c'],
	// 			}
	// 		});
	// 		message.set('0',
	// 		{
	// 			'refresh':{ }
	// 		});
	// 	libs.broadcastMessage(this,message);
	// }
	listenEvent(event){
		if(event.data.size === 0) return;
		let isMatchingUniqueName = libs.findMatchingKey(event.data,libs.getGlobalVar(this.tabConfigName).componentsInLayout);
		if(isMatchingUniqueName !== undefined && isMatchingUniqueName.length > 0) {
			console.log("Message received", event.data);
			if(event.data.get(this.configId)){
				console.log('Acknowledgement',event.data.get(this.configId)['status']);
				return;
			}
			this.handlePostMessageEvents(event.data,isMatchingUniqueName);
		}
	}
	handlePostMessageEvents(message,isMatchingUniqueName){
		isMatchingUniqueName.forEach((element) => {
			let operations = JSON.parse(JSON.stringify(message.get(element.uniqueName)));
			if(element.uniqueName === this.configId){
				//this operations will be performed on this layout element
				/* eslint-disable */
				for (const operation in operations) {
					console.log('operations',operation,operations[operation]);
					if(operation === 'refresh'){
						console.log('Refreshing Whole Layout...');
						this.name = this.configId.replaceAll(':','');
						// this.tabConfigName = this.name;
						libs.getGlobalVar(this.tabConfigName).componentsInLayout = [];
						libs.getGlobalVar(this.tabConfigName).componentsInLayout.push({uniqueName: this.configId});
						this.loadCfg(true);
					}
				}
			}else{
				this.template.querySelectorAll('c-Data-Table')?.forEach(ch => {
					if (element.uniqueName === ch.cfg) ch.handlePostMessageEvents(operations);
				});
			}
		});
	}

	setCustomLabels(cmd, data) {
		console.log('CustomLabels are loaded', data[cmd]);
		this.config._LABELS = data[cmd];
		this.LABELS = data[cmd];
		libs.setGlobalVar('_LABELS', data[cmd]);
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
			libs.remoteAction(this, 'getConfigByUniqueName', { uniqueName: this.configId, callback: this.getWholeConfig.bind(this) });
		}
	}
	async getWholeConfig(cmd,data){
		libs.getGlobalVar(this.name).describe = data[cmd].describe ? JSON.parse(data[cmd].describe) : {};
		let jsonDetails = JSON.parse(JSON.stringify(data[cmd].listViews));
		libs.getGlobalVar(this.tabConfigName).userInfo = data.userInfo;
		if(jsonDetails[0].configType === 'Tabular'){
			console.log('In Tabular');
			this.handleTabularFormat(data[cmd]);
		}else{
			await this.setConfig(cmd,data);
			this.components = [];
			this.config.listViewConfig.forEach((el,index)=>{
				console.log('cmpName',el.cmpName);
				if(el.cmpName === 'dataTable') this.components.push({isDataTable:true,key:'sFilter'+index,uniqueName:el.uniqueName});
				if(el.cmpName === 'serversideFilter') this.components.push({isServerFilter:true,key:'dataTable'+index,uniqueName:el.uniqueName});
				if(el.cmpName === 'chart') this.components.push({isChart:true,key:'chart'+index,uniqueName:el.uniqueName});
				if(el.cmpName === 'chevron') this.components.push({isChevron:true,key:'chevron'+index,uniqueName:el.uniqueName});
				if(el.cmpName === 'actionBar') this.components.push({isActionBar:true,key:'actionBar'+index,uniqueName:el.uniqueName});
			});
			// this.config.listViewName = jsonDetails[0].name;
			// this.config.sObjApiName = jsonDetails[0].sObjApiName;
			// this.config.relField = jsonDetails[0].relFieldName;
			// libs.remoteAction(this, 'getConfig', { sObjApiName: jsonDetails[0].sObjApiName, relField: jsonDetails[0].relFieldName, listViewName: jsonDetails[0].name, callback: this.setConfig.bind(this) });
		}
	}

	async setConfig(cmd, data) {
		console.log(cmd, JSON.parse(JSON.stringify(data)), JSON.parse(JSON.stringify(data[cmd])));
		libs.getGlobalVar(this.name).userInfo = data.userInfo;
		libs.getGlobalVar(this.name).Financial = data.Financial;
		
		this.config.listViewConfig = data[cmd].userConfig ? JSON.parse(data[cmd].userConfig) : [];
		this.config.currency = data[cmd].currency;
		this.config.describe = data[cmd].describe ? JSON.parse(data[cmd].describe) : {};
		this.config.fields = [];
		this.config.lockedFields = [];
		
		const dataTableConfig = this.config.listViewConfig.find(config => config.cmpName === 'dataTable');
		if (!dataTableConfig) {
			this.config.listViewConfig.push({
				cmpName: 'dataTable',
				colModel: [{
					fieldName: 'Id',
					updateable: false,
					isNameField: false,
					isEditable: false,
					isFilterable: true,
					isSortable: true
				}]
			});
		}
		
		const mergedConfig = {
			...dataTableConfig,
			colModel: dataTableConfig.colModel.reduce((acc, col) => {
				const existingCol = acc.find(c => c.fieldName === col.fieldName);
				if (existingCol) {
					acc[acc.indexOf(existingCol)] = {...existingCol, ...col};
				} else {
					acc.push(col);
				}
				return acc;
			}, [])
		};
		
		this.config.listViewConfig[this.config.listViewConfig.indexOf(dataTableConfig)] = mergedConfig;
		console.log('mergedConfig', this.config.listViewConfig);
		
		dataTableConfig.colModel.forEach(col => {
			this.config.fields.push(col.fieldName);
		});
		dataTableConfig.rowChecked = false;
		
		console.log('this.config', this.config, JSON.parse(JSON.stringify(this.config)));
		this.config.relField = data[cmd].listViews[0].relField;
		this.config.sObjApiName = data[cmd].listViews[0].sObjApiName;
		const records = await libs.remoteAction(this, 'query', {
			isNeedDescribe: true,
			sObjApiName: this.config.sObjApiName,
			relField: this.config.relField,
			addCondition: this.config.listViewConfig[0].addCondition,
			orderBy: this.config.listViewConfig[0].orderBy,
			fields: this.config.fields,
			listViewName: this.config.listView?.name,
			callback: ((nodeName, data) => {
				console.log('length', data[nodeName].records);
				
				libs.getGlobalVar(this.name).records = data[nodeName].records.length > 0 ? data[nodeName].records : undefined;
				
				this.config.records = libs.getGlobalVar(this.name).records;
				this.allRecords = this.config.records;
				
				console.log('loadRecords', libs.getGlobalVar(this.name));
				return new Promise(resolve => {
					resolve();
				});
			})
		})
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
	}
	handleChildMessage(event){
		if(event.detail.cmd.startsWith('filter:')) {
			let comp = this.config.tabularConfig.dataModel.find(cmp => cmp.uniqueName === event.detail.source);
			this.template.querySelectorAll('c-Data-Table')?.forEach(ch => {
				if (comp?.targets?.includes(ch.cfg) || event.detail.targets?.includes(ch.cfg)) ch.handleEventMessage(event);
			});
			if (event.detail.cmd.split(':')[1] === 'refresh') this.template.querySelectorAll('c-chartjs')?.forEach(ch => {
				if (comp?.targets?.includes(ch.name) || event.detail.targets?.includes(ch.cfg)) ch.handleEventMessage(event);
			});
		} else if(event.detail.cmd.startsWith('chart:')) {
			this.template.querySelectorAll('c-Data-Table')?.forEach(ch => {
				ch.handleEventMessage(event);
				ch.parentElement.parentElement.classList.add('slds-is-open');
				ch.parentElement.parentElement.scrollIntoView(true, {behavior: 'smooth'});
			});
		} else if(event.detail.cmd.startsWith('chevron:')) {
			if (event.detail.cfg) {
				this.configId = event.detail.cfg;
				this.connectedCallback();
				this.isLoaded = false;
			}
		}
		if(event.detail.cmd.startsWith('global:')) this.handleGlobalMessage(event);
	}
	handleGlobalMessage(event){

	}
	async handleTabularFormat(configData) {
		try {
			// Set table configuration
			this.tabConfigName = this.name;
			this.config.tabularConfig = JSON.parse(configData.userConfig);
			this.config.rows = this.config.tabularConfig.tableDefinition.rows;
			this.config.sObjApiName = configData?.listViews[0]?.sObjApiName;
			this.config.cols = this.config.tabularConfig.tableDefinition.cols;
			let colSize = 12 / parseInt(this.config.cols);
			// let sortedDataModel = this.config.tabularConfig.dataModel.toSorted((a, b) => {return a.cmpName === 'actionBar' ? 1 : 0;});

			let result;
			let count = 0;
			
			await libs.remoteAction(this, 'query', {
				isNeedDescribe: true,
				sObjApiName: libs.getNameSpace() + 'extRelListConfig__c',
				addCondition: libs.replaceLiteralsInStr("Parent__r.uniqKey__c='" + this.configId +"' AND Is_Active__c = true",this.name),
				orderBy: 'ORDER BY loadIndex__c ASC NULLS LAST',
				fields: ['Id','Name','listViewLabel__c','sObjApiName__c','uniqKey__c','relFieldApiName__c','loadIndex__c','JSON__c'],
				callback: ((nodeName, data) => {
					result = data[nodeName];
				})
			});
			libs.getGlobalVar(this.tabConfigName).tabularConfig.dataModel = [];

			// Loop through data model components
			for (let cmp of result?.records) {

				cmp = JSON.parse(cmp[libs.getNameSpace() +'JSON__c']);
				cmp.uniqueName = result?.records[count][libs.getNameSpace() +'uniqKey__c'].split(':')[3] !== undefined ? result?.records[count][libs.getNameSpace() +'uniqKey__c'].split(':')[3] : result?.records[count][libs.getNameSpace() +'uniqKey__c'].split(':')[0];
				
				cmp.class = this.config.cols != 12 ? `slds-col slds-size_${cmp.colSize || colSize}-of-12` : 'slds-col slds-size_12-of-12';

				// Check if component is blank or text
				if (cmp.isBlank) {
					console.log('This is Blank');
					continue;
				} else if (cmp.isText) {
					console.log('This is text');
					continue;
				} else if (!cmp.isCmp && !cmp.isCollapsible) {
					continue;
				}
		
				// Check if component is DataTable or ServerSideFilter
				cmp.isDataTable = cmp.cmpName === 'dataTable';
				cmp.isServerFilter = cmp.cmpName === 'serversideFilter';
				cmp.isChart = cmp.cmpName === 'chart';
				cmp.isChevron = cmp.cmpName === 'chevron';
				cmp.isActionBar = cmp.cmpName === 'actionBar';
				cmp.isComparisonInterface = cmp.cmpName === 'comparisonInterface';
				
				if(libs.getGlobalVar(this.tabConfigName).componentsInLayout === undefined) {
					libs.getGlobalVar(this.tabConfigName).componentsInLayout = [{uniqueName: this.configId}];
				}
				libs.getGlobalVar(this.tabConfigName).componentsInLayout.push({uniqueName: cmp.uniqueName});
				// Set component configuration
				this.name = cmp.uniqueName;
				let configUniqueName = cmp.configUniqueName;
		
				libs.setGlobalVar(this.name, {});
				this.config = libs.getGlobalVar(this.name);
				Object.assign(this.config, {
				'_LABELS': this.LABELS
				});

				// Call getConfigById for DataTable or ServerSideFilter
				if (cmp.isDataTable) {
					let dtConfig = {
						userConfig: JSON.stringify([cmp]),
						userInfo: libs.getGlobalVar(this.tabConfigName).userInfo,
						financial: configData?.Financial,
						currency: configData?.currency,
						describe: libs.getGlobalVar(this.tabConfigName).describe,
						relField: result?.records[count][libs.getNameSpace() +'relFieldApiName__c']
					}
					this.setConfigTabular(dtConfig);
				} else if (cmp.isServerFilter) {
					this.config.listViewConfig = (cmp) ? JSON.parse(JSON.stringify([cmp]).replace(/\s{2,}/g, ' ')) : [];
					this.config.sObjApiName = result?.records[count][libs.getNameSpace() +'sObjApiName__c'];
					this.config.relField = result?.records[count][libs.getNameSpace() +'relFieldApiName__c'];
					this.config.financial = (configData?.Financial) ? configData?.Financial : {};
					this.config.describe = libs.getGlobalVar(this.tabConfigName).describe;
					this.config.userInfo = (libs.getGlobalVar(this.tabConfigName).userInfo) ? libs.getGlobalVar(this.tabConfigName).userInfo : {};
				} else if (cmp.isChart) {
					// await libs.remoteAction(this, 'getConfigByUniqueName', { uniqueName: configUniqueName, callback: function(cmd, data) {
					// 	this.config.chartConfig = (data[cmd].userConfig) ? JSON.parse(data[cmd].userConfig.replace(/\s{2,}/g, ' ')) : [];
					// } });
					this.config.chartConfig = (cmp) ? JSON.parse(JSON.stringify([cmp]).replace(/\s{2,}/g, ' '))[0] : [];
				} else if (cmp.isChevron) {
					// await libs.remoteAction(this, 'getConfigByUniqueName', { uniqueName: configUniqueName, callback: function(cmd, data) {
					// 	this.config.chevronConfig = (data[cmd].userConfig) ? JSON.parse(data[cmd].userConfig.replace(/\s{2,}/g, ' ')) : [];
					// } });
					this.config.chevronConfig = (cmp) ? JSON.parse(JSON.stringify([cmp]).replace(/\s{2,}/g, ' '))[0] : [];
				} else if (cmp.isActionBar) {
					this.config.actionsBar = (cmp) ? JSON.parse(JSON.stringify([cmp]).replace(/\s{2,}/g, ' ')) : [];
					cmp.config = {
						'actions': this.config.actionsBar[0]?.actions || [],
						'_handleEvent': this.handleEvent.bind(this),
						'_cfgName': cmp.tableName,
						'_barName': this.name
					};
				}else if(cmp.isComparisonInterface){
					this.config.describe = libs.getGlobalVar(this.tabConfigName).describe;
					this.config.userInfo = (libs.getGlobalVar(this.tabConfigName).userInfo) ? libs.getGlobalVar(this.tabConfigName).userInfo : {};
					this.config.comparisonInterface = (cmp) ? JSON.parse(JSON.stringify([cmp]).replace(/\s{2,}/g, ' '))[0] : [];
				}
				libs.getGlobalVar(this.tabConfigName).tabularConfig.dataModel.push(cmp);
				count++;
			}
	
			// Set global configuration
			this.config = libs.getGlobalVar(this.tabConfigName);
			this.config.isTabular = true;
			this.config.isLoaded = true;
			setTimeout(() => this.toggleOnInit(), 100);
		} catch (error) {
			console.error(error);
		}
	}

	async setConfigTabular(dtConfig) {
		libs.getGlobalVar(this.name).userInfo = dtConfig.userInfo;
		libs.getGlobalVar(this.name).financial = dtConfig.Financial;
		
		this.config.listViewConfig = dtConfig.userConfig ? JSON.parse(dtConfig.userConfig.replace(/\s{2,}/g, ' ')) : [];
		this.config.currency = dtConfig.currency;
		this.config.describe = dtConfig.describe ? dtConfig.describe : {};
		this.config.fields = [];
		this.config.lockedFields = [];

		const dataTableConfig = this.config.listViewConfig.find(config => config.cmpName === 'dataTable');
		if (!dataTableConfig) {
			this.config.listViewConfig.push({
				cmpName: 'dataTable',
				colModel: [{
					fieldName: 'Id',
					updateable: false,
					isNameField: false,
					isEditable: false,
					isFilterable: true,
					isSortable: true
				}]
			});
		}
		
		const mergedConfig = {
			...dataTableConfig,
			colModel: dataTableConfig.colModel.reduce((acc, col) => {
				const existingCol = acc.find(c => c.fieldName === col.fieldName);
				if (existingCol) {
					acc[acc.indexOf(existingCol)] = {...existingCol, ...col};
				} else {
					acc.push(col);
				}
				return acc;
			}, [])
		};
		
		this.config.listViewConfig[this.config.listViewConfig.indexOf(dataTableConfig)] = mergedConfig;
		console.log('mergedConfig', this.config.listViewConfig);
		
		dataTableConfig.colModel.forEach(col => {
			this.config.fields.push(col.fieldName);
		});
		dataTableConfig.rowChecked = false;
		this.config.relField = dtConfig.relField;
		this.config.sObjApiName = libs.getGlobalVar(this.tabConfigName).sObjApiName;
		this.config.records = [];
		
		console.log('this.config', JSON.parse(JSON.stringify(this.config)));
	}

	toggleSection(event) {
        let section = this.template.querySelector('.slds-section[data-id="' + event.currentTarget.dataset.id + '"]');
		section.classList.toggle('slds-is-open');
    }

	toggleOnInit() {
		this.config.tabularConfig.dataModel.forEach(cmp => {
			if (cmp.isCollapsible && !cmp.isCollapsed) {
				let section = this.template.querySelector('.slds-section[data-id="' + cmp.uniqueName + '"]');
				section.classList.toggle('slds-is-open');
			}
		});
	}

	handleResize() {
		this.config?.tabularConfig?.dataModel?.forEach(cmp => {
			if (cmp.isChart) {
				let container = this.template.querySelector('div[data-id="' + cmp.uniqueName + '"]');
				let chart = this.template.querySelector('[data-name="' + cmp.uniqueName + '"]');
				chart?.resizeChart(container.offsetWidth, container.offsetHeight);
			}
		});
	}

	handleEvent(event, cfg) {
		console.log('action', event, event.target, JSON.parse(JSON.stringify(cfg)));
		let actionId = event?.target?.getAttribute('data-id');

		if (actionId.startsWith('std:')) {
			this.handleStandardAction(event, cfg);
		}		
		if (actionId.startsWith('custom:')) {
			this.handleCustomAction(event, cfg);
		}
	}

	async handleStandardAction(event, cfg) {
		let actionId = event?.target?.getAttribute('data-id');

		let table = libs.getGlobalVar(cfg._cfgName);
		let action = cfg.actions.find(act => act.actionId === actionId);
		let _LABELS = libs.getGlobalVar('_LABELS');

		if (actionId === 'std:delete') {
			if (table.listViewConfig[0]._changedRecords) {
				libs.showToast(this, {
					title: 'Error',
					message: _LABELS.msg_unsaveRecordsCannotPerformOtherAction,
					variant: 'error'
				});
				return;
			}
			let records = table.listViewConfig[0]._selectedRecords();
			if (records.length === 0) {
				libs.showToast(this, {
					title: 'Error',
					message: _LABELS.lbl_deleteNoRecordSelectedError,
					variant: 'error'
				});
				return;
			}
			let dialogCfg = {
				title: _LABELS.lbl_confirmDelete,
				headerStyle: 'slds-modal__header slds-theme_error',
				contents: [
					{
						isMessage: true,
						name: 'deleteConfirm',
						text: _LABELS.msg_deleteConfirm1 + ' ' + records.length + ' ' + _LABELS.msg_deleteConfirm2
					}
				],
				buttons: [
					{
						name: 'cancel',
						label: _LABELS.lbl_cancel,
						variant: 'neutral'
					},
					{
						name: 'btn:delete',
						label: _LABELS.title_delete,
						variant: 'brand',
						class: 'slds-m-left_x-small'
					}
				]
			};
			let res = await this.openDialog(dialogCfg, cfg, actionId);
			this.showDialog = false;
			this.dialogCfg = null;
			if (res.action === 'cancel') return;

			let deleteChunk = action.chunkSize ? action.chunkSize : 200;
			let index = 0;
			this.config.errorList = [];

			try {
				this.config.isExceptionInRemoteAction = false;
				while (index < records.length) {
					let chunk = records.slice(index, records[(parseInt(index) + parseInt(deleteChunk))] ? (parseInt(index) + parseInt(deleteChunk)) : (records.length));
					index += records[(parseInt(index) + parseInt(deleteChunk))] ? parseInt(deleteChunk) : (records.length);

					chunk = this.stripChunk(chunk);
					await libs.remoteAction(this, 'delRecords', { records: chunk, sObjApiName: table.sObjApiName,callback: function(nodename,data){
						this.config.errorList = this.config.errorList.concat(data[nodename].listOfErrors);
					} });
				}
				let recIds = records.map(r => r.Id);
				const errorIds = [];
				this.config.errorList.forEach((el) => {
					errorIds.push(el.split(':')[0]); //getting the IDs of the records that caused the error
				});
				if(errorIds.length === 0) {
					libs.showToast(this, {
						title: 'Success',
						message: this.config._LABELS.msg_successfullyDeleted,
						variant: 'success'
					});
					table.records = table.records.filter(rec => !recIds.includes(rec.Id));
					table.listViewConfig[0].records = table.records;
					table.listViewConfig[0]._updateView();
				}else{
					let successFullyDeletedRecordIds = records.filter(rec => !errorIds.includes(rec.Id));
					table.records = table.records.filter(rec => !successFullyDeletedRecordIds.includes(rec.Id));
					table.listViewConfig[0].records = table.records;
					table.listViewConfig[0]._updateView();
					libs.showToast(this, {
						title: 'Success',
						message: successFullyDeletedRecordIds.length + ' records deleted successfully',
						variant: 'success'
					});
				}
			} catch (error) {
				console.log(error);
			}
		}
		if (actionId === 'std:save') {
			this.prepareRecordsForSave(table);
		}
		if (actionId === 'std:new') {
				let defValue = {};
				defValue[this.config.relField] = this.recordId;
				if (action?.defValues) {
					Object.assign(defValue, action.defValues);
				}
				this[NavigationMixin.Navigate]({
					type: 'standard__objectPage',
					attributes: {
						/*recordId: this.recordId, // pass the record id here.*/
						objectApiName: action?.sObjApiName ? action?.sObjApiName : this.config.sObjApiName,
						actionName: 'new',
					},
					state: {
						defaultFieldValues: encodeDefaultFieldValues(defValue),
				        useRecordTypeCheck: 1
					}
				});

			return;
		}
		if (actionId === 'std:edit') {
				let defValue = {};
				let hId = location.hash?.replace('#','');
				defValue[this.config.relField] = hId ? hId : this.recordId;

				this[NavigationMixin.Navigate]({
					type: 'standard__recordPage',
					attributes: {
						/*recordId: this.recordId, // pass the record id here.*/
						recordId: hId ? hId : this.recordId,
						objectApiName: action?.sObjApiName ? action?.sObjApiName : this.config.tabularConfig.sObjApiName,
						actionName: 'edit'
					}
				});

			return;
		}
		if (actionId === 'std:untie') {
			table.listViewConfig[0].isShowCheckBoxes = !table.listViewConfig[0].isShowCheckBoxes;
			table.listViewConfig[0]._updateView();
		}
	}
	async prepareRecordsForSave(scope){
		let records = [];
		if(scope.listViewConfig[0]._changedRecords === undefined || scope.listViewConfig[0]._changedRecords.size === 0) {
			libs.showToast(this,{
				title: 'Error',
				message: 'Please change some records first',
				variant: 'error'
			});
			return;
		}
		if(scope.listViewConfig[0].isRecordsDragDropEnabled && scope?._advanced?.afterloadTransformation !== undefined && scope?._advanced?.afterloadTransformation !== ""){
			records = libs.flattenRecordsWithChildren(scope.records);
		}else{
			records = scope.records;
		}
		let changedItems = records.filter(el => {
			return scope.listViewConfig[0]._changedRecords.has(el.Id)
		});
		
		let allRecordsValidation = true;

		if(scope?._advanced?.beforeSaveValidation !== undefined && 
			scope?._advanced?.beforeSaveValidation !== ""){
			changedItems.forEach((el)=>{
				try{
					let rec = eval('('+scope._advanced.beforeSaveValidation+')')(scope,libs,el);
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

		let saveChunk = scope.listViewConfig[0].saveChunkSize ? scope.listViewConfig[0].saveChunkSize : 200; //200 is the default value for saveChunk
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

		scope.saveStatus = 0;
		scope.countOfFailedRecords = 0;
		scope.errorList = [];
		let chunkCount = 0;

		while(changedItems.length > 0 && index < changedItems.length){
			let lIndex = changedItems[(parseInt(index)+parseInt(saveChunk))] ? (parseInt(index)+parseInt(saveChunk)) : (changedItems.length);
			let chunk = changedItems.slice(index,lIndex);
			index += changedItems[(parseInt(index)+parseInt(saveChunk))] ? parseInt(saveChunk) : (changedItems.length);
			chunkCount +=1;
			await this.saveRecords(chunk,scope);
		}
		if(chunkCount === scope.saveStatus)
			this.resetChangedRecords(changedItems.length,scope);
	}
	async saveRecords(chunkIn,scope){
		try{
			//[DR] in case of saving custom settings need delete all nested attributes inside records, otherwise we will get EXCEPTION "Cannot deserialize instance of <unknown> from null value null or request may be missing a required field"
			let chunk = this.stripChunk(chunkIn);
			await libs.remoteAction(this, 'saveRecords', { records: chunk, 
				sObjApiName: scope.sObjApiName,
				rollback:scope.listViewConfig[0].rollBack ? scope.listViewConfig[0].rollBack : false,
				beforeSaveAction: scope.listViewConfig[0].beforeSaveApexAction ? scope.listViewConfig[0].beforeSaveApexAction : '',
				callback: function(nodename,data){
					scope.saveStatus += 1;
					scope.countOfFailedRecords += parseInt(data[nodename].countOfFailedRecords);
					scope.errorList = scope.errorList.concat(data[nodename].listOfErrors);
					console.log('From callback ', data[nodename]);
				}
			});
		} catch (error) {
			console.log(error);
		}
	}
	resetChangedRecords(validatedRecordSize,scope) {
		let _LABELS = libs.getGlobalVar('_LABELS');
		if((validatedRecordSize - scope.countOfFailedRecords) > 0){
			libs.showToast(this,{
				title: 'Success',
				message: (validatedRecordSize - scope.countOfFailedRecords) + ' of ' + validatedRecordSize + ' ' + _LABELS.msg_itemsUpdated,
				variant: 'success'
			});
		}
		if(scope.countOfFailedRecords > 0){
			libs.showToast(this,{
				title: 'Error',
				message: libs.formatStr('{0} ' +_LABELS.msg_itemsUpdateFailed,[scope.countOfFailedRecords]) + scope.errorList.toString(),
				variant: 'error'
			});
			const errorIds = [];
			scope.errorList.forEach((el) => {
				errorIds.push(el.split(':')[0]); //getting the IDs of the records that caused the error
			});
			for (let key of scope.listViewConfig[0]._changedRecords.keys()) {
				if (!errorIds.includes(key)) {
					scope.listViewConfig[0]._changedRecords.delete(key);
				}
			}
			console.error(JSON.parse(JSON.stringify(scope.errorList)));
		}else{
			scope.listViewConfig[0]._changedRecords = undefined;
			scope.records.forEach((record) => {
				delete record._cellCss;
			});
		}
	}

	stripChunk(chunkIn) {
		let chunk = [];
		chunkIn.forEach((item) => {
			chunk.push(JSON.parse(JSON.stringify(item, (key, value) => { return typeof (value) === 'object' && key !== "" ? null : value; })))
		});
		return chunk;
	}

	async handleCustomAction(event, cfg) {
		let actionId = event?.target?.getAttribute('data-id');
		let table = libs.getGlobalVar(cfg._cfgName).listViewConfig[0];
		let action = JSON.parse(JSON.stringify(cfg.actions.find(act => act.actionId === actionId)));
		this.parseHandlers(action);
		let tableElement = this.template.querySelector('[data-name="' + cfg._cfgName + '"]');
		
		let input = {}, confirmed = false, index = 0;
		if (action.inputDialogs) {
			do {
				input = await this.openDialog(action.inputDialogs[index], cfg, actionId);
				console.log('input', JSON.parse(JSON.stringify(input)));
				this.showDialog = false;
				this.dialogCfg = null;
				if (input.action === 'cancel') return;
				else if (input.action.startsWith('switch')) index = input.action.split(':')[1];
				else confirmed = true;

			} while (!confirmed);
		}
		input.index = index;

		let validationResult;
		if (action.validationCallBack && typeof action.validationCallBack === 'function') {
			validationResult = await action.validationCallBack({ selected: table._selectedRecords(), input: input, table: table, tableElement: tableElement, action: action}, this, libs);
			console.log('validationResult', JSON.parse(JSON.stringify(validationResult)));
			if (validationResult.errorMessage) {
				libs.showToast(this, {
					title: 'Error',
					message: validationResult.errorMessage,
					variant: 'error'
				});
				return;
			}
		}

		if (action.confirmationDialog) {
			let result = await this.openDialog(action.confirmationDialog, cfg, actionId);
			console.log('dialog res', JSON.parse(JSON.stringify(result)));
			this.showDialog = false;
			this.dialogCfg = null;
			if (result.action === 'cancel') return;
		}

		let result;
		if (action.actionCallBack && typeof action.actionCallBack === 'function') {
			result = await action.actionCallBack({ selected: table._selectedRecords(), input: input, table: table, tableElement: tableElement, action: action, validationResult: validationResult} , this, libs);
			console.log('result', JSON.parse(JSON.stringify(result)));
			if (result.successMessage) {
				libs.showToast(this, {
					title: 'Success',
					message: result.successMessage,
					variant: 'success'
				});
				if (result.updateView) table._updateView();
			} else if (result.errorMessage) {
				libs.showToast(this, {
					title: 'Error',
					message: result.errorMessage,
					variant: 'error'
				});
			}
		}

		if (action.completedCallBack && typeof action.completedCallBack === 'function') {
			action.completedCallBack({ selected: table._selectedRecords(), input: input, table: table, tableElement: tableElement, action: action, validationResult: validationResult, result: result} , this, libs);
		}

	}

	openDialog(dialogCfg, actionCfg, actionId) {
		return new Promise(resolve => {
			this.dialogCfg = {
				data_id: actionCfg._cfgName + ':' + actionCfg._barName + ':' + actionId,
				callback: ((data) => {
					resolve(data);
				})
			};
			this.replaceLiterals(dialogCfg, '_LABELS');
			Object.assign(this.dialogCfg, dialogCfg);
			this.showDialog = true;
		});		
	}

	replaceLiterals(target, globalVar) {
		let replaceObj = (ob) => {
            for (let p in ob) {
                if (typeof ob[p] === 'string' && ob[p].startsWith('%')) {
					ob[p] = libs.replaceLiteralsInStr(ob[p], globalVar);
                } else if (typeof ob[p] === 'object') {
                    replaceObj(ob[p]);
                }
            }
        };
		if (typeof target === 'string')	libs.replaceLiteralsInStr(target, globalVar);
		else replaceObj(target);
	}

	async bulkAction(cmd, recordIdList, recordParam, params, chunkSize, callback) {
		let index = 0;
		let result = [];
		params.callback = (cmd, res) => {
			console.log(cmd, res); 
			result.push(res);
		};
		while (index < recordIdList.length) {
			params[recordParam] = recordIdList.slice(index, index + chunkSize > recordIdList.length ? recordIdList.length : index + chunkSize);
			index += chunkSize;
			await libs.remoteAction(this, cmd, params);
		}
		console.log('bulkAction result', result); 
		callback(result);
	}
	
    parseHandlers(ob) {
        for (let p in ob) {
            if (typeof ob[p] === 'string' && ob[p].includes('function')) {
                ob[p] = eval('(' + ob[p] + ')');
            } else if (typeof ob[p] === 'object') {
                this.parseHandlers(ob[p]);
            }
        }
    }
}