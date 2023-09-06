import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';

export default class dataTableItem extends LightningElement {
	@api cfg;
	@api row;
	@api col;
	@api iseditmode;
	isBool = false;
	@track config = {};
	@track showEdit = false;
	sValue = '';
	locale = '';

	renderedCallback() {
		//this.locale = libs.getGlobalVar(this.cfg).userInfo.locale;
		//console.log('Current Locale ', this.locale);
		if (this.iseditmode && this.template.querySelector('[data-id="' + this.col.fieldName + '"]') != undefined && this.row._focus === this.col.fieldName) setTimeout((() => { this.template.querySelector('[data-id="' + this.col.fieldName + '"]').focus(); }), 100);
		//console.log(this.col.options);
		libs.getGlobalVar(this.cfg).listViewConfig.forEach((el)=>{
			if(el.cmpName === 'dataTable'){
				this.config.dataTableCfg = el;
			}
		});
		if(this.config.dataTableCfg.displayOptionListSize === undefined){
			this.config.dataTableCfg.displayOptionListSize = '20'; //default value is 20
		}
		if (this.col._showEditableIcon && this.config.dataTableCfg._inlineEdit != undefined && this.row._isEditable){
			this.showEdit = true;
		}
		window.addEventListener('keydown', (event) => {
			if (this.showEdit && (this.col.type === 'multipicklist' || this.col.type === 'picklist' || this.col._isLookUpEdit || this.col.type === 'boolean') && (event.which == 13 || event.which == 27)) {	
				this.inlineEditFinish(event);
				console.log('In event Listener dataTableItem', this.showEdit, this.col.fieldName);
			}
		});
	}

	@api
	get value() {
		let refTmp = '<a href="/{0}" target="_blank" title="{1}">{1}</a>';
		//console.log('type', this.col.type, this.col.fieldName)
		this.locale = libs.getGlobalVar(this.cfg).userInfo.locale;
		//console.log(this.col.fieldName, JSON.stringify(this.row), this.row[this.col.fieldName]);
		//this.col.fieldName
		let row,val;
		[row,val] = libs.getLookupRow(JSON.parse(JSON.stringify(this.row)), this.col.fieldName);
		let config = libs.getGlobalVar(this.cfg);
		if(config.isHistoryGrid && this.col.fieldName === 'Field'){
			let sObjName = libs.getParentHistorySObjName(this.cfg);
		
			val = config.describeMap[sObjName][val] !== undefined ? config.describeMap[sObjName][val]?.label : val;
		}
		if (typeof(this.col._formatter) === 'function') {
			try{
				val = this.col._formatter(row, this.col, val);
			}catch(e) {
				console.error(e.toString);
			}
			val = this.col.type === 'currency' ? this.formatNumber(val,this.getCurrencySymbol()) : val;
		} 
		else if(this.showEdit && this.col.isNameField && this.col.fieldName.split('.')[1]){
			// console.log('HERE>>dt');
		}
		else {
			//let val = libs.getLookupValue(this.row, this.col.fieldName);
			if (this.col.type === 'datetime') {
				//console.log(val);
				// console.log(locale);
				if (val!== undefined && val !=='' && val!==null) {
					return new Date(val).toLocaleString(this.locale,{
						month : "2-digit",
						day : "2-digit",
						year: "numeric",
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
						timeZone: libs.getGlobalVar(this.cfg).userInfo.timezone
					});
				}
				//console.log(val);
			}
			if (this.col.type === 'date') {
				if (val!== undefined && val !=='' && val!==null) {
					return new Date(val).toLocaleString(this.locale,{
						month : "2-digit",
						day : "2-digit",
						year: "numeric"
					});
				}
			}
			if (this.col.type === 'number') {
				return val!=null && val!=undefined ? this.formatNumber(val) : null;
			}
			if (this.col.type === 'double') {
				return val!=null && val!=undefined ? this.formatNumber(val) : null;
			}
			if (this.col.type === 'int') {
				return val!=null && val!=undefined ? this.formatNumber(val) : null;
			}
			if (this.col.type === 'percent') {
				return val!=null && val!=undefined && typeof val === 'number' ?  this.formatNumber(val)+'%' : null;
			}

			if (this.col.type === 'currency') {
				return val!=null && val!=undefined && typeof val === 'number' ? this.formatNumber(val, this.getCurrencySymbol()) : null;
			}

			if (this.col.type === 'reference'){
				console.log('row',JSON.parse(JSON.stringify(row)));
				row = JSON.parse(JSON.stringify(row));
				return libs.formatStr(refTmp,[val, row.Name ? row.Name : 
					row[config.objectNameFieldsMap?.get(this.col.referenceTo)] ? row[config.objectNameFieldsMap?.get(this.col.referenceTo)] :  
					(row[this.col.relationshipName][config.objectNameFieldsMap?.get(this.col.referenceTo)] ? row[this.col.relationshipName][config.objectNameFieldsMap?.get(this.col.referenceTo)] : '')]); // Need to investigate this line. Why sometimes for reference we have 'Invalid Name'
			}
			if (this.col.type === 'boolean'){
				this.isBool = true;
				return val;
			}
			if (this.col.type === 'encryptedstring'){
				return val ? "*".repeat(val.length) : '';
			}

			if (this.col.isNameField === true) {
				//console.log(this.col.fieldName, JSON.stringify(row), val);
				return libs.formatStr(refTmp,[this.col.fieldName.split('.')[1] !== undefined && row[this.col.fieldName.split('.')[0]] !== undefined ? row[this.col.fieldName.split('.')[0]].Id : row.Id, val]);
			}
			if(this.col.type === 'address'){
				return libs.formatAddress(val,this.locale);
			}
		}
		return val;
		//return this.row[this.col.fieldName];
	}

	get style() {
		
		let right = ['number', 'currency','int','double','percent'];
		let val='';
		if (right.indexOf(this.col.type)  > -1 && !this.locale.endsWith('US')) {
			val = 'slds-float_right';
		}
		//console.log('getStyle', this.col.fieldName, this.col.type, val, right.indexOf(this.col.type));
		return val;
	}

	get uStyle() {
		let value='';//float:inherit; width:100%;
		if (typeof(this.col._uStyle) === 'function') {
			let row,val;
			[row,val] = libs.getLookupRow(this.row, this.col.fieldName);
			try {
				value += this.col._uStyle(row, this.col, val);
			} catch(e) {
				console.error(e.toString);
				value = val;
			}
		}
		return value;
	}


	get editValue() {
		let row,val;
		if (this.col.type === 'boolean'){
			this.isBool = true;
		}
		if(this.col.type === 'multipicklist'){
			val = this.row[this.col.fieldName] != undefined ? this.row[this.col.fieldName].split(';') : [];
		}else{
			[row,val] = libs.getLookupRow(this.row, this.col.fieldName);
		}
		return val;
	}
	//this returns in case of picklist or multipicklist
	get picklistType(){
		return this.col.type === 'multipicklist';
	}

	formatNumber(number, currency) {
		return currency != undefined ? new Intl.NumberFormat(this.locale, { style: 'currency', currency: currency }).format(number) : new Intl.NumberFormat(this.locale, { }).format(number);
	}

	inlineEdit(event) {
		// console.log(event);
		// let config = libs.getGlobalVar(this.cfg).listViewConfig;
		// console.log(config);
		let value = this.col.isEditableBool ? event.target.checked : (this.col.type === 'picklist' || this.col._isLookUpEdit) ? event.detail.payload.value : this.col.type === 'multipicklist' ? event.detail.payload.values.join(';') : event.target.value;
		// value = event.detail.payload.value;
		this.config.dataTableCfg._saveEdit(true, this.col.fieldName, value);
	}
	
	inlineEditFinish(event) {
		console.log('event ',event.which);
		if (event.which == 27) {
			// let config = libs.getGlobalVar(this.cfg).listViewConfig;
			// console.log(config);
			this.config.dataTableCfg._saveEdit(false);
			// console.log(config);
		}
		if (event.which == 13) {
			// let config = libs.getGlobalVar(this.cfg).listViewConfig;
			// console.log(config);
			this.showEdit = false;
			this.config.dataTableCfg._saveEdit(true);
			// console.log(config);
		}
	}

	getCurrencySymbol() {
		let currency = libs.getGlobalVar(this.cfg).currency;
		/*if (currency.isMultyCurrencyOrg === true) {
			return libs.currencyMap(this.row.CurrencyIsoCode);
		} else {
			return libs.currencyMap(currency.orgCurrency);
		}*/
		if (currency.isMultyCurrencyOrg === true) {
			return this.row.CurrencyIsoCode;
		} else {
			return currency.orgCurrency;
		}
	}

}