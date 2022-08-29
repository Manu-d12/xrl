import { LightningElement, track, api } from 'lwc';

export default class Customselect extends LightningElement {
    @api options;
    @api selectedvalue;
    @api selectedValues = [];
    @api label;
    @api minChar = 2;
    @api disabled = false;
    @api multiselect = false;
    @track value;
    @track values = [];
    @track optionData;
    @track searchString;
    @track message;
    @track showDropdown = false;
    @track showOptionCount = true;
    @track allOptions = [];
    @api listsize;
    @track optionLength;

    connectedCallback() {
        this.showDropdown = false;
        var optionData = this.options ? (JSON.parse(JSON.stringify(this.options))) : null;
        var value = this.selectedvalue ? (JSON.parse(JSON.stringify(this.selectedvalue))) : null;
        var values = this.selectedValues ? (JSON.parse(JSON.stringify(this.selectedValues))) : null;
        if(value || values) {
            var searchString;
            var count = 0;
            for(var i = 0; i < optionData.length; i++) {
                if(this.multiselect) {
                    if(values.includes(optionData[i].value)) {
                        optionData[i].selected = true;
                        count++;
                    }  
                } else {
                    if(optionData[i].value == value) {
                        searchString = optionData[i].label;
                    }
                }
            }
            if(this.multiselect)
                this.searchString = count + ' Option(s) Selected';
            else
                this.searchString = searchString;
        }
        this.value = value;
        this.values = values;
        this.optionData = optionData.slice(0,this.listsize);
        this.allOptions = optionData;
        this.optionLength = this.allOptions.length;
    }
    filterOptions(event) {
        this.searchString = event.target.value;
        if( this.searchString && this.searchString.length > 0 ) {
            this.message = '';
            let results = [];
            if(this.searchString.length >= this.minChar) {
                var flag = true;
                for(var i = 0; i < this.allOptions.length; i++) {
                    if(this.allOptions[i].label.toLowerCase().trim().startsWith(this.searchString.toLowerCase().trim())) {
                        this.allOptions[i].isVisible = true;
                        flag = false;
                        results.push(this.allOptions[i]);
                    } else {
                        this.allOptions[i].isVisible = false;
                    }
                }
                if(flag) {
                    this.message = "No results found for '" + this.searchString + "'";
                }else{
                    this.optionLength = results.length;
                    this.optionData = results.slice(0,this.listsize);
                }
            }
            this.showDropdown = true;
        } else {
            this.showDropdown = false;
        }
    }
    selectItem(event) {
        var selectedVal = event.currentTarget.dataset.id;
        if(selectedVal) {
            var count = 0;
            var options = JSON.parse(JSON.stringify(this.allOptions));
            for(var i = 0; i < options.length; i++) {
                if(options[i].value === selectedVal) {
                    if(this.multiselect) {
                        if(this.values.includes(options[i].value)) {
                            this.values.splice(this.values.indexOf(options[i].value), 1);
                        } else {
                            this.values.push(options[i].value);
                        }
                        options[i].selected = options[i].selected ? false : true;   
                    } else {
                        this.value = options[i].value;
                        this.searchString = options[i].label;
                    }
                }
                if(options[i].selected) {
                    count++;
                }
            }
            this.optionData = options;
            if(this.multiselect)
                this.searchString = count + ' Option(s) Selected';
            if(this.multiselect)
                event.preventDefault();
            else
                this.showDropdown = false;
        }
    }
    showOptions() {
        if(this.disabled == false && this.options) {
            this.message = '';
            this.searchString = '';
            var options = JSON.parse(JSON.stringify(this.allOptions));
            for(var i = 0; i < options.length; i++) {
                options[i].isVisible = true;
            }
            if(options.length > 0) {
                this.showDropdown = true;
            }
            this.optionLength = options.length;
            this.optionData = options.slice(0,this.listsize);
        }
    }
    removePill(event) {
        var value = event.currentTarget.name;
        var count = 0;
        var options = JSON.parse(JSON.stringify(this.optionData));
        for(var i = 0; i < options.length; i++) {
            if(options[i].value === value) {
                options[i].selected = false;
                this.values.splice(this.values.indexOf(options[i].value), 1);
            }
            if(options[i].selected) {
                count++;
            }
        }
        this.optionData = options;
        if(this.multiselect)
            this.searchString = count + ' Option(s) Selected';
    }
    blurEvent() {
        var previousLabel;
        var count = 0;
        for(var i = 0; i < this.optionData.length; i++) {
            if(this.optionData[i].value === this.value) {
                previousLabel = this.optionData[i].label;
            }
            if(this.optionData[i].selected) {
                count++;
            }
        }
        if(this.multiselect)
         this.searchString = count + ' Option(s) Selected';
        else
         this.searchString = previousLabel;
        
        this.showDropdown = false;
 
        this.dispatchEvent(new CustomEvent('select', {
            detail: {
                'payloadType' : 'multi-select',
                'payload' : {
                    'value' : this.value,
                    'values' : this.values
                }
            }
        }));
    }
    iconClick(){
        console.log('clicked');
        this.dispatchEvent(new CustomEvent('searchclicked', {
            detail: 'clicked'
        }));
    }
}