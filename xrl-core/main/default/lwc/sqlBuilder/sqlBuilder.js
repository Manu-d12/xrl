import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { libs } from 'c/libs';
import { sqlBuilderLibs } from './sqlBuilderLibs';

export default class SqlBuilder extends LightningElement {
    @track config = {};
    @api cfg;
    Data = [];
    @track ElementList = [];
    connectedCallback(){
        this.config = libs.getGlobalVar(this.cfg);
        this.config.describeMap = {};
        this.config.describeMap[this.config.sObjApiName] = this.config.describe;
        this.config.sqlBuilder = {};
        this.config.sqlBuilder.fields = [];
        this.config.sqlBuilder.selectedFields = this.config.dialog.listViewConfig.colModel;
        this.config.sqlBuilder.conditions = this.config.dialog.listViewConfig.conditionMap ? this.config.dialog.listViewConfig.conditionMap : [];
        this.config.sqlBuilder.orderings = this.config.dialog.listViewConfig.orderMap ? this.config.dialog.listViewConfig.orderMap : [];
        this.config.sqlBuilder.conditionOrdering = this.config.dialog.listViewConfig.conditionOrdering ? this.config.dialog.listViewConfig.conditionOrdering : '';
        this.config.sqlBuilder.sortOrderOptions = [{label: this.config._LABELS.lbl_ascending, value:'ASC'},
                                                    {label: this.config._LABELS.lbl_descending, value:'DESC'}];
        this.config.sqlBuilder.emptyFieldOptions = [{label:this.config._LABELS.lbl_beginning, value:'NULLS FIRST'},
                                                    {label:this.config._LABELS.lbl_end, value:'NULLS LAST'}];
        this.config.sqlBuilder._objectStack = [{relationShip:this.config.sObjApiName,referredObj:this.config.sObjApiName}];
        this.config.sqlBuilder.fields = libs.sortRecords(this.generateFields(this.config.describe), 'label', true);
        this.config.sqlBuilder.allFields = this.config.sqlBuilder.fields;


        this.config.sqlBuilder.selectedFields.forEach((el)=>{
            this.ElementList.push(el.value);
        });
        if(!this.ElementList){
            this.ElementList = [...this.Data]
        }
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
                query += el.fieldName + ', ';
            });
            query = query.slice(0, -2);
            query += ' FROM ' + this.config.sObjApiName;
            if(this.config.sqlBuilder.conditions.length > 0){
                query += ' WHERE ';
                query += this.generateCondition();
            }
            if(this.config.sqlBuilder.orderings.length > 0){
                let str = ' ORDER BY ';
                this.config.sqlBuilder.orderings.forEach((el)=>{
                    str += el.field.fieldName + ' ' + el.sortOrder + ' ' +el.emptyField + ', ';
                });
                str = str.slice(0, -2);
                query += str;
            }
            return query;
        }
    }
    dialogValues(val){
        if(this.config.sqlBuilder.conditions.length > 0){
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
                str += el.field.fieldName + ' ' + el.sortOrder + ' ' +el.emptyField + ', ';
            });
            str = str.slice(0, -2);
            this.config.dialog.listViewConfig.orderBy = str;
            this.config.dialog.listViewConfig.orderMap = this.config.sqlBuilder.orderings;
        }else{
            this.config.dialog.listViewConfig.orderBy = '';
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
                || el.fieldName.toString().toLowerCase().indexOf(this.config.sqlBuilder.searchTerm) != -1){
                    this.config.sqlBuilder.fields.push(el);
                }
            });
        }
        if(val === "sqlBuilder:deleteSelectedField"){
            let field = event.target.getAttribute('data-val');                
            this.config.sqlBuilder.selectedFields = this.config.sqlBuilder.selectedFields.filter(function(e) { return e.fieldName !== field })
            this.config.dialog.listViewConfig.colModel = this.config.dialog.listViewConfig.colModel.filter(function(e) { return e.fieldName !== field });
        }

        //For Condition Tabs
        if(val === "sqlBuilder:conditions:selectItem"){
            let refObj = event.target.getAttribute('data-ref');
            if( refObj === null){
                let fieldVal = event.target.getAttribute('data-val');      
                let selectedField = this.config.sqlBuilder.fields.find((el) => el.fieldName === fieldVal);
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
            if(this.config.sqlBuilder.currentCondition.index === undefined){
                this.config.sqlBuilder.currentCondition.index = this.config.sqlBuilder.conditions.length + 1;
                this.config.sqlBuilder.conditionOrdering += (this.config.sqlBuilder.conditions.length + 1) === 1 ?
                (this.config.sqlBuilder.conditions.length + 1) : ' AND ' + (this.config.sqlBuilder.conditions.length + 1);
                this.config.sqlBuilder.conditions.push(this.config.sqlBuilder.currentCondition);
            }else{
                let fieldInd = this.config.sqlBuilder.conditions.findIndex((el)=> el.index.toString() === this.config.sqlBuilder.currentCondition.index);
                this.config.sqlBuilder.conditions[fieldInd] = this.config.sqlBuilder.currentCondition;
            }
            this.dialogValues(true);
            this.config.sqlBuilder.conditionOperations = false;
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
            //Need to rebuild a 
            
            // var regExp = new RegExp(' *?(OR|AND)*? *?' + index + ' *?(OR|AND)*? *?','gi');
            // this.config.sqlBuilder.conditionOrdering = this.config.sqlBuilder.conditionOrdering.replace(regExp,'');
            console.log('DELETING condition', index, this.config.sqlBuilder.conditionOrdering);
            this.dialogValues(true);
        }
        if(val === "sqlBuilder:conditions:editSelectedCondition"){
            let indexVal = event.target.getAttribute('data-val'); 
            let selectedCondition = this.config.sqlBuilder.conditions.find((el)=> el.index.toString() === indexVal);
            console.log('HERE>',JSON.parse(JSON.stringify(selectedCondition)));
            this.config.sqlBuilder.conditionOperations = [];
            // if(selectedCondition.fieldType === 'picklist'){
            //     this.config.sqlBuilder.currentCondition.fieldOptions = selectedCondition.options;
            // }
            if(sqlBuilderLibs[selectedCondition.fieldType + 'FilterActions']){
                sqlBuilderLibs[selectedCondition.fieldType + 'FilterActions'](this.config._LABELS).forEach((el)=>{
                    this.config.sqlBuilder.conditionOperations.push(el);
                });
            }else{
                this.config.sqlBuilder.conditionOperations = [
                    { label: 'Contains', value: 'cn' },
                    { label: 'Is Equal', value: 'eq' },
                    { label: 'Not Is Equal', value: 'neq' },
                ];
            }
            this.config.sqlBuilder.currentCondition= selectedCondition;
            this.config.sqlBuilder.openConditionInput = {
                isPicklist: this.config.sqlBuilder.currentCondition.fieldType === 'picklist' ? true : false,
                isRange: this.config.sqlBuilder.currentCondition.operator.value === 'rg' ? true : false
            };
        }
        if(val === "sqlBuilder:conditions:orderingConditions"){
            console.log('sqlBuilder:conditions:orderingConditions', this.config.sqlBuilder);
            this.config.sqlBuilder.conditionOrdering = event.target.value;
            this.dialogValues(true);
        }
        //For ordering
        if(val === "sqlBuilder:ordering:selectItem"){
            let refObj = event.target.getAttribute('data-ref');
            if( refObj === null){
                let orderField = event.target.getAttribute('data-val');
                let selectedField = this.config.sqlBuilder.fields.find((el) => el.fieldName === orderField);
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
            this.dialogValues(true);
        }
        if(val === "sqlBuilder:ordering:delete"){
            let field = event.target.getAttribute('data-val');
            this.config.sqlBuilder.orderings = this.config.sqlBuilder.orderings.filter(e => e.field.fieldName !== field);
            this.config.dialog.listViewConfig.orderMap = this.config.sqlBuilder.orderings;
            this.dialogValues(true);
        }
    }
    upsertArray(array, item) { 
        const i = array.findIndex(_item => _item.field.fieldName === item.field.fieldName);
        if (i > -1) array[i] = item; // (2)
        else array.push(item);
    }
    toggleArrayElement(array, value) {
        let field = this.config.sqlBuilder.allFields.find((el) => el.fieldName === value);
        let isValExists = array.find((el) => el.fieldName === value);
        if(isValExists){
            array = array.filter(e => e.fieldName !== value);
        }else{
            array.push(field); 
            // this.addIntoDialog(field);
            this.config.dialog.listViewConfig.colModel.push(field);
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
                fields.push({ label: describe[key].relationshipName + ' > ', fieldName: describe[key].relationshipName, refObj : describe[key].referenceTo[0], css: 'slds-item' });	
            }else{
                let itemCss = this.config.sqlBuilder.selectedFields.find(el => el.fieldName === (objStr ? objStr + describe[key].name : describe[key].name)) ? 'slds-item slds-theme_alt-inverse' : 'slds-item';
                let fieldMap = { 
                    label: describe[key].label, 
                    fieldName: objStr ? objStr + describe[key].name : describe[key].name, 
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
                if (describe[key].updateable) {
                    if (fieldMap.type === 'picklist' || fieldMap.type === 'reference') {
                        fieldMap.isEditableAsPicklist = true;
                        console.log('picklist', fieldMap);
                    } else if (fieldMap.type === 'boolean') {
                        fieldMap.isEditableBool = true;
                    } else {
                        fieldMap.isEditableRegular = true;
                    }
                } else {
                    fieldMap.isEditable = false;
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
    // addIntoDialog(field){
    //     this.config.dialog.listViewConfig.colModel.push(field);
    // }
    ConditionFilteringClass = "slds-popover slds-popover_tooltip slds-nubbin_bottom-left slds-fall-into-ground slds-hide";
    toggleConditionFilteringHelp() {
        this.ConditionFilteringClass = this.ConditionFilteringClass === 'slds-popover slds-popover_tooltip slds-nubbin_bottom-left slds-fall-into-ground slds-hide' ? "slds-popover slds-popover_tooltip slds-nubbin_bottom-left slds-rise-from-ground" : "slds-popover slds-popover_tooltip slds-nubbin_bottom-left slds-fall-into-ground slds-hide"
    }


    Change(event){
        this.Data = event.detail.join(', ');
    }

     DragStart(event) {
        event.target.classList.add('drag')
    }

    DragOver(event) {
        event.preventDefault()
        return false
    }
    Drop(event) {
        event.stopPropagation()
        const Element = this.template.querySelectorAll('.Items')
        const DragValName = this.template.querySelector('.drag').textContent
        const DropValName = event.target.textContent

        if(DragValName === DropValName){ return false }
        const index = this.config.sqlBuilder.selectedFields.findIndex((el)=> el.value === DropValName);
        const dragIndex = this.config.sqlBuilder.selectedFields.findIndex((el)=> el.value === DragValName);
        this.ElementList = this.ElementList.reduce((acc, curVal, CurIndex) => {
        // this.config.sqlBuilder.selectedFields = this.config.sqlBuilder.selectedFields.reduce((acc, curVal, CurIndex) => {
            if(CurIndex === index){
                if(dragIndex > index){
                    return [...acc, DragValName, curVal];
                }else{
                    return [...acc, curVal, DragValName];
                }
            }
            else if(curVal !== DragValName){
                return [...acc, curVal]
            }
            return acc
        }, [])

        Element.forEach(element => {
            element.classList.remove('drag')
        });

        let copySelectedFields = this.config.sqlBuilder.selectedFields;
        this.config.sqlBuilder.selectedFields = [];
        this.config.dialog.listViewConfig.colModel = [];
        this.ElementList.forEach((el)=>{
            let item = copySelectedFields.find((e) => e.value === el);
            this.addIntoDialog(item);
            this.config.sqlBuilder.selectedFields.push(item);
        });
        return this.ElementList
    }
}