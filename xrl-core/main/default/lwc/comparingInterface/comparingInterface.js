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
    setConfig(cmd,data){
        console.log('Cn',JSON.parse(data[cmd].userConfig).dataTable1);
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
        this.config.showComparisonTable = true;
        libs.remoteAction(this, 'objectList', {callback: this.getAllObjects.bind(this) });
    }
    getAllObjects(cmd,data){
        this.config.objList = [];
        data[cmd].sort().forEach((el)=>{
            this.config.objList.push({'label':el.toString(),'value':el.toString()});
        });
    }
    handleSelect(event){
        let selectedObj = event.detail.payload.value;
        let selectedFor = event.target.getAttribute('data-id');
        this.config.userSelections[selectedFor] = selectedObj;
        console.log(this.config.userSelections[selectedFor]);
        if(selectedFor.startsWith('obj')){
            //Getting the records from depending on selected object
            libs.remoteAction(this, 'query', {
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
                this.config.showComparisonTable = true;
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
                this.config.showComparisonTable = true;
            })
        });
        this.getChildRecords();
        this.config.compareResult = this.compareRecords(this.config.obj1Result,this.config.obj2Result);
    }
    //This function compares 2 records
    //accepts 2 records map and returns a single map
    compareRecords(record1,record2){
        let result = [];
        for(let key in record1){
            if(key === 'Id') continue;
            let r = {};
            if(record2[key]){
                if(record1[key] === record2[key]){
                    console.log('SAME');
                }else{
                    r.css1 = 'background-color: #ff2f2f73;';
                    r.css2 = 'background-color: #ff2f2f73;';
                    console.log('NO');
                }
                r.fieldName1 = key;
                r.value1 = record1[key];
                r.fieldName2 = key;
                r.value2 = record2[key];
                result.push(r);
            }
        }
        return result;
    }
    async getChildRecords(){
        this.config.parentChildRelField = 'OpportunityId';
        this.config.childFieldsToCompare = ['Id','Name','Quantity','ListPrice','UnitPrice','ProductCode'];
        await libs.remoteAction(this, 'query', {
            sObjApiName: 'OpportunityLineItem',
            fields: this.config.childFieldsToCompare,
            relField: '',
            addCondition:" WHERE "+ this.config.parentChildRelField +"='" + this.config.userSelections.recOne + "'",
            callback: ((nodeName, data) => {
                console.log('length 1', data[nodeName].records.length);
                let uniqueKey = this.config.childUniqueKey;
                this.config.childRecords1 = data[nodeName].records.reduce(function(acc, cur, i) {
                    acc[cur[uniqueKey]] = cur;
                    return acc;
                  }, {});
                // if(this.config.childRecords1 && this.config.childRecords2){
                //     console.log('Can be compared');
                //     this.compareChildRecords();
                // }
            })
        });
        await libs.remoteAction(this, 'query', {
            sObjApiName: 'OpportunityLineItem',
            fields: this.config.childFieldsToCompare,
            relField: '',
            addCondition:" WHERE "+ this.config.parentChildRelField +"='" + this.config.userSelections.recTwo + "'",
            callback: ((nodeName, data) => {
                console.log('length 2', data[nodeName].records.length);
                let uniqueKey = this.config.childUniqueKey;
                this.config.childRecords2 = data[nodeName].records.reduce(function(acc, cur, i) {
                    acc[cur[uniqueKey]] = cur;
                    return acc;
                }, {});
                // if(this.config.childRecords1 && this.config.childRecords2){
                //     console.log('Can be compared');
                //     this.compareChildRecords();
                // }
            })
        });
        this.compareChildRecords();
        // if(this.config.childRecords1 && this.config.childRecords2){
        //     console.log('Can be compared');
        // }
    }
    compareChildRecords(){
        let result = {
            record1:[],
            record2:[]
        };
        Object.keys(this.config.childRecords1).forEach((el)=>{
            result = {
                record1:[],
                record2:[]
            };
            if(this.config.childRecords2[el]){
                // result.record1=this.config.childRecords1[el];
                for(let key in this.config.childRecords1[el]){
                    let colCss = this.config.compareFields.has(key) ?
                    (this.config.childRecords1[el][key] !== this.config.childRecords2[el][key] ?
                        'background-color:#ff6d6d78;' : '') : '';
                    result.record1.push({key:key,value:this.config.childRecords1[el][key],css:colCss});
                    result.record2.push({key:key,value:this.config.childRecords2[el][key],css:colCss});
                }
                // result.record2=this.config.childRecords2[el];
                // for(let key in this.config.childRecords2[el]){
                //     result.record2.push({key:key,value:this.config.childRecords2[el][key]});
                // }
                delete this.config.childRecords2[el];
            }else{
                // result.record1=this.config.childRecords1[el];
                for(let key in this.config.childRecords1[el]){
                    result.record1.push({key:key,value:this.config.childRecords1[el][key]});
                    result.record2.push({key:'',value:''});
                }
            }
            this.config.childRecordsResult.push(result);
        });
        result = {
            record1:[],
            record2:[]
        };
        // Object.keys(this.config.childRecords2).forEach((el)=>{
        //     result.record2=this.config.childRecords2[el];
        // });
        Object.keys(this.config.childRecords2).forEach((el)=>{
            for(let key in this.config.childRecords2[el]){
                result.record1.push({key:'',value:''});
                result.record2.push({key:key,value:this.config.childRecords2[el][key]});
            }
        });
        this.config.childRecordsResult.push(result);
    }
    // compareChildRecord(record1,record2){
    //     let result = {
    //         record1:{},
    //         record2:{}
    //     };
    //     Object.keys(record1).forEach((el)=>{
    //         if(record2[el]){
    //             if(record1[el] !== record2[el])
    //         }
    //     });
    // }
}