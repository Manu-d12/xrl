import { LightningElement,api,track } from 'lwc';
import { libs } from 'c/libs';

export default class ActionBar extends LightningElement {
    @api actionscfg;
    @track config = {};
    connectedCallback(){
        this.config.actions = [...this.actionscfg.actions];
        this.config.actions = this.sortRecords(this.config.actions, 'actionOrder', true);
    }
    handleEventClick(event){
        
        let actionId = (event.currentTarget.id).slice(0, -4);
        let actionDetails;
        this.actionscfg.actions.forEach((el)=>{
            if(el.actionId === actionId){
                actionDetails = el;
            }
        });
        if(actionDetails.actionFlowName){
            console.log("clicked");
            this.actionscfg._handleEventFlow({name:actionDetails.actionFlowName,label:actionDetails.actionLabel});
        }else if(actionDetails.isActionStandard){
            this.actionscfg._handleEvent(event);
        }else{
            console.log("clicked");
            let fn = eval('(' + actionDetails.callback + ')');
            fn(event);
        }
    }
    sortRecords(records, fieldName, isASCSort, referenceField) {
		let keyValue;
		if(referenceField){
			keyValue = (a) => {
				return a[referenceField][fieldName];
			};
		}else{
			keyValue = (a) => {
				return a[fieldName];
			};
		}

		let isReverse = isASCSort ? 1 : -1;

		records.sort((x, y) => {
			x = keyValue(x) ? keyValue(x) : ''; // handling null values
			y = keyValue(y) ? keyValue(y) : '';
            x = parseInt(x);
            y = parseInt(y);
			return isReverse * ((x > y) - (y > x));
		});
		
		return records;
	}
}