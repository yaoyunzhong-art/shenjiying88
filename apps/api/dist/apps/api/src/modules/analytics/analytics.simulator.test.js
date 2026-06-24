"use strict";
/**
 * Analytics Simulator Test
 *
 * 模拟分析诊断系统的场景覆盖：
 * - 运营快照生成 (getOperationSnapshot)
 * - 诊断规则触发 (getDiagnostics)
 * - 推荐聚合 (getRecommendations)
 * - 多 scope 场景 (TENANT / BRAND / STORE)
 * - 边界场景 (空数据、零结算、极端指标)
 *
 * 8 角色视角覆盖：
 *  👔店长 - 全店运营总览&异常诊断
 *  🛒前台 - 当日结算统计查看
 *  👥HR - 员工绩效与会员活跃度分析
 *  🔧安监 - 支付合规与风控诊断
 *  🎮导玩员 - 盲盒与游戏币转化分析
 *  🎯运行专员 - 运营健康检查&积压诊断
 *  🤝团建 - 团建套餐消费分析
 *  📢营销 - 券&积分活动效果分析
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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const analytics_service_1 = require("./analytics.service");
const analytics_entity_1 = require("./analytics.entity");
function makeTenantContext(overrides = {}) {
    return {
        tenantId: 't-analytics',
        brandId: 'b-analytics',
        storeId: 's-analytics',
        marketCode: 'zh-cn',
        ...overrides
    };
}
/**
 * 创建一个带有模拟 LoyaltyService 的 AnalyticsService，
 * 以便在不依赖实际 LoyaltyService 的情况下测试诊断逻辑。
 */
function makeAnalyticsService(loyaltyState) {
    const mockLoyalty = {
        getLoyaltySummary: () => ({
            settlementCount: loyaltyState.settlementCount,
            settlementSuccessCount: loyaltyState.settlementSuccessCount,
            couponRedemptionCount: loyaltyState.couponRedemptionCount,
            blindboxFulfillmentCount: loyaltyState.blindboxFulfillmentCount,
            pointsIn: loyaltyState.pointsIn,
            pointsOut: loyaltyState.pointsOut
        }),
        listCouponPlans: (() => (loyaltyState.couponPlans ?? []).map((p) => ({
            planId: p.planId,
            code: p.code,
            remainingQuota: p.remainingQuota,
            totalQuota: p.totalQuota,
            status: p.status,
            title: `计划-${p.code}`,
            description: '',
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })))
    };
    return new analytics_service_1.AnalyticsService(mockLoyalty);
}
/**
 * 健康状态的 Loyalty 数据
 */
const HEALTHY_LOYALTY = {
    settlementCount: 100,
    settlementSuccessCount: 95,
    couponRedemptionCount: 40,
    blindboxFulfillmentCount: 20,
    pointsIn: 50000,
    pointsOut: 30000
};
// ─── 角色定义 ───
const ROLES = {
    DIANZHANG: '👔店长',
    QIANTAI: '🛒前台',
    HR: '👥HR',
    ANJIAN: '🔧安监',
    DAOWAN: '🎮导玩员',
    YUNXING: '🎯运行专员',
    TUANJIAN: '🤝团建',
    YINGXIAO: '📢营销'
};
// ─── Tests ───
(0, node_test_1.describe)('Analytics Simulator', () => {
    // ──────── 👔店长 ────────
    (0, node_test_1.describe)(`${ROLES.DIANZHANG} - 全店运营总览&异常诊断`, () => {
        (0, node_test_1.default)('查看租户级运营快照包含所有分组', () => {
            const svc = makeAnalyticsService(HEALTHY_LOYALTY);
            const snapshot = svc.getOperationSnapshot(makeTenantContext());
            strict_1.default.equal(snapshot.scope, analytics_entity_1.AnalyticsScope.Tenant);
            strict_1.default.ok(snapshot.groups.length >= 2, '应包含订单与积分两个分组');
            strict_1.default.ok(snapshot.totals.length > 0, '应包含汇总指标');
            const orderGroup = snapshot.groups.find((g) => g.groupKey === 'orders');
            strict_1.default.ok(orderGroup, '应有订单分组');
            strict_1.default.ok(orderGroup.metrics.length >= 2);
        });
        (0, node_test_1.default)('支付成功率低于80%应触发Critical诊断', () => {
            const state = {
                ...HEALTHY_LOYALTY,
                settlementCount: 100,
                settlementSuccessCount: 60,
                pointsOut: 10000,
                pointsIn: 20000
            };
            const svc = makeAnalyticsService(state);
            const diagnostics = svc.getDiagnostics(makeTenantContext());
            const paymentDiag = diagnostics.find((d) => d.ruleId === 'payment-success-rate-low');
            strict_1.default.ok(paymentDiag, '应触发支付成功率低诊断');
            strict_1.default.equal(paymentDiag.severity, analytics_entity_1.DiagnosticSeverity.Critical);
            strict_1.default.ok(paymentDiag.recommendations.length > 0);
        });
        (0, node_test_1.default)('健康状态下不应有Critical诊断', () => {
            const svc = makeAnalyticsService(HEALTHY_LOYALTY);
            const diagnostics = svc.getDiagnostics(makeTenantContext());
            const criticalDiags = diagnostics.filter((d) => d.severity === analytics_entity_1.DiagnosticSeverity.Critical);
            strict_1.default.equal(criticalDiags.length, 0, '健康状态不应有Critical诊断');
        });
    });
    // ──────── 🛒前台 ────────
    (0, node_test_1.describe)(`${ROLES.QIANTAI} - 当日结算统计查看`, () => {
        (0, node_test_1.default)('查看品牌级快照获取结算数据', () => {
            const svc = makeAnalyticsService(HEALTHY_LOYALTY);
            const snapshot = svc.getOperationSnapshot(makeTenantContext(), {
                scope: analytics_entity_1.AnalyticsScope.Brand,
                brandId: 'b-analytics'
            });
            strict_1.default.equal(snapshot.scope, analytics_entity_1.AnalyticsScope.Brand);
            const settlementMetric = snapshot.totals.find((m) => m.key === 'totalSettlements');
            strict_1.default.ok(settlementMetric);
            strict_1.default.ok(settlementMetric.value > 0, '应有结算数据');
        });
        (0, node_test_1.default)('零结算时应正确显示0', () => {
            const state = {
                settlementCount: 0,
                settlementSuccessCount: 0,
                couponRedemptionCount: 0,
                blindboxFulfillmentCount: 0,
                pointsIn: 0,
                pointsOut: 0
            };
            const svc = makeAnalyticsService(state);
            const snapshot = svc.getOperationSnapshot(makeTenantContext());
            strict_1.default.equal(snapshot.totals.find((m) => m.key === 'totalSettlements').value, 0);
            strict_1.default.equal(snapshot.totals.find((m) => m.key === 'totalRedemptions').value, 0);
        });
    });
    // ──────── 👥HR ────────
    (0, node_test_1.describe)(`${ROLES.HR} - 员工绩效与会员活跃度分析`, () => {
        (0, node_test_1.default)('会员活动稀疏触发Info诊断', () => {
            const state = {
                settlementCount: 2,
                settlementSuccessCount: 2,
                couponRedemptionCount: 0,
                blindboxFulfillmentCount: 0,
                pointsIn: 0,
                pointsOut: 0
            };
            const svc = makeAnalyticsService(state);
            const diagnostics = svc.getDiagnostics(makeTenantContext());
            const thinningDiag = diagnostics.find((d) => d.ruleId === 'member-activity-thinning');
            strict_1.default.ok(thinningDiag, '应触发会员活动稀疏诊断');
            strict_1.default.equal(thinningDiag.severity, analytics_entity_1.DiagnosticSeverity.Info);
            strict_1.default.ok(thinningDiag.recommendations.some((r) => r.actionCode === 'increase-touchpoint-frequency'));
        });
        (0, node_test_1.default)('高活跃度会员无活动稀疏诊断', () => {
            const svc = makeAnalyticsService(HEALTHY_LOYALTY);
            const diagnostics = svc.getDiagnostics(makeTenantContext());
            const thinningDiag = diagnostics.find((d) => d.ruleId === 'member-activity-thinning');
            strict_1.default.equal(thinningDiag, undefined, '高活跃不应触发稀疏诊断');
        });
    });
    // ──────── 🔧安监 ────────
    (0, node_test_1.describe)(`${ROLES.ANJIAN} - 支付合规与风控诊断`, () => {
        (0, node_test_1.default)('支付失败率高触发Critical诊断并含action建议', () => {
            const state = {
                ...HEALTHY_LOYALTY,
                settlementCount: 50,
                settlementSuccessCount: 30,
                pointsOut: 10000,
                pointsIn: 20000
            };
            const svc = makeAnalyticsService(state);
            const diagnostics = svc.getDiagnostics(makeTenantContext());
            const paymentDiag = diagnostics.find((d) => d.ruleId === 'payment-success-rate-low');
            strict_1.default.ok(paymentDiag);
            strict_1.default.equal(paymentDiag.category, analytics_entity_1.DiagnosticCategory.PaymentHealth);
            strict_1.default.ok(paymentDiag.recommendations.some((r) => r.actionCode === 'inspect-payment-gateway'));
        });
        (0, node_test_1.default)('零结算不触发支付成功率诊断', () => {
            const state = {
                settlementCount: 0,
                settlementSuccessCount: 0,
                couponRedemptionCount: 0,
                blindboxFulfillmentCount: 0,
                pointsIn: 0,
                pointsOut: 0
            };
            const svc = makeAnalyticsService(state);
            const diagnostics = svc.getDiagnostics(makeTenantContext());
            const paymentDiag = diagnostics.find((d) => d.ruleId === 'payment-success-rate-low');
            strict_1.default.equal(paymentDiag, undefined, '零结算不触发支付成功率诊断');
        });
    });
    // ──────── 🎮导玩员 ────────
    (0, node_test_1.describe)(`${ROLES.DAOWAN} - 盲盒与游戏币转化分析`, () => {
        (0, node_test_1.default)('盲盒履约零但券核销多触发盲盒转化诊断', () => {
            const state = {
                ...HEALTHY_LOYALTY,
                settlementCount: 10,
                settlementSuccessCount: 10,
                blindboxFulfillmentCount: 0,
                couponRedemptionCount: 20,
                pointsOut: 10000,
                pointsIn: 20000
            };
            const svc = makeAnalyticsService(state);
            const diagnostics = svc.getDiagnostics(makeTenantContext());
            const blindboxDiag = diagnostics.find((d) => d.ruleId === 'blindbox-redemption-shortfall');
            strict_1.default.ok(blindboxDiag, '应触发盲盒履约转化诊断');
            strict_1.default.equal(blindboxDiag.category, analytics_entity_1.DiagnosticCategory.BlindboxEngagement);
            strict_1.default.ok(blindboxDiag.recommendations.some((r) => r.actionCode === 'launch-blindbox-promo'));
        });
        (0, node_test_1.default)('盲盒履约正常不触发该诊断', () => {
            const svc = makeAnalyticsService(HEALTHY_LOYALTY);
            const diagnostics = svc.getDiagnostics(makeTenantContext());
            const blindboxDiag = diagnostics.find((d) => d.ruleId === 'blindbox-redemption-shortfall');
            strict_1.default.equal(blindboxDiag, undefined, '正常履约不应触发');
        });
    });
    // ──────── 🎯运行专员 ────────
    (0, node_test_1.describe)(`${ROLES.YUNXING} - 运营健康检查&积压诊断`, () => {
        (0, node_test_1.default)('多诊断叠加按优先级排序推荐', () => {
            const state = {
                settlementCount: 20,
                settlementSuccessCount: 12,
                couponRedemptionCount: 30,
                blindboxFulfillmentCount: 0,
                pointsIn: 10000,
                pointsOut: 25000,
                couponPlans: [
                    { planId: 'plan-01', code: 'CP001', remainingQuota: 5, totalQuota: 100, status: 'ACTIVE' }
                ]
            };
            const svc = makeAnalyticsService(state);
            const recommendations = svc.getRecommendations(makeTenantContext());
            strict_1.default.ok(recommendations.length >= 2, '应有多个推荐');
            // 验证优先级排序：高优先级在前
            for (let i = 1; i < recommendations.length; i++) {
                strict_1.default.ok(recommendations[i - 1].priority >= recommendations[i].priority, `推荐应按优先级降序排列: ${recommendations[i - 1].priority} >= ${recommendations[i].priority}`);
            }
        });
        (0, node_test_1.default)('券计划额度耗尽触发诊断', () => {
            const state = {
                ...HEALTHY_LOYALTY,
                couponPlans: [
                    { planId: 'plan-exhausted', code: 'EXH01', remainingQuota: 2, totalQuota: 100, status: 'ACTIVE' }
                ]
            };
            const svc = makeAnalyticsService(state);
            const diagnostics = svc.getDiagnostics(makeTenantContext());
            const couponDiag = diagnostics.find((d) => d.ruleId === 'coupon-quota-near-exhaustion');
            strict_1.default.ok(couponDiag, '应触发券额度耗尽诊断');
            strict_1.default.ok(couponDiag.evidence.exhaustedPlanIds.includes('plan-exhausted'));
        });
        (0, node_test_1.default)('无结算活动触发静默诊断', () => {
            const state = {
                settlementCount: 0,
                settlementSuccessCount: 0,
                couponRedemptionCount: 0,
                blindboxFulfillmentCount: 0,
                pointsIn: 0,
                pointsOut: 0
            };
            const svc = makeAnalyticsService(state);
            const diagnostics = svc.getDiagnostics(makeTenantContext());
            const noActivityDiag = diagnostics.find((d) => d.ruleId === 'no-settlement-activity');
            strict_1.default.ok(noActivityDiag, '应触发结算静默诊断');
            strict_1.default.equal(noActivityDiag.category, analytics_entity_1.DiagnosticCategory.MemberActivity);
        });
    });
    // ──────── 🤝团建 ────────
    (0, node_test_1.describe)(`${ROLES.TUANJIAN} - 团建套餐消费分析`, () => {
        (0, node_test_1.default)('Store级快照精确到门店', () => {
            const svc = makeAnalyticsService(HEALTHY_LOYALTY);
            const snapshot = svc.getOperationSnapshot(makeTenantContext(), {
                scope: analytics_entity_1.AnalyticsScope.Store,
                storeId: 's-group-event'
            });
            strict_1.default.equal(snapshot.scope, analytics_entity_1.AnalyticsScope.Store);
            strict_1.default.equal(snapshot.storeId, 's-group-event');
            strict_1.default.ok(snapshot.groups.length > 0);
        });
        (0, node_test_1.default)('积分净流指标趋势正确计算', () => {
            // pointsIn > pointsOut -> UP trend
            const state = {
                ...HEALTHY_LOYALTY,
                pointsIn: 50000,
                pointsOut: 30000
            };
            const svc = makeAnalyticsService(state);
            const snapshot = svc.getOperationSnapshot(makeTenantContext());
            const loyaltyGroup = snapshot.groups.find((g) => g.groupKey === 'loyalty');
            strict_1.default.ok(loyaltyGroup);
            const pointsNet = loyaltyGroup.metrics.find((m) => m.key === 'pointsNet');
            strict_1.default.ok(pointsNet);
            strict_1.default.equal(pointsNet.trend, 'UP');
            strict_1.default.equal(pointsNet.value, 20000);
        });
        (0, node_test_1.default)('积分净流出时趋势为DOWN', () => {
            const state = {
                ...HEALTHY_LOYALTY,
                pointsIn: 10000,
                pointsOut: 30000
            };
            const svc = makeAnalyticsService(state);
            const snapshot = svc.getOperationSnapshot(makeTenantContext());
            const loyaltyGroup = snapshot.groups.find((g) => g.groupKey === 'loyalty');
            const pointsNet = loyaltyGroup.metrics.find((m) => m.key === 'pointsNet');
            strict_1.default.equal(pointsNet.trend, 'DOWN');
        });
    });
    // ──────── 📢营销 ────────
    (0, node_test_1.describe)(`${ROLES.YINGXIAO} - 券&积分活动效果分析`, () => {
        (0, node_test_1.default)('积分净流出触发高优先级诊断', () => {
            const state = {
                ...HEALTHY_LOYALTY,
                pointsIn: 10000,
                pointsOut: 30000,
                couponPlans: []
            };
            const svc = makeAnalyticsService(state);
            const diagnostics = svc.getDiagnostics(makeTenantContext());
            const outflowDiag = diagnostics.find((d) => d.ruleId === 'points-outflow-dominant');
            strict_1.default.ok(outflowDiag, '应触发积分净流出诊断');
            strict_1.default.equal(outflowDiag.severity, analytics_entity_1.DiagnosticSeverity.Critical);
            strict_1.default.equal(outflowDiag.category, analytics_entity_1.DiagnosticCategory.PointEconomy);
            strict_1.default.ok(outflowDiag.recommendations.some((r) => r.actionCode === 'rebalance-point-economy'));
        });
        (0, node_test_1.default)('券核销和盲盒数据出现在快照中', () => {
            const svc = makeAnalyticsService(HEALTHY_LOYALTY);
            const snapshot = svc.getOperationSnapshot(makeTenantContext());
            const orderGroup = snapshot.groups.find((g) => g.groupKey === 'orders');
            strict_1.default.ok(orderGroup);
            const couponMetric = orderGroup.metrics.find((m) => m.key === 'couponRedemptionCount');
            strict_1.default.ok(couponMetric);
            strict_1.default.equal(couponMetric.value, 40);
            const blindboxMetric = orderGroup.metrics.find((m) => m.key === 'blindboxFulfillmentCount');
            strict_1.default.ok(blindboxMetric);
            strict_1.default.equal(blindboxMetric.value, 20);
        });
        (0, node_test_1.default)('推荐按优先级排序后最高优先级最先', () => {
            const state = {
                settlementCount: 20,
                settlementSuccessCount: 12,
                couponRedemptionCount: 30,
                blindboxFulfillmentCount: 0,
                pointsIn: 10000,
                pointsOut: 25000,
                couponPlans: [
                    { planId: 'p1', code: 'C1', remainingQuota: 3, totalQuota: 100, status: 'ACTIVE' } // 券耗尽 -> priority 70
                ]
            };
            const svc = makeAnalyticsService(state);
            const recommendations = svc.getRecommendations(makeTenantContext());
            strict_1.default.ok(recommendations.length >= 3, '应有多个推荐');
            // 最高优先级应为100 (支付网关检查)
            strict_1.default.equal(recommendations[0].priority, 100);
            strict_1.default.equal(recommendations[0].actionCode, 'inspect-payment-gateway');
        });
    });
});
// ─── 纯单元测试 ───
(0, node_test_1.describe)('Analytics Simulator - 纯单元', () => {
    (0, node_test_1.default)('getOperationSnapshot 返回完整结构', () => {
        const svc = makeAnalyticsService(HEALTHY_LOYALTY);
        const snapshot = svc.getOperationSnapshot(makeTenantContext());
        strict_1.default.equal(typeof snapshot.tenantId, 'string');
        strict_1.default.equal(typeof snapshot.generatedAt, 'string');
        strict_1.default.ok(Array.isArray(snapshot.groups));
        strict_1.default.ok(Array.isArray(snapshot.totals));
        for (const group of snapshot.groups) {
            strict_1.default.equal(typeof group.groupKey, 'string');
            strict_1.default.equal(typeof group.groupLabel, 'string');
            strict_1.default.ok(Array.isArray(group.metrics));
            for (const metric of group.metrics) {
                strict_1.default.equal(typeof metric.key, 'string');
                strict_1.default.equal(typeof metric.label, 'string');
                strict_1.default.equal(typeof metric.value, 'number');
            }
        }
    });
    (0, node_test_1.default)('getDiagnostics 为每个 diagnostic 返回合规结构', () => {
        const state = {
            settlementCount: 10,
            settlementSuccessCount: 5,
            couponRedemptionCount: 20,
            blindboxFulfillmentCount: 0,
            pointsIn: 5000,
            pointsOut: 10000
        };
        const svc = makeAnalyticsService(state);
        const diagnostics = svc.getDiagnostics(makeTenantContext());
        strict_1.default.ok(diagnostics.length > 0, '应有诊断结果');
        for (const diag of diagnostics) {
            strict_1.default.equal(typeof diag.diagnosticId, 'string');
            strict_1.default.equal(typeof diag.ruleId, 'string');
            strict_1.default.ok(Object.values(analytics_entity_1.DiagnosticCategory).includes(diag.category));
            strict_1.default.ok(Object.values(analytics_entity_1.DiagnosticSeverity).includes(diag.severity));
            strict_1.default.equal(typeof diag.title, 'string');
            strict_1.default.ok(diag.recommendations.length > 0);
            for (const rec of diag.recommendations) {
                strict_1.default.equal(typeof rec.actionCode, 'string');
                strict_1.default.equal(typeof rec.description, 'string');
                strict_1.default.equal(typeof rec.priority, 'number');
            }
        }
    });
    (0, node_test_1.default)('getRecommendations 去重并按优先级排序', () => {
        const svc = makeAnalyticsService(HEALTHY_LOYALTY);
        const recommendations = svc.getRecommendations(makeTenantContext());
        // 健康状态可能没有推荐
        strict_1.default.ok(Array.isArray(recommendations));
    });
    (0, node_test_1.default)('空数据场景不崩溃', () => {
        const emptyState = {
            settlementCount: 0,
            settlementSuccessCount: 0,
            couponRedemptionCount: 0,
            blindboxFulfillmentCount: 0,
            pointsIn: 0,
            pointsOut: 0
        };
        const svc = makeAnalyticsService(emptyState);
        // 这些调用都不应抛异常
        strict_1.default.doesNotThrow(() => svc.getOperationSnapshot(makeTenantContext()));
        strict_1.default.doesNotThrow(() => svc.getDiagnostics(makeTenantContext()));
        strict_1.default.doesNotThrow(() => svc.getRecommendations(makeTenantContext()));
    });
    (0, node_test_1.default)('不同tenantId独立生成snapshot', () => {
        const svc = makeAnalyticsService(HEALTHY_LOYALTY);
        const s1 = svc.getOperationSnapshot(makeTenantContext({ tenantId: 't-001' }));
        const s2 = svc.getOperationSnapshot(makeTenantContext({ tenantId: 't-002' }));
        strict_1.default.equal(s1.tenantId, 't-001');
        strict_1.default.equal(s2.tenantId, 't-002');
        strict_1.default.notEqual(s1.generatedAt, '', 'generatedAt 不为空');
    });
});
//# sourceMappingURL=analytics.simulator.test.js.map