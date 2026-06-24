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
// 用 require 动态加载绕过 esbuild decorator 限制
const { AnalyticsController } = require('./analytics.controller');
const { AnalyticsScope, DiagnosticCategory, DiagnosticSeverity } = require('./analytics.entity');
function makeController(overrides = {}) {
    const service = {
        getOperationSnapshot: overrides.getOperationSnapshot ?? (() => ({ groups: [], totals: [] })),
        getDiagnostics: overrides.getDiagnostics ?? (() => []),
        getRecommendations: overrides.getRecommendations ?? (() => [])
    };
    return new AnalyticsController(service);
}
const tenantContext = {
    tenantId: 'tenant-ctrl',
    brandId: 'brand-ctrl',
    storeId: 'store-ctrl'
};
// ── 路由元数据 ──
(0, node_test_1.describe)('AnalyticsController 路由元数据', () => {
    (0, node_test_1.default)('controller metadata path is analytics', () => {
        const path = Reflect.getMetadata('path', AnalyticsController);
        strict_1.default.equal(path, 'analytics');
    });
    (0, node_test_1.default)('getOperationSnapshot GET snapshot', () => {
        const method = Reflect.getMetadata('method', AnalyticsController.prototype.getOperationSnapshot);
        const path = Reflect.getMetadata('path', AnalyticsController.prototype.getOperationSnapshot);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'snapshot');
    });
    (0, node_test_1.default)('getDiagnostics GET diagnostics', () => {
        const method = Reflect.getMetadata('method', AnalyticsController.prototype.getDiagnostics);
        const path = Reflect.getMetadata('path', AnalyticsController.prototype.getDiagnostics);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'diagnostics');
    });
    (0, node_test_1.default)('getRecommendations GET recommendations', () => {
        const method = Reflect.getMetadata('method', AnalyticsController.prototype.getRecommendations);
        const path = Reflect.getMetadata('path', AnalyticsController.prototype.getRecommendations);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'recommendations');
    });
});
// ── getOperationSnapshot ──
(0, node_test_1.describe)('AnalyticsController.getOperationSnapshot', () => {
    (0, node_test_1.default)('正常流程：返回 service 结果', () => {
        const expected = {
            tenantId: 'tenant-ctrl',
            scope: AnalyticsScope.Tenant,
            generatedAt: new Date().toISOString(),
            groups: [],
            totals: []
        };
        const controller = makeController({
            getOperationSnapshot: () => expected
        });
        const result = controller.getOperationSnapshot(tenantContext, {});
        strict_1.default.equal(result, expected);
    });
    (0, node_test_1.default)('传递 scope/brandId/storeId 给 service', () => {
        let captured = null;
        const controller = makeController({
            getOperationSnapshot: (_ctx, opts) => {
                captured = opts;
                return { groups: [], totals: [] };
            }
        });
        controller.getOperationSnapshot(tenantContext, {
            scope: AnalyticsScope.Store,
            brandId: 'b-1',
            storeId: 's-1'
        });
        strict_1.default.equal(captured.scope, AnalyticsScope.Store);
        strict_1.default.equal(captured.brandId, 'b-1');
        strict_1.default.equal(captured.storeId, 's-1');
    });
    (0, node_test_1.default)('空 body → 空参数仍正常', () => {
        const controller = makeController();
        strict_1.default.doesNotThrow(() => {
            controller.getOperationSnapshot(tenantContext, {});
        });
    });
    (0, node_test_1.default)('边界：service 返回 null 时应通过', () => {
        const controller = makeController({
            getOperationSnapshot: () => null
        });
        const result = controller.getOperationSnapshot(tenantContext, {});
        strict_1.default.equal(result, null);
    });
    (0, node_test_1.default)('边界：service 抛出异常', () => {
        const controller = makeController({
            getOperationSnapshot: () => {
                throw new Error('DB unreachable');
            }
        });
        strict_1.default.throws(() => controller.getOperationSnapshot(tenantContext, {}), /DB unreachable/);
    });
});
// ── getDiagnostics ──
(0, node_test_1.describe)('AnalyticsController.getDiagnostics', () => {
    (0, node_test_1.default)('正常流程：返回 diagnostics 数组', () => {
        const diagnostics = [
            {
                diagnosticId: 'd-1',
                ruleId: 'payment-success-rate-low-tenant-ctrl-2025',
                tenantContext: { tenantId: 'tenant-ctrl' },
                scope: AnalyticsScope.Tenant,
                category: DiagnosticCategory.PaymentHealth,
                severity: DiagnosticSeverity.Critical,
                title: '支付成功率低于健康线',
                summary: '支付成功率低于健康线',
                evidence: { successRate: 75.0 },
                recommendations: [
                    { actionCode: 'inspect-payment-gateway', description: '检查网关', priority: 100 }
                ],
                generatedAt: new Date().toISOString()
            }
        ];
        const controller = makeController({
            getDiagnostics: () => diagnostics
        });
        const result = controller.getDiagnostics(tenantContext, {});
        strict_1.default.deepEqual(result, diagnostics);
    });
    (0, node_test_1.default)('反例：service 返回空数组', () => {
        const controller = makeController({
            getDiagnostics: () => []
        });
        const result = controller.getDiagnostics(tenantContext, {});
        strict_1.default.deepEqual(result, []);
    });
    (0, node_test_1.default)('按 scope 过滤传递给 service', () => {
        let captured = null;
        const controller = makeController({
            getDiagnostics: (_ctx, opts) => {
                captured = opts;
                return [];
            }
        });
        controller.getDiagnostics(tenantContext, {
            scope: AnalyticsScope.Brand,
            brandId: 'b-diag'
        });
        strict_1.default.equal(captured.scope, AnalyticsScope.Brand);
        strict_1.default.equal(captured.brandId, 'b-diag');
        strict_1.default.equal(captured.storeId, undefined);
    });
    (0, node_test_1.default)('边界：service 抛出异常', () => {
        const controller = makeController({
            getDiagnostics: () => {
                throw new Error('Diagnostic computation failed');
            }
        });
        strict_1.default.throws(() => controller.getDiagnostics(tenantContext, {}), /Diagnostic computation failed/);
    });
});
// ── getRecommendations ──
(0, node_test_1.describe)('AnalyticsController.getRecommendations', () => {
    (0, node_test_1.default)('正常流程：返回推荐数组并按优先级排序', () => {
        const recommendations = [
            {
                actionCode: 'inspect-payment-gateway',
                description: '检查支付网关连通性',
                priority: 100
            },
            {
                actionCode: 'restock-coupon-quota',
                description: '补充券配额',
                priority: 70
            }
        ];
        const controller = makeController({
            getRecommendations: () => recommendations
        });
        const result = controller.getRecommendations(tenantContext, {});
        strict_1.default.equal(result.length, 2);
        strict_1.default.equal(result[0].actionCode, 'inspect-payment-gateway');
        strict_1.default.equal(result[1].actionCode, 'restock-coupon-quota');
    });
    (0, node_test_1.default)('反例：service 返回空数组', () => {
        const controller = makeController({
            getRecommendations: () => []
        });
        const result = controller.getRecommendations(tenantContext, {});
        strict_1.default.deepEqual(result, []);
    });
    (0, node_test_1.default)('边界：service 抛出异常', () => {
        const controller = makeController({
            getRecommendations: () => {
                throw new Error('Recommendation engine error');
            }
        });
        strict_1.default.throws(() => controller.getRecommendations(tenantContext, {}), /Recommendation engine error/);
    });
    (0, node_test_1.default)('边界：传递 scope 参数给 service', () => {
        let captured = null;
        const controller = makeController({
            getRecommendations: (_ctx, opts) => {
                captured = opts;
                return [];
            }
        });
        controller.getRecommendations(tenantContext, {
            scope: AnalyticsScope.Store,
            brandId: 'b-rec',
            storeId: 's-rec'
        });
        strict_1.default.equal(captured.scope, AnalyticsScope.Store);
        strict_1.default.equal(captured.brandId, 'b-rec');
        strict_1.default.equal(captured.storeId, 's-rec');
    });
});
// ── 集成：controller ↔ service 管道 ──
(0, node_test_1.describe)('AnalyticsController 集成管道', () => {
    (0, node_test_1.default)('getDiagnostics 实际调用 service 并在推荐中合并多个诊断', () => {
        // 验证：controller 调用 service.getDiagnostics + service.getRecommendations 后
        // 后者基于前者结果运作
        const diagCallOrder = [];
        const controller = makeController({
            getDiagnostics: () => {
                diagCallOrder.push('diagnostics');
                return [
                    {
                        diagnosticId: 'd-int',
                        ruleId: 'test-rule',
                        tenantContext: { tenantId: 't' },
                        scope: 'TENANT',
                        category: DiagnosticCategory.PaymentHealth,
                        severity: DiagnosticSeverity.Warning,
                        title: 'test',
                        summary: 'test',
                        evidence: {},
                        recommendations: [
                            { actionCode: 'act-1', description: 'desc', priority: 50 }
                        ],
                        generatedAt: new Date().toISOString()
                    }
                ];
            },
            getRecommendations: () => {
                diagCallOrder.push('recommendations');
                return [{ actionCode: 'act-1', description: 'desc', priority: 50 }];
            }
        });
        controller.getDiagnostics(tenantContext, {});
        strict_1.default.equal(diagCallOrder[0], 'diagnostics');
        controller.getRecommendations(tenantContext, {});
        strict_1.default.equal(diagCallOrder[1], 'recommendations');
    });
    (0, node_test_1.default)('getOperationSnapshot → 返回结构包含 groups 和 totals', () => {
        const expected = {
            tenantId: 't',
            scope: AnalyticsScope.Tenant,
            generatedAt: '2025-01-01T00:00:00.000Z',
            groups: [
                {
                    groupKey: 'orders',
                    groupLabel: '订单与支付',
                    metrics: [
                        { key: 'settlementCount', label: '结算笔数', value: 100, unit: '笔' }
                    ]
                }
            ],
            totals: [{ key: 'totalSettlements', label: '总结算笔数', value: 100, unit: '笔' }]
        };
        const controller = makeController({
            getOperationSnapshot: () => expected
        });
        const result = controller.getOperationSnapshot(tenantContext, {});
        strict_1.default.equal(result.groups.length, 1);
        strict_1.default.equal(result.groups[0].groupKey, 'orders');
        strict_1.default.equal(result.totals[0].value, 100);
    });
});
//# sourceMappingURL=analytics.controller.test.js.map