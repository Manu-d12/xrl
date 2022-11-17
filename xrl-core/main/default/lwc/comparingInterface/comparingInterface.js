import { LightningElement,track } from 'lwc';
import { libs } from 'c/libs';

export default class ComparingInterface extends LightningElement {
    @track config = {};
    connectedCallback(){
        this.config.userSelections = {};
        this.config.objRecords = {};
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
            //if the both objects are same
            if(this.config.userSelections.objOne === this.config.userSelections.objTwo){
                this.config.showComparisonTable = true;
                this.config.fieldsToCompare = ['Amount','ExpectedRevenue'];  //need to get this from config
                libs.remoteAction(this, 'query', {
                    sObjApiName: this.config.userSelections.objTwo,
                    fields: this.config.fieldsToCompare,
                    relField: '',
                    addCondition:" WHERE Id='" + this.config.userSelections.recOne + "' OR Id='" + this.config.userSelections.recTwo +"'",
                    callback: ((nodeName, data) => {
                        console.log('length', data[nodeName].records.length);
                        this.config.compareResult = this.compareRecords(data[nodeName].records[0],data[nodeName].records[1]);
                        this.config.showComparisonTable = true;
                    })
                });
            }
        }
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
                }else if(record1[key] > record2[key]){
                    r.css1 = 'background-color: #00ffff;';
                    r.css2 = 'background-color: red;';
                    console.log('NO');
                }else{
                    r.css2 = 'background-color: #00ffff;';
                    r.css1 = 'background-color: red;';
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
}