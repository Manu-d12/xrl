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
		Schema.DescribeSObjectResult describeResult = gd.get(context.entityName).getDescribe();
		List < Schema.ChildRelationship > childRelationships = describeResult.getChildRelationships();

		VisualEditor.DynamicPickListRows picklistValues = new VisualEditor.DynamicPickListRows();
		for (Schema.ChildRelationship thisChild: childRelationships) {
			if (thisChild.getRelationshipName() != null) {
				string sObjApiName = string.valueOf(thisChild.getChildSObject());
				string sObjField = string.valueOf(thisChild.getField());
				string sObjLabel = gd.get(sObjApiName).getDescribe().getLabelPlural();
				picklistValues.addRow(
					new VisualEditor.DataRow(sObjLabel, sObjLabel + '::' + sObjApiName + '::' + sObjField)
				);
			}
		}
		return picklistValues;
	}
}