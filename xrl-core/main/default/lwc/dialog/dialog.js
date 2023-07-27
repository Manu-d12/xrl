import { LightningElement, api } from 'lwc';
import { libs } from 'c/libs';

export default class Dialog extends LightningElement {

    _cfg;

    @api 
    get cfg() {
        return this._cfg;
    }
    set cfg(v) {
        this._cfg = v;
        this.setDialog();
    }

    @api setLoading(v) {
        this.isLoading = v;
    }

    title;
    buttons;
    contents;
    isLoading = true;
    values = {};
    headerStyle;

    async setDialog() {
        this.title = this._cfg?.title;
        this.headerStyle = this._cfg?.headerStyle;
        if (this._cfg?.contents) this.contents = this._cfg?.contents.map(el => Object.assign({}, el));
        else this.contents = [];
        this.buttons = this._cfg?.buttons || [];
        this.values = {};
        if (this._cfg) await this.setInputFields();
        this.isLoading = this._cfg ? false : true;
    }

    handleClick(e) {
        let inputs = this.template.querySelectorAll('.inputs');
        let inputValues = {};
        if (e.target.dataset.id !== 'cancel' && !e.target.dataset.id.startsWith('switch')) {
            for (let input of inputs) {
                inputValues[input.dataset.id] = input.value || input.selectedvalue || input.selectedvalues;

                let valid = input.checkValidity();
                if (!valid) {
                    input.reportValidity();
                    return;
                }
            }
        }        
        if (this._cfg.callback && typeof this._cfg.callback === 'function') {
            this._cfg.callback({ action: e.target.dataset.id, data: inputValues });
        } else {
            this.dispatchEvent(new CustomEvent('action', { detail: { action: e.target.dataset.id, data: inputValues } }));
        }
    } 
    
    handleChange(e) {
        this.values[e.target.dataset.id] = e.target.value || e.target.checked;
        if (e.target.type === 'checkbox') {
            e.target.value = e.target.checked ? 'true' : 'false';
        } else if (e.target.dataset.type === 'select') {
            let value = e.detail.payload.value || e.detail.payload.values;
            this.values[e.target.dataset.id] = value;

            for (let el of this.contents) {
                let input = this.template.querySelector(`[data-id="${el.name}"]`);
                if (el.updateOptions && typeof el.updateOptions === 'function') {
                    el.options = el.updateOptions(this, libs, el);
                    input?.setOptions(el.options);
                }
                if (el.name === e.target.dataset.id) el.value = value;
                if (el.value && el.options.find(opt => opt.value === el.value)) {
                    this.values[el.name] = el.value;
                    input?.setValue(el.value);
                } else {
                    this.values[el.name] = undefined;
                    el.value = undefined;
                }	
            }
        }
    }
    
	async setInputFields() {
		for (let el of this.contents) {
			if (el.isCombobox && el.sObject) {
				await this.referenceOperations(el);
			}
			if (el.defaultValue) {
                el.value = typeof el.defaultValue === 'function' ? el.defaultValue(this, libs, el.options) : el.defaultValue;
			}			
		}
        for (let el of this.contents) {
			if (el.updateOptions && typeof el.updateOptions === 'function') {
                el.options = el.updateOptions(this, libs, el);
            }
            if (el.isCombobox) {
                let input = this.template.querySelector(`[data-id="${el.name}"]`);
                input?.setOptions(el.options);
                if (el.value && el.options.find(opt => opt.value === el.value)) {
                    this.values[el.name] = el.value;
                    input?.setValue(el.value);
                } else {
                    this.values[el.name] = undefined;
                    el.value = undefined;
                }               
            }
            if (el.isDisabled && typeof el.isDisabled === 'function') {
                el.disabled = el.isDisabled(this, libs, el);
                if (el.isCombobox) {
                    let input = this.template.querySelector(`[data-id="${el.name}"]`);
                    input?.setDisabled(el.disabled);
                }
            }	
		}
	}

	async referenceOperations(element) {
		element.options = [];
		const { sObject, referenceSoql, formatter } = element;

		const query = referenceSoql !== undefined
			? { isNeedDescribe: true, sObjApiName: sObject, SOQL: typeof referenceSoql === 'function' ? referenceSoql(this, libs, element) : referenceSoql }
			: { isNeedDescribe: true, sObjApiName: sObject, relField: '', fields: ['Id', 'Name'], limit: 'LIMIT 10000' };

		await libs.remoteAction(this, referenceSoql !== undefined ? 'customSoql' : 'query', {
			...query,
			callback: (nodeName, responseData) => {
                element.data = responseData[nodeName].records;
				if (formatter) {
                    element.options = formatter(responseData[nodeName]);
				} else {
					element.options = element.data.length > 0 ? element.data.map(e => ({ label: e.Name, value: e.Id })) : undefined;
				}
				element._actualType = responseData[nodeName].describe ? JSON.parse(responseData[nodeName].describe)[element.name]?.type : undefined;
			}
		});
	}
}