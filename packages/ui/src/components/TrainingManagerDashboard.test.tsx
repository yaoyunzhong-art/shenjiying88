import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { TrainingManagerDashboard } = require('./TrainingManagerDashboard');

// ---- 测试数据 ----

const MOCK_METRICS = {
  totalSessions: 8,
  totalAttendees: 124,
  avgCompletionRate: 87,
  avgRating: 4.6,
  sessionsTrend: 2,
  attendeesTrend: 15,
  completionTrend: 3,
  ratingTrend: 0.2,
};

const MOCK_SESSIONS = [
  {
    id: 's1',
    title: '新设备操作培训',
    coach: '张教练',
    type: 'skill' as const,
    date: '2026-07-05',
    time: '09:00-10:30',
    enrolled: 18,
    capacity: 20,
    status: 'scheduled' as const,
  },
  {
    id: 's2',
    title: '消防安全演练',
    coach: '李教练',
    type: 'safety' as const,
    date: '2026-07-05',
    time: '14:00-15:00',
    enrolled: 30,
    capacity: 30,
    status: 'in_progress' as const,
  },
  {
    id: 's3',
    title: '销售话术进阶',
    coach: '王教练',
    type: 'sales' as const,
    date: '2026-07-05',
    time: '16:00-17:30',
    enrolled: 12,
    capacity: 15,
    status: 'completed' as const,
  },
  {
    id: 's4',
    title: '客户服务礼仪',
    coach: '赵教练',
    type: 'service' as const,
    date: '2026-07-05',
    time: '10:00-11:00',
    enrolled: 5,
    capacity: 25,
    status: 'scheduled' as const,
  },
];

const MOCK_CERTS = [
  {
    id: 'c1',
    memberName: '刘小明',
    skillName: '模拟赛车操控',
    progress: 75,
    assignedCoach: '张教练',
    deadline: '2026-07-15',
  },
  {
    id: 'c2',
    memberName: '陈小红',
    skillName: '攀岩安全监护',
    progress: 45,
    assignedCoach: '李教练',
    deadline: '2026-07-20',
  },
  {
    id: 'c3',
    memberName: '王大勇',
    skillName: '电竞设备维护',
    progress: 92,
    assignedCoach: '王教练',
    deadline: '2026-07-10',
  },
  {
    id: 'c4',
    memberName: '赵丽华',
    skillName: '游泳救生认证',
    progress: 30,
    assignedCoach: '赵教练',
    deadline: '2026-08-01',
  },
];

const MOCK_NEEDS = [
  { deviceModel: 'VR模拟器X3', count: 12, priority: 'high' as const },
  { deviceModel: '智能体测仪', count: 8, priority: 'medium' as const },
  { deviceModel: '电竞椅调整', count: 5, priority: 'low' as const },
];

// ---- 测试套件 ----

describe('TrainingManagerDashboard', () => {
  // ── 加载态 ──
  test('renders loading skeleton when loading is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, { loading: true })
    );
    assert.match(html, /data-testid="training-dashboard-loading"/);
    assert.match(html, /正在加载培训数据/);
  });

  // ── 标题 ──
  test('renders title with brandName', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '体育蚂蚁总部',
        dailyMetrics: MOCK_METRICS,
      })
    );
    assert.match(html, /data-testid="training-dashboard-title"/);
    assert.match(html, /体育蚂蚁总部 培训管理/);
  });

  test('renders default title when brandName is omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
      })
    );
    assert.match(html, /培训经理工作台/);
  });

  test('renders lastSyncAt when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        lastSyncAt: '2026-07-05 22:00',
      })
    );
    assert.match(html, /2026-07-05 22:00/);
  });

  // ── 指标 ──
  test('renders daily metrics stats', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
      })
    );
    assert.match(html, /今日培训场次/);
    assert.match(html, /8/);
    assert.match(html, /参训人数/);
    assert.match(html, /124/);
    assert.match(html, /平均完成率/);
    assert.match(html, /87%/);
    assert.match(html, /平均评分/);
    assert.match(html, /4\.6/);
  });

  test('does not render stats section when dailyMetrics is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, { brandName: '测试店' })
    );
    assert.equal(html.includes('今日培训场次'), false);
  });

  // ── 课程表格 ──
  test('renders today training sessions table', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        todaySessions: MOCK_SESSIONS,
      })
    );
    assert.match(html, /新设备操作培训/);
    assert.match(html, /消防安全演练/);
    assert.match(html, /销售话术进阶/);
    assert.match(html, /客户服务礼仪/);
    assert.match(html, /张教练/);
    assert.match(html, /李教练/);
    assert.match(html, /王教练/);
    assert.match(html, /赵教练/);
  });

  test('renders session type badges', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        todaySessions: MOCK_SESSIONS,
      })
    );
    assert.match(html, /data-testid="type-badge-skill"/);
    assert.match(html, /data-testid="type-badge-safety"/);
    assert.match(html, /data-testid="type-badge-sales"/);
    assert.match(html, /data-testid="type-badge-service"/);
    assert.match(html, /技能培训/);
    assert.match(html, /安全培训/);
    assert.match(html, /销售培训/);
    assert.match(html, /服务培训/);
  });

  test('shows enrollment fullness colors', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        todaySessions: MOCK_SESSIONS,
      })
    );
    // s2: 30/30 = 100% => red
    assert.match(html, /30\/30/);
    // s4: 5/25 = 20% => green
    assert.match(html, /5\/25/);
  });

  test('renders cancelled session with dimmed row', () => {
    const sessionsWithCancelled = [
      ...MOCK_SESSIONS,
      {
        id: 's5',
        title: '已取消的课程',
        coach: '周教练',
        type: 'leadership' as const,
        date: '2026-07-05',
        time: '18:00',
        enrolled: 0,
        capacity: 10,
        status: 'cancelled' as const,
      },
    ];
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        todaySessions: sessionsWithCancelled,
      })
    );
    assert.match(html, /已取消的课程/);
    assert.match(html, /data-testid="type-badge-leadership"/);
    assert.match(html, /管理培训/);
  });

  test('does not render sessions section when empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        todaySessions: [],
      })
    );
    assert.equal(html.includes('今日培训课程'), false);
  });

  // ── 待认证学员 ──
  test('renders pending certifications', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        pendingCertifications: MOCK_CERTS,
      })
    );
    assert.match(html, /data-testid="cert-c1"/);
    assert.match(html, /data-testid="cert-c2"/);
    assert.match(html, /data-testid="cert-c3"/);
    assert.match(html, /data-testid="cert-c4"/);
    assert.match(html, /刘小明/);
    assert.match(html, /陈小红/);
    assert.match(html, /模拟赛车操控/);
    assert.match(html, /攀岩安全监护/);
  });

  test('renders certification progress bars', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        pendingCertifications: MOCK_CERTS,
      })
    );
    // c3 has 92% - should show green
    assert.match(html, /92%/);
    // c1 has 75% - should show orange
    assert.match(html, /75%/);
    // c4 has 30% - should show red
    assert.match(html, /30%/);
  });

  test('does not render certifications when empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        pendingCertifications: [],
      })
    );
    assert.equal(html.includes('待认证学员'), false);
  });

  // ── 培训需求标签 ──
  test('renders training needs tags', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        trainingNeeds: MOCK_NEEDS,
      })
    );
    assert.match(html, /VR模拟器X3/);
    assert.match(html, /智能体测仪/);
    assert.match(html, /电竞椅调整/);
    assert.match(html, /12人/);
    assert.match(html, /8人/);
    assert.match(html, /5人/);
  });

  test('renders data-testid on need tags', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        trainingNeeds: MOCK_NEEDS,
      })
    );
    assert.match(html, /data-testid="need-VR模拟器X3"/);
    assert.match(html, /data-testid="need-智能体测仪"/);
  });

  test('does not render training needs when empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        trainingNeeds: [],
      })
    );
    assert.equal(html.includes('设备培训需求'), false);
  });

  // ── 紧凑模式 ──
  test('renders with compact mode', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        brandName: '测试店',
        dailyMetrics: MOCK_METRICS,
        todaySessions: MOCK_SESSIONS,
        pendingCertifications: MOCK_CERTS,
        trainingNeeds: MOCK_NEEDS,
        compact: true,
      })
    );
    assert.match(html, /data-testid="training-dashboard"/);
    assert.match(html, /测试店 培训管理/);
    assert.match(html, /新设备操作培训/);
    assert.match(html, /消防安全演练/);
  });

  // ── 空数据渲染 ──
  test('renders with minimal props without crashing', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {})
    );
    assert.match(html, /data-testid="training-dashboard"/);
    assert.match(html, /培训经理工作台/);
  });

  // ── className ──
  test('forwards className prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(TrainingManagerDashboard, {
        className: 'custom-class',
        brandName: '测试',
      })
    );
    assert.match(html, /class="custom-class"/);
  });
});
