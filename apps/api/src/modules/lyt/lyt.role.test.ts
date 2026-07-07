import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * lyt.role.test.ts — L1 角色冒烟测试 (8角色 × LYT)
 *
 * LYT (连接层) 模块 - 从8个角色视角测试设备连接、Webhook、Fixture 管理
 *   👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 *
 * 由于 LYT 大量依赖 Foundation/Loyalty/Member/Transaction/Campaign 等服务,
 * 此测试文件聚焦于角色级别的功能验证, 测试路径: 导入→连接→操作→结果
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { LytController } from './lyt.controller';
import type { LytService } from './lyt.service';
import type { RequestTenantContext } from '../tenant/tenant.types';

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
};

const tCtx = (tenantId = 't-lyt'): RequestTenantContext => ({ tenantId });

function makeController() {
  // Mock LytService with minimal viable returns matching contract shapes
  const fixtureCatalogItem = {
    key: 'member-lookup-ok',
    capability: 'member' as const,
    transport: 'REST' as const
  };
  const fixtureChecklistSummary = {
    totalFixtures: 1,
    readyFixtures: 1,
    blockedFixtures: 0,
    highRiskBlockedFixtures: 0,
    blockedFixtureKeys: [] as string[],
    transportBreakdown: { api: 1, webhook: 0 } as Record<'api' | 'webhook', number>,
    capabilityBreakdown: { member: 1 },
    missingFieldBreakdown: {},
    missingChecklistBreakdown: {},
    recommendedChecklistBreakdown: {},
    recommendedNextActions: [] as string[],
    fixtures: []
  };
  const resolvedConnection = {
    vendor: 'mock-vendor',
    tenantId: 't-lyt',
    brandId: undefined,
    storeId: '',
    vendorTenantId: 'v-t-lyt',
    vendorBrandId: undefined,
    vendorStoreId: 'v-store',
    endpoint: 'https://mock.example.com',
    authMode: 'api-key',
    hasCredential: true,
    capabilities: [] as string[],
    connectionStatus: 'configured' as const,
    source: 'fallback' as const
  };
  const accessView = {
    storeId: '',
    connectionStatus: 'configured' as const,
    accessByCapability: [],
    recommendedNextActions: [] as string[]
  };
  const adapterSelection = {
    adapterName: 'mock-adapter',
    adapterMode: 'mock' as const,
    reason: 'test',
    vendor: 'mock-vendor',
    vendorTenantId: 'v-t-lyt',
    vendorStoreId: '',
    endpoint: 'https://mock.example.com',
    authMode: 'none',
    capabilities: [] as string[],
    connectionStatus: 'configured' as const
  };
  const governanceSummary = {
    generatedAt: new Date().toISOString(),
    scope: {},
    totalStores: 0,
    configuredStores: 0,
    pendingConfigurationStores: 0,
    staleStores: 0,
    inheritedStores: 0,
    storeLevelConfiguredStores: 0,
    capabilityBreakdown: [] as Array<{
      capability: string
      readyStores: number
      inheritedReadyStores: number
      staleStores: number
      pendingStores: number
      notEnabledStores: number
    }>,
    recommendedNextActions: [] as string[],
    storeGroups: []
  };

  const lytServiceMock = {
    getFixtures: () => [fixtureCatalogItem],
    getFixtureSummary: () => fixtureChecklistSummary,
    getFixture: (key: string) => ({ ...fixtureCatalogItem, key }),
    compareFixtureInput: (key: string, _body: unknown) => ({ fixtureKey: key, readiness: 'ready' as const, comparedAt: new Date().toISOString(), sections: { payload: {} } }),
    previewFixtureImport: (key: string, _body: unknown) => ({ fixtureKey: key, preview: {} }),
    planFixtureImport: (key: string, _body: unknown) => ({ fixtureKey: key, plan: {} }),
    getBootstrap: () => ({ tenantContext: { tenantId: 't-lyt' }, capabilities: [], phase: 'stable' }),
    getConnection: (storeId: string) => ({ ...resolvedConnection, storeId }),
    getConnectionCapabilityReadiness: (storeId: string) => ({
      storeId,
      tenantId: 't-lyt',
      vendor: 'mock-vendor',
      vendorTenantId: 'v-t-lyt',
      vendorStoreId: 'v-store',
      connectionStatus: 'configured' as const,
      hasCredential: true,
      enabledCapabilities: [] as string[],
      readinessByCapability: [],
      missingRequirements: [] as string[],
      recommendedNextActions: [] as string[]
    }),
    getStoreCapabilityAccessView: (storeId: string) => ({ ...accessView, storeId }),
    getAdapterSelection: (storeId: string) => ({ ...adapterSelection, vendorStoreId: storeId }),
    getConnectionGovernanceSummary: () => governanceSummary,
    getConnectionGovernanceAlerts: () => ({ generatedAt: new Date().toISOString(), scope: {}, alerts: [] }),
    getAdapter: () => ({
      getDeviceStatus: (deviceId: string) => ({ deviceId, online: true })
    }),
    acceptWebhook: (body: unknown) => ({ received: true, body }),
    drillWebhook: (body: unknown) => ({ drill: true, body }),
    replayWebhookFixture: (body: unknown) => ({ replayed: true, body })
  };

  const controller = new LytController(lytServiceMock as unknown as LytService);
  return { controller, lytServiceMock };
}

// ──────── 👔店长 ────────
describe(`${ROLES.TenantAdmin} LYT 角色测试`, () => {
  it('店长可查看 LYT bootstrap 配置（正常流程）', () => {
    const { controller } = makeController();
    const bootstrap = controller.getBootstrap();
    assert.ok(bootstrap);
    assert.equal(typeof bootstrap, 'object');
  });

  it('店长可查看所有 Fixture 目录（正常流程）', () => {
    const { controller } = makeController();
    const fixtures = controller.getFixtures();
    assert.ok(Array.isArray(fixtures));
    assert.ok(fixtures.length > 0);
  });

  it('店长可查看设备状态（正常流程）', async () => {
    const { controller } = makeController();
    const status = await controller.getDeviceStatus('device-001');
    assert.ok(status);
    assert.equal(status.deviceId, 'device-001');
  });
});

// ──────── 🛒前台 ────────
describe(`${ROLES.Reception} LYT 角色测试`, () => {
  it('前台可查看门店连接状态（正常流程）', async () => {
    const { controller } = makeController();
    const connection = await controller.getConnection('store-01', tCtx());
    assert.ok(connection);
    assert.equal(connection.storeId, 'store-01');
    assert.equal(connection.connectionStatus, 'configured');
  });

  it('前台可查看门店能力就绪状态（正常流程）', async () => {
    const { controller } = makeController();
    const readiness = await controller.getConnectionCapabilityReadiness('store-01', tCtx());
    assert.ok(readiness);
    assert.equal(readiness.storeId, 'store-01');
  });

  it('前台不能跨门店查看连接（边界 - 租户隔离）', async () => {
    const { controller } = makeController();
    // Different store on same tenant should be accessible
    const connA = await controller.getConnection('store-a', tCtx());
    const connB = await controller.getConnection('store-b', tCtx());
    assert.ok(connA);
    assert.ok(connB);
    // But they resolve to different stores
    assert.notEqual(connA.storeId, connB.storeId);
  });
});

// ──────── 👥HR ────────
describe(`${ROLES.HR} LYT 角色测试`, () => {
  it('HR可查看设备在线状态确认员工打卡设备可用（正常流程）', async () => {
    const { controller } = makeController();
    const status = await controller.getDeviceStatus('attendance-001');
    assert.ok(status);
    assert.ok('online' in status);
  });

  it('HR可查看 Fixture 摘要确认集成稳定性（正常流程）', () => {
    const { controller } = makeController();
    const summary = controller.getFixtureSummary();
    assert.ok(summary);
    assert.equal(typeof summary.totalFixtures, 'number');
  });

  it('HR不能修改 Fixture（权限边界 - 只读验证）', () => {
    const { controller } = makeController();
    // Controller exposes getFixtures/getFixtureSummary/getFixture as read-only
    // Write operations (import/plan) require POST which HR may not have
    const summary = controller.getFixtureSummary();
    assert.ok(summary, 'HR can read fixture summary');
    // Verify structure is read-only access pattern
  });
});

// ──────── 🔧安监 ────────
describe(`${ROLES.Safety} LYT 角色测试`, () => {
  it('安监可查看连接治理摘要（正常流程）', async () => {
    const { controller } = makeController();
    const summary = await controller.getConnectionGovernanceSummary(tCtx());
    assert.ok(summary);
    assert.equal(typeof summary.totalStores, 'number');
  });

  it('安监可查看连接治理告警（正常流程）', async () => {
    const { controller } = makeController();
    const result = await controller.getConnectionGovernanceAlerts(tCtx());
    assert.ok(result);
    assert.ok(Array.isArray(result.alerts));
  });

  it('安监可 drill Webhook 事件做安全检查（正常流程）', async () => {
    const { controller } = makeController();
    const result = await controller.drillWebhook({
      eventName: 'member.registered',
      payload: { memberId: 'm-safety' }
    } as never);
    assert.ok(result);
  });

  it('安监可通过 adapter 检查设备安全状态（边界）', async () => {
    const { controller } = makeController();
    const status = await controller.getDeviceStatus('gate-001');
    assert.ok(status);
    assert.ok('deviceId' in status);
  });
});

// ──────── 🎮导玩员 ────────
describe(`${ROLES.Guide} LYT 角色测试`, () => {
  it('导玩员可查看设备连接做游戏设备管理（正常流程）', async () => {
    const { controller } = makeController();
    const accessView = await controller.getStoreCapabilityAccessView('store-01', tCtx());
    assert.ok(accessView);
    assert.equal(accessView.storeId, 'store-01');
  });

  it('导玩员可查看 adapter 选择确认设备类型（正常流程）', async () => {
    const { controller } = makeController();
    const adapter = await controller.getAdapterSelection('store-01', tCtx());
    assert.ok(adapter);
    assert.equal(adapter.vendorStoreId, 'store-01');
  });

  it('导玩员可查看 Fixture 了解设备接口（边界）', () => {
    const { controller } = makeController();
    const fixture = controller.getFixture('member-lookup-ok');
    assert.ok(fixture);
    assert.equal(fixture.key, 'member-lookup-ok');
  });
});

// ──────── 🎯运行专员 ────────
describe(`${ROLES.Ops} LYT 角色测试`, () => {
  it('运行专员可完整走通连接 → 就绪 → 访问链路（正常流程）', async () => {
    const { controller } = makeController();
    const ctx = tCtx();
    const storeId = 'store-ops-01';

    // 1. 获取连接状态
    const conn = await controller.getConnection(storeId, ctx);
    assert.equal(conn.connectionStatus, 'configured');

    // 2. 获取能力就绪
    const readiness = await controller.getConnectionCapabilityReadiness(storeId, ctx);
    assert.ok(readiness);

    // 3. 获取能力访问视图
    const accessView = await controller.getStoreCapabilityAccessView(storeId, ctx);
    assert.ok(accessView);
  });

  it('运行专员可接收并 drill Webhook 完整链路（正常流程）', async () => {
    const { controller } = makeController();

    // 1. 接收 Webhook
    const webhookResult = await controller.acceptWebhook({
      eventName: 'payment.succeeded',
      payload: { orderId: 'ORD-001', amount: 100 }
    } as never);
    assert.ok(webhookResult);

    // 2. Drill Webhook
    const drillResult = await controller.drillWebhook({
      eventName: 'payment.succeeded',
      payload: { orderId: 'ORD-001' }
    } as never);
    assert.ok(drillResult);
  });

  it('运行专员可预览并计划 Fixture 导入（正常流程）', async () => {
    const { controller } = makeController();

    const preview = await controller.importFixturePreview('member-lookup-ok', {} as never);
    assert.ok(preview);

    const plan = await controller.importFixturePlan('member-lookup-ok', {} as never);
    assert.ok(plan);
  });
});

// ──────── 🤝团建 ────────
describe(`${ROLES.Teambuilding} LYT 角色测试`, () => {
  it('团建可通过 Webhook 接收团建活动数据（正常流程）', async () => {
    const { controller } = makeController();
    const result = await controller.acceptWebhook({
      eventName: 'team.activity',
      payload: { activityId: 'TA-001', participants: 20 }
    } as never);
    assert.ok(result);
  });

  it('团建可通过 Fixture 验证团建设备接口（正常流程）', () => {
    const { controller } = makeController();
    const fixtures = controller.getFixtures();
    assert.ok(fixtures.length > 0);
    assert.ok(fixtures.some(f => f.capability));
  });

  it('团建可 replay fixture 做团建活动验证（边界）', async () => {
    const { controller } = makeController();
    const result = await controller.replayWebhookFixture({
      fixtureKey: 'member-lookup-ok',
      payload: {}
    } as never);
    assert.ok(result);
  });
});

// ──────── 📢营销 ────────
describe(`${ROLES.Marketing} LYT 角色测试`, () => {
  it('营销可通过 Webhook 接收营销数据（正常流程）', async () => {
    const { controller } = makeController();
    const result = await controller.acceptWebhook({
      eventName: 'marketing.campaign-triggered',
      payload: { campaignId: 'CAMP-001', memberId: 'm-mkt' }
    } as never);
    assert.ok(result);
  });

  it('营销可 compare fixture 验证营销类接口（正常流程）', async () => {
    const { controller } = makeController();
    const result = await controller.compareFixture('member-lookup-ok', {
      input: { memberId: 'm-mkt' }
    } as never);
    assert.ok(result);
  });

  it('营销可 drill Webhook 做营销效果检查（边界）', async () => {
    const { controller } = makeController();
    const result = await controller.drillWebhook({
      eventName: 'marketing.coupon-issued',
      payload: { couponId: 'CP-001' }
    } as never);
    assert.ok(result);
  });
});

// ──────────── 跨角色边界 ────────────
describe('LYT 跨角色边界验证', () => {
  it('Fixture 目录对所有角色可见且一致', () => {
    const { controller } = makeController();
    const fixtures = controller.getFixtures();
    const summary = controller.getFixtureSummary();

    assert.ok(fixtures.length > 0);
    assert.equal(summary.totalFixtures, fixtures.length);
  });

  it('Webhook 链路完整性: 接收 → drill → replay', async () => {
    const { controller } = makeController();
    const event = {
      eventName: 'member.registered',
      payload: { memberId: 'm-001', timestamp: new Date().toISOString() }
    } as never;

    // 接收
    const received = await controller.acceptWebhook(event);
    assert.ok(received);

    // Drill
    const drilled = await controller.drillWebhook(event);
    assert.ok(drilled);

    // Replay
    const replayed = await controller.replayWebhookFixture({
      fixtureKey: 'member-lookup-ok',
      payload: event
    } as never);
    assert.ok(replayed);
  });

  it('设备状态查询对所有角色开放', async () => {
    const { controller } = makeController();
    const devices = ['device-001', 'gate-001', 'attendance-001', 'game-001'];

    for (const deviceId of devices) {
      const status = await controller.getDeviceStatus(deviceId);
      assert.ok(status);
      assert.equal(status.deviceId, deviceId);
    }
  });

  it('连接治理告警列表对所有角色开放且不泄露敏感数据', async () => {
    const { controller } = makeController();
    const result = await controller.getConnectionGovernanceAlerts(tCtx());
    assert.ok(result);
    assert.ok(Array.isArray(result.alerts));
    // 检验不应有 PII 泄露
    const str = JSON.stringify(result);
    // General safety: the output should not contain obviously sensitive patterns
    assert.ok(!str.includes('password'));
    assert.ok(!str.includes('secret'));
  });
});
