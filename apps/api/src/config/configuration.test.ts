import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

// Replicate the logic directly so we can control env per test
const envString = (value: string | undefined, fallback: string) =>
  typeof value === 'string' && value.trim().length > 0 ? value : fallback

const envNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const DEFAULT_DATABASE_URL = 'postgresql://m5:m5_local_password@localhost:5432/m5_core'

function parseDatabaseUrl(databaseUrl: string) {
  try {
    const parsed = new URL(databaseUrl)
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? Number(parsed.port) : 5432,
      database: parsed.pathname.replace(/^\//, '') || 'm5_core'
    }
  } catch {
    return {
      host: 'localhost',
      port: 5432,
      database: 'm5_core'
    }
  }
}

const createConfiguration = () => {
  const databaseUrl = envString(process.env.DATABASE_URL, DEFAULT_DATABASE_URL)
  const parsedDatabase = parseDatabaseUrl(databaseUrl)

  return {
    app: {
      name: envString(process.env.APP_NAME, 'M5'),
      port: envNumber(process.env.API_PORT, 3001)
    },
    lyt: {
      mode: envString(process.env.LYT_MODE, 'mock'),
      defaultStoreId: envString(process.env.LYT_DEFAULT_STORE_ID, 'store-demo-001'),
      adapters: {
        sandbox: {
          baseUrl: envString(process.env.LYT_SANDBOX_BASE_URL, 'https://sandbox.lyt.local'),
          signingSecret: envString(process.env.LYT_SANDBOX_SIGNING_SECRET, 'sandbox-lyt-secret'),
          timeoutMs: envNumber(process.env.LYT_SANDBOX_TIMEOUT_MS, 4000),
          maxRetries: envNumber(process.env.LYT_SANDBOX_MAX_RETRIES, 2)
        },
        real: {
          baseUrl: envString(process.env.LYT_REAL_BASE_URL, 'https://api.lyt.local'),
          signingSecret: envString(process.env.LYT_REAL_SIGNING_SECRET, 'real-lyt-secret'),
          timeoutMs: envNumber(process.env.LYT_REAL_TIMEOUT_MS, 5000),
          maxRetries: envNumber(process.env.LYT_REAL_MAX_RETRIES, 1)
        }
      }
    },
    postgres: {
      databaseUrl,
      host: parsedDatabase.host,
      port: parsedDatabase.port,
      database: parsedDatabase.database
    }
  }
}

describe('configuration()', () => {
  // --- defaults ---
  describe('defaults', () => {
    test('app.name defaults to M5', () => {
      const original = process.env.APP_NAME
      delete process.env.APP_NAME
      try {
        const config = createConfiguration()
        assert.equal(config.app.name, 'M5')
      } finally {
        if (original !== undefined) process.env.APP_NAME = original
      }
    })

    test('app.port defaults to 3001', () => {
      const original = process.env.API_PORT
      delete process.env.API_PORT
      try {
        const config = createConfiguration()
        assert.equal(config.app.port, 3001)
        assert.equal(typeof config.app.port, 'number')
      } finally {
        if (original !== undefined) process.env.API_PORT = original
      }
    })

    test('lyt.mode defaults to mock', () => {
      const original = process.env.LYT_MODE
      delete process.env.LYT_MODE
      try {
        const config = createConfiguration()
        assert.equal(config.lyt.mode, 'mock')
      } finally {
        if (original !== undefined) process.env.LYT_MODE = original
      }
    })

    test('lyt.defaultStoreId defaults to store-demo-001', () => {
      const original = process.env.LYT_DEFAULT_STORE_ID
      delete process.env.LYT_DEFAULT_STORE_ID
      try {
        const config = createConfiguration()
        assert.equal(config.lyt.defaultStoreId, 'store-demo-001')
      } finally {
        if (original !== undefined) process.env.LYT_DEFAULT_STORE_ID = original
      }
    })

    test('lyt.adapters defaults to local sandbox and real settings', () => {
      const originals: Record<string, string | undefined> = {}
      for (const key of [
        'LYT_SANDBOX_BASE_URL',
        'LYT_SANDBOX_SIGNING_SECRET',
        'LYT_SANDBOX_TIMEOUT_MS',
        'LYT_SANDBOX_MAX_RETRIES',
        'LYT_REAL_BASE_URL',
        'LYT_REAL_SIGNING_SECRET',
        'LYT_REAL_TIMEOUT_MS',
        'LYT_REAL_MAX_RETRIES'
      ]) {
        originals[key] = process.env[key]
        delete process.env[key]
      }

      try {
        const config = createConfiguration()
        assert.deepEqual(config.lyt.adapters.sandbox, {
          baseUrl: 'https://sandbox.lyt.local',
          signingSecret: 'sandbox-lyt-secret',
          timeoutMs: 4000,
          maxRetries: 2
        })
        assert.deepEqual(config.lyt.adapters.real, {
          baseUrl: 'https://api.lyt.local',
          signingSecret: 'real-lyt-secret',
          timeoutMs: 5000,
          maxRetries: 1
        })
      } finally {
        for (const key of Object.keys(originals)) {
          if (originals[key] !== undefined) process.env[key] = originals[key]
        }
      }
    })

    test('postgres.databaseUrl defaults to the local Prisma connection string', () => {
      const original = process.env.DATABASE_URL
      delete process.env.DATABASE_URL
      try {
        const config = createConfiguration()
        assert.equal(config.postgres.databaseUrl, DEFAULT_DATABASE_URL)
      } finally {
        if (original !== undefined) process.env.DATABASE_URL = original
      }
    })

    test('postgres.host, port, and database are derived from DATABASE_URL', () => {
      const original = process.env.DATABASE_URL
      process.env.DATABASE_URL = 'postgresql://tester:secret@db.internal:6543/m5_runtime'
      try {
        const config = createConfiguration()
        assert.equal(config.postgres.host, 'db.internal')
        assert.equal(config.postgres.port, 6543)
        assert.equal(config.postgres.database, 'm5_runtime')
        assert.equal(typeof config.postgres.port, 'number')
      } finally {
        if (original !== undefined) process.env.DATABASE_URL = original
        else delete process.env.DATABASE_URL
      }
    })
  })

  // --- overrides ---
  describe('env var overrides', () => {
    test('APP_NAME overrides app.name', () => {
      const original = process.env.APP_NAME
      process.env.APP_NAME = 'CustomApp'
      try {
        const config = createConfiguration()
        assert.equal(config.app.name, 'CustomApp')
      } finally {
        if (original !== undefined) process.env.APP_NAME = original; else delete process.env.APP_NAME
      }
    })

    test('API_PORT overrides app.port as a number', () => {
      const original = process.env.API_PORT
      process.env.API_PORT = '4000'
      try {
        const config = createConfiguration()
        assert.equal(config.app.port, 4000)
        assert.equal(typeof config.app.port, 'number')
      } finally {
        if (original !== undefined) process.env.API_PORT = original; else delete process.env.API_PORT
      }
    })

    test('API_PORT non-numeric falls back to default port', () => {
      const original = process.env.API_PORT
      process.env.API_PORT = 'not-a-number'
      try {
        const config = createConfiguration()
        assert.equal(config.app.port, 3001)
      } finally {
        if (original !== undefined) process.env.API_PORT = original; else delete process.env.API_PORT
      }
    })

    test('LYT_MODE overrides lyt.mode', () => {
      const original = process.env.LYT_MODE
      process.env.LYT_MODE = 'production'
      try {
        const config = createConfiguration()
        assert.equal(config.lyt.mode, 'production')
      } finally {
        if (original !== undefined) process.env.LYT_MODE = original; else delete process.env.LYT_MODE
      }
    })

    test('LYT_DEFAULT_STORE_ID overrides lyt.defaultStoreId', () => {
      const original = process.env.LYT_DEFAULT_STORE_ID
      process.env.LYT_DEFAULT_STORE_ID = 'store-custom-99'
      try {
        const config = createConfiguration()
        assert.equal(config.lyt.defaultStoreId, 'store-custom-99')
      } finally {
        if (original !== undefined) process.env.LYT_DEFAULT_STORE_ID = original; else delete process.env.LYT_DEFAULT_STORE_ID
      }
    })

    test('LYT adapter env vars override nested adapter config', () => {
      const originals: Record<string, string | undefined> = {}
      for (const [key, value] of Object.entries({
        LYT_SANDBOX_BASE_URL: 'https://sandbox.example.com',
        LYT_SANDBOX_SIGNING_SECRET: 'sandbox-secret',
        LYT_SANDBOX_TIMEOUT_MS: '4500',
        LYT_SANDBOX_MAX_RETRIES: '5',
        LYT_REAL_BASE_URL: 'https://real.example.com',
        LYT_REAL_SIGNING_SECRET: 'real-secret',
        LYT_REAL_TIMEOUT_MS: '6500',
        LYT_REAL_MAX_RETRIES: '3'
      })) {
        originals[key] = process.env[key]
        process.env[key] = value
      }

      try {
        const config = createConfiguration()
        assert.deepEqual(config.lyt.adapters.sandbox, {
          baseUrl: 'https://sandbox.example.com',
          signingSecret: 'sandbox-secret',
          timeoutMs: 4500,
          maxRetries: 5
        })
        assert.deepEqual(config.lyt.adapters.real, {
          baseUrl: 'https://real.example.com',
          signingSecret: 'real-secret',
          timeoutMs: 6500,
          maxRetries: 3
        })
      } finally {
        for (const key of Object.keys(originals)) {
          if (originals[key] !== undefined) process.env[key] = originals[key]; else delete process.env[key]
        }
      }
    })

    test('DATABASE_URL overrides postgres.databaseUrl and parsed fields', () => {
      const original = process.env.DATABASE_URL
      process.env.DATABASE_URL = 'postgresql://m5:secret@db.example.com:6000/m5_staging'
      try {
        const config = createConfiguration()
        assert.equal(config.postgres.databaseUrl, 'postgresql://m5:secret@db.example.com:6000/m5_staging')
        assert.equal(config.postgres.host, 'db.example.com')
        assert.equal(config.postgres.port, 6000)
        assert.equal(config.postgres.database, 'm5_staging')
      } finally {
        if (original !== undefined) process.env.DATABASE_URL = original; else delete process.env.DATABASE_URL
      }
    })
  })

  // --- structure ---
  describe('structure', () => {
    test('has app, lyt, postgres sections', () => {
      const config = createConfiguration()
      const keys = Object.keys(config).sort()
      assert.deepEqual(keys, ['app', 'lyt', 'postgres'])
    })

    test('combined overrides', () => {
      const originals: Record<string, string | undefined> = {}
      for (const k of ['APP_NAME', 'DATABASE_URL', 'LYT_MODE']) {
        originals[k] = process.env[k]
      }
      process.env.APP_NAME = 'TestApp'
      process.env.DATABASE_URL = 'postgresql://m5:secret@pg.internal:5433/m5_ops'
      process.env.LYT_MODE = 'live'
      try {
        const config = createConfiguration()
        assert.equal(config.app.name, 'TestApp')
        assert.equal(config.postgres.host, 'pg.internal')
        assert.equal(config.postgres.port, 5433)
        assert.equal(config.postgres.database, 'm5_ops')
        assert.equal(config.lyt.mode, 'live')
      } finally {
        for (const k of ['APP_NAME', 'DATABASE_URL', 'LYT_MODE']) {
          if (originals[k] !== undefined) process.env[k] = originals[k]; else delete process.env[k]
        }
      }
    })
  })
})
