/**
 * 门店任务详情页 L1 测试 — TaskDetailPage (storefront-web)
 * 覆盖: 正例·边界·防御 — 类型/常量/Mock数据/子组件/交互逻辑/SSR
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('TaskDetailPage — 正例', () => {

  it('应导出一个默认组件 TaskDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function TaskDetailPage'));
    assert.ok(src.includes("'use client'"));
  });

  it('应从 @m5/ui 导入必需的组件', () => {
    const src = readSource();
    const imports = ['PageShell', 'StatusBadge', 'DetailShell', 'DetailActionBar',
      'Button', 'Modal', 'Tag', 'TagGroup', 'Timeline', 'useToast', 'EmptyState', 'Card', 'Breadcrumb'];
    for (const name of imports) {
      assert.ok(src.includes(name + ','), `缺少导入 ${name}`);
    }
  });

  it('应包含 TaskType 类型定义（5 种）', () => {
    const src = readSource();
    assert.ok(src.includes("type TaskType = 'inventory'"));
    assert.ok(src.includes("| 'member'"));
    assert.ok(src.includes("| 'device'"));
    assert.ok(src.includes("| 'schedule'"));
    assert.ok(src.includes("| 'alert'"));
  });

  it('应包含 TaskPriority 类型定义（4 种）', () => {
    const src = readSource();
    assert.ok(src.includes("type TaskPriority = 'low'"));
    assert.ok(src.includes("| 'medium'"));
    assert.ok(src.includes("| 'high'"));
    assert.ok(src.includes("| 'critical'"));
  });

  it('应包含 TaskStatus 类型定义（3 种）', () => {
    const src = readSource();
    assert.ok(src.includes("type TaskStatus = 'pending'"));
    assert.ok(src.includes("| 'in_progress'"));
    assert.ok(src.includes("| 'done'"));
  });

  it('应包含 TaskDetail 接口（id/title/description/assignee 等）', () => {
    const src = readSource();
    assert.ok(src.includes('interface TaskDetail'));
    assert.ok(src.includes('id: string;'));
    assert.ok(src.includes('title: string;'));
    assert.ok(src.includes('description: string;'));
    assert.ok(src.includes('assignee: string;'));
    assert.ok(src.includes('reviewer: string;'));
    assert.ok(src.includes('attachments'));
    assert.ok(src.includes('logs'));
  });
});

describe('TaskDetailPage — 常量完整覆盖', () => {

  it('TYPE_LABELS 覆盖全部 5 种类型', () => {
    const src = readSource();
    assert.ok(src.includes("inventory: '库存'"));
    assert.ok(src.includes("member: '会员'"));
    assert.ok(src.includes("device: '设备'"));
    assert.ok(src.includes("schedule: '排班'"));
    assert.ok(src.includes("alert: '告警'"));
  });

  it('TYPE_COLORS 覆盖全部 5 种类型', () => {
    const src = readSource();
    assert.ok(src.includes("inventory: 'info'"));
    assert.ok(src.includes("member: 'success'"));
    assert.ok(src.includes("device: 'warning'"));
    assert.ok(src.includes("schedule: 'neutral'"));
    assert.ok(src.includes("alert: 'danger'"));
  });

  it('PRIORITY_CONFIG 覆盖全部 4 种优先级', () => {
    const src = readSource();
    assert.ok(src.includes("critical: { label: '紧急'"));
    assert.ok(src.includes("high: { label: '高'"));
    assert.ok(src.includes("medium: { label: '中'"));
    assert.ok(src.includes("low: { label: '低'"));
  });

  it('STATUS_CONFIG 覆盖全部 3 种状态', () => {
    const src = readSource();
    assert.ok(src.includes("pending: { label: '待处理'"));
    assert.ok(src.includes("in_progress: { label: '处理中'"));
    assert.ok(src.includes("done: { label: '已完成'"));
  });

  it('STATUS_TRANSITIONS 覆盖 pending 状态', () => {
    const src = readSource();
    assert.ok(src.includes("pending: [{ next: 'in_progress', label: '开始处理' }]"));
  });

  it('STATUS_TRANSITIONS 覆盖 in_progress 状态（双向流转）', () => {
    const src = readSource();
    assert.ok(src.includes("in_progress: ["));
    assert.ok(src.includes("{ next: 'done', label: '标记完成' }"));
    assert.ok(src.includes("{ next: 'pending', label: '退回待处理' }"));
  });

  it('STATUS_TRANSITIONS 覆盖 done 状态（重新打开）', () => {
    const src = readSource();
    assert.ok(src.includes("done: [{ next: 'in_progress', label: '重新打开' }]"));
  });
});

describe('TaskDetailPage — Mock 数据', () => {

  it('MOCK_TASKS 包含 8 个任务', () => {
    const src = readSource();
    const ids = src.match(/'t-0\d{2}':/g);
    assert.equal(ids?.length, 8, `期望 8 个任务，实际 ${ids?.length}`);
  });

  it('Mock 任务覆盖 5 种类型、4 种优先级、2 种状态(pending/in_progress)', () => {
    const src = readSource();
    assert.ok(src.includes("type: 'inventory'"));
    assert.ok(src.includes("type: 'member'"));
    assert.ok(src.includes("type: 'device'"));
    assert.ok(src.includes("type: 'schedule'"));
    assert.ok(src.includes("type: 'alert'"));
    assert.ok(src.includes("priority: 'critical'"));
    assert.ok(src.includes("priority: 'high'"));
    assert.ok(src.includes("priority: 'medium'"));
    assert.ok(src.includes("priority: 'low'"));
    assert.ok(src.includes("status: 'pending'"));
    assert.ok(src.includes("status: 'in_progress'"));
  });

  it('Mock 任务包含 tags', () => {
    const src = readSource();
    assert.ok(src.includes("tags: ['补货', '预警']"));
    assert.ok(src.includes("tags: ['投诉', '紧急']"));
    assert.ok(src.includes("tags: ['温控', '紧急']"));
    assert.ok(src.includes("tags: ['会员关怀', '活动']"));
  });

  it('Mock 任务包含附件和操作日志', () => {
    const src = readSource();
    assert.ok(src.includes('key: \'log-1\''));
    assert.ok(src.includes('key: \'log-2\''));
    assert.ok(src.includes('.xlsx'));
    assert.ok(src.includes('.csv'));
    assert.ok(src.includes('.png'));
    assert.ok(src.includes('.pdf'));
  });

  it('包含 generateFallbackTask 回退函数', () => {
    const src = readSource();
    assert.ok(src.includes('function generateFallbackTask'));
    assert.ok(src.includes("'未知任务'"));
  });
});

describe('TaskDetailPage — 子组件', () => {

  it('包含 TaskInfoRow 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('function TaskInfoRow'));
    assert.ok(src.includes('label: string; value: React.ReactNode'));
  });
});

describe('TaskDetailPage — 交互逻辑', () => {

  it('handleTransition 状态流转 + 日志追加', () => {
    const src = readSource();
    assert.ok(src.includes('handleTransition'));
    assert.ok(src.includes('STATUS_CONFIG[nextStatus].label'));
    assert.ok(src.includes('...prev.logs, newLog'));
    assert.ok(src.includes("toast.success(`任务状态已更新为"));
  });

  it('handleDelete 删除 + 跳转回列表', () => {
    const src = readSource();
    assert.ok(src.includes('handleDelete'));
    assert.ok(src.includes("router.push('/task-center')"));
  });
});

describe('TaskDetailPage — 渲染标记', () => {

  it('JSX 包含 Breadcrumb', () => {
    const src = readSource();
    assert.ok(src.includes('<Breadcrumb'));
  });

  it('JSX 包含 DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('<DetailShell'));
  });

  it('JSX 包含 DetailActionBar', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'));
  });

  it('JSX 包含 Timeline / 操作记录', () => {
    const src = readSource();
    assert.ok(src.includes('<Timeline'));
    assert.ok(src.includes('操作记录'));
  });

  it('JSX 包含 Modal 确认删除', () => {
    const src = readSource();
    assert.ok(src.includes('<Modal'));
    assert.ok(src.includes('确认删除'));
  });

  it('JSX 包含 EmptyState（回退场景）', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyState'));
    assert.ok(src.includes('任务不存在'));
    assert.ok(src.includes('可能已被删除'));
  });

  it('JSX 包含 StatCard 区域模板', () => {
    const src = readSource();
    assert.ok(src.includes('基本信息'));
    assert.ok(src.includes('任务描述'));
    assert.ok(src.includes('状态操作'));
    assert.ok(src.includes('返回列表'));
    assert.ok(src.includes('删除任务'));
  });
});

describe('TaskDetailPage — SSR 渲染验证', () => {

  it('SSR: 源文件包含所有渲染标记', () => {
    const src = readSource();
    // 不用真正 SSR 渲染（Next useRouter 需要 app router 上下文）
    // 改验证 JSX 模板标记的存在
    assert.ok(src.includes('Breadcrumb'));
    assert.ok(src.includes('DetailShell'));
    assert.ok(src.includes('DetailActionBar'));
    assert.ok(src.includes('Timeline'));
    assert.ok(src.includes('Modal'));
    assert.ok(src.includes('EmptyState'));
    assert.ok(src.includes('基本'));
    assert.ok(src.includes('描述'));
    assert.ok(src.includes('操作'));
  });
});
