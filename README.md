# Knex AWS Data API - @qvalia/knex-aws-data-api

[![npm](https://img.shields.io/npm/v/@qvalia/knex-aws-data-api.svg)](https://www.npmjs.com/package/@qvalia/knex-aws-data-api)
[![npm](https://img.shields.io/npm/l/@qvalia/knex-aws-data-api.svg)](https://www.npmjs.com/package/@qvalia/knex-aws-data-api)

This module is a Nodejs [knex](https://github.com/knex/knex) library plugin that connects to Mysql or PostgreSQL over AWS Data-API. Uses most recent version of AWS SDK for Data-API and kept updated. Backed by [Qvalia](https://qvalia.com/) organisation.

## Why
Knex plugin that uses AWS Data API internally to execute SQL queries.
This plugin builds on top of the work of two excelent modules [knex-aurora-data-api-client](https://github.com/markusahlstrand/knex-data-api-client) and [data-api-client](https://www.npmjs.com/package/data-api-client).
The problem this module tries to fix is the maintainability of data-api with AWS SDK version updates. `data-api-client`module is no more kept updated with the AWS SDK. As a result, `knex-aurora-data-api-client` also will not be updated to most recent SDK versions. This plugin rectifies that and collect logic of both mentioned modules into one npm package. So that both are maintaned in one repository.

## Installation

Depends on knex npm mpdule. Please check `peerDependencies` of package.json to get the supported knex version.

```bash
npm install @qvalia/knex-aws-data-api
```
### Use

To use aurora in mysql mode:

```javascript
const knexDataApiClient = require('@qvalia/knex-aws-data-api');
const knex = require('knex')({
  client: knexDataApiClient.mysql,
  connection: {
    secretArn: 'secret-arn', // Required
    resourceArn: 'db-resource-arn', // Required
    database: 'db-name',
    region: 'eu-west-2',
  },
});
```

To use aurora in postgres mode:

```javascript
const knexDataApiClient = require('@qvalia/knex-aws-data-api');
const knex = require('knex')({
  client: knexDataApiClient.postgres,
  connection: {
    secretArn: 'secret-arn', // Required
    resourceArn: 'db-resource-arn', // Required
    database: 'db-name',
    region: 'eu-west-2',
  },
});
```

### Nested tables support

Note - this significantly increases the data required back from the RDS data api.

```javascript
knex().doSomething().options({ nestTables: true });
```

## Local Setup For Contributing

Structure of the module as follows
- `src` folder contains the source code that module contains
- `test` folder contains the integration tests that cover all the exposed functionality
- Unit tests should be beside each .js file

Set up before starting changes
- Make sure Docker is installed with nodejs
- Create a copy of `.env.template` and rename the copy to `.env`. Add your preferred configs. The template works in general.
- Run `docker-compose up` to bring up the database containers and data api container
- Do your changes, update integration tests and run `npm run test-integration` to test.

## Thank You!
- [knex-aurora-data-api-client](https://github.com/markusahlstrand/knex-data-api-client)
- [data-api-client](https://www.npmjs.com/package/data-api-client)
