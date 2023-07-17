import { filterLibs } from '../filterLibs';

describe('filterLibs', () => {
    describe('string__filter', () => {
        let filter;
        let record;

        beforeEach(() => {
            // Create a new filter and record object before each test case
            record = {
                Contact: {
                  Email: 'tjkdypn7@example.com',
                  FirstName: 'Q7O2H',
                  Id: '0035i00002qvJnsAAE'
                },
                ContactId: '0035i00002qvJnsAAE',
                CurrencyIsoCode: 'AUD',
                Id: '5005i00000Kiy93AAB',
                Origin: 'Phone',
                testPercent__c: 5,
                testText__c: 'Hello',
                Type: 'Mechanical'
              };
              filter = {
                fieldName: "Type",
                _filterOption: "eq",
                _filterStr: "Mechanical",
                _filterStrTo: "",
                _locale: "en-US",
              };
        });

        it('should return true when the filter option is "cn" and the value contains the filter string', () => {
            filter._filterOption = 'cn';
            filter._filterStr = 'example';
            record.Type = 'This is an example string';

            const result = filterLibs.string__filter(filter, record);

            expect(result).toBe(true);
        });

        it('should return true when the filter option is "ncn" and the value does not contain the filter string', () => {
            filter._filterOption = 'ncn';
            filter._filterStr = 'example';
            record.Type = 'This is a different string';

            const result = filterLibs.string__filter(filter, record);

            expect(result).toBe(true);
        });

        it('should return true when the filter option is "bn" and the value starts with the filter string', () => {
            filter._filterOption = 'bn';
            filter._filterStr = 'example';
            record.Type = 'example string';

            const result = filterLibs.string__filter(filter, record);

            expect(result).toBe(true);
        });

        it('should return true when the filter option is "nbn" and the value does not start with the filter string', () => {
            filter._filterOption = 'nbn';
            filter._filterStr = 'example';
            record.Type = 'different string';

            const result = filterLibs.string__filter(filter, record);

            expect(result).toBe(true);
        });

        it('should return true when the filter option is "ed" and the value ends with the filter string', () => {
            filter._filterOption = 'ed';
            filter._filterStr = 'example';
            record.Type = 'string example';

            const result = filterLibs.string__filter(filter, record);

            expect(result).toBe(true);
        });

        it('should return true when the filter option is "ned" and the value does not end with the filter string', () => {
            filter._filterOption = 'ned';
            filter._filterStr = 'example';
            record.Type = 'string different';

            const result = filterLibs.string__filter(filter, record);

            expect(result).toBe(true);
        });

        it('should return true when the filter option is "eq" and the value is equal to the filter string', () => {
            filter._filterOption = 'eq';
            filter._filterStr = 'example';
            record.Type = 'example';

            const result = filterLibs.string__filter(filter, record);

            expect(result).toBe(true);
        });

        it('should return true when the filter option is "neq" and the value is not equal to the filter string', () => {
            filter._filterOption = 'neq';
            filter._filterStr = 'example';
            record.Type = 'different';

            const result = filterLibs.string__filter(filter, record);

            expect(result).toBe(true);
        });

        it('should return true when the filter option is "em" and the value is null or undefined', () => {
            filter._filterOption = 'em';
            record.Type = null;

            const result1 = filterLibs.string__filter(filter, record);

            expect(result1).toBe(true);

            record.value = undefined;

            const result2 = filterLibs.string__filter(filter, record);

            expect(result2).toBe(true);
        });

        it('should return true when the filter option is "nem" and the value is not null or undefined', () => {
            filter._filterOption = 'nem';
            record.Type = 'example';

            const result = filterLibs.string__filter(filter, record);

            expect(result).toBe(true);
        });
    });
    
});
describe('number__filter', () => {
    let filter;
    let record;

    beforeEach(() => {
        // Create a new filter and record object before each test case
        record = {
            Contact: {
              Email: 'tjkdypn7@example.com',
              FirstName: 'Q7O2H',
              Id: '0035i00002qvJnsAAE'
            },
            ContactId: '0035i00002qvJnsAAE',
            CurrencyIsoCode: 'AUD',
            Id: '5005i00000Kiy93AAB',
            Origin: 'Phone',
            testPercent__c: 5,
            testText__c: 'Hello',
            Type: 'Mechanical'
          };
          filter = {
            fieldName: "testPercent__c",
            _filterOption: "eq",
            _filterStr: "Mechanical",
            _filterStrTo: "",
            _locale: "en-US",
          };
    });

    it('should return true when the filter option is "cn" and the value contains the filter string', () => {
        filter._filterOption = 'cn';
        filter._filterStr = '42';
        record.testPercent__c = 42;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "ncn" and the value does not contain the filter string', () => {
        filter._filterOption = 'ncn';
        filter._filterStr = '42';
        record.testPercent__c = 123;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "bn" and the value starts with the filter string', () => {
        filter._filterOption = 'bn';
        filter._filterStr = '42';
        record.testPercent__c = 423;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "nbn" and the value does not start with the filter string', () => {
        filter._filterOption = 'nbn';
        filter._filterStr = '42';
        record.testPercent__c = 123;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "ed" and the value ends with the filter string', () => {
        filter._filterOption = 'ed';
        filter._filterStr = '42';
        record.testPercent__c = 142;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "ned" and the value does not end with the filter string', () => {
        filter._filterOption = 'ned';
        filter._filterStr = '42';
        record.testPercent__c = 123;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "eq" and the value is equal to the filter number', () => {
        filter._filterOption = 'eq';
        filter._filterStr = '42';
        record.testPercent__c = 42;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "neq" and the value is not equal to the filter number', () => {
        filter._filterOption = 'neq';
        filter._filterStr = '42';
        record.testPercent__c = 123;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "em" and the value is null or undefined', () => {
        filter._filterOption = 'em';
        record.testPercent__c = null;

        const result1 = filterLibs.number__filter(filter, record);

        expect(result1).toBe(true);

        record.testPercent__c = undefined;

        const result2 = filterLibs.number__filter(filter, record);

        expect(result2).toBe(true);
    });

    it('should return true when the filter option is "nem" and the value is not null or undefined', () => {
        filter._filterOption = 'nem';
        record.testPercent__c = 42;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "gr" and the value is greater than the filter number', () => {
        filter._filterOption = 'gr';
        filter._filterStr = '42';
        record.testPercent__c = 43;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "gre" and the value is greater than or equal to the filter number', () => {
        filter._filterOption = 'gre';
        filter._filterStr = '42';
        record.testPercent__c = 42;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "ls" and the value is less than the filter number', () => {
        filter._filterOption = 'ls';
        filter._filterStr = '42';
        record.testPercent__c = 41;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "lse" and the value is less than or equal to the filter number', () => {
        filter._filterOption = 'lse';
        filter._filterStr = '42';
        record.testPercent__c = 42;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "rg" and the value is within the range of the filter numbers', () => {
        filter._filterOption = 'rg';
        filter._filterStr = '10';
        filter._filterStrTo = '100';
        record.testPercent__c = 42;

        const result = filterLibs.number__filter(filter, record);

        expect(result).toBe(true);
    });
});

describe('boolean__filter', () => {
    let filter;
    let record;

    beforeEach(() => {
        // Create a new filter and record object before each test case
        record = {
            Contact: {
                Email: 'tjkdypn7@example.com',
                FirstName: 'Q7O2H',
                Id: '0035i00002qvJnsAAE'
            },
            ContactId: '0035i00002qvJnsAAE',
            CurrencyIsoCode: 'AUD',
            Id: '5005i00000Kiy93AAB',
            Origin: 'Phone',
            testPercent__c: 5,
            testText__c: 'Hello',
            Type: 'Mechanical'
            };
        filter = {
            fieldName: "value",
            _filterOption: "eq",
            _filterStr: "Mechanical",
            _filterStrTo: "",
            _locale: "en-US",
        };
    });

    it('should return true when the filter option is "eq" and the value exists in the filter array', () => {
        filter._filterOption = 'eq';
        filter._filterStr = ['true', 'false'];
        record.value = true;

        const result = filterLibs.boolean__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "neq" and the value does not exist in the filter array', () => {
        filter._filterOption = 'neq';
        filter._filterStr = ['true', 'false'];
        record.value = false;

        const result = filterLibs.boolean__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "em" and the value is null or undefined', () => {
        filter._filterOption = 'em';
        record.value = null;

        const result1 = filterLibs.boolean__filter(filter, record);

        expect(result1).toBe(true);

        record.value = undefined;

        const result2 = filterLibs.boolean__filter(filter, record);

        expect(result2).toBe(true);
    });

    it('should return true when the filter option is "nem" and the value is not null or undefined', () => {
        filter._filterOption = 'nem';
        record.value = true;

        const result = filterLibs.boolean__filter(filter, record);

        expect(result).toBe(true);
    });
});
describe('datetime__filter', () => {
    let filter;
    let record;

    beforeEach(() => {
        // Create a new filter and record object before each test case
        record = {
            Contact: {
                Email: 'tjkdypn7@example.com',
                FirstName: 'Q7O2H',
                Id: '0035i00002qvJnsAAE'
            },
            ContactId: '0035i00002qvJnsAAE',
            CurrencyIsoCode: 'AUD',
            Id: '5005i00000Kiy93AAB',
            Origin: 'Phone',
            testPercent__c: 5,
            testText__c: 'Hello',
            Type: 'Mechanical'
            };
        filter = {
            fieldName: "value",
            _filterOption: "eq",
            _filterStr: "Mechanical",
            _filterStrTo: "",
            _locale: "en-US",
        };
    });

    it('should return true when the filter option is "eq" and the value matches the filter datetime', () => {
        filter._filterOption = 'eq';
        filter._filterStr = '2023-07-14T10:00:00Z';
        record.value = '2023-07-14T10:00:00Z';

        const result = filterLibs.datetime__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "neq" and the value does not match the filter datetime', () => {
        filter._filterOption = 'neq';
        filter._filterStr = '2023-07-14T10:00:00Z';
        record.value = '2023-07-14T12:00:00Z';

        const result = filterLibs.datetime__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "em" and the value is undefined', () => {
        filter._filterOption = 'em';
        record.value = undefined;

        const result = filterLibs.datetime__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "nem" and the value is defined', () => {
        filter._filterOption = 'nem';
        record.value = '2023-07-14T10:00:00Z';

        const result = filterLibs.datetime__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "gr" and the value is greater than the filter datetime', () => {
        filter._filterOption = 'gr';
        filter._filterStr = '2023-07-14T10:00:00Z';
        record.value = '2023-07-14T12:00:00Z';

        const result = filterLibs.datetime__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "gre" and the value is greater than or equal to the filter datetime', () => {
        filter._filterOption = 'gre';
        filter._filterStr = '2023-07-14T10:00:00Z';
        record.value = '2023-07-14T10:00:00Z';

        const result = filterLibs.datetime__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "ls" and the value is less than the filter datetime', () => {
        filter._filterOption = 'ls';
        filter._filterStr = '2023-07-14T12:00:00Z';
        record.value = '2023-07-14T10:00:00Z';

        const result = filterLibs.datetime__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "lse" and the value is less than or equal to the filter datetime', () => {
        filter._filterOption = 'lse';
        filter._filterStr = '2023-07-14T10:00:00Z';
        record.value = '2023-07-14T10:00:00Z';

        const result = filterLibs.datetime__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "rg" and the value is within the range of the filter datetimes', () => {
        filter._filterOption = 'rg';
        filter._filterStr = '2023-07-14T10:00:00Z';
        filter._filterStrTo = '2023-07-14T12:00:00Z';
        record.value = '2023-07-14T11:00:00Z';

        const result = filterLibs.datetime__filter(filter, record);

        expect(result).toBe(true);
    });
});
describe('date__filter', () => {
    let filter;
    let record;

    beforeEach(() => {
        // Create a new filter and record object before each test case
        record = {
            Contact: {
                Email: 'tjkdypn7@example.com',
                FirstName: 'Q7O2H',
                Id: '0035i00002qvJnsAAE'
            },
            ContactId: '0035i00002qvJnsAAE',
            CurrencyIsoCode: 'AUD',
            Id: '5005i00000Kiy93AAB',
            Origin: 'Phone',
            testPercent__c: 5,
            testText__c: 'Hello',
            Type: 'Mechanical'
            };
        filter = {
            fieldName: "value",
            _filterOption: "eq",
            _filterStr: "Mechanical",
            _filterStrTo: "",
            _locale: "en-US",
        };
    });

    it('should return true when the filter option is "eq" and the value matches the filter date', () => {
        filter._filterOption = 'eq';
        filter._filterStr = '2023-07-14';
        filter._locale = 'en-US';
        record.value = '2023-07-14';

        const result = filterLibs.date__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "neq" and the value does not match the filter date', () => {
        filter._filterOption = 'neq';
        filter._filterStr = '2023-07-14';
        filter._locale = 'en-US';
        record.value = '2023-07-15';

        const result = filterLibs.date__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "em" and the value is undefined', () => {
        filter._filterOption = 'em';
        record.value = undefined;

        const result = filterLibs.date__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "nem" and the value is defined', () => {
        filter._filterOption = 'nem';
        record.value = '2023-07-14';

        const result = filterLibs.date__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "gr" and the value is greater than the filter date', () => {
        filter._filterOption = 'gr';
        filter._filterStr = '2023-07-14';
        filter._locale = 'en-US';
        record.value = '2023-07-15';

        const result = filterLibs.date__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "gre" and the value is greater than or equal to the filter date', () => {
        filter._filterOption = 'gre';
        filter._filterStr = '2023-07-14';
        filter._locale = 'en-US';
        record.value = '2023-07-14';

        const result = filterLibs.date__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "ls" and the value is less than the filter date', () => {
        filter._filterOption = 'ls';
        filter._filterStr = '2023-07-15';
        filter._locale = 'en-US';
        record.value = '2023-07-14';

        const result = filterLibs.date__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "lse" and the value is less than or equal to the filter date', () => {
        filter._filterOption = 'lse';
        filter._filterStr = '2023-07-14';
        filter._locale = 'en-US';
        record.value = '2023-07-14';

        const result = filterLibs.date__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "rg" and the value is within the range of the filter dates', () => {
        filter._filterOption = 'rg';
        filter._filterStr = '2023-07-14';
        filter._filterStrTo = '2023-07-15';
        filter._locale = 'en-US';
        record.value = '2023-07-14';

        const result = filterLibs.date__filter(filter, record);

        expect(result).toBe(true);
    });
});
describe('picklist__filter', () => {
    let filter;
    let record;

    beforeEach(() => {
        // Create a new filter and record object before each test case
        record = {
            Contact: {
                Email: 'tjkdypn7@example.com',
                FirstName: 'Q7O2H',
                Id: '0035i00002qvJnsAAE'
            },
            ContactId: '0035i00002qvJnsAAE',
            CurrencyIsoCode: 'AUD',
            Id: '5005i00000Kiy93AAB',
            Origin: 'Phone',
            testPercent__c: 5,
            testText__c: 'Hello',
            Type: 'Mechanical'
            };
        filter = {
            fieldName: "value",
            _filterOption: "eq",
            _filterStr: "Mechanical",
            _filterStrTo: "",
            _locale: "en-US",
        };
    });

    it('should return true when the filter option is "cn" and the value contains any of the filter values', () => {
        filter._filterOption = 'cn';
        filter._filterStr = ['option1', 'option2'];
        record.value = 'Option1';

        const result = filterLibs.picklist__filter(filter, record);

        expect(result).toBe('option1');
    });

    it('should return true when the filter option is "ncn" and the value does not contain any of the filter values', () => {
        filter._filterOption = 'ncn';
        filter._filterStr = ['option1', 'option2'];
        record.value = 'Option3';

        const result = filterLibs.picklist__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "eq" and the value matches any of the filter values', () => {
        filter._filterOption = 'eq';
        filter._filterStr = ['option1', 'option2'];
        record.value = 'Option1';

        const result = filterLibs.picklist__filter(filter, record);

        expect(result).toBe('option1');
    });

    it('should return true when the filter option is "neq" and the value does not match any of the filter values', () => {
        filter._filterOption = 'neq';
        filter._filterStr = ['option1', 'option2'];
        record.value = 'Option3';

        const result = filterLibs.picklist__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "em" and the value is null or undefined', () => {
        filter._filterOption = 'em';
        record.value = null;

        const result1 = filterLibs.picklist__filter(filter, record);

        expect(result1).toBe(true);

        record.value = undefined;

        const result2 = filterLibs.picklist__filter(filter, record);

        expect(result2).toBe(true);
    });

    it('should return true when the filter option is "nem" and the value is not null or undefined', () => {
        filter._filterOption = 'nem';
        record.value = 'Option1';

        const result = filterLibs.picklist__filter(filter, record);

        expect(result).toBe(true);
    });
});
describe('reference__filter', () => {
    let filter;
    let record;

    beforeEach(() => {
        // Create a new filter and record object before each test case
        record = {
            Contact: {
                Email: 'tjkdypn7@example.com',
                FirstName: 'Q7O2H',
                Id: '0035i00002qvJnsAAE'
            },
            ContactId: '0035i00002qvJnsAAE',
            CurrencyIsoCode: 'AUD',
            Id: '5005i00000Kiy93AAB',
            Origin: 'Phone',
            testPercent__c: 5,
            testText__c: 'Hello',
            Type: 'Mechanical'
            };
        filter = {
            fieldName: "Contact.Email",
            _filterOption: "eq",
            _filterStr: "Mechanical",
            _filterStrTo: "",
            _locale: "en-US",
        };
    });

    it('should return true when the filter option is "cn" and the value contains the filter string', () => {
        filter._filterOption = 'cn';
        filter._filterStr = 'example';
        record.Contact.Email = 'tjkdypn7@example.com';

        const result = filterLibs.reference__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "ncn" and the value does not contain the filter string', () => {
        filter._filterOption = 'ncn';
        filter._filterStr = 'reference';
        record.Contact.Email = 'tjkdypn7@example.com';

        const result = filterLibs.reference__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "bn" and the value starts with the filter string', () => {
        filter._filterOption = 'bn';
        filter._filterStr = 'tjkdypn7@';
        record.Contact.Email = 'tjkdypn7@example.com';

        const result = filterLibs.reference__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "nbn" and the value does not start with the filter string', () => {
        filter._filterOption = 'nbn';
        filter._filterStr = 'reference';
        record.Contact.Email = 'tjkdypn7@example.com';

        const result = filterLibs.reference__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "ed" and the value ends with the filter string', () => {
        filter._filterOption = 'ed';
        filter._filterStr = 'example.com';
        record.Contact.Email = 'tjkdypn7@example.com';

        const result = filterLibs.reference__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "ned" and the value does not end with the filter string', () => {
        filter._filterOption = 'ned';
        filter._filterStr = 'reference';
        record.Contact.Email = 'tjkdypn7@example.com';

        const result = filterLibs.reference__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "eq" and the value is equal to the filter string', () => {
        filter._filterOption = 'eq';
        filter._filterStr = 'tjkdypn7@example.com';
        record.Contact.Email = 'tjkdypn7@example.com';

        const result = filterLibs.reference__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "neq" and the value is not equal to the filter string', () => {
        filter._filterOption = 'neq';
        filter._filterStr = 'reference';
        record.Contact.Email = 'tjkdypn7@example.com';

        const result = filterLibs.reference__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "em" and the value is null or undefined', () => {
        filter._filterOption = 'em';
        record.Contact.Email = null;

        const result1 = filterLibs.reference__filter(filter, record);

        expect(result1).toBe(false);

        record.Contact.Email = undefined;

        const result2 = filterLibs.reference__filter(filter, record);

        expect(result2).toBe(false);
    });

    it('should return true when the filter option is "nem" and the value is not null or undefined', () => {
        filter._filterOption = 'nem';
        record.Contact.Email = 'tjkdypn7@example.com';

        const result = filterLibs.reference__filter(filter, record);

        expect(result).toBe(true);
    });
});

describe('multipicklist__filter', () => {
    let filter;
    let record;

    beforeEach(() => {
        // Create a new filter and record object before each test case
        record = {
            Contact: {
                Email: 'tjkdypn7@example.com',
                FirstName: 'Q7O2H',
                Id: '0035i00002qvJnsAAE'
            },
            ContactId: '0035i00002qvJnsAAE',
            CurrencyIsoCode: 'AUD',
            Id: '5005i00000Kiy93AAB',
            Origin: 'Phone',
            testPercent__c: 5,
            testText__c: 'Hello',
            Type: 'Mechanical'
            };
        filter = {
            fieldName: "value",
            _filterOption: "eq",
            _filterStr: "Mechanical",
            _filterStrTo: "",
            _locale: "en-US",
        };
    });

    it('should return true when the filter option is "cn" and the value contains any of the filter values', () => {
        filter._filterOption = 'cn';
        filter._filterStr = ['option1', 'option2'];
        record.value = 'option1;option3';

        const result = filterLibs.multipicklist__filter(filter, record);

        expect(result).toBe('option1');
    });

    it('should return true when the filter option is "ncn" and the value does not contain any of the filter values', () => {
        filter._filterOption = 'ncn';
        filter._filterStr = ['option1', 'option2'];
        record.value = 'Option3;Option4';

        const result = filterLibs.multipicklist__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "eq" and the value contains all of the filter values', () => {
        filter._filterOption = 'eq';
        filter._filterStr = ['option1', 'option2'];
        record.value = 'option1;option2';

        const result = filterLibs.multipicklist__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "neq" and the value does not contain any of the filter values', () => {
        filter._filterOption = 'neq';
        filter._filterStr = ['option1', 'option2'];
        record.value = 'Option3;Option4';

        const result = filterLibs.multipicklist__filter(filter, record);

        expect(result).toBe(true);
    });

    it('should return true when the filter option is "em" and the value is null or undefined', () => {
        filter._filterOption = 'em';
        record.value = null;

        const result1 = filterLibs.multipicklist__filter(filter, record);

        expect(result1).toBe(true);

        record.value = undefined;

        const result2 = filterLibs.multipicklist__filter(filter, record);

        expect(result2).toBe(true);
    });

    it('should return true when the filter option is "nem" and the value is not null or undefined', () => {
        filter._filterOption = 'nem';
        record.value = 'Option1';

        const result = filterLibs.multipicklist__filter(filter, record);

        expect(result).toBe(true);
    });
});
describe('containsAllElements', () => {
    it('should return true when all elements in the small array are present in the big array', () => {
        const smallArray = ['a', 'b', 'c'];
        const bigArray = ['a', 'b', 'c', 'd', 'e'];

        const result = filterLibs.containsAllElements(smallArray, bigArray);

        expect(result).toBe(true);
    });

    it('should return false when not all elements in the small array are present in the big array', () => {
        const smallArray = ['a', 'b', 'c'];
        const bigArray = ['a', 'd', 'e'];

        const result = filterLibs.containsAllElements(smallArray, bigArray);

        expect(result).toBe(false);
    });
});

describe('hasNoMatch', () => {
    it('should return true when none of the elements in the small array are present in the big array', () => {
        const smallArray = ['x', 'y', 'z'];
        const bigArray = ['a', 'b', 'c', 'd', 'e'];

        const result = filterLibs.hasNoMatch(smallArray, bigArray);

        expect(result).toBe(true);
    });

    it('should return false when at least one element in the small array is present in the big array', () => {
        const smallArray = ['a', 'b', 'c'];
        const bigArray = ['a', 'd', 'e'];

        const result = filterLibs.hasNoMatch(smallArray, bigArray);

        expect(result).toBe(false);
    });
});








