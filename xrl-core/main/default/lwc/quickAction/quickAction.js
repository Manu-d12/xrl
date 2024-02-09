import { LightningElement, wire, api, track } from 'lwc';
import { libs } from 'c/libs';
import { CloseActionScreenEvent } from 'lightning/actions';
//import { CurrentPageReference } from 'lightning/navigation';


export default class customAction extends LightningElement {

    //@api recordId;
    @track result = '';

    actionName = location.pathname.replace(/\/.*\/(.*)$/, "$1");
    cfgName = this.actionName.replaceAll(/__c\./ig, '.').replaceAll(/__/ig, '').replace('.', '_');
    @track config = {}
    urlParams = this.parseUrlParams();


    /*@wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.recordId = currentPageReference.state.recordId;
            console.log('STATE', currentPageReference.state);
        }
    }*/

    constructor() {
        super();
        console.log('Custom LWC', this.actionName, this.modal, this.template)//code

        libs.setGlobalVar(this.cfgName, {
            isQuickActionDialogOpen: true,
            recordId: this.urlParams.recordId

        });

        libs.remoteAction(this, 'getMetaConfigByName', {
            cfgName: this.cfgName,
            callback: ((nodeName, data) => {
                let config = JSON.parse(libs.replaceLiteralsInStr(data[nodeName].cfg, this.cfgName));
                config._timeStamp = data[nodeName].timeStamp;
                if (config.UI == undefined) {
                    this.config = config;
                    this.getRecordsAndSend();
                } else {
                    if (config.UI.initCallback) {
                        config.UI.initCallback = eval('[' + config.UI.initCallback + ']')[0];
                        config.UI.initCallback(this, libs, config);
                    } else {
                        this.config = config;
                    }
                }
            })
        });


    }


    connectedCallback() {
    }

    runOrchestratorAsync() {
        console.log('ASYNC');
        // Need invoke a class that will run a orchestrator in ASYNC mode
        libs.remoteAction(this, 'invokeApex', {
            isDebug: this.config.UI?.isDebug,
            helperType : this.config.UI?.apexAsyncClass,
            callback: ((nodeName, data) => {
                
            })
        });
    }

    runOrchestratorSync() {
        
        console.log('SYNC');
        debugger;
        let chunkSize = libs.setGlobalVar('chunkSize');
        let suggestedChunckSize = libs.setGlobalVar('suggestedChunckSize');
        libs.remoteAction(this, 'orchestrator', {
            isDebug: this.config.UI?.isDebug,
            operation: this.cfgName,
            recordsPath: "orchestratorRequest.relatedRecordIds",
            _chunkSize: chunkSize > suggestedChunckSize ? suggestedChunckSize : chunkSize,// we have a limitation for a SF 10.000 records in a same transaction
            finishCallback: this.config.orchestrator?.noErrorCallback?.UI,
            orchestratorRequest: {
                rootRecordId: this.urlParams.recordId,
                relatedRecordIds: Array.from(relatedRecords, function (entry) { return entry.Id; }),
                timeStamp: this.config._timeStamp
            },
            callback: ((nodeName, data) => {
                console.log(nodeName, data);
                let res = libs.orchestratorResult(data[nodeName]);

                if (this.config.UI) {
                    let title = this.config.UI.processRecordsLabel.replace('{1}', libs.getGlobalVar('orchestratorRequestCount')).replace('{0}', res.totalRecords).replace('{2}', res.errorRecords);
                    this.template.querySelector('c-dialog').disableButtons(title, !data.isLastChunk);
                }
            })
        })
    }

    getRecordsAndSend() {
        let objName = this.actionName.replace(/^(.*?)\..*?$/, "$1");
        let SOQL = "SELECT Id, (SELECT Id FROM " + this.config.orchestrator.childObjApiName + ") FROM " + objName + " WHERE Id='" + this.urlParams.recordId + "'";
        if (this.config.UI) {
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
                let executorsLength = this.config.executors ? this.config.executors?.length : 1;
                let suggestedChunckSize = (10000 / 2 / executorsLength) - executorsLength;// *2 because we also need delete old records    
                let chunkSize = this.config.orchestrator?.limits?.chunkSize ? this.config.orchestrator?.limits?.chunkSize : 200;
                let asyncThreshold = this.config.orchestrator?.limits?.asyncThreshold ? this.config.orchestrator?.limits?.asyncThreshold : 10000;
                libs.setGlobalVar('orchestratorRequestCount', relatedRecords.length);
                libs.setGlobalVar('suggestedChunckSize', suggestedChunckSize);
                libs.setGlobalVar('chunkSize', chunkSize);
                if (relatedRecords.length > asyncThreshold) {
                    //  need show dialog
                    this.config.UI.isSpinner = false;
                    this.config.showConfirmation = true;
                    this.config.confirmationUI = {
                        "buttons": [
                            {
                            "name": "cancel",
                            "label": "Cancel",
                            "variant": "neutral"
                            },
                            {
                            "name": "btn:async",
                            "label": "Async",
                            "variant": "neutral",
                            "callback": "function(scope, libs, data) {\n    let event = new CustomEvent('action', {\n        detail: {\n            action: 'runOrchestratorAsync'\n        }\n    });\n    scope.dispatchEvent(event);\n}"
                            },
                            {
                            "name": "btn:sync",
                            "label": "Sync",
                            "variant": "brand",
                            "class": "slds-m-left_x-small",
                            "callback": "function(scope, libs, data) {\n    let event = new CustomEvent('action', {\n        detail: {\n            action: 'runOrchestratorSync'\n        }\n    });\n    scope.dispatchEvent(event);\n}"
                            }
                        ],
                        "contents": [
                            {
                            "isMessage": true,
                            "name": "runConfirm",
                            "title": "Confirmation",
                            "text": "What is the way you prefer to use?"
                            }
                        ]
                    }
                } else {
                    this.runOrchestratorSync()
                }
            })
        })
    }


    @api async handleEvent(event) {
        let dataId = event.target.getAttribute('data-id');

        if(dataId === 'confirmationdialog' && event?.detail?.action === 'cancel') {
            this.config.showConfirmation = false;
            this.config.confirmationUI = false;
            return;
        }

        let target = event?.detail?.action;
        if (target == 'getRecordsAndSend') this.getRecordsAndSend();
        else if (target == 'runOrchestratorSync') this.runOrchestratorSync();
        else if (target == 'runOrchestratorAsync') this.runOrchestratorAsync();
        else if(target == ':executeCallbackOnQuickAction'){
            let callback = eval('[' + event?.detail?.btn?.callback + ']')[0];
            let result = await callback(this, libs, event?.detail?.btn?.data);
            console.log('RESULT', result);
        }
        
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