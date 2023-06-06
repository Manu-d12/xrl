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
	@track tabConfigName;

    connectedCallback() {
		console.log('RENDERED');
		this.name = this.configId.split('::')[1];
		this.configId = this.configId.split('::')[0];
		this.loadCfg(true);
		window.addEventListener("resize", this.handleResize.bind(this))
	}

	setCustomLabels(cmd, data) {
		console.log('CustomLabes are loaded', data[cmd]);
		this.config._LABELS = data[cmd];
		this.LABELS = data[cmd];
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
	async getWholeConfig(cmd,data){
		let jsonDetails = JSON.parse(JSON.stringify(data[cmd].listViews));
		if(jsonDetails[0].configType === 'Tabular'){
			console.log('In Tabular');
			this.handleTabularFormat(data[cmd]);
		}else{
			await this.setConfig(cmd,data);
			this.components = [];
			this.config.listViewConfig.forEach((el,index)=>{
				console.log('cmpName',el.cmpName);
				if(el.cmpName === 'dataTable') this.components.push({isDataTable:true,key:'sFilter'+index});
				if(el.cmpName === 'serversideFilter') this.components.push({isServerFilter:true,key:'dataTable'+index});
				if(el.cmpName === 'chart') this.components.push({isChart:true,key:'chart'+index});
				if(el.cmpName === 'chevron') this.components.push({isChevron:true,key:'chevron'+index});
				if(el.cmpName === 'actionBar') this.components.push({isActionBar:true,key:'actionBar'+index});
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
				if (comp.targets.includes(ch.cfg)) ch.handleEventMessage(event);
			});
			if (event.detail.cmd.split(':')[1] === 'refresh') this.template.querySelectorAll('c-chartjs')?.forEach(ch => {
				if (comp.targets.includes(ch.name)) ch.handleEventMessage(event);
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
			this.config.cols = this.config.tabularConfig.tableDefinition.cols;
			let colSize = 12 / parseInt(this.config.cols);
			let sortedDataModel = this.config.tabularConfig.dataModel.toSorted((a, b) => {return a.cmpName === 'actionBar' ? 1 : 0;});

			// Loop through data model components
			for (const cmp of sortedDataModel) {
				
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
		
				// Set component configuration
				this.name = cmp.uniqueName;
				let configUniqueName = cmp.configUniqueName;
				console.log('Name:', this.name);
		
				libs.setGlobalVar(this.name, {});
				this.config = libs.getGlobalVar(this.name);
				Object.assign(this.config, {
				'_LABELS': this.LABELS
				});

				// Call getConfigById for DataTable or ServerSideFilter
				if (cmp.isDataTable) {
					await libs.remoteAction(this, 'getConfigByUniqueName', { uniqueName: configUniqueName, callback: this.setConfigTabular.bind(this) });
					//await new Promise(resolve => setTimeout(resolve, 3000)); //this needs to debug, should work without timeout
				} else if (cmp.isServerFilter) {
					await libs.remoteAction(this, 'getConfigByUniqueName', { uniqueName: configUniqueName, sObjApiName:this.config.sObjApiName || configUniqueName.split(':')[0] , callback: function(cmd, data) {
						this.config.listViewConfig = (data[cmd].userConfig) ? JSON.parse(data[cmd].userConfig) : [];
						this.config.sObjApiName = this.config.sObjApiName || configUniqueName.split(':')[0];
						this.config.relField = this.config.relField || configUniqueName.split(':')[1];
						this.config.financial = (data[cmd].Financial) ? data[cmd].Financial : {};
						this.config.describe = (data[cmd].describe) ? JSON.parse(data[cmd].describe) : {};
						this.config.userInfo = (data.userInfo) ? data.userInfo : {};
					} });
				} else if (cmp.isChart) {
					await libs.remoteAction(this, 'getConfigByUniqueName', { uniqueName: configUniqueName, callback: function(cmd, data) {
						this.config.chartConfig = (data[cmd].userConfig) ? JSON.parse(data[cmd].userConfig) : [];
					} });
				} else if (cmp.isChevron) {
					await libs.remoteAction(this, 'getConfigByUniqueName', { uniqueName: configUniqueName, callback: function(cmd, data) {
						this.config.chevronConfig = (data[cmd].userConfig) ? JSON.parse(data[cmd].userConfig) : [];
					} });
				} else if (cmp.isActionBar) {
					await libs.remoteAction(this, 'getConfigByUniqueName', { uniqueName: configUniqueName, callback: function(cmd, data) {
						this.config.actionsBar = (data[cmd].userConfig) ? JSON.parse(data[cmd].userConfig) : [];
						cmp.config = {
							'actions': this.config.actionsBar?.actions || [],
							'_handleEvent': this.handleEvent.bind(this),
							'_cfgName': cmp.tableName,
							'_barName': this.name
						};
					} });
				}
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

	async setConfigTabular(cmd, data) {
		console.log(cmd, JSON.parse(JSON.stringify(data)), JSON.parse(JSON.stringify(data[cmd])));
		libs.getGlobalVar(this.name).userInfo = data.userInfo;
		libs.getGlobalVar(this.name).financial = data[cmd].Financial;
		
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
		this.config.relField = data[cmd].listViews[0].relField;
		this.config.sObjApiName = data[cmd].listViews[0].sObjApiName;
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

	handleStandardAction(event, cfg) {
		let actionId = event?.target?.getAttribute('data-id');

		let table = libs.getGlobalVar(cfg._cfgName).listViewConfig[0];
		let action = cfg.actions.find(act => act.actionId === actionId);

		if (actionId === 'std:delete') {
			let records = table._selectedRecords();
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
							name: 'delete',
							label: this.config._LABELS.title_delete,
							variant: 'brand',
							class: 'slds-m-left_x-small'
						}
					],
					data_id: cfg._cfgName + ':' + cfg._barName + ':' + actionId
				};
				this.showDialog = true;
			} else {
				libs.showToast(this, {
					title: 'Error',
					message: this.config._LABELS.lbl_deleteNoRecordSelectedError,
					variant: 'error'
				});
			}
		}
	}

	handleCustomAction(event, cfg) {
		let actionId = event?.target?.getAttribute('data-id');

		let table = libs.getGlobalVar(cfg._cfgName).listViewConfig[0];
		let action = cfg.actions.find(act => act.actionId === actionId);	

		if (action.validationCallBack) {
			let valid = eval('(' + action.validationCallBack + ')')(table._selectedRecords(), this, libs);
			// error dialog
		}

		// confirmation dialog
		// data input dialog
		// action callback
		// completed callback	}

	handleEventDialog(event) {
		console.log('dialog', this.dialogCfg.data_id, event, JSON.parse(JSON.stringify(event.detail)));		
		if (event.detail.action === 'cancel') {
			this.showDialog = false;
		}
	}
}