global with sharing class infrastructure {
	private static id recordId;
	private static boolean isAdminAccess = false;

	@AuraEnabled(Cacheable = false)
	global static map < string, object > dispatcherAura(string cmd, map < string, object > data) {
		map < string, object > result = new map < string, object > { 'cmd' => cmd };
		object resultMethod;

		recordId = (string) data.get('recordId');
		try {

			list < PermissionSetAssignment > permission = [SELECT Id FROM PermissionSetAssignment WHERE AssigneeId = :UserInfo.getUserId() AND PermissionSet.Name = 'XRL_Admin'];
			if (permission.size() != 0) isAdminAccess = true;

			switch on cmd {
				when 'getConfig' {
					resultMethod = getConfig(data);
				}
				when 'getTemplate' {
					resultMethod = getTemplate(data);
				}
				when 'query' {
					resultMethod = getQuery(data);
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
				when
				else {
					//throw new core.appException(null, core.appLabels.get('errCmd'), core.ExceptionType.API);
				}
			}
		} catch (exception e) {
			
			result.put('exception', new map < string, string > {
				'title' => 'EXCEPTION',
				'message' => e.getMessage() + ' : ' + e.getStackTraceString()
			});
		}
		result.put(cmd + 'Result', resultMethod);

		result.put('userInfo', new map<string, object>{
			'locale' => userInfo.getLocale().replaceAll('_','-').replace('-EURO',''),
			'isAdminAccess' => isAdminAccess
		});
		//result.put('log', log);
		return result;
	}

	private static object getQuery(map < string, object > data) {
		map<string, object> result = new map<string, object>();
		string sObjApiName = (string) data.get('sObjApiName');
		string relField = (string) data.get('relField');
		string addCondition = (string) data.get('addCondition');
		string listViewName = (string) data.get('listViewName');

		boolean isNeedDescribe = (boolean) data.get('isNeedDescribe') == true;
		set <string> fields = (set<string>) JSON.deserialize(JSON.serialize(data.get('fields')), set<string>.class);

		set < string > soqlFields = new set < string > { 'Id' };

		soqlFields.addAll(fields);

		if (string.isBlank(addCondition)) addCondition = '';

		/*if (isNeedDescribe == true) {
			map < string, Schema.DescribeFieldResult > describeResult = new map < string, Schema.DescribeFieldResult > ();
			map < String, Schema.SObjectField > fieldsMap = Schema.getGlobalDescribe().get(sObjApiName).getDescribe().fields.getMap();
			for (string fItem: fieldsMap.keySet()) {
				Schema.DescribeFieldResult tmp = fieldsMap.get(fItem).getDescribe();
				describeResult.put(tmp.getName(), tmp);
			}
			result.put('describe', JSON.serialize(describeResult));
		}*/
		
		if (UserInfo.isMultiCurrencyOrganization() == true) {
			fields.add('CurrencyIsoCode');
		}

		string SOQL = 'SELECT {fields} FROM {sObjApiName} WHERE {relField}=\'{recordId}\' {addCondition}'.
		replaceAll('\\{sObjApiName\\}', sObjApiName).
		replaceAll('\\{relField\\}', relField).
		replaceAll('\\{recordId\\}', recordId).
		replaceAll('\\{addCondition\\}', addCondition).
		replaceAll('\\{fields\\}', string.join(new list < string > (soqlFields), ','));

		//if (string.isBlank(SOQL)) throw new core.appException(null, string.format(core.appLabels.get('errCmdParams'), new string[]{'executeAnon','apexCode'}), core.ExceptionType.API);
		system.debug(LoggingLevel.Error, 'SOQL ' + SOQL);

		result.put('records', database.query(SOQL));
		result.put('SOQL', SOQL);
		//result.put('config', getConfig(sObjApiName, relField, listViewName));
		return result;
		//https://salesforce.stackexchange.com/questions/116688/lightning-get-sobject-tab-icon
	}

	private static map<string, object> getConfig(map < string, object > data) {
		string sObjApiName = (string) data.get('sObjApiName');
		string relField = (string) data.get('relField');
		string listViewName = (string) data.get('listViewName');
		boolean isNeedDescribe = true;

		map<string, object> result = new map<string, object>{};

		list<map<string, object>> listViews = new list<map<string, object>>{};

		extRelListConfig__c[] lst = [SELECT Id, JSON__c, listViewName__c, listViewLabel__c, isAdminConfig__c FROM extRelListConfig__c WHERE sObjApiName__c=:sObjApiName AND relFieldApiName__c=:relField AND (CreatedById =:userInfo.getUserID() OR isAdminConfig__c=TRUE) AND Is_Active__c = TRUE AND RecordType.Name = 'Config' ORDER BY isAdminConfig__c DESC, listViewName__c ASC LIMIT 20];
		for (integer i = 0; i < lst.size(); i++) {
			extRelListConfig__c item = lst[i];
			map<string, object> view = new map<string, object>{
				'name' => item.listViewName__c,
				'label' => item.listViewLabel__c,
				'isAdminConfig' => item.isAdminConfig__c
			};
			if (item.listViewName__c == listViewName || string.isEmpty(listViewName) || (i == lst.size() - 1 && result.get('userConfig') == null)) {
				view.put('isUserConfig', true);
				result.put('userConfig', item.JSON__c);
			}
			if (item.isAdminConfig__c) result.put('baseConfig', item.JSON__c);
			listViews.add(view);
		}
		result.put('listViews', listViews);

		if (isNeedDescribe == true) {
			map < string, Schema.DescribeFieldResult > describeResult = new map < string, Schema.DescribeFieldResult > ();
			map < String, Schema.SObjectField > fieldsMap = Schema.getGlobalDescribe().get(sObjApiName).getDescribe().fields.getMap();
			for (string fItem: fieldsMap.keySet()) {
				Schema.DescribeFieldResult tmp = fieldsMap.get(fItem).getDescribe();
				describeResult.put(tmp.getName(), tmp);
			}
			result.put('describe', JSON.serialize(describeResult));
		}
		result.put('currency', new map<string, object>{
			'orgCurrency' =>  UserInfo.getDefaultCurrency(),
			'isMultyCurrencyOrg' => UserInfo.isMultiCurrencyOrganization()
		});

		return result;
	}

	private static object saveListView(map < string, object > data) {
		string listViewName = (string) data.get('listViewName');
		string listViewLabel = (string) data.get('listViewLabel');
		boolean listViewAdmin = (boolean) data.get('listViewAdmin');
		string sObjApiName = (string) data.get('sObjApiName');
		string relField = (string) data.get('relField');
		string config = (string) data.get('config');

		listViewName = string.isBlank(listViewName) 
			? (isAdminAccess ? '_admin' : null)
			: listViewName;
		listViewLabel = string.isBlank(listViewLabel) 
			? (isAdminAccess ? 'Admin' : null)
			: listViewLabel;
		boolean isAdminConf = listViewName == '_admin' ? isAdminAccess : listViewAdmin;

		RecordType rt = [select Id from RecordType where Name = 'Config' and SobjectType = 'extRelListConfig__c' limit 1];

		extRelListConfig__c listView = new extRelListConfig__c(
			listViewName__c = listViewName,
			listViewLabel__c = listViewLabel,
			sObjApiName__c = sObjApiName,
			relFieldApiName__c = relField,
			isAdminConfig__c = isAdminConf,
			JSON__c = config,
			uniqKey__c = sObjApiName + ':' + relField + ':' + isAdminConf + ':' + (string.isBlank(listViewName) ? '' : listViewName),
			RecordTypeId = rt.Id
		);
		upsert listView uniqKey__c;
		return data;
	}

	private static object saveRecords(map < string, object > data) {
		string sObjApiName = (string) data.get('sObjApiName');
		Type T = type.forName('list<' + sObjApiName + '>');
		sObject[] records = (sObject[]) JSON.deserialize(JSON.serialize(data.get('records')), T);

		update records;
		return records;
	}

	private static object delRecords(map < string, object > data) {
		string sObjApiName = (string) data.get('sObjApiName');
		Type T = type.forName('list<' + sObjApiName + '>');
		sObject[] records = (sObject[]) JSON.deserialize(JSON.serialize(data.get('records')), T);

		delete records;
		return records;
	}	

	private static object requestFeature(map < string, object > data) {
		string text = (string) data.get('text');
		UserLicense license = [SELECT TotalLicenses, UsedLicenses FROM UserLicense WHERE Name = 'Salesforce' LIMIT 1];
		
		Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
		email.setToAddresses(new string[]{'polina.sorokina@stratavar.com'});
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
		Messaging.SendEmailResult[] sendRes = Messaging.sendEmail(new Messaging.SingleEmailMessage[] {email});

		map < string, object > result = new map < string, object >();
		result.put('isSuccess', sendRes[0].isSuccess());
		if (!sendRes[0].isSuccess()) {
			string error = '';
			for (Messaging.SendEmailError err : sendRes[0].getErrors()) {                  
				error += err.getStatusCode() + ': ' + err.getMessage() + ' [' + err.getFields() + '].';
			}
			result.put('error', error);
		}
		return result;
	}

	private static object invokeAction(map < string, object > data) {
		string name = (string) data.get('name');
		list < object > recordIdList = (list < object >) data.get('recordIdList');

		map < string, object > params = new map < string, object >();
		if (recordIdList != null) params.put('recordIdList', recordIdList);

		Flow.Interview flow = Flow.Interview.createInterview(name, params);
  		flow.start();
		String result = (String) flow.getVariableValue('result');

		return result;
	}
	private static map<string, string> getCustomLabels(){
		return new map<string, string> {
			'lbl_globalSearch' => label.lbl_globalSearch
		};
	}

	private static map<string, object> getTemplate(map < string, object > data) {

		String templateId = (string) data.get('templateId');
		map<string, object> result = new map<string, object>{};

		extRelListConfig__c config = [SELECT Id, JSON__c FROM extRelListConfig__c WHERE Id = :templateId limit 1];

		result.put('baseConfig', config.JSON__c);

		System.debug('result ' + result);
		return result;
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