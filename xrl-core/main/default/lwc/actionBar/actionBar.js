import { LightningElement,api,track } from 'lwc';
import { libs } from 'c/libs';

export default class ActionBar extends LightningElement {
    @api actionscfg;
    @track config = {};
    connectedCallback(){
        this.config.dataTable = libs.getGlobalVar(this.actionscfg._cfgName).listViewConfig[0];
        this.config.actions = [...this.actionscfg.actions];
        this.config.actions = this.sortRecords(this.config.actions, 'actionOrder', true);
    }
    handleEventClick(event){
        
        let actionId = event.target.getAttribute('data-id');
        let actionDetails;
        this.actionscfg.actions.forEach((el)=>{
            if(el.actionId === actionId){
                actionDetails = el;
            }
        });
        if(actionDetails !== undefined){
            if(actionDetails.actionFlowName){
                console.log("Flow Execution");
                this.actionscfg._handleEventFlow({name:actionDetails.actionFlowName,label:actionDetails.actionLabel});
            }else if(actionDetails.isActionStandard){
                console.log('Standard Event');
                this.actionscfg._handleEvent(event);
            }else{
                //Callback execution
                let fn = eval('(' + actionDetails.actionCallBack + ')')(this.config.dataTable._selectedRecords());
                libs.getGlobalVar(this.actionscfg._cfgName).records = libs.getGlobalVar(this.actionscfg._cfgName).records.forEach((el)=>{
                    let r = fn.find((e)=> { return e.Id === el.Id});
                    if(r != undefined){
                        el = r;
                    }
                });
                this.config.dataTable._updateView();
                // fn(event);
            }
        }else{
            console.log('Action Error');
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