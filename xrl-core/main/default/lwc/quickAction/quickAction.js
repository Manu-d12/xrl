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
                this.config = JSON.parse(data[nodeName].cfg);
                this.config._timeStamp = data[nodeName].timeStamp;
                if (this.config.UI == undefined) {
                    this.getRecordsAndSend();                
                }
            })
        });

        libs.setGlobalVar(this.cfgName,{
            isQuickActionDialogOpen: true
        });
    }

    getRecordsAndSend() {
        //Need to get a name of related list
        let objName = this.actionName.replace(/^(.*?)\..*?$/, "$1");
        let SOQL = "SELECT Id, (SELECT Id FROM " + this.config.orchestrator.childObjApiName + ") FROM " + objName + " WHERE Id='" + this.urlParams.recordId + "'";
        if (this.config.UI){
            let title = this.config.UI.loadRecordsLabel;
            this.template.querySelector('c-dialog').disableButtons(title, true);
        }
        console.log(this.config, SOQL, this.urlParams);
        libs.remoteAction(this, 'customSoql', {
            SOQL: SOQL,
            callback: ((nodeName, data) => {
                console.log('List of child Ids', data[nodeName]);
                let relatedRecords = data[nodeName].records[0][this.config.orchestrator.childObjApiName];
                if (relatedRecords == undefined) this.handleEvent();
                
                
                //chunking
                let suggestedChunckSize = (10000 / 2 / this.config.executors.length) - this.config.executors.length;// *2 because we also need delete old records    
                let chunkSize = this.config.orchestrator?.limits?.chunkSize ? this.config.orchestrator?.limits?.chunkSize : 200;

                libs.setGlobalVar('orchestratorRequestCount',relatedRecords.length);
                libs.remoteAction(this, 'orchestrator', {
                    isDebug: this.config.UI?.isDebug,
                    operation: this.cfgName,
                    recordsPath: "orchestratorRequest.relatedRecordIds",
                    _chunkSize: chunkSize > suggestedChunckSize ? suggestedChunckSize : chunkSize,// we have a limitation for a SF 10.000 records in a same transaction
                    finishCallback: this.config.orchestrator?.noErrorCallback?.UI,
                    orchestratorRequest: {
                        rootRecordId: this.urlParams.recordId,
                        relatedRecordIds: Array.from(relatedRecords, function (entry) { return entry.Id; }),
                        timeStamp : this.config._timeStamp
                    },
                    callback: ((nodeName, data) => {
                        console.log(nodeName, data);
                        let res = libs.orchestratorResult(data[nodeName]); 
                        
                        if (this.config.UI){
                            let title = this.config.UI.processRecordsLabel.replace('{1}', libs.getGlobalVar('orchestratorRequestCount')).replace('{0}',res.totalRecords).replace('{2}', res.errorRecords);
                            this.template.querySelector('c-dialog').disableButtons(title,  !data.isLastChunk);
                        }
                    })
                })
            })
        })
    }


    @api handleEvent(event){

        let target = event?.detail?.action;
        if (target == 'getRecordsAndSend') this.getRecordsAndSend();
        else {
            this.dispatchEvent(new CloseActionScreenEvent());
            libs.getGlobalVar(this.cfgName).isQuickActionDialogOpen = false;
        }
    }

    parseUrlParams() {
        const url = location.href.replace('?c__', '?').replaceAll('&c__', '&').substring(location.href.indexOf('?'));
        const searchParams = new URLSearchParams(url);
        return Object.fromEntries(searchParams);
    }
}