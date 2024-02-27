import { LightningElement,api,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { libs } from 'c/libs';

export default class Newitem extends LightningElement {
    @api objectapiname;
    @api header;
    @api newitemcreation;
    @track isShowModal = false;
    @api cfg;
    @track config = {};
    connectedCallback(){
        if(this.objectapiname === undefined || this.objectapiname === null) { 
            console.log('Please provide object api name');
            return;
        }
        this.isShowModal = true;
        this.config.fields = [];
        if(this.newitemcreation?.fields){
            for (const [key, value] of Object.entries(this.newitemcreation?.fields)) {
                this.config.fields.push({fieldName: key, required:value.required, disabled:value.disabled, value: libs.replaceLiteralsInStr(value.value,this.cfg)});
            }
        }else{
            this.config.fields = false;
        }
    }
    handleClose(event){
        this.dispatchEvent(new CustomEvent('cancel', {
            detail: {
                action: 'cancel'
            }
        }));
    }
    async handleSuccess(event){
        const evt = new ShowToastEvent({
            title: 'Successfully created',
            message: 'Record ID: ' + event.detail.id + ' (' + JSON.parse(JSON.stringify(event.detail)).fields?.Name?.value + ')',
            variant: 'success',
        });
        console.log('event:',event.detail);
        this.dispatchEvent(evt);
        let dataForEvent = {
            label: JSON.parse(JSON.stringify(event.detail)).fields?.Name?.value,
            value: event.detail.id
        };
        if(this.newitemcreation?.callback){
            try{
                let callback = eval('[' + this.newitemcreation?.callback + ']')[0];
                dataForEvent = await callback(this,libs,JSON.parse(JSON.stringify(event.detail)),JSON.parse(JSON.stringify(this.newitemcreation)));
            }catch(e){
                console.log('error',e);
            }
        }
        this.dispatchEvent(new CustomEvent('newoption', {
            detail: {
                'data' : dataForEvent
            }
        }));
    }
    handleError(event){
        console.log('error:',event.detail);
    }
}