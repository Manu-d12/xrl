import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';

export default class devCmpDialogItem extends LightningElement {
    @api cfg;
    @api parent;
    @track config = {};

    connectedCallback() {
        this.config.fields = JSON.parse(JSON.stringify(this.cfg));
        this.config.result = {};
        if (this.config.fields) this.config.fields.forEach(e => {
			e.isPicklist = (e.type === 'combobox');
			e.isTextArea = (e.type === 'textarea');
            e.isSection = (e.type === 'section');
			e.isInput = (e.isTextArea === false && e.isPicklist === false && e.isSection === false);
            e.isOutsideSection = e.isSection === false && e.fields;
            e.options = libs.evalFunction(this, e.options);
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
            setTimeout(()=>{
                const fields = field.options.find((e)=>{ return e.value == this.config.result[target]})?.fields;;
                field.fields = fields;
                field.isOutsideSection = fields !== undefined;
            }, 30);
        }

        libs.sendEvent({
            _value: ':dev-cmp-dialog',
            detail: field,
            cmd : ':updateFromChild'
        });
	}
}