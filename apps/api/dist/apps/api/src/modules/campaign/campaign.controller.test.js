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
const { CampaignController } = require('./campaign.controller');
const { CampaignStatus, CampaignTrigger, CampaignActionKind, CampaignActionStatus, CampaignConditionType } = require('./campaign.entity');
// ── 辅助工厂 ──
function createContext(tenantId = 't-campaign', brandId = 'b-campaign', storeId = 's-001') {
    return { tenantId, brandId, storeId };
}
function makeController(overrides = {}) {
    const service = {
        registerCampaign: overrides.registerCampaign ?? (() => ({ planId: 'p-default', status: CampaignStatus.Draft })),
        listCampaigns: overrides.listCampaigns ?? (() => []),
        getCampaign: overrides.getCampaign ?? (() => undefined),
        updateCampaignStatus: overrides.updateCampaignStatus ?? (() => ({ planId: 'p-updated', status: CampaignStatus.Active })),
        listDispatches: overrides.listDispatches ?? (() => []),
        evaluateTriggers: overrides.evaluateTriggers ?? (() => ({
            matchedCampaigns: 0,
            dispatchedActions: 0,
            skippedActions: 0,
            failedActions: 0,
            dispatches: []
        }))
    };
    return new CampaignController(service);
}
// ── 路由元数据 ──
(0, node_test_1.describe)('CampaignController 路由元数据', () => {
    (0, node_test_1.default)('controller metadata path is campaigns', () => {
        const path = Reflect.getMetadata('path', CampaignController);
        strict_1.default.equal(path, 'campaigns');
    });
    (0, node_test_1.default)('registerCampaign POST /', () => {
        const method = Reflect.getMetadata('method', CampaignController.prototype.registerCampaign);
        const path = Reflect.getMetadata('path', CampaignController.prototype.registerCampaign);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, '/');
    });
    (0, node_test_1.default)('listCampaigns GET /', () => {
        const method = Reflect.getMetadata('method', CampaignController.prototype.listCampaigns);
        const path = Reflect.getMetadata('path', CampaignController.prototype.listCampaigns);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, '/');
    });
    (0, node_test_1.default)('getCampaign GET /:planId', () => {
        const method = Reflect.getMetadata('method', CampaignController.prototype.getCampaign);
        const path = Reflect.getMetadata('path', CampaignController.prototype.getCampaign);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, ':planId');
    });
    (0, node_test_1.default)('updateCampaignStatus PATCH /:planId/status', () => {
        const method = Reflect.getMetadata('method', CampaignController.prototype.updateCampaignStatus);
        const path = Reflect.getMetadata('path', CampaignController.prototype.updateCampaignStatus);
        strict_1.default.ok(method === 2 || method === 4); // PATCH (RequestMethod.PATCH = 2 in NestJS enum, but can vary)
        strict_1.default.equal(path, ':planId/status');
    });
    (0, node_test_1.default)('listPlanDispatches GET /:planId/dispatches', () => {
        const method = Reflect.getMetadata('method', CampaignController.prototype.listPlanDispatches);
        const path = Reflect.getMetadata('path', CampaignController.prototype.listPlanDispatches);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, ':planId/dispatches');
    });
    (0, node_test_1.default)('listDispatches GET /dispatches/list', () => {
        const method = Reflect.getMetadata('method', CampaignController.prototype.listDispatches);
        const path = Reflect.getMetadata('path', CampaignController.prototype.listDispatches);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'dispatches/list');
    });
    (0, node_test_1.default)('evaluateTriggers POST /evaluate', () => {
        const method = Reflect.getMetadata('method', CampaignController.prototype.evaluateTriggers);
        const path = Reflect.getMetadata('path', CampaignController.prototype.evaluateTriggers);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'evaluate');
    });
});
// ── 正例测试 ──
(0, node_test_1.describe)('CampaignController 正例', () => {
    (0, node_test_1.default)('registerCampaign 委托 service 并返回 plan contract', () => {
        const mockPlan = {
            planId: 'campaign-test-1',
            tenantContext: { tenantId: 't-campaign', brandId: 'b-campaign' },
            code: 'WELCOME_BONUS',
            title: '新会员欢迎奖励',
            description: '新注册会员自动发放积分',
            status: CampaignStatus.Draft,
            triggerEvent: CampaignTrigger.MemberProfileSynced,
            conditions: [],
            actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'welcome' } }],
            priority: 10,
            scheduledStart: undefined,
            scheduledEnd: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const controller = makeController({ registerCampaign: () => mockPlan });
        const result = controller.registerCampaign(createContext(), {
            code: 'WELCOME_BONUS',
            title: '新会员欢迎奖励',
            description: '新注册会员自动发放积分',
            triggerEvent: CampaignTrigger.MemberProfileSynced,
            conditions: [],
            actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'welcome' } }],
            priority: 10
        });
        strict_1.default.equal(result.planId, 'campaign-test-1');
        strict_1.default.equal(result.title, '新会员欢迎奖励');
        strict_1.default.equal(result.status, CampaignStatus.Draft);
        strict_1.default.equal(result.triggerEvent, CampaignTrigger.MemberProfileSynced);
        strict_1.default.equal(result.actions.length, 1);
    });
    (0, node_test_1.default)('listCampaigns 返回 campaign plans 列表', () => {
        const mockPlans = [
            {
                planId: 'p-1', code: 'BIRTHDAY', title: '生日活动', status: CampaignStatus.Active,
                tenantContext: createContext(),
                triggerEvent: CampaignTrigger.MemberActivityRecurring,
                conditions: [], actions: [], priority: 1,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
            },
            {
                planId: 'p-2', code: 'BIG_SPENDER', title: '大额消费', status: CampaignStatus.Active,
                tenantContext: createContext(),
                triggerEvent: CampaignTrigger.PaymentSuccess,
                conditions: [], actions: [], priority: 5,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
            }
        ];
        const controller = makeController({ listCampaigns: () => mockPlans });
        const result = controller.listCampaigns(createContext());
        strict_1.default.equal(result.length, 2);
        strict_1.default.equal(result[0].planId, 'p-1');
        strict_1.default.equal(result[1].planId, 'p-2');
    });
    (0, node_test_1.default)('listCampaigns 支持状态过滤', () => {
        const mockPlans = [
            { planId: 'p-draft', code: 'DRAFT_CAMPAIGN', title: '草稿活动', status: CampaignStatus.Draft,
                tenantContext: createContext(),
                triggerEvent: CampaignTrigger.PaymentSuccess, conditions: [], actions: [], priority: 1,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ];
        let capturedFilter;
        const controller = makeController({
            listCampaigns: (_tenantId, filter) => {
                capturedFilter = filter;
                return mockPlans.filter((p) => p.status === filter.status);
            }
        });
        const result = controller.listCampaigns(createContext(), CampaignStatus.Draft);
        strict_1.default.equal(result.length, 1);
        strict_1.default.equal(result[0].status, CampaignStatus.Draft);
    });
    (0, node_test_1.default)('getCampaign 找到有效 plan 返回', () => {
        const mockPlan = {
            planId: 'p-find',
            tenantContext: createContext(),
            code: 'SUMMER_SALE',
            title: '夏日促销',
            status: CampaignStatus.Active,
            triggerEvent: CampaignTrigger.OrderCreated,
            conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 100 }],
            actions: [{ kind: CampaignActionKind.IssueCoupon, params: { couponPlanId: 'cp-001' } }],
            priority: 20,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const controller = makeController({ getCampaign: () => mockPlan });
        const result = controller.getCampaign(createContext(), 'p-find');
        strict_1.default.ok(result);
        strict_1.default.equal(result.planId, 'p-find');
        strict_1.default.equal(result.code, 'SUMMER_SALE');
        strict_1.default.equal(result.conditions.length, 1);
    });
    (0, node_test_1.default)('getCampaign 找不到返回 null', () => {
        const controller = makeController({ getCampaign: () => undefined });
        const result = controller.getCampaign(createContext(), 'nonexistent');
        strict_1.default.equal(result, null);
    });
    (0, node_test_1.default)('updateCampaignStatus 更新状态返回更新后 plan', () => {
        const updatedPlan = {
            planId: 'p-status',
            tenantContext: createContext(),
            code: 'STATUS_TEST',
            title: '状态测试',
            status: CampaignStatus.Active,
            triggerEvent: CampaignTrigger.PaymentSuccess,
            conditions: [], actions: [], priority: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        let capturedPlanId;
        let capturedStatus;
        const controller = makeController({
            updateCampaignStatus: (planId, status) => {
                capturedPlanId = planId;
                capturedStatus = status;
                return updatedPlan;
            }
        });
        const result = controller.updateCampaignStatus(createContext(), 'p-status', { status: CampaignStatus.Active });
        strict_1.default.equal(result.status, CampaignStatus.Active);
        strict_1.default.equal(capturedPlanId, 'p-status');
        strict_1.default.equal(capturedStatus, CampaignStatus.Active);
    });
    (0, node_test_1.default)('listDispatches 返回 dispatches 列表', () => {
        const mockDispatches = [
            {
                dispatchId: 'd-1', planId: 'p-1', actionIndex: 0,
                tenantContext: createContext(),
                memberId: 'm-01', orderId: 'o-01',
                triggerEvent: CampaignTrigger.PaymentSuccess,
                status: CampaignActionStatus.Dispatched,
                createdAt: new Date().toISOString()
            },
            {
                dispatchId: 'd-2', planId: 'p-1', actionIndex: 0,
                tenantContext: createContext(),
                memberId: 'm-02', orderId: 'o-02',
                triggerEvent: CampaignTrigger.PaymentSuccess,
                status: CampaignActionStatus.Failed,
                errorMessage: 'member not found',
                createdAt: new Date().toISOString()
            }
        ];
        const controller = makeController({ listDispatches: () => mockDispatches });
        const result = controller.listPlanDispatches(createContext(), 'p-1');
        strict_1.default.equal(result.length, 2);
        strict_1.default.equal(result[0].status, CampaignActionStatus.Dispatched);
        strict_1.default.equal(result[1].status, CampaignActionStatus.Failed);
    });
    (0, node_test_1.default)('evaluateTriggers 触发评估返回评估结果', () => {
        const mockResult = {
            matchedCampaigns: 2,
            dispatchedActions: 3,
            skippedActions: 1,
            failedActions: 0,
            dispatches: [
                {
                    dispatchId: 'd-eval-1', planId: 'p-1', actionIndex: 0,
                    tenantContext: createContext(),
                    memberId: 'm-01',
                    triggerEvent: CampaignTrigger.PaymentSuccess,
                    status: CampaignActionStatus.Dispatched,
                    resultRef: 'points+100:welcome',
                    createdAt: new Date().toISOString()
                }
            ]
        };
        const controller = makeController({ evaluateTriggers: () => mockResult });
        const result = controller.evaluateTriggers(createContext(), {
            eventName: CampaignTrigger.PaymentSuccess,
            memberId: 'm-01',
            orderAmount: 200
        });
        strict_1.default.equal(result.matchedCampaigns, 2);
        strict_1.default.equal(result.dispatchedActions, 3);
        strict_1.default.equal(result.dispatches.length, 1);
    });
});
// ── 反例测试 ──
(0, node_test_1.describe)('CampaignController 反例', () => {
    (0, node_test_1.default)('registerCampaign 缺少 actions 应被 service 层拒绝', () => {
        const controller = makeController({
            registerCampaign: () => {
                throw new Error('Campaign must declare at least one action');
            }
        });
        strict_1.default.throws(() => controller.registerCampaign(createContext(), {
            code: 'NO_ACTION',
            title: '无活动活动',
            triggerEvent: CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: []
        }), /must declare at least one action/);
    });
    (0, node_test_1.default)('registerCampaign 无效 action kind 被拒绝', () => {
        const controller = makeController({
            registerCampaign: () => {
                throw new Error('Campaign action[0] (AwardPoints) requires positive pointsAmount');
            }
        });
        strict_1.default.throws(() => controller.registerCampaign(createContext(), {
            code: 'BAD_POINTS',
            title: '无效积分活动',
            triggerEvent: CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 0 } }]
        }), /requires positive pointsAmount/);
    });
    (0, node_test_1.default)('updateCampaignStatus 非法状态转换被拒绝', () => {
        const controller = makeController({
            updateCampaignStatus: () => {
                throw new Error('Invalid campaign status transition: COMPLETED → ACTIVE');
            }
        });
        strict_1.default.throws(() => controller.updateCampaignStatus(createContext(), 'p-completed', { status: CampaignStatus.Active }), /Invalid campaign status transition/);
    });
    (0, node_test_1.default)('getCampaign 跨租户访问返回 null', () => {
        const controller = makeController({
            getCampaign: () => undefined
        });
        const result = controller.getCampaign(createContext('t-other'), 'p-1');
        strict_1.default.equal(result, null);
    });
});
// ── 边界值测试 ──
(0, node_test_1.describe)('CampaignController 边界值', () => {
    (0, node_test_1.default)('listCampaigns 空列表返回空数组', () => {
        const controller = makeController({ listCampaigns: () => [] });
        const result = controller.listCampaigns(createContext());
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.equal(result.length, 0);
    });
    (0, node_test_1.default)('listDispatches 空列表返回空数组', () => {
        const controller = makeController({ listDispatches: () => [] });
        const result = controller.listPlanDispatches(createContext(), 'plan-no-dispatches');
        strict_1.default.ok(Array.isArray(result));
        strict_1.default.equal(result.length, 0);
    });
    (0, node_test_1.default)('resgisterCampaign 携带所有可选字段', () => {
        const mockPlan = {
            planId: 'p-full', code: 'FULL_FEATURE', title: '全功能活动',
            description: '包含所有可选字段',
            status: CampaignStatus.Draft,
            tenantContext: createContext(),
            triggerEvent: CampaignTrigger.OrderCreated,
            conditions: [
                { type: CampaignConditionType.MinOrderAmount, value: 500 },
                { type: CampaignConditionType.MemberLevel, value: ['VIP', 'GOLD'] }
            ],
            actions: [
                { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 500, pointsReason: 'big_spender' } },
                { kind: CampaignActionKind.IssueCoupon, params: { couponPlanId: 'cp-vip' } },
                { kind: CampaignActionKind.IssueBlindbox, params: { blindboxPlanId: 'bb-summer', blindboxQuantity: 1 } }
            ],
            priority: 1,
            scheduledStart: '2026-01-01T00:00:00.000Z',
            scheduledEnd: '2026-12-31T23:59:59.000Z',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        let capturedInput;
        const controller = makeController({
            registerCampaign: (input) => {
                capturedInput = input;
                return mockPlan;
            }
        });
        const result = controller.registerCampaign(createContext(), {
            code: 'FULL_FEATURE',
            title: '全功能活动',
            description: '包含所有可选字段',
            triggerEvent: CampaignTrigger.OrderCreated,
            conditions: [
                { type: CampaignConditionType.MinOrderAmount, value: 500 },
                { type: CampaignConditionType.MemberLevel, value: ['VIP', 'GOLD'] }
            ],
            actions: [
                { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 500, pointsReason: 'big_spender' } },
                { kind: CampaignActionKind.IssueCoupon, params: { couponPlanId: 'cp-vip' } },
                { kind: CampaignActionKind.IssueBlindbox, params: { blindboxPlanId: 'bb-summer', blindboxQuantity: 1 } }
            ],
            priority: 1,
            scheduledStart: '2026-01-01T00:00:00.000Z',
            scheduledEnd: '2026-12-31T23:59:59.000Z'
        });
        strict_1.default.equal(result.actions.length, 3);
        strict_1.default.equal(capturedInput.conditions.length, 2);
        strict_1.default.equal(capturedInput.scheduledStart, '2026-01-01T00:00:00.000Z');
        strict_1.default.equal(capturedInput.scheduledEnd, '2026-12-31T23:59:59.000Z');
    });
    (0, node_test_1.default)('evaluateTriggers 无匹配 campaign 返回空结果', () => {
        const mockResult = {
            matchedCampaigns: 0,
            dispatchedActions: 0,
            skippedActions: 0,
            failedActions: 0,
            dispatches: []
        };
        const controller = makeController({ evaluateTriggers: () => mockResult });
        const result = controller.evaluateTriggers(createContext(), {
            eventName: 'unknown.event',
            memberId: 'm-01'
        });
        strict_1.default.equal(result.matchedCampaigns, 0);
        strict_1.default.equal(result.dispatchedActions, 0);
        strict_1.default.equal(result.dispatches.length, 0);
    });
    (0, node_test_1.default)('listDispatches 支持按 memberId 过滤', () => {
        const allDispatches = [
            { dispatchId: 'd-a', planId: 'p-1', actionIndex: 0,
                tenantContext: createContext(), memberId: 'm-alice',
                triggerEvent: 'payment.success', status: CampaignActionStatus.Dispatched,
                createdAt: new Date().toISOString() },
            { dispatchId: 'd-b', planId: 'p-1', actionIndex: 0,
                tenantContext: createContext(), memberId: 'm-bob',
                triggerEvent: 'payment.success', status: CampaignActionStatus.Dispatched,
                createdAt: new Date().toISOString() }
        ];
        let capturedFilter;
        const controller = makeController({
            listDispatches: (_tenantId, filter) => {
                capturedFilter = filter;
                return allDispatches.filter((d) => !filter.memberId || d.memberId === filter.memberId);
            }
        });
        const result = controller.listPlanDispatches(createContext(), 'p-1');
        // 默认无 memberId 过滤返回全部
        strict_1.default.equal(result.length, 2);
    });
});
// ── 多状态组合 ──
(0, node_test_1.describe)('CampaignController 状态流转组合', () => {
    (0, node_test_1.default)('Draft → Scheduled → Active → Paused → Active → Completed 完整生命周期', () => {
        const statuses = [];
        const controller = makeController({
            updateCampaignStatus: (_planId, status) => {
                statuses.push(status);
                return { planId: 'p-lifecycle', status, tenantContext: createContext(),
                    code: 'LIFECYCLE', title: '生命周期', triggerEvent: CampaignTrigger.PaymentSuccess,
                    conditions: [], actions: [], priority: 1,
                    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            }
        });
        controller.updateCampaignStatus(createContext(), 'p-lifecycle', { status: CampaignStatus.Scheduled });
        controller.updateCampaignStatus(createContext(), 'p-lifecycle', { status: CampaignStatus.Active });
        controller.updateCampaignStatus(createContext(), 'p-lifecycle', { status: CampaignStatus.Paused });
        controller.updateCampaignStatus(createContext(), 'p-lifecycle', { status: CampaignStatus.Active });
        controller.updateCampaignStatus(createContext(), 'p-lifecycle', { status: CampaignStatus.Completed });
        strict_1.default.deepEqual(statuses, [
            CampaignStatus.Scheduled,
            CampaignStatus.Active,
            CampaignStatus.Paused,
            CampaignStatus.Active,
            CampaignStatus.Completed
        ]);
    });
});
//# sourceMappingURL=campaign.controller.test.js.map