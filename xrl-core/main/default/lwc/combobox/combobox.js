/*
    EVENTS available-
    onnewoptionadd - this event is fired when a new option is added to the option list
    onselect - this event is fired when any option is selected
*/
import { LightningElement,track,api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";

export default class Combobox extends NavigationMixin(LightningElement) {
    @track config = {};
    @api ismultiselect = false;
    @api options;
    @api label;
    @api enableedit = false;
    @api enablenewoption = false;
    @api defaultvalues = [];
    @api sobjapiname;
    get selectedValue() {
        return this.config.selectedSearchResult.length > 0 ? this.config.selectedSearchResult[this.config.selectedSearchResult.length - 1].label : null;
    }
    connectedCallback(){
        this.config.options = this.options ? JSON.parse(JSON.stringify(this.options)) : [];
        this.config.sObjApiName = this.sobjapiname || 'Case';
        this.config.enableNewOption = this.enablenewoption === "true" && this.config.sObjApiName;
        this.config.selectedSearchResult = [];
        this.config.options.forEach((option) => {
            if(this.enableedit){
                option.isEditable = true;
            }
            if(this.defaultvalues?.includes(option.value)){
                option.selected = true;
                this.config.selectSearchResult.push(option);
            }
        });
    }
    showOptions(event){
        let width = this.template.querySelector('.search').offsetWidth;
        this.config.style = 'left: 16px; right: auto; position: fixed; z-index: 9109;top:' + (event.clientY + 15) + 'px;width: ' + width + 'px';
        this.config.searchResults = this.config.options;
    }
    search(event) {
        const input = event.detail.value.toLowerCase();
        this.config.openEditDialog = false;
        if(input === ""){
            // this.clearSearchResults();
            this.showOptions();
            return;
        }
        const result = this.config.options.filter((picklistOption) =>
          picklistOption.label.toLowerCase().includes(input) || picklistOption.value.toLowerCase().includes(input)
        );
        this.config.searchResults = result;
    }
    clearSearchResults() {
        setTimeout(() => {
            this.config.searchResults = false;
        }, 150);
    }
    handleEvent(event){
        console.log('event received: ',JSON.parse(JSON.stringify(event.detail.data)));
        let newOption = JSON.parse(JSON.stringify(event.detail.data));
        this.config.options.push(newOption);
        this.selectSearchResult({'currentTarget': { 'dataset': { 'value' : newOption.value }}});
        //dispatching event for the parent component
        this.dispatchEvent(new CustomEvent('newoptionadd', {
            detail: {
                'data' : {
                    label: newOption.label,
                    value: newOption.value
                }
            }
        }));
    }
    selectSearchResult(event) {
        let selectedValue = event.currentTarget.dataset.value;
        if(selectedValue.endsWith('#new_value')){
                this.config.sObjApiName = this.sobjapiname;
                this.config.showNewItemCreation = true;
                this.config.header = this.sobjapiname;
            return;
        }
        selectedValue = selectedValue.replace('#new_value','');
        this.config.selectedSearchResult = [];
        if(this.ismultiselect){
            //for multiselect
            this.config.options.forEach(
            (picklistOption) => {
                if(picklistOption.value === selectedValue){
                    picklistOption.selected = !picklistOption.selected; //reversing the value
                    // this.config.selectedSearchResult = picklistOption;
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
                'data' : selectedResultsArray
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