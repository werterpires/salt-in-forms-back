/* eslint-disable @typescript-eslint/no-unsafe-return */

import type { Knex } from 'knex'
import * as dotenv from 'dotenv'
import { toSnakeCase } from './src/shared/utils'
import camelcaseKeys from 'camelcase-keys'
import * as fs from 'fs'
dotenv.config()

// Update with your config settings.

const certPath = process.env.SSL_CA_PATH!

const ssl = fs.existsSync(certPath)
  ? {
      ca: fs.readFileSync(certPath, 'utf8'),
      rejectUnauthorized: true
    }
  : false

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASS,
      database: process.env.SQL_DB,
      port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT) : 3306,
      ssl
    },
    wrapIdentifier: (value, origImpl) => origImpl(toSnakeCase(value)),
    postProcessResponse: (result) => {
      if (Array.isArray(result)) {
        return result.map((row) => camelcaseKeys(row, { deep: true }))
      }
      return camelcaseKeys(result, { deep: true })
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user: 'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user: 'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
}

module.exports = config
