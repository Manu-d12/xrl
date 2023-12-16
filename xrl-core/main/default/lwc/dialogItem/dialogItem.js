import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';

export default class dialogItem extends LightningElement {
    @api cfg;
    @api parent;
    @track config = {};

    connectedCallback() {
        this.config.fields = JSON.parse(JSON.stringify(this.cfg));
        this.config.result = {};
        this.prepareData();
    }

    prepareData(newData) {

        if (this.config.fields) {
            if (newData != undefined) {
                let data = Array.isArray(newData) ? newData : [newData];

                data.forEach(d => {
                    let itm = this.config.fields.find(item => {
                        return (item.name == d.name)
                    });
                    if (itm == undefined) this.config.fields.push(d);
                    else {
                        itm.fields = undefined;
                        Object.assign(itm, d);
                    }
                })

            }
            this.config.fields.forEach(e => {
                if (e.isAlreadyPrepared == true) return;
                e.isAlreadyPrepared = true;
                if (e.defaultValue) {
                    e.value = typeof e.defaultValue === 'function' ? e.defaultValue(this, libs, e.options) : e.defaultValue;
                }
                e.isPicklist = (e.type === 'picklist');
                e.isCombobox = (e.type === 'combobox');
                e.isTextArea = (e.type === 'textarea');
                e.isSwitch = (e.type === 'switch');
                e.isSection = (e.type === 'section');
                e.isInput = (e.isTextArea === false && e.isPicklist === false && e.isSection === false && e.isCombobox === false);
                e.isOutsideSection = e.isSection === false && e.fields;
                if (e.updateOptions) {
                    let _advanced = eval('[' + e.updateOptions + ']')[0];
                    e.options = _advanced(this, libs, e);
                    e.isDisabled = e.options == undefined;
                }
            });
        }
    }



    onChangeDynamicField(event) {

        let target = event.target.getAttribute('data-id');
        this.config.result[target] = event.target.value.trim() || event.target.checked;

        let field = this.config.fields.find(e => {
            return e.name === target;
        });

        field.value = this.config.result[target];
        field.parent = this.parent;

        if (field.options) {
            field.addInfo = field.options.find((e) => { return e.value == field.value });
        }
        if (field.onClick) { // implement onClick 
            let _advanced = eval('[' + field.onClick + ']')[0];
            _advanced(this, libs, field);
        }

        this.dispatchEvent(new CustomEvent('childaction', { detail: { cmd: ':updateFromChild', data: field } }));
    }

    passEventToParent(event) {
        this.dispatchEvent(new CustomEvent('childaction', { detail: { cmd: ':updateFromChild', data: event.detail.data } }));
    }

}