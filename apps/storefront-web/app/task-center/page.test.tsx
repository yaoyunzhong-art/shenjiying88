/**
 * 门店任务中心页 L1 测试 — TaskCenterPage
 *
 * 测试覆盖:
 * - 页面文件存在性 & 默认导出
 * - 源文件结构检查（导入、组件、Mock数据）
 * - 任务类型 / 优先级 / 状态 全覆盖校验
 * - 标签、颜色、筛选选项常量校验
 * - SSR 渲染测试（静态标记验证）
 */
const assert = require('node:assert/strict');
const { describe, test, it } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const PAGE_PATH = path.join(__dirname, 'page.tsx');
const pageSource = fs.readFileSync(PAGE_PATH, 'utf-8');

describe('TaskCenterPage structure', () => {

  // ---- 文件存在 & 导出 ----

  test('页面文件存在', () => {
    assert.ok(fs.existsSync(PAGE_PATH));
  });

  test('页面导出默认函数组件', () => {
    assert.match(pageSource, /export default function TaskCenterPage/);
    assert.match(pageSource, /'use client'/);
  });

  test('页面导入必需的 UI 组件', () => {
    assert.ok(pageSource.includes("PageShell,"));
    assert.ok(pageSource.includes("KanbanBoard,"));
    assert.ok(pageSource.includes("EmptyState,"));
    assert.ok(pageSource.includes("StatCard,"));
    assert.ok(pageSource.includes("StatusBadge,"));
    assert.ok(pageSource.includes("useToast,"));
  });

  // ---- Mock 数据 ----

  test('generateMockTasks 返回 10 条任务', () => {
    const ids = pageSource.match(/id: 't-\d{3}'/g);
    assert.equal(ids?.length, 10, `Expected 10 tasks, got ${ids?.length}`);
  });

  test('Mock 任务包含所有 5 种类型', () => {
    assert.ok(pageSource.includes("type: 'inventory'"));
    assert.ok(pageSource.includes("type: 'member'"));
    assert.ok(pageSource.includes("type: 'device'"));
    assert.ok(pageSource.includes("type: 'schedule'"));
    assert.ok(pageSource.includes("type: 'alert'"));
  });

  test('Mock 任务包含所有 4 种优先级', () => {
    assert.ok(pageSource.includes("priority: 'critical'"));
    assert.ok(pageSource.includes("priority: 'high'"));
    assert.ok(pageSource.includes("priority: 'medium'"));
    assert.ok(pageSource.includes("priority: 'low'"));
  });

  test('Mock 任务包含所有 3 种状态', () => {
    assert.ok(pageSource.includes("status: 'pending'"));
    assert.ok(pageSource.includes("status: 'in_progress'"));
    assert.ok(pageSource.includes("status: 'done'"));
  });

  // ---- 常量 ----

  test('TYPE_LABELS 覆盖全部 5 种类型', () => {
    assert.ok(pageSource.includes("inventory: '库存'"));
    assert.ok(pageSource.includes("member: '会员'"));
    assert.ok(pageSource.includes("device: '设备'"));
    assert.ok(pageSource.includes("schedule: '排班'"));
    assert.ok(pageSource.includes("alert: '告警'"));
  });

  test('TYPE_COLORS 覆盖全部 5 种类型', () => {
    assert.ok(pageSource.includes("inventory: 'info'"));
    assert.ok(pageSource.includes("member: 'success'"));
    assert.ok(pageSource.includes("device: 'warning'"));
    assert.ok(pageSource.includes("schedule: 'neutral'"));
    assert.ok(pageSource.includes("alert: 'danger'"));
  });

  test('STATUS_LABELS 覆盖全部 3 种状态', () => {
    assert.ok(pageSource.includes("pending: '待处理'"));
    assert.ok(pageSource.includes("in_progress: '处理中'"));
    assert.ok(pageSource.includes("done: '已完成'"));
  });

  test('PriorityBadge 配置覆盖全部 4 种优先级', () => {
    assert.ok(pageSource.includes("critical: { label: '紧急'"));
    assert.ok(pageSource.includes("high: { label: '高'"));
    assert.ok(pageSource.includes("medium: { label: '中'"));
    assert.ok(pageSource.includes("low: { label: '低'"));
  });

  test('filterOptions 数组包含全部 6 项', () => {
    assert.ok(pageSource.includes("{ label: '全部', value: 'all' }"));
    assert.ok(pageSource.includes("{ label: '库存', value: 'inventory' }"));
    assert.ok(pageSource.includes("{ label: '会员', value: 'member' }"));
    assert.ok(pageSource.includes("{ label: '设备', value: 'device' }"));
    assert.ok(pageSource.includes("{ label: '排班', value: 'schedule' }"));
    assert.ok(pageSource.includes("{ label: '告警', value: 'alert' }"));
  });

  // ---- 子组件 ----

  test('包含 PriorityBadge 组件', () => {
    assert.ok(pageSource.includes("function PriorityBadge"));
    assert.ok(pageSource.includes("StatusBadge"));
  });

  test('包含 TaskTypeBadge 组件', () => {
    assert.ok(pageSource.includes("function TaskTypeBadge"));
  });

  // ---- 交互逻辑 ----

  test('handleCardMove 更新状态逻辑', () => {
    assert.ok(pageSource.includes("handleCardMove"));
    assert.ok(pageSource.includes("onCardMove"));
    assert.ok(pageSource.includes("toast.success"));
    assert.ok(pageSource.includes("任务状态已更新"));
  });

  test('handleCardMove 执行状态转换', () => {
    assert.ok(pageSource.includes("newStatus = targetColumnId as TaskStatus"));
    assert.ok(pageSource.includes("...t, status: newStatus"));
  });

  test('stats 计算包含超期逻辑', () => {
    assert.ok(pageSource.includes("t.dueDate < '2026-06-30'"));
  });

  // ---- 渲染标记 ----

  test('KanbanBoard 在 JSX 中渲染', () => {
    assert.ok(pageSource.includes('<KanbanBoard'));
  });

  test('统计卡片标签完整', () => {
    assert.ok(pageSource.includes('label="紧急任务"'));
    assert.ok(pageSource.includes('label="待处理"'));
    assert.ok(pageSource.includes('label="处理中"'));
    assert.ok(pageSource.includes('label="已超期"'));
  });

  test('看板列背景色配置', () => {
    assert.ok(pageSource.includes("bgColor: '#FEF3C7'"));
    assert.ok(pageSource.includes("bgColor: '#DBEAFE'"));
    assert.ok(pageSource.includes("bgColor: '#D1FAE5'"));
  });

  test('存在 data-testid 用于测试定位', () => {
    assert.ok(pageSource.includes('data-testid="task-center-kanban"'));
  });

  test('空状态处理: EmptyState + 暂无任务', () => {
    assert.ok(pageSource.includes('EmptyState'));
    assert.ok(pageSource.includes('暂无任务'));
  });

  // ---- Mock 数据内容 ----

  test('Mock 任务包含标签', () => {
    assert.ok(pageSource.includes("tags: ['补货', '预警']"));
    assert.ok(pageSource.includes("tags: ['温控', '紧急']"));
    assert.ok(pageSource.includes("tags: ['会员关怀', '活动']"));
  });

  test('Mock 任务分配人完整', () => {
    assert.ok(pageSource.includes('库房管理员'));
    assert.ok(pageSource.includes('客服主管'));
    assert.ok(pageSource.includes('前台主管'));
    assert.ok(pageSource.includes('店长'));
    assert.ok(pageSource.includes('设备管理员'));
    assert.ok(pageSource.includes('导购组'));
  });

  // ---- SSR 渲染验证 ----

  test('SSR: 渲染统计卡片和标题', () => {
    const React = require('react');
    const reactDomPath = PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js';
    const { renderToStaticMarkup } = require(reactDomPath);
    const TaskCenterPage = require(PAGE_PATH).default;

    const html = renderToStaticMarkup(React.createElement(TaskCenterPage));

    assert.ok(html.includes('紧急任务'));
    assert.ok(html.includes('待处理'));
    assert.ok(html.includes('处理中'));
    assert.ok(html.includes('已超期'));
    assert.ok(html.includes('门店任务中心'));
    assert.ok(html.includes('task-center-kanban'));
  });

  test('SSR: 筛选按钮全部渲染', () => {
    const React = require('react');
    const reactDomPath = PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js';
    const { renderToStaticMarkup } = require(reactDomPath);
    const TaskCenterPage = require(PAGE_PATH).default;

    const html = renderToStaticMarkup(React.createElement(TaskCenterPage));

    assert.ok(html.includes('任务类型筛选'));
    assert.ok(html.includes('全部'));
    assert.ok(html.includes('库存'));
    assert.ok(html.includes('会员'));
    assert.ok(html.includes('设备'));
    assert.ok(html.includes('排班'));
    assert.ok(html.includes('告警'));
  });

});
