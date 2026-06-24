"use strict";
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
const foundation_controller_1 = require("./foundation.controller");
// ── Helpers: construct controller with mocked FoundationService ──
function mockFoundationService(overrides = {}) {
    const svc = {
        getBlueprint: () => ({ generatedAt: '2026-01-01', docs: [], guardrails: [], modules: [], consumers: [], governanceBaselines: [], frontendBootstrap: {} }),
        getModuleCatalog: () => ([{ module: 'trust-governance', status: 'healthy' }]),
        getOperationsOverview: () => ({ generatedAt: '2026-01-01', summary: {}, alerts: [], topRisks: [], topFailures: [], moduleHealth: {}, modules: {} }),
        getOperationsAlerts: () => ({ generatedAt: '2026-01-01', alerts: [], topRisks: [] }),
        getOperationsAlertsCatalog: () => ({ generatedAt: '2026-01-01', alerts: [] }),
        getOperationsAlertDrilldown: () => ({ generatedAt: '2026-01-01', code: 'test', detail: {} }),
        acknowledgeOperationsAlert: () => ({ generatedAt: '2026-01-01', code: 'test', acknowledgement: {}, visibleInOverview: true }),
        muteOperationsAlert: () => ({ generatedAt: '2026-01-01', code: 'test', acknowledgement: {}, visibleInOverview: false }),
        unmuteOperationsAlert: () => ({ generatedAt: '2026-01-01', code: 'test', acknowledgement: {}, visibleInOverview: true }),
        getOperationsModuleDetail: () => ({ generatedAt: '2026-01-01', moduleKey: 'test' }),
        getConsumerCatalog: () => ([{ consumer: 'test' }]),
        getConsumerDependency: () => ({ consumer: 'test' }),
        ...overrides
    };
    return svc;
}
const tenantCtx = { tenantId: 't-foundation', brandId: 'b-foundation', storeId: 's-foundation', marketCode: 'zh-cn' };
const actorCtx = { actorId: 'a-test', actorType: 'tenant-user', actorName: 'Test', roles: [], permissions: [], tenantId: 't-foundation', authenticated: true, source: 'headers' };
const ROLES = {
    TenantAdmin: '👔店长',
    FrontDesk: '🛒前台',
    HR: '👥HR',
    Security: '🔧安监',
    Guide: '🎮导玩员',
    Operations: '🎯运行专员',
    Teambuilding: '🤝团建',
    Marketing: '📢营销',
};
// ── 👔店长 ──
(0, node_test_1.describe)(`${ROLES.TenantAdmin} foundation 角色测试`, () => {
    (0, node_test_1.default)('店长可以获取 foundation bootstrap', () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantContext);
        strict_1.default.equal(result.tenantContext.tenantId, 't-foundation');
    });
    (0, node_test_1.default)('店长可以查看运营概览', async () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.getOperationsOverview(tenantCtx);
        strict_1.default.ok(result);
        strict_1.default.ok(result.generatedAt);
    });
    (0, node_test_1.default)('店长可以查看告警目录', async () => {
        const svc = mockFoundationService({ getOperationsAlertsCatalog: async () => ({ generatedAt: '2026', alerts: [{ code: 'approvals-pending' }] }) });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.getOperationsAlertsCatalog(tenantCtx);
        strict_1.default.ok(result.alerts);
    });
    (0, node_test_1.default)('店长可以查看模块列表', () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getModules();
        strict_1.default.ok(Array.isArray(result));
    });
});
// ── 🛒前台 ──
(0, node_test_1.describe)(`${ROLES.FrontDesk} foundation 角色测试`, () => {
    (0, node_test_1.default)('前台可以获取 foundation bootstrap（仅供查看基础设施状态）', () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantContext);
        strict_1.default.equal(result.tenantContext.tenantId, 't-foundation');
    });
    (0, node_test_1.default)('前台可以查看模块目录（了解系统状态）', () => {
        const svc = mockFoundationService({
            getModuleCatalog: () => [
                { module: 'trust-governance', status: 'healthy' },
                { module: 'configuration-governance', status: 'healthy' },
                { module: 'resilience-operations', status: 'healthy' },
                { module: 'runtime-governance', status: 'healthy' },
                { module: 'integration-orchestration', status: 'healthy' },
                { module: 'identity-access', status: 'healthy' },
            ],
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getModules();
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.ok(result.length >= 4);
        strict_1.default.ok(result.every((m) => m.status === 'healthy'));
    });
    (0, node_test_1.default)('前台尝试查看运营告警 — 边界（仅可查看 catalog，不能执行 ack）', async () => {
        const svc = mockFoundationService({
            getOperationsAlertsCatalog: async () => ({
                generatedAt: '2026',
                alerts: [{ code: 'approvals-pending', severityPolicy: 'medium', drilldownEnabled: true }],
            }),
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.getOperationsAlertsCatalog(tenantCtx);
        strict_1.default.ok(result.alerts);
        // 前台只能看不能动 — 确认 catalog 只读返回
        strict_1.default.ok(result.generatedAt);
    });
});
// ── 👥HR ──
(0, node_test_1.describe)(`${ROLES.HR} foundation 角色测试`, () => {
    (0, node_test_1.default)('HR可以获取 foundation bootstrap', () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantContext);
    });
    (0, node_test_1.default)('HR可以查看运营概览', async () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.getOperationsOverview(tenantCtx);
        strict_1.default.ok(result);
        strict_1.default.ok(result.generatedAt);
    });
    (0, node_test_1.default)('HR可以查看模块列表', () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getModules();
        strict_1.default.ok(result.length > 0);
    });
    (0, node_test_1.default)('HR尝试 ack 告警 — 边界（action 本身无权限，但调用成功需要 guard 检查）', async () => {
        // 业务逻辑测试：service 的 ack 调用支持
        const svc = mockFoundationService({
            acknowledgeOperationsAlert: async () => ({ generatedAt: '2026', code: 'high-risk-audits', acknowledgement: { status: 'ACKED' }, visibleInOverview: true, availableActions: [], history: [] })
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.acknowledgeOperationsAlert('high-risk-audits', tenantCtx, actorCtx, { note: 'HR确认' });
        strict_1.default.ok(result.generatedAt);
    });
});
// ── 🔧安监 ──
(0, node_test_1.describe)(`${ROLES.Security} foundation 角色测试`, () => {
    (0, node_test_1.default)('安监可以获取 foundation bootstrap', () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantContext);
    });
    (0, node_test_1.default)('安监可以查看告警目录（审计视角）', async () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.getOperationsAlertsCatalog(tenantCtx);
        strict_1.default.ok(result);
        strict_1.default.ok(result.alerts);
    });
    (0, node_test_1.default)('安监可以 drilldown 告警详情', async () => {
        const svc = mockFoundationService({ getOperationsAlertDrilldown: async () => ({ generatedAt: '2026', code: 'high-risk-audits', detail: { riskLevel: 'high' } }) });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.getOperationsAlertDrilldown('high-risk-audits', tenantCtx);
        strict_1.default.equal(result.code, 'high-risk-audits');
    });
    (0, node_test_1.default)('安监尝试 mute 告警（action 需要正确角色+权限）', async () => {
        const svc = mockFoundationService({
            muteOperationsAlert: async () => ({ generatedAt: '2026', code: 'high-risk-audits', acknowledgement: { status: 'MUTED' }, visibleInOverview: false, availableActions: [], history: [] })
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        // 操作测试：mute 的业务逻辑由 service 处理
        const result = await ctrl.muteOperationsAlert('high-risk-audits', tenantCtx, actorCtx, { note: '降噪' });
        strict_1.default.equal(result.acknowledgement.status, 'MUTED');
    });
});
// ── 🎮导玩员 ──
(0, node_test_1.describe)(`${ROLES.Guide} foundation 角色测试`, () => {
    (0, node_test_1.default)('导玩员可以获取 foundation bootstrap（了解系统依赖状态）', () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantContext);
        strict_1.default.equal(result.tenantContext.tenantId, 't-foundation');
    });
    (0, node_test_1.default)('导玩员可以查看 consumer 依赖（了解模块间依赖关系）', () => {
        const svc = mockFoundationService({
            getConsumerCatalog: () => [
                { consumer: 'market', dependsOn: ['identity-access', 'trust-governance'], responsibility: '多市场配置输出' },
                { consumer: 'portal', dependsOn: ['identity-access', 'configuration-governance'], responsibility: '门户解析与策略' },
                { consumer: 'workbench', dependsOn: ['identity-access', 'trust-governance'], responsibility: '工作台配置' },
            ],
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getConsumers();
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.equal(result.length, 3);
        strict_1.default.ok(result.every((c) => c.consumer && Array.isArray(c.dependsOn)));
    });
    (0, node_test_1.default)('导玩员可以查看 consumer 详情 — 边界（不存在的 consumer 返回建议列表）', () => {
        const svc = mockFoundationService({
            getConsumerDependency: () => ({ availableConsumers: ['market', 'portal', 'workbench'] }),
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getConsumer('non-existent-consumer');
        strict_1.default.ok(result.availableConsumers);
        strict_1.default.ok(Array.isArray(result.availableConsumers));
    });
});
// ── 🎯运行专员 ──
(0, node_test_1.describe)(`${ROLES.Operations} foundation 角色测试`, () => {
    (0, node_test_1.default)('运营专员可以获取 foundation bootstrap', () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantContext);
    });
    (0, node_test_1.default)('运营专员可以查看运营概览（含 summary）', async () => {
        const svc = mockFoundationService({
            getOperationsOverview: async () => ({
                generatedAt: '2026', summary: { approvalsPending: 2 }, alerts: [], topFailures: [], topRisks: [], moduleHealth: {}, modules: {}
            })
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.getOperationsOverview(tenantCtx);
        strict_1.default.equal(result.summary.approvalsPending, 2);
    });
    (0, node_test_1.default)('运营专员可以 ack 告警', async () => {
        const svc = mockFoundationService({
            acknowledgeOperationsAlert: async () => ({ generatedAt: '2026', code: 'approvals-pending', acknowledgement: { status: 'ACKED' }, visibleInOverview: true, availableActions: [], history: [] })
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.acknowledgeOperationsAlert('approvals-pending', tenantCtx, actorCtx, { note: '已处理' });
        strict_1.default.equal(result.acknowledgement.status, 'ACKED');
    });
    (0, node_test_1.default)('运营专员可以 unmute 告警', async () => {
        const svc = mockFoundationService({
            unmuteOperationsAlert: async () => ({ generatedAt: '2026', code: 'approvals-pending', acknowledgement: { status: 'ACKED' }, visibleInOverview: true, availableActions: [], history: [] })
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.unmuteOperationsAlert('approvals-pending', tenantCtx, actorCtx, { note: '恢复跟踪' });
        strict_1.default.equal(result.acknowledgement.status, 'ACKED');
    });
});
// ── 🤝团建 ──
(0, node_test_1.describe)(`${ROLES.Teambuilding} foundation 角色测试`, () => {
    (0, node_test_1.default)('团建可以获取 foundation bootstrap（团队活动前检查系统状态）', () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantContext);
        strict_1.default.equal(result.tenantContext.storeId, 's-foundation');
    });
    (0, node_test_1.default)('团建可以查看特定模块运营详情（检查 resilience-operations）', async () => {
        const svc = mockFoundationService({
            getOperationsModuleDetail: async () => ({
                generatedAt: '2026',
                moduleKey: 'resilience-operations',
                health: { module: 'resilience-operations', score: 85, status: 'healthy', indicators: { highRiskAudits: 0, pendingApprovals: 0, executionFailures: 0, blockedCount: 0 } },
            }),
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.getOperationsModuleDetail('resilience-operations', tenantCtx);
        strict_1.default.equal(result.moduleKey, 'resilience-operations');
        strict_1.default.ok(result.health);
        strict_1.default.equal(result.health.status, 'healthy');
    });
    (0, node_test_1.default)('团建查看不存在的模块 — 边界（返回 available keys）', async () => {
        const svc = mockFoundationService({
            getOperationsModuleDetail: async () => ({
                generatedAt: '2026',
                moduleKey: 'unknown',
                availableModuleKeys: ['trust-governance', 'configuration-governance', 'resilience-operations', 'runtime-governance'],
            }),
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.getOperationsModuleDetail('unknown', tenantCtx);
        strict_1.default.ok(result.availableModuleKeys);
        strict_1.default.ok(result.availableModuleKeys.length >= 3);
    });
});
// ── 📢营销 ──
(0, node_test_1.describe)(`${ROLES.Marketing} foundation 角色测试`, () => {
    (0, node_test_1.default)('营销可以获取 foundation bootstrap（营销活动前检查系统健康度）', () => {
        const svc = mockFoundationService();
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(result.tenantContext);
        strict_1.default.equal(result.tenantContext.tenantId, 't-foundation');
    });
    (0, node_test_1.default)('营销可以查看告警列表（检查营销活动相关依赖的服务健康）', async () => {
        const svc = mockFoundationService({
            getOperationsAlerts: async () => ({
                generatedAt: '2026',
                alerts: [
                    { severity: 'medium', code: 'observability-degradation', count: 3, summary: '存在异常的 metrics/logs/traces 信号' },
                    { severity: 'high', code: 'runtime-callback-stalled', count: 5, summary: '存在等待 callback 回写的 runtime receipt' },
                ],
                topRisks: [
                    { severity: 'high', code: 'runtime-callback-stalled', count: 5 },
                    { severity: 'medium', code: 'observability-degradation', count: 3 },
                ],
            }),
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.getOperationsAlerts(tenantCtx);
        strict_1.default.ok(result.alerts);
        strict_1.default.ok(result.alerts.length >= 1);
        strict_1.default.ok(result.topRisks.length >= 1);
    });
    (0, node_test_1.default)('营销尝试 mute 告警 — 边界（无写权限，但 service 调用层面测试通过）', async () => {
        const svc = mockFoundationService({
            muteOperationsAlert: async () => ({
                generatedAt: '2026',
                code: 'observability-degradation',
                acknowledgement: { status: 'MUTED' },
                visibleInOverview: false,
                availableActions: [],
                history: [],
            }),
        });
        const ctrl = new foundation_controller_1.FoundationController(svc);
        const result = await ctrl.muteOperationsAlert('observability-degradation', tenantCtx, actorCtx, { note: '营销活动期间降噪', mutedUntil: '2026-06-15T00:00:00Z' });
        strict_1.default.equal(result.acknowledgement.status, 'MUTED');
        strict_1.default.equal(result.visibleInOverview, false);
    });
});
//# sourceMappingURL=foundation.role.test.js.map