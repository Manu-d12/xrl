global with sharing class infrastructure {
	private static id recordId;
	private static boolean isAdminAccess = false;
    
    global abstract class handler {
        global abstract object execute(map < string, object > data);
    }

	@AuraEnabled(Cacheable = false)
	global static map < string, object > dispatcherAura(string cmd, map < string, object > data) {
		map < string, object > result = new map < string, object > { 'cmd' => cmd };
		object resultMethod;

		recordId = (string) data.get('recordId');
		try {

			list < PermissionSetAssignment > permission = [SELECT Id FROM PermissionSetAssignment WHERE AssigneeId =: UserInfo.getUserId() AND PermissionSet.Name = 'XRL_Admin'];
			if (permission.size() != 0) isAdminAccess = true;

			switch on cmd {
				when 'getConfig' {
					resultMethod = getConfig(data);
				}
				when 'getConfigById' {
					resultMethod = getConfigById(data);
				}
				when 'getConfigByUniqueName'{
					resultMethod = getConfigByUniqueName(data);
				}
				when 'query' {
					resultMethod = getQuery(data);
				}
				when 'customSoql' {
					resultMethod = customSoql(data);
				}
				when 'saveListView' {
					resultMethod = saveListView(data);
				}
				when 'saveRecords' {
					resultMethod = saveRecords(data);
				}
				when 'delRecords' {
					resultMethod = delRecords(data);
				}
				when 'requestFeature' {
					resultMethod = requestFeature(data);
				}
				when 'invokeAction' {
					resultMethod = invokeAction(data);
				}
				when 'getCustomLabels' {
					resultMethod = getCustomLabels();
				}
				when 'objectList' {
					resultMethod = objectList();
				}
				when 'objectFieldList' {
					resultMethod = objectFieldList(data);
				}
				when 'deleteConfig' {
					resultMethod = deleteConfig(data);
				}				
				when
				else {
					//throw new core.appException(null, core.appLabels.get('errCmd'), core.ExceptionType.API);
				}
			}
		} catch (exception e) {
		    string stackTrace = e.getStackTraceString();
			string apexCode;
			if (stackTrace!=null && stackTrace.indexOf('Class')>-1){
			  string[] className = stackTrace.substringBetween('Class.',':').split('\\.'); //Class.TTNAMESPACE.infrastructure.saveRecords:
			  string lineNumber = stackTrace.substringBetween('line ',',');
              if (!String.isEmpty(className[1])&& !string.isEmpty(lineNumber)) {
                ApexClass[] a = [SELECT Body FROM ApexClass WHERE Name =: className[1] AND NameSpacePrefix =: className[0] LIMIT 1];
                if (a.size()>0) {
					string[] codeLines = a[0].Body.split('\n');
					apexCode = codeLines.size() >= integer.valueOf(lineNumber) ? codeLines[integer.valueOf(lineNumber) - 1] : null;
				}
              }
			}
            
			result.put('exception', new map < string, object > {
				'title' => 'EXCEPTION',
				'message' => e.getMessage(),
				'debugMessage' => stackTrace,
                'apexCode' => apexCode,
                'input' => data
			});
		}
		result.put(cmd + 'Result', resultMethod);

		User userDetails = [SELECT Id, Name, Profile.Name, UserRole.Name FROM User where Id =: userinfo.getUserId()];
		list < PermissionSetAssignment > permissionSets = [SELECT Id, PermissionSet.Name FROM PermissionSetAssignment WHERE AssigneeId =: UserInfo.getUserId()];
		List < Group > publicGroups = getGroupsForUser(userinfo.getUserId());
		System.debug(publicGroups);

		result.put('userInfo', new map < string, object > {
			'id'=> userinfo.getUserId(),
			'name'=> userDetails.Name,
			'timezone'=>UserInfo.getTimeZone().getID(),
			'locale' => userInfo.getLocale().replaceAll('_', '-').replace('-EURO', ''),
			'isAdminAccess' => isAdminAccess,
			'profileName' => userDetails.Profile.Name,
			'roleName' => userDetails.UserRole.Name,
			'publicGroups' => publicGroups,
			'permissionSets' => permissionSets
		});
		//result.put('log', log);
		return result;
	}

	private static object getQuery(map < string, object > data) {
		map < string, object > result = new map < string, object > ();
		string sObjApiName = (string) data.get('sObjApiName');
		string relField = (string) data.get('relField');
		string addCondition = (string) data.get('addCondition');
		string orderBy = (string) data.get('orderBy');
		string limitCondition = (string) data.get('limit');
		string listViewName = (string) data.get('listViewName');
		string SQL = (string) data.get('SQL');
		boolean isCreateble = Schema.getGlobalDescribe().get(sObjApiName).getDescribe().isCreateable();

		boolean isNeedDescribe = (boolean) data.get('isNeedDescribe') == true;
		set < string > fields = (set < string > ) JSON.deserialize(JSON.serialize(data.get('fields')), set < string > .class);

		set < string > soqlFields = new set < string > { 'Id' };

		soqlFields.addAll(fields);

		if (string.isBlank(addCondition)) addCondition = '';

		result.putAll(getDescribeData(isNeedDescribe,sObjApiName));

		if (UserInfo.isMultiCurrencyOrganization() && isCreateble) {
			System.debug('Multi Currency');
			soqlFields.add('CurrencyIsoCode');
		}

		// SELECT {fields} FROM {sObjApiName} WHERE {relField}=\'{recordId}\' {addCondition}
		string SOQL = 'SELECT {fields} FROM {sObjApiName}';
		SOQL = SOQL.replaceAll('\\{fields\\}', soqlFields != null ? string.join(new list < string > (soqlFields), ',') : '');
		SOQL = SOQL.replaceAll('\\{sObjApiName\\}', sObjApiName != null ? sObjApiName : '');
		if (String.isNotBlank(relField) && String.isNotBlank(recordId)) {
			SOQL += ' WHERE {relField}=\'{recordId}\' '.replaceAll('\\{relField\\}', relField).replaceAll('\\{recordId\\}', recordId) ;
		}
		if (String.isNotBlank(addCondition)) {
			SOQL += String.isNotBlank(relField) && String.isNotBlank(recordId) ? addCondition : ' WHERE ' + addCondition.trim().removeStart('AND');
		}
		SOQL += String.isNotBlank(orderBy) ? ' ' + orderBy : '';
		SOQL += String.isNotBlank(limitCondition) ? ' ' + limitCondition : '';

		//if (string.isBlank(SOQL)) throw new core.appException(null, string.format(core.appLabels.get('errCmdParams'), new string[]{'executeAnon','apexCode'}), core.ExceptionType.API);
		system.debug(LoggingLevel.Error, 'SOQL ' + SOQL);

		result.put('SOQL', SOQL);
		system.debug('Heap size is ' + limits.getHeapSize() + ' enforced is ' + limits.getLimitHeapSize());
		sObject[] records = database.query(SOQL);
		system.debug('Heap size is ' + limits.getHeapSize() + ' enforced is ' + limits.getLimitHeapSize());
		/*
		SObjectAccessDecision decision = Security.stripInaccessible(AccessType.READABLE, records);
		// Throw an exception if any data was stripped
		if (!decision.getModifiedIndexes().isEmpty()) {
			throw new InfrastructureException(null,'Data was stripped', Infrastructure.exceptionType.GENERAL);
		}
		*/
		if (!Security.stripInaccessible(AccessType.READABLE, records).getModifiedIndexes().isEmpty()) {
			throw new InfrastructureException(null,'Data was stripped', Infrastructure.exceptionType.GENERAL);
		}

		result.put('records', records);

		//result.put('config', getConfig(sObjApiName, relField, listViewName));
		return result;
		//https://salesforce.stackexchange.com/questions/116688/lightning-get-sobject-tab-icon
	}
	private static object customSoql(map < string, object > data) {
		string SOQL = (string) data.get('SOQL');
		string sObjApiName = (string) data.get('sObjApiName');
		boolean isNeedDescribe = true;
		map < string, object > result = new map < string, object > ();
		result.put('SOQL', SOQL);

		result.putAll(getDescribeData(isNeedDescribe,sObjApiName));

		sObject[] records = database.query(SOQL);
		SObjectAccessDecision decision = Security.stripInaccessible(AccessType.READABLE, records);

		// Throw an exception if any data was stripped
		if (!decision.getModifiedIndexes().isEmpty()) {
			throw new InfrastructureException(null,'Data was stripped', Infrastructure.exceptionType.GENERAL);
		}
		result.put('records', records);
		return result;
	}

	private static map < string, object > getConfig(map < string, object > data) {
		string sObjApiName = (string) data.get('sObjApiName');
		string relField = (string) data.get('relField');
		string listViewName = (string) data.get('listViewName');
		boolean isNeedDescribe = true;

		map < string, object > result = new map < string, object > {};

		list < map < string, object >> listViews = new list < map < string, object >> {};
		List<String> extIds = new List<String>();

		extRelListConfig__c[] lst = [SELECT Id, JSON__c, listViewName__c, listViewLabel__c, isAdminConfig__c, CreatedBy.Name FROM extRelListConfig__c WHERE sObjApiName__c =: sObjApiName AND relFieldApiName__c =: relField AND Is_Active__c = TRUE ORDER BY isAdminConfig__c DESC, listViewName__c ASC LIMIT 20];
		for (integer i = 0; i < lst.size(); i++) {
			extRelListConfig__c item = lst[i];
			extIds.add(item.Id);
			map < string, object > view = new map < string, object > {
				'id' => item.Id,
				'name' => item.listViewName__c,
				'label' => item.listViewLabel__c,
				'isAdminConfig' => item.isAdminConfig__c,
				'createdBy' => item.CreatedBy.Name
			};
			if (item.listViewName__c == listViewName || string.isEmpty(listViewName) || (i == lst.size() - 1 && result.get('userConfig') == null)) {
				view.put('isUserConfig', true);
				result.put('userConfig', item.JSON__c);
			}
			if (item.isAdminConfig__c) result.put('baseConfig', item.JSON__c);
			listViews.add(view);
		}
		result.putAll(getOtherConfigInfo(isNeedDescribe,sObjApiName));
		Map<Id, UserRecordAccess> extRecordAccess = new Map<Id, UserRecordAccess>([SELECT RecordId, HasEditAccess FROM UserRecordAccess WHERE UserId = :UserInfo.getUserId() AND RecordId IN :extIds]);
		for(map < string, object > singleView : listViews){
			singleView.put('hasEditAccess', (extRecordAccess.get((string) singleView.get('id'))).get('HasEditAccess'));
		}
		result.put('listViews', listViews);
		result.put('iconMap', retrieveIconForObject(sObjApiName));

		return result;
	}
	private static map < string, object > getConfigById(map < string, object > data) {
		string configId = (string) data.get('configId');
		string sObjApiName = (string) data.get('sObjApiName');
		boolean isNeedDescribe = true;

		map < string, object > result = new map < string, object > {};

		list < map < string, object >> listViews = new list < map < string, object >> {};

		extRelListConfig__c[] lst = [SELECT Id, JSON__c, listViewName__c, listViewLabel__c, isAdminConfig__c, sObjApiName__c, relFieldApiName__c, configType__c FROM extRelListConfig__c WHERE Id =: configId LIMIT 20];
		for (integer i = 0; i < lst.size(); i++) {
			extRelListConfig__c item = lst[i];
			map < string, object > view = new map < string, object > {
				'name' => item.listViewName__c,
				'label' => item.listViewLabel__c,
				'isAdminConfig' => item.isAdminConfig__c,
				'sObjApiName' => item.sObjApiName__c,
				'relField' => item.relFieldApiName__c,
				'configType' => item.configType__c
			};
			view.put('isUserConfig', true);
			result.put('userConfig', item.JSON__c);
			if (item.isAdminConfig__c) result.put('baseConfig', item.JSON__c);
			listViews.add(view);
		}
		result.put('listViews', listViews);
		result.putAll(getOtherConfigInfo(isNeedDescribe,sObjApiName));

		return result;
	}
	private static map < string, object > getConfigByUniqueName(map < string, object > data) {
		string uniqueName = (string) data.get('uniqueName');
		string sObjApiName = (string) data.get('sObjApiName');
		boolean isNeedDescribe = true;

		map < string, object > result = new map < string, object > {};

		list < map < string, object >> listViews = new list < map < string, object >> {};

		extRelListConfig__c[] lst = [SELECT Id, JSON__c, listViewName__c, listViewLabel__c, isAdminConfig__c, sObjApiName__c, relFieldApiName__c, configType__c FROM extRelListConfig__c WHERE uniqKey__c =: uniqueName LIMIT 20];
		for (integer i = 0; i < lst.size(); i++) {
			extRelListConfig__c item = lst[i];
			map < string, object > view = new map < string, object > {
				'name' => item.listViewName__c,
				'label' => item.listViewLabel__c,
				'isAdminConfig' => item.isAdminConfig__c,
				'sObjApiName' => item.sObjApiName__c,
				'relField' => item.relFieldApiName__c,
				'configType' => item.configType__c
			};
			view.put('isUserConfig', true);
			result.put('userConfig', item.JSON__c);
			if (item.isAdminConfig__c) result.put('baseConfig', item.JSON__c);
			listViews.add(view);
		}
		result.put('listViews', listViews);
		result.putAll(getOtherConfigInfo(isNeedDescribe,sObjApiName));

		return result;
	}
	private static Map<String,Object> getOtherConfigInfo(Boolean isNeedDescribe ,String sObjApiName){
		Map<String,Object> result = new Map<String,Object>();
		result.putAll(getDescribeData(isNeedDescribe, sObjApiName));
		result.put('currency', new map < string, object > {
			'orgCurrency' => UserInfo.getDefaultCurrency(),
			'isMultyCurrencyOrg' => UserInfo.isMultiCurrencyOrganization()
		});
		result.put('Financial', getFiscalData());
		return result;
	}
	private static Map<String,Object> getDescribeData(Boolean isNeedDescribe ,String sObjApiName) {
		Map<String,Object> result = new Map<String,Object>();
		if (isNeedDescribe == true && sObjApiName != null) {
			map < string, Schema.DescribeFieldResult > describeResult = new map < string, Schema.DescribeFieldResult > ();
			map < String, Schema.SObjectField > fieldsMap = Schema.getGlobalDescribe().get(sObjApiName).getDescribe().fields.getMap();
			for (string fItem: fieldsMap.keySet()) {
				Schema.DescribeFieldResult tmp = fieldsMap.get(fItem).getDescribe();
				describeResult.put(tmp.getName(), tmp);
			}
			result.put('describeSObject',JSON.serialize(Schema.getGlobalDescribe().get(sObjApiName).getDescribe()));
			result.put('describe', JSON.serialize(describeResult));
		}
		return result;
	}
	private static object deleteConfig(map < string, object > data) {
		string configId = (string) data.get('configId');

		map < string, object > result = new map < string, object > ();

		try{
			delete [SELECT Id FROM extRelListConfig__c WHERE Id= :configId];
			result.put('status','Success');
		}catch(DmlException e){
			result.put('status',e.getMessage());
		}
		return result;
	}

	private static object saveListView(map < string, object > data) {
		string listViewName = (string) data.get('listViewName');
		string listViewLabel = (string) data.get('listViewLabel');
		boolean listViewAdmin = (boolean) data.get('listViewAdmin');
		string sObjApiName = (string) data.get('sObjApiName');
		string relField = (string) data.get('relField');
		string config = (string) data.get('config');
		string configType = (string) data.get('configType');

		listViewName = string.isBlank(listViewName) ?
			(isAdminAccess ? '_admin' : null) :
			listViewName;
		listViewLabel = string.isBlank(listViewLabel) ?
			(isAdminAccess ? 'Admin' : null) :
			listViewLabel;
		boolean isAdminConf = listViewName == '_admin' ? isAdminAccess : listViewAdmin;

		if(listViewName.equals('_admin')){
			delete [select Id from extRelListConfig__c where listViewName__c = '_admin'];
		}
		if(listViewName.equals('_default')){
			delete [select Id from extRelListConfig__c where listViewName__c = '_default'];
		}

		extRelListConfig__c listView = new extRelListConfig__c(
			listViewName__c = listViewName,
			listViewLabel__c = listViewLabel,
			sObjApiName__c = sObjApiName,
			relFieldApiName__c = relField,
			isAdminConfig__c = isAdminConf,
			JSON__c = config,
			ConfigType__c = String.isNotBlank(configType) ? configType : 'XRL',
			uniqKey__c = sObjApiName + ':' + relField + ':' + isAdminConf + ':' + (string.isBlank(listViewName) ? '' : listViewName)
		);

		upsert listView uniqKey__c;

		//sharing _admin/_default record with all org users
		if(listViewName.equals('_admin') || listViewName.equals('_default')){
			shareRecord(listView.Id);
		}

		return data;
	}
	private static boolean shareRecord(Id recordId){
		List<extRelListConfig__Share> shrObj = new List<extRelListConfig__Share>();

		for(User u:  [SELECT Id,name,ProfileId,IsActive,UserType FROM User WHERE Profile.UserLicense.Name != null AND Id != :UserInfo.getUserId() AND UserType NOT IN ('Guest','CsnOnly','AutomatedProcess','CspLitePortal','CloudIntegrationUser')] ){
			extRelListConfig__Share jobShr  = new extRelListConfig__Share();

			jobShr.ParentId = recordId;
			jobShr.UserOrGroupId = u.Id;
			jobShr.AccessLevel = 'edit';
			jobShr.RowCause = Schema.extRelListConfig__Share.RowCause.Manual;
			shrObj.add(jobShr);
		}
		  
		insert shrObj;
  
		return true;
	 }

	private static object saveRecords(map < string, object > data) {
		//https://developer.salesforce.com/docs/atlas.en-us.apexref.meta/apexref/apex_class_System_Security.htm#apex_System_Security_stripInaccessible
		string sObjApiName = (string) data.get('sObjApiName');
		boolean isRollback = (boolean) data.get('rollback') == true;
		boolean isInsert = (boolean) data.get('isInsert') == true;
		Type T = type.forName('list<' + sObjApiName + '>');
		
		/*This part only for security review. Please don't remove
		SObjectAccessDecision decision = Security.stripInaccessible(AccessType.UPDATABLE,records);

		// Throw an exception if any data was stripped
		if (!decision.getModifiedIndexes().isEmpty()) {
			System.debug(decision.getRemovedFields()); // Prints "Rating"
			System.debug(decision.getModifiedIndexes()); // Prints "1"
			throw new InfrastructureException(null,'Records can\'t be updated.', Infrastructure.exceptionType.GENERAL);
		}
		//update securityDecision.getRecords() update records that can be updated
		*/
        if (data.get('beforeSaveAction') != null) {
			system.debug(LoggingLevel.Error, 'APEX INVOCATION ' + (string) data.get('beforeSaveAction'));
            invokeApex((string) data.get('beforeSaveAction'), data);
			system.debug(LoggingLevel.Error, 'APEX INVOCATION END ' + (string) data.get('beforeSaveAction'));
        }
        sObject[] records = (sObject[]) JSON.deserialize(JSON.serialize(data.get('records')), T);
		// Savepoint sp = Database.setSavepoint();
		system.debug('RollBack ' + isRollback);
 
		List<Database.SaveResult> srs = (isInsert == true) ? Database.insert(records, isRollback) : Database.update(records, isRollback); 
		for (Database.SaveResult sr : srs) {
			if (!sr.isSuccess()) {
				String error = '';
				for (Database.Error err : sr.getErrors()) {
					// if(isRollback == true)
					// 	Database.rollback(sp);
					throw new InfrastructureException(null,String.valueOf(err.getStatusCode()) + ': ' + err.getMessage() , Infrastructure.exceptionType.GENERAL);
				}
			}
		}
		// update records;
		return records;
	}

	private static object delRecords(map < string, object > data) {
		string sObjApiName = (string) data.get('sObjApiName');
		Type T = type.forName('list<' + sObjApiName + '>');
		sObject[] records = (sObject[]) JSON.deserialize(JSON.serialize(data.get('records')), T);

		map < string, object > result = new map < string, object > ();
		Savepoint sp = Database.setSavepoint();
		try { 
			delete records;
			result.put('success', 'Success');
			result.put('length',records.size());
			result.put('error', 'Success: The following exception has occurred: ');
		} catch(DmlException e) {
			Database.rollback(sp);
			System.debug('The following exception has occurred: ' + e.getMessage());
			result.put('error', 'Error: The following exception has occurred: ' + e.getMessage());
		}
		return result;
	}

	private static object requestFeature(map < string, object > data) {
		string text = (string) data.get('text');
		UserLicense license = [SELECT TotalLicenses, UsedLicenses FROM UserLicense WHERE Name = 'Salesforce'
			LIMIT 1];

		Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
		email.setToAddresses(new string[] { 'polina.sorokina@stratavar.com' });
		email.setSubject('Feature is requested');
		email.setHtmlBody(
			'<p>OrgId: ' + UserInfo.getOrganizationId() + '<br>' +
			'OrgName: ' + UserInfo.getOrganizationName() + '<br>' +
			'UserName: ' + UserInfo.getUserName() + '<br>' +
			'Name of the user: ' + UserInfo.getName() + '<br>' +
			'Salesforce licenses: ' + license.UsedLicenses + '/' + license.TotalLicenses + '<br>' +
			'Date: ' + Date.today() + '</p><br>' +
			'<p>' + text + '</p>'
		);
		Messaging.SendEmailResult[] sendRes = Messaging.sendEmail(new Messaging.SingleEmailMessage[] { email });

		map < string, object > result = new map < string, object > ();
		result.put('isSuccess', sendRes[0].isSuccess());
		if (!sendRes[0].isSuccess()) {
			string error = '';
			for (Messaging.SendEmailError err: sendRes[0].getErrors()) {
				error += err.getStatusCode() + ': ' + err.getMessage() + ' [' + err.getFields() + '].';
			}
			result.put('error', error);
		}
		return result;
	}

	private static object invokeAction(map < string, object > data) {
		string name = (string) data.get('name');
		list < object > recordIdList = (list < object > ) data.get('recordIdList');

		map < string, object > params = new map < string, object > ();
		if (recordIdList != null) params.put('recordIdList', recordIdList);

		Flow.Interview flow = Flow.Interview.createInterview(name, params);
		flow.start();
		String result = (String) flow.getVariableValue('result');

		return result;
	}
	private static map < string, string > getCustomLabels() {
		return new map < string, string > {
			'altTxt_collapse' => label.altTxt_collapse,
			'altTxt_clearInput' => label.altTxt_clearInput,
			'altTxt_delete' => label.altTxt_delete,
			'altTxt_dynamic' => label.altTxt_dynamic,
			'altTxt_export' => label.altTxt_export,
			'altTxt_expand' => label.altTxt_expand,
			'altTxt_editColumn' => label.altTxt_editColumn,
			'altTxt_loading' => label.altTxt_loading,
			'altTxt_refreshListView' => label.altTxt_refreshListView,
			'altTxt_requestAFeature' => label.altTxt_requestAFeature,
			'altTxt_settings' => label.altTxt_settings,
			'altTxt_save' => label.altTxt_save,
			'altTxt_saveFilter' => label.altTxt_saveFilter,
			'altTxt_new'=>label.altTxt_new,
			'altTxt_expandView'=>label.altTxt_expandView,
			'altTxt_locked'=>label.altTxt_locked,
			'altTxt_resetFilters'=>label.altTxt_resetFilters,
			'errMsg_recordsNotFound' => label.errMsg_recordsNotFound,
			'errMsg_wrapableAndClipableCanNotBeSelectedTogether' => label.errMsg_wrapableAndClipableCanNotBeSelectedTogether,
			'errMsg_anEmptyMsgCannotBeSent' => label.errMsg_anEmptyMsgCannotBeSent,
			'hlpTxt_additionalConditionText' => label.hlpTxt_additionalConditionText,
			'hlpTxt_selectYourPreferredFields' => label.hlpTxt_selectYourPreferredFields,
			'hlpTxt_selectYourLockedFields' => label.hlpTxt_selectYourLockedFields,
			'hlpTxt_selectFields' => label.hlpTxt_selectFields,
			'hlpTxt_selectedFields'=>label.hlpTxt_selectedFields,
			'hlpTxt_applyCondition'=> label.hlpTxt_applyCondition,
			'hlpTxt_applyConditionGetStartedText'=>label.hlpTxt_applyConditionGetStartedText,
			'hlpTxt_availableOperationTooltip'=>label.hlpTxt_availableOperationTooltip,
			'hlpTxt_applyConditionInput'=> label.hlpTxt_applyConditionInput,
			'hlpTxt_appliedConditions'=>label.hlpTxt_appliedConditions,
			'hlpTxt_appliedConditionsActionsHelp'=>label.hlpTxt_appliedConditionsActionsHelp,
			'hlpTxt_applyOrdering'=>label.hlpTxt_applyOrdering,
			'hlpTxt_appliedOrderings'=>label.hlpTxt_appliedOrderings,
			'lbl_additionalConditionForWhereClause' => label.lbl_additionalConditionForWhereClause,
			'lbl_chooseField' => label.lbl_chooseField,
			'lbl_cancel' => label.lbl_cancel,
			'lbl_chooseOperation' => label.lbl_chooseOperation,
			'lbl_enterListViewName' => label.lbl_enterListViewName,
			'lbl_enterListViewLabel' => label.lbl_enterListViewLabel,
			'lbl_fieldSelection' => label.lbl_fieldSelection,
			'lbl_fieldSettings' => label.lbl_fieldSettings,
			'lbl_globalSearch' => label.lbl_globalSearch,
			'lbl_lockedFields' => label.lbl_lockedFields,
			'lbl_tableSettings' => label.lbl_tableSettings,
			'lbl_typeHere' => label.lbl_typeHere,
			'lbl_selected' => label.lbl_selected,
			'lbl_selectFields' => label.lbl_selectFields,
			'lbl_selectLockedFields' => label.lbl_selectLockedFields,
			'lbl_save' => label.lbl_save,
			'lbl_saveAs' => label.lbl_saveAs,
			'lbl_pleaseDescribeFeature' => label.lbl_pleaseDescribeFeature,
			'lbl_showNumeration' => label.lbl_showNumeration,
			'lbl_showCheckBoxes' => label.lbl_showCheckBoxes,
			'lbl_enableGlobalSearch' => label.lbl_enableGlobalSearch,
			'lbl_enableTopPagination' => label.lbl_enableTopPagination,
			'lbl_enableBottomPagination' => label.lbl_enableBottomPagination,
			'lbl_showStandardEdit' => label.lbl_showStandardEdit,
			'lbl_chunkSizeForSave' => label.lbl_chunkSizeForSave,
			'lbl_listSizeOptionsDropdown' => label.lbl_listSizeOptionsDropdown,
			'lbl_rowCss' => label.lbl_rowCss,
			'lbl_fieldApiName' => label.lbl_fieldApiName,
			'lbl_fieldLabel' => label.lbl_fieldLabel,
			'lbl_customFunctionForFormatting' => label.lbl_customFunctionForFormatting,
			'lbl_customFunctionExample' => label.lbl_customFunctionExample,
			'lbl_customFunctionForStyle' => label.lbl_customFunctionForStyle,
			'lbl_customFunctionStyleExample' => label.lbl_customFunctionStyleExample,
			'lbl_isColumnHidden' => label.lbl_isColumnHidden,
			'lbl_isColumnFilterable' => label.lbl_isColumnFilterable,
			'lbl_isColumnSortable' => label.lbl_isColumnSortable,
			'lbl_isColumnEditable' => label.lbl_isColumnEditable,
			'lbl_isColumnWrapable' => label.lbl_isColumnWrapable,
			'lbl_width' => label.lbl_width,
			'lbl_selectFieldsForServerFilter' => label.lbl_selectFieldsForServerFilter,
			'lbl_more' => label.lbl_more,
			'lbl_apply' => label.lbl_apply,
			'lbl_help' => label.lbl_help,
			'lbl_ascending' => label.lbl_ascending,
			'lbl_descending' => label.lbl_descending,
			'lbl_beginning' => label.lbl_beginning,
			'lbl_end' => label.lbl_end,
			'lbl_maxLevelReached' => label.lbl_maxLevelReached,
			'lbl_availableFieldsFrom' => label.lbl_availableFieldsFrom,
			'lbl_enterSearchTermHere' => label.lbl_enterSearchTermHere,
			'lbl_back' => label.lbl_back,
			'lbl_selectedFields' => label.lbl_selectedFields,		
			'lbl_appliedConditions' => label.lbl_appliedConditions,
			'lbl_slNo' => label.lbl_slNo,
			'lbl_fieldName' => label.lbl_fieldName,
			'lbl_operator' => label.lbl_operator,
			'lbl_value' => label.lbl_value,
			'lbl_actions' => label.lbl_actions,
			'lbl_conditionFilteringPattern' => label.lbl_conditionFilteringPattern,
			'lbl_configure' => label.lbl_configure,
			'lbl_availableOperations'=>label.lbl_availableOperations,
			'lbl_selectSortOrder' => label.lbl_selectSortOrder,
			'lbl_selectEmptyFieldLocation' => label.lbl_selectEmptyFieldLocation,
			'lbl_addOrdering' => label.lbl_addOrdering,
			'lbl_appliedOrderings' => label.lbl_appliedOrderings,
			'lbl_liveQuery' => label.lbl_liveQuery,
			'lbl_addCondition' => label.lbl_addCondition,
			'lbl_enterValue' => label.lbl_enterValue,
			'lbl_applyOrdering' => label.lbl_applyOrdering,
			'lbl_applyConditions' => label.lbl_applyConditions,
			'lbl_isEqual' => label.lbl_isEqual,
			'lbl_isNotEqual' => label.lbl_isNotEqual,
			'lbl_isEmpty' => label.lbl_isEmpty,
			'lbl_isNotEmpty' => label.lbl_isNotEmpty,
			'lbl_greater' => label.lbl_greater,
			'lbl_greaterOrEqual' => label.lbl_greaterOrEqual,
			'lbl_less' => label.lbl_less,
			'lbl_lessOrEqual' => label.lbl_lessOrEqual,
			'lbl_range' => label.lbl_range,
			'lbl_contains' => label.lbl_contains,
			'lbl_doesNotContains' => label.lbl_doesNotContains,
			'lbl_beginsWith' => label.lbl_beginsWith,
			'lbl_doesNotBeginsWith' => label.lbl_doesNotBeginsWith,
			'lbl_endsWith' => label.lbl_endsWith,
			'lbl_doesNotEndsWith' => label.lbl_doesNotEndsWith,
			'lbl_confirmDelete'=>label.lbl_confirmDelete,
			'lbl_beforeSaveValidation'=>label.lbl_beforeSaveValidation,
			'lbl_deleteChunkSize'=>label.lbl_deleteChunkSize,
			'lbl_beforeDeleteValidation'=>label.lbl_beforeDeleteValidation,
			'lbl_actionId' => label.lbl_actionId,
			'lbl_actionLabel' => label.lbl_actionLabel,
			'lbl_actionTip' => label.lbl_actionTip,
			'lbl_actionCallback'=> label.lbl_actionCallback,
			'lbl_actionIsHidden' => label.lbl_actionIsHidden,
			'lbl_actionIconName' => label.lbl_actionIconName,
			'lbl_actionOrder'=> label.lbl_actionOrder,
			'lbl_actionFlowName' => label.lbl_actionFlowName,
			'lbl_columnFilter'=>label.lbl_columnFilter,
			'lbl_deleteNoRecordSelectedError'=>label.lbl_deleteNoRecordSelectedError,
			'lbl_actionVisibleOnRecords'=>label.lbl_actionVisibleOnRecords,
			'lbl_beforeSaveApexAction'=>label.lbl_beforeSaveApexAction,
			'lbl_items'=>label.lbl_items,
			'lbl_actionWithThisOrderAlreadyExists'=>label.lbl_actionWithThisOrderAlreadyExists,
			'lbl_conditionAlreadyExists'=>label.lbl_conditionAlreadyExists,
			'lbl_groupingFunction'=>label.lbl_groupingFunction,
			'lbl_groupFieldName'=>label.lbl_groupFieldName,
			'lbl_groupOrder'=>label.lbl_groupOrder,
			'lbl_resetFilters'=>label.lbl_resetFilters,
			'lbl_blankValuesNotAllowed'=>label.lbl_blankValuesNotAllowed,
			'lbl_collapseView'=>label.lbl_collapseView,
			'msg_enterUniqueActionId'=>label.msg_enterUniqueActionId,
			'msg_lisViewWasUpdated' => label.msg_lisViewWasUpdated,
			'msg_requestWasSent' => label.msg_requestWasSent,
			'msg_deleteConfirm1'=>label.msg_deleteConfirm1,
			'msg_deleteConfirm2'=>label.msg_deleteConfirm2,
			'msg_rowDblClickError'=>label.msg_rowDblClickError,
			'msg_itemsUpdated'=>label.msg_itemsUpdated,
			'msg_actionHideError'=>label.msg_actionHideError,
			'msg_actionVisibleOnRecordSelectionError'=>label.msg_actionVisibleOnRecordSelectionError,
			'msg_noListViewFound'=>label.msg_noListViewFound,
			'msg_confirmConfigDelete'=>label.msg_confirmConfigDelete,
			'msg_successfullyDeleted'=>label.msg_successfullyDeleted,
			'msg_recordSelection'=>label.msg_recordSelection,
			'msg_invalidInputSqlBuilderConditionFormat'=>label.msg_invalidInputSqlBuilderConditionFormat,
			'msg_unsaveRecordsCannotPerformOtherAction'=>label.msg_unsaveRecordsCannotPerformOtherAction,
			'msg_youCantaddMoreThan20Fields'=>label.msg_youCantaddMoreThan20Fields,
			'msg_noOperationAvailable'=>label.msg_noOperationAvailable,
			'msg_deleteCustomActionConfirmation'=>label.msg_deleteCustomActionConfirmation,
			'msg_noCustomActionConfigured'=>label.msg_noCustomActionConfigured,
			'msg_cannotKeepThisBlank'=>label.msg_cannotKeepThisBlank,
			'placeHolder_beforeSaveValidation'=>label.placeHolder_beforeSaveValidation,
			'placeHolder_beforeDeleteValidation'=>label.placeHolder_beforeDeleteValidation,
			'placeholder_actionCallback'=> label.placeholder_actionCallback,
			'placeHolder_rowCss'=> label.placeHolder_rowCss,
			'title_close' => label.title_close,
			'title_clear' => label.title_clear,
			'title_collapse' => label.title_collapse,
			'title_delete' => label.title_delete,
			'title_export' => label.title_export,
			'title_expand' => label.title_expand,
			'title_editColumn' => label.title_editColumn,
			'title_new' => label.title_new,
			'title_requestAFeature' => label.title_requestAFeature,
			'title_refresh' => label.title_refresh,
			'title_saveFilter' => label.title_saveFilter,
			'title_sortColumn' => label.title_sortColumn,
			'title_saveSelectedFields' => label.title_saveSelectedFields,
			'title_youCanDefineAllParametersForFields' => label.title_youCanDefineAllParametersForFields,
			'title_youCanDefineAllGeneralTableParameters' => label.title_youCanDefineAllGeneralTableParameters,
			'title_listViewConfiguration' => label.title_listViewConfiguration,
			'title_selectFieldToDisplay' => label.title_selectFieldToDisplay,
			'title_reqAFeature' => label.title_reqAFeature,
			'title_addConditionBtn'=>label.title_addConditionBtn,
			'title_appliedConditionsActionEdit'=>label.title_appliedConditionsActionEdit,
			'title_appliedConditionsActionDelete'=>label.title_appliedConditionsActionDelete,
			'title_addOrdering'=>label.title_addOrdering,
			'title_selectListView'=>label.title_selectListView,
			'title_newRecord'=>label.title_newRecord,
			'title_newListView'=>label.title_newListView,
			'title_expandView'=>label.title_expandView,
			'title_resetFilters'=>label.title_resetFilters,
			'title_deleteCustomAction'=>label.title_deleteCustomAction,
			'tooltip_addNumerationColumnToTable' => label.tooltip_addNumerationColumnToTable,
			'tooltip_addCheckBoxColumnToTable' => label.tooltip_addCheckBoxColumnToTable,
			'tooltip_showGlobalTableSearch' => label.tooltip_showGlobalTableSearch,
			'tooltip_showTopPagination' => label.tooltip_showTopPagination,
			'tooltip_showBottomPagination' => label.tooltip_showBottomPagination,
			'tooltip_replaceInlineEditWithStandardEdit' => label.tooltip_replaceInlineEditWithStandardEdit,
			'tooltip_numbersOfRecordInChunk' => label.tooltip_numbersOfRecordInChunk,
			'tooltip_numbersOfOptionsShown' => label.tooltip_numbersOfOptionsShown,
			'tooltip_changeRowStyleByFunction' => label.tooltip_changeRowStyleByFunction,
			'tooltip_fieldApiName' => label.tooltip_fieldApiName,
			'tooltip_fieldLabel' => label.tooltip_fieldLabel,
			'tooltip_widthExample' => label.tooltip_widthExample,
			'tooltip_beforeSaveValidation'=>label.tooltip_beforeSaveValidation,
			'tooltip_deleteChunkSize'=>label.tooltip_deleteChunkSize,
			'tooltip_beforeDeleteValidation'=>label.tooltip_beforeDeleteValidation,
			'tooltip_conditionFilteringPattern'=>label.tooltip_conditionFilteringPattern,
			'tooltip_actionIdTooltip' => label.tooltip_actionIdTooltip,
			'tooltip_actionLabelTooltip' => label.tooltip_actionLabelTooltip,
			'tooltip_actionTipTooltip' => label.tooltip_actionTipTooltip,
			'tooltip_actionIsHidden'=> label.tooltip_actionIsHidden,
			'tooltip_actionIconName' => label.tooltip_actionIconName,
			'tooltip_actionOrder'=> label.tooltip_actionOrder,
			'tooltip_configSave'=>label.tooltip_configSave,
			'tooltip_configCancel'=>label.tooltip_configCancel,
			'tooltip_configShare'=>label.tooltip_configShare,
			'tooltip_configSaveAs'=>label.tooltip_configSaveAs,
			'tooltip_configSaveAsSave'=>label.tooltip_configSaveAsSave,
			'tooltip_configSaveAsCancel'=>label.tooltip_configSaveAsCancel,
			'tooltip_actionVisibleOnRecords'=>label.tooltip_actionVisibleOnRecords,
			'tooltip_beforeSaveApexAction'=>label.tooltip_beforeSaveApexAction,
			'tooltip_deleteCustomAction'=>label.tooltip_deleteCustomAction,
			'tooltip_isColumnHidden'=>label.tooltip_isColumnHidden,
			'tooltip_isColumnFilterable'=>label.tooltip_isColumnFilterable,
			'tooltip_isColumnSortable'=>label.tooltip_isColumnSortable,
			'tooltip_isColumnWrapable'=>label.tooltip_isColumnWrapable,
			'tooltip_groupingFunction'=>label.tooltip_groupingFunction,
			'tooltip_groupFieldName'=>label.tooltip_groupFieldName,
			'tooltip_groupOrder'=>label.tooltip_groupOrder,
			'srcLbl_available' => label.srcLbl_available,
			'srcLbl_optional' => label.srcLbl_optional
		};
	}

	public static Group[] getGroupsForUser(Id userId) {

		Set < Id > groupIds = getGroupsForIds(new Set < Id > { userId });
		return [SELECT Id, Name FROM Group WHERE Id IN: groupIds];

	}

	public static Set < Id > getGroupsForIds(Set < Id > userOrGroupIds) {

		Set < Id > groupIds = new Set < Id > ();
		Set < Id > nestedGroupIds = new Set < Id > ();

		list < GroupMember > records = [SELECT Id, GroupId, UserOrGroupId FROM GroupMember WHERE UserOrGroupId =: userOrGroupIds AND UserOrGroupId != null AND Group.Type = 'Regular'];

		for (GroupMember record: records) {
			if (!(record.UserOrGroupId + '').startsWith('005')) {
				nestedGroupIds.add(record.UserOrGroupId);
			}
			else {
				groupIds.add(record.GroupId);
			}
		}

		if (nestedGroupIds.size() > 0) {
			groupIds.addAll(getGroupsForIds(nestedGroupIds));
		}

		return groupIds;
	}

	/***
	 * Explores the schema of the soject passed in and finds lightning icon style and image url for sObject
	 * If nothing is found, defaults to the custom icon
	 *
	 * @param   sObjectTypeName       the sObject to find the icon for
	 * @return  Map<String,String>    Map of properties about the icon to be consumed by the front end.
	 *                                Right now, returns values for keys: iconStyle,iconURL
	 */
	private static Map < String, String > retrieveIconForObject(String sObjectName) {
		String iconStyle;
		String iconURL;
		String iconTag;
		Map < String, String > iconPropertyMap = new Map < String, String > ();
		List < Schema.DescribeTabSetResult > tabSetDesc = Schema.describeTabs();
		List < Schema.DescribeTabResult > tabDesc = new List < Schema.DescribeTabResult > ();
		List < Schema.DescribeIconResult > iconDesc = new List < Schema.DescribeIconResult > ();

		for (Schema.DescribeTabSetResult tsr: tabSetDesc) {
			tabDesc.addAll(tsr.getTabs());
		tabDesc.addAll(tsr.getTabs()); 
			tabDesc.addAll(tsr.getTabs());
		tabDesc.addAll(tsr.getTabs()); 
			tabDesc.addAll(tsr.getTabs());
		tabDesc.addAll(tsr.getTabs()); 
			tabDesc.addAll(tsr.getTabs());
		tabDesc.addAll(tsr.getTabs()); 
			tabDesc.addAll(tsr.getTabs());
		}
		for (Schema.DescribeTabResult tr: tabDesc) {
			if (sObjectName == tr.getSobjectName()) {
				system.debug(tr.getIcons());
				if (!tr.getIcons().isEmpty()) {
					iconDesc.addAll(tr.getIcons());
				} else {
					if (tr.isCustom() == true) {
						iconStyle = 'slds-icon-standard-custom';
						iconURL = '/img/icon/t4v35/standard/custom_120.png';
					} else {
						iconStyle = 'slds-icon-standard-' + sObjectName.toLowerCase();
						iconURL = '/img/icon/t4v35/standard/' + sObjectName.toLowerCase() + '_120.png';
					}
				}
			}
		}
		for (Schema.DescribeIconResult ir: iconDesc) {
			if (ir.getTheme() == 'custom' && !ir.getContentType().startsWith('image/svg')) { //custom icon thats not an svg
				iconTag = 'custom';
				iconURL = ir.getURL();
				iconStyle = 'slds-icon-standard-custom';
				break;
			} else if (ir.getWidth() == 120 && ir.getTheme() == 'theme4' && ir.getContentType() == 'image/png') { //large lightning icon image
				if (ir.getURL().contains('/custom/')) { //Icon is from the Custom Sprite
					iconTag = ir.getURL().substringBetween('custom/', '.png').substringBefore('_');
					iconURL = '/img/icon/t4v35/custom/' + iconTag + '_120.png';
					iconStyle = 'slds-icon-custom-' + iconTag;
					break;
				} else if (ir.getURL().contains('/standard/')) { //Icon is from the Standard Sprite
					iconTag = ir.getURL().substringBetween('standard/', '.png').substringBefore('_');
					iconURL = '/img/icon/t4v35/standard/' + iconTag + '_120.png';
					iconStyle = 'slds-icon-standard-' + iconTag;
					break;
				}
			}
		}
		//if no icons are found, just default to the Custom lightning icon
		if (iconStyle == null) {
			iconStyle = 'slds-icon-standard-custom';
			iconURL = '/img/icon/t4v35/standard/custom_120.png';
			iconTag = 'No Lightning Icon Found';
		}
		//return a map with our properties for the front end
		iconPropertyMap.put('iconStyle', iconStyle);
		iconPropertyMap.put('iconURL', iconURL);

		return iconPropertyMap;
	}

	private static Map<String,String> objectList() {
		Map < String, Schema.SObjectType > gd = Schema.getGlobalDescribe();

		Map<String,String>  objs = new Map<String,String> ();

		for (Schema.SObjectType thisObj: gd.values()) {
			Schema.DescribeSObjectResult objResult = thisObj.getDescribe();
			if (objResult.isQueryable()) {
				objs.put(String.valueOf(objResult.getName()),objResult.getLabel());
			}
		}
		return objs;
	}
	private static map<string, object> objectFieldList(map < string, object > data){
		string sObjApiName = (string) data.get('sObjApiName');
		map<string, object> result = new map<string, object>{};
		map < string, Schema.DescribeFieldResult > describeResult = new map < string, Schema.DescribeFieldResult > ();
		map < String, Schema.SObjectField > fieldsMap = Schema.getGlobalDescribe().get(sObjApiName).getDescribe().fields.getMap();
		for (string fItem: fieldsMap.keySet()) {
			Schema.DescribeFieldResult tmp = fieldsMap.get(fItem).getDescribe();
			describeResult.put(tmp.getName(), tmp);
		}
		result.put('describe', JSON.serialize(describeResult));
		return result;
	}
	private static Map<String, Map<String, Object>> getFiscalData(){
		Map<String, Object> result = new Map<String, Object>();

		Date dat = System.today();
		Integer yr = dat.year();

		List<Id> fiscalYearList = new List<Id>(new Map<Id, FiscalYearSettings>([
			SELECT Id FROM FiscalYearSettings 
			WHERE CALENDAR_YEAR(StartDate) IN (:(yr-1),:yr,:(yr+1))
			ORDER BY StartDate ASC
		]).keySet());

		List<Period> periods = [
			SELECT Id, StartDate, EndDate, FullyQualifiedLabel, Number, FiscalYearSettingsId 
			FROM Period 
			WHERE Type = 'Quarter' AND FiscalYearSettingsId IN :fiscalYearList 
			ORDER BY StartDate ASC
		];
		Map<String, Map<String, Object>> years = new Map<String, Map<String, Object>>{
			'prevYear' => new Map<String, Object>(),
			'currentYear' => new Map<String, Object>(),
			'nextYear' => new Map<String, Object>()
		};

		for (Integer i = 0; i < periods.size(); i++) {
			Period quarter = periods[i];
			Integer quarterNum = math.mod(i,4) + 1;

			if (fiscalYearList[0] == quarter.FiscalYearSettingsId) {
				years.get('prevYear').put('FQ' + quarter.Number, quarter);
			} else if (fiscalYearList[1] == quarter.FiscalYearSettingsId) {
				years.get('currentYear').put('FQ' + quarter.Number, quarter);
			} else {
				years.get('nextYear').put('FQ' + quarter.Number, quarter);
			}
		}
		return years;
	}
    
    private static void invokeApex(string helperType, map<string, object> data) {
		string nameSpacePrefix = (string) data.get('nameSpacePrefix');
		string[] apexHelper = helperType.split('.');
		
        string helperTypeClass = 'HLP_' + apexHelper[0];// customActions.getPackage, customActions.getPackage, customActions, Stratavar.customActions
    	
        // check class exist or not
        ApexClass[] A = [SELECT Id, NamespacePrefix FROM ApexClass WHERE Name =: helperTypeClass ORDER BY NamespacePrefix ASC NULLS FIRST LIMIT 1];
        
        if (A.size() == 0) throw new InfrastructureException(null, 'Can\'t find class {1}'.replace('{1}', helperType) + ':' + helperTypeClass, exceptionType.CLASS_NOT_FOUND);
        
        Type T = string.isEmpty(A[0].namespacePrefix) ? type.forName(helperType) : type.forName(A[0].namespacePrefix, helperType);
        if (T == null) throw new InfrastructureException(null, ('Can\'t find method {1} in class ' + helperType).replace('{1}', helperType) + ':' + helperTypeClass, exceptionType.INSTANCE_CLASS_NOT_FOUND);
                
        
        handler handlerClass = (handler) JSON.deserialize(JSON.serialize(data), T);
        handlerClass.execute(data);
    }

	global class InfrastructureException extends Exception {
		public ExceptionType eType;
		public String message;
		/**
		 *   method description
		 *
		 *   author Dmitry Rivlin
		 *   email dmitry.rivlin@stratavar.com
		 *   date: 14-10-19 09:54:06
		 *   @method InfrastructureException
		 *   @param  Exception ex, String exLogTxt, ExceptionType exType
		 *   @return
		 *
		 */
		global InfrastructureException(Exception ex, String exLogTxt, ExceptionType exType) {
			this.eType = exType;
			this.message = (ex != null) ? ex.getMessage() + ' Line: ' + ex.getLineNumber() + ' Stack: ' + ex.getStackTraceString() + exLogTxt : exLogTxt;
			system.debug(LoggingLevel.Error, 'EXCEPTION : ' + message);
			this.setMessage(message);
		}
	}

	global enum exceptionType {
		GENERAL,
		CLASS_NOT_FOUND,
		INSTANCE_CLASS_NOT_FOUND,
		COMMAND_NOT_FOUND,
		IMPLEMENTATION,
		TRANSFORM_CLASS_NOT_FOUND
	}

}