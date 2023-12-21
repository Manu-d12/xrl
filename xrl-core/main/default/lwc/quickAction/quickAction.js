import { LightningElement, wire, api, track } from 'lwc';
import { libs } from 'c/libs';
import { CloseActionScreenEvent } from 'lightning/actions';


export default class customAction extends LightningElement {


    actionName = location.pathname.replace(/\/.*\/(.*)$/, "$1");
    cfgName = this.actionName.replaceAll(/__c\./ig,'.').replaceAll(/__/ig,'').replace('.', '_');
    @track config = {}
    urlParams = this.parseUrlParams();
    @track result = '';



    connectedCallback() {

        console.log('Custom LWC', this.actionName, this.modal, this.template)//code

        
        libs.remoteAction(this, 'getMetaConfigByName', {
            cfgName: this.cfgName,
            callback: ((nodeName, data) => {
                this.config = JSON.parse(data[nodeName]);
                if (this.config.UI == undefined) {
                    this.getRecordsAndSend();                
                }
            })
        });


    }

    getRecordsAndSend() {
        //Need to get a name of related list
        let objName = this.actionName.replace(/^(.*?)\..*?$/, "$1");
        let SOQL = "SELECT Id, (SELECT Id FROM " + this.config.orchestrator.childObjApiName + ") FROM " + objName + " WHERE Id='" + this.urlParams.recordId + "'";

        console.log(this.config, SOQL, this.urlParams);
        libs.remoteAction(this, 'customSoql', {
            SOQL: SOQL,
            callback: ((nodeName, data) => {
                console.log('List of child Ids', data[nodeName]);
                let relatedRecords = data[nodeName].records[0][this.config.orchestrator.childObjApiName];
                if (relatedRecords == undefined) this.handleEvent();
                
                // relatedRecords.length = this.config.orchestrator?.limits?.chunkSize ? this.config.orchestrator?.limits?.chunkSize : 200;
                //chunking
                libs.setGlobalVar('orchestratorResult',[]);
                libs.remoteAction(this, 'orchestrator', {
                    isDebug: this.config.UI?.isDebug,
                    operation: this.cfgName,
                    recordsPath: "orchestratorRequest.relatedRecordIds",
                    _chunkSize: this.config.orchestrator?.limits?.chunkSize ? this.config.orchestrator?.limits?.chunkSize : 200,
                    finishCallback: this.config.orchestrator?.noErrorCallback?.UI,
                    orchestratorRequest: {
                        rootRecordId: this.urlParams.recordId,
                        relatedRecordIds: Array.from(relatedRecords, function (entry) { return entry.Id; })
                    },
                    callback: ((nodeName, data) => {
                        console.log(nodeName, data);
                        this.result = data[nodeName];
                        libs.getGlobalVar('orchestratorResult').push(this.result); 
                    })
                })
            })
        })
    }


    @api handleEvent(event){

        let target = event?.detail?.action;
        if (target == 'getRecordsAndSend') this.getRecordsAndSend();
        else this.dispatchEvent(new CloseActionScreenEvent());
    }

    parseUrlParams() {
        const url = location.href.replace('?c__', '?').replaceAll('&c__', '&').substring(location.href.indexOf('?'));
        const searchParams = new URLSearchParams(url);
        return Object.fromEntries(searchParams);
    }
}