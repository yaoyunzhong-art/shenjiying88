import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { QualityInspectorDashboard } = require('./QualityInspectorDashboard');

// ---- 测试数据 ----

const MOCK_METRICS = {
  storeCount: 5,
  totalItems: 84,
  passedItems: 72,
  failedItems: 12,
  passRate: 85.7,
  criticalIssues: 2,
};

const MOCK_TASKS = [
  {
    id: 't1',
    storeName: '朝阳旗舰店',
    area: 'environment',
    status: 'pending' as const,
    checkedCount: 0,
    totalCount: 12,
    scheduledAt: '08:30',
    priority: 'urgent' as const,
    deadline: '07-08 12:00',
  },
  {
    id: 't2',
    storeName: '海淀分店',
    area: 'device',
    status: 'in_progress' as const,
    checkedCount: 6,
    totalCount: 15,
    scheduledAt: '09:00',
    priority: 'normal' as const,
    deadline: '07-08 16:00',
  },
  {
    id: 't3',
    storeName: '西单店',
    area: 'safety',
    status: 'completed' as const,
    checkedCount: 10,
    totalCount: 10,
    scheduledAt: '07:30',
    priority: 'normal' as const,
    deadline: '07-08 10:00',
  },
  {
    id: 't4',
    storeName: '丰台店',
    area: 'hygiene',
    status: 'overdue' as const,
    checkedCount: 3,
    totalCount: 8,
    scheduledAt: '06:00',
    priority: 'urgent' as const,
    deadline: '07-07 18:00',
  },
];

const MOCK_ISSUES = [
  {
    id: 'i1',
    title: '消防通道堵塞',
    area: '安全',
    severity: 'critical' as const,
    status: 'pending' as const,
    reporter: '李四',
    createdAt: '07-07 14:30',
    deadline: '07-08 18:00',
    description: '朝阳店后门消防通道被杂物堵塞，需立即清理',
  },
  {
    id: 'i2',
    title: '冷藏设备温度异常',
    area: '设备',
    severity: 'major' as const,
    status: 'fail' as const,
    reporter: '王五',
    createdAt: '07-07 10:20',
    deadline: '07-09 12:00',
  },
  {
    id: 'i3',
    title: '员工着装不规范',
    area: '人员',
    severity: 'minor' as const,
    status: 'pending' as const,
    reporter: '赵六',
    createdAt: '07-08 08:15',
    deadline: '07-08 17:00',
  },
];

const MOCK_AREAS = [
  { id: 'a1', name: 'environment', total: 12, passed: 10, failed: 2, passRate: 83.3 },
  { id: 'a2', name: 'device', total: 15, passed: 9, failed: 6, passRate: 60 },
  { id: 'a3', name: 'safety', total: 10, passed: 10, failed: 0, passRate: 100 },
  { id: 'a4', name: 'hygiene', total: 8, passed: 5, failed: 3, passRate: 62.5 },
];

const BASE_PROPS = {
  inspectorName: '刘质检',
  employeeId: 'QC-0088',
  region: '北京朝阳区',
  dailyMetrics: MOCK_METRICS,
  tasks: MOCK_TASKS,
  issues: MOCK_ISSUES,
  areas: MOCK_AREAS,
  lastSyncAt: '09:30',
};

// ---- 测试套件 ----

describe('QualityInspectorDashboard', () => {
  // ── 基础渲染 ──
  test('renders dashboard title', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /质检员工作台/);
  });

  test('renders inspector profile with name, id and region', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /刘质检/);
    assert.match(html, /QC-0088/);
    assert.match(html, /北京朝阳区/);
  });

  test('renders default name when omitted', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, { dailyMetrics: MOCK_METRICS }));
    assert.match(html, /质检员/);
  });

  test('renders online badge', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /🟢/);
    assert.match(html, /在岗/);
  });

  // ── 加载状态 ──
  test('renders loading skeleton when loading is true', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, { loading: true }));
    assert.match(html, /data-testid="quality-inspector-dashboard-loading"/);
  });

  // ── 空状态 ──
  test('renders empty state when no data provided', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, {}));
    assert.match(html, /暂无质检任务/);
  });

  // ── 统计数据 ──
  test('renders daily metrics section', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /今日质检概览/);
    assert.match(html, /5/); // storeCount
    assert.match(html, /84/); // totalItems
    assert.match(html, /72/); // passedItems
    assert.match(html, /12/); // failedItems
    assert.match(html, /86%/); // passRate rounded
    assert.match(html, /2/); // criticalIssues
  });

  test('renders empty metrics section when dailyMetrics is undefined', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, { inspectorName: '测试' }));
    assert.doesNotMatch(html, /今日质检概览/);
  });

  test('handles zero metrics gracefully', () => {
    const zeroMetrics = {
      storeCount: 0,
      totalItems: 0,
      passedItems: 0,
      failedItems: 0,
      passRate: 0,
      criticalIssues: 0,
    };
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, { dailyMetrics: zeroMetrics }));
    assert.match(html, /0/);
    assert.match(html, /0%/);
  });

  // ── 紧急任务 ──
  test('renders urgent tasks section', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /紧急检查任务/);
    assert.match(html, /朝阳旗舰店/);
    assert.match(html, /丰台店/);
  });

  test('shows urgent task count badge', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /紧急检查任务 \(2\)/);
  });

  test('hides urgent section when no urgent tasks', () => {
    const normalTasks = MOCK_TASKS.map((t) => ({ ...t, priority: 'normal' as const }));
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, { ...BASE_PROPS, tasks: normalTasks })
    );
    assert.doesNotMatch(html, /🔴 紧急检查任务/);
  });

  test('renders urgent task action buttons', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /开始检查/);
    assert.match(html, /详情/);
  });

  // ── 区域巡检概况 ──
  test('renders area inspection overview', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /区域巡检概况/);
    assert.match(html, /83%/);
    assert.match(html, /100%/);
    assert.match(html, /60%/);
  });

  test('renders area pass count text', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /10\/12 通过/);
    assert.match(html, /5\/8 通过/);
  });

  test('hides areas when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, { dailyMetrics: MOCK_METRICS, tasks: MOCK_TASKS })
    );
    assert.doesNotMatch(html, /区域巡检概况/);
  });

  // ── 待处理问题 ──
  test('renders pending issues section', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /待处理质量问题/);
    assert.match(html, /消防通道堵塞/);
    assert.match(html, /冷藏设备温度异常/);
    assert.match(html, /员工着装不规范/);
  });

  test('renders issue severity labels', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /严重/); // critical
    assert.match(html, /主要/); // major
    assert.match(html, /轻微/); // minor
  });

  test('renders issue action buttons for pending status', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /处理/);
    assert.match(html, /上报/);
  });

  test('renders pending issue count in title', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    // i1 pending, i2 fail, i3 pending => 2+1=3 pending/fail
    assert.match(html, /\(3\)/);
  });

  test('renders issue description when provided', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /消防通道堵塞/);
    assert.match(html, /朝阳店后门消防通道/);
  });

  test('hides issues when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, { dailyMetrics: MOCK_METRICS, tasks: MOCK_TASKS })
    );
    assert.doesNotMatch(html, /待处理质量问题/);
  });

  // ── 任务列表 ──
  test('renders inspection task section title', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /今日检查任务/);
  });

  test('renders store names in urgent tasks and task table', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /朝阳旗舰店/);
    assert.match(html, /丰台店/);
  });

  test('renders task status badges', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /待检查/);
    assert.match(html, /检查中/);
    assert.match(html, /已完成/);
    assert.match(html, /已逾期/);
  });

  test('renders task progress', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /0\/12/);
    assert.match(html, /6\/15/);
    assert.match(html, /10\/10/);
  });

  test('renders task action buttons by status', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /开始/); // pending task
    assert.match(html, /继续/); // in_progress task
  });

  test('renders area labels in task table', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /环境/);
    assert.match(html, /设备/);
    assert.match(html, /安全/);
    assert.match(html, /卫生/);
  });

  test('hides tasks when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, { dailyMetrics: MOCK_METRICS, issues: MOCK_ISSUES })
    );
    assert.doesNotMatch(html, /今日检查任务/);
  });

  // ── 紧凑模式 ──
  test('compact mode renders with 2-column stats', () => {
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, { ...BASE_PROPS, compact: true })
    );
    assert.match(html, /今日质检概览/);
    assert.match(html, /5/); // storeCount visible
  });

  test('compact mode renders tasks table', () => {
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, { ...BASE_PROPS, compact: true })
    );
    assert.match(html, /今日检查任务/);
    assert.match(html, /朝阳旗舰店/);
  });

  // ── 自定义类名 ──
  test('accepts className prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, { ...BASE_PROPS, className: 'my-quality-dash' })
    );
    assert.match(html, /my-quality-dash/);
  });

  // ── 底部同步时间 ──
  test('renders sync info at bottom', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    assert.match(html, /数据同步于 09:30/);
  });

  test('omits sync info when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, { dailyMetrics: MOCK_METRICS })
    );
    assert.doesNotMatch(html, /数据同步于/);
  });

  // ── 回调触发 ──
  test('calls onStartInspection when start button clicked', () => {
    let calledId = '';
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, {
        ...BASE_PROPS,
        onStartInspection: (id: string) => { calledId = id; },
      })
    );
    assert.match(html, /开始检查/);
  });

  test('calls onHandleIssue when handle button clicked', () => {
    let calledId = '';
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, {
        ...BASE_PROPS,
        onHandleIssue: (id: string) => { calledId = id; },
      })
    );
    assert.match(html, /处理/);
  });

  test('calls onViewTaskDetail when detail button clicked', () => {
    let calledId = '';
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, {
        ...BASE_PROPS,
        onViewTaskDetail: (id: string) => { calledId = id; },
      })
    );
    assert.match(html, /详情/);
  });

  // ── 边界情况 ──
  test('handles high pass rate correctly', () => {
    const highPass = { ...MOCK_METRICS, passRate: 100, failedItems: 0, criticalIssues: 0 };
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, { ...BASE_PROPS, dailyMetrics: highPass })
    );
    assert.match(html, /100%/);
    assert.match(html, /重大问题/);
    assert.match(html, /0/); // zero critical issues displayed
  });

  test('handles single empty area array gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, { ...BASE_PROPS, areas: [] })
    );
    assert.doesNotMatch(html, /区域巡检概况/);
  });

  test('renders all area categories', () => {
    const html = renderToStaticMarkup(React.createElement(QualityInspectorDashboard, BASE_PROPS));
    // Area names shown as Chinese labels from AREA_LABELS
    assert.match(html, /环境/);
    assert.match(html, /设备/);
    assert.match(html, /安全/);
    assert.match(html, /卫生/);
  });

  test('renders with only tasks provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, { tasks: MOCK_TASKS.slice(0, 1) })
    );
    assert.match(html, /今日检查任务/);
    assert.match(html, /朝阳旗舰店/);
    assert.doesNotMatch(html, /今日质检概览/);
  });

  test('renders with only issues provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(QualityInspectorDashboard, { issues: MOCK_ISSUES.slice(0, 1) })
    );
    assert.match(html, /待处理质量问题/);
    assert.match(html, /消防通道堵塞/);
    assert.doesNotMatch(html, /今日质检概览/);
  });
});
