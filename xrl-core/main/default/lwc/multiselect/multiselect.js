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
    @api issingleselect;
    @api configoptionssize;

    @track allOptions;
    @track optionsCount;
    connectedCallback(){
        this.allOptions = this.options;
        this.options = this.allOptions.length > this.configoptionssize ? this.options.slice(0, this.configoptionssize) : this.options;
        this.optionsCount = 'Showing '+ (this.allOptions.length > this.configoptionssize ? this.configoptionssize : this.allOptions.length) + ' of ' + this.allOptions.length + ' options';
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
        if (this._value.includes(value) && !this.issingleselect) {
            this._value.splice(this._value.indexOf(value), 1);
        } else if(this.issingleselect){
            if(this._value.includes(value)){
                this._value = [];
            }else{
                this._value = [];
                this._value.push(value);
            }
            let sldsCombobox = this.template.querySelector(".slds-combobox");
            sldsCombobox.classList.toggle("slds-is-open");
        }
        else {
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
        this.optionsCount = 'Showing '+ ((this.options.length > this.configoptionssize) ? this.configoptionssize : this.options.length) + ' of ' + this.options.length + ' options';
        this.options = this.options.length > this.configoptionssize ? this.options.slice(0, this.configoptionssize) : this.options;
    }
}