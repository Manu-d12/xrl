{
  "defValues": {
    "sv_Parent_Object__c": "%%recordId%%"
  },
  "actionShowHideCallback": "function(scope, libs, records) {\n\n    if (records) {\n        let user = records.find(item => {\n            return item.sv_User__c == libs.getGlobalVar(scope.actionscfg._cfgName).userInfo.id\n        });\n        if (user) {\n            return !user.sc_Access_Level__c == 'Read'\n        }\n    }\n\n    debugger;\n    return true;\n\n}"
}