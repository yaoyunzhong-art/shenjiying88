import type { RuntimeGovernanceReceipt } from '@m5/types';
import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import {
  loadGovernanceApprovals,
  type GovernanceApprovalSnapshot,
  type GovernanceApprovalStatus,
} from './approvals-view-model';
import {
  MOCK_MEMBER_DETAILS,
  MOCK_MEMBERS,
  type MemberDetail,
  type MemberItem,
  type MemberLifecycle,
  type MemberMutationHistoryItem,
  type MemberOperationsReceipt,
  type MemberRecommendedAction,
  type MemberOperationsTask,
  type MemberStatus,
  type MemberTier,
} from './members-data';

export interface MemberApiProfile {
  memberId: string;
  userId?: string;
  tenantContext: {
    tenantId: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
  };
  mobile?: string;
  nickname: string;
  email?: string;
  address?: string;
  notes?: string;
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  status: 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'BLACKLISTED';
  points: number;
  growthValue?: number;
  svipStatus?: string;
  registeredAt: string;
  lastActiveAt?: string;
  lifecycleStage?: 'prospect' | 'newly-paid' | 'repeat-paid' | 'vip-active';
  tags?: string[];
  lastPaymentAt?: string;
  lastPaymentAmount?: number;
  lastPaymentChannel?: string;
  source?: 'memory' | 'prisma';
  persisted?: boolean;
}

export type MemberOperationsAction = MemberRecommendedAction;

export interface MemberOperationsProfile {
  memberId: string;
  lifecycleStage: 'prospect' | 'newly-paid' | 'repeat-paid' | 'vip-active';
  audienceSegments: string[];
  recommendedActions: MemberOperationsAction[];
  automationTriggers: Array<{
    code: string;
    status: 'ready' | 'watch';
    source: 'payment-success' | 'lifecycle' | 'tag';
    reason: string;
  }>;
  lastPaymentAt?: string;
  lastPaymentAmount?: number;
  lastPaymentChannel?: string;
  tags: string[];
}

export type MemberOperationsTaskApi = MemberOperationsTask;
export type MemberOperationsReceiptApi = MemberOperationsReceipt;
export type MemberOperationsRuntimeReceipt = RuntimeGovernanceReceipt;
export interface MemberOperationsRuntimeApprovalSummary {
  required: boolean;
  status: NonNullable<MemberOperationsRuntimeReceipt['approval']>['status'];
  ticket: string | null;
  executed: boolean;
  executionStatus: string | null;
  lastFailureReason: string | null;
}

export interface MemberOperationsRuntimeBatchReplayResult {
  executionId: string;
  receipt: MemberOperationsRuntimeReceipt | null;
}

export interface MemberUpgradeCheckResult {
  canUpgrade: boolean;
  currentLevel: MemberApiProfile['level'];
  nextLevel: MemberApiProfile['level'] | null;
  pointsNeeded: number;
}

export interface MemberPointsAdjustmentInput {
  points: number;
  approvalTicket?: string;
}

export interface MemberPaymentActivityInput {
  orderId: string;
  amount: number;
  paidAt?: string;
  channel?: string;
  source?: 'cashier' | 'lyt-snapshot';
}

export interface MemberStatusMutationInput {
  status: MemberApiProfile['status'];
  approvalTicket?: string;
}

export interface MemberLevelMutationInput {
  level: MemberApiProfile['level'];
  approvalTicket?: string;
}

export interface MemberProfileEditInput {
  nickname: string;
  mobile: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface MemberMutationApprovalResult {
  memberId: string;
  applied: false;
  approvalRequired: true;
  approvalTicket: string | null;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED' | 'NOT_REQUIRED';
  operation: string;
  summary: string;
}

export type MemberMutationResponse = MemberApiProfile | MemberMutationApprovalResult;

export function isMemberMutationApprovalResult(
  value: MemberMutationResponse | null | undefined
): value is MemberMutationApprovalResult {
  return Boolean(value && 'approvalRequired' in value && value.approvalRequired);
}

export function isMemberApiProfile(
  value: MemberMutationResponse | null | undefined
): value is MemberApiProfile {
  return Boolean(value && 'points' in value);
}

export interface AdminMemberListSnapshot {
  deliveryMode: 'api' | 'fallback';
  members: MemberItem[];
}

export interface AdminMemberDetailSnapshot {
  deliveryMode: 'api' | 'fallback';
  member: MemberDetail | null;
  upgradeCheck: MemberUpgradeCheckResult | null;
  operationsProfile: MemberOperationsProfile | null;
  operationsTasks: MemberOperationsTaskApi[];
  operationsReceipts: MemberOperationsReceiptApi[];
  mutationHistory: MemberMutationHistoryItem[];
  runtimeReceipts: Record<string, MemberOperationsRuntimeReceipt>;
  overviewTimeline: AdminMemberOverviewTimelineItem[];
}

export interface AdminMemberOverviewTimelineItem {
  id: string;
  occurredAt: string;
  category: 'mutation' | 'receipt' | 'runtime' | 'approval';
  stage:
    | 'mutation'
    | 'receipt-recorded'
    | 'runtime-receipt'
    | 'approval-pending'
    | 'approval-decided'
    | 'approval-executed'
    | 'approval-failed';
  title: string;
  summary: string;
  status?: string | null;
  actionCode?: string;
  executionId?: string;
  runtimeReceiptCode?: string;
  approvalTicket?: string;
  decisionBy?: string;
  decisionAt?: string;
  emphasis?: 'success' | 'warning' | 'danger' | 'info';
}

function getApprovalSummaryRecord(approval: GovernanceApprovalSnapshot): Record<string, unknown> | null {
  const summary = approval.summary;
  return summary && typeof summary === 'object' ? (summary as Record<string, unknown>) : null;
}

function getApprovalRequestPayload(approval: GovernanceApprovalSnapshot): Record<string, unknown> | null {
  const summary = getApprovalSummaryRecord(approval);
  const payload = summary?.requestPayload;
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
}

function getMemberMutationApprovalStatusLabel(status: GovernanceApprovalStatus): string {
  switch (status) {
    case 'APPROVED':
      return '已批准';
    case 'REJECTED':
      return '已驳回';
    case 'CANCELLED':
      return '已撤销';
    case 'SUPERSEDED':
      return '已替代';
    case 'NOT_REQUIRED':
      return '无需审批';
    case 'PENDING':
    default:
      return '待审批';
  }
}

function getMemberMutationApprovalAction(
  action: MemberMutationHistoryItem['action']
): GovernanceApprovalSnapshot['operation'] | null {
  switch (action) {
    case 'points-awarded':
      return 'member.points.award';
    case 'points-rolled-back':
      return 'member.points.rollback';
    case 'status-updated':
      return 'member.status.update';
    case 'level-updated':
      return 'member.level.override';
    default:
      return null;
  }
}

function getApprovalMatchValue(
  entry: MemberMutationHistoryItem,
  approval: GovernanceApprovalSnapshot
): string | number | null {
  const payload = getApprovalRequestPayload(approval);
  switch (entry.action) {
    case 'points-awarded':
    case 'points-rolled-back':
      return typeof payload?.points === 'number' ? payload.points : null;
    case 'status-updated':
      return typeof payload?.status === 'string' ? payload.status : null;
    case 'level-updated':
      return typeof payload?.targetLevel === 'string'
        ? payload.targetLevel
        : typeof payload?.level === 'string'
          ? payload.level
          : null;
    default:
      return null;
  }
}

function sortMemberMutationHistoryDesc(
  history: MemberMutationHistoryItem[]
): MemberMutationHistoryItem[] {
  return [...history].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt ?? '0');
    const rightTime = Date.parse(right.createdAt ?? '0');
    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
      return 0;
    }
    return rightTime - leftTime;
  });
}

function describeApprovalOutcome(approval: GovernanceApprovalSnapshot): string {
  const label = getMemberMutationApprovalStatusLabel(approval.status);
  if (approval.status === 'PENDING') {
    return approval.ticket ? `已转审批单 ${approval.ticket}，当前待处理。` : '当前待审批处理。';
  }
  if (approval.status === 'APPROVED') {
    if (approval.execution?.lastFailure?.failureReason) {
      return approval.ticket
        ? `审批单 ${approval.ticket} 已批准，但执行失败：${approval.execution.lastFailure.failureReason}`
        : `审批已批准，但执行失败：${approval.execution.lastFailure.failureReason}`;
    }
    if (approval.execution?.executionStatus) {
      return approval.ticket
        ? `审批单 ${approval.ticket} 已批准，执行状态 ${approval.execution.executionStatus}。`
        : `审批已批准，执行状态 ${approval.execution.executionStatus}。`;
    }
    return approval.ticket ? `审批单 ${approval.ticket} 已批准，等待执行状态刷新。` : '审批已批准，等待执行状态刷新。';
  }
  if (approval.status === 'REJECTED') {
    return approval.ticket ? `审批单 ${approval.ticket} 已驳回。` : '审批已驳回。';
  }
  if (approval.status === 'CANCELLED') {
    return approval.ticket ? `审批单 ${approval.ticket} 已撤销。` : '审批已撤销。';
  }
  if (approval.status === 'SUPERSEDED') {
    return approval.ticket ? `审批单 ${approval.ticket} 已被替代。` : '审批已被替代。';
  }
  return `审批状态 ${label}。`;
}

function enrichMemberMutationHistoryWithApprovals(
  mutationHistory: MemberMutationHistoryItem[],
  approvals: GovernanceApprovalSnapshot[]
): MemberMutationHistoryItem[] {
  if (!mutationHistory.length) {
    return mutationHistory;
  }

  const consumedTickets = new Set<string>();
  const fallbackApprovalPool = approvals
    .map((approval) => {
      const sortTime = Date.parse(approval.decidedAt ?? approval.updatedAt ?? '0');
      return {
        approval,
        sortTime: Number.isNaN(sortTime) ? 0 : sortTime,
      };
    })
    .sort((left, right) => right.sortTime - left.sortTime);

  return mutationHistory.map((entry) => {
    // 优先消费后端持久化的审批结果条目：listPersistentMutationHistory 已经把
    // governance approval outcome 写进 AuditLog，并归类为 approval.* action。
    // 这一路径不再依赖临时按 approvalTicket 反向匹配。
    const enrichedFromHistory = deriveApprovalFieldsFromHistory(entry);
    if (enrichedFromHistory) {
      if (enrichedFromHistory.approvalTicket) {
        consumedTickets.add(enrichedFromHistory.approvalTicket);
      }
      return { ...entry, ...enrichedFromHistory };
    }

    // 回退：仅当历史条目是普通 mutation 时，才用 approvals 池做反向匹配，
    // 兼容旧后端不会写 auditLog 的场景。
    if (!approvals.length) {
      return entry;
    }
    const expectedOperation = getMemberMutationApprovalAction(entry.action);
    if (!expectedOperation) {
      return entry;
    }
    const entryValue =
      entry.action === 'points-awarded' || entry.action === 'points-rolled-back'
        ? typeof entry.payload?.points === 'number'
          ? entry.payload.points
          : null
        : entry.action === 'status-updated'
          ? typeof entry.payload?.status === 'string'
            ? entry.payload.status
            : null
          : entry.action === 'level-updated'
            ? typeof entry.payload?.level === 'string'
              ? entry.payload.level
              : null
            : null;

    const matched = fallbackApprovalPool.find(({ approval }) => {
      if (approval.ticket && consumedTickets.has(approval.ticket)) {
        return false;
      }
      if (approval.operation !== expectedOperation) {
        return false;
      }
      const approvalValue = getApprovalMatchValue(entry, approval);
      if (entryValue != null && approvalValue != null) {
        return String(entryValue) === String(approvalValue);
      }
      return true;
    })?.approval;

    if (!matched) {
      return entry;
    }
    if (matched.ticket) {
      consumedTickets.add(matched.ticket);
    }
    return {
      ...entry,
      approvalTicket: matched.ticket ?? undefined,
      approvalStatus: matched.status,
      approvalSummary: describeApprovalOutcome(matched),
      approvalOperation: matched.operation ?? undefined,
      approvalDecisionBy: matched.decidedBy ?? undefined,
      approvalDecisionAt: matched.decidedAt ?? matched.updatedAt ?? undefined,
      approvalExecutionStatus: matched.execution?.executionStatus ?? undefined,
      approvalExecutionSummary:
        matched.execution?.lastFailure?.failureReason ??
        (matched.execution?.executionStatus
          ? `执行状态 ${matched.execution.executionStatus}`
          : undefined),
    };
  });
}

function deriveApprovalFieldsFromHistory(
  entry: MemberMutationHistoryItem
): Partial<MemberMutationHistoryItem> | null {
  if (!entry.action.startsWith('approval.')) {
    return null;
  }
  const payload = entry.payload ?? {};
  const afterValue = entry.afterValue ?? {};
  const stage = typeof payload.stage === 'string' ? payload.stage.toUpperCase() : null;
  const approvalStatus =
    typeof afterValue.approvalStatus === 'string'
      ? (afterValue.approvalStatus as MemberMutationHistoryItem['approvalStatus'])
      : typeof payload.approvalStatus === 'string'
        ? (payload.approvalStatus as MemberMutationHistoryItem['approvalStatus'])
        : (stage as MemberMutationHistoryItem['approvalStatus']) ?? undefined;
  const ticket =
    typeof payload.approvalTicket === 'string' ? payload.approvalTicket : entry.approvalTicket;
  const operation =
    typeof payload.operation === 'string' ? payload.operation : entry.approvalOperation;
  const decisionBy =
    typeof payload.decidedBy === 'string'
      ? payload.decidedBy
      : typeof payload.requestedBy === 'string'
        ? payload.requestedBy
        : entry.approvalDecisionBy;
  const decisionAt =
    typeof payload.decidedAt === 'string'
      ? payload.decidedAt
      : entry.approvalDecisionAt ?? entry.createdAt;
  const failureReason =
    typeof payload.failureReason === 'string' ? payload.failureReason : undefined;
  const summary = entry.summary && entry.summary.trim().length > 0 ? entry.summary : entry.approvalSummary;
  return {
    approvalTicket: ticket,
    approvalStatus,
    approvalSummary: summary,
    approvalOperation: operation,
    approvalDecisionBy: decisionBy,
    approvalDecisionAt: decisionAt,
    approvalExecutionSummary: failureReason,
    approvalExecutionStatus: stage === 'EXECUTED' || stage === 'EXECUTION_FAILED' ? stage : undefined,
  };
}

export interface MemberLatestApprovalOutcome {
  ticket: string | null;
  status: MemberMutationHistoryItem['approvalStatus'] | null;
  operation?: string;
  decisionBy?: string;
  decisionAt?: string;
  summary?: string;
  executionStatus?: string;
  executionSummary?: string;
  occurredAt: string | null;
}

/**
 * 从已 enriched 的会员历史里挑出最新的审批结果条目（approval.* action），
 * 用于详情页 SSR 后自动展示审批提示 banner，避免依赖 URL query 传入。
 */
export function deriveLatestMemberApprovalOutcome(
  history: MemberMutationHistoryItem[]
): MemberLatestApprovalOutcome | null {
  for (const entry of history) {
    if (!entry.action.startsWith('approval.')) {
      continue;
    }
    const ticket = entry.approvalTicket ?? null;
    const status = entry.approvalStatus ?? null;
    if (!ticket && !status) {
      continue;
    }
    return {
      ticket,
      status,
      operation: entry.approvalOperation,
      decisionBy: entry.approvalDecisionBy,
      decisionAt: entry.approvalDecisionAt ?? entry.createdAt ?? null,
      summary: entry.approvalSummary,
      executionStatus: entry.approvalExecutionStatus,
      executionSummary: entry.approvalExecutionSummary,
      occurredAt: entry.createdAt ?? null,
    };
  }
  return null;
}

export interface AdminMemberOperationReceiptDetailSnapshot {
  deliveryMode: 'api' | 'fallback';
  member: MemberDetail | null;
  receipt: MemberOperationsReceiptApi | null;
  task: MemberOperationsTaskApi | null;
  runtimeReceipt: MemberOperationsRuntimeReceipt | null;
}

export interface AdminMemberOperationTaskDetailSnapshot {
  deliveryMode: 'api' | 'fallback';
  member: MemberDetail | null;
  task: MemberOperationsTaskApi | null;
  receipts: MemberOperationsReceiptApi[];
  sourceTasks: MemberOperationsTaskApi[];
  sourceReceipts: MemberOperationsReceiptApi[];
}

export type MemberOperationsSourceKind = 'order' | 'payment';

export interface AdminMemberOperationSourceDetailSnapshot {
  deliveryMode: 'api' | 'fallback';
  member: MemberDetail | null;
  sourceKind: MemberOperationsSourceKind;
  sourceId: string;
  tasks: MemberOperationsTaskApi[];
  receipts: MemberOperationsReceiptApi[];
  runtimeReceipts: Record<string, MemberOperationsRuntimeReceipt>;
  timelineItems: AdminMemberOperationSourceTimelineItem[];
  attentionItems: AdminMemberOperationSourceAttentionItem[];
  recommendedActions: AdminMemberOperationSourceRecommendedAction[];
  sourceStages: AdminMemberOperationSourceStageSegment[];
  bottleneckStage: AdminMemberOperationSourceStageSegment | null;
  timelineSummary: {
    totalEvents: number;
    latestOccurredAt: string | null;
    categoryCounts: Record<AdminMemberOperationSourceTimelineItem['category'], number>;
    attentionCount: number;
  };
  pendingApprovalItems: Array<{
    executionId: string;
    runtimeReceiptCode: string;
    ticket: string;
    actionCode: string;
    status: 'PENDING';
  }>;
  chainSummary: {
    runtimeTrackedReceipts: number;
    replayableReceipts: number;
    pendingApprovals: number;
    approvedApprovals: number;
    blockedReceipts: number;
    callbackRecordedReceipts: number;
    replayScheduledReceipts: number;
  };
}

export interface AdminMemberOperationSourceTimelineItem {
  id: string;
  occurredAt: string;
  category: 'task' | 'receipt' | 'runtime' | 'approval';
  stage:
    | 'task-created'
    | 'task-scheduled'
    | 'task-executed'
    | 'receipt-recorded'
    | 'runtime-receipt'
    | 'runtime-event'
    | 'approval-pending'
    | 'approval-decided'
    | 'approval-executed'
    | 'approval-failed';
  title: string;
  summary: string;
  status?: string | null;
  actionCode?: string;
  taskId?: string;
  executionId?: string;
  runtimeReceiptCode?: string;
  approvalTicket?: string;
  decisionBy?: string;
  decisionAt?: string;
  emphasis?: 'success' | 'warning' | 'danger' | 'info';
}

export interface AdminMemberOperationSourceAttentionItem {
  id: string;
  level: 'high' | 'medium' | 'info';
  kind: 'pending-approval' | 'blocked' | 'replayable' | 'replay-scheduled';
  title: string;
  summary: string;
  actionCode?: string;
  taskId?: string;
  executionId?: string;
  runtimeReceiptCode?: string;
  approvalTicket?: string;
}

export interface AdminMemberOperationSourceRecommendedAction {
  code: 'batch-approve' | 'batch-replay' | 'inspect-blocked' | 'review-source-chain';
  priority: 'high' | 'medium' | 'low';
  label: string;
  reason: string;
  href: string | null;
}

export interface AdminMemberOperationSourceStageSegment {
  id: 'approval' | 'replay' | 'callback' | 'blocked';
  title: string;
  status: 'idle' | 'attention' | 'in-progress' | 'blocked' | 'completed';
  summary: string;
  owner: string;
  nextAction: string;
  href: string | null;
  latestOccurredAt: string | null;
  count: number;
  relatedExecutionIds: string[];
}

function createAdminMemberClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
  });
}

function normalizeFallbackMemberId(memberId: string): string {
  const compactMatch = memberId.match(/^m(\d{3})$/i);
  if (compactMatch) {
    return `member-${compactMatch[1]}`;
  }

  const canonicalMatch = memberId.match(/^member-(\d{3})$/i);
  if (canonicalMatch) {
    return `member-${canonicalMatch[1]}`;
  }

  return memberId;
}

function resolveFallbackMemberDetail(memberId: string): MemberDetail | null {
  const direct = MOCK_MEMBER_DETAILS[memberId];
  if (direct) {
    return direct;
  }

  const canonicalMatch = normalizeFallbackMemberId(memberId).match(/^member-(\d{3})$/i);
  if (!canonicalMatch) {
    return null;
  }

  return MOCK_MEMBER_DETAILS[`m${canonicalMatch[1]}`] ?? null;
}

const fallbackMemberOperationsTasks: Record<string, MemberOperationsTaskApi[]> = {
  'member-001': [
    {
      taskId: 'ops-task-001',
      actionCode: 'assign-vip-concierge',
      title: '分配 VIP 专属客服',
      reason: '高价值会员支付成功后，自动进入 CRM 跟进队列。',
      channel: 'crm-task',
      priority: 'high',
      status: 'dispatched',
      executionLane: 'member-crm',
      source: 'payment-success',
      sourceOrderId: 'order-001',
      sourcePaymentId: 'payment-001',
      executionSummary: '已派发给 VIP 客服团队，等待审批放行 replay。',
      executionTargetId: 'crm-001',
      executedAt: '2026-06-15T10:02:00.000Z',
      createdAt: '2026-06-15T10:00:00.000Z',
      scheduledAt: '2026-06-15T10:01:00.000Z',
    },
  ],
};

const fallbackMemberOperationsReceipts: Record<string, MemberOperationsReceiptApi[]> = {
  'member-001': [
    {
      executionId: 'ops-exec-001',
      taskId: 'ops-task-001',
      actionCode: 'assign-vip-concierge',
      targetType: 'crm-follow-up',
      targetId: 'crm-001',
      status: 'completed',
      summary: 'CRM 跟进任务已创建，当前挂接治理 replay 审批链。',
      payload: {
        memberId: 'member-001',
        taskId: 'ops-task-001',
        sourceOrderId: 'order-001',
        sourcePaymentId: 'payment-001',
      },
      runtimeReceiptCode: 'ADMIN-RUNTIME-001',
      runtimeState: 'replay-scheduled',
      runtimeReplayable: true,
      executedAt: '2026-06-15T10:03:00.000Z',
    },
  ],
};

const fallbackMemberRuntimeReceipts: Record<string, MemberOperationsRuntimeReceipt> = {
  'member-001:ops-exec-001': {
    receiptCode: 'ADMIN-RUNTIME-001',
    app: 'admin-web',
    action: 'runtime-replay',
    state: 'replay-scheduled',
    nextStep: 'PROCEED',
    riskLevel: 'high',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    requestEndpoint: '/api/v1/members/persistent/member-001/operations-receipts/ops-exec-001/runtime',
    payloadSummary:
      '{"memberId":"member-001","taskId":"ops-task-001","actionCode":"assign-vip-concierge","executionLane":"member-crm","targetType":"crm-follow-up","targetId":"crm-001","sourceOrderId":"order-001","sourcePaymentId":"payment-001"}',
    ticket: {
      ticketCode: 'ADMIN-RUNTIME-001-HANDLER',
      ticketType: 'HANDLER_CALLBACK',
      status: 'ready-for-handler',
      summary: 'handler ready',
    },
    sync: {
      handlerName: 'admin-runtime-replay-handler',
      syncMode: 'callback-followup',
      syncEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-RUNTIME-001/sync',
      callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-RUNTIME-001/callback',
      idempotencyKey: 'runtime:sync:ADMIN-RUNTIME-001',
      ready: true,
      summary: 'sync ready',
    },
    callback: {
      callbackStatus: 'awaiting-callback',
      ackToken: 'ACK-ADMIN-RUNTIME-001',
      lastEvent: 'PREREQUISITE_PENDING',
      summary: '等待审批放行后继续回放',
    },
    ledger: {
      ledgerKey: 'runtime-ledger:ADMIN-RUNTIME-001',
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-RUNTIME-001/replay',
      replayable: true,
      summary: 'replay available',
    },
    retry: {
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-RUNTIME-001/replay',
      retryable: true,
      maxAttempts: 3,
      currentAttempt: 1,
      nextBackoffMs: 30000,
      escalationAction: 'OPEN_MANUAL_REVIEW',
      summary: 'retry pending',
    },
    rateLimit: {
      allowed: true,
      limit: 10,
      remaining: 8,
      retryAfterSeconds: 0,
      scopeKey: 'admin-web:runtime-replay:tenant-demo',
    },
    approval: {
      required: true,
      status: 'PENDING',
      ticket: 'APR-RTREPL-001',
      requestedBy: 'ops.admin-web',
      decidedBy: null,
      decidedAt: null,
      updatedAt: '2026-06-15T10:00:05.000Z',
      summary: {
        receiptCode: 'ADMIN-RUNTIME-001',
        memberId: 'member-001',
        executionId: 'ops-exec-001',
        actionCode: 'assign-vip-concierge',
      },
      execution: {
        executed: false,
        executionStatus: null,
        attempts: 0,
        executedAt: null,
        executedBy: null,
        lastFailure: null,
      },
    },
    events: [
      {
        eventType: 'runtime-governance.action.submitted',
        status: 'accepted',
        idempotencyKey: 'submit-001',
        occurredAt: '2026-06-15T10:00:00.000Z',
        summary: 'submitted',
      },
      {
        eventType: 'runtime-governance.approval.pending',
        status: 'accepted',
        idempotencyKey: 'approval-001',
        occurredAt: '2026-06-15T10:00:05.000Z',
        summary: 'approval pending',
      },
    ],
    generatedAt: '2026-06-15T10:00:00.000Z',
  },
};

function formatDate(value?: string): string {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeMemberCode(memberId: string): string {
  return `MEM-${memberId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'AUTO'}`;
}

function mapApiMemberLevelToTier(level: MemberApiProfile['level']): MemberTier {
  switch (level) {
    case 'DIAMOND':
      return 'diamond';
    case 'PLATINUM':
    case 'GOLD':
      return 'gold';
    case 'SILVER':
      return 'silver';
    default:
      return 'bronze';
  }
}

function mapApiMemberStatusToStatus(status: MemberApiProfile['status']): MemberStatus {
  switch (status) {
    case 'ACTIVE':
      return 'active';
    case 'FROZEN':
      return 'frozen';
    case 'EXPIRED':
      return 'dormant';
    case 'BLACKLISTED':
      return 'cancelled';
    default:
      return 'dormant';
  }
}

function inferLifecycleStage(profile: MemberApiProfile): MemberLifecycle {
  switch (profile.lifecycleStage) {
    case 'newly-paid':
      return 'new';
    case 'repeat-paid':
      return 'growing';
    case 'vip-active':
      return 'loyal';
    case 'prospect':
      return 'new';
    default:
      break;
  }

  const normalizedStatus = mapApiMemberStatusToStatus(profile.status);

  if (normalizedStatus === 'cancelled') {
    return 'lost';
  }
  if (normalizedStatus === 'frozen') {
    return 'declining';
  }

  const points = profile.points ?? 0;
  if (points >= 50000) {
    return 'loyal';
  }
  if (points >= 2000) {
    return 'growing';
  }
  return 'new';
}

function findFallbackMember(profile: MemberApiProfile): MemberItem | undefined {
  return MOCK_MEMBERS.find((item) => {
    if (item.id === profile.memberId) {
      return true;
    }
    if (profile.mobile && item.phone === profile.mobile) {
      return true;
    }
    return (
      item.name === profile.nickname &&
      item.marketCode === (profile.tenantContext.marketCode ?? 'cn-mainland')
    );
  });
}

function findFallbackDetail(profile: MemberApiProfile): MemberDetail | undefined {
  const byId = MOCK_MEMBER_DETAILS[profile.memberId];
  if (byId) {
    return byId;
  }

  return Object.values(MOCK_MEMBER_DETAILS).find((detail) => {
    if (profile.mobile && detail.phone === profile.mobile) {
      return true;
    }
    return (
      detail.name === profile.nickname &&
      detail.marketCode === (profile.tenantContext.marketCode ?? 'cn-mainland')
    );
  });
}

function buildDerivedTags(profile: MemberApiProfile, fallback?: MemberItem): string[] {
  const tags = new Set<string>([...(fallback?.tags ?? []), ...(profile.tags ?? [])]);

  if (profile.persisted) {
    tags.add('持久化会员');
  }
  if (profile.source === 'prisma') {
    tags.add('Prisma');
  }
  if (profile.svipStatus && profile.svipStatus !== 'INACTIVE') {
    tags.add(`SVIP:${profile.svipStatus}`);
  }

  return Array.from(tags);
}

export function buildMemberItemFromApi(profile: MemberApiProfile): MemberItem {
  const fallback = findFallbackMember(profile);
  const totalSpent = fallback?.totalSpent ?? profile.growthValue ?? 0;
  const visitCount = fallback?.visitCount ?? 0;
  const mappedTier = mapApiMemberLevelToTier(profile.level);
  const mappedStatus = mapApiMemberStatusToStatus(profile.status);

  return {
    id: profile.memberId,
    code: fallback?.code ?? normalizeMemberCode(profile.memberId),
    name: profile.nickname,
    phone: profile.mobile ?? fallback?.phone ?? '—',
    tier: mappedTier,
    status: mappedStatus,
    points: profile.points,
    totalSpent,
    storeName: fallback?.storeName ?? profile.tenantContext.storeId ?? '未绑定门店',
    marketCode: fallback?.marketCode ?? profile.tenantContext.marketCode ?? 'unknown',
    registeredAt: formatDate(profile.registeredAt),
    lastVisitAt: fallback?.lastVisitAt ?? formatDate(profile.lastActiveAt ?? profile.registeredAt),
    visitCount,
    avgOrderValue:
      fallback?.avgOrderValue ??
      (visitCount > 0 && totalSpent > 0 ? Math.round(totalSpent / visitCount) : 0),
    tags: buildDerivedTags(profile, fallback),
  };
}

export function buildMemberDetailFromApi(
  profile: MemberApiProfile,
  operationsProfile?: MemberOperationsProfile | null,
  operationsTasks: MemberOperationsTaskApi[] = [],
  operationsReceipts: MemberOperationsReceiptApi[] = [],
  mutationHistory: MemberMutationHistoryItem[] = []
): MemberDetail {
  const item = buildMemberItemFromApi(profile);
  const fallback = findFallbackDetail(profile);

  return {
    ...item,
    apiLevel: profile.level,
    apiStatus: profile.status,
    email: profile.email ?? fallback?.email ?? '',
    gender: fallback?.gender ?? 'other',
    birthday: fallback?.birthday ?? '—',
    wechatId: fallback?.wechatId ?? '',
    address: profile.address ?? fallback?.address ?? '',
    referralCode: fallback?.referralCode ?? `REF-${profile.memberId.slice(0, 6).toUpperCase()}`,
    referredBy: fallback?.referredBy ?? null,
    notes:
      profile.notes ??
      fallback?.notes ??
      `当前为${profile.persisted ? '持久化' : '内存'}会员档案，会员中心已优先接入真实 API 数据。`,
    coupons: fallback?.coupons ?? 0,
    favoriteCategories: fallback?.favoriteCategories ?? [],
    lastOrderAt: fallback?.lastOrderAt ?? formatDate(profile.lastActiveAt ?? profile.registeredAt),
    lifecycleStage: fallback?.lifecycleStage ?? inferLifecycleStage(profile),
    operationsSegments: operationsProfile?.audienceSegments ?? [],
    recommendedActions: operationsProfile?.recommendedActions ?? [],
    automationTriggers: operationsProfile?.automationTriggers.map((trigger) => trigger.code) ?? [],
    lastPaymentAt: operationsProfile?.lastPaymentAt ?? profile.lastPaymentAt,
    lastPaymentAmount: operationsProfile?.lastPaymentAmount ?? profile.lastPaymentAmount,
    lastPaymentChannel: operationsProfile?.lastPaymentChannel ?? profile.lastPaymentChannel,
    operationsTasks,
    operationsReceipts,
    mutationHistory: sortMemberMutationHistoryDesc(mutationHistory),
  };
}

export async function loadAdminMemberList(): Promise<AdminMemberListSnapshot> {
  try {
    const profiles = await createAdminMemberClient().getData<MemberApiProfile[]>('/members/persistent', {
      cache: 'no-store',
    });

    return {
      deliveryMode: 'api',
      members: profiles.map(buildMemberItemFromApi),
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      members: MOCK_MEMBERS,
    };
  }
}

export async function loadAdminMemberDetail(memberId: string): Promise<AdminMemberDetailSnapshot> {
  try {
    const client = createAdminMemberClient();
    const [profile, upgradeCheck, operationsProfile, operationsTasks, operationsReceipts, mutationHistory, memberApprovals] = await Promise.all([
      client.getData<MemberApiProfile>(`/members/persistent/${memberId}`, { cache: 'no-store' }),
      client
        .getData<MemberUpgradeCheckResult>(`/members/${memberId}/upgrade-check`, { cache: 'no-store' })
        .catch(() => null),
      client
        .getData<MemberOperationsProfile>(`/members/persistent/${memberId}/operations-profile`, {
          cache: 'no-store',
        })
        .catch(() => null),
      client
        .getData<MemberOperationsTaskApi[]>(`/members/persistent/${memberId}/operations-tasks`, {
          cache: 'no-store',
        })
        .catch(() => []),
      client
        .getData<MemberOperationsReceiptApi[]>(`/members/persistent/${memberId}/operations-receipts`, {
          cache: 'no-store',
        })
        .catch(() => []),
      client
        .getData<MemberMutationHistoryItem[]>(`/members/persistent/${memberId}/history`, {
          cache: 'no-store',
        })
        .catch(() => []),
      loadGovernanceApprovals({
        resourceType: 'member-profile',
        resourceKey: memberId,
      }).then((snapshot) => snapshot.approvals),
    ]);
    const enrichedMutationHistory = sortMemberMutationHistoryDesc(
      enrichMemberMutationHistoryWithApprovals(mutationHistory, memberApprovals)
    );
    const runtimeReceipts = Object.fromEntries(
      (
        await Promise.all(
          operationsReceipts.map(async (item) => {
            if (!item.runtimeReceiptCode) {
              return null;
            }
            const runtimeReceipt = await loadMemberOperationsRuntimeReceipt(memberId, item.executionId);
            return runtimeReceipt ? ([item.executionId, runtimeReceipt] as const) : null;
          })
        )
      ).filter((entry): entry is readonly [string, MemberOperationsRuntimeReceipt] => Boolean(entry))
    );
    const overviewTimeline = buildAdminMemberOverviewTimeline(enrichedMutationHistory, operationsReceipts, runtimeReceipts);

    return {
      deliveryMode: 'api',
      member: buildMemberDetailFromApi(profile, operationsProfile, operationsTasks, operationsReceipts, enrichedMutationHistory),
      upgradeCheck,
      operationsProfile,
      operationsTasks,
      operationsReceipts,
      mutationHistory: enrichedMutationHistory,
      runtimeReceipts,
      overviewTimeline,
    };
  } catch {
    const fallbackMember = resolveFallbackMemberDetail(memberId);
    const fallbackMemberKey = normalizeFallbackMemberId(memberId);
    const operationsTasks = fallbackMemberOperationsTasks[fallbackMemberKey] ?? fallbackMember?.operationsTasks ?? [];
    const operationsReceipts =
      fallbackMemberOperationsReceipts[fallbackMemberKey] ?? fallbackMember?.operationsReceipts ?? [];
    const runtimeReceipts = Object.fromEntries(
      operationsReceipts
        .map((item) => {
          const runtimeReceipt = fallbackMemberRuntimeReceipts[`${fallbackMemberKey}:${item.executionId}`];
          return runtimeReceipt ? ([item.executionId, runtimeReceipt] as const) : null;
        })
        .filter((entry): entry is readonly [string, MemberOperationsRuntimeReceipt] => Boolean(entry))
    );
    const mutationHistory = enrichMemberMutationHistoryWithApprovals(
      fallbackMember?.mutationHistory ?? [],
      (
        await loadGovernanceApprovals({
          resourceType: 'member-profile',
          resourceKey: memberId,
        })
      ).approvals
    );
    const overviewTimeline = buildAdminMemberOverviewTimeline(mutationHistory, operationsReceipts, runtimeReceipts);

    return {
      deliveryMode: 'fallback',
      member:
        fallbackMember
          ? {
              ...fallbackMember,
              operationsTasks,
              operationsReceipts,
            }
          : null,
      upgradeCheck: null,
      operationsProfile: null,
      operationsTasks,
      operationsReceipts,
      mutationHistory,
      runtimeReceipts,
      overviewTimeline,
    };
  }
}

function buildAdminMemberOverviewTimeline(
  mutationHistory: MemberMutationHistoryItem[],
  receipts: MemberOperationsReceiptApi[],
  runtimeReceipts: Record<string, MemberOperationsRuntimeReceipt>
): AdminMemberOverviewTimelineItem[] {
  const items: Array<AdminMemberOverviewTimelineItem & { sortAt: number; order: number }> = [];

  function pushItem(
    item: Omit<AdminMemberOverviewTimelineItem, 'occurredAt'>,
    occurredAt: string | null | undefined,
    order: number
  ) {
    if (!occurredAt) {
      return;
    }
    const sortAt = Date.parse(occurredAt);
    if (Number.isNaN(sortAt)) {
      return;
    }
    items.push({
      ...item,
      occurredAt,
      sortAt,
      order,
    });
  }

  function approvalStatusLabel(status: NonNullable<MemberOperationsRuntimeReceipt['approval']>['status']) {
    switch (status) {
      case 'APPROVED':
        return '已批准';
      case 'REJECTED':
        return '已驳回';
      case 'CANCELLED':
        return '已撤销';
      case 'SUPERSEDED':
        return '已替代';
      default:
        return '待审批';
    }
  }

  for (const entry of mutationHistory) {
    pushItem(
      {
        id: `mutation:${entry.historyId}`,
        category: 'mutation',
        stage: 'mutation',
        title: entry.summary,
        summary: entry.approvalSummary
          ? `${entry.action} · ${entry.sourceChannel} · ${entry.operatorId} · ${entry.approvalSummary}`
          : `${entry.action} · ${entry.sourceChannel} · ${entry.operatorId}`,
        status: entry.approvalStatus ?? entry.action,
        approvalTicket: entry.approvalTicket,
        decisionBy: entry.approvalDecisionBy,
        decisionAt: entry.approvalDecisionAt,
        emphasis:
          entry.approvalStatus === 'APPROVED'
            ? 'success'
            : entry.approvalStatus === 'PENDING'
              ? 'warning'
              : entry.approvalStatus === 'REJECTED' ||
                  entry.approvalStatus === 'CANCELLED' ||
                  entry.approvalStatus === 'SUPERSEDED'
                ? 'danger'
                : 'info',
      },
      entry.createdAt,
      10
    );
  }

  for (const receipt of receipts) {
    pushItem(
      {
        id: `receipt:${receipt.executionId}`,
        category: 'receipt',
        stage: 'receipt-recorded',
        title: `执行回执 · ${receipt.executionId}`,
        summary: `${receipt.summary}，目标 ${receipt.targetType}:${receipt.targetId}`,
        status: receipt.status,
        actionCode: receipt.actionCode,
        executionId: receipt.executionId,
        runtimeReceiptCode: receipt.runtimeReceiptCode,
        emphasis: 'info',
      },
      receipt.executedAt,
      20
    );

    const runtimeReceipt = runtimeReceipts[receipt.executionId];
    if (!runtimeReceipt) {
      continue;
    }

    pushItem(
      {
        id: `runtime:${runtimeReceipt.receiptCode}`,
        category: 'runtime',
        stage: 'runtime-receipt',
        title: `Runtime 治理 · ${runtimeReceipt.receiptCode}`,
        summary: `${runtimeReceipt.state} · ${runtimeReceipt.payloadSummary}`,
        status: runtimeReceipt.state,
        actionCode: receipt.actionCode,
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt.receiptCode,
        emphasis: 'info',
      },
      runtimeReceipt.generatedAt,
      30
    );

    const approval = runtimeReceipt.approval;
    if (!approval?.required) {
      continue;
    }

    const approvalLabel = approvalStatusLabel(approval.status);
    pushItem(
      {
        id: `approval:${approval.ticket ?? receipt.executionId}:${approval.status}`,
        category: 'approval',
        stage: approval.status === 'PENDING' ? 'approval-pending' : 'approval-decided',
        title: approval.status === 'PENDING' ? `审批待决 · ${approvalLabel}` : `审批决策 · ${approvalLabel}`,
        summary:
          approval.status === 'PENDING'
            ? approval.ticket
              ? `审批单 ${approval.ticket} 正在等待处理，动作 ${receipt.actionCode} 尚未放行。`
              : `当前审批仍待处理，动作 ${receipt.actionCode} 尚未放行。`
            : approval.ticket
              ? `审批单 ${approval.ticket} 已${approvalLabel}，动作 ${receipt.actionCode} 由 ${approval.decidedBy ?? '审批系统'} 于 ${approval.decidedAt ?? approval.updatedAt ?? '未知时间'} 完成决策。`
              : `当前审批已${approvalLabel}，动作 ${receipt.actionCode} 已完成决策。`,
        status: approval.status,
        actionCode: receipt.actionCode,
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt.receiptCode,
        approvalTicket: approval.ticket ?? undefined,
        decisionBy: approval.decidedBy ?? undefined,
        decisionAt: approval.decidedAt ?? approval.updatedAt ?? undefined,
        emphasis:
          approval.status === 'APPROVED'
            ? 'success'
            : approval.status === 'PENDING'
              ? 'warning'
              : 'danger',
      },
      approval.status === 'PENDING' ? approval.updatedAt ?? runtimeReceipt.generatedAt : approval.decidedAt ?? approval.updatedAt,
      40
    );

    pushItem(
      {
        id: `approval-executed:${approval.ticket ?? receipt.executionId}`,
        category: 'approval',
        stage: 'approval-executed',
        title: '审批执行',
        summary:
          approval.execution?.executionStatus
            ? `审批结果已下发执行，当前执行状态 ${approval.execution.executionStatus}，执行人 ${approval.execution.executedBy ?? 'runtime-governance'}。`
            : '审批结果已下发执行，等待后续执行状态刷新。',
        status: approval.execution?.executionStatus,
        actionCode: receipt.actionCode,
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt.receiptCode,
        approvalTicket: approval.ticket ?? undefined,
        decisionBy: approval.execution?.executedBy ?? undefined,
        decisionAt: approval.execution?.executedAt ?? undefined,
        emphasis: 'info',
      },
      approval.execution?.executedAt,
      50
    );

    pushItem(
      {
        id: `approval-failed:${approval.ticket ?? receipt.executionId}`,
        category: 'approval',
        stage: 'approval-failed',
        title: '审批执行失败',
        summary:
          approval.execution?.lastFailure?.failureReason
            ? `审批通过后的执行失败：${approval.execution.lastFailure.failureReason}`
            : '审批通过后的执行失败，等待补偿处理。',
        status: approval.execution?.lastFailure?.failureStatus,
        actionCode: receipt.actionCode,
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt.receiptCode,
        approvalTicket: approval.ticket ?? undefined,
        decisionBy: approval.execution?.lastFailure?.failedBy ?? undefined,
        decisionAt: approval.execution?.lastFailure?.failedAt ?? undefined,
        emphasis: 'danger',
      },
      approval.execution?.lastFailure?.failedAt,
      60
    );
  }

  return items
    .sort((left, right) => right.sortAt - left.sortAt || right.order - left.order || left.id.localeCompare(right.id))
    .map((item) => {
      const { sortAt, order, ...rest } = item;
      void sortAt;
      void order;
      return rest;
    });
}

export async function updateAdminMemberProfile(
  memberId: string,
  input: MemberProfileEditInput
): Promise<MemberMutationResponse | null> {
  try {
    return await createAdminMemberClient().postData<MemberMutationResponse>(
      `/members/persistent/${memberId}/profile`,
      input,
      { cache: 'no-store' }
    );
  } catch {
    return null;
  }
}

export async function awardAdminMemberPoints(
  memberId: string,
  input: MemberPointsAdjustmentInput
): Promise<MemberMutationResponse | null> {
  try {
    return await createAdminMemberClient().postData<MemberMutationResponse>(
      `/members/persistent/${memberId}/points/award`,
      input,
      { cache: 'no-store' }
    );
  } catch {
    return null;
  }
}

export async function rollbackAdminMemberPoints(
  memberId: string,
  input: MemberPointsAdjustmentInput
): Promise<MemberMutationResponse | null> {
  try {
    return await createAdminMemberClient().postData<MemberMutationResponse>(
      `/members/persistent/${memberId}/points/rollback`,
      input,
      { cache: 'no-store' }
    );
  } catch {
    return null;
  }
}

export async function recordAdminMemberPaymentActivity(
  memberId: string,
  input: MemberPaymentActivityInput
): Promise<MemberApiProfile | null> {
  try {
    return await createAdminMemberClient().postData<MemberApiProfile>(
      `/members/persistent/${memberId}/payment-activity`,
      input,
      { cache: 'no-store' }
    );
  } catch {
    return null;
  }
}

export async function updateAdminMemberStatus(
  memberId: string,
  input: MemberStatusMutationInput
): Promise<MemberMutationResponse | null> {
  try {
    return await createAdminMemberClient().postData<MemberMutationResponse>(
      `/members/persistent/${memberId}/status`,
      input,
      { cache: 'no-store' }
    );
  } catch {
    return null;
  }
}

export async function updateAdminMemberLevel(
  memberId: string,
  input: MemberLevelMutationInput
): Promise<MemberMutationResponse | null> {
  try {
    return await createAdminMemberClient().postData<MemberMutationResponse>(
      `/members/persistent/${memberId}/level`,
      input,
      { cache: 'no-store' }
    );
  } catch {
    return null;
  }
}

export async function loadMemberOperationsRuntimeReceipt(
  memberId: string,
  executionId: string
): Promise<MemberOperationsRuntimeReceipt | null> {
  try {
    return await createAdminMemberClient().getData<MemberOperationsRuntimeReceipt>(
      `/members/persistent/${memberId}/operations-receipts/${executionId}/runtime`,
      { cache: 'no-store' }
    );
  } catch {
    return fallbackMemberRuntimeReceipts[`${normalizeFallbackMemberId(memberId)}:${executionId}`] ?? null;
  }
}

export async function replayMemberOperationsRuntimeReceipt(
  memberId: string,
  executionId: string
): Promise<MemberOperationsRuntimeReceipt | null> {
  try {
    return await createAdminMemberClient().postData<MemberOperationsRuntimeReceipt>(
      `/members/persistent/${memberId}/operations-receipts/${executionId}/replay`,
      {},
      { cache: 'no-store' }
    );
  } catch {
    return fallbackMemberRuntimeReceipts[`${normalizeFallbackMemberId(memberId)}:${executionId}`] ?? null;
  }
}

export async function replayMemberOperationsRuntimeReceipts(
  memberId: string,
  executionIds: string[]
): Promise<MemberOperationsRuntimeBatchReplayResult[]> {
  const results: MemberOperationsRuntimeBatchReplayResult[] = [];

  for (const executionId of executionIds) {
    const receipt = await replayMemberOperationsRuntimeReceipt(memberId, executionId);
    results.push({
      executionId,
      receipt,
    });
  }

  return results;
}

export async function loadAdminMemberOperationReceiptDetail(
  memberId: string,
  executionId: string
): Promise<AdminMemberOperationReceiptDetailSnapshot> {
  const detail = await loadAdminMemberDetail(memberId);
  const receipt =
    detail.operationsReceipts.find((item) => item.executionId === executionId) ??
    detail.member?.operationsReceipts?.find((item) => item.executionId === executionId) ??
    null;
  const task = receipt
    ? detail.operationsTasks.find((item) => item.taskId === receipt.taskId) ??
      detail.member?.operationsTasks?.find((item) => item.taskId === receipt.taskId) ??
      null
    : null;
  const runtimeReceipt =
    receipt?.runtimeReceiptCode
      ? await loadMemberOperationsRuntimeReceipt(memberId, executionId)
      : null;

  return {
    deliveryMode: detail.deliveryMode,
    member: detail.member,
    receipt,
    task,
    runtimeReceipt,
  };
}

export async function loadAdminMemberOperationTaskDetail(
  memberId: string,
  taskId: string
): Promise<AdminMemberOperationTaskDetailSnapshot> {
  const detail = await loadAdminMemberDetail(memberId);
  const allTasks = detail.operationsTasks.length > 0 ? detail.operationsTasks : detail.member?.operationsTasks ?? [];
  const allReceipts =
    detail.operationsReceipts.length > 0 ? detail.operationsReceipts : detail.member?.operationsReceipts ?? [];
  const task = allTasks.find((item) => item.taskId === taskId) ?? null;
  const receipts = allReceipts.filter((item) => item.taskId === taskId);
  const sourceTasks =
    task && (task.sourceOrderId || task.sourcePaymentId)
      ? allTasks.filter(
          (item) =>
            item.taskId !== taskId &&
            item.source === task.source &&
            item.sourceOrderId === task.sourceOrderId &&
            item.sourcePaymentId === task.sourcePaymentId
        )
      : [];
  const sourceTaskIds = new Set([taskId, ...sourceTasks.map((item) => item.taskId)]);
  const sourceReceipts =
    task && (task.sourceOrderId || task.sourcePaymentId)
      ? allReceipts.filter((item) => sourceTaskIds.has(item.taskId))
      : receipts;

  return {
    deliveryMode: detail.deliveryMode,
    member: detail.member,
    task,
    receipts,
    sourceTasks,
    sourceReceipts,
  };
}

export async function loadAdminMemberOperationSourceDetail(
  memberId: string,
  sourceKind: MemberOperationsSourceKind,
  sourceId: string
): Promise<AdminMemberOperationSourceDetailSnapshot> {
  const detail = await loadAdminMemberDetail(memberId);
  const allTasks = detail.operationsTasks.length > 0 ? detail.operationsTasks : detail.member?.operationsTasks ?? [];
  const allReceipts =
    detail.operationsReceipts.length > 0 ? detail.operationsReceipts : detail.member?.operationsReceipts ?? [];
  const tasks = allTasks.filter((item) =>
    sourceKind === 'order' ? item.sourceOrderId === sourceId : item.sourcePaymentId === sourceId
  );
  const taskIds = new Set(tasks.map((item) => item.taskId));
  const receipts = allReceipts.filter((item) => taskIds.has(item.taskId));
  const runtimeReceipts = Object.fromEntries(
    (
      await Promise.all(
        receipts.map(async (item) => {
          if (!item.runtimeReceiptCode) {
            return null;
          }
          const runtimeReceipt = await loadMemberOperationsRuntimeReceipt(memberId, item.executionId);
          return runtimeReceipt ? ([item.executionId, runtimeReceipt] as const) : null;
        })
      )
    ).filter((entry): entry is readonly [string, MemberOperationsRuntimeReceipt] => Boolean(entry))
  );
  const runtimeReceiptList = Object.values(runtimeReceipts);
  const timelineItems = buildAdminMemberOperationSourceTimeline(tasks, receipts, runtimeReceipts);
  const attentionItems = buildAdminMemberOperationSourceAttentionItems(receipts, runtimeReceipts);
  const sourceStages = buildAdminMemberOperationSourceStageSegments({
    memberId,
    sourceKind,
    sourceId,
    receipts,
    timelineItems,
    chainSummary: {
      runtimeTrackedReceipts: runtimeReceiptList.length,
      replayableReceipts: runtimeReceiptList.filter((item) => item.ledger.replayable).length,
      pendingApprovals: runtimeReceiptList.filter(
        (item) => getMemberOperationsRuntimeApprovalSummary(item)?.status === 'PENDING'
      ).length,
      approvedApprovals: runtimeReceiptList.filter(
        (item) => getMemberOperationsRuntimeApprovalSummary(item)?.status === 'APPROVED'
      ).length,
      blockedReceipts: receipts.filter((item) => item.runtimeState === 'blocked').length,
      callbackRecordedReceipts: receipts.filter((item) => item.runtimeState === 'callback-recorded').length,
      replayScheduledReceipts: receipts.filter((item) => item.runtimeState === 'replay-scheduled').length,
    },
  });
  const timelineSummary = {
    totalEvents: timelineItems.length,
    latestOccurredAt: timelineItems.length > 0 ? timelineItems[timelineItems.length - 1]?.occurredAt ?? null : null,
    categoryCounts: timelineItems.reduce<Record<AdminMemberOperationSourceTimelineItem['category'], number>>(
      (accumulator, item) => {
        accumulator[item.category] += 1;
        return accumulator;
      },
      {
        task: 0,
        receipt: 0,
        runtime: 0,
        approval: 0,
      }
    ),
    attentionCount: attentionItems.length,
  };
  const pendingApprovalItems = receipts
    .map((receipt) => {
      const runtimeReceipt = runtimeReceipts[receipt.executionId];
      const approval = runtimeReceipt ? getMemberOperationsRuntimeApprovalSummary(runtimeReceipt) : null;
      if (!runtimeReceipt?.receiptCode || !approval?.ticket || approval.status !== 'PENDING') {
        return null;
      }
      return {
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt.receiptCode,
        ticket: approval.ticket,
        actionCode: receipt.actionCode,
        status: approval.status,
      };
    })
    .filter(
      (
        item
      ): item is {
        executionId: string;
        runtimeReceiptCode: string;
        ticket: string;
        actionCode: string;
        status: 'PENDING';
      } => Boolean(item)
    );
  const chainSummary = {
    runtimeTrackedReceipts: runtimeReceiptList.length,
    replayableReceipts: runtimeReceiptList.filter((item) => item.ledger.replayable).length,
    pendingApprovals: runtimeReceiptList.filter(
      (item) => getMemberOperationsRuntimeApprovalSummary(item)?.status === 'PENDING'
    ).length,
    approvedApprovals: runtimeReceiptList.filter(
      (item) => getMemberOperationsRuntimeApprovalSummary(item)?.status === 'APPROVED'
    ).length,
    blockedReceipts: receipts.filter((item) => item.runtimeState === 'blocked').length,
    callbackRecordedReceipts: receipts.filter((item) => item.runtimeState === 'callback-recorded').length,
    replayScheduledReceipts: receipts.filter((item) => item.runtimeState === 'replay-scheduled').length,
  };
  const bottleneckStage =
    sourceStages.find((item) => item.status === 'blocked') ??
    sourceStages.find((item) => item.status === 'attention') ??
    sourceStages.find((item) => item.status === 'in-progress') ??
    null;
  const recommendedActions = buildAdminMemberOperationSourceRecommendedActions({
    memberId,
    sourceKind,
    sourceId,
    chainSummary,
  });

  return {
    deliveryMode: detail.deliveryMode,
    member: detail.member,
    sourceKind,
    sourceId,
    tasks,
    receipts,
    runtimeReceipts,
    timelineItems,
    attentionItems,
    recommendedActions,
    sourceStages,
    bottleneckStage,
    timelineSummary,
    pendingApprovalItems,
    chainSummary,
  };
}

function buildAdminMemberOperationSourceTimeline(
  tasks: MemberOperationsTaskApi[],
  receipts: MemberOperationsReceiptApi[],
  runtimeReceipts: Record<string, MemberOperationsRuntimeReceipt>
): AdminMemberOperationSourceTimelineItem[] {
  const sortableItems: Array<AdminMemberOperationSourceTimelineItem & { sortAt: number; order: number }> = [];

  function pushTimelineItem(
    item: Omit<AdminMemberOperationSourceTimelineItem, 'occurredAt'>,
    occurredAt: string | null | undefined,
    order: number
  ) {
    if (!occurredAt) {
      return;
    }

    const sortAt = Date.parse(occurredAt);
    if (Number.isNaN(sortAt)) {
      return;
    }

    sortableItems.push({
      ...item,
      occurredAt,
      sortAt,
      order,
    });
  }

  function getApprovalStatusLabel(status: NonNullable<MemberOperationsRuntimeReceipt['approval']>['status']) {
    switch (status) {
      case 'APPROVED':
        return '已批准';
      case 'REJECTED':
        return '已驳回';
      case 'CANCELLED':
        return '已取消';
      case 'SUPERSEDED':
        return '已替换';
      default:
        return '待审批';
    }
  }

  function getApprovalActionLabel(receipt: MemberOperationsReceiptApi) {
    return receipt.actionCode || `${receipt.targetType}:${receipt.targetId}`;
  }

  for (const task of tasks) {
    pushTimelineItem(
      {
        id: `task-created:${task.taskId}`,
        category: 'task',
        stage: 'task-created',
        title: `任务创建 · ${task.title}`,
        summary: `${task.actionCode} 已进入 ${task.executionLane}，原因：${task.reason}`,
        status: task.status,
        actionCode: task.actionCode,
        taskId: task.taskId,
      },
      task.createdAt,
      10
    );
    pushTimelineItem(
      {
        id: `task-scheduled:${task.taskId}`,
        category: 'task',
        stage: 'task-scheduled',
        title: `任务排程 · ${task.title}`,
        summary: `通过 ${task.channel} 渠道排程，优先级 ${task.priority}`,
        status: task.status,
        actionCode: task.actionCode,
        taskId: task.taskId,
      },
      task.scheduledAt !== task.createdAt ? task.scheduledAt : null,
      20
    );
    pushTimelineItem(
      {
        id: `task-executed:${task.taskId}`,
        category: 'task',
        stage: 'task-executed',
        title: `任务执行 · ${task.title}`,
        summary: task.executionSummary ?? `任务已执行，当前状态 ${task.status}`,
        status: task.status,
        actionCode: task.actionCode,
        taskId: task.taskId,
      },
      task.executedAt,
      30
    );
  }

  for (const receipt of receipts) {
    const runtimeReceipt = runtimeReceipts[receipt.executionId];

    pushTimelineItem(
      {
        id: `receipt-recorded:${receipt.executionId}`,
        category: 'receipt',
        stage: 'receipt-recorded',
        title: `执行回执 · ${receipt.executionId}`,
        summary: `${receipt.summary}，目标 ${receipt.targetType}:${receipt.targetId}`,
        status: receipt.status,
        actionCode: receipt.actionCode,
        taskId: receipt.taskId,
        executionId: receipt.executionId,
        runtimeReceiptCode: receipt.runtimeReceiptCode,
      },
      receipt.executedAt,
      40
    );

    if (!runtimeReceipt) {
      continue;
    }

    pushTimelineItem(
      {
        id: `runtime-receipt:${runtimeReceipt.receiptCode}`,
        category: 'runtime',
        stage: 'runtime-receipt',
        title: `Runtime 回执 · ${runtimeReceipt.receiptCode}`,
        summary: `${runtimeReceipt.state} · ${runtimeReceipt.payloadSummary}`,
        status: runtimeReceipt.state,
        actionCode: receipt.actionCode,
        taskId: receipt.taskId,
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt.receiptCode,
        approvalTicket: runtimeReceipt.approval?.ticket ?? undefined,
      },
      runtimeReceipt.generatedAt,
      50
    );

    for (const event of runtimeReceipt.events) {
      pushTimelineItem(
        {
          id: `runtime-event:${runtimeReceipt.receiptCode}:${event.eventType}:${event.occurredAt}`,
          category: 'runtime',
          stage: 'runtime-event',
          title: `Runtime 事件 · ${event.eventType}`,
          summary: `${event.summary}，状态 ${event.status}`,
          status: event.status,
          actionCode: receipt.actionCode,
          taskId: receipt.taskId,
          executionId: receipt.executionId,
          runtimeReceiptCode: runtimeReceipt.receiptCode,
          approvalTicket: runtimeReceipt.approval?.ticket ?? undefined,
        },
        event.occurredAt,
        60
      );
    }

    if (!runtimeReceipt.approval?.required) {
      continue;
    }

    const approval = runtimeReceipt.approval;
    const approvalLabel = getApprovalStatusLabel(approval.status);

    pushTimelineItem(
      {
        id: `approval-state:${approval.ticket ?? receipt.executionId}:${approval.status}`,
        category: 'approval',
        stage: approval.status === 'PENDING' ? 'approval-pending' : 'approval-decided',
        title: approval.status === 'PENDING' ? `审批待决 · ${approvalLabel}` : `审批决策 · ${approvalLabel}`,
        summary:
          approval.status === 'PENDING'
            ? approval.ticket
              ? `审批单 ${approval.ticket} 正在等待处理，动作 ${getApprovalActionLabel(receipt)} 尚未放行。`
              : `当前审批仍待处理，动作 ${getApprovalActionLabel(receipt)} 尚未放行。`
            : approval.ticket
              ? `审批单 ${approval.ticket} 已${approvalLabel}，动作 ${getApprovalActionLabel(receipt)} 由 ${approval.decidedBy ?? '审批系统'} 于 ${approval.decidedAt ?? approval.updatedAt ?? '未知时间'} 完成决策。`
              : `当前审批已${approvalLabel}，动作 ${getApprovalActionLabel(receipt)} 由 ${approval.decidedBy ?? '审批系统'} 完成决策。`,
        status: approval.status,
        actionCode: receipt.actionCode,
        taskId: receipt.taskId,
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt.receiptCode,
        approvalTicket: approval.ticket ?? undefined,
        decisionBy: approval.decidedBy ?? undefined,
        decisionAt: approval.decidedAt ?? approval.updatedAt ?? undefined,
        emphasis:
          approval.status === 'APPROVED'
            ? 'success'
            : approval.status === 'PENDING'
              ? 'warning'
              : 'danger',
      },
      approval.status === 'PENDING' ? approval.updatedAt ?? runtimeReceipt.generatedAt : approval.decidedAt ?? approval.updatedAt,
      70
    );

    pushTimelineItem(
      {
        id: `approval-executed:${approval.ticket ?? receipt.executionId}`,
        category: 'approval',
        stage: 'approval-executed',
        title: '审批执行',
        summary:
          approval.execution?.executionStatus
            ? `审批结果已下发执行，当前执行状态 ${approval.execution.executionStatus}，执行人 ${approval.execution.executedBy ?? 'runtime-governance'}。`
            : '审批结果已下发执行，等待后续执行状态刷新。',
        status: approval.execution?.executionStatus,
        actionCode: receipt.actionCode,
        taskId: receipt.taskId,
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt.receiptCode,
        approvalTicket: approval.ticket ?? undefined,
        decisionBy: approval.execution?.executedBy ?? undefined,
        decisionAt: approval.execution?.executedAt ?? undefined,
        emphasis: 'info',
      },
      approval.execution?.executedAt,
      80
    );

    pushTimelineItem(
      {
        id: `approval-failed:${approval.ticket ?? receipt.executionId}`,
        category: 'approval',
        stage: 'approval-failed',
        title: '审批执行失败',
        summary:
          approval.execution?.lastFailure?.failureReason
            ? `审批通过后的执行失败：${approval.execution.lastFailure.failureReason}`
            : '审批通过后的执行失败，等待补偿处理。',
        status: approval.execution?.lastFailure?.failureStatus,
        actionCode: receipt.actionCode,
        taskId: receipt.taskId,
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt.receiptCode,
        approvalTicket: approval.ticket ?? undefined,
        decisionBy: approval.execution?.lastFailure?.failedBy ?? undefined,
        decisionAt: approval.execution?.lastFailure?.failedAt ?? undefined,
        emphasis: 'danger',
      },
      approval.execution?.lastFailure?.failedAt,
      90
    );
  }

  return sortableItems
    .sort((left, right) => left.sortAt - right.sortAt || left.order - right.order || left.id.localeCompare(right.id))
    .map((item) => {
      const { sortAt, order, ...rest } = item;
      void sortAt;
      void order;
      return rest;
    });
}

function buildAdminMemberOperationSourceAttentionItems(
  receipts: MemberOperationsReceiptApi[],
  runtimeReceipts: Record<string, MemberOperationsRuntimeReceipt>
): AdminMemberOperationSourceAttentionItem[] {
  const items: AdminMemberOperationSourceAttentionItem[] = [];

  for (const receipt of receipts) {
    const runtimeReceipt = runtimeReceipts[receipt.executionId];
    const approval = runtimeReceipt ? getMemberOperationsRuntimeApprovalSummary(runtimeReceipt) : null;

    if (approval?.ticket && approval.status === 'PENDING') {
      items.push({
        id: `pending-approval:${approval.ticket}`,
        level: 'high',
        kind: 'pending-approval',
        title: '存在待处理审批',
        summary: `${receipt.actionCode} 对应审批单 ${approval.ticket} 仍待决策`,
        actionCode: receipt.actionCode,
        taskId: receipt.taskId,
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt?.receiptCode,
        approvalTicket: approval.ticket,
      });
    }

    if (receipt.runtimeState === 'blocked') {
      items.push({
        id: `blocked:${receipt.executionId}`,
        level: 'high',
        kind: 'blocked',
        title: '来源链存在阻塞回执',
        summary: `${receipt.executionId} 当前处于 blocked，需要排查 runtime 详情`,
        actionCode: receipt.actionCode,
        taskId: receipt.taskId,
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt?.receiptCode ?? receipt.runtimeReceiptCode,
        approvalTicket: runtimeReceipt?.approval?.ticket ?? undefined,
      });
    }

    if (receipt.runtimeReplayable) {
      items.push({
        id: `replayable:${receipt.executionId}`,
        level: approval?.status === 'PENDING' ? 'info' : 'medium',
        kind: 'replayable',
        title: '存在可重放回执',
        summary: `${receipt.executionId} 允许 replay，可作为同来源补偿入口`,
        actionCode: receipt.actionCode,
        taskId: receipt.taskId,
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt?.receiptCode ?? receipt.runtimeReceiptCode,
        approvalTicket: runtimeReceipt?.approval?.ticket ?? undefined,
      });
    }

    if (receipt.runtimeState === 'replay-scheduled') {
      items.push({
        id: `replay-scheduled:${receipt.executionId}`,
        level: 'info',
        kind: 'replay-scheduled',
        title: '来源链已有重放调度',
        summary: `${receipt.executionId} 已进入 replay-scheduled，等待后续 runtime 回执刷新`,
        actionCode: receipt.actionCode,
        taskId: receipt.taskId,
        executionId: receipt.executionId,
        runtimeReceiptCode: runtimeReceipt?.receiptCode ?? receipt.runtimeReceiptCode,
        approvalTicket: runtimeReceipt?.approval?.ticket ?? undefined,
      });
    }
  }

  return items.sort((left, right) => {
    const weight = { high: 0, medium: 1, info: 2 } as const;
    return weight[left.level] - weight[right.level] || left.id.localeCompare(right.id);
  });
}

function buildAdminMemberOperationSourceRecommendedActions(input: {
  memberId: string;
  sourceKind: MemberOperationsSourceKind;
  sourceId: string;
  chainSummary: AdminMemberOperationSourceDetailSnapshot['chainSummary'];
}): AdminMemberOperationSourceRecommendedAction[] {
  const actions: AdminMemberOperationSourceRecommendedAction[] = [];

  if (input.chainSummary.pendingApprovals > 0) {
    actions.push({
      code: 'batch-approve',
      priority: 'high',
      label: '优先处理同来源审批',
      reason: `当前仍有 ${input.chainSummary.pendingApprovals} 条待审批，先解锁高风险 replay 链路。`,
      href: '/approvals?status=PENDING',
    });
  }

  if (input.chainSummary.replayableReceipts > 0) {
    actions.push({
      code: 'batch-replay',
      priority: input.chainSummary.pendingApprovals > 0 ? 'medium' : 'high',
      label: '批量 replay 同来源回执',
      reason: `当前有 ${input.chainSummary.replayableReceipts} 条可 replay 回执，可作为来源级补偿动作。`,
      href: `/members/${input.memberId}/sources/${input.sourceKind}/${input.sourceId}`,
    });
  }

  if (input.chainSummary.blockedReceipts > 0) {
    actions.push({
      code: 'inspect-blocked',
      priority: 'high',
      label: '排查 blocked 回执',
      reason: `来源链仍有 ${input.chainSummary.blockedReceipts} 条 blocked 回执，需要进入 runtime 详情查阻塞原因。`,
      href: '/operations?focus=governance-audit',
    });
  }

  if (actions.length === 0) {
    actions.push({
      code: 'review-source-chain',
      priority: 'low',
      label: '复核来源处置轨迹',
      reason: '当前来源链无待审批或阻塞，可复核已回调和已执行节点，确认是否完成闭环。',
      href: `/members/${input.memberId}/sources/${input.sourceKind}/${input.sourceId}`,
    });
  }

  return actions;
}

function buildAdminMemberOperationSourceStageSegments(input: {
  memberId: string;
  sourceKind: MemberOperationsSourceKind;
  sourceId: string;
  receipts: MemberOperationsReceiptApi[];
  timelineItems: AdminMemberOperationSourceTimelineItem[];
  chainSummary: AdminMemberOperationSourceDetailSnapshot['chainSummary'];
}): AdminMemberOperationSourceStageSegment[] {
  const latestOccurredAtFor = (
    matcher: (item: AdminMemberOperationSourceTimelineItem) => boolean
  ): string | null => {
    const matches = input.timelineItems.filter(matcher);
    return matches.length > 0 ? matches[matches.length - 1]?.occurredAt ?? null : null;
  };

  const executionIdsFor = (matcher: (receipt: MemberOperationsReceiptApi) => boolean) =>
    input.receipts.filter(matcher).map((item) => item.executionId);

  return [
    {
      id: 'approval',
      title: '审批段',
      status:
        input.chainSummary.pendingApprovals > 0
          ? 'attention'
          : input.chainSummary.approvedApprovals > 0
            ? 'completed'
            : 'idle',
      summary:
        input.chainSummary.pendingApprovals > 0
          ? `仍有 ${input.chainSummary.pendingApprovals} 条待审批，当前来源链需要审批台继续处理。`
          : input.chainSummary.approvedApprovals > 0
            ? `已有 ${input.chainSummary.approvedApprovals} 条审批通过，审批链已释放。`
            : '当前来源链没有进入审批阻塞。 ',
      owner: input.chainSummary.pendingApprovals > 0 ? '审批台' : '来源治理台',
      nextAction: input.chainSummary.pendingApprovals > 0 ? '处理待审批单并刷新来源链' : '复核是否还需人工审批',
      href: input.chainSummary.pendingApprovals > 0 ? '/approvals?status=PENDING' : null,
      latestOccurredAt: latestOccurredAtFor((item) => item.category === 'approval'),
      count: input.chainSummary.pendingApprovals + input.chainSummary.approvedApprovals,
      relatedExecutionIds: executionIdsFor((receipt) => Boolean(receipt.runtimeReceiptCode)),
    },
    {
      id: 'replay',
      title: '重放段',
      status:
        input.chainSummary.replayableReceipts > 0
          ? 'attention'
          : input.chainSummary.replayScheduledReceipts > 0
            ? 'in-progress'
            : input.chainSummary.runtimeTrackedReceipts > 0
              ? 'completed'
              : 'idle',
      summary:
        input.chainSummary.replayableReceipts > 0
          ? `当前有 ${input.chainSummary.replayableReceipts} 条可 replay 回执，可作为来源级补偿入口。`
          : input.chainSummary.replayScheduledReceipts > 0
            ? `已有 ${input.chainSummary.replayScheduledReceipts} 条回执进入 replay-scheduled，等待后续 runtime 回写。`
            : input.chainSummary.runtimeTrackedReceipts > 0
              ? '当前来源链没有待补偿的 replay 动作。'
              : '当前来源链尚未挂接 runtime 回执。 ',
      owner: input.chainSummary.replayableReceipts > 0 ? '运营治理台' : 'Runtime 执行器',
      nextAction:
        input.chainSummary.replayableReceipts > 0 ? '执行同来源批量 replay' : '继续观察 replay 与 callback 后续状态',
      href: buildMemberOperationsSourceDetailHref(input.memberId, input.sourceKind, input.sourceId),
      latestOccurredAt: latestOccurredAtFor(
        (item) => item.stage === 'runtime-receipt' || item.stage === 'approval-executed' || item.stage === 'runtime-event'
      ),
      count: input.chainSummary.replayableReceipts + input.chainSummary.replayScheduledReceipts,
      relatedExecutionIds: executionIdsFor((receipt) => receipt.runtimeReplayable || receipt.runtimeState === 'replay-scheduled'),
    },
    {
      id: 'callback',
      title: '回调段',
      status:
        input.chainSummary.callbackRecordedReceipts >= input.chainSummary.runtimeTrackedReceipts &&
        input.chainSummary.runtimeTrackedReceipts > 0
          ? 'completed'
          : input.chainSummary.callbackRecordedReceipts > 0
            ? 'in-progress'
            : 'idle',
      summary:
        input.chainSummary.callbackRecordedReceipts >= input.chainSummary.runtimeTrackedReceipts &&
        input.chainSummary.runtimeTrackedReceipts > 0
          ? `已记录 ${input.chainSummary.callbackRecordedReceipts} 条 callback，来源回调链完整。`
          : input.chainSummary.callbackRecordedReceipts > 0
            ? `已记录 ${input.chainSummary.callbackRecordedReceipts} 条 callback，仍需等待剩余 runtime 回执回调。`
            : '当前来源链尚未形成 callback 记录。 ',
      owner: '执行器回调',
      nextAction:
        input.chainSummary.callbackRecordedReceipts >= input.chainSummary.runtimeTrackedReceipts &&
        input.chainSummary.runtimeTrackedReceipts > 0
          ? '复核是否已完成最终治理闭环'
          : '持续关注 runtime callback 回写',
      href: '/operations?focus=callback',
      latestOccurredAt: latestOccurredAtFor(
        (item) => item.stage === 'runtime-event' || item.stage === 'receipt-recorded'
      ),
      count: input.chainSummary.callbackRecordedReceipts,
      relatedExecutionIds: executionIdsFor((receipt) => receipt.runtimeState === 'callback-recorded'),
    },
    {
      id: 'blocked',
      title: '阻塞段',
      status: input.chainSummary.blockedReceipts > 0 ? 'blocked' : 'completed',
      summary:
        input.chainSummary.blockedReceipts > 0
          ? `存在 ${input.chainSummary.blockedReceipts} 条 blocked 回执，来源链当前卡在异常处置。`
          : '当前来源链没有 blocked 异常节点。',
      owner: input.chainSummary.blockedReceipts > 0 ? 'Runtime 排障' : '来源治理台',
      nextAction:
        input.chainSummary.blockedReceipts > 0 ? '进入 runtime 详情排查阻塞原因' : '保持巡检，继续观察新增异常',
      href: input.chainSummary.blockedReceipts > 0 ? '/operations?focus=governance-audit' : null,
      latestOccurredAt: latestOccurredAtFor(
        (item) => item.status === 'blocked' || item.stage === 'approval-failed'
      ),
      count: input.chainSummary.blockedReceipts,
      relatedExecutionIds: executionIdsFor((receipt) => receipt.runtimeState === 'blocked'),
    },
  ];
}

export function buildMemberOperationsReceiptDetailHref(memberId: string, executionId: string): string {
  return `/members/${memberId}/receipts/${executionId}`;
}

export function buildMemberOperationsTaskDetailHref(memberId: string, taskId: string): string {
  return `/members/${memberId}/tasks/${taskId}`;
}

export function buildMemberOperationsSourceDetailHref(
  memberId: string,
  sourceKind: MemberOperationsSourceKind,
  sourceId: string
): string {
  return `/members/${memberId}/sources/${sourceKind}/${sourceId}`;
}

export function buildMemberOperationsRuntimeDetailHref(receiptCode: string): string {
  return `/operations/${receiptCode}`;
}

export function getMemberOperationsRuntimeApprovalSummary(
  receipt: MemberOperationsRuntimeReceipt
): MemberOperationsRuntimeApprovalSummary | null {
  if (!receipt.approval || !receipt.approval.required) {
    return null;
  }

  return {
    required: receipt.approval.required,
    status: receipt.approval.status,
    ticket: receipt.approval.ticket,
    executed: receipt.approval.execution?.executed ?? false,
    executionStatus: receipt.approval.execution?.executionStatus ?? null,
    lastFailureReason: receipt.approval.execution?.lastFailure?.failureReason ?? null,
  };
}
