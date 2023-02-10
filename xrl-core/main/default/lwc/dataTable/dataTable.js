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
	@api recordId;
	@api objectApiName;
	sValues = [];
	showPop(event){
		this.showPopOver = true;
		let hoverConstValues = {
			5:810,
			20:1250,
			50:2100,
			100:3510,
			200:6360
		};
		this.popStyle = libs.formatStr("position:absolute;top:{0}px;left:{1}px", [((event.pageY - document.body.scrollTop) - hoverConstValues[this.config.pager.pageSize]), (event.clientX - 52)]);
		this.objectApiName = event.target.getAttribute('data-colname');
		let record = this.records.find((el) =>{
			return el.Id === event.target.getAttribute('data-recordind')
		});

		let col = this.config.colModel.find((el)=>{
			return el.fieldName === this.objectApiName
		});

		if (col.referenceTo) {
			this.objectApiName = col.referenceTo;
			this.recordId = record[col.fieldName.split('.')[0]].Id;
		}

	}
	hidePop(event){
		this.showPopOver=false;
	}

	@api
	getRecords() {
		// this methood need to get data from paren component
		console.log('length from datatable getrecords', this.cfg, this.records.length);
		return this.records;
	}
	@api
	getSelectedRecords() {
		// this methood need to get data from paren component
		console.log('length from datatable getrecords', this.cfg, this.records.length);
		return this.records.filter(el => {
			return el._isChecked === true;
		});
	}

	@api
	setUpdateInfo(v) {
		this.updateInfo = v;
	}
	updateInfo = '';

	get tableRecords() {
		this.records.forEach((el,ind) =>{
			el.sl = ind + 1;
			if(this.config.rowCss){
				el._rowStyle = this.config.rowCallback ? 'cursor : pointer;' : '';
				el._rowStyle += eval('(' + this.config.rowCss + ')')(el);
			}
		});

		if (this.hasGrouping) {

			let isPager = this.config.pager;
			if(!this.config.pager.pagerTop && !this.config.pager.pagerBottom){
				let startIndex = 0;
				let endIndex = this.records.length > 200 ? 200 : this.records.length;
				let result = [];
				for (let i = startIndex; i < endIndex; i++) {
					result.push(this.records[i]);
				}
				this.displayedItemCount = this.recordInfo+ ' Showing only '+ endIndex  +' item(s)';
				console.log('result', JSON.parse(JSON.stringify(result)));
				return result;
			}
			else if (isPager) {
				let startIndex = ((this.config.pager.curPage - 1) * this.config.pager.pageSize) + 1; 
				let endIndex = ((startIndex + parseInt(this.config.pager.pageSize)) < this.records.length ? (startIndex + parseInt(this.config.pager.pageSize)) : this.records.length) + 1; 
				let result = [];
				for (let group of this.groupedRecords) {
					if (startIndex > group.records[group.records.length - 1].index) continue;
					if (endIndex <= group.records[0].index - 1) break;   
					let gr = Object.assign({}, group);
					gr.records = group.records.map(r => r);
					if (startIndex >= gr.records[0].index) {
						gr.records.splice(0, startIndex - (gr.records[0].index));
					}					
					if (endIndex < gr.records[gr.records.length - 1].index) {
						gr.records.splice(endIndex - (gr.records[0].index + 1));
					}
					console.log('gr ',gr.records.length);
					result.push(gr);
				}
				console.log('result size', JSON.parse(JSON.stringify(result)).length);
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
				console.log('result', JSON.parse(JSON.stringify(result)));
				return result;
			}
			else if (isPager) {
				let startIndex = (this.config.pager.curPage - 1) * this.config.pager.pageSize;
				let endIndex = (startIndex + parseInt(this.config.pager.pageSize)) < this.records.length ? (startIndex + parseInt(this.config.pager.pageSize)) : this.records.length;
				let result = [];
				for (let i = startIndex; i < endIndex; i++) {
					result.push(this.records[i]);
				}
				console.log('result', JSON.parse(JSON.stringify(result)));
				return result;
			}
			// Need for pagination;
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
		// return this.config.grouping === true;
		console.log('hasGrouping ',this.config.groupFieldName !== undefined && this.config.groupFieldName !== null && this.config.groupFieldName !== '');
		return this.config.groupFieldName !== undefined && this.config.groupFieldName !== null && this.config.groupFieldName !== '';
	}

	get groupColspan() {
		let len = this.config.colModel.filter(col => !col.isHidden).length;
		len += !this.config.isShowNumeration ? -1 : 0;
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
			if(this.config.groupingParams.field.split('.')[1]){
				groupName = r[this.config.groupingParams.field.split('.')[0]][this.config.groupingParams.field.split('.')[1]] || 'empty';
			}else{
				groupName = r[this.config.groupingParams.field] || 'empty';
			}
			let group = result.has(groupName) ? result.get(groupName) : {
				title: groupName,
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
		this.groupedRecords = result;
		console.log('groupedRecords', JSON.parse(JSON.stringify(this.groupedRecords)));
	}

	getGroupRecIndexes(index) {
		for (let i = 0; i < this.groupedRecords.length; i++) {
			for (let j = 0; j < this.groupedRecords[i].records.length; j++) {
				if (this.groupedRecords[i].records[j].Id === this.records[index].Id) return [i, j];
			}
		}
	}
	
	connectedCallback() {
		//super();
		this.config = libs.getGlobalVar(this.cfg);
		this.config.listViewConfig.forEach((el)=>{
			if(el.cmpName === 'dataTable') {
				this.config = el;
			}
		});
		// this.config = libs.getGlobalVar(this.cfg).listViewConfig;
		console.log('Config', JSON.parse(JSON.stringify(this.config)));
		this.config._LABELS = libs.getGlobalVar(this.cfg)._LABELS;
		
		this.config._saveEdit = this.saveEditCallback.bind(this);
		this.config._selectedRecords = this.getSelectedRecords.bind(this);
		this.config._updateView = this.updateView.bind(this);
		this.config._countFields = this.config.isShowCheckBoxes === true ? 1 : 0;
		console.log(JSON.parse(JSON.stringify(this.config.colModel)));
		this.config.colModel.forEach(item => {
			if (item.formatter !== undefined) {
				try {
					item._formatter = eval('(' + item.formatter + ')');
				} catch (e) {
					console.log('EXCEPTION', e);
				}
			}
			if (item.uStyle !== undefined) {
				try {
					item._uStyle = eval('(' + item.uStyle + ')');
				} catch (e) {
					console.log('EXCEPTION', e);
				}
			}
			if (item.width !== undefined) {
				let maxWidth = item.width.replace(';','').slice(-1) === '%' ? ';max-width: 40%;' : ';max-width: 500px;';
				item._style = 'width: ' + item.width.replace(';','') + maxWidth;
			}
			if (item.isHidden!==true) this.config._countFields ++;
			item.wrapClass = item.isWrapable
								? 'slds-cell-wrap'
								: 'slds-truncate';
			// item._isReference = (item.isNameField) ? true : false;
			item._filterCondition = item._filterCondition ? item._filterCondition : this.config._LABELS.lbl_columnFilter;
		});
		//this.config.colModel = JSON.parse(JSON.stringify(this.config.colModel));
		this.records = JSON.parse(JSON.stringify(libs.getGlobalVar(this.cfg).records));
		console.log('length from datatable', this.cfg, this.records.length, this.records);
		this.initSort();
		console.log('PAGER', this.config.pager);

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
		this.setNumPages(this.config.pager.pageSize);

		if (this.hasGrouping) this.setGroupRecords();
	}

	saveEditCallback(isNeedSave, rowName, value) {
		if (isNeedSave === true) {
			if (rowName !== undefined) {
				this.config._inlineEditRow = JSON.parse(JSON.stringify(this.records[this.config._inlineEdit]));
				let cItem = this.getColItem(rowName);
				if(rowName.includes('.') && cItem._editOptions){
					this.config._inlineEditRow[rowName.split('.')[0]+'Id'] = value;
					let newVal = cItem._editOptions.find((el)=>{
						return el.value === value;
					});
					if(this.config._inlineEditRow[rowName.split('.')[0]]){
						this.config._inlineEditRow[rowName.split('.')[0]].Id = newVal.value;
						this.config._inlineEditRow[rowName.split('.')[0]].Name = newVal.label;
					}else{
						this.config._inlineEditRow[rowName.split('.')[0]] ={
							Id: newVal.value,
							Name: newVal.label
						};
					}
					
				}else{
					this.config._inlineEditRow[rowName] = value;
				}
			} else {
				let isNeedSaveData = this.config._inlineEditRow !== undefined && JSON.stringify(this.records[this.config._inlineEdit]) !== JSON.stringify(this.config._inlineEditRow);

				if (isNeedSaveData)	{
					this.records[this.config._inlineEdit] = JSON.parse(JSON.stringify(this.config._inlineEditRow));
					//Need also Update a global array
					let globalItem = libs.getGlobalVar(this.cfg).records.find(el=>{
						return el.Id === this.config._inlineEditRow.Id;
					})
					Object.assign(globalItem, this.records[this.config._inlineEdit]);
					this.changeRecord(this.config._inlineEditRow.Id);
				}
				//delete this.records[this.config._inlineEdit];
				//delete this.config._inlineEdit;
				
				
				if(this.config._inlineEdit != undefined){
					this.records[this.config._inlineEdit]._isEditable = false;
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
				this.records[this.config._inlineEdit]._isEditable = false;
				if (this.hasGrouping) {
					let indexes = this.getGroupRecIndexes(this.config._inlineEdit);
					this.groupedRecords[indexes[0]].records[indexes[1]]._isEditable = false;
				}
				this.config._inlineEdit = undefined;
			}
		}
		if (this.hasGrouping) this.setGroupRecords();
	}

	changeRecord(id) {
		if (!this.config._changedRecords) this.config._changedRecords = [];
		if (this.config._changedRecords.indexOf(id) === -1) this.config._changedRecords.push(id);
	}

	// get rowStyle() {
	// 	return this.config.rowCallback ? 'cursor : pointer' : '';
	// }

	selectAll(event) {
		this.records.forEach(e => {
			e._isChecked = event.target.checked
		});
		if (this.hasGrouping) {
			this.groupedRecords.forEach(group => {
				group.isChecked = event.target.checked;
				group.records.forEach(rec => {
					rec._isChecked = event.target.checked;
				});
			});
		}	
		this.rowCheckStatus();	
	}

	toggleGroup(event) {
		let group = this.groupedRecords.find(gr => gr.title === event.target.getAttribute('data-groupind'));
		group.isOpened = !group.isOpened;
	}

	checkGroup(event) {
		let group = this.groupedRecords.find(gr => gr.title === event.target.getAttribute('data-groupind'));
		group.isChecked = !group.isChecked;
		group.records.forEach(rec => {
			rec._isChecked = group.isChecked;
			let rowind = this.records.findIndex(row => row.Id === rec.Id);
			this.records[rowind]._isChecked = group.isChecked;
		});
	}

	checkRow(event) {
		if (this.hasGrouping) {
			let rowind = this.records.findIndex(row => row.Id === event.target.getAttribute('data-rowid'));
			this.records[rowind]._isChecked = event.target.checked;
			let groupInd = this.groupedRecords.findIndex(gr => gr.title === event.target.getAttribute('data-groupind'));
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
			let rowind = event.target.getAttribute('data-rowind');
			this.records[this.calcRowIndex(rowind)]._isChecked = event.target.checked;
		}
		this.rowCheckStatus();
	}

	rowCheckStatus(){
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

		let colName = event.srcElement.getAttribute('data-colname') !== null ?
			event.srcElement.getAttribute('data-colname') :
			event.srcElement.parentNode.getAttribute('data-colname');

		if (colName === 'actions') return; // Not need process this column

		let rowId = event.srcElement.getAttribute('data-rowind') != null ?
			event.srcElement.getAttribute('data-rowind') :
			event.srcElement.parentNode.getAttribute('data-rowind');

		/*if (rowInd != null && this.cmpConfig.inlineEdit !== rowInd) {
			//this.inlineEditRecord = JSON.parse(JSON.stringify(this.records[rowInd]));
			this.records[this.cmpConfig.inlineEdit] = this.inlineEditRecord;
			this.records[this.cmpConfig.inlineEdit]._isEditable = false;
			this.cmpConfig.inlineEdit = undefined
		}*/

		if (typeof(this.config.rowCallback) === 'function') {
			console.log('this.config.rowCallback', this.config.rowCallback);
			this.config.rowCallback(rowId, colName);
		}
		let cItem = this.getColItem(colName);

		if (cItem && cItem.cellCallback) {
			cItem.cellCallback(this.calcRowIndex(rowId), colName);
		}
		console.log('row click', event, colName, rowId);
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
		
		console.log(rowInd + ' ' + rowId);

		let cItem = this.getColItem(colName);
		if (!cItem || !cItem.isEditable) {
			const toast = new ShowToastEvent({
				title: 'Error',
				message: this.config._LABELS.msg_rowDblClickError,
				variant: 'error'
			});
			this.dispatchEvent(toast);
			return;
		}
		if(this.config.showStandardEdit){
			let calculatedInd = this.hasGrouping ? this.records.findIndex(rec => rowId === rec.Id) : this.calcRowIndex(rowInd);
			this.handleEventStandardEdit(this.records[calculatedInd].Id);
		} else{
			let groupInd;
			let groupRowInd;
			if (this.hasGrouping) {
				groupInd = this.groupedRecords.findIndex(gr => gr.title === event.target.parentNode.dataset.groupind);
				groupRowInd = this.groupedRecords[groupInd].records.findIndex(r => r.Id === rowId);
			}

			let calculatedInd = this.hasGrouping ? this.records.findIndex(rec => rowId === rec.Id) : this.calcRowIndex(rowInd);

		if (this.config._inlineEdit !== undefined) {
			this.records[this.config._inlineEdit]._isEditable = false;
			if (this.hasGrouping) {
				let indexes = this.getGroupRecIndexes(this.config._inlineEdit);
				this.groupedRecords[indexes[0]].records[indexes[1]]._isEditable = false;
			}
		}
		
		if (this.getSelectedRecords().length > 1) {
			let table = this.template.querySelector('.extRelListTable');
			console.log('bulk', table.offsetHeight, event.y, table, event.srcElement.parentElement.parentElement.offsetTop, this.config);

				if (cItem.type === 'reference' && cItem.options === undefined) {
					let describe = libs.getGlobalVar(this.cfg).describe[cItem.fieldName];
					libs.remoteAction(this, 'query', {
						isNeedDescribe: false,
						sObjApiName: describe.referenceTo[0],
						fields: ['Id', 'Name'],
						callback: ((nodeName, data) => {
							console.log('length', data[nodeName].records);
							cItem.options = [];
							data[nodeName].records.forEach(e => {
								cItem.options.push({label: e.Name, value: e.Id});
								
							});

							//console.log('cItem', col.options, libs.getGlobalVar(this.cfg));
						})
					});
				}
				this.config._bulkEdit = {
					rowId : calculatedInd,
					cItem : cItem,
					type : cItem.type,
					value : this.records[calculatedInd][cItem.fieldName],
					chBoxLabel : libs.formatStr('Update {0} items', [this.getSelectedRecords().length]),
					chBoxValue : false,
					style: libs.formatStr("position:absolute;top:{0}px;left:{1}px", [(-table.offsetHeight + event.srcElement.parentElement.parentElement.offsetTop - (this.config.pager.pagerTop === true ? 110 : 40)), (event.x - 60)]),
				}
				//this.config._isBulkEdit = true;
			} else {
				let record = this.records[calculatedInd];
				record._isEditable = true;
				record._focus = colName;
				if (this.config._inlineEdit !== undefined) {
					this.records[this.config._inlineEdit]._isEditable = false;
					if (this.hasGrouping) {
						let indexes = this.getGroupRecIndexes(this.config._inlineEdit);
						this.groupedRecords[indexes[0]].records[indexes[1]]._isEditable = false;
					}
				}
				this.config._inlineEdit = calculatedInd;
		
				if (this.getSelectedRecords().length > 1) {
					let table = this.template.querySelector('.extRelListTable');
					console.log('bulk', table.offsetHeight, event.y, table, event.srcElement.parentElement.parentElement.offsetTop, this.config);

					if (cItem.type === 'reference' && cItem.options === undefined) {
						let describe = libs.getGlobalVar(this.cfg).describe[cItem.fieldName];
						libs.remoteAction(this, 'query', {
							isNeedDescribe: false,
							sObjApiName: describe.referenceTo[0],
							fields: ['Id', 'Name'],
							callback: ((nodeName, data) => {
								console.log('length', data[nodeName].records);
								cItem.options = [];
								data[nodeName].records.forEach(e => {
									cItem.options.push({label: e.Name, value: e.Id});
								});
								cItem.refNodeOptions = data[nodeName].records; 
							})
						});
					}
					this.config._bulkEdit = {
						rowId : calculatedInd,
						cItem : cItem,
						type : cItem.type,
						value : this.records[calculatedInd][cItem.fieldName],
						chBoxLabel : libs.formatStr('Update {0} items', [this.getSelectedRecords().length]),
						chBoxValue : false,
						style: libs.formatStr("position:absolute;top:{0}px;left:{1}px", [(-table.offsetHeight + event.srcElement.parentElement.parentElement.offsetTop - (this.config.pager.pagerTop === true ? 110 : 40)), (event.x - 60)]),
					}
					//this.config._isBulkEdit = true;
				} else {
					// Need get all visible references fields and get data for thise fields
					// let record = this.records[calculatedInd];
					// record._focus = colName;
					cItem.wrapClass = cItem.type === 'picklist' || cItem.type === 'multipicklist' || (cItem.fieldName.split('.')[1] && cItem.isNameField) ? 'slds-cell-wrap' : cItem.wrapClass;

					if(cItem.fieldName.split('.')[1] && cItem.isNameField && !cItem._editOptions){
						cItem._editOptions = [];
						await libs.remoteAction(this, 'query', {
							fields: ['Id','Name'],
							relField: '',
							sObjApiName: cItem.fieldName.split('.')[0],
							callback: ((nodeName, data) => {
								console.log('accountRecords', data[nodeName].records.length);
								data[nodeName].records.forEach((el)=>{
									cItem._editOptions.push({"label":el.Name,"value":el.Id});
								});
							})
						});
						cItem._isLookUpEdit = true;
					}
					// record._isEditable = true;


					// this.config._inlineEdit = calculatedInd;

						if (this.hasGrouping) {
							this.groupedRecords[groupInd].records[groupRowInd]._isEditable = true;
							this.groupedRecords[groupInd].records[groupRowInd]._focus = colName;
						}
				}
		}
	}

		//console.log('dbl click', event, colName, rowInd);
	}

	handleDropDownEvents(event) {
		console.log('DD Event', event.detail);

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
		let colName = event.srcElement.getAttribute('data-id') !== null ?
			event.srcElement.getAttribute('data-id') :
			event.srcElement.parentNode.getAttribute('data-id');
		let cItem = this.getColItem(colName);
		let table = this.template.querySelector('.extRelListTable');

		if (cItem) {
			console.log('cItem', cItem.type);
			if(cItem.type === 'boolean'){
				cItem.options = [
					{label:'True',value:'true'},
					{label:'False',value:'false'}
				];
			}
			this.config._isFilterOptions = this.config._isFilterOptions && this.config._isFilterOptions.fieldName === colName ?
				undefined :
				{
					fieldName: colName,
					style: libs.formatStr("position:absolute;top:{0}px;left:{1}px", [(-table.offsetHeight + 20 - (this.config.pager.pagerTop === true ? 40 : 0)), (event.x - 52)]),
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
				if(this.config._isFilterOptions != undefined){
					this.config._isFilterOptions.filterOption = cItem._filterOption ? cItem._filterOption : 'eq';
					this.config._isFilterOptions.isUnary = this.config._isFilterOptions.filterOptions.find(item => {return this.config._isFilterOptions.filterOption === item.value}).isUnary != undefined ?
															this.config._isFilterOptions.filterOptions.find(item => {return this.config._isFilterOptions.filterOption === item.value}).isUnary :
															false;
					this.config._isFilterOptions.filterStr = cItem._filterStr;
					this.config._isFilterOptions.filterStrTo = cItem._filterStrTo;
					this.config._isFilterOptions.isShowStr = cItem.options === undefined;
					this.config._isFilterOptions.isShowToStr = this.config._isFilterOptions.filterOption === 'rg';
					this.config._isFilterOptions.isShowClearBtn = (cItem._filterStr && cItem._filterStr.length > 0);
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
		console.log(event.detail.payload.values);
		event.detail.value = event.detail.payload.values;
		this.sValues = JSON.parse(JSON.stringify(event.detail.payload.values));
		// console.log('hii',JSON.parse(JSON.stringify(event.detail.payload.values)));
		this.searchOnChange(event);
	}

	searchOnChange(event) {
		let fieldName = event.srcElement.getAttribute('data-id');
		console.log(fieldName);
		if (fieldName === 'saveFilter') {
			this.searchFinish({which : 13});
			return;
		} 
		if (this.config._isFilterOptions.isShowStr) {
			this.config._isFilterOptions[fieldName] = event.detail.value;
		} else {
			this.config._isFilterOptions[fieldName] = event.detail.payload ? event.detail.payload.values : event.detail;
		}
		this.config._isFilterOptions.isShowClearBtn = this.config._isFilterOptions.filterStr.length > 0 || (this.config._isFilterOptions.filterStrTo && this.config._isFilterOptions.filterStrTo.length > 0);
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
				console.log('column', JSON.stringify(cItem));
				isNeedRefilter = ((cItem._filterStr !== this.config._isFilterOptions.filterStr) || (this.config._isFilterOptions.isUnary && cItem._filterOption !==this.config._isFilterOptions.filterOption));
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
				this.filterTable();
				console.log('column', JSON.stringify(cItem));
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
		console.log('change operator', this.config._isFilterOptions);
	}

	popupClose(event) {
		let node = event.srcElement.getAttribute('data-depend');
		this.config[node] = undefined;
	}

	filterTable() {
		let filters = this.getFilters();
		if (filters.length == 0) {
			console.log('Need reset filters');
			this.records = JSON.parse(JSON.stringify(libs.getGlobalVar(this.cfg).records));
		} else {
			console.log('Need filter by', filters.length);
			let allRecords = JSON.parse(JSON.stringify(libs.getGlobalVar(this.cfg).records));
			filters.forEach( filter => {
				console.log('filter', JSON.parse(JSON.stringify(filter)));
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
			
		}
		this.setNumPages(this.config.pager.pageSize);
		
		if (this.hasGrouping) this.setGroupRecords();
	}


	initSort() {
		this.config.colModel.forEach((e, index) => { // unsorted -> asc -> desc
			if (e.isSortable === true && e.isASCSort !== undefined) {
				e._sortIcon = e.isASCSort === true ? 'utility:arrowdown' : 'utility:arrowup';
				this.records = libs.sortRecords(this.records, e.type === 'reference' ? e.fieldName + '.Name' : e.fieldName, e.isASCSort);
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
					e._sortIcon = e.isASCSort ? 'utility:arrowdown' : 'utility:arrowup';
					if (this.hasGrouping && fieldName === this.config.groupingParams.field) this.config.groupingParams.order = e.isASCSort ? 'asc' : 'desc';
					else {
						this.records = libs.sortRecords(this.records, e.type === 'reference' ? 'Name' : e.fieldName, e.isASCSort, e.type === 'reference' ? e.fieldName.slice(0,-2) : '');
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
			col._sortIcon = col.isASCSort ? 'utility:arrowdown' : 'utility:arrowup';
		} else {
			col._sortIcon = undefined;
			col.isASCSort = undefined;
			this._sortSequence.pop();
		}
		for (let i = this._sortSequence.length - 1; i >= 0; i--) {
			let col = this.config.colModel.find(e => {return e.fieldName === this._sortSequence[i];});
			this.records = libs.sortRecords(this.records, col.type === 'reference' ? col.fieldName + '.Name' : col.fieldName, col.isASCSort);
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
				
				this.setNumPages(value);
				this.config.pager.pageSize = value;
			}
			if (fieldName === ':pagerCurPage') {
				
				this.config.pager.curPage = value;
				if (value <= 1) this.config.pager.curPage = 1;
				if (value > this.config.pager.numPages) this.config.pager.curPage = this.config.pager.numPages;
			}
			console.log('curPage ',this.config.pager.curPage);
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
		console.log(fieldName);
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
			
			
			let origItem = origRecords.find(elem => {return elem.Id === item.Id});
			item[fieldName] = v;
			origItem[fieldName] = v;
			if (refNode !== undefined) {
				console.log('REFERENCE', refNode, refNodeValue);
				item[refNode] = refNodeValue;
				origItem[refNode] = refNodeValue;
			}
			
			that.changeRecord(item.Id);
		}
		function getValue(cItem, v) {
			return v[cItem.isEditableBool ? 'checked' : 'value'];
		}

		let describe = libs.getGlobalVar(this.cfg).describe[this.config._bulkEdit.cItem.fieldName];
		let value = this.template.querySelector('[data-id="origValue"]');
		let chBox = this.template.querySelector('[data-id="isAll"]');
		let origRecords = libs.getGlobalVar(this.cfg).records;
		let refNode = describe.relationshipName;
		let refNodeValue;

		console.log('chBox.checked', chBox.checked, this.config._bulkEdit);
		
		if (describe.type === 'reference') {

			refNodeValue = this.config._bulkEdit.cItem.refNodeOptions.find( elem =>{
				return elem.Id === value.value;
			});

			console.log('this.config._bulkEdit.cItem', refNode, refNodeValue, value.value, this.config._bulkEdit.cItem.options);
		}
		if (chBox.checked === false) {
			console.log('One item');
			changeItem(this, this.records[this.config._bulkEdit.rowId], this.config._bulkEdit.cItem.fieldName, getValue(this.config._bulkEdit.cItem, value), refNode, refNodeValue);
		} else {
			console.log('More then One item');
			this.getSelectedRecords().forEach((item) => {
				changeItem(this, item, this.config._bulkEdit.cItem.fieldName, getValue(this.config._bulkEdit.cItem, value),refNode, refNodeValue);
			});
		}
		console.log('Bulk Edit', getValue(this.config._bulkEdit.cItem, value), chBox.checked);
		this.config._bulkEdit = undefined;

		if (this.hasGrouping) this.setGroupRecords();
		this.config.isSpinner = false;
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
	handleEventMessage(event){
		if(event.detail.cmd.split(':')[1] === 'refresh') this.connectedCallback();
	}

}