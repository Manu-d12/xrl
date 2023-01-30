global with sharing class getConfigs extends VisualEditor.DynamicPickList{
    VisualEditor.DesignTimePageContext context;
    global getConfigs(VisualEditor.DesignTimePageContext context) {
        this.context = context;
    }
    global override VisualEditor.DataRow getDefaultValue() {
    VisualEditor.DataRow defaultValue = new VisualEditor.DataRow('red', 'RED');
    return defaultValue;
  }
    global override VisualEditor.DynamicPickListRows getValues() {
    List<extRelListConfig__c> allConfigs = [SELECT Id,name,sObjApiName__c,listViewLabel__c
        FROM XRL__extRelListConfig__c];
    VisualEditor.DynamicPickListRows picklistValues = new VisualEditor.DynamicPickListRows();
    for (extRelListConfig__c configs: allConfigs) {
      picklistValues.addRow(
                new VisualEditor.DataRow(configs.Name + ' - ' + configs.sObjApiName__c + ' - ' + configs.listViewLabel__c, (string)configs.Id + '::' + (string)configs.Name)
            );
    }
    return picklistValues;
  }
}