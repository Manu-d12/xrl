public class CustomMetadataService {
    public CustomMetadataService() {}
    /**
     * This method instantiates a custom metadata record of type Support_Tier__mdt
     * and sets the DeveloperName to the input String.
     * The record is not inserted into the database, 
     * and would not be found by a SOQL query.
     */
    public static config__mdt getCustomMetadataRecord(String myName,String Json) {
        config__mdt supportTier = new config__mdt();
        supportTier.DeveloperName = myName;
        supportTier.JSON__c= Json;
        return supportTier;
    }
    /**
     * This method retrieves a custom metadata record, changes a field, and returns it
     * to the caller, but does not update the database.
     */
    public config__mdt getChangedCustomMetadataRecord(String myNewName) {
        config__mdt supportTier = [SELECT Id, DeveloperName from config__mdt LIMIT 1];
        supportTier.DeveloperName = myNewName;
        return supportTier;
    }
}