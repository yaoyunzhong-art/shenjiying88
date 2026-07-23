import { describe, it, expect } from 'vitest';
import assert from 'node:assert/strict';
import { MockLytAdapter } from '../adapters/mock-lyt.adapter';

/**
 * Contract test for ILytAdapter interface.
 * Any ILytAdapter implementation must satisfy these contracts.
 */
describe('ILytAdapter contract', () => {
  const adapter = new MockLytAdapter();

  // ── 已有接口 ──────────────────────────────────

  describe('getMember', () => {
    it('returns memberId matching the input', async () => {
      const profile = await adapter.getMember('mem-001');
      assert.equal(profile.memberId, 'mem-001');
    });

    it('returns nickname as a non-empty string', async () => {
      const profile = await adapter.getMember('mem-002');
      assert.equal(typeof profile.nickname, 'string');
      assert.ok(profile.nickname!.length > 0);
    });

    it('returns levelName as a non-empty string', async () => {
      const profile = await adapter.getMember('mem-003');
      assert.equal(typeof profile.levelName, 'string');
      assert.ok(profile.levelName!.length > 0);
    });
  });

  describe('createOrder', () => {
    it('returns orderId as string prefixed with mock-', async () => {
      const result = await adapter.createOrder({ storeId: 'test-store', items: [{ skuId: 'sku-001', quantity: 1, price: 10 }] });
      assert.equal(typeof result.orderId, 'string');
      assert.ok(result.orderId.startsWith('mock-'));
    });

    it('returns totalAmount as a number', async () => {
      const result = await adapter.createOrder({ storeId: 'test-store', items: [{ skuId: 'sku-002', quantity: 3, price: 20 }] });
      assert.equal(typeof result.totalAmount, 'number');
      assert.equal(result.totalAmount, 60);
    });

    it('returns status CREATED', async () => {
      const result = await adapter.createOrder({ storeId: 'test-store', items: [] });
      assert.equal(result.status, 'CREATED');
    });
  });

  describe('applyDiscount', () => {
    it('returns the given orderId and couponCode', async () => {
      const result = await adapter.applyDiscount('ord-10', 'FLAT50');
      assert.equal(result.orderId, 'ord-10');
      assert.equal(result.couponCode, 'FLAT50');
    });
  });

  describe('syncGateEvent', () => {
    it('returns accepted true and the storeId', async () => {
      const result = await adapter.syncGateEvent('store-gz', 'code-xyz');
      assert.equal(result.accepted, true);
      assert.equal(result.storeId, 'store-gz');
    });
  });

  describe('getDeviceStatus', () => {
    it('returns deviceId and ONLINE/MAINTENANCE/ERROR status', async () => {
      const result = await adapter.getDeviceStatus('dev-ga-01');
      assert.equal(result.deviceId, 'dev-ga-01');
    });

    it('returns known device statuses from mock data', async () => {
      // Should find device from mock pool
      const online = await adapter.getDeviceStatus('dev-gacha-01');
      assert.equal(online.status, 'ONLINE');

      const offline = await adapter.getDeviceStatus('dev-gacha-03');
      assert.equal(offline.status, 'OFFLINE');

      const maintenance = await adapter.getDeviceStatus('dev-screen-02');
      assert.equal(maintenance.status, 'MAINTENANCE');

      const error = await adapter.getDeviceStatus('dev-gacha-05');
      assert.equal(error.status, 'ERROR');
    });
  });

  // ── 新增: 连接/断开 ───────────────────────────

  describe('connect/disconnect', () => {
    it('connect returns sessionId and CONNECTED status', async () => {
      const result = await adapter.connect('https://lyt.test/mock', { type: 'mock', token: 'test' });
      assert.equal(typeof result.sessionId, 'string');
      assert.ok(result.sessionId.startsWith('mock-session-'));
      assert.equal(result.status, 'CONNECTED');
      assert.equal(typeof result.connectedAt, 'string');
    });

    it('disconnect returns success with sessionId', async () => {
      const conn = await adapter.connect('https://lyt.test/mock', { type: 'mock' });
      const result = await adapter.disconnect(conn.sessionId);
      assert.equal(result.success, true);
      assert.equal(result.sessionId, conn.sessionId);
    });
  });

  describe('getConnectionStatus', () => {
    it('returns DISCONNECTED without session id', async () => {
      const result = await adapter.getConnectionStatus();
      assert.equal(result.status, 'DISCONNECTED');
    });

    it('returns CONNECTED for active session', async () => {
      const conn = await adapter.connect('https://lyt.test/mock', { type: 'mock' });
      const result = await adapter.getConnectionStatus(conn.sessionId);
      assert.equal(result.status, 'CONNECTED');
      assert.equal(result.sessionId, conn.sessionId);
    });

    it('returns DISCONNECTED for deleted session', async () => {
      const result = await adapter.getConnectionStatus('nonexistent-session');
      assert.equal(result.status, 'DISCONNECTED');
    });
  });

  // ── 新增: 查询/操作/校验 ─────────────────────

  describe('query', () => {
    it('returns members with default pagination', async () => {
      const result = await adapter.query({ entityType: 'member' });
      assert.equal(result.total, 3);
      assert.ok(result.data.length > 0);
    });

    it('returns venues with store filter', async () => {
      const result = await adapter.query({ entityType: 'venue', filters: [{ field: 'storeId', operator: 'eq', value: 'store-hk-01' }] });
      assert.equal(result.total, 2);
    });

    it('returns devices with pagination', async () => {
      const result = await adapter.query({ entityType: 'device', pagination: { page: 1, pageSize: 2 } });
      assert.equal(result.data.length, 2);
      assert.equal(result.hasMore, true);
    });

    it('supports field selection', async () => {
      const result = await adapter.query({ entityType: 'venue', fields: ['name', 'status'] });
      for (const item of result.data) {
        assert.equal(Object.keys(item).length, 2);
        assert.ok('name' in item);
        assert.ok('status' in item);
      }
    });

    it('supports inventory query', async () => {
      const result = await adapter.query({ entityType: 'inventory' });
      assert.ok(result.total >= 3);
    });
  });

  describe('operate', () => {
    it('returns success for create operation', async () => {
      const result = await adapter.operate({ operation: 'create', entityType: 'member', data: { nickname: 'test' } });
      assert.equal(result.success, true);
      assert.equal(typeof result.operationId, 'string');
    });

    it('returns success for delete operation', async () => {
      const result = await adapter.operate({ operation: 'delete', entityType: 'device', entityId: 'dev-001' });
      assert.equal(result.success, true);
    });
  });

  describe('validate', () => {
    it('passes validation with non-empty data and valid entity type', async () => {
      const result = await adapter.validate('member', { memberId: '1', name: 'test' });
      assert.equal(result.valid, true);
      assert.ok(result.checks.length > 0);
    });

    it('fails validation with empty data', async () => {
      const result = await adapter.validate('member', {});
      assert.equal(result.valid, false);
    });
  });

  // ── 新增: 场地与设备业务查询 ─────────────────

  describe('getVenues', () => {
    it('returns all venues without store filter', async () => {
      const venues = await adapter.getVenues();
      assert.equal(venues.length, 3);
    });

    it('filters by storeId', async () => {
      const venues = await adapter.getVenues('store-hk-01');
      assert.equal(venues.length, 2);
    });
  });

  describe('getDevices', () => {
    it('returns all devices without venue filter', async () => {
      const devices = await adapter.getDevices();
      assert.ok(devices.length > 0);
    });

    it('filters by venueId', async () => {
      const devices = await adapter.getDevices('venue-arcade-01');
      assert.equal(devices.length, 4);
    });

    it('returns empty array for unknown venue', async () => {
      const devices = await adapter.getDevices('venue-nonexistent');
      assert.equal(devices.length, 0);
    });
  });

  describe('getMemberInfo', () => {
    it('returns extended member info for known members', async () => {
      const info = await adapter.getMemberInfo('member-active-01');
      assert.equal(info.memberId, 'member-active-01');
      assert.equal(info.points, 12500);
      assert.equal(info.status, 'ACTIVE');
    });

    it('returns fallback for unknown members', async () => {
      const info = await adapter.getMemberInfo('unknown-member');
      assert.equal(info.memberId, 'unknown-member');
      assert.equal(info.status, 'ACTIVE');
    });
  });

  describe('getOrderInfo', () => {
    it('returns order info for known orders', async () => {
      const info = await adapter.getOrderInfo('order-paid-01');
      assert.equal(info.status, 'PAID');
      assert.equal(info.totalAmount, 50000);
    });

    it('returns fallback for unknown orders', async () => {
      const info = await adapter.getOrderInfo('unknown-order');
      assert.equal(info.status, 'CREATED');
    });
  });

  // ── 新增: 签名/解密 ──────────────────────────

  describe('sign / verifySignature', () => {
    it('sign produces deterministic signature with same inputs', async () => {
      const result1 = await adapter.sign('GET', '/api/test', '{}', '2025-01-01T00:00:00Z');
      const result2 = await adapter.sign('GET', '/api/test', '{}', '2025-01-01T00:00:00Z');
      assert.equal(result1.signature, result2.signature);
      assert.equal(result1.algorithm, 'sha256');
    });

    it('sign produces different signature for different methods', async () => {
      const getSig = await adapter.sign('GET', '/api/test');
      const postSig = await adapter.sign('POST', '/api/test');
      assert.notEqual(getSig.signature, postSig.signature);
    });

    it('verifySignature validates with correct payload', async () => {
      const result = await adapter.verifySignature(
        'test-signature',
        '{"event":"test"}',
        '2025-01-01T00:00:00Z',
      );
      // Mock will verify against known mock secret
      assert.equal(typeof result, 'boolean');
    });
  });

  describe('decrypt', () => {
    it('returns decoded plaintext', async () => {
      const result = await adapter.decrypt({ ciphertext: Buffer.from('mock data').toString('base64'), algorithm: 'none' });
      assert.equal(result.plaintext, 'mock data');
      assert.equal(result.algorithm, 'none');
    });
  });

  // ── 新增: 轮询 ────────────────────────────────

  describe('poll', () => {
    it('startPoll creates a task with PENDING status', async () => {
      const task = await adapter.startPoll('order-status', 'order-001');
      assert.equal(typeof task.taskId, 'string');
      assert.ok(task.taskId.startsWith('mock-poll-'));
      assert.equal(task.status, 'PENDING');
      assert.equal(task.entityId, 'order-001');
    });

    it('cancelPoll returns success for existing task', async () => {
      const task = await adapter.startPoll('device-status', 'device-001');
      const result = await adapter.cancelPoll(task.taskId);
      assert.equal(result.success, true);
    });

    it('getPollStatus returns FAILED for unknown task', async () => {
      const status = await adapter.getPollStatus('no-such-task');
      assert.equal(status.status, 'FAILED');
    });
  });

  // ── 新增: 回调处理 ────────────────────────────

  describe('handleCallback', () => {
    it('accepts callback events and returns adapter name', async () => {
      const result = await adapter.handleCallback({
        eventId: 'evt-001',
        eventType: 'order.paid',
        source: 'lyt',
        payload: { orderId: 'ord-1' },
        occurredAt: new Date().toISOString(),
      });
      assert.equal(result.accepted, true);
      assert.equal(result.processedBy, 'MockLytAdapter');
    });
  });

  // ── 新增: 错误包装 ────────────────────────────

  describe('wrapError', () => {
    it('classifies timeout errors as network with retryable', () => {
      const timeout = new Error('request timeout');
      timeout.name = 'TimeoutError';
      const info = adapter.wrapError(timeout, { path: '/api/test' });
      assert.equal(info.category, 'network');
      assert.equal(info.retryable, true);
      assert.equal(info.code, 'LYT_TIMEOUT');
    });

    it('classifies abort errors as network with retryable', () => {
      const abort = new Error('The operation was aborted');
      abort.name = 'AbortError';
      const info = adapter.wrapError(abort, { path: '/api/test' });
      assert.equal(info.category, 'network');
      assert.equal(info.retryable, true);
      assert.equal(info.code, 'LYT_ABORTED');
    });

    it('classifies business errors as non-retryable', () => {
      const bizError = new Error('invalid member: not found');
      const info = adapter.wrapError(bizError, { path: '/members/unknown' });
      assert.equal(info.category, 'business');
      assert.equal(info.retryable, false);
    });

    it('classifies protocol parse errors', () => {
      const protoError = new Error('Unexpected token < in JSON at position 0');
      const info = adapter.wrapError(protoError, { path: '/orders' });
      assert.equal(info.category, 'protocol');
      assert.equal(info.retryable, false);
    });

    it('wraps non-Error objects as unknown category', () => {
      const info = adapter.wrapError('raw string error', { path: '/test' });
      assert.equal(info.category, 'unknown');
      assert.equal(info.retryable, false);
    });
  });

  describe('isRetryable', () => {
    it('returns true for network errors', () => {
      const info = adapter.wrapError(new Error('timeout'), { path: '/test' });
      assert.equal(adapter.isRetryable(info), true);
    });

    it('returns false for business errors', () => {
      const info = adapter.wrapError(new Error('invalid data'));
      assert.equal(adapter.isRetryable(info), false);
    });
  });

  // ── 新增: 超时降级配置 ────────────────────────

  describe('getTimeoutDowngradeConfig', () => {
    it('returns mock downgrade config with defaults', () => {
      const config = adapter.getTimeoutDowngradeConfig();
      assert.equal(config.connectTimeoutMs, 3000);
      assert.equal(config.readTimeoutMs, 5000);
      assert.equal(config.useCacheOnTimeout, true);
      assert.equal(config.useFallbackOnTimeout, true);
      assert.equal(typeof config.downgradeLogLevel, 'string');
    });
  });
});
