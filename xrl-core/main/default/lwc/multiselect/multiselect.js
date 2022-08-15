import { LightningElement, api,track } from 'lwc';
import { libs } from 'c/libs';

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
    @api issearchable;
    @api cfg;

    @track allOptions;
    @track optionsCount;
    @track configOptionsSize;
    connectedCallback(){
        this.allOptions = this.options;
        this.configOptionsSize = libs.getGlobalVar(this.cfg).listViewConfig.displayOptionListSize;
        this.options = this.allOptions.length > this.configOptionsSize ? this.options.slice(0, this.configOptionsSize) : this.options;
        this.optionsCount = 'Showing '+ (this.allOptions.length > this.configOptionsSize ? this.configOptionsSize : this.allOptions.length) + ' of ' + this.allOptions.length + ' options';
    }

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
    handleKeyUpSearch(event){
        this.options = [];
        let searchTerm = event.target.value.toString().toLowerCase();
        this.allOptions.forEach((el) =>{
            if(el["value"] && el["value"].toString().toLowerCase().indexOf(searchTerm) != -1) {
                this.options.push(el);
            }
        });
        this.optionsCount = 'Showing '+ ((this.options.length > this.configOptionsSize) ? this.configOptionsSize : this.options.length) + ' of ' + this.options.length + ' options';
        this.options = this.options.length > this.configOptionsSize ? this.options.slice(0, this.configOptionsSize) : this.options;
    }
}