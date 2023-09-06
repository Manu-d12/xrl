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
        this.config.sqlBuilder.conditions = this.config.dialog.listViewConfig?.conditionMap ?? [];
        this.config.sqlBuilder.conditions.forEach((el) => {
            el._formattedValue = this.formatConditionValue(el, el.value);
            el._formattedValueRange = el.valueRange ? this.formatConditionValue(el, el.valueRange) : undefined;
        });
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
            this.ElementList.push(el.fieldName);
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
    get livequery() {
        const { sqlBuilder, sObjApiName } = this.config;
      
        if (sqlBuilder.selectedFields.length === 0) {
          return null;
        }
      
        const selectedFields = sqlBuilder.selectedFields.map(({ fieldName }) => fieldName).join(", ");
        const whereClause = sqlBuilder.conditions.length > 0 ? ` WHERE ${this.generateCondition()}` : "";
        const orderByClause = sqlBuilder.orderings.length > 0
          ? ` ORDER BY ${sqlBuilder.orderings.map(({ field: { fieldName }, sortOrder, emptyField }) => `${fieldName} ${sortOrder} ${emptyField}`).join(", ")}`
          : "";
      
        return `SELECT ${selectedFields} FROM ${sObjApiName}${whereClause}${orderByClause}`;
      }
      
    dialogValues(val){
        this.config.dialog.listViewConfig.colModel = this.config.sqlBuilder.selectedFields;
        let conStr = this.generateCondition();
        if(this.config.sqlBuilder.conditions.length > 0 && conStr.length > 0){
            this.config.dialog.listViewConfig.addCondition = 'AND (' + conStr  + ')';
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
    async handleBuilderEvent(event){
        let val = event.target.getAttribute('data-id');

        //For Select Fields Tabs
        if(val === "sqlBuilder:selectItem"){
            console.log(event.target.getAttribute('data-val'));
            let refObj = event.target.getAttribute('data-ref');
            if( refObj === null){
                //adding the validation of 20 max columns
                if(this.config.sqlBuilder.selectedFields.length < 20){
                    event.target.classList.add('slds-theme_alt-inverse');
                    let col = this.config.sqlBuilder.fields.find((el) => el.fieldName === event.target.getAttribute('data-val'));
                    if(col !== undefined){
                        col.css = 'slds-item slds-theme_alt-inverse';
                    }
                    this.toggleArrayElement(this.config.sqlBuilder.selectedFields,event.target.getAttribute('data-val'));
                    this.ElementList.push(event.target.getAttribute('data-val'));
                    this.dialogValues();
                }else{
                    const toast = new ShowToastEvent({
                        title: 'Error',
                        message: this.config._LABELS.msg_youCantaddMoreThan20Fields,
                        variant: 'error'
                    });
                    this.dispatchEvent(toast);
                }
            }else{
                if(this.config.sqlBuilder._objectStack.length <=4 ){
                    this.config.sqlBuilder._objectStack.push({relationShip:event.target.getAttribute('data-val'),referredObj:refObj});
                    this.loadFields(refObj);
                    this.config.sqlBuilder.isBackNeeded = this.config.sqlBuilder._objectStack.length > 1;
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
                this.config.sqlBuilder.isBackNeeded = this.config.sqlBuilder._objectStack.length !== 1;
            }else{
                this.config.sqlBuilder.isBackNeeded = false;
            }
            this.config.sqlBuilder.searchTerm = '';
        }
        if(val === "sqlBuilder:fieldSearch"){
            this.config.sqlBuilder.searchTerm = event.target.value.toLowerCase();                
            this.config.sqlBuilder.fields = [];
            this.config.sqlBuilder.allFields.forEach((el)=>{
                if((el.label != null && el.label.toString().toLowerCase().indexOf(this.config.sqlBuilder.searchTerm) != -1) 
                ||(el.fieldName != null && el.fieldName.toString().toLowerCase().indexOf(this.config.sqlBuilder.searchTerm) != -1)
                ||(el.type != null && el.type.toString().toLowerCase().indexOf(this.config.sqlBuilder.searchTerm) != -1)){
                    this.config.sqlBuilder.fields.push(el);
                }
            });
        }
        if(val === "sqlBuilder:deleteSelectedField"){
            let field = event.target.getAttribute('data-val');   
            this.config.sqlBuilder.lastDeletedField = field;             
            this.config.sqlBuilder.selectedFields = this.config.sqlBuilder.selectedFields.filter(function(e) { return e.fieldName !== field });
            let col = this.config.sqlBuilder.fields.find((el) => el.fieldName === field);
            if(col !== undefined){
                col.css = 'slds-item';
            }
            this.ElementList = this.ElementList.filter(function(e) { return e !== field; });
            this.dialogValues();
        }

        //For Condition Tabs
        if(val === "sqlBuilder:conditions:selectItem"){
            let refObj = event.target.getAttribute('data-ref');
            if( refObj === null){
                let fieldVal = event.target.getAttribute('data-val');      
                let selectedField = this.config.sqlBuilder.fields.find((el) => el.fieldName === fieldVal);
                this.config.sqlBuilder.openConditionInput = false;
                this.config.sqlBuilder.conditionOperations = [];
                this.config.sqlBuilder.currentCondition = {};
                this.config.sqlBuilder.currentCondition.field = fieldVal;
                this.config.sqlBuilder.currentCondition.fieldType = selectedField.type;
                this.config.sqlBuilder.currentCondition.referenceTo = selectedField.referenceTo;
                this.config.sqlBuilder.noOperationError = false;
                if(selectedField.type === 'picklist'){
                    this.config.sqlBuilder.currentCondition.fieldOptions = selectedField.options;
                }
                if(selectedField.type === 'boolean'){
                    this.config.sqlBuilder.currentCondition.fieldOptions = [
                        {label:"True",value:"True"},
                        {label:"False",value:"False"}
                    ];
                }
                if(selectedField.type === 'reference'){
                    selectedField._editOptions = [];
                    await libs.remoteAction(this, 'query', {
                        fields: ['Id','Name'],
                        relField: '',
                        sObjApiName: selectedField.referenceTo,
                        callback: ((nodeName, data) => {
                            data[nodeName].records.forEach((e)=>{
                                selectedField._editOptions.push({"label":e.Name,"value":e.Id});
                            });
                        })
                    });
                    this.config.sqlBuilder.currentCondition._editOptions = selectedField._editOptions;
                    this.config.sqlBuilder.currentCondition.referenceTo = selectedField.referenceTo;
                }
                if(sqlBuilderLibs[selectedField.type + 'FilterActions']){
                    sqlBuilderLibs[selectedField.type + 'FilterActions'](this.config._LABELS).forEach((el)=>{
                        this.config.sqlBuilder.conditionOperations.push(el);
                    });
                }else{
                    this.config.sqlBuilder.noOperationError = true;
                }
                this.config.sqlBuilder.openConditionInput = false;
            }else{
                if(this.config.sqlBuilder._objectStack.length <=4 ){
                    this.config.sqlBuilder._objectStack.push({relationShip:event.target.getAttribute('data-val'),referredObj:refObj});
                    this.loadFields(refObj);
                    this.config.sqlBuilder.isBackNeeded = this.config.sqlBuilder._objectStack.length > 1;
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
            console.log(this.config.sqlBuilder.currentCondition._editOptions);
            this.config.sqlBuilder.openConditionInput = {
                isPicklist: this.config.sqlBuilder.currentCondition.fieldType === 'picklist' || this.config.sqlBuilder.currentCondition.fieldType === 'boolean' ? true : false,
                isRange: operator === 'rg' ? true : false,
                _isLookUp: this.config.sqlBuilder.currentCondition.fieldType === 'reference'
            };
            this.config.sqlBuilder.currentCondition.valueRange = this.config.sqlBuilder.openConditionInput.isRange ? this.config.sqlBuilder.currentCondition.valueRange : false;
        }
        if(val === "sqlBuilder:conditions:addCondition"){
            if((this.config.sqlBuilder.currentCondition.operator.isUnary != undefined && this.config.sqlBuilder.currentCondition.operator.isUnary === true) 
            || this.config.sqlBuilder.currentCondition.value != undefined){
                this.config.sqlBuilder.openConditionInput = false;
                this.config.sqlBuilder.conditionOperations = undefined;
                this.config.sqlBuilder.currentCondition.key = this.config.sqlBuilder.conditions.field + this.config.sqlBuilder.conditions.length;
                if(this.config.sqlBuilder.currentCondition.index === undefined){
                    if(!this.isConditionExists(this.config.sqlBuilder.currentCondition,this.config.sqlBuilder.conditions)){
                        this.config.sqlBuilder.currentCondition.index = '#' + (this.config.sqlBuilder.conditions.length + 1);
                        this.config.sqlBuilder.conditionOrdering += (this.config.sqlBuilder.conditions.length + 1) === 1 ?
                        '#' + (this.config.sqlBuilder.conditions.length + 1) : ' AND #' + (this.config.sqlBuilder.conditions.length + 1);
                        this.config.sqlBuilder.conditions.push(this.config.sqlBuilder.currentCondition);
                    }else{
                        const toast = new ShowToastEvent({
                            title: 'Error',
                            message: this.config._LABELS.lbl_conditionAlreadyExists,
                            variant: 'error'
                        });
                        this.dispatchEvent(toast);
                    }
                }else{
                    let fieldInd = this.config.sqlBuilder.conditions.findIndex((el)=> el.index.toString() === this.config.sqlBuilder.currentCondition.index);
                    this.config.sqlBuilder.conditions[fieldInd] = this.config.sqlBuilder.currentCondition;
                }
                this.dialogValues(true);
            }else{
                const toast = new ShowToastEvent({
                    title: 'Error',
                    message: this.config._LABELS.lbl_blankValuesNotAllowed,
                    variant: 'error'
                });
                this.dispatchEvent(toast);
            }
        }
        if(val === "sqlBuilder:conditions:conditionText"){
            let value, selectedField, record;

            if (this.config.sqlBuilder.currentCondition.fieldType === 'reference') {
                // Reference field
                value = event.detail.payload.value;
                selectedField = this.config.sqlBuilder.fields.find((el) => el.fieldName === this.config.sqlBuilder.currentCondition.field);
                record = selectedField._editOptions.find(el => el.value === value);
                this.config.sqlBuilder.currentCondition.referenceValueLabel = record.label;
            } else {
                // Non-reference field
                value = event.target.value;
            }

            this.config.sqlBuilder.currentCondition._formattedValue = this.formatConditionValue(this.config.sqlBuilder.currentCondition, value);
            this.config.sqlBuilder.currentCondition.value = value;
        }
        if(val === "sqlBuilder:conditions:conditionTextRange"){
            this.config.sqlBuilder.currentCondition._formattedValueRange = this.formatConditionValue(this.config.sqlBuilder.currentCondition,event.target.value);
            this.config.sqlBuilder.currentCondition.valueRange = event.target.value;
        }
        if(val === "sqlBuilder:conditions:deleteSelectedCondition"){
            let index = event.target.getAttribute('data-val');  
            this.config.sqlBuilder.conditions = this.config.sqlBuilder.conditions.filter(e => e.index.toString() !== index);
            //Need to rebuild a 
            
            var regExp = new RegExp(' *?(OR|AND)*? *?' + index + ' *?(OR|AND)*? *?','gi');
            this.config.sqlBuilder.conditionOrdering = this.config.sqlBuilder.conditionOrdering.replace(regExp,'');
            console.log('DELETING condition', index, this.config.sqlBuilder.conditionOrdering);
            this.dialogValues(true);
        }
        if(val === "sqlBuilder:conditions:editSelectedCondition"){
            let indexVal = event.target.getAttribute('data-val'); 
            let selectedCondition = this.config.sqlBuilder.conditions.find((el)=> el.index.toString() === indexVal);
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
            if(this.config.sqlBuilder.currentCondition.fieldType === 'reference'){
                this.config.sqlBuilder.currentCondition._editOptions = [];
                await libs.remoteAction(this, 'query', {
                    fields: ['Id','Name'],
                    relField: '',
                    sObjApiName: this.config.sqlBuilder.currentCondition.referenceTo,
                    callback: ((nodeName, data) => {
                        data[nodeName].records.forEach((e)=>{
                            this.config.sqlBuilder.currentCondition._editOptions.push({"label":e.Name,"value":e.Id});
                        });
                    })
                });
            }
            this.config.sqlBuilder.openConditionInput = {
                isPicklist: this.config.sqlBuilder.currentCondition.fieldType === 'picklist' ? true : false,
                isRange: this.config.sqlBuilder.currentCondition.operator.value === 'rg' ? true : false,
                _isLookUp: this.config.sqlBuilder.currentCondition.fieldType === 'reference'
            };
            this.config.sqlBuilder.currentCondition.valueRange = this.config.sqlBuilder.openConditionInput.isRange ? this.config.sqlBuilder.currentCondition.valueRange : false;
        }
        if(val === "sqlBuilder:conditions:orderingConditions"){
            console.log('sqlBuilder:conditions:orderingConditions', event.target.value);
            if(event.target.value == '' &&  this.config.dialog.listViewConfig.conditionMap.length > 0){
                const toast = new ShowToastEvent({
                    title: 'Error',
                    message: this.config._LABELS.msg_cannotKeepThisBlank,
                    variant: 'error'
                });
                this.dispatchEvent(toast);
                event.target.value = this.config.sqlBuilder.conditionOrdering;
            }else{
                if(this.isStrAllowed(event.target.value)){
                    this.config.sqlBuilder.conditionOrdering = event.target.value;
                    this.dialogValues(true);
                }
            }

        }
        //For ordering
        if(val === "sqlBuilder:ordering:selectItem"){
            let refObj = event.target.getAttribute('data-ref');
            if( refObj === null){
                let orderField = event.target.getAttribute('data-val');
                const i = this.config.sqlBuilder.orderings.findIndex(_item => _item.field.fieldName === orderField);
                let selectedField;
                if( i === -1 ){
                    selectedField = this.config.sqlBuilder.fields.find((el) => el.fieldName === orderField);
                    this.config.sqlBuilder.currentOrder = {field:selectedField,
                        emptyField:this.config.sqlBuilder.emptyFieldOptions[0].value,
                        sortOrder:this.config.sqlBuilder.sortOrderOptions[0].value};
                }else{
                    selectedField = this.config.sqlBuilder.orderings[i];
                    this.config.sqlBuilder.currentOrder = {field:selectedField.field,
                        emptyField:selectedField.emptyField,
                        sortOrder:selectedField.sortOrder
                    };
                }
            }else{
                if(this.config.sqlBuilder._objectStack.length <=4 ){
                    this.config.sqlBuilder._objectStack.push({relationShip:event.target.getAttribute('data-val'),referredObj:refObj});
                    this.loadFields(refObj);
                    this.config.sqlBuilder.isBackNeeded = this.config.sqlBuilder._objectStack.length > 1;
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
            this.config.sqlBuilder.currentOrder.sortOrder = this.config.sqlBuilder.currentOrder.sortOrder === undefined ? 'ASC' : this.config.sqlBuilder.currentOrder.sortOrder;
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
    isConditionExists(obj, arr) {
        const copyArr = arr.map(item => ({
            field: item.field,
            value: item.value,
            operator: item.operator.value
        }));
    
        return copyArr.some(item =>
            item.field === obj.field &&
            item.value === obj.value &&
            item.operator === obj.operator.value
        );
    }
    upsertArray(array, item) { 
        const i = array.findIndex(_item => _item.field.fieldName === item.field.fieldName);
        if (i > -1) array[i] = item; // (2)
        else array.push(item);
    }
    toggleArrayElement(array, value) {
        let field = this.config.sqlBuilder.allFields.find((el) => el.fieldName === value);
        let isValExists = array.find((el) => el.fieldName === value);
        if(!isValExists){
            array.push(field); 
        }
    }
    formatConditionValue(field,value){
        if(field.fieldType === 'date'){
            let formattedDate = new Date(value).toLocaleString(this.config.userInfo.locale,{
                month : "2-digit",
                day : "2-digit",
                year: "numeric"
            });
            return formattedDate;
        }
        else if(field.fieldType === 'datetime'){
            let formattedDate = new Date(value).toLocaleString(this.config.userInfo.locale,{
                month : "2-digit",
                day : "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second:"2-digit"
            });
            return formattedDate;
        }
        else if(field.fieldType === 'reference'){
            return field.referenceValueLabel;
        }
        return value;
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
                    this.config.sqlBuilder.fields = this.generateFields(objectFields,objStr,sObjName);   
                    this.config.sqlBuilder.fields = libs.sortRecords(this.config.sqlBuilder.fields, 'label', true);
                    this.config.sqlBuilder.allFields = this.config.sqlBuilder.fields;    
                } });
        }
    }
    generateFields(describe,objStr,sObjName){
        let fields = [];
        let fieldMap = {}; // moving this outside the loop to avoid re-creation and ease changing the properties
        /*eslint-disable*/
        for (let key in describe) {

                let itemCss = this.config.sqlBuilder.selectedFields.find(el => el.fieldName === (objStr ? objStr + describe[key].name : describe[key].name)) ? 'slds-item slds-theme_alt-inverse' : 'slds-item';
                let label = describe[key].type === 'reference' && describe[key].label.toLowerCase().includes('id') ? describe[key].label.replaceAll('ID', '') : describe[key].label;
                fieldMap = { 
                    label: label, 
                    fieldName: objStr ? objStr + describe[key].name : describe[key].name, 
                    css: itemCss, 
                    type: describe[key].type,
                    updateable: describe[key].updateable,
                    isNameField: describe[key] && describe[key].nameField === true,
                    referenceTo: describe[key].referenceTo[0],
                    relationshipName: describe[key].relationshipName,
                    filterable: describe[key].filterable,
                    sortable: describe[key].sortable,
                    nillable: describe[key].nillable,
                };
                let isFormula = describe[key].calculated ? 'f() ' : '';
                fieldMap.helpText = fieldMap.fieldName +  ' (' + isFormula + describe[key].type + ')'; // assigning outside to get the fieldname to be populated first
                // the fieldname was previously used as the helptext but 
                // as we also want the field type to be displayed, I added it to the helptext
                // changing the fieldname was not an option as it is used in the code for sql queries
                if(describe[key].type === 'picklist' || describe[key].type === 'multipicklist'){
                    fieldMap.options = [];
                    if(describe[key].nillable){
                        fieldMap.options.push(
                            { label: '--None--', value: 'NONE' }
                        )
                    }
                    describe[key].picklistValues.forEach(field => {
                        fieldMap.options.push(
                            { label: field.label != null ? field.label : field.value, value: field.value }
                        )
                    });
                }
				if (describe[key].updateable || describe[key].nameField) {
                    if (fieldMap.type === 'picklist' || fieldMap.type === 'multipicklist') {
                        fieldMap.isEditableAsPicklist = true;
                    } else if (fieldMap.type === 'boolean') {
                        fieldMap.isEditableBool = true;
                    } else if (fieldMap.type === 'textarea') {
						fieldMap.isEditableTextArea = true;
                    } else {
                        fieldMap.isEditableRegular = true;
                    }
                } else {
                    fieldMap.isEditable = false;
                }
                fieldMap.isFilterable = true;
                fieldMap.isSortable = true;
                fields.push(fieldMap);
                if (!this.config.isHistoryGrid && describe[key].type === 'reference' && describe[key].relationshipName !== null) {
                    fieldMap = { 
                        label: describe[key].label + ' > ', 
                        fieldName: describe[key].relationshipName,
                        refObj: describe[key].referenceTo[0], 
                        css: 'slds-item', 
                        type: describe[key].type,
                        isNameField: describe[key] && describe[key].nameField === true,
                        referenceTo: describe[key].referenceTo[0],
                        relationshipName: describe[key].relationshipName,
                        filterable: describe[key].filterable,
                        sortable: describe[key].sortable,
                    };
                    fieldMap.helpText = describe[key].relationshipName + ' (' + describe[key].referenceTo?.join(', ') + ')';
                    // I noticed that in some reference fields, there are multiple objects in the referenceTo array, so I joined all of them to the helpText
                    fields.push(fieldMap);	
                }
        }
        return fields;
    }
    get filterableFields(){
        return this.config.sqlBuilder.fields.filter((el) => {
            if(el.filterable === true) return true;
            else return false;
        });
    }
    get sortableFields(){
        return this.config.sqlBuilder.fields.filter((el) => {
            if(el.sortable === true) return true;
            else return false;
        });
    }
    generateCondition(){
        let condition = this.config.sqlBuilder.conditionOrdering;
        this.config.sqlBuilder.conditions.forEach((el)=>{
            condition = condition.replaceAll(el.index.toString(),'('+sqlBuilderLibs[el.fieldType + '__condition'](el) + ')');
        });
        return condition;
    }
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
        const DragValName = this.template.querySelector('.drag').getAttribute('data-val');
        const DropValName = event.target.getAttribute('data-val');

        if(DragValName === DropValName){ return false }
        const index = this.config.sqlBuilder.selectedFields.findIndex((el)=> el.fieldName === DropValName);
        const dragIndex = this.config.sqlBuilder.selectedFields.findIndex((el)=> el.fieldName === DragValName);
        this.ElementList = this.ElementList.reduce((acc, curVal, CurIndex) => {
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
            let item = copySelectedFields.find((e) => e.fieldName === el);
            this.config.dialog.listViewConfig.colModel.push(item);
            this.config.sqlBuilder.selectedFields.push(item);
        });
        return this.ElementList
    }
    tabChanged(event){
        this.config.sqlBuilder.isBackNeeded = false;
        this.loadFields(this.config.sObjApiName);
        this.config.sqlBuilder._objectStack = [{relationShip:this.config.sObjApiName,referredObj:this.config.sObjApiName}];
        this.config.sqlBuilder.searchTerm = '';
        console.log('sqlBuilder tab changed', event.target.value);
        this.config._tabs.currentOpenedTab = event.target.value;
        this.config._tabs.sqlBuilderTab = event.target.value;
    }
    isStrAllowed(expression) {
        const validChars = [' ', 'AND', 'OR', '(', ')', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '#'];
        const stack = [];
        let i = 0;
    
        while (i < expression.length) {
            const char = expression[i];
    
            if (char === '(') {
                stack.push(char);
            } else if (char === ')') {
                if (stack.length === 0) {
                    console.log('Invalid expression: Mismatched parentheses');
                    return false;
                }
                stack.pop();
            } else if (!validChars.includes(char)) {
                let j = i;
                while (j < expression.length && expression[j] !== ' ') {
                    j++;
                }
                const word = expression.substring(i, j);
                if (!validChars.includes(word)) {
                    console.log(`Invalid character: "${word}"`);
                    return false;
                }
                i = j - 1;
            } else if (char === '#') {
                if (i === expression.length - 1 || !(/[0-9]/.test(expression[i+1]))) {
                    console.log('Invalid expression: "#" must be followed by a number');
                    return false;
                }
            }
    
            i++;
        }
    
        if (stack.length !== 0) {
            console.log('Invalid expression: Mismatched parentheses');
            return false;
        }
    
        console.log('Valid expression');
        return true;
    }      
    
}