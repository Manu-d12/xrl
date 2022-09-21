import { LightningElement,api } from 'lwc';

export default class ActionBar extends LightningElement {
    @api actionscfg;
    handleEventClick(event){
        
        let actionId = (event.currentTarget.id).slice(0, -4);
        let actionDetails;
        this.actionscfg.actions.forEach((el)=>{
            if(el.actionId === actionId){
                actionDetails = el;
            }
        });
        if(actionDetails.isCallBackEnabled){
            console.log("clicked");
            let fn = eval('(' + actionDetails.callback + ')');
            fn(event);
        }else{
            this.actionscfg._handleEvent(event);
        }
    }
}