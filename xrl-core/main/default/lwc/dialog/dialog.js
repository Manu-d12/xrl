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

    setDialog() {
        Object.assign(this.config, this._cfg);
        this.title = this._cfg?.title;
        this.config.modalCss = this._cfg?.headerStyle ? ("slds-modal__header slds-theme_" + this._cfg.headerStyle) : "slds-modal__header slds-theme_error";
        if (this._cfg?.contents) this.config.content = JSON.parse(JSON.stringify(this._cfg?.contents))[0];
        else if (this._cfg?.fields) this.config.fields = this._cfg?.fields;
        this.config.buttons = JSON.parse(JSON.stringify(this._cfg?.buttons)) || [];
        this.config.result = {};
        if (this.config.callback?.startsWith('function(')) {
            this.config.callback = eval('[' + this.config.callback + ']')[0];
        }
        this.config.buttons?.forEach(btn => {
            if (btn.disableCallback && btn.disableCallback.startsWith('function(')) {
                btn.disableCallback = eval('[' + btn.disableCallback + ']')[0];
            }
        });

        
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
    async handleEvents(event) {
        let cmd = event.value ? event.value : event.srcElement?.getAttribute('data-cmd');
        
        if (event.detail.cmd == ':updateFromChild') {
            console.log('event from child', event.detail.data);
            if(event.detail.data?.value !== undefined){
                this.config.result[event.detail.data.name] = event.detail.data;
            }else{
                if(this.config.result[event.detail.data.name]){
                    delete this.config.result[event.detail.data.name];
                }
            }
            // Need also rerender buttons
            this.config.buttons.forEach(btn => {
                if (btn.disableCallback && typeof btn.disableCallback === 'function') {
                    btn.isDisabled = btn.disableCallback(this, libs, this.config.result);
                }
            });
            return;
        }
        let closeDialog = new CustomEvent('action', { detail: { action: cmd, data: this.config.result } });

        if (cmd?.startsWith('btn')) {
            let btn = this.config.buttons?.find(el=> {return el.name == cmd});
            if(btn && btn.UI){
                this.config.UI = btn.UI;
                this.config.showConfirmation = true;
                return;
            }
            if (btn && btn.callback) {
                if(btn?.isExecuteCallbackOnQuickAction){
                    this.dispatchEvent(new CustomEvent('action', { 
                        detail: { 
                            action: ':executeCallbackOnQuickAction', 
                            btn: btn,
                            data: { action: cmd, data: this.config.result, closeDialog : closeDialog } 
                        } 
                    }));
                    return;
                }
                btn.callback = eval('[' + btn.callback + ']')[0];
                let result = await btn.callback(this, libs, { action: cmd, data: this.config.result, closeDialog : closeDialog });
                console.log('RESULT', result);
            } else {
                // we need to close a dialog
                this.dispatchEvent(closeDialog);
            }
        }
        if(cmd === null){
            cmd = event.detail.action;
        }
        if (cmd === 'cancel') {
            if(this.config.showConfirmation) this.config.showConfirmation = false;
            else this.dispatchEvent(closeDialog);
        }
    }
    passToParent(){
        this.config.showConfirmation = false;
        this.dispatchEvent(new CustomEvent('childaction', { detail: { cmd: ':updateFromChildDialog', data: [] } }));
    }

    @api disableButtons(newTitle, spinner) {

        this.config.buttons?.forEach(btn => {
            btn.isDisabled = btn.name!= 'cancel';
        });

        this.config.title = newTitle && spinner == true ? newTitle : this._cfg.title;
        this.config.isSpinner = spinner;

    }

}