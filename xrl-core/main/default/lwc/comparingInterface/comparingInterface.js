import { LightningElement,track,api } from 'lwc';
import { libs } from 'c/libs';

export default class ComparingInterface extends LightningElement {
    @track config = {};
    @api recordId;
    @api name;
    async connectedCallback(){
        this.config = libs.getGlobalVar(this.name);
        this.recordId = libs.getGlobalVar('recordId');
        this.config.userSelections = {};
        this.config.objRecords = {};
        this.config.childRecordsResult = [];
        await libs.remoteAction(this, 'getCustomLabels', {callback: function(cmd,data){
            console.log('CustomLabels are loaded', data[cmd]);
            this.config._LABELS = data[cmd];
        } });
        this.setConfig();
    }
    async setConfig(){
        // Check if userConfig is undefined, then return
        if (this.config.comparisonInterface === undefined) return;

        this.config.json = JSON.parse(JSON.stringify(this.config.comparisonInterface));

        // Populate obj1Fields and obj2Fields based on parentFields if available
        this.config.obj1Fields = [];
        this.config.obj2Fields = [];
        if (this.config.json.parentFields && this.config.json.parentFields.length > 0) {
            this.config.json.parentFields.forEach((el) => {
                this.config.obj1Fields.push(el.obj1FieldName);
                this.config.obj2Fields.push(el.obj2FieldName);
            });
        }

        // Set selected object and user selection based on configurations
        let selectedObj = this.config.json.obj1.apiName;
        let selectedFor = 'objOne';
        this.config.userSelections[selectedFor] = selectedObj;
        console.log(this.config.userSelections[selectedFor]);


        // Handle left record
        await this.handleLeftRecord();

        // Set selected object for 'objTwo' and handle right record
        selectedObj = this.config.json.obj2.apiName;
        selectedFor = 'objTwo';
        await this.handleRightRecord();
        this.config.showCompareButton = true;
        if((this.config.userSelections.recOne?.length > 0 && this.config.userSelections.recTwo?.length > 0) || 
        (this.config.userSelections.recOne?.length > 0 && this.config.cr2?.length > 0) ||
        (this.config.userSelections.recTwo?.length > 0 && this.config.cr1?.length > 0)) {
            // this.config.showCompareButton = false;
            this.handleComparison();
        }
    }
    // Function to handle the left record
    async handleLeftRecord() {
        if (
            this.config.json.leftRecord !== undefined &&
            this.config.json.leftRecord !== null &&
            this.config.json.leftRecord !== 'CurrentRecord' &&
            this.config.json.leftRecord !== 'recordId'
        ) {
            await this.handleCustomSoql('customSoql', this.config.json.leftRecord, 'recOne');
        }
        if ((this.config.json.leftRecord !== 'CurrentRecord' && this.config.json.leftRecord !== 'recordId')) {
            await this.handleQuery('obj1', this.config.json.obj1.apiName, 'objOne');
        } else if (this.config.json.leftRecord === 'CurrentRecord' || this.config.json.leftRecord === 'recordId') {
            this.config.userSelections.recOne = [this.recordId];
        }
    }

    // Function to handle the right record
    async handleRightRecord() {
        if (
            this.config.json.rightRecord !== undefined &&
            this.config.json.rightRecord !== null &&
            this.config.json.rightRecord !== 'CurrentRecord' &&
            this.config.json.rightRecord !== 'recordId'
        ) {
            await this.handleCustomSoql('customSoql', this.config.json.rightRecord, 'recTwo');
        }
        if ((this.config.json.rightRecord !== 'CurrentRecord' && this.config.json.rightRecord !== 'recordId')) {
            await this.handleQuery('obj2', this.config.json.obj2.apiName, 'objTwo');
        } else if (this.config.json.rightRecord === 'CurrentRecord' || this.config.json.rightRecord === 'recordId') {
            this.config.userSelections.recTwo = [this.recordId];
        }
    }

    // Function to handle custom SOQL action
    async handleCustomSoql(action, record, userSelection) {
        await libs.remoteAction(this, action, {
            SOQL: libs.replaceLiteralsInStr(record, this.name),
            callback: (nodeName, data1) => {
                if (this.config.json.QueryFromConfig.returnType === 'parent') {
                    this.config.userSelections[userSelection] = data1[nodeName].records.map(val => val.Id);
                } else if (this.config.json.QueryFromConfig.returnType === 'child') {
                    if (userSelection === 'recOne') {
                        this.config.cr1 = data1[nodeName].records;
                        this.config.cr1 = this.config.cr1 && this.config.cr1.length > 0 ? this.config.cr1 : [];
                    } else if (userSelection === 'recTwo') {
                        this.config.cr2 = data1[nodeName].records;
                        this.config.cr2 = this.config.cr2 && this.config.cr2.length > 0 ? this.config.cr2 : [];
                    }
                }
            }
        });
    }
    // Function to handle query action
    async handleQuery(selectedFor, selectedObj, userSelection) {
        await libs.remoteAction(this, 'query', {
            sObjApiName: selectedObj,
            fields: this.config.json.parentsRecordsSelectionCallback?.[selectedFor]
                ? this.config.json.parentsRecordsSelectionCallback?.[selectedFor + 'FieldsToRetrieve']
                : ['Id', 'Name'],
            relField: '',
            callback: (nodeName, data) => {
                this.config.objRecords[userSelection] = [];
                let callback = this.config.json.parentsRecordsSelectionCallback?.[selectedFor];
                if (callback !== undefined && callback !== '') {
                    try {
                        this.config.objRecords[userSelection] = eval('(' + callback + ')')(this,libs,data[nodeName].records);
                    } catch (e) {
                        console.error('Error', e);
                        this.config.objRecords[userSelection] = [];
                    }
                } else {
                    data[nodeName].records.forEach(el => {
                        this.config.objRecords[userSelection].push({ 'label': el.Name, 'value': el.Id });
                    });
                }
                this.config.showCompareButton = true;
            }
        });
    }
    handleSelect(event){
        let selectedObj = event.detail.payload.values;
        let selectedFor = event.target.getAttribute('data-id');
        this.config.userSelections[selectedFor] = selectedObj;
        libs.getGlobalVar(this.config.json.dataTable.uniqueName).userSelections = JSON.parse(JSON.stringify(this.config.userSelections)); //need to store to to use it in the callbacks
    }
    //handling all the events here
    handleEvent(event){
        let dataId = event.target.getAttribute('data-id');
        console.log('User Click: ', dataId);
        if(dataId === 'configId'){
            libs.remoteAction(this, 'getConfigById', { configId: event.detail.payload.value, callback: this.setConfig.bind(this) });
        }
        if(dataId === 'btn:compare'){
            this.config.showComparisonTable = false;
            libs.getGlobalVar(this.config.json.dataTable.uniqueName).records = [];
            this.config.childRecordsResult = [];
            this.handleComparison();
        }
    }
    async handleComparison(){
        if(this.config.json.parentFields && this.config.json.parentFields.length > 0){
            await libs.remoteAction(this, 'query', {
                sObjApiName: this.config.json.obj1.apiName,
                fields: this.config.obj1Fields,
                relField: '',
                addCondition:" Id='" + this.config.userSelections.recOne + "'",
                callback: ((nodeName, data) => {
                    console.log('length', data[nodeName].records.length);
                    this.config.obj1Result = data[nodeName].records[0];
                })
            });
            await libs.remoteAction(this, 'query', {
                sObjApiName: this.config.json.obj2.apiName,
                fields: this.config.obj2Fields,
                relField: '',
                addCondition:" Id='" + this.config.userSelections.recTwo + "'",
                callback: ((nodeName, data) => {
                    console.log('length', data[nodeName].records.length);
                    this.config.obj2Result = data[nodeName].records[0];
                })
            });
            if(this.config.json.compareParentRecordsCallback){
                this.config.compareResult = eval('(' + this.config.json.compareParentRecordsCallback + ')')(this.config.obj1Result,this.config.obj2Result);
            }else{
                this.config.compareResult = this.compareRecords(this.config.obj1Result,this.config.obj2Result);
            } 
        }
        this.getChildRecords();
    }
    //This function compares 2 records
    //accepts 2 records map and returns a single map
    compareRecords(record1,record2){
        let result = [];
        this.config.json.parentFields.forEach((el)=>{
            let r = {};
            if(record1[el.obj1FieldName] !== record2[el.obj2FieldName]){
                r.css1 = 'background-color: #ff2f2f73;';
                r.css2 = 'background-color: #ff2f2f73;';
            }
            r.fieldName1 = el.obj1FieldName;
            r.value1 = record1[el.obj1FieldName];
            r.fieldName2 = el.obj2FieldName;
            r.value2 = record2[el.obj2FieldName];
            result.push(r);
        });
        return result;
    }
    async getChildRecords(){

        await this.fetchAndSetChildRecords('obj1', 'recOne', 'cr1', this.config.json.leftRecord, this.config.json.parentChildRelFields.obj1, this.config.json.fields.obj1);
        await this.fetchAndSetChildRecords('obj2', 'recTwo', 'cr2', this.config.json.rightRecord, this.config.json.parentChildRelFields.obj2, this.config.json.fields.obj2);
        
        if(this.config.json.compareChildRecordsCallback){
            let callback = eval('(' + this.config.json.compareChildRecordsCallback + ')');
            this.config.childRecordsResult = await callback(this,libs,this.config.cr1,this.config.cr2)
        }else{
            let childRecords1 = this.convertArrToMap(this.config.cr1,this.config.json.uniqueKey.obj1);
            let childRecords2 = this.convertArrToMap(this.config.cr2,this.config.json.uniqueKey.obj2);
            this.config.childRecordsResult = this.compareChildRecords(childRecords1,childRecords2);
        }   
        libs.getGlobalVar(this.config.json.dataTable.uniqueName).records = this.config.childRecordsResult;
        this.config.showComparisonTable = true;
        this.dispatchEvent(new CustomEvent('message', {
            detail: { cmd: 'filter:updateDatatableView', source: this.name }
        }));
    }
    async fetchAndSetChildRecords(objectNum, userSelection, configRecord, recordType, relFields, fields) {
        if (recordType === 'CurrentRecord' || recordType === undefined || this.config[configRecord] === undefined || this.config.json.QueryFromConfig.returnType !== 'child') {
            const relatedRecords = await libs.remoteAction(this, 'query', {
                sObjApiName: this.config.json.childApiNames[objectNum],
                fields: fields,
                relField: '',
                addCondition: " " + relFields + " IN (" + this.config.userSelections[userSelection].map(val => "'" + val + "'").join(",") + ")",
                callback: ((nodeName, data) => {
                    this.config[configRecord] = data[nodeName].records;
                })
            });
        }
    }
    convertArrToMap(arr,uniqueKey){
        return arr.reduce(function(acc, cur, i) {
            acc[cur[uniqueKey]] = cur;
            return acc;
        }, {});
    }
    compareChildRecords(childRecords1,childRecords2){
        let result = {};
        let childRecordsResult = [];
        let onlyLeftChildRecords = [];
        Object.keys(childRecords1).forEach((el)=>{
            result = {};
            result[this.config.json.uniqueObjNames.obj1] = {};
            result[this.config.json.uniqueObjNames.obj2] = {};
            if(childRecords2[el]){
                result[this.config.json.uniqueObjNames.obj1][this.config.json.uniqueKey.obj1] = el;
                result[this.config.json.uniqueObjNames.obj2][this.config.json.uniqueKey.obj2] = el;
                Object.assign(result[this.config.json.uniqueObjNames.obj1],childRecords1[el]);
                Object.assign(result[this.config.json.uniqueObjNames.obj2],childRecords2[el]);
                delete childRecords2[el];
                childRecordsResult.push(result);
            }else{
                Object.assign(result[this.config.json.uniqueObjNames.obj1],childRecords1[el]);
                onlyLeftChildRecords.push(result);
            }
        });
        //putting the records which only have left records
        childRecordsResult = [...childRecordsResult, ...onlyLeftChildRecords];
        Object.keys(childRecords2).forEach((el)=>{
            result = {};
            result[this.config.json.uniqueObjNames.obj1] = {};
            result[this.config.json.uniqueObjNames.obj2] = {};
            Object.assign(result[this.config.json.uniqueObjNames.obj2],childRecords2[el]);
            childRecordsResult.push(result);
        });
        console.log('child Record Result',childRecordsResult);
        return childRecordsResult;
    }
}