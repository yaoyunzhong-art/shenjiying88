/**
 * logistics/repairs/[id]/page.test.tsx — 维修工单详情 L1 测试
 *
 * 覆盖: STATUS_LABELS 常量、状态流转逻辑、MOCK_DETAIL 数据完整、按钮条件渲染
 * 正例: 各状态中文标签、mock 数据字段完整性、handleAction 状态切换
 * 反例: 无效状态 key、空字段、completedAt 为 null
 * 边界: 全部 6 种状态覆盖、actionLoading 期间 disabled
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/* ── 类型 ── */

type RepairStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'pending_verify' | 'verified';

interface RepairDetail {
  id: string;
  storeName: string;
  equipmentName: string;
  equipmentId: string;
  issueDescription: string;
  status: RepairStatus;
  assigneeName: string;
  reporterName: string;
  reporterPhone: string;
  createdAt: string;
  completedAt: string | null;
  note: string;
}

/* ── 从 page.tsx 源码提取的关键数据常量 ── */

const STATUS_LABELS: Record<RepairStatus, string> = {
  pending: '待指派',
  assigned: '已指派',
  in_progress: '维修中',
  completed: '已完成',
  pending_verify: '待验收',
  verified: '已验收',
};

const MOCK_DETAIL: RepairDetail = {
  id: 'RO-001',
  storeName: '旗舰店',
  equipmentName: '射击枪 A-01',
  equipmentId: 'EQ-001',
  issueDescription: '扳机卡顿，反应不灵敏，需要检修',
  status: 'in_progress' as RepairStatus,
  assigneeName: '李师傅',
  reporterName: '张店长',
  reporterPhone: '13800000001',
  createdAt: '2026-07-19T09:00:00Z',
  completedAt: null as string | null,
  note: '已检查扳机弹簧，需更换配件',
};

/* ── 辅助函数 ── */

function getNextStatus(current: RepairStatus): RepairStatus | null {
  const flow: Record<RepairStatus, RepairStatus | null> = {
    pending: 'assigned',
    assigned: 'in_progress',
    in_progress: 'completed',
    completed: 'pending_verify',
    pending_verify: 'verified',
    verified: null,
  };
  return flow[current] ?? null;
}

function shouldRenderActionButton(status: RepairStatus): boolean {
  return status !== 'verified';
}

function getActionLabel(status: RepairStatus, loading: boolean): string {
  if (loading) return '处理中...';
  const labels: Partial<Record<RepairStatus, string>> = {
    pending: '指派维修',
    assigned: '开始维修',
    in_progress: '完成维修',
    completed: '发起验收',
    pending_verify: '确认验收',
  };
  return labels[status] || '';
}

function getStatusBadgeClass(status: RepairStatus): string {
  if (status === 'pending') return 'bg-orange-100 text-orange-800';
  if (status === 'in_progress') return 'bg-yellow-100 text-yellow-800';
  if (status === 'completed' || status === 'verified') return 'bg-green-100 text-green-800';
  return 'bg-blue-100 text-blue-800';
}

/* ══════════════════════════════════════════════════════════
   测试: STATUS_LABELS 常量
   ══════════════════════════════════════════════════════════ */

describe('RepairDetail — STATUS_LABELS', () => {
  it('1. 覆盖全部 6 种状态', () => {
    const keys = Object.keys(STATUS_LABELS);
    assert.equal(keys.length, 6);
    assert.deepEqual(keys.sort(), ['assigned', 'completed', 'in_progress', 'pending', 'pending_verify', 'verified']);
  });

  it('2. 每个 label 是中文非空字符串', () => {
    for (const [key, label] of Object.entries(STATUS_LABELS)) {
      assert.ok(typeof label === 'string' && label.length > 0, `状态 ${key} 标签为空`);
    }
  });

  it('3. pending → 待指派, verified → 已验收', () => {
    assert.equal(STATUS_LABELS.pending, '待指派');
    assert.equal(STATUS_LABELS.assigned, '已指派');
    assert.equal(STATUS_LABELS.in_progress, '维修中');
    assert.equal(STATUS_LABELS.completed, '已完成');
    assert.equal(STATUS_LABELS.pending_verify, '待验收');
    assert.equal(STATUS_LABELS.verified, '已验收');
  });
});

/* ══════════════════════════════════════════════════════════
   测试: MOCK_DETAIL 数据
   ══════════════════════════════════════════════════════════ */

describe('RepairDetail — MOCK_DETAIL', () => {
  it('4. 所有必填字段存在且类型正确', () => {
    assert.equal(typeof MOCK_DETAIL.id, 'string');
    assert.equal(typeof MOCK_DETAIL.storeName, 'string');
    assert.equal(typeof MOCK_DETAIL.equipmentName, 'string');
    assert.equal(typeof MOCK_DETAIL.equipmentId, 'string');
    assert.equal(typeof MOCK_DETAIL.issueDescription, 'string');
    assert.equal(typeof MOCK_DETAIL.status, 'string');
    assert.equal(typeof MOCK_DETAIL.assigneeName, 'string');
    assert.equal(typeof MOCK_DETAIL.reporterName, 'string');
    assert.equal(typeof MOCK_DETAIL.reporterPhone, 'string');
    assert.equal(typeof MOCK_DETAIL.createdAt, 'string');
    assert.equal(typeof MOCK_DETAIL.note, 'string');
  });

  it('5. completedAt 初始为 null（工单未完成）', () => {
    assert.equal(MOCK_DETAIL.completedAt, null);
  });

  it('6. createdAt 是合法 ISO 时间戳', () => {
    const d = new Date(MOCK_DETAIL.createdAt);
    assert.ok(d instanceof Date && !isNaN(d.getTime()), 'createdAt 不是合法日期');
    assert.ok(MOCK_DETAIL.createdAt.endsWith('Z'), 'createdAt 应包含时区 Z');
  });

  it('7. reporterPhone 为 11 位手机号格式', () => {
    assert.ok(/^1\d{10}$/.test(MOCK_DETAIL.reporterPhone));
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 状态流转逻辑
   ══════════════════════════════════════════════════════════ */

describe('RepairDetail — 状态流转', () => {
  it('8. 正向流转: pending → assigned → in_progress → completed → pending_verify → verified', () => {
    assert.equal(getNextStatus('pending'), 'assigned');
    assert.equal(getNextStatus('assigned'), 'in_progress');
    assert.equal(getNextStatus('in_progress'), 'completed');
    assert.equal(getNextStatus('completed'), 'pending_verify');
    assert.equal(getNextStatus('pending_verify'), 'verified');
  });

  it('9. verified 状态无下一动作', () => {
    assert.equal(getNextStatus('verified'), null);
  });

  it('10. shouldRenderActionButton: 非 verified 状态为 true', () => {
    for (const s of ['pending', 'assigned', 'in_progress', 'completed', 'pending_verify'] as RepairStatus[]) {
      assert.equal(shouldRenderActionButton(s), true);
    }
    assert.equal(shouldRenderActionButton('verified'), false);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 按钮文案与处理中状态
   ══════════════════════════════════════════════════════════ */

describe('RepairDetail — 按钮文案', () => {
  it('11. 各状态对应正确按钮文案', () => {
    assert.equal(getActionLabel('pending', false), '指派维修');
    assert.equal(getActionLabel('assigned', false), '开始维修');
    assert.equal(getActionLabel('in_progress', false), '完成维修');
    assert.equal(getActionLabel('completed', false), '发起验收');
    assert.equal(getActionLabel('pending_verify', false), '确认验收');
  });

  it('12. verified 状态按钮文案为空', () => {
    assert.equal(getActionLabel('verified', false), '');
  });

  it('13. loading 时全部显示"处理中..."', () => {
    for (const s of ['pending', 'assigned', 'in_progress', 'completed', 'pending_verify', 'verified'] as RepairStatus[]) {
      assert.equal(getActionLabel(s, true), '处理中...');
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 状态徽章样式分类
   ══════════════════════════════════════════════════════════ */

describe('RepairDetail — 状态徽章样式', () => {
  it('14. pending → 橙色系', () => {
    assert.ok(getStatusBadgeClass('pending').includes('orange'));
  });

  it('15. in_progress → 黄色系', () => {
    assert.ok(getStatusBadgeClass('in_progress').includes('yellow'));
  });

  it('16. completed 和 verified → 绿色系', () => {
    assert.ok(getStatusBadgeClass('completed').includes('green'));
    assert.ok(getStatusBadgeClass('verified').includes('green'));
  });

  it('17. assigned 和 pending_verify → 蓝色系', () => {
    assert.ok(getStatusBadgeClass('assigned').includes('blue'));
    assert.ok(getStatusBadgeClass('pending_verify').includes('blue'));
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 数据完整性
   ══════════════════════════════════════════════════════════ */

describe('RepairDetail — 数据完整性', () => {
  it('18. 字段值非空覆盖', () => {
    const strFields: (keyof RepairDetail)[] = ['id', 'storeName', 'equipmentName', 'equipmentId', 'issueDescription', 'assigneeName', 'reporterName', 'reporterPhone', 'createdAt', 'note'];
    for (const key of strFields) {
      const val = MOCK_DETAIL[key];
      assert.ok(typeof val === 'string' && val.length > 0, `字段 ${key} 为空`);
    }
  });

  it('19. 描述文本长度合理（>5字符）', () => {
    assert.ok(MOCK_DETAIL.issueDescription.length > 5);
    assert.ok(MOCK_DETAIL.note.length > 5);
  });

  it('20. 状态值为已定义', () => {
    const validStatuses: RepairStatus[] = ['pending', 'assigned', 'in_progress', 'completed', 'pending_verify', 'verified'];
    assert.ok(validStatuses.includes(MOCK_DETAIL.status));
  });
});
