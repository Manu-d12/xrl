global class postInstallClass implements InstallHandler {
/* BEFORE SECURITY REVIEW NEED FIX and use "global with sharing class" https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_install_handler.htm*/

    global void onInstall(InstallContext context) {
        if(context.previousVersion() == null) {
            List<extRelListConfig__c> newLists = new List<extRelListConfig__c>();
            //this is not a upgrade
            extRelListConfig__c extc = new extRelListConfig__c();
            extc.sObjApiName__c = 'Case';
            extc.relFieldApiName__c = 'AccountId';
            extc.isAdminConfig__c = true;
            extc.JSON__c = '[	{		"cmpName": "dataTable",		"colModel": [			{				"fieldName": "Id",				"updateable": false,				"isNameField": false,				"isEditable": false,				"isFilterable": true,				"isSortable": true,				"helpText": "Id (id)",				"label": "Case ID",				"type": "id",				"length": 18,				"inlineHelpText": null,				"wrapClass": "slds-truncate"			},			{				"label": "Case Number",				"fieldName": "CaseNumber",				"css": "slds-item slds-theme_alt-inverse",				"type": "string",				"updateable": false,				"isNameField": true,				"relationshipName": null,				"filterable": true,				"sortable": true,				"nillable": false,				"helpText": "CaseNumber (string)",				"isEditableRegular": true,				"isFilterable": true,				"isSortable": true,				"index": 12,				"length": 30,				"inlineHelpText": null,				"wrapClass": "slds-truncate"			},			{				"label": "Case Origin",				"fieldName": "Origin",				"css": "slds-item slds-theme_alt-inverse",				"type": "picklist",				"updateable": true,				"isNameField": false,				"relationshipName": null,				"filterable": true,				"sortable": true,				"nillable": true,				"helpText": "Origin (picklist)",				"isEditableAsPicklist": true,				"isFilterable": true,				"isSortable": true,				"index": 13,				"length": 255,				"inlineHelpText": null,				"wrapClass": "slds-truncate"			},			{				"label": "Case Reason",				"fieldName": "Reason",				"css": "slds-item slds-theme_alt-inverse",				"type": "picklist",				"updateable": true,				"isNameField": false,				"relationshipName": null,				"filterable": true,				"sortable": true,				"nillable": true,				"helpText": "Reason (picklist)",				"isEditableAsPicklist": true,				"isFilterable": true,				"isSortable": true,				"index": 14,				"length": 255,				"inlineHelpText": null,				"wrapClass": "slds-truncate"			},			{				"label": "Case Type",				"fieldName": "Type",				"css": "slds-item slds-theme_alt-inverse",				"type": "picklist",				"updateable": true,				"isNameField": false,				"relationshipName": null,				"filterable": true,				"sortable": true,				"nillable": true,				"helpText": "Type (picklist)",				"isEditableAsPicklist": true,				"isFilterable": true,				"isSortable": true,				"index": 17,				"length": 255,				"inlineHelpText": null,				"wrapClass": "slds-truncate"			}		],		"actions": [			{				"actionId": "std:reset_filters",				"actionLabel": "Reset Filters",				"actionTip": "Reset Filters",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:filterList",				"isActionStandard": true,				"actionOrder": 5			},			{				"actionId": "std:delete",				"actionLabel": "Delete",				"actionTip": "Delete",				"actionCallBack": "",				"actionIsHidden": false,				"actionVisibleOnRecordSelection": true,				"actionIconName": "utility:delete",				"isActionStandard": true,				"actionOrder": 10			},			{				"actionId": "std:export",				"actionLabel": "Export",				"actionTip": "Export",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:download",				"isActionStandard": true,				"actionOrder": 20			},			{				"actionId": "std:new",				"actionLabel": "New",				"actionTip": "New",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:new",				"isActionStandard": true,				"actionOrder": 30			},			{				"actionId": "std:refresh",				"actionLabel": "Refresh",				"actionTip": "Refresh List View",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:refresh",				"isActionStandard": true,				"actionOrder": 40			},			{				"actionId": "std:request_open",				"actionLabel": "Request a feature",				"actionTip": "Request a Feature",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:email",				"isActionStandard": true,				"actionOrder": 50			},			{				"actionId": "std:expand_view",				"actionLabel": "Expand View",				"actionTip": "Expand View / Collapse View",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:expand/utility:contract",				"isActionStandard": true,				"actionOrder": 60			},			{				"actionId": ":neww",				"actionLabel": "New",				"actionOrder": "35"			}		],		"rowChecked": false,		"pager": {			"pagerTop": true,			"pagerBottom": true,			"curPage": 1,			"pageSize": "50",			"pageSizeOptions": [				{					"label": "5",					"value": "5"				},				{					"label": "20",					"value": "20"				},				{					"label": "50",					"value": "50"				},				{					"label": "100",					"value": "100"				},				{					"label": "200",					"value": "200"				}			],			"numPages": 7		},		"displayOptionListSize": "20",		"addCondition": "",		"conditionOrdering": "",		"orderBy": "",		"groupFieldName": "",		"groupingParams": {			"field": "Type",			"order": "ASC"		},		"isShowNumeration": true	}]';
            extc.listViewName__c = 'view1';
            extc.uniqKey__c = 'Case:AccountId:true:view1';

            newLists.add(extc);

            SObjectAccessDecision securityDecision = Security.stripInaccessible( AccessType.CREATABLE, newLists);
            insert securityDecision.getRecords(); //setting config on Case object

			assignPermissionSets(context.installerID());
        }
    }

	@future
    public static void assignPermissionSets(id userId) {
		PermissionSet[] pId = [SELECT Id FROM PermissionSet WHERE Name = 'XRL_Admin' LIMIT 1];
        PermissionSetAssignment psa = new PermissionSetAssignment(
        AssigneeId = userId,
        PermissionSetId = pId[0].Id);

        insert psa;
    }
}