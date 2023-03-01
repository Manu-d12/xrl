import { LightningElement,track,api } from 'lwc';
import { libs } from 'c/libs';

export default class ComparingInterface extends LightningElement {
    @track config = {};
    @api cfg;
    @track name;
    connectedCallback(){
        this.config = libs.getGlobalVar(this.cfg);
        this.name = this.cfg;
        // this.config.sObjApiName = 'Case';
        this.config.userSelections = {};
        this.config.objRecords = {};
        this.config.childRecordsResult = [];
        libs.remoteAction(this, 'getCustomLabels', {callback: function(cmd,data){
            console.log('CustomLabes are loaded', data[cmd]);
            this.config._LABELS = data[cmd];
        } });
        libs.remoteAction(this, 'getConfigById', { configId: libs.getGlobalVar(this.name).configId, callback: this.setConfig.bind(this) });
    }
    async setConfig(cmd,data){
        console.log('Cn',JSON.parse(data[cmd].userConfig));
        this.config.json = JSON.parse(data[cmd].userConfig);
        libs.setGlobalVar(JSON.parse(data[cmd].userConfig).dataTable1.uniqueName,{
            "listViewConfig":JSON.parse(data[cmd].userConfig).dataTable1.dtConfig,
            "userInfo": data.userInfo,
            "_LABELS": this.config._LABELS
        });
        libs.getGlobalVar(JSON.parse(data[cmd].userConfig).dataTable1.uniqueName).records = [
            {"Id":"1234"}
        ];
        libs.setGlobalVar(JSON.parse(data[cmd].userConfig).dataTable2.uniqueName,{
            "listViewConfig":JSON.parse(data[cmd].userConfig).dataTable2.dtConfig,
            "userInfo": data.userInfo,
            "_LABELS": this.config._LABELS
        });
        libs.getGlobalVar(JSON.parse(data[cmd].userConfig).dataTable2.uniqueName).records = [
            {"Id":"1234"}
        ];
        this.config.obj1Fields = [];
        this.config.obj2Fields = [];
        this.config.json.parentFields.forEach((el)=>{
            this.config.obj1Fields.push(el.obj1FieldName);
            this.config.obj2Fields.push(el.obj2FieldName);
        });
        // this.config.showComparisonTable = true;
        // libs.remoteAction(this, 'objectList', {callback: this.getAllObjects.bind(this) });
        let selectedObj = 'TTNAMESPACE__BoM__c';
        let selectedFor = 'objOne';
        this.config.userSelections[selectedFor] = selectedObj;
        console.log(this.config.userSelections[selectedFor]);
        if(selectedFor.startsWith('obj')){
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
        }
        selectedObj = 'TTNAMESPACE__Quote__c';
        selectedFor = 'objTwo';
        this.config.userSelections[selectedFor] = selectedObj;
        console.log(this.config.userSelections[selectedFor]);
        if(selectedFor.startsWith('obj')){
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
        }
    }
    getAllObjects(cmd,data){
        this.config.objList = [];
        data[cmd].sort().forEach((el)=>{
            this.config.objList.push({'label':el.toString(),'value':el.toString()});
        });
        console.log('objList',JSON.parse(JSON.stringify(this.config.objList)));
    }
    handleSelect(event){
        let selectedObj = event.detail.payload.value;
        let selectedFor = event.target.getAttribute('data-id');
        this.config.userSelections[selectedFor] = selectedObj;
    }
    //handling all the events here
    handleEvent(event){
        let dataId = event.target.getAttribute('data-id');
        console.log('User Click: ', dataId);
        if(dataId === 'btn:compare'){
            this.handleComparison();
            return;
            //if the both objects are same
            if(this.config.userSelections.objOne === this.config.userSelections.objTwo){
                this.config.showComparisonTable = true;
                this.config.fieldsToCompare = ['Amount','ExpectedRevenue'];  //need to get this from config
                this.config.childFieldsToCompare = ['Id','Name','Quantity','ListPrice','UnitPrice','ProductCode'];  //need to get this from config
                this.config.childSObjectApi = 'OpportunityLineItem';  //need to get this from config
                this.config.parentChildRelField = 'OpportunityId';  //need to get this from config
                this.config.childUniqueKey = 'ProductCode';  //need to get this from config
                this.config.compareFields = new Set(['Quantity','ListPrice','UnitPrice']); //need to get this from config
                libs.remoteAction(this, 'query', {
                    sObjApiName: this.config.userSelections.objTwo,
                    fields: this.config.fieldsToCompare,
                    relField: '',
                    addCondition:" WHERE Id='" + this.config.userSelections.recOne + "' OR Id='" + this.config.userSelections.recTwo +"'",
                    callback: ((nodeName, data) => {
                        console.log('length', data[nodeName].records.length);
                        this.config.compareResult = this.compareRecords(data[nodeName].records[0],data[nodeName].records[1]);
                        this.config.showComparisonTable = true;
                        this.getChildRecords();
                    })
                });
            }
        }
    }
    async handleComparison(){
        await libs.remoteAction(this, 'query', {
            sObjApiName: this.config.json.obj1,
            fields: this.config.obj1Fields,
            relField: '',
            addCondition:" WHERE Id='" + this.config.userSelections.recOne + "'",
            callback: ((nodeName, data) => {
                console.log('length', data[nodeName].records.length);
                this.config.obj1Result = data[nodeName].records[0];
                // this.config.compareResult = this.compareRecords(data[nodeName].records[0],data[nodeName].records[1]);
                // this.config.showComparisonTable = true;
                // this.getChildRecords();
            })
        });
        await libs.remoteAction(this, 'query', {
            sObjApiName: this.config.json.obj2,
            fields: this.config.obj2Fields,
            relField: '',
            addCondition:" WHERE Id='" + this.config.userSelections.recTwo + "'",
            callback: ((nodeName, data) => {
                console.log('length', data[nodeName].records.length);
                this.config.obj2Result = data[nodeName].records[0];
            })
        });
        this.getChildRecords();
        this.config.compareResult = this.compareRecords(this.config.obj1Result,this.config.obj2Result);
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
        // this.config.childFieldsToCompare = ;
        await libs.remoteAction(this, 'query', {
            sObjApiName: this.config.json.childApiNames.obj1,
            fields: ['Id','Name','TTNAMESPACE__Quantity__c','TTNAMESPACE__BItemPartNumber__c','TTNAMESPACE__ItemDiscount__c','TTNAMESPACE__BoMItemListPrice__c'],
            relField: '',
            addCondition:" WHERE "+ this.config.json.parentChildRelFields.obj1 +"='" + this.config.userSelections.recOne + "'",
            callback: ((nodeName, data) => {
                console.log('length 1', data[nodeName].records.length);
                let uniqueKey = this.config.json.uniqueKey[0];
                this.config.childRecords1 = data[nodeName].records.reduce(function(acc, cur, i) {
                    acc[cur[uniqueKey]] = cur;
                    return acc;
                }, {});
            })
        });
        await libs.remoteAction(this, 'query', {
            sObjApiName: this.config.json.childApiNames.obj2,
            fields: ['Id','Name','TTNAMESPACE__QuoteItemQuantity__c','TTNAMESPACE__QItemPartNumber__c','TTNAMESPACE__QuoteItemListPrice__c','TTNAMESPACE__QuoteitemDiscount__c'],
            relField: '',
            addCondition:" WHERE "+ this.config.json.parentChildRelFields.obj2 +"='" + this.config.userSelections.recTwo + "'",
            callback: ((nodeName, data) => {
                console.log('length 2', data[nodeName].records.length);
                let uniqueKey = this.config.json.uniqueKey[1];
                this.config.childRecords2 = data[nodeName].records.reduce(function(acc, cur, i) {
                    acc[cur[uniqueKey]] = cur;
                    return acc;
                }, {});
            })
        });
        this.compareChildRecords();
        libs.getGlobalVar('dt1').records = this.config.childRecordsResult;
        this.config.showComparisonTable = true;
    }
    compareChildRecords(){
        let result = {};
        console.log('ck',this.config.childRecords1);
        Object.keys(this.config.childRecords1).forEach((el)=>{
            result = {};
            if(this.config.childRecords2[el]){
                // result.record1=this.config.childRecords1[el];
                for(let key in this.config.json.childComparisonMap){
                    let colCss =
                    (this.config.childRecords1[el][key] !== this.config.childRecords2[el][this.config.json.childComparisonMap[key]] ?
                        'background-color:#ff6d6d78;' : '');
                    result[key] = this.config.childRecords1[el][key];
                    result[this.config.json.childComparisonMap[key]] = this.config.childRecords2[el][this.config.json.childComparisonMap[key]];
                }
                result[this.config.json.uniqueKey[0]] = el;
                result[this.config.json.uniqueKey[1]] = el;
                Object.assign(result,this.config.childRecords1[el]);
                Object.assign(result,this.config.childRecords2[el]);
                // result.record2=this.config.childRecords2[el];
                // for(let key in this.config.childRecords2[el]){
                //     result.record2.push({key:key,value:this.config.childRecords2[el][key]});
                // }
                delete this.config.childRecords2[el];
            }else{
                Object.assign(result,this.config.childRecords1[el]);
                // result.record1=this.config.childRecords1[el];
                // for(let key in this.config.childRecords1[el]){
                //     result.record1.push({key:key,value:this.config.childRecords1[el][key]});
                //     result.record2.push({key:'',value:''});
                // }
            }
            this.config.childRecordsResult.push(result);
        });
        Object.keys(this.config.childRecords2).forEach((el)=>{
            result = {};
            Object.assign(result,this.config.childRecords2[el]);
            this.config.childRecordsResult.push(result);
        });
        // Object.keys(this.config.childRecords2).forEach((el)=>{
        //     for(let key in this.config.childRecords2[el]){
        //         result.record1.push({key:'',value:''});
        //         result.record2.push({key:key,value:this.config.childRecords2[el][key]});
        //     }
        // });
        // this.config.childRecordsResult.push(result);
        console.log('ch',this.config.childRecordsResult);
    }
}