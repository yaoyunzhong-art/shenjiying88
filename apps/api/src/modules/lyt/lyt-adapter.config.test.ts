import assert from 'node:assert/strict'
import test from 'node:test'
import { ConfigService } from '@nestjs/config'
import { resolveLytHttpAdapterConfig } from './lyt-adapter.config'

test('resolveLytHttpAdapterConfig returns sandbox defaults without config service', () => {
  assert.deepEqual(resolveLytHttpAdapterConfig('sandbox'), {
    baseUrl: 'https://sandbox.lyt.local',
    signingSecret: 'sandbox-lyt-secret',
    timeoutMs: 4000,
    maxRetries: 2
  })
})

test('resolveLytHttpAdapterConfig returns real defaults without config service', () => {
  assert.deepEqual(resolveLytHttpAdapterConfig('real'), {
    baseUrl: 'https://api.lyt.local',
    signingSecret: 'real-lyt-secret',
    timeoutMs: 5000,
    maxRetries: 1
  })
})

test('resolveLytHttpAdapterConfig uses nested ConfigService overrides', () => {
  const config = new ConfigService({
    lyt: {
      adapters: {
        real: {
          baseUrl: 'https://lyt-prod.example.com',
          signingSecret: 'prod-secret',
          timeoutMs: 9000,
          maxRetries: 4
        }
      }
    }
  })

  assert.deepEqual(resolveLytHttpAdapterConfig('real', config), {
    baseUrl: 'https://lyt-prod.example.com',
    signingSecret: 'prod-secret',
    timeoutMs: 9000,
    maxRetries: 4
  })
})

test('resolveLytHttpAdapterConfig falls back when overrides are blank or invalid', () => {
  const config = new ConfigService({
    lyt: {
      adapters: {
        sandbox: {
          baseUrl: '   ',
          signingSecret: '',
          timeoutMs: 'NaN',
          maxRetries: -1
        }
      }
    }
  })

  assert.deepEqual(resolveLytHttpAdapterConfig('sandbox', config), {
    baseUrl: 'https://sandbox.lyt.local',
    signingSecret: 'sandbox-lyt-secret',
    timeoutMs: 4000,
    maxRetries: 2
  })
})
