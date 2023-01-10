import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs'

export default class extRelListSettings extends LightningElement {
	@api cfg;
	@track config;
	@track dataTable;

	connectedCallback() {
		console.log(this.cfg);
		this.config = libs.getGlobalVar(this.cfg);
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
		return 'max-height:'+screen.availHeight+'px;';
	}

	get selectedFields() {
		let items = [];
		let allColumns = this.dataTable.colModel;
		this.config.dialog.selectedFields.forEach( e=>{
			let item = allColumns.find((el)=> el.fieldName === e);
			if (item) items.push({value: item.fieldName, label: item.label});
		});
        return items;
    } 

	get colModelItem() {
		let result = [];
		if (this.config.dialog.field === undefined) {return result};
		
		let describe = this.config.describe;
		// this.config.listViewConfig.forEach((el)=>{
		// 	if(el.cmpName === 'dataTable') {
		// 		this.dataTable = el;
		// 	}
		// });
		let fieldParams = this.dataTable.colModel.find( e=>{
			return e.fieldName === this.config.dialog.field;
		});

		if (!fieldParams) fieldParams = {}

		let tmp = libs.colModelItem();

		for (let item in tmp) {
			if(!fieldParams.updateable && !fieldParams.isNameField && item === 'isEditable') continue;
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
				"label" : tmp[item].label,
				"isTextArea" : (tmp[item].type === 'function'),
				"tooltip" : (item === 'fieldName') ? tmp[item].tooltip + '\n' + '.Field Type:' + fieldParams.type : tmp[item].tooltip,
				"isDisabled" : (item === 'fieldName'),
				"value" : defValue,
				"isChecked" : (tmp[item].type === 'checkbox') ? defValue : undefined,
				"placeHolder" : tmp[item].placeHolder,
				"useExample": tmp[item].useExample
			})
		}
		// console.log(result, describe[this.config.dialog.field]);
		return result;
	}

	get tableItem() {
		let result = [];

		let tmp = libs.tableItem();

		for (let item in tmp) {
			let defValue = item in this.dataTable 
				? this.dataTable[item]
				: item in this.dataTable.pager ? this.dataTable.pager[item] 
				: tmp[item].defValue;
			
			let sFields = [{label:'No Grouping',value:''}];
			sFields = sFields.concat(this.selectedFields);
			let options = (tmp[item].type === 'combobox') ?
							(tmp[item].options) ? (tmp[item].options)  : sFields : '';
			result.push({
				"paramName" : item,
				"type" : tmp[item].type,
				"label" : tmp[item].label,
				"isTextArea" : (tmp[item].type === 'function'),
				"tooltip" : tmp[item].tooltip,
				//"isDisabled" : (item === 'fieldName'),
				"value" : defValue,
				"isChecked" : (tmp[item].type === 'checkbox') ? defValue : undefined,
				"isComboBox" : (tmp[item].type === 'combobox'),
				"options": options,
				"cmd": tmp[item].cmd,
				"placeHolder" : tmp[item].placeHolder
			})
		}
		console.log(result);
		return result;
	}

	get actionItem() {
		let result = [];
		
		if (this.config.dialog.action === undefined) {return result};
		
		let fieldParams = this.config.dialog.listViewConfig.actions.find( e=>{
			return e.actionId === this.config.dialog.action;
		});

		if (!fieldParams) fieldParams = {}

		let tmp = libs.customActions();

		/* eslint-disable */
		for (let item in tmp) {
			if((tmp[item].type === 'function') && (fieldParams['isActionStandard'])) continue;
			let defValue = (item === 'actionId') 
			? this.config.dialog.action 
			: fieldParams[item] === undefined
				? tmp[item].defValue
				: fieldParams[item];
			result.push({
				"paramName" : item,
				"type" : tmp[item].type,
				"label" : tmp[item].label,
				"isTextArea" : (tmp[item].type === 'function'),
				"tooltip" : tmp[item].tooltip,
				"isDisabled" : (fieldParams['isActionStandard'] ? this.config.enableActions.includes(item) ? false : true : false),
				"value" : defValue,
				"isChecked" : (tmp[item].type === 'checkbox') ? defValue : undefined,
				"placeHolder" : tmp[item].placeHolder
			})
		}
		return result;
	}
	handleNewAction(event){
		let dataId = event.target.getAttribute('data-val')
		if(dataId === 'openNewAction'){
			this.config.openNewAction = true;
		}
		if(dataId === 'actionSave'){
			let actionId = this.template.querySelector('.newActionId').value;
			this.config.dialog.action = actionId;
			this.config.dialog.listViewConfig.actions.push({actionId:actionId});
			this.config.openNewAction = false;
		}
	}
	addNewUseExampleParam(event){
		this.config.dialog.useExampleParams[event.target.getAttribute('data-param')] = event.target.getAttribute('data-val').substring(event.target.getAttribute('data-val').indexOf('function')).replaceAll("//","");
	}
}