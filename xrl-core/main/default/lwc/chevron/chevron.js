import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';

export default class Chevron extends LightningElement {
    @api name;

    @track config;
    selected;
    isLoading = true;

    connectedCallback() {
        let conf = libs.getGlobalVar(this.name);
        this.config = this.parseConfig(conf.chevronConfig);
        this.selected = this.config.selected || 0;      
        let chevronStep = libs.getGlobalVar('chevronStep');
        if (chevronStep && chevronStep[this.name]) {
            this.selected = chevronStep[this.name];
        } else {
            chevronStep = chevronStep || {};
            chevronStep[this.name] = this.selected;
            libs.setGlobalVar('chevronStep', chevronStep);
        }
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
        libs.getGlobalVar('chevronStep')[this.name] = newStep;
        if (this.config.steps[newStep].callback && typeof this.config.steps[newStep].callback === 'function') {
            this.config.steps[newStep].callback(this, libs);
        }
        this.setSteps();
        this.dispatchEvent(new CustomEvent('message', { detail: { cmd: 'chevron:change', source: this.name, cfg: this.config.steps[newStep].cfg } }));
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