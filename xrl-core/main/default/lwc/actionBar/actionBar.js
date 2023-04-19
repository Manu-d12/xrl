import { LightningElement,api,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { libs } from 'c/libs';

export default class ActionBar extends LightningElement {
    @api actionscfg;
    @track config = {};
    connectedCallback(){
        this.config.dataTable = libs.getGlobalVar(this.actionscfg._cfgName).listViewConfig[0];
        this.config.actions = [...this.actionscfg.actions];
        let cmpWidth = libs.getGlobalVar(this.actionscfg._cfgName).componentWidth;
        this.config.showActionDropdown = this.visibleActions.length > 2 && (cmpWidth === 'MEDIUM' || cmpWidth === 'SMALL');
    }
    get visibleActions(){
        this.config.visibleActions = this.config.actions.filter((el) => {
            if (this.config.dataTable.rowChecked) {
              // If rowChecked is true, keep all actions with actionIsHidden false
              return el.actionIsHidden === false;
            }
            // If rowChecked is false, remove actions with actionIsHidden true OR actionVisibleOnRecordSelection true
            return !(el.actionIsHidden || el.actionVisibleOnRecordSelection);
          });
        this.config.visibleActions = this.sortRecords(this.config.visibleActions, 'actionOrder', true);
        return this.config.visibleActions;
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
            }else if(actionDetails.actionCallBack != undefined){
                //Callback execution
                let fn = eval('(' + actionDetails.actionCallBack + ')')(this.config.dataTable._selectedRecords(), this, libs);
            }else{
                console.log('No Action Configured');
                const eventErr = new ShowToastEvent({
					title: 'Error',
					message: libs.getGlobalVar(this.actionscfg._cfgName)._LABELS.msg_noCustomActionConfigured,
					variant: 'error'
				});
				this.dispatchEvent(eventErr);
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