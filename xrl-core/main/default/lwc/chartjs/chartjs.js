import { LightningElement, api, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import { libs } from 'c/libs';
import chartjs from '@salesforce/resourceUrl/chart_js';
import { utils } from './utils';

export default class ChartJS extends LightningElement {

    @api get cfg() {
        return JSON.stringify(this.config);
    }
    set cfg(v) {
        try {
            this.config = this.parseConfig(v);
            if (this.isRendered) this.config.soql ? this.loadData() : this.drawChart();
        } catch (e) {
            console.log('Failed to parse config', e);
        }
    }    

    @api get name() {
        return this._name;
    }
    set name(v) {
        try {
            this._name = v;
            let conf = libs.getGlobalVar(v);
            this.config = this.parseConfig(conf.chartConfig);
            if (this.isRendered) this.config.soql ? this.loadData() : this.drawChart();
        } catch (e) {
            console.log('Failed to parse config', e);
        }
    }

    parseConfig(v) {
        let parseHandlers = (ob) => {
            for (let p in ob) {
                if (typeof ob[p] === 'string' && ob[p].includes('function')) {
                    ob[p] = eval('(' + ob[p] + ')');
                } else if (typeof ob[p] === 'object') {
                    parseHandlers(ob[p]);
                }
            }
        };
        let parsed = typeof v === 'object' ? v : JSON.parse(v);
        parseHandlers(parsed);
        return parsed;
    }

    @track count;
    config;
    _name;
    _chart;
    isRendered;

    connectedCallback() {
        Promise.all([
            loadScript(this, chartjs + '/chart.js'),
            loadStyle(this, chartjs + '/chart.css')
        ]).then(() => {
            if (this.config && (this.config.drawOnInit || this.config.soql) && this.isRendered) this.config.soql ? this.loadData() : this.drawChart();
        });
        window.libs = libs;
        window.utils = utils;
    }

    renderedCallback() {       
        this.isRendered = true;
    }

    loadData() {
        let soql = this.config.soql;
        if(this.config.parentUniqueName && this.config.generateSoql){
            let localStorageVar = JSON.parse(libs.getLocalStorageVar(this.config.parentUniqueName));
            if(this.config.generateSoql && typeof this.config.generateSoql === 'function'){
                soql = this.config.generateSoql(this,libs,localStorageVar[this._name]);
            }
        }
        libs.remoteAction(this, 'customSoql', {
            SOQL: soql,
            sObjApiName: this.config.sObjApiName,
            callback: ((nodeName, data) => {
                let records = data[nodeName].records.length > 0 ? data[nodeName].records : [];
                if (this.config.onDataLoad && typeof this.config.onDataLoad === 'function') {
                    records = this.config.onDataLoad(this, records) || [];
                    if (this._name) {
                        libs.getGlobalVar(this._name).records = records;
                    }
                    this.drawChart();
                }
                this.count = this.config.count;
            })
        });
    }

    drawChart() {
        if(this.config.parentUniqueName){
            let localStorageVar = JSON.parse(libs.getLocalStorageVar(this.config.parentUniqueName));
            if(this.config.changeChartType && typeof this.config.changeChartType === 'function'){
                this.config.chart.type = this.config.changeChartType(this,libs,localStorageVar[this._name]);
            }
        }
        if (this._chart) {
            this._chart.update(this.config.chart);
        } else {
            let ctx = this.template.querySelector('canvas.chart').getContext('2d');
            this._chart = new window.Chart(ctx, this.config.chart);
        }
    }

    @api handleEventMessage(event) {

        let sourceConf = libs.getGlobalVar(event.detail.source)?.actionsBar ? this.config : libs.getGlobalVar(event.detail.source);
        let sourceCause = sourceConf.condition;
        let chartCause = this.config.whereCause ? (typeof this.config.whereCause === 'function' ? this.config.whereCause(this, sourceConf,event) : this.config.whereCause) : '';
        libs.getGlobalVar(this._name).source = event.detail.source;
        if(event.detail.isStoreOnLocalStorage){
            let localStorageVar = JSON.parse(libs.getLocalStorageVar(event.detail.isStoreOnLocalStorage));
            let eventData = JSON.parse(JSON.stringify(event.detail.data));
            if(localStorageVar[this._name] === undefined){
                localStorageVar[this._name] = {};
            }
            localStorageVar[this._name][eventData.action] = eventData.data;
            libs.setLocalStorageVar(event.detail.isStoreOnLocalStorage,JSON.stringify(localStorageVar));
        }

        libs.remoteAction(this, 'query', {
            isNeedDescribe: true,
            sObjApiName: sourceConf.sObjApiName,
            relField: sourceConf.relField === 'Id' ? '' : sourceConf.relField,
            addCondition: sourceCause && chartCause ? sourceCause + ' AND ' + chartCause : sourceCause + chartCause,
            fields: this.config.fields ? Array.from(new Set(sourceConf.fields).add(...this.config.fields)) : sourceConf.fields,
            callback: ((nodeName, data) => {
                let records = data[nodeName].records.length > 0 ? data[nodeName].records : [];
                if (this.config.onDataLoad && typeof this.config.onDataLoad === 'function') {
                    records = this.config.onDataLoad(this, records) || [];
                    if (this._name) {
                        libs.getGlobalVar(this._name).records = records;
                    }
                    this.drawChart();
                }
                this.count = this.config.count;
            })
        });
    }
    
    @api updateChart() {
        this._chart.update(this.config.chart);
    }

    @api resetChart() {
        this._chart.reset();
    }

    @api renderChart() {
        this._chart.render(this.config.chart);
    }

    @api destroyChart() {
        this._chart.destroy();
    }

    @api resizeChart(width, height) {
        if (this._chart) {
            this.config.chart.options.maintainAspectRatio = false;
            this._chart.canvas.parentNode.style.height = height - (this.config.hasView ? 36 : 0) + 'px';
            this._chart.canvas.parentNode.style.width = width + 'px';
        }        
    }

    @api clearChart() {
        this._chart.clear();
    }

    viewData() {
        this.dispatchEvent(new CustomEvent('message', {
            detail: { cmd: 'chart:refresh', value: 'refresh', source: this._name, title: this.config.dataTitle }
        }));
    }
    
}