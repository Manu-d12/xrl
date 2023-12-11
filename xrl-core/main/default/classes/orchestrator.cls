public class orchestrator {

    /*  
     * 1. Custom  metadata "Config"
     * 2. Layout for custom metadata type
     * 3. Infrastructure, orchestrator Apex, 
     * New features - isDebug. We can collect and pub debug information to log file
     * 
     * Questions. How to send a records instead Ids for example for calculations?
     * How we will treat exceptions in code?
     * Validation redirect? How we will invokate, how we will redirect?
     * 
     * 
     * 
orchestrator.orchestratorRequest orcReq = new orchestrator.orchestratorRequest();
orcReq.rootRecordId = '0015i000008dvp4AAA';
orcReq.relatedRecordIds = new Id[]{'5005i00000Kiy8UAAR','5005i00000Kiy8VAAR'};
orcReq.isFirstChunk = true;    
orcReq.isLastChunk = true;
new orchestrator('QuoteExportValidation',orcReq).getResults();

{
  "executors": [
    {
      "className": "QuoteValidator.Margin",
      "isActive": true,
      "isDebug" : true,
      "typeOf": "ROOTVALIDATION",
      "onFail": "warn",
      "listOfFieldsToPass": ["Name"],
      "errorTemplate" : "MarginValidation",
      "additionalParams": {
        "limits": {
          "chunkSize": 500
        }
      }
    },
    {
      "className": "QuoteItemIsNotSaasValidator"
    },
    {
      "className": "QuoteAccountIsInUsValidator"
    },
    {
      "className": "QuoteValidator.MasterItemMaterialIdValidator",
      "isActive": true,
      "errorTemplate" : "MarginValidation",
      "typeOf": "VALIDATION",
  "isDebug" : true,
      "listOfFieldsToPass": [
        "Account.Name", "CaseNumber"
      ],
      "additionalParams": {
        "limits": {
          "chunkSize": 500
        }
      }
    }
  ],
  "orchestrator": {
    "email": {
      "isActive" : true,
      "emailTemplate" : "SalesNewCustomerEmail",
      "recipients" : ["${currentUser}","${ownerRootRecord}","wildervit@gmail.com"]
    }
  }
}

global with sharing class QuoteValidator {

    global class Margin extends infrastructure.handler {
		global override object execute(map < string, object > data) {
			orchestrator.validationResult result = new orchestrator.validationResult();
            result.code = orchestrator.validationResultCode.ERR;
            result.dynamicValues = new object[]{6, 12};
			return result;
		}
	}

    global class MasterItemMaterialIdValidator extends infrastructure.handler {
		global override object execute(map < string, object > data) {
            case record = (case) data.get('record');
        	account rootRecord = (account) data.get('rootRecord');
            
            infrastructure.addDebugLog('MasterItemMaterialIdValidator', rootRecord);
            
            orchestrator.validationResult result = new orchestrator.validationResult();
            result.code = orchestrator.validationResultCode.ERR;
            result.dynamicValues = new object[]{5, 11, rootRecord.Owner.Email};
			return result;
		}
        
        global override boolean isExecutable(map < string, object > data) {
        	return true;
        }
	}
    
    
}





     * 
     * 
	*/ 
    
    // Parent transactionId
        
    private orchestratorConfig config;
    private orchestratorRequest orcReq;
    private orchestratorResponse orcResp;
    
    
    public orchestrator(String operation, orchestratorRequest orcReq) {
       
        this.orcReq = orcReq;
        this.orcResp =  new orchestratorResponse();
        
        config__mdt[] cfg = [SELECT Id, JSON__c FROM config__mdt WHERE DeveloperName = :operation];
        this.config = (orchestratorConfig) JSON.deserialize(cfg[0].JSON__c, orchestratorConfig.class);
        this.config.init(operation, orcReq);
        infrastructure.addDebugLog('orchestrator:in', this.orcReq);
        
        if (this.orcReq.rootRecordId != null && this.orcReq.isFirstChunk == true) { // need delete all old records only in case of firstChunk
        	delete [SELECT Id FROM log__c WHERE operation__c =: operation AND rootRecordId__c =:this.orcReq.rootRecordId];
        }
        
        this.mainLoop(operation);
        if (this.orcReq.isLastChunk == true) this.sendEmail(operation);
    }
    
    public orchestratorResponse getResults(){
        return this.orcResp;
    }
    
    private void mainLoop(string operation) {
        boolean oldDebug = infrastructure.isDebug;
         
        for (executorConfigPart ePart : this.config.executors) {
            log__c[] logs = new log__c[]{};
            // I think need to write results after every validation.  It will prevent issue with more then 10.000 records
            sObject[] allRecords = this.config.getRecords(ePart);
            
            Type T = type.forName(ePart.className);			
			if (T == null) throw new infrastructure.InfrastructureException(null, ('Can\'t find class {1}').replace('{1}', ePart.className), infrastructure.exceptionType.CLASS_NOT_FOUND);
			infrastructure.handler handlerClass = (infrastructure.handler) T.newInstance();
            if (handlerClass.isExecutable(new  map<string, object>{'rootRecord' => this.config.rootRecord}) != true) continue;
            
			//set global debug flag
			infrastructure.isDebug = ePart.isDebug;

            for (sObject obj: allRecords) {
                try {
                    object handlerResult = handlerClass.execute(new  map<string, object>{ 'record'=> obj, 'rootRecord' => this.config.rootRecord});
                    switch on ePart.typeOf {
						when ROOTVALIDATION, VALIDATION {
                            validationResult vResult = (validationResult) handlerResult;
                            if (vResult.code != validationResultCode.OK) {
                                this.orcResp.invalidCount ++;
                                string errorMessage = String.format(ePart.errorTemplate, vResult.dynamicValues);
                                log__c l = this.prepareLogRecord(operation, obj);
                                l.errorMessage__c = errorMessage;
                                l.errCode__c = ePart.className;
                                logs.add(l);
                            }
                        }
                        when EXECUTION {
                            //Need to add result to response in case of calc engine
                        } 
                    }
                } catch (Exception e) {
                    system.debug(LoggingLevel.Error, 'EXCEPTION:' + e.getMessage());
                    log__c l = this.prepareLogRecord(operation, obj);
                    l.errorMessage__c = ePart.className;
                    l.errCode__c = 'EXCEPTION';
                    l.info__c = 'EXCEPTION: ' + e.getMessage() + '\n\n STACK: ' + e.getStackTraceString();
                    logs.add(l);
                }
            }
            if (infrastructure.debugLog!= null) {
                log__c l = this.prepareLogRecord(operation, null);
                l.errorMessage__c = 'DEBUG';
                l.errCode__c = 'DEBUG';
                l.info__c = JSON.serializePretty(infrastructure.debugLog);
                logs.add(l);
            }
            insert logs;
        }
        
        infrastructure.isDebug = oldDebug;
        this.orcResp.recordsCount = this.orcReq.relatedRecordIds.size();
    }
    
    private log__c prepareLogRecord(string operation, sObject relatedRecord) {
        
        string relatedRecordName = relatedRecord == this.config.rootRecord || relatedRecord == null ? this.config.rootRecordName : (string) relatedRecord.get(getNameField(this.config.SObjAPIName));
        return new log__c(
            operation__c = operation,
            dateTimeStamp__c = system.now(),
            relatedRecordId__c = relatedRecord!= null ? relatedRecord.Id : null,
            relatedRecordName__c = relatedRecordName,
            rootRecordId__c = this.orcReq.rootRecordId,
            rootRecordName__c = this.config.rootRecordName
        );
    }
    
    private void sendEmail(string operation) {
        if (this.config.isNeedSendEmail!= true) return;
        // Need deside about email if we have an error in a table
        log__c[] errors = [
            SELECT ID 
            FROM log__c 
            WHERE operation__c = :operation AND rootRecordId__c =:this.orcReq.rootRecordId AND errCode__c !='DEBUG' AND errCode__c !='EXCEPTION'
        ]; // Need filterout EXCEPTIONS and DEBUG
        if (errors.size() ==0) return;
        
        emailTemplate et = [
            SELECT Id,Name,Description,HtmlValue,Body,Subject,DeveloperName 
            FROM EmailTemplate EmailTemplate 
            WHERE DeveloperName =:this.config.orchestrator.email.emailTemplate 
            LIMIT 1
        ];
        
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setTemplateId(et.Id);
        mail.setToAddresses(this.config.prepareEmailRecipients(this.config.rootRecord));
        //mail.setSubject('test subject'); Subject must be provided by template, but in additional to this we can format a Subject
        mail.setTargetObjectId(userInfo.getUserId());// Need to change
        //mail.setWhatId(primaryAccount);
        //if (this.orcReq.rootRecordId!= null) mail.setWhatId(this.orcReq.rootRecordId);
        mail.setSaveAsActivity(false);
        mail.setUseSignature(false);
        mail.setReplyTo(UserInfo.getUserEmail());
        mail.setSenderDisplayName(UserInfo.getName());
        
        try {
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
        } catch (Exception e) {
            System.debug(e.getMessage());
            log__c l = this.prepareLogRecord(operation, null);
            l.errorMessage__c = e.getMessage();
            l.errCode__c = 'EXCEPTION:';
            l.info__c = e.getStackTraceString();
            insert l;
        }
    }    
    
    
    /* Inner classes */
    
    public class orchestratorConfig {
        public executorConfigPart[] executors; 
        public orchestratorConfigPart orchestrator;
        
        public sObject rootRecord;
        public sObject[] relatedData;
            
        public string rootRecordName;
        public string sObjApiName;

        public boolean isNeedSendEmail;
        private boolean isNeedPrepareRelatedData = false;
                
        public void init(string operation,orchestratorRequest orcReq) {
            executorConfigPart[] executorsActive = new executorConfigPart[]{};
            
            for (executorConfigPart ePart: this.executors) {
                if (ePart.isActive != true) continue;
                
                this.isNeedPrepareRelatedData = this.isNeedPrepareRelatedData == true || ePart.typeOf == executorType.VALIDATION;
                
                ePart.errorTemplate = ePart.errorTemplate != null 
                	? System.Label.get(null, ePart.errorTemplate)
                	: 'No Error Message defined in configuration ' + operation + ' ' + ePart.className;
                
                executorsActive.add(ePart);
            }   
            this.executors = executorsActive;
            this.isNeedSendEmail = orchestrator!=null 
                && orchestrator.email != null 
                && orchestrator.email.isActive == true 
                && orchestrator.email.emailTemplate!=null 
                && orchestrator.email.recipients != null;
            
            this.prepareData(executorType.ROOTVALIDATION, new id[]{orcReq.rootRecordId});
        	this.prepareData(executorType.VALIDATION, orcReq.relatedRecordIds);
        }
        
        private void prepareData(executorType eType, Id[] relatedRecordIds) {
			if (eType == executorType.VALIDATION && isNeedPrepareRelatedData == false) return;
                
            set<string> allFields = new set<string>{'Id'};
            id[] relRecordIds = (eType == executorType.ROOTVALIDATION) ? new Id[]{relatedRecordIds[0]} : relatedRecordIds;
            
            for (executorConfigPart v: this.executors) {
                if (eType == v.typeOf && v.listOfFieldsToPass!=null) allFields.addAll(v.listOfFieldsToPass);
            }
			Schema.DescribeSObjectResult sObjDescribe = relRecordIds[0].getSObjectType().getDescribe();
	        this.SObjAPIName = sObjDescribe.getName();
            if (eType == executorType.ROOTVALIDATION) {
            	//this.rootSObjAPIName = sObjDescribe.getName();    
            	if (sObjDescribe.fields.getMap().containsKey('OwnerId')) allFields.addAll(new string[]{'Owner.Name', 'Owner.Email'});
            } 
            allFields.addAll(new string[]{getNameField(this.SObjAPIName)});
            
            string SOQL = 'SELECT {fields} FROM {sObjApiName}';
            SOQL = SOQL.replaceAll('\\{fields\\}', allFields != null ? string.join(new list < string > (allFields), ',') : '');
            SOQL = SOQL.replaceAll('\\{sObjApiName\\}', this.SObjAPIName);
            
            SOQL += ' WHERE Id IN :relatedRecordIds';
            system.debug(LoggingLevel.Error, 'SOQL ' + SOQL);
            sObject[] records = database.query(SOQL);
            if (eType == executorType.ROOTVALIDATION) {
            	this.rootRecordName = records != null && records.size() > 0 ? (string) records[0].get(getNameField(this.SObjAPIName)) : 'link';
                this.rootRecord = records.size()>0 ? records[0] : null;
            }
            if (eType == executorType.VALIDATION) {
                relatedData = records;
            }
            
        }
        
        public string[] prepareEmailRecipients(sObject rootRecord) {
            string[] result = new string[]{};
            if (this.isNeedSendEmail == true) {
                for (string rec : orchestrator.email.recipients) {
	                rec = rec.replaceAll('(?i)'+'\\$\\{currentUser\\}', UserInfo.getUserEmail());
                    if (rootRecord!=null && rootRecord.getsObject('Owner')!=null) {
                    	rec = rec.replaceAll('(?i)'+'\\$\\{ownerRootRecord\\}', (string)  rootRecord.getsObject('Owner').get('Email'));
                    }
                    // Also need to provide other transformation. For example a public group implementation
                    result.add(rec);
                }
            }
            return result;
        }
        
        public sObject[] getRecords(executorConfigPart ePart) {
            sObject[] allRecords;
            if (ePart.typeOf == executorType.ROOTVALIDATION || ePart.typeOf == executorType.VALIDATION) {
            	allRecords = ePart.typeOf == executorType.ROOTVALIDATION
                    ? new sObject[]{this.rootRecord} 
                	: this.relatedData;
            }
            if (ePart.typeOf == executorType.EXECUTION) {
                //allRecords = this.orcReq.records;
            }
            return allRecords;
        }
    }
    
    public class executorConfigPart {
        public string className;
        public boolean isActive;
        public boolean isDebug; // if true need to add debug information
        public executorType typeOf; // validation, rootValidation, execution
        
	    public string onFail; // WARN  ...
        public string[] listOfFieldsToPass;
        public string errorTemplate;
    }
    
    public class orchestratorConfigPart {
        public orchestratorEmailConfigPart email;
    }
    
    public class orchestratorEmailConfigPart {
    	public boolean isActive;
        public string emailTemplate;
        public string[] recipients;
    }
    
    
    public class orchestratorRequest {
        public Id rootRecordId;
        public Id[] relatedRecordIds;
        public map<string, object> additionalParameters;
        public string initialField;
        public sObject[] records;
        
        public boolean isFirstChunk;
        public boolean isLastChunk;
    }
    
    public enum executorType {
		VALIDATION,
		ROOTVALIDATION,
		EXECUTION
	}
    
    public class validationResult {
        public validationResultCode code;
        public object[] dynamicValues; //  Need for errorMessage representation
    }
    
    public enum validationResultCode {
        OK,
        ERR,
        WARN
    }
    
    public class orchestratorResponse {
         @AuraEnabled
        public integer invalidCount = 0;
         @AuraEnabled
        public integer recordsCount;
    }
    
    private static string getNameField(string sObjApiName) {
        if (sObjApiName == null) return '';
         map<string, string> exceptionsName = new map<string, string>{
        	'Case' => 'CaseNumber'
    	};
        if (exceptionsName.containsKey(SObjAPIName)) {
                return exceptionsName.get(SObjAPIName);
        } else {
            return 'Name';
        }
    }
}