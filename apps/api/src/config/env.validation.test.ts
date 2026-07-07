import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { envValidation } from './env.validation'

describe('envValidation', () => {
  it('returns config when required env set is complete', () => {
    const config = {
      API_PORT: '3001',
      JWT_SECRET: 'super-secret-key',
      DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      LYT_MODE: 'mock',
      OTHER_KEY: 'value'
    }
    const result = envValidation(config)
    assert.deepEqual(result, config)
  })

  it('returns config when numeric env values are numbers', () => {
    const config = {
      API_PORT: 3001,
      JWT_SECRET: 'abc123',
      DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      LYT_MODE: 'mock'
    }
    const result = envValidation(config)
    assert.strictEqual(result, config)
  })

  it('throws when JWT_SECRET is missing', () => {
    assert.throws(
      () =>
        envValidation({
          API_PORT: '3001',
          DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
          REDIS_HOST: 'localhost',
          REDIS_PORT: '6379',
          LYT_MODE: 'mock'
        }),
      { message: 'Missing required env: JWT_SECRET' }
    )
  })

  it('throws when JWT_SECRET is empty string', () => {
    assert.throws(
      () =>
        envValidation({
          API_PORT: '3001',
          JWT_SECRET: '',
          DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
          REDIS_HOST: 'localhost',
          REDIS_PORT: '6379',
          LYT_MODE: 'mock'
        }),
      { message: 'Missing required env: JWT_SECRET' }
    )
  })

  it('throws when DATABASE_URL is undefined', () => {
    assert.throws(
      () =>
        envValidation({
          API_PORT: '3001',
          JWT_SECRET: 'abc123',
          DATABASE_URL: undefined,
          REDIS_HOST: 'localhost',
          REDIS_PORT: '6379',
          LYT_MODE: 'mock'
        }),
      { message: 'Missing required env: DATABASE_URL' }
    )
  })

  it('throws when DATABASE_URL is invalid', () => {
    assert.throws(
      () =>
        envValidation({
          API_PORT: '3001',
          JWT_SECRET: 'abc123',
          DATABASE_URL: 'not-a-url',
          REDIS_HOST: 'localhost',
          REDIS_PORT: '6379',
          LYT_MODE: 'mock'
        }),
      { message: 'Invalid DATABASE_URL' }
    )
  })

  it('throws when API_PORT is invalid', () => {
    assert.throws(
      () =>
        envValidation({
          API_PORT: 'not-a-number',
          JWT_SECRET: 'abc123',
          DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
          REDIS_HOST: 'localhost',
          REDIS_PORT: '6379',
          LYT_MODE: 'mock'
        }),
      { message: 'Invalid numeric env: API_PORT' }
    )
  })

  it('throws when REDIS_PORT is zero', () => {
    assert.throws(
      () =>
        envValidation({
          API_PORT: '3001',
          JWT_SECRET: 'abc123',
          DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
          REDIS_HOST: 'localhost',
          REDIS_PORT: '0',
          LYT_MODE: 'mock'
        }),
      { message: 'Invalid numeric env: REDIS_PORT' }
    )
  })

  it('throws when LYT_MODE is blank', () => {
    assert.throws(
      () =>
        envValidation({
          API_PORT: '3001',
          JWT_SECRET: 'abc123',
          DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
          REDIS_HOST: 'localhost',
          REDIS_PORT: '6379',
          LYT_MODE: '   '
        }),
      { message: 'Missing required env: LYT_MODE' }
    )
  })
})
