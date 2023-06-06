import { LightningElement,api,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { libs } from 'c/libs';

export default class ActionBar extends LightningElement {
    @api actionscfg;
    @track config = {};
    connectedCallback(){
        this.config.dataTable = libs.getGlobalVar(this.actionscfg._cfgName)?.listViewConfig[0];
        this.config.actions = [...this.actionscfg.actions];
        let cmpWidth = libs.getGlobalVar(this.actionscfg._cfgName).componentWidth;
        this.config.showActionDropdown = this.visibleActions.length > 2 && (cmpWidth === 'MEDIUM' || cmpWidth === 'SMALL');
    }
    get visibleActions(){
        this.config.visibleActions = this.config.actions.filter((el) => {
            return el.actionIsHidden === undefined || el.actionIsHidden === false;           
        });
        if(this.config.dataTable?.rowChecked === undefined || this.config.dataTable?.rowChecked === false){
            this.config.visibleActions = this.config.visibleActions.filter((el) => {
                return el.actionVisibleOnRecordSelection === undefined ||el.actionVisibleOnRecordSelection === false;           
            });
        }
        console.log('visible actions',this.config.visibleActions.length);
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
            if(actionDetails.actionFlowName) {
                console.log("Flow Execution");
                this.actionscfg._handleEventFlow({name:actionDetails.actionFlowName,label:actionDetails.actionLabel});
            } else if (actionDetails.isActionStandard){
                console.log('Standard Event');
                this.actionscfg._handleEvent(event, this.actionscfg);
            } else if (actionDetails.isActionCustom){
                console.log('Custom Event');
                this.actionscfg._handleEvent(event, this.actionscfg);
            } else if (actionDetails.actionCallBack != undefined){
                //Callback execution
                try{
                    let fn = eval('(' + actionDetails.actionCallBack + ')')(this.config.dataTable?._selectedRecords(), this, libs);               
                }catch(err){
                    console.log('EXCEPTION', err);
                }
                if(actionDetails.refreshAfterCustomActionExecution){
                    event.target.setAttribute("data-id", "std:refresh");
                    this.actionscfg._handleEvent(event);
                }
            } else {
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