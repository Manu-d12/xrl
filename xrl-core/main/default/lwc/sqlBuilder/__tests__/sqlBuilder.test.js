import { createElement } from 'lwc';
import SqlBuilder from 'c/sqlBuilder';
import { libs } from 'c/libs';

const sqlBuilderSelectedFieldsData = require('./data/sqlBuilderSelectedFields.json');
const sqlBuilderConditionsData = require('./data/sqlBuilderConditions.json');
const sqlBuilderOrderingsData = require('./data/sqlBuilderOrderings.json');

describe('c-sql-Builder', () => {
    beforeEach(() => {
        const element = createElement('c-sql-Builder', { is: SqlBuilder });
        element.cfg = 'Account';
        element.config = {
            sObjApiName: 'Account',
            describe: {},
            dialog: {
                listViewConfig: {
                    colModel: [],
                    conditionMap: [],
                    orderMap: [],
                    conditionOrdering: ''
                }
            },
            _LABELS: {
                lbl_ascending: 'Ascending',
                lbl_descending: 'Descending',
                lbl_beginning: 'Beginning',
                lbl_end: 'End',
                lbl_selectFields: 'Selected fields'
            }
        };
        libs.setGlobalVar(element.cfg, element.config);
        document.body.appendChild(element);
    })
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });
    async function flushPromises() {
        return Promise.resolve();
    }
    async function isStrAllowedLiveQueryTestHandler(element, conditionInput, inputValue, conditions, selectedFeilds, orderings, showErrorExpectedValue, errorMessageExpectedValue, testLiveQuery, liveQueryPara, expectedLiveQueryValue) {
        element.config.sqlBuilder.conditions = conditions;
        element.config.sqlBuilder.selectedFields = selectedFeilds;
        element.config.sqlBuilder.orderings = orderings;
        conditionInput.value = inputValue;
        conditionInput.dispatchEvent(new CustomEvent('focusout'));
        await flushPromises();
        expect(element.config.sqlBuilder.showError).toBe(showErrorExpectedValue);
        expect(element.config.sqlBuilder.errorMessage).toBe(errorMessageExpectedValue);
        if (testLiveQuery)
            expect(liveQueryPara.textContent).toBe(expectedLiveQueryValue);


    }
    it('should initialize config and sqlBuilder', () => {
        const element = document.querySelector('c-sql-builder');
        expect(element.config.describeMap).toEqual({
            Account: {}
        });
        expect(element.config.sqlBuilder.fields).toEqual([]);
        expect(element.config.sqlBuilder.selectedFields).toEqual([]);
        expect(element.config.sqlBuilder.conditions).toEqual([]);
        expect(element.config.sqlBuilder.orderings).toEqual([]);
        expect(element.config.sqlBuilder.conditionOrdering).toEqual('');
        expect(element.config.sqlBuilder.sortOrderOptions).toEqual([
            { label: 'Ascending', value: 'ASC' },
            { label: 'Descending', value: 'DESC' }
        ]);
        expect(element.config.sqlBuilder.emptyFieldOptions).toEqual([
            { label: 'Beginning', value: 'NULLS FIRST' },
            { label: 'End', value: 'NULLS LAST' }
        ]);
        expect(element.config.sqlBuilder._objectStack).toEqual([
            { relationShip: 'Account', referredObj: 'Account' }
        ]);
        expect(element.config.sqlBuilder.fields).toEqual([]);
        expect(element.config.sqlBuilder.allFields).toEqual([]);
    });

    it('isStrAllowed() and liveQuery test suite', async () => {
        const element = document.querySelector('c-sql-builder');
        let conditionInput = element.shadowRoot.querySelector("[data-id='sqlBuilder:conditions:orderingConditions']");
        let liveQueryPara = element.shadowRoot.querySelector('.liveQuery');
        element.config.sObjApiName = 'Case';
        element.config._LABELS.lbl_liveQuery = 'Live Query:';

        await isStrAllowedLiveQueryTestHandler(element, conditionInput, '(#1 OR #2) AND ((#3 AND #4) AND #5)', sqlBuilderConditionsData[6], sqlBuilderSelectedFieldsData[6], sqlBuilderOrderingsData[0], false, 'Valid Expression', true, liveQueryPara, `Live Query: SELECT Id, Reason FROM Case WHERE ((Origin IN ('Phone')) OR (CaseNumber ='123')) AND (((Source.SuppliedCompany ='StrataVAR') AND (Priority IN ('High'))) AND (Status IN ('Working'))) ORDER BY SuppliedPhone ASC NULLS FIRST`);
        await isStrAllowedLiveQueryTestHandler(element, conditionInput, '()', sqlBuilderConditionsData[0], sqlBuilderSelectedFieldsData[0], [], true, 'No field Selected..', false, undefined, undefined);
        await isStrAllowedLiveQueryTestHandler(element, conditionInput, '#1', sqlBuilderConditionsData[1], sqlBuilderSelectedFieldsData[1], [], false, 'Valid Expression', true, liveQueryPara, `Live Query: SELECT AccountId, Account.Description, Account.Fax, Account.Id, Account.Name, Account.ShippingCity FROM Case WHERE (Account.Origin IN ('Email'))`);
        await isStrAllowedLiveQueryTestHandler(element, conditionInput, '(#1)', sqlBuilderConditionsData[2], sqlBuilderSelectedFieldsData[2], [], false, 'Valid Expression', true, liveQueryPara, `Live Query: SELECT Id, CaseNumber, Origin FROM Case WHERE ((Type IN ('Mechanical')))`);
        await isStrAllowedLiveQueryTestHandler(element, conditionInput, '(((#1)))', sqlBuilderConditionsData[3], sqlBuilderSelectedFieldsData[3], [], false, 'Valid Expression', true, liveQueryPara, `Live Query: SELECT Id FROM Case WHERE ((((Type IN ('Mechanical')))))`);
        await isStrAllowedLiveQueryTestHandler(element, conditionInput, '#1 AND #2', sqlBuilderConditionsData[4], sqlBuilderSelectedFieldsData[4], [], false, 'Valid Expression', true, liveQueryPara, `Live Query: SELECT Id, Reason, SourceId, Type FROM Case WHERE (Origin IN ('Phone')) AND (CaseNumber ='123')`);
        await isStrAllowedLiveQueryTestHandler(element, conditionInput, '#1 OR #2', sqlBuilderConditionsData[4], sqlBuilderSelectedFieldsData[4], [], false, 'Valid Expression', true, liveQueryPara, `Live Query: SELECT Id, Reason, SourceId, Type FROM Case WHERE (Origin IN ('Phone')) OR (CaseNumber ='123')`);
        await isStrAllowedLiveQueryTestHandler(element, conditionInput, '#1 AND #2 AND #3', sqlBuilderConditionsData[5], sqlBuilderSelectedFieldsData[5], [], false, 'Valid Expression', true, liveQueryPara, `Live Query: SELECT Id FROM Case WHERE (Origin IN ('Phone')) AND (CaseNumber ='123') AND (Source.SuppliedCompany ='StrataVAR')`);
        await isStrAllowedLiveQueryTestHandler(element, conditionInput, '#1 AND #2 OR #3', [], [], [], true, 'Both AND OR cannot be without precedences...', [], false, undefined, undefined);
        await isStrAllowedLiveQueryTestHandler(element, conditionInput, '#1 OR #', [], [], [], true, '# must be followed by Integer Number', false, undefined, undefined);
        await isStrAllowedLiveQueryTestHandler(element, conditionInput, '(#1 OR #2) AND ((#3 AND #4) AND #5)', sqlBuilderConditionsData[6], sqlBuilderSelectedFieldsData[6], [], false, 'Valid Expression', true, liveQueryPara, `Live Query: SELECT Id, Reason FROM Case WHERE ((Origin IN ('Phone')) OR (CaseNumber ='123')) AND (((Source.SuppliedCompany ='StrataVAR') AND (Priority IN ('High'))) AND (Status IN ('Working')))`);
    });
});