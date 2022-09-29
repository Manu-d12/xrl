import { LightningElement,track } from 'lwc';
import { libs } from 'c/libs';

export default class ExrlTab extends LightningElement {
    @track config = {};
    @track objList = [];
    @track extApiName = 'Account:Account:';
    selectedApiName = '';
    connectedCallback(){
        libs.remoteAction(this, 'objectList', {callback: this.getAllObjects.bind(this) });
    }

    getAllObjects(cmd,data){
        data[cmd].sort().forEach((el)=>{
            this.objList.push({'label':el.toString(),'value':el.toString()});
        });
    }
    handleOpenGrid(event){
        this.template.querySelector('c-ext-rel-list').updateGridView(this.selectedApiName);
    }

    handleSelect(event) {
        let selectedObj = event.detail.payload.value;
        if(selectedObj !== null){
            this.selectedApiName = selectedObj + ':' + selectedObj + ':';
        }
        
       }
}