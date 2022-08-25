import { LightningElement,track } from 'lwc';
import { libs } from 'c/libs';

export default class ExrlTab extends LightningElement {
    @track config = {};
    @track objList = [];
    @track extApiName = '';
    connectedCallback(){
        libs.remoteAction(this, 'objectList', {callback: this.getAllObjects.bind(this) });
    }

    getAllObjects(cmd,data){
        this.objList = data[cmd].sort();
    }
    handleSelectChange(event){   
        let selectedObj = event.target.value;
        this.extApiName = selectedObj + ':' + selectedObj + ':';
        this.template.querySelector('c-ext-rel-list').updateGridView(this.extApiName);
    }
}