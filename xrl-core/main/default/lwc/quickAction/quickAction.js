import { LightningElement, wire, api, track } from 'lwc';
import { libs } from 'c/libs';
import { CloseActionScreenEvent } from 'lightning/actions';


export default class customAction extends LightningElement {


    actionName = location.pathname.replace(/\/.*\/(.*)$/, "$1").replace(/\.(.*__)/, '.');
    @track config = {}
    urlParams = this.parseUrlParams();
    @track result = '';



    connectedCallback() {

        console.log('Custom LWC', this.actionName, this.modal, this.template)//code
        libs.remoteAction(this, 'customSoql', {
            SOQL: "SELECT JSON__c FROM config__mdt WHERE DeveloperName = '" + this.actionName.replace('.', '_') + "'",
            callback: ((nodeName, data) => {
                this.config = JSON.parse(data[nodeName].records[0].TTNAMESPACE__JSON__c);



                //Need to get a name of related list
                /*let SOQL = "SELECT Id, (SELECT Id FROM " + this.config.orchestrator.childObjApiName + ") FROM " + this.actionName.replace(/^(.*?)\..*?$/, "$1") + " WHERE Id='" + this.urlParams.recordId + "'";

                console.log(this.config, SOQL, this.urlParams);
                libs.remoteAction(this, 'customSoql', {
                    SOQL: SOQL,
                    callback: ((nodeName, data) => {
                        console.log('List of child Ids', data[nodeName]);
                        let relatedRecords = data[nodeName].records[0][this.config.orchestrator.childObjApiName];
                        relatedRecords.length = this.config.orchestrator?.limits?.chunkSize ? this.config.orchestrator?.limits?.chunkSize : 200;
                        libs.remoteAction(this, 'orchestrator', {
                            isDebug: false,
                            operation: this.actionName.replace('.', '_'),
                            orchestratorRequest: {
                                rootRecordId: this.urlParams.recordId,
                                relatedRecordIds: Array.from(relatedRecords, function (entry) { return entry.Id; }),
                                isFirstChunk: true,
                                isLastChunk: true
                            },
                            callback: ((nodeName, data) => {
                                console.log(nodeName, data);
                                this.result = data[nodeName];

                            })
                        })
                    })
                })*/
            })
        });


    }
    @api handleEvent(){
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    parseUrlParams() {
        const url = location.href.replace('?c__', '?').replaceAll('&c__', '&').substring(location.href.indexOf('?'));
        const searchParams = new URLSearchParams(url);
        return Object.fromEntries(searchParams);
    }
}