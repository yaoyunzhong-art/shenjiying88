'use client';

import { useState, useCallback, use, useEffect, useMemo, type CSSProperties } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  DetailActionBar,
  DetailClosureBar,
  DetailShell,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatusBadge,
  StatCard,
  CopyToClipboard,
  SubmitButton,
  WorkspaceBreadcrumb,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';

import {
  MEMBER_TIER_MAP,
  MEMBER_STATUS_MAP,
  MEMBER_LIFECYCLE_MAP,
  type MemberDetail,
  type MemberTier,
  type MemberStatus,
} from '../../members-data';
import {
  awardAdminMemberPoints,
  buildMemberOperationsReceiptDetailHref,
  buildMemberOperationsTaskDetailHref,
  buildMemberOperationsRuntimeDetailHref,
  deriveLatestMemberApprovalOutcome,
  getMemberOperationsRuntimeApprovalSummary,
  isMemberMutationApprovalResult,
  loadAdminMemberDetail,
  loadMemberOperationsRuntimeReceipt,
  recordAdminMemberPaymentActivity,
  replayMemberOperationsRuntimeReceipt,
  rollbackAdminMemberPoints,
  type AdminMemberOverviewTimelineItem,
  type MemberLatestApprovalOutcome,
  type MemberMutationResponse,
  updateAdminMemberLevel,
  updateAdminMemberProfile,
  updateAdminMemberStatus,
  type MemberOperationsRuntimeReceipt,
  type MemberApiProfile,
  type MemberUpgradeCheckResult,
} from '../../members-view-model';
import { buildGovernanceApprovalDetailHref } from '../../approvals-data';
import { useDetailActions } from '../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';
import { buildAuditTrailHref as buildMemberAuditTrailHref } from '../../audit-trail-view-model';

// ---- 编辑表单 ----

interface EditFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface EditFormErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface RuntimeActionState {
  phase?: 'querying' | 'replaying';
  error?: string;
  success?: string;
}

interface PaymentActivityFormData {
  orderId: string;
  amount: string;
  paidAt: string;
  channel: string;
  source: 'cashier' | 'lyt-snapshot';
}

interface ActionFeedbackState {
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
}

interface MutationHighlightState {
  title: string;
  summary: string;
  taskTitles: string[];
  receiptSummaries: string[];
  actionLabel?: string;
  actionHref?: string;
}

interface MemberApprovalReviewContext {
  ticket: string;
  status: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED';
  operation?: string;
  decidedAt?: string;
  updatedAt?: string;
  autoRefresh: boolean;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '姓名不能为空';
  if (!data.phone.trim()) errors.phone = '电话不能为空';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确';
  }
  return errors;
}

async function submitMemberEdit(form: EditFormData): Promise<{ success: boolean }> {
  void form;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}

// ---- 等级升级 / API 映射 ----

const tierUpgradeMap: Record<MemberTier, MemberTier | null> = {
  diamond: null,
  gold: 'diamond',
  silver: 'gold',
  bronze: 'silver',
  standard: 'bronze',
};

const tierDowngradeMap: Record<MemberTier, MemberTier | null> = {
  diamond: 'gold',
  gold: 'silver',
  silver: 'bronze',
  bronze: 'standard',
  standard: null,
};

const apiLevelSequence: MemberApiProfile['level'][] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];

function getNextApiLevel(level: MemberApiProfile['level'] | undefined): MemberApiProfile['level'] | null {
  const currentIndex = level ? apiLevelSequence.indexOf(level) : -1;
  if (currentIndex === -1 || currentIndex >= apiLevelSequence.length - 1) {
    return null;
  }
  return apiLevelSequence[currentIndex + 1] ?? null;
}

function getPreviousApiLevel(level: MemberApiProfile['level'] | undefined): MemberApiProfile['level'] | null {
  const currentIndex = level ? apiLevelSequence.indexOf(level) : -1;
  if (currentIndex <= 0) {
    return null;
  }
  return apiLevelSequence[currentIndex - 1] ?? null;
}

function toTierFromApiLevel(level: MemberApiProfile['level'] | undefined): MemberTier {
  switch (level) {
    case 'DIAMOND':
      return 'diamond';
    case 'PLATINUM':
    case 'GOLD':
      return 'gold';
    case 'SILVER':
      return 'silver';
    case 'BRONZE':
    default:
      return 'bronze';
  }
}

function memberTierToApiLevel(tier: MemberTier): MemberApiProfile['level'] {
  switch (tier) {
    case 'diamond':
      return 'DIAMOND';
    case 'gold':
      return 'GOLD';
    case 'silver':
      return 'SILVER';
    case 'bronze':
    case 'standard':
    default:
      return 'BRONZE';
  }
}

function toStatusFromApiStatus(status: MemberApiProfile['status'] | undefined): MemberStatus {
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
      return 'active';
  }
}

async function simulateStatusChange(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}

async function simulateTierChange(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}

// ---- 生命周期颜色 ----

function lifecycleColor(stage: string): string {
  const map: Record<string, string> = {
    new: '#fbbf24',
    growing: '#4ade80',
    loyal: '#818cf8',
    declining: '#fb923c',
    lost: '#f87171',
  };
  return map[stage] ?? '#94a3b8';
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function levelLabel(level: MemberUpgradeCheckResult['currentLevel'] | null): string {
  switch (level) {
    case 'DIAMOND':
      return '钻石卡';
    case 'PLATINUM':
      return '铂金卡';
    case 'GOLD':
      return '金卡';
    case 'SILVER':
      return '银卡';
    case 'BRONZE':
      return '铜卡';
    default:
      return '—';
  }
}

function taskPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  if (priority === 'high') return '#fca5a5';
  if (priority === 'medium') return '#fde68a';
  return '#93c5fd';
}

function taskStatusColor(status: 'queued' | 'dispatched' | 'completed'): string {
  if (status === 'completed') return '#86efac';
  if (status === 'dispatched') return '#93c5fd';
  return '#fcd34d';
}

function runtimeStateColor(
  state:
    | MemberOperationsRuntimeReceipt['state']
    | Awaited<ReturnType<typeof loadAdminMemberDetail>>['operationsReceipts'][number]['runtimeState']
    | undefined
): string {
  if (state === 'callback-recorded') return '#86efac';
  if (state === 'replay-scheduled') return '#c4b5fd';
  if (state === 'submitted') return '#93c5fd';
  if (state === 'challenge-issued') return '#fde68a';
  if (state === 'blocked') return '#fca5a5';
  return '#94a3b8';
}

function truncateMiddle(value: string, edge = 10): string {
  if (value.length <= edge * 2 + 3) {
    return value;
  }
  return `${value.slice(0, edge)}...${value.slice(-edge)}`;
}

function formatBackoff(ms: number): string {
  if (ms >= 60_000) {
    return `${Math.round(ms / 60_000)}m`;
  }
  if (ms >= 1_000) {
    return `${Math.round(ms / 1_000)}s`;
  }
  return `${ms}ms`;
}

function latestRuntimeEvent(receipt: MemberOperationsRuntimeReceipt): string {
  return receipt.events[receipt.events.length - 1]?.eventType ?? '—';
}

function runtimeApprovalColor(
  status: NonNullable<MemberOperationsRuntimeReceipt['approval']>['status']
): string {
  if (status === 'APPROVED') return '#86efac';
  if (status === 'PENDING') return '#fde68a';
  if (status === 'NOT_REQUIRED') return '#93c5fd';
  return '#fca5a5';
}

function getApiReadOnlyMessage(member: MemberDetail): string {
  return `当前展示的是会员 ${member.code} 的真实持久化档案，已开放昵称、手机号、邮箱、地址、内部备注、积分调整、支付活动录入、状态流转、手工等级调整和 runtime 治理动作；高风险动作会自动转入审批。`;
}

function buildApprovalMutationHighlight(result: MemberMutationResponse): MutationHighlightState | null {
  if (!isMemberMutationApprovalResult(result)) {
    return null;
  }
  return {
    title: '动作已转入审批',
    summary: result.summary,
    taskTitles: result.approvalTicket ? [`审批单 ${result.approvalTicket}`] : [],
    receiptSummaries: [`状态 ${result.approvalStatus}`],
    actionLabel: result.approvalTicket ? '查看审批单' : '查看审批工作台',
    actionHref: result.approvalTicket ? buildGovernanceApprovalDetailHref(result.approvalTicket) : '/approvals',
  };
}

function buildMutationSuccessMessage(result: MemberMutationResponse, appliedMessage: string): string {
  if (isMemberMutationApprovalResult(result)) {
    return `${result.summary}${result.approvalTicket ? `，审批单 ${result.approvalTicket}` : ''}`;
  }
  return appliedMessage;
}

function approvalStatusLabel(
  status: MemberApprovalReviewContext['status']
): string {
  switch (status) {
    case 'APPROVED':
      return '已通过';
    case 'REJECTED':
      return '已驳回';
    case 'CANCELLED':
      return '已撤销';
    case 'SUPERSEDED':
      return '已被替代';
    case 'NOT_REQUIRED':
      return '无需审批';
    case 'PENDING':
    default:
      return '待审批';
  }
}

function approvalOperationLabel(operation?: string): string {
  switch (operation) {
    case 'member.points.award':
      return '会员加分';
    case 'member.points.rollback':
      return '会员扣分';
    case 'member.status.update':
      return '会员状态变更';
    case 'member.level.override':
      return '会员等级调整';
    case 'foundation.runtime-governance.replay':
      return 'Runtime Replay';
    default:
      return '会员动作';
  }
}

function parseMemberApprovalReview(
  searchParams: { get(name: string): string | null } | null
): MemberApprovalReviewContext | null {
  const ticket = searchParams?.get('approvalTicket');
  const status = searchParams?.get('approvalStatus');
  if (
    !ticket ||
    !status ||
    (status !== 'NOT_REQUIRED' &&
      status !== 'PENDING' &&
      status !== 'APPROVED' &&
      status !== 'REJECTED' &&
      status !== 'CANCELLED' &&
      status !== 'SUPERSEDED')
  ) {
    return null;
  }

  return {
    ticket,
    status,
    operation: searchParams?.get('approvalOperation') ?? undefined,
    decidedAt: searchParams?.get('approvalDecidedAt') ?? undefined,
    updatedAt: searchParams?.get('approvalUpdatedAt') ?? undefined,
    autoRefresh: searchParams?.get('approvalRefresh') === '1',
  };
}

function buildApprovalReviewHighlight(
  review: MemberApprovalReviewContext,
  syncState: 'pending' | 'refreshed' = 'pending'
): MutationHighlightState {
  const actionLabel = approvalOperationLabel(review.operation);
  const statusLabel = approvalStatusLabel(review.status);
  const decidedAt = review.decidedAt ?? review.updatedAt;

  let title = `审批状态：${statusLabel}`;
  let summary = `审批单 ${review.ticket} 对应的${actionLabel}当前为 ${statusLabel}。`;

  if (review.status === 'APPROVED') {
    title = syncState === 'refreshed' ? '审批已通过并刷新档案' : '审批已通过';
    summary =
      syncState === 'refreshed'
        ? `审批单 ${review.ticket} 已通过，会员最新档案已自动刷新。`
        : `审批单 ${review.ticket} 已通过，正在同步 ${actionLabel} 对会员档案的最新影响。`;
  } else if (review.status === 'REJECTED') {
    summary = `审批单 ${review.ticket} 已驳回，${actionLabel} 未落入会员档案。`;
  } else if (review.status === 'CANCELLED') {
    summary = `审批单 ${review.ticket} 已撤销，${actionLabel} 不再继续执行。`;
  } else if (review.status === 'PENDING') {
    title = '动作已转入审批';
    summary = `审批单 ${review.ticket} 仍待处理，${actionLabel} 结果尚未写入会员档案。`;
  }

  return {
    title,
    summary,
    taskTitles: [`审批单 ${review.ticket}`],
    receiptSummaries: [decidedAt ? `${statusLabel} · ${decidedAt}` : `状态 ${statusLabel}`],
    actionLabel: '返回审批单',
    actionHref: buildGovernanceApprovalDetailHref(review.ticket),
  };
}

function buildLatestApprovalOutcomeHighlight(
  outcome: MemberLatestApprovalOutcome
): MutationHighlightState | null {
  if (!outcome.ticket || !outcome.status) {
    return null;
  }
  const statusLabel = approvalStatusLabel(outcome.status);
  const actionLabel = approvalOperationLabel(outcome.operation);
  const decisionAt = outcome.decisionAt ?? outcome.occurredAt ?? '';
  const executionFailed = outcome.executionStatus === 'EXECUTION_FAILED';
  const executed = outcome.executionStatus === 'EXECUTED';
  let title = `审批状态：${statusLabel}`;
  let summary = outcome.summary
    ?? `审批单 ${outcome.ticket} 对应的${actionLabel}当前为 ${statusLabel}。`;

  if (outcome.status === 'APPROVED') {
    if (executionFailed) {
      title = '审批执行失败';
      if (!outcome.summary) {
        summary = `审批单 ${outcome.ticket} 已通过，但 ${actionLabel} 执行失败${outcome.executionSummary ? `：${outcome.executionSummary}` : '。'}`;
      }
    } else if (executed) {
      title = '审批已执行';
      if (!outcome.summary) {
        summary = `审批单 ${outcome.ticket} 已执行完毕，${actionLabel} 落账完成。`;
      }
    } else {
      title = '审批已通过';
      if (!outcome.summary) {
        summary = `审批单 ${outcome.ticket} 已通过，${actionLabel} 已落入会员档案。`;
      }
    }
  } else if (outcome.status === 'REJECTED') {
    if (!outcome.summary) {
      summary = `审批单 ${outcome.ticket} 已驳回，${actionLabel} 未落入会员档案。`;
    }
  } else if (outcome.status === 'CANCELLED') {
    if (!outcome.summary) {
      summary = `审批单 ${outcome.ticket} 已撤销，${actionLabel} 不再继续执行。`;
    }
  } else if (outcome.status === 'PENDING') {
    title = '动作已转入审批';
    if (!outcome.summary) {
      summary = `审批单 ${outcome.ticket} 仍待处理，${actionLabel} 结果尚未写入会员档案。`;
    }
  }

  return {
    title,
    summary,
    taskTitles: [`审批单 ${outcome.ticket}`],
    receiptSummaries: [
      decisionAt ? `${statusLabel} · ${decisionAt}` : `状态 ${statusLabel}`,
      outcome.decisionBy ? `处理人 ${outcome.decisionBy}` : null,
    ].filter((value): value is string => Boolean(value)),
    actionLabel: '查看审批单',
    actionHref: buildGovernanceApprovalDetailHref(outcome.ticket),
  };
}

function overviewTimelineCategoryLabel(category: AdminMemberOverviewTimelineItem['category']): string {
  switch (category) {
    case 'mutation':
      return 'Mutation';
    case 'receipt':
      return 'Receipt';
    case 'runtime':
      return 'Runtime';
    default:
      return 'Approval';
  }
}

function overviewTimelineStageLabel(stage: AdminMemberOverviewTimelineItem['stage']): string {
  switch (stage) {
    case 'mutation':
      return '资料变更';
    case 'receipt-recorded':
      return '回执记录';
    case 'runtime-receipt':
      return '治理回执';
    case 'approval-pending':
      return '待审批';
    case 'approval-decided':
      return '审批决策';
    case 'approval-executed':
      return '审批执行';
    default:
      return '执行失败';
  }
}

function overviewTimelineTone(category: AdminMemberOverviewTimelineItem['category']) {
  switch (category) {
    case 'mutation':
      return {
        dot: '#93c5fd',
        ring: 'rgba(59,130,246,0.24)',
        border: 'rgba(96,165,250,0.24)',
        label: '#dbeafe',
        badge: 'rgba(59,130,246,0.16)',
      } as const;
    case 'receipt':
      return {
        dot: '#a78bfa',
        ring: 'rgba(139,92,246,0.24)',
        border: 'rgba(167,139,250,0.24)',
        label: '#e9d5ff',
        badge: 'rgba(139,92,246,0.16)',
      } as const;
    case 'runtime':
      return {
        dot: '#86efac',
        ring: 'rgba(34,197,94,0.24)',
        border: 'rgba(74,222,128,0.24)',
        label: '#dcfce7',
        badge: 'rgba(34,197,94,0.16)',
      } as const;
    default:
      return {
        dot: '#fde68a',
        ring: 'rgba(250,204,21,0.24)',
        border: 'rgba(250,204,21,0.24)',
        label: '#fef3c7',
        badge: 'rgba(250,204,21,0.16)',
      } as const;
  }
}

function overviewTimelineStatusTone(item: AdminMemberOverviewTimelineItem) {
  if (item.emphasis === 'success') {
    return { color: '#86efac', background: 'rgba(34,197,94,0.16)' };
  }
  if (item.emphasis === 'danger') {
    return { color: '#fca5a5', background: 'rgba(239,68,68,0.16)' };
  }
  if (item.emphasis === 'warning') {
    return { color: '#fde68a', background: 'rgba(250,204,21,0.16)' };
  }
  return { color: '#bfdbfe', background: 'rgba(59,130,246,0.18)' };
}

// ---- 页面组件 ----

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const approvalReview = useMemo(() => parseMemberApprovalReview(searchParams), [searchParams]);
  const [snapshot, setSnapshot] = useState<{
    status: 'loading' | 'ready';
    deliveryMode: 'api' | 'fallback';
    member: MemberDetail | null;
    upgradeCheck: MemberUpgradeCheckResult | null;
    operationsProfile: Awaited<ReturnType<typeof loadAdminMemberDetail>>['operationsProfile'];
    mutationHistory: Awaited<ReturnType<typeof loadAdminMemberDetail>>['mutationHistory'];
    operationsReceipts: Awaited<ReturnType<typeof loadAdminMemberDetail>>['operationsReceipts'];
    runtimeReceipts: Awaited<ReturnType<typeof loadAdminMemberDetail>>['runtimeReceipts'];
    overviewTimeline: Awaited<ReturnType<typeof loadAdminMemberDetail>>['overviewTimeline'];
    latestApprovalOutcome: MemberLatestApprovalOutcome | null;
  }>({
    status: 'loading',
    deliveryMode: 'fallback',
    member: null,
    upgradeCheck: null,
    operationsProfile: null,
    mutationHistory: [],
    operationsReceipts: [],
    runtimeReceipts: {},
    overviewTimeline: [],
    latestApprovalOutcome: null,
  });

  const reloadMember = useCallback(async () => {
    const result = await loadAdminMemberDetail(id);
    setSnapshot({
      status: 'ready',
      deliveryMode: result.deliveryMode,
      member: result.member,
      upgradeCheck: result.upgradeCheck,
      operationsProfile: result.operationsProfile,
      mutationHistory: result.mutationHistory,
      operationsReceipts: result.operationsReceipts,
      runtimeReceipts: result.runtimeReceipts,
      overviewTimeline: result.overviewTimeline,
      latestApprovalOutcome: deriveLatestMemberApprovalOutcome(result.mutationHistory),
    });
    return result;
  }, [id]);

  useEffect(() => {
    let disposed = false;

    async function hydrateMember() {
      const result = await loadAdminMemberDetail(id);
      if (!disposed) {
        setSnapshot({
          status: 'ready',
          deliveryMode: result.deliveryMode,
          member: result.member,
          upgradeCheck: result.upgradeCheck,
          operationsProfile: result.operationsProfile,
          mutationHistory: result.mutationHistory,
          operationsReceipts: result.operationsReceipts,
          runtimeReceipts: result.runtimeReceipts,
          overviewTimeline: result.overviewTimeline,
          latestApprovalOutcome: deriveLatestMemberApprovalOutcome(result.mutationHistory),
        });
      }
    }

    void hydrateMember();

    return () => {
      disposed = true;
    };
  }, [id]);

  if (snapshot.status === 'loading') {
    return (
      <DetailShell
        title="会员详情加载中"
        backLink={{ label: '返回会员列表', href: '/members' }}
        subtitle={`正在同步会员 ${id} 的最新档案...`}
      />
    );
  }

  if (!snapshot.member) {
    return (
      <DetailShell
        title="会员不存在"
        backLink={{ label: '返回会员列表', href: '/members' }}
        error={`未找到会员 ${id}`}
      />
    );
  }

  return (
    <MemberDetailContent
      key={snapshot.member.id}
      member={snapshot.member}
      deliveryMode={snapshot.deliveryMode}
      upgradeCheck={snapshot.upgradeCheck}
      operationsProfile={snapshot.operationsProfile}
      mutationHistory={snapshot.mutationHistory}
      operationsReceipts={snapshot.operationsReceipts}
      initialRuntimeReceipts={snapshot.runtimeReceipts}
      overviewTimeline={snapshot.overviewTimeline}
      approvalReview={approvalReview}
      latestApprovalOutcome={snapshot.latestApprovalOutcome}
      onRefreshMember={reloadMember}
    />
  );
}

function MemberDetailContent({
  member,
  deliveryMode,
  upgradeCheck,
  operationsProfile,
  mutationHistory,
  operationsReceipts,
  initialRuntimeReceipts,
  overviewTimeline,
  approvalReview,
  latestApprovalOutcome,
  onRefreshMember,
}: {
  member: MemberDetail;
  deliveryMode: 'api' | 'fallback';
  upgradeCheck: MemberUpgradeCheckResult | null;
  operationsProfile: Awaited<ReturnType<typeof loadAdminMemberDetail>>['operationsProfile'];
  mutationHistory: Awaited<ReturnType<typeof loadAdminMemberDetail>>['mutationHistory'];
  operationsReceipts: Awaited<ReturnType<typeof loadAdminMemberDetail>>['operationsReceipts'];
  initialRuntimeReceipts: Awaited<ReturnType<typeof loadAdminMemberDetail>>['runtimeReceipts'];
  overviewTimeline: Awaited<ReturnType<typeof loadAdminMemberDetail>>['overviewTimeline'];
  approvalReview: MemberApprovalReviewContext | null;
  latestApprovalOutcome: MemberLatestApprovalOutcome | null;
  onRefreshMember: () => Promise<Awaited<ReturnType<typeof loadAdminMemberDetail>>>;
}) {
  const lifecycleInfo = MEMBER_LIFECYCLE_MAP[member.lifecycleStage];
  const apiReadOnly = deliveryMode === 'api';
  const recommendedActions = member.recommendedActions ?? [];
  const operationsSegments = member.operationsSegments ?? [];
  const automationTriggers = member.automationTriggers ?? [];
  const operationsTasks = member.operationsTasks ?? [];
  const memberReceipts = member.operationsReceipts ?? operationsReceipts;
  const memberMutationHistory = member.mutationHistory ?? mutationHistory;

  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    name: member.name,
    phone: member.phone,
    email: member.email,
    address: member.address,
    notes: member.notes,
  });
  const [errors, setErrors] = useState<EditFormErrors>({});
  const [localStatus, setLocalStatus] = useState<MemberStatus>(member.status);
  const [localTier, setLocalTier] = useState<MemberTier>(member.tier);
  const [localApiStatus, setLocalApiStatus] = useState<MemberApiProfile['status'] | undefined>(member.apiStatus);
  const [localApiLevel, setLocalApiLevel] = useState<MemberApiProfile['level'] | undefined>(member.apiLevel);
  const [runtimeReceipts, setRuntimeReceipts] = useState<Record<string, MemberOperationsRuntimeReceipt | null>>(
    Object.fromEntries(Object.entries(initialRuntimeReceipts).map(([key, value]) => [key, value ?? null]))
  );
  const [runtimeActionStates, setRuntimeActionStates] = useState<Record<string, RuntimeActionState>>({});
  const [statusActionState, setStatusActionState] = useState<ActionFeedbackState>({ isSubmitting: false });
  const [tierActionState, setTierActionState] = useState<ActionFeedbackState>({ isSubmitting: false });
  const [mutationHighlight, setMutationHighlight] = useState<MutationHighlightState | null>(
    approvalReview
      ? buildApprovalReviewHighlight(approvalReview)
      : latestApprovalOutcome
        ? buildLatestApprovalOutcomeHighlight(latestApprovalOutcome)
        : null
  );
  const [awardPointsValue, setAwardPointsValue] = useState('');
  const [rollbackPointsValue, setRollbackPointsValue] = useState('');
  const [paymentForm, setPaymentForm] = useState<PaymentActivityFormData>({
    orderId: '',
    amount: '',
    paidAt: '',
    channel: '',
    source: 'cashier',
  });

  useEffect(() => {
    setLocalStatus(member.status);
    setLocalTier(member.tier);
    setLocalApiStatus(member.apiStatus);
    setLocalApiLevel(member.apiLevel);
    if (!editOpen) {
      setFormData({
        name: member.name,
        phone: member.phone,
        email: member.email,
        address: member.address,
        notes: member.notes,
      });
    }
  }, [editOpen, member.address, member.apiLevel, member.apiStatus, member.email, member.name, member.notes, member.phone, member.status, member.tier]);

  useEffect(() => {
    setRuntimeReceipts(
      Object.fromEntries(Object.entries(initialRuntimeReceipts).map(([key, value]) => [key, value ?? null]))
    );
  }, [initialRuntimeReceipts]);

  useEffect(() => {
    if (!approvalReview) {
      return;
    }
    setMutationHighlight(buildApprovalReviewHighlight(approvalReview));
  }, [approvalReview]);

  useEffect(() => {
    if (!apiReadOnly || !approvalReview?.autoRefresh) {
      return;
    }
    let disposed = false;
    const timer = window.setTimeout(async () => {
      await onRefreshMember();
      if (!disposed) {
        setMutationHighlight(buildApprovalReviewHighlight(approvalReview, 'refreshed'));
      }
    }, 1200);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
    };
  }, [apiReadOnly, approvalReview, onRefreshMember]);

  const editSubmit = useFormSubmit<{ success: boolean }>({
    async onSubmit() {
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error(Object.values(validationErrors)[0]);
      }
      setErrors({});
      if (apiReadOnly) {
        const result = await updateAdminMemberProfile(member.id, {
          nickname: formData.name.trim(),
          mobile: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          address: formData.address.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        });
        if (!result) {
          throw new Error('会员基础资料更新失败，请稍后重试。');
        }
        await onRefreshMember();
        setMutationHighlight(null);
        return { success: true };
      }
      return submitMemberEdit(formData);
    },
    successMessage: apiReadOnly ? '真实档案资料已更新。' : '会员信息已更新成功。',
  });

  const awardPointsSubmit = useFormSubmit({
    async onSubmit() {
      const points = Number(awardPointsValue);
      if (!Number.isFinite(points) || points <= 0) {
        throw new Error('请输入大于 0 的加分值');
      }
      const result = await awardAdminMemberPoints(member.id, { points });
      if (!result) {
        throw new Error('会员加积分失败，请稍后重试。');
      }
      if (isMemberMutationApprovalResult(result)) {
        setMutationHighlight(buildApprovalMutationHighlight(result));
      } else {
        await onRefreshMember();
        setMutationHighlight(null);
      }
      setAwardPointsValue('');
      return result;
    },
    successMessage: (result) => buildMutationSuccessMessage(result, '会员积分已增加，并刷新档案。'),
  });

  const rollbackPointsSubmit = useFormSubmit({
    async onSubmit() {
      const points = Number(rollbackPointsValue);
      if (!Number.isFinite(points) || points <= 0) {
        throw new Error('请输入大于 0 的扣减积分');
      }
      const result = await rollbackAdminMemberPoints(member.id, { points });
      if (!result) {
        throw new Error('会员扣减积分失败，请稍后重试。');
      }
      if (isMemberMutationApprovalResult(result)) {
        setMutationHighlight(buildApprovalMutationHighlight(result));
      } else {
        await onRefreshMember();
        setMutationHighlight(null);
      }
      setRollbackPointsValue('');
      return result;
    },
    successMessage: (result) => buildMutationSuccessMessage(result, '会员积分已扣减，并刷新档案。'),
  });

  const paymentActivitySubmit = useFormSubmit({
    async onSubmit() {
      const orderId = paymentForm.orderId.trim();
      const amount = Number(paymentForm.amount);
      if (!orderId) {
        throw new Error('请输入订单号');
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('请输入大于 0 的支付金额');
      }
      let paidAt: string | undefined;
      if (paymentForm.paidAt.trim()) {
        const parsed = new Date(paymentForm.paidAt);
        if (Number.isNaN(parsed.getTime())) {
          throw new Error('支付时间格式不正确');
        }
        paidAt = parsed.toISOString();
      }
      const result = await recordAdminMemberPaymentActivity(member.id, {
        orderId,
        amount,
        paidAt,
        channel: paymentForm.channel.trim() || undefined,
        source: paymentForm.source,
      });
      if (!result) {
        throw new Error('支付活动录入失败，请稍后重试。');
      }
      const previousTaskIds = new Set(operationsTasks.map((task) => task.taskId));
      const previousReceiptIds = new Set(memberReceipts.map((receipt) => receipt.executionId));
      const refreshed = await onRefreshMember();
      const newTasks = refreshed.operationsTasks.filter((task) => !previousTaskIds.has(task.taskId));
      const newReceipts = refreshed.operationsReceipts.filter((receipt) => !previousReceiptIds.has(receipt.executionId));
      setMutationHighlight({
        title: '支付活动已落账',
        summary:
          newTasks.length || newReceipts.length
            ? `本次录入已联动生成 ${newTasks.length} 条执行任务、${newReceipts.length} 条执行回执。`
            : '本次录入已刷新真实档案，当前暂无新增执行任务或回执。',
        taskTitles: newTasks.slice(0, 3).map((task) => task.title),
        receiptSummaries: newReceipts.slice(0, 3).map((receipt) => receipt.summary),
      });
      setPaymentForm({
        orderId: '',
        amount: '',
        paidAt: '',
        channel: '',
        source: 'cashier',
      });
      return result;
    },
    successMessage: '支付活动已录入，并刷新档案。',
  });

  const handleSave = useCallback(async () => {
    const result = await editSubmit.submit();
    if (result) {
      setEditOpen(false);
      editSubmit.reset();
    }
  }, [editSubmit]);

  const handleFieldChange = useCallback(
    (field: keyof EditFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const handleCancel = useCallback(() => {
    setEditOpen(false);
    setErrors({});
    editSubmit.reset();
    setFormData({
      name: member.name,
      phone: member.phone,
      email: member.email,
      address: member.address,
      notes: member.notes,
    });
  }, [editSubmit, member]);

  const handleStatusChange = useCallback(
    async (targetStatus: MemberApiProfile['status'], successMessage: string) => {
      setStatusActionState({ isSubmitting: true });
      try {
        if (apiReadOnly) {
          const result = await updateAdminMemberStatus(member.id, { status: targetStatus });
          if (!result) {
            throw new Error('会员状态更新失败，请稍后重试。');
          }
          if (isMemberMutationApprovalResult(result)) {
            setMutationHighlight(buildApprovalMutationHighlight(result));
            setStatusActionState({
              isSubmitting: false,
              successMessage: buildMutationSuccessMessage(result, successMessage),
            });
          } else {
            const refreshed = await onRefreshMember();
            if (refreshed.member?.apiStatus) {
              setLocalApiStatus(refreshed.member.apiStatus);
              setLocalStatus(toStatusFromApiStatus(refreshed.member.apiStatus));
            } else {
              setLocalApiStatus(targetStatus);
              setLocalStatus(toStatusFromApiStatus(targetStatus));
            }
            setMutationHighlight(null);
            setStatusActionState({ isSubmitting: false, successMessage });
          }
        } else {
          await simulateStatusChange();
          setLocalStatus(toStatusFromApiStatus(targetStatus));
          setMutationHighlight(null);
          setStatusActionState({ isSubmitting: false, successMessage });
        }
      } catch (error) {
        setStatusActionState({
          isSubmitting: false,
          errorMessage: error instanceof Error ? error.message : '会员状态更新失败，请稍后重试。'
        });
      }
    },
    [apiReadOnly, member.id, onRefreshMember]
  );

  const handleLevelChange = useCallback(
    async (targetLevel: MemberApiProfile['level'], successMessage: string) => {
      setTierActionState({ isSubmitting: true });
      try {
        if (apiReadOnly) {
          const result = await updateAdminMemberLevel(member.id, { level: targetLevel });
          if (!result) {
            throw new Error('会员等级调整失败，请稍后重试。');
          }
          if (isMemberMutationApprovalResult(result)) {
            setMutationHighlight(buildApprovalMutationHighlight(result));
            setTierActionState({
              isSubmitting: false,
              successMessage: buildMutationSuccessMessage(result, successMessage),
            });
          } else {
            const refreshed = await onRefreshMember();
            const refreshedLevel = refreshed.member?.apiLevel ?? targetLevel;
            setLocalApiLevel(refreshedLevel);
            setLocalTier(toTierFromApiLevel(refreshedLevel));
            setMutationHighlight(null);
            setTierActionState({ isSubmitting: false, successMessage });
          }
        } else {
          await simulateTierChange();
          setLocalTier(toTierFromApiLevel(targetLevel));
          setMutationHighlight(null);
          setTierActionState({ isSubmitting: false, successMessage });
        }
      } catch (error) {
        setTierActionState({
          isSubmitting: false,
          errorMessage: error instanceof Error ? error.message : '会员等级调整失败，请稍后重试。'
        });
      }
    },
    [apiReadOnly, member.id, onRefreshMember]
  );

  const handleFreeze = useCallback(
    async () => handleStatusChange('FROZEN', '会员状态已更新为已冻结。'),
    [handleStatusChange]
  );

  const handleActivate = useCallback(
    async () => handleStatusChange('ACTIVE', '会员状态已更新为活跃。'),
    [handleStatusChange]
  );

  const handleExpire = useCallback(
    async () => handleStatusChange('EXPIRED', '会员状态已更新为休眠。'),
    [handleStatusChange]
  );

  const handleBlacklist = useCallback(
    async () => handleStatusChange('BLACKLISTED', '会员状态已更新为已拉黑。'),
    [handleStatusChange]
  );

  const handleUpgrade = useCallback(async () => {
    const nextApiLevel = apiReadOnly
      ? getNextApiLevel(localApiLevel)
      : (tierUpgradeMap[localTier] ? memberTierToApiLevel(tierUpgradeMap[localTier]!) : null);
    if (nextApiLevel) {
      await handleLevelChange(nextApiLevel, `会员等级已调整为 ${levelLabel(nextApiLevel)}。`);
    }
  }, [apiReadOnly, handleLevelChange, localApiLevel, localTier]);

  const handleDowngrade = useCallback(async () => {
    const previousApiLevel = apiReadOnly
      ? getPreviousApiLevel(localApiLevel)
      : (tierDowngradeMap[localTier] ? memberTierToApiLevel(tierDowngradeMap[localTier]!) : null);
    if (previousApiLevel) {
      await handleLevelChange(previousApiLevel, `会员等级已调整为 ${levelLabel(previousApiLevel)}。`);
    }
  }, [apiReadOnly, handleLevelChange, localApiLevel, localTier]);

  const handleLoadRuntimeReceipt = useCallback(async (executionId: string) => {
    setRuntimeActionStates((prev) => ({
      ...prev,
      [executionId]: { phase: 'querying' },
    }));
    const runtimeReceipt = await loadMemberOperationsRuntimeReceipt(member.id, executionId);
    if (!runtimeReceipt) {
      setRuntimeActionStates((prev) => ({
        ...prev,
        [executionId]: { error: '治理轨迹读取失败，请稍后重试。' },
      }));
      return;
    }
    setRuntimeReceipts((prev) => ({
      ...prev,
      [executionId]: runtimeReceipt,
    }));
    const approvalSummary = getMemberOperationsRuntimeApprovalSummary(runtimeReceipt);
    setRuntimeActionStates((prev) => ({
      ...prev,
      [executionId]: {
        success: approvalSummary
          ? `已同步治理轨迹，审批状态 ${approvalSummary.status}${approvalSummary.ticket ? ` / ${approvalSummary.ticket}` : ''}`
          : `已同步治理轨迹，当前状态 ${runtimeReceipt.state}`,
      },
    }));
  }, [member.id]);

  const handleReplayRuntimeReceipt = useCallback(async (executionId: string) => {
    setRuntimeActionStates((prev) => ({
      ...prev,
      [executionId]: { phase: 'replaying' },
    }));
    const runtimeReceipt = await replayMemberOperationsRuntimeReceipt(member.id, executionId);
    if (!runtimeReceipt) {
      setRuntimeActionStates((prev) => ({
        ...prev,
        [executionId]: { error: 'runtime replay 触发失败，请稍后重试。' },
      }));
      return;
    }
    setRuntimeReceipts((prev) => ({
      ...prev,
      [executionId]: runtimeReceipt,
    }));
    const approvalSummary = getMemberOperationsRuntimeApprovalSummary(runtimeReceipt);
    setRuntimeActionStates((prev) => ({
      ...prev,
      [executionId]: {
        success:
          approvalSummary?.status === 'PENDING'
            ? `已转入审批 ${approvalSummary.ticket ?? ''}`.trim()
            : `已触发 runtime replay，当前状态 ${runtimeReceipt.state}`,
      },
    }));
  }, [member.id]);

  const currentStatusInfo = MEMBER_STATUS_MAP[localStatus];
  const currentTierInfo = MEMBER_TIER_MAP[localTier];

  const { actions: detailActions } = useDetailActions({
    workspace: 'members',
    detailId: member.id,
    record: member,
    shareTitle: `会员 · ${member.name ?? member.id}`,
    shareText: `查看会员 ${member.id} (${member.name ?? member.id}) 详情`
  });

  const actions: DetailShellAction[] = [
    {
      key: 'edit',
      label: editOpen ? '保存中...' : '编辑',
      variant: 'primary',
      loading: editSubmit.state.isSubmitting,
      disabled: editSubmit.state.isSubmitting,
      onClick: editOpen ? handleSave : () => setEditOpen(true),
    },
  ];

  if (editOpen) {
    actions.push({
      key: 'cancel-edit',
      label: '取消编辑',
      variant: 'secondary',
      onClick: handleCancel,
    });
  }

  actions.push({
    key: 'view-audit',
    label: '查看审计',
    variant: 'secondary',
    href: buildMemberAuditTrailHref({
      resourceType: 'Member',
      resourceId: member.id
    })
  });

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'members', detailLabel: member.name })}
      />
      <DetailShell
        title={member.name}
        subtitle={`${member.code} · ${member.marketCode} · ${apiReadOnly ? '真实 API 档案' : 'fallback 档案'}`}
      breadcrumbs={[
        { label: '会员管理', href: '/members' },
        { label: member.name },
      ]}
      backLink={{ label: '返回会员列表', href: '/members' }}
      actions={actions}
    >
      {apiReadOnly ? (
        <section
          style={{
            borderRadius: 16,
            padding: 16,
            background: 'rgba(30, 41, 59, 0.42)',
            border: '1px solid rgba(96, 165, 250, 0.2)',
            marginBottom: 24,
            color: '#dbeafe',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {getApiReadOnlyMessage(member)}
        </section>
      ) : null}

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        <StatCard label="会员等级" value={currentTierInfo.label} helper={member.marketCode} />
        <StatCard label="账户状态" value={currentStatusInfo.label} helper={member.lastVisitAt} />
        <StatCard label="生命周期" value={lifecycleInfo.label} helper={member.registeredAt} />
        <StatCard label="累计消费" value={formatCurrency(member.totalSpent)} helper={`${member.visitCount} 次到店`} />
      </div>

      {apiReadOnly ? (
        <section
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>会员运营动作</h2>
          {mutationHighlight ? (
            <div style={mutationHighlightStyle}>
              <div style={mutationHighlightTitleStyle}>{mutationHighlight.title}</div>
              <div style={mutationHighlightSummaryStyle}>{mutationHighlight.summary}</div>
              {mutationHighlight.taskTitles.length > 0 ? (
                <div style={mutationHighlightMetaStyle}>新增任务：{mutationHighlight.taskTitles.join(' / ')}</div>
              ) : null}
              {mutationHighlight.receiptSummaries.length > 0 ? (
                <div style={mutationHighlightMetaStyle}>新增回执：{mutationHighlight.receiptSummaries.join(' / ')}</div>
              ) : null}
              {mutationHighlight.actionHref && mutationHighlight.actionLabel ? (
                <div style={{ marginTop: 10 }}>
                  <a
                    href={mutationHighlight.actionHref}
                    style={{ color: '#bfdbfe', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}
                  >
                    {mutationHighlight.actionLabel}
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <div style={operationCardStyle}>
              <div style={operationCardTitleStyle}>增加积分</div>
              <div style={operationCardHintStyle}>适合补录成长值、人工奖励或售后补偿。</div>
              {(awardPointsSubmit.state.isSubmitting || awardPointsSubmit.state.errorMessage || awardPointsSubmit.state.successMessage) ? (
                <div style={{ marginBottom: 12 }}>
                  <FormSubmitFeedback state={awardPointsSubmit.state} />
                </div>
              ) : null}
              <FormField label="加分值" required>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={awardPointsValue}
                  onChange={(event) => setAwardPointsValue(event.target.value)}
                  disabled={awardPointsSubmit.state.isSubmitting}
                  style={inputStyle}
                  placeholder="例如 200"
                />
              </FormField>
              <div style={{ marginTop: 12 }}>
                <SubmitButton
                  loading={awardPointsSubmit.state.isSubmitting}
                  disabled={awardPointsSubmit.state.isSubmitting}
                  onClick={() => void awardPointsSubmit.submit()}
                  variant="primary"
                >
                  提交加分
                </SubmitButton>
              </div>
            </div>

            <div style={operationCardStyle}>
              <div style={operationCardTitleStyle}>扣减积分</div>
              <div style={operationCardHintStyle}>适合退款回滚、异常冲正或人工治理扣分。</div>
              {(rollbackPointsSubmit.state.isSubmitting || rollbackPointsSubmit.state.errorMessage || rollbackPointsSubmit.state.successMessage) ? (
                <div style={{ marginBottom: 12 }}>
                  <FormSubmitFeedback state={rollbackPointsSubmit.state} />
                </div>
              ) : null}
              <FormField label="扣减值" required>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={rollbackPointsValue}
                  onChange={(event) => setRollbackPointsValue(event.target.value)}
                  disabled={rollbackPointsSubmit.state.isSubmitting}
                  style={inputStyle}
                  placeholder="例如 100"
                />
              </FormField>
              <div style={{ marginTop: 12 }}>
                <SubmitButton
                  loading={rollbackPointsSubmit.state.isSubmitting}
                  disabled={rollbackPointsSubmit.state.isSubmitting}
                  onClick={() => void rollbackPointsSubmit.submit()}
                  variant="secondary"
                >
                  提交扣减
                </SubmitButton>
              </div>
            </div>

            <div style={operationCardStyle}>
              <div style={operationCardTitleStyle}>录入支付活动</div>
              <div style={operationCardHintStyle}>录入后会刷新最近支付信息，并驱动后续运营编排读面。</div>
              {(paymentActivitySubmit.state.isSubmitting || paymentActivitySubmit.state.errorMessage || paymentActivitySubmit.state.successMessage) ? (
                <div style={{ marginBottom: 12 }}>
                  <FormSubmitFeedback state={paymentActivitySubmit.state} />
                </div>
              ) : null}
              <div style={{ display: 'grid', gap: 12 }}>
                <FormField label="订单号" required>
                  <input
                    type="text"
                    value={paymentForm.orderId}
                    onChange={(event) =>
                      setPaymentForm((prev) => ({ ...prev, orderId: event.target.value }))
                    }
                    disabled={paymentActivitySubmit.state.isSubmitting}
                    style={inputStyle}
                    placeholder="例如 order-20260618-001"
                  />
                </FormField>
                <FormField label="支付金额" required>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={paymentForm.amount}
                    onChange={(event) =>
                      setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))
                    }
                    disabled={paymentActivitySubmit.state.isSubmitting}
                    style={inputStyle}
                    placeholder="例如 88"
                  />
                </FormField>
                <FormField label="支付时间" helper="选填，不填则使用当前时间">
                  <input
                    type="datetime-local"
                    value={paymentForm.paidAt}
                    onChange={(event) =>
                      setPaymentForm((prev) => ({ ...prev, paidAt: event.target.value }))
                    }
                    disabled={paymentActivitySubmit.state.isSubmitting}
                    style={inputStyle}
                  />
                </FormField>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                  <FormField label="支付渠道" helper="选填">
                    <input
                      type="text"
                      value={paymentForm.channel}
                      onChange={(event) =>
                        setPaymentForm((prev) => ({ ...prev, channel: event.target.value }))
                      }
                      disabled={paymentActivitySubmit.state.isSubmitting}
                      style={inputStyle}
                      placeholder="例如 wechat-pay"
                    />
                  </FormField>
                  <FormField label="来源">
                    <select
                      value={paymentForm.source}
                      onChange={(event) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          source: event.target.value as PaymentActivityFormData['source'],
                        }))
                      }
                      disabled={paymentActivitySubmit.state.isSubmitting}
                      style={inputStyle}
                    >
                      <option value="cashier">cashier</option>
                      <option value="lyt-snapshot">lyt-snapshot</option>
                    </select>
                  </FormField>
                </div>
                <div>
                  <SubmitButton
                    loading={paymentActivitySubmit.state.isSubmitting}
                    disabled={paymentActivitySubmit.state.isSubmitting}
                    onClick={() => void paymentActivitySubmit.submit()}
                    variant="primary"
                  >
                    录入支付
                  </SubmitButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 状态流转 & 等级变更 */}
      <div
        style={{
          borderRadius: 16,
          padding: 20,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          marginBottom: 24,
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        {/* 状态流转 */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 12px' }}>状态流转</h3>
          {apiReadOnly ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <StatusBadge
                label={currentStatusInfo.label}
                variant={currentStatusInfo.variant}
                size="sm"
                dot
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {localApiStatus !== 'FROZEN' ? (
                  <button
                    type="button"
                    onClick={() => void handleFreeze()}
                    disabled={statusActionState.isSubmitting || localApiStatus === 'BLACKLISTED'}
                    style={actionBtnStyle('warning')}
                  >
                    {statusActionState.isSubmitting ? '处理中...' : '冻结'}
                  </button>
                ) : null}
                {localApiStatus !== 'ACTIVE' ? (
                  <button
                    type="button"
                    onClick={() => void handleActivate()}
                    disabled={statusActionState.isSubmitting}
                    style={actionBtnStyle('primary')}
                  >
                    激活
                  </button>
                ) : null}
                {localApiStatus !== 'EXPIRED' && localApiStatus !== 'BLACKLISTED' ? (
                  <button
                    type="button"
                    onClick={() => void handleExpire()}
                    disabled={statusActionState.isSubmitting}
                    style={actionBtnStyle('warning')}
                  >
                    设为休眠
                  </button>
                ) : null}
                {localApiStatus !== 'BLACKLISTED' ? (
                  <button
                    type="button"
                    onClick={() => void handleBlacklist()}
                    disabled={statusActionState.isSubmitting}
                    style={actionBtnStyle('danger')}
                  >
                    拉黑
                  </button>
                ) : null}
              </div>
              {statusActionState.errorMessage || statusActionState.successMessage || statusActionState.isSubmitting ? (
                <FormSubmitFeedback state={statusActionState} />
              ) : null}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge
                  label={currentStatusInfo.label}
                  variant={currentStatusInfo.variant}
                  size="sm"
                  dot
                />
                <span style={{ color: '#64748b' }}>→</span>
                {localStatus !== 'frozen' && (
                  <button
                    type="button"
                    onClick={handleFreeze}
                    disabled={statusActionState.isSubmitting || localStatus === 'cancelled'}
                    style={actionBtnStyle('warning')}
                  >
                    {statusActionState.isSubmitting ? '处理中...' : '冻结'}
                  </button>
                )}
                {localStatus !== 'active' && localStatus !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={statusActionState.isSubmitting}
                    style={actionBtnStyle('primary')}
                  >
                    激活
                  </button>
                )}
                {localStatus !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={handleBlacklist}
                    disabled={statusActionState.isSubmitting}
                    style={actionBtnStyle('danger')}
                  >
                    注销
                  </button>
                )}
              </div>
              {statusActionState.errorMessage && (
                <FormSubmitFeedback state={statusActionState} />
              )}
              {statusActionState.successMessage && (
                <FormSubmitFeedback state={statusActionState} />
              )}
            </>
          )}
        </div>

        {/* 等级变更 */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '0 0 12px' }}>等级变更</h3>
          {apiReadOnly ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <StatusBadge
                label={currentTierInfo.label}
                variant={currentTierInfo.variant}
                size="sm"
                dot
              />
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>
                当前真实等级：{levelLabel(localApiLevel ?? upgradeCheck?.currentLevel ?? null)}
              </div>
              {upgradeCheck ? (
                <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
                  <div>当前等级：{levelLabel(upgradeCheck.currentLevel)}</div>
                  <div>
                    升级判断：
                    {upgradeCheck.canUpgrade
                      ? `可升级到 ${levelLabel(upgradeCheck.nextLevel)}`
                      : '当前积分暂不满足升级条件'}
                  </div>
                  {!upgradeCheck.canUpgrade && upgradeCheck.nextLevel ? (
                    <div>
                      距离 {levelLabel(upgradeCheck.nextLevel)} 还差 {upgradeCheck.pointsNeeded} 分
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {getNextApiLevel(localApiLevel) ? (
                  <button
                    type="button"
                    onClick={() => void handleUpgrade()}
                    disabled={tierActionState.isSubmitting}
                    style={actionBtnStyle('primary')}
                  >
                    升级到 {levelLabel(getNextApiLevel(localApiLevel))}
                  </button>
                ) : null}
                {getPreviousApiLevel(localApiLevel) ? (
                  <button
                    type="button"
                    onClick={() => void handleDowngrade()}
                    disabled={tierActionState.isSubmitting}
                    style={actionBtnStyle('warning')}
                  >
                    降级到 {levelLabel(getPreviousApiLevel(localApiLevel))}
                  </button>
                ) : null}
              </div>
              {tierActionState.errorMessage || tierActionState.successMessage || tierActionState.isSubmitting ? (
                <FormSubmitFeedback state={tierActionState} />
              ) : null}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge
                  label={currentTierInfo.label}
                  variant={currentTierInfo.variant}
                  size="sm"
                  dot
                />
                <span style={{ color: '#64748b' }}>→</span>
                {tierUpgradeMap[localTier] && (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={tierActionState.isSubmitting}
                    style={actionBtnStyle('primary')}
                  >
                    升级到 {MEMBER_TIER_MAP[tierUpgradeMap[localTier]!].label}
                  </button>
                )}
                {tierDowngradeMap[localTier] && (
                  <button
                    type="button"
                    onClick={handleDowngrade}
                    disabled={tierActionState.isSubmitting}
                    style={actionBtnStyle('warning')}
                  >
                    降级到 {MEMBER_TIER_MAP[tierDowngradeMap[localTier]!].label}
                  </button>
                )}
                {!tierUpgradeMap[localTier] && !tierDowngradeMap[localTier] && (
                  <span style={{ color: '#64748b', fontSize: 13 }}>已是最高等级</span>
                )}
              </div>
              {tierActionState.errorMessage && (
                <FormSubmitFeedback state={tierActionState} />
              )}
              {tierActionState.successMessage && (
                <FormSubmitFeedback state={tierActionState} />
              )}
            </>
          )}
        </div>
      </div>

      {/* 编辑表单 */}
      {editOpen ? (
        <section
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>编辑会员信息</h2>
          {apiReadOnly ? (
            <div style={{ marginBottom: 16, fontSize: 13, color: '#93c5fd', lineHeight: 1.6 }}>
              当前真实档案已支持编辑昵称、手机号、邮箱、地址和内部备注，保存后会直接回写持久化会员资料。
            </div>
          ) : null}
          {editSubmit.state.isSubmitting || editSubmit.state.errorMessage || editSubmit.state.successMessage ? (
            <div style={{ marginBottom: 16 }}>
              <FormSubmitFeedback state={editSubmit.state} />
            </div>
          ) : null}
          <div style={{ display: 'grid', gap: 16 }}>
            <FormField label="姓名" required error={errors.name}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                disabled={editSubmit.state.isSubmitting}
                style={inputStyle}
                placeholder="输入会员姓名"
              />
            </FormField>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
              <FormField label="电话" required error={errors.phone}>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  disabled={editSubmit.state.isSubmitting}
                  style={inputStyle}
                  placeholder="输入电话号码"
                />
              </FormField>
              <FormField label="邮箱" error={errors.email} helper="选填">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  disabled={editSubmit.state.isSubmitting}
                  style={inputStyle}
                  placeholder="输入邮箱地址"
                />
              </FormField>
            </div>
            <FormField label="地址" helper="选填">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                disabled={editSubmit.state.isSubmitting}
                style={inputStyle}
                placeholder="输入地址"
              />
            </FormField>
            <FormField label="备注" helper="内部管理备注">
              <textarea
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                disabled={editSubmit.state.isSubmitting}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="输入会员备注"
              />
            </FormField>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <SubmitButton
                loading={editSubmit.state.isSubmitting}
                disabled={editSubmit.state.isSubmitting}
                onClick={handleSave}
                variant="primary"
              >
                保存修改
              </SubmitButton>
              <SubmitButton
                disabled={editSubmit.state.isSubmitting}
                onClick={handleCancel}
                variant="secondary"
              >
                取消
              </SubmitButton>
            </div>
          </div>
        </section>
      ) : null}

      {(overviewTimeline.length > 0 || memberMutationHistory.length > 0) ? (
        <div
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>最近操作与审批时间线</h2>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
            已把资料变更、执行回执、runtime 治理和审批决策合并为同一条会员总览时间线。
          </div>
          {overviewTimeline.length > 0 ? (
            <div style={{ display: 'grid', gap: 14 }}>
              {overviewTimeline.slice(0, 10).map((item, index) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '24px minmax(0, 1fr)', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        background: overviewTimelineTone(item.category).dot,
                        boxShadow: `0 0 0 4px ${overviewTimelineTone(item.category).ring}`,
                        marginTop: 6,
                      }}
                    />
                    {index < Math.min(overviewTimeline.length, 10) - 1 ? (
                      <div style={{ width: 2, flex: 1, marginTop: 8, background: 'rgba(71, 85, 105, 0.7)' }} />
                    ) : null}
                  </div>
                  <div
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background: 'rgba(30, 41, 59, 0.45)',
                      border: `1px solid ${overviewTimelineTone(item.category).border}`,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                      <span style={pillStyle(overviewTimelineTone(item.category).label, overviewTimelineTone(item.category).badge)}>
                        {overviewTimelineCategoryLabel(item.category)}
                      </span>
                      <span style={pillStyle('#cbd5e1', 'rgba(148,163,184,0.16)')}>{overviewTimelineStageLabel(item.stage)}</span>
                      {item.status ? (
                        <span style={pillStyle(overviewTimelineStatusTone(item).color, overviewTimelineStatusTone(item).background)}>
                          {item.status}
                        </span>
                      ) : null}
                      {item.actionCode ? <span style={{ color: '#cbd5e1', fontSize: 12 }}>{item.actionCode}</span> : null}
                      {item.decisionBy ? <span style={{ color: '#cbd5e1', fontSize: 12 }}>处理人 {item.decisionBy}</span> : null}
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>{item.occurredAt}</span>
                    </div>
                    <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>{item.title}</div>
                    <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>{item.summary}</div>
                    {item.decisionAt ? (
                      <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>决策时间：{item.decisionAt}</div>
                    ) : null}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10, fontSize: 12 }}>
                      {item.executionId ? (
                        <a
                          href={buildMemberOperationsReceiptDetailHref(member.id, item.executionId)}
                          style={{ color: '#bfdbfe', textDecoration: 'none' }}
                        >
                          执行回执
                        </a>
                      ) : null}
                      {item.runtimeReceiptCode ? (
                        <a
                          href={buildMemberOperationsRuntimeDetailHref(item.runtimeReceiptCode)}
                          style={{ color: '#86efac', textDecoration: 'none' }}
                        >
                          Runtime 详情
                        </a>
                      ) : null}
                      {item.approvalTicket ? (
                        <a
                          href={buildGovernanceApprovalDetailHref(item.approvalTicket)}
                          style={{ color: '#fde68a', textDecoration: 'none' }}
                        >
                          审批详情
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {memberMutationHistory.slice(0, 6).map((entry) => (
                <div
                  key={entry.historyId}
                  style={{
                    borderRadius: 12,
                    padding: 14,
                    background: 'rgba(30, 41, 59, 0.45)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{entry.summary}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{entry.createdAt}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#93c5fd' }}>
                    {entry.action} · {entry.sourceChannel} · {entry.operatorId}
                  </div>
                  {entry.approvalSummary ? (
                    <div style={{ fontSize: 12, color: '#fde68a', marginTop: 8, lineHeight: 1.7 }}>
                      {entry.approvalSummary}
                    </div>
                  ) : null}
                  {entry.approvalTicket ? (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={buildGovernanceApprovalDetailHref(entry.approvalTicket)}
                        style={{ color: '#fde68a', textDecoration: 'none', fontSize: 12 }}
                      >
                        查看审批单 {entry.approvalTicket}
                      </a>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* 基本信息卡片 */}
      <div
        style={{
          borderRadius: 16,
          padding: 24,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>基本信息</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <InfoRow label="会员编号" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{member.code}<CopyToClipboard text={member.code} size="sm" iconOnly /></span>} />
          <InfoRow label="姓名" value={member.name} />
          <InfoRow label="电话" value={member.phone} />
          <InfoRow label="邮箱" value={member.email || '—'} />
          <InfoRow label="性别" value={member.gender === 'male' ? '男' : member.gender === 'female' ? '女' : '其他'} />
          <InfoRow label="生日" value={member.birthday} />
          <InfoRow label="微信" value={member.wechatId || '—'} />
          <InfoRow label="地址" value={member.address || '—'} />
          <InfoRow
            label="会员等级"
            value={<StatusBadge label={currentTierInfo.label} variant={currentTierInfo.variant} size="sm" dot />}
          />
          <InfoRow
            label="账户状态"
            value={<StatusBadge label={currentStatusInfo.label} variant={currentStatusInfo.variant} size="sm" />}
          />
          <InfoRow
            label="生命周期"
            value={
              <span style={{ color: lifecycleColor(member.lifecycleStage), fontWeight: 600 }}>
                {lifecycleInfo.label}
              </span>
            }
          />
          <InfoRow label="所属门店" value={member.storeName} />
          <InfoRow label="所属市场" value={member.marketCode} />
          <InfoRow label="邀请码" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{member.referralCode}<CopyToClipboard text={member.referralCode} size="sm" iconOnly /></span>} />
          <InfoRow label="推荐人" value={member.referredBy ?? '—'} />
        </div>
      </div>

      {/* 消费数据卡片 */}
      <div
        style={{
          borderRadius: 16,
          padding: 24,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>消费数据</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <InfoRow label="总消费" value={<span style={{ fontWeight: 600, color: '#fbbf24' }}>{formatCurrency(member.totalSpent)}</span>} />
          <InfoRow label="当前积分" value={<span style={{ fontWeight: 600, color: '#818cf8' }}>{member.points.toLocaleString()}</span>} />
          <InfoRow label="到店次数" value={`${member.visitCount} 次`} />
          <InfoRow label="客单价" value={`¥${member.avgOrderValue.toLocaleString()}`} />
          <InfoRow label="优惠券" value={`${member.coupons} 张`} />
          <InfoRow label="最近到店" value={member.lastVisitAt} />
          <InfoRow label="最近下单" value={member.lastOrderAt} />
          <InfoRow label="最近支付时间" value={member.lastPaymentAt ?? '—'} />
          <InfoRow
            label="最近支付金额"
            value={typeof member.lastPaymentAmount === 'number' ? `¥${member.lastPaymentAmount}` : '—'}
          />
          <InfoRow label="最近支付渠道" value={member.lastPaymentChannel ?? '—'} />
          <InfoRow label="注册日期" value={member.registeredAt} />
        </div>
      </div>

      {(operationsSegments.length > 0 || recommendedActions.length > 0 || automationTriggers.length > 0) && (
        <div
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>运营编排</h2>
          {operationsProfile ? (
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
              已根据真实支付与会员档案生成运营建议，可直接作为后续 campaign/CRM 动作输入。
            </div>
          ) : null}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>分群标签</div>
            {operationsSegments.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {operationsSegments.map((segment) => (
                  <span
                    key={segment}
                    style={{
                      fontSize: 13,
                      padding: '4px 14px',
                      borderRadius: 999,
                      background: 'rgba(129, 140, 248, 0.12)',
                      color: '#a5b4fc',
                    }}
                  >
                    {segment}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ color: '#64748b', fontSize: 13 }}>暂无分群结果</span>
            )}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>推荐动作</div>
            {recommendedActions.length > 0 ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {recommendedActions.map((action) => (
                  <div
                    key={action.code}
                    style={{
                      borderRadius: 12,
                      padding: 12,
                      background: 'rgba(30, 41, 59, 0.45)',
                      border: '1px solid rgba(148, 163, 184, 0.14)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{action.label}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{action.channel}</span>
                      <span style={{ fontSize: 12, color: '#fbbf24' }}>{action.priority}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{action.reason}</div>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ color: '#64748b', fontSize: 13 }}>暂无推荐动作</span>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>自动触发器</div>
            {automationTriggers.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {automationTriggers.map((trigger) => (
                  <span
                    key={trigger}
                    style={{
                      fontSize: 13,
                      padding: '4px 14px',
                      borderRadius: 999,
                      background: 'rgba(74, 222, 128, 0.12)',
                      color: '#86efac',
                    }}
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ color: '#64748b', fontSize: 13 }}>暂无自动触发器</span>
            )}
          </div>
        </div>
      )}

      {operationsTasks.length > 0 && (
        <div
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>执行队列</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {operationsTasks.map((task) => (
              <div
                key={task.taskId}
                style={{
                  borderRadius: 12,
                  padding: 12,
                  background: 'rgba(30, 41, 59, 0.45)',
                  border: '1px solid rgba(148, 163, 184, 0.14)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <a
                    href={buildMemberOperationsTaskDetailHref(member.id, task.taskId)}
                    style={{ fontWeight: 600, color: '#bfdbfe', textDecoration: 'none' }}
                  >
                    {task.title}
                  </a>
                  <span style={{ fontSize: 12, color: taskPriorityColor(task.priority) }}>{task.priority}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{task.executionLane}</span>
                  <span style={{ fontSize: 12, color: taskStatusColor(task.status) }}>{task.status}</span>
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{task.reason}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  来源单号 {task.sourceOrderId ?? '—'} · 渠道 {task.channel} · 创建于 {task.createdAt}
                </div>
                {task.executionSummary ? (
                  <div style={{ fontSize: 12, color: '#86efac', marginTop: 6 }}>
                    {task.executionSummary}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {memberReceipts.length > 0 && (
        <div
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>执行回执</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {memberReceipts.map((receipt) => (
              (() => {
                const runtimeReceipt = runtimeReceipts[receipt.executionId] ?? null;
                const runtimeActionState = runtimeActionStates[receipt.executionId];
                const runtimeState = runtimeReceipt?.state ?? receipt.runtimeState;
                const runtimeReplayable =
                  runtimeReceipt?.ledger.replayable ?? receipt.runtimeReplayable;
                const runtimeApprovalSummary = runtimeReceipt
                  ? getMemberOperationsRuntimeApprovalSummary(runtimeReceipt)
                  : null;
                const busy = Boolean(runtimeActionState?.phase);

                return (
                  <div
                    key={receipt.executionId}
                    style={{
                      borderRadius: 12,
                      padding: 12,
                      background: 'rgba(30, 41, 59, 0.45)',
                      border: '1px solid rgba(148, 163, 184, 0.14)',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{receipt.targetType}</span>
                      <span style={{ fontSize: 12, color: '#86efac' }}>{receipt.status}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{receipt.targetId}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{receipt.summary}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      动作 {receipt.actionCode} · 执行于 {receipt.executedAt}
                    </div>
                    <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 6 }}>
                      <a
                        href={buildMemberOperationsReceiptDetailHref(member.id, receipt.executionId)}
                        style={{ color: '#bfdbfe', textDecoration: 'none' }}
                      >
                        查看执行回执详情
                      </a>
                    </div>
                    {receipt.runtimeReceiptCode ? (
                      <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 6 }}>
                        Runtime {receipt.runtimeReceiptCode}
                        {runtimeState ? ` · ${runtimeState}` : ''}
                        {typeof runtimeReplayable === 'boolean'
                          ? ` · replayable=${runtimeReplayable ? 'yes' : 'no'}`
                          : ''}
                        {' · '}
                        <a
                          href={buildMemberOperationsRuntimeDetailHref(receipt.runtimeReceiptCode)}
                          style={{ color: '#bfdbfe', textDecoration: 'none' }}
                        >
                          查看统一治理详情
                        </a>
                      </div>
                    ) : null}
                    {receipt.runtimeReceiptCode ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => void handleLoadRuntimeReceipt(receipt.executionId)}
                          disabled={busy}
                          style={actionBtnStyle('primary')}
                        >
                          {runtimeActionState?.phase === 'querying' ? '读取中...' : '查看治理轨迹'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleReplayRuntimeReceipt(receipt.executionId)}
                          disabled={busy || runtimeReplayable === false}
                          style={actionBtnStyle('warning')}
                        >
                          {runtimeActionState?.phase === 'replaying' ? '重放中...' : '触发 Replay'}
                        </button>
                      </div>
                    ) : null}
                    {runtimeActionState?.error ? (
                      <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 8 }}>
                        {runtimeActionState.error}
                      </div>
                    ) : null}
                    {runtimeActionState?.success ? (
                      <div style={{ fontSize: 12, color: '#86efac', marginTop: 8 }}>
                        {runtimeActionState.success}
                      </div>
                    ) : null}
                    {runtimeReceipt ? (
                      <div
                        style={{
                          marginTop: 10,
                          borderRadius: 10,
                          padding: 10,
                          background: 'rgba(15, 23, 42, 0.42)',
                          border: '1px solid rgba(96, 165, 250, 0.14)',
                          display: 'grid',
                          gap: 6,
                        }}
                      >
                        <div style={{ fontSize: 12, color: '#dbeafe', fontWeight: 600 }}>
                          实时治理轨迹
                        </div>
                        <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                          状态 <span style={{ color: runtimeStateColor(runtimeReceipt.state) }}>{runtimeReceipt.state}</span>
                          {' · '}Callback {runtimeReceipt.callback.callbackStatus}
                          {' · '}Ticket {runtimeReceipt.ticket.ticketCode}
                        </div>
                        {runtimeApprovalSummary ? (
                          <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                            审批{' '}
                            <span style={{ color: runtimeApprovalColor(runtimeApprovalSummary.status) }}>
                              {runtimeApprovalSummary.status}
                            </span>
                            {runtimeApprovalSummary.ticket ? ` · ${runtimeApprovalSummary.ticket}` : ''}
                            {runtimeApprovalSummary.executionStatus
                              ? ` · execution ${runtimeApprovalSummary.executionStatus}`
                              : ''}
                            {runtimeApprovalSummary.lastFailureReason
                              ? ` · failure ${runtimeApprovalSummary.lastFailureReason}`
                              : ''}
                            {runtimeApprovalSummary.ticket ? ' · ' : ''}
                            {runtimeApprovalSummary.ticket ? (
                              <a
                                href={buildGovernanceApprovalDetailHref(runtimeApprovalSummary.ticket)}
                                style={{ color: '#bfdbfe', textDecoration: 'none' }}
                              >
                                查看审批详情
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          Ledger {truncateMiddle(runtimeReceipt.ledger.ledgerKey)}
                          {' · '}最新事件 {latestRuntimeEvent(runtimeReceipt)}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          Retry {runtimeReceipt.retry.currentAttempt}/{runtimeReceipt.retry.maxAttempts}
                          {' · '}Backoff {formatBackoff(runtimeReceipt.retry.nextBackoffMs)}
                          {' · '}Generated {runtimeReceipt.generatedAt}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          Endpoint {runtimeReceipt.requestEndpoint}
                        </div>
                        <div style={{ fontSize: 12, color: '#93c5fd' }}>
                          <a
                            href={buildMemberOperationsRuntimeDetailHref(runtimeReceipt.receiptCode)}
                            style={{ color: '#bfdbfe', textDecoration: 'none' }}
                          >
                            跳转统一治理详情
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })()
            ))}
          </div>
        </div>
      )}

      {/* 偏好 & 标签 */}
      <div
        style={{
          borderRadius: 16,
          padding: 24,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>偏好 & 标签</h2>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>偏好品类</div>
          {member.favoriteCategories.length > 0 ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {member.favoriteCategories.map((cat) => (
                <span
                  key={cat}
                  style={{
                    fontSize: 13,
                    padding: '4px 14px',
                    borderRadius: 999,
                    background: 'rgba(147, 197, 253, 0.12)',
                    color: '#93c5fd',
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ color: '#64748b', fontSize: 13 }}>暂无偏好数据</span>
          )}
        </div>
        <div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>标签</div>
          {member.tags.length > 0 ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {member.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 13,
                    padding: '4px 14px',
                    borderRadius: 999,
                    background: 'rgba(251, 191, 36, 0.12)',
                    color: '#fbbf24',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ color: '#64748b', fontSize: 13 }}>暂无标签</span>
          )}
        </div>
      </div>

      {/* 备注 */}
      {member.notes && (
        <div
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700 }}>内部备注</h2>
          <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7 }}>
            {member.notes}
          </div>
        </div>
      )}

      <DetailActionBar
        actions={detailActions}
        heading="详情收口动作"
        caption="复制 / 导出 / 分享当前会员详情"
      />
    </DetailShell>
    <DetailClosureBar
      links={buildStandardClosureLinks({ workspace: 'members', detailId: member.id })}
    />
    </div>
  );
}

// ---- 通用样式 ----

function pillStyle(color: string, background: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color,
    background,
  };
}

// ---- 按钮样式 ----

function actionBtnStyle(variant: 'primary' | 'warning' | 'danger'): CSSProperties {
  const base: CSSProperties = {
    fontSize: 13,
    padding: '6px 16px',
    borderRadius: 8,
    border: '1px solid transparent',
    cursor: 'pointer',
    fontWeight: 500,
  };
  if (variant === 'primary') return { ...base, background: 'rgba(59,130,246,0.16)', borderColor: 'rgba(96,165,250,0.3)', color: '#dbeafe' };
  if (variant === 'warning') return { ...base, background: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.3)', color: '#fde68a' };
  return { ...base, background: 'rgba(239,68,68,0.14)', borderColor: 'rgba(239,68,68,0.25)', color: '#fecaca' };
}

const operationCardStyle: CSSProperties = {
  borderRadius: 12,
  padding: 16,
  background: 'rgba(30, 41, 59, 0.45)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  display: 'grid',
  gap: 12,
  alignContent: 'start',
};

const operationCardTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: '#e2e8f0',
};

const operationCardHintStyle: CSSProperties = {
  fontSize: 13,
  color: '#94a3b8',
  lineHeight: 1.6,
};

const mutationHighlightStyle: CSSProperties = {
  marginBottom: 16,
  borderRadius: 12,
  padding: 14,
  background: 'rgba(37, 99, 235, 0.12)',
  border: '1px solid rgba(96, 165, 250, 0.22)',
  display: 'grid',
  gap: 6,
};

const mutationHighlightTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#dbeafe',
};

const mutationHighlightSummaryStyle: CSSProperties = {
  fontSize: 13,
  color: '#cbd5e1',
  lineHeight: 1.6,
};

const mutationHighlightMetaStyle: CSSProperties = {
  fontSize: 12,
  color: '#93c5fd',
  lineHeight: 1.6,
};

// ---- 输入框样式 ----

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '10px 14px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.4)',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
