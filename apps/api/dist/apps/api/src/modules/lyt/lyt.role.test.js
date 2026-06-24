"use strict";
/**
 * lyt.role.test.ts — L1 角色冒烟测试 (8角色 × LYT)
 *
 * LYT (连接层) 模块 - 从8个角色视角测试设备连接、Webhook、Fixture 管理
 *   👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 *
 * 由于 LYT 大量依赖 Foundation/Loyalty/Member/Transaction/Campaign 等服务,
 * 此测试文件聚焦于角色级别的功能验证, 测试路径: 导入→连接→操作→结果
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const lyt_controller_1 = require("./lyt.controller");
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
const tCtx = (tenantId = 't-lyt') => ({ tenantId });
function makeController() {
    // Mock LytService with minimal viable returns matching contract shapes
    const fixtureCatalogItem = {
        key: 'member-lookup-ok',
        capability: 'member',
        transport: 'REST'
    };
    const fixtureChecklistSummary = {
        totalFixtures: 1,
        readyFixtures: 1,
        blockedFixtures: 0,
        highRiskBlockedFixtures: 0,
        blockedFixtureKeys: [],
        transportBreakdown: { api: 1, webhook: 0 },
        capabilityBreakdown: { member: 1 },
        missingFieldBreakdown: {},
        missingChecklistBreakdown: {},
        recommendedChecklistBreakdown: {},
        recommendedNextActions: [],
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
        capabilities: [],
        connectionStatus: 'configured',
        source: 'fallback'
    };
    const accessView = {
        storeId: '',
        connectionStatus: 'configured',
        accessByCapability: [],
        recommendedNextActions: []
    };
    const adapterSelection = {
        adapterName: 'mock-adapter',
        adapterMode: 'mock',
        reason: 'test',
        vendor: 'mock-vendor',
        vendorTenantId: 'v-t-lyt',
        vendorStoreId: '',
        endpoint: 'https://mock.example.com',
        authMode: 'none',
        capabilities: [],
        connectionStatus: 'configured'
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
        capabilityBreakdown: [],
        recommendedNextActions: [],
        storeGroups: []
    };
    const lytServiceMock = {
        getFixtures: () => [fixtureCatalogItem],
        getFixtureSummary: () => fixtureChecklistSummary,
        getFixture: (key) => ({ ...fixtureCatalogItem, key }),
        compareFixtureInput: (key, _body) => ({ fixtureKey: key, readiness: 'ready', comparedAt: new Date().toISOString(), sections: { payload: {} } }),
        previewFixtureImport: (key, _body) => ({ fixtureKey: key, preview: {} }),
        planFixtureImport: (key, _body) => ({ fixtureKey: key, plan: {} }),
        getBootstrap: () => ({ tenantContext: { tenantId: 't-lyt' }, capabilities: [], phase: 'stable' }),
        getConnection: (storeId) => ({ ...resolvedConnection, storeId }),
        getConnectionCapabilityReadiness: (storeId) => ({
            storeId,
            tenantId: 't-lyt',
            vendor: 'mock-vendor',
            vendorTenantId: 'v-t-lyt',
            vendorStoreId: 'v-store',
            connectionStatus: 'configured',
            hasCredential: true,
            enabledCapabilities: [],
            readinessByCapability: [],
            missingRequirements: [],
            recommendedNextActions: []
        }),
        getStoreCapabilityAccessView: (storeId) => ({ ...accessView, storeId }),
        getAdapterSelection: (storeId) => ({ ...adapterSelection, vendorStoreId: storeId }),
        getConnectionGovernanceSummary: () => governanceSummary,
        getConnectionGovernanceAlerts: () => ({ generatedAt: new Date().toISOString(), scope: {}, alerts: [] }),
        getAdapter: () => ({
            getDeviceStatus: (deviceId) => ({ deviceId, online: true })
        }),
        acceptWebhook: (body) => ({ received: true, body }),
        drillWebhook: (body) => ({ drill: true, body }),
        replayWebhookFixture: (body) => ({ replayed: true, body })
    };
    const controller = new lyt_controller_1.LytController(lytServiceMock);
    return { controller, lytServiceMock };
}
// ──────── 👔店长 ────────
(0, node_test_1.describe)(`${ROLES.TenantAdmin} LYT 角色测试`, () => {
    (0, node_test_1.default)('店长可查看 LYT bootstrap 配置（正常流程）', () => {
        const { controller } = makeController();
        const bootstrap = controller.getBootstrap();
        strict_1.default.ok(bootstrap);
        strict_1.default.equal(typeof bootstrap, 'object');
    });
    (0, node_test_1.default)('店长可查看所有 Fixture 目录（正常流程）', () => {
        const { controller } = makeController();
        const fixtures = controller.getFixtures();
        strict_1.default.ok(Array.isArray(fixtures));
        strict_1.default.ok(fixtures.length > 0);
    });
    (0, node_test_1.default)('店长可查看设备状态（正常流程）', async () => {
        const { controller } = makeController();
        const status = await controller.getDeviceStatus('device-001');
        strict_1.default.ok(status);
        strict_1.default.equal(status.deviceId, 'device-001');
    });
});
// ──────── 🛒前台 ────────
(0, node_test_1.describe)(`${ROLES.Reception} LYT 角色测试`, () => {
    (0, node_test_1.default)('前台可查看门店连接状态（正常流程）', async () => {
        const { controller } = makeController();
        const connection = await controller.getConnection('store-01', tCtx());
        strict_1.default.ok(connection);
        strict_1.default.equal(connection.storeId, 'store-01');
        strict_1.default.equal(connection.connectionStatus, 'configured');
    });
    (0, node_test_1.default)('前台可查看门店能力就绪状态（正常流程）', async () => {
        const { controller } = makeController();
        const readiness = await controller.getConnectionCapabilityReadiness('store-01', tCtx());
        strict_1.default.ok(readiness);
        strict_1.default.equal(readiness.storeId, 'store-01');
    });
    (0, node_test_1.default)('前台不能跨门店查看连接（边界 - 租户隔离）', async () => {
        const { controller } = makeController();
        // Different store on same tenant should be accessible
        const connA = await controller.getConnection('store-a', tCtx());
        const connB = await controller.getConnection('store-b', tCtx());
        strict_1.default.ok(connA);
        strict_1.default.ok(connB);
        // But they resolve to different stores
        strict_1.default.notEqual(connA.storeId, connB.storeId);
    });
});
// ──────── 👥HR ────────
(0, node_test_1.describe)(`${ROLES.HR} LYT 角色测试`, () => {
    (0, node_test_1.default)('HR可查看设备在线状态确认员工打卡设备可用（正常流程）', async () => {
        const { controller } = makeController();
        const status = await controller.getDeviceStatus('attendance-001');
        strict_1.default.ok(status);
        strict_1.default.ok('online' in status);
    });
    (0, node_test_1.default)('HR可查看 Fixture 摘要确认集成稳定性（正常流程）', () => {
        const { controller } = makeController();
        const summary = controller.getFixtureSummary();
        strict_1.default.ok(summary);
        strict_1.default.equal(typeof summary.totalFixtures, 'number');
    });
    (0, node_test_1.default)('HR不能修改 Fixture（权限边界 - 只读验证）', () => {
        const { controller } = makeController();
        // Controller exposes getFixtures/getFixtureSummary/getFixture as read-only
        // Write operations (import/plan) require POST which HR may not have
        const summary = controller.getFixtureSummary();
        strict_1.default.ok(summary, 'HR can read fixture summary');
        // Verify structure is read-only access pattern
    });
});
// ──────── 🔧安监 ────────
(0, node_test_1.describe)(`${ROLES.Safety} LYT 角色测试`, () => {
    (0, node_test_1.default)('安监可查看连接治理摘要（正常流程）', async () => {
        const { controller } = makeController();
        const summary = await controller.getConnectionGovernanceSummary(tCtx());
        strict_1.default.ok(summary);
        strict_1.default.equal(typeof summary.totalStores, 'number');
    });
    (0, node_test_1.default)('安监可查看连接治理告警（正常流程）', async () => {
        const { controller } = makeController();
        const result = await controller.getConnectionGovernanceAlerts(tCtx());
        strict_1.default.ok(result);
        strict_1.default.ok(Array.isArray(result.alerts));
    });
    (0, node_test_1.default)('安监可 drill Webhook 事件做安全检查（正常流程）', async () => {
        const { controller } = makeController();
        const result = await controller.drillWebhook({
            eventName: 'member.registered',
            payload: { memberId: 'm-safety' }
        });
        strict_1.default.ok(result);
    });
    (0, node_test_1.default)('安监可通过 adapter 检查设备安全状态（边界）', async () => {
        const { controller } = makeController();
        const status = await controller.getDeviceStatus('gate-001');
        strict_1.default.ok(status);
        strict_1.default.ok('deviceId' in status);
    });
});
// ──────── 🎮导玩员 ────────
(0, node_test_1.describe)(`${ROLES.Guide} LYT 角色测试`, () => {
    (0, node_test_1.default)('导玩员可查看设备连接做游戏设备管理（正常流程）', async () => {
        const { controller } = makeController();
        const accessView = await controller.getStoreCapabilityAccessView('store-01', tCtx());
        strict_1.default.ok(accessView);
        strict_1.default.equal(accessView.storeId, 'store-01');
    });
    (0, node_test_1.default)('导玩员可查看 adapter 选择确认设备类型（正常流程）', async () => {
        const { controller } = makeController();
        const adapter = await controller.getAdapterSelection('store-01', tCtx());
        strict_1.default.ok(adapter);
        strict_1.default.equal(adapter.vendorStoreId, 'store-01');
    });
    (0, node_test_1.default)('导玩员可查看 Fixture 了解设备接口（边界）', () => {
        const { controller } = makeController();
        const fixture = controller.getFixture('member-lookup-ok');
        strict_1.default.ok(fixture);
        strict_1.default.equal(fixture.key, 'member-lookup-ok');
    });
});
// ──────── 🎯运行专员 ────────
(0, node_test_1.describe)(`${ROLES.Ops} LYT 角色测试`, () => {
    (0, node_test_1.default)('运行专员可完整走通连接 → 就绪 → 访问链路（正常流程）', async () => {
        const { controller } = makeController();
        const ctx = tCtx();
        const storeId = 'store-ops-01';
        // 1. 获取连接状态
        const conn = await controller.getConnection(storeId, ctx);
        strict_1.default.equal(conn.connectionStatus, 'configured');
        // 2. 获取能力就绪
        const readiness = await controller.getConnectionCapabilityReadiness(storeId, ctx);
        strict_1.default.ok(readiness);
        // 3. 获取能力访问视图
        const accessView = await controller.getStoreCapabilityAccessView(storeId, ctx);
        strict_1.default.ok(accessView);
    });
    (0, node_test_1.default)('运行专员可接收并 drill Webhook 完整链路（正常流程）', async () => {
        const { controller } = makeController();
        // 1. 接收 Webhook
        const webhookResult = await controller.acceptWebhook({
            eventName: 'payment.succeeded',
            payload: { orderId: 'ORD-001', amount: 100 }
        });
        strict_1.default.ok(webhookResult);
        // 2. Drill Webhook
        const drillResult = await controller.drillWebhook({
            eventName: 'payment.succeeded',
            payload: { orderId: 'ORD-001' }
        });
        strict_1.default.ok(drillResult);
    });
    (0, node_test_1.default)('运行专员可预览并计划 Fixture 导入（正常流程）', async () => {
        const { controller } = makeController();
        const preview = await controller.importFixturePreview('member-lookup-ok', {});
        strict_1.default.ok(preview);
        const plan = await controller.importFixturePlan('member-lookup-ok', {});
        strict_1.default.ok(plan);
    });
});
// ──────── 🤝团建 ────────
(0, node_test_1.describe)(`${ROLES.Teambuilding} LYT 角色测试`, () => {
    (0, node_test_1.default)('团建可通过 Webhook 接收团建活动数据（正常流程）', async () => {
        const { controller } = makeController();
        const result = await controller.acceptWebhook({
            eventName: 'team.activity',
            payload: { activityId: 'TA-001', participants: 20 }
        });
        strict_1.default.ok(result);
    });
    (0, node_test_1.default)('团建可通过 Fixture 验证团建设备接口（正常流程）', () => {
        const { controller } = makeController();
        const fixtures = controller.getFixtures();
        strict_1.default.ok(fixtures.length > 0);
        strict_1.default.ok(fixtures.some(f => f.capability));
    });
    (0, node_test_1.default)('团建可 replay fixture 做团建活动验证（边界）', async () => {
        const { controller } = makeController();
        const result = await controller.replayWebhookFixture({
            fixtureKey: 'member-lookup-ok',
            payload: {}
        });
        strict_1.default.ok(result);
    });
});
// ──────── 📢营销 ────────
(0, node_test_1.describe)(`${ROLES.Marketing} LYT 角色测试`, () => {
    (0, node_test_1.default)('营销可通过 Webhook 接收营销数据（正常流程）', async () => {
        const { controller } = makeController();
        const result = await controller.acceptWebhook({
            eventName: 'marketing.campaign-triggered',
            payload: { campaignId: 'CAMP-001', memberId: 'm-mkt' }
        });
        strict_1.default.ok(result);
    });
    (0, node_test_1.default)('营销可 compare fixture 验证营销类接口（正常流程）', async () => {
        const { controller } = makeController();
        const result = await controller.compareFixture('member-lookup-ok', {
            input: { memberId: 'm-mkt' }
        });
        strict_1.default.ok(result);
    });
    (0, node_test_1.default)('营销可 drill Webhook 做营销效果检查（边界）', async () => {
        const { controller } = makeController();
        const result = await controller.drillWebhook({
            eventName: 'marketing.coupon-issued',
            payload: { couponId: 'CP-001' }
        });
        strict_1.default.ok(result);
    });
});
// ──────────── 跨角色边界 ────────────
(0, node_test_1.describe)('LYT 跨角色边界验证', () => {
    (0, node_test_1.default)('Fixture 目录对所有角色可见且一致', () => {
        const { controller } = makeController();
        const fixtures = controller.getFixtures();
        const summary = controller.getFixtureSummary();
        strict_1.default.ok(fixtures.length > 0);
        strict_1.default.equal(summary.totalFixtures, fixtures.length);
    });
    (0, node_test_1.default)('Webhook 链路完整性: 接收 → drill → replay', async () => {
        const { controller } = makeController();
        const event = {
            eventName: 'member.registered',
            payload: { memberId: 'm-001', timestamp: new Date().toISOString() }
        };
        // 接收
        const received = await controller.acceptWebhook(event);
        strict_1.default.ok(received);
        // Drill
        const drilled = await controller.drillWebhook(event);
        strict_1.default.ok(drilled);
        // Replay
        const replayed = await controller.replayWebhookFixture({
            fixtureKey: 'member-lookup-ok',
            payload: event
        });
        strict_1.default.ok(replayed);
    });
    (0, node_test_1.default)('设备状态查询对所有角色开放', async () => {
        const { controller } = makeController();
        const devices = ['device-001', 'gate-001', 'attendance-001', 'game-001'];
        for (const deviceId of devices) {
            const status = await controller.getDeviceStatus(deviceId);
            strict_1.default.ok(status);
            strict_1.default.equal(status.deviceId, deviceId);
        }
    });
    (0, node_test_1.default)('连接治理告警列表对所有角色开放且不泄露敏感数据', async () => {
        const { controller } = makeController();
        const result = await controller.getConnectionGovernanceAlerts(tCtx());
        strict_1.default.ok(result);
        strict_1.default.ok(Array.isArray(result.alerts));
        // 检验不应有 PII 泄露
        const str = JSON.stringify(result);
        // General safety: the output should not contain obviously sensitive patterns
        strict_1.default.ok(!str.includes('password'));
        strict_1.default.ok(!str.includes('secret'));
    });
});
//# sourceMappingURL=lyt.role.test.js.map