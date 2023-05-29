import { LightningElement, api } from 'lwc';

export default class Dialog extends LightningElement {

    @api cfg;

    @api setLoading(v) {
        this.isLoading = v;
    }

    title;
    buttons;
    contents;
    isLoading = true;

    connectedCallback() {
        this.title = this.cfg.title;
        this.contents = this.cfg.contents || [];
        this.buttons = this.cfg.buttons || [];
        this.headerStyle = this.cfg.headerStyle || 'slds-modal__header';
        this.isLoading = false;
    }

    handleClick(e) {
        let inputs = this.template.querySelectorAll('.inputs');
        let inputValues = {};
        inputs.forEach(e => {
            inputValues[e.dataset.id] = e.value;
        });
        console.log(inputValues);
        this.dispatchEvent(new CustomEvent('action', { detail: { action: e.target.dataset.id, data: inputValues } }));
    }    
}