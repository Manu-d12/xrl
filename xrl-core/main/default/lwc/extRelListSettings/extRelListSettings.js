import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs'

export default class extRelListSettings extends LightningElement {
	@api cfg;
	@track config;

	connectedCallback() {
		console.log(this.cfg);
		this.config = libs.getGlobalVar(this.cfg);
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

		let fieldParams = this.config.dialog.listViewConfig.colModel.find( e=>{
			return e.fieldName === this.config.dialog.field;
		});

		if (!fieldParams) fieldParams = {}

		let tmp = libs.colModelItem();

		for (let item in tmp) {
			console.log('fieldParams', describe[this.config.dialog.field]);
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
				"tooltip" : tmp[item].tooltip,
				//"isDisabled" : (item === 'fieldName'),
				"value" : defValue,
				"isChecked" : (tmp[item].type === 'checkbox') ? defValue : undefined
			})
		}
		console.log(result);
		return result;
	}

	get tableItem() {
		let result = [];

		/*if (this.config.dialog.field === undefined) {return result};

		let fieldParams = this.config.dialog.listViewConfig.colModel.find( e=>{
			return e.fieldName === this.config.dialog.field;
		});

		if (!fieldParams) fieldParams = {}*/

		let tmp = libs.tableItem();

		for (let item in tmp) {
			let defValue = ''/*(item === 'fieldName') 
				? this.config.dialog.field 
				: fieldParams[item] === undefined
					? tmp[item].defValue
					: fieldParams[item];*/
			result.push({
				"paramName" : item,
				"type" : tmp[item].type,
				"label" : tmp[item].label,
				"isTextArea" : (tmp[item].type === 'function'),
				"tooltip" : tmp[item].tooltip,
				//"isDisabled" : (item === 'fieldName'),
				"value" : defValue,
				"isChecked" : (tmp[item].type === 'checkbox') ? defValue : undefined
			})
		}
		console.log(result);
		return result;
	}

}