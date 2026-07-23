import { describe, it, expect, beforeAll } from 'vitest';
import assert from 'node:assert/strict';
import { ConfigService } from '@nestjs/config';
import { RealLytAdapter, LytNotImplementedError } from './real-lyt.adapter';
import { LytAdapterHttpError } from './http-lyt.adapter.base';

it('RealLytAdapter calls production-style member endpoint', async () => {
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const url = String(input);
    const headers = init?.headers as Record<string, string>;
    assert.equal(url, 'https://api.lyt.local/members/member-009');
    assert.equal(headers['x-lyt-mode'], 'real');
    assert.equal(typeof headers['x-lyt-signature'], 'string');
    assert.equal(headers['x-lyt-retry-attempt'], '0');

    return new Response(
      JSON.stringify({ member_id: 'member-009', nick_name: 'Real Member', mobile: '13900000000', level_name: 'GOLD' }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  const adapter = new RealLytAdapter(new ConfigService());
  const member = await adapter.getMember('member-009');

  assert.equal(adapter.adapterMode, 'real');
  assert.equal(member.memberId, 'member-009');
  assert.equal(member.nickname, 'Real Member');
  assert.equal(member.mobile, '13900000000');
  assert.equal(member.levelName, 'GOLD');
});

it('RealLytAdapter calls production-style device endpoint', async () => {
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
    const url = String(input);
    assert.equal(url, 'https://api.lyt.local/devices/device-prod-1/status');
    return new Response(JSON.stringify({ device_id: 'device-prod-1', device_status: 'ONLINE' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  const adapter = new RealLytAdapter(new ConfigService());
  const status = await adapter.getDeviceStatus('device-prod-1');

  assert.equal(status.deviceId, 'device-prod-1');
  assert.equal(status.status, 'ONLINE');
});

it('RealLytAdapter maps non-retryable http errors into LytAdapterHttpError', async () => {
  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({ code: 'VALIDATION_FAILED', message: 'invalid coupon' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  const adapter = new RealLytAdapter(new ConfigService());
  await assert.rejects(
    () => adapter.applyDiscount('order-1', 'BAD'),
    (error: unknown) => {
      assert.ok(error instanceof LytAdapterHttpError);
      assert.equal(error.adapterMode, 'real');
      assert.equal(error.code, 'LYT_VALIDATION_ERROR');
      assert.equal(error.retryable, false);
      assert.equal(error.status, 422);
      return true;
    },
  );
});

it('RealLytAdapter maps repeated timeout failures into retryable timeout error', async () => {
  let attempts = 0;
  globalThis.fetch = (async () => {
    attempts += 1;
    const error = new Error('request timeout');
    error.name = 'TimeoutError';
    throw error;
  }) as typeof fetch;

  const adapter = new RealLytAdapter(new ConfigService());
  await assert.rejects(
    () => adapter.getDeviceStatus('device-timeout'),
    (error: unknown) => {
      assert.ok(error instanceof LytAdapterHttpError);
      assert.equal(error.code, 'LYT_TIMEOUT');
      assert.equal(error.retryable, true);
      return true;
    },
  );
  assert.equal(attempts, 2);
});

// ═══════════════════════════════════════════════
// WP-01A 新增测试：NotImplemented 阻塞方法
// ═══════════════════════════════════════════════

describe('RealLytAdapter — blocked methods (BLK-LYT-001)', () => {
  const adapter = new RealLytAdapter(new ConfigService());

  const blockedMethods: Array<[string, () => Promise<unknown>]> = [
    ['connect', () => adapter.connect('https://lyt.test', {})],
    ['disconnect', () => adapter.disconnect('session-1')],
    ['getConnectionStatus', () => adapter.getConnectionStatus()],
    ['query', () => adapter.query({ entityType: 'member' })],
    ['operate', () => adapter.operate({ operation: 'create', entityType: 'member' })],
    ['validate', () => adapter.validate('member', {})],
    ['getVenues', () => adapter.getVenues()],
    ['getDevices', () => adapter.getDevices()],
    ['getMemberInfo', () => adapter.getMemberInfo('mem-1')],
    ['getOrderInfo', () => adapter.getOrderInfo('ord-1')],
    ['sign', () => adapter.sign('GET', '/test')],
    ['verifySignature', () => adapter.verifySignature('sig', 'payload', 'ts')],
    ['decrypt', () => adapter.decrypt({ ciphertext: '', algorithm: 'aes' })],
    ['startPoll', () => adapter.startPoll('order-status', 'ord-1')],
    ['getPollStatus', () => adapter.getPollStatus('task-1')],
    ['cancelPoll', () => adapter.cancelPoll('task-1')],
    ['handleCallback', () => adapter.handleCallback({
      eventId: 'evt-1', eventType: 'test', source: 'lyt', payload: {}, occurredAt: new Date().toISOString(),
    })],
  ];

  for (const [methodName, call] of blockedMethods) {
    it(`${methodName} throws LytNotImplementedError with BLK-LYT-001`, async () => {
      try {
        await call();
        assert.fail(`Expected ${methodName} to throw`);
      } catch (error) {
        assert.ok(error instanceof LytNotImplementedError, `${methodName} should throw LytNotImplementedError`);
        assert.equal(error.blockerId, 'BLK-LYT-001');
        assert.ok(error.message.includes('blocked by missing LYT api spec'));
        assert.ok(error.message.includes(methodName));
      }
    });
  }
});

// ═══════════════════════════════════════════════
// WP-01A 新增测试：错误包装与降级配置
// ═══════════════════════════════════════════════

describe('RealLytAdapter — error wrapping & downgrade', () => {
  const adapter = new RealLytAdapter(new ConfigService());

  it('wrapError classifies LytAdapterHttpError by status', () => {
    const httpError = new LytAdapterHttpError({
      adapterName: 'RealLytAdapter',
      adapterMode: 'real',
      path: '/orders',
      code: 'LYT_HTTP_422',
      requestId: 'req-1',
      retryable: false,
      status: 422,
      message: 'validation failed',
    });
    const info = adapter.wrapError(httpError, { path: '/orders' });
    assert.equal(info.category, 'business');
    assert.equal(info.code, 'LYT_HTTP_422');
    assert.equal(info.retryable, false);
  });

  it('wrapError classifies LytAdapterHttpError 5xx as protocol', () => {
    const httpError = new LytAdapterHttpError({
      adapterName: 'RealLytAdapter',
      adapterMode: 'real',
      path: '/devices',
      code: 'LYT_HTTP_503',
      requestId: 'req-2',
      retryable: true,
      status: 503,
      message: 'service unavailable',
    });
    const info = adapter.wrapError(httpError, { path: '/devices' });
    assert.equal(info.category, 'protocol');
  });

  it('wrapError classifies TimeoutError as network', () => {
    const timeout = new Error('request timeout');
    timeout.name = 'TimeoutError';
    const info = adapter.wrapError(timeout, { path: '/test' });
    assert.equal(info.category, 'network');
    assert.equal(info.retryable, true);
  });

  it('wrapError classifies raw string as unknown', () => {
    const info = adapter.wrapError('connection lost', { path: '/test' });
    assert.equal(info.category, 'unknown');
  });

  it('getTimeoutDowngradeConfig returns real defaults', () => {
    const config = adapter.getTimeoutDowngradeConfig();
    assert.equal(config.connectTimeoutMs, 5000);
    assert.equal(config.readTimeoutMs, 10000);
    assert.equal(config.useCacheOnTimeout, true);
    assert.equal(config.downgradeLogLevel, 'warn');
  });

  it('isRetryable returns correct values', () => {
    const networkInfo = adapter.wrapError(new Error('timeout'), { path: '/test' });
    assert.equal(adapter.isRetryable(networkInfo), true);

    const bizInfo = adapter.wrapError(new LytAdapterHttpError({
      adapterName: 'RealLytAdapter',
      adapterMode: 'real',
      path: '/orders',
      code: 'LYT_VALIDATION_ERROR',
      requestId: 'req-3',
      retryable: false,
      status: 422,
      message: 'invalid',
    }));
    assert.equal(adapter.isRetryable(bizInfo), false);
  });
});
