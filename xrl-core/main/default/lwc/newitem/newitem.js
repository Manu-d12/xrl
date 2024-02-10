import { LightningElement,api,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Newitem extends LightningElement {
    @api objectapiname;
    @api header;
    @track isShowModal = false;
    connectedCallback(){
        if(this.objectapiname === undefined || this.objectapiname === null) { 
            console.log('Please provide object api name');
            return;
        }
        this.isShowModal = true;
    }
    close(event){
        this.isShowModal = false;
    }
    handleSuccess(event){
        const evt = new ShowToastEvent({
            title: 'Successfully created',
            message: 'Record ID: ' + event.detail.id + ' (' + JSON.parse(JSON.stringify(event.detail)).fields.Name.value + ')',
            variant: 'success',
        });
        console.log('event:',event.detail);
        this.dispatchEvent(evt);
        this.isShowModal = false;
        this.dispatchEvent(new CustomEvent('newoption', {
            detail: {
                'data' : {
                    label: JSON.parse(JSON.stringify(event.detail)).fields.Name.value,
                    value: event.detail.id
                }
            }
        }));
    }
    handleError(event){
        console.log('error:',event.detail);
    }
}