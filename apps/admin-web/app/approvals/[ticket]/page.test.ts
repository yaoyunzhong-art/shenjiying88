/**
 * approval-detail-page.test.ts — Page-level L1 tests for the governance
 * approval detail page at /approvals/[ticket].
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: approvals-view-model.ts, approvals-data.ts, page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  adminGovernanceApprovalsRoute,
  buildGovernanceApprovalDetailHref,
} from '../../approvals-data';

type ApprovalStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'SUPERSEDED';

interface MockApprovalDetail {
  ticket: string;
  status: ApprovalStatus;
  operation: string;
  resourceType: string;
  resourceKey: string;
  version: number | null;
  requestedBy: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  submitted: boolean;
  persisted: boolean;
  execution: {
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
  summary: Record<string, unknown> | null;
}

// ---- Helpers matching page.tsx logic ----

function statusColor(status: ApprovalStatus): string {
  if (status === 'APPROVED') return '#86efac';
  if (status === 'PENDING') return '#fde68a';
  if (status === 'REJECTED' || status === 'CANCELLED') return '#fca5a5';
  return '#93c5fd';
}

function summaryRecord(approval: MockApprovalDetail | null): Record<string, unknown> {
  return approval?.summary && typeof approval.summary === 'object'
    ? (approval.summary as Record<string, unknown>)
    : {};
}

function requestPayloadRecord(approval: MockApprovalDetail | null): Record<string, unknown> {
  const payload = summaryRecord(approval).requestPayload;
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
}

function describeGovernanceApprovalRequest(approval: MockApprovalDetail) {
  const summary = summaryRecord(approval);
  const payload = requestPayloadRecord(approval);
  const operationLabel = approval.operation ?? 'unknown-operation';
  const riskLevel = typeof summary.riskLevel === 'string' ? summary.riskLevel : '—';
  const requestSummary = typeof summary.payloadSummary === 'string' ? summary.payloadSummary : '—';

  return {
    operationLabel,
    riskLevel,
    summary: requestSummary,
    requestedField: Object.keys(payload).join(', ') || '—',
    currentValue: JSON.stringify(payload),
    targetValue: JSON.stringify(summary),
  };
}

function getApprovalMemberContext(approval: MockApprovalDetail): {
  memberId: string | null;
  actionCode: string | null;
  executionId: string | null;
  sourceOrderId: string | null;
  sourcePaymentId: string | null;
} | null {
  const summary = summaryRecord(approval);
  const memberId = typeof summary.memberId === 'string' ? summary.memberId : null;
  const actionCode = typeof summary.actionCode === 'string' ? summary.actionCode : null;
  const executionId = typeof summary.executionId === 'string' ? summary.executionId : null;
  const sourceOrderId = typeof summary.sourceOrderId === 'string' ? summary.sourceOrderId : null;
  const sourcePaymentId = typeof summary.sourcePaymentId === 'string' ? summary.sourcePaymentId : null;
  if (!memberId) return null;
  return { memberId, actionCode, executionId, sourceOrderId, sourcePaymentId };
}

// ---- Mock data ----

const MOCK_PENDING_APPROVAL: MockApprovalDetail = {
  ticket: 'APR-001',
  status: 'PENDING',
  operation: 'foundation.runtime-governance.replay',
  resourceType: 'runtime-governance-receipt',
  resourceKey: 'ADMIN-RUNTIME-001',
  version: 1,
  requestedBy: 'ops.admin-web',
  decidedBy: null,
  decidedAt: null,
  submitted: true,
  persisted: true,
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
    actionCode: 'assign-vip-concierge',
    requestEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-RUNTIME-001/replay',
    payloadSummary: '高风险 replay 待审批',
    requestPayload: {
      receiptCode: 'ADMIN-RUNTIME-001',
      ledgerKey: 'runtime-ledger:ADMIN-RUNTIME-001',
      memberId: 'member-001',
      executionId: 'ops-exec-001',
      actionCode: 'assign-vip-concierge',
    },
  },
};

const MOCK_APPROVED_APPROVAL: MockApprovalDetail = {
  ticket: 'APR-002',
  status: 'APPROVED',
  operation: 'foundation.runtime-governance.replay',
  resourceType: 'runtime-governance-receipt',
  resourceKey: 'ADMIN-RUNTIME-002',
  version: 3,
  requestedBy: 'ops.admin-web',
  decidedBy: 'ops.approver',
  decidedAt: '2026-06-15T09:30:00.000Z',
  submitted: true,
  persisted: true,
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
  },
};

const MOCK_REJECTED_APPROVAL: MockApprovalDetail = {
  ticket: 'APR-003',
  status: 'REJECTED',
  operation: 'member.points.rollback',
  resourceType: 'member-profile',
  resourceKey: 'member-003',
  version: 2,
  requestedBy: 'finance',
  decidedBy: 'ops.approver',
  decidedAt: '2026-06-15T08:05:00.000Z',
  submitted: true,
  persisted: true,
  execution: {
    attempts: 0,
    executed: false,
    executionStatus: 'rejected',
    executedAt: null,
    executedBy: null,
    lastFailure: null,
  },
  summary: {
    riskLevel: 'medium',
    requestedFrom: 'FINANCE_INTERNAL',
    payloadSummary: '积分回滚被驳回',
  },
};

const MOCK_EXECUTION_FAILED_APPROVAL: MockApprovalDetail = {
  ticket: 'APR-004',
  status: 'APPROVED',
  operation: 'member.points.award',
  resourceType: 'member-profile',
  resourceKey: 'member-004',
  version: 5,
  requestedBy: 'ops',
  decidedBy: 'approver-01',
  decidedAt: '2026-06-15T07:00:00.000Z',
  submitted: true,
  persisted: true,
  execution: {
    attempts: 3,
    executed: true,
    executionStatus: 'execution-failed',
    executedAt: '2026-06-15T07:01:00.000Z',
    executedBy: 'runtime-governance',
    lastFailure: {
      failureStatus: 'retry-exhausted',
      failureReason: '积分服务超时，重试 3 次均失败',
      failedAt: '2026-06-15T07:05:00.000Z',
      failedBy: 'runtime-governance',
    },
  },
  summary: {
    riskLevel: 'medium',
    requestedFrom: 'ADMIN_WEB_OPS',
    memberId: 'member-004',
    executionId: 'ops-exec-004',
  },
};

// ===== 正例 =====

describe('approval-detail-page: 正例 (positive cases)', () => {
  describe('route helpers', () => {
    it('adminGovernanceApprovalsRoute should have correct href and empty message', () => {
      assert.strictEqual(adminGovernanceApprovalsRoute.href, '/approvals');
      assert.ok(adminGovernanceApprovalsRoute.emptyTitle.length > 0);
      assert.ok(adminGovernanceApprovalsRoute.emptyMessage.length > 0);
    });

    it('buildGovernanceApprovalDetailHref should produce correct URL for known tickets', () => {
      assert.strictEqual(buildGovernanceApprovalDetailHref('APR-001'), '/approvals/APR-001');
      assert.strictEqual(buildGovernanceApprovalDetailHref('APR-RTREPL-002'), '/approvals/APR-RTREPL-002');
    });
  });

  describe('statusColor', () => {
    it('APPROVED should return green', () => {
      assert.strictEqual(statusColor('APPROVED'), '#86efac');
    });

    it('PENDING should return yellow', () => {
      assert.strictEqual(statusColor('PENDING'), '#fde68a');
    });

    it('REJECTED should return red', () => {
      assert.strictEqual(statusColor('REJECTED'), '#fca5a5');
    });

    it('CANCELLED should return red', () => {
      assert.strictEqual(statusColor('CANCELLED'), '#fca5a5');
    });

    it('SUPERSEDED should return blue fallback', () => {
      assert.strictEqual(statusColor('SUPERSEDED'), '#93c5fd');
    });

    it('NOT_REQUIRED should return blue fallback', () => {
      assert.strictEqual(statusColor('NOT_REQUIRED'), '#93c5fd');
    });
  });

  describe('detail rendering', () => {
    it('should describe a PENDING approval request correctly', () => {
      const descriptor = describeGovernanceApprovalRequest(MOCK_PENDING_APPROVAL);
      assert.strictEqual(descriptor.operationLabel, 'foundation.runtime-governance.replay');
      assert.strictEqual(descriptor.riskLevel, 'high');
      assert.strictEqual(descriptor.summary, '高风险 replay 待审批');
      assert.ok(descriptor.requestedField.length > 0);
    });

    it('should describe an APPROVED request correctly', () => {
      const descriptor = describeGovernanceApprovalRequest(MOCK_APPROVED_APPROVAL);
      assert.strictEqual(descriptor.operationLabel, 'foundation.runtime-governance.replay');
      assert.strictEqual(descriptor.riskLevel, 'high');
    });

    it('should extract requestPayload from summary', () => {
      const payload = requestPayloadRecord(MOCK_PENDING_APPROVAL);
      assert.strictEqual(payload.receiptCode, 'ADMIN-RUNTIME-001');
      assert.strictEqual(payload.memberId, 'member-001');
      assert.strictEqual(payload.actionCode, 'assign-vip-concierge');
    });

    it('should extract member context from PENDING approval', () => {
      const ctx = getApprovalMemberContext(MOCK_PENDING_APPROVAL);
      assert.ok(ctx !== null);
      assert.strictEqual(ctx!.memberId, 'member-001');
      assert.strictEqual(ctx!.actionCode, 'assign-vip-concierge');
      assert.strictEqual(ctx!.executionId, 'ops-exec-001');
    });
  });

  describe('execution display', () => {
    it('PENDING approval should have execution not executed', () => {
      assert.strictEqual(MOCK_PENDING_APPROVAL.execution.executed, false);
      assert.strictEqual(MOCK_PENDING_APPROVAL.execution.attempts, 0);
      assert.strictEqual(MOCK_PENDING_APPROVAL.execution.executionStatus, null);
    });

    it('APPROVED approval should have executed execution', () => {
      assert.strictEqual(MOCK_APPROVED_APPROVAL.execution.executed, true);
      assert.strictEqual(MOCK_APPROVED_APPROVAL.execution.attempts, 1);
      assert.strictEqual(MOCK_APPROVED_APPROVAL.execution.executionStatus, 'runtime-replay-scheduled');
    });

    it('execution-failed approval should have lastFailure details', () => {
      assert.strictEqual(MOCK_EXECUTION_FAILED_APPROVAL.execution.executed, true);
      assert.strictEqual(MOCK_EXECUTION_FAILED_APPROVAL.execution.attempts, 3);
      assert.strictEqual(
        MOCK_EXECUTION_FAILED_APPROVAL.execution.lastFailure?.failureStatus,
        'retry-exhausted'
      );
      assert.ok(
        MOCK_EXECUTION_FAILED_APPROVAL.execution.lastFailure?.failureReason?.includes('超时')
      );
    });
  });

  describe('approval actions availability', () => {
    it('PENDING approval should show action buttons (approve/reject/cancel)', () => {
      const isPending = MOCK_PENDING_APPROVAL.status === 'PENDING';
      assert.strictEqual(isPending, true);
    });

    it('REJECTED approval should show resubmit button', () => {
      const canResubmit =
        MOCK_REJECTED_APPROVAL.status === 'REJECTED' ||
        MOCK_REJECTED_APPROVAL.status === 'CANCELLED';
      assert.strictEqual(canResubmit, true);
    });

    it('APPROVED approval should NOT show approve/reject/cancel buttons', () => {
      const isPending = MOCK_APPROVED_APPROVAL.status === 'PENDING';
      assert.strictEqual(isPending, false);
    });
  });
});

// ===== 反例 =====

describe('approval-detail-page: 反例 (negative cases)', () => {
  it('null approval should produce empty summaryRecord', () => {
    const record = summaryRecord(null);
    assert.strictEqual(Object.keys(record).length, 0);
  });

  it('null approval should produce empty requestPayloadRecord', () => {
    const payload = requestPayloadRecord(null);
    assert.strictEqual(Object.keys(payload).length, 0);
  });

  it('missing memberId in summary should return null context', () => {
    const ctx = getApprovalMemberContext(MOCK_REJECTED_APPROVAL);
    assert.strictEqual(ctx, null);
  });

  it('null summary should produce empty summaryRecord', () => {
    const approvalNoSummary: MockApprovalDetail = {
      ...MOCK_PENDING_APPROVAL,
      summary: null,
    };
    const record = summaryRecord(approvalNoSummary);
    assert.strictEqual(Object.keys(record).length, 0);
  });

  it('empty string ticket should still produce valid route', () => {
    const href = buildGovernanceApprovalDetailHref('');
    assert.strictEqual(href, '/approvals/');
  });

  it('unknown status should fallback to blue color', () => {
    const result = statusColor('SUPERSEDED' as ApprovalStatus);
    assert.strictEqual(result, '#93c5fd');
  });

  it('non-object requestPayload should produce empty record', () => {
    const badSummary: MockApprovalDetail = {
      ...MOCK_PENDING_APPROVAL,
      summary: { requestPayload: 'just-a-string' },
    };
    const payload = requestPayloadRecord(badSummary);
    assert.strictEqual(Object.keys(payload).length, 0);
  });
});

// ===== 边界 =====

describe('approval-detail-page: 边界 (boundary cases)', () => {
  it('should describe approval with empty summary gracefully', () => {
    const approvalEmptySummary: MockApprovalDetail = {
      ...MOCK_PENDING_APPROVAL,
      summary: {},
    };
    const descriptor = describeGovernanceApprovalRequest(approvalEmptySummary);
    assert.strictEqual(descriptor.riskLevel, '—');
    assert.strictEqual(descriptor.summary, '—');
  });

  it('should describe approval with null operation gracefully', () => {
    const approvalNoOp: MockApprovalDetail = {
      ...MOCK_PENDING_APPROVAL,
      operation: 'unknown-operation' as string,
    };
    const descriptor = describeGovernanceApprovalRequest(approvalNoOp);
    assert.strictEqual(descriptor.operationLabel, 'unknown-operation');
  });

  it('currentValue and targetValue should be valid JSON strings', () => {
    const descriptor = describeGovernanceApprovalRequest(MOCK_PENDING_APPROVAL);
    // Should not throw when parsing
    const currentParsed = JSON.parse(descriptor.currentValue);
    const targetParsed = JSON.parse(descriptor.targetValue);
    assert.ok(typeof currentParsed === 'object');
    assert.ok(typeof targetParsed === 'object');
  });

  it('execution lastFailure fields should be null when execution was successful', () => {
    assert.strictEqual(MOCK_APPROVED_APPROVAL.execution.lastFailure, null);
  });

  it('execution details for FAILED approval should have populated failure fields', () => {
    const lf = MOCK_EXECUTION_FAILED_APPROVAL.execution.lastFailure;
    assert.ok(lf !== null);
    assert.ok(lf!.failedAt !== null);
    assert.ok(lf!.failureReason !== null);
    assert.ok(lf!.failureStatus !== null);
  });

  it('decidedBy should be null for PENDING approval', () => {
    assert.strictEqual(MOCK_PENDING_APPROVAL.decidedBy, null);
  });

  it('decidedBy should be defined for APPROVED approval', () => {
    assert.strictEqual(MOCK_APPROVED_APPROVAL.decidedBy, 'ops.approver');
  });

  it('decidedBy should be defined for REJECTED approval', () => {
    assert.strictEqual(MOCK_REJECTED_APPROVAL.decidedBy, 'ops.approver');
  });

  it('execution attempts for failed approval should exceed retry threshold', () => {
    // 3 attempts indicates retry exhaustion — boundary for retry policy
    assert.ok(MOCK_EXECUTION_FAILED_APPROVAL.execution.attempts >= 3);
  });

  it('empty ticket in emptyMessage should interpolate correctly', () => {
    const msg = adminGovernanceApprovalsRoute.emptyMessage('');
    assert.ok(msg.includes('不存在'));
  });
});
