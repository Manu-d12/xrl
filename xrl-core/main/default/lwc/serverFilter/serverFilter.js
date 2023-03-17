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
    @track count;
    @track countStyle;
    connectedCallback(){
        this.config = libs.getGlobalVar(this.cfg);        
        this.config.listViewConfig.forEach((el)=>{
			if(el.cmpName === 'serversideFilter') {
                this.parseHandlers(el);
				this.filterJson = el;
			}
            if(el.cmpName === 'dataTable') {
				this.dataTableJson = el;
			}
		});
        libs.setGlobalVar(this.cfg, this.config);
        this.sFilterfields = this.filterJson.sFilterCols ? this.filterJson.sFilterCols : [];
        for (let key in this.config.describe) {
			this.allFields.push({ label: this.config.describe[key].label, value: this.config.describe[key].name });
		}
        for(let key in this.sFilterfields){
            if (!this.sFilterfields[key].virtual) this.selectedFields.push(this.sFilterfields[key].fieldName);
        }
        libs.sortRecords(this.allFields, 'label', true);
        this.setFieldTypes();
        if (!this.config.fields) {            
            this.config.fields = this.filterJson.additionalFields ? [...this.selectedFields, ...this.filterJson.additionalFields] : this.selectedFields;
        }
        if (this.filterJson.fetchOnInit) this.fetchRecords();
    }
    getColItem(colName) {
		return this.sFilterfields.find(e => {
			return e.fieldName === colName
		});
	}
    setFieldTypes(){
        this.sFilterfields.forEach(async element => {
            if (element.type === 'picklist') {
                element.inputTypeComboBox = true;
                if (element.options[0].value !== 'All' && element.hasAll) {
                    element.options.splice(0, 0, { label: "All", value: "All" });
                }
            } else if (element.type === 'boolean') {
                element.inputTypeComboBox = true;
                element.options = [];
                if (element.hasAll) element.options.push({ label: "All", value: "All" });
                element.options.push({ label: "True", value: "true" });
                element.options.push({ label: "False", value: "false" });
            } else if (element.type === 'datetime' || element.type === 'date') {
                element.inputTypeDate = true;
            }
            else if (element.type === 'reference') {
                element = await this.referenceOperations(element);
                let input = this.template.querySelector(`[data-id="${element.fieldName}"]`);
                input.setOptions(element.options);
            } else {
                element.inputTypeStr = true;
            }
            
            let val = element.defaultValue && typeof element.defaultValue === 'function' ? element.defaultValue() : element.defaultValue;
            if (val) {
                this.conditionMap[element.fieldName] = val;
                element.value = val;
            }
            else element.value = element.multiselect ? (element.options.find(opt => opt.name === 'All') ? ['All'] : []) : '';
        });
    }
    async referenceOperations(element) {
        element.options = [];
        const { sObject, referenceSoql, formatter } = element;
      
        const query = referenceSoql !== undefined
          ? { isNeedDescribe: true, sObjApiName: sObject, SOQL: referenceSoql }
          : { isNeedDescribe: true, sObjApiName: sObject, relField: '', fields: ['Id', 'Name'], limit: 'LIMIT 10000' };
      
        await libs.remoteAction(this, referenceSoql !== undefined ? 'customSoql' : 'query', {
          ...query,
          callback: (nodeName, responseData) => {
            if (formatter && typeof formatter === 'function') {
                element.options = formatter(responseData[nodeName]);
            } else {
                const records = responseData[nodeName].records;
                element.options = records.length > 0 ? records.map(e => ({ label: e.Name, value: e.Id })) : undefined;
            }
            element._actualType = responseData[nodeName].describe ? JSON.parse(responseData[nodeName].describe)[element.fieldName]?.type : undefined;
          }
        });
        element.inputTypeComboBox = true;
        return element;
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
			relField: this.config.relField === 'Id' ? '' : this.config.relField,
			addCondition: this.generateCondition(),
			fields: this.config.fields,
			listViewName: this.config?.listView?.name,
			callback: ((nodeName, data) => {  
				libs.getGlobalVar(this.cfg).records = data[nodeName].records.length > 0 ? data[nodeName].records : undefined;
                this.config.records = libs.getGlobalVar(this.cfg).records;
				libs.getGlobalVar(this.cfg).state = this.conditionMap;
                const selectedEvent = new CustomEvent('message', { detail: {cmd:'dataTable:refresh',value:'refresh',source:this.cfg} });
                this.dispatchEvent(selectedEvent);
                if (this.filterJson.showCount) {
                    this.count = this.config.records?.length;
                    this.countStyle = this.filterJson.countStyle;
                }
			})
		});
    }
    generateCondition(){
        let condition = '';
        /*eslint-disable*/
        for (let key in this.conditionMap) {
            let colItem = this.getColItem(key);
            if (colItem.virtual) {
                if (colItem.searchCallback && typeof colItem.searchCallback === 'function') condition += colItem.searchCallback(this.conditionMap[key], this.conditionMap);
                continue;
            }
            if (typeof this.conditionMap[key] === 'object' && JSON.parse(JSON.stringify(this.conditionMap[key])).length > 1) {
                JSON.parse(JSON.stringify(this.conditionMap[key])).forEach((el, index) => {                    
                    condition += index === 0 ? ' AND (' : ' OR ';
                    if (colItem.type === 'boolean') {
                        condition += key + " = " + el + " ";
                    } else if (colItem.type === 'reference') {
                        condition += key + " = '" + el + "' ";
                    } else {
                        condition += key + " LIKE '" + el + "' ";
                    }
                });
                condition += ') ';
            } else {
                if (JSON.parse(JSON.stringify(this.conditionMap[key]))[0] !== undefined) {
                    if (colItem.type === 'currency' || colItem.type === 'boolean' || colItem.type === 'double') {
                        condition += 'AND ' + key + "=" + this.conditionMap[key] + " ";
                    } else if (colItem.type === 'datetime') {
                        condition += 'AND ' + key + ">=" + this.conditionMap[key] + "T00:01:01z AND " + key + "<=" + this.conditionMap[key] + "T23:59:59z ";
                    } else if (colItem.type === 'reference') {
                        condition += 'AND ' + colItem.fieldName + " = '" + this.conditionMap[key] + "' ";
                    }
                    else if (colItem.type === 'id') {
                        condition += 'AND ' + key + "='" + this.conditionMap[key] + "' ";
                    }
                    else {
                        condition += 'AND ' + key + " LIKE '%" + this.conditionMap[key] + "%' ";
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
        event.target.value = event.detail.payload.value || event.detail.payload.values;
        this.handleChange(event);
    }
    resetFilters() {
        this.conditionMap = {};
        this.sFilterfields.forEach(f => {
            let val = f.defaultValue && typeof f.defaultValue === 'function' ? f.defaultValue() : f.defaultValue;
            if (val)  {
                this.conditionMap[f.fieldName] = val;
                f.value = val;
            } 
            else f.value = f.multiselect ? (f.options.find(opt => opt.name === 'All') ? ['All'] : []) : '';

            let input = this.template.querySelector(`[data-id="${f.fieldName}"]`);
            input.value = f.value;
            if (f.inputTypeComboBox) input.setValue(f.value);
        });
    }
    parseHandlers(ob) {
        for (let p in ob) {
            if (typeof ob[p] === 'string' && ob[p].includes('function')) {
                ob[p] = eval('(' + ob[p] + ')');
            } else if (typeof ob[p] === 'object') {
                this.parseHandlers(ob[p]);
            }
        }
    };
}