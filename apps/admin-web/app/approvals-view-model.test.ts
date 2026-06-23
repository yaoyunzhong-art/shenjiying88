import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildApprovalMemberReviewHref,
  buildGovernanceApprovalDetailHref,
  cancelGovernanceApproval,
  decideGovernanceApproval,
  describeGovernanceApprovalRequest,
  getApprovalMemberContext,
  getApprovalMemberHref,
  getApprovalResourceCategory,
  getApprovalRuntimeReceiptHref,
  isApprovalInResourceCategory,
  loadGovernanceApprovalDetail,
  loadGovernanceApprovalOutcomeAuditLogs,
  loadGovernanceApprovals,
  resubmitGovernanceApproval,
  type GovernanceApprovalSnapshot,
} from './approvals-view-model';

const sampleApproval: GovernanceApprovalSnapshot = {
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
    requestPayload: {
      receiptCode: 'ADMIN-RUNTIME-001',
      ledgerKey: 'runtime-ledger:ADMIN-RUNTIME-001',
      memberId: 'member-001',
      executionId: 'ops-exec-001',
      taskId: 'ops-task-001',
      actionCode: 'assign-vip-concierge',
    },
  },
};

test('approvals-view-model: builds approval detail href', () => {
  assert.equal(buildGovernanceApprovalDetailHref('APR-RTREPL-001'), '/approvals/APR-RTREPL-001');
});

test('approvals-view-model: derives runtime receipt href from approval', () => {
  assert.equal(getApprovalRuntimeReceiptHref(sampleApproval), '/operations/ADMIN-RUNTIME-001');
});

test('approvals-view-model: derives member context and href from approval', () => {
  const context = getApprovalMemberContext(sampleApproval);

  assert.equal(context?.memberId, 'member-001');
  assert.equal(context?.executionId, 'ops-exec-001');
  assert.equal(context?.taskId, 'ops-task-001');
  assert.equal(context?.actionCode, 'assign-vip-concierge');
  assert.equal(getApprovalMemberHref(sampleApproval), '/members/member-001');
});

test('approvals-view-model: builds member review href with approval context', () => {
  const href = buildApprovalMemberReviewHref({
    ...sampleApproval,
    operation: 'member.status.update',
    status: 'APPROVED',
    decidedAt: '2026-06-19T10:00:00.000Z',
  });

  assert.equal(
    href,
    '/members/member-001?approvalTicket=APR-RTREPL-001&approvalStatus=APPROVED&approvalOperation=member.status.update&approvalDecidedAt=2026-06-19T10%3A00%3A00.000Z&approvalRefresh=1'
  );
});

test('approvals-view-model: describes member level approval request', () => {
  const descriptor = describeGovernanceApprovalRequest({
    ...sampleApproval,
    operation: 'member.level.override',
    summary: {
      riskLevel: 'high',
      payloadSummary: '会员手工降级 PLATINUM -> SILVER 待审批',
      memberId: 'member-001',
      requestPayload: {
        memberId: 'member-001',
        currentLevel: 'PLATINUM',
        targetLevel: 'SILVER',
      },
    },
  });

  assert.equal(descriptor.operationLabel, '会员等级调整审批');
  assert.equal(descriptor.requestedField, '目标等级');
  assert.equal(descriptor.currentValue, 'PLATINUM');
  assert.equal(descriptor.targetValue, 'SILVER');
  assert.match(descriptor.summary, /PLATINUM -> SILVER/);
});

test('approvals-view-model: classifies resource type by category', () => {
  assert.equal(
    getApprovalResourceCategory({ resourceType: 'member-profile' }),
    'member-profile'
  );
  assert.equal(
    getApprovalResourceCategory({ resourceType: 'runtime-receipt' }),
    'runtime-receipt'
  );
  assert.equal(
    getApprovalResourceCategory({
      resourceType: undefined,
      operation: 'foundation.runtime-governance.replay',
    }),
    'runtime-receipt'
  );
  assert.equal(
    getApprovalResourceCategory({
      resourceType: 'unknown',
      operation: 'member.points.award',
    }),
    'member-profile'
  );
  assert.equal(
    getApprovalResourceCategory({ resourceType: 'order' }),
    'unknown'
  );
});

test('approvals-view-model: fallback approvals are filtered by resourceCategory', async () => {
  // 模拟 API 拉取失败：让 loadGovernanceApprovals 走 fallback 路径。
  globalThis.fetch = (async () => {
    throw new Error('api unreachable');
  }) as typeof fetch;

  const memberApprovals = await loadGovernanceApprovals({
    resourceCategory: 'member-profile',
  });
  assert.equal(memberApprovals.deliveryMode, 'fallback');
  assert.ok(
    memberApprovals.approvals.every((approval) =>
      isApprovalInResourceCategory(approval, 'member-profile')
    )
  );
  assert.ok(
    memberApprovals.approvals.some((approval) => approval.operation?.startsWith('member.'))
  );

  const runtimeApprovals = await loadGovernanceApprovals({
    resourceCategory: 'runtime-receipt',
  });
  assert.equal(runtimeApprovals.deliveryMode, 'fallback');
  assert.ok(
    runtimeApprovals.approvals.every((approval) =>
      isApprovalInResourceCategory(approval, 'runtime-receipt')
    )
  );

  // 全部类别应当返回 fallbackApprovals 全集。
  const allApprovals = await loadGovernanceApprovals({});
  assert.equal(allApprovals.deliveryMode, 'fallback');
  assert.ok(
    allApprovals.approvals.length >=
      memberApprovals.approvals.length + runtimeApprovals.approvals.length,
    'all category must be a superset of every resource category'
  );
});

test('approvals-view-model: resourceCategory=runtime-receipt is sent as resourceType in query', async () => {
  const observedUrls: string[] = [];
  globalThis.fetch = (async (input) => {
    const url = String(input);
    observedUrls.push(url);
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: [],
        timestamp: '2026-06-19T00:00:00.000Z',
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;
  await loadGovernanceApprovals({
    resourceCategory: 'runtime-receipt',
  });
  assert.ok(
    observedUrls.some(
      (url) =>
        url.includes('/foundation/governance-approval') &&
        url.includes('resourceType=runtime-receipt')
    ),
    `expected resourceType=runtime-receipt in query, got: ${observedUrls.join(', ')}`
  );
  assert.ok(
    observedUrls.every((url) => !url.includes('resourceCategory=runtime-receipt')),
    'resourceCategory should be translated to resourceType before hitting the API'
  );
});

test('approvals-view-model: describes member points approval request', () => {
  const descriptor = describeGovernanceApprovalRequest({
    ...sampleApproval,
    operation: 'member.points.award',
    summary: {
      riskLevel: 'high',
      memberId: 'member-001',
      requestPayload: {
        memberId: 'member-001',
        points: 5200,
      },
    },
  });

  assert.equal(descriptor.operationLabel, '会员加分审批');
  assert.equal(descriptor.requestedField, '积分增加');
  assert.equal(descriptor.targetValue, '+5200');
});

test('approvals-view-model: loads approval list with query params', async () => {
  let capturedListUrl = '';
  let capturedSummaryUrl = '';

  globalThis.fetch = (async (input) => {
    const url = String(input);
    if (url.includes('/summarize')) {
      capturedSummaryUrl = url;
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            total: 1,
            statuses: {
              NOT_REQUIRED: 0,
              PENDING: 1,
              APPROVED: 0,
              REJECTED: 0,
              CANCELLED: 0,
              SUPERSEDED: 0,
            },
            execution: {
              executed: 0,
              pending: 1,
              withFailures: 0,
              byExecutionStatus: {},
              byFailureStatus: {},
            },
          },
          timestamp: '2026-06-15T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    capturedListUrl = url;
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: [sampleApproval],
        timestamp: '2026-06-15T00:00:00.000Z',
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const snapshot = await loadGovernanceApprovals({
    status: 'PENDING',
    operation: 'foundation.runtime-governance.replay',
    resourceType: 'member-profile',
    resourceKey: 'member-001',
  });

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.approvals.length, 1);
  assert.match(capturedListUrl, /status=PENDING/);
  assert.match(capturedListUrl, /operation=foundation\.runtime-governance\.replay/);
  assert.match(capturedListUrl, /resourceType=member-profile/);
  assert.match(capturedListUrl, /resourceKey=member-001/);
  assert.match(capturedSummaryUrl, /status=PENDING/);
  assert.match(capturedSummaryUrl, /resourceType=member-profile/);
  assert.match(capturedSummaryUrl, /resourceKey=member-001/);
});

test('approvals-view-model: loads approval detail', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: sampleApproval,
        timestamp: '2026-06-15T00:00:00.000Z',
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )) as typeof fetch;

  const snapshot = await loadGovernanceApprovalDetail('APR-RTREPL-001');

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.approval?.ticket, 'APR-RTREPL-001');
  assert.equal(snapshot.runtimeReceiptHref, '/operations/ADMIN-RUNTIME-001');
  assert.equal(snapshot.memberHref, '/members/member-001');
});

test('approvals-view-model: posts approval decisions and lifecycle actions', async () => {
  const calls: Array<{ method: string; url: string; body: string }> = [];

  globalThis.fetch = (async (input, init) => {
    calls.push({
      method: init?.method ?? '',
      url: String(input),
      body: String(init?.body ?? ''),
    });
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: sampleApproval,
        timestamp: '2026-06-15T00:00:00.000Z',
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  await decideGovernanceApproval('APR-RTREPL-001', 'APPROVED', 1);
  await cancelGovernanceApproval('APR-RTREPL-001', 2);
  await resubmitGovernanceApproval('APR-RTREPL-001', 3);

  assert.equal(calls[0]?.method, 'POST');
  assert.match(calls[0]?.url ?? '', /\/foundation\/governance-approval\/decide$/);
  assert.match(calls[0]?.body ?? '', /"status":"APPROVED"/);
  assert.match(calls[1]?.url ?? '', /\/foundation\/governance-approval\/cancel$/);
  assert.match(calls[2]?.url ?? '', /\/foundation\/governance-approval\/resubmit$/);
});

test('approvals-view-model: loads member-approval-outcome audit logs filtered by purpose+ticket via /foundation/audit', async () => {
  let capturedUrl = '';
  globalThis.fetch = (async (input) => {
    capturedUrl = String(input);
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: [
          {
            auditLogId: 'audit-001',
            ticket: 'APR-MEMBER-001',
            purpose: 'member-approval-outcome',
            action: 'member.approval.approved',
            status: 'approved',
            memberId: 'member-001',
            operatorId: 'ops.approver-001',
            decisionBy: 'ops.approver-001',
            decisionAt: '2026-06-16T04:00:00.000Z',
            occurredAt: '2026-06-16T04:00:00.000Z',
            summary: '审批单通过',
            details: { approvalTicket: 'APR-MEMBER-001', points: 5200 }
          },
          {
            auditLogId: 'audit-002',
            ticket: 'APR-MEMBER-002',
            purpose: 'member-approval-outcome',
            action: 'member.approval.approved',
            status: 'approved',
            memberId: 'member-002',
            operatorId: 'ops.approver-001',
            decisionBy: 'ops.approver-001',
            decisionAt: '2026-06-16T05:00:00.000Z',
            occurredAt: '2026-06-16T05:00:00.000Z',
            summary: '另一张审批单通过',
            details: { approvalTicket: 'APR-MEMBER-002' }
          }
        ],
        timestamp: '2026-06-16T06:00:00.000Z'
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const snapshot = await loadGovernanceApprovalOutcomeAuditLogs('APR-MEMBER-001');

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.ticket, 'APR-MEMBER-001');
  assert.equal(snapshot.entries.length, 1, '应只保留与当前 ticket 匹配的条目');
  assert.equal(snapshot.entries[0]?.auditLogId, 'audit-001');
  assert.equal(snapshot.entries[0]?.action, 'member.approval.approved');
  assert.equal(snapshot.entries[0]?.details.points, 5200);
  // 服务端过滤必须用 purpose=member-approval-outcome + approvalTicket
  assert.match(capturedUrl, /\/foundation\/audit\?/);
  assert.match(capturedUrl, /purpose=member-approval-outcome/);
  assert.match(capturedUrl, /approvalTicket=APR-MEMBER-001/);
});

test('approvals-view-model: outcome audit logs fallback to fixture when API is unreachable', async () => {
  globalThis.fetch = (async () => {
    throw new Error('api offline');
  }) as typeof fetch;

  const snapshot = await loadGovernanceApprovalOutcomeAuditLogs('APR-MEMBER-001');

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.ticket, 'APR-MEMBER-001');
  assert.ok(snapshot.entries.length >= 1, '降级到 fixture 至少应包含 APR-MEMBER-001 的条目');
  for (const entry of snapshot.entries) {
    assert.equal(entry.ticket, 'APR-MEMBER-001');
    assert.equal(entry.purpose, 'member-approval-outcome');
  }
});
