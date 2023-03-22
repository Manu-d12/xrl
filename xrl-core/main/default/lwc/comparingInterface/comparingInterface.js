import { LightningElement,track,api } from 'lwc';
import { libs } from 'c/libs';

export default class ComparingInterface extends LightningElement {
    @track config = {};
    @api cfg;
    @api apiName;
    @track name;
    connectedCallback(){
        this.cfg = 'cmp';
        libs.setGlobalVar(this.cfg,{});
        this.config = libs.getGlobalVar(this.cfg);
        this.name = this.cfg;
        this.config.userSelections = {};
        this.config.objRecords = {};
        this.config.childRecordsResult = [];
        libs.remoteAction(this, 'getCustomLabels', {callback: function(cmd,data){
            console.log('CustomLabes are loaded', data[cmd]);
            this.config._LABELS = data[cmd];
        } });
        this.getExtRelListConfigs();
    }
    async getExtRelListConfigs(){
        this.config.extConfigs = [];
        await libs.remoteAction(this, 'query', {
            sObjApiName: 'extRelListConfig__c',
            fields: ['Id','Name','JSON__c'],
            relField: '',
            addCondition: "WHERE configType__c = 'Comparison'",
            callback: ((nodeName, data) => {
                console.log('length', data[nodeName].records.length);
                data[nodeName].records.forEach((record) => {
                    this.config.extConfigs.push({'label':record.Name, 'value':record.Id});
                });
                this.config.show = true;
            })
        });
    }
    async setConfig(cmd,data){
        console.log('Cn',JSON.parse(data[cmd].userConfig));
        this.config.json = JSON.parse(data[cmd].userConfig);
        libs.setGlobalVar(JSON.parse(data[cmd].userConfig).dataTable.uniqueName,{
            "listViewConfig":JSON.parse(data[cmd].userConfig).dataTable.dtConfig,
            "userInfo": data.userInfo,
            "_LABELS": this.config._LABELS
        });
        this.config.obj1Fields = [];
        this.config.obj2Fields = [];
        this.config.json.parentFields.forEach((el)=>{
            this.config.obj1Fields.push(el.obj1FieldName);
            this.config.obj2Fields.push(el.obj2FieldName);
        });
        let selectedObj = this.config.json.obj1;
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
        selectedObj = this.config.json.obj2;
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
        if(dataId === 'configId'){
            libs.remoteAction(this, 'getConfigById', { configId: event.detail.payload.value, callback: this.setConfig.bind(this) });
        }
        if(dataId === 'btn:compare'){
            this.config.showComparisonTable = false;
            libs.getGlobalVar('dt1').records = undefined;
            this.handleComparison();
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
        if(this.config.json.compareParentRecordsCallback){
            this.config.compareResult = eval('(' + this.config.json.compareParentRecordsCallback + ')')(this.config.obj1Result,this.config.obj2Result);
        }else{
            this.config.compareResult = this.compareRecords(this.config.obj1Result,this.config.obj2Result);
        } 
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
        await libs.remoteAction(this, 'query', {
            sObjApiName: this.config.json.childApiNames.obj1,
            fields: this.config.json.fields.obj1,
            relField: '',
            addCondition:" WHERE "+ this.config.json.parentChildRelFields.obj1 +"='" + this.config.userSelections.recOne + "'",
            callback: ((nodeName, data) => {
                console.log('length 1', data[nodeName].records.length);
                this.config.cr1 = data[nodeName].records;
                let uniqueKey = this.config.json.uniqueKey.obj1;
                this.config.childRecords1 = data[nodeName].records.reduce(function(acc, cur, i) {
                    acc[cur[uniqueKey]] = cur;
                    return acc;
                }, {});
            })
        });
        await libs.remoteAction(this, 'query', {
            sObjApiName: this.config.json.childApiNames.obj2,
            fields: this.config.json.fields.obj2,
            relField: '',
            addCondition:" WHERE "+ this.config.json.parentChildRelFields.obj2 +"='" + this.config.userSelections.recTwo + "'",
            callback: ((nodeName, data) => {
                console.log('length 2', data[nodeName].records.length);
                this.config.cr2 = data[nodeName].records;
                let uniqueKey = this.config.json.uniqueKey.obj2;
                this.config.childRecords2 = data[nodeName].records.reduce(function(acc, cur, i) {
                    acc[cur[uniqueKey]] = cur;
                    return acc;
                }, {});
            })
        });
        if(this.config.json.compareChildRecordsCallback){
            this.config.childRecordsResult = eval('(' + this.config.json.compareChildRecordsCallback + ')')(this.config.cr1,this.config.cr2)
        }else{
            this.compareChildRecords();
        }   
        libs.getGlobalVar('dt1').records = this.config.childRecordsResult;
        this.config.showComparisonTable = true;
    }
    compareChildRecords(){
        let result = {};
        Object.keys(this.config.childRecords1).forEach((el)=>{
            result = {};
            if(this.config.childRecords2[el]){
                for(let key in this.config.json.childComparisonMap){
                    let colCss =
                    (this.config.childRecords1[el][key] !== this.config.childRecords2[el][this.config.json.childComparisonMap[key]] ?
                        'background-color:#ff6d6d78;' : '');
                    result[key] = this.config.childRecords1[el][key];
                    result[this.config.json.childComparisonMap[key]] = this.config.childRecords2[el][this.config.json.childComparisonMap[key]];
                }
                result[this.config.json.uniqueKey.obj1] = el;
                result[this.config.json.uniqueKey.obj2] = el;
                Object.assign(result,this.config.childRecords1[el]);
                Object.assign(result,this.config.childRecords2[el]);
                delete this.config.childRecords2[el];
            }else{
                Object.assign(result,this.config.childRecords1[el]);
            }
            this.config.childRecordsResult.push(result);
        });
        Object.keys(this.config.childRecords2).forEach((el)=>{
            result = {};
            Object.assign(result,this.config.childRecords2[el]);
            this.config.childRecordsResult.push(result);
        });
        console.log('ch',this.config.childRecordsResult);
    }
}