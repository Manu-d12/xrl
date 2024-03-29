import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { libs } from 'c/libs';
import { sqlBuilderLibs } from './sqlBuilderLibs';

export default class SqlBuilder extends LightningElement {
    @track config = {};
    @api cfg;
    Data = [];
    @track ElementList = [];
    connectedCallback() {
        this.config = libs.getGlobalVar(this.cfg);
        const { sObjApiName, describe, dialog, _LABELS } = this.config;
        this.config.describeMap = { [sObjApiName]: describe };
        this.config.sqlBuilder = {
            selectedFields: dialog.listViewConfig.colModel,
            conditions: dialog.listViewConfig?.conditionMap || [],
            orderings: dialog.listViewConfig.orderMap || [],
            conditionOrdering: dialog.listViewConfig.conditionOrdering || '',
            sortOrderOptions: [
                { label: _LABELS.lbl_ascending, value: 'ASC' },
                { label: _LABELS.lbl_descending, value: 'DESC' },
            ],
            emptyFieldOptions: [
                { label: _LABELS.lbl_beginning, value: 'NULLS FIRST' },
                { label: _LABELS.lbl_end, value: 'NULLS LAST' },
            ],
            _objectStack: [{ relationShip: sObjApiName, referredObj: sObjApiName }],
        };
    
        this.config.sqlBuilder.fields = JSON.parse(JSON.stringify(libs.sortRecords(this.generateFields(describe), 'label', true)));
        this.config.sqlBuilder.allFields = this.config.sqlBuilder.fields;
        this.config.sqlBuilder.filterableFields = this.filterableFields();
        this.config.sqlBuilder.sortableFields = this.sortableFields();

        this.config.sqlBuilder.conditions.forEach((el) => {
            el._formattedValue = this.formatConditionValue(el, el.value);
            el._formattedValueRange = el.valueRange ? this.formatConditionValue(el, el.valueRange) : undefined;
        });

        this.config.sqlBuilder.newVirtualField = {
            isVirtual: true
        }; 
    
        this.ElementList = this.config.sqlBuilder.selectedFields.map(el => el.fieldName) || [...this.Data];
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
        
        this.config.selectedFieldsLength = this.config.sqlBuilder.selectedFields.length;
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
                //adding the validation of 20 max columns if load chunk size is not defined
                let loadChunkSize = this.config?.dialog?.listViewConfig?.loadChunkSize;
                if(loadChunkSize || this.config.sqlBuilder.selectedFields.length < 20){
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
            let searchType= event.target.getAttribute('data-search-id');
            this.config.sqlBuilder.searchTerm = event.target.value.toLowerCase();
            if(searchType === "config"){
                this.config.sqlBuilder.fields = this.searchFields();
            }if(searchType === "applyConditions"){
                this.config.sqlBuilder.filterableFields = this.searchFields("el.filterable === true");
            }else if(searchType === "applyOrdering"){
                this.config.sqlBuilder.sortableFields = this.searchFields("el.sortable === true");
            }
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
                if(selectedField.type === 'picklist' || selectedField.type === 'multipicklist'){
                    this.config.sqlBuilder.currentCondition.fieldOptions = selectedField.options;
                }
                if(selectedField.type === 'date' || selectedField.type === 'datetime'){
                    this.config.sqlBuilder.currentCondition.fieldOptions = JSON.parse(JSON.stringify(libs.getDateLiterals()));
                }
                if(selectedField.type === 'boolean'){
                    this.config.sqlBuilder.currentCondition.fieldOptions = [
                        {label:"True",value:"True"},
                        {label:"False",value:"False"}
                    ];
                }
                if(selectedField.type === 'reference'){
                    selectedField._editOptions = JSON.parse(JSON.stringify(libs.getMacros()));
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
                isPicklist: this.config.sqlBuilder.currentCondition.fieldType === 'picklist' || this.config.sqlBuilder.currentCondition.fieldType === 'boolean' || this.config.sqlBuilder.currentCondition.fieldType === 'multipicklist' ? true : false,
                isRange: operator === 'rg' ? true : false,
                _isLookUp: this.config.sqlBuilder.currentCondition.fieldType === 'reference',
                isMultiSelect: this.config.sqlBuilder.currentCondition.fieldType === 'picklist' || this.config.sqlBuilder.currentCondition.fieldType === 'multipicklist' ? true : false ,
                isCustomDateInput: (this.config.sqlBuilder.currentCondition.fieldType === 'date' || this.config.sqlBuilder.currentCondition.fieldType === 'datetime' && this.config.sqlBuilder.currentCondition.value && !Number.isNaN(Number(this.config.sqlBuilder.currentCondition.value[0]))=== true || operator === 'rg') ? true : false,
                isDate: (this.config.sqlBuilder.currentCondition.fieldType === 'date' || this.config.sqlBuilder.currentCondition.fieldType === 'datetime' && this.config.sqlBuilder.currentCondition.operator.value !== 'rg')  ? true : false,
            };
            this.config.sqlBuilder.openConditionInput.isOtherFields= this.config.sqlBuilder.openConditionInput.isPicklist !== true && this.config.sqlBuilder.openConditionInput.isDate !== true && this.config.sqlBuilder.openConditionInput.isCustomDateInput !== true? true : false;
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
                    if((this.config.sqlBuilder.currentCondition.fieldType === 'picklist' || this.config.sqlBuilder.currentCondition.fieldType === 'multipicklist') && typeof this.config.sqlBuilder.currentCondition.value === 'object'){
                        let values='';
                        this.config.sqlBuilder.currentCondition.value.forEach((val)=>{
                            values+="'"+ val +"'"+","
                        });
                        values= values.substring(0,values.length - 1);
                         this.config.sqlBuilder.currentCondition.value = values;
                    }
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
            } else if(this.config.sqlBuilder.currentCondition.fieldType === 'picklist' || this.config.sqlBuilder.currentCondition.fieldType === "multipicklist") {
                // Non-reference field
                let values='';
                event.detail.payload.values.forEach((val)=>{
                    values+="'"+ val +"'"+","
                });
                values= values.substring(0,values.length - 1);
                value = values;
            }else if(this.config.sqlBuilder.currentCondition.fieldType === 'boolean'){
                value = event.detail.payload.value;
            }else if(this.config.sqlBuilder.currentCondition.fieldType === 'date' || this.config.sqlBuilder.currentCondition.fieldType === 'datetime' && event.detail.payload !== undefined){
                //value = event.detail.payload.value !== undefined ? event.detail.payload.value : event.target.value;
                if(event.detail.payload.value === 'CUSTOM'){
                    this.config.sqlBuilder.openConditionInput.isCustomDateInput= true;
                }else{
                    value = event.detail.payload.value;
                    this.config.sqlBuilder.openConditionInput.isCustomDateInput= false;
                }
                this.config.sqlBuilder.currentCondition.customValue= event.detail.payload.value;
            }else{
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
            this.config.sqlBuilder.conditionOrdering = this.removeInvalidChars(this.config.sqlBuilder.conditionOrdering);
            console.log('DELETING condition', index, this.config.sqlBuilder.conditionOrdering);
            if(this.isStrAllowed(this.config.sqlBuilder.conditionOrdering.trim())){
                this.config.sqlBuilder.conditionOrdering =this.config.sqlBuilder.conditionOrdering;
                this.dialogValues(true);
            }else{
                this.config.sqlBuilder.showError = true;
            }
        }
        if(val === "sqlBuilder:conditions:editSelectedCondition"){
            let indexVal = event.target.getAttribute('data-val'); 
            let selectedCondition = this.config.sqlBuilder.conditions.find((el)=> el.index.toString() === indexVal);
            this.config.sqlBuilder.conditionOperations = [];
            // if(selectedCondition.fieldType === 'picklist'){
            //     this.config.sqlBuilder.currentCondition.fieldOptions = selectedCondition.options;
            // }

            // this.config.sqlBuilder.openConditionInput = {
            //     isPicklist: true,
            //     _isLookUp: false,
            //     isMultiSelect: false,
            //     isRange: false
            // };
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
                this.config.sqlBuilder.currentCondition._editOptions = JSON.parse(JSON.stringify(libs.getMacros()));

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
                this.config.sqlBuilder.fields.find((el) => el.fieldName === this.config.sqlBuilder.currentCondition.field)._editOptions = this.config.sqlBuilder.currentCondition._editOptions;
            }
            this.config.sqlBuilder.openConditionInput = {
                isPicklist: this.config.sqlBuilder.currentCondition.fieldType === 'picklist' || this.config.sqlBuilder.currentCondition.fieldType === 'boolean' || this.config.sqlBuilder.currentCondition.fieldType === 'multipicklist' ? true : false,
                isRange: this.config.sqlBuilder.currentCondition.operator.value === 'rg' ? true : false,
                _isLookUp: this.config.sqlBuilder.currentCondition.fieldType === 'reference',
                isMultiSelect: this.config.sqlBuilder.currentCondition.fieldType === 'picklist' || this.config.sqlBuilder.currentCondition.fieldType === 'multipicklist' ? true : false,
                isCustomDateInput: (this.config.sqlBuilder.currentCondition.fieldType === 'date' || this.config.sqlBuilder.currentCondition.fieldType === 'datetime' && this.config.sqlBuilder.currentCondition.value && !Number.isNaN(Number(this.config.sqlBuilder.currentCondition.value[0]))=== true) || this.config.sqlBuilder.currentCondition.operator.value === 'rg'  ? true : false,
                isDate: (this.config.sqlBuilder.currentCondition.fieldType === 'date' || this.config.sqlBuilder.currentCondition.fieldType === 'datetime' && this.config.sqlBuilder.currentCondition.operator.value !== 'rg')  ? true : false,
            };
            this.config.sqlBuilder.openConditionInput.isOtherFields= this.config.sqlBuilder.openConditionInput.isPicklist !== true && this.config.sqlBuilder.openConditionInput.isDate !== true && this.config.sqlBuilder.openConditionInput.isCustomDateInput !== true? true : false;
            if((this.config.sqlBuilder.currentCondition.fieldType === 'picklist' || this.config.sqlBuilder.currentCondition.fieldType === 'multipicklist') && typeof this.config.sqlBuilder.currentCondition.value === 'string'){
                let values= this.config.sqlBuilder.currentCondition.value.replace(/'/g, '').split(',');
                this.config.sqlBuilder.currentCondition.value = values;  
            }
            this.config.sqlBuilder.currentCondition.valueRange = this.config.sqlBuilder.openConditionInput.isRange ? this.config.sqlBuilder.currentCondition.valueRange : false;
            let multiselect = this.template.querySelector('c-multiselect');
            if((this.config.sqlBuilder.currentCondition.fieldType === 'picklist' || this.config.sqlBuilder.currentCondition.fieldType === 'multipicklist') && multiselect!= undefined){
                multiselect.multiselect = true;
            }else if(multiselect!= undefined){
               multiselect.multiselect= false;
            }
            multiselect?.setOptions(this.config.sqlBuilder.currentCondition.fieldOptions);
            //multiselect?.setValue(this.config.sqlBuilder.currentCondition.value);
        }
        if(val === "sqlBuilder:conditions:orderingConditions"){
            console.log('sqlBuilder:conditions:orderingConditions', event.target.value);
            this.config.sqlBuilder.errorMessage= '';
            this.config.sqlBuilder.showError = false;
            if(event.target.value == '' &&  this.config.sqlBuilder.conditions.length > 0){
                const toast = new ShowToastEvent({
                    title: 'Error',
                    message: this.config._LABELS.msg_cannotKeepThisBlank,
                    variant: 'error'
                });
                this.dispatchEvent(toast);
                event.target.value = this.config.sqlBuilder.conditionOrdering;
            }else{
                //This is temporary fixed we need to improve this
                if(this.isStrAllowed(event.target.value.trim())){
                    this.config.sqlBuilder.conditionOrdering = event.target.value;
                    this.dialogValues(true);
                }else{
                    this.config.sqlBuilder.showError = true;
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
    get errorClass() {
        return this.config.sqlBuilder.showError ? 'slds-form-element slds-has-error' : 'slds-form-element';
    }
    removeInvalidChars(stringToMatch){
        let regex = /\(\)/g; //Matching all the empty parenthesis like- ()
        return stringToMatch.replace(regex,'');
    }
    closePicklist(){
        if(this.config.sqlBuilder.openConditionInput)
            this.config.sqlBuilder.openConditionInput.isPicklist =  false;
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
        if(field.fieldType === 'date' && typeof value !== 'string'){
            let formattedDate = new Date(value).toLocaleString(this.config.userInfo.locale,{
                month : "2-digit",
                day : "2-digit",
                year: "numeric"
            });
            return formattedDate;
        }
        else if(field.fieldType === 'datetime' && typeof value !== 'string'){
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
            this.config.sqlBuilder.filterableFields = this.config.sqlBuilder.fields;
            this.config.sqlBuilder.sortableFields =this.config.sqlBuilder.fields;
            this.config.sqlBuilder.allFields = this.config.sqlBuilder.fields;
        }else{
            libs.remoteAction(this, 'objectFieldList', { sObjApiName: sObjName, 
                callback: function(cmd,data){
                    let objectFields = JSON.parse(data[cmd].describe);
                    this.config.describeMap[sObjName] = objectFields;
                    this.config.sqlBuilder.fields = this.generateFields(objectFields,objStr,sObjName);   
                    this.config.sqlBuilder.fields = libs.sortRecords(this.config.sqlBuilder.fields, 'label', true);
                    this.config.sqlBuilder.filterableFields = this.config.sqlBuilder.fields;
                    this.config.sqlBuilder.sortableFields =this.config.sqlBuilder.fields;
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
    searchFields(conditionString){
        let searchedFields = [];
        let condition= (conditionString != null && conditionString.trim() !== "") ?  eval(`(el) => ${conditionString}`) : true;
        this.config.sqlBuilder.allFields.forEach((el)=>{
            if((el.label != null && el.label.toString().toLowerCase().indexOf(this.config.sqlBuilder.searchTerm) != -1) 
            ||(el.fieldName != null && el.fieldName.toString().toLowerCase().indexOf(this.config.sqlBuilder.searchTerm) != -1)
            ||(el.type != null && el.type.toString().toLowerCase().indexOf(this.config.sqlBuilder.searchTerm) != -1 && condition)){
                searchedFields.push(el);
            }
        });
        return searchedFields;
    }
    filterableFields(){
        return this.config.sqlBuilder.fields.filter((el) => {
            if(el.filterable === true) return true;
            else return false;
        });
    }
    sortableFields(){
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

    changeIcon(event){
		event.target.iconName = 'utility:question';
	}
	changeIconAgain(event){
		event.target.iconName = 'utility:info';
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
        //if(this.config._tabs.currentOpenedTab === "1") return;
        this.config.sqlBuilder.isBackNeeded = false;
        this.loadFields(this.config.sObjApiName);
        this.config.sqlBuilder._objectStack = [{relationShip:this.config.sObjApiName,referredObj:this.config.sObjApiName}];
        this.config.sqlBuilder.searchTerm = '';
        console.log('sqlBuilder tab changed', event.target.value);
        this.config._tabs.currentOpenedTab = event.target.value;
        this.config._tabs.sqlBuilderTab = event.target.value;
    }
    handleVirtualFieldEvents(event){
        //handling all the functions related to adding a virtual field
        let changedInput = event.target.getAttribute('data-id');
        //handling different change events for the new field
        if(changedInput === 'fieldLabel'){
            this.config.sqlBuilder.newVirtualField.label = event.target.value;
        }else if(changedInput === 'fieldApiName'){
            this.config.sqlBuilder.newVirtualField.fieldName = event.target.value;
        }

        if(changedInput === 'saveVirtualField'){
            if(this.config.sqlBuilder.newVirtualField.fieldName === undefined || this.config.sqlBuilder.newVirtualField.fieldName === '') {
                libs.showToast(this, {
					title: 'Error',
					message: this.config._LABELS.msg_virtualFieldApiNameBlank,
					variant: 'error'
				});
                return;
            }
            let isThisApiNameExists = this.config.sqlBuilder.selectedFields.find(field => field.fieldName === this.config.sqlBuilder.newVirtualField.fieldName);
            //if field with same api name does not exists
            if(!isThisApiNameExists){
                this.config.sqlBuilder.selectedFields.push(this.config.sqlBuilder.newVirtualField);
                this.template.querySelector('[data-id="fieldLabel"]').value = '';
                this.template.querySelector('[data-id="fieldApiName"]').value = '';
                this.config.sqlBuilder.newVirtualField = {
                    isVirtual: true
                };
                libs.showToast(this, {
					title: 'Success',
					message: this.config._LABELS.msg_virtualFieldAddedSuccessfully,
					variant: 'success'
				});
            }else{
                libs.showToast(this, {
					title: 'Error',
					message: this.config._LABELS.msg_virtualFieldAlreadyExists,
					variant: 'error'
				});
            }
        }
    }
     
    //Old Implementation....
    // isStrAllowed(expression) {
    //     const validChars = [' ', 'AND', 'OR', '(', ')', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '#'];
    //     const stack = [];
    //     let i = 0, operationIndex=0;

    //     let isCondition= false;
    //     let isOpeartion =false;
    //     let indexInsideAnbracket= 0;
    //     const indexSet = new Set();
    //     const operationMap =new Map();
    //     let operations=0;
    //     let isOropearation =false;
    //     this.config.sqlBuilder.conditions.forEach((con) =>{
    //         indexSet.add(con.index);
    //     });
    
    //     while (i < expression.length) {
    //         const char = expression[i];
    
    //         if (char === '(') {
    //             stack.push(char);
    //             operationMap.set(operationIndex++ ,{"isOropearation" : isOropearation, "operations" : operations});
    //             operations= 0;
    //             isOropearation= false;
    //         } else if (char === ')') {
    //             if(expression[i-1] === '('){
    //                 console.log('Invalid expression parentheses');
    //                 this.config.sqlBuilder.errorMessage= 'Invalid expression parentheses';
    //                 return false;
    //             }
    //             if (stack.length === 0) {
    //                 console.log('Invalid expression: Mismatched parentheses');
    //                 this.config.sqlBuilder.errorMessage= 'Invalid expression: Mismatched parentheses';
    //                 return false;
    //             }

    //             if(indexInsideAnbracket < 1 || ((operations < 1) || (operations < 1 && isOropearation === false))){
    //                 console.log('Not Valid expression Inside parentheses');
    //                 this.config.sqlBuilder.errorMessage= 'Not Valid expression Inside parentheses';
    //                 return false;
    //             }
    //             stack.pop();
    //             indexInsideAnbracket= 0;
    //             if(operationIndex-1 >=0){
    //                 operationIndex--;
    //                 let operation=operationMap.get(operationIndex);
    //                 isOropearation= operation["isOropearation"];
    //                 operations= operation["operations"];
    //             }
    //         } else if (!validChars.includes(char)) {
    //             let j = i;
    //             while (j < expression.length && expression[j] !== ' ') {
    //                 j++;
    //             }
    //             const word = expression.substring(i, j);
    //             if (!validChars.includes(word)) {
    //                 console.log(`Invalid character: "${word}"`);
    //                 this.config.sqlBuilder.errorMessage= `Invalid character: "${word}"`;
    //                 return false;
    //             }

    //             if(i === 0 || i === expression.length-2 || i === expression.length-3 ){
    //                 console.log('Invalid OR or AND opeartions');
    //                 this.config.sqlBuilder.errorMessage= 'Invalid OR or AND opeartions';
    //                 return false;
    //             }

    //             if(isOpeartion){
    //                 console.log('Invalid OR or AND opeartions');
    //                 this.config.sqlBuilder.errorMessage= 'Invalid OR or AND opeartions';
    //                 return false;
    //             }
                
    //             if(word === "AND"){
    //                 operations++;
    //             }else if(word === "OR"){
    //                 isOropearation= true;
    //             }
    //             i = j - 1;
    //             isOpeartion= true;
    //             isCondition= false;
    //         } else if (char === '#') {
    //             if (i === expression.length - 1 || !(/[0-9]/.test(expression[i+1]))) {
    //                 console.log('Invalid expression: "#" must be followed by a number');
    //                 this.config.sqlBuilder.errorMessage= 'Invalid expression: "#" must be followed by a number';
    //                 return false;
    //             }else if(isCondition){
    //                 console.log('Invalid OR or AND opeartions');
    //                 this.config.sqlBuilder.errorMessage= 'Invalid OR or AND opeartions';
    //                 return false;
    //             }

    //             if(indexSet.has('#'+expression[i+1])){
    //                 indexSet.delete('#'+expression[i+1]);
    //             }
    //             isCondition= true;
    //             isOpeartion= false;
    //             indexInsideAnbracket++;
    //         }
    
    //         if(operations > 0 && isOropearation === true){
    //             console.log('Invalid OR or AND opeartions');
    //             this.config.sqlBuilder.errorMessage= 'Invalid OR or AND opeartions';
    //             return false;
    //         }
    //         i++;
    //     }

    //     if(indexSet.size > 0){
    //         console.log('Invalid Applied condition');
    //         this.config.sqlBuilder.errorMessage= 'Invalid Applied condition';
    //         return false;
    //     }
    
    //     if (stack.length !== 0) {
    //         console.log('Invalid expression: Mismatched parentheses');
    //         this.config.sqlBuilder.errorMessage= 'Invalid expression: Mismatched parentheses';
    //         return false;
    //     }
    
    //     console.log('Valid expression');
    //     return true;
    // }      
    
    // New Implementation
    // Issues with Old implementations. having issues with some of the test cases.....
    // Old Implementation:: having issues with some of the test cases.....
    // (#1 OR #2) AND #3 --> wrong result
    // (#1 OR #2) AND ((#3 AND #4) AND #5) --> wrong result
    // (#1) AND #2 --> wrong result.
    isStrAllowed(e) {
        let noSpaceExpression = e.replace(/\s/g, '');
        console.log('noSpaceExpression: ' + noSpaceExpression);
        if (noSpaceExpression.length < 2) {
            message = "minimum expression length must be 2";
            this.config.sqlBuilder.errorMessage = message;
            return false;
        }
        noSpaceExpression = '(' + noSpaceExpression + ')';
        console.log('noSpaceExpression: ' + noSpaceExpression);
        let st = [];  //stack...
        let i = 0;
        let isOperand = false;
        let message;
        while (i < noSpaceExpression.length) {
            const ch = noSpaceExpression[i];
            if (ch == '(') {
                st.push(ch);
            } else if (ch == ')') {
                if (st.length == 0) {
                    message = 'Invalid Parenthesis Matching (not find opening bracket)';
                    this.config.sqlBuilder.errorMessage = message;
                    return false;
                } else {
                    let idx = 0;
                    let isValidPattern = true;
                    let isOR = false;
                    let isAND = false;
                    message = 'Not Valid expression';
                    console.log(st);
                    while (st.length != 0 && st[st.length - 1] != '(') {
                        let val = st.pop();
                        if (idx % 2 == 0) {
                            if (val == 'OR' || val == 'AND') {
                                isValidPattern = false;
                                break;
                            }
                        } else {
                            if (val[0] == '#') {
                                isValidPattern = false;
                                break;
                            } else if (val == 'OR') {
                                isOR = true;
                            } else {
                                isAND = true;
                            }
                        }
                        if (isAND && isOR) {
                            isValidPattern = false;
                            message = "Both AND OR cannot be without precedences..."
                            break;
                        }
                        idx++;
                    }
                    if (isValidPattern == false) {
                        console.log(message);
                        this.config.sqlBuilder.errorMessage = message;
                        return false;
                    }
                    st.pop();
                    if (st.length != 0) {
                        st.push('#d');
                    }
                }
            } else if (ch == '#') {
                const nch = (i + 1) == noSpaceExpression.length ? '@' : noSpaceExpression[++i];
                if (!(nch >= '1' && nch <= '9')) {
                    message = '# must be followed by Integer Number';
                    this.config.sqlBuilder.errorMessage = message;
                    return false;
                }
                st.push(ch + nch);
                isOperand = true;
            } else if (ch == 'A' || ch == 'O') {
                if (ch == 'A') {
                    const fnch = (i + 1) == noSpaceExpression.length ? '@' : noSpaceExpression[++i];
                    const snch = (i + 1) == noSpaceExpression.length ? '@' : noSpaceExpression[++i];
                    let str = 'A' + fnch + snch;
                    if (str === "AND") {
                        st.push(str);
                    } else {
                        message = `Invalid character: "${noSpaceExpression.substring(i - 2, Math.min(noSpaceExpression.length, i - 2 + 4))}"...`;
                        console.log(message);
                        this.config.sqlBuilder.errorMessage = message;
                        return false;
                    }
                } else {
                    const fnch = (i + 1) == noSpaceExpression.length ? '@' : noSpaceExpression[++i];
                    let str = 'O' + fnch;
                    if (str === "OR") {
                        st.push(str);
                    } else {
                        message = `Invalid character: "${noSpaceExpression.substring(i - 1, Math.min(noSpaceExpression.length, i - 1 + 4))}"...`;
                        console.log(message);
                        this.config.sqlBuilder.errorMessage = message;
                        return false;
                    }
                }
            } else {
                message = `Invalid character: "${noSpaceExpression.substring(i, Math.min(noSpaceExpression.length, i + 4))}"...`;
                console.log(message);
                this.config.sqlBuilder.errorMessage = message;
                return false;
            }
            ++i;
        }
        if (isOperand == false) {
            message = "No field Selected..";
            console.log(message);
            this.config.sqlBuilder.errorMessage = message;
            return false;
        }
        else if (st.length == 0) {
            message = "Valid Expression";
            console.log(message);
            this.config.sqlBuilder.errorMessage = message;
            return true;
        } else {
            message = 'Invalid expression: Mismatched parentheses';
            console.log(message);
            this.config.sqlBuilder.errorMessage = message;
            return false;
        }
    }
}