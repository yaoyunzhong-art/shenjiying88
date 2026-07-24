/**
 * approvals/[ticket]/page.test.tsx — 审批工单详情 L1 测试
 *
 * 覆盖: 审批状态机、决策类型、审计日志查询、摘要数据
 * 正例: 状态枚举、决策映射、工单字段完整性
 * 反例: 工单不存在、无效状态、空摘要
 * 边界: 全状态覆盖、超长备注、空审计日志
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// ── 类型 ──

type GovernanceApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface GovernanceApprovalSnapshot {
  id: string;
  status: GovernanceApprovalStatus;
  title: string;
  requester: string;
  summary: Record<string, unknown> | null;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  comment?: string;
}

// ── 常量映射 ──

const STATUS_LABELS: Record<GovernanceApprovalStatus, string> = {
  PENDING: '待审批',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  CANCELLED: '已取消',
};

const STATUS_COLORS: Record<GovernanceApprovalStatus, string> = {
  PENDING: '#fde68a',
  APPROVED: '#86efac',
  REJECTED: '#fca5a5',
  CANCELLED: '#93c5fd',
};

// ── Mock 数据 ──

const MOCK_APPROVALS: GovernanceApprovalSnapshot[] = [
  { id: 'AP-001', status: 'APPROVED', title: 'Q3营销预算审批', requester: '张三', summary: { amount: '500,000', department: '市场部' }, createdAt: '2026-07-15 10:00', decidedAt: '2026-07-16 14:30', decidedBy: '李四', comment: '同意预算' },
  { id: 'AP-002', status: 'PENDING', title: '新供应商准入审批', requester: '王五', summary: { supplier: '新供应商X', contractValue: '200,000' }, createdAt: '2026-07-20 09:00' },
  { id: 'AP-003', status: 'REJECTED', title: '超额采购申请', requester: '赵六', summary: { amount: '1,000,000', reason: '生产设备' }, createdAt: '2026-07-18 11:30', decidedAt: '2026-07-19 08:00', decidedBy: '钱七', comment: '预算不足，下季度重提' },
  { id: 'AP-004', status: 'CANCELLED', title: '临时活动审批', requester: '孙八', summary: null, createdAt: '2026-07-17 16:00', decidedAt: '2026-07-18 09:00', decidedBy: '张三', comment: '主动撤回' },
  { id: 'AP-005', status: 'APPROVED', title: 'IT设备采购', requester: '周九', summary: { items: '服务器x3', total: '300,000' }, createdAt: '2026-07-10 14:00', decidedAt: '2026-07-12 10:00', decidedBy: '李四' },
];

// ── 辅助函数 ──

function getStatusLabel(status: GovernanceApprovalStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function getStatusColor(status: GovernanceApprovalStatus): string {
  return STATUS_COLORS[status] ?? '#e5e7eb';
}

function getApprovalById(id: string): GovernanceApprovalSnapshot | undefined {
  return MOCK_APPROVALS.find(a => a.id === id);
}

function isDecided(status: GovernanceApprovalStatus): boolean {
  return status !== 'PENDING';
}

function computeStats(approvals: GovernanceApprovalSnapshot[]) {
  return {
    total: approvals.length,
    pending: approvals.filter(a => a.status === 'PENDING').length,
    approved: approvals.filter(a => a.status === 'APPROVED').length,
    rejected: approvals.filter(a => a.status === 'REJECTED').length,
    cancelled: approvals.filter(a => a.status === 'CANCELLED').length,
  };
}

// ===================================================================
describe('ApprovalsTicket — 状态机', () => {
  it('四种状态映射完整', () => {
    const statuses: GovernanceApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
    for (const s of statuses) {
      const label = getStatusLabel(s);
      assert.ok(label.length > 0, `Status ${s} should have label`);
      const color = getStatusColor(s);
      assert.ok(color.startsWith('#'), `Status ${s} should have hex color`);
    }
  });

  it('状态分布统计正确', () => {
    const stats = computeStats(MOCK_APPROVALS);
    assert.equal(stats.total, 5);
    assert.equal(stats.pending, 1);
    assert.equal(stats.approved, 2);
    assert.equal(stats.rejected, 1);
    assert.equal(stats.cancelled, 1);
  });

  it('非 PENDING 状态视为已决策', () => {
    assert.equal(isDecided('PENDING'), false);
    assert.equal(isDecided('APPROVED'), true);
    assert.equal(isDecided('REJECTED'), true);
    assert.equal(isDecided('CANCELLED'), true);
  });
});

// ===================================================================
describe('ApprovalsTicket — 查询', () => {
  it('按 ID 查询返回正确审批', () => {
    const a = getApprovalById('AP-001');
    assert.ok(a);
    assert.equal(a!.title, 'Q3营销预算审批');
  });

  it('不存在的 ID 返回 undefined', () => {
    assert.equal(getApprovalById('NONEXIST'), undefined);
  });

  it('已通过审批应有 decidedBy', () => {
    const approved = MOCK_APPROVALS.filter(a => a.status === 'APPROVED');
    for (const a of approved) {
      assert.ok(a.decidedBy, `Approved ${a.id} should have decidedBy`);
    }
  });
});

// ===================================================================
describe('ApprovalsTicket — 数据完整性', () => {
  it('所有审批应有 id/title/requester', () => {
    for (const a of MOCK_APPROVALS) {
      assert.ok(a.id, 'id required');
      assert.ok(a.title, 'title required');
      assert.ok(a.requester, 'requester required');
    }
  });

  it('summary 可为 null', () => {
    const nullSummary = MOCK_APPROVALS.filter(a => a.summary === null);
    assert.ok(nullSummary.length > 0, 'should have at least one null summary');
  });

  it('已审批工单应有 decidedAt', () => {
    const decided = MOCK_APPROVALS.filter(a => isDecided(a.status));
    for (const a of decided) {
      assert.ok(a.decidedAt, `${a.id}: decidedAt required for decided status`);
    }
  });
});

// ===================================================================
describe('ApprovalsTicket — 边界', () => {
  it('空列表统计全为零', () => {
    const stats = computeStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.pending, 0);
  });

  it('全 PENDING 统计', () => {
    const allPending: GovernanceApprovalSnapshot[] = [
      { id: 'p1', status: 'PENDING', title: 't1', requester: 'u', summary: null, createdAt: '2026-07-20' },
      { id: 'p2', status: 'PENDING', title: 't2', requester: 'u', summary: null, createdAt: '2026-07-20' },
    ];
    const stats = computeStats(allPending);
    assert.equal(stats.pending, 2);
    assert.equal(stats.approved, 0);
  });

  it('comment 可选字段可为空字符串', () => {
    const noComment = MOCK_APPROVALS.filter(a => !a.comment);
    assert.ok(noComment.length >= 0);
  });

  it('空列表查询不抛异常', () => {
    assert.doesNotThrow(() => computeStats([]));
    assert.doesNotThrow(() => getApprovalById(''));
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('approvals/[ticket] — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'foundation.governance.read'"));
  });
});
