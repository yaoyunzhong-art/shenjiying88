"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const campaign_contract_1 = require("./campaign.contract");
const campaign_entity_1 = require("./campaign.entity");
(0, node_test_1.describe)('campaign contract mappers', () => {
    // ── toCampaignPlanContract ──
    (0, node_test_1.describe)('toCampaignPlanContract()', () => {
        (0, node_test_1.test)('maps full CampaignPlan to CampaignPlanContract', () => {
            const plan = {
                planId: 'plan-001',
                tenantContext: { scopeType: 'TENANT', scopeCode: 'tenant-a' },
                code: 'POINTS_DOUBLE',
                title: 'Double Points Weekend',
                description: 'Earn 2x points on all purchases',
                status: campaign_entity_1.CampaignStatus.Active,
                triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
                conditions: [
                    { type: campaign_entity_1.CampaignConditionType.MinOrderAmount, value: 99.9 },
                    { type: campaign_entity_1.CampaignConditionType.MemberLevel, value: ['SVIP', 'VIP'] }
                ],
                actions: [
                    {
                        kind: campaign_entity_1.CampaignActionKind.AwardPoints,
                        params: { pointsAmount: 200, pointsReason: 'Double Points Weekend' }
                    },
                    {
                        kind: campaign_entity_1.CampaignActionKind.IssueCoupon,
                        params: { couponPlanId: 'cp-free-coffee' }
                    }
                ],
                priority: 10,
                scheduledStart: '2026-06-20T00:00:00Z',
                scheduledEnd: '2026-06-22T23:59:59Z',
                createdAt: '2026-06-19T12:00:00Z',
                updatedAt: '2026-06-19T12:30:00Z'
            };
            const contract = (0, campaign_contract_1.toCampaignPlanContract)(plan);
            strict_1.default.equal(contract.planId, 'plan-001');
            strict_1.default.equal(contract.code, 'POINTS_DOUBLE');
            strict_1.default.equal(contract.title, 'Double Points Weekend');
            strict_1.default.equal(contract.description, 'Earn 2x points on all purchases');
            strict_1.default.equal(contract.status, campaign_entity_1.CampaignStatus.Active);
            strict_1.default.equal(contract.triggerEvent, campaign_entity_1.CampaignTrigger.PaymentSuccess);
            strict_1.default.equal(contract.priority, 10);
            strict_1.default.equal(contract.scheduledStart, '2026-06-20T00:00:00Z');
            strict_1.default.equal(contract.scheduledEnd, '2026-06-22T23:59:59Z');
            strict_1.default.equal(contract.createdAt, '2026-06-19T12:00:00Z');
            strict_1.default.equal(contract.updatedAt, '2026-06-19T12:30:00Z');
            // conditions are passed through
            strict_1.default.equal(contract.conditions.length, 2);
            strict_1.default.equal(contract.conditions[0].type, campaign_entity_1.CampaignConditionType.MinOrderAmount);
            strict_1.default.equal(contract.conditions[0].value, 99.9);
            strict_1.default.equal(contract.conditions[1].type, campaign_entity_1.CampaignConditionType.MemberLevel);
            strict_1.default.deepEqual(contract.conditions[1].value, ['SVIP', 'VIP']);
            // actions are passed through
            strict_1.default.equal(contract.actions.length, 2);
            strict_1.default.equal(contract.actions[0].kind, campaign_entity_1.CampaignActionKind.AwardPoints);
            strict_1.default.deepEqual(contract.actions[0].params, { pointsAmount: 200, pointsReason: 'Double Points Weekend' });
            strict_1.default.equal(contract.actions[1].kind, campaign_entity_1.CampaignActionKind.IssueCoupon);
            strict_1.default.deepEqual(contract.actions[1].params, { couponPlanId: 'cp-free-coffee' });
        });
        (0, node_test_1.test)('maps plan with optional fields omitted (undefined → undefined)', () => {
            const plan = {
                planId: 'plan-minimal',
                tenantContext: { scopeType: 'PLATFORM', scopeCode: 'default' },
                code: 'MINIMAL',
                title: 'Minimal Plan',
                status: campaign_entity_1.CampaignStatus.Draft,
                triggerEvent: campaign_entity_1.CampaignTrigger.MemberProfileSynced,
                conditions: [],
                actions: [],
                priority: 0,
                createdAt: '2026-06-01T00:00:00Z',
                updatedAt: '2026-06-01T00:00:00Z'
            };
            const contract = (0, campaign_contract_1.toCampaignPlanContract)(plan);
            strict_1.default.equal(contract.planId, 'plan-minimal');
            strict_1.default.equal(contract.description, undefined);
            strict_1.default.equal(contract.scheduledStart, undefined);
            strict_1.default.equal(contract.scheduledEnd, undefined);
        });
        (0, node_test_1.test)('maps DRAFT status plan correctly', () => {
            const plan = {
                planId: 'plan-draft',
                tenantContext: { scopeType: 'TENANT', scopeCode: 'tenant-b' },
                code: 'DRAFT_PLAN',
                title: 'Draft Plan',
                status: campaign_entity_1.CampaignStatus.Draft,
                triggerEvent: campaign_entity_1.CampaignTrigger.OrderCreated,
                conditions: [],
                actions: [
                    {
                        kind: campaign_entity_1.CampaignActionKind.RecommendTag,
                        params: { tagCode: 'vip-recommend', tagMessage: 'VIP exclusive offer' }
                    }
                ],
                priority: 5,
                createdAt: '2026-06-01T00:00:00Z',
                updatedAt: '2026-06-01T00:00:00Z'
            };
            const contract = (0, campaign_contract_1.toCampaignPlanContract)(plan);
            strict_1.default.equal(contract.status, campaign_entity_1.CampaignStatus.Draft);
            strict_1.default.equal(contract.actions[0].kind, campaign_entity_1.CampaignActionKind.RecommendTag);
        });
    });
    // ── toCampaignDispatchContract ──
    (0, node_test_1.describe)('toCampaignDispatchContract()', () => {
        (0, node_test_1.test)('maps full CampaignDispatch to CampaignDispatchContract', () => {
            const dispatch = {
                dispatchId: 'disp-001',
                planId: 'plan-001',
                actionIndex: 0,
                tenantContext: { scopeType: 'TENANT', scopeCode: 'tenant-a' },
                memberId: 'member-001',
                orderId: 'order-001',
                paymentId: 'pay-001',
                triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
                status: campaign_entity_1.CampaignActionStatus.Dispatched,
                errorMessage: undefined,
                resultRef: 'ref-award-xyz',
                createdAt: '2026-06-20T14:30:00Z'
            };
            const contract = (0, campaign_contract_1.toCampaignDispatchContract)(dispatch);
            strict_1.default.equal(contract.dispatchId, 'disp-001');
            strict_1.default.equal(contract.planId, 'plan-001');
            strict_1.default.equal(contract.actionIndex, 0);
            strict_1.default.equal(contract.memberId, 'member-001');
            strict_1.default.equal(contract.orderId, 'order-001');
            strict_1.default.equal(contract.paymentId, 'pay-001');
            strict_1.default.equal(contract.triggerEvent, campaign_entity_1.CampaignTrigger.PaymentSuccess);
            strict_1.default.equal(contract.status, campaign_entity_1.CampaignActionStatus.Dispatched);
            strict_1.default.equal(contract.resultRef, 'ref-award-xyz');
            strict_1.default.equal(contract.createdAt, '2026-06-20T14:30:00Z');
            strict_1.default.equal(contract.errorMessage, undefined);
        });
        (0, node_test_1.test)('maps Failed dispatch with errorMessage', () => {
            const dispatch = {
                dispatchId: 'disp-fail',
                planId: 'plan-001',
                actionIndex: 1,
                tenantContext: { scopeType: 'TENANT', scopeCode: 'tenant-a' },
                memberId: 'member-002',
                triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
                status: campaign_entity_1.CampaignActionStatus.Failed,
                errorMessage: 'Coupon plan not found',
                createdAt: '2026-06-20T14:30:01Z'
            };
            const contract = (0, campaign_contract_1.toCampaignDispatchContract)(dispatch);
            strict_1.default.equal(contract.dispatchId, 'disp-fail');
            strict_1.default.equal(contract.status, campaign_entity_1.CampaignActionStatus.Failed);
            strict_1.default.equal(contract.errorMessage, 'Coupon plan not found');
            strict_1.default.equal(contract.orderId, undefined);
            strict_1.default.equal(contract.paymentId, undefined);
            strict_1.default.equal(contract.resultRef, undefined);
        });
        (0, node_test_1.test)('maps Skipped dispatch', () => {
            const dispatch = {
                dispatchId: 'disp-skip',
                planId: 'plan-001',
                actionIndex: 2,
                tenantContext: { scopeType: 'PLATFORM', scopeCode: 'default' },
                triggerEvent: campaign_entity_1.CampaignTrigger.MemberActivityRecurring,
                status: campaign_entity_1.CampaignActionStatus.Skipped,
                createdAt: '2026-06-20T15:00:00Z'
            };
            const contract = (0, campaign_contract_1.toCampaignDispatchContract)(dispatch);
            strict_1.default.equal(contract.dispatchId, 'disp-skip');
            strict_1.default.equal(contract.status, campaign_entity_1.CampaignActionStatus.Skipped);
            strict_1.default.equal(contract.memberId, undefined);
            strict_1.default.equal(contract.orderId, undefined);
            strict_1.default.equal(contract.paymentId, undefined);
        });
    });
    // ── contract field integrity ──
    (0, node_test_1.describe)('contract field integrity', () => {
        (0, node_test_1.test)('CampaignPlanContract contains all required output fields', () => {
            const plan = {
                planId: 'p-001',
                tenantContext: { scopeType: 'TENANT', scopeCode: 't-001' },
                code: 'C1',
                title: 'Campaign 1',
                status: campaign_entity_1.CampaignStatus.Active,
                triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
                conditions: [
                    { type: campaign_entity_1.CampaignConditionType.StoreScope, value: ['store-1', 'store-2'] }
                ],
                actions: [
                    {
                        kind: campaign_entity_1.CampaignActionKind.IssueBlindbox,
                        params: { blindboxPlanId: 'bb-x', blindboxQuantity: 3 }
                    }
                ],
                priority: 1,
                createdAt: '2026-06-01T00:00:00Z',
                updatedAt: '2026-06-01T00:00:00Z'
            };
            const contract = (0, campaign_contract_1.toCampaignPlanContract)(plan);
            const keys = Object.keys(contract).sort();
            // All expected fields present
            strict_1.default.ok(keys.includes('planId'));
            strict_1.default.ok(keys.includes('tenantContext'));
            strict_1.default.ok(keys.includes('code'));
            strict_1.default.ok(keys.includes('title'));
            strict_1.default.ok(keys.includes('status'));
            strict_1.default.ok(keys.includes('triggerEvent'));
            strict_1.default.ok(keys.includes('conditions'));
            strict_1.default.ok(keys.includes('actions'));
            strict_1.default.ok(keys.includes('priority'));
            strict_1.default.ok(keys.includes('createdAt'));
            strict_1.default.ok(keys.includes('updatedAt'));
            // description, scheduledStart, scheduledEnd only present when set
            // (they are marked as optional in the interface)
        });
        (0, node_test_1.test)('CampaignDispatchContract contains all required output fields', () => {
            const dispatch = {
                dispatchId: 'd-001',
                planId: 'p-001',
                actionIndex: 0,
                tenantContext: { scopeType: 'TENANT', scopeCode: 't-001' },
                triggerEvent: campaign_entity_1.CampaignTrigger.OrderCreated,
                status: campaign_entity_1.CampaignActionStatus.Pending,
                createdAt: '2026-06-01T00:00:00Z'
            };
            const contract = (0, campaign_contract_1.toCampaignDispatchContract)(dispatch);
            const keys = Object.keys(contract).sort();
            strict_1.default.ok(keys.includes('dispatchId'));
            strict_1.default.ok(keys.includes('planId'));
            strict_1.default.ok(keys.includes('actionIndex'));
            strict_1.default.ok(keys.includes('tenantContext'));
            strict_1.default.ok(keys.includes('triggerEvent'));
            strict_1.default.ok(keys.includes('status'));
            strict_1.default.ok(keys.includes('createdAt'));
        });
    });
});
//# sourceMappingURL=campaign.contract.test.js.map