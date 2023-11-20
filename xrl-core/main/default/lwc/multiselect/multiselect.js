import { LightningElement, track, api } from 'lwc';
import { libs } from 'c/libs';

export default class Multiselect extends LightningElement {
    
    @api options;
    @api selectedvalue;
    @api selectedvalues = [];
    @api label;
    @api disabled = false;
    @api required = false;
    @api multiselect = false;
    @api listsize = 20;
    @api cfg;
    @api optionsfromglobalvar;
    @api col;

    @track mSelectConfig = {};

    @api setValue(v) {
        if (typeof v === 'object') this.selectedvalues = v;
        else this.selectedvalue = v;
        this.setSelect();
    }

    @api setOptions(v) {
        this.options = v;
        this.setSelect();
    }

    @api setDisabled(v) {
        this.disabled = v;
    }

    @api checkValidity() {
        let input = this.template.querySelector('.inputBox');
        let valid = input?.checkValidity();
        return !this.required || (this.required && (this.mSelectConfig.value || this.mSelectConfig.values.length > 0));
    }

    @api reportValidity() {
        let input = this.template.querySelector('.inputBox');
        input?.reportValidity();
    }

    connectedCallback() {
        this.setSelect();
    }
    renderedCallback(){
        let temp = this.template.querySelector('.mSelect');
        temp.addEventListener('keydown', (e) => {
            if(e.keyCode === 27 && this.mSelectConfig !== undefined) { //if 'Escape' is pressed
                this.mSelectConfig.showDropdown = false;
            }
            
        });
    }

    setSelect() {
        this.mSelectConfig.showDropdown = false;
        this.mSelectConfig.showOptionCount = true;
        this.mSelectConfig.minChar = 2;
        var optionData = [];
        // var optionData = this.options ? libs.jsonParse(this.options) : [];
        if(this.optionsfromglobalvar){
            optionData = libs.getGlobalVar(this.cfg).optionsForMultiselect.has(this.col.fieldName) ? libs.jsonParse(libs.getGlobalVar(this.cfg).optionsForMultiselect.get(this.col.fieldName)) : [];
        }else{
            optionData = this.options ? libs.jsonParse(this.options) : [];
        }
        var value = this.selectedvalue && !this.multiselect ? (JSON.parse(JSON.stringify(this.selectedvalue))) : '';
        var values = this.selectedvalues && this.multiselect ? (JSON.parse(JSON.stringify(this.selectedvalues))) : [];
		if(value || values) {
            var searchString;
        	var count = 0;
            for(var i = 0; i < optionData.length; i++) {
                if(this.multiselect) {
                    if(values.includes(optionData[i].value)) {
                        optionData[i].selected = true;
                        searchString = searchString === undefined ? optionData[i].label : searchString;
                        count++;
                    }  
                } else {
                    if(optionData[i].value == value) {
                        searchString = optionData[i].label;
                    }
                }
            }
            // if(this.multiselect)
            //     this.mSelectConfig.searchString = 'Select a option';
            // else
            this.mSelectConfig.searchString = searchString !== undefined ? searchString : 'Select a option';
            this.mSelectConfig.badgeValue = count;
        }
        this.mSelectConfig.value = value;
        this.mSelectConfig.values = values;
        this.mSelectConfig.optionLength = optionData.length;
        this.mSelectConfig.optionData = optionData.sort((a, b) => {return a.selected ? -1 : 1}).slice(0,this.listsize);
        this.mSelectConfig.allOptions = optionData;
        this.mSelectConfig.dropdownClass = this.dropdownClass();
    }
    get searchString() {
        return this.mSelectConfig.searchString ?? 'Select a option';
    }

    get badgeValue(){
        return this.multiselect && this.mSelectConfig.badgeValue > 1 ? '+' + (this.mSelectConfig.badgeValue - 1) : false;
    }

    filterOptions(event) {
        this.mSelectConfig.showDropdown = true;
        let searchString = event.target.value;
        if( searchString !== '' && searchString.length > 0 ) {
            this.mSelectConfig.message = '';
            let results = [];
            if(searchString.length >= this.mSelectConfig.minChar) {
                var flag = true;
                for(var i = 0; i < this.mSelectConfig.allOptions.length; i++) {
					if(this.mSelectConfig.allOptions[i].label.toLowerCase().trim().includes(searchString.toLowerCase().trim()) ||
                    this.mSelectConfig.allOptions[i].value.toLowerCase().trim().includes(searchString.toLowerCase().trim())) {
                        this.mSelectConfig.allOptions[i].isVisible = true;
                        flag = false;
                        results.push(this.mSelectConfig.allOptions[i]);
                    } else {
                        this.mSelectConfig.allOptions[i].isVisible = false;
                    }
                }
                if(flag) {
                    this.mSelectConfig.message = "No results found for '" + searchString + "'";
                }else{
                    this.mSelectConfig.optionLength = results.length;
                    this.mSelectConfig.optionData = results.sort((a, b) => {return a.selected ? -1 : 1}).slice(0,this.listsize);
                }
            }
            this.mSelectConfig.showDropdown = true;
        } else {
            this.mSelectConfig.allOptions.forEach((el) =>{
                el.isVisible = true;
            });
            this.mSelectConfig.optionData = JSON.parse(JSON.stringify(this.mSelectConfig.allOptions.sort((a, b) => {return a.selected ? -1 : 1}).slice(0,this.listsize)));
            // this.mSelectConfig.showDropdown = false;
        }
    }

    selectItem(event) {
        var selectedVal = event.currentTarget.dataset.id;
        if(selectedVal) {
            var count = 0;
            let searchString;
            var options = JSON.parse(JSON.stringify(this.mSelectConfig.optionData));
            for(var i = 0; i < options.length; i++) {
                if(options[i].value === selectedVal) {
                    if(this.multiselect) {
                        if(this.mSelectConfig.values.includes(options[i].value)) {
                            this.mSelectConfig.values.splice(this.mSelectConfig.values.indexOf(options[i].value), 1);
                        } else {
                            this.mSelectConfig.values.push(options[i].value);
                        }
                        options[i].selected = options[i].selected ? false : true;   
                    } else {
                        this.mSelectConfig.value = options[i].value;
                        searchString = options[i].label;
                    }
                }
                if(options[i].selected) {
                    searchString = searchString === undefined ? options[i].label : searchString;
                    count++;
                }
            }
            //updating the allOptions
            let op = this.mSelectConfig.allOptions.find((el) => el.value === selectedVal);
            op.selected = op.selected ? false : true; 
            this.mSelectConfig.optionData = options;
            if(this.multiselect)
                this.mSelectConfig.searchString = '+' + count;
            if(this.multiselect){
                event.preventDefault();
                this.blurEvent('',true);
            }else{
                this.mSelectConfig.showDropdown = false;
                this.blurEvent('',true);
            }
            this.mSelectConfig.searchString = searchString !== undefined ? searchString : 'Select a option';
            this.mSelectConfig.badgeValue = count;
        }
    }

    showOptions() {
        if(!this.disabled && this.options) {
            this.mSelectConfig.message = '';
            // this.mSelectConfig.searchString = '';
            var options = JSON.parse(JSON.stringify(this.mSelectConfig.optionData));
            for(var i = 0; i < options.length; i++) {
                options[i].isVisible = true;
            }
            if(options.length > 0) {
                this.mSelectConfig.showDropdown = true;
            }
            this.mSelectConfig.optionLength = options.length;
            this.mSelectConfig.optionData = options.sort((a, b) => {return a.selected ? -1 : 1}).slice(0,this.listsize);
        }
	}
    dropdownClass(){
        let defaultClass = 'slds-dropdown slds-dropdown_length-5 slds-dropdown_fluid';
        if(libs.getGlobalVar(this.cfg) && libs.getGlobalVar(this.cfg).openMultiselectAtBottom !== undefined) {
            defaultClass = defaultClass +  (libs.getGlobalVar(this.cfg).openMultiselectAtBottom ? ' slds-dropdown_left' : ' slds-dropdown_bottom');
        }else{
            defaultClass = defaultClass + ' slds-dropdown_left';
        }
        return defaultClass;
    }
    clearSelection(){
        let options = JSON.parse(JSON.stringify(this.mSelectConfig.optionData));
        for(let i = 0; i < options.length; i++) {
            options[i].selected = false ;   
        }
        this.mSelectConfig.optionData = options;
        this.mSelectConfig.allOptions = JSON.parse(JSON.stringify(options));
        this.mSelectConfig.searchString = 'Select a option';
        this.mSelectConfig.badgeValue = 0;
        this.template.querySelector('.optionBtn').focus();
        this.mSelectConfig.value = '';
        this.mSelectConfig.values = [];
        this.blurEvent('',true);
    }
    closeDropdown(event){
        if(event.relatedTarget === undefined){
            this.mSelectConfig.showDropdown = false;
        }
    }

    blurEvent(event,shouldDispatchEvent) {
        var previousLabel;
        var count = 0;
        let searchString;
        for(var i = 0; i < this.mSelectConfig.optionData.length; i++) {
            if(this.mSelectConfig.optionData[i].value === this.mSelectConfig.value) {
                previousLabel = this.mSelectConfig.optionData[i].label;
            }
            if(this.mSelectConfig.optionData[i].selected) {
                searchString = searchString === undefined ? this.mSelectConfig.optionData[i].label : searchString;
                count++;
            }
        }
        if(this.multiselect){
            this.mSelectConfig.searchString = searchString !== undefined ? searchString : 'Select a option';
            this.mSelectConfig.badgeValue = count;
            // this.mSelectConfig.searchString = count + ' Option(s) Selected';
            if(shouldDispatchEvent !== undefined){
                this.dispatchEvent(new CustomEvent('select', {
                    detail: {
                        'payloadType' : 'multi-select',
                        'payload' : {
                            'value' : this.mSelectConfig.value,
                            'values' : this.mSelectConfig.values
                        }
                    }
                }));
            }else{
                this.mSelectConfig.showDropdown = false;
            }
        }
        else{
            this.mSelectConfig.searchString = previousLabel;
            //if someone presses Enter without selecting anything. 
            //To prevent NoErrorObjectAvailable Script error
            if(event.target?.value === "") return; 
            this.dispatchEvent(new CustomEvent('select', {
                detail: {
                    'payloadType' : 'multi-select',
                    'payload' : {
                        'value' : this.mSelectConfig.value,
                        'values' : this.mSelectConfig.values
                    }
                }
            }));
            this.mSelectConfig.showDropdown = false;
        }
    }
}
