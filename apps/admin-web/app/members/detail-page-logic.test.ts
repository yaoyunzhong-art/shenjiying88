/**
 * detail-page-logic.test.ts — 会员详情页逻辑层纯函数补全测试
 *
 * 覆盖 members/[id]/page.tsx 中之前未独立测试的纯函数：
 *   1. approvalStatusLabel / approvalOperationLabel
 *   2. parseMemberApprovalReview
 *   3. buildApprovalReviewHighlight
 *   4. buildLatestApprovalOutcomeHighlight
 *   5. overviewTimelineCategoryLabel / overviewTimelineStageLabel
 *   6. runtimeStateColor / taskPriorityColor / taskStatusColor / runtimeApprovalColor
 *   7. latestRuntimeEvent / getApiReadOnlyMessage
 *
 * Pattern: L1 正例 + 反例 + 边界
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ===================================================================
// 被测试的纯函数（从 page.tsx 提取，保持签名一致）
// ===================================================================

type ApprovalStatusForLabel = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED';

function approvalStatusLabel(status: ApprovalStatusForLabel): string {
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
): {
  ticket: string;
  status: ApprovalStatusForLabel;
  operation?: string;
  decidedAt?: string;
  updatedAt?: string;
  autoRefresh: boolean;
} | null {
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

interface MemberApprovalReviewContext {
  ticket: string;
  status: ApprovalStatusForLabel;
  operation?: string;
  decidedAt?: string;
  updatedAt?: string;
  autoRefresh: boolean;
}

function buildApprovalReviewHighlight(
  review: MemberApprovalReviewContext,
  syncState: 'pending' | 'refreshed' = 'pending'
): {
  title: string;
  summary: string;
  taskTitles: string[];
  receiptSummaries: string[];
  actionLabel: string;
  actionHref: string;
} {
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
    actionHref: `/approvals/${review.ticket}`,
  };
}

interface MemberLatestApprovalOutcome {
  ticket: string;
  status: ApprovalStatusForLabel;
  operation?: string;
  decisionAt?: string;
  occurredAt?: string;
  summary?: string;
  executionStatus?: string;
  executionSummary?: string;
  decisionBy?: string;
}

function buildLatestApprovalOutcomeHighlight(
  outcome: MemberLatestApprovalOutcome
): {
  title: string;
  summary: string;
  taskTitles: string[];
  receiptSummaries: (string | null)[];
  actionLabel: string;
  actionHref: string;
} | null {
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
    ],
    actionLabel: '查看审批单',
    actionHref: `/approvals/${outcome.ticket}`,
  };
}

type RuntimeState = 'callback-recorded' | 'replay-scheduled' | 'submitted' | 'challenge-issued' | 'blocked' | string | undefined;

function runtimeStateColor(state: RuntimeState): string {
  if (state === 'callback-recorded') return '#86efac';
  if (state === 'replay-scheduled') return '#c4b5fd';
  if (state === 'submitted') return '#93c5fd';
  if (state === 'challenge-issued') return '#fde68a';
  if (state === 'blocked') return '#fca5a5';
  return '#94a3b8';
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

function runtimeApprovalColor(status: string): string {
  if (status === 'APPROVED') return '#86efac';
  if (status === 'PENDING') return '#fde68a';
  if (status === 'NOT_REQUIRED') return '#93c5fd';
  return '#fca5a5';
}

function latestRuntimeEvent(receipt: { events: Array<{ eventType: string }> }): string {
  return receipt.events[receipt.events.length - 1]?.eventType ?? '—';
}

function overviewTimelineCategoryLabel(category: string): string {
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

function overviewTimelineStageLabel(stage: string): string {
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

interface GetApiReadOnlyMember {
  code: string;
}

function getApiReadOnlyMessage(member: GetApiReadOnlyMember): string {
  return `当前展示的是会员 ${member.code} 的真实持久化档案，已开放昵称、手机号、邮箱、地址、内部备注、积分调整、支付活动录入、状态流转、手工等级调整和 runtime 治理动作；高风险动作会自动转入审批。`;
}

// ===================================================================
// 测试套件
// ===================================================================

describe('approvalStatusLabel — 审批状态标签', () => {
  it('正例: 各状态中文标签正确', () => {
    assert.equal(approvalStatusLabel('APPROVED'), '已通过');
    assert.equal(approvalStatusLabel('REJECTED'), '已驳回');
    assert.equal(approvalStatusLabel('PENDING'), '待审批');
    assert.equal(approvalStatusLabel('CANCELLED'), '已撤销');
    assert.equal(approvalStatusLabel('SUPERSEDED'), '已被替代');
    assert.equal(approvalStatusLabel('NOT_REQUIRED'), '无需审批');
  });

  it('边界: 未知状态返回 "待审批"', () => {
    assert.equal(approvalStatusLabel('UNKNOWN' as ApprovalStatusForLabel), '待审批');
  });
});

describe('approvalOperationLabel — 审批操作标签', () => {
  it('正例: 已知操作名称', () => {
    assert.equal(approvalOperationLabel('member.points.award'), '会员加分');
    assert.equal(approvalOperationLabel('member.points.rollback'), '会员扣分');
    assert.equal(approvalOperationLabel('member.status.update'), '会员状态变更');
    assert.equal(approvalOperationLabel('member.level.override'), '会员等级调整');
    assert.equal(approvalOperationLabel('foundation.runtime-governance.replay'), 'Runtime Replay');
  });

  it('反例: 未知操作返回 "会员动作"', () => {
    assert.equal(approvalOperationLabel('unknown.op'), '会员动作');
  });

  it('边界: undefined 返回 "会员动作"', () => {
    assert.equal(approvalOperationLabel(undefined), '会员动作');
  });
});

describe('parseMemberApprovalReview — URL 参数解析', () => {
  it('正例: 完整参数解析正确', () => {
    const mockParams = {
      get(name: string) {
        const map: Record<string, string> = {
          approvalTicket: 'APR-001',
          approvalStatus: 'PENDING',
          approvalOperation: 'member.points.award',
          approvalDecidedAt: '2026-07-10T00:00:00Z',
          approvalUpdatedAt: '2026-07-09T00:00:00Z',
          approvalRefresh: '1',
        };
        return map[name] ?? null;
      },
    };
    const result = parseMemberApprovalReview(mockParams);
    assert.ok(result !== null);
    assert.equal(result!.ticket, 'APR-001');
    assert.equal(result!.status, 'PENDING');
    assert.equal(result!.operation, 'member.points.award');
    assert.equal(result!.autoRefresh, true);
  });

  it('反例: 缺少 ticket 返回 null', () => {
    const mockParams = { get: () => null };
    assert.equal(parseMemberApprovalReview(mockParams), null);
  });

  it('反例: 无效 status 返回 null', () => {
    const mockParams = {
      get(name: string) {
        if (name === 'approvalTicket') return 'APR-001';
        if (name === 'approvalStatus') return 'INVALID';
        return null;
      },
    };
    assert.equal(parseMemberApprovalReview(mockParams), null);
  });

  it('反例: 参数对象为 null 返回 null', () => {
    assert.equal(parseMemberApprovalReview(null), null);
  });

  it('边界: 不带 refresh 标志时 autoRefresh 为 false', () => {
    const mockParams = {
      get(name: string) {
        if (name === 'approvalTicket') return 'APR-001';
        if (name === 'approvalStatus') return 'APPROVED';
        return null;
      },
    };
    const result = parseMemberApprovalReview(mockParams);
    assert.equal(result!.autoRefresh, false);
  });

  it('边界: 仅 ticket + status 也能解析', () => {
    const mockParams = {
      get(name: string) {
        if (name === 'approvalTicket') return 'APR-001';
        if (name === 'approvalStatus') return 'APPROVED';
        return null;
      },
    };
    const result = parseMemberApprovalReview(mockParams);
    assert.equal(result!.ticket, 'APR-001');
    assert.equal(result!.operation, undefined);
    assert.equal(result!.decidedAt, undefined);
  });
});

describe('buildApprovalReviewHighlight — 审批高亮构建', () => {
  it('正例: PENDING 状态标题和摘要正确', () => {
    const review: MemberApprovalReviewContext = {
      ticket: 'APR-001',
      status: 'PENDING',
      autoRefresh: false,
    };
    const highlight = buildApprovalReviewHighlight(review);
    assert.equal(highlight.title, '动作已转入审批');
    assert.equal(highlight.taskTitles[0], '审批单 APR-001');
    assert.equal(highlight.actionLabel, '返回审批单');
  });

  it('正例: APPROVED 状态显示已通过', () => {
    const review: MemberApprovalReviewContext = {
      ticket: 'APR-002',
      status: 'APPROVED',
      operation: 'member.points.award',
      autoRefresh: false,
    };
    const highlight = buildApprovalReviewHighlight(review);
    assert.equal(highlight.title, '审批已通过');
    assert.ok(highlight.summary.includes('已通过'));
    assert.ok(highlight.summary.includes('会员加分'));
  });

  it('正例: APPROVED + refreshed 状态', () => {
    const review: MemberApprovalReviewContext = {
      ticket: 'APR-003',
      status: 'APPROVED',
      operation: 'member.level.override',
      autoRefresh: true,
    };
    const highlight = buildApprovalReviewHighlight(review, 'refreshed');
    assert.equal(highlight.title, '审批已通过并刷新档案');
    assert.ok(highlight.summary.includes('已自动刷新'));
  });

  it('正例: REJECTED 状态', () => {
    const review: MemberApprovalReviewContext = {
      ticket: 'APR-004',
      status: 'REJECTED',
      operation: 'member.status.update',
      autoRefresh: false,
    };
    const highlight = buildApprovalReviewHighlight(review);
    assert.ok(highlight.summary.includes('已驳回'));
    assert.ok(highlight.summary.includes('未落入'));
  });

  it('正例: CANCELLED 状态', () => {
    const review: MemberApprovalReviewContext = {
      ticket: 'APR-005',
      status: 'CANCELLED',
      operation: 'member.points.rollback',
      autoRefresh: false,
    };
    const highlight = buildApprovalReviewHighlight(review);
    assert.ok(highlight.summary.includes('已撤销'));
    assert.ok(highlight.summary.includes('不再继续'));
  });

  it('边界: NOT_REQUIRED 状态', () => {
    const review: MemberApprovalReviewContext = {
      ticket: 'APR-006',
      status: 'NOT_REQUIRED',
      autoRefresh: false,
    };
    const highlight = buildApprovalReviewHighlight(review);
    assert.ok(highlight.summary.includes('无需审批'));
  });

  it('边界: 有 decidedAt 时 receiptSummaries 包含时间', () => {
    const review: MemberApprovalReviewContext = {
      ticket: 'APR-007',
      status: 'APPROVED',
      decidedAt: '2026-07-10T00:00:00Z',
      autoRefresh: false,
    };
    const highlight = buildApprovalReviewHighlight(review);
    assert.equal(highlight.receiptSummaries[0], '已通过 · 2026-07-10T00:00:00Z');
  });
});

describe('buildLatestApprovalOutcomeHighlight — 最新审批结果高亮', () => {
  it('正例: APPROVED + 已执行', () => {
    const outcome: MemberLatestApprovalOutcome = {
      ticket: 'APR-010',
      status: 'APPROVED',
      operation: 'member.points.award',
      executionStatus: 'EXECUTED',
      decisionBy: 'ops.approver',
      decisionAt: '2026-07-10T00:00:00Z',
    };
    const highlight = buildLatestApprovalOutcomeHighlight(outcome);
    assert.equal(highlight!.title, '审批已执行');
    assert.ok(highlight!.summary.includes('已执行完毕'));
    assert.ok(highlight!.summary.includes('落账完成'));
  });

  it('正例: APPROVED + 执行失败', () => {
    const outcome: MemberLatestApprovalOutcome = {
      ticket: 'APR-011',
      status: 'APPROVED',
      operation: 'member.points.award',
      executionStatus: 'EXECUTION_FAILED',
      executionSummary: '积分系统超时',
    };
    const highlight = buildLatestApprovalOutcomeHighlight(outcome);
    assert.equal(highlight!.title, '审批执行失败');
    assert.ok(highlight!.summary.includes('执行失败'));
    assert.ok(highlight!.summary.includes('积分系统超时'));
  });

  it('正例: APPROVED + 未执行', () => {
    const outcome: MemberLatestApprovalOutcome = {
      ticket: 'APR-012',
      status: 'APPROVED',
      operation: 'member.level.override',
    };
    const highlight = buildLatestApprovalOutcomeHighlight(outcome);
    assert.equal(highlight!.title, '审批已通过');
    assert.ok(highlight!.summary.includes('已落入'));
  });

  it('正例: PENDING 状态', () => {
    const outcome: MemberLatestApprovalOutcome = {
      ticket: 'APR-013',
      status: 'PENDING',
      operation: 'member.status.update',
    };
    const highlight = buildLatestApprovalOutcomeHighlight(outcome);
    assert.equal(highlight!.title, '动作已转入审批');
    assert.ok(highlight!.summary.includes('仍待处理'));
  });

  it('反例: empty ticket 不返回高亮', () => {
    const highlight = buildLatestApprovalOutcomeHighlight({ ticket: '', status: '' as ApprovalStatusForLabel });
    assert.equal(highlight, null);
  });

  it('边界: 带 decisionBy 时 receiptSummaries 含处理人', () => {
    const outcome: MemberLatestApprovalOutcome = {
      ticket: 'APR-014',
      status: 'REJECTED',
      decisionBy: 'ops.admin',
      decisionAt: '2026-07-10T00:00:00Z',
    };
    const highlight = buildLatestApprovalOutcomeHighlight(outcome)!;
    assert.ok(highlight.receiptSummaries.some((s) => s?.includes('ops.admin')));
  });

  it('边界: 自定义 summary 覆盖默认', () => {
    const outcome: MemberLatestApprovalOutcome = {
      ticket: 'APR-015',
      status: 'APPROVED',
      summary: '自定义审批摘要',
    };
    const highlight = buildLatestApprovalOutcomeHighlight(outcome)!;
    assert.equal(highlight.summary, '自定义审批摘要');
  });
});

describe('runtimeStateColor — 运行时状态颜色', () => {
  it('正例: 各已知状态', () => {
    assert.equal(runtimeStateColor('callback-recorded'), '#86efac');
    assert.equal(runtimeStateColor('replay-scheduled'), '#c4b5fd');
    assert.equal(runtimeStateColor('submitted'), '#93c5fd');
    assert.equal(runtimeStateColor('challenge-issued'), '#fde68a');
    assert.equal(runtimeStateColor('blocked'), '#fca5a5');
  });

  it('边界: 未知状态返回灰色', () => {
    assert.equal(runtimeStateColor('unknown-state'), '#94a3b8');
  });

  it('边界: undefined 返回灰色', () => {
    assert.equal(runtimeStateColor(undefined), '#94a3b8');
  });
});

describe('taskPriorityColor — 任务优先级颜色', () => {
  it('正例: high 红色', () => {
    assert.equal(taskPriorityColor('high'), '#fca5a5');
  });

  it('正例: medium 黄色', () => {
    assert.equal(taskPriorityColor('medium'), '#fde68a');
  });

  it('正例: low 蓝色', () => {
    assert.equal(taskPriorityColor('low'), '#93c5fd');
  });
});

describe('taskStatusColor — 任务状态颜色', () => {
  it('正例: completed 绿色', () => {
    assert.equal(taskStatusColor('completed'), '#86efac');
  });

  it('正例: dispatched 蓝色', () => {
    assert.equal(taskStatusColor('dispatched'), '#93c5fd');
  });

  it('正例: queued 黄色', () => {
    assert.equal(taskStatusColor('queued'), '#fcd34d');
  });
});

describe('runtimeApprovalColor — Runtime 审批颜色', () => {
  it('正例: APPROVED 绿色', () => {
    assert.equal(runtimeApprovalColor('APPROVED'), '#86efac');
  });

  it('正例: PENDING 黄色', () => {
    assert.equal(runtimeApprovalColor('PENDING'), '#fde68a');
  });

  it('正例: NOT_REQUIRED 蓝色', () => {
    assert.equal(runtimeApprovalColor('NOT_REQUIRED'), '#93c5fd');
  });

  it('正例: REJECTED 红色', () => {
    assert.equal(runtimeApprovalColor('REJECTED'), '#fca5a5');
  });

  it('边界: 未知状态红色', () => {
    assert.equal(runtimeApprovalColor('UNKNOWN'), '#fca5a5');
  });
});

describe('latestRuntimeEvent — 最新运行时事件', () => {
  it('正例: 有事件时返回最后一个 eventType', () => {
    const receipt = { events: [{ eventType: 'started' }, { eventType: 'completed' }] };
    assert.equal(latestRuntimeEvent(receipt), 'completed');
  });

  it('边界: 空事件数组返回占位符', () => {
    const receipt = { events: [] };
    assert.equal(latestRuntimeEvent(receipt), '—');
  });

  it('边界: 单个事件正确返回', () => {
    const receipt = { events: [{ eventType: 'handler.callback.recorded' }] };
    assert.equal(latestRuntimeEvent(receipt), 'handler.callback.recorded');
  });
});

describe('overviewTimelineCategoryLabel — 时间线分类标签', () => {
  it('正例: 各分类映射', () => {
    assert.equal(overviewTimelineCategoryLabel('mutation'), 'Mutation');
    assert.equal(overviewTimelineCategoryLabel('receipt'), 'Receipt');
    assert.equal(overviewTimelineCategoryLabel('runtime'), 'Runtime');
    assert.equal(overviewTimelineCategoryLabel('approval'), 'Approval');
  });

  it('边界: 未知分类返回 "Approval"', () => {
    assert.equal(overviewTimelineCategoryLabel('unknown'), 'Approval');
  });
});

describe('overviewTimelineStageLabel — 时间线阶段标签', () => {
  it('正例: 各阶段映射', () => {
    assert.equal(overviewTimelineStageLabel('mutation'), '资料变更');
    assert.equal(overviewTimelineStageLabel('receipt-recorded'), '回执记录');
    assert.equal(overviewTimelineStageLabel('runtime-receipt'), '治理回执');
    assert.equal(overviewTimelineStageLabel('approval-pending'), '待审批');
    assert.equal(overviewTimelineStageLabel('approval-decided'), '审批决策');
    assert.equal(overviewTimelineStageLabel('approval-executed'), '审批执行');
  });

  it('边界: 未知阶段返回 "执行失败"', () => {
    assert.equal(overviewTimelineStageLabel('unknown-stage'), '执行失败');
  });
});

describe('getApiReadOnlyMessage — API 只读提示', () => {
  it('正例: 包含会员编号', () => {
    const member = { code: 'MEM-001' };
    const msg = getApiReadOnlyMessage(member);
    assert.ok(msg.includes('MEM-001'));
    assert.ok(msg.includes('真实持久化档案'));
  });
});
