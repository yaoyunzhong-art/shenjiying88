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
const campaign_entity_1 = require("./campaign.entity");
const campaign_service_1 = require("./campaign.service");
const tenantContext = {
    tenantId: 'tenant-001',
    brandId: 'brand-001',
    storeId: 'store-001'
};
(0, node_test_1.describe)('CampaignService', () => {
    (0, node_test_1.default)('registerCampaign creates a Draft plan with default priority', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        const plan = service.registerCampaign({
            tenantContext,
            code: 'CAMP-001',
            title: 'Welcome bonus',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.AwardPoints, params: { pointsAmount: 100 } }]
        });
        strict_1.default.equal(plan.status, campaign_entity_1.CampaignStatus.Draft);
        strict_1.default.equal(plan.priority, 100);
        strict_1.default.equal(plan.tenantContext.tenantId, 'tenant-001');
        strict_1.default.equal(plan.actions[0]?.kind, campaign_entity_1.CampaignActionKind.AwardPoints);
    });
    (0, node_test_1.default)('registerCampaign rejects empty actions', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        strict_1.default.throws(() => service.registerCampaign({
            tenantContext,
            code: 'CAMP-002',
            title: 'empty',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: []
        }), /at least one action/);
    });
    (0, node_test_1.default)('registerCampaign validates action params per kind', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        strict_1.default.throws(() => service.registerCampaign({
            tenantContext,
            code: 'CAMP-003',
            title: 'bad points',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.AwardPoints, params: {} }]
        }), /positive pointsAmount/);
        strict_1.default.throws(() => service.registerCampaign({
            tenantContext,
            code: 'CAMP-004',
            title: 'bad coupon',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.IssueCoupon, params: {} }]
        }), /couponPlanId/);
        strict_1.default.throws(() => service.registerCampaign({
            tenantContext,
            code: 'CAMP-005',
            title: 'bad blindbox',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.IssueBlindbox, params: {} }]
        }), /blindboxPlanId/);
        strict_1.default.throws(() => service.registerCampaign({
            tenantContext,
            code: 'CAMP-006',
            title: 'bad tag',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.RecommendTag, params: {} }]
        }), /tagCode/);
    });
    (0, node_test_1.default)('updateCampaignStatus enforces valid transitions', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        const plan = service.registerCampaign({
            tenantContext,
            code: 'CAMP-007',
            title: 'transition',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.AwardPoints, params: { pointsAmount: 10 } }]
        });
        const activated = service.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        strict_1.default.equal(activated.status, campaign_entity_1.CampaignStatus.Active);
        const paused = service.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Paused, tenantContext.tenantId);
        strict_1.default.equal(paused.status, campaign_entity_1.CampaignStatus.Paused);
        const completed = service.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Completed, tenantContext.tenantId);
        strict_1.default.equal(completed.status, campaign_entity_1.CampaignStatus.Completed);
        // Cannot transition out of Completed
        strict_1.default.throws(() => service.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId), /Invalid campaign status transition/);
    });
    (0, node_test_1.default)('updateCampaignStatus rejects plans from other tenants', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        const plan = service.registerCampaign({
            tenantContext,
            code: 'CAMP-008',
            title: 'isolated',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.AwardPoints, params: { pointsAmount: 10 } }]
        });
        strict_1.default.throws(() => service.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, 'other-tenant'), /Campaign plan not found/);
    });
    (0, node_test_1.default)('listCampaigns filters by tenant, status, triggerEvent and sorts by priority', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        const high = service.registerCampaign({
            tenantContext,
            code: 'HIGH',
            title: 'high',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.AwardPoints, params: { pointsAmount: 1 } }],
            priority: 10
        });
        service.registerCampaign({
            tenantContext,
            code: 'LOW',
            title: 'low',
            triggerEvent: campaign_entity_1.CampaignTrigger.MemberProfileSynced,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.AwardPoints, params: { pointsAmount: 1 } }],
            priority: 200
        });
        service.updateCampaignStatus(high.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        const activePaymentCampaigns = service.listCampaigns(tenantContext.tenantId, {
            status: campaign_entity_1.CampaignStatus.Active,
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess
        });
        strict_1.default.equal(activePaymentCampaigns.length, 1);
        strict_1.default.equal(activePaymentCampaigns[0]?.code, 'HIGH');
        const allCampaigns = service.listCampaigns(tenantContext.tenantId);
        strict_1.default.equal(allCampaigns.length, 2);
        strict_1.default.equal(allCampaigns[0]?.priority, 10);
        strict_1.default.equal(allCampaigns[1]?.priority, 200);
    });
    (0, node_test_1.default)('evaluateTriggers only matches Active campaigns with the matching trigger event', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        const draftPlan = service.registerCampaign({
            tenantContext,
            code: 'DRAFT',
            title: 'draft',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.RecommendTag, params: { tagCode: 'welcome' } }]
        });
        const otherEventPlan = service.registerCampaign({
            tenantContext,
            code: 'OTHER',
            title: 'other',
            triggerEvent: campaign_entity_1.CampaignTrigger.MemberProfileSynced,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.RecommendTag, params: { tagCode: 'welcome' } }]
        });
        service.updateCampaignStatus(draftPlan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        service.updateCampaignStatus(otherEventPlan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        const result = service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1',
            orderId: 'o-1'
        });
        strict_1.default.equal(result.matchedCampaigns, 1);
        // RecommendTag dispatches without needing MemberService / LoyaltyService
        strict_1.default.equal(result.dispatchedActions, 1);
        strict_1.default.equal(result.skippedActions, 0);
    });
    (0, node_test_1.default)('evaluateTriggers respects MinOrderAmount condition', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        const plan = service.registerCampaign({
            tenantContext,
            code: 'MIN-AMT',
            title: 'min amount',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [{ type: campaign_entity_1.CampaignConditionType.MinOrderAmount, value: 100 }],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.RecommendTag, params: { tagCode: 'premium' } }]
        });
        service.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        const below = service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1',
            orderAmount: 80
        });
        strict_1.default.equal(below.matchedCampaigns, 0);
        const above = service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-2',
            orderAmount: 150
        });
        strict_1.default.equal(above.matchedCampaigns, 1);
        strict_1.default.equal(above.dispatchedActions, 1);
    });
    (0, node_test_1.default)('evaluateTriggers respects MemberLevel, StoreScope, BrandScope conditions', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        const plan = service.registerCampaign({
            tenantContext,
            code: 'SCOPED',
            title: 'scoped',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [
                { type: campaign_entity_1.CampaignConditionType.MemberLevel, value: ['gold', 'platinum'] },
                { type: campaign_entity_1.CampaignConditionType.StoreScope, value: ['store-001', 'store-002'] },
                { type: campaign_entity_1.CampaignConditionType.BrandScope, value: 'brand-001' }
            ],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.RecommendTag, params: { tagCode: 'vip-loyalty' } }]
        });
        service.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        const rejectLevel = service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1',
            memberLevel: 'silver'
        });
        strict_1.default.equal(rejectLevel.matchedCampaigns, 0);
        const rejectStore = service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1',
            memberLevel: 'gold',
            storeId: 'store-other'
        });
        strict_1.default.equal(rejectStore.matchedCampaigns, 0);
        const rejectBrand = service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext: { ...tenantContext, brandId: 'brand-OTHER' },
            memberId: 'm-1',
            memberLevel: 'gold',
            storeId: 'store-001'
        });
        strict_1.default.equal(rejectBrand.matchedCampaigns, 0);
        const accept = service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1',
            memberLevel: 'gold',
            storeId: 'store-001'
        });
        strict_1.default.equal(accept.matchedCampaigns, 1);
    });
    (0, node_test_1.default)('evaluateTriggers enforces idempotency by (planId, actionIndex, memberId, orderId)', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        const plan = service.registerCampaign({
            tenantContext,
            code: 'IDEMPOTENT',
            title: 'idempotent',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.RecommendTag, params: { tagCode: 'cashback' } }]
        });
        service.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        const first = service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1',
            orderId: 'o-1'
        });
        strict_1.default.equal(first.dispatchedActions, 1);
        strict_1.default.equal(first.skippedActions, 0);
        const second = service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1',
            orderId: 'o-1'
        });
        strict_1.default.equal(second.dispatchedActions, 0);
        strict_1.default.equal(second.skippedActions, 1);
    });
    (0, node_test_1.default)('evaluateTriggers dispatches AwardPoints through MemberService when configured', () => {
        const service = new campaign_service_1.CampaignService(undefined, undefined);
        service.resetCampaignStoresForTests();
        const awardPointsCalls = [];
        const memberService = {
            awardPoints: async (memberId, amount, ctx) => {
                awardPointsCalls.push({ memberId, amount, tenantId: ctx.tenantId });
            }
        };
        const loyaltyService = {};
        const svc = new campaign_service_1.CampaignService(memberService, loyaltyService);
        svc.resetCampaignStoresForTests();
        const plan = svc.registerCampaign({
            tenantContext,
            code: 'AWARD',
            title: 'award',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.AwardPoints, params: { pointsAmount: 200, pointsReason: 'campaign:CAMP' } }]
        });
        svc.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        const result = svc.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1',
            orderId: 'o-1'
        });
        strict_1.default.equal(result.dispatchedActions, 1);
        strict_1.default.equal(awardPointsCalls.length, 1);
        strict_1.default.equal(awardPointsCalls[0]?.memberId, 'm-1');
        strict_1.default.equal(awardPointsCalls[0]?.amount, 200);
        strict_1.default.equal(awardPointsCalls[0]?.tenantId, 'tenant-001');
    });
    (0, node_test_1.default)('evaluateTriggers dispatches IssueCoupon through LoyaltyService when configured', () => {
        const svc = new campaign_service_1.CampaignService(undefined, undefined);
        svc.resetCampaignStoresForTests();
        const redemption = {
            redemptionId: 'coupon-r-1',
            tenantContext,
            orderId: 'pending-m-1',
            paymentId: 'pending-m-1',
            memberId: 'm-1',
            couponCode: 'WELCOME',
            status: 'REDEEMED',
            createdAt: new Date().toISOString()
        };
        const loyaltyService = {
            issueCouponFromPlan: () => redemption
        };
        const memberService = {};
        const s = new campaign_service_1.CampaignService(memberService, loyaltyService);
        s.resetCampaignStoresForTests();
        const plan = s.registerCampaign({
            tenantContext,
            code: 'ISSUE',
            title: 'issue coupon',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.IssueCoupon, params: { couponPlanId: 'cp-1' } }]
        });
        s.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        const result = s.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1',
            orderId: 'o-1'
        });
        strict_1.default.equal(result.dispatchedActions, 1);
        strict_1.default.equal(s.listDispatches(tenantContext.tenantId, { planId: plan.planId })[0]?.resultRef, 'coupon-r-1');
    });
    (0, node_test_1.default)('evaluateTriggers marks IssueBlindbox dispatch failed when LoyaltyService throws', () => {
        const svc = new campaign_service_1.CampaignService(undefined, undefined);
        svc.resetCampaignStoresForTests();
        const loyaltyService = {
            issueBlindboxFromPlan: () => {
                throw new Error('quota exhausted');
            }
        };
        const s = new campaign_service_1.CampaignService(undefined, loyaltyService);
        s.resetCampaignStoresForTests();
        const plan = s.registerCampaign({
            tenantContext,
            code: 'BLIND',
            title: 'blindbox',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.IssueBlindbox, params: { blindboxPlanId: 'bp-1' } }]
        });
        s.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        const result = s.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1',
            orderId: 'o-1'
        });
        strict_1.default.equal(result.failedActions, 1);
        strict_1.default.equal(result.dispatchedActions, 0);
        const dispatch = s.listDispatches(tenantContext.tenantId)[0];
        strict_1.default.equal(dispatch?.status, 'FAILED');
        strict_1.default.equal(dispatch?.errorMessage, 'quota exhausted');
    });
    (0, node_test_1.default)('evaluateTriggers skips RecommendTag with no resultRef but records dispatch', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        const plan = service.registerCampaign({
            tenantContext,
            code: 'TAG',
            title: 'recommend',
            triggerEvent: campaign_entity_1.CampaignTrigger.MemberProfileSynced,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.RecommendTag, params: { tagCode: 'new-vip' } }]
        });
        service.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        const result = service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.MemberProfileSynced,
            tenantContext,
            memberId: 'm-1'
        });
        strict_1.default.equal(result.dispatchedActions, 1);
        const dispatch = service.listDispatches(tenantContext.tenantId)[0];
        strict_1.default.equal(dispatch?.resultRef, 'tag:new-vip');
    });
    (0, node_test_1.default)('evaluateTriggers skips AwardPoints when memberId is missing', () => {
        const memberService = {
            awardPoints: async () => undefined
        };
        const svc = new campaign_service_1.CampaignService(memberService, undefined);
        svc.resetCampaignStoresForTests();
        const plan = svc.registerCampaign({
            tenantContext,
            code: 'NO-MEMBER',
            title: 'no member',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.AwardPoints, params: { pointsAmount: 50 } }]
        });
        svc.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        const result = svc.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext
        });
        strict_1.default.equal(result.skippedActions, 1);
        strict_1.default.equal(result.dispatchedActions, 0);
        const dispatch = svc.listDispatches(tenantContext.tenantId)[0];
        strict_1.default.equal(dispatch?.status, 'SKIPPED');
    });
    (0, node_test_1.default)('listDispatches filters by memberId and planId', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        const p1 = service.registerCampaign({
            tenantContext,
            code: 'P1',
            title: 'p1',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.RecommendTag, params: { tagCode: 't1' } }]
        });
        const p2 = service.registerCampaign({
            tenantContext,
            code: 'P2',
            title: 'p2',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.RecommendTag, params: { tagCode: 't2' } }]
        });
        service.updateCampaignStatus(p1.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        service.updateCampaignStatus(p2.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1',
            orderId: 'o-1'
        });
        service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-2',
            orderId: 'o-2'
        });
        const m1 = service.listDispatches(tenantContext.tenantId, { memberId: 'm-1' });
        strict_1.default.equal(m1.length, 2);
        strict_1.default.ok(m1.some((d) => d.planId === p1.planId));
        strict_1.default.ok(m1.some((d) => d.planId === p2.planId));
        const byPlan1 = service.listDispatches(tenantContext.tenantId, { planId: p1.planId });
        strict_1.default.equal(byPlan1.length, 2);
        const dispatched = service.listDispatches(tenantContext.tenantId, {
            planId: p1.planId,
            status: 'DISPATCHED'
        });
        strict_1.default.equal(dispatched.length, 2);
    });
    (0, node_test_1.default)('scheduledStart in the future suppresses trigger evaluation', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        const plan = service.registerCampaign({
            tenantContext,
            code: 'FUTURE',
            title: 'future',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.RecommendTag, params: { tagCode: 'prelaunch' } }],
            scheduledStart: new Date(Date.now() + 1000 * 60 * 60).toISOString()
        });
        service.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        const result = service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1'
        });
        strict_1.default.equal(result.matchedCampaigns, 0);
    });
    (0, node_test_1.default)('scheduledEnd in the past suppresses trigger evaluation', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        const plan = service.registerCampaign({
            tenantContext,
            code: 'PAST',
            title: 'past',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.RecommendTag, params: { tagCode: 'legacy' } }],
            scheduledEnd: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        });
        service.updateCampaignStatus(plan.planId, campaign_entity_1.CampaignStatus.Active, tenantContext.tenantId);
        const result = service.evaluateTriggers({
            eventName: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            tenantContext,
            memberId: 'm-1'
        });
        strict_1.default.equal(result.matchedCampaigns, 0);
    });
    (0, node_test_1.default)('cross-tenant isolation: plan in tenant A is invisible to tenant B', () => {
        const service = new campaign_service_1.CampaignService();
        service.resetCampaignStoresForTests();
        service.registerCampaign({
            tenantContext: { tenantId: 'tenant-A' },
            code: 'A',
            title: 'A',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: campaign_entity_1.CampaignActionKind.RecommendTag, params: { tagCode: 'a' } }]
        });
        const aCampaigns = service.listCampaigns('tenant-A');
        const bCampaigns = service.listCampaigns('tenant-B');
        strict_1.default.equal(aCampaigns.length, 1);
        strict_1.default.equal(bCampaigns.length, 0);
    });
});
//# sourceMappingURL=campaign.service.test.js.map