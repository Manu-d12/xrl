import { LightningElement,api, track } from 'lwc';
import { libs } from 'c/libs';

export default class ServerFilter extends LightningElement {
    @track config;
    @track sFilterfields;
    @api cfg;
    @api recordId;
    @track conditionMap={};
    @track allFields = [];
    @track selectedFields = [];
    @track isModalOpen = false;
    connectedCallback(){
        this.config = libs.getGlobalVar(this.cfg);
        this.sFilterfields = this.config.listViewConfig.colModel;
        for (let key in this.config.describe) {
			this.allFields.push({ label: this.config.describe[key].label, value: this.config.describe[key].name });
		}
        for(let key in this.sFilterfields){
            this.selectedFields.push(this.sFilterfields[key].fieldName);
        }
        // console.log(JSON.parse(JSON.stringify(libs.sortRecords(this.allFields, 'label', true))));
        console.log(JSON.parse(JSON.stringify(this.allFields)));
        console.log(JSON.parse(JSON.stringify(this.selectedFields)));
        this.setFieldTypes();
    }
    getColItem(colName) {
		return this.config.listViewConfig.colModel.find(e => {
			return e.fieldName === colName
		});
	}
    setFieldTypes(){
        this.sFilterfields.forEach(element => {
            if(element.type == 'picklist'){
                element.inputTypeComboBox = true;
                element.options.splice(0,0,{label:"All",value:"All"});
            }else{
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
            if(this.getColItem(key).type === 'currency'){
                condition += 'AND ' + key + "="+this.conditionMap[key]+" ";
            }else{
                condition += 'AND ' + key + "='"+this.conditionMap[key]+"' ";
            }
        }
        console.log(condition);
        return condition;
    }
    handleFieldAddition(event){
        console.log(event.target.value);
        this.sFilterfields.push(this.config.describe[event.target.value]);
        console.log(JSON.stringify(this.config.describe[event.target.value]));
        this.setFieldTypes();
    }
    handleChange(event) {
        // Get the list of the "value" attribute on all the selected options
        const selectedOptionsList = event.detail.value;
        this.sFilterfields = [];
        selectedOptionsList.forEach((el)=>{
            this.sFilterfields.push(this.config.describe[el]);
        });
        console.log(this.sFilterfields);
        this.setFieldTypes();
    }
    handleClick(event){
        this.isModalOpen = true;
    }
    handleClose(event){
        this.isModalOpen = false;
    }
}