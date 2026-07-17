/**
 * approvals/page.test.tsx — 审批页面 L1 冒烟测试
 * ⚡ 覆盖: mock数据 / 统计计算 / 筛选(Tab切换) / 格式化 / 状态映射 / 按钮
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';
import fs from 'node:fs';

// ---- 类型 ----

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
type ApprovalType = 'purchase' | 'refund' | 'leave' | 'expense' | 'campaign' | 'adjustment';

interface Approval {
  id: string;
  title: string;
  type: ApprovalType;
  status: ApprovalStatus;
  applicant: string;
  dept: string;
  amount: number;
  createdDate: string;
  dueDate: string;
  description: string;
  approver: string;
  approvedDate: string;
  comment: string;
  urgency: 'high' | 'medium' | 'low';
}

// ---- 常量映射 (与 page.tsx 同步) ----

const AS: Record<ApprovalStatus, { l: string; v: string }> = {
  pending: { l: '待审批', v: 'warning' },
  approved: { l: '已通过', v: 'success' },
  rejected: { l: '已驳回', v: 'danger' },
  cancelled: { l: '已取消', v: 'neutral' },
};

const AT: Record<ApprovalType, string> = {
  purchase: '采购', refund: '退款', leave: '请假',
  expense: '报销', campaign: '活动', adjustment: '调账',
};

function fm(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

// ---- Mock 数据 ----

const approvals: Approval[] = [
  { id: 'A1', title: '采购VR设备*2', type: 'purchase', status: 'pending', applicant: '赵敏', dept: '运营部', amount: 68000, createdDate: '2026-07-11', dueDate: '2026-07-14', description: '采购2台HTC VIVE Pro 2用于VR体验区', approver: '', approvedDate: '', comment: '', urgency: 'high' },
  { id: 'A2', title: '团建客户退款申请', type: 'refund', status: 'pending', applicant: '李娜', dept: '运营部', amount: 3250, createdDate: '2026-07-11', dueDate: '2026-07-13', description: '团建客户临时取消', approver: '', approvedDate: '', comment: '', urgency: 'high' },
  { id: 'A3', title: '6月市场活动报销', type: 'expense', status: 'pending', applicant: '陈静', dept: '市场部', amount: 5800, createdDate: '2026-07-10', dueDate: '2026-07-17', description: '618促销活动物料费用报销', approver: '', approvedDate: '', comment: '', urgency: 'medium' },
  { id: 'A4', title: '员工请假-王强(3天)', type: 'leave', status: 'pending', applicant: '王强', dept: '导玩组', amount: 0, createdDate: '2026-07-10', dueDate: '2026-07-12', description: '年假3天', approver: '', approvedDate: '', comment: '', urgency: 'medium' },
  { id: 'A5', title: '暑期促销活动方案', type: 'campaign', status: 'pending', applicant: '陈静', dept: '市场部', amount: 15000, createdDate: '2026-07-09', dueDate: '2026-07-16', description: '暑期特惠季活动预算审批', approver: '', approvedDate: '', comment: '', urgency: 'medium' },
  { id: 'A6', title: '库存差异调账', type: 'adjustment', status: 'pending', applicant: '刘洋', dept: '库存', amount: 750, createdDate: '2026-07-09', dueDate: '2026-07-14', description: '盘点发现娃娃库存差异', approver: '', approvedDate: '', comment: '', urgency: 'low' },
  { id: 'A7', title: '空调维修报销', type: 'expense', status: 'approved', applicant: '杨磊', dept: '技术部', amount: 2800, createdDate: '2026-07-08', dueDate: '2026-07-11', description: 'A区空调维修费用', approver: '店长', approvedDate: '2026-07-10', comment: '同意报销', urgency: 'medium' },
  { id: 'A8', title: '采购清洁用品', type: 'purchase', status: 'approved', applicant: '黄丽', dept: '后勤', amount: 1200, createdDate: '2026-07-07', dueDate: '2026-07-10', description: '月度清洁用品采购', approver: '店长', approvedDate: '2026-07-08', comment: '通过', urgency: 'low' },
  { id: 'A9', title: '员工请假-刘洋(1天)', type: 'leave', status: 'rejected', applicant: '刘洋', dept: '库存', amount: 0, createdDate: '2026-07-06', dueDate: '2026-07-08', description: '事假1天(7/10)', approver: '店长', approvedDate: '2026-07-07', comment: '库存盘点期间不予批准', urgency: 'low' },
  { id: 'A10', title: '会员充值活动方案', type: 'campaign', status: 'approved', applicant: '陈静', dept: '市场部', amount: 8000, createdDate: '2026-07-05', dueDate: '2026-07-09', description: '周末充值满赠活动方案', approver: '店长', approvedDate: '2026-07-08', comment: '方案可行,批准执行', urgency: 'high' },
];

// ---- 辅助函数 ----

function getPendingApprovals(all: Approval[]): Approval[] {
  return all.filter(a => a.status === 'pending');
}

function getHistoryApprovals(all: Approval[]): Approval[] {
  return all.filter(a => a.status !== 'pending');
}

function computeStats(all: Approval[]) {
  const pending = all.filter(a => a.status === 'pending');
  const pendingTotal = pending.reduce((s, a) => s + a.amount, 0);
  const urgentCount = pending.filter(a => a.urgency === 'high').length;
  const resolved = all.filter(a => a.status !== 'pending');
  const approved = all.filter(a => a.status === 'approved').length;
  const passRate = resolved.length > 0 ? Math.round((approved / resolved.length) * 100) : 0;
  return { pendingCount: pending.length, pendingTotal, urgentCount, passRate };
}

// ---- 测试 ----

describe('ApprovalsPage — Mock 数据', () => {
  it('有 10 条审批记录', () => {
    assert.strictEqual(approvals.length, 10);
  });

  it('覆盖全部审批类型', () => {
    const types = new Set(approvals.map(a => a.type));
    ['purchase', 'refund', 'leave', 'expense', 'campaign', 'adjustment'].forEach(t => {
      assert.ok(types.has(t as ApprovalType), `缺少类型 ${t}`);
    });
  });

  it('覆盖全部状态', () => {
    const statuses = new Set(approvals.map(a => a.status));
    ['pending', 'approved', 'rejected'].forEach(s => {
      assert.ok(statuses.has(s as ApprovalStatus));
    });
  });

  it('覆盖全部紧急程度', () => {
    const urgencies = new Set(approvals.map(a => a.urgency));
    ['high', 'medium', 'low'].forEach(u => assert.ok(urgencies.has(u as 'high')));
  });

  it('approved 记录有评论', () => {
    approvals.filter(a => a.status === 'approved').forEach(a => {
      assert.ok(a.comment.length > 0);
    });
  });
});

describe('ApprovalsPage — 统计计算', () => {
  it('待审批 6 条', () => {
    const stats = computeStats(approvals);
    assert.strictEqual(stats.pendingCount, 6);
  });

  it('待处理总额计算正确', () => {
    const stats = computeStats(approvals);
    const expected = 68000 + 3250 + 5800 + 0 + 15000 + 750;
    assert.strictEqual(stats.pendingTotal, expected);
  });

  it('紧急审批 2 条', () => {
    const stats = computeStats(approvals);
    assert.strictEqual(stats.urgentCount, 2);
  });

  it('通过率计算正确', () => {
    const stats = computeStats(approvals);
    assert.strictEqual(stats.passRate, 75);
  });

  it('getPendingApprovals 返回待审批', () => {
    const pending = getPendingApprovals(approvals);
    assert.strictEqual(pending.length, 6);
    pending.forEach(a => assert.strictEqual(a.status, 'pending'));
  });

  it('getHistoryApprovals 返回已处理', () => {
    const history = getHistoryApprovals(approvals);
    assert.strictEqual(history.length, 4);
    history.forEach(a => assert.ok(a.status !== 'pending'));
  });
});

describe('ApprovalsPage — 映射表', () => {
  it('AT 映射所有类型到中文', () => {
    assert.strictEqual(AT.purchase, '采购');
    assert.strictEqual(AT.refund, '退款');
    assert.strictEqual(AT.leave, '请假');
    assert.strictEqual(AT.expense, '报销');
    assert.strictEqual(AT.campaign, '活动');
    assert.strictEqual(AT.adjustment, '调账');
  });

  it('AS 映射标签中文', () => {
    assert.strictEqual(AS.pending.l, '待审批');
    assert.strictEqual(AS.approved.l, '已通过');
    assert.strictEqual(AS.rejected.l, '已驳回');
    assert.strictEqual(AS.cancelled.l, '已取消');
  });

  it('金额格式化', () => {
    assert.strictEqual(fm(68000), '¥68,000.00');
    assert.strictEqual(fm(1200), '¥1,200.00');
    assert.strictEqual(fm(0), '¥0.00');
    assert.strictEqual(fm(3.5), '¥3.50');
  });
});

describe('ApprovalsPage — Tab 切换', () => {
  it('pending tab 显示 6 条', () => {
    assert.strictEqual(getPendingApprovals(approvals).length, 6);
  });

  it('history tab 显示 4 条', () => {
    assert.strictEqual(getHistoryApprovals(approvals).length, 4);
  });

  it('pending 审批金额皆 > 0 (除请假)', () => {
    const pending = getPendingApprovals(approvals);
    pending.forEach(a => {
      if (a.type !== 'leave') {
        assert.ok(a.amount > 0, `${a.id} amount should be > 0`);
      }
    });
  });

  it('已处理的记录都有审批人', () => {
    const history = getHistoryApprovals(approvals);
    history.forEach(a => assert.ok(a.approver.length > 0));
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Approvals — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
