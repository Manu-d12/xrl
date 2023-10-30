import { LightningElement,track,api } from 'lwc';
import { libs } from 'c/libs';

export default class ComparingInterface extends LightningElement {
    @track config = {};
    @api apiName;
    @api leftRecord;
    @api rightRecord;
    @api recordId;
    @track name;
    async connectedCallback(){
        this.name = 'cmp' + Math.floor(Math.random() * 10);
        libs.setGlobalVar(this.name,{});
        this.config = libs.getGlobalVar(this.name);
        this.config.userSelections = {};
        this.config.objRecords = {};
        this.config.childRecordsResult = [];
        await libs.remoteAction(this, 'getCustomLabels', {callback: function(cmd,data){
            console.log('CustomLabels are loaded', data[cmd]);
            this.config._LABELS = data[cmd];
        } });
        if(this.apiName === undefined){
            this.getExtRelListConfigs();
        }else {
            libs.remoteAction(this, 'getConfigByUniqueName', { uniqueName: this.apiName, callback: this.setConfig.bind(this) });
        }
    }
    async getExtRelListConfigs(){
        this.config.extConfigs = [];
        await libs.remoteAction(this, 'query', {
            sObjApiName: libs.getNameSpace() +'__extRelListConfig__c',
            fields: ['Id','Name','JSON__c'],
            relField: '',
            addCondition: " configType__c = 'Comparison'",
            callback: ((nodeName, data) => {
                console.log('length', data[nodeName].records.length);
                data[nodeName].records.forEach((record) => {
                    this.config.extConfigs.push({'label':record.Name + ' Object1: ' +JSON.parse(record[libs.getNameSpace() + '__JSON__c']).obj1.apiName + ' Object2: ' +JSON.parse(record[libs.getNameSpace() +'__JSON__c']).obj2.apiName, 'value':record.Id});
                });
                this.config.showConfigSelection = true;
            })
        });
    }
    async setConfig(cmd,data){
        // Check if userConfig is undefined, then return
        if (JSON.parse(data[cmd].userConfig) === undefined) return;

        // Set userInfo, currency, and recordId in global variables
        const globalVars = libs.getGlobalVar(this.name);
        globalVars.userInfo = data.userInfo;
        globalVars.currency = data[cmd].currency;
        globalVars.recordId = this.recordId;

        // Parse userConfig to set configurations
        const parsedUserConfig = JSON.parse(data[cmd].userConfig);
        console.log('User Config', parsedUserConfig);

        // Set configurations based on actions if available
        this.config.json = parsedUserConfig;
        if (this.config.json.actions && this.config.json.actions.length > 0) {
            this.config.actionsBar = {
                'actions': this.config.json.actions,
                '_cfgName': this.config.json.dataTable.uniqueName
            };
        }

        // Set global variables based on userConfig for specific fields
        const dataTableConfig = parsedUserConfig.dataTable;
        libs.setGlobalVar(dataTableConfig.uniqueName, {
            "listViewConfig": dataTableConfig.dtConfig,
            "userInfo": data.userInfo,
            "currency": data[cmd].currency,
            "_LABELS": this.config._LABELS
        });

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

        // if(this.leftRecord !== undefined && this.leftRecord !== null && this.leftRecord !== 'CurrentRecord' && this.leftRecord !== 'recordId'){
        //     await libs.remoteAction(this, 'customSoql', {
        //         SOQL: libs.replaceLiteralsInStr(this.leftRecord,this.name),
        //         callback: ((nodeName, data1) => {
        //             if(this.config.json.QueryFromConfig.returnType === 'parent'){
        //                 this.config.userSelections.recOne = data1[nodeName].records.map(val =>  val.Id );
        //             }else if(this.config.json.QueryFromConfig.returnType === 'child'){
        //                 console.log('length 2', this.config.json.uniqueKey.obj1);
        //                 this.config.cr1 = data1[nodeName].records;
        //                 this.config.cr1 = this.config.cr1 && this.config.cr1.length > 0 ? this.config.cr1 : [];
        //             }
        //         })
        //     });
        // }
        // if(selectedFor.startsWith('obj') && (this.leftRecord !== 'CurrentRecord' && this.leftRecord !== 'recordId')){
        //     //Getting the records from depending on selected object1
        //     await libs.remoteAction(this, 'query', {
        //         sObjApiName: selectedObj,
        //         fields: this.config.json.parentsRecordsSelectionCallback?.obj1 ? 
        //             this.config.json.parentsRecordsSelectionCallback?.obj1FieldsToRetrieve : ['Id','Name'],
        //         relField: '',
        //         callback: ((nodeName, data) => {
        //             console.log('length', data[nodeName].records.length);
        //             this.config.objRecords[selectedFor]= [];
        //             let callback = this.config.json.parentsRecordsSelectionCallback?.obj1;
        //             if(callback !== undefined && callback !== ''){
        //                 try{
        //                     this.config.objRecords[selectedFor] = eval( '(' + callback + ')')(data[nodeName].records);
        //                 }catch(e){
        //                     console.error('Error', e);
        //                     this.config.objRecords[selectedFor]= [];
        //                 }
        //             }else{
        //                 data[nodeName].records.forEach((el)=>{
        //                     this.config.objRecords[selectedFor].push({'label':el.Name,'value':el.Id});
        //                 });
        //             }
        //             this.config.showCompareButton = true;
        //         })
        //     });
        // }else if(this.leftRecord === 'CurrentRecord' || this.leftRecord === 'recordId'){
        //     this.config.userSelections.recOne = [this.recordId];
        // }
        // selectedObj = this.config.json.obj2.apiName;
        // selectedFor = 'objTwo';
        // this.config.userSelections[selectedFor] = selectedObj;
        // console.log(this.config.userSelections[selectedFor]);
        // if(this.rightRecord !== undefined && this.rightRecord !== null && this.rightRecord !== 'CurrentRecord' && this.rightRecord !== 'recordId'){
        //     await libs.remoteAction(this, 'customSoql', {
        //         SOQL: libs.replaceLiteralsInStr(this.rightRecord,this.name),
        //         callback: ((nodeName, data1) => {
        //             if(this.config.json.QueryFromConfig.returnType === 'parent'){
        //                 this.config.userSelections.recTwo = data1[nodeName].records.map(val =>  val.Id );
        //             }else if(this.config.json.QueryFromConfig.returnType === 'child'){
        //                 this.config.cr2 = data1[nodeName].records;
        //                 this.config.cr2 = this.config.cr2 && this.config.cr2.length > 0 ? this.config.cr2 : [];
        //             }
        //         })
        //     });
        // }
        // if(selectedFor.startsWith('obj') && (this.rightRecord !== 'CurrentRecord' && this.rightRecord !== 'recordId')){
        //     //Getting the records from depending on selected object2
        //     await libs.remoteAction(this, 'query', {
        //         sObjApiName: selectedObj,
        //         fields: this.config.json.parentsRecordsSelectionCallback?.obj2 ? 
        //         this.config.json.parentsRecordsSelectionCallback?.obj1FieldsToRetrieve : ['Id','Name'],
        //         relField: '',
        //         callback: ((nodeName, data) => {
        //             this.config.objRecords[selectedFor]= [];
        //             let callback = this.config.json.parentsRecordsSelectionCallback?.obj2;
        //             if(callback !== undefined && callback !== ''){
        //                 try{
        //                     this.config.objRecords[selectedFor] = eval( '(' + callback + ')')(data[nodeName].records);
        //                 }catch(e){
        //                     console.error('Error', e);
        //                     this.config.objRecords[selectedFor]= [];
        //                 }
        //             }else{
        //                 data[nodeName].records.forEach((el)=>{
        //                     this.config.objRecords[selectedFor].push({'label':el.Name,'value':el.Id});
        //                 });
        //             }
        //         })
        //     });
        // }else if(this.rightRecord === 'CurrentRecord' || this.rightRecord === 'recordId'){
        //     this.config.userSelections.recTwo = [this.recordId];
        // }


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
            this.leftRecord !== undefined &&
            this.leftRecord !== null &&
            this.leftRecord !== 'CurrentRecord' &&
            this.leftRecord !== 'recordId'
        ) {
            await this.handleCustomSoql('customSoql', this.leftRecord, 'recOne');
        }
        if ((this.leftRecord !== 'CurrentRecord' && this.leftRecord !== 'recordId')) {
            await this.handleQuery('obj1', this.config.json.obj1.apiName, 'objOne');
        } else if (this.leftRecord === 'CurrentRecord' || this.leftRecord === 'recordId') {
            this.config.userSelections.recOne = [this.recordId];
        }
    }

    // Function to handle the right record
    async handleRightRecord() {
        if (
            this.rightRecord !== undefined &&
            this.rightRecord !== null &&
            this.rightRecord !== 'CurrentRecord' &&
            this.rightRecord !== 'recordId'
        ) {
            await this.handleCustomSoql('customSoql', this.rightRecord, 'recTwo');
        }
        if ((this.rightRecord !== 'CurrentRecord' && this.rightRecord !== 'recordId')) {
            await this.handleQuery('obj2', this.config.json.obj2.apiName, 'objTwo');
        } else if (this.rightRecord === 'CurrentRecord' || this.rightRecord === 'recordId') {
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
                        this.config.objRecords[userSelection] = eval('(' + callback + ')')(data[nodeName].records);
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
        JSON.parse(JSON.stringify(selectedObj)).forEach(el => {
            if(this.config.userSelections[selectedFor] === undefined){
                this.config.userSelections[selectedFor] = [];
            }
            if(!this.config.userSelections[selectedFor].includes(el)){
                this.config.userSelections[selectedFor].push(el);
            }
        });
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

        // if(this.leftRecord === 'CurrentRecord' || this.leftRecord === undefined || this.config.cr1 === undefined || this.config.json.QueryFromConfig.returnType !== 'child'){
        //     await libs.remoteAction(this, 'query', {
        //         sObjApiName: this.config.json.childApiNames.obj1,
        //         fields: this.config.json.fields.obj1,
        //         relField: '',
        //         addCondition:" "+ this.config.json.parentChildRelFields.obj1 +" IN (" + this.config.userSelections.recOne.map(val => "'" + val + "'").join(",") + ")",
        //         callback: ((nodeName, data) => {
        //             this.config.cr1 = data[nodeName].records;
        //         })
        //     });
        // }
        
        // if(this.rightRecord === 'CurrentRecord' || this.rightRecord === undefined || this.config.cr2 === undefined || this.config.json.QueryFromConfig.returnType !== 'child'){
        //     await libs.remoteAction(this, 'query', {
        //         sObjApiName: this.config.json.childApiNames.obj2,
        //         fields: this.config.json.fields.obj2,
        //         relField: '',
        //         addCondition:" "+ this.config.json.parentChildRelFields.obj2 +" IN (" + this.config.userSelections.recTwo.map(val => "'" + val + "'").join(",") + ")",
        //         callback: ((nodeName, data) => {
        //             this.config.cr2 = data[nodeName].records;
        //         })
        //     });
        // }

        await this.fetchAndSetChildRecords('obj1', 'recOne', 'cr1', this.leftRecord, this.config.json.parentChildRelFields.obj1, this.config.json.fields.obj1);
        await this.fetchAndSetChildRecords('obj2', 'recTwo', 'cr2', this.rightRecord, this.config.json.parentChildRelFields.obj2, this.config.json.fields.obj2);
        
        if(this.config.json.compareChildRecordsCallback){
            this.config.childRecordsResult = eval('(' + this.config.json.compareChildRecordsCallback + ')')(this,libs,this.config.cr1,this.config.cr2)
        }else{
            let childRecords1 = this.convertArrToMap(this.config.cr1,this.config.json.uniqueKey.obj1);
            let childRecords2 = this.convertArrToMap(this.config.cr2,this.config.json.uniqueKey.obj2);
            this.config.childRecordsResult = this.compareChildRecords(childRecords1,childRecords2);
        }   
        libs.getGlobalVar(this.config.json.dataTable.uniqueName).records = this.config.childRecordsResult;
        this.config.showComparisonTable = true;
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
        console.log('ch',childRecordsResult);
        return childRecordsResult;
    }
}