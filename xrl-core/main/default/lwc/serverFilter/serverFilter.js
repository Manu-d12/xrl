import { LightningElement,api, track } from 'lwc';
import { libs } from 'c/libs';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ServerFilter extends LightningElement {
    @track config;
    @track sFilterfields = [];
    @api cfg;
    @api recordId;
    @track conditionMap={};
    @track allFields = [];
    @track selectedFields = [];
    @track filterJson;
    @track dataTableJson;
    @track isModalOpen = false;
    @track sValues = [];
    connectedCallback(){
        this.config = libs.getGlobalVar(this.cfg);
        this.config.listViewConfig.forEach((el)=>{
			if(el.cmpName === 'serversideFilter') {
				this.filterJson = el;
			}
            if(el.cmpName === 'dataTable') {
				this.dataTableJson = el;
			}
		});
        this.sFilterfields = this.filterJson.sFilterCols ? this.filterJson.sFilterCols : [];
        for (let key in this.config.describe) {
			this.allFields.push({ label: this.config.describe[key].label, value: this.config.describe[key].name });
		}
        for(let key in this.sFilterfields){
            this.selectedFields.push(this.sFilterfields[key].fieldName);
        }
        libs.sortRecords(this.allFields, 'label', true);
        this.setFieldTypes();
    }
    getColItem(colName) {
		return this.sFilterfields.find(e => {
			return e.fieldName === colName
		});
	}
    setFieldTypes(){
        this.sFilterfields.forEach(element => {
            if(element.type === 'picklist'){
                element.inputTypeComboBox = true;
                if(element.options[0].value !== 'All'){
                    element.options.splice(0,0,{label:"All",value:"All"});
                }
            }else if(element.type === 'boolean'){
                element.inputTypeComboBox = true;
                element.options = [];
                element.options.push({label:"All",value:"All"});
                element.options.push({label:"True",value:"true"});
                element.options.push({label:"False",value:"false"});
            }else if(element.type === 'datetime' || element.type === 'date'){
                element.inputTypeDate= true;
            }
            else{
                element.inputTypeStr = true;
            } 
        });
    }
    handleChange(event){
        let apiName = (event.currentTarget.id).slice(0, -4);
        if(event.target.value === '' || event.target.value === "All" || event.target.value === null){
            delete this.conditionMap[apiName];
        }else{
            this.conditionMap[apiName] = event.target.value;
        }
        if(JSON.parse(JSON.stringify(event.target.value)).includes('All')){
            delete this.conditionMap[apiName];
        }
    }
    fetchRecords(){
        this.config.records = undefined;
        libs.remoteAction(this, 'query', {
			isNeedDescribe: true,
			sObjApiName: this.config.sObjApiName,
			relField: this.config.relField,
			addCondition: this.generateCondition(),
			fields: this.config.fields,
			listViewName: this.config?.listView?.name,
			callback: ((nodeName, data) => {  
				libs.getGlobalVar(this.cfg).records = data[nodeName].records.length > 0 ? data[nodeName].records : undefined;
                this.config.records = libs.getGlobalVar(this.cfg).records;
                const selectedEvent = new CustomEvent('message', { detail: {cmd:'dataTable:refresh',value:'refresh'} });
                this.dispatchEvent(selectedEvent);
			})
		});
    }
    generateCondition(){
        let condition = '';
        /*eslint-disable*/
        for(let key in this.conditionMap){
            console.log(typeof this.conditionMap[key]);
            if(typeof this.conditionMap[key] === 'object' && JSON.parse(JSON.stringify(this.conditionMap[key])).length > 1){
                JSON.parse(JSON.stringify(this.conditionMap[key])).forEach((el,index)=>{
                    if(index === 0){
                        if(this.getColItem(key).type === 'boolean'){
                            condition += 'AND ( ' + key + " = "+el+" ";
                        }else{
                            condition += 'AND (' + key + " LIKE '"+el+"' ";
                        }
                    }else{
                        if(this.getColItem(key).type === 'boolean'){
                            condition += 'OR ' + key + " = "+el+" ";
                        }else{
                            condition += 'OR ' + key + " LIKE '"+el+"' ";
                        }
                    }
                });
                condition += ')';
            }else{
                if(JSON.parse(JSON.stringify(this.conditionMap[key]))[0] !== undefined){
                    if(this.getColItem(key).type === 'currency' || this.getColItem(key).type === 'boolean' || this.getColItem(key).type === 'double'){
                        condition += 'AND ' + key + "="+this.conditionMap[key]+" ";
                    }else if(this.getColItem(key).type === 'datetime'){
                        condition += 'AND ' + key + ">="+this.conditionMap[key]+"T00:01:01z AND "+ key + "<="+this.conditionMap[key]+"T23:59:59z ";
                    }else if(this.getColItem(key).type === 'reference'){
                        condition += 'AND ' + this.config.describe[key].relationshipName + '.Name ' + " LIKE '"+this.conditionMap[key]+"' ";
                    }
                    else if(this.getColItem(key).type === 'id'){
                        condition += 'AND ' + key + "='"+this.conditionMap[key]+"' ";
                    }
                    else{
                        condition += 'AND ' + key + " LIKE '"+this.conditionMap[key]+"' ";
                    }
                }
            }
        }
        console.log(condition);
        return condition;
    }
    handleSelectFields(event) {
        const selectedOptionsList = event.detail.value;
        this.sFilterfields = [];
        this.selectedFields = [];
        selectedOptionsList.forEach(e => {
            this.selectedFields.push(e);
            let col = {'fieldName':e};
			let describe = this.config.describe[e];
            console.log(describe);
			if (col.label === undefined) col.label = describe.label;
			if (col.type === undefined) col.type = describe.type;
			col.updateable = describe.updateable;
			col.isNameField = describe && describe.nameField === true;
			if (col.type === 'picklist') {
				col.options = [];
				describe.picklistValues.forEach(field => {
					col.options.push(
						{ label: field.label, value: field.value }
					)
				});
			}
            this.sFilterfields.push(col);
		});
        this.filterJson.sFilterCols = this.sFilterfields;
        this.config.listViewConfig.forEach((el)=>{
			if(el.cmpName === 'serversideFilter') {
				el = this.filterJson.sFilterCols;
			}
		});
        this.setFieldTypes();
    }
    handleClick(event){
        this.isModalOpen = true;
    }
    handleSave(event){
        libs.remoteAction(this, 'saveListView', { config: this.prepareConfigForSave(), 
            listViewName: this.config?.listView?.name, 
            listViewLabel: this.config?.listView?.label, 
            sObjApiName: this.config.sObjApiName, 
            relField: this.config.relField, 
            addCondition: this.config.listViewConfig.addCondition, 
            listViewAdmin: this.config?.listView?.isAdminConfig ?? false, 
            callback: function(){
                const event = new ShowToastEvent({
                    title: 'success',
                    message: this.config._LABELS.msg_lisViewWasUpdated,
                    variant: 'success'
                });
                this.dispatchEvent(event);
            } });
        this.isModalOpen = false;
    }
    handleModalClose(){
        this.isModalOpen = false;
    }
    prepareConfigForSave() {
		let tmp = JSON.parse(JSON.stringify(this.config.listViewConfig));
        console.log(tmp);
        tmp.forEach((el)=>{
            for (let key in el) {
                if (key.startsWith('_')) delete el[key];
            }
        });
        console.log(tmp);
		// for (let key in tmp) {
		// 	if (key.startsWith('_')) delete tmp[key];
		// }
		return JSON.stringify(tmp, null, '\t')
	}
    handleSelect(event){
        // let apiName = (event.currentTarget.id).slice(0, -4);
        event.target.value = event.detail.payload.values;
        this.handleChange(event);
    }
}