import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from "lightning/navigation"
import { encodeDefaultFieldValues, decodeDefaultFieldValues } from 'lightning/pageReferenceUtils'

import resource from '@salesforce/resourceUrl/extRelList';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';


export default class extRelList extends NavigationMixin(LightningElement) {

	@api ApiName;
	//@api AddCondition;
	@api name;
	//@api mField1;
	@api recordId;
	@api defaultListView;

	@track config = {};
	@track localConfig = {};
	@track listViews = [];

	@track showDialog = false;
	@track dialogCfg;

	constructor() {
		super()
		Promise.all([
			loadStyle(this, resource + '/css/extRelList.css'),
			loadScript(this, resource + '/js/xlsx.full.min.js'),
			//loadScript(this, leaflet + '/leaflet.js')
		]).then(() => {
			console.log('Resources are loaded');
		});

		window.addEventListener('beforeunload', (event) => {
			if (this.config.listViewConfig._changedRecords) {
				event.preventDefault();
				event.returnValue = '';
			}
		});
	}

	connectedCallback() {
		console.log('RENDERED');
		this.loadCfg(true);
	}

	loadCfg(isInit) {
		let apiNames = this.ApiName.split(':');
		this.localConfig = {};

		let cfg = libs.loadConfig(this.name);
		if (cfg !== undefined) {
			this.localConfig = cfg;
			libs.setGlobalVar(this.name, {
				"sObjLabel": apiNames[0],
				"sObjApiName": apiNames[1],
				"relField": apiNames[2],
				//"fields": ['Id', 'LastModifiedDate'],
				"iconName": "standard:" + apiNames[1].toLowerCase()
			});
		} else {
			libs.setGlobalVar(this.name, {
				"sObjLabel": apiNames[0],
				"sObjApiName": apiNames[1],
				"relField": apiNames[2],
				"fields": ['Id', 'LastModifiedDate'],
				"iconName": "standard:" + apiNames[1].toLowerCase()
			});
		}
		this.config = libs.getGlobalVar(this.name);
		console.log(this.name);
		console.log(JSON.parse(JSON.stringify(this.config)));
		
		let listViewName = isInit && this.defaultListView !== undefined ? this.defaultListView : (!isInit && this.name !== undefined ? this.name : undefined);
		console.log(this.defaultListView);
		console.log(listViewName);
		libs.remoteAction(this, 'getConfig', { sObjApiName: this.config.sObjApiName, relField: this.config.relField, listViewName: listViewName, callback: this.loadRecords.bind(this) });
	}

	loadRecords(cmd, data) {
		libs.getGlobalVar(this.name).userInfo = data.userInfo;

		data[cmd].baseConfig = (data[cmd].baseConfig) ? JSON.parse(data[cmd].baseConfig) : {};
		data[cmd].userConfig = (data[cmd].userConfig) ? JSON.parse(data[cmd].userConfig) : {};

		console.log('data[cmd].baseConfig', data[cmd].baseConfig);
		console.log('data[cmd].userConfig', data[cmd].userConfig);

		if (data[cmd].userConfig.colModel === undefined) {
			data[cmd].userConfig.colModel = [{
				"fieldName" : "Id"
			}];
		}

		let mergedConfig = {};
		Object.assign(mergedConfig, data[cmd].userConfig);
		mergedConfig.colModel = [];

		let baseColMap = new Map();
		data[cmd].baseConfig?.colModel?.forEach(col => {
			baseColMap.set(col.fieldName, col);
		});
		data[cmd].userConfig?.colModel?.forEach(col => {
			if (baseColMap.has(col.fieldName)) {
				let mergedCol = Object.assign(baseColMap.get(col.fieldName), col);
				mergedConfig.colModel.push(mergedCol);
				baseColMap.delete(col.fieldName)
			} else {
				mergedConfig.colModel.push(col);
			}
		});
		mergedConfig.colModel.push(...Array.from(baseColMap.values()));
		console.log('mergedConfig', mergedConfig);

		this.config.listViewConfig = mergedConfig;
		this.config.listView = data[cmd].listViews.find(v => { return v.isUserConfig;});
		this.config.currency =  data[cmd].currency;
		//if (this.config.userInfo.isAdminAccess === true) delete this.localConfig.listViewName;
		this.config.describe = data[cmd].describe ? JSON.parse(data[cmd].describe) : {};
		if (this.config.userInfo.isAdminAccess) {
			this.listViews = data[cmd].listViews.map(v => {return {label: v.label ? v.label : v.name, value: v.name};});
		} else {
			this.listViews = data[cmd].listViews.filter(v => { return !v.isAdminConfig;}).map(v => {return {label: v.label ? v.label : v.name, value: v.name};});
		}		

		this.config.fields = [];
		this.config.lockedFields = [];
		this.config.listViewConfig?.colModel?.forEach(e => {
			let describe = this.config.describe[e.fieldName];
			if (describe && describe.type === 'reference') {
				this.config.fields.push(describe.relationshipName + '.Name');
				if (e.locked) this.config.lockedFields.push(describe.relationshipName + '.Name');
			}
			this.config.fields.push(e.fieldName);
			if (e.locked) this.config.lockedFields.push(e.fieldName);
		});

		libs.remoteAction(this, 'query', {
			isNeedDescribe: true,
			sObjApiName: this.config.sObjApiName,
			relField: this.config.relField,
			addCondition: this.config.listViewConfig.addCondition,
			fields: this.config.fields,
			listViewName: this.config?.listView?.name,
			callback: ((nodeName, data) => {
				console.log('length', data[nodeName].records);
				
				libs.getGlobalVar(this.name).records = data[nodeName].records.length > 0 ? data[nodeName].records : undefined;
				this.config.records = libs.getGlobalVar(this.name).records;
				console.log('loadRecords', libs.getGlobalVar(this.name));
				this.generateColModel();
			})
		});
	}

	generateColModel() {
		this.config.listViewConfig.colModel.forEach(e => {
			let describe = this.config.describe[e.fieldName];
			if (e.label === undefined) e.label = describe.label;
			if (e.type === undefined) e.type = describe.type;
			e.isNameField = describe && describe.nameField === true;
			if (e.isEditable && describe.updateable) {
				if (e.type === 'picklist') {
					e.isEditableAsPicklist = true;
					e.options = [];
					describe.picklistValues.forEach(field => {
						e.options.push(
							{ label: field.label, value: field.value }
						)
					});
					console.log('picklist', e);
				} else if (e.type === 'boolean') {
					e.isEditableBool = true;
				} else {
					e.isEditableRegular = true;
				}
			} else {
				e.isEditable = false;
			}
		});
	}

	get changedRecords() {
		return 'Count of changed records ' + this.config.listViewConfig._changedRecords.length;
	}

	resetChangedRecords() {
		this.template.querySelector('c-Data-Table').setUpdateInfo('• ' + this.config.listViewConfig._changedRecords.length + ' item(s) updated');
		setTimeout((() => { this.template.querySelector('c-Data-Table').setUpdateInfo(''); }), 3000);
		this.config.listViewConfig._changedRecords = undefined;
	}

	handleEvent(event) {
		let val = event.target.getAttribute('data-id');
		console.log(val);
		if (val.startsWith('cfg:')) this.handleEventCfg(event);
		if (val.startsWith('dialog:')) this.handleEventDialog(event);
		if (val.startsWith(':refresh')) {
			//libs.remoteAction(this, 'getConfig', { sObjApiName: this.config.sObjApiName, relField: this.config.relField, listViewName: this.localConfig.listViewName, callback: this.loadRecords });
			libs.remoteAction(this, 'getConfig', { sObjApiName: this.config.sObjApiName, relField: this.config.relField, listViewName: this.config?.listView?.name, callback: this.loadRecords });
		}

		if (val.startsWith(':action_')) this.handleEventActions(event, val);

		if (val.startsWith(':save')) {


			//libs.getGlobalVar(this.name).records = undefined;

			let changedItems = this.template.querySelector('c-Data-Table').getRecords().filter(el => {
				// In thiscase need merge to libs.getGlobalVar(this.name).records;
				return this.config.listViewConfig._changedRecords.indexOf(el.Id) > -1
			})

			//changedItems = JSON.parse(JSON.stringify(changedItems));
			libs.remoteAction(this, 'saveRecords', { records: changedItems, sObjApiName: this.config.sObjApiName, callback: this.resetChangedRecords });
		}

		if (val.startsWith(':change_view')) {
			this.name = event.target.value;
			this.loadCfg(false);
		}
		if (val.startsWith(':request_open')) {
			this.dialogCfg = {
				title: 'Request a feature',
				contents: [
					{
						required: true,
						isTextarea: true,
						name: 'featureText',
						variant: 'label-hidden',
						placeholder: 'Please describe feature',
						messageWhenValueMissing: 'An empty message cannot be sent'
					}
				],
				buttons: [
					{
						name: 'cancel',
						label: 'Cancel',
						variant: 'neutral'
					},
					{
						name: 'send',
						label: 'Send',
						variant: 'brand',
						class: 'slds-m-left_x-small'
					}
				]
			};
			this.showDialog = true;
		}
		if (val.startsWith(':dialog')) {
			if (event.detail.action === 'cancel') this.showDialog = false;
			else {
				event.target.setLoading(true);
				libs.remoteAction(this, 'requestFeature', {
					text: event.detail.data.featureText, callback: ((cmd, result) => {
						if (result.requestFeatureResult.isSuccess) {
							const toast = new ShowToastEvent({
								title: 'Success',
								message: 'Request was sent',
								variant: 'success'
							});
							this.dispatchEvent(toast);
							this.showDialog = false;
						} else {
							const toast = new ShowToastEvent({
								title: 'Error',
								message: result.requestFeatureResult.error,
								variant: 'error'
							});
							this.dispatchEvent(toast);
						}
					})
				});
			}
		}
	}

	handleEventCfg(event) {
		this.config = libs.getGlobalVar(this.name);
		let variant = this.config.userInfo.isAdminAccess === true ? 'error' : 'shade'; // shade, error, warning, info, confirm
		let fields = [];
		for (let key in this.config.describe) {
			fields.push({ label: this.config.describe[key].label, value: this.config.describe[key].name });
		}
		let lockedOptions = [];
		for (let col of this.config.listViewConfig.colModel) {
			lockedOptions.push({ label: col.label, value: col.fieldName });
		}
		this.config.listViewConfig.isShowCheckBoxes = true;
		this.config.dialog = {
			"title": this.config.userInfo.isAdminAccess === true ? 'List View Configuration' : 'Select Fields to Display',
			"variant": variant,
			"css": 'slds-modal__header slds-theme_{1} slds-theme_alert-texture'.replace('{1}', variant),
			"options": libs.sortRecords(fields, 'label', true),
			"selectedFields": this.config.fields,
			"requiredOptions": this.config.lockedFields,
			"lockedOptions": libs.sortRecords(lockedOptions, 'label', true),
			"lockedFields": this.config.lockedFields,
			"handleEvent": this.handleEventDialog.bind(this),
			"listViewConfig": JSON.parse(JSON.stringify(this.config?.listViewConfig)),
			"listViewName": this.config?.listView?.name,
			"listViewLabel": this.config?.listView?.label,
			"listViewAdmin": this.config?.listView?.isAdminConfig
		};
	}

	handleEventDialog(event) {
		let val = event.target.getAttribute('data-id');
		if (val === 'dialog:close') this.config.dialog = undefined;
		if (val === 'dialog:setFields') {
			this.config.dialog.selectedFields = event.detail.value;

			this.config.dialog.field = undefined;
			let tmpColModel = [];
			this.config.dialog.selectedFields.forEach((selItem, index) => {
				let colModelItem = !this.config.dialog.listViewConfig.colModel
					? undefined
					: this.config.dialog.listViewConfig.colModel.find(cItem => {
						return cItem.fieldName == selItem;
					})
				if (colModelItem) tmpColModel.push(colModelItem)
				else tmpColModel.push(libs.colModelItem(selItem));
			});

			this.config.dialog.listViewConfig.colModel = tmpColModel;

			console.log(this.config.dialog.selectedFields);
		}
		if (val === 'dialog:setLockedFields') {
			this.config.dialog.lockedFields = event.detail.value;

			console.log(JSON.parse(JSON.stringify(this.config.dialog.lockedFields)));

			this.config.dialog.listViewConfig.colModel.forEach((col, index) => {
				if (this.config.dialog.lockedFields.includes(col.fieldName)) col.locked = true;
				else col.locked = undefined;
			});

			console.log(JSON.parse(JSON.stringify(this.config.dialog.listViewConfig.colModel)));
		}

		if (val === 'dialog:setField') {
			this.config.dialog.field = event.detail.value;
		}
		if (val === 'dialog:setFieldParam') {
			let param = event.target.getAttribute('data-param');
			let type = event.target.getAttribute('data-type');
			let value = (type === 'checkbox') ? event.target.checked : event.target.value;
			console.log(type, param, value);

			let field = this.config.dialog.listViewConfig.colModel.find(e => {
				return e.fieldName === this.config.dialog.field;
			})

			if (field) {
				field[param] = value;
			} else {
				field = { 'fieldName': this.config.dialog.field };
				field[param] = value;
				this.config.dialog.listViewConfig.colModel.push(field);
			}
		}
		if (val === 'dialog:setAddCondition') {
			this.config.dialog.listViewConfig.addCondition = event.detail.value;
		}

		if (val === 'dialog:saveAs') {
			this.config.dialog.saveAs = true;
		}
		if (val === 'dialog:saveAsCancel') {
			this.config.dialog.saveAs = false;
		}
		if (val === 'dialog:saveAsName') {
			this.config.dialog.listViewName = event.target.value;
		}
		if (val === 'dialog:saveAsLabel') {
			this.config.dialog.listViewLabel = event.target.value;
		}
		if (val === 'dialog:saveAsFinish') {
			console.log('SaveAs Finish', this.config.dialog.listViewName);
			//

			libs.remoteAction(this, 'saveListView', { config: this.prepareConfigForSave(), listViewName: this.config.dialog.listViewName, listViewLabel: this.config.dialog.listViewLabel, sObjApiName: this.config.sObjApiName, relField: this.config.relField, addCondition: /*this.AddCondition*/this.config.dialog.listViewConfig.addCondition, listViewAdmin: this.config.dialog.listViewAdmin, callback: this.saveListView });

		}
		if (val === 'dialog:save') {
			console.log(this.config.dialog.selectedFields, JSON.stringify(this.config.dialog.listViewConfig));

			libs.remoteAction(this, 'saveListView', { config: this.prepareConfigForSave(), listViewName: this.config.dialog.listViewName, listViewLabel: this.config.dialog.listViewLabel, sObjApiName: this.config.sObjApiName, relField: this.config.relField, addCondition: /*this.AddCondition*/this.config.dialog.listViewConfig.addCondition, listViewAdmin: this.config.dialog.listViewAdmin, callback: this.saveListView });

			/*this.config.fields = this.config.dialog.selectedFields;
			
			this.config.tableData = undefined;
			let config = JSON.parse(JSON.stringify(this.config));
			config.tableData = undefined;
			config.dialog = undefined;
			libs.saveConfig(this.ApiName, config);
			libs.remoteAction(this, 'query', {isNeedDescribe : true, sObjApiName: this.config.sObjApiName, relField : this.config.relField, addCondition : this.AddCondition, fields: this.config.fields, callback : this.loadRecords});*/
		}
	}
	prepareConfigForSave() {
		let tmp = JSON.parse(JSON.stringify(this.config.dialog.listViewConfig));
		for (let key in tmp) {
			if (key.startsWith('_')) delete tmp[key];
		}
		return JSON.stringify(tmp, null, '\t')
	}

	saveListView(nodeName, data) {
		const event = new ShowToastEvent({
			title: 'success',
			message: 'ListView was updated',
			variant: 'success'
		});
		this.dispatchEvent(event);
		this.config.listView.name = data[nodeName].listViewName;
		console.log(this.ApiName);
		console.log(JSON.parse(JSON.stringify(this.localConfig)));
		libs.saveConfig(this.ApiName, this.localConfig);
		this.config.dialog = undefined;
		this.config.records = undefined;
		libs.remoteAction(this, 'getConfig', { sObjApiName: this.config.sObjApiName, relField: this.config.relField, listViewName: this.config?.listView?.name, callback: this.loadRecords });
	}

	handleEventActions(event, val) {
		if (val.startsWith(':action_export')) this.handleEventExport(event);
		if (val.startsWith(':action_delete')) {
			let records = this.template.querySelector('c-Data-Table').getSelectedRecords();
			libs.remoteAction(this, 'delRecords', { records: records, sObjApiName: this.config.sObjApiName, callback: this.loadRecords });
		}

		if (val.startsWith(':action_new')) {

			let defValue = {};
			defValue[this.config.relField] = this.recordId;

			this[NavigationMixin.Navigate]({
				type: 'standard__objectPage',
				attributes: {
					/*recordId: this.recordId, // pass the record id here.*/
					objectApiName: this.config.sObjApiName,
					actionName: 'new',
				},
				state: {
					defaultFieldValues: encodeDefaultFieldValues(defValue)
				}
			});
		}
	}

	handleEventExport(event) {

		let records = this.template.querySelector('c-Data-Table').getRecords();
		let locale = libs.getGlobalVar(this.name).userInfo.locale;

		console.log(JSON.parse(JSON.stringify(this.config)));
		console.log(JSON.parse(JSON.stringify(records)));

		let wb = XLSX.utils.book_new();
		wb.cellStyles = true;
		wb.Props = {
			Title: this.config.sObjLabel,
			Subject: this.config.sObjLabel + " Export",
			Author: "Extended Related List",
			CreatedDate: new Date(),

		};
		let wrapText = { wrapText: '0' };
		let evenStyle = { alignment: wrapText, bold: false, color: { rgb: 0 }, fgColor: { rgb: 15658734 } };
		let oddStyle = { alignment: wrapText, bold: false, color: { rgb: 0 } };

		let ws = {
			'!cols': []
		};
		let columns = this.config.listViewConfig.colModel.filter(col => { return !col.isHidden; });
		records.forEach((rec, i) => {
			columns.forEach((col, j) => {
				if (i === 0) {
					let cell_ref = XLSX.utils.encode_cell({ c: j, r: i });
					ws[cell_ref] = {
						v: col.label, s: { bold: true, fgColor: { rgb: 0 }, color: { rgb: 16777215 } }
					}
					ws['!cols'].push({ wch: 40 });
				}
				let cell_ref = XLSX.utils.encode_cell({ c: j, r: i + 1 });
				ws[cell_ref] = {
					s: i % 2 ? evenStyle : oddStyle
				};
				switch (col.type) {
					case 'reference':
						let [r, v] = libs.getLookupRow(rec, col.fieldName);
						ws[cell_ref].v = r.Name;
						ws[cell_ref].l = { Target: window.location.origin + '/' + v, Tooltip: window.location.origin + '/' + v };

						break;
					case 'date':
					case 'datetime':
						ws[cell_ref].v = new Date(rec[col.fieldName]);
						//.toLocaleString(locale);
						ws[cell_ref].t = 'd';

						break;
					case 'number':
						ws[cell_ref].v = rec[col.fieldName] ? Number(rec[col.fieldName]) : '';
						ws[cell_ref].t = 'n';
						break;
					case 'boolean':
						ws[cell_ref].v = Boolean(rec[col.fieldName]);
						ws[cell_ref].t = 'b';
						break;
					default:
						ws[cell_ref].v = rec[col.fieldName] ? rec[col.fieldName] : '';
						ws[cell_ref].t = 's';
				}
			});
		});
		ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: columns.length, r: records.length } });
		console.log(ws);
		console.log(ws['!cols']);
		console.log(ws['!ref']);
		XLSX.utils.book_append_sheet(wb, ws, this.config.sObjLabel);
		XLSX.writeFile(wb, this.config.sObjLabel + '.xlsx', { cellStyles: true, WTF: 1 });
	}

}