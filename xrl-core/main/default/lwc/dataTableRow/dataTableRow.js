import { LightningElement,api,track } from 'lwc';

export default class DataTableRow extends LightningElement {
    @api records;
    @api config;
    @api cfg;
    @api indent;
    @track currentRecords;
    get showRecords(){
        return this.currentRecords;
    }
    get showIndent() {
        return Array.from(Array(Number(this.indent)).keys());
    }
    get nextIndent(){
        return Number(this.indent) + 1;
    }
    get rowStyle() {
        return "width:100%;display: inline-block;padding-left:" + (Number(this.indent) * 20) + "px;";
    }
    connectedCallback(){
        this.currentRecords = this.records ? JSON.parse(JSON.stringify(this.records)) : [];
        this.currentRecords.forEach((el,ind) =>{
            if(el.childRecords?.length > 0) {
                el._hasChildRecords = true;
            }
        });
    }
    toggleChildRecords(event){
        let record = this.currentRecords.find(r => r.Id === event.target.getAttribute('data-id'));
		record._isExpanded = record._isExpanded ===  undefined ? true : !record._isExpanded;
    }
}