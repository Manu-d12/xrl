@isTest
public with sharing class orchestratorTest {
    @TestSetup
    static void setupData() {
        Account acc = new Account(Name = 'Test Accounts');
        insert acc;
        Case cs1 = new Case(Subject = 'Test Case1', AccountId = acc.Id);
        insert cs1;
        Case cs2 = new Case(Subject = 'Test Case2', AccountId = acc.Id);
        insert cs2;
    }
    
    @isTest
    public static void testGetRecords() {
        Account acc = [SELECT Id FROM Account WHERE Name = 'Test Accounts' LIMIT 1];
        List<Case> cs = [SELECT Id FROM Case WHERE AccountId=: acc.Id LIMIT 2];
        orchestrator.orchestratorRequest orcReq = new orchestrator.orchestratorRequest();
        orcReq.rootRecordId = acc.Id;
        orcReq.relatedRecordIds = new Id[]{cs[0].Id,cs[1].Id};
        orcReq.isFirstChunk = true;    
        orcReq.isLastChunk = true;
        test.startTest();
            orchestrator.orchestratorResponse results = new orchestrator('Test Metadata', orcReq).getResults();
        test.stopTest();
        // System.assertNotEquals(null, res.size());
        System.assertNotEquals(null, results);
    }
}
