import { LightningElement,api } from 'lwc';

export default class ActionBar extends LightningElement {
    @api actionscfg;
    connectedCallback(){
        console.log(JSON.parse(JSON.stringify(this.actionscfg)));
    }
}