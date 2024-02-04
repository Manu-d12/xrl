import { LightningElement,api,track } from 'lwc';

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
            title: 'Account created',
            message: 'Record ID: ' + event.detail.id,
            variant: 'success',
        });
        this.dispatchEvent(evt);
    }
}