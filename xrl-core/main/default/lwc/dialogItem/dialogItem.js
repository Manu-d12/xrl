import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';

export default class dialogItem extends LightningElement {
    @api cfg;
    @api parent;
    @track config = {};

    connectedCallback() {
        this.config.fields = JSON.parse(JSON.stringify(this.cfg));
        this.config.result = {};
        if (this.config.fields) this.config.fields.forEach(e => {
            if (e.defaultValue) {
                e.value = typeof e.defaultValue === 'function' ? e.defaultValue(this, libs, e.options) : e.defaultValue;
			}
			e.isPicklist = (e.type === 'combobox');
			e.isTextArea = (e.type === 'textarea');
            e.isSwitch = (e.type === 'switch');
            e.isSection = (e.type === 'section');
			e.isInput = (e.isTextArea === false && e.isPicklist === false && e.isSection === false);
            e.isOutsideSection = e.isSection === false && e.fields;
            if (e.updateOptions && typeof e.updateOptions === 'function') {
                e.options = e.updateOptions(this, libs, e);
            }
            // e.options = libs.evalFunction(this, e.options);
            //console.log('ITEM', e);
		});
    }

    onChangeDynamicField(event) {
        
		let target = event.target.getAttribute('data-id');
        this.config.result[target] = event.target.value.trim() || event.target.checked;

        let field = this.config.fields.find(e => {
			return e.name === target;
		});

        //field.fields = undefined;
		field.value = this.config.result[target];
        field.parent = this.parent;
        
        if (field.options) {
            //field.fields = undefined;
            field.isOutsideSection = false;
            /* eslint-disable */
            setTimeout(()=>{
                const fields = field.options.find((e)=>{ return e.value == this.config.result[target]})?.fields;;
                field.fields = fields;
                field.isOutsideSection = fields !== undefined;
            }, 30);
        }

        this.dispatchEvent(new CustomEvent('childaction', { detail: { cmd: ':updateFromChild', data: field } }));
	}

    passEventToParent(event){
        this.dispatchEvent(new CustomEvent('childaction', { detail: { cmd: ':updateFromChild', data: event.detail.data } }));
    }
}