/*
All configuration need to save on custom object or metadata
Need merge admin settings and user settings

Current selected VIEW will be stored to localStorage
*/
global with sharing class getRelListsPicklist extends VisualEditor.DynamicPickList {

	VisualEditor.DesignTimePageContext context;
    static VisualEditor.DynamicPickListRows picklistValues;

	global getRelListsPicklist(VisualEditor.DesignTimePageContext context) {
		this.context = context;
		system.debug(LoggingLevel.Error, 'GET RELLIsts ' + context);
	}
	global override VisualEditor.DataRow getDefaultValue() {
		VisualEditor.DataRow defaultValue = new VisualEditor.DataRow('', 'Please select sObject');
        system.debug(LoggingLevel.Error, 'GET RELLIsts getDefaultValue ' + this.context);
		return defaultValue;
	}

	global override VisualEditor.DynamicPickListRows getValues() {
        return picklistValues != null ? picklistValues : generateList();
	}

	private VisualEditor.DynamicPickListRows generateList(){
		system.debug(LoggingLevel.Error, 'GET RELLIsts getValues ' + this.context);
		Map<String,Schema.SObjectType> gd = Schema.getGlobalDescribe();
		picklistValues = new VisualEditor.DynamicPickListRows();
		picklistValues.addRow(
        	new VisualEditor.DataRow('[External Data Source]', '::_external_::')
        );
		if (context.pageType == 'RecordPage') {
			Schema.DescribeSObjectResult describeResult = gd.get(context.entityName).getDescribe();
			List < Schema.ChildRelationship > childRelationships = describeResult.getChildRelationships();
			
			for (Schema.ChildRelationship thisChild: childRelationships) {
				if (thisChild.getRelationshipName() != null) {
					string sObjApiName = string.valueOf(thisChild.getChildSObject());
					string sObjField = string.valueOf(thisChild.getField());
					string sObjLabel = gd.get(sObjApiName).getDescribe().getLabelPlural();
					picklistValues.addRow(
						new VisualEditor.DataRow(sObjLabel + ' ('+ sObjField +')', sObjLabel + '::' + sObjApiName + '::' + sObjField)
					);
					//only if the history object exists
					if(gd.containsKey(sObjApiName + 'History') || gd.containsKey(sObjApiName.removeEnd('c') + 'history')){
						SObjectType objToken = gd.get(sObjApiName);
						//for standard history objects
						boolean isCustom = objToken.getDescribe().isCustom(); 
						if(objToken  != null && !isCustom){
							picklistValues.addRow(
								new VisualEditor.DataRow(sObjLabel+': History (' + sObjField +')', sObjLabel + ' History::' + sObjApiName + 'History::' + sObjApiName + '.' + sObjField)
							);
							//Example apiName- Account History::AccountHistory::AccountHistory.AccountId
						}else if(objToken  != null && isCustom){
							//for custom history objects
							picklistValues.addRow(
								new VisualEditor.DataRow(sObjLabel+': History', sObjLabel + ' History::' + sObjApiName.removeEnd('c') + 'history::' + 'Parent.' + sObjField)
							);
						}
					}
				}
			}
  		}
        
        for (Schema.SObjectType thisObj: gd.values()) {
            if (thisObj.getDescribe().isQueryable()) {
                string sObjLabel = ((context.pageType == 'RecordPage') ? '>' : '') + thisObj.getDescribe().getLabelPlural();
                string namespace = String.valueOf(thisObj).replace('^(.*?)__.*$','$1');
                sObjLabel += namespace!='' &&  namespace.endsWith('__') ? '(' + namespace + ')' : '';
                picklistValues.addRow(
                    new VisualEditor.DataRow(sObjLabel, String.valueOf(thisObj.getDescribe().getLabelPlural()) + '::' + String.valueOf(thisObj) + '::')
                );
            }
        }
		return pickListValues;
	}
}