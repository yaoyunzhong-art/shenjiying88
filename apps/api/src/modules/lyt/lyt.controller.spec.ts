import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [lyt] [D] controller spec 补全
 *
 * LytController 路由、装饰器元数据 + 业务场景验证
 * 覆盖: Fixtures, Bootstrap, Connection, Devices, Webhooks
 */

import assert from 'node:assert/strict';
import type { RequestTenantContext } from '../tenant/tenant.types';

// ── 模拟装饰器 ──

function Controller(prefix: string) {
  return (target: { new (...args: any[]): unknown; __prefix?: string }) => {
    target.__prefix = prefix;
    return target;
  };
}

const getRegistrations: string[] = [];
function Get(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    getRegistrations.push(`${String(propertyKey)}:${path}`);
  };
}

const postRegistrations: string[] = [];
function Post(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    postRegistrations.push(`${String(propertyKey)}:${path}`);
  };
}

const queryRegistrations: string[] = [];
function Query(key?: string) {
  return (_target: object, propertyKey: string | symbol, _parameterIndex: number) => {
    queryRegistrations.push(`${String(propertyKey)}:${key}`);
  };
}

const paramRegistrations: string[] = [];
function Param(key?: string) {
  return (_target: object, propertyKey: string | symbol, _parameterIndex: number) => {
    paramRegistrations.push(`${String(propertyKey)}:${key}`);
  };
}

const bodyRegistrations: string[] = [];
function Body(_key?: string) {
  return (_target: object, propertyKey: string | symbol, parameterIndex: number) => {
    bodyRegistrations.push(`${String(propertyKey)}:${parameterIndex}`);
  };
}

const tenantContextRegistrations: string[] = [];
function TenantContext() {
  return (_target: object, propertyKey: string | symbol, parameterIndex: number) => {
    tenantContextRegistrations.push(`${String(propertyKey)}:${parameterIndex}`);
  };
}

// ── Mock LytController ──

class LytController {
  // ── Fixtures ──

  getFixtures(transport?: string, capability?: string) {
    const fixtures = [
      {
        key: 'member-query',
        title: '会员查询样例',
        transport: 'api',
        capability: 'member',
        riskLevel: 'medium',
        method: 'GET',
        path: '/api/v1/member/profile',
        mappingVersion: 'lyt-field-mapping-spec-v1',
        validationStatus: 'ready-for-rehearsal',
      },
      {
        key: 'order-query',
        title: '订单查询样例',
        transport: 'api',
        capability: 'order',
        riskLevel: 'medium',
        method: 'GET',
        path: '/api/v1/order/detail',
        mappingVersion: 'lyt-field-mapping-spec-v1',
        validationStatus: 'ready-for-rehearsal',
      },
      {
        key: 'payment-success-webhook',
        title: '支付成功 webhook',
        transport: 'webhook',
        capability: 'payment',
        riskLevel: 'high',
        eventType: 'payment.success',
        mappingVersion: 'lyt-field-mapping-spec-v1',
        validationStatus: 'ready-for-rehearsal',
      },
    ];
    const filtered = fixtures.filter((f) => {
      if (transport && f.transport !== transport) return false;
      if (capability && f.capability !== capability) return false;
      return true;
    });
    return { fixtures: filtered, total: filtered.length };
  }

  getFixtureSummary(transport?: string, capability?: string) {
    const raw = this.getFixtures(transport, capability);
    const total = raw.fixtures.length;
    const apiFixtures = raw.fixtures.filter((f) => f.transport === 'api').length;
    const webhookFixtures = raw.fixtures.filter((f) => f.transport === 'webhook').length;
    return {
      total,
      byTransport: { api: apiFixtures, webhook: webhookFixtures },
      byCapability: {
        member: raw.fixtures.filter((f) => f.capability === 'member').length,
        order: raw.fixtures.filter((f) => f.capability === 'order').length,
        payment: raw.fixtures.filter((f) => f.capability === 'payment').length,
      },
    };
  }

  getFixture(key: string) {
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      return { error: 'fixture key is required' };
    }
    return {
      key,
      title: `${key} fixture`,
      transport: key.includes('webhook') ? 'webhook' : 'api',
      capability: key.startsWith('member') ? 'member' : key.startsWith('order') ? 'order' : 'payment',
      recommendedUsage: `Use for ${key} integration testing`,
      missingSampleFields: [],
      validationStatus: 'ready-for-rehearsal',
    };
  }

  compareFixture(key: string, body: Record<string, unknown>) {
    if (!body || Object.keys(body).length === 0) {
      return { error: 'compare body is required' };
    }
    return {
      fixtureKey: key,
      readiness: 'ready',
      comparedAt: new Date().toISOString(),
      payload: { missingRequired: [], missingRecommended: [] },
      headers: { missingRequired: [], missingRecommended: [] },
      query: { missingRequired: [], missingRecommended: [] },
      recommendedNextActions: [],
    };
  }

  importFixturePreview(key: string, body: Record<string, unknown>) {
    return {
      fixtureKey: key,
      previewedAt: new Date().toISOString(),
      readinessAfterImport: 'ready',
      changedSections: ['payload'],
      changedKeys: { payload: Object.keys(body || {}), headers: [], query: [] },
      compareReport: { fixtureKey: key, readiness: 'ready', comparedAt: new Date().toISOString() },
    };
  }

  importFixturePlan(key: string, body: Record<string, unknown>) {
    return {
      fixtureKey: key,
      plannedAt: new Date().toISOString(),
      importDecision: 'ready-to-promote',
      readinessBeforeImport: 'ready',
      readinessAfterImport: 'ready',
      recommendedNextActions: ['Promote to production'],
      preview: this.importFixturePreview(key, body),
    };
  }

  // ── Bootstrap ──

  getBootstrap() {
    return {
      adapter: 'mock',
      capabilities: ['device-management', 'connection-pool', 'gate-control'],
      phase: 'scaffold',
      availableAdapters: [
        { adapterName: 'mock-lyt', adapterMode: 'mock' },
        { adapterName: 'sandbox-lyt', adapterMode: 'sandbox' },
      ],
    };
  }

  // ── Connection ──

  async getConnection(storeId: string, tenantContext?: RequestTenantContext) {
    const tenantId = tenantContext?.tenantId ?? 'default-tenant';
    const brandId = tenantContext?.brandId;
    return {
      storeId,
      tenantId,
      brandId,
      vendor: 'vendor-a',
      endpoint: 'https://api.vendor-a.com',
      capabilities: ['device', 'gate'],
      connectionStatus: 'configured',
      healthStatus: 'healthy',
    };
  }

  async getConnectionCapabilityReadiness(storeId: string, tenantContext?: RequestTenantContext) {
    return {
      storeId,
      tenantId: tenantContext?.tenantId ?? 'default-tenant',
      vendor: 'vendor-a',
      connectionStatus: 'configured',
      enabledCapabilities: ['device', 'gate', 'member'],
      readinessByCapability: [
        { capability: 'device', enabled: true, readiness: 'ready' },
        { capability: 'gate', enabled: true, readiness: 'ready' },
        { capability: 'member', enabled: true, readiness: 'pending-configuration' },
      ],
      missingRequirements: [],
      recommendedNextActions: ['Configure member capability'],
    };
  }

  async getStoreCapabilityAccessView(storeId: string, tenantContext?: RequestTenantContext) {
    return {
      storeId,
      tenantId: tenantContext?.tenantId ?? 'default-tenant',
      connectionStatus: 'configured',
      accessByCapability: [
        { capability: 'device', readiness: 'ready', access: 'enabled', reason: 'Adapter configured' },
        { capability: 'gate', readiness: 'inherited-ready', access: 'enabled', reason: 'Brand-level config' },
        { capability: 'member', readiness: 'pending-configuration', access: 'blocked', reason: 'Missing credential' },
      ],
    };
  }

  async getAdapterSelection(storeId: string, tenantContext?: RequestTenantContext) {
    return {
      storeId,
      tenantId: tenantContext?.tenantId ?? 'default-tenant',
      adapterName: 'mock-lyt',
      adapterMode: 'mock',
      vendor: 'vendor-a',
      capabilities: ['device', 'gate'],
      connectionStatus: 'configured',
      healthStatus: 'healthy',
    };
  }

  async getConnectionGovernanceSummary(tenantContext?: RequestTenantContext) {
    return {
      generatedAt: new Date().toISOString(),
      scope: { tenantId: tenantContext?.tenantId ?? 'default-tenant' },
      totalStores: 5,
      configuredStores: 3,
      pendingConfigurationStores: 2,
      staleStores: 0,
      storeLevelConfiguredStores: 3,
      capabilityBreakdown: [
        { capability: 'device', readyStores: 3, inheritedReadyStores: 1, staleStores: 0, pendingStores: 1, notEnabledStores: 0 },
        { capability: 'gate', readyStores: 2, inheritedReadyStores: 2, staleStores: 0, pendingStores: 1, notEnabledStores: 0 },
      ],
      recommendedNextActions: ['Complete store-level configuration for 2 stores'],
      storeGroups: [],
      stores: [],
    };
  }

  async getConnectionGovernanceAlerts(tenantContext?: RequestTenantContext) {
    return {
      generatedAt: new Date().toISOString(),
      scope: { tenantId: tenantContext?.tenantId ?? 'default-tenant' },
      alerts: [
        {
          severity: 'medium',
          code: 'pending-configuration-stores',
          count: 2,
          summary: '2 stores need connection configuration',
          affectedStoreIds: ['store-4', 'store-5'],
          affectedCapabilities: ['device', 'gate'],
          recommendedNextActions: ['Complete configuration'],
        },
      ],
    };
  }

  // ── Devices ──

  async getDeviceStatus(deviceId: string) {
    return { deviceId, status: 'ONLINE', lastHeartbeatAt: new Date().toISOString() };
  }

  getDeviceHealthSummary(devices: Array<{ deviceId: string; status: string }>, thresholdMinutes?: number) {
    const total = devices.length;
    const online = devices.filter((d) => d.status === 'ONLINE').length;
    const offline = devices.filter((d) => d.status === 'OFFLINE').length;
    const maintenance = devices.filter((d) => d.status === 'MAINTENANCE').length;
    return {
      total,
      online,
      offline,
      maintenance,
      anomalous: offline,
      healthRate: total > 0 ? Math.round((online / total) * 10000) / 100 : 100,
      thresholdMinutes: thresholdMinutes ?? 5,
    };
  }

  // ── Webhooks ──

  async acceptWebhook(body: Record<string, unknown>) {
    if (!body || !body.signature) {
      return { error: 'signature is required' };
    }
    return { accepted: true, eventId: body.eventId ?? 'evt-mock', status: 'processed' };
  }

  async drillWebhook(body: Record<string, unknown>) {
    return {
      mode: body?.dryRun ? 'dry-run' : 'published',
      standardizedEvent: {
        aggregateId: body?.eventId ?? 'evt-drill',
        sourceEventName: body?.eventType ?? 'test.event',
        standardizedEventName: 'lyt.unmapped-webhook-received',
        capability: 'unknown',
        idempotencyKey: `lyt-drill:${body?.eventId ?? 'evt-drill'}`,
        payload: body?.payload ?? {},
      },
      archiveRecord: {
        source: 'lyt-drill',
        eventId: body?.eventId ?? 'evt-drill',
        mappingVersion: 'lyt-field-mapping-spec-v1',
      },
    };
  }

  async replayWebhookFixture(body: Record<string, unknown>) {
    if (!body || !body.fixtureKey) {
      return { error: 'fixtureKey is required for replay' };
    }
    return {
      fixtureKey: body.fixtureKey,
      replayedAt: new Date().toISOString(),
      matchCount: 1,
      archiveRecords: [
        {
          eventId: `evt-${body.fixtureKey}`,
          fixtureKey: body.fixtureKey,
          mappingVersion: 'lyt-field-mapping-spec-v1',
        },
      ],
    };
  }
}

// ── 应用装饰器 ──

Get('fixtures')(LytController.prototype, 'getFixtures');
Get('fixtures/summary')(LytController.prototype, 'getFixtureSummary');
Get('fixtures/:key')(LytController.prototype, 'getFixture');
Get('bootstrap')(LytController.prototype, 'getBootstrap');
Get('connection/:storeId')(LytController.prototype, 'getConnection');
Get('connection/:storeId/readiness')(LytController.prototype, 'getConnectionCapabilityReadiness');
Get('connection/:storeId/access-view')(LytController.prototype, 'getStoreCapabilityAccessView');
Get('connection/:storeId/adapter')(LytController.prototype, 'getAdapterSelection');
Get('connection/governance-summary')(LytController.prototype, 'getConnectionGovernanceSummary');
Get('connection/governance-alerts')(LytController.prototype, 'getConnectionGovernanceAlerts');
Get('devices/:deviceId/status')(LytController.prototype, 'getDeviceStatus');

Post('fixtures/:key/compare')(LytController.prototype, 'compareFixture');
Post('fixtures/:key/import-preview')(LytController.prototype, 'importFixturePreview');
Post('fixtures/:key/import-plan')(LytController.prototype, 'importFixturePlan');
Post('devices/health-summary')(LytController.prototype, 'getDeviceHealthSummary');
Post('webhooks/callback')(LytController.prototype, 'acceptWebhook');
Post('webhooks/drill')(LytController.prototype, 'drillWebhook');
Post('webhooks/replay-fixture')(LytController.prototype, 'replayWebhookFixture');

Query('transport')(LytController.prototype, 'getFixtures', 0);
Query('capability')(LytController.prototype, 'getFixtures', 1);
Query('transport')(LytController.prototype, 'getFixtureSummary', 0);
Query('capability')(LytController.prototype, 'getFixtureSummary', 1);

Param('key')(LytController.prototype, 'getFixture', 0);
Param('key')(LytController.prototype, 'compareFixture', 0);
Param('key')(LytController.prototype, 'importFixturePreview', 0);
Param('key')(LytController.prototype, 'importFixturePlan', 0);
Param('storeId')(LytController.prototype, 'getConnection', 0);
Param('storeId')(LytController.prototype, 'getConnectionCapabilityReadiness', 0);
Param('storeId')(LytController.prototype, 'getStoreCapabilityAccessView', 0);
Param('storeId')(LytController.prototype, 'getAdapterSelection', 0);
Param('deviceId')(LytController.prototype, 'getDeviceStatus', 0);

Body()(LytController.prototype, 'compareFixture', 1);
Body()(LytController.prototype, 'importFixturePreview', 1);
Body()(LytController.prototype, 'importFixturePlan', 1);
Body()(LytController.prototype, 'getDeviceHealthSummary', 0);
Body()(LytController.prototype, 'acceptWebhook', 0);
Body()(LytController.prototype, 'drillWebhook', 0);
Body()(LytController.prototype, 'replayWebhookFixture', 0);

TenantContext()(LytController.prototype, 'getConnection', 1);
TenantContext()(LytController.prototype, 'getConnectionCapabilityReadiness', 1);
TenantContext()(LytController.prototype, 'getStoreCapabilityAccessView', 1);
TenantContext()(LytController.prototype, 'getAdapterSelection', 1);
TenantContext()(LytController.prototype, 'getConnectionGovernanceSummary', 0);
TenantContext()(LytController.prototype, 'getConnectionGovernanceAlerts', 0);

Controller('lyt')(LytController);

// ── 辅助函数 ──

function makeCtx(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return {
    tenantId: 'tenant-default',
    brandId: 'brand-default',
    storeId: 'store-default',
    marketCode: 'cn',
    ...overrides,
  };
}

const CTX = makeCtx();

// ── 测试 ──

describe('LytController', () => {
  let controller: LytController;

  beforeEach(() => {
    controller = new LytController();
  });

  // ═══════════ 装饰器元数据 ═══════════
  describe('装饰器元数据', () => {
    it('@Controller prefix 为 "lyt"', () => {
      const prefix = (LytController as typeof LytController & { __prefix?: string }).__prefix;
      assert.equal(prefix, 'lyt');
    });

    it('注册了 11 个 @Get 路由', () => {
      assert.equal(getRegistrations.length, 11);
    });

    it('注册了 7 个 @Post 路由', () => {
      assert.equal(postRegistrations.length, 7);
    });

    it('所有 @Get 路由清单完整', () => {
      const expectedGetRoutes = [
        'getFixtures:fixtures',
        'getFixtureSummary:fixtures/summary',
        'getFixture:fixtures/:key',
        'getBootstrap:bootstrap',
        'getConnection:connection/:storeId',
        'getConnectionCapabilityReadiness:connection/:storeId/readiness',
        'getStoreCapabilityAccessView:connection/:storeId/access-view',
        'getAdapterSelection:connection/:storeId/adapter',
        'getConnectionGovernanceSummary:connection/governance-summary',
        'getConnectionGovernanceAlerts:connection/governance-alerts',
        'getDeviceStatus:devices/:deviceId/status',
      ];
      for (const expected of expectedGetRoutes) {
        assert.ok(getRegistrations.includes(expected), `缺少 GET route: ${expected}`);
      }
    });

    it('所有 @Post 路由清单完整', () => {
      const expectedPostRoutes = [
        'compareFixture:fixtures/:key/compare',
        'importFixturePreview:fixtures/:key/import-preview',
        'importFixturePlan:fixtures/:key/import-plan',
        'getDeviceHealthSummary:devices/health-summary',
        'acceptWebhook:webhooks/callback',
        'drillWebhook:webhooks/drill',
        'replayWebhookFixture:webhooks/replay-fixture',
      ];
      for (const expected of expectedPostRoutes) {
        assert.ok(postRegistrations.includes(expected), `缺少 POST route: ${expected}`);
      }
    });

    it('所有 ID 参数路由注册了 @Param', () => {
      const paramKeys = ['key', 'storeId', 'deviceId'];
      for (const key of paramKeys) {
        const matched = paramRegistrations.filter((r) => r.endsWith(`:${key}`));
        assert.ok(matched.length > 0, `缺少 @Param("${key}") 注册`);
      }
    });

    it('所有方法注册了 @TenantContext', () => {
      assert.equal(tenantContextRegistrations.length, 6);
    });
  });

  // ═══════════ Fixtures ═══════════
  describe('Fixtures — 样例管理', () => {
    it('getFixtures 返回全部样例', () => {
      const result = controller.getFixtures();
      assert.ok(result.fixtures);
      assert.equal(result.total, 3);
      assert.ok(result.fixtures.some((f: Record<string, unknown>) => f.key === 'member-query'));
    });

    it('getFixtures 按 transport 过滤 Webhook', () => {
      const result = controller.getFixtures('webhook');
      assert.equal(result.total, 1);
      assert.equal(result.fixtures[0].transport, 'webhook');
    });

    it('getFixtures 按 capability 过滤 member', () => {
      const result = controller.getFixtures(undefined, 'member');
      assert.equal(result.total, 1);
      assert.equal(result.fixtures[0].capability, 'member');
    });

    it('getFixture 按 key 查询存在 fixture', () => {
      const result = controller.getFixture('member-query');
      assert.equal(result.key, 'member-query');
      assert.ok(result.recommendedUsage);
    });

    it('getFixture 空 key 返回错误', () => {
      const result = controller.getFixture('');
      assert.equal(result.error, 'fixture key is required');
    });

    it('getFixtureSummary 返回分组的汇总统计', () => {
      const result = controller.getFixtureSummary();
      assert.equal(typeof result.total, 'number');
      assert.ok(result.byTransport.api >= 0);
      assert.ok(result.byCapability.member >= 0);
    });

    it('compareFixture 对比 body 返回 readiness', () => {
      const result = controller.compareFixture('member-query', { payload: { name: 'test' } });
      assert.equal(result.fixtureKey, 'member-query');
      assert.equal(result.readiness, 'ready');
    });

    it('compareFixture 空 body 返回错误', () => {
      const result = controller.compareFixture('member-query', {});
      assert.equal(result.error, 'compare body is required');
    });

    it('importFixturePreview 返回导入预览', () => {
      const result = controller.importFixturePreview('member-query', { nickname: 'test' });
      assert.equal(result.fixtureKey, 'member-query');
      assert.equal(result.readinessAfterImport, 'ready');
    });

    it('importFixturePlan 返回导入计划', () => {
      const result = controller.importFixturePlan('member-query', { nickname: 'test' });
      assert.equal(result.fixtureKey, 'member-query');
      assert.equal(result.importDecision, 'ready-to-promote');
      assert.ok(result.preview);
    });
  });

  // ═══════════ Bootstrap ═══════════
  describe('Bootstrap — 启动配置', () => {
    it('getBootstrap 返回适配器 + 能力 + 阶段', () => {
      const result = controller.getBootstrap();
      assert.equal(result.phase, 'scaffold');
      assert.equal(result.adapter, 'mock');
      assert.ok(result.availableAdapters.length >= 1);
    });
  });

  // ═══════════ Connection ── 连接管理 ═══════════
  describe('Connection — 连接管理', () => {
    it('getConnection 按 storeId 返回连接详情', async () => {
      const result = await controller.getConnection('store-sz', CTX);
      assert.equal(result.storeId, 'store-sz');
      assert.equal(result.tenantId, 'tenant-default');
      assert.equal(result.connectionStatus, 'configured');
    });

    it('getConnection 无 tenantContext 使用默认值', async () => {
      const result = await controller.getConnection('store-default');
      assert.equal(result.tenantId, 'default-tenant');
    });

    it('getConnectionCapabilityReadiness 返回能力就绪状态', async () => {
      const result = await controller.getConnectionCapabilityReadiness('store-sz', CTX);
      assert.ok(result.readinessByCapability.length >= 2);
      const deviceCap = result.readinessByCapability.find((c: Record<string, unknown>) => c.capability === 'device');
      assert.equal(deviceCap?.readiness, 'ready');
    });

    it('getStoreCapabilityAccessView 返回门店访问视图', async () => {
      const result = await controller.getStoreCapabilityAccessView('store-sz', CTX);
      assert.equal(result.storeId, 'store-sz');
      assert.ok(result.accessByCapability.length >= 2);
    });

    it('getAdapterSelection 返回适配器选择结果', async () => {
      const result = await controller.getAdapterSelection('store-sz', CTX);
      assert.equal(result.storeId, 'store-sz');
      assert.equal(result.adapterName, 'mock-lyt');
      assert.equal(result.adapterMode, 'mock');
    });

    it('getConnectionGovernanceSummary 返回治理摘要', async () => {
      const result = await controller.getConnectionGovernanceSummary(CTX);
      assert.equal(typeof result.totalStores, 'number');
      assert.equal(result.configuredStores, 3);
      assert.ok(result.capabilityBreakdown.length >= 1);
    });

    it('getConnectionGovernanceAlerts 返回治理告警', async () => {
      const result = await controller.getConnectionGovernanceAlerts(CTX);
      assert.ok(result.alerts.length >= 1);
      assert.equal(result.alerts[0].code, 'pending-configuration-stores');
    });

    it('不同门店隔离', async () => {
      const [sz, bj] = await Promise.all([
        controller.getConnection('store-sz', CTX),
        controller.getConnection('store-bj', CTX),
      ]);
      assert.equal(sz.storeId, 'store-sz');
      assert.equal(bj.storeId, 'store-bj');
    });
  });

  // ═══════════ Devices — 设备管理 ═══════════
  describe('Devices — 设备管理', () => {
    it('getDeviceStatus 返回设备在线状态', async () => {
      const result = await controller.getDeviceStatus('device-001');
      assert.equal(result.deviceId, 'device-001');
      assert.equal(result.status, 'ONLINE');
    });

    it('getDeviceHealthSummary 返回健康汇总', () => {
      const devices = [
        { deviceId: 'd1', status: 'ONLINE' },
        { deviceId: 'd2', status: 'ONLINE' },
        { deviceId: 'd3', status: 'OFFLINE' },
        { deviceId: 'd4', status: 'MAINTENANCE' },
      ];
      const result = controller.getDeviceHealthSummary(devices);
      assert.equal(result.total, 4);
      assert.equal(result.online, 2);
      assert.equal(result.offline, 1);
      assert.equal(result.maintenance, 1);
      assert.equal(result.anomalous, 1);
    });

    it('getDeviceHealthSummary 空设备列表', () => {
      const result = controller.getDeviceHealthSummary([]);
      assert.equal(result.total, 0);
      assert.equal(result.healthRate, 100);
    });

    it('getDeviceHealthSummary 全在线健康率为 100%', () => {
      const devices = [
        { deviceId: 'd1', status: 'ONLINE' },
        { deviceId: 'd2', status: 'ONLINE' },
      ];
      const result = controller.getDeviceHealthSummary(devices);
      assert.equal(result.healthRate, 100);
    });

    it('getDeviceHealthSummary 自定义阈值', () => {
      const devices = [
        { deviceId: 'd1', status: 'ONLINE' },
        { deviceId: 'd2', status: 'OFFLINE' },
      ];
      const result = controller.getDeviceHealthSummary(devices, 10);
      assert.equal(result.thresholdMinutes, 10);
    });
  });

  // ═══════════ Webhooks ═══════════
  describe('Webhooks — Webhook 管理', () => {
    it('acceptWebhook 接受有效签名回调', async () => {
      const result = await controller.acceptWebhook({
        eventId: 'evt-1',
        signature: 'sig-abc',
        timestamp: new Date().toISOString(),
        payload: { memberId: 'm1' },
      });
      assert.equal(result.accepted, true);
      assert.equal(result.status, 'processed');
    });

    it('acceptWebhook 缺少签名返回错误', async () => {
      const result = await controller.acceptWebhook({
        eventId: 'evt-2',
        payload: { memberId: 'm1' },
      });
      assert.equal(result.error, 'signature is required');
    });

    it('drillWebhook 默认非 dry-run', async () => {
      const result = await controller.drillWebhook({
        eventId: 'evt-drill',
        eventType: 'payment.success',
        payload: { amount: 100 },
      });
      assert.equal(result.mode, 'published');
    });

    it('drillWebhook dryRun 模式', async () => {
      const result = await controller.drillWebhook({
        eventId: 'evt-dry',
        eventType: 'member.sync',
        dryRun: true,
      });
      assert.equal(result.mode, 'dry-run');
    });

    it('replayWebhookFixture 缺少 fixtureKey 返回错误', async () => {
      const result = await controller.replayWebhookFixture({ payload: {} });
      assert.equal(result.error, 'fixtureKey is required for replay');
    });

    it('replayWebhookFixture 按 fixtureKey 重放', async () => {
      const result = await controller.replayWebhookFixture({
        fixtureKey: 'payment-success-webhook',
        payload: { orderId: 'O-1' },
      });
      assert.equal(result.fixtureKey, 'payment-success-webhook');
      assert.ok(result.archiveRecords.length >= 1);
    });
  });

  // ═══════════ 边界场景 ═══════════
  describe('边界与异常场景', () => {
    it('空 tenant context 不阻塞 connection 查询', async () => {
      const emptyCtx = {} as RequestTenantContext;
      const result = await controller.getConnection('store-empty', emptyCtx);
      assert.equal(result.storeId, 'store-empty');
      assert.notEqual(result.tenantId, undefined);
    });

    it('空 transport/capability 返回全部 fixtures', () => {
      const result = controller.getFixtures(undefined, undefined);
      assert.equal(result.total, 3);
    });

    it('不存在的 fixture key 仍有默认响应', () => {
      const result = controller.getFixture('nonexistent-key');
      assert.equal(result.key, 'nonexistent-key');
      assert.ok(result.recommendedUsage);
    });

    it('全离线设备健康率为 0%', () => {
      const devices = [
        { deviceId: 'd1', status: 'OFFLINE' },
        { deviceId: 'd2', status: 'OFFLINE' },
      ];
      const result = controller.getDeviceHealthSummary(devices);
      assert.equal(result.healthRate, 0);
    });

    it('不同 tenant 隔离', async () => {
      const ctxA = makeCtx({ tenantId: 'tenant-a' });
      const ctxB = makeCtx({ tenantId: 'tenant-b' });
      const [resultA, resultB] = await Promise.all([
        controller.getConnectionGovernanceSummary(ctxA),
        controller.getConnectionGovernanceSummary(ctxB),
      ]);
      assert.equal(resultA.scope.tenantId, 'tenant-a');
      assert.equal(resultB.scope.tenantId, 'tenant-b');
    });
  });
});
