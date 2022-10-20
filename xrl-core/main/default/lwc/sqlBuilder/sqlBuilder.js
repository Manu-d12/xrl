import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { libs } from 'c/libs';
import { sqlBuilderLibs } from './sqlBuilderLibs';

export default class SqlBuilder extends LightningElement {
    @track config = {};
    @api cfg;
    connectedCallback(){
        this.config = libs.getGlobalVar(this.cfg);
        this.config.describeMap = {};
        this.config.describeMap[this.config.sObjApiName] = this.config.describe;
        this.config.sqlBuilder = {};
        this.config.sqlBuilder.fields = [];
        this.config.sqlBuilder.selectedFields = [];
        this.config.sqlBuilder.conditions = this.config.dialog.listViewConfig.conditionMap ? this.config.dialog.listViewConfig.conditionMap : [];
        this.config.sqlBuilder.orderings = this.config.dialog.listViewConfig.orderMap ? this.config.dialog.listViewConfig.orderMap : [];
        this.config.sqlBuilder.conditionOrdering = this.config.dialog.listViewConfig.conditionOrdering ? this.config.dialog.listViewConfig.conditionOrdering : '';
        this.config.dialog.listViewConfig.colModel.forEach((el)=>{
            let fieldMap = { 
                label: el.label, 
                value: el.fieldName, 
                css: 'slds-item', 
                type: el.type,
                updateable: el.updateable,
                isNameField: el && el.nameField === true
            };
            if(el.type === 'picklist'){
                fieldMap.options = [];
                el.options.forEach(field => {
                    fieldMap.options.push(
                        { label: field.label, value: field.value }
                    )
                });
            }
            this.config.sqlBuilder.selectedFields.push(fieldMap);
        });
        this.config.sqlBuilder.sortOrderOptions = [{label: this.config._LABELS.lbl_ascending, value:'ASC'},
                                                    {label: this.config._LABELS.lbl_descending, value:'DESC'}];
        this.config.sqlBuilder.emptyFieldOptions = [{label:this.config._LABELS.lbl_beginning, value:'NULLS FIRST'},
                                                    {label:this.config._LABELS.lbl_end, value:'NULLS LAST'}];
        this.config.sqlBuilder._objectStack = [{relationShip:this.config.sObjApiName,referredObj:this.config.sObjApiName}];
        this.config.sqlBuilder.fields = libs.sortRecords(this.generateFields(this.config.describe), 'label', true);
        this.config.sqlBuilder.allFields = this.config.sqlBuilder.fields;
    }
    get breadcrumb(){
        let breadCrumbStr = ''; 
        this.config.sqlBuilder._objectStack.forEach((el)=>{
            breadCrumbStr += el.relationShip + ' > ';
        });
        return breadCrumbStr;
    }
    get livequery(){
        if(this.config.sqlBuilder.selectedFields.length > 0){
            let query = 'SELECT ';
            this.config.sqlBuilder.selectedFields.forEach((el)=>{
                query += el.value + ', ';
            });
            query = query.slice(0, -2);
            query += ' FROM ' + this.config.sObjApiName;
            if(this.config.sqlBuilder.conditions.length > 0){
                query += ' WHERE ';
                query += this.generateCondition();
                this.config.dialog.listViewConfig.addCondition = 'AND (' + this.generateCondition() + ')';
                this.config.dialog.listViewConfig.conditionMap = this.config.sqlBuilder.conditions;
                this.config.dialog.listViewConfig.conditionOrdering = this.config.sqlBuilder.conditionOrdering;
            }else{
                this.config.dialog.listViewConfig.addCondition = '';
                this.config.dialog.listViewConfig.conditionMap = [];
                this.config.dialog.listViewConfig.conditionOrdering = '';
            }
            if(this.config.sqlBuilder.orderings.length > 0){
                let str = ' ORDER BY ';
                this.config.sqlBuilder.orderings.forEach((el)=>{
                    str += el.field.value + ' ' + el.sortOrder + ' ' +el.emptyField + ', ';
                });
                str = str.slice(0, -2);
                query += str;
                this.config.dialog.listViewConfig.orderBy = str;
                this.config.dialog.listViewConfig.orderMap = this.config.sqlBuilder.orderings;
            }else{
                this.config.dialog.listViewConfig.orderBy = '';
            }
            return query;
        }
    }
    handleBuilderEvent(event){
        let val = event.target.getAttribute('data-id');

        //For Select Fields Tabs
        if(val === "sqlBuilder:selectItem"){
            console.log(event.target.getAttribute('data-val'));
            let refObj = event.target.getAttribute('data-ref');
            if( refObj === null){
                this.toggleArrayElement(this.config.sqlBuilder.selectedFields,event.target.getAttribute('data-val'));
                event.target.classList.toggle('slds-theme_alt-inverse');
            }else{
                if(this.config.sqlBuilder._objectStack.length <=4 ){
                    this.config.sqlBuilder._objectStack.push({relationShip:event.target.getAttribute('data-val'),referredObj:refObj});
                    this.loadFields(refObj);
                }else{
                    const toast = new ShowToastEvent({
                        title: 'Error',
                        message: this.config._LABELS.lbl_maxLevelReached,
                        variant: 'error'
                    });
                    this.dispatchEvent(toast);
                }
            }
            this.config.sqlBuilder.searchTerm = '';
        }
        if(val === "sqlBuilder:back"){
            if(this.config.sqlBuilder._objectStack.length > 1){
                this.config.sqlBuilder._objectStack.pop();
                this.loadFields(this.config.sqlBuilder._objectStack[this.config.sqlBuilder._objectStack.length-1].referredObj);
            }
            this.config.sqlBuilder.searchTerm = '';
        }
        if(val === "sqlBuilder:fieldSearch"){
            this.config.sqlBuilder.searchTerm = event.target.value.toLowerCase();                
            this.config.sqlBuilder.fields = [];
            this.config.sqlBuilder.allFields.forEach((el)=>{
                if(el['label'].toString().toLowerCase().indexOf(this.config.sqlBuilder.searchTerm) != -1 
                || el.value.toString().toLowerCase().indexOf(this.config.sqlBuilder.searchTerm) != -1){
                    this.config.sqlBuilder.fields.push(el);
                }
            });
        }
        if(val === "sqlBuilder:deleteSelectedField"){
            let field = event.target.getAttribute('data-val');                
            this.config.sqlBuilder.selectedFields = this.config.sqlBuilder.selectedFields.filter(function(e) { return e.value !== field })
            this.config.dialog.listViewConfig.colModel = this.config.dialog.listViewConfig.colModel.filter(function(e) { return e.fieldName !== field });
        }

        //For Condition Tabs
        if(val === "sqlBuilder:conditions:selectItem"){
            let refObj = event.target.getAttribute('data-ref');
            if( refObj === null){
                let fieldVal = event.target.getAttribute('data-val'); 
                // event.target.classList.toggle('slds-theme_alt-inverse');     
                let selectedField = this.config.sqlBuilder.fields.find((el) => el.value === fieldVal);
                console.log(selectedField);
                this.config.sqlBuilder.conditionOperations = [];
                this.config.sqlBuilder.currentCondition = {};
                this.config.sqlBuilder.currentCondition.field = fieldVal;
                this.config.sqlBuilder.currentCondition.fieldType = selectedField.type;
                if(selectedField.type === 'picklist'){
                    this.config.sqlBuilder.currentCondition.fieldOptions = selectedField.options;
                }
                if(sqlBuilderLibs[selectedField.type + 'FilterActions']){
                    sqlBuilderLibs[selectedField.type + 'FilterActions'](this.config._LABELS).forEach((el)=>{
                        this.config.sqlBuilder.conditionOperations.push(el);
                    });
                }else{
                    this.config.sqlBuilder.conditionOperations = [
                        { label: 'Contains', value: 'cn' },
                        { label: 'Is Equal', value: 'eq' },
                        { label: 'Not Is Equal', value: 'neq' },
                    ];
                }
                console.log(this.config.sqlBuilder.conditionOperations);
                this.config.sqlBuilder.openConditionInput = false;
            }else{
                if(this.config.sqlBuilder._objectStack.length <=4 ){
                    this.config.sqlBuilder._objectStack.push({relationShip:event.target.getAttribute('data-val'),referredObj:refObj});
                    this.loadFields(refObj);
                }else{
                    const toast = new ShowToastEvent({
                        title: 'Error',
                        message: this.config._LABELS.lbl_maxLevelReached,
                        variant: 'error'
                    });
                    this.dispatchEvent(toast);
                }
            }
        }
        if(val === "sqlBuilder:conditions:selectOperation"){
            let operator = event.target.getAttribute('data-val');     
            this.config.sqlBuilder.currentCondition.operator = sqlBuilderLibs[this.config.sqlBuilder.currentCondition.fieldType + 'FilterActions'](this.config._LABELS).find((el)=> el.value === operator);
            this.config.sqlBuilder.openConditionInput = {
                isPicklist: this.config.sqlBuilder.currentCondition.fieldType === 'picklist' ? true : false,
                isRange: operator === 'rg' ? true : false
            };
        }
        if(val === "sqlBuilder:conditions:addCondition"){
            this.config.sqlBuilder.openConditionInput = false;
            this.config.sqlBuilder.conditionOperations = [];
            this.config.sqlBuilder.currentCondition.key = this.config.sqlBuilder.conditions.field + this.config.sqlBuilder.conditions.length;
            this.config.sqlBuilder.currentCondition.index = this.config.sqlBuilder.conditions.length + 1;
            this.config.sqlBuilder.conditionOrdering += (this.config.sqlBuilder.conditions.length + 1) === 1 ?
            (this.config.sqlBuilder.conditions.length + 1) : ' AND ' + (this.config.sqlBuilder.conditions.length + 1);
            this.config.sqlBuilder.conditions.push(this.config.sqlBuilder.currentCondition);
        }
        if(val === "sqlBuilder:conditions:conditionText"){
            this.config.sqlBuilder.currentCondition.value = event.target.value;
        }
        if(val === "sqlBuilder:conditions:conditionTextRange"){
            this.config.sqlBuilder.currentCondition.valueRange = event.target.value;
        }
        if(val === "sqlBuilder:conditions:deleteSelectedCondition"){
            let index = event.target.getAttribute('data-val');  
            this.config.sqlBuilder.conditions = this.config.sqlBuilder.conditions.filter(e => e.index.toString() !== index);
        }
        if(val === "sqlBuilder:conditions:orderingConditions"){
            this.config.sqlBuilder.conditionOrdering = event.target.value;
        }
        //For ordering
        if(val === "sqlBuilder:ordering:selectItem"){
            let refObj = event.target.getAttribute('data-ref');
            if( refObj === null){
                let orderField = event.target.getAttribute('data-val');
                let selectedField = this.config.sqlBuilder.fields.find((el) => el.value === orderField);
                this.config.sqlBuilder.currentOrder = {field:selectedField,
                    emptyField:this.config.sqlBuilder.emptyFieldOptions[0].value};
            }else{
                if(this.config.sqlBuilder._objectStack.length <=4 ){
                    this.config.sqlBuilder._objectStack.push({relationShip:event.target.getAttribute('data-val'),referredObj:refObj});
                    this.loadFields(refObj);
                }else{
                    const toast = new ShowToastEvent({
                        title: 'Error',
                        message: this.config._LABELS.lbl_maxLevelReached,
                        variant: 'error'
                    });
                    this.dispatchEvent(toast);
                }
            }
        }
        if(val === "sqlBuilder:ordering:sortOrder"){
            let sortOrder = event.target.value;  
            this.config.sqlBuilder.currentOrder.sortOrder = sortOrder;
        }
        if(val === "sqlBuilder:ordering:emptyFieldPosition"){
            let emptyField = event.target.value;  
            this.config.sqlBuilder.currentOrder.emptyField = emptyField;
        }
        if(val === "sqlBuilder:ordering:addOrdering"){
            this.upsertArray(this.config.sqlBuilder.orderings,this.config.sqlBuilder.currentOrder);
            this.config.sqlBuilder.currentOrder = false;
        }
        if(val === "sqlBuilder:ordering:delete"){
            let field = event.target.getAttribute('data-val');
            this.config.sqlBuilder.orderings = this.config.sqlBuilder.orderings.filter(e => e.field.value !== field);
            this.config.dialog.listViewConfig.orderMap = this.config.sqlBuilder.orderings;
        }
    }
    upsertArray(array, item) { 
        const i = array.findIndex(_item => _item.field.value === item.field.value);
        if (i > -1) array[i] = item; // (2)
        else array.push(item);
    }
    toggleArrayElement(array, value) {
        let field = this.config.sqlBuilder.allFields.find((el) => el.value === value);
        let isValExists = array.find((el) => el.value === value);
        if(isValExists){
            array = array.filter(e => e.value !== value);
        }else{
            array.push(field); 
            this.addIntoDialog(field);
        }
    }
    loadFields(sObjName){
        let objStr = '';
        this.config.sqlBuilder._objectStack.forEach((el,index)=>{
            if(index === 0){  }
            else{
                objStr += el.relationShip + '.';
            }
        });
        if(this.config.describeMap[sObjName]){
            this.config.sqlBuilder.fields = this.generateFields(this.config.describeMap[sObjName],objStr);
            this.config.sqlBuilder.fields = libs.sortRecords(this.config.sqlBuilder.fields, 'label', true);
            this.config.sqlBuilder.allFields = this.config.sqlBuilder.fields;
        }else{
            libs.remoteAction(this, 'objectFieldList', { sObjApiName: sObjName, 
                callback: function(cmd,data){
                    let objectFields = JSON.parse(data[cmd].describe);
                    this.config.describeMap[sObjName] = objectFields;
                    this.config.sqlBuilder.fields = this.generateFields(objectFields,objStr);   
                    this.config.sqlBuilder.fields = libs.sortRecords(this.config.sqlBuilder.fields, 'label', true);
                    this.config.sqlBuilder.allFields = this.config.sqlBuilder.fields;    
                } });
        }
    }
    generateFields(describe,objStr){
        let fields = [];
        for (let key in describe) {
            if (describe[key].type === 'reference') {
                fields.push({ label: describe[key].relationshipName + ' > ', value: describe[key].relationshipName, refObj : describe[key].referenceTo[0], css: 'slds-item' });	
            }else{
                let itemCss = this.config.sqlBuilder.selectedFields.find(el => el.value === (objStr ? objStr + describe[key].name : describe[key].name)) ? 'slds-item slds-theme_alt-inverse' : 'slds-item';
                let fieldMap = { 
                    label: describe[key].label, 
                    value: objStr ? objStr + describe[key].name : describe[key].name, 
                    css: itemCss, 
                    type: describe[key].type,
                    updateable: describe[key].updateable,
                    isNameField: describe[key] && describe[key].nameField === true
                };
                if(describe[key].type === 'picklist'){
                    fieldMap.options = [];
                    describe[key].picklistValues.forEach(field => {
                        fieldMap.options.push(
                            { label: field.label, value: field.value }
                        )
                    });
                }
                fields.push(fieldMap);
            }
        }
        return fields;
    }
    generateCondition(){
        let condition = this.config.sqlBuilder.conditionOrdering;
        this.config.sqlBuilder.conditions.forEach((el)=>{
            condition = condition.replace(el.index.toString(),'('+sqlBuilderLibs[el.fieldType + '__condition'](el) + ')');
        });
        return condition;
    }
    addIntoDialog(field){
        let record = {
            "fieldName":field.value,
            "type":field.type,
            "label":field.label,
            "updateable": field.updateable,
            "isNameField": field.isNameField
        };
        if(field.type === 'picklist'){
            record.options = field.options;
        }
        this.config.dialog.listViewConfig.colModel.push(record);
    }
}