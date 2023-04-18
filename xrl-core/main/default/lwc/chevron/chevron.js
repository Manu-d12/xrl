import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';

export default class Chevron extends LightningElement {
    @api name;

    @track config;
    selected;
    isLoading = true;

    connectedCallback() {
        let conf = libs.getGlobalVar(this.name);
        this.config = this.parseConfig(conf.pathConfig);
        this.selected = this.config.selected || 0;
        this.setSteps();
    }

    setSteps() {
        for (let i = 0; i < this.config.steps.length; i++) {
            this.config.steps[i].value = i;
            this.config.steps[i].class = 'slds-path__item' + (this.config.steps[i].disabled ? ' disabled' : '') +
                (i < this.selected ? ' slds-is-complete' : (i === this.selected ? ' slds-is-current slds-is-active' : ' slds-is-incomplete'));
        }
        this.isLoading = false;
    }

    handleClick(e) {
        let newStep = Number(e.currentTarget.dataset.id);
        if (this.config.steps[newStep].disabled) return;
        this.selected = newStep;
        if (this.config.steps[newStep].callback && typeof this.config.steps[newStep].callback === 'function') {
            this.config.steps[newStep].callback(this, libs);
        }
        this.setSteps();
        this.dispatchEvent(new CustomEvent('message', { detail: { cmd: 'path:change', source: this.name } }));
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
}