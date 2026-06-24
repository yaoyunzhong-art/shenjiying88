import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import { buildGovernanceApprovalDetailHref } from './approvals-data';

export type GovernanceApprovalStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'SUPERSEDED';

export interface GovernanceApprovalSnapshot {
  approvalId: string | null;
  operation?: string;
  resourceType?: string;
  resourceKey?: string;
  required: boolean;
  version: number | null;
  requestedBy: string | null;
  ticket: string | null;
  status: GovernanceApprovalStatus;
  submitted: boolean;
  persisted: boolean;
  decidedBy: string | null;
  decidedAt: string | null;
  updatedAt: string | null;
  execution?: {
    attempts: number;
    executed: boolean;
    executionStatus: string | null;
    executedAt: string | null;
    executedBy: string | null;
    lastFailure: {
      failureStatus: string | null;
      failureReason: string | null;
      failedAt: string | null;
      failedBy: string | null;
    } | null;
  };
  summary?: Record<string, unknown> | null;
}

export interface GovernanceApprovalMetrics {
  total: number;
  statuses: Record<GovernanceApprovalStatus, number>;
  execution: {
    executed: number;
    pending: number;
    withFailures: number;
    byExecutionStatus: Record<string, number>;
    byFailureStatus: Record<string, number>;
  };
}

export interface GovernanceApprovalListSnapshot {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  approvals: GovernanceApprovalSnapshot[];
  summary: GovernanceApprovalMetrics;
}

export interface GovernanceApprovalDetailSnapshot {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  approval: GovernanceApprovalSnapshot | null;
  runtimeReceiptHref: string | null;
  memberHref: string | null;
  memberReviewHref: string | null;
}

export type GovernanceApprovalOutcomeStatus =
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'superseded'
  | 'executed'
  | 'execution-failed'
  | 'recorded';

export interface GovernanceApprovalOutcomeAuditLogEntry {
  auditLogId: string;
  ticket: string;
  purpose: string;
  action: string;
  status: GovernanceApprovalOutcomeStatus | string;
  memberId: string | null;
  operatorId: string | null;
  decisionBy: string | null;
  decisionAt: string | null;
  occurredAt: string | null;
  summary: string;
  details: Record<string, unknown>;
}

export interface GovernanceApprovalOutcomeAuditSnapshot {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  ticket: string;
  entries: GovernanceApprovalOutcomeAuditLogEntry[];
}

export interface GovernanceApprovalListFilter {
  status?: GovernanceApprovalStatus;
  operation?: string;
  resourceType?: string;
  resourceKey?: string;
  resourceCategory?: GovernanceApprovalResourceCategory | 'all';
}

const fallbackApprovals: GovernanceApprovalSnapshot[] = [
  {
    approvalId: 'approval-001',
    operation: 'foundation.runtime-governance.replay',
    resourceType: 'runtime-governance-receipt',
    resourceKey: 'ADMIN-RUNTIME-001',
    required: true,
    version: 1,
    requestedBy: 'ops.admin-web',
    ticket: 'APR-RTREPL-001',
    status: 'PENDING',
    submitted: true,
    persisted: true,
    decidedBy: null,
    decidedAt: null,
    updatedAt: '2026-06-15T10:00:00.000Z',
    execution: {
      attempts: 0,
      executed: false,
      executionStatus: null,
      executedAt: null,
      executedBy: null,
      lastFailure: null,
    },
    summary: {
      riskLevel: 'high',
      requestedFrom: 'ADMIN_WEB_RUNTIME',
      memberId: 'member-001',
      executionId: 'ops-exec-001',
      taskId: 'ops-task-001',
      actionCode: 'assign-vip-concierge',
      requestEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-RUNTIME-001/replay',
      payloadSummary: '高风险 replay 待审批',
      requestPayload: {
        receiptCode: 'ADMIN-RUNTIME-001',
        ledgerKey: 'runtime-ledger:ADMIN-RUNTIME-001',
        memberId: 'member-001',
        executionId: 'ops-exec-001',
        taskId: 'ops-task-001',
        actionCode: 'assign-vip-concierge',
      },
    },
  },
  {
    approvalId: 'approval-002',
    operation: 'foundation.runtime-governance.replay',
    resourceType: 'runtime-governance-receipt',
    resourceKey: 'ADMIN-RUNTIME-002',
    required: true,
    version: 3,
    requestedBy: 'ops.admin-web',
    ticket: 'APR-RTREPL-002',
    status: 'APPROVED',
    submitted: true,
    persisted: true,
    decidedBy: 'ops.approver',
    decidedAt: '2026-06-15T09:30:00.000Z',
    updatedAt: '2026-06-15T09:31:00.000Z',
    execution: {
      attempts: 1,
      executed: true,
      executionStatus: 'runtime-replay-scheduled',
      executedAt: '2026-06-15T09:31:00.000Z',
      executedBy: 'runtime-governance',
      lastFailure: null,
    },
    summary: {
      riskLevel: 'high',
      requestedFrom: 'ADMIN_WEB_RUNTIME',
      requestEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-RUNTIME-002/replay',
      payloadSummary: '高风险 replay 已审批执行',
      requestPayload: {
        receiptCode: 'ADMIN-RUNTIME-002',
        ledgerKey: 'runtime-ledger:ADMIN-RUNTIME-002',
      },
    },
  },
  {
    approvalId: 'approval-003',
    operation: 'foundation.runtime-governance.replay',
    resourceType: 'runtime-governance-receipt',
    resourceKey: 'ADMIN-RUNTIME-003',
    required: true,
    version: 2,
    requestedBy: 'ops.admin-web',
    ticket: 'APR-RTREPL-003',
    status: 'REJECTED',
    submitted: true,
    persisted: true,
    decidedBy: 'ops.approver',
    decidedAt: '2026-06-15T08:05:00.000Z',
    updatedAt: '2026-06-15T08:06:00.000Z',
    execution: {
      attempts: 0,
      executed: false,
      executionStatus: null,
      executedAt: null,
      executedBy: null,
      lastFailure: {
        failureStatus: 'approval-rejected',
        failureReason: '高风险 replay 被驳回，等待补充材料后重提',
        failedAt: '2026-06-15T08:06:00.000Z',
        failedBy: 'ops.approver',
      },
    },
    summary: {
      riskLevel: 'high',
      requestedFrom: 'ADMIN_WEB_RUNTIME',
      memberId: 'member-001',
      executionId: 'ops-exec-003',
      taskId: 'ops-task-003',
      actionCode: 'manual-retention-review',
      sourceOrderId: 'order-001',
      requestEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-RUNTIME-003/replay',
      payloadSummary: '高风险 replay 已驳回，等待重新提交',
      requestPayload: {
        receiptCode: 'ADMIN-RUNTIME-003',
        ledgerKey: 'runtime-ledger:ADMIN-RUNTIME-003',
        memberId: 'member-001',
        executionId: 'ops-exec-003',
        taskId: 'ops-task-003',
        actionCode: 'manual-retention-review',
        sourceOrderId: 'order-001',
      },
    },
  },
  {
    approvalId: 'approval-004',
    operation: 'member.points.award',
    resourceType: 'member-profile',
    resourceKey: 'member-001',
    required: true,
    version: 1,
    requestedBy: 'ops.admin-web',
    ticket: 'APR-MEMBER-001',
    status: 'PENDING',
    submitted: true,
    persisted: true,
    decidedBy: null,
    decidedAt: null,
    updatedAt: '2026-06-16T03:30:00.000Z',
    execution: {
      attempts: 0,
      executed: false,
      executionStatus: null,
      executedAt: null,
      executedBy: null,
      lastFailure: null,
    },
    summary: {
      riskLevel: 'high',
      requestedFrom: 'ADMIN_WEB_MEMBER',
      memberId: 'member-001',
      requestEndpoint: '/api/v1/members/member-001/points/award',
      payloadSummary: '手工给 VIP 客户加 5200 积分，待审批',
      requestPayload: {
        memberId: 'member-001',
        points: 5200,
        reason: 'vip-compensation',
      },
    },
  },
];

const fallbackOutcomeAuditLogs: GovernanceApprovalOutcomeAuditLogEntry[] = [
  {
    auditLogId: 'audit-fallback-001',
    ticket: 'APR-MEMBER-001',
    purpose: 'member-approval-outcome',
    action: 'member.approval.approved',
    status: 'approved',
    memberId: 'member-001',
    operatorId: 'ops.approver-001',
    decisionBy: 'ops.approver-001',
    decisionAt: '2026-06-16T04:00:00.000Z',
    occurredAt: '2026-06-16T04:00:00.000Z',
    summary: '审批单 APR-MEMBER-001 通过，5200 积分已发放到 member-001',
    details: {
      approvalTicket: 'APR-MEMBER-001',
      memberId: 'member-001',
      operation: 'member.points.award',
      points: 5200
    }
  },
  {
    auditLogId: 'audit-fallback-002',
    ticket: 'APR-MEMBER-001',
    purpose: 'member-approval-outcome',
    action: 'member.approval.executed',
    status: 'executed',
    memberId: 'member-001',
    operatorId: 'system.executor',
    decisionBy: 'ops.approver-001',
    decisionAt: '2026-06-16T04:00:00.000Z',
    occurredAt: '2026-06-16T04:00:12.000Z',
    summary: '审批单 APR-MEMBER-001 对应的积分执行已完成',
    details: {
      approvalTicket: 'APR-MEMBER-001',
      memberId: 'member-001',
      executionStatus: 'EXECUTED',
      attempts: 1
    }
  },
  {
    auditLogId: 'audit-fallback-003',
    ticket: 'APR-RTREPL-002',
    purpose: 'member-approval-outcome',
    action: 'member.approval.rejected',
    status: 'rejected',
    memberId: null,
    operatorId: 'ops.reviewer',
    decisionBy: 'ops.reviewer',
    decisionAt: '2026-06-15T11:30:00.000Z',
    occurredAt: '2026-06-15T11:30:00.000Z',
    summary: '审批单 APR-RTREPL-002 被驳回',
    details: {
      approvalTicket: 'APR-RTREPL-002',
      resourceType: 'runtime-governance-receipt',
      decisionNote: 'insufficient evidence'
    }
  }
];

function selectFallbackOutcomeAuditLogs(
  ticket: string | null | undefined
): GovernanceApprovalOutcomeAuditLogEntry[] {
  if (!ticket) return [];
  return fallbackOutcomeAuditLogs.filter((entry) => entry.ticket === ticket);
}

function createApprovalClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
  });
}

function normalizeOutcomeAuditEntry(raw: unknown): GovernanceApprovalOutcomeAuditLogEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const source = raw as Record<string, unknown>;
  const details =
    source.details && typeof source.details === 'object'
      ? (source.details as Record<string, unknown>)
      : {};
  const ticket =
    typeof source.ticket === 'string'
      ? source.ticket
      : typeof details.approvalTicket === 'string'
        ? (details.approvalTicket as string)
        : null;
  if (!ticket) {
    return null;
  }
  const occurredAt =
    typeof source.occurredAt === 'string'
      ? source.occurredAt
      : typeof source.createdAt === 'string'
        ? (source.createdAt as string)
        : null;
  const decisionAt =
    typeof source.decisionAt === 'string'
      ? source.decisionAt
      : occurredAt;
  return {
    auditLogId:
      typeof source.auditLogId === 'string'
        ? (source.auditLogId as string)
        : typeof source.id === 'string'
          ? (source.id as string)
          : `audit-${ticket}-${occurredAt ?? 'unknown'}`,
    ticket,
    purpose: typeof source.purpose === 'string' ? (source.purpose as string) : 'member-approval-outcome',
    action: typeof source.action === 'string' ? (source.action as string) : 'member.approval.recorded',
    status:
      typeof source.status === 'string'
        ? (source.status as string)
        : 'recorded',
    memberId:
      typeof source.memberId === 'string'
        ? (source.memberId as string)
        : typeof details.memberId === 'string'
          ? (details.memberId as string)
          : null,
    operatorId:
      typeof source.operatorId === 'string'
        ? (source.operatorId as string)
        : typeof details.operatorId === 'string'
          ? (details.operatorId as string)
          : null,
    decisionBy:
      typeof source.decisionBy === 'string'
        ? (source.decisionBy as string)
        : typeof details.decisionBy === 'string'
          ? (details.decisionBy as string)
          : null,
    decisionAt,
    occurredAt,
    summary:
      typeof source.summary === 'string'
        ? (source.summary as string)
        : typeof source.description === 'string'
          ? (source.description as string)
          : '',
    details
  };
}

function createFallbackMetrics(approvals: GovernanceApprovalSnapshot[]): GovernanceApprovalMetrics {
  const metrics: GovernanceApprovalMetrics = {
    total: 0,
    statuses: {
      NOT_REQUIRED: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      CANCELLED: 0,
      SUPERSEDED: 0,
    },
    execution: {
      executed: 0,
      pending: 0,
      withFailures: 0,
      byExecutionStatus: {},
      byFailureStatus: {},
    },
  };

  for (const approval of approvals) {
    metrics.total += 1;
    metrics.statuses[approval.status] += 1;
    if (approval.execution?.executed) {
      metrics.execution.executed += 1;
    } else {
      metrics.execution.pending += 1;
    }
    if (approval.execution?.executionStatus) {
      metrics.execution.byExecutionStatus[approval.execution.executionStatus] =
        (metrics.execution.byExecutionStatus[approval.execution.executionStatus] ?? 0) + 1;
    }
    if (approval.execution?.lastFailure?.failureStatus) {
      metrics.execution.withFailures += 1;
      metrics.execution.byFailureStatus[approval.execution.lastFailure.failureStatus] =
        (metrics.execution.byFailureStatus[approval.execution.lastFailure.failureStatus] ?? 0) + 1;
    }
  }

  return metrics;
}

function buildApprovalQueryString(filter: GovernanceApprovalListFilter = {}): string {
  const params = new URLSearchParams();
  if (filter.status) {
    params.set('status', filter.status);
  }
  if (filter.operation) {
    params.set('operation', filter.operation);
  }
  if (filter.resourceType) {
    params.set('resourceType', filter.resourceType);
  }
  if (filter.resourceKey) {
    params.set('resourceKey', filter.resourceKey);
  }
  if (filter.resourceCategory && filter.resourceCategory !== 'all') {
    if (filter.resourceCategory === 'member-profile') {
      params.set('resourceType', 'member-profile');
    } else if (filter.resourceCategory === 'runtime-receipt') {
      params.set('resourceType', 'runtime-receipt');
    }
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

function filterFallbackApprovals(filter: GovernanceApprovalListFilter = {}) {
  return fallbackApprovals.filter((approval) => {
    if (filter.status && approval.status !== filter.status) {
      return false;
    }
    if (filter.operation && approval.operation !== filter.operation) {
      return false;
    }
    if (filter.resourceType && approval.resourceType !== filter.resourceType) {
      return false;
    }
    if (filter.resourceKey && approval.resourceKey !== filter.resourceKey) {
      return false;
    }
    if (filter.resourceCategory && !isApprovalInResourceCategory(approval, filter.resourceCategory)) {
      return false;
    }
    return true;
  });
}

function getApprovalRequestPayload(approval: GovernanceApprovalSnapshot): Record<string, unknown> | null {
  const summary = approval.summary;
  if (!summary || typeof summary !== 'object') {
    return null;
  }
  const payload = (summary as Record<string, unknown>).requestPayload;
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
}

function getApprovalSummaryRecord(approval: GovernanceApprovalSnapshot): Record<string, unknown> | null {
  const summary = approval.summary;
  return summary && typeof summary === 'object' ? (summary as Record<string, unknown>) : null;
}

export interface GovernanceApprovalMemberContext {
  memberId: string;
  executionId?: string;
  taskId?: string;
  actionCode?: string;
  executionLane?: string;
  targetType?: string;
  targetId?: string;
  sourceOrderId?: string;
  sourcePaymentId?: string;
}

export interface GovernanceApprovalRequestDescriptor {
  operationLabel: string;
  summary: string;
  riskLevel: string | null;
  requestedField: string | null;
  currentValue: string | null;
  targetValue: string | null;
}

export type GovernanceApprovalResourceCategory =
  | 'member-profile'
  | 'runtime-receipt'
  | 'unknown';

export interface GovernanceApprovalResourceCategoryOption {
  value: GovernanceApprovalResourceCategory | 'all';
  label: string;
  description: string;
}

export const governanceApprovalResourceCategoryOptions: GovernanceApprovalResourceCategoryOption[] = [
  { value: 'all', label: '全部', description: '所有资源类型的审批单' },
  { value: 'member-profile', label: '会员档案', description: '高风险会员动作审批' },
  { value: 'runtime-receipt', label: 'Runtime 治理', description: 'runtime 治理回放与失败补偿' },
];

const memberProfileResourceTypes = new Set<string>(['member-profile']);
const runtimeReceiptResourceTypes = new Set<string>(['runtime-receipt', 'runtime-governance-receipt']);

export function getApprovalResourceCategory(
  approval: Pick<GovernanceApprovalSnapshot, 'resourceType' | 'operation' | 'summary'> & {
    resourceType?: string | null;
  }
): GovernanceApprovalResourceCategory {
  const resourceType = approval.resourceType ?? null;
  if (resourceType && memberProfileResourceTypes.has(resourceType)) {
    return 'member-profile';
  }
  if (resourceType && runtimeReceiptResourceTypes.has(resourceType)) {
    return 'runtime-receipt';
  }
  if (approval.operation?.startsWith('foundation.runtime-governance.')) {
    return 'runtime-receipt';
  }
  if (approval.operation?.startsWith('member.')) {
    return 'member-profile';
  }
  return 'unknown';
}

export function getApprovalResourceCategoryLabel(
  category: GovernanceApprovalResourceCategory
): string {
  return (
    governanceApprovalResourceCategoryOptions.find((option) => option.value === category)?.label ??
    '未分类'
  );
}

export function getApprovalResourceCategoryHrefSuffix(
  category: GovernanceApprovalResourceCategory | 'all'
): string {
  return category === 'all' ? '' : `&resourceCategory=${category}`;
}

export function isApprovalInResourceCategory(
  approval: Pick<GovernanceApprovalSnapshot, 'resourceType' | 'operation' | 'summary'> & {
    resourceType?: string | null;
  },
  category: GovernanceApprovalResourceCategory | 'all'
): boolean {
  if (category === 'all') {
    return true;
  }
  return getApprovalResourceCategory(approval) === category;
}

export function getApprovalMemberContext(
  approval: GovernanceApprovalSnapshot
): GovernanceApprovalMemberContext | null {
  const summary = getApprovalSummaryRecord(approval);
  const payload = getApprovalRequestPayload(approval);
  const memberId =
    (typeof summary?.memberId === 'string' ? summary.memberId : undefined) ??
    (typeof payload?.memberId === 'string' ? payload.memberId : undefined);

  if (!memberId) {
    return null;
  }

  return {
    memberId,
    executionId:
      (typeof summary?.executionId === 'string' ? summary.executionId : undefined) ??
      (typeof payload?.executionId === 'string' ? payload.executionId : undefined),
    taskId:
      (typeof summary?.taskId === 'string' ? summary.taskId : undefined) ??
      (typeof payload?.taskId === 'string' ? payload.taskId : undefined),
    actionCode:
      (typeof summary?.actionCode === 'string' ? summary.actionCode : undefined) ??
      (typeof payload?.actionCode === 'string' ? payload.actionCode : undefined),
    executionLane:
      (typeof summary?.executionLane === 'string' ? summary.executionLane : undefined) ??
      (typeof payload?.executionLane === 'string' ? payload.executionLane : undefined),
    targetType:
      (typeof summary?.targetType === 'string' ? summary.targetType : undefined) ??
      (typeof payload?.targetType === 'string' ? payload.targetType : undefined),
    targetId:
      (typeof summary?.targetId === 'string' ? summary.targetId : undefined) ??
      (typeof payload?.targetId === 'string' ? payload.targetId : undefined),
    sourceOrderId:
      (typeof summary?.sourceOrderId === 'string' ? summary.sourceOrderId : undefined) ??
      (typeof payload?.sourceOrderId === 'string' ? payload.sourceOrderId : undefined),
    sourcePaymentId:
      (typeof summary?.sourcePaymentId === 'string' ? summary.sourcePaymentId : undefined) ??
      (typeof payload?.sourcePaymentId === 'string' ? payload.sourcePaymentId : undefined),
  };
}

export function getApprovalMemberHref(approval: GovernanceApprovalSnapshot): string | null {
  const context = getApprovalMemberContext(approval);
  return context ? `/members/${context.memberId}` : null;
}

export function buildApprovalMemberReviewHref(approval: GovernanceApprovalSnapshot): string | null {
  const memberHref = getApprovalMemberHref(approval);
  if (!memberHref) {
    return null;
  }

  const params = new URLSearchParams();
  if (approval.ticket) {
    params.set('approvalTicket', approval.ticket);
  }
  if (approval.status) {
    params.set('approvalStatus', approval.status);
  }
  if (approval.operation) {
    params.set('approvalOperation', approval.operation);
  }
  if (approval.decidedAt) {
    params.set('approvalDecidedAt', approval.decidedAt);
  } else if (approval.updatedAt) {
    params.set('approvalUpdatedAt', approval.updatedAt);
  }
  if (approval.status === 'APPROVED' || approval.status === 'REJECTED' || approval.status === 'CANCELLED') {
    params.set('approvalRefresh', '1');
  }

  const query = params.toString();
  return query ? `${memberHref}?${query}` : memberHref;
}

export function describeGovernanceApprovalRequest(
  approval: GovernanceApprovalSnapshot
): GovernanceApprovalRequestDescriptor {
  const summary = getApprovalSummaryRecord(approval);
  const payload = getApprovalRequestPayload(approval);
  const payloadSummary =
    typeof summary?.payloadSummary === 'string' && summary.payloadSummary.trim().length > 0
      ? summary.payloadSummary
      : null;
  const riskLevel = typeof summary?.riskLevel === 'string' ? summary.riskLevel : null;
  const operation = approval.operation ?? 'unknown-operation';

  if (operation === 'member.points.award') {
    const points = typeof payload?.points === 'number' ? payload.points : null;
    return {
      operationLabel: '会员加分审批',
      summary: payloadSummary ?? (points ? `会员高额加分 ${points} 待审批` : '会员高额加分待审批'),
      riskLevel,
      requestedField: '积分增加',
      currentValue: null,
      targetValue: points !== null ? `+${points}` : null,
    };
  }

  if (operation === 'member.points.rollback') {
    const points = typeof payload?.points === 'number' ? payload.points : null;
    return {
      operationLabel: '会员扣分审批',
      summary: payloadSummary ?? (points ? `会员高风险扣分 ${points} 待审批` : '会员高风险扣分待审批'),
      riskLevel,
      requestedField: '积分扣减',
      currentValue: null,
      targetValue: points !== null ? `-${points}` : null,
    };
  }

  if (operation === 'member.status.update') {
    const targetStatus = typeof payload?.status === 'string' ? payload.status : null;
    return {
      operationLabel: '会员状态变更审批',
      summary: payloadSummary ?? (targetStatus ? `会员状态变更为 ${targetStatus}` : '会员状态变更待审批'),
      riskLevel,
      requestedField: '目标状态',
      currentValue: null,
      targetValue: targetStatus,
    };
  }

  if (operation === 'member.level.override') {
    const currentLevel = typeof payload?.currentLevel === 'string' ? payload.currentLevel : null;
    const targetLevel = typeof payload?.targetLevel === 'string' ? payload.targetLevel : null;
    return {
      operationLabel: '会员等级调整审批',
      summary:
        payloadSummary ??
        (currentLevel && targetLevel
          ? `会员等级调整 ${currentLevel} -> ${targetLevel}`
          : targetLevel
            ? `会员等级调整为 ${targetLevel}`
            : '会员等级调整待审批'),
      riskLevel,
      requestedField: '目标等级',
      currentValue: currentLevel,
      targetValue: targetLevel,
    };
  }

  if (operation === 'foundation.runtime-governance.replay') {
    const receiptCode =
      typeof payload?.receiptCode === 'string'
        ? payload.receiptCode
        : typeof approval.resourceKey === 'string'
          ? approval.resourceKey
          : null;
    return {
      operationLabel: 'Runtime Replay 审批',
      summary: payloadSummary ?? '高风险 runtime replay 待审批',
      riskLevel,
      requestedField: '治理回执',
      currentValue: null,
      targetValue: receiptCode,
    };
  }

  return {
    operationLabel: operation,
    summary: payloadSummary ?? operation,
    riskLevel,
    requestedField: null,
    currentValue: null,
    targetValue: null,
  };
}

export function getApprovalRuntimeReceiptHref(approval: GovernanceApprovalSnapshot): string | null {
  if (approval.resourceType === 'runtime-governance-receipt' && typeof approval.resourceKey === 'string') {
    return `/operations/${approval.resourceKey}`;
  }
  const payload = getApprovalRequestPayload(approval);
  const receiptCode = payload?.receiptCode;
  return typeof receiptCode === 'string' ? `/operations/${receiptCode}` : null;
}

export async function loadGovernanceApprovals(
  filter: GovernanceApprovalListFilter = {}
): Promise<GovernanceApprovalListSnapshot> {
  try {
    const query = buildApprovalQueryString(filter);
    const client = createApprovalClient();
    const [approvals, summary] = await Promise.all([
      client.getData<GovernanceApprovalSnapshot[]>(
        `/foundation/governance-approval${query}`,
        { cache: 'no-store' }
      ),
      client.getData<GovernanceApprovalMetrics>(
        `/foundation/governance-approval/summarize${query}`,
        { cache: 'no-store' }
      ),
    ]);
    return {
      deliveryMode: 'api',
      generatedAt: new Date().toISOString(),
      approvals,
      summary,
    };
  } catch {
    const approvals = filterFallbackApprovals(filter);
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      approvals,
      summary: createFallbackMetrics(approvals),
    };
  }
}

export async function loadGovernanceApprovalDetail(
  ticket: string
): Promise<GovernanceApprovalDetailSnapshot> {
  try {
    const approval = await createApprovalClient().getData<GovernanceApprovalSnapshot>(
      `/foundation/governance-approval/${ticket}`,
      { cache: 'no-store' }
    );
    return {
      deliveryMode: 'api',
      generatedAt: new Date().toISOString(),
      runtimeReceiptHref: getApprovalRuntimeReceiptHref(approval),
      memberHref: getApprovalMemberHref(approval),
      memberReviewHref: buildApprovalMemberReviewHref(approval),
      approval,
    };
  } catch {
    const approval = fallbackApprovals.find((item) => item.ticket === ticket) ?? null;
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      runtimeReceiptHref: approval ? getApprovalRuntimeReceiptHref(approval) : null,
      memberHref: approval ? getApprovalMemberHref(approval) : null,
      memberReviewHref: approval ? buildApprovalMemberReviewHref(approval) : null,
      approval,
    };
  }
}

/**
 * 服务端读取某个审批单对应的 member-approval-outcome 审计日志。
 * 后端审计接口 /foundation/audit 同时支持 purpose + approvalTicket 过滤。
 * 在 API 不可达时降级到本地 fixture，确保 SSR 仍能渲染闭环面板。
 */
export async function loadGovernanceApprovalOutcomeAuditLogs(
  ticket: string
): Promise<GovernanceApprovalOutcomeAuditSnapshot> {
  try {
    const params = new URLSearchParams({
      purpose: 'member-approval-outcome',
      approvalTicket: ticket,
      limit: '20'
    });
    const raw = await createApprovalClient().getData<unknown>(
      `/foundation/audit?${params.toString()}`,
      { cache: 'no-store' }
    );
    const list = Array.isArray(raw) ? raw : Array.isArray((raw as { records?: unknown[] })?.records) ? (raw as { records: unknown[] }).records : [];
    const entries = list
      .map((item) => normalizeOutcomeAuditEntry(item))
      .filter((entry): entry is GovernanceApprovalOutcomeAuditLogEntry => Boolean(entry))
      .filter((entry) => entry.ticket === ticket);
    return {
      deliveryMode: 'api',
      generatedAt: new Date().toISOString(),
      ticket,
      entries
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      ticket,
      entries: selectFallbackOutcomeAuditLogs(ticket)
    };
  }
}

const defaultDecisionActor = 'ops.admin-web';

export async function decideGovernanceApproval(
  approvalTicket: string,
  decision: 'APPROVED' | 'REJECTED',
  expectedVersion?: number
) {
  return createApprovalClient().postData<GovernanceApprovalSnapshot>(
    '/foundation/governance-approval/decide',
    {
      approvalTicket,
      decidedBy: defaultDecisionActor,
      status: decision,
      expectedVersion,
      decisionNote: decision === 'APPROVED' ? 'admin-web 审批通过' : 'admin-web 审批驳回',
    },
    { cache: 'no-store' }
  );
}

export async function cancelGovernanceApproval(
  approvalTicket: string,
  expectedVersion?: number
) {
  return createApprovalClient().postData<GovernanceApprovalSnapshot>(
    '/foundation/governance-approval/cancel',
    {
      approvalTicket,
      cancelledBy: defaultDecisionActor,
      expectedVersion,
      cancelReason: 'admin-web 主动撤销',
    },
    { cache: 'no-store' }
  );
}

export async function resubmitGovernanceApproval(
  approvalTicket: string,
  expectedVersion?: number
) {
  return createApprovalClient().postData<{ supersededTicket: string | null; approval: GovernanceApprovalSnapshot }>(
    '/foundation/governance-approval/resubmit',
    {
      approvalTicket,
      resubmittedBy: defaultDecisionActor,
      expectedVersion,
      resubmitReason: 'admin-web 重新提交审批',
    },
    { cache: 'no-store' }
  );
}

export { buildGovernanceApprovalDetailHref };
