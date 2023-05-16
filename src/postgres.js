const PostgresClient = require('knex/lib/dialects/postgres');
const knexAdapter = require('./knex-adapter');
const constants = require('./constants');

// Call postgres client to setup knex, this set as this function
const client = PostgresClient.constructor
  ? class PostgresClientRDSDataAPI extends PostgresClient {}
  : function PostgresClientRDSDataAPI(config) {
      PostgresClientRDSDataAPI.call(this, config);
    };

knexAdapter(client, PostgresClient, constants.dialects.postgres);

module.exports = client;
