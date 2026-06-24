"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMemberProfileContract = toMemberProfileContract;
exports.toMemberBootstrapContract = toMemberBootstrapContract;
exports.toMemberSessionContract = toMemberSessionContract;
exports.toMemberLoginResultContract = toMemberLoginResultContract;
exports.toMemberOperationsProfileContract = toMemberOperationsProfileContract;
exports.toMemberOperationsActionContract = toMemberOperationsActionContract;
exports.toMemberAutomationTriggerContract = toMemberAutomationTriggerContract;
exports.toMemberOperationsTaskContract = toMemberOperationsTaskContract;
exports.toMemberOperationsExecutionReceiptContract = toMemberOperationsExecutionReceiptContract;
exports.toMemberProfileMutationHistoryContract = toMemberProfileMutationHistoryContract;
exports.toMemberMutationApprovalResultContract = toMemberMutationApprovalResultContract;
exports.toLytMemberSnapshotContract = toLytMemberSnapshotContract;
// ── Conversion functions ──
function toMemberProfileContract(profile) {
    return {
        memberId: profile.memberId,
        tenantContext: profile.tenantContext,
        mobile: profile.mobile,
        nickname: profile.nickname,
        email: profile.email,
        address: profile.address,
        notes: profile.notes,
        level: profile.level,
        status: profile.status,
        points: profile.points,
        growthValue: profile.growthValue,
        svipStatus: profile.svipStatus,
        registeredAt: profile.registeredAt,
        lastActiveAt: profile.lastActiveAt,
        lifecycleStage: profile.lifecycleStage,
        tags: profile.tags ? [...profile.tags] : undefined,
        lastPaymentAt: profile.lastPaymentAt,
        lastPaymentAmount: profile.lastPaymentAmount,
        lastPaymentOrderId: profile.lastPaymentOrderId,
        lastPaymentChannel: profile.lastPaymentChannel,
        source: profile.source,
        persisted: profile.persisted
    };
}
function toMemberBootstrapContract(bootstrap) {
    return {
        tenantContext: bootstrap.tenantContext,
        capabilities: [...bootstrap.capabilities],
        phase: bootstrap.phase
    };
}
function toMemberSessionContract(session) {
    return {
        sessionToken: session.sessionToken,
        memberId: session.memberId,
        userId: session.userId,
        tenantId: session.tenantId,
        brandId: session.brandId,
        storeId: session.storeId,
        issuedAt: session.issuedAt,
        expiresAt: session.expiresAt,
        authenticated: session.authenticated
    };
}
function toMemberLoginResultContract(result) {
    return {
        member: toMemberProfileContract(result.member),
        session: toMemberSessionContract(result.session)
    };
}
function toMemberOperationsProfileContract(profile) {
    return {
        memberId: profile.memberId,
        tenantContext: profile.tenantContext,
        level: profile.level,
        status: profile.status,
        lifecycleStage: profile.lifecycleStage,
        audienceSegments: [...profile.audienceSegments],
        recommendedActions: profile.recommendedActions.map(toMemberOperationsActionContract),
        automationTriggers: profile.automationTriggers.map(toMemberAutomationTriggerContract),
        lastPaymentAt: profile.lastPaymentAt,
        lastPaymentAmount: profile.lastPaymentAmount,
        lastPaymentChannel: profile.lastPaymentChannel,
        tags: [...profile.tags],
        source: profile.source
    };
}
function toMemberOperationsActionContract(action) {
    return {
        code: action.code,
        label: action.label,
        reason: action.reason,
        channel: action.channel,
        priority: action.priority
    };
}
function toMemberAutomationTriggerContract(trigger) {
    return {
        code: trigger.code,
        status: trigger.status,
        source: trigger.source,
        reason: trigger.reason
    };
}
function toMemberOperationsTaskContract(task) {
    return {
        taskId: task.taskId,
        tenantContext: task.tenantContext,
        memberId: task.memberId,
        actionCode: task.actionCode,
        title: task.title,
        reason: task.reason,
        channel: task.channel,
        priority: task.priority,
        status: task.status,
        executionLane: task.executionLane,
        source: task.source,
        sourceOrderId: task.sourceOrderId,
        sourcePaymentId: task.sourcePaymentId,
        executionSummary: task.executionSummary,
        executionTargetId: task.executionTargetId,
        executedAt: task.executedAt,
        dedupeKey: task.dedupeKey,
        createdAt: task.createdAt,
        scheduledAt: task.scheduledAt
    };
}
function toMemberOperationsExecutionReceiptContract(receipt) {
    return {
        executionId: receipt.executionId,
        tenantContext: receipt.tenantContext,
        memberId: receipt.memberId,
        taskId: receipt.taskId,
        actionCode: receipt.actionCode,
        targetType: receipt.targetType,
        targetId: receipt.targetId,
        status: receipt.status,
        summary: receipt.summary,
        payload: { ...receipt.payload },
        runtimeReceiptCode: receipt.runtimeReceiptCode,
        runtimeState: receipt.runtimeState,
        runtimeReplayable: receipt.runtimeReplayable,
        executedAt: receipt.executedAt
    };
}
function toMemberProfileMutationHistoryContract(entry) {
    return {
        historyId: entry.historyId,
        tenantContext: entry.tenantContext,
        memberId: entry.memberId,
        action: entry.action,
        summary: entry.summary,
        sourceChannel: entry.sourceChannel,
        operatorId: entry.operatorId,
        payload: entry.payload ? { ...entry.payload } : undefined,
        beforeValue: entry.beforeValue ? { ...entry.beforeValue } : undefined,
        afterValue: entry.afterValue ? { ...entry.afterValue } : undefined,
        createdAt: entry.createdAt
    };
}
function toMemberMutationApprovalResultContract(result) {
    return {
        memberId: result.memberId,
        applied: result.applied,
        approvalRequired: result.approvalRequired,
        approvalTicket: result.approvalTicket,
        approvalStatus: result.approvalStatus,
        operation: result.operation,
        summary: result.summary
    };
}
function toLytMemberSnapshotContract(snapshot) {
    return {
        snapshotId: snapshot.snapshotId,
        tenantContext: snapshot.tenantContext,
        memberProfileId: snapshot.memberProfileId,
        externalMemberId: snapshot.externalMemberId,
        memberCode: snapshot.memberCode,
        mobile: snapshot.mobile,
        nickname: snapshot.nickname,
        levelCode: snapshot.levelCode,
        points: snapshot.points,
        growthValue: snapshot.growthValue,
        status: snapshot.status,
        updatedAtFromSource: snapshot.updatedAtFromSource,
        rawVersion: snapshot.rawVersion,
        rawPayload: snapshot.rawPayload ? { ...snapshot.rawPayload } : undefined,
        source: snapshot.source
    };
}
//# sourceMappingURL=member.contract.js.map