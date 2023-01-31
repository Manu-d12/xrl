/*
All configuration need to save on custom object or metadata
Need merge admin settings and user settings

Current selected VIEW will be stored to localStorage
*/
global with sharing class getRelListsPicklist extends VisualEditor.DynamicPickList {
	VisualEditor.DesignTimePageContext context;

	global getRelListsPicklist(VisualEditor.DesignTimePageContext context) {
		this.context = context;
		system.debug(LoggingLevel.Error, 'GET RELLIsts ' + context);
	}
	global override VisualEditor.DataRow getDefaultValue() {
		VisualEditor.DataRow defaultValue = new VisualEditor.DataRow('red', 'RED');
		return defaultValue;
	}

	global override VisualEditor.DynamicPickListRows getValues() {
		Map<String,Schema.SObjectType> gd = Schema.getGlobalDescribe();
		VisualEditor.DynamicPickListRows picklistValues = new VisualEditor.DynamicPickListRows();
		if (context.pageType == 'RecordPage') {
			Schema.DescribeSObjectResult describeResult = gd.get(context.entityName).getDescribe();
			List < Schema.ChildRelationship > childRelationships = describeResult.getChildRelationships();

			for (Schema.ChildRelationship thisChild: childRelationships) {
				if (thisChild.getRelationshipName() != null) {
					string sObjApiName = string.valueOf(thisChild.getChildSObject());
					string sObjField = string.valueOf(thisChild.getField());
					string sObjLabel = gd.get(sObjApiName).getDescribe().getLabelPlural();
					picklistValues.addRow(
						new VisualEditor.DataRow(sObjLabel, sObjLabel + '::' + sObjApiName + '::' + sObjField)
					);
					//only if the history object exists
					if(gd.containsKey(sObjApiName + 'History') || gd.containsKey(sObjApiName.removeEnd('c') + 'history')){
						SObjectType objToken = Schema.getGlobalDescribe().get(sObjApiName);
						//for standard history objects
						if(objToken  != null && !objToken.getDescribe().isCustom()){
							picklistValues.addRow(
								new VisualEditor.DataRow(sObjLabel+': History', sObjLabel + 'History::' + sObjApiName + 'History::' + sObjApiName + '.' + sObjField)
							);
						}else if(objToken  != null && objToken.getDescribe().isCustom()){
							//for custom history objects
							picklistValues.addRow(
								new VisualEditor.DataRow(sObjLabel+': History', sObjLabel + 'History::' + sObjApiName.removeEnd('c') + 'history::' + 'Parent.' + sObjField)
							);
						}
					}
				}
			}
		}else{
			for (Schema.SObjectType thisObj: gd.values()) {
				if (thisObj.getDescribe().isQueryable()) {
					picklistValues.addRow(
						new VisualEditor.DataRow(String.valueOf(thisObj), String.valueOf(thisObj) + '::' + String.valueOf(thisObj) + '::')
					);
				}
			}
		}
		return picklistValues;
	}
}