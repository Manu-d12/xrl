{
  "executors": [],
  "orchestrator": {
    "precheck": {
      "className": "sv_PartnerFunctionService.QuoteItemPropagation",
      "isActive": true,
      "isDebug": false
    },
    "childObjApiName": "StrataVAR__Cust_BoM_Items__r"
  },
  "extRelList": {
    "apiName": "Partner Functions::sv_Partner_Function__c::::PFAssign"
  },
  "UI1": {
    "loadRecordsLabel": "Loading records...",
    "processRecordsLabel": "Processed {0} from {1}. Errors count is {2}",
    "withoutHeader": true,
    "title": "Assign PF",
    "headerStyle": "slds-modal__header slds-theme_error",
    "buttons": [
      {
        "name": "cancel",
        "label": "Cancel",
        "variant": "neutral"
      },
      {
        "name": "btn:importBom",
        "label": "Assign",
        "variant": "brand",
        "class": "slds-m-left_x-small",
        "isDisabled": true,
        "isExecuteCallbackOnQuickAction": true,
        "disableCallback": "function(scope, libs, data) {\n    return Object.keys(data).length == 0;\n}",
        "callback": "function(scope, libs, data) {\n    console.log('CONFIRM', scope, libs, data);\n    scope.config.showConfirmation = true;\n    scope.config.confirmationUI = scope.config.UI.buttons[1].UI1;\n    let PFLst = [];\n    for (const [key, value] of Object.entries(data.data.data)) {\n        let relRecord = value.addInfo.relRecord;\n        PFLst.push({\n            \"sv_Unique_Key__c\": '%%recordId%%' + relRecord.sv_SAP_Partner_Function_Type__c,\n            \"sv_Parent__c\": '%%recordId%%',\n            \"sv_Partner_Address__c\": relRecord.sv_Partner_Address__c,\n            \"sv_SAP_Partner_Function_Type__c\": relRecord.sv_SAP_Partner_Function_Type__c,\n            \"sv_Sap_Number__c\": '1223444'\n        });\n    }\n    libs.remoteAction(scope, 'saveRecords', {\n        \"uniqueFieldNameForUpsert\": \"sv_Partner_Function__c.sv_Unique_Key__c\",\n        \"sObjApiName\": \"sv_Partner_Function__c\",\n        \"records\": PFLst,\n        callback: ((nodeName, data) => {\n            if (data[nodeName].countOfFailedRecords == \"0\") {\n\n                libs.showToast(scope, {\n                    title: 'Success',\n                    message: 'PF(s) was created(updated) successfully.',\n                    variant: 'success'\n                });\n            } else {\n                libs.showToast(scope, {\n                    title: 'Error',\n                    message: 'Error PF(s) creation.',\n                    variant: 'error'\n                });\n\n            }\n\n        })\n    })\n}",
        "UI1": {
          "contents": [
            {
              "isMessage": true,
              "name": "deleteConfirm",
              "text": "The Selected Partners will be propagated to all the Items, when assigning partner functions at the quote header level. Would you like to proceed?"
            }
          ],
          "buttons": [
            {
              "name": "cancel",
              "label": "Cancel",
              "variant": "neutral"
            },
            {
              "name": "btn:no",
              "label": "No",
              "variant": "neutral",
              "callback": "function(scope, libs, data) {\n    console.log('NO');\n    let event = new CustomEvent('action', {\n        detail: {\n            action: 'cancel'\n        }\n    });\n    scope.dispatchEvent(event);\n}"
            },
            {
              "name": "btn:yes",
              "label": "Yes",
              "variant": "brand",
              "class": "slds-m-left_x-small",
              "isDisabled": false,
              "callback": "function(scope, libs, data) {\n    console.log('YES');\n    let event = new CustomEvent('action', {\n        detail: {\n            action: 'getRecordsAndSend'\n        }\n    });\n    scope.dispatchEvent(event);\n    let eventClose = new CustomEvent('action', {\n        detail: {\n            action: 'cancel'\n        }\n    });\n    scope.dispatchEvent(eventClose);\n}"
            }
          ]
        }
      }
    ],
    "contents": [
      {
        "isMessage": true,
        "name": "deleteConfirm",
        "text": "this.config._LABELS.msg_deleteConfirm1 + + records.length +  + this.config._LABELS.msg_deleteConfirm2"
      }
    ],
    "data_id": "validate:dialog",
    "initCallback": "function(scope, libs, config) {\n    libs.remoteAction(scope, 'customSoql', {\n        \"SOQL\": \"SELECT StrataVAR__Account__c FROM StrataVAR__CustomerBoM__c WHERE Id='\" + scope.urlParams.recordId + \"'\",\n        \"sObjApiName\": \"StrataVAR__CustomerBoM__c\",\n        \"callback\": ((nodeName, data) => {\n            libs.setGlobalVar('quoteKeyPrefix', JSON.parse(data[nodeName].describeSObject).keyPrefix);\n            libs.remoteAction(scope, 'customSoql', {\n                \"isAggregateResult\": false,\n                \"sObjApiName\": \"sv_Partner_Function__c\",\n                \"SOQL\": \"SELECT Id, Name, sv_SAP_Partner_Function_Type__c,sv_Partner_Address__c, sv_Parent__c, sv_Partner_Address__r.sv_SAP_Postal_Code__c, sv_Partner_Address__r.sv_SAP_Region__c, sv_Partner_Address__r.sv_SAP_District__c, sv_Partner_Address__r.sv_SAP_City__c, sv_Partner_Address__r.sv_SAP_Street__c FROM sv_Partner_Function__c WHERE sv_Partner_Address__c!= null AND (sv_Parent__c = '%%recordId%%' OR sv_Parent__c ='\" + data[nodeName].records[0].StrataVAR__Account__c + \"' ) ORDER BY sv_SAP_Partner_Function_Type__c\",\n                callback: ((nodeName, data) => {\n                    function prepareAddr(record) {\n                        return record.sv_Partner_Address__r.sv_SAP_Region__c + ' ' + record.sv_Partner_Address__r.sv_SAP_District__c + ' ' + record.sv_Partner_Address__r.sv_SAP_City__c + ' ' + record.sv_Partner_Address__r.sv_SAP_Street__c\n                    }\n                    scope.config = config;\n                    let output = [];\n                    let describe = JSON.parse(data[nodeName].describe)?.sv_SAP_Partner_Function_Type__c?.picklistValues;\n                    let curValue = undefined;\n                    console.log(libs.getGlobalVar('quoteDescribe'));\n                    data[nodeName].records.forEach(item => {\n                        let label = describe.find(itm => itm.value == item.sv_SAP_Partner_Function_Type__c)?.label\n                        if (curValue != item.sv_SAP_Partner_Function_Type__c) {\n                            curValue = item.sv_SAP_Partner_Function_Type__c;\n                            output.push({\n                                \"name\": item.sv_SAP_Partner_Function_Type__c,\n                                \"isRequired\": false,\n                                \"value\": item.sv_Parent__c == '%%recordId%%' ? item.Id : null,\n                                \"address\": item.sv_Parent__c == '%%recordId%%' ? item.sv_Partner_Address__c : null,\n                                \"label\": label,\n                                \"type\": \"picklist\",\n                                \"enableNewOption\": true,\n                                \"newItemCreation\": {\n                                    \"PFType\" : item.sv_SAP_Partner_Function_Type__c,\n                                    \"sObjApiName\": \"Sv_Partner_Address__c\",\n                                    \"label\": \"One Time Shipping\",\n                                    \"callback\": \"async function(scope, libs, record, config) {\\r\\n    let PFType = config.PFType;\\r\\n    let PFLst = [{\\r\\n        \\\"sv_Unique_Key__c\\\": \\\"%%recordId%%\\\" + PFType,\\r\\n        \\\"sv_Parent__c\\\": \\\"%%recordId%%\\\",\\r\\n        \\\"sv_Partner_Address__c\\\": record.id,\\r\\n        \\\"sv_SAP_Partner_Function_Type__c\\\": PFType,\\r\\n        \\\"sv_Sap_Number__c\\\": \\\"1223444\\\"\\r\\n    }];\\r\\n    let result = await libs.remoteAction(scope, 'saveRecords', {\\r\\n        \\\"uniqueFieldNameForUpsert\\\": \\\"sv_Partner_Function__c.sv_Unique_Key__c\\\",\\r\\n        \\\"sObjApiName\\\": \\\"sv_Partner_Function__c\\\",\\r\\n        \\\"records\\\": PFLst,\\r\\n        callback: ((nodeName, data) => {\\r\\n            console.log('Created PF record', data[nodeName]);\\r\\n    libs.setGlobalVar('createNewItem', data[nodeName]);        return \\\"Bingo\\\";\\r\\n        })\\r\\n    });\\r\\n    console.log(scope, libs, record);\\r\\n    debugger;\\r\\n    return {\tlabel: record.id, value: libs.getGlobalVar('createNewItem').records[0].Id}}\"\n                                },\n\n                                \"options\": [{\n                                        \"value\": \"\",\n                                        \"label\": \"None\"\n                                    },\n                                    {\n                                        \"value\": item.Id,\n                                        \"label\": prepareAddr(item),\n                                        \"relRecord\": item\n                                    }\n                                ]\n\n                            })\n                        } else {\n                            let field = output[output.length - 1];\n                            field.value = item.sv_Parent__c == '%%recordId%%' ? item.Id : field.value;\n                            field.address = item.sv_Parent__c == '%%recordId%%' ? item.sv_Partner_Address__c : field.address;\n                            field.options.push({\n                                \"value\": item.Id,\n                                \"label\": prepareAddr(item),\n                                \"relRecord\": item\n                            });\n                        }\n\n\n                    })\n                    /* Need delete duplicates*/\n\n                    output.forEach(item => {\n                        console.log('ITEM', item);\n                        if (item.value != null) {\n                            let index = item.options.findIndex(opt => {\n                                return (opt.relRecord?.sv_Partner_Address__c == item.address && item.value != opt.value);\n                            })\n                            if (index) item.options.splice(index, 1);\n                        }\n                    })\n                    scope.config.UI.fields = output;\n                }).bind(scope)\n            })\n        })\n    });\n\n}"
  }
}