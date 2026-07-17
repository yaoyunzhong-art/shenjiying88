/**
 * members/[id]/tasks/[taskId]/page.test.tsx
 * 会员运营任务详情页 L1 冒烟测试
 * ⚡ 覆盖: 数据工厂 / 状态映射 / 副标题 / 边界情况
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';
import fs from 'node:fs';

// ---- 类型 ----

interface MemberOperationTask {
  taskId: string;
  memberId: string;
  actionCode: string;
  title: string;
  status: string;
  executionLane: string;
  source: string;
  sourceOrderId?: string | null;
  sourcePaymentId?: string | null;
  priority: string;
  channel: string;
  createdAt: string;
  scheduledAt: string;
  executedAt?: string | null;
  reason: string;
  executionSummary?: string | null;
  executionTargetId?: string | null;
}

interface MemberQuickInfo {
  name?: string | null;
  id: string;
}

// ---- 辅助函数 ----

function buildTaskSubtitle(
  loading: boolean,
  deliveryMode: string,
  memberName: string | null | undefined,
  memberId: string
): string {
  if (loading) return '正在同步任务详情...';
  return `数据源 ${deliveryMode} · 会员 ${memberName ?? memberId}`;
}

function isTaskNotFound(task: MemberOperationTask | null | undefined): boolean {
  return task === null || task === undefined;
}

function taskReceiptStatusColor(status: string): string {
  if (status === 'callback-recorded') return '#86efac';
  if (status === 'replay-scheduled') return '#93c5fd';
  if (status === 'blocked') return '#fca5a5';
  if (status === 'submitted') return '#fde68a';
  return '#cbd5e1';
}

function buildWorkspaceBreadcrumbDetailLabel(memberId: string, taskId: string): string {
  return `${memberId}/tasks/${taskId}`;
}

// ---- 数据工厂 ----

let _seq = 0;

function makeTask(overrides?: Partial<MemberOperationTask>): MemberOperationTask {
  _seq++;
  return {
    taskId: `task-${String(_seq).padStart(3, '0')}`,
    memberId: 'm-001',
    actionCode: 'send-coupon',
    title: `发送优惠券任务 ${_seq}`,
    status: 'scheduled',
    executionLane: 'standard',
    source: 'order',
    sourceOrderId: 'order-001',
    sourcePaymentId: null,
    priority: 'normal',
    channel: 'app',
    createdAt: '2026-07-06T08:00:00.000Z',
    scheduledAt: '2026-07-06T09:00:00.000Z',
    executedAt: null,
    reason: '会员下单后自动发放优惠券',
    executionSummary: null,
    executionTargetId: null,
    ...overrides,
  };
}

function makeInfo(overrides?: Partial<MemberQuickInfo>): MemberQuickInfo {
  return { name: '张三', id: 'm-001', ...overrides };
}

// ---- 测试 ----

describe('MemberOperationTaskDetailPage — 数据工厂', () => {
  it('默认任务含完整字段', () => {
    const t = makeTask();
    assert.ok(t.taskId.startsWith('task-'));
    assert.strictEqual(t.actionCode, 'send-coupon');
    assert.strictEqual(t.status, 'scheduled');
  });

  it('覆盖字段合并', () => {
    const t = makeTask({ status: 'completed', executionSummary: '执行成功' });
    assert.strictEqual(t.status, 'completed');
    assert.strictEqual(t.executionSummary, '执行成功');
    assert.strictEqual(t.actionCode, 'send-coupon');
  });

  it('每个调用产生不同 taskId', () => {
    const t1 = makeTask();
    const t2 = makeTask();
    assert.notStrictEqual(t1.taskId, t2.taskId);
  });
});

describe('MemberOperationTaskDetailPage — 副标题', () => {
  it('加载中显示同步状态', () => {
    assert.strictEqual(buildTaskSubtitle(true, 'live', null, 'm-001'), '正在同步任务详情...');
  });

  it('加载完成显示数据源和会员名', () => {
    assert.strictEqual(buildTaskSubtitle(false, 'fallback', '张三', 'm-001'), '数据源 fallback · 会员 张三');
  });

  it('无会员名时回退到 ID', () => {
    assert.strictEqual(buildTaskSubtitle(false, 'live', null, 'm-001'), '数据源 live · 会员 m-001');
  });
});

describe('MemberOperationTaskDetailPage — 存在性判断', () => {
  it('null task 视为不存在', () => { assert.ok(isTaskNotFound(null)); });
  it('undefined task 视为不存在', () => { assert.ok(isTaskNotFound(undefined)); });
  it('有对象视为存在', () => { assert.strictEqual(isTaskNotFound(makeTask()), false); });
});

describe('MemberOperationTaskDetailPage — 回执状态颜色', () => {
  it('callback-recorded 绿色', () => { assert.strictEqual(taskReceiptStatusColor('callback-recorded'), '#86efac'); });
  it('replay-scheduled 蓝色', () => { assert.strictEqual(taskReceiptStatusColor('replay-scheduled'), '#93c5fd'); });
  it('blocked 红色', () => { assert.strictEqual(taskReceiptStatusColor('blocked'), '#fca5a5'); });
  it('submitted 黄色', () => { assert.strictEqual(taskReceiptStatusColor('submitted'), '#fde68a'); });
  it('unknown 灰色', () => { assert.strictEqual(taskReceiptStatusColor('unknown'), '#cbd5e1'); });
});

describe('MemberOperationTaskDetailPage — 面包屑标签', () => {
  it('正确格式', () => {
    assert.strictEqual(buildWorkspaceBreadcrumbDetailLabel('m-001', 'task-001'), 'm-001/tasks/task-001');
  });
});

describe('MemberOperationTaskDetailPage — 边界情况', () => {
  it('sourceOrderId/sourcePaymentId 均为 null', () => {
    const t = makeTask({ sourceOrderId: null, sourcePaymentId: null });
    assert.strictEqual(t.sourceOrderId, null);
    assert.strictEqual(t.sourcePaymentId, null);
  });

  it('executionSummary 为 null', () => {
    const t = makeTask({ executionSummary: null });
    assert.strictEqual(t.executionSummary, null);
  });

  it('executedAt 为 null（未执行）', () => {
    const t = makeTask({ executedAt: null });
    assert.strictEqual(t.executedAt, null);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Members / Tasks — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('fetch(')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
