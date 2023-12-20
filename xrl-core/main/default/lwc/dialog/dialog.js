import { LightningElement, api, track } from 'lwc';
// import { devLib } from 'c/devLib';
import { libs } from 'c/libs';

export default class dialog extends LightningElement {

    _cfg;
    @track config = {};

    @api 
    get cfg() {
        return this._cfg;
    }
    set cfg(v) {
        this._cfg = v;
        this.setDialog();
    }

    @api setLoading(v) {
        this.isLoading = v;
    }

    async setDialog() {
        Object.assign(this.config, this._cfg);
        this.title = this._cfg?.title;
        this.config.modalCss = this._cfg?.headerStyle;
        if (this._cfg?.contents) this.config.content = JSON.parse(JSON.stringify(this._cfg?.contents))[0];
        else if (this._cfg?.fields) this.config.fields = this._cfg?.fields;
        this.config.buttons = this._cfg?.buttons || [];
        this.values = {};

        if (this.config.callback.startsWith('function(')) {
            this.config.callback = eval('[' + this.config.callback + ']')[0];
        }

        this.config.result = {};
        // if (this._cfg) await this.setInputFields();
        this.isLoading = this._cfg ? true : false;
    }

    connectedCallback() {
        // libs.registerLWC(this);
        // let configs = {};
        // if ( this.cfg.type in configs) this.config = configs[this.cfg.type];
        // Object.assign(this.config, this.cfg);
        // this.config.modalCss = 'slds-modal__header slds-theme_{1} slds-theme_alert-texture'.replace('{1}', this.config.variant);
        // this.config.content = libs.evalFunction(this, this.config.contentTemplate);
        // this.config.result = {};
        
    }  
    
    @api
    handleEvents(event) {
        //event.preventDefault();
        let cmd = event.value ? event.value : event.srcElement?.getAttribute('data-cmd');
        
        if (event.detail.cmd == ':updateFromChild') {
            console.log('event from child', event.detail.data);
            // let node = this.config.result;
            // if (event.detail.parent!=undefined && !this.config.result[event.detail.parent]) {
            //     node[event.detail.parent] = {};
            // }
            // if (event.detail.parent!=undefined) node = node[event.detail.parent];
            // node[event.detail.name] = event.detail.value;
            // this.config.buttons.forEach(btn => {
            //     btn.isDisabled = libs.evalFunction(this, btn.isDisabledTemplate);
            // });
            this.config.result[event.detail.data.name] = event.detail.data?.value;
            return;
        }
        if (cmd?.startsWith('btn') || cmd === 'cancel') {
            // Need to send event to parent only in case of button click
            let closeDialog = new CustomEvent('action', { detail: { action: cmd, data: this.config.result } });
            let btn = this.config.buttons?.find(el=> {return el.name == cmd});
            if (btn && this.config.callback && typeof this.config.callback === 'function') {
                
                let result = this.config.callback(this, libs, { action: cmd, data: this.config.result, closeDialog : closeDialog });
                console.log('RESULT', result);
            } else {
                // we need to close a dialog
                this.dispatchEvent(closeDialog);
            }
            
            // this.config.parent.handleEvents({detail : {cmd : this.cfg.type + 'Result.' + cmd, detail : this.config.result}}); 
            
        }
    }

}