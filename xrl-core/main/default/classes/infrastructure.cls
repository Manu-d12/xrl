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

		User userDetails = [SELECT Id, Name, Profile.Name, UserRole.Name FROM User where Id=:userinfo.getUserId()]; 
		list < PermissionSetAssignment > permissionSets = [SELECT Id,PermissionSet.Name FROM PermissionSetAssignment WHERE AssigneeId = :UserInfo.getUserId()];
		List<Group> publicGroups = getGroupsForUser(userinfo.getUserId());
		System.debug(publicGroups);

		result.put('userInfo', new map<string, object>{
			'locale' => userInfo.getLocale().replaceAll('_','-').replace('-EURO',''),
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
		map<string, object> result = new map<string, object>();
		string sObjApiName = (string) data.get('sObjApiName');
		string relField = (string) data.get('relField');
		string addCondition = (string) data.get('addCondition');
		string listViewName = (string) data.get('listViewName');
		string SQL = (string) data.get('SQL');

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

		string SOQL = (relField!=null) 
			? 'SELECT {fields} FROM {sObjApiName} WHERE {relField}=\'{recordId}\' {addCondition}'.replaceAll('\\{relField\\}', relField!= null ? relField : '').replaceAll('\\{recordId\\}', recordId)
			: 'SELECT {fields} FROM {sObjApiName} {addCondition}';
		

		system.debug(LoggingLevel.Error, SOQL);

		SOQL = SOQL.replaceAll('\\{sObjApiName\\}', sObjApiName!=null ? sObjApiName : '');
		SOQL = SOQL.replaceAll('\\{addCondition\\}', addCondition != null ? addCondition : '');
		SOQL = SOQL.replaceAll('\\{fields\\}', soqlFields!=null ? string.join(new list < string > (soqlFields), ',') : '');

		//if (string.isBlank(SOQL)) throw new core.appException(null, string.format(core.appLabels.get('errCmdParams'), new string[]{'executeAnon','apexCode'}), core.ExceptionType.API);
		system.debug(LoggingLevel.Error, 'SOQL ' + SOQL);

		result.put('SOQL', SOQL);
		
		result.put('records', database.query(SOQL));
		
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

		result.put('iconMap',retrieveIconForObject(sObjApiName));

		return result;
	}

	private static object saveListView(map < string, object > data) {
		string listViewName = (string) data.get('listViewName');
		string listViewLabel = (string) data.get('listViewLabel');
		boolean listViewAdmin = (boolean) data.get('listViewAdmin');
		string sObjApiName = (string) data.get('sObjApiName');
		string relField = (string) data.get('relField');
		string config = (string) data.get('config');
		Boolean isTemplate = false;
		if(data.containsKey('isTemplate')){
			isTemplate = (Boolean) data.get('isTemplate');
		}

		listViewName = string.isBlank(listViewName) 
			? (isAdminAccess ? '_admin' : null)
			: listViewName;
		listViewLabel = string.isBlank(listViewLabel) 
			? (isAdminAccess ? 'Admin' : null)
			: listViewLabel;
		boolean isAdminConf = listViewName == '_admin' ? isAdminAccess : listViewAdmin;

		RecordType rt;
		if(isTemplate){
			rt = [SELECT Id FROM RecordType WHERE Name = 'Template' AND (SobjectType ='extRelListConfig__c' OR SobjectType ='XRL__extRelListConfig__c') limit 1];
		}else{
			rt = [SELECT Id FROM RecordType WHERE Name = 'Config' AND (SobjectType ='extRelListConfig__c' OR SobjectType ='XRL__extRelListConfig__c') limit 1];
		}

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
			'errMsg_recordsNotFound' => label.errMsg_recordsNotFound,
			'errMsg_wrapableAndClipableCanNotBeSelectedTogether' => label.errMsg_wrapableAndClipableCanNotBeSelectedTogether,
			'hlpTxt_additionalConditionText' => label.hlpTxt_additionalConditionText,
			'hlpTxt_selectYourPreferredFields' => label.hlpTxt_selectYourPreferredFields,
			'hlpTxt_selectYourLockedFields' => label.hlpTxt_selectYourLockedFields,
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
			'title_close' => label.title_close,
			'title_clear' => label.title_clear,
			'title_collapse' => label.title_collapse,
			'title_delete' => label.title_delete,
			'title_export' => label.title_export,
			'title_expand' => label.title_expand,
			'title_editColumn' => label.title_editColumn,
			'title_new' =>label.title_new,
			'title_requestAFeature' => label.title_requestAFeature,
			'title_refresh' => label.title_refresh,
			'title_saveFilter' => label.title_saveFilter,
			'title_sortColumn' => label.title_sortColumn,
			'title_saveSelectedFields' => label.title_saveSelectedFields,
			'title_youCanDefineAllParametersForFields' => label.title_youCanDefineAllParametersForFields,
			'title_youCanDefineAllGeneralTableParameters' => label.title_youCanDefineAllGeneralTableParameters,
			'srcLbl_available' => label.srcLbl_available,
			'srcLbl_optional' => label.srcLbl_optional
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

	public static Group[] getGroupsForUser(Id userId){

		Set<Id> groupIds = getGroupsForIds(new Set<Id>{userId});
		return [SELECT Id, Name FROM Group WHERE Id IN: groupIds];

	}

	public static Set<Id> getGroupsForIds(Set<Id> userOrGroupIds){

		Set<Id> groupIds = new Set<Id>();
		Set<Id> nestedGroupIds = new Set<Id>();

		list<GroupMember> records = [SELECT Id, GroupId, UserOrGroupId FROM GroupMember WHERE UserOrGroupId =: userOrGroupIds AND UserOrGroupId != null AND Group.Type = 'Regular'];

		for (GroupMember record:records){
			if (!(record.UserOrGroupId + '').startsWith('005')){
				nestedGroupIds.add(record.UserOrGroupId);   
			}
			else{
				groupIds.add(record.GroupId);
			}
		}

		if (nestedGroupIds.size() > 0){
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
	private static Map<String,String> retrieveIconForObject(String sObjectName) {    
		String iconStyle;
		String iconURL;
		String iconTag;
		Map<String,String>                iconPropertyMap = new Map<String,String>();
		List<Schema.DescribeTabSetResult> tabSetDesc      = Schema.describeTabs();
		List<Schema.DescribeTabResult>    tabDesc         = new List<Schema.DescribeTabResult>();
		List<Schema.DescribeIconResult>   iconDesc        = new List<Schema.DescribeIconResult>();

		for(Schema.DescribeTabSetResult tsr : tabSetDesc){
		tabDesc.addAll(tsr.getTabs()); 
		}
		for(Schema.DescribeTabResult tr : tabDesc) {
			if( sObjectName == tr.getSobjectName() ) {
				system.debug(tr.getIcons());
				if(!tr.getIcons().isEmpty()){
					iconDesc.addAll(tr.getIcons());
				}else{
					if( tr.isCustom() == true ) {
						iconStyle = 'slds-icon-standard-custom';
						iconURL   = '/img/icon/t4v35/standard/custom_120.png';
					} else {
						iconStyle = 'slds-icon-standard-' + sObjectName.toLowerCase();
						iconURL   = '/img/icon/t4v35/standard/' + sObjectName.toLowerCase() + '_120.png';
					}
				}
			}
		}
		for (Schema.DescribeIconResult ir : iconDesc) {
			if(ir.getTheme() =='custom' && !ir.getContentType().startsWith('image/svg')){//custom icon thats not an svg
				iconTag   = 'custom';
				iconURL   = ir.getURL();
				iconStyle = 'slds-icon-standard-custom';
				break;
			}else if(ir.getWidth() == 120 && ir.getTheme() =='theme4' && ir.getContentType() == 'image/png'){//large lightning icon image
				if(ir.getURL().contains('/custom/')){ //Icon is from the Custom Sprite
					iconTag    = ir.getURL().substringBetween('custom/','.png').substringBefore('_');
					iconURL    = '/img/icon/t4v35/custom/' + iconTag + '_120.png';
					iconStyle  = 'slds-icon-custom-'+ iconTag;
					break;
				}else if(ir.getURL().contains('/standard/')){//Icon is from the Standard Sprite
					iconTag    = ir.getURL().substringBetween('standard/','.png').substringBefore('_');
					iconURL    = '/img/icon/t4v35/standard/' + iconTag + '_120.png';
					iconStyle  = 'slds-icon-standard-'+ iconTag;
					break;
				}
			}
		}
		//if no icons are found, just default to the Custom lightning icon
		if(iconStyle == null){
			iconStyle = 'slds-icon-standard-custom';
			iconURL   = '/img/icon/t4v35/standard/custom_120.png';
			iconTag   = 'No Lightning Icon Found';
		}
		//return a map with our properties for the front end
		iconPropertyMap.put('iconStyle',iconStyle);
		iconPropertyMap.put('iconURL',  iconURL);

		return iconPropertyMap;
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