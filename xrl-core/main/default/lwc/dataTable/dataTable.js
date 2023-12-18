
import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';
import { filterLibs } from './filterLibs';
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const defClass = 'slds-grid slds-grid_align-spread';
export default class dataTable extends NavigationMixin(LightningElement) {
	@track records;
	@track config;
	@track groupedRecords;

	@api cfg;

	@track showPopOver = false;
	@track popStyle;
	@track title = '';
	@api recordId;
	@api objectApiName;
	sValues = [];
	defaultFields = [];
	additionalFields = [];
	// Commented out for now, will be released in release 3 - Compact Layout functionality on hover
	showPop(event){
		//console.log('Hovered ' + event.pageY + ' ' + event.clientX);

		// this.objectApiName = event.target.getAttribute('data-colname');
		// let col = this.config.colModel.find((el)=>{
		// 	return el.fieldName === this.objectApiName
		// });
		// let hoverConstValues = {
		// 	5:810,
		// 	20:1250,
		// 	50:2100,
		// 	100:3510,
		// 	200:6360
		// };
		// this.popStyle = libs.formatStr("position:absolute;top:{0}px;left:{1}px", [((event.pageY - document.body.scrollTop) - hoverConstValues[this.config.pager.pageSize]), (event.clientX - 52)]);
		// let record = this.records.find((el) =>{
		// 	return el.Id === event.target.getAttribute('data-recordind')
		// });
		// this.config.pageY = event.pageY;
		// this.config.pageX = event.clientX;

		// if (col.referenceTo ){
		// 	this.objectApiName = col.referenceTo;
		// 	this.recordId = record[col.fieldName.split('.')[0]].Id;
		// 	//popup will show after 1.5 seconds of hovering
		// 	this.config.timeoutId = setTimeout(() => {
		// 		this.showPopOver = true;
		// 		}, 2000);
		// }
		  

	}
	hidePop(event){
		//console.log('Mouse Out');
		
		// if((event.pageY >= this.config.pageY - 5 && event.pageY <= this.config.pageY + 5) &&
		// (event.clientX >= this.config.pageX - 5 && event.clientX <= this.config.pageX + 5)){
		// 	console.log('In range: ' + event.pageY + ' ' + event.clientX);
		// }else{
		// 	console.log('Not In range: ' + event.pageY + ' ' + event.clientX);
		// 	clearTimeout(this.config.timeoutId);
		// 	this.showPopOver=false;
		// }
	}

	@api
	getRecords() {
		// this methood need to get data from paren component
		console.log('length from datatable getrecords', this.cfg, this.records.length);
		return this.records;
	}
	filterRecordsWithChecked(records) {
		const filteredRecords = [];
	
		function traverseAndFilter(record) {
			if (record._isChecked === true) {
				filteredRecords.push(record);
			}
	
			if (record.childRecords) {
				for (const childRecord of record.childRecords) {
					traverseAndFilter(childRecord);
				}
			}
		}
	
		for (const record of records) {
			traverseAndFilter(record);
		}
	
		return filteredRecords;
	}
	@api
	getSelectedRecords() {
		// this methood need to get data from paren component
		console.log('length from datatable getrecords', this.cfg, this.records.length);
		return this.filterRecordsWithChecked(this.records);
	}
	@api
	getGroups() {
		return this.groupedRecords;
	}
	@api
	getSelectedGroups() {
		return this.groupedRecords.filter(gr => gr.isChecked).map(gr => gr.title);
	}
	@api	
	setGroupSelected(name, checked) {
		let group = this.groupedRecords.find(gr => gr.title === name);
		group.isChecked = checked;
		group.records.forEach(rec => {
			rec._isChecked = group.isChecked;
			let rowind = this.records.findIndex(row => row.Id === rec.Id);
			this.records[rowind]._isChecked = group.isChecked;
		});
	}
	@api
	setRowsSelected(idList, checked) {
		if (this.hasGrouping) {
			let groupSet = new Set();
			idList.forEach(id => {
				let rowind = this.records.findIndex(row => row.Id === id);
				this.records[rowind]._isChecked = checked;
				if (this.config.groupingParams.field.split('.')[1]){
					groupSet.add(this.records[rowind][this.config.groupingParams.field.split('.')[0]][this.config.groupingParams.field.split('.')[1]] || 'empty');
				} else {
					groupSet.add(this.records[rowind][this.config.groupingParams.field] || 'empty');
				}
			});		
			groupSet.forEach(groupName => {
				let groupInd = this.groupedRecords.findIndex(gr => gr.title === groupName);
				let groupChecked = true;
				for (let rec of this.groupedRecords[groupInd].records) {
					if (!rec._isChecked) {
						groupChecked = false;
						break;
					}
				}
				this.groupedRecords[groupInd].isChecked = groupChecked;
			});
		} else {
			idList.forEach(id => {
				this.records[this.calcRowIndex(id)]._isChecked = checked;
			});			
		}
		this.rowCheckStatus();
	}

	@api
	setUpdateInfo(v) {
		this.updateInfo = v;
	}
	updateInfo = '';
	
	get colHeaderClass(){
		return this.config.enableColumnHeaderWrap ? 'slds-cell-wrap slds-hyphenate' : 'slds-truncate';
	}

	get isRecordsAvailableForUI() {
		return this.config._recordsToShow.length > 0;
	}
	toggleChildRecords(event){
        // let record = this.records.find(r => r.Id === event.target.getAttribute('data-id'));
		const record = libs.findRecordWithChild(this.records, event.target.getAttribute('data-id'));
		record._isExpanded = record._isExpanded ===  undefined ? true : !record._isExpanded;
    }
	// findRecordWithChild(records, targetId) {
	// 	for (const record of records) {
	// 		if (record.Id === targetId) {
	// 			return record;
	// 		}
	
	// 		if (record.childRecords) {
	// 			const foundInChild = this.findRecordWithChild(record.childRecords, targetId);
	// 			if (foundInChild) {
	// 				return foundInChild;
	// 			}
	// 		}
	// 	}
	
	// 	return null;
	// }
	addSerialNumbers(records, parentIndex = '9') {
		records.forEach((el, ind) => {
			const currentSerial = parentIndex === '9' ? (ind + 10).toString() : parentIndex + '.' + (ind + 1); // Start from 10 for the first level
			
			// Pad the serial number with zeros for child levels
			const paddedSerial = currentSerial.split('.').map((part, index) => index === 0 ? part : part.padStart(2, '0')).join('.');
			
			el.sl = paddedSerial;
	
			if (el.childRecords?.length > 0) {
				el._hasChildRecords = true;
				this.config.isAnyRecordsHaveChildren = true;
				this.addSerialNumbers(el.childRecords, currentSerial);
			}
	
			if (this.config._advanced?.rowCss) {
				el._rowStyle = this.config.rowCallback ? 'cursor: pointer;' : '';
				try {
					el._rowStyle += eval('(' + this.config._advanced?.rowCss + ')')(el);
				} catch (e) {
					this.config._errors = libs.formatCallbackErrorMessages(e,'table','Row Css Callback');
					// libs.showToast(this, {
					// 	title: 'Error',
					// 	message: e.toString(),
					// 	variant: 'error',
					// });
					// console.error('Error', e);
				}
			}
		});
	}
	
	
	get tableRecords() {
		this.config.isAnyRecordsHaveChildren = false;
		if((this.config.isRecordsDragDropEnabled === undefined || this.config.isRecordsDragDropEnabled === false) && (this.config.fieldToMapToIndex === undefined || this.config.fieldToMapToIndex === "")){
			this.records.forEach((el,ind) =>{
				el.sl = ind + 1;
				if(el.childRecords?.length > 0) {
					el._hasChildRecords = true;
					this.config.isAnyRecordsHaveChildren = true;
				}
				if (this.config._advanced?.rowCss) {
					el._rowStyle = this.config.rowCallback ? 'cursor: pointer;' : '';
					try {
						el._rowStyle += eval('(' + this.config._advanced?.rowCss + ')')(el);
					} catch (e) {
						// libs.showToast(this, {
						// 	title: 'Error',
						// 	message: e.toString(),
						// 	variant: 'error',
						// });
						// console.error('Error', e);
						this.config._errors = libs.formatCallbackErrorMessages(e,'table','Row Css Callback');
					}
				}
			});
		}else{
			this.addSerialNumbers(this.records);
		}

		if (this.hasGrouping) {

			let isPager = this.config.pager;
			if(!this.config.pager.pagerTop && !this.config.pager.pagerBottom){
				let startIndex = 0;
				let endIndex = this.records.length > 201 ? 201 : this.records.length + 1;
				let result = [];
				for (let group of this.groupedRecords) {
					if (startIndex > group.records[group.records.length - 1].index) continue;
					if (endIndex <= group.records[0].index - 1) break;   
					let gr = Object.assign({}, group);
					gr.records = group.records.map(r => r);
					if (startIndex >= gr.records[0].index) {
						gr.records.splice(0, startIndex - (gr.records[0].index));
					}					
					if (endIndex <= gr.records[gr.records.length - 1].index) {
						gr.records.splice(endIndex - (gr.records[0].index));
					}
					result.push(gr);
				}
				this.displayedItemCount = libs.formatStr('{0} Showing only {1} item(s)', [this.recordInfo,(endIndex - 1) < 1 ? 0 : (endIndex - 1)]);
				this.config._recordsToShow = result;
				return result;
			}
			else if (isPager) {
				let startIndex = ((this.config.pager.curPage - 1) * this.config.pager.pageSize) + 1; 
				let endIndex = ((startIndex + parseInt(this.config.pager.pageSize)) < this.records.length ? (startIndex + parseInt(this.config.pager.pageSize)) : (this.records.length + 1)); 
				let result = [];
				for (let group of this.groupedRecords) {
					if (startIndex > group.records[group.records.length - 1].index) continue;
					if (endIndex <= group.records[0].index - 1) break;   
					let gr = Object.assign({}, group);
					gr.records = group.records.map(r => r);
					if (startIndex >= gr.records[0].index) {
						gr.records.splice(0, startIndex - (gr.records[0].index));
					}					
					if (endIndex <= gr.records[gr.records.length - 1].index) {
						gr.records.splice(endIndex - (gr.records[0].index));
					}
					result.push(gr);
				}
				this.config._recordsToShow = result;
				return result;
			}
			// Need for pagination;
			return this.groupedRecords;
		} else {
			let isPager = this.config.pager;
			if(!this.config.pager.pagerTop && !this.config.pager.pagerBottom){
				let startIndex = 0;
				let endIndex = this.records.length > 200 ? 200 : this.records.length;
				let result = [];
				for (let i = startIndex; i < endIndex; i++) {
					result.push(this.records[i]);
				}
				this.displayedItemCount = this.recordInfo+ ' Showing only '+ endIndex  +' item(s)';
				//console.log('result', JSON.parse(JSON.stringify(result)));
				this.config._recordsToShow = result;
				return result;
			}
			else if (isPager) {
				let startIndex = (this.config.pager.curPage - 1) * this.config.pager.pageSize;
				let endIndex = (startIndex + parseInt(this.config.pager.pageSize)) < this.records.length ? (startIndex + parseInt(this.config.pager.pageSize)) : this.records.length;
				let result = [];
				for (let i = startIndex; i < endIndex; i++) {
					result.push(this.records[i]);
				}
				//console.log('result', JSON.parse(JSON.stringify(result)));
				this.config._recordsToShow = result;
				return result;
			}
			// Need for pagination;
			this.config._recordsToShow = this.records;
			return this.records;
		}
	}

	get recordInfo() {
		let selected = this.records.filter(el => {
			return el._isChecked === true;
		});
		if (selected.length !== 0) {
			// return selected.length + ' item(s) selected of ' + this.records.length + ' item(s)';
			return libs.formatStr(this.config._LABELS.msg_recordSelection,[selected.length,this.records.length]);
		} else {
			return this.records.length + ' ' +this.config._LABELS.lbl_items;
		}
	}

	get hasGrouping() {
		let fieldName = (this.config.groupFieldName !== undefined && this.config.groupFieldName !== null && this.config.groupFieldName !== '') ? this.config.groupFieldName : undefined;
		if(fieldName !== undefined){
			let cItem = this.getColItem(this.config.groupFieldName);
			if(cItem === undefined){
				delete this.config.groupFieldName;
			}
			return cItem !== undefined;
		}
		return false;
	}

	get groupColspan() {
		let len = this.config.colModel.filter(col => !col.isHidden && !col._skipFieldFromDisplay).length;
		return len;
	}

	_sortSequence = [];
	/*config = {
		colModel : []
		records : []
		describe : []
	}*/
	/*

	Need to add
	Sorting
	filtering

	*/

	setGroupRecords() {
		let result = new Map();
		this.config.groupingParams = {
			field: this.config.groupFieldName,
			order: this.config.groupOrder ? this.config.groupOrder.toLowerCase() : 'ASC'
		}
		this.records.forEach(r => {
		
			let groupName;

			const splitFields = this.config.groupingParams.field.split('.');
			const fieldName = splitFields[0];
			const subFieldName = splitFields[1];

			if (subFieldName && r[fieldName] !== undefined) {
				groupName = r[fieldName][subFieldName] || 'empty';
			} else {
				const refFieldName = this.getRefFieldNameConsistsValue(this.config.groupingParams.field);

				if (r[refFieldName] === undefined || r[refFieldName] === null) {
					groupName = 'empty';
				} else if (typeof r[refFieldName] === 'object') {
					// In case of reference field
					const objectName = libs.getGlobalVar(this.cfg)?.objectNameFieldsMap.get(refFieldName);
					groupName = objectName ? r[refFieldName][objectName] : r[refFieldName].Name || 'empty';
				} else {
					groupName = r[refFieldName];
				}
			}
			let group = result.has(groupName) ? result.get(groupName) : {
				title: '<b>'+groupName+ '</b>',
				isChecked: false,
				isOpened: true,
				records: []
			};
			group.records.push(r);
			result.set(groupName, group);
		});
		result.forEach(group => {
			let checked = true;
			for (let rec of group.records) {
				if (!rec._isChecked) {
					checked = false;
					break;
				}
			}
			group.isChecked = checked;
		});
		result = this.config.groupingParams.order === undefined ? Array.from(result.values()) : Array.from(result.values()).sort((a, b) => {
			if (a.title > b.title) {
				return this.config.groupingParams.order === 'asc' ? 1 : -1;
			} else if (a.title < b.title) {
				return this.config.groupingParams.order === 'asc' ? -1 : 1;
			}
			return 0;
		});
		let ind = 1;
		result.forEach(group => {
			group.records.forEach(rec => {rec.index = ind++;})
		});
		try{
			this.groupedRecords = this.config?._advanced?.groupingFunction !== undefined && this.config?._advanced?.groupingFunction !== '' ? this.config._advanced.groupingFunction(this,libs,result) : result;
		}catch(e){
			// console.error(e);
			this.config._errors = libs.formatCallbackErrorMessages(e,'table','Grouping Function Callback');
			this.groupedRecords = result;
		}
		libs.getGlobalVar(this.cfg).groupedRecords = this.groupedRecords;
		//console.log('groupedRecords', JSON.parse(JSON.stringify(this.groupedRecords)));
	}

	getGroupRecIndexes(index) {
		for (let i = 0; i < this.groupedRecords.length; i++) {
			for (let j = 0; j < this.groupedRecords[i].records.length; j++) {
				if (this.groupedRecords[i].records[j].Id === index) return [i, j];
			}
		}
	}
	
	connectedCallback() {
		//super();
		this.config = libs.getGlobalVar(this.cfg);
		let describe = this.config.describe;
		this.config.listViewConfig.forEach((el)=>{
			if(el.cmpName === 'dataTable') {
				this.config = el;
			}
		});
		// this.config = libs.getGlobalVar(this.cfg).listViewConfig;
		// console.log('Config', JSON.parse(JSON.stringify(this.config)));
		this.config._LABELS = libs.getGlobalVar(this.cfg)._LABELS;
		
		this.config._saveEdit = this.saveEditCallback.bind(this);
		this.config._selectedRecords = this.getSelectedRecords.bind(this);
		this.config._updateView = this.updateView.bind(this);
		this.config._countFields = this.config.isShowCheckBoxes === true ? 1 : 0;
		if(this.config.advanced !== undefined && this.config.advanced !== ''){
			try{
				this.config._advanced = eval('['+this.config.advanced + ']')[0];
			}catch(e){
				// console.error('Error',e);
				this.config._errors = libs.formatCallbackErrorMessages(e,'table','Table Advanced JSON');
			}
		}
		this.defaultFields = this.defaultFields.length === 0 ? this.config.colModel.map(f => f.fieldName) : this.defaultFields;
		this.config.colModel = this.config.colModel.filter(f => this.defaultFields.includes(f.fieldName));
		this.additionalFields.forEach(add => {
			if (this.config.colModel.find(f => f.fieldName === add.fieldName)) return;
			this.config.colModel.push(add);
		});
		let tableWidth=0
		this.config.colModel.forEach((item,index) => {
			if(item.advanced !== undefined && item.advanced !== ''){
				try{
					item._advanced =  eval('['+item.advanced+ ']')[0];
				}catch(e){
					// console.error('Error',e);
					let msg = libs.formatCallbackErrorMessages(e,'field',item.label + ' advanced JSON');
					this.config._errors = this.config._errors ? this.config._errors + '</br>' +msg : msg;
				}
			}
			// console.log('item', item);
			if(this.config.enableColumnHeaderWrap){
				item.label = item.label.replace(/\b\w{6,}\b/g, match => {
					return match.replace(/(.{5})/g, '$1\u00AD');
				  });
				  //the regular expression /(\b\w{6,}\b)/g matches any word in item.label with more than 5 characters. The replace function within the callback function is then used to insert the unicode for hidden soft hyphen character after every 5 characters within those matched words to leverage the css hyphens property			  
			}
			if(index === 0){
				item._addSpace = true;
			}
			item._hideFromDisplay = item._skipFieldFromDisplay || item.isHidden;
			delete item._filterVariant;
			delete item._isFilterOptions;
			delete item._filterStrLastChangeDate;
			delete item.filterStr;
			delete item.filterStrTo;
			delete item.isShowClearBtn;
			delete item._filterCondition;
			delete item._filterVariant;
			delete item._filterStr;
			delete item._filterOption;
			if (describe !== undefined && describe[item.fieldName] !== undefined) {
				let fDescribe = describe[item.fieldName];
				//Need to add dynamyc parameters like a field length;
				item.length = fDescribe.length ? fDescribe.length : fDescribe.precision;
				item.inlineHelpText = fDescribe.inlineHelpText;

				if(item.isEditable){
					item._showEditableIcon = item.isEditable && fDescribe.updateable;
				}
			}
			if (item?._advanced?.formatter !== undefined && item?._advanced?.formatter!=="") {
				try {
					item._formatter = eval('(' + item?._advanced?.formatter + ')');
				} catch (e) {
					console.log('EXCEPTION', e);
				}
			}
			if (item?._advanced?.customStyle !== undefined && item?._advanced?.customStyle!== "") {
				try {
					item._uStyle = eval('(' + item?._advanced?.customStyle + ')');
				} catch (e) {
					console.log('EXCEPTION', e);
				}
			}
			if (item.width !== undefined) {
				let maxWidth = item.width.replace(';','').slice(-1) === '%' ? ';max-width: 40%;' : ';max-width: 500px;';
				let wd = (item.width.endsWith('%') || item.width.endsWith('px')) ? item.width : item.width + 'px';
				//item._style = 'width: ' + wd.replace(';','') + maxWidth + 'padding-left:1px;' + 'min-width: 100px;';
				if(item.width !== ""){
					//here checking the width is more than max width(500px in here) column can have and adding them in tableWidth
					tableWidth+= parseInt(wd.endsWith('%') ? wd.replace('%','') : wd.replace('px','')) >500 ? 500 : parseInt(wd.endsWith('%') ? wd.replace('%','') : wd.replace('px',''))
				}
				item._style = 'width: ' + wd.replace(';','') + maxWidth + 'padding-left:1px;';
			}else{
				item._style = 'padding-left:1px;padding-right:1px;';
			}
			if (item.isHidden!==true || item._skipFieldFromDisplay !== true) this.config._countFields ++;
			item.wrapClass = item.isWrapable
								? 'slds-cell-wrap'
								: 'slds-truncate';
			// item._isReference = (item.isNameField) ? true : false;
			item._filterCondition = item._filterCondition ? item._filterCondition : this.config._LABELS.lbl_columnFilter;
			delete item.isASCSort;

		});
		//this event fires when the dataTable reloads. Used it to refresh the action bar depending on the records available on the UI and to decide which actions should be visible
		const event = new CustomEvent('datatablerefresh');
		this.dispatchEvent(event);
		//Here first checking the table width(total width the user has enter for different column) with the screen size on the basic of where XRL is used
		//jira no- HYPER-557
		let compWidth= libs.getGlobalVar(this.cfg).componentWidth
		//console.log('width'+compWidth)
		let screenWidth=0
		if(compWidth === 'LARGE'){
			screenWidth = (window.screen.width - 100);
		}else if(compWidth === 'MEDIUM'){
			screenWidth = (window.screen.width/2);
		}else if(compWidth === 'SMALL'){
			screenWidth = (window.screen.width/4);
		}
		//console.log('container '+screenWidth+'  '+tableWidth)
		if(tableWidth >= screenWidth){
			this.config.colModel.forEach((item,index) => {
				if (item.width === undefined || item.width === "") {
					item._style = 'width:100px; padding-left:1px;padding-right:1px;' + 'max-width:500px;'
				}
			});
		}

		//Showing server side sorting
		this.config.orderMap?.forEach((el) =>{
			let col = this.config.colModel.find((e) => e.fieldName === el.field.fieldName);
			if(col != undefined){
				col.isASCSort = el.sortOrder === 'ASC';
			}
		});
		//this.config.colModel = JSON.parse(JSON.stringify(this.config.colModel));
		this.records = JSON.parse(JSON.stringify(libs.getGlobalVar(this.cfg).records));
		//console.log('length from datatable', this.cfg, this.records.length, this.records);
		this.initSort();
		//console.log('PAGER', this.config.pager);

		if (this.config.pager === undefined) {
			this.config.pager = {
				pagerTop : true,
				pagerBottom : true,
				curPage : 1,
				pageSize : '20',
				pageSizeOptions : [
					{ label: '5', value: '5' },
					{ label: '20', value: '20' },
					{ label: '50', value: '50' },
					{ label: '100', value: '100' },
					{ label: '200', value: '200' },
				]
			}
		}
		else{
			this.config.pager.curPage = 1;
			if(libs.getLocalStorageVar(this.cfg+'pageSize') === null){
				libs.setLocalStorageVar(this.cfg+'pageSize','20');
			}
			this.config.pager.pageSize = libs.getLocalStorageVar(this.cfg+'pageSize');
		}
		this.setNumPages(this.config.pager.pageSize);

		if (this.hasGrouping){
			this.setGroupRecords();
		}else{
			libs.getGlobalVar(this.cfg).groupedRecords = undefined;
		}
		this.config._originalURL = window.location.href;
		this.config._isShowRowCallbackTooltip = this.config._advanced?.rowCallback !== undefined;
		this.config._rowCallbackTooltipText = this.config._advanced?.rowCallbackTooltipText ?? this.config._LABELS.msg_rowCallbackEnabled; //added this so if rowCallback not defined it will use the default one.
		this.config._tableStyle = 'height: 100%; position: relative;overflow-x: auto;';
	}
	get isCheckboxDisabled(){
		return this.config?._advanced?.isSelectAllDisabled;
	}
	newValValidation(newValue, column){
		//return newValue === 'NONE' ? null : newValue;
		if(newValue === 'NONE')
			return null;

		if(column?.type && column.type === 'picklist'){
			return column?.options?.find(op=>{return op.value === newValue}).label;
		}
		return newValue;
	}

	saveEditCallback(isNeedSave, rowName, value) {
		if (isNeedSave === true) {
			if (rowName !== undefined) {
				this.config._inlineEditRow = this.config._inlineEditRow !== undefined ? 
				this.config._inlineEditRow : JSON.parse(JSON.stringify(libs.findRecordWithChild(this.records,this.config._inlineEdit)));
				let cItem = this.getColItem(rowName);
				if(cItem.type === 'reference' && cItem._editOptions){
					this.config._inlineEditRow[cItem.fieldName] = this.newValValidation(value,cItem);
					const referenceFieldName = this.getRefFieldNameConsistsValue(cItem.fieldName);
					if(this.config._inlineEditRow[referenceFieldName] && this.newValValidation(value,cItem) === null){
						this.config._inlineEditRow[referenceFieldName] = null;
					}
					if(this.config._inlineEditRow[cItem.fieldName] !== null){
						let newVal = cItem._editOptions.find((el)=>{
							return el.value === value;
						});
						// get the reference field name in the __r format
						if(this.config._inlineEditRow[referenceFieldName]){
							this.config._inlineEditRow[referenceFieldName].Id = newVal.value;
							this.config._inlineEditRow[referenceFieldName].Name = newVal.label;
						}
						// if(this.config._inlineEditRow[cItem.referenceTo]){
						// 	this.config._inlineEditRow[cItem.referenceTo].Id = newVal.value;
						// 	this.config._inlineEditRow[cItem.referenceTo].Name = newVal.label;
						// }
						else{
							this.config._inlineEditRow[referenceFieldName] ={
								Id: newVal.value,
								Name: newVal.label
							};
						}
					}
					
				}else{
					this.config._inlineEditRow[rowName] = this.newValValidation(value,cItem);
				}
			} else {
				let isNeedSaveData = this.config._inlineEditRow !== undefined && JSON.stringify(libs.findRecordWithChild(this.records,this.config._inlineEdit)) !== JSON.stringify(this.config._inlineEditRow);
				//console.log('isNeedSaveData', isNeedSaveData);
				if (isNeedSaveData)	{
					let r = libs.findRecordWithChild(this.records,this.config._inlineEdit);
					r = JSON.parse(JSON.stringify(this.config._inlineEditRow));
					//Need also Update a global array
					let globalItem = libs.findRecordWithChild(this.records,this.config._inlineEditRow.Id);
					// let globalItem = libs.getGlobalVar(this.cfg).records.find(el=>{
					// 	return el.Id === this.config._inlineEditRow.Id;
					// })
					r._cellCss = 'background-color:rgb(255,255,189);color:black;';
					r._isEditable = false;
					if(this.config?._advanced?.afterEditCallback !== undefined && this.config?._advanced?.afterEditCallback !== ""){
						try{
							this.config?._advanced?.afterEditCallback(this,libs,[r]);
						}catch(e){
							// console.error("Error",e);
							this.config._errors = libs.formatCallbackErrorMessages(e,'table','After Edit Callback');
						}
					}
					Object.assign(globalItem, r);
					libs.getGlobalVar(this.cfg).records = this.records;
					this.changeRecord(this.config._inlineEditRow.Id);
				}
				//delete this.records[this.config._inlineEdit];
				//delete this.config._inlineEdit;
				
				
				if(this.config._inlineEdit != undefined){
					let r1 = libs.findRecordWithChild(this.records,this.config._inlineEdit);
					r1._isEditable = false;
					if (this.hasGrouping) {
						let indexes = this.getGroupRecIndexes(this.config._inlineEdit);
						this.groupedRecords[indexes[0]].records[indexes[1]]._isEditable = false;
					}
					this.config._inlineEdit = undefined;
					this.config._inlineEditRow = undefined;
				}
			}
		} else {
			if(this.config._inlineEdit != undefined){
				let r = libs.findRecordWithChild(this.records,this.config._inlineEdit);
				r._isEditable = false;
				if (this.hasGrouping) {
					let indexes = this.getGroupRecIndexes(this.config._inlineEdit);
					this.groupedRecords[indexes[0]].records[indexes[1]]._isEditable = false;
				}
				this.config._inlineEdit = undefined;
			}
		}
		if (this.hasGrouping) this.setGroupRecords();
		this.config._tableStyle = 'height: 100%; position: relative;overflow-x: auto;';
	}

	changeRecord(id) {
		if (!this.config._changedRecords) this.config._changedRecords = new Set();
		this.config._changedRecords.add(id);
	}

	selectAll(event) {
		this.config._eventChecked = event.target.checked;

		//Here first we are updating the records which are visible on the screen and later updating other records asynchronously
		// to ensure minimal response time is maintained
		let startIndex = (this.config.pager.curPage - 1) * this.config.pager.pageSize;
		let endIndex = (startIndex + parseInt(this.config.pager.pageSize)) < this.records.length ? (startIndex + parseInt(this.config.pager.pageSize)) : this.records.length;
		for (let i = startIndex; i < endIndex; i++) {
			this.records[i]._isChecked = this.config._eventChecked;
		}
		
		setTimeout(()=> {
			this.checkAll();
		}, 0);
		this.rowCheckStatus();	
	}
	checkAll(){
		this.records.forEach(e => {
			e._isChecked = this.config._eventChecked
		});
		
		if (this.hasGrouping) {
			this.groupedRecords.forEach(group => {
			group.isChecked = this.config._eventChecked;
			group.records.forEach(rec => {
				rec._isChecked = this.config._eventChecked;
			});
			});
		}
	}

	toggleGroup(event) {
		let group = this.groupedRecords.find(gr => gr.title.toString() === event.target.getAttribute('data-groupind'));
		group.isOpened = !group.isOpened;
	}

	checkGroup(event) {
		let group = this.groupedRecords.find(gr => gr.title.toString() === event.target.getAttribute('data-groupind'));
		group.isChecked = !group.isChecked;
		group.records.forEach(rec => {
			rec._isChecked = group.isChecked;
			let rowind = this.records.findIndex(row => row.Id === rec.Id);
			this.records[rowind]._isChecked = group.isChecked;
		});
		this.updateSelectAllStatus(group.isChecked);
	}

	checkRow(event) {
		if (this.hasGrouping) {
			let rowind = this.records.findIndex(row => row.Id === event.target.getAttribute('data-rowid'));
			this.records[rowind]._isChecked = event.target.checked;
			let groupInd = this.groupedRecords.findIndex(gr => gr.title.toString() === event.target.getAttribute('data-groupind'));
			rowind = this.groupedRecords[groupInd].records.findIndex(row => row.Id === event.target.getAttribute('data-rowid'));
			this.groupedRecords[groupInd].records[rowind]._isChecked = event.target.checked;
			let checked = true;
			for (let rec of this.groupedRecords[groupInd].records) {
				if (!rec._isChecked) {
					checked = false;
					break;
				}
			}
			this.groupedRecords[groupInd].isChecked = checked;
		} else {
			// let rowind = event.target.getAttribute('data-rowid');
			// // this.records[this.calcRowIndex(rowind)]._isChecked = event.target.checked;
			const record = libs.findRecordWithChild(this.records, event.target.getAttribute('data-rowid'));
			// record._isChecked = event.target.checked;
			const isChecked = event.target.checked;
    		this.setCheckedForRecordAndChildren(record, isChecked);

		}
		this.updateSelectAllStatus(event.target.checked);
		this.rowCheckStatus();
	}
	setCheckedForRecordAndChildren(record, isChecked) {
		record._isChecked = isChecked;
	
		if (record.childRecords) {
			for (const childRecord of record.childRecords) {
				this.setCheckedForRecordAndChildren(childRecord, isChecked);
			}
		}
	}
	updateSelectAllStatus(checkStatus){
		let isAllRecordsSelected = this.template.querySelector('.checkAll');
		// deselecting the salectAll checkbox if one record is deselected
		if(isAllRecordsSelected.checked && !checkStatus) {
			isAllRecordsSelected.checked = false;
		}
		// selecting the salectAll checkbox if all record is selected
		if(!isAllRecordsSelected.checked && checkStatus && (this.records.length === this.getSelectedRecords().length)) {
			isAllRecordsSelected.checked = true;
		}
	}

	async rowCheckStatus(){
		// this.records.forEach(e => {
		// 	e._isChecked = event.target.checked
		// });
		// console.log('SElecting all 2');
		// if (this.hasGrouping) {
		// 	this.groupedRecords.forEach(group => {
		// 		group.isChecked = event.target.checked;
		// 		group.records.forEach(rec => {
		// 			rec._isChecked = event.target.checked;
		// 		});
		// 	});
		// }	
		if(this.getSelectedRecords().length>0){
			this.config.rowChecked = true;
		}else{
			this.config.rowChecked = false;
		}
	}

	calcRowIndex(rowId) {
		let isPager = this.config.pager && (this.config.pager.pagerTop || this.config.pager.pagerBottom);
		if (isPager) {
			return parseInt(this.config.pager.pageSize) * (this.config.pager.curPage - 1) + parseInt(rowId);
		} 
		return parseInt(rowId);
	}

	rowCallback(event) {

		try{
			let colName = event.srcElement?.getAttribute('data-colname') !== null ?
				event.srcElement.getAttribute('data-colname') :
				event.srcElement.parentNode.getAttribute('data-colname');

			if (colName === 'actions') return; // Not need process this column

			let rowId = event.srcElement?.getAttribute('data-rowind') != null ?
				event.srcElement.getAttribute('data-rowind') :
				event.srcElement.parentNode.getAttribute('data-rowind');

			/*if (rowInd != null && this.cmpConfig.inlineEdit !== rowInd) {
				//this.inlineEditRecord = JSON.parse(JSON.stringify(this.records[rowInd]));
				this.records[this.cmpConfig.inlineEdit] = this.inlineEditRecord;
				this.records[this.cmpConfig.inlineEdit]._isEditable = false;
				this.cmpConfig.inlineEdit = undefined
			}*/
			let cItem = this.getColItem(colName);
			let record;
			if (this.config._advanced?.rowCallback !== undefined) {
				try{
					record = libs.findRecordWithChild(this.records,event.target.getAttribute('data-recid'));
					let fn = this.config._advanced.rowCallback(this,libs,record, colName);
				}catch(e){
					// console.error('Exception in row callback', e);
					this.config._errors = libs.formatCallbackErrorMessages(e,'table','Row Callback');
				}
			}	

			if (cItem && cItem._advanced?.cellCallback) {
				try{
					if(record === undefined) record = libs.findRecordWithChild(this.records,event.target.getAttribute('data-recid'));
					let fn = cItem._advanced.cellCallback(this,libs,this.calcRowIndex(rowId), colName,record);
				}catch(e){
					// console.error('Exception in cell callback', e);
					this.config._errors = libs.formatCallbackErrorMessages(e,'table','Cell Callback');
				}
			}
		}catch(e){
			console.log('Exception in row callback', e);
		}
		//console.log('row click', event, colName, rowId);
	}

	async rowDblCallback(event) {
		let colName = event.srcElement.getAttribute('data-colname') !== null ?
				event.srcElement.getAttribute('data-colname') :
				event.srcElement.parentNode.getAttribute('data-colname');

		let rowInd = event.srcElement.getAttribute('data-rowind') != null ?
			event.srcElement.getAttribute('data-rowind') :
			event.srcElement.parentNode.getAttribute('data-rowind');

		let rowId = event.srcElement.getAttribute('data-rowid') != null ?
			event.srcElement.getAttribute('data-rowid') :
			event.srcElement.parentNode.getAttribute('data-rowid');

		let recId = event.target.getAttribute('data-recid');
		console.log('recId: ', recId);
		
		//console.log(rowInd + ' ' + rowId);

		let cItem = this.getColItem(colName);
		if (!cItem || !cItem._showEditableIcon) {
			const toast = new ShowToastEvent({
				title: 'Error',
				message: this.config._LABELS.msg_rowDblClickError,
				variant: 'error'
			});
			this.dispatchEvent(toast);
			return;
		}
		if(this.config.showStandardEdit && this.getSelectedRecords().length < 2){
			let calculatedInd = this.hasGrouping ? this.records.findIndex(rec => rowId === rec.Id) : this.calcRowIndex(rowInd);
			this.handleEventStandardEdit(this.records[calculatedInd].Id);
			this.config._intervalId = setInterval(() => {
				if(window.location.href === this.config._originalURL) {
					this.hasChanged = false;
					//console.log('Refresh',this.config._loadCfg);
					clearInterval(this.config._intervalId);
					this.config._loadCfg();
				}
			}, 500);
		} else{
			let groupInd;
			let groupRowInd;
			if (this.hasGrouping) {
				groupInd = this.groupedRecords.findIndex(gr => gr.title.toString() === event.target.parentNode.dataset.groupind);
				groupRowInd = this.groupedRecords[groupInd].records.findIndex(r => r.Id === rowId);
			}

			let calculatedInd = this.hasGrouping ? this.records.findIndex(rec => rowId === rec.Id) : this.calcRowIndex(rowInd);

		if (this.config._inlineEdit !== undefined) {
			//making it same as edit quote grid. Don't need to press enter after change in each row.
			this.saveEditCallback(true); 
			// this.records[this.config._inlineEdit]._isEditable = false;
			// if (this.hasGrouping) {
			// 	let indexes = this.getGroupRecIndexes(this.config._inlineEdit);
			// 	this.groupedRecords[indexes[0]].records[indexes[1]]._isEditable = false;
			// }
		}
		
		if (this.getSelectedRecords().length > 1) {
			//Bulk Edit
			let table = this.template.querySelector('.extRelListTable');
			//console.log('bulk', table.offsetHeight, event.y, table, event.srcElement.parentElement.parentElement.offsetTop, this.config);

			if (cItem.type === 'reference' && cItem.options === undefined) {
				let describe = libs.getGlobalVar(this.cfg).describe[cItem.fieldName];
				let fields = ['Id','Name'];
				if(cItem._advanced?.referencedObject?.fields){
					fields.push(...cItem._advanced?.referencedObject?.fields);
				}
				libs.remoteAction(this, 'query', {
					isNeedDescribe: false,
					sObjApiName: describe.referenceTo[0],
					fields: fields,
					addCondition: cItem._advanced?.referencedObject?.whereCondition ? libs.replaceLiteralsInStr(cItem._advanced.referencedObject.whereCondition,this.cfg) : '',
					callback: ((nodeName, data) => {
						//console.log('length from Citem', data[nodeName].records);
						cItem.options = [];
						cItem._editOptions = [];
						cItem._refNodeOptions = [...data[nodeName].records]; 
						if(cItem.nillable === true){
							cItem._editOptions.push({"label":'--None--',"value":'NONE'});
							cItem._refNodeOptions.push({"label":'--None--',"Id":'NONE'});
						}
						data[nodeName].records.forEach(e => {
							cItem.options.push(Object.assign({label: e.Name, value: e.Id},e));
							cItem._editOptions.push(Object.assign({"label":e.Name,"value":e.Id},e)); //need to refactor here and have to keep only one array
							
						});

						// console.log('cItem', cItem._editOptions);
					})
				});
				cItem.isEditableRegular = false;
			}
			let left = ((event.x - 60) + 320) > screen.availWidth ? (screen.availWidth - 380) : (event.x - 60);
			let rec = recId ===  null ? this.records[calculatedInd] : libs.findRecordWithChild(this.records, recId);
			//options callback
			if(cItem?._advanced?.optionsCallback !== undefined && cItem?._advanced?.optionsCallback !== ""){ 
				try{
					cItem.options = await cItem._advanced.optionsCallback(this,libs,cItem,rec);
				}catch(e){
					this.config._errors = libs.formatCallbackErrorMessages(e,'field','Options callback');
				}
			}
			this.config._bulkEdit = {
				rowId : calculatedInd,
				cItem : cItem,
				type : cItem.type,
				length : cItem.length,
				picklist: cItem.isEditableAsPicklist || cItem.type === 'reference', 
				value : rec[cItem.fieldName],
				chBoxLabel : libs.formatStr('Update {0} items', [this.getSelectedRecords().length]),
				chBoxValue : false,
				style: libs.formatStr("position:absolute;top:{0}px;left:{1}px", [(-table.offsetHeight + event.srcElement.parentElement.parentElement.offsetTop - (this.config.pager.pagerTop === true ? 110 : 40)), left]),
			}
			//this.config._isBulkEdit = true;
		} else {
				let record = recId ===  null ? this.records[calculatedInd] : libs.findRecordWithChild(this.records, recId);
				record._isEditable = true;
				record._focus = colName;
				//for multiselect to open on top or bottom
				this.setMultiselectPosition(record.sl);
				
				if (this.config._inlineEdit !== undefined) {
					record._isEditable = false;
					if (this.hasGrouping) {
						let indexes = this.getGroupRecIndexes(this.config._inlineEdit);
						this.groupedRecords[indexes[0]].records[indexes[1]]._isEditable = false;
					}
				}
				this.config._inlineEdit = record.Id;
				if(libs.getGlobalVar(this.cfg).optionsForMultiselect === undefined){
					libs.getGlobalVar(this.cfg).optionsForMultiselect = new Map();
				}
				this.config.colModel.forEach(async (el) => {
					//options callback
					if(el?._advanced?.optionsCallback !== undefined && el?._advanced?.optionsCallback !== ""){ 
						try{
							el.options = await el._advanced.optionsCallback(this,libs,el,record);
						}catch(e){
							this.config._errors = libs.formatCallbackErrorMessages(e,'field','Options callback');
						}
					}
					console.log('options',el.options);
					if(el._showEditableIcon && el.type === 'reference' && !el._editOptions){
						el._editOptions = [];
						if(cItem.nillable === true){
							el._editOptions.push({"label":'--None--',"value":'NONE'});
						}
						let fields = ['Id','Name'];
						if(el._advanced?.referencedObject?.fields){
							fields.push(...el._advanced?.referencedObject?.fields);
						}
						await libs.remoteAction(this, 'query', {
							fields: fields,
							relField: '',
							addCondition: el._advanced?.referencedObject?.whereCondition ? libs.replaceLiteralsInStr(el._advanced.referencedObject.whereCondition,this.cfg) : '',
							sObjApiName: el.referenceTo,
							callback: ((nodeName, data) => {
								data[nodeName].records.forEach((e)=>{
									el._editOptions.push(Object.assign({"label":e.Name,"value":e.Id},e));
								});
								// console.log('accountRecords', el._editOptions);
							})
						});
						libs.getGlobalVar(this.cfg).optionsForMultiselect.set(el.fieldName,el._editOptions);
						el._isLookUpEdit = true;
					}
				});

				if (this.hasGrouping) {
					this.groupedRecords[groupInd].records[groupRowInd]._isEditable = true;
					this.groupedRecords[groupInd].records[groupRowInd]._focus = colName;
				}
		}
	}
	}
	setMultiselectPosition(recordIndex){
		let recordPositionOnPage = recordIndex % parseInt(this.config.pager.pageSize);
		let midPoint = (parseInt(this.config.pager.pageSize)/2);
		if(recordPositionOnPage !== 0 && recordPositionOnPage < (midPoint + 2)){
			libs.getGlobalVar(this.cfg).openMultiselectAtBottom = true; 
		}else{
			libs.getGlobalVar(this.cfg).openMultiselectAtBottom = false; 
		}
		if ((this.config.pager.pageSize === "5" || this.config._recordsToShow.length <= 5) && libs.getGlobalVar(this.cfg).openMultiselectAtBottom) {
			// Check if min-height property already exists
			if (!this.config._tableStyle.includes("min-height")) {
				// Add min-height property if it doesn't exist
				this.config._tableStyle += "min-height: 460px;";
			}
		}
	}

	handleDropDownEvents(event) {
		//console.log('DD Event', event.detail);

		let rowInd = event.detail.index;

		if (typeof(this.config.rowCallback) === 'function') {

			this.config.rowCallback(rowInd, 'actions', event.detail);
		}
	}

	/*inlineEdit(event) {++
		let colName = event.srcElement.getAttribute('data-colname') !== null ?
			event.srcElement.getAttribute('data-colname') :
			event.srcElement.parentNode.getAttribute('data-colname');

		/*let rowInd = event.srcElement.getAttribute('data-rowind') != null ?
			event.srcElement.getAttribute('data-rowind') :
			event.srcElement.parentNode.getAttribute('data-rowind');

		this.inlineEditRecord[colName] = event.target.value;
		console.log(event.target.value, colName, rowInd);
	}*/

	setFilter(event) {
		// let colName = event.srcElement.getAttribute('data-id') !== null ?
		// 	event.srcElement.getAttribute('data-id') :
		// 	event.srcElement.parentNode.getAttribute('data-id');
		const colName = event.srcElement.getAttribute('data-id') ?? event.srcElement.parentNode.getAttribute('data-id');
		let cItem = this.getColItem(colName);
		let table = this.template.querySelector('.extRelListTable');

		if (cItem) {
			//console.log('cItem', cItem.type);
			if(cItem.type === 'boolean'){
				cItem.options = [
					{label:'True',value:'true'},
					{label:'False',value:'false'}
				];
			}
			let left = ((event.x - 52) + 800) > screen.availWidth ? (screen.availWidth - 800) : (event.x - 52);
			this.config._isFilterOptions = this.config._isFilterOptions && this.config._isFilterOptions.fieldName === colName ?
				undefined :
				{
					fieldName: colName,
					style: libs.formatStr("position:absolute;top:{0}px;left:{1}px;min-width:fit-content;", [(-table.offsetHeight + 20 - (this.config.pager.pagerTop === true ? 40 : 0)), left]),
					type: cItem.type,
					cItem : cItem,
					filterStrFocus: true,
					filterStr: cItem._filterStr,
					isShowStr : cItem.options === undefined,
					isShowClearBtn: (cItem._filterStr && cItem._filterStr.length > 0),
					//filterOption: cItem._filterOption ? cItem._filterOption : 'cn',
					filterOptions: filterLibs[cItem.type + 'FilterActions'] 
						? filterLibs[cItem.type + 'FilterActions'](this.config._LABELS)
						: [
							{ label: 'Contains', value: 'cn' },
							{ label: 'Is Equal', value: 'eq' },
							{ label: 'Not Is Equal', value: 'neq' },
						]

				};
				// if(this.config._isFilterOptions != undefined){
				// 	this.config._isFilterOptions.filterOption = cItem._filterOption ? cItem._filterOption : 'eq';
				// 	this.config._isFilterOptions.isUnary = this.config._isFilterOptions.filterOptions.find(item => {return this.config._isFilterOptions.filterOption === item.value}).isUnary != undefined ?
				// 											this.config._isFilterOptions.filterOptions.find(item => {return this.config._isFilterOptions.filterOption === item.value}).isUnary :
				// 											false;
				// 	this.config._isFilterOptions.filterStr = cItem._filterStr;
				// 	this.config._isFilterOptions.filterStrTo = cItem._filterStrTo;
				// 	this.config._isFilterOptions.isShowStr = cItem.options === undefined;
				// 	this.config._isFilterOptions.isShowToStr = this.config._isFilterOptions.filterOption === 'rg';
				// 	this.config._isFilterOptions.isShowClearBtn = (cItem._filterStr && cItem._filterStr.length > 0);
				// }
				const { _isFilterOptions } = this.config;
				const { _filterOption, _filterStr, _filterStrTo } = cItem;
				if (_isFilterOptions) {
					const filterOptionObj = _isFilterOptions.filterOptions.find(item => item.value === _filterOption) || {};
					const isUnary = filterOptionObj.isUnary ?? false;
					
					Object.assign(this.config._isFilterOptions, {
						filterOption: _filterOption || 'eq',
						isUnary,
						filterStr: _filterStr,
						filterStrTo: _filterStrTo,
						isShowStr: cItem.options === undefined,
						isShowToStr: _filterOption === 'rg',
						isShowClearBtn: (_filterStr && _filterStr.length > 0)
					});
				}

			setTimeout((() => { 
				if (this.template.querySelector('[data-id="filterStr"]')) {
					this.template.querySelector('[data-id="filterStr"]').focus();
					if (this.config._isFilterOptions.isShowClearBtn) this.template.querySelector('[data-id="filterStr"]').classList.add('hideIcon');
				} 
			}), 100);
		}

	}

	getColItem(colName) {
		return this.config.colModel.find(e => {
			return e.fieldName === colName
		});
	}

	searchClear(event) {
		this.config._isFilterOptions.filterStr = '';
		this.config._isFilterOptions.filterStrTo = '';
		this.config._isFilterOptions.isShowClearBtn = false;
		this.config._isFilterOptions.filterOption = undefined;
		//setTimeout((() => { this.template.querySelector('[data-id="filterStr"]').focus(); }), 100);
		this.searchFinish({which : 13})
	}
	handleLocalFilterSelect(event){
		//console.log(event.detail.payload.values);
		event.detail.value = event.detail.payload.values;
		this.sValues = JSON.parse(JSON.stringify(event.detail.payload.values));
		// console.log('hii',JSON.parse(JSON.stringify(event.detail.payload.values)));
		this.searchOnChange(event);
	}

	searchOnChange(event) {
		let fieldName = event.srcElement.getAttribute('data-id');
		//console.log(fieldName);
		if (fieldName === 'saveFilter') {
			this.searchFinish({which : 13});
			this.config.pager.curPage = 1;
			return;
		} 
		if (this.config._isFilterOptions.isShowStr) {
			this.config._isFilterOptions[fieldName] = event.detail.value === null && this.config._isFilterOptions.type === 'datetime' ? new Date().toISOString() : event.detail.value;
		} else {
			this.config._isFilterOptions[fieldName] = event.detail.payload ? event.detail.payload.values : event.detail;
		}
		this.config._isFilterOptions.isShowClearBtn = this.config._isFilterOptions.filterStr?.length > 0 || (this.config._isFilterOptions.filterStrTo && this.config._isFilterOptions.filterStrTo.length > 0);
		if (this.config._isFilterOptions.isShowClearBtn === false ) this.config._isFilterOptions.filterOption = undefined;
		else event.target.classList.add('hideIcon');
	}

	searchFinish(event) {
		if (event.which == 27) {
			this.config._isFilterOptions = undefined;
		}
		if (event.which == 13) {
			let isNeedRefilter = false;
			let cItem = this.getColItem(this.config._isFilterOptions.fieldName);
			if (cItem) {
				//console.log('column', JSON.stringify(cItem));
				isNeedRefilter = this.config._isFilterOptions?.filterStr === "" ? true : this.config._isFilterOptions?.filterOption === 'rg'
					? (cItem._filterStr !== this.config._isFilterOptions?.filterStr) || (cItem._filterStrTo !== this.config._isFilterOptions?._filterStrTo)
					: ((cItem._filterStr !== this.config._isFilterOptions?.filterStr) || (this.config._isFilterOptions?.isUnary && cItem._filterOption !==this.config._isFilterOptions?.filterOption));
				if(isNeedRefilter === undefined) isNeedRefilter = true;
				cItem._filterStr = this.config._isFilterOptions.filterStr;
				cItem._filterStrTo = this.config._isFilterOptions.filterStrTo;
				cItem._filterOption = this.config._isFilterOptions.filterOption;
				cItem._filterVariant = cItem._filterOption || cItem._filterStr && cItem._filterStr.length > 0 ? 'warning' : '';
				cItem._filterCondition = (cItem._filterStr && cItem._filterStr.length > 0) ? (filterLibs[cItem.type + 'FilterActions'](this.config._LABELS,cItem._filterOption).label + ' "' + cItem._filterStr) +'"': '';
				cItem._filterStrLastChangeDate = cItem._filterOption ? new Date().getTime() : undefined;				
			}
			this.config._isFilterOptions = undefined;
			if (isNeedRefilter) {
				this.config.isSpinner = true;
				setTimeout((() => { 
					this.filterTable();
				}), 10);
				// this.filterTable();
				//console.log('column', JSON.stringify(cItem));
			}

		}
	}

	getFilters() {
		return  this.config.colModel.filter( e=>  {
			return (e._filterStrLastChangeDate !== undefined )
		}).sort((a, b)=> {
			return (a._filterStrLastChangeDate > b._filterStrLastChangeDate) 
				? 1
				: (a._filterStrLastChangeDate < b._filterStrLastChangeDate)
					? -1
					: 0;
		});
	}

	searchOperationChange(event) {
		this.config._isFilterOptions.filterOption = event.target.value;
		this.config._isFilterOptions.isUnary = this.config._isFilterOptions.filterOptions.find(item => {return event.target.value === item.value}).isUnary;
		this.config._isFilterOptions.isShowToStr = this.config._isFilterOptions.filterOption === 'rg';
		this.config._isFilterOptions.isShowStr = !this.config._isFilterOptions.isUnary && !this.config._isFilterOptions.cItem.options;
		if (this.config._isFilterOptions.isUnary) this.config._isFilterOptions.isShowClearBtn = true;
		//console.log('change operator', this.config._isFilterOptions);
	}

	popupClose(event) {
		let node = event.srcElement.getAttribute('data-depend');
		this.config[node] = undefined;
	}

	filterTable() {
		let filters = this.getFilters();
		if (filters.length == 0) {
			//console.log('Need reset filters');
			this.records = JSON.parse(JSON.stringify(libs.getGlobalVar(this.cfg).records));
		} else {
			//console.log('Need filter by', filters.length);
			let allRecords = JSON.parse(JSON.stringify(libs.getGlobalVar(this.cfg).records));
			try{
				filters.forEach( filter => {
					//console.log('filter', JSON.parse(JSON.stringify(filter)));
					if (!filterLibs[filter.type + '__filter']) {
						console.error('Filter does not support for type', filter.type);
						return this.records = JSON.parse(JSON.stringify(libs.getGlobalVar(this.cfg).records));
					} else {
						allRecords = allRecords.filter(record=> {
							if(filter.type === 'reference' && record[(filter.fieldName).slice(0,-2)]){
								return filterLibs[filter.type + '__filter'](filter, record);
							}else{
								filter._locale = libs.getGlobalVar(this.cfg).userInfo.locale;
								filter._timeZone = libs.getGlobalVar(this.cfg).userInfo.timeZone;
								return filterLibs[filter.type + '__filter'](filter, record);
							}
						})
						this.records = allRecords;
					}
				});
			}catch(e) {
				console.log('Filter error',e.toString());
			}
		}
		this.setNumPages(this.config.pager.pageSize);
		
		if (this.hasGrouping) this.setGroupRecords();
		this.config.isSpinner = false;
	}


	initSort() {
		this.config.colModel.forEach((e, index) => { // unsorted -> asc -> desc
			if (e.isSortable === true && e.isASCSort !== undefined) {
				e._sortIcon = e.isASCSort === true ? 'utility:arrowup' : 'utility:arrowdown';
				let fieldName = e.fieldName.split('.')[1] != undefined ?
				e.fieldName.split('.')[1]
				:e.type === 'reference' ? 'Name' : e.fieldName;
				let refField = e.fieldName.split('.')[1] != undefined ? e.fieldName.split('.')[0] : e.type === 'reference' ? e.fieldName.slice(0,-2) : '';
				refField = this.getRefFieldNameConsistsValue(refField);
				this.records = libs.sortRecords(this.records, fieldName, e.isASCSort,refField);
			} else {
				e._sortIcon = undefined;
				e.isASCSort = undefined;
			}
		});
	}

	changeSort(event) {
		let fieldName = event.srcElement.getAttribute('data-id') !== null ?
			event.srcElement.getAttribute('data-id') :
			event.srcElement.parentNode.getAttribute('data-id');

		if (event.ctrlKey) { // sort by column sequence	

			let col = this.config.colModel.find(e => {return e.fieldName === fieldName && e.isSortable;});
			if (!col) return;
			if (this._sortSequence.includes(fieldName)) {
				this._sortSequence.splice(this._sortSequence.indexOf(fieldName), 1);
			}
			if (this.hasGrouping && fieldName === this.config.groupingParams.field) {
				this.config.groupingParams.order = this.config.groupingParams.order ? 'desc' : this.config.groupingParams.order === 'desc' ? undefined : 'asc';
			} else {
				this._sortSequence.push(fieldName);
				this.sortSequence();
			}

		} else { // sort by single column

			this._sortSequence = [];
			this.config.colModel.forEach((e, index) => { // unsorted -> asc -> desc
				if (fieldName === e.fieldName && e.isSortable === true && e.isASCSort !== false) {
					e.isASCSort = e.isASCSort === undefined;
					e._sortIcon = e.isASCSort ? 'utility:arrowup' : 'utility:arrowdown';
					if (this.hasGrouping && fieldName === this.config.groupingParams.field) this.config.groupingParams.order = e.isASCSort ? 'asc' : 'desc';
					else {
						let fieldName = e.fieldName.split('.')[1] != undefined ?
						e.fieldName.split('.')[1]
						:e.type === 'reference' ? 'Name' : e.fieldName;
						let refField = e.fieldName.split('.')[1] != undefined ? e.fieldName.split('.')[0] : e.type === 'reference' ? e.fieldName : '';
						refField = this.getRefFieldNameConsistsValue(refField);
						//console.log('fieldName: ' + fieldName, refField);
						this.records = libs.sortRecords(this.records, fieldName, e.isASCSort,refField);
						// this.records = libs.sortRecords(this.records, e.type === 'reference' ? 'Name' : e.fieldName, e.isASCSort, e.type === 'reference' ? e.fieldName.slice(0,-2) : '');
					}
				} else {
					e._sortIcon = undefined;
					e.isASCSort = undefined;
					if (this.hasGrouping && fieldName === this.config.groupingParams.field) undefined;
				}
			});
		}
		if (this.hasGrouping) this.setGroupRecords();
	}

	getRefFieldNameConsistsValue(fieldName){
		let refFieldName = fieldName;
		if (fieldName.endsWith('Id')) {
			refFieldName = fieldName.replace("Id", '');
		}
		if (fieldName.endsWith('__c')) {
			refFieldName = fieldName.replace("__c", '__r');
		}
		return refFieldName;
	}

	sortSequence() {
		if (this._sortSequence.length === 1) {
			this.config.colModel.forEach((e, index) => {
				if (this._sortSequence[0] !== e.fieldName) {
					e._sortIcon = undefined;
					e.isASCSort = undefined;
				}				
			});
		}
		let col = this.config.colModel.find(e => {return e.fieldName === this._sortSequence[this._sortSequence.length - 1];});
		if (col.isASCSort !== false) {
			col.isASCSort = col.isASCSort === undefined;
			col._sortIcon = col.isASCSort ? 'utility:arrowup' : 'utility:arrowdown';
		} else {
			col._sortIcon = undefined;
			col.isASCSort = undefined;
			this._sortSequence.pop();
		}
		for (let i = this._sortSequence.length - 1; i >= 0; i--) {
			let col = this.config.colModel.find(e => {return e.fieldName === this._sortSequence[i];});
			let fieldName = col.fieldName.split('.')[1] != undefined ?
				col.fieldName.split('.')[1]
				:col.type === 'reference' ? 'Name' : col.fieldName;
			let refField = col.fieldName.split('.')[1] != undefined ? col.fieldName.split('.')[0] : col.type === 'reference' ? col.fieldName.slice(0,-2) : '';
			refField = this.getRefFieldNameConsistsValue(refField);
			this.records = libs.sortRecords(this.records, fieldName, col.isASCSort,refField);
			// this.records = libs.sortRecords(this.records, col.type === 'reference' ? col.fieldName + '.Name' : col.fieldName, col.isASCSort);
		}
	}
	setNumPages(value) {
		this.config.pager.numPages = (this.records.length % parseInt(value) > 0) ? Math.floor(this.records.length / parseInt(value)) + 1 : Math.floor(this.records.length / parseInt(value))
	}

	handleEventPager(event) {
		let fieldsValue = [':pagerCurPage',':pagerPageSize'];
		let fieldName = event.srcElement.getAttribute('data-id');
		if (fieldsValue.indexOf(fieldName) > -1) {
			let value = event.srcElement.value;
			if (fieldName === ':pagerPageSize') {
				this.config.pager.curPage = 1,
				this.config.pager.pageSize = value;
				libs.setLocalStorageVar(this.cfg+'pageSize',this.config.pager.pageSize);
				
				this.setNumPages(value);
				// this.config.pager.pageSize = value;
			}
			if (fieldName === ':pagerCurPage') {
				
				this.config.pager.curPage = parseInt(value);
				if (value <= 1) this.config.pager.curPage = 1;
				if (value > this.config.pager.numPages) this.config.pager.curPage = this.config.pager.numPages;
			}
			//console.log('curPage ',this.config.pager.curPage);
			return;
		}
		switch (fieldName) {
			case ':pagerFirst': 
				this.config.pager.curPage = 1;
				break;
			case ':pagerLast' : 
				this.config.pager.curPage = this.config.pager.numPages;
				break;
			case ':pagerNext' : 
				this.config.pager.curPage += this.config.pager.curPage < this.config.pager.numPages ? 1 : 0;
				break;
			case ':pagerPrev' : 
				this.config.pager.curPage -= this.config.pager.curPage > 1 ? 1 : 0;
		}
		//console.log(fieldName);
	}

	handleEventBulk() {
		//HYPER-267
		this.config.isSpinner = true;
		setTimeout((() => { 
			this.executeBulk();
		}), 10);
	}
	executeBulk(){
		function changeItem(that, item, fieldName, v, refNode, refNodeValue) {
			
			
			// let origItem = origRecords.find(elem => {return elem.Id === item.Id});
			let origItem = that.origRecords.get(item.Id);
			let cItem = that.getColItem(fieldName);
			item[fieldName] = that.newValValidation(v,cItem);
			origItem[fieldName] = that.newValValidation(v,cItem);
			if (refNode !== undefined) {
				//console.log('REFERENCE', refNode, refNodeValue);
				item[refNode] = refNodeValue;
				origItem[refNode] = refNodeValue;
			}
			item._cellCss = 'background-color:rgb(255,255,189);color:black;';
			origItem._cellCss = 'background-color:rgb(255,255,189);color:black;';
			that.changeRecord(item.Id);
		}
		function getValue(cItem, v) {
			return v[cItem.isEditableBool ? 'checked' : 'value'];
		}

		let describe = libs.getGlobalVar(this.cfg).describe[this.config._bulkEdit.cItem.fieldName];
		let value = this.template.querySelector('[data-id="origValue"]');
		let chBox = this.template.querySelector('[data-id="isAll"]');
		// let origRecords = libs.getGlobalVar(this.cfg).records;
		// let flattenRecords = libs.flattenRecordsWithChildren(libs.getGlobalVar(this.cfg).records);
		this.origRecords = new Map(libs.getGlobalVar(this.cfg).records.map(record => [record.Id, record]));
		let refNode = describe?.relationshipName;
		let refNodeValue;

		//console.log('chBox.checked', chBox.checked, this.config._bulkEdit);
		
		if (describe?.type === 'reference') {

			refNodeValue = this.config._bulkEdit.cItem._refNodeOptions.find( elem =>{
				return elem.Id === value.value;
			});

			//console.log('this.config._bulkEdit.cItem', refNode, refNodeValue, value.value, this.config._bulkEdit.cItem.options);
		}
		if (chBox.checked === false) {
			//console.log('One item');
			changeItem(this, this.records[this.config._bulkEdit.rowId], this.config._bulkEdit.cItem.fieldName, getValue(this.config._bulkEdit.cItem, value), refNode, refNodeValue);
			if(this.config?._advanced?.afterEditCallback !== undefined && this.config?._advanced?.afterEditCallback !== ""){
				try{
					this.config?._advanced?.afterEditCallback(this,libs,[this.records[this.config._bulkEdit.rowId]]);
				}catch(e){
					// console.error("Error",e);
					this.config._errors = libs.formatCallbackErrorMessages(e,'table','After Edit Callback');
				}
			}
		} else {
			//console.log('More then One item');
			this.getSelectedRecords().forEach((item) => {
				changeItem(this, item, this.config._bulkEdit.cItem.fieldName, getValue(this.config._bulkEdit.cItem, value),refNode, refNodeValue);
			});
			if(this.config?._advanced?.afterEditCallback !== undefined && this.config?._advanced?.afterEditCallback !== ""){
				try{
					this.config?._advanced?.afterEditCallback(this,libs,this.getSelectedRecords());
				}catch(e){
					// console.error("Error",e);
					this.config._errors = libs.formatCallbackErrorMessages(e,'table','After Edit Callback');
				}
			}
		}
		//console.log('Bulk Edit', getValue(this.config._bulkEdit.cItem, value), chBox.checked);
		this.config._bulkEdit = undefined;

		if (this.hasGrouping) this.setGroupRecords();
		this.config.isSpinner = false;

		this.connectedCallback(); //BUN-46 - This is solving the problem but I can't find any root cause of this
	}
	get isDragDropEnabledForRecords(){
		return this.config?._advanced?.recordsDragDropCallback !== undefined && this.config?._advanced?.recordsDragDropCallback !== "";
	}

	DragStart(event) {
        event.target.classList.add('drag')
    }

    DragOver(event) {
        event.preventDefault()
        return false
    }
	Drop(event) {
		event.stopPropagation()
        const Element = this.template.querySelectorAll('.Items')
        const DragValName = this.template.querySelector('.drag').getAttribute('data-rowind');
        const DropValName = event.target.getAttribute('data-recid') !== null ? event.target.getAttribute('data-recid') : 'draggedOnHeader';
		console.log('dropped', DropValName);
		let cal = this.calcRowIndex(DropValName);
		let draggedRecord = libs.findRecordWithChild(this.records, DragValName);
		let futureParentRecord = null;
		if(DropValName !== 'draggedOnHeader'){
			futureParentRecord = libs.findRecordWithChild(this.records, DropValName);
		}
		//will do nothing if dropped on same record
		if(draggedRecord?.Id === futureParentRecord?.Id){
			return;
		}
		if(this.config?._advanced?.recordsDragDropCallback !== undefined && this.config?._advanced?.recordsDragDropCallback !== ""){
			try {
				this.config.records = eval('(' + this.config._advanced.recordsDragDropCallback + ')')(this, libs, this.records,draggedRecord,futureParentRecord);
				this.records = this.config.records;
				libs.getGlobalVar(this.cfg).records = this.config.records;
				this.changeRecord(draggedRecord.Id);
				
			} catch(e){
				// console.log('EXCEPTION', err);
				this.config._errors = libs.formatCallbackErrorMessages(e,'table','Records drag drop Callback');
			}
		}
		console.log('records',this.records);
		console.log('DragOver', DragValName,draggedRecord, DropValName, futureParentRecord);
		Element.forEach(element => {
            element.classList.remove('drag')
        });
	}
	@api
	updateView(){
		this.connectedCallback();
	}

	handleEventStandardEdit(recordId){
		this[NavigationMixin.Navigate]({
			type: 'standard__objectPage',
			attributes: {
				recordId: recordId, // pass the record id here.
				objectApiName: libs.getGlobalVar(this.cfg).sObjApiName,
				actionName: 'edit',
			}
		});
	}

	@api
	handleEventMessage(event) {
		
		if(event.detail.cmd.split(':')[1] === 'refresh' && event.detail.cmd.split(':')[0] === 'filter') {

			let sourceConf = libs.getGlobalVar(event.detail.source);
			//let fields = new Set(this.defaultFields);
			// this.additionalFields.forEach(f => fields.add(f.fieldName));
			// sourceConf.fields.forEach(f => fields.add(f));
			let fields= new Set();
			this.config.colModel.forEach((e)=> {
				if(e.type==="picklist" && e.fieldName !== 'CurrencyIsoCode'){ 
					fields.add('toLabel(' +e.fieldName + ')');
				}else{
					fields.add(e.fieldName);
				}
			});
			
			this.additionalFields.forEach(f =>{
				if(!fields.has(f.fieldName) && !fields.has('toLabel(' +f.fieldName + ')')){
					fields.add(f.fieldName);
				}
			});
			sourceConf.fields.forEach(f =>{
				if(!fields.has(f) && !fields.has('toLabel(' +f + ')')){
					fields.add(f)
				}
			});

			libs.remoteAction(this, 'query', {
				isNeedDescribe: true,
				sObjApiName: sourceConf.sObjApiName,
				relField: sourceConf.relField === 'Id' ? '' : sourceConf.relField,
				addCondition: sourceConf.condition,
				fields: Array.from(fields),
				listViewName: sourceConf.listView?.name,
				callback: ((nodeName, data) => {  
					
					// this.config.records = libs.getGlobalVar(this.cfg).records;

					if(this.config._advanced?.afterloadTransformation !== undefined && this.config._advanced?.afterloadTransformation !== ""){
						try {
							this.config.records = this.config._advanced?.afterloadTransformation(this, data[nodeName].records.length > 0 ? data[nodeName].records : []);
							libs.getGlobalVar(this.cfg).records = this.config.records;
						} catch(e){
							// console.log('EXCEPTION', err);
							this.config._errors = libs.formatCallbackErrorMessages(e,'table','After Load Transformation Callback');
						}
					} else {
						libs.getGlobalVar(this.cfg).records = data[nodeName].records.length > 0 ? data[nodeName].records : [];
						this.config.records = libs.getGlobalVar(this.cfg).records;
					}

					this.connectedCallback();
				})
			});
			this.title = '';		

		} else if(event.detail.cmd.split(':')[1] === 'refresh' && event.detail.cmd.split(':')[0] === 'chart') {

			this.title = event.detail.title ? event.detail.title + ' - ' : '';
			libs.getGlobalVar(this.cfg).records = libs.getGlobalVar(event.detail.source).records;
			this.config.records = libs.getGlobalVar(this.cfg).records;
			this.connectedCallback();		

		}else if(event.detail.cmd.split(':')[1] === 'updateDatatableView' ) {

			this.connectedCallback();		

		}else if(event.detail.cmd.split(':')[1] === 'updateFields') {

			this.additionalFields = [];
			event.detail.fields.forEach(f => {
				let field = {					
					"css": "slds-item",
					"type": "string",
					"isEditable": false,
					"isFilterable": true,
					"isSortable": true,
					"wrapClass": "slds-truncate",
					"_filterCondition": "Column Filters"
				};
				Object.assign(field, f);
				this.additionalFields.push(field);
			});
			this.connectedCallback();
		}
	}

	@api
	handlePostMessageEvents(operations){
		/* eslint-disable */
		for (const operation in operations) {
			if(operation === 'refresh'){
				console.log('Refreshing DataTable Layout...');
				let configData = JSON.parse(JSON.stringify(operations[operation]));
				let fields = configData.fields;
				this.additionalFields.forEach(f => fields.add(f.fieldName));
				libs.remoteAction(this, 'query', {
					isNeedDescribe: true,
					sObjApiName: configData.sObjApiName,
					relField: configData.relField === 'Id' ? '' : configData.relField,
					addCondition: configData.condition,
					fields: Array.from(fields),
					listViewName: configData.listView?.name,
					callback: ((nodeName, data) => {  
						
						// this.config.records = libs.getGlobalVar(this.cfg).records;
	
						if(this.config._advanced?.afterloadTransformation !== undefined && this.config._advanced?.afterloadTransformation !== ""){
							try {
								this.config.records = this.config._advanced?.afterloadTransformation(this, data[nodeName].records.length > 0 ? data[nodeName].records : []);
								libs.getGlobalVar(this.cfg).records = this.config.records;
							} catch(e){
								// console.log('EXCEPTION', err);
								this.config._errors = libs.formatCallbackErrorMessages(e,'table','After Load Transformation Callback');
							}
						} else {
							libs.getGlobalVar(this.cfg).records = data[nodeName].records.length > 0 ? data[nodeName].records : [];
							this.config.records = libs.getGlobalVar(this.cfg).records;
						}
						const message = new Map();
						message.set(configData.sendAcknowledgementTo,
						{
							'status':'success',
						});
						libs.broadcastMessage(this,message);
						this.connectedCallback();
					})
				});
			}
		}
	}

}