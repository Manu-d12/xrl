@isTest
public class packageTest {

    @TestSetup
    static void setupData() {
        extRelListConfig__c extc = new extRelListConfig__c(sObjApiName__c = 'Case', relFieldApiName__c = 'AccountId', isAdminConfig__c = true, JSON__c = '{}', listViewName__c = '_admin', uniqKey__c = 'Case:AccountId:true:_admin');
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
        System.assertNotEquals(null, res.get('getConfigResult'));
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
        test.startTest();
        map < string, object > res = infrastructure.dispatcherAura('query', data);
        test.stopTest();
        System.assertNotEquals(null, res.get('queryResult'));
    }

    @isTest
    public static void testSaveListView() {
        map < string, object > data = new map < string, object > ();
        data.put('sObjApiName', 'Contact');
        data.put('relField', 'AccountId');
        data.put('config', '{}');
        data.put('listViewName', '_admin');
        test.startTest();
        map < string, object > res = infrastructure.dispatcherAura('saveListView', data);
        test.stopTest();
        System.assertNotEquals(null, res.get('saveListViewResult'));
        System.assertEquals(2, [SELECT Id FROM extRelListConfig__c].size());
    }

    @isTest
    public static void testSaveRecords() {
        Case cs = [SELECT Id FROM Case LIMIT 1];
        cs.Subject = 'upd case';
        map < string, object > data = new map < string, object > ();
        data.put('sObjApiName', 'Case');
        data.put('records', new list < object > {cs});
        test.startTest();
        map < string, object > res = infrastructure.dispatcherAura('saveRecords', data);
        test.stopTest();
        System.assertNotEquals(null, res.get('saveRecordsResult'));
        cs = [SELECT Id, Subject FROM Case LIMIT 1];
        System.assertEquals('upd case', cs.Subject);
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
        System.assertNotEquals(null, res.get('delRecordsResult'));
        System.assertEquals(0, [SELECT Id FROM Contact].size());
    }
    
    @IsTest
    public static void testRequestFeature() {
        map < string, object > data = new map < string, object > ();
        data.put('text', 'request text');
        test.startTest();
        map < string, object > res = infrastructure.dispatcherAura('requestFeature', data);
        test.stopTest();
        map < string, object > requestFeatureResult = (map < string, object >) res.get('requestFeatureResult');
        System.assertEquals(true, requestFeatureResult.get('isSuccess'));
    }

    @isTest
    public static void testGetSobjFields() {
        VisualEditor.DesignTimePageContext ctx = new VisualEditor.DesignTimePageContext();
        ctx.entityName = 'Account';
        getSobjFields gsf = new getSobjFields(ctx);
        test.startTest();
        VisualEditor.DataRow row = gsf.getDefaultValue();
        VisualEditor.DynamicPickListRows rows = gsf.getValues();
        test.stopTest();
        System.assertNotEquals(null, row);
        System.assertNotEquals(null, rows);
    }

    @isTest
    public static void testGetRelListsPicklist() {
        VisualEditor.DesignTimePageContext ctx = new VisualEditor.DesignTimePageContext();
        ctx.entityName = 'Account';
        getRelListsPicklist grp = new getRelListsPicklist(ctx);
        test.startTest();
        VisualEditor.DataRow row = grp.getDefaultValue();
        VisualEditor.DynamicPickListRows rows = grp.getValues();
        test.stopTest();
        System.assertNotEquals(null, row);
        System.assertNotEquals(null, rows);
    }
    @isTest
    public static void testGetRelTemplates() {
        VisualEditor.DesignTimePageContext ctx = new VisualEditor.DesignTimePageContext();
        ctx.entityName = 'Account';
        getRelTemplates grp = new getRelTemplates(ctx);
        test.startTest();
        VisualEditor.DataRow row = grp.getDefaultValue();
        VisualEditor.DynamicPickListRows rows = grp.getValues();
        test.stopTest();
        System.assertNotEquals(null, row);
        System.assertNotEquals(null, rows);
    }
    @isTest
    public static void testGetCustomLabels() {
        map < string, object > data = new map < string, object > ();
        data.put('sObjApiName', 'Case');
        data.put('relField', 'AccountId');
        test.startTest();
        map < string, object > res = infrastructure.dispatcherAura('getCustomLabels', data);
        test.stopTest();
        System.assertEquals(true, res.size()>0);
    }
}