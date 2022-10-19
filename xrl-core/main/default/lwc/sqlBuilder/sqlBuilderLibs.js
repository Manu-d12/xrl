export let sqlBuilderLibs = {
    numberFilterActions(key) {
		const actions = [
			{ label: 'Is Equal', value: 'eq' },
			{ label: 'Not Is Equal', value: 'neq' },
			{ label: 'Is empty', value: 'em', isUnary : true},
			{ label: 'Is Not empty', value: 'nem', isUnary : true},
			{ label: 'Greater Than', value: 'gr' },
			{ label: 'Greater or equal', value: 'gre' },
			{ label: 'Less', value: 'ls' },
			{ label: 'Less or equal', value: 'lse' },
			{ label: 'Range', value: 'rg' }
		]
		return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
	doubleFilterActions(key) {
		const actions = [
			{ label: 'Is Equal', value: 'eq' },
			{ label: 'Not Is Equal', value: 'neq' },
			{ label: 'Is empty', value: 'em', isUnary : true},
			{ label: 'Not Is empty', value: 'nem', isUnary : true},
			{ label: 'Greater', value: 'gr' },
			{ label: 'Greater or equal', value: 'gre' },
			{ label: 'Less', value: 'ls' },
			{ label: 'Less or equal', value: 'lse' },
			{ label: 'Range', value: 'rg' }
		]
		return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
    stringFilterActions(key) {
		const actions = [
			{ label: 'Contains', value: 'cn' },
			{ label: 'Does not contain', value: 'ncn' },
			{ label: 'Begins with', value: 'bn' },
			{ label: 'Does not begins with', value: 'nbn' },
			{ label: 'Ends with', value: 'ed' },
			{ label: 'Does not ends with', value: 'ned' },
			{ label: 'Is Equal', value: 'eq' },
			{ label: 'Not Is Equal', value: 'neq' },
			{ label: 'Is empty', value: 'em', isUnary : true},
			{ label: 'Not Is empty', value: 'nem', isUnary : true}
		]
        return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
    picklistFilterActions(key) {
		const actions = [
			{ label: 'Contains', value: 'cn' },
			{ label: 'Does not contain', value: 'ncn' },
			{ label: 'Is Equal', value: 'eq' },
			{ label: 'Not Is Equal', value: 'neq' },
			{ label: 'Is empty', value: 'em', isUnary : true},
			{ label: 'Not Is empty', value: 'nem', isUnary : true}
		]
        return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
	booleanFilterActions(key) {
		const actions = [
			{ label: 'Is Equal', value: 'eq' },
			{ label: 'Not Is Equal', value: 'neq' },
			{ label: 'Is empty', value: 'em', isUnary : true},
			{ label: 'Not Is empty', value: 'nem', isUnary : true}
		];
		return (key) 
			? actions.find( el => { return el.value === key})
			: actions;
	},
	datetimeFilterActions(key) {
		const actions = [
			{ label: 'Is Equal', value: 'eq' },
			{ label: 'Not Is Equal', value: 'neq' },
			{ label: 'Is empty', value: 'em', isUnary : true},
			{ label: 'Not Is empty', value: 'nem', isUnary : true},
			{ label: 'Greater', value: 'gr' },
			{ label: 'Greater or equal', value: 'gre' },
			{ label: 'Less', value: 'ls' },
			{ label: 'Less or equal', value: 'lse' },
			{ label: 'Range', value: 'rg' }
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
				return filter.field + " = null";
			case 'nem': 
				return filter.field + " != null";
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