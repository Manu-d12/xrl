import { LightningElement, api, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import { libs } from 'c/libs';
import chartjs from '@salesforce/resourceUrl/chart_js';
import { utils } from './utils';

export default class ChartJS extends LightningElement {

    @api get cfg() {
        return JSON.stringify(this._config);
    }
    set cfg(v) {
        try {
            this._config = this.parseConfig(v);
            if (this._isRendered) this.drawChart();
        } catch (e) {
            console.log('Failed to parse config', e);
        }
    }    

    @api get name() {
        return this.name;
    }
    set name(v) {
        try {
            let conf = libs.getGlobalVar(v);
            this._config = this.parseConfig(conf.chartConfig);
            if (this._isRendered) this.drawChart();
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
    _chart;
    _config;
    _isRendered;
    _state;

    renderedCallback() {
        Promise.all([
            loadScript(this, chartjs + '/chart.js'),
            loadStyle(this, chartjs + '/chart.css')
        ]).then(() => {
            console.log('script loaded');
            if (this._config) this.drawChart();
        });
        this._isRendered = true;
        window.utils = utils;
    }

    drawChart() {
        if (this._chart) {
            this._chart.update(this._config.chart);
        } else {
            let ctx = this.template.querySelector('canvas.chart').getContext('2d');
            this._chart = new window.Chart(ctx, this._config.chart);
        }
    }

    @api handleEventMessage(event) {
        let data = libs.getGlobalVar(event.detail.source).records || [];
        if (this._config.onDataLoad && typeof this._config.onDataLoad === 'function') {
            this._config.onDataLoad(this._config, data);
            this.updateChart();
        }
        let state = libs.getGlobalVar(event.detail.source).state;
        utils.state[event.detail.source] = state;
        this.count = this._config.count;
    }
    
    @api updateChart() {
        this._chart.update(this._config.chart);
    }

    @api resetChart() {
        this._chart.reset();
    }

    @api renderChart() {
        this._chart.render(this._config.chart);
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
    
}