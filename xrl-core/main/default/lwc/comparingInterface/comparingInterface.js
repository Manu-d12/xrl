import { LightningElement,track } from 'lwc';
import { libs } from 'c/libs';

export default class ComparingInterface extends LightningElement {
    @track config = {};
    connectedCallback(){
        this.config.userSelections = {};
        this.config.objRecords = {};
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
}