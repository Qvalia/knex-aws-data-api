const knex = require('knex');
const postgres = require('./src/postgres');
const mysql = require('./src/mysql');

module.exports = {
  postgres,
  mysql,
  knex
};
