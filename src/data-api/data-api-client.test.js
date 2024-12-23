/* eslint-disable global-require */
/* eslint-disable no-underscore-dangle */
const rewire = require('rewire');
const {
  ExecuteStatementCommand
} = require('@aws-sdk/client-rds-data');

const dataApiClient = rewire('./data-api-client');
jest.mock('@aws-sdk/client-rds-data');

describe('utility', () => {

  test('error', async () => {
    const error = dataApiClient.__get__('error');
    const err = () => error('test error');
    expect(err).toThrow('test error');
  });

  test('omit', async () => {
    const omit = dataApiClient.__get__('omit');
    const result = omit({ a: 1, b: 2, c: 3 }, ['c']);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  test('pick', async () => {
    const pick = dataApiClient.__get__('pick');
    const result = pick({ a: 1, b: 2, c: 3 }, ['a', 'c']);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  test('flatten', async () => {
    const flatten = dataApiClient.__get__('flatten');
    const result = flatten([[1, 2, 3], 4, [5, 6], 7, 8]);
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

}); // end utility


describe('query parsing', () => {

  describe('parseSQL', () => {

    const parseSQL = dataApiClient.__get__('parseSQL');

    test('string', async () => {
      const result = parseSQL([`SELECT * FROM myTable`]);
      expect(result).toBe('SELECT * FROM myTable');
    });

    test('object', async () => {
      const result = parseSQL([{ sql: `SELECT * FROM myTable` }]);
      expect(result).toBe('SELECT * FROM myTable');
    });

    test('no query (error)', async () => {
      const result = () => parseSQL([]);
      expect(result).toThrow(`No 'sql' statement provided.`);
    });
  }); // end parseSQL


  describe('parseParams', () => {

    const parseParams = dataApiClient.__get__('parseParams');

    test('array', async () => {
      const result = parseParams(['query', [1, 2]]);
      expect(result).toEqual([1, 2]);
    });

    test('object', async () => {
      const result = parseParams(['query', { a: 1, b: 2 }]);
      expect(result).toEqual([{ a: 1, b: 2 }]);
    });

    test('array (in object)', async () => {
      const result = parseParams([{ parameters: [1, 2, 3] }]);
      expect(result).toEqual([1, 2, 3]);
    });

    test('object (in object)', async () => {
      const result = parseParams([{ parameters: { a: 1, b: 2 } }]);
      expect(result).toEqual([{ a: 1, b: 2 }]);
    });

    test('no params (empty array)', async () => {
      const result = parseParams(['query']);
      expect(result).toEqual([]);
    });

    test('no params in object (empty array)', async () => {
      const result = parseParams([{}]);
      expect(result).toEqual([]);
    });

    test('invalid type (error)', async () => {
      const result = () => parseParams(['query', 'string']);
      expect(result).toThrow(`'parameters' must be an object or array`);
    });

    test('invalid type in object (error)', async () => {
      const result = () => parseParams([{ parameters: 'string' }]);
      expect(result).toThrow(`'parameters' must be an object or array`);
    });

  }); // end parse params

}); // end query parsing


describe('query configuration parsing', () => {

  test('mergeConfig', async () => {
    const mergeConfig = dataApiClient.__get__('mergeConfig');
    const result = mergeConfig({ secretArn: 'secretArn', resourceArn: 'resourceArn' }, { database: 'db' });
    expect(result).toEqual({ secretArn: 'secretArn', resourceArn: 'resourceArn', database: 'db' });
  });

  describe('parseDatabase', () => {

    const parseDatabase = dataApiClient.__get__('parseDatabase');

    test('from config w/ transaction', async () => {
      const result = parseDatabase({ database: 'db', transactionId: 'txid' });
      expect(result).toBe('db');
    });

    test('from args', async () => {
      const result = parseDatabase({ database: 'db' }, [{ database: 'db2' }]);
      expect(result).toBe('db2');
    });

    test('from args, not string (error)', async () => {
      const result = () => parseDatabase({ database: 'db' }, [{ database: 1 }]);
      expect(result).toThrow(`'database' must be a string.`);
    });

    test('from config', async () => {
      const result = parseDatabase({ database: 'db' }, [{}]);
      expect(result).toBe('db');
    });

    test('no database provided (return undefined)', async () => {
      const result = parseDatabase({}, [{}]);
      expect(result).toBeUndefined();
    });

  }); // end parseDatabase

  describe('parseHydrate', () => {

    const parseHydrate = dataApiClient.__get__('parseHydrate');

    test('parseHydrate - from args', async () => {
      const result = parseHydrate({ hydrateColumnNames: true }, [{ hydrateColumnNames: false }]);
      expect(result).toBe(false);
    });

    test('parseHydrate - from config', async () => {
      const result = parseHydrate({ hydrateColumnNames: true }, [{}]);
      expect(result).toBe(true);
    });

    test('parseHydrate - from args, not boolean (error)', async () => {
      const result = () => parseHydrate({ hydrateColumnNames: true }, [{ hydrateColumnNames: 'false' }]);
      expect(result).toThrow(`'hydrateColumnNames' must be a boolean.`);
    });

  });


  describe('prepareParams', () => {

    const prepareParams = dataApiClient.__get__('prepareParams');

    test('prepareParams - omit specific args, merge others', async () => {
      const result = prepareParams({ secretArn: 'secretArn', resourceArn: 'resourceArn' },
        [{ hydrateColumnNames: true, parameters: [1, 2, 3], test: true }]);
      expect(result).toEqual({ secretArn: 'secretArn', resourceArn: 'resourceArn', test: true });
    });

    test('prepareParams - no args', async () => {
      const result = prepareParams({ secretArn: 'secretArn', resourceArn: 'resourceArn' }, []);
      expect(result).toEqual({ secretArn: 'secretArn', resourceArn: 'resourceArn' });
    });

  }); // end prepareParams

}); // end query config parsing


describe('query parameter processing', () => {

  test('splitParams', async () => {
    const splitParams = dataApiClient.__get__('splitParams');
    const result = splitParams({ param1: 'p1', param2: 'p2' });
    expect(result).toEqual([
      { name: 'param1', value: 'p1' },
      { name: 'param2', value: 'p2' }
    ]);
  });

  test('normalizeParams', async () => {
    const normalizeParams = dataApiClient.__get__('normalizeParams');
    const result = normalizeParams([
      { name: 'param1', value: 'p1' },
      { param2: 'p2' },
      [{ name: 'param3', value: 'p3' }, { param4: 'p4' }],
      { name: 'param5', value: 'p5', param6: 'p6' }
    ]);
    expect(result).toEqual([
      { name: 'param1', value: 'p1' },
      { name: 'param2', value: 'p2' },
      [
        { name: 'param3', value: 'p3' },
        { name: 'param4', value: 'p4' }
      ],
      { name: 'name', value: 'param5' },
      { name: 'value', value: 'p5' },
      { name: 'param6', value: 'p6' }
    ]);
  });

  describe('formatType', () => {

    const formatType = dataApiClient.__get__('formatType');

    test('stringValue', async () => {
      const result = formatType('param', 'string val', 'stringValue');
      expect(result).toEqual({ name: 'param', value: { stringValue: 'string val' } });
    });

    test('booleanValue', async () => {
      const result = formatType('param', true, 'booleanValue');
      expect(result).toEqual({ name: 'param', value: { booleanValue: true } });
    });

    test('longValue', async () => {
      const result = formatType('param', 1234567890, 'longValue');
      expect(result).toEqual({ name: 'param', value: { longValue: 1234567890 } });
    });

    test('existing type', async () => {
      const result = formatType('param', { stringValue: 'string' }, null);
      expect(result).toEqual({ name: 'param', value: { stringValue: 'string' } });
    });

    test('undefined (error)', async () => {
      const result = () => formatType('param', 'invalid type', undefined);
      expect(result).toThrow(`'param' is an invalid type`);
    });

  });


  describe('getType', () => {

    const getType = dataApiClient.__get__('getType');

    test('stringValue', async () => {
      const result = getType('string');
      expect(result).toBe('stringValue');
    });

    test('booleanValue', async () => {
      const result = getType(true);
      expect(result).toBe('booleanValue');
    });

    test('longValue', async () => {
      const result = getType(123456789);
      expect(result).toBe('longValue');
    });

    test('doubleValue', async () => {
      const result = getType(1234.56789);
      expect(result).toBe('doubleValue');
    });

    test('isNull', async () => {
      const result = getType(null);
      expect(result).toBe('isNull');
    });

    test('blobValue', async () => {
      const result = getType(Buffer.from('data'));
      expect(result).toBe('blobValue');
    });

    test('invalid type (undefined)', async () => {
      const result = getType([]); // use array for now
      expect(result).toBeUndefined();
    });

  });



  describe('formatParam', () => {

    const formatParam = dataApiClient.__get__('formatParam');

    test('stringValue', async () => {
      const result = formatParam('param', 'string');
      expect(result).toEqual({ name: 'param', value: { stringValue: 'string' } });
    });

    test('booleanValue', async () => {
      const result = formatParam('param', true);
      expect(result).toEqual({ name: 'param', value: { booleanValue: true } });
    });

    test('longValue', async () => {
      const result = formatParam('param', 123456789);
      expect(result).toEqual({ name: 'param', value: { longValue: 123456789 } });
    });

    test('doubleValue', async () => {
      const result = formatParam('param', 1234.56789);
      expect(result).toEqual({ name: 'param', value: { doubleValue: 1234.56789 } });
    });

    test('isNull', async () => {
      const result = formatParam('param', null);
      expect(result).toEqual({ name: 'param', value: { isNull: true } });
    });

    test('blobValue', async () => {
      const result = formatParam('param', Buffer.from('data'));
      expect(result).toEqual({
        name: 'param',
        value: { blobValue: Buffer.from('data') }
      });
    });

    test('supplied type', async () => {
      const result = formatParam('param', { stringValue: 'string' });
      expect(result).toEqual({
        name: 'param',
        value: { stringValue: 'string' }
      });
    });

    test('invalid type (error)', async () => {
      const result = () => formatParam('param', []); // use array for now
      expect(result).toThrow(`'param' is an invalid type`);
    });

  });

  describe('getSqlParams', () => {

    const getSqlParams = dataApiClient.__get__('getSqlParams');

    test('named parameters', async () => {
      const result = getSqlParams('SELECT * FROM myTable WHERE id = :id AND test = :test');
      expect(result).toEqual({ id: { type: 'n_ph' }, test: { type: 'n_ph' } });
    });

    test('named identifiers', async () => {
      const result = getSqlParams('SELECT ::name FROM myTable WHERE id = :id');
      expect(result).toEqual({ id: { type: 'n_ph' }, name: { type: 'n_id' } });
    });

  }); // end getSqlParams


  describe('processParams', () => {

    const processParams = dataApiClient.__get__('processParams');

    test('single param, single record', async () => {
      const { processedParams, escapedSql } = processParams(
        'pg',
        'SELECT * FROM myTable WHERE id = :id',
        { id: { type: 'n_ph' } },
        [{ name: 'id', value: 1 }]
      );
      expect(escapedSql).toBe('SELECT * FROM myTable WHERE id = :id');
      expect(processedParams).toEqual([
        { name: 'id', value: { longValue: 1 } }
      ]);
    });

    test('mulitple params, named param, single record', async () => {
      const { processedParams, escapedSql } = processParams(
        'pg',
        'SELECT ::columnName FROM myTable WHERE id = :id AND id2 = :id2',
        { id: { type: 'n_ph' }, id2: { type: 'n_ph' }, columnName: { type: 'n_id' } },
        [
          { name: 'id', value: 1 },
          { name: 'id2', value: 2 },
          { name: 'columnName', value: 'testColumn' }
        ]
      );
      expect(escapedSql).toBe('SELECT `testColumn` FROM myTable WHERE id = :id AND id2 = :id2');
      expect(processedParams).toEqual([
        { name: 'id', value: { longValue: 1 } },
        { name: 'id2', value: { longValue: 2 } }
      ]);
    });

    test('single param, multiple records', async () => {
      const { processedParams, escapedSql } = processParams(
        'pg',
        'SELECT * FROM myTable WHERE id = :id',
        { id: { type: 'n_ph' } },
        [
          [{ name: 'id', value: 1 }],
          [{ name: 'id', value: 2 }]
        ]
      );
      expect(escapedSql).toBe('SELECT * FROM myTable WHERE id = :id');
      expect(processedParams).toEqual([
        [{ name: 'id', value: { longValue: 1 } }],
        [{ name: 'id', value: { longValue: 2 } }]
      ]);
    });

    test('multiple params, multiple records', async () => {
      const { processedParams, escapedSql } = processParams(
        'pg',
        'SELECT * FROM myTable WHERE id = :id',
        { id: { type: 'n_ph' }, id2: { type: 'n_ph' } },
        [
          [{ name: 'id', value: 1 }, { name: 'id2', value: 2 }],
          [{ name: 'id', value: 2 }, { name: 'id2', value: 3 }]
        ]
      );
      expect(escapedSql).toBe('SELECT * FROM myTable WHERE id = :id');
      expect(processedParams).toEqual([
        [{ name: 'id', value: { longValue: 1 } }, { name: 'id2', value: { longValue: 2 } }],
        [{ name: 'id', value: { longValue: 2 } }, { name: 'id2', value: { longValue: 3 } }]
      ]);
    });

    test('mulitple params, named params, multiple records', async () => {
      const { processedParams, escapedSql } = processParams(
        'pg',
        'SELECT ::columnName FROM myTable WHERE id = :id AND id2 = :id2',
        { id: { type: 'n_ph' }, id2: { type: 'n_ph' }, columnName: { type: 'n_id' } },
        [
          [
            { name: 'id', value: 1 },
            { name: 'id2', value: 2 },
            { name: 'columnName', value: 'testColumn' }
          ],
          [
            { name: 'id', value: 2 },
            { name: 'id2', value: 3 },
            { name: 'columnName', value: 'testColumnx' } // ignored
          ]
        ]
      );
      expect(escapedSql).toBe('SELECT `testColumn` FROM myTable WHERE id = :id AND id2 = :id2');
      expect(processedParams).toEqual([
        [
          { name: 'id', value: { longValue: 1 } },
          { name: 'id2', value: { longValue: 2 } }
        ],
        [
          { name: 'id', value: { longValue: 2 } },
          { name: 'id2', value: { longValue: 3 } }
        ]
      ]);
    });

    test('typecasting params', async () => {
      const { processedParams, escapedSql } = processParams(
        'pg',
        'INSERT INTO users(id, name, meta) VALUES(:id, :name, :meta)',
        { id: { type: 'n_ph' }, name: { type: 'n_ph' }, meta: { type: 'n_ph' } },
        [
          { name: 'id', value: '0bb99248-2e7d-4007-a4b2-579b00649ce1', cast: 'uuid' },
          { name: 'name', value: 'Test' },
          { name: 'meta', value: '{"extra": true}', cast: 'jsonb' }
        ]
      );
      expect(escapedSql).toBe('INSERT INTO users(id, name, meta) VALUES(:id::uuid, :name, :meta::jsonb)');
      expect(processedParams).toEqual([
        { name: 'id', value: { stringValue: '0bb99248-2e7d-4007-a4b2-579b00649ce1' } },
        { name: 'name', value: { stringValue: 'Test' } },
        { name: 'meta', value: { stringValue: '{"extra": true}' } }
      ]);
    });

  }); // end processParams

});

describe('querying', () => {

  describe('query', () => {

    const query = dataApiClient.__get__('query');

    let parameters = {};
    jest.spyOn(ExecuteStatementCommand.prototype, 'constructor');

    const config = {
      secretArn: 'secretArn',
      resourceArn: 'resourceArn',
      database: 'db',
      RDS: {
        send: (awsExecuteObject) => {
          // capture the parameters for testing
          // ExecuteStatementCommand contains input property which has the configs
          parameters = awsExecuteObject.input;
          return Promise.resolve(require('../../test/test-data/data-api-client/sample-query-response.json'));
        }
      }
    };

    test('simple query', async () => {

      const result = await query(config, 'SELECT * FROM table WHERE id < :id', { id: 3 });

      expect(result).toEqual({
        records: [
          [1, 'Category 1', null, '2019-11-12 22:00:11', '2019-11-12 22:15:25', null],
          [2, 'Category 2', 'Description of Category 2', '2019-11-12 22:17:11', '2019-11-12 22:21:36', null]
        ]
      });
      expect(parameters).toEqual({
        secretArn: 'secretArn',
        resourceArn: 'resourceArn',
        database: 'db',
        sql: 'SELECT * FROM table WHERE id < :id',
        parameters: [{ name: 'id', value: { longValue: 3 } }]
      });

    });
  }); // end query

  describe('formatRecords', () => {

    const formatRecords = dataApiClient.__get__('formatRecords');

    test('with columnMetadata', async () => {
      const { records, columnMetadata } = require('../../test/test-data/data-api-client/sample-query-response.json');
      const result = formatRecords(records, columnMetadata, true);
      expect(result).toEqual([
        {
          created: '2019-11-12 22:00:11',
          deleted: null,
          description: null,
          id: 1,
          modified: '2019-11-12 22:15:25',
          name: 'Category 1'
        },
        {
          created: '2019-11-12 22:17:11',
          deleted: null,
          description: 'Description of Category 2',
          id: 2,
          modified: '2019-11-12 22:21:36',
          name: 'Category 2'
        }
      ]);
    });

    test('without columnMetadata', async () => {
      const { records } = require('../../test/test-data/data-api-client/sample-query-response.json');
      const result = formatRecords(records, false);
      expect(result).toEqual([
        [1, 'Category 1', null, '2019-11-12 22:00:11', '2019-11-12 22:15:25', null],
        [2, 'Category 2', 'Description of Category 2', '2019-11-12 22:17:11', '2019-11-12 22:21:36', null]
      ]);
    });
  }); // end formatRecords


  describe('formatUpdateResults', () => {

    const formatUpdateResults = dataApiClient.__get__('formatUpdateResults');

    test('with insertIds', async () => {
      const { updateResults } = require('../../test/test-data/data-api-client/sample-batch-insert-response.json');
      const result = formatUpdateResults(updateResults);
      expect(result).toEqual([
        { insertId: 316 },
        { insertId: 317 }
      ]);
    });

    test('without insertIds', async () => {
      const { updateResults } = require('../../test/test-data/data-api-client/sample-batch-update-response.json');
      const result = formatUpdateResults(updateResults);
      expect(result).toEqual([
        {},
        {}
      ]);
    });

  });


  describe('formatResults', () => {

    const formatResults = dataApiClient.__get__('formatResults');

    test('select (hydrate)', async () => {
      const response = require('../../test/test-data/data-api-client/sample-query-response.json');
      const result = formatResults(response, true, false);
      expect(result).toEqual({
        records: [
          {
            created: '2019-11-12 22:00:11',
            deleted: null,
            description: null,
            id: 1,
            modified: '2019-11-12 22:15:25',
            name: 'Category 1'
          },
          {
            created: '2019-11-12 22:17:11',
            deleted: null,
            description: 'Description of Category 2',
            id: 2,
            modified: '2019-11-12 22:21:36',
            name: 'Category 2'
          }
        ]
      });
    });

    test('select (hydrate) with date deserialization', async () => {
      const response = require('../../test/test-data/data-api-client/sample-query-response.json');
      const result = formatResults(response, true, false, { deserializeDate: true });
      expect(result).toEqual({
        records: [
          {
            created: new Date('2019-11-12T22:00:11Z'),
            deleted: null,
            description: null,
            id: 1,
            modified: new Date('2019-11-12T22:15:25Z'),
            name: 'Category 1'
          },
          {
            created: new Date('2019-11-12T22:17:11Z'),
            deleted: null,
            description: 'Description of Category 2',
            id: 2,
            modified: new Date('2019-11-12T22:21:36Z'),
            name: 'Category 2'
          }
        ]
      });
    });


    test('select (no hydrate)', async () => {
      const response = require('../../test/test-data/data-api-client/sample-query-response.json');
      const result = formatResults(response, false, false);
      expect(result).toEqual({
        records: [
          [1, 'Category 1', null, '2019-11-12 22:00:11', '2019-11-12 22:15:25', null],
          [2, 'Category 2', 'Description of Category 2', '2019-11-12 22:17:11', '2019-11-12 22:21:36', null]
        ]
      });
    });

    test('select (with metadata)', async () => {
      const response = require('../../test/test-data/data-api-client/sample-query-response.json');
      const { columnMetadata } = require('../../test/test-data/data-api-client/sample-query-response.json');
      const result = formatResults(response, false, true);
      expect(result).toEqual({
        columnMetadata,
        records: [
          [1, 'Category 1', null, '2019-11-12 22:00:11', '2019-11-12 22:15:25', null],
          [2, 'Category 2', 'Description of Category 2', '2019-11-12 22:17:11', '2019-11-12 22:21:36', null]
        ]
      });
    });

    test('select (with date deserialization to UTC)', async () => {
      const response = require('../../test/test-data/data-api-client/sample-query-response.json');
      const result = formatResults(response, false, false, { deserializeDate: true });
      expect(result).toEqual({
        records: [
          [1, 'Category 1', null, new Date('2019-11-12T22:00:11.000Z'), new Date('2019-11-12T22:15:25.000Z'), null],
          [2, 'Category 2', 'Description of Category 2', new Date('2019-11-12T22:17:11.000Z'), new Date('2019-11-12T22:21:36.000Z'), null]
        ]
      });
    });

    test('select (with date deserialization to local TZ)', async () => {
      const response = require('../../test/test-data/data-api-client/sample-query-response.json');
      const result = formatResults(response, false, false, { deserializeDate: true, treatAsLocalDate: true });
      expect(result).toEqual({
        records: [
          [1, 'Category 1', null, new Date('2019-11-12 22:00:11'), new Date('2019-11-12 22:15:25'), null],
          [2, 'Category 2', 'Description of Category 2', new Date('2019-11-12 22:17:11'), new Date('2019-11-12 22:21:36'), null]
        ]
      });
    });

    test('update', async () => {
      const response = require('../../test/test-data/data-api-client/sample-update-response.json');
      const result = formatResults(response, false, false);
      expect(result).toEqual({
        numberOfRecordsUpdated: 1
      });
    });

    test('delete', async () => {
      const response = require('../../test/test-data/data-api-client/sample-delete-response.json');
      const result = formatResults(response, false, false);
      expect(result).toEqual({
        numberOfRecordsUpdated: 1
      });
    });

    test('insert', async () => {
      const response = require('../../test/test-data/data-api-client/sample-insert-response.json');
      const result = formatResults(response, false, false);
      expect(result).toEqual({
        insertId: 315,
        numberOfRecordsUpdated: 1
      });
    });

    test('batch update', async () => {
      const response = require('../../test/test-data/data-api-client/sample-batch-update-response.json');
      const result = formatResults(response, false, false);
      expect(result).toEqual({
        updateResults: [{}, {}]
      });
    });

    test('batch delete', async () => {
      const response = require('../../test/test-data/data-api-client/sample-batch-delete-response.json');
      const result = formatResults(response, false, false);
      expect(result).toEqual({
        updateResults: [{}, {}]
      });
    });

    test('batch insert', async () => {
      const response = require('../../test/test-data/data-api-client/sample-batch-insert-response.json');
      const result = formatResults(response, false, false);
      expect(result).toEqual({
        updateResults: [{ insertId: 316 }, { insertId: 317 }]
      });
    });
  });


});
