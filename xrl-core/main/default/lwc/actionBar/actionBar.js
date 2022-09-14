import { LightningElement,api } from 'lwc';

export default class ActionBar extends LightningElement {
    @api actionscfg;
    connectedCallback(){
        console.log(JSON.parse(JSON.stringify(this.actionscfg)));
    }
    handleEventClick(event){
        let actionId = (event.currentTarget.id).slice(0, -4);
        let actionDetails;
        this.actionscfg.forEach((el)=>{
            if(el.id === actionId){
                actionDetails = el;
            }
        });
        actionDetails.callback();
    }
}