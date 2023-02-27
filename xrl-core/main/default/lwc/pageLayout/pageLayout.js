import { LightningElement, api, track } from 'lwc';
import apexInterface from '@salesforce/apex/infrastructure.dispatcherAura';

export default class PageLayout extends LightningElement {

    @api configName;
    @api recordId;

    @track config;
    @track charts = [];
    @track tables = [];
    @track show = false;

    connectedCallback() {
        this.getConfig();
    }

    getConfig() {
        apexInterface({ cmd: 'query', data: {
            relField: '',
            fields: ['JSON__c'],
            sObjApiName: 'extRelListConfig__c',
            addCondition: `WHERE uniqKey__c = '${this.configName}' AND Is_Active__c = TRUE AND RecordType.Name = 'Config' AND ConfigType__c = 'Layout'`
        } }).then(result => {
            if ('exception' in result) {
                console.error(result.exception, result.log);
            } else {
                this.parseConfig(result.queryResult.records[0]['JSON__c']);
            }
        })
    }

    parseConfig(conf) {
        this.config = JSON.parse(conf);
        for (let row of this.config.rows) {
            for (let col of row.cols) {
                if (col.isChart) {
                    col.config = JSON.stringify(col.config);
                    this.charts.push(col);
                } else if (col.isTable) {
                    this.tables.push(col);
                }
            }
        }
        this.show = true;
    }

    renderedCallback() {
        if (!this.config) return;

        let cmpMap = new Map();
        let section = this.template.querySelectorAll('.section')[0];
        for (let ch of section.childNodes) {
            cmpMap.set(ch.dataset.id, section.removeChild(ch));
        }
        for (let row of this.config.rows) {
            let rowDiv = document.createElement('div');
            rowDiv.style = row.style;
            section.appendChild(rowDiv);
            for (let col of row.cols) {
                rowDiv.appendChild(cmpMap.get(col.id));
            }
        }
        this.template.querySelectorAll('.cmp').forEach(cmp => cmp.classList.remove('hidden'));
    }
}