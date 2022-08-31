import { LightningElement,api, track } from 'lwc';
import { libs } from 'c/libs';

export default class ServerFilter extends LightningElement {
    @track config;
    @track sFilterfields = [];
    @api cfg;
    @api recordId;
    @track conditionMap={};
    @track allFields = [];
    @track selectedFields = [];
    @track isModalOpen = false;
    connectedCallback(){
        this.config = libs.getGlobalVar(this.cfg);
        console.log(JSON.stringify(this.config.listViewConfig.serverFilters));
        this.sFilterfields = this.config.listViewConfig.colModel;
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
            if(element.type == 'picklist'){
                element.inputTypeComboBox = true;
                element.options.splice(0,0,{label:"All",value:"All"});
            }else if(element.type == 'boolean'){
                element.inputTypeComboBox = true;
                element.options = [];
                element.options.push({label:"All",value:"All"});
                element.options.push({label:"True",value:"true"});
                element.options.push({label:"False",value:"false"});
            }
            else{
                element.inputTypeStr = true;
            } 
        });
    }
    handleChange(event){
        let apiName = (event.currentTarget.id).slice(0, -4);
        if(event.target.value === '' || event.target.value === "All"){
            delete this.conditionMap[apiName];
        }else{
            this.conditionMap[apiName] = event.target.value;
        }
        console.log(JSON.parse(JSON.stringify(this.config)));
        this.fetchRecords();
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
			})
		});
    }
    generateCondition(){
        let condition = '';
        for(let key in this.conditionMap){
            if(this.getColItem(key).type === 'currency' || this.getColItem(key).type === 'boolean' || this.getColItem(key).type === 'double'){
                condition += 'AND ' + key + "="+this.conditionMap[key]+" ";
            }else if(this.getColItem(key).type === 'datetime'){
                condition += 'AND ' + key + ">="+this.conditionMap[key]+"T00:01:01z AND "+ key + "<="+this.conditionMap[key]+"T23:59:59z ";
            }else if(this.getColItem(key).type === 'reference'){
                condition += 'AND ' + key.slice(0,-2) + '.Name ' + " LIKE '"+this.conditionMap[key]+"' ";
            }
            else{
                condition += 'AND ' + key + " LIKE '"+this.conditionMap[key]+"' ";
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
        this.setFieldTypes();
    }
    handleClick(event){
        this.isModalOpen = true;
    }
    handleClose(event){
        this.isModalOpen = false;
    }
}