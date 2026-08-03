import { describe, it, expect } from 'vitest';
import assert from 'node:assert/strict';
import { ConfigService } from '@nestjs/config';
import { resolveLytHttpAdapterConfig, resolveLytFullConfig } from './lyt-adapter.config';

it('resolveLytHttpAdapterConfig returns sandbox defaults without config service', () => {
  assert.deepEqual(resolveLytHttpAdapterConfig('sandbox'), {
    baseUrl: 'https://sandbox.lyt.local',
    signingSecret: 'sandbox-lyt-secret',
    timeoutMs: 4000,
    maxRetries: 2,
  });
});

it('resolveLytHttpAdapterConfig returns real defaults without config service', () => {
  assert.deepEqual(resolveLytHttpAdapterConfig('real'), {
    baseUrl: 'https://api.lyt.local',
    signingSecret: 'real-lyt-secret',
    timeoutMs: 5000,
    maxRetries: 1,
  });
});

it('resolveLytHttpAdapterConfig uses nested ConfigService overrides', () => {
  const config = new ConfigService({
    lyt: {
      adapters: {
        real: {
          baseUrl: 'https://lyt-prod.example.com',
          signingSecret: 'prod-secret',
          timeoutMs: 9000,
          maxRetries: 4,
        },
      },
    },
  });

  assert.deepEqual(resolveLytHttpAdapterConfig('real', config), {
    baseUrl: 'https://lyt-prod.example.com',
    signingSecret: 'prod-secret',
    timeoutMs: 9000,
    maxRetries: 4,
  });
});

it('resolveLytHttpAdapterConfig falls back when overrides are blank or invalid', () => {
  const config = new ConfigService({
    lyt: {
      adapters: {
        sandbox: {
          baseUrl: '   ',
          signingSecret: '',
          timeoutMs: 'NaN',
          maxRetries: -1,
        },
      },
    },
  });

  assert.deepEqual(resolveLytHttpAdapterConfig('sandbox', config), {
    baseUrl: 'https://sandbox.lyt.local',
    signingSecret: 'sandbox-lyt-secret',
    timeoutMs: 4000,
    maxRetries: 2,
  });
});

// ═══════════════════════════════════════════════
// WP-01A 新增测试：完整配置模型
// ═══════════════════════════════════════════════

describe('resolveLytFullConfig', () => {
  it('returns sandbox full defaults without config service', () => {
    const config = resolveLytFullConfig('sandbox');
    assert.equal(config.endpoints.baseUrl, 'https://sandbox.lyt.local');
    assert.equal(config.timeouts.connectTimeoutMs, 4000);
    assert.equal(config.retry.maxRetries, 2);
    assert.equal(config.retry.exponentialBackoff, true);
    assert.equal(config.cert.skipTlsVerify, true);
    assert.equal(config.signing.algorithm, 'sha256');
    assert.equal(config.signing.ttlSeconds, 300);
    assert.equal(config.cache.enabled, true);
    assert.equal(config.cache.maxEntries, 500);
  });

  it('returns real full defaults without config service', () => {
    const config = resolveLytFullConfig('real');
    assert.equal(config.endpoints.baseUrl, 'https://api.lyt.local');
    assert.equal(config.timeouts.connectTimeoutMs, 5000);
    assert.equal(config.retry.maxRetries, 1);
    assert.equal(config.cert.skipTlsVerify, false);
    assert.equal(config.signing.secret, 'real-lyt-secret');
    assert.equal(config.cache.ttlMs, 30000);
    assert.equal(config.cache.maxEntries, 1000);
  });

  it('overrides specific fields from ConfigService', () => {
    const config = new ConfigService({
      lyt: {
        real: {
          endpoints: { baseUrl: 'https://prod.lyt.example.com' },
          timeouts: { connectTimeoutMs: 8000 },
          retry: { maxRetries: 3 },
          signing: { algorithm: 'hmac-sha256' },
          cache: { enabled: false },
        },
      },
    });

    const result = resolveLytFullConfig('real', config);
    assert.equal(result.endpoints.baseUrl, 'https://prod.lyt.example.com');
    assert.equal(result.timeouts.connectTimeoutMs, 8000);
    assert.equal(result.retry.maxRetries, 3);
    assert.equal(result.signing.algorithm, 'hmac-sha256');
    assert.equal(result.cache.enabled, false);
    // Unchanged defaults
    assert.equal(result.cache.ttlMs, 30000);
    assert.equal(result.signing.secret, 'real-lyt-secret');
  });

  it('handles boolean overrides correctly', () => {
    const config = new ConfigService({
      lyt: {
        sandbox: {
          cert: { skipTlsVerify: false },
          retry: { exponentialBackoff: false },
          cache: { enabled: false },
        },
      },
    });

    const result = resolveLytFullConfig('sandbox', config);
    assert.equal(result.cert.skipTlsVerify, false);
    assert.equal(result.retry.exponentialBackoff, false);
    assert.equal(result.cache.enabled, false);
  });
});
