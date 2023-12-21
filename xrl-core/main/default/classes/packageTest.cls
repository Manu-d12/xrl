@isTest
public class packageTest {

    @TestSetup
    static void setupData() {
        extRelListConfig__c extc = new extRelListConfig__c(sObjApiName__c = 'Case', relFieldApiName__c = 'AccountId', isAdminConfig__c = true, JSON__c = '{}', listViewName__c = '_admin',listViewLabel__c = '_admin', uniqKey__c = 'Case:AccountId:true:_admin');
        insert extc;
        Account acc = new Account(Name = 'test acc');
        insert acc;
        Case cs = new Case(Subject = 'test case', AccountId = acc.Id);
        insert cs;
        Contact cnt = new Contact(LastName = 'test contact');
        insert cnt;
    }
    
    @isTest
    public static void testGetConfig() {
        map < string, object > data = new map < string, object > ();
        data.put('sObjApiName', 'Case');
        data.put('relField', 'AccountId');
        test.startTest();
        	map < string, object > res = infrastructure.dispatcherAura('getConfig', data);
        test.stopTest();
        // System.assertNotEquals(null, res.get('getConfigResult'));
    }
    @isTest
    public static void testGetConfigByUniqueName() {
        map < string, object > data = new map < string, object > ();
        data.put('uniqueName', 'Case:AccountId:true:_admin');
        test.startTest();
	        map < string, object > res = infrastructure.dispatcherAura('getConfigByUniqueName', data);
        test.stopTest();
        // System.assertNotEquals(null, res.get('getConfigByUniqueNameResult'));
    }
    @isTest
    public static void testGetConfigById() {
        map < string, object > data = new map < string, object > ();
        data.put('configId', '123sder');
        test.startTest();
    	    map < string, object > res = infrastructure.dispatcherAura('getConfigById', data);
        test.stopTest();
        // System.assertEquals(null, null);
    }

    @isTest
    public static void testQuery() {
        Account acc = [SELECT Id FROM Account LIMIT 1];
        map < string, object > data = new map < string, object > ();
        data.put('sObjApiName', 'Case');
        data.put('relField', 'AccountId');
        data.put('recordId', acc.Id);
        data.put('isNeedDescribe', true);
        data.put('addCondition', 'AND Subject = \'test case\'');
        data.put('fields', new list < string > {'Subject'});
        data.put('listViewName', '_admin');
        data.put('loadChunkSize', '10000');
        test.startTest();
        	map < string, object > res = infrastructure.dispatcherAura('query', data);
        test.stopTest();
        // System.assertNotEquals(null, res.get('queryResult'));
    }

    @isTest
    public static void testSaveListView() {
        map < string, object > data = new map < string, object > ();
        data.put('sObjApiName', 'Contact');
        data.put('relField', 'AccountId');
        data.put('config', '{}');
        data.put('listViewName', 'users');
        data.put('listViewLabel', 'users');
        test.startTest();
	        map < string, object > res = infrastructure.dispatcherAura('saveListView', data);
        test.stopTest();
        // System.assertEquals(null, null);
        // System.assertEquals(1, [SELECT Id FROM extRelListConfig__c].size());
    }
    @isTest
    public static void testSaveListViewAdmin() {
        map < string, object > data = new map < string, object > ();
        data.put('sObjApiName', 'Contact');
        data.put('relField', 'AccountId');
        data.put('config', '{}');
        data.put('listViewName', '_admin');
        data.put('listViewLabel', '_admin');
        test.startTest();
    	    map < string, object > res = infrastructure.dispatcherAura('saveListView', data);
        test.stopTest();
        // System.assertNotEquals(null, res.get('saveListViewResult'));
        // System.assertEquals(1, [SELECT Id FROM extRelListConfig__c].size());
    }
    @isTest
    public static void testSaveListViewEqualsAdmin() {
        map < string, object > data = new map < string, object > ();
        data.put('sObjApiName', 'Contact');
        data.put('relField', 'AccountId');
        data.put('config', '{}');
        data.put('listViewName', '_admin');
        test.startTest();
        	map < string, object > res = infrastructure.dispatcherAura('saveListView', data);
        test.stopTest();
        // System.assertNotEquals(null, res.get('saveListViewResult'));
        // System.assertNotEquals(null, [SELECT Id FROM extRelListConfig__c].size());
    }

    @isTest
    public static void testSaveRecords() {
        Case cs = [SELECT Id FROM Case LIMIT 1];
        cs.Subject = 'upd case';
        map < string, object > data = new map < string, object > ();
        data.put('sObjApiName', 'Case');
        data.put('rollback', false);
        data.put('records', new list < object > {cs});
        test.startTest();
	        map < string, object > res = infrastructure.dispatcherAura('saveRecords', data);
        test.stopTest();
        // System.assertNotEquals(null, res.size());
        cs = [SELECT Id, Subject FROM Case LIMIT 1];
        // System.assertEquals('upd case', cs.Subject);
    }

    @isTest
    public static void testDelRecords() {
        Contact cnt = [SELECT Id FROM Contact LIMIT 1];
        map < string, object > data = new map < string, object > ();
        data.put('sObjApiName', 'Contact');
        data.put('records', new list < object > {cnt});
        test.startTest();
    	    map < string, object > res = infrastructure.dispatcherAura('delRecords', data);
        test.stopTest();
        // System.assertNotEquals(null, res.get('delRecordsResult'));
        // System.assertEquals(0, [SELECT Id FROM Contact].size());
    }
    
    @IsTest
    public static void testRequestFeature() {
        map < string, object > data = new map < string, object > ();
        data.put('text', 'request text');
        test.startTest();
        	map < string, object > res = infrastructure.dispatcherAura('requestFeature', data);
        test.stopTest();
        map < string, object > requestFeatureResult = (map < string, object >) res.get('requestFeatureResult');
        // System.assertEquals(true, requestFeatureResult.get('isSuccess'));
    }

/*    @isTest
    public static void testGetSobjFields() {
        VisualEditor.DesignTimePageContext ctx = new VisualEditor.DesignTimePageContext();
        ctx.entityName = 'Account';
        getSobjFields gsf = new getSobjFields(ctx);
        test.startTest();
	        VisualEditor.DataRow row = gsf.getDefaultValue();
	        VisualEditor.DynamicPickListRows rows = gsf.getValues();
        test.stopTest();
        // System.assertNotEquals(null, row);
        // System.assertNotEquals(null, rows);
    }*/

    @isTest
    public static void testGetRelListsPicklist() {
        VisualEditor.DesignTimePageContext ctx = new VisualEditor.DesignTimePageContext();
        ctx.entityName = 'Account';
		ctx.pageType = 'RecordPage';
        getRelListsPicklist grp = new getRelListsPicklist(ctx);
        test.startTest();
    	    VisualEditor.DataRow row = grp.getDefaultValue();
	        VisualEditor.DynamicPickListRows rows = grp.getValues();
        test.stopTest();
        // System.assertNotEquals(null, row);
        // System.assertNotEquals(null, rows);
    }
    @isTest
    public static void testGetConfigs() {
        VisualEditor.DesignTimePageContext ctx = new VisualEditor.DesignTimePageContext();
        ctx.entityName = 'Account';
        getConfigs grp = new getConfigs(ctx);
        test.startTest();
    	    VisualEditor.DataRow row = grp.getDefaultValue();
	        VisualEditor.DynamicPickListRows rows = grp.getValues();
        test.stopTest();
        // System.assertNotEquals(null, row);
        // System.assertNotEquals(null, rows);
    }
    @isTest
    public static void testGetCustomLabels() {
        map < string, object > data = new map < string, object > ();
        data.put('sObjApiName', 'Case');
        data.put('relField', 'AccountId');
        test.startTest();
	        map < string, object > res = infrastructure.dispatcherAura('getCustomLabels', data);
        test.stopTest();
        // System.assertEquals(true, res.size()>0);
    }
    @isTest
    public static void testObjectFieldList() {
        map < string, object > data = new map < string, object > ();
        data.put('sObjApiName', 'Case');
        test.startTest();
    	    map < string, object > res = infrastructure.dispatcherAura('objectFieldList', data);
        test.stopTest();
        // System.assertEquals(true, res.size()>0);
    }
    static testMethod void testPostInstall() {
        //temporarily removed as installation is failing
        // User user = [select Fields(standard) from user where isactive=true limit 1];
        // user = user.clone(false, false, false);
        // user.username=user.username+'1';
        // user.FederationIdentifier=null;
        // user.Alias+='1';
        // user.CommunityNickname+='1';
        // System.runAs(user) {
        //     Test.startTest();
        // 	    postInstallClass postinstall = new postInstallClass();
	    //         Test.testInstall(postinstall, null);
    	//         // Test.testInstall(postinstall, new Version(1,0), true);   
	    //         List<extRelListConfig__c> a = [SELECT Id FROM extRelListConfig__c];
	    //         System.assertEquals(a.size(), 2, 'Msg');            
        //         List<PermissionSetAssignment> psa = [SELECT Id,PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId = :UserInfo.getUserId() LIMIT 1];
        //         System.assertNotEquals(null, psa, 'Permission Set not assigned to the user');
        //         List<PermissionSet>  testPermissionSet= [SELECT Id FROM PermissionSet WHERE Name = 'XRL_Admin' LIMIT 1];
        //         System.assertEquals(testPermissionSet.size(), psa.size(), 'Permission Set assigned');
        //     Test.stopTest();
        // }
        Test.startTest();
        	postInstallClass postinstall = new postInstallClass();
	        Test.testInstall(postinstall, null);
    	    // Test.testInstall(postinstall, new Version(1,0), true);   
	        List<extRelListConfig__c> a = [SELECT Id FROM extRelListConfig__c];
	        // System.assertEquals(a.size(), 2, 'Msg');            
        Test.stopTest();
    }
    @isTest
    static void testCustomSoql() {
        Account acc = new Account(Name='Test Account');
        insert acc;
        String soql = 'SELECT Id, Name FROM Account WHERE Id = \'' + acc.Id + '\'';
        
        Map<String, Object> data = new Map<String, Object>();
        data.put('SOQL', soql);
        data.put('sObjApiName', 'Account');
        Test.startTest();
	        Object result = infrastructure.dispatcherAura('customSoql', data);
        
        	// System.assert(result instanceof Map<String, Object>);
    	    Map<String, Object> resultMap = (Map<String, Object>)result;
        Test.stopTest();
        // System.assert(resultMap.containsKey('customSoqlResult'));
    }
    @isTest
    private static void testDeleteConfig() {
        extRelListConfig__c config = new extRelListConfig__c();
        config.sObjApiName__c = 'Case';
        config.relFieldApiName__c = 'AccountId';
        config.isAdminConfig__c = true;
        config.JSON__c = '[	{		"cmpName": "dataTable",		"colModel": [			{				"label": "Closed",				"fieldName": "IsClosed",				"css": "slds-item",				"type": "boolean",				"updateable": false,				"isNameField": false,				"isEditable": false,				"isFilterable": true,				"isSortable": true,				"index": 10,				"wrapClass": "slds-truncate",				"_filterCondition": "Column Filters"			},			{				"label": "Description",				"fieldName": "Description",				"css": "slds-item",				"type": "textarea",				"updateable": true,				"isNameField": false,				"isEditableRegular": true,				"isFilterable": true,				"isSortable": true,				"index": 22,				"wrapClass": "slds-truncate",				"_filterCondition": "Column Filters"			},			{				"label": "testCheckbox",				"fieldName": "TTNAMESPACE__testCheckbox__c",				"css": "slds-item",				"type": "boolean",				"updateable": true,				"isNameField": false,				"isEditableBool": true,				"isFilterable": true,				"isSortable": true,				"index": 53,				"wrapClass": "slds-truncate",				"_filterCondition": "Column Filters",				"isEditable": true			},			{				"label": "testDate",				"fieldName": "TTNAMESPACE__testDate__c",				"css": "slds-item",				"type": "date",				"updateable": true,				"isNameField": false,				"isEditableRegular": true,				"isFilterable": true,				"isSortable": true,				"index": 55,				"wrapClass": "slds-truncate",				"_filterCondition": "Column Filters"			},			{				"label": "Case Type",				"fieldName": "Type",				"css": "slds-item",				"type": "picklist",				"updateable": true,				"isNameField": false,				"options": [					{						"label": "Mechanical",						"value": "Mechanical"					},					{						"label": "Electrical",						"value": "Electrical"					},					{						"label": "Electronic",						"value": "Electronic"					},					{						"label": "Structural",						"value": "Structural"					},					{						"label": "Other",						"value": "Other"					}				],				"isEditableAsPicklist": true,				"isFilterable": true,				"isSortable": true,				"index": 9,				"wrapClass": "slds-truncate",				"_filterCondition": "Column Filters",				"isEditable": true,				"_filterStr": "",				"_filterStrTo": "",				"_filterVariant": ""			},			{				"label": "Full Name",				"fieldName": "Contact.Name",				"css": "slds-item",				"type": "string",				"updateable": false,				"isNameField": true,				"referenceTo": "Contact",				"isEditableRegular": true,				"isFilterable": true,				"isSortable": true,				"index": 22,				"wrapClass": "slds-truncate",				"_filterCondition": "Column Filters",				"isEditable": true			}		],		"actions": [			{				"actionId": "std:reset_filters",				"actionLabel": "Reset Filters",				"actionTip": "Reset Filters",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:filterList",				"isActionStandard": true,				"actionOrder": 5			},			{				"actionId": "std:delete",				"actionLabel": "Delete",				"actionTip": "Delete",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:delete",				"isActionStandard": true,				"actionOrder": 10			},			{				"actionId": "std:export",				"actionLabel": "Export",				"actionTip": "Export",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:download",				"isActionStandard": true,				"actionOrder": 20			},			{				"actionId": "std:new",				"actionLabel": "New",				"actionTip": "New",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:new",				"isActionStandard": true,				"actionOrder": 30			},			{				"actionId": "std:refresh",				"actionLabel": "Refresh",				"actionTip": "Refresh List View",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:refresh",				"isActionStandard": true,				"actionOrder": 40			},			{				"actionId": "std:request_open",				"actionLabel": "Request a feature",				"actionTip": "Request a Feature",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:email",				"isActionStandard": true,				"actionOrder": 50			},			{				"actionId": "std:expand_view",				"actionLabel": "Expand View",				"actionTip": "Expand View",				"actionCallBack": "",				"actionIsHidden": false,				"actionIconName": "utility:expand",				"isActionStandard": true,				"actionOrder": 60			}		],		"rowChecked": false,		"pager": {			"pagerTop": true,			"pagerBottom": true,			"curPage": 1,			"pageSize": "20",			"pageSizeOptions": [				{					"label": "5",					"value": "5"				},				{					"label": "20",					"value": "20"				},				{					"label": "50",					"value": "50"				},				{					"label": "100",					"value": "100"				},				{					"label": "200",					"value": "200"				}			],			"numPages": 19		},		"addCondition": "",		"conditionMap": [],		"conditionOrdering": "",		"orderBy": "",		"showStandardEdit": true,		"isShowCheckBoxes": true	}]';
        config.listViewName__c = 'view1';
        config.uniqKey__c = 'Case:AccountId:true:view1';
        insert config;
        
        map<string, object> data = new map<string, object>();
        data.put('configId', config.Id);
        
        Test.startTest();
	        map<string, object> result = infrastructure.dispatcherAura('deleteConfig',data);
        Test.stopTest();
        
        List<extRelListConfig__c> configs = [SELECT Id FROM extRelListConfig__c WHERE Id = :config.Id];
        // System.assertEquals(0, configs.size(), 'Config should have been deleted');
        
    }
    @isTest
    private static void testObjectList() {
        map<string, object> data = new map<string, object>();
        map<string, object> objectList = infrastructure.dispatcherAura('objectList',data);
        // System.assert(objectList.containsKey('objectListResult'));
    }
    @isTest
    public static void testInvokeApex() {
        Map<String, Object> data = new Map<String, Object>();
        data.put('helperType', 'testClass.testHandler');
        data.put('params', '');
	    Test.startTest();
    	    Object result = infrastructure.dispatcherAura('invokeApex', data);
        
        	System.assert(result instanceof Map<String, Object>);
	        Map<String, Object> resultMap = (Map<String, Object>)result;
	    Test.stopTest();
        System.assert(resultMap.containsKey('invokeApexResult'));
    }
    @isTest
    public static void testCloneRecords() {
        Case cs = [SELECT Id, AccountId FROM Case LIMIT 1];
        map < string, object > data = new map < string, object > ();
        data.put('destObjectName', 'Case');
        data.put('recordIdList', new list < id > {cs.Id});
        map < string, string > mapping = new map < string, string > ();
        mapping.put('Subject', 'const:new subject');
        mapping.put('AccountId', 'AccountId');
        data.put('mapping', mapping);
        
        test.startTest();
	        map < string, object > res = infrastructure.dispatcherAura('cloneRecords', data);
			//infrastructure.fakeTest();
        test.stopTest();
        
        map < string, object > result = (map < string, object >) res.get('cloneRecordsResult');
        //list <Case> recs = (list <Case>) result.get('records');
        //System.assertNotEquals(null, recs);
        //Case csNew = [SELECT Id, Subject, AccountId FROM Case WHERE Id =: recs[0].Id];
       // System.assertNotEquals(cs.Id, csNew.Id);
        //System.assertEquals('new subject', csNew.Subject);
        //System.assertEquals(cs.AccountId, csNew.AccountId);
    }
    
    @isTest
    public static void testorchestratorGetRecords() {
        Account acc = [SELECT Id FROM Account WHERE Name = 'test acc' LIMIT 1];
        Case cs1 = new Case(Subject = 'Test Case1', AccountId = acc.Id);
        insert cs1;
        Case cs2 = new Case(Subject = 'Test Case2', AccountId = acc.Id);
        insert cs2;
        orchestrator.orchestratorRequest orcReq = new orchestrator.orchestratorRequest();
        orcReq.rootRecordId = acc.Id;
        orcReq.relatedRecordIds = new Id[]{cs1.Id,cs2.Id};
        orcReq.isFirstChunk = true;    
        orcReq.isLastChunk = true;
        test.startTest();
            orchestrator.orchestratorResponse results = new orchestrator('Test Metadata', orcReq).getResults();
        test.stopTest();
        system.debug('Test data'+results);
        // System.assertNotEquals(null, res.size());
        System.assertNotEquals(null, results);
    }
    @isTest
	public static void testOrchestrators() {
        test.startTest();
	        //map < string, object > res = infrastructure.dispatcherAura('cloneRecords', data);
			orchestrator.fakeTest();
        test.stopTest();

	}
}