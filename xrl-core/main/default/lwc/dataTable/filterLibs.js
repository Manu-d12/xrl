export let filterLibs = {

    string__filter(filter, record) {
		let value = this.getValue(filter, record);
        if ((filter._filterOption !== 'em' && filter._filterOption !== 'ncn' && !value)) return false;
		/*eslint-disable*/
		switch (filter._filterOption) {
			case 'cn':
				return value.toLowerCase().includes(filter._filterStr.toLowerCase());
			case 'ncn': 
				return value == undefined || value == '' ||  (value.toLowerCase().indexOf(filter._filterStr.toLowerCase()) === -1);
			case 'bn': 
				return value.toLowerCase().startsWith(filter._filterStr.toLowerCase()) === true;
			case 'nbn': 
				return value.toLowerCase().startsWith(filter._filterStr.toLowerCase()) === false;
			case 'ed': 
				return value.toLowerCase().endsWith(filter._filterStr.toLowerCase()) === true;
			case 'ned': 
				return value.toLowerCase().endsWith(filter._filterStr.toLowerCase()) === false;	
			case 'eq':
				return value.toLowerCase() === filter._filterStr.toLowerCase();
			case 'neq':
				return value.toLowerCase() !== filter._filterStr.toLowerCase();
			case 'em': 
				return value === null || value == undefined;
			case 'nem': 
				return value !== null && value !== undefined;	
		}
    },
	textarea__filter(filter, record) {
        return filterLibs.string__filter(filter, record);
    },
	anyType__filter(filter, record) {
        return filterLibs.string__filter(filter, record);
    },
	email__filter(filter, record) {
        return filterLibs.string__filter(filter, record);
    },
	url__filter(filter, record) {
        return filterLibs.string__filter(filter, record);
    },
	phone__filter(filter, record) {
        return filterLibs.string__filter(filter, record);
    },
	reference__filter(filter, record) {
		
		let value = this.getValue(filter, record);
		console.log('referece filter', filter, record, value);
        if ((filter._filterOption !== 'em' && filter._filterOption !== 'ncn' && !value)) return false;
		

		switch (filter._filterOption) {
			case 'cn':
				return value.toLowerCase().includes(filter._filterStr.toLowerCase());
			case 'ncn': 
				return value == undefined || value == '' ||  (value.toLowerCase().indexOf(filter._filterStr.toLowerCase()) === -1);
			case 'bn': 
				return value.toLowerCase().startsWith(filter._filterStr.toLowerCase()) === true;
			case 'nbn': 
				return value.toLowerCase().startsWith(filter._filterStr.toLowerCase()) === false;
			case 'ed': 
				return value.toLowerCase().endsWith(filter._filterStr.toLowerCase()) === true;
			case 'ned': 
				return value.toLowerCase().endsWith(filter._filterStr.toLowerCase()) === false;	
			case 'eq':
				return value.toLowerCase() === filter._filterStr.toLowerCase();
			case 'neq':
				return value.toLowerCase() !== filter._filterStr.toLowerCase();
			case 'em': 
				return value === null || value == undefined;
			case 'nem': 
				return value !== null && value !== undefined;	
		}
    },
    picklist__filter(filter, record) {
		let value = this.getValue(filter, record);
        if ((filter._filterOption !== 'em' && filter._filterOption !== 'ncn' && !value)) return false;
		switch (filter._filterOption) {
			case 'cn':
				return filter._filterStr.find(v => {return value.toLowerCase().includes(v.toLowerCase());});				
			case 'ncn': 
				return value == undefined || !filter._filterStr.find(v => {return value.toLowerCase().includes(v.toLowerCase());});	
			/*case 'bn': 
				return filter._filterStr.find(v => {return value.toLowerCase().startsWith(v.toLowerCase());});
			case 'nbn': 
				return !filter._filterStr.find(v => {return value.toLowerCase().startsWith(v.toLowerCase());});
			case 'ed': 
				return filter._filterStr.find(v => {return value.toLowerCase().endsWith(v.toLowerCase());});
			case 'ned': */
				return !filter._filterStr.find(v => {return value.toLowerCase().endsWith(v.toLowerCase());});	
			case 'eq':
				return filter._filterStr.find(v => {return value.toLowerCase() === v.toLowerCase();});
			case 'neq':
				return !filter._filterStr.find(v => {return value.toLowerCase() === v.toLowerCase();});
			case 'em': 
				return value === null || value == undefined;
			case 'nem': 
				return value !== null && value !== undefined;	
		}
    },
    number__filter(filter, record) {
		let value = this.getValue(filter, record);
        if ((filter._filterOption !== 'em' && filter._filterOption !== 'ncn' && value == undefined)) return false;
		switch (filter._filterOption) {
			case 'cn': 
				return value.toString().indexOf(filter._filterStr) > -1;
			case 'ncn': 
				return value == undefined || value.toString().indexOf(filter._filterStr) === -1;
			case 'bn': 
				return value.toString().startsWith(filter._filterStr) === true;
			case 'nbn': 
				return value.toString().startsWith(filter._filterStr) === false;
			case 'ed': 
				return value.toString().endsWith(filter._filterStr) === true;
			case 'ned': 
				return value.toString().endsWith(filter._filterStr) === false;	
			case 'eq': 
				return value === Number(filter._filterStr);
			case 'neq': 
				return value !== Number(filter._filterStr);
			case 'em': 
				return value === null || value == undefined;
			case 'nem': 
				return value !== null && value !== undefined;
			case 'gr': 
				return value > Number(filter._filterStr);
			case 'gre': 
				return value >= Number(filter._filterStr);
			case 'ls': 
				return value < Number(filter._filterStr);
			case 'lse': 
				return value <= Number(filter._filterStr);
			case 'rg': 
				return value >= Number(filter._filterStr) && value <= Number(filter._filterStrTo);
			default :  console.log('Filter action not found', filter._filterOption);
		}
	},
	currency__filter(filter, record) {
        return filterLibs.number__filter(filter, record);
    },
	int__filter(filter, record) {
        return filterLibs.number__filter(filter, record);
    },
	double__filter(filter, record) {
        return filterLibs.number__filter(filter, record);
    },
	percent__filter(filter, record) {
        return filterLibs.number__filter(filter, record);
    },
	encryptedstring__filter(filter, record) {
        return filterLibs.string__filter(filter, record);
    },
	id__filter(filter, record) {
        return filterLibs.string__filter(filter, record);
    },
	boolean__filter(filter, record) {
		let value = this.getValue(filter, record);
        // if (value === null) return false;
		switch (filter._filterOption) {
			case 'eq': 
				return filter._filterStr.find((el =>  el ===  value.toString())) !== undefined;
			case 'neq': 
				return filter._filterStr.find((el =>  el ===  value.toString())) === undefined;
			case 'em': 
				return value === null || value == undefined;
			case 'nem': 
				return value !== null && value !== undefined;
		}	
	},
	datetime__filter(filter, record) {
		let value = this.getValue(filter, record);
		if ((filter._filterOption !== 'em' && filter._filterOption !== 'neq' && !value)) return false;
		let filterDate;
		let recordDate;
		filterDate = new Date(filter._filterStr).getTime();
		recordDate = new Date(value).getTime();

		switch (filter._filterOption) {
			case 'eq':
				return recordDate.toString().toLowerCase().indexOf(filterDate)!=-1;
			case 'neq':
				return value == undefined || recordDate.toString().toLowerCase().indexOf(filterDate)==-1;
			case 'em': 
				return value == undefined;
			case 'nem': 
				return value != undefined;
			case 'gr': 
				return recordDate > filterDate;
			case 'gre': 
				return recordDate >= filterDate;
			case 'ls':
				return recordDate < filterDate; 
			case 'lse': 
				return recordDate <= filterDate;
			case 'rg': 
				let filterTwoDate = new Date(filter._filterStrTo).getTime();
				return recordDate >= filterDate && recordDate <= filterTwoDate;
			
		}
	},
	date__filter(filter, record) {
		let value = this.getValue(filter, record);
		if ((filter._filterOption !== 'em' && filter._filterOption !== 'neq' && !value)) return false;
		let filterDate;
		let recordDate;
		filterDate = new Date(filter._filterStr).setHours(0, 0, 0, 0).toLocaleString(filter._locale,{
			month : "2-digit",
			day : "2-digit",
			year: "numeric"
		});
		recordDate = new Date(value).setHours(0, 0, 0, 0).toLocaleString(filter._locale,{
			month : "2-digit",
			day : "2-digit",
			year: "numeric"
		});

		switch (filter._filterOption) {
			case 'eq':
				return recordDate.toString().toLowerCase().indexOf(filterDate)!=-1;
			case 'neq':
				return value == undefined || recordDate.toString().toLowerCase().indexOf(filterDate)==-1;
			case 'em': 
				return value == undefined;
			case 'nem': 
				return value != undefined;
			case 'gr': 
				return recordDate > filterDate;
			case 'gre': 
				return recordDate >= filterDate;
			case 'ls':
				return recordDate < filterDate; 
			case 'lse': 
				return recordDate <= filterDate;
			case 'rg': 
				let filterTwoDate = new Date(filter._filterStrTo).setHours(0, 0, 0, 0).toLocaleString(filter._locale,{
					month : "2-digit",
					day : "2-digit",
					year: "numeric"
				});
				return recordDate >= filterDate && recordDate <= filterTwoDate;
			
		}
	},
    /*
    filterReference(filter, record) {
		if (!record[filter.fieldName]) return false;
		let field = filter.fieldName.endsWith('__c') ? filter.fieldName.replace('__c', '__r') : filter.fieldName;
		if (!record[field] || !record[field].Name) return false;
		switch (filter._filterOption) {
			case 'cn':
				return record[field].Name.toLowerCase().includes(filter._filterStr.toLowerCase());
			case 'eq':
				return record[field].Name.toLowerCase() === filter._filterStr.toLowerCase();
			case 'neq':
				return record[field].Name.toLowerCase() !== filter._filterStr.toLowerCase();
		}
	}

	filterDatetime(filter, record) {
		if (!record[filter.fieldName]) return false;
		
		let locale = libs.getGlobalVar('config').userInfo.locale;

		//console.log(locale);
		//console.log(filter._filterStr);
		//console.log(record[filter.fieldName]);

		let filterDate = new Date(filter._filterStr); // gets passed with timezone 0, in filter timezone - +1 - user timezone
		let recordDate = new Date(new Date(record[filter.fieldName]).toLocaleString(locale));

		//console.log(filterDate);
		//console.log(recordDate);
		//console.log(filterDate.getTimezoneOffset());

		switch (filter._filterOption) {
			case 'cn':
			case 'eq':
				return Math.abs(filterDate - recordDate) / 60000 <= 15;
			case 'neq':
				return Math.abs(filterDate - recordDate) / 60000 > 15;
		}
	}

    */

    numberFilterActions(labels,key) {
		const actions = [
			{ label: labels.lbl_contains, value: 'cn' },
			{ label: labels.lbl_doesNotContains, value: 'ncn' },
			{ label: labels.lbl_beginsWith, value: 'bn' },
			{ label: labels.lbl_doesNotBeginsWith, value: 'nbn' },
			{ label: labels.lbl_endsWith, value: 'ed' },
			{ label: labels.lbl_doesNotEndsWith, value: 'ned' },
			{ label: labels.lbl_isEqual, value: 'eq' },
			{ label: labels.lbl_isNotEqual, value: 'neq' },
			{ label: labels.lbl_isEmpty, value: 'em', isUnary : true},
			{ label: labels.lbl_isNotEmpty, value: 'nem', isUnary : true},
			{ label: labels.lbl_greater, value: 'gr' },
			{ label: labels.lbl_greaterOrEqual, value: 'gre' },
			{ label: labels.lbl_less, value: 'ls' },
			{ label: labels.lbl_lessOrEqual, value: 'lse' },
			{ label: labels.lbl_range, value: 'rg' }
		]
		return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
	stringFilterActions(labels,key) {
		const actions = [
			{ label: labels.lbl_contains, value: 'cn' },
			{ label: labels.lbl_doesNotContains, value: 'ncn' },
			{ label: labels.lbl_beginsWith, value: 'bn' },
			{ label: labels.lbl_doesNotBeginsWith, value: 'nbn' },
			{ label: labels.lbl_endsWith, value: 'ed' },
			{ label: labels.lbl_doesNotEndsWith, value: 'ned' },
			{ label: labels.lbl_isEqual, value: 'eq' },
			{ label: labels.lbl_isNotEqual, value: 'neq' },
			{ label: labels.lbl_isEmpty, value: 'em', isUnary : true},
			{ label: labels.lbl_isNotEmpty, value: 'nem', isUnary : true}
		]
        return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
	idFilterActions(labels,key) {
        return filterLibs.stringFilterActions(labels,key);
	},
	encryptedstringFilterActions(labels,key) {
        return filterLibs.stringFilterActions(labels,key);
	},
	anyTypeFilterActions(labels,key) {
        return filterLibs.stringFilterActions(labels,key);
	},

	picklistFilterActions(labels,key) {
		const actions = [
			{ label: labels.lbl_contains, value: 'cn' },
			{ label: labels.lbl_doesNotContains, value: 'ncn' },
			{ label: labels.lbl_isEqual, value: 'eq' },
			{ label: labels.lbl_isNotEqual, value: 'neq' },
			{ label: labels.lbl_isEmpty, value: 'em', isUnary : true},
			{ label: labels.lbl_isNotEmpty, value: 'nem', isUnary : true}
		]
        return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
	booleanFilterActions(labels,key) {
		const actions = [
			{ label: labels.lbl_isEqual, value: 'eq' },
			{ label: labels.lbl_isNotEqual, value: 'neq' },
			{ label: labels.lbl_isEmpty, value: 'em', isUnary : true},
			{ label: labels.lbl_isNotEmpty, value: 'nem', isUnary : true}
		];
		return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
	dateFilterActions(labels,key) {
		const actions = [
			{ label: labels.lbl_isEqual, value: 'eq' },
			{ label: labels.lbl_isNotEqual, value: 'neq' },
			{ label: labels.lbl_isEmpty, value: 'em', isUnary : true},
			{ label: labels.lbl_isNotEmpty, value: 'nem', isUnary : true},
			{ label: labels.lbl_greater, value: 'gr' },
			{ label: labels.lbl_greaterOrEqual, value: 'gre' },
			{ label: labels.lbl_less, value: 'ls' },
			{ label: labels.lbl_lessOrEqual, value: 'lse' },
			{ label: labels.lbl_range, value: 'rg' }
		]
		return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},

	datetimeFilterActions(labels,key) {
        return filterLibs.dateFilterActions(labels,key);
	},
	currencyFilterActions(labels,key) {
        return filterLibs.numberFilterActions(labels,key);
	},
	doubleFilterActions(labels,key) {
        return filterLibs.numberFilterActions(labels,key);
	},
	percentFilterActions(labels,key) {
        return filterLibs.numberFilterActions(labels,key);
	},
	intFilterActions(labels,key) {
        return filterLibs.numberFilterActions(labels,key);
	},
	textareaFilterActions(labels,key) {
        return filterLibs.stringFilterActions(labels,key);
	},
	emailFilterActions(labels,key) {
        return filterLibs.stringFilterActions(labels,key);
	},
	urlFilterActions(labels,key) {
        return filterLibs.stringFilterActions(labels,key);
	},
	phoneFilterActions(labels,key) {
        return filterLibs.stringFilterActions(labels,key);
	},

	referenceFilterActions(labels,key) {
        return filterLibs.stringFilterActions(labels,key);
	},

	getValue(filter, record) {
		function getRefField(field) {
			let fName = field.endsWith('Id') 
				? field.replace(/Id$/,'')
				: field.endsWith('__c')
					? field.replace(/__c$/,'__r')
					: '';
			console.log('record[field].Name', record[fName]?.Name, record, field, fName);
			return record[fName]?.Name;
		}
		let formatter = filter.formatter ? eval('(' + filter.formatter + ')') : null;
		let value = filter.type !== "reference"
			? filter.fieldName.split('.')[1] != undefined ? record[filter.fieldName.split('.')[0]] && record[filter.fieldName.split('.')[0]][filter.fieldName.split('.')[1]] ? record[filter.fieldName.split('.')[0]][filter.fieldName.split('.')[1]] : ''
			:record[filter.fieldName]
			: getRefField(filter.fieldName);
		// console.log(value);
		return formatter && typeof formatter === 'function' ? formatter(record, filter, record[filter.fieldName]) : value ;
	}

}