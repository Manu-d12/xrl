import { LightningElement, track, api } from 'lwc';

export default class Multiselect extends LightningElement {
    
    @api options;
    @api selectedvalue;
    @api selectedvalues = [];
    @api label;
    @api disabled = false;
    @api multiselect = false;
    @api listsize = 20;

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

    connectedCallback() {
        this.setSelect();
    }

    setSelect() {
        this.mSelectConfig.showDropdown = false;
        this.mSelectConfig.showOptionCount = true;
        this.mSelectConfig.minChar = 2;
        var optionData = this.options ? (JSON.parse(JSON.stringify(this.options))) : [];
        var value = this.selectedvalue && !this.multiselect ? (JSON.parse(JSON.stringify(this.selectedvalue))) : '';
        var values = this.selectedvalues && this.multiselect ? (JSON.parse(JSON.stringify(this.selectedvalues))) : [];
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
                this.mSelectConfig.searchString = count + ' Option(s) Selected';
            else
                this.mSelectConfig.searchString = searchString;
        }
        this.mSelectConfig.value = value;
        this.mSelectConfig.values = values;
        this.mSelectConfig.optionLength = optionData.length;
        this.mSelectConfig.optionData = optionData.sort((a, b) => {return a.selected ? -1 : 1}).slice(0,this.listsize);
        this.mSelectConfig.allOptions = optionData;
    }

    filterOptions(event) {
        this.mSelectConfig.searchString = event.target.value;
        if( this.mSelectConfig.searchString && this.mSelectConfig.searchString.length > 0 ) {
            this.mSelectConfig.message = '';
            let results = [];
            if(this.mSelectConfig.searchString.length >= this.mSelectConfig.minChar) {
                var flag = true;
                for(var i = 0; i < this.mSelectConfig.allOptions.length; i++) {
					if(this.mSelectConfig.allOptions[i].label.toLowerCase().trim().includes(this.mSelectConfig.searchString.toLowerCase().trim()) ||
                    this.mSelectConfig.allOptions[i].value.toLowerCase().trim().includes(this.mSelectConfig.searchString.toLowerCase().trim())) {
                        this.mSelectConfig.allOptions[i].isVisible = true;
                        flag = false;
                        results.push(this.mSelectConfig.allOptions[i]);
                    } else {
                        this.mSelectConfig.allOptions[i].isVisible = false;
                    }
                }
                if(flag) {
                    this.mSelectConfig.message = "No results found for '" + this.mSelectConfig.searchString + "'";
                }else{
                    this.mSelectConfig.optionLength = results.length;
                    this.mSelectConfig.optionData = results.sort((a, b) => {return a.selected ? -1 : 1}).slice(0,this.listsize);
                }
            }
            this.mSelectConfig.showDropdown = true;
        } else {
            this.mSelectConfig.optionData = this.mSelectConfig.allOptions.sort((a, b) => {return a.selected ? -1 : 1}).slice(0,this.listsize);
            this.mSelectConfig.showDropdown = false;
        }
    }

    selectItem(event) {
        var selectedVal = event.currentTarget.dataset.id;
        if(selectedVal) {
            var count = 0;
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
                        this.mSelectConfig.searchString = options[i].label;
                    }
                }
                if(options[i].selected) {
                    count++;
                }
            }
            this.mSelectConfig.optionData = options;
            if(this.multiselect)
                this.mSelectConfig.searchString = count + ' Option(s) Selected';
            if(this.multiselect){
                event.preventDefault();
                this.blurEvent('',true);
            }else
                this.mSelectConfig.showDropdown = false;
        }
    }

    showOptions() {
        if(!this.disabled && this.options) {
            this.mSelectConfig.message = '';
            this.mSelectConfig.searchString = '';
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

    blurEvent(event,shouldDispatchEvent) {
        var previousLabel;
        var count = 0;
        for(var i = 0; i < this.mSelectConfig.optionData.length; i++) {
            if(this.mSelectConfig.optionData[i].value === this.mSelectConfig.value) {
                previousLabel = this.mSelectConfig.optionData[i].label;
            }
            if(this.mSelectConfig.optionData[i].selected) {
                count++;
            }
        }
        if(this.multiselect){
            this.mSelectConfig.searchString = count + ' Option(s) Selected';
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
