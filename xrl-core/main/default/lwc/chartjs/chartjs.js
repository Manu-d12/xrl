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
            if (this.isRendered) this.drawChart();
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
            if (this.isRendered) this.drawChart();
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
            if (this.config && this.config.drawOnInit && this.isRendered) this.drawChart();
        });
        window.libs = libs;
        window.utils = utils;
    }

    renderedCallback() {       
        this.isRendered = true;
    }

    drawChart() {
        if (this._chart) {
            this._chart.update(this.config.chart);
        } else {
            let ctx = this.template.querySelector('canvas.chart').getContext('2d');
            this._chart = new window.Chart(ctx, this.config.chart);
        }
    }

    @api handleEventMessage(event) {

        let sourceConf = libs.getGlobalVar(event.detail.source);
        let sourceCause = sourceConf.condition;
        let chartCause = this.config.whereCause ? (typeof this.config.whereCause === 'function' ? this.config.whereCause(this, sourceConf) : this.config.whereCause) : '';
        utils.source = event.detail.source;

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

    @api resizeChart() {
        this._chart.resize();
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