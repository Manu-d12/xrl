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
    @track defaultFields = [];
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
        this.setApplyButton();
        this.setMoreButton();
        this.setResetFilterButton();
        this.sFilterfields = this.filterJson.sFilterCols ? this.filterJson.sFilterCols : [];
        for (let key in this.config.describe) {
            if(this.config.describe[key].type !== 'textarea' && !this.config.describe[key].label.includes('Deprecated')){
			    this.allFields.push({ label: this.config.describe[key].label, value: this.config.describe[key].name });
            }
		}
        for(let key in this.sFilterfields){
            if (!this.sFilterfields[key].isVirtual) this.selectedFields.push(this.sFilterfields[key].fieldName);
        }
        this.defaultFields = this.defaultFields.length === 0 ? this.sFilterfields.map(f => f.fieldName) : this.defaultFields;
        libs.sortRecords(this.allFields, 'label', true);
        this.setFieldTypes(() => {
            if (!this.config.fields) {            
                this.config.fields = this.filterJson.additionalFields ? [...this.selectedFields, ...this.filterJson.additionalFields] : this.selectedFields;
            }
            if (this.filterJson.applyOnInit) this.applyFilter();
        });        
    }
    getColItem(colName) {
		return this.sFilterfields.find(e => {
			return e.fieldName === colName
		});
	}
    setApplyButton(){
        this.config.applyLabel = this.filterJson?.buttons?.apply?.label ?? this.config._LABELS.lbl_apply;
        this.config.applyIcon = this.filterJson?.buttons?.apply?.icon ?? false;
        this.config.applyVariant = this.filterJson?.buttons?.apply?.variant ?? 'brand';
    }
    setMoreButton(){
        this.config.moreLabel = this.filterJson?.buttons?.more?.label ?? this.config._LABELS.lbl_more;
        this.config.moreIcon = this.filterJson?.buttons?.more?.icon ?? false;
        this.config.moreVariant = this.filterJson?.buttons?.more?.variant ?? 'brand';
    }
    setResetFilterButton(){
        this.config.resetFilterLabel = this.filterJson?.buttons?.resetFilter?.label ?? this.config._LABELS.lbl_resetFilters;
        this.config.resetFilterIcon = this.filterJson?.buttons?.resetFilter?.icon ?? false;
        this.config.resetFilterVariant = this.filterJson?.buttons?.resetFilter?.variant ?? 'brand';
    }
    async setFieldTypes(callback) {
        let colClass = 'slds-col slds-size_2-of-12';
        for (let element of this.sFilterfields) {
            element.class = colClass;
            if (element.type === 'picklist') {
                if (element.options && typeof element.options === 'function') {
                    element.options = await element.options(this, libs, element);
                }
                if ((element.isVirtual === undefined || element.isVirtual === false) && element.options[0].value !== 'All' && element.hasAll) {
                    element.options.splice(0, 0, { label: "All", value: "All" });
                }
                element.class = 'slds-col slds-size_1-of-12';
                element.inputTypeComboBox = true;
            } else if (element.type === 'boolean') {
                element.inputTypeComboBox = true;
                element.options = [];
                if (element.hasAll) element.options.push({ label: "All", value: "All" });
                element.options.push({ label: "True", value: "true" });
                element.options.push({ label: "False", value: "false" });
            } else if (element.type === 'datetime' || element.type === 'date') {
                element.inputTypeDate = true;
            } else if (element.type === 'daterange') {
                element.inputTypeDateRange = true;
            }
            else if (element.type === 'reference') {
                element = await this.referenceOperations(element);
                let input = this.template.querySelector(`[data-id="${element.fieldName}"]`);
                input.setOptions(element.options);
            } else {
                element.inputTypeStr = true;
            }
            
            let val = element.defaultValue && typeof element.defaultValue === 'function' ? element.defaultValue(this, libs) : element.defaultValue;
            if (val) {
                this.conditionMap[element.fieldName] = val;
                element.value = val;
                if (element.inputTypeComboBox) {
                    let input = this.template.querySelector(`[data-id="${element.fieldName}"]`);
                    input?.setValue(val);
                }
            }
            else element.value = element.multiselect ? (element.options?.find(opt => opt.name === 'All') ? ['All'] : []) : '';
        }

        for(let field of this.sFilterfields) {    
            if (field.type === 'reference' && field.updateOptions && typeof field.updateOptions === 'function') {
                field.options = field.updateOptions(this, libs, field);
                let input = this.template.querySelector(`[data-id="${field.fieldName}"]`);
                input.setOptions(field.options);
            }
        }

        if (callback && typeof callback === 'function') callback();
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
                element.data = responseData[nodeName].records;
                element.options = element.data.length > 0 ? element.data.map(e => ({ label: e.Name, value: e.Id })) : undefined;
            }
            element._actualType = responseData[nodeName].describe ? JSON.parse(responseData[nodeName].describe)[element.fieldName]?.type : undefined;
          }
        });
        element.inputTypeComboBox = true;
        return element;
    }
      
    async handleChange(event) {
        let apiName = event.target.dataset.id;
        let field = this.sFilterfields.find(f => f.fieldName === apiName);
        if(field.isVirtual){
            await field.virtualCallback(this,libs,event);
            return;
        }
        if (field.inputTypeDateRange) {
            let values = [];
            this.template.querySelectorAll(`[data-id="${apiName}"]`)?.forEach(f => values.push(f.value));
            if (values[0] === '' && values[1] === ''){
                delete this.conditionMap[apiName];
            } else {
                this.conditionMap[apiName] = values;
            }
        }    
        else if (event.target.value === '' || event.target.value === "All" || event.target.value === null) {
            delete this.conditionMap[apiName];
        } else {
            this.conditionMap[apiName] = event.target.value;
        }
        if (field.type === 'reference') {            
            this.sFilterfields.forEach(f => {
                if (f.fieldName !== apiName && f.type === 'reference' && f.updateOptions && typeof f.updateOptions === 'function') {
                    f.options = f.updateOptions(this, libs, f);
                    let input = this.template.querySelector(`[data-id="${f.fieldName}"]`);
                    input.setOptions(f.options);
                }
            });
        }
    }
    applyFilter() {
        this.config.condition = this.generateCondition();
        this.config.state = this.conditionMap;
        this.dispatchEvent(new CustomEvent('message', {
            detail: { cmd: 'filter:refresh', source: this.cfg }
        }));
    }
    generateCondition(){
        let condition = '';
        /*eslint-disable*/
        this.sFilterfields.forEach((field) => {
            //Need to add this to trigger the conditionMap, otherwise if it is hidden then the searchCallback will not work
            if(field.isHidden){
                this.conditionMap[field.fieldName] = '';
            }
        });
        for (let key in this.conditionMap) {
            if(this.conditionMap[key] === '' || this.conditionMap[key].length === 0) continue;
            let colItem = this.getColItem(key);
            
            if (colItem.searchCallback && typeof colItem.searchCallback === 'function') {
				let partCondition = colItem.searchCallback(this, libs, key, this.conditionMap);
				condition += partCondition!=undefined && partCondition!='' ? ' AND ' + partCondition : '';
                continue;
            }
            if (typeof this.conditionMap[key] === 'object' && JSON.parse(JSON.stringify(this.conditionMap[key])).length > 1 && colItem.type !== 'daterange') {
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
                    } 
                    else if (colItem.type === 'date') {
                        condition += 'AND ' + key + "=" + this.conditionMap[key] + " ";
                    }
                    else if (colItem.type === 'daterange') {
                        condition += (this.conditionMap[key][0] ? 'AND ' + key + " >= " + this.conditionMap[key][0] + " " : '') 
                            + (this.conditionMap[key][1] ? 'AND ' + key + " <= " + this.conditionMap[key][1] + " " : '');
                    }
                    else if (colItem.type === 'percent') {
                        condition += 'AND ' + key + "=" + this.conditionMap[key] + " ";
                    }
                    else if (colItem.type === 'reference') {
                        condition += 'AND ' + colItem.fieldName + " = '" + this.conditionMap[key] + "' ";
                    }
                    else if (colItem.type === 'id') {
                        condition += 'AND ' + key + "='" + this.conditionMap[key] + "' ";
                    }
                    else if(colItem.type === 'picklist'){
                        condition += 'AND ' + key + " LIKE '" + this.conditionMap[key] + "' ";
                    }
                    else {
                        // condition += 'AND ' + key + " LIKE '%" + this.conditionMap[key] + "%' ";
                        condition += ' AND ' + this.generateLikeCondition(key,this.conditionMap[key]);
                    }
                }
            }
        }
        console.log('WHERE CAUSE', condition);
        return condition;
    }
    generateLikeCondition(key,str){
        let retCon = '(';
        let arr = str.split(" ");
        arr.forEach(function(element,index) {
            if(index > 0)
                retCon += 'OR ' + key + " LIKE '%" + element + "%' ";
            else{
                retCon += key + " LIKE '%" + element + "%' ";
            }
        });
        if(arr.length > 1){
            retCon += 'OR ' + key + " LIKE '%" + str + "%') ";
        }else{
            retCon += ' )';
        }
        return retCon;
    }
    handleSelectFields(event) {
        const selectedOptionsList = event.detail.value;
        if (selectedOptionsList.filter(f => !this.defaultFields.includes(f)).length === 0 || JSON.stringify(this.config.prevFields) === JSON.stringify(selectedOptionsList)) {
            return;
        }
        this.config.prevFields = this.config.prevFields || [];
        let fieldsNeedToRemove = this.config.prevFields.filter(field => !event.detail.value.includes(field));
        this.sFilterfields = this.sFilterfields.filter(field => !fieldsNeedToRemove.includes(field.fieldName));
        this.selectedFields = this.selectedFields.filter(field => !fieldsNeedToRemove.includes(field));
        this.config.prevFields = selectedOptionsList;
        selectedOptionsList.forEach(e => {
            if(this.sFilterfields.find(el => el.fieldName === e) === undefined) {
                this.selectedFields.push(e);
                let col = {'fieldName':e};
                let describe = this.config.describe[e];
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
                if(col.type === 'reference') {
                    col.sObject = describe.referenceTo[0];
                    col.multiselect = true;
                    col.inputTypeComboBox = true;
                }
                this.sFilterfields.push(col);
            }
		});
        this.filterJson.sFilterCols = this.sFilterfields;
        this.config.listViewConfig.forEach((el)=>{
			if(el.cmpName === 'serversideFilter') {
				el = this.filterJson.sFilterCols;
			}
		});
        this.setFieldTypes();

        this.config.fields = this.filterJson.additionalFields ? [...this.selectedFields, ...this.filterJson.additionalFields] : this.selectedFields;
        this.config.fields = Array.from(new Set(this.config.fields));

        let additionalFields = this.sFilterfields.filter(f => !this.defaultFields.includes(f.fieldName));
        this.dispatchEvent(new CustomEvent('message', { detail: { cmd: 'filter:updateFields', source: this.cfg, fields: additionalFields } }));
    }
    handleClick(event){
        this.isModalOpen = true;
    }
    handleModalClose(){
        this.isModalOpen = false;
    }
    handleSelect(event){
        // let apiName = (event.currentTarget.id).slice(0, -4);
        event.target.value = event.detail.payload.value || event.detail.payload.values;
        this.handleChange(event);
    }
    resetFilters() {
        this.conditionMap = {};
        this.sFilterfields.forEach(f => {
            let val = f.defaultValue && typeof f.defaultValue === 'function' ? f.defaultValue(this, libs) : f.defaultValue;
            if (val)  {
                this.conditionMap[f.fieldName] = val;
                f.value = val;
            } 
            else f.value = f.multiselect ? (f.options.find(opt => opt.name === 'All') ? ['All'] : []) : '';

            this.template.querySelectorAll(`[data-id="${f.fieldName}"]`).forEach(input => {
                input.value = f.value;
                if (f.inputTypeComboBox) input.setValue(f.value);
            });            
        });
        this.sFilterfields.forEach(f => {
            if (f.type === 'reference' && f.updateOptions && typeof f.updateOptions === 'function') {
                f.options = f.updateOptions(this, libs, f);
                let input = this.template.querySelector(`[data-id="${f.fieldName}"]`);
                input.setOptions(f.options);
            }
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