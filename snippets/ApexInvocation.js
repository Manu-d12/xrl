//Apex invocation XRL version 3.0

{
    "actionCallBack": function(scope, libs, selectedRecords) {
         libs.remoteAction(scope, 'invokeApex', {
            helperType: 'HLP_SAP.intergration',
            data: {
                records: selectedRecords
            },
            callback: (cmd, data) => {

                if (data[cmd].success == false) {
                    libs.showToast(scope, {
                        title: 'ERROR',
                        message: data[cmd].errorMessage,
                        variant: 'error'
                    });
                } else {
	                libs.showToast(scope, {
                        title: 'Success',
                        message: 'Request to Sync Master Items was successfully submitted.',
                        variant: 'success'
                    });
    	            console.log(scope, libs, selectedRecords);
        	        console.log(cmd, data);
        	       /* refresh grid action */
                         scope.handleEventClick({target:{getAttribute : function(){return "std:refresh"}}})
               }
            }
        });
    }
}

// Apex example
global with sharing class HLP_SAP {
    
    global class intergration extends XRL.infrastructure.handler {
        public StrataVar__Cust_BoM_Item__c[] records;		
        public override object execute(map < string, object > data) {
            System.debug('data ' + data);

            
            
            List<StrataVAR__Cust_BoM_Item__c> quoteItemsList = (List<StrataVar__Cust_BoM_Item__c>) JSON.deserialize(JSON.serialize(((map<object, object>) data.get('data')).get('records')), List<StrataVar__Cust_BoM_Item__c>.class);
            System.debug('quoteItemsList ' + quoteItemsList);
            
            return JSON.serialize(records);
        }
    }
    

}


