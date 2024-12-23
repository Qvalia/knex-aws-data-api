require('dotenv').config();
const knexDataApiClient = require('../../../index');

const config = {
  client: knexDataApiClient.postgres,
  connection: {
    secretArn: process.env.DB_SECRET_ARN,
    resourceArn: process.env.DB_RESOURCE_ARN,
    database: process.env.DB_NAME,
    region: process.env.DB_REGION
  }
};
if (process.env.ENDPOINT_URL) {
  config.connection.options = {
    endpoint: `${process.env.ENDPOINT_URL}:${process.env.DATA_API_PORT}`
  };
}
module.exports = config;
