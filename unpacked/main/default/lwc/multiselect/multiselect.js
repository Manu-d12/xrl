import { LightningElement, api } from 'lwc';

export default class Multiselect extends LightningElement {

    @api label;
    @api
    get value() {
        return this._value;
    }
    set value(v) {
        this._value = v || [];
    }
    @api options;
    @api placeholder;

    _value = [];

    get _inputValue() {
        if (this._value.length === 0) return null;
        else if (this._value.length === 1) return this._value[0];
        else return this._value.length + ' options selected';
    }

    handleClick() {
        let sldsCombobox = this.template.querySelector(".slds-combobox");
        sldsCombobox.classList.toggle("slds-is-open");
        if (sldsCombobox.classList.contains("slds-is-open")) {
            this.template.querySelectorAll("li").forEach(e => {
                if (this._value.includes(e.dataset.value)) {
                    e.firstChild.classList.add("slds-is-selected");
                }
            });
        }
    }

    handleSelection(event) {
        let value = event.currentTarget.dataset.value;
        if (this._value.includes(value)) {
            this._value.splice(this._value.indexOf(value), 1);
        } else {
            this._value.push(value);
        }
        event.currentTarget.firstChild.classList.toggle("slds-is-selected");
        this.template.querySelector("input").focus();

        this.dispatchEvent(new CustomEvent("change", {
            detail: this._value
        }));
    }
}