"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const analytics_contract_1 = require("./analytics.contract");
const analytics_entity_1 = require("./analytics.entity");
// ─── toOperationSnapshotContract ───
(0, node_test_1.describe)('toOperationSnapshotContract()', () => {
    const fullSnapshot = {
        tenantId: 't-001',
        scope: analytics_entity_1.AnalyticsScope.Tenant,
        brandId: 'b-001',
        storeId: 's-001',
        generatedAt: '2026-06-23T06:00:00Z',
        groups: [
            {
                groupKey: 'orders',
                groupLabel: '订单与支付',
                metrics: [
                    {
                        key: 'settlementCount',
                        label: '结算笔数',
                        value: 120,
                        unit: '笔'
                    },
                    {
                        key: 'settlementSuccessRate',
                        label: '结算成功率',
                        value: 98.5,
                        unit: '%',
                        ratio: 98.5,
                        trend: 'UP'
                    }
                ]
            }
        ],
        totals: [
            {
                key: 'totalSettlements',
                label: '总结算笔数',
                value: 120,
                unit: '笔',
                trend: 'UP'
            }
        ]
    };
    (0, node_test_1.test)('maps full OperationSnapshot to contract', () => {
        const contract = (0, analytics_contract_1.toOperationSnapshotContract)(fullSnapshot);
        strict_1.default.equal(contract.tenantId, 't-001');
        strict_1.default.equal(contract.scope, analytics_entity_1.AnalyticsScope.Tenant);
        strict_1.default.equal(contract.brandId, 'b-001');
        strict_1.default.equal(contract.storeId, 's-001');
        strict_1.default.equal(contract.generatedAt, '2026-06-23T06:00:00Z');
    });
    (0, node_test_1.test)('maps groups correctly', () => {
        const contract = (0, analytics_contract_1.toOperationSnapshotContract)(fullSnapshot);
        strict_1.default.equal(contract.groups.length, 1);
        strict_1.default.equal(contract.groups[0].groupKey, 'orders');
        strict_1.default.equal(contract.groups[0].groupLabel, '订单与支付');
        strict_1.default.equal(contract.groups[0].metrics.length, 2);
        strict_1.default.equal(contract.groups[0].metrics[0].key, 'settlementCount');
        strict_1.default.equal(contract.groups[0].metrics[0].value, 120);
    });
    (0, node_test_1.test)('preserves metric optional fields (ratio, trend)', () => {
        const contract = (0, analytics_contract_1.toOperationSnapshotContract)(fullSnapshot);
        strict_1.default.equal(contract.groups[0].metrics[1].ratio, 98.5);
        strict_1.default.equal(contract.groups[0].metrics[1].trend, 'UP');
    });
    (0, node_test_1.test)('maps totals correctly', () => {
        const contract = (0, analytics_contract_1.toOperationSnapshotContract)(fullSnapshot);
        strict_1.default.equal(contract.totals.length, 1);
        strict_1.default.equal(contract.totals[0].key, 'totalSettlements');
        strict_1.default.equal(contract.totals[0].value, 120);
        strict_1.default.equal(contract.totals[0].trend, 'UP');
    });
    (0, node_test_1.test)('contract returns independent copy (not same reference)', () => {
        const contract1 = (0, analytics_contract_1.toOperationSnapshotContract)(fullSnapshot);
        const contract2 = (0, analytics_contract_1.toOperationSnapshotContract)(fullSnapshot);
        // Deep structural equal but separate objects
        strict_1.default.deepStrictEqual(contract1, contract2);
    });
    (0, node_test_1.test)('maps minimal snapshot (no optional fields)', () => {
        const minimal = {
            tenantId: 't-min',
            scope: analytics_entity_1.AnalyticsScope.Brand,
            generatedAt: '2026-06-23T06:00:00Z',
            groups: [
                {
                    groupKey: 'loyalty',
                    groupLabel: '积分与会员',
                    metrics: [
                        {
                            key: 'pointsNet',
                            label: '积分净流',
                            value: 0,
                            unit: '分'
                        }
                    ]
                }
            ],
            totals: []
        };
        const contract = (0, analytics_contract_1.toOperationSnapshotContract)(minimal);
        strict_1.default.equal(contract.tenantId, 't-min');
        strict_1.default.equal(contract.scope, analytics_entity_1.AnalyticsScope.Brand);
        strict_1.default.equal(contract.brandId, undefined);
        strict_1.default.equal(contract.storeId, undefined);
        strict_1.default.equal(contract.groups.length, 1);
        strict_1.default.equal(contract.totals.length, 0);
    });
    (0, node_test_1.test)('maps Store scope snapshot', () => {
        const storeSnapshot = {
            tenantId: 't-store',
            scope: analytics_entity_1.AnalyticsScope.Store,
            storeId: 's-100',
            generatedAt: '2026-06-23T06:00:00Z',
            groups: [
                {
                    groupKey: 'orders',
                    groupLabel: '订单与支付',
                    metrics: [
                        {
                            key: 'settlementCount',
                            label: '结算笔数',
                            value: 45,
                            unit: '笔'
                        }
                    ]
                }
            ],
            totals: [
                {
                    key: 'totalSettlements',
                    label: '总结算笔数',
                    value: 45,
                    unit: '笔'
                }
            ]
        };
        const contract = (0, analytics_contract_1.toOperationSnapshotContract)(storeSnapshot);
        strict_1.default.equal(contract.scope, analytics_entity_1.AnalyticsScope.Store);
        strict_1.default.equal(contract.storeId, 's-100');
        strict_1.default.equal(contract.groups.length, 1);
        strict_1.default.equal(contract.totals.length, 1);
    });
    (0, node_test_1.test)('handles DOWN trend metric', () => {
        const snapshot = {
            tenantId: 't-down',
            scope: analytics_entity_1.AnalyticsScope.Tenant,
            generatedAt: '2026-06-23T06:00:00Z',
            groups: [
                {
                    groupKey: 'loyalty',
                    groupLabel: '积分与会员',
                    metrics: [
                        {
                            key: 'pointsNet',
                            label: '积分净流',
                            value: -500,
                            unit: '分',
                            trend: 'DOWN'
                        }
                    ]
                }
            ],
            totals: []
        };
        const contract = (0, analytics_contract_1.toOperationSnapshotContract)(snapshot);
        strict_1.default.equal(contract.groups[0].metrics[0].trend, 'DOWN');
        strict_1.default.equal(contract.groups[0].metrics[0].value, -500);
    });
    (0, node_test_1.test)('handles FLAT trend metric', () => {
        const snapshot = {
            tenantId: 't-flat',
            scope: analytics_entity_1.AnalyticsScope.Tenant,
            generatedAt: '2026-06-23T06:00:00Z',
            groups: [
                {
                    groupKey: 'orders',
                    groupLabel: '订单与支付',
                    metrics: [
                        {
                            key: 'settlementCount',
                            label: '结算笔数',
                            value: 120,
                            unit: '笔',
                            trend: 'FLAT'
                        }
                    ]
                }
            ],
            totals: []
        };
        const contract = (0, analytics_contract_1.toOperationSnapshotContract)(snapshot);
        strict_1.default.equal(contract.groups[0].metrics[0].trend, 'FLAT');
    });
});
// ─── toDiagnosticContract ───
(0, node_test_1.describe)('toDiagnosticContract()', () => {
    const fullDiagnostic = {
        diagnosticId: 'diag-payment-low-t-001-2026-06-23T06:00:00Z',
        ruleId: 'payment-success-rate-low',
        tenantContext: {
            tenantId: 't-001',
            brandId: 'b-001',
            storeId: 's-001'
        },
        scope: analytics_entity_1.AnalyticsScope.Tenant,
        category: analytics_entity_1.DiagnosticCategory.PaymentHealth,
        severity: analytics_entity_1.DiagnosticSeverity.Critical,
        title: '支付成功率低于健康线',
        summary: '支付成功率低于健康线',
        evidence: {
            settlementCount: 100,
            successCount: 65,
            successRate: 65
        },
        recommendations: [
            {
                actionCode: 'inspect-payment-gateway',
                description: '检查 LYT 网关连通性与签名校验失败计数',
                priority: 100
            },
            {
                actionCode: 'launch-blindbox-promo',
                description: '为转化偏低的盲盒 SKU 上线专项促销或增发低门槛券',
                suggestedCampaignKind: 'BLINDBOX_PROMO',
                priority: 80
            }
        ],
        generatedAt: '2026-06-23T06:00:00Z'
    };
    (0, node_test_1.test)('maps full Diagnostic to DiagnosticContract', () => {
        const contract = (0, analytics_contract_1.toDiagnosticContract)(fullDiagnostic);
        strict_1.default.equal(contract.diagnosticId, 'diag-payment-low-t-001-2026-06-23T06:00:00Z');
        strict_1.default.equal(contract.ruleId, 'payment-success-rate-low');
        strict_1.default.equal(contract.tenantId, 't-001');
        strict_1.default.equal(contract.brandId, 'b-001');
        strict_1.default.equal(contract.storeId, 's-001');
        strict_1.default.equal(contract.scope, analytics_entity_1.AnalyticsScope.Tenant);
        strict_1.default.equal(contract.category, analytics_entity_1.DiagnosticCategory.PaymentHealth);
        strict_1.default.equal(contract.severity, analytics_entity_1.DiagnosticSeverity.Critical);
        strict_1.default.equal(contract.title, '支付成功率低于健康线');
        strict_1.default.equal(contract.summary, '支付成功率低于健康线');
        strict_1.default.equal(contract.generatedAt, '2026-06-23T06:00:00Z');
    });
    (0, node_test_1.test)('flattens tenantContext into top-level tenantId/brandId/storeId', () => {
        const contract = (0, analytics_contract_1.toDiagnosticContract)(fullDiagnostic);
        // tenantContext nesting is gone in the contract
        strict_1.default.ok(!('tenantContext' in contract));
        strict_1.default.equal(contract.tenantId, 't-001');
        strict_1.default.equal(contract.brandId, 'b-001');
        strict_1.default.equal(contract.storeId, 's-001');
    });
    (0, node_test_1.test)('maps evidence as-is', () => {
        const contract = (0, analytics_contract_1.toDiagnosticContract)(fullDiagnostic);
        strict_1.default.deepEqual(contract.evidence, {
            settlementCount: 100,
            successCount: 65,
            successRate: 65
        });
    });
    (0, node_test_1.test)('maps recommendations', () => {
        const contract = (0, analytics_contract_1.toDiagnosticContract)(fullDiagnostic);
        strict_1.default.equal(contract.recommendations.length, 2);
        strict_1.default.equal(contract.recommendations[0].actionCode, 'inspect-payment-gateway');
        strict_1.default.equal(contract.recommendations[0].priority, 100);
        strict_1.default.equal(contract.recommendations[1].actionCode, 'launch-blindbox-promo');
        strict_1.default.equal(contract.recommendations[1].priority, 80);
        strict_1.default.equal(contract.recommendations[1].suggestedCampaignKind, 'BLINDBOX_PROMO');
    });
    (0, node_test_1.test)('maps diagnostic with minimal tenantContext (tenantId only)', () => {
        const minimalDiag = {
            diagnosticId: 'diag-minimal-001',
            ruleId: 'no-settlement-activity',
            tenantContext: { tenantId: 't-mid' },
            scope: analytics_entity_1.AnalyticsScope.Tenant,
            category: analytics_entity_1.DiagnosticCategory.MemberActivity,
            severity: analytics_entity_1.DiagnosticSeverity.Warning,
            title: '结算活跃度静默',
            summary: '结算活跃度静默',
            evidence: { settlementCount: 0 },
            recommendations: [
                {
                    actionCode: 'launch-re-engagement',
                    description: '对最近无结算的活跃会员发起回流激励活动',
                    suggestedCampaignKind: 'RE_ENGAGEMENT',
                    priority: 60
                }
            ],
            generatedAt: '2026-06-23T06:00:00Z'
        };
        const contract = (0, analytics_contract_1.toDiagnosticContract)(minimalDiag);
        strict_1.default.equal(contract.tenantId, 't-mid');
        strict_1.default.equal(contract.brandId, undefined);
        strict_1.default.equal(contract.storeId, undefined);
        strict_1.default.equal(contract.recommendations.length, 1);
        strict_1.default.equal(contract.recommendations[0].suggestedCampaignKind, 'RE_ENGAGEMENT');
    });
    (0, node_test_1.test)('maps WARNING severity diagnostic', () => {
        const warningDiag = {
            diagnosticId: 'diag-coupon-low',
            ruleId: 'coupon-quota-near-exhaustion',
            tenantContext: { tenantId: 't-warn' },
            scope: analytics_entity_1.AnalyticsScope.Brand,
            category: analytics_entity_1.DiagnosticCategory.CouponPerformance,
            severity: analytics_entity_1.DiagnosticSeverity.Warning,
            title: '券计划额度接近耗尽',
            summary: '券计划额度接近耗尽',
            evidence: {
                exhaustedPlanIds: ['cp-1', 'cp-2'],
                exhaustedCodes: ['CP01', 'CP02']
            },
            recommendations: [
                {
                    actionCode: 'restock-coupon-quota',
                    description: '为额度告急的券计划补充配额或结束计划',
                    priority: 70
                }
            ],
            generatedAt: '2026-06-23T06:00:00Z'
        };
        const contract = (0, analytics_contract_1.toDiagnosticContract)(warningDiag);
        strict_1.default.equal(contract.severity, analytics_entity_1.DiagnosticSeverity.Warning);
        strict_1.default.equal(contract.category, analytics_entity_1.DiagnosticCategory.CouponPerformance);
        strict_1.default.equal(contract.scope, analytics_entity_1.AnalyticsScope.Brand);
    });
    (0, node_test_1.test)('maps INFO severity diagnostic', () => {
        const infoDiag = {
            diagnosticId: 'diag-info',
            ruleId: 'member-activity-thinning',
            tenantContext: { tenantId: 't-info' },
            scope: analytics_entity_1.AnalyticsScope.Tenant,
            category: analytics_entity_1.DiagnosticCategory.MemberActivity,
            severity: analytics_entity_1.DiagnosticSeverity.Info,
            title: '会员活动节奏稀疏',
            summary: '会员活动节奏稀疏',
            evidence: { settlementCount: 1, couponRedemptionCount: 0, pointsOut: 0 },
            recommendations: [
                {
                    actionCode: 'increase-touchpoint-frequency',
                    description: '增加导购触达节奏或推送积分翻倍激励',
                    suggestedCampaignKind: 'POINTS_AWARD',
                    priority: 40
                }
            ],
            generatedAt: '2026-06-23T06:00:00Z'
        };
        const contract = (0, analytics_contract_1.toDiagnosticContract)(infoDiag);
        strict_1.default.equal(contract.severity, analytics_entity_1.DiagnosticSeverity.Info);
        strict_1.default.equal(contract.recommendations[0].suggestedCampaignKind, 'POINTS_AWARD');
    });
});
// ─── toDiagnosticRecommendationContract ───
(0, node_test_1.describe)('toDiagnosticRecommendationContract()', () => {
    (0, node_test_1.test)('maps full recommendation', () => {
        const rec = {
            actionCode: 'inspect-payment-gateway',
            description: '检查 LYT 网关连通性与签名校验失败计数',
            priority: 100
        };
        const contract = (0, analytics_contract_1.toDiagnosticRecommendationContract)(rec);
        strict_1.default.equal(contract.actionCode, 'inspect-payment-gateway');
        strict_1.default.equal(contract.description, '检查 LYT 网关连通性与签名校验失败计数');
        strict_1.default.equal(contract.priority, 100);
        strict_1.default.equal(contract.suggestedCampaignKind, undefined);
    });
    (0, node_test_1.test)('maps recommendation with campaign kind', () => {
        const rec = {
            actionCode: 'launch-blindbox-promo',
            description: '为转化偏低的盲盒 SKU 上线专项促销',
            suggestedCampaignKind: 'BLINDBOX_PROMO',
            priority: 80
        };
        const contract = (0, analytics_contract_1.toDiagnosticRecommendationContract)(rec);
        strict_1.default.equal(contract.actionCode, 'launch-blindbox-promo');
        strict_1.default.equal(contract.suggestedCampaignKind, 'BLINDBOX_PROMO');
        strict_1.default.equal(contract.priority, 80);
    });
    (0, node_test_1.test)('maps RE_ENGAGEMENT campaign kind', () => {
        const rec = {
            actionCode: 'launch-re-engagement',
            description: '对最近无结算的活跃会员发起回流激励活动',
            suggestedCampaignKind: 'RE_ENGAGEMENT',
            priority: 60
        };
        const contract = (0, analytics_contract_1.toDiagnosticRecommendationContract)(rec);
        strict_1.default.equal(contract.suggestedCampaignKind, 'RE_ENGAGEMENT');
    });
    (0, node_test_1.test)('maps POINTS_AWARD campaign kind', () => {
        const rec = {
            actionCode: 'increase-touchpoint-frequency',
            description: '增加导购触达节奏',
            suggestedCampaignKind: 'POINTS_AWARD',
            priority: 40
        };
        const contract = (0, analytics_contract_1.toDiagnosticRecommendationContract)(rec);
        strict_1.default.equal(contract.suggestedCampaignKind, 'POINTS_AWARD');
    });
    (0, node_test_1.test)('maps COUPON_ISSUE campaign kind', () => {
        const rec = {
            actionCode: 'restock-coupon-quota',
            description: '为额度告急的券计划补充配额',
            suggestedCampaignKind: 'COUPON_ISSUE',
            priority: 70
        };
        const contract = (0, analytics_contract_1.toDiagnosticRecommendationContract)(rec);
        strict_1.default.equal(contract.suggestedCampaignKind, 'COUPON_ISSUE');
    });
});
// ─── toAnalyticsBootstrapContract ───
(0, node_test_1.describe)('toAnalyticsBootstrapContract()', () => {
    const snapshot = {
        tenantId: 't-001',
        scope: analytics_entity_1.AnalyticsScope.Tenant,
        generatedAt: '2026-06-23T06:00:00Z',
        groups: [
            {
                groupKey: 'orders',
                groupLabel: '订单与支付',
                metrics: [
                    {
                        key: 'settlementCount',
                        label: '结算笔数',
                        value: 120,
                        unit: '笔'
                    }
                ]
            }
        ],
        totals: [
            {
                key: 'totalSettlements',
                label: '总结算笔数',
                value: 120,
                unit: '笔'
            }
        ]
    };
    const diagnostics = [
        {
            diagnosticId: 'diag-payment-low',
            ruleId: 'payment-success-rate-low',
            tenantContext: { tenantId: 't-001' },
            scope: analytics_entity_1.AnalyticsScope.Tenant,
            category: analytics_entity_1.DiagnosticCategory.PaymentHealth,
            severity: analytics_entity_1.DiagnosticSeverity.Critical,
            title: '支付成功率低于健康线',
            summary: '支付成功率低于健康线',
            evidence: { successRate: 65 },
            recommendations: [
                {
                    actionCode: 'inspect-payment-gateway',
                    description: '检查 LYT 网关',
                    priority: 100
                }
            ],
            generatedAt: '2026-06-23T06:00:00Z'
        }
    ];
    const recommendations = [
        {
            actionCode: 'inspect-payment-gateway',
            description: '检查 LYT 网关',
            priority: 100
        }
    ];
    (0, node_test_1.test)('combines snapshot, diagnostics, and recommendations', () => {
        const contract = (0, analytics_contract_1.toAnalyticsBootstrapContract)({
            snapshot,
            diagnostics,
            recommendations
        });
        strict_1.default.ok(contract.snapshot);
        strict_1.default.ok(contract.diagnostics);
        strict_1.default.ok(contract.recommendations);
        strict_1.default.equal(contract.generatedAt, '2026-06-23T06:00:00Z');
    });
    (0, node_test_1.test)('snapshot is mapped via toOperationSnapshotContract', () => {
        const contract = (0, analytics_contract_1.toAnalyticsBootstrapContract)({
            snapshot,
            diagnostics,
            recommendations
        });
        strict_1.default.equal(contract.snapshot.tenantId, 't-001');
        strict_1.default.equal(contract.snapshot.groups.length, 1);
        strict_1.default.equal(contract.snapshot.totals.length, 1);
    });
    (0, node_test_1.test)('diagnostics are mapped via toDiagnosticContract', () => {
        const contract = (0, analytics_contract_1.toAnalyticsBootstrapContract)({
            snapshot,
            diagnostics,
            recommendations
        });
        strict_1.default.equal(contract.diagnostics.length, 1);
        strict_1.default.equal(contract.diagnostics[0].diagnosticId, 'diag-payment-low');
        strict_1.default.equal(contract.diagnostics[0].tenantId, 't-001');
    });
    (0, node_test_1.test)('recommendations are mapped via toDiagnosticRecommendationContract', () => {
        const contract = (0, analytics_contract_1.toAnalyticsBootstrapContract)({
            snapshot,
            diagnostics,
            recommendations
        });
        strict_1.default.equal(contract.recommendations.length, 1);
        strict_1.default.equal(contract.recommendations[0].actionCode, 'inspect-payment-gateway');
        strict_1.default.equal(contract.recommendations[0].priority, 100);
    });
    (0, node_test_1.test)('handles empty diagnostics', () => {
        const contract = (0, analytics_contract_1.toAnalyticsBootstrapContract)({
            snapshot,
            diagnostics: [],
            recommendations: []
        });
        strict_1.default.equal(contract.diagnostics.length, 0);
        strict_1.default.equal(contract.recommendations.length, 0);
    });
    (0, node_test_1.test)('handles multiple diagnostics', () => {
        const multiDiags = [
            {
                diagnosticId: 'diag-1',
                ruleId: 'payment-success-rate-low',
                tenantContext: { tenantId: 't-001' },
                scope: analytics_entity_1.AnalyticsScope.Tenant,
                category: analytics_entity_1.DiagnosticCategory.PaymentHealth,
                severity: analytics_entity_1.DiagnosticSeverity.Critical,
                title: '支付成功率低于健康线',
                summary: '支付成功率低于健康线',
                evidence: {},
                recommendations: [
                    { actionCode: 'act-1', description: 'desc-1', priority: 100 }
                ],
                generatedAt: '2026-06-23T06:00:00Z'
            },
            {
                diagnosticId: 'diag-2',
                ruleId: 'no-settlement-activity',
                tenantContext: { tenantId: 't-001' },
                scope: analytics_entity_1.AnalyticsScope.Tenant,
                category: analytics_entity_1.DiagnosticCategory.MemberActivity,
                severity: analytics_entity_1.DiagnosticSeverity.Warning,
                title: '结算活跃度静默',
                summary: '结算活跃度静默',
                evidence: {},
                recommendations: [
                    { actionCode: 'act-2', description: 'desc-2', priority: 60 }
                ],
                generatedAt: '2026-06-23T06:00:00Z'
            }
        ];
        const contract = (0, analytics_contract_1.toAnalyticsBootstrapContract)({
            snapshot,
            diagnostics: multiDiags,
            recommendations: []
        });
        strict_1.default.equal(contract.diagnostics.length, 2);
        strict_1.default.equal(contract.diagnostics[0].diagnosticId, 'diag-1');
        strict_1.default.equal(contract.diagnostics[1].diagnosticId, 'diag-2');
    });
    (0, node_test_1.test)('handles multiple recommendations from different diagnostics', () => {
        const multiDiags = [
            {
                diagnosticId: 'diag-1',
                ruleId: 'payment-success-rate-low',
                tenantContext: { tenantId: 't-001' },
                scope: analytics_entity_1.AnalyticsScope.Tenant,
                category: analytics_entity_1.DiagnosticCategory.PaymentHealth,
                severity: analytics_entity_1.DiagnosticSeverity.Critical,
                title: '支付成功率低于健康线',
                summary: '支付成功率低于健康线',
                evidence: {},
                recommendations: [
                    { actionCode: 'act-1', description: 'desc-1', priority: 100 },
                    { actionCode: 'act-2', description: 'desc-2', priority: 90 }
                ],
                generatedAt: '2026-06-23T06:00:00Z'
            }
        ];
        const multiRecs = [
            { actionCode: 'act-1', description: 'desc-1', priority: 100 },
            { actionCode: 'act-2', description: 'desc-2', priority: 90 }
        ];
        const contract = (0, analytics_contract_1.toAnalyticsBootstrapContract)({
            snapshot,
            diagnostics: multiDiags,
            recommendations: multiRecs
        });
        strict_1.default.equal(contract.recommendations.length, 2);
        strict_1.default.equal(contract.recommendations[0].priority, 100);
        strict_1.default.equal(contract.recommendations[1].priority, 90);
    });
});
//# sourceMappingURL=analytics.contract.test.js.map