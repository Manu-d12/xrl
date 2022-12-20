export let sqlBuilderLibs = {
    numberFilterActions(labels,key) {
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
	doubleFilterActions(labels,key) {
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
			{ label: labels.lbl_isNotEmpty, value: 'nem', isUnary : true},
		]
        return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
    textareaFilterActions(labels,key) {
		const actions = [
			{ label: labels.lbl_isEqual, value: 'eq' },
			{ label: labels.lbl_isNotEqual, value: 'neq' },
			{ label: labels.lbl_isEmpty, value: 'em', isUnary : true},
			{ label: labels.lbl_isNotEmpty, value: 'nem', isUnary : true},
		]
        return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
    idFilterActions(labels,key) {
		const actions = [
			{ label: labels.lbl_isEqual, value: 'eq' },
			{ label: labels.lbl_isNotEqual, value: 'neq' },
		]
        return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
    picklistFilterActions(labels,key) {
		const actions = [
			{ label: labels.lbl_contains, value: 'cn' },
			{ label: labels.lbl_doesNotContains, value: 'ncn' },
			{ label: labels.lbl_isEqual, value: 'eq' },
			{ label: labels.lbl_isNotEqual, value: 'neq' },
			{ label: labels.lbl_isEmpty, value: 'em', isUnary : true},
			{ label: labels.lbl_isNotEmpty, value: 'nem', isUnary : true},
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
			{ label: labels.lbl_isNotEmpty, value: 'nem', isUnary : true},
		];
		return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
	datetimeFilterActions(labels,key) {
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
    string__condition(filter) {
        /* eslint-disable */
        switch (filter.operator.value) {
            case 'cn':
				return filter.field + " Like '%" +  filter.value + "%'";
			case 'ncn': 
				return 'NOT ' + filter.field + " Like '%" +  filter.value + "%'";
			case 'bn': 
				return filter.field + " Like '" +  filter.value + "%'";
			case 'nbn': 
				return 'NOT ' + filter.field + " Like '" +  filter.value + "%'";
			case 'ed': 
				return filter.field + " Like '%" +  filter.value + "'";
			case 'ned': 
				return 'NOT ' + filter.field + " Like '" +  filter.value + "%'";
			case 'eq':
				return filter.field + " ='" +  filter.value + "'";
			case 'neq':
				return filter.field + " !='" +  filter.value + "'";
			case 'em': 
				return filter.field + " = NULL";
			case 'nem': 
				return filter.field + " != NULL";
        }
    },
    textarea__condition(filter) {
        /* eslint-disable */
        switch (filter.operator.value) {
			case 'eq':
				return filter.field + " ='" +  filter.value + "'";
			case 'neq':
				return filter.field + " !='" +  filter.value + "'";
			case 'em': 
				return filter.field + " = NULL";
			case 'nem': 
				return filter.field + " != NULL";
        }
    },
    id__condition(filter) {
        /* eslint-disable */
        switch (filter.operator.value) {
			case 'eq':
				return filter.field + " ='" +  filter.value + "'";
			case 'neq':
				return filter.field + " !='" +  filter.value + "'";
        }
    },
    boolean__condition(filter) {
        /* eslint-disable */
        switch (filter.operator.value) {
			case 'eq':
				return filter.field + " =" +  filter.value;
			case 'neq':
				return filter.field + " !=" +  filter.value;
			case 'em': 
				return filter.field + " = NULL";
			case 'nem': 
				return filter.field + " != NULL";
        }
    },
	picklist__condition(filter) {
        /* eslint-disable */
        switch (filter.operator.value) {
            case 'cn':
				return filter.field + " ='" +  filter.value + "'";
			case 'ncn': 
				return 'NOT ' + filter.field + " Like '%" +  filter.value + "%'";
			case 'eq':
				return filter.field + " ='" +  filter.value + "'";
			case 'neq':
				return filter.field + " !='" +  filter.value + "'";
			case 'em': 
				return filter.field + " = NULL";
			case 'nem': 
				return filter.field + " != NULL";
        }
    },
    double__condition(filter) {
        /* eslint-disable */
        switch (filter.operator.value) {
			case 'eq':
				return filter.field + " =" +  filter.value;
			case 'neq':
				return filter.field + " !=" +  filter.value + "";
			case 'em': 
				return filter.field + " = NULL";
			case 'nem': 
				return filter.field + " != NULL";
			case 'gr': 
				return filter.field + " >" +  filter.value;
			case 'gre': 
				return filter.field + " >=" +  filter.value;
			case 'ls': 
				return filter.field + " <" +  filter.value;
			case 'lse': 
				return filter.field + " <=" +  filter.value;
			case 'rg':
				return '('+ filter.field + " >=" +  filter.value + ' AND ' + filter.field + " <=" +  filter.valueRange + ')';
        }
    },
    number__condition(filter) {
        /* eslint-disable */
        switch (filter.operator.value) {
			case 'eq':
				return filter.field + " =" +  filter.value;
			case 'neq':
				return filter.field + " !=" +  filter.value + "";
			case 'em': 
				return filter.field + " = NULL";
			case 'nem': 
				return filter.field + " != NULL";
			case 'gr': 
				return filter.field + " >" +  filter.value;
			case 'gre': 
				return filter.field + " >=" +  filter.value;
			case 'ls': 
				return filter.field + " <" +  filter.value;
			case 'lse': 
				return filter.field + " <=" +  filter.value;
			case 'rg':
				return '('+ filter.field + " >=" +  filter.value + ' AND ' + filter.field + " <=" +  filter.valueRange + ')';
        }
    },
    datetime__condition(filter) {
        /* eslint-disable */
        switch (filter.operator.value) {
			case 'eq':
				return filter.field + " =" +  filter.value;
			case 'neq':
				return filter.field + " !=" +  filter.value;
			case 'em': 
				return filter.field + " = NULL";
			case 'nem': 
				return filter.field + " != NULL";
			case 'gr': 
				return filter.field + " >" +  filter.value;
			case 'gre': 
				return filter.field + " >=" +  filter.value;
			case 'ls': 
				return filter.field + " <" +  filter.value;
			case 'lse': 
				return filter.field + " <=" +  filter.value;
			case 'rg':
				return '('+ filter.field + " >=" +  filter.value + ' AND ' + filter.field + " <=" +  filter.valueRange + ')';
        }
    },

}