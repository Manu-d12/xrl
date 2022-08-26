import { LightningElement,track } from 'lwc';
import { libs } from 'c/libs';

export default class ExrlTab extends LightningElement {
    @track config = {};
    @track objList = [];
    @track extApiName = '';
    selectedApiName = '';
    connectedCallback(){
        // this.config = libs.getGlobalVar('Case');
        libs.remoteAction(this, 'objectList', {callback: this.getAllObjects.bind(this) });
    }

    getAllObjects(cmd,data){
        data[cmd].sort().forEach((el)=>{
            this.objList.push({label:el,value:el});
        });
    }
    selectObject(event){
        let selectedObj = event.detail.slice(-1)[0];
        if(selectedObj !== undefined){
            this.selectedApiName = selectedObj + ':' + selectedObj + ':';
        }else{
            this.selectedApiName = '';
            this.extApiName = this.selectedApiName;
        }
    }
    handleOpenGrid(event){
        // this.template.querySelector('c-ext-rel-list').updateGridView(this.extApiName);
        this.extApiName = '';
        this.extApiName = this.selectedApiName;
        this.template.querySelector('c-ext-rel-list').updateGridView(this.extApiName);
    }
}