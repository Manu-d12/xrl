import { LightningElement,track } from 'lwc';
import { libs } from 'c/libs';

export default class ExrlTab extends LightningElement {
    @track config = {};
    @track extApiName = 'Account::Account::';
    connectedCallback(){
        this.config.urlParameters = this.getQueryParameters();
        this.config.selectedApiName = this.config.urlParameters.c__apiName ? atob(this.config.urlParameters.c__apiName) : "";
        this.config.uniqName = this.config.urlParameters.c__name ? atob(this.config.urlParameters.c__name) : "";
        this.config.recordId = this.config.urlParameters.c__recordId ? atob(this.config.urlParameters.c__recordId) !== undefined ? atob(this.config.urlParameters.c__recordId) : false : false;
        if(!this.config.urlParameters.c__apiName){
            libs.remoteAction(this, 'objectList', {callback: this.getAllObjects.bind(this) });
        }
    }

    getAllObjects(cmd,data){
        this.config.objList = [];
        console.log('getAllObjects',JSON.parse(data[cmd].describe));
        this.config.allObjectDesc = JSON.parse(data[cmd].describe);
        for(const key in this.config.allObjectDesc){
            this.config.objList.push({'label':this.config.allObjectDesc[key].label,'value':this.config.allObjectDesc[key].name});
        }
        this.config.objList.sort();
    }
    handleOpenGrid(event){
        this.template.querySelector('c-ext-rel-list').updateGridView(this.config.selectedApiName);
    }

    handleSelect(event) {
        let selectedObj = event.detail.payload.value;
        // let obj = this.config.objList.find((el) => { return el.value === selectedObj});
        let obj = this.config.allObjectDesc[selectedObj];
        if(selectedObj !== null && obj !== undefined){
            if(selectedObj.toLowerCase().includes('history')){
                //for history grids
                this.config.selectedApiName = selectedObj.includes('__History') ? 
                obj.label + '::' + selectedObj + '::Parent.' + obj.associateParentEntity //custom history object
                //Example- History: BoM::nameSpace__Bom__History::Parent.nameSpace__Bom__c
                : obj.label + '::' + selectedObj + '::' + obj.associateParentEntity + 'Id'; //standard history object
                //Example- Account History::AccountHistory::AccountId
            }else{
                //for normal grids
                this.config.selectedApiName = obj.label + '::' + selectedObj + '::';
            }
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