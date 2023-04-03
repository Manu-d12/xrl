import { createElement } from 'lwc';
import SqlBuilder from 'c/sqlBuilder';
import { libs } from 'c/libs';

describe('c-sql-Builder', () => {
    it('should initialize config and sqlBuilder', () => {
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
});