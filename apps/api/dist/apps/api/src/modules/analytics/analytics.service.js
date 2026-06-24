"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const analytics_entity_1 = require("./analytics.entity");
const DIAGNOSTIC_RULES = [
    {
        ruleId: 'payment-success-rate-low',
        category: analytics_entity_1.DiagnosticCategory.PaymentHealth,
        severity: analytics_entity_1.DiagnosticSeverity.Critical,
        title: '支付成功率低于健康线',
        buildRecommendation: () => [
            {
                actionCode: 'inspect-payment-gateway',
                description: '检查 LYT 网关连通性与签名校验失败计数',
                priority: 100
            }
        ]
    },
    {
        ruleId: 'blindbox-redemption-shortfall',
        category: analytics_entity_1.DiagnosticCategory.BlindboxEngagement,
        severity: analytics_entity_1.DiagnosticSeverity.Warning,
        title: '盲盒履约转化偏低',
        buildRecommendation: () => [
            {
                actionCode: 'launch-blindbox-promo',
                description: '为转化偏低的盲盒 SKU 上线专项促销或增发低门槛券',
                suggestedCampaignKind: 'BLINDBOX_PROMO',
                priority: 80
            }
        ]
    },
    {
        ruleId: 'coupon-quota-near-exhaustion',
        category: analytics_entity_1.DiagnosticCategory.CouponPerformance,
        severity: analytics_entity_1.DiagnosticSeverity.Warning,
        title: '券计划额度接近耗尽',
        buildRecommendation: () => [
            {
                actionCode: 'restock-coupon-quota',
                description: '为额度告急的券计划补充配额或结束计划',
                priority: 70
            }
        ]
    },
    {
        ruleId: 'no-settlement-activity',
        category: analytics_entity_1.DiagnosticCategory.MemberActivity,
        severity: analytics_entity_1.DiagnosticSeverity.Warning,
        title: '结算活跃度静默',
        buildRecommendation: () => [
            {
                actionCode: 'launch-re-engagement',
                description: '对最近无结算的活跃会员发起回流激励活动',
                suggestedCampaignKind: 'RE_ENGAGEMENT',
                priority: 60
            }
        ]
    },
    {
        ruleId: 'points-outflow-dominant',
        category: analytics_entity_1.DiagnosticCategory.PointEconomy,
        severity: analytics_entity_1.DiagnosticSeverity.Critical,
        title: '积分净流出主导',
        buildRecommendation: () => [
            {
                actionCode: 'rebalance-point-economy',
                description: '暂停高消耗积分活动并提升积分获取通路',
                priority: 90
            }
        ]
    },
    {
        ruleId: 'member-activity-thinning',
        category: analytics_entity_1.DiagnosticCategory.MemberActivity,
        severity: analytics_entity_1.DiagnosticSeverity.Info,
        title: '会员活动节奏稀疏',
        buildRecommendation: () => [
            {
                actionCode: 'increase-touchpoint-frequency',
                description: '增加导购触达节奏或推送积分翻倍激励',
                suggestedCampaignKind: 'POINTS_AWARD',
                priority: 40
            }
        ]
    }
];
let AnalyticsService = class AnalyticsService {
    loyaltyService;
    constructor(loyaltyService) {
        this.loyaltyService = loyaltyService;
    }
    getOperationSnapshot(tenantContext, options) {
        const scope = options?.scope ?? analytics_entity_1.AnalyticsScope.Tenant;
        const inputs = this.resolveInputs(tenantContext, scope, options);
        const loyalty = this.loyaltyService?.getLoyaltySummary({
            tenantId: inputs.tenantId,
            brandId: inputs.brandId,
            storeId: inputs.storeId
        }) ?? {
            settlementCount: 0,
            settlementSuccessCount: 0,
            couponRedemptionCount: 0,
            blindboxFulfillmentCount: 0,
            pointsIn: 0,
            pointsOut: 0
        };
        const orderGroup = {
            groupKey: 'orders',
            groupLabel: '订单与支付',
            metrics: [
                {
                    key: 'settlementCount',
                    label: '结算笔数',
                    value: loyalty.settlementCount,
                    unit: '笔'
                },
                {
                    key: 'settlementSuccessRate',
                    label: '结算成功率',
                    value: loyalty.settlementCount > 0
                        ? Math.round((loyalty.settlementSuccessCount / loyalty.settlementCount) * 1000) / 10
                        : 0,
                    unit: '%',
                    ratio: loyalty.settlementCount > 0
                        ? (loyalty.settlementSuccessCount / loyalty.settlementCount) * 100
                        : 0
                },
                {
                    key: 'couponRedemptionCount',
                    label: '券核销数',
                    value: loyalty.couponRedemptionCount,
                    unit: '张'
                },
                {
                    key: 'blindboxFulfillmentCount',
                    label: '盲盒履约数',
                    value: loyalty.blindboxFulfillmentCount,
                    unit: '盒'
                }
            ]
        };
        const loyaltyGroup = {
            groupKey: 'loyalty',
            groupLabel: '积分与会员',
            metrics: [
                {
                    key: 'pointsIn',
                    label: '积分发放',
                    value: loyalty.pointsIn,
                    unit: '分'
                },
                {
                    key: 'pointsOut',
                    label: '积分消耗',
                    value: loyalty.pointsOut,
                    unit: '分'
                },
                {
                    key: 'pointsNet',
                    label: '积分净流',
                    value: loyalty.pointsIn - loyalty.pointsOut,
                    unit: '分',
                    trend: loyalty.pointsIn > loyalty.pointsOut ? 'UP' : loyalty.pointsIn < loyalty.pointsOut ? 'DOWN' : 'FLAT'
                }
            ]
        };
        const totals = [
            {
                key: 'totalSettlements',
                label: '总结算笔数',
                value: loyalty.settlementCount,
                unit: '笔'
            },
            {
                key: 'totalRedemptions',
                label: '总券核销',
                value: loyalty.couponRedemptionCount,
                unit: '张'
            },
            {
                key: 'totalBlindboxes',
                label: '总盲盒履约',
                value: loyalty.blindboxFulfillmentCount,
                unit: '盒'
            }
        ];
        return {
            tenantId: inputs.tenantId,
            scope,
            brandId: inputs.brandId,
            storeId: inputs.storeId,
            generatedAt: new Date().toISOString(),
            groups: [orderGroup, loyaltyGroup],
            totals
        };
    }
    getDiagnostics(tenantContext, options) {
        const scope = options?.scope ?? analytics_entity_1.AnalyticsScope.Tenant;
        const inputs = this.resolveInputs(tenantContext, scope, options);
        const snapshot = this.getOperationSnapshot(tenantContext, options);
        const loyalty = this.loyaltyService?.getLoyaltySummary({
            tenantId: inputs.tenantId,
            brandId: inputs.brandId,
            storeId: inputs.storeId
        }) ?? {
            settlementCount: 0,
            settlementSuccessCount: 0,
            couponRedemptionCount: 0,
            blindboxFulfillmentCount: 0,
            pointsIn: 0,
            pointsOut: 0
        };
        const nowIso = new Date().toISOString();
        const diagnostics = [];
        // Rule 1: payment success rate low
        const successRate = loyalty.settlementCount > 0 ? loyalty.settlementSuccessCount / loyalty.settlementCount : 1;
        if (loyalty.settlementCount > 0 && successRate < 0.8) {
            const rule = DIAGNOSTIC_RULES.find((r) => r.ruleId === 'payment-success-rate-low');
            diagnostics.push(this.buildDiagnostic({
                rule,
                tenantContext,
                scope: options?.scope ?? analytics_entity_1.AnalyticsScope.Tenant,
                evidence: {
                    settlementCount: loyalty.settlementCount,
                    successCount: loyalty.settlementSuccessCount,
                    successRate: Math.round(successRate * 1000) / 10
                },
                nowIso
            }));
        }
        // Rule 2: blindbox redemption shortfall (use fulfillment vs redemption ratio as proxy)
        if (loyalty.blindboxFulfillmentCount === 0 && loyalty.couponRedemptionCount > 5) {
            const rule = DIAGNOSTIC_RULES.find((r) => r.ruleId === 'blindbox-redemption-shortfall');
            diagnostics.push(this.buildDiagnostic({
                rule,
                tenantContext,
                scope: options?.scope ?? analytics_entity_1.AnalyticsScope.Tenant,
                evidence: {
                    blindboxFulfillmentCount: loyalty.blindboxFulfillmentCount,
                    couponRedemptionCount: loyalty.couponRedemptionCount
                },
                nowIso
            }));
        }
        // Rule 3: coupon quota near exhaustion (delegate to loyalty couponPlanStore if exposed)
        if (this.loyaltyService) {
            const exhaustedPlans = this.loyaltyService.listCouponPlans(tenantContext.tenantId).filter((plan) => plan.remainingQuota / Math.max(1, plan.totalQuota) < 0.1 && plan.status === 'ACTIVE');
            if (exhaustedPlans.length > 0) {
                const rule = DIAGNOSTIC_RULES.find((r) => r.ruleId === 'coupon-quota-near-exhaustion');
                diagnostics.push(this.buildDiagnostic({
                    rule,
                    tenantContext,
                    scope: options?.scope ?? analytics_entity_1.AnalyticsScope.Tenant,
                    evidence: {
                        exhaustedPlanIds: exhaustedPlans.map((p) => p.planId),
                        exhaustedCodes: exhaustedPlans.map((p) => p.code)
                    },
                    nowIso
                }));
            }
        }
        // Rule 4: no settlement activity
        if (loyalty.settlementCount === 0) {
            const rule = DIAGNOSTIC_RULES.find((r) => r.ruleId === 'no-settlement-activity');
            diagnostics.push(this.buildDiagnostic({
                rule,
                tenantContext,
                scope: options?.scope ?? analytics_entity_1.AnalyticsScope.Tenant,
                evidence: { settlementCount: 0 },
                nowIso
            }));
        }
        // Rule 5: points outflow dominant
        if (loyalty.pointsOut > loyalty.pointsIn * 1.3 && loyalty.pointsOut > 0) {
            const rule = DIAGNOSTIC_RULES.find((r) => r.ruleId === 'points-outflow-dominant');
            diagnostics.push(this.buildDiagnostic({
                rule,
                tenantContext,
                scope: options?.scope ?? analytics_entity_1.AnalyticsScope.Tenant,
                evidence: {
                    pointsIn: loyalty.pointsIn,
                    pointsOut: loyalty.pointsOut,
                    netFlow: loyalty.pointsIn - loyalty.pointsOut
                },
                nowIso
            }));
        }
        // Rule 6: member activity thinning (low settlement density)
        if (loyalty.settlementCount > 0 &&
            loyalty.settlementCount < 3 &&
            loyalty.pointsOut === 0 &&
            loyalty.couponRedemptionCount === 0) {
            const rule = DIAGNOSTIC_RULES.find((r) => r.ruleId === 'member-activity-thinning');
            diagnostics.push(this.buildDiagnostic({
                rule,
                tenantContext,
                scope: options?.scope ?? analytics_entity_1.AnalyticsScope.Tenant,
                evidence: {
                    settlementCount: loyalty.settlementCount,
                    couponRedemptionCount: loyalty.couponRedemptionCount,
                    pointsOut: loyalty.pointsOut
                },
                nowIso
            }));
        }
        // Carry the snapshot metadata into the diagnostics for traceability
        void snapshot;
        return diagnostics;
    }
    getRecommendations(tenantContext, options) {
        const diagnostics = this.getDiagnostics(tenantContext, options);
        return diagnostics
            .flatMap((diagnostic) => diagnostic.recommendations)
            .sort((a, b) => b.priority - a.priority);
    }
    resolveInputs(tenantContext, scope, options) {
        return {
            tenantId: tenantContext.tenantId,
            brandId: scope === analytics_entity_1.AnalyticsScope.Brand ? options?.brandId ?? tenantContext.brandId : undefined,
            storeId: scope === analytics_entity_1.AnalyticsScope.Store ? options?.storeId ?? tenantContext.storeId : undefined
        };
    }
    buildDiagnostic(input) {
        const { rule, tenantContext, scope, evidence, nowIso } = input;
        return {
            diagnosticId: `${rule.ruleId}-${tenantContext.tenantId}-${nowIso}`,
            ruleId: rule.ruleId,
            tenantContext: {
                tenantId: tenantContext.tenantId,
                brandId: tenantContext.brandId,
                storeId: tenantContext.storeId
            },
            scope,
            category: rule.category,
            severity: rule.severity,
            title: rule.title,
            summary: rule.title,
            evidence,
            recommendations: rule.buildRecommendation(evidence),
            generatedAt: nowIso
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [loyalty_service_1.LoyaltyService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map