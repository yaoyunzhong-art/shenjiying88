import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AssistantManagerDashboard } = require('./AssistantManagerDashboard');

const BASE_PROPS = {
  storeName: '朝阳旗舰店',
  assistantName: '王强',
  peopleSummary: {
    totalStaff: 28,
    onDuty: 16,
    onLeave: 3,
    trainingRate: 72,
  },
  staffSchedules: [
    { id: 's1', name: '李华', role: '导购', shift: '早班 08:00-14:00', attendance: 'on_time', todaySales: 3200, serviceScore: 4.5 },
    { id: 's2', name: '张伟', role: '收银', shift: '早班 08:00-14:00', attendance: 'on_time', todaySales: 0, serviceScore: 5 },
    { id: 's3', name: '赵丽', role: '导购', shift: '中班 14:00-20:00', attendance: 'late', todaySales: 1200, serviceScore: 3.5 },
    { id: 's4', name: '陈明', role: '库存', shift: '早班 08:00-14:00', attendance: 'absent' },
    { id: 's5', name: '周洁', role: '导购', shift: '中班 14:00-20:00', attendance: 'leave' },
  ],
  qualityMetrics: {
    totalReviews: 86,
    positiveRate: 94.2,
    negativeCount: 2,
    pendingComplaints: 1,
    serviceCompliance: 91.5,
    mysteryShopperScore: 88,
  },
  trainingItems: [
    { id: 't1', title: '新品知识培训', enrolledCount: 20, completedCount: 15, deadline: '2026-06-28', status: 'in_progress' },
    { id: 't2', title: '服务礼仪规范', enrolledCount: 20, completedCount: 20, deadline: '2026-06-20', status: 'completed' },
    { id: 't3', title: '消防安全演练', enrolledCount: 28, completedCount: 10, deadline: '2026-06-25', status: 'overdue' },
  ],
  handover: {
    currentShift: '早班 → 中班',
    items: [
      { id: 'h1', category: 'revenue', summary: '早班营收 ¥32,500 已交班', priority: 'high', resolved: true },
      { id: 'h2', category: 'inventory', summary: 'SKU-023 库存剩余 3 件，需补货', priority: 'high', resolved: false },
      { id: 'h3', category: 'personnel', summary: '中班缺 1 名收银员', priority: 'medium', resolved: false },
      { id: 'h4', category: 'device', summary: '前台打印机硒鼓需更换', priority: 'low', resolved: false },
    ],
  },
  quickActions: [
    { key: 'schedule', label: '排班管理', primary: true },
    { key: 'training', label: '培训任务' },
    { key: 'report', label: '交接班报告' },
  ],
  lastSyncAt: '18:30',
};

describe('AssistantManagerDashboard', () => {
  test('renders store name and title', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, BASE_PROPS));
    assert.match(html, /朝阳旗舰店/);
    assert.match(html, /data-testid="asstmgr-title"/);
    assert.match(html, /助理经理工作台/);
  });

  test('renders default title when no storeName', () => {
    const { storeName, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, rest));
    assert.match(html, /门店 · 助理经理工作台/);
  });

  test('shows assistant name in header', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, BASE_PROPS));
    assert.match(html, /王强/);
  });

  test('renders people summary QuickStats', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, BASE_PROPS));
    assert.match(html, /在编员工/);
    assert.match(html, /今日在岗/);
    assert.match(html, /培训完成率/);
    assert.match(html, /28/);
    assert.match(html, /16/);
    assert.match(html, /72%/);
  });

  test('renders quick action buttons', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, BASE_PROPS));
    assert.match(html, /data-testid="asstmgr-quick-actions"/);
    assert.match(html, /排班管理/);
    assert.match(html, /培训任务/);
    assert.match(html, /交接班报告/);
  });

  test('renders quality metrics section', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, BASE_PROPS));
    assert.match(html, /data-testid="asstmgr-quality"/);
    assert.match(html, /服务质量监控/);
    assert.match(html, /好评率/);
    assert.match(html, /服务达标率/);
    assert.match(html, /待处理投诉/);
    assert.match(html, /差评/);
    assert.match(html, /神秘顾客评分/);
    assert.match(html, /88/);
  });

  test('renders staff schedules section', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, BASE_PROPS));
    assert.match(html, /data-testid="asstmgr-staff"/);
    assert.match(html, /今日排班考勤/);
    assert.match(html, /李华/);
    assert.match(html, /张伟/);
    assert.match(html, /赵丽/);
    assert.match(html, /陈明/);
    assert.match(html, /周洁/);
    assert.match(html, /\(5 人\)/);
  });

  test('renders attendance status badges', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, BASE_PROPS));
    // on_time, late, absent, leave
    assert.match(html, /在岗/);
    assert.match(html, /迟到/);
    assert.match(html, /缺勤/);
    assert.match(html, /请假/);
  });

  test('renders training section', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, BASE_PROPS));
    assert.match(html, /data-testid="asstmgr-training"/);
    assert.match(html, /培训任务/);
    assert.match(html, /新品知识培训/);
    assert.match(html, /服务礼仪规范/);
    assert.match(html, /消防安全演练/);
    assert.match(html, /15\/20/);
    assert.match(html, /20\/20/);
    assert.match(html, /10\/28/);
  });

  test('renders handover section', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, BASE_PROPS));
    assert.match(html, /data-testid="asstmgr-handover"/);
    assert.match(html, /交接班事项/);
    assert.match(html, /早班 → 中班/);
    assert.match(html, /早班营收 ¥32,500 已交班/);
    assert.match(html, /SKU-023 库存剩余 3 件，需补货/);
    assert.match(html, /中班缺 1 名收银员/);
  });

  test('shows resolved status on handover items', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, BASE_PROPS));
    assert.match(html, /已处理/);
    assert.match(html, /重要/);
    assert.match(html, /一般/);
  });

  test('renders loading skeleton', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, {
      ...BASE_PROPS,
      loading: true,
    }));
    assert.match(html, /data-testid="asstmgr-loading"/);
    assert.match(html, /正在加载门店人事数据/);
    assert.doesNotMatch(html, /data-testid="asstmgr-root"/);
  });

  test('renders without quality when not provided', () => {
    const { qualityMetrics, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, rest));
    assert.doesNotMatch(html, /data-testid="asstmgr-quality"/);
    assert.doesNotMatch(html, /服务质量监控/);
  });

  test('renders without handover when not provided', () => {
    const { handover, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, rest));
    assert.doesNotMatch(html, /data-testid="asstmgr-handover"/);
  });

  test('renders without quickActions when not provided', () => {
    const { quickActions, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, rest));
    assert.doesNotMatch(html, /data-testid="asstmgr-quick-actions"/);
    assert.doesNotMatch(html, /排班管理/);
  });

  test('renders without staffSchedules when not provided', () => {
    const { staffSchedules, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, rest));
    assert.doesNotMatch(html, /data-testid="asstmgr-staff"/);
  });

  test('shows empty text when staffSchedules empty', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, {
      ...BASE_PROPS,
      staffSchedules: [],
    }));
    assert.match(html, /暂无排班信息/);
  });

  test('shows empty text when trainingItems empty', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, {
      ...BASE_PROPS,
      trainingItems: [],
    }));
    assert.match(html, /暂无培训任务/);
  });

  test('renders default people metrics when no peopleSummary', () => {
    const { peopleSummary, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, rest));
    assert.match(html, /在编员工/);
    assert.match(html, /今日在岗/);
    assert.match(html, /培训完成率/);
  });

  test('applies className', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, {
      ...BASE_PROPS,
      className: 'my-asst-dashboard',
    }));
    assert.match(html, /class="my-asst-dashboard"/);
  });

  test('shows sync time when provided', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, BASE_PROPS));
    assert.match(html, /18:30/);
  });

  test('shows staff service scores', () => {
    const html = renderToStaticMarkup(React.createElement(AssistantManagerDashboard, BASE_PROPS));
    assert.match(html, /★/);
  });
});
