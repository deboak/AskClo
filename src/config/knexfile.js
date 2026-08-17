const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const migrationsDirectory = path.resolve(__dirname, '../db/migrations');

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: migrationsDirectory
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: migrationsDirectory
    },
    pool: { min: 2, max: 10 }
  }
};
