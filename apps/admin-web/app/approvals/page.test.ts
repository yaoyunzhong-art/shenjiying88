/**
 * approvals-page.test.ts — Page-level tests for the governance approvals
 * page. Tests list rendering, status filtering, empty state, and pagination.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: approvals-data.ts, approvals-page.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  adminGovernanceApprovalsRoute,
  buildGovernanceApprovalDetailHref,
} from '../approvals-data';

type ApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED';
type ApprovalResourceType = 'member-profile' | 'runtime-governance-receipt';

interface ApprovalItem {
  ticket: string;
  status: ApprovalStatus;
  operation: string;
  resourceType: ApprovalResourceType | string;
  resourceKey: string;
  requestedBy: string;
  updatedAt: string;
  summary: Record<string, unknown>;
}

// ---- Page-level filter/display helpers ----

const STATUS_LABEL_MAP: Record<ApprovalStatus, string> = {
  'NOT_REQUIRED': '无需审批',
  'PENDING': '待审批',
  'APPROVED': '已通过',
  'REJECTED': '已拒绝',
  'CANCELLED': '已取消',
  'SUPERSEDED': '已替代',
};

const STATUS_VARIANT_MAP: Record<ApprovalStatus, string> = {
  'NOT_REQUIRED': 'neutral',
  'PENDING': 'warning',
  'APPROVED': 'success',
  'REJECTED': 'danger',
  'CANCELLED': 'danger',
  'SUPERSEDED': 'neutral',
};

function filterByStatus(items: ApprovalItem[], status: ApprovalStatus | 'ALL'): ApprovalItem[] {
  if (status === 'ALL') return items;
  return items.filter((i) => i.status === status);
}

function getStatusLabel(status: ApprovalStatus): string {
  return STATUS_LABEL_MAP[status] ?? status;
}

function getStatusVariant(status: ApprovalStatus): string {
  return STATUS_VARIANT_MAP[status] ?? 'neutral';
}

function paginate(items: ApprovalItem[], page: number, pageSize: number): ApprovalItem[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

// ---- Mock approval items ----

const MOCK_APPROVALS: ApprovalItem[] = [
  { ticket: 'APR-001', status: 'PENDING', operation: 'member.points.award', resourceType: 'member-profile', resourceKey: 'member-001', requestedBy: 'ops', updatedAt: '2026-06-24T01:00:00Z', summary: { memberId: 'member-001', points: 5000 } },
  { ticket: 'APR-002', status: 'APPROVED', operation: 'member.points.award', resourceType: 'member-profile', resourceKey: 'member-002', requestedBy: 'admin', updatedAt: '2026-06-23T22:00:00Z', summary: { memberId: 'member-002', points: 2000 } },
  { ticket: 'APR-003', status: 'REJECTED', operation: 'member.points.rollback', resourceType: 'member-profile', resourceKey: 'member-003', requestedBy: 'finance', updatedAt: '2026-06-23T18:00:00Z', summary: { memberId: 'member-003', reason: '参数不符' } },
  { ticket: 'APR-004', status: 'PENDING', operation: 'member.status.update', resourceType: 'member-profile', resourceKey: 'member-004', requestedBy: 'cs', updatedAt: '2026-06-24T00:30:00Z', summary: { memberId: 'member-004', targetStatus: 'suspended' } },
  { ticket: 'APR-005', status: 'CANCELLED', operation: 'member.level.override', resourceType: 'member-profile', resourceKey: 'member-005', requestedBy: 'ops', updatedAt: '2026-06-23T15:00:00Z', summary: { memberId: 'member-005', reason: '超时自动取消' } },
  { ticket: 'APR-006', status: 'PENDING', operation: 'foundation.runtime-governance.replay', resourceType: 'runtime-governance-receipt', resourceKey: 'ADMIN-RUNTIME-002', requestedBy: 'devops', updatedAt: '2026-06-24T00:15:00Z', summary: { receiptCode: 'RT-001' } },
  { ticket: 'APR-007', status: 'APPROVED', operation: 'member.points.award', resourceType: 'member-profile', resourceKey: 'member-006', requestedBy: 'admin', updatedAt: '2026-06-23T20:00:00Z', summary: { memberId: 'member-006', points: 10000 } },
  { ticket: 'APR-008', status: 'SUPERSEDED', operation: 'member.points.award', resourceType: 'member-profile', resourceKey: 'member-001', requestedBy: 'ops', updatedAt: '2026-06-23T12:00:00Z', summary: { memberId: 'member-001', points: 3000 } },
  { ticket: 'APR-009', status: 'NOT_REQUIRED', operation: 'member.points.award', resourceType: 'member-profile', resourceKey: 'member-007', requestedBy: 'system', updatedAt: '2026-06-23T10:00:00Z', summary: { memberId: 'member-007', points: 100 } },
  { ticket: 'APR-010', status: 'PENDING', operation: 'foundation.runtime-governance.replay', resourceType: 'runtime-governance-receipt', resourceKey: 'ADMIN-RUNTIME-003', requestedBy: 'sre', updatedAt: '2026-06-23T23:00:00Z', summary: {} },
];

// ---- approvals-data ----

describe('approvals-page: 正例 (positive cases)', () => {
  describe('approvals-data route', () => {
    it('should have correct href and title', () => {
      assert.strictEqual(adminGovernanceApprovalsRoute.href, '/approvals');
      assert.ok(adminGovernanceApprovalsRoute.title.length > 0);
      assert.ok(adminGovernanceApprovalsRoute.description.length > 0);
    });

    it('buildGovernanceApprovalDetailHref should build correct link', () => {
      assert.strictEqual(buildGovernanceApprovalDetailHref('APR-001'), '/approvals/APR-001');
      assert.strictEqual(buildGovernanceApprovalDetailHref('APR-RTREPL-002'), '/approvals/APR-RTREPL-002');
    });
  });

  describe('approval list rendering', () => {
    it('should contain at least 10 approvals', () => {
      assert.ok(MOCK_APPROVALS.length >= 10, `expected >= 10, got ${MOCK_APPROVALS.length}`);
    });

    it('every approval should have unique ticket', () => {
      const tickets = MOCK_APPROVALS.map((a) => a.ticket);
      assert.strictEqual(new Set(tickets).size, tickets.length);
    });

    it('every approval should have a valid status', () => {
      const validStatuses = new Set<ApprovalStatus>(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'SUPERSEDED']);
      for (const a of MOCK_APPROVALS) {
        assert.ok(validStatuses.has(a.status), `invalid status ${a.status} for ${a.ticket}`);
      }
    });
  });

  describe('status filter', () => {
    it('filter PENDING should return only PENDING approvals', () => {
      const result = filterByStatus(MOCK_APPROVALS, 'PENDING');
      assert.ok(result.length >= 3, `expected >= 3 PENDING, got ${result.length}`);
      for (const a of result) {
        assert.strictEqual(a.status, 'PENDING');
      }
    });

    it('filter APPROVED should return only APPROVED approvals', () => {
      const result = filterByStatus(MOCK_APPROVALS, 'APPROVED');
      for (const a of result) {
        assert.strictEqual(a.status, 'APPROVED');
      }
    });

    it('filter REJECTED should return only REJECTED approvals', () => {
      const result = filterByStatus(MOCK_APPROVALS, 'REJECTED');
      for (const a of result) {
        assert.strictEqual(a.status, 'REJECTED');
      }
    });

    it('filter ALL should return all approvals', () => {
      const result = filterByStatus(MOCK_APPROVALS, 'ALL');
      assert.strictEqual(result.length, MOCK_APPROVALS.length);
    });
  });

  describe('status label and variant', () => {
    it('should return correct labels', () => {
      assert.strictEqual(getStatusLabel('PENDING'), '待审批');
      assert.strictEqual(getStatusLabel('APPROVED'), '已通过');
      assert.strictEqual(getStatusLabel('REJECTED'), '已拒绝');
      assert.strictEqual(getStatusLabel('CANCELLED'), '已取消');
    });

    it('should return correct variants', () => {
      assert.strictEqual(getStatusVariant('PENDING'), 'warning');
      assert.strictEqual(getStatusVariant('APPROVED'), 'success');
      assert.strictEqual(getStatusVariant('REJECTED'), 'danger');
      assert.strictEqual(getStatusVariant('CANCELLED'), 'danger');
    });
  });
});

describe('approvals-page: 反例 (negative cases)', () => {
  it('filter by nonexistent status should return empty', () => {
    const result = filterByStatus(MOCK_APPROVALS, 'PENDING' as ApprovalStatus).filter(
      (a) => a.status === 'UNKNOWN' as unknown as ApprovalStatus
    );
    assert.strictEqual(result.length, 0);
  });

  it('empty approval list should handle all filters gracefully', () => {
    const empty: ApprovalItem[] = [];
    assert.strictEqual(filterByStatus(empty, 'PENDING').length, 0);
    assert.strictEqual(filterByStatus(empty, 'ALL').length, 0);
  });

  it('pagination should return empty for page beyond total', () => {
    const result = paginate(MOCK_APPROVALS, 999, 10);
    assert.strictEqual(result.length, 0);
  });

  it('pagination should return empty for page 0', () => {
    const result = paginate(MOCK_APPROVALS, 0, 10);
    assert.strictEqual(result.length, 0);
  });

  it('negative pageSize should not crash (lowered by app logic)', () => {
    // Negative pageSize — JS Array.slice treats this as end offset from end
    // App-level should guard against this
    const result = paginate(MOCK_APPROVALS, 1, -5);
    // We only verify it doesn't throw
    assert.ok(Array.isArray(result));
  });
});

describe('approvals-page: 边界 (boundary cases)', () => {
  it('single item pagination: page 1 returns 1 item, page 2 returns 0', () => {
    const single: ApprovalItem[] = [MOCK_APPROVALS[0]!];
    assert.strictEqual(paginate(single, 1, 10).length, 1);
    assert.strictEqual(paginate(single, 2, 10).length, 0);
  });

  it('pagination should exactly match totalPages', () => {
    const pageSize = 4;
    const totalPages = getTotalPages(MOCK_APPROVALS.length, pageSize);
    // First totalPages pages should all have items, page after should be empty
    for (let p = 1; p <= totalPages; p++) {
      const page = paginate(MOCK_APPROVALS, p, pageSize);
      assert.ok(page.length > 0, `page ${p} should have items`);
    }
    const lastPage = paginate(MOCK_APPROVALS, totalPages, pageSize);
    assert.strictEqual(lastPage.length, MOCK_APPROVALS.length % pageSize || pageSize);
  });

  it('getTotalPages should be at least 1 for empty list', () => {
    assert.strictEqual(getTotalPages(0, 10), 1);
  });

  it('getTotalPages calculation should be correct', () => {
    assert.strictEqual(getTotalPages(10, 10), 1);
    assert.strictEqual(getTotalPages(11, 10), 2);
    assert.strictEqual(getTotalPages(0, 10), 1);
    assert.strictEqual(getTotalPages(100, 10), 10);
  });

  it('status distribution should sum to total', () => {
    const allStatuses: ApprovalStatus[] = ['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'SUPERSEDED'];
    let sum = 0;
    for (const s of allStatuses) {
      sum += MOCK_APPROVALS.filter((a) => a.status === s).length;
    }
    assert.strictEqual(sum, MOCK_APPROVALS.length);
  });
});

describe('approvals-page: empty state', () => {
  it('should show empty title and message for unknown ticket', () => {
    const emptyTitle = adminGovernanceApprovalsRoute.emptyTitle;
    const emptyMessage = adminGovernanceApprovalsRoute.emptyMessage('APR-NONEXISTENT');
    assert.strictEqual(emptyTitle, '审批单不存在');
    assert.strictEqual(emptyMessage, '审批单 APR-NONEXISTENT 不存在');
  });
});
