import { LightningElement,api,track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { libs } from 'c/libs';
import { FlowNavigationFinishEvent } from 'lightning/flowSupport'

export default class ActionBar extends LightningElement {
    @api actionscfg;
    @track config = {};
    connectedCallback(){
        this.config.dataTable = libs.getGlobalVar(this.actionscfg._cfgName)?.listViewConfig ? libs.getGlobalVar(this.actionscfg._cfgName)?.listViewConfig[0] : []; //Need to check how we can send dataTable or Chart config
        this.config.actions = [...this.actionscfg.actions];
        let cmpWidth = libs.getGlobalVar(this.actionscfg._cfgName).componentWidth;
        this.config.showActionDropdown = this.visibleActions.length > 2 && (cmpWidth === 'MEDIUM' || cmpWidth === 'SMALL');
		this._flowSupport =  FlowNavigationFinishEvent;
        console.log('refreshed action bar');
    }
    @api 
    refreshActionbar(){
        this.connectedCallback();
    }
    get visibleActions(){
        /*
            3 things needs to be checked before showing an action to the grid
            1. Check if the action is visible by actionIsHidden flag
            2. Check if the action is visible by actionShowHideCallback function, if defined
            3. Check if the action is visible by actionVisibleOnRecordSelection, if it is enabled then we can show the action only if there is a record selection
        */
        this.config.visibleActions = this.config.actions.filter((el) => {
            try{
                let _advanced = eval('['+el?.advanced + ']')[0];
                let isActionVisibleByShowHideCallback = true;
                if (_advanced?.actionShowHideCallback !== undefined && _advanced?.actionShowHideCallback !== ''){
                    let records = libs.getGlobalVar(this.actionscfg._cfgName)?.records;
					if (typeof _advanced?.actionShowHideCallback == 'string') _advanced.actionShowHideCallback = eval('(' + _advanced?.actionShowHideCallback + ')');
                    isActionVisibleByShowHideCallback = _advanced.actionShowHideCallback(this,libs,records);
                    return isActionVisibleByShowHideCallback;
                }
                if (el.actionId === 'std:save' || el.actionId === 'std:discardChanges') {
                    return false;
                }
            }catch(e){
                console.error(e);
            }
            return el.actionIsHidden === undefined || el.actionIsHidden === false;           
        });
        if(this.config.dataTable?.rowChecked === undefined || this.config.dataTable?.rowChecked === false){
            this.config.visibleActions = this.config.visibleActions.filter((el) => {
                return el.actionVisibleOnRecordSelection === undefined ||el.actionVisibleOnRecordSelection === false;           
            });
        }
        //showing std:save action if only some records have been changed.
        if(this.config.dataTable?._changedRecords){
            let saveDiscardActions = this.config.actions.filter((el) => { return el.actionId === 'std:save' || el.actionId === 'std:discardChanges' });
            if(saveDiscardActions){
                this.config.visibleActions = this.config.visibleActions.concat(saveDiscardActions);
            }
        }
        //Sorts the actions, so that it will appear in the order in the UI
        this.config.visibleActions = libs.sortRecords(JSON.parse(JSON.stringify(this.config.visibleActions)), 'actionOrder', true);
        return this.config.visibleActions;
    }
    async handleEventClick(event){
        
        let actionId = event.target.getAttribute('data-id');
        let actionDetails;
        this.actionscfg.actions.forEach((el)=>{
            if(el.actionId === actionId){
                actionDetails = Object.assign({}, el);
            }
        });

        if(actionDetails !== undefined){
            try{
	            actionDetails._advanced = eval('['+actionDetails?.advanced + ']')[0];
            }catch(e){
                console.error('Error', e);
            }
            if(actionDetails.actionFlowName) {
                console.log("Flow Execution");
                this.actionscfg._handleEventFlow({name:actionDetails.actionFlowName,label:actionDetails.actionLabel});
            } else if (actionDetails.isActionStandard){
                console.log('Standard Event');
                this.actionscfg._handleEvent(event, this.actionscfg);
            } else if (actionDetails.isActionCustom){
                console.log('Custom Event');
                this.actionscfg._handleEvent(event, this.actionscfg);
            } else if (actionDetails._advanced?.actionCallBack !== undefined && actionDetails._advanced?.actionCallBack !== ''){
                //Callback execution
                try{
					let selectedRecords = this.config.dataTable?._selectedRecords();
					let records = libs.getGlobalVar(this.actionscfg._cfgName)?.records;
                    let fn = await actionDetails._advanced.actionCallBack(this, libs, selectedRecords.length > 0 ? selectedRecords : records); 
                    console.log('after callback');
					this.config.dataTable?._updateView();
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
}