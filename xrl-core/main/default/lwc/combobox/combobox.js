import { LightningElement,track } from 'lwc';

export default class Combobox extends LightningElement {
    @track config = {};
    @track isMultiselect = true;
    get selectedValue() {
        return this.config.selectedSearchResult ? this.config.selectedSearchResult.label : null;
    }
    connectedCallback(){
        this.config.options = [
            {
                label: 'Test',
                value: 'Test'
            },
            {
                label: 'Demo',
                value: 'Demo'
            },
            {
                label: 'Account',
                value: 'Account'
            },
            {
                label: 'Demo 1',
                value: 'Demo 1'
            }
        ];
    }
    showOptions(){
        this.config.searchResults = this.config.options;
    }
    search(event) {
        const input = event.detail.value.toLowerCase();
        this.config.openEditDialog = false;
        if(input === ""){
            this.clearSearchResults();
            return;
        }
        const result = this.config.options.filter((picklistOption) =>
          picklistOption.label.toLowerCase().includes(input) || picklistOption.value.toLowerCase().includes(input)
        );
        if(result.length === 0){
            result.push({label: event.detail.value + ' (New Value - Click to add)',value: event.detail.value + '#new_value',isHideEdit: true});
        }
        this.config.searchResults = result;
    }
    clearSearchResults() {
        this.config.searchResults = false;
    }
    selectSearchResult(event) {
        let selectedValue = event.currentTarget.dataset.value;
        if(selectedValue.endsWith('#new_value')){
            this.config.options.push({label: selectedValue.replace('#new_value',''), value: selectedValue.replace('#new_value','')});
        }
        selectedValue = selectedValue.replace('#new_value','');
        if(this.isMultiselect){
            //for multiselect
            this.config.options.forEach(
            (picklistOption) => {
                if(picklistOption.value === selectedValue){
                    picklistOption.selected = !picklistOption.selected; //reversing the value
                    this.config.selectedSearchResult = picklistOption;
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
                        this.config.selectedSearchResult = picklistOption;
                    }
                    }
            ); 
        }
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