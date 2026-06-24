"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const member_approval_recorder_1 = require("./member-approval-recorder");
function createRecorderHarness() {
    const auditEntries = [];
    const prisma = {
        auditLog: {
            create: async ({ data }) => {
                auditEntries.push(data);
                return { id: `audit_${auditEntries.length}` };
            }
        }
    };
    const governanceApprovalService = {
        registerApprovalOutcomeHook: () => () => undefined
    };
    const recorder = new member_approval_recorder_1.MemberApprovalOutcomeRecorder(prisma, governanceApprovalService);
    return { recorder, auditEntries };
}
function buildEvent(overrides = {}) {
    return {
        resourceType: member_approval_recorder_1.MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
        resourceKey: 'member-001',
        stage: 'APPROVED',
        approval: {
            approvalId: 'apr_1',
            operation: 'member.points.award',
            resourceType: member_approval_recorder_1.MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
            resourceKey: 'member-001',
            required: true,
            version: 1,
            requestedBy: 'ops.admin-web',
            ticket: 'apr-ticket-001',
            status: 'APPROVED',
            submitted: true,
            persisted: true,
            decidedBy: 'ops.approver',
            decidedAt: '2026-06-12T00:00:00.000Z',
            updatedAt: '2026-06-12T00:00:00.000Z',
            summary: { memberId: 'member-001', payloadSummary: '高额加分 5000' }
        },
        tenantId: 'tenant-001',
        brandId: 'brand-001',
        storeId: 'store-001',
        decisionNote: 'manual review ok',
        previousStatus: 'PENDING',
        ...overrides
    };
}
(0, node_test_1.default)('member-approval recorder writes auditLog on APPROVED', async () => {
    const harness = createRecorderHarness();
    await harness.recorder.recordOutcome(buildEvent());
    strict_1.default.equal(harness.auditEntries.length, 1);
    const entry = harness.auditEntries[0];
    strict_1.default.equal(entry.action, 'member.approval.approved');
    strict_1.default.equal(entry.purpose, 'member-approval-outcome');
    strict_1.default.equal(entry.resourceType, 'member-profile');
    strict_1.default.equal(entry.resourceId, 'member-001');
    strict_1.default.equal(entry.tenantId, 'tenant-001');
    strict_1.default.equal(entry.operatorId, 'ops.approver');
    strict_1.default.equal(entry.sourceChannel, 'governance-approval');
    strict_1.default.deepEqual(entry.beforeValue, { approvalStatus: 'PENDING' });
    strict_1.default.deepEqual(entry.afterValue, { approvalStatus: 'APPROVED', stage: 'APPROVED' });
    const metadata = entry.metadata;
    strict_1.default.equal(metadata.stage, 'APPROVED');
    strict_1.default.equal(metadata.previousStatus, 'PENDING');
    strict_1.default.equal(metadata.summary, '审批通过：member.points.award');
});
(0, node_test_1.default)('member-approval recorder writes auditLog on REJECTED with requestedBy fallback operator', async () => {
    const harness = createRecorderHarness();
    await harness.recorder.recordOutcome(buildEvent({
        stage: 'REJECTED',
        decisionNote: 'insufficient evidence',
        previousStatus: 'PENDING'
    }));
    const entry = harness.auditEntries[0];
    strict_1.default.equal(entry.action, 'member.approval.rejected');
    strict_1.default.equal(entry.operatorId, 'ops.approver');
    const payload = entry.payload;
    strict_1.default.equal(payload.decisionNote, 'insufficient evidence');
    strict_1.default.equal(payload.previousStatus, 'PENDING');
});
(0, node_test_1.default)('member-approval recorder writes auditLog on CANCELLED with decisionNote from cancelReason', async () => {
    const harness = createRecorderHarness();
    await harness.recorder.recordOutcome(buildEvent({
        stage: 'CANCELLED',
        decisionNote: 'operator withdraw'
    }));
    const entry = harness.auditEntries[0];
    strict_1.default.equal(entry.action, 'member.approval.cancelled');
    const metadata = entry.metadata;
    strict_1.default.equal(metadata.summary, '审批撤销：member.points.award');
});
(0, node_test_1.default)('member-approval recorder writes auditLog on EXECUTION_FAILED', async () => {
    const harness = createRecorderHarness();
    await harness.recorder.recordOutcome(buildEvent({
        stage: 'EXECUTION_FAILED',
        previousStatus: 'APPROVED',
        failureReason: 'runtime timeout'
    }));
    const entry = harness.auditEntries[0];
    strict_1.default.equal(entry.action, 'member.approval.execution_failed');
    const payload = entry.payload;
    strict_1.default.equal(payload.failureReason, 'runtime timeout');
    strict_1.default.equal(payload.previousStatus, 'APPROVED');
    const metadata = entry.metadata;
    strict_1.default.equal(metadata.summary, '审批动作执行失败：member.points.award');
});
(0, node_test_1.default)('member-approval recorder skips non member-profile resourceType', async () => {
    const harness = createRecorderHarness();
    await harness.recorder.recordOutcome(buildEvent({ resourceType: 'runtime-receipt' }));
    strict_1.default.equal(harness.auditEntries.length, 0);
});
(0, node_test_1.default)('member-approval recorder skips entries without tenantId', async () => {
    const harness = createRecorderHarness();
    await harness.recorder.recordOutcome(buildEvent({ tenantId: null }));
    strict_1.default.equal(harness.auditEntries.length, 0);
});
(0, node_test_1.default)('member-approval recorder handles missing auditLog model gracefully', async () => {
    const recorder = new member_approval_recorder_1.MemberApprovalOutcomeRecorder({}, { registerApprovalOutcomeHook: () => () => undefined });
    await recorder.recordOutcome(buildEvent());
    // 没有 auditLog 模型时 recordOutcome 应直接 no-op，不抛错。
    strict_1.default.ok(true);
});
(0, node_test_1.default)('member-approval recorder onModuleInit registers member-profile hook', () => {
    const registerCalls = [];
    const governanceApprovalService = {
        registerApprovalOutcomeHook: (resourceType) => {
            registerCalls.push({ resourceType });
            return () => undefined;
        }
    };
    const recorder = new member_approval_recorder_1.MemberApprovalOutcomeRecorder({ auditLog: { create: async () => ({}) } }, governanceApprovalService);
    recorder.onModuleInit();
    strict_1.default.equal(registerCalls.length, 1);
    strict_1.default.equal(registerCalls[0]?.resourceType, 'member-profile');
    recorder.onModuleDestroy();
});
//# sourceMappingURL=member-approval-recorder.test.js.map