import { LightningElement,track } from 'lwc';
import { libs } from 'c/libs';

export default class ExrlTab extends LightningElement {
    @track config = {};
    @track extApiName = 'Account::Account::';
    connectedCallback(){
        this.config.urlParameters = this.getQueryParameters();
        this.config.selectedApiName = this.config.urlParameters.c__apiName ? atob(this.config.urlParameters.c__apiName) : "";
        this.config.uniqName = this.config.urlParameters.c__name ? atob(this.config.urlParameters.c__name) : "";
        this.config.recordId = this.config.urlParameters.c__recordId ? atob(this.config.urlParameters.c__recordId) : "";
        libs.remoteAction(this, 'objectList', {callback: this.getAllObjects.bind(this) });
    }

    getAllObjects(cmd,data){
        this.config.objList = [];
        for(const key in data[cmd]){
            this.config.objList.push({'label':data[cmd][key],'value':key});
        }
        this.config.objList.sort();
    }
    handleOpenGrid(event){
        this.template.querySelector('c-ext-rel-list').updateGridView(this.config.selectedApiName);
    }

    handleSelect(event) {
        let selectedObj = event.detail.payload.value;
        let obj = this.config.objList.find((el) => { return el.value === selectedObj});
        if(selectedObj !== null && obj !== undefined){
            this.config.selectedApiName = obj.label + '::' + selectedObj + '::';
            this.handleOpenGrid();
        }
        
    }
    getQueryParameters() {

        let params = {};
        let search = location.search.substring(1);

        if (search) {
            params = JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}', (key, value) => {
                return key === "" ? value : decodeURIComponent(value)
            });
        }

        return params;
    }
}