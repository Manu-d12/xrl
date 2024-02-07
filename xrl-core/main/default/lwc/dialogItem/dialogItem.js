import { LightningElement, api, track } from 'lwc';
import { libs } from 'c/libs';

export default class dialogItem extends LightningElement {
    @api cfg;
    @api parent;
    @track config = {};

    
    connectedCallback() {
        this.config.fields = JSON.parse(JSON.stringify(this.cfg));//.filter(el => {return el.isDisabled!=true});
        console.log('DIALOG ITEM ',this.parent, this.config.fields);         
        if (this.config.fields.length == 0) return;
        this.config.result = {};
        this.prepareData();
    }

    prepareData(newData) { //Dynamic insert a new input elements

        if (this.config.fields) {
            if (newData != undefined) {
                let data = Array.isArray(newData) ? newData : [newData];

                data.forEach(d => {
                    let itm = this.config.fields.find(item => {
                        return (item.name == d.name)
                    });
                    if (itm == undefined) this.config.fields.push(d);
                    else {
                        itm.fields = undefined;
                        Object.assign(itm, d);
                    }
                })

            }
            this.config.fields.forEach(e => {
                if (e.isAlreadyPrepared == true) return;
                e.isAlreadyPrepared = true;
                if (e.defaultValue) {
                    e.value = typeof e.defaultValue === 'function' ? e.defaultValue(this, libs, e.options) : e.defaultValue;
                }
                e.isPicklist = (e.type === 'picklist');
                e.isCombobox = (e.type === 'combobox');
                e.isTextArea = (e.type === 'textarea');
                e.isRadioGroup =(e.type === 'radio');
                e.isSwitch = (e.type === 'switch');
                e.isSection = (e.type === 'section');
                e.isFile = (e.type === 'file');
                e.isInput = (e.isTextArea === false && e.isPicklist === false && e.isSection === false && e.isCombobox === false && e.isRadioGroup === false && e.isFile === false);
                if (e.type==='checkbox') {
                    e.style="padding-top:7px";
                    e.isChecked = (e.value === true || e.value === false) ? e.value : false;
                }
                if (typeof e.options == 'string' && e.options.startsWith('function(')) {
                    let _advanced = eval('[' + e.options + ']')[0];
                    e.options = _advanced(this, libs, e);
                    e.isDisabled = e.options == undefined;
                }
                //e.fields = e.fields?.filter(el => {return el.isDisabled!=true});
                if (e.fields && e.fields.length == 0) e.fields = undefined;
                console.log('fields', e.fields);

                if(e.value !== undefined && e.isDisabled === false){
                    this.updateValue(e.value,e.name,true);
                }
            });
        }
    }

    @api
    updateChild(input) {
        this.config.fields = JSON.parse(JSON.stringify(input));
        this.prepareData();
    }


    onChangeDynamicField(event) {
        //sevent.stopImmediatePropagation();
        let target = event.target.getAttribute('data-id');
        let value = event.target.value?.trim() || event.target.checked || event.detail.files || event.detail.data[0];

        this.updateValue(value,target,false);
    }

    updateValue(value,target,changingFrom){
        this.config.result[target] = value;
        
        let fldIndex = this.config.fields.findIndex(e => {
            return e.name === target;
        });

        if (fldIndex>-1) {

            let field = JSON.parse(JSON.stringify(this.config.fields[fldIndex]));//JSON.parse(JSON.stringify(this.cfg))[fldIndex];
            
            field.value = this.config.result[target];
            field.parent = this.parent;
            this.config.fields[fldIndex].value = field.value; //result propagation

            if (this.config.fields[fldIndex].options) {
                field.addInfo = this.config.fields[fldIndex].options.find((e) => { return e.value == field.value });
				this.config.fields[fldIndex].addInfo = field.addInfo;
				//this.config.result[target] = field;
            }
            if (field.onClick) { // implement onClick 
                let _advanced = eval('[' + field.onClick + ']')[0];
                _advanced(this, libs, field)      
            }
            if (field.fields) {
                field.fields = field.fields.filter(el=> {
                     el.isDisabled = Array.isArray(el.parentValue) 
                        ? el.parentValue.indexOf(this.config.result[target]) == -1
                        : el.parentValue != this.config.result[target];

                        return !el.isDisabled;
                })
                let childrenArray = this.template.querySelectorAll('c-dialog-Item ');
                // not sure why find function does not work
                let child = false;
                childrenArray.forEach((el) => {
                    if(el.parent === target){
                        child = el;
                    }
                });
                if (child) child.updateChild(field.fields);
                else {
                    //this.config.fields[fldIndex].fields = field.fields;
                    if(changingFrom){
                        let selectedFields = new Set();
                        field.fields.forEach((field)=>{
                            selectedFields.add(field.name);
                        });

                        this.config.fields[fldIndex].fields.forEach((field)=>{
                            if(selectedFields.has(field.name)){
                                field.isDisabled=false;
                            }
                        });
                    }else{
                        this.config.fields[fldIndex].fields = field.fields;
                    }
                }
                
            } 
            this.dispatchEvent(new CustomEvent('childaction', { detail: { cmd: ':updateFromChild', data: this.config.fields[fldIndex] } }));
        }
        
    }

    passEventToParent(event) {
        this.dispatchEvent(new CustomEvent('childaction', { detail: { cmd: ':updateFromChild', data: event.detail.data } }));
    }

}