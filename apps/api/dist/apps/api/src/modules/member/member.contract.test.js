"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const member_contract_1 = require("./member.contract");
const member_entity_1 = require("./member.entity");
// ── Shared helpers ──
const tenantCtx = { tenantId: 't-member-ct', brandId: 'b-member-ct', storeId: 's-member-ct', marketCode: 'cn-mainland' };
function makeFullMemberProfile(overrides = {}) {
    return {
        memberId: 'mem-001',
        userId: 'user-001',
        tenantContext: tenantCtx,
        mobile: '13800138000',
        nickname: '测试会员',
        email: 'test@example.com',
        address: '上海市静安区',
        notes: 'VIP 高价值客户',
        level: member_entity_1.MemberLevel.Gold,
        status: member_entity_1.MemberStatus.Active,
        points: 3500,
        growthValue: 5200,
        svipStatus: 'ACTIVE',
        registeredAt: '2026-01-15T08:00:00Z',
        lastActiveAt: '2026-06-23T10:00:00Z',
        lifecycleStage: 'vip-active',
        tags: ['paid-member', 'vip-active', 'high-value-buyer'],
        lastPaymentAt: '2026-06-23T09:30:00Z',
        lastPaymentAmount: 599,
        lastPaymentOrderId: 'ord-20260623-001',
        lastPaymentChannel: 'wechat-pay',
        source: 'prisma',
        persisted: true,
        ...overrides
    };
}
// ── toMemberProfileContract ──
(0, node_test_1.describe)('toMemberProfileContract()', () => {
    (0, node_test_1.test)('maps full MemberProfile to MemberProfileContract', () => {
        const profile = makeFullMemberProfile();
        const contract = (0, member_contract_1.toMemberProfileContract)(profile);
        strict_1.default.equal(contract.memberId, 'mem-001');
        strict_1.default.equal(contract.nickname, '测试会员');
        strict_1.default.equal(contract.mobile, '13800138000');
        strict_1.default.equal(contract.email, 'test@example.com');
        strict_1.default.equal(contract.address, '上海市静安区');
        strict_1.default.equal(contract.notes, 'VIP 高价值客户');
        strict_1.default.equal(contract.level, member_entity_1.MemberLevel.Gold);
        strict_1.default.equal(contract.status, member_entity_1.MemberStatus.Active);
        strict_1.default.equal(contract.points, 3500);
        strict_1.default.equal(contract.growthValue, 5200);
        strict_1.default.equal(contract.svipStatus, 'ACTIVE');
        strict_1.default.equal(contract.registeredAt, '2026-01-15T08:00:00Z');
        strict_1.default.equal(contract.lastActiveAt, '2026-06-23T10:00:00Z');
        strict_1.default.equal(contract.lifecycleStage, 'vip-active');
        strict_1.default.equal(contract.lastPaymentAmount, 599);
        strict_1.default.equal(contract.lastPaymentChannel, 'wechat-pay');
        strict_1.default.equal(contract.source, 'prisma');
        strict_1.default.equal(contract.persisted, true);
        strict_1.default.deepStrictEqual(contract.tenantContext, tenantCtx);
    });
    (0, node_test_1.test)('copies tags array (not reference)', () => {
        const profile = makeFullMemberProfile({ tags: ['tag-a', 'tag-b'] });
        const contract = (0, member_contract_1.toMemberProfileContract)(profile);
        strict_1.default.deepEqual(contract.tags, ['tag-a', 'tag-b']);
        // should be a new array
        contract.tags?.push('tag-c');
        strict_1.default.deepEqual(profile.tags, ['tag-a', 'tag-b']);
    });
    (0, node_test_1.test)('handles undefined optional fields gracefully', () => {
        const profile = makeFullMemberProfile({
            email: undefined,
            address: undefined,
            notes: undefined,
            tags: undefined,
            lifecycleStage: undefined,
            lastPaymentAt: undefined,
            lastPaymentAmount: undefined,
            lastPaymentOrderId: undefined,
            lastPaymentChannel: undefined,
            svipStatus: undefined
        });
        const contract = (0, member_contract_1.toMemberProfileContract)(profile);
        strict_1.default.equal(contract.email, undefined);
        strict_1.default.equal(contract.address, undefined);
        strict_1.default.equal(contract.notes, undefined);
        strict_1.default.equal(contract.tags, undefined);
        strict_1.default.equal(contract.lifecycleStage, undefined);
    });
    (0, node_test_1.test)('new member (Bronze, memory source)', () => {
        const profile = makeFullMemberProfile({
            level: member_entity_1.MemberLevel.Bronze,
            points: 0,
            growthValue: 0,
            svipStatus: 'INACTIVE',
            source: 'memory',
            persisted: false,
            tags: undefined,
            lastPaymentAt: undefined
        });
        const contract = (0, member_contract_1.toMemberProfileContract)(profile);
        strict_1.default.equal(contract.level, member_entity_1.MemberLevel.Bronze);
        strict_1.default.equal(contract.points, 0);
        strict_1.default.equal(contract.source, 'memory');
        strict_1.default.equal(contract.persisted, false);
    });
});
// ── toMemberBootstrapContract ──
(0, node_test_1.describe)('toMemberBootstrapContract()', () => {
    (0, node_test_1.test)('maps MemberBootstrap to contract', () => {
        const bootstrap = {
            tenantContext: tenantCtx,
            capabilities: ['member-center', 'points', 'svip', 'blind-box'],
            phase: 'scaffold'
        };
        const contract = (0, member_contract_1.toMemberBootstrapContract)(bootstrap);
        strict_1.default.deepStrictEqual(contract.tenantContext, tenantCtx);
        strict_1.default.deepEqual(contract.capabilities, ['member-center', 'points', 'svip', 'blind-box']);
        strict_1.default.equal(contract.phase, 'scaffold');
    });
    (0, node_test_1.test)('copies capabilities array (not reference)', () => {
        const bootstrap = {
            tenantContext: tenantCtx,
            capabilities: ['member-center'],
            phase: 'scaffold'
        };
        const contract = (0, member_contract_1.toMemberBootstrapContract)(bootstrap);
        contract.capabilities.push('extra');
        strict_1.default.deepEqual(bootstrap.capabilities, ['member-center']);
    });
});
// ── toMemberSessionContract ──
(0, node_test_1.describe)('toMemberSessionContract()', () => {
    (0, node_test_1.test)('maps MemberSession to contract', () => {
        const session = {
            sessionToken: 'tok-abc123',
            memberId: 'mem-001',
            userId: 'user-001',
            tenantId: 't-member-ct',
            brandId: 'b-member-ct',
            storeId: 's-member-ct',
            issuedAt: '2026-06-23T10:00:00Z',
            expiresAt: '2026-06-30T10:00:00Z',
            authenticated: true
        };
        const contract = (0, member_contract_1.toMemberSessionContract)(session);
        strict_1.default.equal(contract.sessionToken, 'tok-abc123');
        strict_1.default.equal(contract.memberId, 'mem-001');
        strict_1.default.equal(contract.userId, 'user-001');
        strict_1.default.equal(contract.tenantId, 't-member-ct');
        strict_1.default.equal(contract.brandId, 'b-member-ct');
        strict_1.default.equal(contract.storeId, 's-member-ct');
        strict_1.default.equal(contract.issuedAt, '2026-06-23T10:00:00Z');
        strict_1.default.equal(contract.expiresAt, '2026-06-30T10:00:00Z');
        strict_1.default.equal(contract.authenticated, true);
    });
    (0, node_test_1.test)('maps unauthenticated session', () => {
        const session = {
            sessionToken: 'tok-expired',
            memberId: 'mem-002',
            userId: 'user-002',
            tenantId: 't-member-ct',
            issuedAt: '2026-06-23T10:00:00Z',
            expiresAt: '2026-06-23T10:01:00Z',
            authenticated: false
        };
        const contract = (0, member_contract_1.toMemberSessionContract)(session);
        strict_1.default.equal(contract.authenticated, false);
        strict_1.default.equal(contract.brandId, undefined);
    });
});
// ── toMemberLoginResultContract ──
(0, node_test_1.describe)('toMemberLoginResultContract()', () => {
    (0, node_test_1.test)('maps MemberLoginResult to contract', () => {
        const member = makeFullMemberProfile({ memberId: 'mem-login', nickname: '登录会员' });
        const session = {
            sessionToken: 'tok-login-001',
            memberId: 'mem-login',
            userId: 'user-login',
            tenantId: 't-member-ct',
            brandId: 'b-member-ct',
            issuedAt: '2026-06-23T10:00:00Z',
            expiresAt: '2026-06-30T10:00:00Z',
            authenticated: true
        };
        const contract = (0, member_contract_1.toMemberLoginResultContract)({ member, session });
        strict_1.default.equal(contract.member.memberId, 'mem-login');
        strict_1.default.equal(contract.member.nickname, '登录会员');
        strict_1.default.equal(contract.session.sessionToken, 'tok-login-001');
        strict_1.default.equal(contract.session.authenticated, true);
    });
});
// ── toMemberOperationsProfileContract ──
(0, node_test_1.describe)('toMemberOperationsProfileContract()', () => {
    (0, node_test_1.test)('maps operations profile to contract with recommended actions and triggers', () => {
        const profile = {
            memberId: 'mem-ops-001',
            tenantContext: tenantCtx,
            level: member_entity_1.MemberLevel.Gold,
            status: member_entity_1.MemberStatus.Active,
            lifecycleStage: 'vip-active',
            audienceSegments: ['lifecycle-vip-active', 'level-gold', 'high-value-buyer'],
            recommendedActions: [
                {
                    code: 'assign-vip-concierge',
                    label: '分配 VIP 专属跟进',
                    reason: '高等级会员',
                    channel: 'crm-task',
                    priority: 'high'
                }
            ],
            automationTriggers: [
                {
                    code: 'vip-service-upgrade',
                    status: 'ready',
                    source: 'tag',
                    reason: 'VIP 运营门槛'
                }
            ],
            lastPaymentAt: '2026-06-23T09:30:00Z',
            lastPaymentAmount: 599,
            lastPaymentChannel: 'wechat-pay',
            tags: ['paid-member'],
            source: 'prisma'
        };
        const contract = (0, member_contract_1.toMemberOperationsProfileContract)(profile);
        strict_1.default.equal(contract.memberId, 'mem-ops-001');
        strict_1.default.equal(contract.level, member_entity_1.MemberLevel.Gold);
        strict_1.default.equal(contract.lifecycleStage, 'vip-active');
        strict_1.default.equal(contract.audienceSegments.length, 3);
        strict_1.default.equal(contract.recommendedActions.length, 1);
        strict_1.default.equal(contract.recommendedActions[0].code, 'assign-vip-concierge');
        strict_1.default.equal(contract.automationTriggers.length, 1);
        strict_1.default.equal(contract.automationTriggers[0].code, 'vip-service-upgrade');
    });
});
// ── toMemberOperationsActionContract ──
(0, node_test_1.describe)('toMemberOperationsActionContract()', () => {
    (0, node_test_1.test)('maps action fields', () => {
        const action = {
            code: 'send-post-payment-welcome',
            label: '发送首购欢迎触达',
            reason: '首单支付成功',
            channel: 'wechat',
            priority: 'high'
        };
        const contract = (0, member_contract_1.toMemberOperationsActionContract)(action);
        strict_1.default.equal(contract.code, 'send-post-payment-welcome');
        strict_1.default.equal(contract.label, '发送首购欢迎触达');
        strict_1.default.equal(contract.reason, '首单支付成功');
        strict_1.default.equal(contract.channel, 'wechat');
        strict_1.default.equal(contract.priority, 'high');
    });
});
// ── toMemberAutomationTriggerContract ──
(0, node_test_1.describe)('toMemberAutomationTriggerContract()', () => {
    (0, node_test_1.test)('maps trigger fields', () => {
        const trigger = {
            code: 'payment-success-journey',
            status: 'ready',
            source: 'payment-success',
            reason: '最近一次支付成功'
        };
        const contract = (0, member_contract_1.toMemberAutomationTriggerContract)(trigger);
        strict_1.default.equal(contract.code, 'payment-success-journey');
        strict_1.default.equal(contract.status, 'ready');
        strict_1.default.equal(contract.source, 'payment-success');
        strict_1.default.equal(contract.reason, '最近一次支付成功');
    });
});
// ── toMemberOperationsTaskContract ──
(0, node_test_1.describe)('toMemberOperationsTaskContract()', () => {
    (0, node_test_1.test)('maps queued task', () => {
        const task = {
            taskId: 'task-001',
            tenantContext: tenantCtx,
            memberId: 'mem-001',
            actionCode: 'send-post-payment-welcome',
            title: '发送首购欢迎触达',
            reason: '首单完成',
            channel: 'wechat',
            priority: 'high',
            status: 'queued',
            executionLane: 'campaign-execution',
            source: 'payment-success',
            sourceOrderId: 'ord-001',
            dedupeKey: 'dedup-mem-001-send-post-payment-welcome',
            createdAt: '2026-06-23T09:30:00Z',
            scheduledAt: '2026-06-23T09:35:00Z'
        };
        const contract = (0, member_contract_1.toMemberOperationsTaskContract)(task);
        strict_1.default.equal(contract.taskId, 'task-001');
        strict_1.default.equal(contract.memberId, 'mem-001');
        strict_1.default.equal(contract.actionCode, 'send-post-payment-welcome');
        strict_1.default.equal(contract.channel, 'wechat');
        strict_1.default.equal(contract.priority, 'high');
        strict_1.default.equal(contract.status, 'queued');
        strict_1.default.equal(contract.executionLane, 'campaign-execution');
        strict_1.default.equal(contract.dedupeKey, 'dedup-mem-001-send-post-payment-welcome');
        strict_1.default.equal(contract.sourceOrderId, 'ord-001');
    });
    (0, node_test_1.test)('maps completed task with execution details', () => {
        const task = {
            taskId: 'task-002',
            tenantContext: tenantCtx,
            memberId: 'mem-002',
            actionCode: 'issue-bounce-back-coupon',
            title: '发放回访券',
            reason: '复购引导',
            channel: 'coupon',
            priority: 'medium',
            status: 'completed',
            executionLane: 'promo-conversion',
            source: 'payment-success',
            sourceOrderId: 'ord-002',
            sourcePaymentId: 'pay-002',
            executionSummary: '已发放优惠券 CP-ABC',
            executionTargetId: 'CP-ABC',
            executedAt: '2026-06-23T10:00:00Z',
            dedupeKey: 'dedup-mem-002-issue-bounce-back-coupon',
            createdAt: '2026-06-23T09:30:00Z',
            scheduledAt: '2026-06-23T09:35:00Z'
        };
        const contract = (0, member_contract_1.toMemberOperationsTaskContract)(task);
        strict_1.default.equal(contract.status, 'completed');
        strict_1.default.equal(contract.executionSummary, '已发放优惠券 CP-ABC');
        strict_1.default.equal(contract.executionTargetId, 'CP-ABC');
        strict_1.default.equal(contract.executedAt, '2026-06-23T10:00:00Z');
    });
});
// ── toMemberOperationsExecutionReceiptContract ──
(0, node_test_1.describe)('toMemberOperationsExecutionReceiptContract()', () => {
    (0, node_test_1.test)('maps execution receipt', () => {
        const receipt = {
            executionId: 'exec-001',
            tenantContext: tenantCtx,
            memberId: 'mem-001',
            taskId: 'task-001',
            actionCode: 'issue-bounce-back-coupon',
            targetType: 'coupon-offer',
            targetId: 'CP-ABC',
            status: 'completed',
            summary: '已发放运营优惠券 CP-ABC',
            payload: { couponCode: 'CP-ABC', discountAmount: 30, currency: 'CNY' },
            runtimeReceiptCode: 'rt-001',
            runtimeState: 'callback-recorded',
            runtimeReplayable: true,
            executedAt: '2026-06-23T10:00:00Z'
        };
        const contract = (0, member_contract_1.toMemberOperationsExecutionReceiptContract)(receipt);
        strict_1.default.equal(contract.executionId, 'exec-001');
        strict_1.default.equal(contract.memberId, 'mem-001');
        strict_1.default.equal(contract.taskId, 'task-001');
        strict_1.default.equal(contract.actionCode, 'issue-bounce-back-coupon');
        strict_1.default.equal(contract.targetType, 'coupon-offer');
        strict_1.default.equal(contract.status, 'completed');
        strict_1.default.equal(contract.runtimeReceiptCode, 'rt-001');
        strict_1.default.equal(contract.runtimeState, 'callback-recorded');
        strict_1.default.equal(contract.runtimeReplayable, true);
        strict_1.default.deepEqual(contract.payload, { couponCode: 'CP-ABC', discountAmount: 30, currency: 'CNY' });
    });
    (0, node_test_1.test)('copies payload (not reference)', () => {
        const receipt = {
            executionId: 'exec-002',
            tenantContext: tenantCtx,
            memberId: 'mem-002',
            taskId: 'task-002',
            actionCode: 'assign-vip-concierge',
            targetType: 'crm-follow-up',
            targetId: 'followup-001',
            status: 'completed',
            summary: '已创建 CRM 跟进工单',
            payload: { queueId: 'vip-concierge', slaHours: 2 },
            executedAt: '2026-06-23T10:00:00Z'
        };
        const contract = (0, member_contract_1.toMemberOperationsExecutionReceiptContract)(receipt);
        contract.payload.extra = 'injected';
        strict_1.default.equal(receipt.payload.extra, undefined);
    });
});
// ── toMemberProfileMutationHistoryContract ──
(0, node_test_1.describe)('toMemberProfileMutationHistoryContract()', () => {
    (0, node_test_1.test)('maps status-updated history entry', () => {
        const entry = {
            historyId: 'hist-001',
            tenantContext: tenantCtx,
            memberId: 'mem-001',
            action: 'status-updated',
            summary: '会员状态已调整为 FROZEN',
            sourceChannel: 'member-admin',
            operatorId: 'admin-001',
            payload: { status: 'FROZEN' },
            beforeValue: { status: 'ACTIVE' },
            afterValue: { status: 'FROZEN' },
            createdAt: '2026-06-23T10:00:00Z'
        };
        const contract = (0, member_contract_1.toMemberProfileMutationHistoryContract)(entry);
        strict_1.default.equal(contract.historyId, 'hist-001');
        strict_1.default.equal(contract.memberId, 'mem-001');
        strict_1.default.equal(contract.action, 'status-updated');
        strict_1.default.equal(contract.summary, '会员状态已调整为 FROZEN');
        strict_1.default.equal(contract.sourceChannel, 'member-admin');
        strict_1.default.equal(contract.operatorId, 'admin-001');
        strict_1.default.deepEqual(contract.payload, { status: 'FROZEN' });
        strict_1.default.deepEqual(contract.beforeValue, { status: 'ACTIVE' });
        strict_1.default.deepEqual(contract.afterValue, { status: 'FROZEN' });
    });
    (0, node_test_1.test)('maps points-awarded entry', () => {
        const entry = {
            historyId: 'hist-002',
            tenantContext: tenantCtx,
            memberId: 'mem-002',
            action: 'points-awarded',
            summary: '会员积分已增加 200',
            sourceChannel: 'member-admin',
            operatorId: 'admin-002',
            payload: { points: 200 },
            createdAt: '2026-06-23T10:00:00Z'
        };
        const contract = (0, member_contract_1.toMemberProfileMutationHistoryContract)(entry);
        strict_1.default.equal(contract.action, 'points-awarded');
        strict_1.default.equal(contract.summary, '会员积分已增加 200');
        strict_1.default.equal(contract.beforeValue, undefined);
        strict_1.default.equal(contract.afterValue, undefined);
    });
    (0, node_test_1.test)('copies payload/values (not reference)', () => {
        const entry = {
            historyId: 'hist-003',
            tenantContext: tenantCtx,
            memberId: 'mem-003',
            action: 'approval.approved',
            summary: '审批通过',
            sourceChannel: 'member-admin',
            operatorId: 'admin-003',
            payload: { operation: 'level-update' },
            beforeValue: { level: 'GOLD' },
            afterValue: { level: 'PLATINUM' },
            createdAt: '2026-06-23T10:00:00Z'
        };
        const contract = (0, member_contract_1.toMemberProfileMutationHistoryContract)(entry);
        contract.payload.extra = 'injected';
        strict_1.default.equal(entry.payload.extra, undefined);
        contract.beforeValue.extra = 'injected';
        strict_1.default.equal(entry.beforeValue.extra, undefined);
    });
});
// ── toMemberMutationApprovalResultContract ──
(0, node_test_1.describe)('toMemberMutationApprovalResultContract()', () => {
    (0, node_test_1.test)('maps pending approval', () => {
        const result = {
            memberId: 'mem-001',
            applied: false,
            approvalRequired: true,
            approvalTicket: 'ticket-pending-001',
            approvalStatus: 'PENDING',
            operation: 'member.points.award',
            summary: '加积分需要审批'
        };
        const contract = (0, member_contract_1.toMemberMutationApprovalResultContract)(result);
        strict_1.default.equal(contract.memberId, 'mem-001');
        strict_1.default.equal(contract.applied, false);
        strict_1.default.equal(contract.approvalRequired, true);
        strict_1.default.equal(contract.approvalTicket, 'ticket-pending-001');
        strict_1.default.equal(contract.approvalStatus, 'PENDING');
        strict_1.default.equal(contract.operation, 'member.points.award');
        strict_1.default.equal(contract.summary, '加积分需要审批');
    });
    (0, node_test_1.test)('maps rejected approval', () => {
        const result = {
            memberId: 'mem-002',
            applied: false,
            approvalRequired: true,
            approvalTicket: null,
            approvalStatus: 'REJECTED',
            operation: 'member.status.update',
            summary: '状态变更被驳回'
        };
        const contract = (0, member_contract_1.toMemberMutationApprovalResultContract)(result);
        strict_1.default.equal(contract.approvalTicket, null);
        strict_1.default.equal(contract.approvalStatus, 'REJECTED');
    });
    (0, node_test_1.test)('maps not-required (no approval needed)', () => {
        const result = {
            memberId: 'mem-003',
            applied: false,
            approvalRequired: true,
            approvalTicket: null,
            approvalStatus: 'NOT_REQUIRED',
            operation: 'member.profile.update',
            summary: '基础资料修改无需审批'
        };
        const contract = (0, member_contract_1.toMemberMutationApprovalResultContract)(result);
        strict_1.default.equal(contract.approvalStatus, 'NOT_REQUIRED');
        strict_1.default.equal(contract.approvalTicket, null);
        strict_1.default.equal(contract.summary, '基础资料修改无需审批');
    });
});
// ── toLytMemberSnapshotContract ──
(0, node_test_1.describe)('toLytMemberSnapshotContract()', () => {
    (0, node_test_1.test)('maps full LYT member snapshot', () => {
        const snapshot = {
            snapshotId: 'snap-001',
            tenantContext: tenantCtx,
            memberProfileId: 'mem-profile-001',
            externalMemberId: 'ext-mem-001',
            memberCode: 'M2026-0001',
            mobile: '13800138000',
            nickname: 'LYT 会员',
            levelCode: 'GOLD',
            points: 3500,
            growthValue: 5200,
            status: 'ACTIVE',
            updatedAtFromSource: '2026-06-23T09:30:00Z',
            rawVersion: 'v2.1',
            rawPayload: { externalId: 'ext-001', channel: 'wechat' },
            source: 'prisma'
        };
        const contract = (0, member_contract_1.toLytMemberSnapshotContract)(snapshot);
        strict_1.default.equal(contract.snapshotId, 'snap-001');
        strict_1.default.equal(contract.memberProfileId, 'mem-profile-001');
        strict_1.default.equal(contract.externalMemberId, 'ext-mem-001');
        strict_1.default.equal(contract.memberCode, 'M2026-0001');
        strict_1.default.equal(contract.nickname, 'LYT 会员');
        strict_1.default.equal(contract.levelCode, 'GOLD');
        strict_1.default.equal(contract.points, 3500);
        strict_1.default.equal(contract.growthValue, 5200);
        strict_1.default.equal(contract.status, 'ACTIVE');
        strict_1.default.equal(contract.updatedAtFromSource, '2026-06-23T09:30:00Z');
        strict_1.default.equal(contract.rawVersion, 'v2.1');
        strict_1.default.equal(contract.source, 'prisma');
        strict_1.default.deepEqual(contract.tenantContext, tenantCtx);
    });
    (0, node_test_1.test)('maps memory-sourced snapshot', () => {
        const snapshot = {
            snapshotId: 'snap-002',
            tenantContext: { tenantId: 't-min' },
            externalMemberId: 'ext-mem-002',
            points: 0,
            growthValue: 0,
            status: 'ACTIVE',
            updatedAtFromSource: '2026-06-23T10:00:00Z',
            source: 'memory'
        };
        const contract = (0, member_contract_1.toLytMemberSnapshotContract)(snapshot);
        strict_1.default.equal(contract.snapshotId, 'snap-002');
        strict_1.default.equal(contract.externalMemberId, 'ext-mem-002');
        strict_1.default.equal(contract.memberProfileId, undefined);
        strict_1.default.equal(contract.memberCode, undefined);
        strict_1.default.equal(contract.points, 0);
        strict_1.default.equal(contract.source, 'memory');
    });
    (0, node_test_1.test)('copies rawPayload (not reference)', () => {
        const snapshot = {
            snapshotId: 'snap-003',
            tenantContext: tenantCtx,
            externalMemberId: 'ext-mem-003',
            points: 100,
            growthValue: 100,
            status: 'ACTIVE',
            updatedAtFromSource: '2026-06-23T10:00:00Z',
            rawPayload: { key: 'value' },
            source: 'memory'
        };
        const contract = (0, member_contract_1.toLytMemberSnapshotContract)(snapshot);
        contract.rawPayload.extra = 'injected';
        strict_1.default.equal(snapshot.rawPayload.extra, undefined);
    });
});
//# sourceMappingURL=member.contract.test.js.map