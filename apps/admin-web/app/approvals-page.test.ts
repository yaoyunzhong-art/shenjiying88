/**
 * approvals-page.test.ts — Unit tests for governance approvals page logic, data routing,
 * view-model helpers, filtering, categorization, member context extraction, request descriptors,
 * and fallback fixtures.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  adminGovernanceApprovalsRoute,
  buildGovernanceApprovalDetailHref,
} from './approvals-data';

import {
  getApprovalMemberContext,
  getApprovalMemberHref,
  getApprovalResourceCategory,
  getApprovalResourceCategoryLabel,
  isApprovalInResourceCategory,
  describeGovernanceApprovalRequest,
  getApprovalRuntimeReceiptHref,
  buildApprovalMemberReviewHref,
  governanceApprovalResourceCategoryOptions,
  loadGovernanceApprovals,
  loadGovernanceApprovalDetail,
  type GovernanceApprovalSnapshot,
  type GovernanceApprovalStatus,
  type GovernanceApprovalListFilter,
  type GovernanceApprovalResourceCategory,
} from './approvals-view-model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUSES: GovernanceApprovalStatus[] = [
  'NOT_REQUIRED',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'SUPERSEDED',
];

function findStatusColor(status: GovernanceApprovalStatus): string {
  if (status === 'APPROVED') return '#86efac';
  if (status === 'PENDING') return '#fde68a';
  if (status === 'REJECTED' || status === 'CANCELLED') return '#fca5a5';
  return '#93c5fd';
}

// ---------------------------------------------------------------------------
// approvals-data
// ---------------------------------------------------------------------------

describe('approvals-data', () => {
  it('should export the route with href and title', () => {
    assert.strictEqual(adminGovernanceApprovalsRoute.href, '/approvals');
    assert.ok(adminGovernanceApprovalsRoute.title.length > 0);
    assert.ok(adminGovernanceApprovalsRoute.description.length > 0);
    assert.strictEqual(
      adminGovernanceApprovalsRoute.detailHrefBase,
      '/approvals'
    );
  });

  it('buildGovernanceApprovalDetailHref should build a detail link', () => {
    const href = buildGovernanceApprovalDetailHref('APR-001');
    assert.strictEqual(href, '/approvals/APR-001');
  });

  it('buildGovernanceApprovalDetailHref should encode special ticket ids', () => {
    const href = buildGovernanceApprovalDetailHref('APR-RTREPL-002');
    assert.strictEqual(href, '/approvals/APR-RTREPL-002');
  });
});

// ---------------------------------------------------------------------------
// approvals-view-model — resource category
// ---------------------------------------------------------------------------

describe('getApprovalResourceCategory', () => {
  it('should return member-profile for resourceType member-profile', () => {
    assert.strictEqual(
      getApprovalResourceCategory({ resourceType: 'member-profile' }),
      'member-profile'
    );
  });

  it('should return runtime-receipt for resourceType runtime-governance-receipt', () => {
    assert.strictEqual(
      getApprovalResourceCategory({ resourceType: 'runtime-governance-receipt' }),
      'runtime-receipt'
    );
  });

  it('should return runtime-receipt when operation starts with foundation.runtime-governance', () => {
    assert.strictEqual(
      getApprovalResourceCategory({
        resourceType: undefined,
        operation: 'foundation.runtime-governance.replay',
      }),
      'runtime-receipt'
    );
  });

  it('should return member-profile when operation starts with member.', () => {
    assert.strictEqual(
      getApprovalResourceCategory({
        resourceType: undefined,
        operation: 'member.points.award',
      }),
      'member-profile'
    );
  });

  it('should return unknown for unrecognized types', () => {
    assert.strictEqual(
      getApprovalResourceCategory({
        resourceType: 'unknown-type',
        operation: 'unknown.op',
      }),
      'unknown'
    );
  });
});

describe('getApprovalResourceCategoryLabel', () => {
  it('should return label for known categories', () => {
    assert.strictEqual(
      getApprovalResourceCategoryLabel('member-profile'),
      '会员档案'
    );
    assert.strictEqual(
      getApprovalResourceCategoryLabel('runtime-receipt'),
      'Runtime 治理'
    );
  });

  it('should return 未分类 for unknown', () => {
    assert.strictEqual(
      getApprovalResourceCategoryLabel('unknown'),
      '未分类'
    );
  });
});

describe('isApprovalInResourceCategory', () => {
  it('should return true for all when category is all', () => {
    assert.strictEqual(
      isApprovalInResourceCategory(
        { resourceType: 'whatever' },
        'all'
      ),
      true
    );
  });

  it('should match member-profile correctly', () => {
    assert.strictEqual(
      isApprovalInResourceCategory(
        { resourceType: 'member-profile' },
        'member-profile'
      ),
      true
    );
    assert.strictEqual(
      isApprovalInResourceCategory(
        { resourceType: 'runtime-governance-receipt' },
        'member-profile'
      ),
      false
    );
  });
});

describe('governanceApprovalResourceCategoryOptions', () => {
  it('should contain exactly 3 options', () => {
    assert.strictEqual(
      governanceApprovalResourceCategoryOptions.length,
      3
    );
  });

  it('should include 全部, 会员档案, Runtime 治理', () => {
    const labels = governanceApprovalResourceCategoryOptions.map((o) => o.label);
    assert.ok(labels.includes('全部'));
    assert.ok(labels.includes('会员档案'));
    assert.ok(labels.includes('Runtime 治理'));
  });

  it('each option should have a value and description', () => {
    for (const o of governanceApprovalResourceCategoryOptions) {
      assert.ok(typeof o.value === 'string');
      assert.ok(o.description.length > 0);
    }
  });
});

// ---------------------------------------------------------------------------
// approvals-view-model — member context
// ---------------------------------------------------------------------------

describe('getApprovalMemberContext', () => {
  const approval: GovernanceApprovalSnapshot = {
    approvalId: 'appr-001',
    operation: 'member.points.award',
    resourceType: 'member-profile',
    resourceKey: 'member-001',
    required: true,
    version: 1,
    requestedBy: 'ops',
    ticket: 'APR-001',
    status: 'PENDING',
    submitted: true,
    persisted: true,
    decidedBy: null,
    decidedAt: null,
    updatedAt: '2026-06-20T00:00:00.000Z',
    summary: {
      memberId: 'member-001',
      executionId: 'exec-001',
      taskId: 'task-001',
      actionCode: 'assign-vip',
      requestPayload: {
        memberId: 'member-001',
        executionId: 'exec-001',
        actionCode: 'assign-vip',
        sourceOrderId: 'order-001',
      },
    },
  };

  it('should extract memberId from summary', () => {
    const ctx = getApprovalMemberContext(approval);
    assert.ok(ctx !== null);
    assert.strictEqual(ctx?.memberId, 'member-001');
  });

  it('should extract executionId and taskId', () => {
    const ctx = getApprovalMemberContext(approval);
    assert.strictEqual(ctx?.executionId, 'exec-001');
    assert.strictEqual(ctx?.taskId, 'task-001');
  });

  it('should extract actionCode', () => {
    const ctx = getApprovalMemberContext(approval);
    assert.strictEqual(ctx?.actionCode, 'assign-vip');
  });

  it('should fallback to requestPayload when summary lacks fields', () => {
    const minimal: GovernanceApprovalSnapshot = {
      ...approval,
      summary: {
        requestPayload: {
          memberId: 'payload-member',
          sourceOrderId: 'order-002',
        },
      },
    };
    const ctx = getApprovalMemberContext(minimal);
    assert.strictEqual(ctx?.memberId, 'payload-member');
    assert.strictEqual(ctx?.sourceOrderId, 'order-002');
  });

  it('should return null when no memberId anywhere', () => {
    const empty: GovernanceApprovalSnapshot = {
      ...approval,
      summary: { requestPayload: {} },
    };
    assert.strictEqual(getApprovalMemberContext(empty), null);
  });
});

describe('getApprovalMemberHref', () => {
  it('should build member href from member context', () => {
    assert.strictEqual(
      getApprovalMemberHref({
        summary: { memberId: 'member-001' },
      } as unknown as GovernanceApprovalSnapshot),
      '/members/member-001'
    );
  });

  it('should return null when no memberId', () => {
    assert.strictEqual(
      getApprovalMemberHref({ summary: {} } as unknown as GovernanceApprovalSnapshot),
      null
    );
  });
});

describe('buildApprovalMemberReviewHref', () => {
  it('should append approval query params to member href', () => {
    const href = buildApprovalMemberReviewHref({
      ticket: 'APR-001',
      status: 'PENDING',
      operation: 'member.points.award',
      updatedAt: '2026-06-20T00:00:00.000Z',
      summary: { memberId: 'member-001' },
    } as unknown as GovernanceApprovalSnapshot);

    assert.ok(href !== null);
    assert.ok(href!.startsWith('/members/member-001?'));
    assert.ok(href!.includes('approvalTicket=APR-001'));
    assert.ok(href!.includes('approvalStatus=PENDING'));
    assert.ok(href!.includes('approvalOperation=member.points.award'));
  });

  it('should return null for no member', () => {
    assert.strictEqual(
      buildApprovalMemberReviewHref({
        summary: {},
      } as GovernanceApprovalSnapshot),
      null
    );
  });

  it('should include approvalRefresh=1 for resolved statuses', () => {
    const href = buildApprovalMemberReviewHref({
      ticket: 'APR-003',
      status: 'APPROVED',
      decidedAt: '2026-06-21T00:00:00.000Z',
      summary: { memberId: 'member-001' },
    } as unknown as GovernanceApprovalSnapshot);
    assert.ok(href!.includes('approvalRefresh=1'));
  });
});

// ---------------------------------------------------------------------------
// approvals-view-model — request descriptor
// ---------------------------------------------------------------------------

describe('describeGovernanceApprovalRequest', () => {
  it('should describe member.points.award', () => {
    const desc = describeGovernanceApprovalRequest({
      operation: 'member.points.award',
    } as GovernanceApprovalSnapshot);
    assert.strictEqual(desc.operationLabel, '会员加分审批');
    assert.ok(desc.summary.includes('会员'));
  });

  it('should include points in description when available', () => {
    const desc = describeGovernanceApprovalRequest({
      operation: 'member.points.award',
      summary: {
        requestPayload: { points: 5200 },
        payloadSummary: '高额加分请求',
      },
    } as unknown as GovernanceApprovalSnapshot);

    assert.ok(desc.summary.includes('高额加分请求'));
  });

  it('should describe member.points.rollback', () => {
    const desc = describeGovernanceApprovalRequest({
      operation: 'member.points.rollback',
    } as GovernanceApprovalSnapshot);
    assert.strictEqual(desc.operationLabel, '会员扣分审批');
  });

  it('should describe member.status.update', () => {
    const desc = describeGovernanceApprovalRequest({
      operation: 'member.status.update',
      summary: {
        requestPayload: { status: 'suspended' },
      },
    } as unknown as GovernanceApprovalSnapshot);
    assert.strictEqual(desc.operationLabel, '会员状态变更审批');
    assert.ok(desc.summary.includes('suspended'));
  });

  it('should describe member.level.override', () => {
    const desc = describeGovernanceApprovalRequest({
      operation: 'member.level.override',
      summary: {
        requestPayload: { currentLevel: 'GOLD', targetLevel: 'PLATINUM' },
      },
    } as unknown as GovernanceApprovalSnapshot);
    assert.strictEqual(desc.operationLabel, '会员等级调整审批');
    assert.ok(desc.summary.includes('GOLD'));
    assert.ok(desc.summary.includes('PLATINUM'));
  });

  it('should describe foundation.runtime-governance.replay', () => {
    const desc = describeGovernanceApprovalRequest({
      operation: 'foundation.runtime-governance.replay',
      resourceKey: 'ADMIN-RUNTIME-001',
    } as GovernanceApprovalSnapshot);
    assert.strictEqual(desc.operationLabel, 'Runtime Replay 审批');
    assert.strictEqual(desc.requestedField, '治理回执');
  });

  it('should fallback to operation string for unknown types', () => {
    const desc = describeGovernanceApprovalRequest({
      operation: 'custom.unknown.op',
    } as GovernanceApprovalSnapshot);
    assert.strictEqual(desc.operationLabel, 'custom.unknown.op');
  });
});

// ---------------------------------------------------------------------------
// approvals-view-model — runtime receipt href
// ---------------------------------------------------------------------------

describe('getApprovalRuntimeReceiptHref', () => {
  it('should link runtime-governance-receipt to /operations/:key', () => {
    assert.strictEqual(
      getApprovalRuntimeReceiptHref({
        resourceType: 'runtime-governance-receipt',
        resourceKey: 'ADMIN-RUNTIME-001',
      } as GovernanceApprovalSnapshot),
      '/operations/ADMIN-RUNTIME-001'
    );
  });

  it('should use receiptCode from requestPayload', () => {
    assert.strictEqual(
      getApprovalRuntimeReceiptHref({
        summary: {
          requestPayload: { receiptCode: 'RT-999' },
        },
      } as unknown as GovernanceApprovalSnapshot),
      '/operations/RT-999'
    );
  });

  it('should return null without any receipt info', () => {
    assert.strictEqual(
      getApprovalRuntimeReceiptHref({
        summary: {},
      } as GovernanceApprovalSnapshot),
      null
    );
  });
});

// ---------------------------------------------------------------------------
// approvals-view-model — load fallback (API unreachable path)
// ---------------------------------------------------------------------------

describe('loadGovernanceApprovals — fallback', () => {
  it('should return fallback approvals when API is unreachable', async () => {
    const snap = await loadGovernanceApprovals({});
    assert.strictEqual(snap.deliveryMode, 'fallback');
    assert.ok(Array.isArray(snap.approvals));
    assert.ok(snap.approvals.length >= 1, 'should have fallback approvals');
    assert.ok(snap.summary.total > 0);
    assert.ok(typeof snap.generatedAt === 'string');
  });

  it('should filter fallback by status', async () => {
    const snap = await loadGovernanceApprovals({ status: 'PENDING' });
    for (const a of snap.approvals) {
      assert.strictEqual(a.status, 'PENDING');
    }
  });

  it('should filter fallback by resourceType', async () => {
    const snap = await loadGovernanceApprovals({
      resourceType: 'member-profile',
    });
    for (const a of snap.approvals) {
      assert.strictEqual(a.resourceType, 'member-profile');
    }
  });

  it('should filter by resourceCategory member-profile', async () => {
    const snap = await loadGovernanceApprovals({
      resourceCategory: 'member-profile',
    });
    for (const a of snap.approvals) {
      const cat = getApprovalResourceCategory(a);
      assert.strictEqual(cat, 'member-profile');
    }
  });

  it('should filter by resourceCategory runtime-receipt', async () => {
    const snap = await loadGovernanceApprovals({
      resourceCategory: 'runtime-receipt',
    });
    for (const a of snap.approvals) {
      const cat = getApprovalResourceCategory(a);
      assert.strictEqual(cat, 'runtime-receipt');
    }
  });
});

// ---------------------------------------------------------------------------
// loadGovernanceApprovalDetail — fallback
// ---------------------------------------------------------------------------

describe('loadGovernanceApprovalDetail — fallback', () => {
  it('should return fallback detail for known ticket', async () => {
    const detail = await loadGovernanceApprovalDetail('APR-RTREPL-001');
    assert.strictEqual(detail.deliveryMode, 'fallback');
    assert.ok(detail.approval !== null);
    assert.strictEqual(detail.approval!.ticket, 'APR-RTREPL-001');
  });

  it('should return runtime receipt href for runtime-governance-receipt', async () => {
    const detail = await loadGovernanceApprovalDetail('APR-RTREPL-001');
    assert.strictEqual(
      detail.runtimeReceiptHref,
      '/operations/ADMIN-RUNTIME-001'
    );
  });

  it('should return member href for member-profile approvals', async () => {
    const detail = await loadGovernanceApprovalDetail('APR-MEMBER-001');
    assert.ok(detail.memberHref !== null);
    assert.strictEqual(detail.memberHref, '/members/member-001');
  });

  it('should return null for unknown ticket', async () => {
    const detail = await loadGovernanceApprovalDetail('NONEXISTENT-999');
    assert.strictEqual(detail.deliveryMode, 'fallback');
    assert.strictEqual(detail.approval, null);
  });
});

// ---------------------------------------------------------------------------
// Status color helper
// ---------------------------------------------------------------------------

describe('statusColor', () => {
  it('should assign correct color per status', () => {
    assert.strictEqual(findStatusColor('APPROVED'), '#86efac');
    assert.strictEqual(findStatusColor('PENDING'), '#fde68a');
    assert.strictEqual(findStatusColor('REJECTED'), '#fca5a5');
    assert.strictEqual(findStatusColor('CANCELLED'), '#fca5a5');
    assert.strictEqual(findStatusColor('NOT_REQUIRED'), '#93c5fd');
    assert.strictEqual(findStatusColor('SUPERSEDED'), '#93c5fd');
  });
});

// ---------------------------------------------------------------------------
// Fallback approvals data integrity
// ---------------------------------------------------------------------------

describe('fallback approvals data integrity', () => {
  it('each fallback approval should have a ticket', async () => {
    const snap = await loadGovernanceApprovals({});
    for (const a of snap.approvals) {
      assert.ok(typeof a.ticket === 'string' && a.ticket.length > 0);
    }
  });

  it('each fallback approval should have a valid status', async () => {
    const snap = await loadGovernanceApprovals({});
    for (const a of snap.approvals) {
      assert.ok(STATUSES.includes(a.status), `invalid status ${a.status}`);
    }
  });

  it('fallback metrics should sum correctly', async () => {
    const snap = await loadGovernanceApprovals({});
    const sumStatuses = Object.values(snap.summary.statuses).reduce(
      (s, v) => s + v,
      0
    );
    assert.strictEqual(sumStatuses, snap.summary.total);
  });

  it('status breakdown should not have negative counts', async () => {
    const snap = await loadGovernanceApprovals({});
    for (const [_, count] of Object.entries(snap.summary.statuses)) {
      assert.ok(count >= 0);
    }
  });
});
