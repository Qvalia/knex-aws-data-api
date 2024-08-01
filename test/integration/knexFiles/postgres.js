require('dotenv').config();

const knexDataApiClient = require('../../../index');

module.exports = {
  client: knexDataApiClient.postgres,
  connection: {
    secretArn: process.env.DB_SECRET_ARN,
    resourceArn: process.env.DB_RESOURCE_ARN,
    database: process.env.DB_NAME,
    region: process.env.DB_REGION,
    options: {
      endpoint: `http:/0.0.0.0:${  process.env.DATA_API_PORT}`
    }
  }
};
