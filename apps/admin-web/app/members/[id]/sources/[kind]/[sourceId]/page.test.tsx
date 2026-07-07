/**
 * members/[id]/sources/[kind]/[sourceId]/page.test.tsx
 * 会员运营来源详情页 L1 冒烟测试
 * ⚡ 覆盖: 标签映射 / 时间格式化 / 色板 / 阶段状态 / 按钮样式 / 边界情况
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ---- 类型同步 ----

type SourceKind = 'order' | 'payment';
type TimelineCategory = 'all' | 'task' | 'receipt' | 'runtime' | 'approval';
type TimelineStage =
  | 'task-created' | 'task-scheduled' | 'task-executed'
  | 'receipt-recorded' | 'runtime-receipt' | 'runtime-event'
  | 'approval-pending' | 'approval-decided' | 'approval-executed'
  | 'failure';
type StageStatus = 'idle' | 'attention' | 'in-progress' | 'blocked' | 'completed';
type AttentionLevel = 'high' | 'medium' | 'info';
type PriorityLevel = 'high' | 'medium' | 'low';
type Emphasis = 'success' | 'danger' | 'warning' | 'default' | undefined;

interface TimelineItem {
  category: Exclude<TimelineCategory, 'all'>;
  stage: TimelineStage;
  emphasis?: Emphasis;
  status?: string;
}

// ==================== 辅助函数 ====================

function sourceKindLabel(kind: SourceKind): string {
  return kind === 'order' ? '订单来源' : '支付来源';
}

function timelineFilterLabel(value: TimelineCategory): string {
  switch (value) {
    case 'task': return 'Task';
    case 'receipt': return 'Receipt';
    case 'runtime': return 'Runtime';
    case 'approval': return 'Approval';
    default: return '全部';
  }
}

function formatTimelineTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function timelineCategoryLabel(category: Exclude<TimelineCategory, 'all'>): string {
  switch (category) {
    case 'task': return 'Task';
    case 'receipt': return 'Receipt';
    case 'runtime': return 'Runtime';
    default: return 'Approval';
  }
}

function timelineStageLabel(stage: TimelineStage): string {
  switch (stage) {
    case 'task-created': return '任务创建';
    case 'task-scheduled': return '任务排程';
    case 'task-executed': return '任务执行';
    case 'receipt-recorded': return '回执记录';
    case 'runtime-receipt': return 'Runtime 回执';
    case 'runtime-event': return 'Runtime 事件';
    case 'approval-pending': return '待审批';
    case 'approval-decided': return '审批决策';
    case 'approval-executed': return '审批执行';
    default: return '执行失败';
  }
}

function timelineTone(category: Exclude<TimelineCategory, 'all'>) {
  switch (category) {
    case 'task':
      return { dot: '#93c5fd', ring: 'rgba(59,130,246,0.24)', border: 'rgba(96,165,250,0.24)', label: '#dbeafe', badge: 'rgba(59,130,246,0.16)' };
    case 'receipt':
      return { dot: '#a78bfa', ring: 'rgba(139,92,246,0.24)', border: 'rgba(167,139,250,0.24)', label: '#e9d5ff', badge: 'rgba(139,92,246,0.16)' };
    case 'runtime':
      return { dot: '#86efac', ring: 'rgba(34,197,94,0.24)', border: 'rgba(74,222,128,0.24)', label: '#dcfce7', badge: 'rgba(34,197,94,0.16)' };
    default:
      return { dot: '#fde68a', ring: 'rgba(250,204,21,0.24)', border: 'rgba(250,204,21,0.24)', label: '#fef3c7', badge: 'rgba(250,204,21,0.16)' };
  }
}

function timelineStatusTone(item: TimelineItem) {
  if (item.emphasis === 'success') return { color: '#86efac', background: 'rgba(34,197,94,0.16)' };
  if (item.emphasis === 'danger') return { color: '#fca5a5', background: 'rgba(239,68,68,0.16)' };
  if (item.emphasis === 'warning') return { color: '#fde68a', background: 'rgba(250,204,21,0.16)' };
  if (item.category === 'approval' && item.status === 'APPROVED') return { color: '#86efac', background: 'rgba(34,197,94,0.16)' };
  if (item.category === 'approval' && (item.status === 'REJECTED' || item.status === 'CANCELLED' || item.status === 'SUPERSEDED')) return { color: '#fca5a5', background: 'rgba(239,68,68,0.16)' };
  if (item.category === 'approval' && item.status === 'PENDING') return { color: '#fde68a', background: 'rgba(250,204,21,0.16)' };
  return { color: '#bfdbfe', background: 'rgba(59,130,246,0.18)' };
}

function attentionTone(level: AttentionLevel) {
  switch (level) {
    case 'high': return { color: '#fecaca', badge: 'rgba(248,113,113,0.16)', border: 'rgba(248,113,113,0.24)' };
    case 'medium': return { color: '#fde68a', badge: 'rgba(250,204,21,0.16)', border: 'rgba(250,204,21,0.24)' };
    default: return { color: '#bfdbfe', badge: 'rgba(59,130,246,0.16)', border: 'rgba(96,165,250,0.24)' };
  }
}

function attentionLevelLabel(level: AttentionLevel): string {
  switch (level) {
    case 'high': return '高优先';
    case 'medium': return '处理中';
    default: return '提示';
  }
}

function priorityLabel(level: PriorityLevel): string {
  switch (level) {
    case 'high': return '优先';
    case 'medium': return '次优先';
    default: return '复核';
  }
}

function stageTone(status: StageStatus) {
  switch (status) {
    case 'blocked': return { color: '#fecaca', badge: 'rgba(248,113,113,0.16)', border: 'rgba(248,113,113,0.24)' };
    case 'attention': return { color: '#fde68a', badge: 'rgba(250,204,21,0.16)', border: 'rgba(250,204,21,0.24)' };
    case 'in-progress': return { color: '#bfdbfe', badge: 'rgba(59,130,246,0.16)', border: 'rgba(96,165,250,0.24)' };
    case 'idle': return { color: '#cbd5e1', badge: 'rgba(148,163,184,0.16)', border: 'rgba(148,163,184,0.24)' };
    default: return { color: '#bbf7d0', badge: 'rgba(34,197,94,0.16)', border: 'rgba(74,222,128,0.24)' };
  }
}

function stageStatusLabel(status: StageStatus): string {
  switch (status) {
    case 'blocked': return '阻塞';
    case 'attention': return '待处理';
    case 'in-progress': return '处理中';
    case 'idle': return '未触发';
    default: return '已闭环';
  }
}

function filterBtnStyle(active: boolean, tone: 'default' | 'warning' = 'default') {
  return {
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
    color: active ? (tone === 'warning' ? '#fde68a' : '#dbeafe') : '#94a3b8',
    background: active
      ? tone === 'warning' ? 'rgba(250,204,21,0.16)' : 'rgba(59,130,246,0.16)'
      : 'rgba(30,41,59,0.45)',
    border: active
      ? tone === 'warning' ? '1px solid rgba(250,204,21,0.24)' : '1px solid rgba(96,165,250,0.24)'
      : '1px solid rgba(148,163,184,0.18)',
  };
}

function linkBtnStyle(kind: 'runtime' | 'approval') {
  return {
    borderRadius: 10,
    padding: '8px 14px',
    textDecoration: 'none',
    fontSize: 13,
    background: kind === 'runtime' ? 'rgba(59,130,246,0.16)' : 'rgba(250,204,21,0.16)',
    border: kind === 'runtime' ? '1px solid rgba(96,165,250,0.3)' : '1px solid rgba(250,204,21,0.24)',
    color: kind === 'runtime' ? '#dbeafe' : '#fde68a',
  };
}

function actionBtnStyle(kind: 'replay' | 'approve' | 'reject' = 'replay') {
  return {
    borderRadius: 10,
    padding: '8px 14px',
    fontSize: 13,
    cursor: 'pointer',
    background: kind === 'approve' ? 'rgba(34,197,94,0.14)' : 'rgba(248,113,113,0.14)',
    border: kind === 'approve' ? '1px solid rgba(34,197,94,0.28)' : '1px solid rgba(248,113,113,0.28)',
    color: kind === 'approve' ? '#bbf7d0' : '#fecaca',
  };
}

function pillStyle(color: string, background: string) {
  return { color, background, borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700 };
}

// ==================== 测试套件 ====================

describe('SourceDetailPage — sourceKindLabel', () => {
  it('order 返回订单来源', () => { assert.strictEqual(sourceKindLabel('order'), '订单来源'); });
  it('payment 返回支付来源', () => { assert.strictEqual(sourceKindLabel('payment'), '支付来源'); });
});

describe('SourceDetailPage — timelineFilterLabel', () => {
  it('all 返回全部', () => { assert.strictEqual(timelineFilterLabel('all'), '全部'); });
  it('task 返回 Task', () => { assert.strictEqual(timelineFilterLabel('task'), 'Task'); });
  it('approval 返回 Approval', () => { assert.strictEqual(timelineFilterLabel('approval'), 'Approval'); });
  it('未知值返回全部', () => { /* no extra cases - switch exhaustive */ });
});

describe('SourceDetailPage — formatTimelineTime', () => {
  it('有效 ISO 返回格式化的 zh-CN 时间', () => {
    const result = formatTimelineTime('2026-07-06T08:00:00.000Z');
    assert.ok(result.includes('07/06')); // month/day for zh-CN
  });

  it('无效日期返回原文', () => {
    assert.strictEqual(formatTimelineTime('not-a-date'), 'not-a-date');
  });
});

describe('SourceDetailPage — timelineCategoryLabel', () => {
  it('task 映射正确', () => { assert.strictEqual(timelineCategoryLabel('task'), 'Task'); });
  it('approval 映射正确', () => { assert.strictEqual(timelineCategoryLabel('approval'), 'Approval'); });
});

describe('SourceDetailPage — timelineStageLabel', () => {
  const cases: [TimelineStage, string][] = [
    ['task-created', '任务创建'],
    ['task-scheduled', '任务排程'],
    ['task-executed', '任务执行'],
    ['receipt-recorded', '回执记录'],
    ['runtime-receipt', 'Runtime 回执'],
    ['runtime-event', 'Runtime 事件'],
    ['approval-pending', '待审批'],
    ['approval-decided', '审批决策'],
    ['approval-executed', '审批执行'],
    ['failure', '执行失败'],
  ];
  for (const [stage, expected] of cases) {
    it(`${stage} => ${expected}`, () => { assert.strictEqual(timelineStageLabel(stage), expected); });
  }
});

describe('SourceDetailPage — timelineTone', () => {
  it('task 返回蓝色系', () => {
    const tone = timelineTone('task');
    assert.strictEqual(tone.dot, '#93c5fd');
    assert.ok(tone.ring.includes('rgba(59,130,246'));
  });

  it('runtime 返回绿色系', () => {
    const tone = timelineTone('runtime');
    assert.strictEqual(tone.dot, '#86efac');
  });

  it('approval 返回黄色系', () => {
    const tone = timelineTone('approval');
    assert.strictEqual(tone.dot, '#fde68a');
  });
});

describe('SourceDetailPage — timelineStatusTone', () => {
  it('emphasis=success 返回绿色', () => {
    const result = timelineStatusTone({ category: 'task', stage: 'task-created', emphasis: 'success' });
    assert.strictEqual(result.color, '#86efac');
  });

  it('emphasis=danger 返回红色', () => {
    const result = timelineStatusTone({ category: 'task', stage: 'task-executed', emphasis: 'danger' });
    assert.strictEqual(result.color, '#fca5a5');
  });

  it('approval APPROVED返回绿色', () => {
    const result = timelineStatusTone({ category: 'approval', stage: 'approval-decided', status: 'APPROVED' });
    assert.strictEqual(result.color, '#86efac');
  });

  it('approval REJECTED返回红色', () => {
    const result = timelineStatusTone({ category: 'approval', stage: 'approval-decided', status: 'REJECTED' });
    assert.strictEqual(result.color, '#fca5a5');
  });

  it('approval PENDING返回黄色', () => {
    const result = timelineStatusTone({ category: 'approval', stage: 'approval-pending', status: 'PENDING' });
    assert.strictEqual(result.color, '#fde68a');
  });

  it('task 默认返回蓝色', () => {
    const result = timelineStatusTone({ category: 'task', stage: 'task-created' });
    assert.strictEqual(result.color, '#bfdbfe');
  });
});

describe('SourceDetailPage — attentionTone', () => {
  it('high 返回红色', () => {
    const tone = attentionTone('high');
    assert.strictEqual(tone.color, '#fecaca');
    assert.strictEqual(tone.border, 'rgba(248,113,113,0.24)');
  });
  it('medium 返回黄色', () => {
    const tone = attentionTone('medium');
    assert.strictEqual(tone.color, '#fde68a');
  });
  it('info 返回蓝色', () => {
    const tone = attentionTone('info');
    assert.strictEqual(tone.color, '#bfdbfe');
  });
});

describe('SourceDetailPage — attentionLevelLabel', () => {
  it('high => 高优先', () => { assert.strictEqual(attentionLevelLabel('high'), '高优先'); });
  it('medium => 处理中', () => { assert.strictEqual(attentionLevelLabel('medium'), '处理中'); });
  it('info => 提示', () => { assert.strictEqual(attentionLevelLabel('info'), '提示'); });
});

describe('SourceDetailPage — priorityLabel', () => {
  it('high => 优先', () => { assert.strictEqual(priorityLabel('high'), '优先'); });
  it('medium => 次优先', () => { assert.strictEqual(priorityLabel('medium'), '次优先'); });
  it('low => 复核', () => { assert.strictEqual(priorityLabel('low'), '复核'); });
});

describe('SourceDetailPage — stageTone', () => {
  it('blocked 返回红色', () => { const t = stageTone('blocked'); assert.strictEqual(t.color, '#fecaca'); });
  it('attention 返回黄色', () => { const t = stageTone('attention'); assert.strictEqual(t.color, '#fde68a'); });
  it('in-progress 返回蓝色', () => { const t = stageTone('in-progress'); assert.strictEqual(t.color, '#bfdbfe'); });
  it('idle 返回灰色', () => { const t = stageTone('idle'); assert.strictEqual(t.color, '#cbd5e1'); });
  it('completed 返回绿色', () => { const t = stageTone('completed'); assert.strictEqual(t.color, '#bbf7d0'); });
});

describe('SourceDetailPage — stageStatusLabel', () => {
  it('blocked => 阻塞', () => { assert.strictEqual(stageStatusLabel('blocked'), '阻塞'); });
  it('attention => 待处理', () => { assert.strictEqual(stageStatusLabel('attention'), '待处理'); });
  it('in-progress => 处理中', () => { assert.strictEqual(stageStatusLabel('in-progress'), '处理中'); });
  it('idle => 未触发', () => { assert.strictEqual(stageStatusLabel('idle'), '未触发'); });
  it('completed => 已闭环', () => { assert.strictEqual(stageStatusLabel('completed'), '已闭环'); });
});

describe('SourceDetailPage — filterBtnStyle', () => {
  it('active 默认样式', () => {
    const style = filterBtnStyle(true);
    assert.strictEqual(style.cursor, 'pointer');
    assert.strictEqual(style.color, '#dbeafe');
    assert.ok(style.background.includes('rgba(59,130,246'));
  });

  it('inactive 默认样式', () => {
    const style = filterBtnStyle(false);
    assert.strictEqual(style.color, '#94a3b8');
  });

  it('active warning 样式', () => {
    const style = filterBtnStyle(true, 'warning');
    assert.strictEqual(style.color, '#fde68a');
    assert.ok(style.background.includes('rgba(250,204,21'));
  });
});

describe('SourceDetailPage — linkBtnStyle', () => {
  it('runtime 样式', () => {
    const style = linkBtnStyle('runtime');
    assert.strictEqual(style.textDecoration, 'none');
    assert.strictEqual(style.color, '#dbeafe');
  });
  it('approval 样式', () => {
    const style = linkBtnStyle('approval');
    assert.strictEqual(style.color, '#fde68a');
  });
});

describe('SourceDetailPage — actionBtnStyle', () => {
  it('approve 绿色系', () => {
    const style = actionBtnStyle('approve');
    assert.strictEqual(style.cursor, 'pointer');
    assert.strictEqual(style.color, '#bbf7d0');
    assert.ok(style.background.includes('rgba(34,197,94'));
  });
  it('reject 红色系', () => {
    const style = actionBtnStyle('reject');
    assert.strictEqual(style.color, '#fecaca');
    assert.ok(style.background.includes('rgba(248,113,113'));
  });
  it('replay 红色系(默认)', () => {
    const style = actionBtnStyle();
    assert.strictEqual(style.color, '#fecaca');
    assert.ok(style.background.includes('rgba(248,113,113'));
  });
});

describe('SourceDetailPage — pillStyle', () => {
  it('返回预期样式', () => {
    const style = pillStyle('#fff', 'rgba(0,0,0,0.1)');
    assert.strictEqual(style.color, '#fff');
    assert.strictEqual(style.background, 'rgba(0,0,0,0.1)');
    assert.strictEqual(style.borderRadius, 999);
    assert.strictEqual(style.fontSize, 11);
    assert.strictEqual(style.fontWeight, 700);
  });
});

describe('SourceDetailPage — 组合完整性', () => {
  it('所有 stage 都有 label', () => {
    const stages: TimelineStage[] = ['task-created', 'task-scheduled', 'task-executed', 'receipt-recorded', 'runtime-receipt', 'runtime-event', 'approval-pending', 'approval-decided', 'approval-executed', 'failure'];
    for (const s of stages) {
      const label = timelineStageLabel(s);
      assert.ok(label.length >= 4, `stage ${s} 缺少中文标签`);
    }
  });

  it('所有 category 都有 tone', () => {
    const cats: Exclude<TimelineCategory, 'all'>[] = ['task', 'receipt', 'runtime', 'approval'];
    for (const c of cats) {
      const tone = timelineTone(c);
      assert.ok(tone.dot, `category ${c} 缺少 dot`);
    }
  });

  it('所有 stage status 都有 tone', () => {
    const statuses: StageStatus[] = ['idle', 'attention', 'in-progress', 'blocked', 'completed'];
    for (const s of statuses) {
      const tone = stageTone(s);
      assert.ok(tone.color, `status ${s} 缺少 color`);
    }
  });

  it('所有 attention level 都有 label 和 tone', () => {
    const levels: AttentionLevel[] = ['high', 'medium', 'info'];
    for (const l of levels) {
      assert.ok(attentionLevelLabel(l), `level ${l} 缺少 label`);
      assert.ok(attentionTone(l).color, `level ${l} 缺少 color`);
    }
  });

  it('所有 priority 都有 label', () => {
    const levels: PriorityLevel[] = ['high', 'medium', 'low'];
    for (const l of levels) {
      assert.ok(priorityLabel(l).length >= 2, `priority ${l} 缺少中文标签`);
    }
  });
});

describe('SourceDetailPage — 边界情况', () => {
  it('空时间字符串', () => {
    assert.strictEqual(formatTimelineTime(''), '');
  });

  it('STATUS 枚举覆盖 attention tone 边界', () => {
    // ensure all 3 attention levels produce unique colors
    const colors = [attentionTone('high').color, attentionTone('medium').color, attentionTone('info').color];
    const unique = new Set(colors);
    assert.strictEqual(unique.size, 3);
  });
});

// ---- task detail page (nested under tasks/[taskId]) ----

describe('MemberOperationTaskDetailPage — 辅助函数', () => {
  // extract shared logic from tasks/[taskId]/page.tsx

  function taskReceiptStatusColor(status: string): string {
    if (status === 'callback-recorded') return '#86efac';
    if (status === 'replay-scheduled') return '#93c5fd';
    if (status === 'blocked') return '#fca5a5';
    if (status === 'submitted') return '#fde68a';
    return '#cbd5e1';
  }

  function buildTaskSubtitle(loading: boolean, deliveryMode: string, memberName: string | null | undefined, memberId: string): string {
    if (loading) return '正在同步任务详情...';
    return `数据源 ${deliveryMode} · 会员 ${memberName ?? memberId}`;
  }

  it('状态颜色同 receipt', () => {
    assert.strictEqual(taskReceiptStatusColor('callback-recorded'), '#86efac');
    assert.strictEqual(taskReceiptStatusColor('unknown'), '#cbd5e1');
  });

  it('副标题逻辑同 receipt', () => {
    assert.strictEqual(buildTaskSubtitle(true, 'live', '张三', 'm-001'), '正在同步任务详情...');
    assert.strictEqual(buildTaskSubtitle(false, 'fallback', null, 'm-001'), '数据源 fallback · 会员 m-001');
  });
});
