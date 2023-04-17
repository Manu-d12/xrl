import { LightningElement,track,api } from 'lwc';
import { libs } from 'c/libs';

export default class ComparingInterface extends LightningElement {
    @track config = {};
    @api apiName;
    @api leftRecord;
    @api rightRecord;
    @api recordId;
    @track name;
    connectedCallback(){
        this.name = 'cmp' + Math.floor(Math.random() * 10);
        libs.setGlobalVar(this.name,{});
        this.config = libs.getGlobalVar(this.name);
        this.config.userSelections = {};
        this.config.objRecords = {};
        this.config.childRecordsResult = [];
        libs.remoteAction(this, 'getCustomLabels', {callback: function(cmd,data){
            console.log('CustomLabels are loaded', data[cmd]);
            this.config._LABELS = data[cmd];
        } });
        console.log('apiName: ' + this.apiName);
        if(this.apiName === undefined){
            this.getExtRelListConfigs();
        }else{
            libs.remoteAction(this, 'getConfigById', { configId: this.apiName.split('::')[0], callback: this.setConfig.bind(this) });
        }
    }
    async getExtRelListConfigs(){
        this.config.extConfigs = [];
        await libs.remoteAction(this, 'query', {
            sObjApiName: 'extRelListConfig__c',
            fields: ['Id','Name','JSON__c'],
            relField: '',
            addCondition: " configType__c = 'Comparison'",
            callback: ((nodeName, data) => {
                console.log('length', data[nodeName].records.length);
                data[nodeName].records.forEach((record) => {
                    this.config.extConfigs.push({'label':record.Name + ' Object1: ' +JSON.parse(record.XRL__JSON__c).obj1 + ' Object2: ' +JSON.parse(record.XRL__JSON__c).obj2, 'value':record.Id});
                });
                this.config.showConfigSelection = true;
            })
        });
    }
    async setConfig(cmd,data){
        if(JSON.parse(data[cmd].userConfig) === undefined) return;
        libs.getGlobalVar(this.name).userInfo = data.userInfo;
        libs.getGlobalVar(this.name).currency =  data[cmd].currency;
        libs.getGlobalVar(this.name).recordId = this.recordId;
        console.log('Cn',JSON.parse(data[cmd].userConfig));
        this.config.json = JSON.parse(data[cmd].userConfig);
        if(this.config.json.actions && this.config.json.actions.length > 0){
            this.config.actionsBar = {
                'actions':this.config.json.actions,
                '_cfgName': this.config.json.dataTable.uniqueName
            };
        }
        libs.setGlobalVar(JSON.parse(data[cmd].userConfig).dataTable.uniqueName,{
            "listViewConfig":JSON.parse(data[cmd].userConfig).dataTable.dtConfig,
            "userInfo": data.userInfo,
            "currency": data[cmd].currency,
            "_LABELS": this.config._LABELS
        });
        this.config.obj1Fields = [];
        this.config.obj2Fields = [];
        if(this.config.json.parentFields && this.config.json.parentFields.length > 0){
            this.config.json.parentFields.forEach((el)=>{
                this.config.obj1Fields.push(el.obj1FieldName);
                this.config.obj2Fields.push(el.obj2FieldName);
            });
        }
        let selectedObj = this.config.json.obj1;
        let selectedFor = 'objOne';
        this.config.userSelections[selectedFor] = selectedObj;
        console.log(this.config.userSelections[selectedFor]);
        if(selectedFor.startsWith('obj') && this.leftRecord === undefined){
            //Getting the records from depending on selected object
            await libs.remoteAction(this, 'query', {
                sObjApiName: selectedObj,
                fields: ['Id','Name'],
                relField: '',
                callback: ((nodeName, data) => {
                    console.log('length', data[nodeName].records.length);
                    this.config.objRecords[selectedFor]= [];
                    data[nodeName].records.forEach((el)=>{
                        this.config.objRecords[selectedFor].push({'label':el.Name,'value':el.Id});
                    })
                })
            });
        }else if(this.leftRecord === 'CurrentRecord'){
            this.config.userSelections.recOne = [this.recordId];
        }else if(this.leftRecord !== ''){
            await libs.remoteAction(this, 'customSoql', {
                SOQL: libs.replaceLiteralsInStr(this.leftRecord,this.name),
                callback: ((nodeName, data1) => {
                    if(this.config.json.QueryFromConfig.returnType === 'parent'){
                        this.config.userSelections.recOne = data1[nodeName].records.map(val =>  val.Id );
                    }else if(this.config.json.QueryFromConfig.returnType === 'child'){
                        console.log('length 2', this.config.json.uniqueKey.obj1);
                        this.config.cr1 = data1[nodeName].records;
                    }
                })
            });
        }
        selectedObj = this.config.json.obj2;
        selectedFor = 'objTwo';
        this.config.userSelections[selectedFor] = selectedObj;
        console.log(this.config.userSelections[selectedFor]);
        if(selectedFor.startsWith('obj') && this.rightRecord === undefined){
            //Getting the records from depending on selected object
            await libs.remoteAction(this, 'query', {
                sObjApiName: selectedObj,
                fields: ['Id','Name'],
                relField: '',
                callback: ((nodeName, data) => {
                    this.config.objRecords[selectedFor]= [];
                    data[nodeName].records.forEach((el)=>{
                        this.config.objRecords[selectedFor].push({'label':el.Name,'value':el.Id});
                    })
                })
            });
        }else if(this.rightRecord === 'CurrentRecord'){
            this.config.userSelections.recTwo = [this.recordId];
        }else if(this.rightRecord !== ''){
            await libs.remoteAction(this, 'customSoql', {
                SOQL: libs.replaceLiteralsInStr(this.rightRecord,this.name),
                callback: ((nodeName, data1) => {
                    if(this.config.json.QueryFromConfig.returnType === 'parent'){
                        this.config.userSelections.recTwo = data1[nodeName].records.map(val =>  val.Id );
                    }else if(this.config.json.QueryFromConfig.returnType === 'child'){
                        this.config.cr2 = data1[nodeName].records;
                    }
                })
            });
        }
        this.config.showCompareButton = true;
        if((this.config.userSelections.recOne && this.config.userSelections.recTwo) || 
        (this.config.userSelections.recOne?.length > 0 && this.config.cr2?.length > 0) ||
        (this.config.userSelections.recTwo?.length > 0 && this.config.cr1?.length > 0)) {
            this.config.showCompareButton = false;
            this.handleComparison();
        }
    }
    handleSelect(event){
        let selectedObj = event.detail.payload.values;
        let selectedFor = event.target.getAttribute('data-id');
        this.config.userSelections[selectedFor] = selectedObj;
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
                sObjApiName: this.config.json.obj1,
                fields: this.config.obj1Fields,
                relField: '',
                addCondition:" Id='" + this.config.userSelections.recOne + "'",
                callback: ((nodeName, data) => {
                    console.log('length', data[nodeName].records.length);
                    this.config.obj1Result = data[nodeName].records[0];
                })
            });
            await libs.remoteAction(this, 'query', {
                sObjApiName: this.config.json.obj2,
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

        if(this.leftRecord === 'CurrentRecord' || this.leftRecord === undefined || this.config.json.QueryFromConfig.returnType !== 'child'){
            await libs.remoteAction(this, 'query', {
                sObjApiName: this.config.json.childApiNames.obj1,
                fields: this.config.json.fields.obj1,
                relField: '',
                addCondition:" "+ this.config.json.parentChildRelFields.obj1 +" IN (" + this.config.userSelections.recOne.map(val => "'" + val + "'").join(",") + ")",
                callback: ((nodeName, data) => {
                    this.config.cr1 = data[nodeName].records;
                })
            });
        }
        
        if(this.rightRecord === 'CurrentRecord' || this.rightRecord === undefined || this.config.json.QueryFromConfig.returnType !== 'child'){
            await libs.remoteAction(this, 'query', {
                sObjApiName: this.config.json.childApiNames.obj2,
                fields: this.config.json.fields.obj2,
                relField: '',
                addCondition:" "+ this.config.json.parentChildRelFields.obj2 +" IN (" + this.config.userSelections.recTwo.map(val => "'" + val + "'").join(",") + ")",
                callback: ((nodeName, data) => {
                    this.config.cr2 = data[nodeName].records;
                })
            });
        }
        if(this.config.json.compareChildRecordsCallback){
            this.config.childRecordsResult = eval('(' + this.config.json.compareChildRecordsCallback + ')')(this.config.cr1,this.config.cr2)
        }else{
            let childRecords1 = this.convertArrToMap(this.config.cr1,this.config.json.uniqueKey.obj1);
            let childRecords2 = this.convertArrToMap(this.config.cr2,this.config.json.uniqueKey.obj2);
            this.config.childRecordsResult = this.compareChildRecords(childRecords1,childRecords2);
        }   
        libs.getGlobalVar(this.config.json.dataTable.uniqueName).records = this.config.childRecordsResult;
        this.config.showComparisonTable = true;
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
        Object.keys(childRecords1).forEach((el)=>{
            result = {};
            result[this.config.json.childApiNames.obj1] = {};
            result[this.config.json.childApiNames.obj2] = {};
            if(childRecords2[el]){
                result[this.config.json.childApiNames.obj1][this.config.json.uniqueKey.obj1] = el;
                result[this.config.json.childApiNames.obj2][this.config.json.uniqueKey.obj2] = el;
                Object.assign(result[this.config.json.childApiNames.obj1],childRecords1[el]);
                Object.assign(result[this.config.json.childApiNames.obj2],childRecords2[el]);
                delete childRecords2[el];
            }else{
                Object.assign(result[this.config.json.childApiNames.obj1],childRecords1[el]);
            }
            childRecordsResult.push(result);
        });
        Object.keys(childRecords2).forEach((el)=>{
            result = {};
            result[this.config.json.childApiNames.obj1] = {};
            result[this.config.json.childApiNames.obj2] = {};
            Object.assign(result[this.config.json.childApiNames.obj2],childRecords2[el]);
            childRecordsResult.push(result);
        });
        console.log('ch',childRecordsResult);
        return childRecordsResult;
    }
}