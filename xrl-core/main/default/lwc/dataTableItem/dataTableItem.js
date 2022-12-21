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

	renderedCallback() {
		if (this.iseditmode && this.row._focus === this.col.fieldName) setTimeout((() => { this.template.querySelector('[data-id="' + this.col.fieldName + '"]').focus(); }), 100);
		//console.log(this.col.options);
		libs.getGlobalVar(this.cfg).listViewConfig.forEach((el)=>{
			if(el.cmpName === 'dataTable'){
				this.config.dataTableCfg = el;
			}
		});
		if (this.col.isEditable && this.row._focus === this.col.fieldName && this.config.dataTableCfg._inlineEdit != undefined){
			this.showEdit = true;
		}
	}

	@api
	get value() {
		let refTmp = '<a href="/{0}" target="_blank" title="{1}">{1}</a>';
		//console.log('type', this.col.type, this.col.fieldName)
		let locale = libs.getGlobalVar(this.cfg).userInfo.locale;
		//console.log(this.col.fieldName, JSON.stringify(this.row), this.row[this.col.fieldName]);
		//this.col.fieldName
		let row,val;
		[row,val] = libs.getLookupRow(this.row, this.col.fieldName);
		if (typeof(this.col._formatter) === 'function') {
			val = this.col._formatter(row, this.col, val);
		} else {
			//let val = libs.getLookupValue(this.row, this.col.fieldName);
			if (this.col.type === 'datetime') {
				//console.log(val);
				// console.log(locale);
				if (val!== undefined && val !=='' && val!==null) {
					val = new Date(val).toLocaleString(locale,{
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
					val = new Date(val).toLocaleString(locale,{
						month : "2-digit",
						day : "2-digit",
						year: "numeric",
						timeZone: libs.getGlobalVar(this.cfg).userInfo.timezone
					});
				}
			}
			if (this.col.type === 'number') {
				val = val ? this.formatNumber(val) : null;
			}
			if (this.col.type === 'double') {
				val = val ? this.formatNumber(val) : null;
			}
			if (this.col.type === 'int') {
				val = val ? this.formatNumber(val) : null;
			}

			if (this.col.type === 'currency') {
				val = val ? (this.formatNumber(val) + '&nbsp;' + this.getCurrencySymbol()): null;
			}

			if (this.col.type === 'reference'){
				val = libs.formatStr(refTmp,[val, row.Name ? row.Name : '']); // Need to investigate this line. Why sometimes for reference we have 'Invalid Name'
			}
			if (this.col.type === 'boolean'){
				this.isBool = true;
			}
			if (this.col.type === 'encryptedstring'){
				val = val ? "*".repeat(val.length) : '';
			}

			if (this.col.isNameField === true) {
				//console.log(this.col.fieldName, JSON.stringify(row), val);
				val = libs.formatStr(refTmp,[row.Id, val]);
			}
		}
		return val;
		//return this.row[this.col.fieldName];
	}

	get style() {
		
		let right = ['number', 'currency','int','double'];
		let val='';
		if (right.indexOf(this.col.type)  > -1) {
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
			value += this.col._uStyle(row, this.col, val);
		}
		return value;
	}


	get editValue() {
		let row,val;
		if (this.col.type === 'boolean'){
			this.isBool = true;
		}
		[row,val] = libs.getLookupRow(this.row, this.col.fieldName);
		return val;
	}

	formatNumber(num) {
		const dotTemlate = ' ';
		return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + dotTemlate).replace(/[,\.].*/,((match) => {
			return match.replace(/ /g,'');
		}));
	}

	inlineEdit(event) {
		// console.log(event);
		// let config = libs.getGlobalVar(this.cfg).listViewConfig;
		// console.log(config);
		this.config.dataTableCfg._saveEdit(true, this.col.fieldName, this.col.isEditableBool ? event.target.checked : event.target.value);
		// console.log(config);
	}
	
	inlineEditFinish(event) {
		console.log(event.which);
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
		if (currency.isMultyCurrencyOrg === true) {
			return libs.currencyMap(this.row.CurrencyIsoCode);
		} else {
			return libs.currencyMap(currency.orgCurrency);
		}
	}

}