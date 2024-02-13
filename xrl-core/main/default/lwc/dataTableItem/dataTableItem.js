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
			if (this.showEdit && (this.col.type === 'multipicklist' || this.col.type === 'picklist' || this.col.isEditableAsPicklist || this.col._isLookUpEdit || this.col.type === 'boolean') && (event.which == 13 || event.which == 27)) {	
				this.inlineEditFinish(event);
				console.log('In event Listener dataTableItem', this.showEdit, this.col.fieldName);
			}
		});
		if(this.col._advanced?.newItemCreation){
			this.config._newItemCreation = this.col._advanced?.newItemCreation;
		}
		if(this.col._advanced?.enableNewOption){
			this.config._enableNewOption = this.col._advanced?.enableNewOption;
		}
	}

	@api
	get value() {
		let refTmp = '<a href="/{0}{1}" target="_blank" title="{2}">{2}</a>';
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
				// eval(this.col._formatter);
				val = this.col._formatter(row, this.col, val);
			}catch(e) {
				// console.error(e);
				val = libs.formatCallbackErrorMessages(e,'cell');
				return val;
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
				if(val === null || val === undefined || val === '') return null;
				else if(typeof val === 'number' || !isNaN(val)) return this.formatNumber(val);
				return null;
				// return val!=null && val!=undefined ? this.formatNumber(val) : null;
			}
			if (this.col.type === 'double') {
				if(val === null || val === undefined || val === '') return null;
				else if(typeof val === 'number' || !isNaN(val)) return this.formatNumber(val);
				return null;
				// return val!=null && val!=undefined ? this.formatNumber(val) : null;
			}
			if (this.col.type === 'int') {
				if(val === null || val === undefined || val === '') return null;
				else if(typeof val === 'number' || !isNaN(val)) return this.formatNumber(val);
				return null;
				// return val!=null && val!=undefined ? this.formatNumber(val) : null;
			}
			if (this.col.type === 'percent') {
				if(val === null || val === undefined || val === '') return null;
				else if(typeof val === 'number' || !isNaN(val)) return this.formatNumber(val)+'%';
				return null;
				// return val!=null && val!=undefined && typeof val === 'number' ?  this.formatNumber(val)+'%' : null;
			}

			if (this.col.type === 'currency') {
				if(val === null || val === undefined || val === '') return null;
				else if(typeof val === 'number' || !isNaN(val)) return this.formatNumber(val, this.getCurrencySymbol());
				return null;
				// return val!=null && val!=undefined && typeof val === 'number' ? this.formatNumber(val, this.getCurrencySymbol()) : null ;
			}

			if (this.col.type === 'reference'){
				return libs.formatStr(refTmp,[libs.portalUrl(), val, row.Name ? row.Name : row[config.objectNameFieldsMap?.get(this.col.referenceTo)] ? row[config.objectNameFieldsMap?.get(this.col.referenceTo)] : '']); // Need to investigate this line. Why sometimes for reference we have 'Invalid Name'
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
				return libs.formatStr(refTmp,[libs.portalUrl(), this.col.fieldName.split('.')[1] !== undefined && row[this.col.fieldName.split('.')[0]] !== undefined ? row[this.col.fieldName.split('.')[0]].Id : row.Id, val]);
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
				//passing this.row instead of row as having a issue when fieldName is quote1.StrataVAR__Part_Number__c 
				//the row value is coming as blank, need to investigate further, issue in libs.getLookupRow function
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
			if(this.col.type === 'picklist'){
				val = [val];
			}
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
		let value = this.col.isEditableBool ? event.target.checked : this.col.type === 'multipicklist' ? event.detail.payload.values.join(';') : (this.col.type === 'picklist' || this.col._isLookUpEdit || this.col.isEditableAsPicklist) ? event.detail.payload.values[0] : event.target.value;
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
	passToDataTable(event){
		//dispatching event for the parent component
        this.dispatchEvent(new CustomEvent('opennewdialog', {
            detail: {
                'data' : event.detail
            }
        }));
	}
	@api updateMultiselect(event){
		console.log('updateMultiselect');
		this.template.querySelector('c-multiselect').handleEvent(JSON.parse(JSON.stringify(event)));
	}
}