import { describe, it, expect } from 'vitest';
import assert from 'node:assert/strict';
import { MockLytAdapter } from './mock-lyt.adapter';

describe('MockLytAdapter', () => {
  // ── 基础接口 ──────────────────────────────────

  it('getMember returns member profile with input memberId', async () => {
    const adapter = new MockLytAdapter();
    const profile = await adapter.getMember('member-001');
    assert.equal(profile.memberId, 'member-001');
    assert.equal(profile.nickname, 'Mock Member');
    assert.equal(profile.levelName, 'SVIP Seed');
  });

  it('getMember returns known mock member data', async () => {
    const adapter = new MockLytAdapter();
    const profile = await adapter.getMember('member-active-01');
    assert.equal(profile.memberId, 'member-active-01');
    assert.equal(profile.nickname, '小明');
    assert.equal(profile.levelName, '黄金会员');
  });

  it('createOrder computes totalAmount from items', async () => {
    const adapter = new MockLytAdapter();
    const payload = { items: [{ quantity: 2, price: 100 }, { quantity: 1, price: 200 }] };
    const result = await adapter.createOrder(payload as any);
    assert.equal(result.totalAmount, 400);
    assert.equal(result.status, 'CREATED');
    assert.ok(result.orderId.startsWith('mock-'));
  });

  it('createOrder handles empty items as zero total', async () => {
    const adapter = new MockLytAdapter();
    const result = await adapter.createOrder({ items: [] } as any);
    assert.equal(result.totalAmount, 0);
  });

  it('applyDiscount returns orderId and couponCode', async () => {
    const adapter = new MockLytAdapter();
    const result = await adapter.applyDiscount('order-1', 'SAVE10');
    assert.equal(result.orderId, 'order-1');
    assert.equal(result.couponCode, 'SAVE10');
  });

  it('syncGateEvent returns accepted true with storeId', async () => {
    const adapter = new MockLytAdapter();
    const result = await adapter.syncGateEvent('store-sh', 'pass-123');
    assert.equal(result.accepted, true);
    assert.equal(result.storeId, 'store-sh');
  });

  it('getDeviceStatus returns mock device statuses', async () => {
    const adapter = new MockLytAdapter();
    const online = await adapter.getDeviceStatus('dev-gacha-01');
    assert.equal(online.status, 'ONLINE');

    const offline = await adapter.getDeviceStatus('dev-gacha-03');
    assert.equal(offline.status, 'OFFLINE');

    const errorDev = await adapter.getDeviceStatus('dev-gacha-05');
    assert.equal(errorDev.status, 'ERROR');
  });

  // ── 连接管理 ──────────────────────────────────

  it('connect creates a session', async () => {
    const adapter = new MockLytAdapter();
    const result = await adapter.connect('https://lyt.test', { type: 'mock' });
    assert.ok(result.sessionId.startsWith('mock-session-'));
    assert.equal(result.status, 'CONNECTED');
  });

  it('disconnect removes session', async () => {
    const adapter = new MockLytAdapter();
    const conn = await adapter.connect('https://lyt.test', { type: 'mock' });
    const dis = await adapter.disconnect(conn.sessionId);
    assert.equal(dis.success, true);
    const status = await adapter.getConnectionStatus(conn.sessionId);
    assert.equal(status.status, 'DISCONNECTED');
  });

  // ── 字段/设备业务 ─────────────────────────────

  it('getVenues returns all venues', async () => {
    const adapter = new MockLytAdapter();
    const venues = await adapter.getVenues();
    assert.equal(venues.length, 3);
  });

  it('getVenues filters by store', async () => {
    const adapter = new MockLytAdapter();
    const venues = await adapter.getVenues('store-sz-01');
    assert.equal(venues.length, 1);
    assert.equal(venues[0].name, '旗舰馆-综合区');
  });

  it('getDevices returns mock device details', async () => {
    const adapter = new MockLytAdapter();
    const devices = await adapter.getDevices('venue-arcade-01');
    assert.ok(devices.length > 2);
    const gacha = devices.find((d) => d.deviceType === 'prize-machine');
    assert.ok(gacha);
    assert.equal(gacha!.todayRevenueCents, 35000);
  });

  it('getMemberInfo returns points and status', async () => {
    const adapter = new MockLytAdapter();
    const info = await adapter.getMemberInfo('member-active-02');
    assert.equal(info.levelCode, 'SVIP');
    assert.equal(info.points, 52000);
    assert.equal(info.totalSpentCents, 5000000);
  });

  // ── 查询 ──────────────────────────────────────

  it('query supports entity type filtering', async () => {
    const adapter = new MockLytAdapter();
    const members = await adapter.query({ entityType: 'member' });
    assert.equal(members.total, 3);
    const devices = await adapter.query({ entityType: 'device' });
    assert.ok(devices.total > 0);
  });

  it('query supports field selection', async () => {
    const adapter = new MockLytAdapter();
    const result = await adapter.query({ entityType: 'venue', fields: ['name'] });
    for (const item of result.data) {
      assert.equal(Object.keys(item).length, 1);
      assert.ok('name' in item);
    }
  });

  it('query supports pagination', async () => {
    const adapter = new MockLytAdapter();
    const page1 = await adapter.query({ entityType: 'member', pagination: { page: 1, pageSize: 2 } });
    assert.equal(page1.data.length, 2);
    assert.equal(page1.hasMore, true);
  });

  // ── 操作 ──────────────────────────────────────

  it('operate returns success', async () => {
    const adapter = new MockLytAdapter();
    const result = await adapter.operate({ operation: 'sync', entityType: 'order', entityId: 'ord-001' });
    assert.equal(result.success, true);
    assert.equal(typeof result.operationId, 'string');
  });

  // ── 校验 ──────────────────────────────────────

  it('validate checks required fields', async () => {
    const adapter = new MockLytAdapter();
    const pass = await adapter.validate('member', { memberId: '1' });
    assert.equal(pass.valid, true);
    const fail = await adapter.validate('member', {});
    assert.equal(fail.valid, false);
  });

  // ── 签名 ──────────────────────────────────────

  it('sign produces valid signature structure', async () => {
    const adapter = new MockLytAdapter();
    const result = await adapter.sign('POST', '/api/order', '{"id":"1"}', '2025-01-01T00:00:00Z');
    assert.equal(typeof result.signature, 'string');
    assert.equal(result.signature.length, 64);
    assert.equal(result.algorithm, 'sha256');
    assert.equal(typeof result.nonce, 'string');
  });

  // ── 轮询 ──────────────────────────────────────

  it('startPoll creates task with correct type', async () => {
    const adapter = new MockLytAdapter();
    const task = await adapter.startPoll('sync-progress', 'batch-001', { items: 100 });
    assert.equal(task.taskType, 'sync-progress');
    assert.equal(task.entityId, 'batch-001');
    assert.equal(task.status, 'PENDING');
  });

  // ── 回调 ──────────────────────────────────────

  it('handleCallback accepts webhook events', async () => {
    const adapter = new MockLytAdapter();
    const result = await adapter.handleCallback({
      eventId: 'evt-01',
      eventType: 'member.updated',
      source: 'lyt',
      payload: { memberId: 'm1', level: 'GOLD' },
      occurredAt: new Date().toISOString(),
    });
    assert.equal(result.accepted, true);
    assert.equal(result.processedBy, 'MockLytAdapter');
  });

  // ── 错误包装 ─────────────────────────────────

  it('wrapError classifies different error types', () => {
    const adapter = new MockLytAdapter();
    const netErr = adapter.wrapError(new Error('timeout'));
    assert.equal(netErr.category, 'network');

    const bizErr = adapter.wrapError(new Error('invalid value'));
    assert.equal(bizErr.category, 'business');

    const protoErr = adapter.wrapError(new Error('Unexpected token < in JSON'));
    assert.equal(protoErr.category, 'protocol');
  });

  // ── 降级配置 ─────────────────────────────────

  it('getTimeoutDowngradeConfig returns mock values', () => {
    const adapter = new MockLytAdapter();
    const cfg = adapter.getTimeoutDowngradeConfig();
    assert.equal(cfg.useCacheOnTimeout, true);
    assert.equal(cfg.connectTimeoutMs, 3000);
  });
});
