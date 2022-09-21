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
		this.config.dialog.listViewConfig.actions.forEach((el)=>{
			this.config.dialog.allActions.push({label:el.actionLabel,value:el.actionId});
		});
		this.config.listViewConfig.forEach((el)=>{
			if(el.cmpName === 'dataTable') {
				this.dataTable = el;
			}
		});
	}

	get selectedFields() {
		let items = [];
		let describe = this.config.describe;
		this.config.dialog.selectedFields.forEach( e=>{
			let item = describe[e];
			if (item) items.push({value: item.name, label: item.label});
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
			if(!describe[this.config.dialog.field].updateable && item === 'isEditable') continue;
			let defValue = (item === 'fieldName') 
				? this.config.dialog.field 
				: fieldParams[item] === undefined
					? tmp[item].defValue
					: fieldParams[item];
			result.push({
				"paramName" : item,
				"type" : tmp[item].type,
				"label" : tmp[item].label,
				"isTextArea" : (tmp[item].type === 'function'),
				"tooltip" : (item === 'fieldName') ? tmp[item].tooltip + '\n' + '.Field Type:' + fieldParams.type : tmp[item].tooltip,
				"isDisabled" : (item === 'fieldName'),
				"value" : defValue,
				"isChecked" : (tmp[item].type === 'checkbox') ? defValue : undefined,
				"placeHolder" : tmp[item].placeHolder
			})
		}
		console.log(result, describe[this.config.dialog.field]);
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
			result.push({
				"paramName" : item,
				"type" : tmp[item].type,
				"label" : tmp[item].label,
				"isTextArea" : (tmp[item].type === 'function'),
				"tooltip" : tmp[item].tooltip,
				//"isDisabled" : (item === 'fieldName'),
				"value" : defValue,
				"isChecked" : (tmp[item].type === 'checkbox') ? defValue : undefined,
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
				"tooltip" : (item === 'fieldName') ? tmp[item].tooltip + '\n' + '.Field Type:' + fieldParams.type : tmp[item].tooltip,
				"isDisabled" : (item === 'fieldName'),
				"value" : defValue,
				"isChecked" : (tmp[item].type === 'checkbox') ? defValue : undefined,
				"placeHolder" : tmp[item].placeHolder
			})
		}
		return result;
	}

}