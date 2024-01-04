import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { libs } from 'c/libs'

export default class extRelListSettings extends LightningElement {
	@api cfg;
	@track config;
	@track dataTable;
	@track showDialog = false;


	getFlowList() {
		let SOQL = "SELECT Id, DurableId, ApiName, Label, Description, ProcessType, TriggerType, NamespacePrefix, ActiveVersionId, LatestVersionId, LastModifiedBy, IsActive, IsOutOfDate, LastModifiedDate, IsTemplate, IsSwingFlow, Builder, ManageableState, InstalledPackageName, TriggerOrder FROM FlowDefinitionView WHERE (ProcessType = 'Flow' OR ProcessType='AutoLaunchedFlow')AND IsActive = true";
		libs.remoteAction(this, 'customSoql', {
			SOQL: SOQL,
			callback: ((nodeName, data) => {
				let options =  [{label : "None", value : ""}];
				console.log('optionsCallBack', data);
				data[nodeName].records.forEach(e=>{
					options.push({label : e.ProcessType + '-' + e.Label, value: e.ProcessType + '::' + e.ApiName})	
				});
				this.config.flowList = options;
			})
		});
	}

	getApexInterfaceList() {
		libs.remoteAction(this, 'getIntrLst', {
			callback: ((nodeName, data) => {
				let options =  [{label : "None", value : ""}];
				if (data[nodeName]) {
					data[nodeName].forEach(e=>{
						options.push({label : e, value: e})	
					});
				}
				this.config.apexInterfaceList = options;
			})
		});
	}

	connectedCallback() {
		console.log(this.cfg);
		this.config = libs.getGlobalVar(this.cfg);
		this.getFlowList();
		this.getApexInterfaceList();
		this.config.dialog.allActions = [];
		this.config.dialog.useExampleParams = {};
		this.config.dialog.listViewConfig.actions.forEach((el)=>{
			this.config.dialog.allActions.push({label:el.actionLabel,value:el.actionId});
		});
		this.config.listViewConfig.forEach((el)=>{
			if(el.cmpName === 'dataTable') {
				this.dataTable = el;
			}
		});
		this.config.enableActions = ['actionTip','actionIsHidden','actionIconName','actionOrder','actionVisibleOnRecordSelection'];
	}

	get dialogCss(){
		return 'max-height:'+screen.availHeight+'px;max-width:80%';
	}

	get selectedFields() {
		let items = [];
		// let allColumns = this.dataTable.colModel;
		this.config?.sqlBuilder?.selectedFields.forEach( e=>{
			// let item = allColumns.find((el)=> el.fieldName === e);
			// if (item) items.push({value: item.fieldName, label: item.label});
			items.push({value: e.fieldName, label: e.label});
		});
		//if the last opened column in field settings is deleted then we need to close the settings from that column
		if(this.config.dialog.field !== undefined 
			&& this.config.sqlBuilder.lastDeletedField !== undefined
			&& !items.includes(this.config.dialog.field)
			&& this.config.sqlBuilder.lastDeletedField === this.config.dialog.field){
				this.config.dialog.field = undefined;
		}
        return items;
    } 

	get colModelItem() {
		let result = [];
		if (this.config.dialog.field === undefined) {return result};
		
		let fieldParams = this.config.dialog.listViewConfig.colModel.find( e=>{
			return e.fieldName === this.config.dialog.field;
		});

		if (!fieldParams) fieldParams = {}

		let tmp = libs.colModelItem();
		let desc = this.config.describe;

		for (let item in tmp) {
			if(this.config.isHistoryGrid && tmp[item].isReadOnly) continue;
			// (desc[fieldParams.fieldName] && !desc[fieldParams.fieldName].updateable) - if the user don't have permission skip this field for editing
			if(item === 'isEditable' && (!this.config.describeObject.updateable || (desc[fieldParams.fieldName] && !desc[fieldParams.fieldName].updateable) || fieldParams.fieldName.includes('.'))) continue;
			let defValue = (item === 'fieldName') 
				? this.config.dialog.field 
				: fieldParams[item] === undefined
					? tmp[item].defValue
					: fieldParams[item];
			if(this.config.dialog.useExampleParams[item] !== undefined){
				defValue = this.config.dialog.useExampleParams[item];
			}
			result.push({
				"paramName" : item,
				"type" : tmp[item].type,
				"label" : tmp[item].helpArticleUrl === undefined ? tmp[item].label : '',
				"isTextArea" : (tmp[item].type === 'function'),
				"tooltip" : tmp[item].helpArticleUrl === undefined ? (item === 'fieldName') ? tmp[item].tooltip + '\n' + '.Field Type:' + fieldParams.type : tmp[item].tooltip : '',
				"isDisabled" : (item === 'fieldName'),
				"value" : defValue,
				"isChecked" : (tmp[item].type === 'checkbox') ? defValue : undefined,
				"placeHolder" : tmp[item].placeHolder,
				"useExample": tmp[item].useExample,
				"helpId": 'help:' + item,
				"helpLabel": tmp[item].label,
				"helpTooltip" : (item === 'fieldName') ? tmp[item].tooltip + '\n' + '.Field Type:' + fieldParams.type : tmp[item].tooltip,
				"helpArticleUrl": tmp[item].helpArticleUrl !== undefined ? tmp[item].helpArticleUrl : false,
				"helpStyle": this.generateStyleForHelp(tmp[item].type),
				"isAdvanced" : tmp[item].isAdvanced,
			})
		}
		// console.log(result, describe[this.config.dialog.field]);
		return result;
	}

	get tableItem() {
		let result = [];

		let tmp = libs.tableItem();

		for (let item in tmp) {
			if(this.config.isHistoryGrid && tmp[item].isReadOnly) continue;
			let defValue = this.dataTable != undefined ? 
                (item in this.dataTable ? 
                    this.dataTable[item] :
                    (this.dataTable.pager != undefined && item in this.dataTable.pager ?
                        this.dataTable.pager[item] :
                        (tmp[item] != undefined ? tmp[item].defValue : false))) :
                false;
			
			if(this.config.dialog.useExampleParams[item] !== undefined){
				defValue = this.config.dialog.useExampleParams[item];
			}
			
			let sFields = [{label:'No Grouping',value:''}];
			sFields = sFields.concat(this.selectedFields);
			/*let options = (tmp[item].type === 'combobox') ?
							(tmp[item].options) ? (tmp[item].options)  : sFields : '';*/
			let options = typeof(tmp[item].optionsCallBack) == 'function' ?  tmp[item].optionsCallBack(this, sFields) : tmp[item].options;
			result.push({
				"paramName" : item,
				"type" : tmp[item].type,
				"label" : tmp[item].helpArticleUrl === undefined ? tmp[item].label : '',
				"isTextArea" : (tmp[item].type === 'function'),
				"tooltip" : tmp[item].helpArticleUrl === undefined ? tmp[item].tooltip : '',
				//"isDisabled" : (item === 'fieldName'),
				"value" : defValue,
				"isChecked" : (tmp[item].type === 'checkbox') ? defValue : undefined,
				"isComboBox" : (tmp[item].type === 'combobox'),
				//"options": options,
				"options" : options,
				"cmd": tmp[item].cmd,
				"placeHolder" : tmp[item].placeHolder,
				"useExample": tmp[item].useExample,
				"helpId": 'help:' + item,
				"helpLabel": tmp[item].label,
				"helpTooltip" : tmp[item].tooltip,
				"helpArticleUrl": tmp[item].helpArticleUrl !== undefined ? tmp[item].helpArticleUrl : false,
				"helpStyle": this.generateStyleForHelp(tmp[item].type),
				"isAdvanced" : tmp[item].isAdvanced,
			})
		}
		// console.log(result);
		return result;
	}
	generateStyleForHelp(type){
		return type === 'checkbox' ?
		'top: 2px;left: 20px;position: absolute;color: rgb(74, 75, 77,1);font-size: 13px;':
		'top: 0px;left: -2px;position: absolute;color:  rgb(74, 75, 77,1);font-size: 12px;'
	}
	changeIcon(event){
		event.target.iconName = 'utility:question';
	}
	changeIconAgain(event){
		event.target.iconName = 'utility:info';
	}

	get actionItem() {
		let result = [];
		
		if (this.config.dialog.action === undefined) {return result};
		
		let fieldParams = this.config.dialog.listViewConfig.actions.find( e=>{
			return e.actionId === this.config.dialog.action;
		});

		if (!fieldParams) fieldParams = {}

		if(fieldParams.actionId === 'std:expand_view'){
			fieldParams.actionIconName = this.config._expandIcon;
			fieldParams.actionTip = this.config._expandTip;
		}
		let tmp = libs.customActions();

		/* eslint-disable */
		for (let item in tmp) {
			let defValue = (item === 'actionId') 
			? this.config.dialog.action 
			: fieldParams[item] === undefined
				? tmp[item].defValue
				: fieldParams[item];
			
			if(this.config.dialog.useExampleParams[item] !== undefined){
				defValue = this.config.dialog.useExampleParams[item];
			}
			let options = typeof(tmp[item].optionsCallBack) == 'function' ?  tmp[item].optionsCallBack(this) : tmp[item].options;
			result.push({
				"paramName" : item,
				"type" : tmp[item].type,
				"label" : tmp[item].helpArticleUrl === undefined ? tmp[item].label : '',
				"isTextArea" : (tmp[item].type === 'function'),
				"isText" : (tmp[item].type !== 'combobox' && tmp[item].type !== 'function'),
				"options" : options,
				"tooltip" : tmp[item].tooltip,
				"isDisabled" : (fieldParams['isActionStandard'] ? this.config.enableActions.includes(item) ? false : true : false),
				"value" : defValue,
				"isChecked" : (tmp[item].type === 'checkbox') ? defValue : undefined,
				"placeHolder" : tmp[item].placeHolder,
				"useExample": tmp[item].useExample,
				"isCombo" : (tmp[item].type === 'combobox' && options != undefined),
				"isAdvanced" : tmp[item].isAdvanced,
				"helpLabel": tmp[item].label,
				"helpTooltip" : tmp[item].tooltip,
				"helpArticleUrl": tmp[item].helpArticleUrl !== undefined ? tmp[item].helpArticleUrl : false,
			})
		}
		return result;
	}
	get isActionStandard(){
		if(this.config.dialog.action){
			let fieldParams = this.config.dialog.listViewConfig.actions.find( e=>{
				return e.actionId === this.config.dialog.action;
			});
			return fieldParams['isActionStandard'];
		}else{
			return false;
		}
	}
	handleNewAction(event){
		let dataId = event.target.getAttribute('data-val')
		if(dataId === 'openNewAction'){
			this.config.openNewAction = true;
		}
		if(dataId === 'actionSave'){
			let actionId = this.template.querySelector('.newActionId').value;
			if(actionId != ''){
				this.config.dialog.action = actionId;
				this.config.dialog.listViewConfig.actions.push({actionId:actionId});
				this.config.dialog.allActions.push({label:actionId,value:actionId});
				this.config.openNewAction = false;
			}else{
				const eventErr = new ShowToastEvent({
					title: 'Error',
					message: this.config._LABELS.msg_enterUniqueActionId,
					variant: 'error'
				});
				this.dispatchEvent(eventErr);
			}
		}
		if(dataId === 'actionCancel'){
			this.config.openNewAction = false;
		}
		if(dataId === 'actionDeleteOpenConfirmation'){
			this.dialogCfg = {
				title: this.config._LABELS.title_deleteCustomAction,
				headerStyle: 'slds-modal__header slds-theme_error',
				contents: [
					{
						isMessage: true,
						name: 'deleteCustomActionConfirm',
						text: this.config._LABELS.msg_deleteCustomActionConfirmation
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
				data_id: "actionDelete"
			};
			this.showDialog = true;
		}
		if(dataId === 'actionDelete'){
			if (event.detail.action === 'cancel') this.showDialog = false;
			else{
				this.config.dialog.listViewConfig.actions = this.config.dialog.listViewConfig.actions.filter(e => e.actionId != this.config.dialog.action);
				this.config.dialog.allActions = this.config.dialog.allActions.filter(e => e.value != this.config.dialog.action);
				this.config.dialog.action = false;
				this.config.openNewAction = false;
				this.showDialog = false;
			}
		}
	}

	addNewUseExampleParam(event){
		this.config.dialog.useExampleParams[event.target.getAttribute('data-param')] = event.target.getAttribute('data-val').substring(event.target.getAttribute('data-val').indexOf('function')).replaceAll("//","");
	}
	tabChanged(event){
		this.config._tabs.currentOpenedTab = event.target.value;
	}
}