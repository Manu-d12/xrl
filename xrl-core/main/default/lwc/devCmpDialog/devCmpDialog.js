import { LightningElement, api, track } from 'lwc';
// import { devLib } from 'c/devLib';
import { libs } from 'c/libs';

export default class devCmpDialog extends LightningElement {

    @api cfg;
    @track config;

    connectedCallback() {
        // libs.registerLWC(this);
        let configs = {};
        if ( this.cfg.type in configs) this.config = configs[this.cfg.type];
        Object.assign(this.config, this.cfg);
        this.config.modalCss = 'slds-modal__header slds-theme_{1} slds-theme_alert-texture'.replace('{1}', this.config.variant);
        this.config.content = libs.evalFunction(this, this.config.contentTemplate);
        this.config.result = {};
        
    }  
    renderedCallback(){
        //Need to activate a keyhandler;
        //const closeIcon = this.template.querySelector('lightning-button-icon');
        //closeIcon.focus();
    } 

    @api
    handleEvents(event) {
        //event.preventDefault();
        let cmd = event.value ? event.value : event.srcElement?.getAttribute('data-cmd');
        if (event.type == 'keydown' && event.code=='Escape') cmd = ':close';
        
        if (event.cmd == ':updateFromChild') {
            //console.log('event from child', event.detail);
            let node = this.config.result;
            if (event.detail.parent!=undefined && !this.config.result[event.detail.parent]) {
                node[event.detail.parent] = {};
            }
            if (event.detail.parent!=undefined) node = node[event.detail.parent];
            node[event.detail.name] = event.detail.value;
            this.config.buttons.forEach(btn => {
                btn.isDisabled = libs.evalFunction(this, btn.isDisabledTemplate);
            });
            return;
        }
        if (cmd?.startsWith('btn') || cmd == ':close') {
            // Need to send event to parent only in case of button click
            let btn = this.config.buttons?.find(el=> {return el.cmd == cmd});
            if (btn && libs.isFunction(btn.onsubmitTemplate)) {
                let result = libs.evalFunction(this, btn.onsubmitTemplate);
                console.log('RESULT', result);
            }
            
            this.config.parent.handleEvents({detail : {cmd : this.cfg.type + 'Result.' + cmd, detail : this.config.result}}); 
        }
    }

}