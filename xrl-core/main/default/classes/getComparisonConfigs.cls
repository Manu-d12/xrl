global with sharing class getComparisonConfigs extends VisualEditor.DynamicPickList{
    VisualEditor.DesignTimePageContext context;
    global getComparisonConfigs(VisualEditor.DesignTimePageContext context) {
        this.context = context;
    }
    global override VisualEditor.DataRow getDefaultValue() {
    VisualEditor.DataRow defaultValue = new VisualEditor.DataRow('red', 'RED');
    return defaultValue;
  }
    global override VisualEditor.DynamicPickListRows getValues() {
    List<extRelListConfig__c> allConfigs = [SELECT Id,name,sObjApiName__c,listViewLabel__c,ConfigType__c
        FROM extRelListConfig__c WHERE ConfigType__c = 'Comparison'];
    VisualEditor.DynamicPickListRows picklistValues = new VisualEditor.DynamicPickListRows();
    for (extRelListConfig__c configs: allConfigs) {
      picklistValues.addRow(
                new VisualEditor.DataRow(configs.ConfigType__c + ' - ' +configs.Name + ' - ' + configs.listViewLabel__c, (string)configs.Id + '::' + (string)configs.Name)
            );
    }
    return picklistValues;
  }
}