import { LightningElement, api } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import chartjs from '@salesforce/resourceUrl/chart_js';
import { utils } from './utils'

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
        let parsed = JSON.parse(v);
        parseHandlers(parsed);
        return parsed;
    }

    _chart;
    _config;
    _isRendered;

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