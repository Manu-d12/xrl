global with sharing class getRelTemplates extends VisualEditor.DynamicPickList{
    VisualEditor.DesignTimePageContext context;

    global getRelTemplates(VisualEditor.DesignTimePageContext context) {
        this.context = context;
		system.debug(LoggingLevel.Error, 'GET RELLIsts Templates ' + context);
    }

    global override VisualEditor.DataRow getDefaultValue() {
		VisualEditor.DataRow defaultValue = new VisualEditor.DataRow('red', 'RED');
		return defaultValue;
	}

    global override VisualEditor.DynamicPickListRows getValues() {
		List<extRelListConfig__c> allTemplates = [
			SELECT Id,name, RecordType.Id
	        FROM extRelListConfig__c 
			WHERE RecordType.Name = 'Template'
		];

		picklistValues.addRow(
                new VisualEditor.DataRow('None', 'None')
            );

		VisualEditor.DynamicPickListRows picklistValues = new VisualEditor.DynamicPickListRows();
		picklistValues.addRow(
                new VisualEditor.DataRow('None', null)
            );
		for (extRelListConfig__c template: allTemplates) {
			picklistValues.addRow(
                new VisualEditor.DataRow(template.Name, (string)template.Id)
            );
		}
		return picklistValues;
	}
}