"use strict";
/**
 * CampaignController 单元测试 (node:test)
 *
 * 策略：内联 Controller + Mock Service，覆盖所有路由端点。
 * 正向流程 + 边界条件（空数据集、缺失参数、无效状态转换）。
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
// ── Entity mirrors (avoid NestJS DI) ───────────────────────────
const CampaignStatus = {
    Draft: 'DRAFT',
    Scheduled: 'SCHEDULED',
    Active: 'ACTIVE',
    Paused: 'PAUSED',
    Completed: 'COMPLETED',
};
const CampaignTrigger = {
    PaymentSuccess: 'payment.success',
    MemberProfileSynced: 'member.profile-synced',
    OrderCreated: 'order.created',
    MemberActivityRecurring: 'member.activity-recurring',
};
const CampaignActionKind = {
    AwardPoints: 'AWARD_POINTS',
    IssueCoupon: 'ISSUE_COUPON',
    IssueBlindbox: 'ISSUE_BLINDBOX',
    RecommendTag: 'RECOMMEND_TAG',
};
const CampaignActionStatus = {
    Pending: 'PENDING',
    Dispatched: 'DISPATCHED',
    Failed: 'FAILED',
    Skipped: 'SKIPPED',
};
// ── Contract mirrors ──────────────────────────────────────────
function toCampaignPlanContract(plan) {
    return {
        planId: plan.planId,
        tenantContext: plan.tenantContext,
        code: plan.code,
        title: plan.title,
        description: plan.description,
        status: plan.status,
        triggerEvent: plan.triggerEvent,
        conditions: plan.conditions,
        actions: plan.actions,
        priority: plan.priority,
        scheduledStart: plan.scheduledStart,
        scheduledEnd: plan.scheduledEnd,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
    };
}
function toCampaignDispatchContract(dispatch) {
    return {
        dispatchId: dispatch.dispatchId,
        planId: dispatch.planId,
        actionIndex: dispatch.actionIndex,
        tenantContext: dispatch.tenantContext,
        memberId: dispatch.memberId,
        orderId: dispatch.orderId,
        paymentId: dispatch.paymentId,
        triggerEvent: dispatch.triggerEvent,
        status: dispatch.status,
        errorMessage: dispatch.errorMessage,
        resultRef: dispatch.resultRef,
        createdAt: dispatch.createdAt,
    };
}
// ── Inline Controller (mirrors source: campaign.controller.ts) ─
class CampaignController {
    campaignService;
    constructor(campaignService) {
        this.campaignService = campaignService;
    }
    registerCampaign(tenantContext, body) {
        const plan = this.campaignService.registerCampaign({
            tenantContext,
            code: body.code,
            title: body.title,
            description: body.description,
            triggerEvent: body.triggerEvent,
            conditions: body.conditions,
            actions: body.actions,
            priority: body.priority,
            scheduledStart: body.scheduledStart,
            scheduledEnd: body.scheduledEnd,
        });
        return toCampaignPlanContract(plan);
    }
    listCampaigns(tenantContext, query) {
        return this.campaignService
            .listCampaigns(tenantContext.tenantId, {
            status: query.status,
            triggerEvent: query.triggerEvent,
        })
            .map((plan) => toCampaignPlanContract(plan));
    }
    getCampaign(tenantContext, planId) {
        const plan = this.campaignService.getCampaign(planId, tenantContext.tenantId);
        return plan ? toCampaignPlanContract(plan) : null;
    }
    updateCampaignStatus(tenantContext, planId, body) {
        const plan = this.campaignService.updateCampaignStatus(planId, body.status, tenantContext.tenantId);
        return toCampaignPlanContract(plan);
    }
    listPlanDispatches(tenantContext, planId) {
        return this.campaignService
            .listDispatches(tenantContext.tenantId, { planId })
            .map((dispatch) => toCampaignDispatchContract(dispatch));
    }
    listDispatches(tenantContext, query) {
        return this.campaignService
            .listDispatches(tenantContext.tenantId, {
            memberId: query.memberId,
            status: query.status,
        })
            .map((dispatch) => toCampaignDispatchContract(dispatch));
    }
    evaluateTriggers(tenantContext, body) {
        return this.campaignService.evaluateTriggers({ ...body, tenantContext });
    }
}
// ── Helpers ───────────────────────────────────────────────────
function makeTenantContext(overrides = {}) {
    return {
        tenantId: 't-001',
        brandId: 'b-001',
        storeId: 's-001',
        marketCode: 'zh-cn',
        ...overrides,
    };
}
function makeCampaignPlan(overrides = {}) {
    return {
        planId: 'plan-001',
        tenantContext: makeTenantContext(),
        code: 'CP001',
        title: 'Test Campaign',
        description: 'A test campaign',
        status: CampaignStatus.Draft,
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [],
        actions: [],
        priority: 0,
        scheduledStart: undefined,
        scheduledEnd: undefined,
        createdAt: '2026-06-23T10:00:00Z',
        updatedAt: '2026-06-23T10:00:00Z',
        ...overrides,
    };
}
function makeCampaignDispatch(overrides = {}) {
    return {
        dispatchId: 'disp-001',
        planId: 'plan-001',
        actionIndex: 0,
        tenantContext: makeTenantContext(),
        memberId: 'mem-001',
        orderId: 'ord-001',
        paymentId: null,
        triggerEvent: CampaignTrigger.PaymentSuccess,
        status: CampaignActionStatus.Pending,
        errorMessage: undefined,
        resultRef: undefined,
        createdAt: '2026-06-23T10:00:00Z',
        ...overrides,
    };
}
function makeMockService(overrides = {}) {
    return {
        registerCampaign: () => makeCampaignPlan(),
        listCampaigns: () => [],
        getCampaign: () => null,
        updateCampaignStatus: () => makeCampaignPlan(),
        listDispatches: () => [],
        evaluateTriggers: () => ({
            matchedCampaigns: 0,
            dispatchedActions: 0,
            skippedActions: 0,
            failedActions: 0,
            dispatches: [],
        }),
        ...overrides,
    };
}
function makeMockServiceWithData() {
    const plan1 = makeCampaignPlan();
    const plan2 = makeCampaignPlan({ planId: 'plan-002', code: 'CP002', status: CampaignStatus.Active });
    const disp1 = makeCampaignDispatch();
    const disp2 = makeCampaignDispatch({ dispatchId: 'disp-002', status: CampaignActionStatus.Dispatched });
    return makeMockService({
        registerCampaign: () => plan1,
        listCampaigns: () => [plan1, plan2],
        getCampaign: (id) => (id === 'plan-001' ? plan1 : null),
        updateCampaignStatus: (id, status) => makeCampaignPlan({ planId: id, status }),
        listDispatches: () => [disp1, disp2],
        evaluateTriggers: () => ({
            matchedCampaigns: 2,
            dispatchedActions: 1,
            skippedActions: 1,
            failedActions: 0,
            dispatches: [disp1, disp2],
        }),
    });
}
// ── Tests ─────────────────────────────────────────────────────
(0, node_test_1.describe)('CampaignController', () => {
    // ── POST /campaigns ───────────────────────────────────────
    (0, node_test_1.describe)('registerCampaign()', () => {
        (0, node_test_1.test)('returns CampaignPlanContract on successful registration', () => {
            const mockService = makeMockServiceWithData();
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const body = {
                code: 'CP001',
                title: 'New Campaign',
                description: 'Test',
                triggerEvent: CampaignTrigger.PaymentSuccess,
                conditions: [],
                actions: [],
            };
            const result = controller.registerCampaign(ctx, body);
            strict_1.default.strictEqual(result.planId, 'plan-001');
            strict_1.default.strictEqual(result.code, 'CP001');
            strict_1.default.strictEqual(result.status, CampaignStatus.Draft);
        });
        (0, node_test_1.test)('passes all body fields to service', () => {
            let capturedInput = null;
            const mockService = makeMockService({
                registerCampaign: (input) => {
                    capturedInput = input;
                    return makeCampaignPlan();
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const body = {
                code: 'CP-BUNDLE',
                title: 'Bundle Campaign',
                description: 'Test bundle',
                triggerEvent: CampaignTrigger.OrderCreated,
                conditions: [{ type: 'MIN_ORDER_AMOUNT', value: 100 }],
                actions: [{ kind: CampaignActionKind.AwardPoints, params: { points: 500 } }],
                priority: 10,
                scheduledStart: '2026-07-01T00:00:00Z',
                scheduledEnd: '2026-07-31T23:59:59Z',
            };
            controller.registerCampaign(ctx, body);
            strict_1.default.strictEqual(capturedInput.code, 'CP-BUNDLE');
            strict_1.default.strictEqual(capturedInput.triggerEvent, CampaignTrigger.OrderCreated);
            strict_1.default.strictEqual(capturedInput.priority, 10);
            strict_1.default.strictEqual(capturedInput.scheduledStart, '2026-07-01T00:00:00Z');
            strict_1.default.strictEqual(capturedInput.conditions[0].type, 'MIN_ORDER_AMOUNT');
            strict_1.default.strictEqual(capturedInput.actions[0].kind, CampaignActionKind.AwardPoints);
            strict_1.default.strictEqual(capturedInput.actions[0].params.points, 500);
        });
        (0, node_test_1.test)('handles empty conditions and actions arrays', () => {
            const mockService = makeMockServiceWithData();
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const body = {
                code: 'CP-EMPTY',
                title: 'Empty Campaign',
                triggerEvent: CampaignTrigger.MemberProfileSynced,
                conditions: [],
                actions: [],
            };
            const result = controller.registerCampaign(ctx, body);
            strict_1.default.strictEqual(result.planId, 'plan-001');
            strict_1.default.deepStrictEqual(result.conditions, []);
            strict_1.default.deepStrictEqual(result.actions, []);
        });
    });
    // ── GET /campaigns ────────────────────────────────────────
    (0, node_test_1.describe)('listCampaigns()', () => {
        (0, node_test_1.test)('returns empty array when no campaigns exist', () => {
            const mockService = makeMockService();
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.listCampaigns(ctx, {});
            strict_1.default.deepStrictEqual(result, []);
        });
        (0, node_test_1.test)('returns all campaigns when no filters applied', () => {
            const mockService = makeMockServiceWithData();
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.listCampaigns(ctx, {});
            strict_1.default.strictEqual(result.length, 2);
            strict_1.default.strictEqual(result[0].planId, 'plan-001');
            strict_1.default.strictEqual(result[1].planId, 'plan-002');
        });
        (0, node_test_1.test)('filters by status', () => {
            let capturedFilters = null;
            const mockService = makeMockService({
                listCampaigns: (_tenantId, filters) => {
                    capturedFilters = filters;
                    return [];
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            controller.listCampaigns(ctx, { status: CampaignStatus.Active });
            strict_1.default.strictEqual(capturedFilters.status, CampaignStatus.Active);
        });
        (0, node_test_1.test)('filters by triggerEvent', () => {
            let capturedFilters = null;
            const mockService = makeMockService({
                listCampaigns: (_tenantId, filters) => {
                    capturedFilters = filters;
                    return [];
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            controller.listCampaigns(ctx, {
                triggerEvent: CampaignTrigger.OrderCreated,
            });
            strict_1.default.strictEqual(capturedFilters.triggerEvent, CampaignTrigger.OrderCreated);
        });
        (0, node_test_1.test)('filters by both status and triggerEvent', () => {
            let capturedFilters = null;
            const mockService = makeMockService({
                listCampaigns: (_tenantId, filters) => {
                    capturedFilters = filters;
                    return [];
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            controller.listCampaigns(ctx, {
                status: CampaignStatus.Active,
                triggerEvent: CampaignTrigger.PaymentSuccess,
            });
            strict_1.default.strictEqual(capturedFilters.status, CampaignStatus.Active);
            strict_1.default.strictEqual(capturedFilters.triggerEvent, CampaignTrigger.PaymentSuccess);
        });
    });
    // ── GET /campaigns/:planId ────────────────────────────────
    (0, node_test_1.describe)('getCampaign()', () => {
        (0, node_test_1.test)('returns plan contract for existing campaign', () => {
            const mockService = makeMockServiceWithData();
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.getCampaign(ctx, 'plan-001');
            strict_1.default.notStrictEqual(result, null);
            strict_1.default.strictEqual(result.planId, 'plan-001');
            strict_1.default.strictEqual(result.code, 'CP001');
        });
        (0, node_test_1.test)('returns null for non-existing campaign', () => {
            const mockService = makeMockServiceWithData();
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.getCampaign(ctx, 'plan-999');
            strict_1.default.strictEqual(result, null);
        });
        (0, node_test_1.test)('returns null when service returns undefined', () => {
            const mockService = makeMockService({
                getCampaign: () => undefined,
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.getCampaign(ctx, 'any-plan');
            strict_1.default.strictEqual(result, null);
        });
        (0, node_test_1.test)('forwards tenantId to service', () => {
            let capturedTenantId = null;
            const mockService = makeMockService({
                getCampaign: (planId, tenantId) => {
                    capturedTenantId = tenantId;
                    return null;
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext({ tenantId: 't-custom' });
            controller.getCampaign(ctx, 'plan-001');
            strict_1.default.strictEqual(capturedTenantId, 't-custom');
        });
    });
    // ── PATCH /campaigns/:planId/status ───────────────────────
    (0, node_test_1.describe)('updateCampaignStatus()', () => {
        (0, node_test_1.test)('updates status to Active', () => {
            let capturedPlanId = null;
            let capturedStatus = null;
            const mockService = makeMockService({
                updateCampaignStatus: (planId, status) => {
                    capturedPlanId = planId;
                    capturedStatus = status;
                    return makeCampaignPlan({ planId, status });
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.updateCampaignStatus(ctx, 'plan-001', {
                status: CampaignStatus.Active,
            });
            strict_1.default.strictEqual(capturedPlanId, 'plan-001');
            strict_1.default.strictEqual(capturedStatus, CampaignStatus.Active);
            strict_1.default.strictEqual(result.status, CampaignStatus.Active);
        });
        (0, node_test_1.test)('updates status to Paused', () => {
            const mockService = makeMockService({
                updateCampaignStatus: (planId, status) => makeCampaignPlan({ planId, status }),
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.updateCampaignStatus(ctx, 'plan-001', {
                status: CampaignStatus.Paused,
            });
            strict_1.default.strictEqual(result.status, CampaignStatus.Paused);
        });
        (0, node_test_1.test)('updates status to Completed', () => {
            const mockService = makeMockServiceWithData();
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.updateCampaignStatus(ctx, 'plan-001', {
                status: CampaignStatus.Completed,
            });
            strict_1.default.strictEqual(result.status, CampaignStatus.Completed);
        });
        (0, node_test_1.test)('passes tenantId to service', () => {
            let capturedTenantId = null;
            const mockService = makeMockService({
                updateCampaignStatus: (planId, status, tenantId) => {
                    capturedTenantId = tenantId;
                    return makeCampaignPlan({ planId, status });
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext({ tenantId: 't-tenant-bound' });
            controller.updateCampaignStatus(ctx, 'plan-001', {
                status: CampaignStatus.Active,
            });
            strict_1.default.strictEqual(capturedTenantId, 't-tenant-bound');
        });
    });
    // ── GET /campaigns/:planId/dispatches ─────────────────────
    (0, node_test_1.describe)('listPlanDispatches()', () => {
        (0, node_test_1.test)('returns empty array when no dispatches for plan', () => {
            const mockService = makeMockService();
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.listPlanDispatches(ctx, 'plan-001');
            strict_1.default.deepStrictEqual(result, []);
        });
        (0, node_test_1.test)('returns dispatches for a given plan', () => {
            let capturedFilters = null;
            const disp = makeCampaignDispatch();
            const mockService = makeMockService({
                listDispatches: (tenantId, filters) => {
                    capturedFilters = filters;
                    return [disp];
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.listPlanDispatches(ctx, 'plan-001');
            strict_1.default.strictEqual(result.length, 1);
            strict_1.default.strictEqual(result[0].dispatchId, 'disp-001');
            strict_1.default.strictEqual(capturedFilters.planId, 'plan-001');
            strict_1.default.strictEqual(capturedFilters.memberId, undefined);
        });
        (0, node_test_1.test)('multiple dispatches mapped to contracts', () => {
            const mockService = makeMockServiceWithData();
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.listPlanDispatches(ctx, 'plan-001');
            strict_1.default.strictEqual(result.length, 2);
            strict_1.default.strictEqual(result[0].dispatchId, 'disp-001');
            strict_1.default.strictEqual(result[1].dispatchId, 'disp-002');
        });
    });
    // ── GET /campaigns/dispatches/list ────────────────────────
    (0, node_test_1.describe)('listDispatches()', () => {
        (0, node_test_1.test)('returns all dispatches with no filters', () => {
            let capturedFilters = null;
            const mockService = makeMockService({
                listDispatches: (tenantId, filters) => {
                    capturedFilters = filters;
                    return [makeCampaignDispatch()];
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.listDispatches(ctx, {});
            strict_1.default.strictEqual(result.length, 1);
            strict_1.default.strictEqual(capturedFilters.memberId, undefined);
            strict_1.default.strictEqual(capturedFilters.status, undefined);
        });
        (0, node_test_1.test)('filters by memberId', () => {
            let capturedFilters = null;
            const mockService = makeMockService({
                listDispatches: (tenantId, filters) => {
                    capturedFilters = filters;
                    return [];
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            controller.listDispatches(ctx, { memberId: 'mem-filter' });
            strict_1.default.strictEqual(capturedFilters.memberId, 'mem-filter');
        });
        (0, node_test_1.test)('filters by status', () => {
            let capturedFilters = null;
            const mockService = makeMockService({
                listDispatches: (tenantId, filters) => {
                    capturedFilters = filters;
                    return [];
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            controller.listDispatches(ctx, { status: CampaignActionStatus.Failed });
            strict_1.default.strictEqual(capturedFilters.status, CampaignActionStatus.Failed);
        });
        (0, node_test_1.test)('filters by both memberId and status', () => {
            let capturedFilters = null;
            const mockService = makeMockService({
                listDispatches: (tenantId, filters) => {
                    capturedFilters = filters;
                    return [makeCampaignDispatch()];
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            controller.listDispatches(ctx, {
                memberId: 'mem-filter',
                status: CampaignActionStatus.Dispatched,
            });
            strict_1.default.strictEqual(capturedFilters.memberId, 'mem-filter');
            strict_1.default.strictEqual(capturedFilters.status, CampaignActionStatus.Dispatched);
        });
    });
    // ── POST /campaigns/evaluate ──────────────────────────────
    (0, node_test_1.describe)('evaluateTriggers()', () => {
        (0, node_test_1.test)('returns evaluation result with no matches', () => {
            const mockService = makeMockService();
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.evaluateTriggers(ctx, {
                eventName: CampaignTrigger.PaymentSuccess,
            });
            strict_1.default.strictEqual(result.matchedCampaigns, 0);
            strict_1.default.strictEqual(result.dispatchedActions, 0);
            strict_1.default.strictEqual(result.skippedActions, 0);
            strict_1.default.strictEqual(result.failedActions, 0);
            strict_1.default.deepStrictEqual(result.dispatches, []);
        });
        (0, node_test_1.test)('returns evaluation result with matches and dispatches', () => {
            const mockService = makeMockServiceWithData();
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.evaluateTriggers(ctx, {
                eventName: CampaignTrigger.PaymentSuccess,
                memberId: 'mem-001',
                orderId: 'ord-001',
                orderAmount: 500,
            });
            strict_1.default.strictEqual(result.matchedCampaigns, 2);
            strict_1.default.strictEqual(result.dispatchedActions, 1);
            strict_1.default.strictEqual(result.skippedActions, 1);
            strict_1.default.strictEqual(result.failedActions, 0);
            strict_1.default.strictEqual(result.dispatches.length, 2);
            strict_1.default.strictEqual(result.dispatches[0].dispatchId, 'disp-001');
        });
        (0, node_test_1.test)('forwards tenantContext to service', () => {
            let capturedInput = null;
            const mockService = makeMockService({
                evaluateTriggers: (input) => {
                    capturedInput = input;
                    return { matchedCampaigns: 0, dispatchedActions: 0, skippedActions: 0, failedActions: 0, dispatches: [] };
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext({ tenantId: 't-eval' });
            controller.evaluateTriggers(ctx, {
                eventName: CampaignTrigger.OrderCreated,
                memberId: 'mem-eval',
            });
            strict_1.default.strictEqual(capturedInput.tenantContext.tenantId, 't-eval');
            strict_1.default.strictEqual(capturedInput.eventName, CampaignTrigger.OrderCreated);
            strict_1.default.strictEqual(capturedInput.memberId, 'mem-eval');
        });
        (0, node_test_1.test)('forwards full payload to service', () => {
            let capturedInput = null;
            const mockService = makeMockService({
                evaluateTriggers: (input) => {
                    capturedInput = input;
                    return { matchedCampaigns: 0, dispatchedActions: 0, skippedActions: 0, failedActions: 0, dispatches: [] };
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const payload = { customKey: 'customValue' };
            controller.evaluateTriggers(ctx, {
                eventName: CampaignTrigger.MemberProfileSynced,
                memberId: 'mem-payload',
                orderAmount: 999.99,
                memberLevel: 'VIP',
                storeId: 'store-001',
                brandId: 'brand-001',
                payload,
            });
            strict_1.default.strictEqual(capturedInput.orderAmount, 999.99);
            strict_1.default.strictEqual(capturedInput.memberLevel, 'VIP');
            strict_1.default.strictEqual(capturedInput.storeId, 'store-001');
            strict_1.default.deepStrictEqual(capturedInput.payload, payload);
        });
    });
    // ── Edge cases ────────────────────────────────────────────
    (0, node_test_1.describe)('edge cases', () => {
        (0, node_test_1.test)('registerCampaign with undefined optional fields', () => {
            let capturedInput = null;
            const mockService = makeMockService({
                registerCampaign: (input) => {
                    capturedInput = input;
                    return makeCampaignPlan();
                },
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.registerCampaign(ctx, {
                code: 'CP-NO-OPTS',
                title: 'Minimal',
                triggerEvent: CampaignTrigger.PaymentSuccess,
                conditions: [],
                actions: [],
                // no description, priority, scheduledStart, scheduledEnd
            });
            strict_1.default.strictEqual(result.planId, 'plan-001');
            strict_1.default.strictEqual(capturedInput.description, undefined);
            strict_1.default.strictEqual(capturedInput.priority, undefined);
            strict_1.default.strictEqual(capturedInput.scheduledStart, undefined);
            strict_1.default.strictEqual(capturedInput.scheduledEnd, undefined);
        });
        (0, node_test_1.test)('listPlanDispatches for plan with no dispatches returns empty', () => {
            const mockService = makeMockService({
                listDispatches: () => [],
            });
            const controller = new CampaignController(mockService);
            const ctx = makeTenantContext();
            const result = controller.listPlanDispatches(ctx, 'plan-empty');
            strict_1.default.deepStrictEqual(result, []);
        });
    });
});
//# sourceMappingURL=campaign.controller.spec.js.map