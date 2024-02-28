import { LightningElement, track, api } from 'lwc';
import { libs } from 'c/libs';
import oldui from './multiselect.html';
import newui from './newui.html';

export default class Multiselect extends LightningElement {
    
    @api options;
    @api selectedvalue;
    @api selectedvalues = []; //for new UI only use this array
    @api label;
    @api disabled = false;
    @api required = false;
    @api multiselect = false;
    @api listsize = 20;
    @api cfg;
    @api optionsfromglobalvar;
    @api col;
    @api buttonStyle;
    @api usenewui = false;
    //for new UI
    @api enablenewoption = false; //deprecated
    @api newitemcreation;
    @api opennewindatatable = false;
    @track config = {selectedSearchResult : []};

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

    render(){
        if(this.config.useNewUi){
            return newui;
        }
        return oldui;
    }

    connectedCallback() {
        this.config.useNewUi = this.usenewui == "true";
        if(this.config.useNewUi){
            //for New UI
            this.config.options = this.options ? JSON.parse(JSON.stringify(this.options)) : [];
            this.config.sObjApiName = this.newitemcreation?.sObjApiName || 'Case';
            this.config.cfgName = this.cfg;
            this.config.enableNewOption = this.newitemcreation !== undefined;
            this.config.newOptionLabel = this.newitemcreation?.label || 'New Option';
            //this.config.selectedSearchResult = [];
			if (typeof this.selectedvalues == 'string') this.selectedvalues = [this.selectedvalues];
            this.config.options.forEach((option) => {
                if(this.enableedit){
                    option.isEditable = true;
                }
                if(this.selectedvalues && this.selectedvalues?.findIndex((el) => el.toLowerCase() === option.value.toLowerCase()) !== -1){
                    option.selected = true;
                    this.config.selectedSearchResult.push(option);
                }
            });
            window.addEventListener('scroll', this.clearSearchResults.bind(this));
        }else{
            //for old UI
            this.mSelectConfig.labels = libs.getGlobalVar(this.cfg)?._LABELS ?? {};
            this.mSelectConfig.labels.lbl_selectAnOption = 'Select an Option'; //hardcoding this value to avoid any unnecessary error because of this.cfg === undefined
            this.mSelectConfig.buttonStyle = this.buttonStyle || '';
            this.setSelect();
        }
    }
    disconnectedCallback() {
        // Remove event listener
        window.removeEventListener('scroll', this.clearSearchResults.bind(this));
    }
    renderedCallback(){
        if(!this.config.useNewUi){
            //only for old UI
            let temp = this.template.querySelector('.mSelect');
            temp.addEventListener('keydown', (e) => {
                if(e.keyCode === 27 && this.mSelectConfig !== undefined) { //if 'Escape' is pressed
                    this.mSelectConfig.showDropdown = false;
                }
                
            });
        }
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
            this.mSelectConfig.searchString = searchString !== undefined ? searchString : this.mSelectConfig.labels.lbl_selectAnOption;
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
        return this.mSelectConfig.searchString ?? this.mSelectConfig.labels.lbl_selectAnOption;
    }

    get badgeValue(){
        return this.multiselect && this.mSelectConfig.badgeValue > 1 ? '+' + (this.mSelectConfig.badgeValue - 1) : false;
    }

    filterOptions(event) {
        this.mSelectConfig.showDropdown = true;
        let searchString = event.target.value;
        this.mSelectConfig.searchValue= event.target.value;
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
            //this.mSelectConfig.optionData = JSON.parse(JSON.stringify(this.mSelectConfig.allOptions.sort((a, b) => {return a.selected ? -1 : 1}).slice(0,this.listsize)));
            this.mSelectConfig.optionData = JSON.parse(JSON.stringify(this.mSelectConfig.allOptions.sort(this.customSort)));
            // this.mSelectConfig.showDropdown = false;
        }
    }

    customSort(a, b) {
        const aValue = a.selected === true ? 1 : 0;
        const bValue = b.selected === true ? 1 : 0;
      
        if (aValue === bValue) {
            const labelA = a.label.toUpperCase(); // Convert to uppercase for case-insensitive sorting
            const labelB = b.label.toUpperCase();
        
            if (labelA < labelB) {
              return -1; // 'a' comes before 'b'
            } else if (labelA > labelB) {
              return 1; // 'b' comes before 'a'
            } else {
              return 0; // 'label' values are also equal
            }
        } else if (aValue > bValue) {
          return -1;
        } else {
          return 1;
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
            this.mSelectConfig.optionData = this.multiselect === true ? options.sort(this.customSort) : options;
            if(this.multiselect)
                this.mSelectConfig.searchString = '+' + count;
            if(this.multiselect){
                event.preventDefault();
                this.blurEvent('',true);
            }else{
                this.mSelectConfig.showDropdown = false;
                this.blurEvent('',true);
            }
            //this.mSelectConfig.searchString = searchString !== undefined ? searchString : this.mSelectConfig.labels.lbl_selectAnOption;
            //this.mSelectConfig.badgeValue = count;
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
            //this.mSelectConfig.optionData = options.sort((a, b) => {return a.selected ? -1 : 1}).slice(0,this.listsize);
            this.mSelectConfig.optionData = options.sort(this.customSort);
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
        this.mSelectConfig.searchString = this.mSelectConfig.labels.lbl_selectAnOption;
        this.mSelectConfig.badgeValue = 0;
        this.template.querySelector('.optionBtn').focus();
        this.mSelectConfig.value = '';
        this.mSelectConfig.values = [];
        this.blurEvent('',true);
    }
    closeDropdown(event){
        if(event.relatedTarget === undefined || event.relatedTarget === null || event.relatedTarget.label !== undefined || event.relatedTarget.localName === 'section'){
            this.mSelectConfig.showDropdown = false;
        }
    }

    blurEvent(event,shouldDispatchEvent) {
        this.mSelectConfig.allOptions = this.mSelectConfig.allOptions.sort(this.customSort);
        var previousLabel;
        var count = 0;
        let searchString;
        for(var i = 0; i < this.mSelectConfig.allOptions.length; i++) {
            if(this.mSelectConfig.allOptions[i].value === this.mSelectConfig.value) {
                previousLabel = this.mSelectConfig.allOptions[i].label;
            }
            if(this.mSelectConfig.allOptions[i].selected) {
                searchString = searchString === undefined ? this.mSelectConfig.allOptions[i].label : searchString;
                count++;
            }
        }
        if(this.multiselect){
            this.mSelectConfig.searchString = searchString !== undefined ? searchString : this.mSelectConfig.labels.lbl_selectAnOption;
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
            if(event.target?.value === ""){
                this.mSelectConfig.showDropdown = false;
                return; 
            }
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

    //For New UI
    get selectedValue() {
        return this.config.selectedSearchResult.length > 0 ? this.config.selectedSearchResult[this.config.selectedSearchResult.length - 1].label : null;
    }
    showOptionsForNewUI(event){
        if(event !== undefined){
            let width = this.template.querySelector('.search').offsetWidth;
            this.config.style = 'left: auto; right: auto; position: fixed; z-index: 9109;top:' + (event.clientY + 15) + 'px;width: ' + width + 'px';
            this.config.searchResults = this.config.options;
        }
    }
    search(event) {
        const input = event.detail.value.toLowerCase();
        this.config.openEditDialog = false;
        if(input === ""){
            // this.clearSearchResults();
            this.showOptionsForNewUI();
            return;
        }
        const result = this.config.options.filter((picklistOption) =>
          picklistOption.label.toLowerCase().includes(input) || picklistOption.value.toLowerCase().includes(input)
        );
        this.config.searchResults = result;
    }
    clearSearchResults(event) {
        setTimeout(() => {
            this.config.searchResults = false;
        }, 150);
    }
    @api handleEvent(event){
        if(event?.detail?.action === 'cancel'){
            this.config.sObjApiName = '';
            this.config.showNewItemCreation = false;
            return;
        }
        // console.log('event received: ',JSON.parse(JSON.stringify(event.detail.data)));
        let newOption = event?.detail?.data ? JSON.parse(JSON.stringify(event.detail.data)) : JSON.parse(JSON.stringify(event));
        let isOptionAlreadyPresent = this.config.options.findIndex((option) => option.value === newOption.value);
        if(isOptionAlreadyPresent > -1){
            this.config.options[isOptionAlreadyPresent] = JSON.parse(JSON.stringify(newOption));
        }else{
            this.config.options.push(newOption);
        }
        this.selectSearchResult({'currentTarget': { 'dataset': { 'value' : newOption.value }}});
        //dispatching event for the parent component
        this.dispatchEvent(new CustomEvent('newoptionadd', {
            detail: {
                'data' : {
                    label: newOption.label,
                    value: newOption.value,
                    record: newOption
                }
            }
        }));
        this.config.showNewItemCreation = false;
    }
    selectSearchResult(event) {
        let selectedValue = event.currentTarget.dataset.value;
        if(selectedValue.endsWith('#new_value')){
            if(this.opennewindatatable){
                this.dispatchEvent(new CustomEvent('opennewdialog', {
                    detail: {
                        'data' : this.newitemcreation,
                        'field': this.col.fieldName
                    }
                }));
            }else{
                this.config.sObjApiName = this.newitemcreation?.sObjApiName;
                this.config.showNewItemCreation = true;
                this.config.header = this.newitemcreation?.header || this.newitemcreation?.sObjApiName;
            }
            return;
        }
        selectedValue = selectedValue.replace('#new_value','');
        this.config.selectedSearchResult = [];
        if(this.multiselect){
            //for multiselect
            this.config.options.forEach(
            (picklistOption) => {
                if(picklistOption.value === selectedValue){
                    picklistOption.selected = !picklistOption.selected; //reversing the value
                }
                if(picklistOption.selected){
                    this.config.selectedSearchResult.push(picklistOption);
                }
                }
            ); 
        }else{
            //for single selection
            this.config.options.forEach(
                (picklistOption) => {
                    picklistOption.selected = false;
                    if(picklistOption.value === selectedValue){
                        picklistOption.selected = !picklistOption.selected;
                        this.config.selectedSearchResult.push(picklistOption);
                    }
                    }
            ); 
            this.clearSearchResults();
        }
        let selectedResultsArray = [];
        this.config.selectedSearchResult?.forEach((selected) => {
            selectedResultsArray.push(selected.value);
        })
        //sending the event
        this.dispatchEvent(new CustomEvent('select', {
            detail: {
                'payload': {
                    'values' : selectedResultsArray
                }
            }
        }));
    }
    editOption(event){
        this.config.selectedValueForEdit = event.currentTarget.dataset.value;
        let option = this.config.options.find(
            (picklistOption) => picklistOption.value === this.config.selectedValueForEdit
        ); 
        this.config.selectedLabelForEdit = option.label;
        this.clearSearchResults();
    }
    handleEditOptionDialogOperation(event){
        let operation = event.target.getAttribute('data-id');
        if(operation === 'cancel'){
            this.config.selectedValueForEdit = false;
        }else if(operation === 'label'){
            this.config.selectedLabelForEdit = event.target.value;
        }else if(operation === 'save'){
            let option = this.config.options.find(
                (picklistOption) => picklistOption.value === this.config.selectedValueForEdit
            ); 
            option.label = this.config.selectedLabelForEdit;
            console.log('save',this.config.selectedLabelForEdit);
            this.config.selectedLabelForEdit = false;
            this.config.selectedValueForEdit = false;
        }
    }
}
