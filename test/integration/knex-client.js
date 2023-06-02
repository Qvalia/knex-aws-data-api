const postgres = require('knex')(require('./knexFiles/postgres'));
const mysql = require('knex')(require('./knexFiles/mysql'));

module.exports = {
  postgres,
  mysql
};
