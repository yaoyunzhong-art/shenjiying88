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
// ── Mock 服务 ──
class MockFoundationService {
    getBlueprint() { return { generatedAt: new Date().toISOString() }; }
    getModuleCatalog() { return []; }
    getConsumerCatalog() { return []; }
    getConsumerDependency() { return {}; }
    getOperationsOverview() { return {}; }
    getOperationsAlerts() { return {}; }
    getOperationsAlertsCatalog() { return {}; }
    getOperationsAlertDrilldown() { return {}; }
    acknowledgeOperationsAlert() { return {}; }
    muteOperationsAlert() { return {}; }
    unmuteOperationsAlert() { return {}; }
    getOperationsModuleDetail() { return {}; }
}
function makeController(svcOverride) {
    const svc = { ...new MockFoundationService(), ...svcOverride };
    return new foundation_controller_1.FoundationController(svc);
}
const tenantCtx = {
    tenantId: 't-foundation',
    brandId: 'b-foundation',
    storeId: 's-foundation',
    marketCode: 'zh-cn'
};
// ──────────── 路由元数据 ────────────
(0, node_test_1.default)('foundation controller path metadata is set', () => {
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController);
    strict_1.default.equal(path, 'foundation');
});
(0, node_test_1.default)('getBootstrap has GET metadata with path bootstrap', () => {
    const method = Reflect.getMetadata('method', foundation_controller_1.FoundationController.prototype.getBootstrap);
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController.prototype.getBootstrap);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'bootstrap');
});
(0, node_test_1.default)('getModules has GET metadata with path modules', () => {
    const method = Reflect.getMetadata('method', foundation_controller_1.FoundationController.prototype.getModules);
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController.prototype.getModules);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'modules');
});
(0, node_test_1.default)('getOperationsOverview has GET metadata with path overview', () => {
    const method = Reflect.getMetadata('method', foundation_controller_1.FoundationController.prototype.getOperationsOverview);
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController.prototype.getOperationsOverview);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'overview');
});
(0, node_test_1.default)('getOperationsAlerts has GET metadata with path overview/alerts', () => {
    const method = Reflect.getMetadata('method', foundation_controller_1.FoundationController.prototype.getOperationsAlerts);
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController.prototype.getOperationsAlerts);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'overview/alerts');
});
(0, node_test_1.default)('getOperationsAlertsCatalog has GET metadata with path overview/alerts/catalog', () => {
    const method = Reflect.getMetadata('method', foundation_controller_1.FoundationController.prototype.getOperationsAlertsCatalog);
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController.prototype.getOperationsAlertsCatalog);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'overview/alerts/catalog');
});
(0, node_test_1.default)('getOperationsAlertDrilldown has GET metadata with path overview/alerts/:code/drilldown', () => {
    const method = Reflect.getMetadata('method', foundation_controller_1.FoundationController.prototype.getOperationsAlertDrilldown);
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController.prototype.getOperationsAlertDrilldown);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'overview/alerts/:code/drilldown');
});
(0, node_test_1.default)('acknowledgeOperationsAlert has POST metadata with path overview/alerts/:code/ack', () => {
    const method = Reflect.getMetadata('method', foundation_controller_1.FoundationController.prototype.acknowledgeOperationsAlert);
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController.prototype.acknowledgeOperationsAlert);
    strict_1.default.equal(method, 1);
    strict_1.default.equal(path, 'overview/alerts/:code/ack');
});
(0, node_test_1.default)('muteOperationsAlert has POST metadata with path overview/alerts/:code/mute', () => {
    const method = Reflect.getMetadata('method', foundation_controller_1.FoundationController.prototype.muteOperationsAlert);
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController.prototype.muteOperationsAlert);
    strict_1.default.equal(method, 1);
    strict_1.default.equal(path, 'overview/alerts/:code/mute');
});
(0, node_test_1.default)('unmuteOperationsAlert has POST metadata with path overview/alerts/:code/unmute', () => {
    const method = Reflect.getMetadata('method', foundation_controller_1.FoundationController.prototype.unmuteOperationsAlert);
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController.prototype.unmuteOperationsAlert);
    strict_1.default.equal(method, 1);
    strict_1.default.equal(path, 'overview/alerts/:code/unmute');
});
(0, node_test_1.default)('getOperationsModuleDetail has GET metadata with path overview/modules/:moduleKey', () => {
    const method = Reflect.getMetadata('method', foundation_controller_1.FoundationController.prototype.getOperationsModuleDetail);
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController.prototype.getOperationsModuleDetail);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'overview/modules/:moduleKey');
});
(0, node_test_1.default)('getConsumers has GET metadata with path consumers', () => {
    const method = Reflect.getMetadata('method', foundation_controller_1.FoundationController.prototype.getConsumers);
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController.prototype.getConsumers);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'consumers');
});
(0, node_test_1.default)('getConsumer has GET metadata with path consumers/:consumer', () => {
    const method = Reflect.getMetadata('method', foundation_controller_1.FoundationController.prototype.getConsumer);
    const path = Reflect.getMetadata('path', foundation_controller_1.FoundationController.prototype.getConsumer);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'consumers/:consumer');
});
// ──────────── getBootstrap ────────────
(0, node_test_1.describe)('getBootstrap()', () => {
    (0, node_test_1.default)('delegates to foundationService.getBlueprint and injects tenantContext', () => {
        const ctrl = makeController({ getBlueprint: () => ({ generatedAt: '2026-01-01' }) });
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.ok(typeof result === 'object' && result !== null);
        strict_1.default.ok('generatedAt' in result);
        strict_1.default.deepStrictEqual(result.tenantContext, tenantCtx);
    });
    (0, node_test_1.default)('works with minimal tenant context (tenantId only)', () => {
        const ctrl = makeController({ getBlueprint: () => ({ generatedAt: '2026-01-01' }) });
        const result = ctrl.getBootstrap({ tenantId: 't-min' });
        strict_1.default.equal(result.tenantContext.tenantId, 't-min');
    });
    (0, node_test_1.default)('returns different generatedAt on each call (blueprint freshness)', () => {
        let callCount = 0;
        const ctrl = makeController({
            getBlueprint: () => ({ generatedAt: `call-${++callCount}` })
        });
        const r1 = ctrl.getBootstrap(tenantCtx);
        const r2 = ctrl.getBootstrap(tenantCtx);
        strict_1.default.notEqual(r1.generatedAt, r2.generatedAt);
    });
});
// ──────────── getModules ────────────
(0, node_test_1.describe)('getModules()', () => {
    (0, node_test_1.default)('delegates to foundationService.getModuleCatalog', () => {
        const mockCatalog = [
            { key: 'member', name: '会员', status: 'active' },
            { key: 'cashier', name: '收银', status: 'active' }
        ];
        const ctrl = makeController({ getModuleCatalog: () => mockCatalog });
        const result = ctrl.getModules();
        strict_1.default.deepStrictEqual(result, mockCatalog);
    });
    (0, node_test_1.default)('returns empty array when no modules registered', () => {
        const ctrl = makeController({ getModuleCatalog: () => [] });
        const result = ctrl.getModules();
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.equal(result.length, 0);
    });
});
// ──────────── getOperationsOverview ────────────
(0, node_test_1.describe)('getOperationsOverview()', () => {
    (0, node_test_1.default)('delegates to foundationService with filter options', async () => {
        let capturedFilter = null;
        const ctrl = makeController({
            getOperationsOverview: async (_ctx, filter) => {
                capturedFilter = filter;
                return { total: 5, items: [] };
            }
        });
        const result = await ctrl.getOperationsOverview(tenantCtx, 'governance', 'pending', undefined, undefined, 'true', 'true');
        strict_1.default.deepStrictEqual(result, { total: 5, items: [] });
        strict_1.default.deepStrictEqual(capturedFilter, {
            focus: 'governance',
            state: 'pending',
            callbackStatus: undefined,
            riskLevel: undefined,
            replayable: true,
            stalledOnly: true
        });
    });
    (0, node_test_1.default)('passes undefined tenant context gracefully', async () => {
        const ctrl = makeController({
            getOperationsOverview: async () => ({ total: 0 })
        });
        const result = await ctrl.getOperationsOverview(undefined);
        strict_1.default.deepStrictEqual(result, { total: 0 });
    });
    (0, node_test_1.default)('parses boolean query params correctly', async () => {
        let capturedFilter = null;
        const ctrl = makeController({
            getOperationsOverview: async (_ctx, filter) => {
                capturedFilter = filter;
                return {};
            }
        });
        // true case
        await ctrl.getOperationsOverview(tenantCtx, undefined, undefined, undefined, undefined, 'true', 'false');
        strict_1.default.equal(capturedFilter.replayable, true);
        strict_1.default.equal(capturedFilter.stalledOnly, false);
        // false case
        await ctrl.getOperationsOverview(tenantCtx, undefined, undefined, undefined, undefined, 'false', 'true');
        strict_1.default.equal(capturedFilter.replayable, false);
        strict_1.default.equal(capturedFilter.stalledOnly, true);
        // undefined / nonsense strings
        await ctrl.getOperationsOverview(tenantCtx, undefined, undefined, undefined, undefined, 'garbage', 'whatever');
        strict_1.default.equal(capturedFilter.replayable, undefined);
        strict_1.default.equal(capturedFilter.stalledOnly, undefined);
    });
    (0, node_test_1.default)('passes all filter params through to service', async () => {
        let capturedFilter = null;
        const ctrl = makeController({
            getOperationsOverview: async (_ctx, filter) => {
                capturedFilter = filter;
                return {};
            }
        });
        await ctrl.getOperationsOverview(tenantCtx, 'runtime', 'completed', 'succeeded', 'high');
        strict_1.default.equal(capturedFilter.focus, 'runtime');
        strict_1.default.equal(capturedFilter.state, 'completed');
        strict_1.default.equal(capturedFilter.callbackStatus, 'succeeded');
        strict_1.default.equal(capturedFilter.riskLevel, 'high');
        strict_1.default.equal(capturedFilter.replayable, undefined);
        strict_1.default.equal(capturedFilter.stalledOnly, undefined);
    });
});
// ──────────── Operations Alerts ────────────
(0, node_test_1.describe)('Operations Alerts', () => {
    (0, node_test_1.default)('getOperationsAlerts delegates to service', async () => {
        const mockAlerts = [
            { code: 'approvals-pending', severity: 'high', count: 7 }
        ];
        const ctrl = makeController({
            getOperationsAlerts: async () => mockAlerts
        });
        const result = await ctrl.getOperationsAlerts(tenantCtx);
        strict_1.default.deepStrictEqual(result, mockAlerts);
    });
    (0, node_test_1.default)('getOperationsAlertsCatalog delegates to service', async () => {
        const mockCatalog = [
            { code: 'approvals-pending', defaultSummary: '待处理审批' }
        ];
        const ctrl = makeController({
            getOperationsAlertsCatalog: async () => mockCatalog
        });
        const result = await ctrl.getOperationsAlertsCatalog(tenantCtx);
        strict_1.default.deepStrictEqual(result, mockCatalog);
    });
    (0, node_test_1.default)('getOperationsAlertDrilldown delegates to service with code param', async () => {
        let capturedCode = null;
        const ctrl = makeController({
            getOperationsAlertDrilldown: async (code) => {
                capturedCode = code;
                return { code, items: [{ id: 'drill-1' }] };
            }
        });
        const result = await ctrl.getOperationsAlertDrilldown('approvals-pending', tenantCtx);
        strict_1.default.equal(capturedCode, 'approvals-pending');
        strict_1.default.equal(result.code, 'approvals-pending');
        strict_1.default.equal(result.items.length, 1);
    });
    (0, node_test_1.default)('getOperationsAlertDrilldown for unknown alert code', async () => {
        const ctrl = makeController({
            getOperationsAlertDrilldown: async () => {
                throw new Error('Alert unknown-code not found');
            }
        });
        await strict_1.default.rejects(ctrl.getOperationsAlertDrilldown('unknown-code', tenantCtx), /not found/);
    });
    (0, node_test_1.default)('acknowledgeOperationsAlert delegates to service with actor and note', async () => {
        let captured = null;
        const ctrl = makeController({
            acknowledgeOperationsAlert: async (code, ctx, actor, note) => {
                captured = { code, ctx, actor, note };
                return { acknowledged: true, code };
            }
        });
        const actorCtx = { actorId: 'user-001', actorType: "USER", permissions: [], roles: ['TENANT_ADMIN'] };
        const result = await ctrl.acknowledgeOperationsAlert('approvals-pending', tenantCtx, actorCtx, { note: '已确认' });
        strict_1.default.equal(captured.code, 'approvals-pending');
        strict_1.default.equal(captured.note, '已确认');
        strict_1.default.deepStrictEqual(captured.actor, actorCtx);
        strict_1.default.equal(result.acknowledged, true);
    });
    (0, node_test_1.default)('acknowledgeOperationsAlert works with empty body', async () => {
        const ctrl = makeController({
            acknowledgeOperationsAlert: async () => ({ acknowledged: true })
        });
        const actorCtx = { actorId: 'user-002', actorType: "USER", permissions: [], roles: ['OPERATIONS'] };
        const result = await ctrl.acknowledgeOperationsAlert('high-risk-audits', tenantCtx, actorCtx, {});
        strict_1.default.ok(result);
    });
    (0, node_test_1.default)('muteOperationsAlert delegates to service with mutedUntil and note', async () => {
        let captured = null;
        const ctrl = makeController({
            muteOperationsAlert: async (code, ctx, actor, body) => {
                captured = { code, ctx, actor, body };
                return { muted: true, code };
            }
        });
        const actorCtx = { actorId: 'user-003', actorType: "USER", permissions: [], roles: ['SECURITY_ADMIN'] };
        await ctrl.muteOperationsAlert('secret-rotation-attention', tenantCtx, actorCtx, { mutedUntil: '2026-06-30T00:00:00Z', note: '暂时静默' });
        strict_1.default.equal(captured.code, 'secret-rotation-attention');
        strict_1.default.equal(captured.body.mutedUntil, '2026-06-30T00:00:00Z');
        strict_1.default.equal(captured.body.note, '暂时静默');
    });
    (0, node_test_1.default)('unmuteOperationsAlert delegates to service', async () => {
        let capturedCode = null;
        const ctrl = makeController({
            unmuteOperationsAlert: async (code) => {
                capturedCode = code;
                return { unmuted: true, code };
            }
        });
        const actorCtx = { actorId: 'user-004', actorType: "USER", permissions: [], roles: ['TENANT_ADMIN'] };
        const result = await ctrl.unmuteOperationsAlert('observability-degradation', tenantCtx, actorCtx, { note: '恢复监控' });
        strict_1.default.equal(capturedCode, 'observability-degradation');
        strict_1.default.equal(result.unmuted, true);
    });
    (0, node_test_1.default)('unmuteOperationsAlert with empty body works', async () => {
        const ctrl = makeController({
            unmuteOperationsAlert: async () => ({ unmuted: true })
        });
        const actorCtx = { actorId: 'user-005', actorType: "USER", permissions: [], roles: ['SUPER_ADMIN'] };
        const result = await ctrl.unmuteOperationsAlert('runtime-governance-backlog', tenantCtx, actorCtx, {});
        strict_1.default.ok(result);
    });
});
// ──────────── getOperationsModuleDetail ────────────
(0, node_test_1.describe)('getOperationsModuleDetail()', () => {
    (0, node_test_1.default)('delegates to service with moduleKey', async () => {
        const mockDetail = {
            moduleKey: 'member',
            moduleName: '会员',
            governanceStatus: 'healthy',
            alertCount: 0,
            runtimeEvents: []
        };
        const ctrl = makeController({
            getOperationsModuleDetail: async () => mockDetail
        });
        const result = await ctrl.getOperationsModuleDetail('member', tenantCtx);
        strict_1.default.deepStrictEqual(result, mockDetail);
    });
    (0, node_test_1.default)('returns error for unknown module (反例)', async () => {
        const ctrl = makeController({
            getOperationsModuleDetail: async () => {
                throw new Error('Module unknown-mod not found');
            }
        });
        await strict_1.default.rejects(ctrl.getOperationsModuleDetail('unknown-mod', tenantCtx), /not found/);
    });
    (0, node_test_1.default)('passes moduleKey with special characters', async () => {
        let capturedKey = null;
        const ctrl = makeController({
            getOperationsModuleDetail: async (key) => {
                capturedKey = key;
                return { moduleKey: key };
            }
        });
        await ctrl.getOperationsModuleDetail('ai-rule-engine', tenantCtx);
        strict_1.default.equal(capturedKey, 'ai-rule-engine');
    });
});
// ──────────── Consumers ────────────
(0, node_test_1.describe)('getConsumers() / getConsumer()', () => {
    (0, node_test_1.default)('getConsumers delegates to foundationService.getConsumerCatalog', () => {
        const mockConsumers = [
            { key: 'admin-workbench', name: '后台工作台' },
            { key: 'customer-portal', name: '客户端' }
        ];
        const ctrl = makeController({ getConsumerCatalog: () => mockConsumers });
        const result = ctrl.getConsumers();
        strict_1.default.deepStrictEqual(result, mockConsumers);
    });
    (0, node_test_1.default)('getConsumers returns empty array when no consumers', () => {
        const ctrl = makeController({ getConsumerCatalog: () => [] });
        const result = ctrl.getConsumers();
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.equal(result.length, 0);
    });
    (0, node_test_1.default)('getConsumer delegates to foundationService.getConsumerDependency', () => {
        const mockDep = {
            key: 'market',
            dependsOn: ['tenant'],
            apis: ['GET /markets/:scopeType/:scopeCode']
        };
        const ctrl = makeController({ getConsumerDependency: () => mockDep });
        const result = ctrl.getConsumer('market');
        strict_1.default.deepStrictEqual(result, mockDep);
    });
    (0, node_test_1.default)('getConsumer handles unknown consumer key', () => {
        const ctrl = makeController({ getConsumerDependency: () => undefined });
        const result = ctrl.getConsumer('nonexistent-consumer');
        strict_1.default.equal(result, undefined);
    });
    (0, node_test_1.default)('getConsumer handles consumer key with hyphens', () => {
        const ctrl = makeController({
            getConsumerDependency: () => ({ key: 'admin-workbench' })
        });
        const result = ctrl.getConsumer('admin-workbench');
        strict_1.default.equal(result.key, 'admin-workbench');
    });
});
// ──────────── 边界测试 ────────────
(0, node_test_1.describe)('边界与异常测试', () => {
    (0, node_test_1.default)('getOperationsOverview with all undefined filters', async () => {
        let capturedFilter = null;
        const ctrl = makeController({
            getOperationsOverview: async (_ctx, filter) => {
                capturedFilter = filter;
                return {};
            }
        });
        await ctrl.getOperationsOverview(tenantCtx);
        strict_1.default.deepStrictEqual(capturedFilter, {
            focus: undefined,
            state: undefined,
            callbackStatus: undefined,
            riskLevel: undefined,
            replayable: undefined,
            stalledOnly: undefined
        });
    });
    (0, node_test_1.default)('getOperationsOverview with mixed boolean strings', async () => {
        let capturedFilter = null;
        const ctrl = makeController({
            getOperationsOverview: async (_ctx, filter) => {
                capturedFilter = filter;
                return {};
            }
        });
        // empty string should be undefined
        await ctrl.getOperationsOverview(tenantCtx, undefined, undefined, undefined, undefined, '', '');
        strict_1.default.equal(capturedFilter.replayable, undefined);
        strict_1.default.equal(capturedFilter.stalledOnly, undefined);
    });
    (0, node_test_1.default)('getOperationsAlerts with undefined tenantContext', async () => {
        const ctrl = makeController({
            getOperationsAlerts: async () => []
        });
        const result = await ctrl.getOperationsAlerts(undefined);
        strict_1.default.ok(Array.isArray(result));
    });
    (0, node_test_1.default)('getBootstrap preserves blueprint keys alongside tenantContext', () => {
        const blueprint = {
            generatedAt: '2026-06-23',
            version: '1.0.0',
            capabilities: ['trust', 'identity']
        };
        const ctrl = makeController({ getBlueprint: () => blueprint });
        const result = ctrl.getBootstrap(tenantCtx);
        strict_1.default.equal(result.version, '1.0.0');
        strict_1.default.ok(Array.isArray(result.capabilities));
        strict_1.default.deepStrictEqual(result.tenantContext, tenantCtx);
    });
});
//# sourceMappingURL=foundation.controller.test.js.map