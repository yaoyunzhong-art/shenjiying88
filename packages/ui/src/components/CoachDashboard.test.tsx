import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { CoachDashboard } = require('./CoachDashboard');

const BASE_PROPS = {
  coachName: '张教练',
  storeName: '朝阳旗舰店',
  employeeId: 'EMP-0032',
  dailyMetrics: {
    servedCount: 68,
    newMembers: 12,
    promoConversions: 23,
    followUps: 8,
    servedTrend: 5.2,
    memberTrend: 8.0,
    promoTrend: 12.3,
    followUpTrend: -2.1,
  },
  followUpMembers: [
    { id: '1', name: '王小明', tier: 'GOLD', lastContactAt: '06-25', status: 'pending' as const, note: '对体验套餐感兴趣' },
    { id: '2', name: '李小红', tier: 'PLATINUM', lastContactAt: '06-24', status: 'contacted' as const },
    { id: '3', name: '赵大勇', tier: 'SILVER', lastContactAt: '06-20', status: 'converted' as const, note: '已续费季卡' },
  ],
  promoTasks: [
    { id: 'p1', title: '扫码分享有礼', type: 'share' as const, target: 50, completed: 32, deadline: '06-30' },
    { id: 'p2', title: '老带新裂变', type: 'referral' as const, target: 30, completed: 18, deadline: '07-05' },
    { id: 'p3', title: '门店周年庆', type: 'event' as const, target: 200, completed: 145, deadline: '07-10' },
  ],
  rank: { current: 3, total: 12 },
  lastSyncAt: '16:00',
};

describe('CoachDashboard', () => {
  test('renders coach dashboard title', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /教练工作台/);
    assert.match(html, /data-testid="coachdashboard-title"/);
  });

  test('renders coach profile with name and store', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /张教练/);
    assert.match(html, /朝阳旗舰店/);
    assert.match(html, /EMP-0032/);
    assert.match(html, /data-testid="coachdashboard-profile"/);
  });

  test('shows rank badge when provided', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /3\/12/);
  });

  test('does not render profile when no coach info', () => {
    const { coachName, storeName, employeeId, rank, lastSyncAt, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, rest));
    assert.doesNotMatch(html, /data-testid="coachdashboard-profile"/);
  });

  test('renders daily metrics as QuickStats', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /接待人次/);
    assert.match(html, /新增会员/);
    assert.match(html, /推广转化/);
    assert.match(html, /跟进回访/);
    assert.match(html, /68/);
    assert.match(html, /12/);
    assert.match(html, /23/);
    assert.match(html, /8/);
  });

  test('shows trend indicators', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /同比 \+5\.2%/);
    assert.match(html, /同比 \+8\.0%/);
    assert.match(html, /同比 \+12\.3%/);
    assert.match(html, /同比 -2\.1%/);
  });

  test('renders promo tasks', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /data-testid="coachdashboard-promo-tasks"/);
    assert.match(html, /推广任务/);
    assert.match(html, /扫码分享有礼/);
    assert.match(html, /老带新裂变/);
    assert.match(html, /门店周年庆/);
    assert.match(html, /32\/50/);
    assert.match(html, /18\/30/);
    assert.match(html, /145\/200/);
    assert.match(html, /截止 06-30/);
    assert.match(html, /截止 07-10/);
  });

  test('shows promo task count badge', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /\(3\)/);
  });

  test('shows empty state when no promo tasks', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, {
      ...BASE_PROPS,
      promoTasks: [],
    }));
    assert.match(html, /暂无推广任务/);
  });

  test('renders follow-up members', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /data-testid="coachdashboard-follow-up"/);
    assert.match(html, /待跟进会员/);
    assert.match(html, /王小明/);
    assert.match(html, /李小红/);
    assert.match(html, /赵大勇/);
  });

  test('shows follow-up member tiers', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /GOLD/);
    assert.match(html, /PLATINUM/);
    assert.match(html, /SILVER/);
  });

  test('shows follow-up status badges', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /待跟进/);
    assert.match(html, /已联系/);
    assert.match(html, /已转化/);
  });

  test('shows follow-up notes when present', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /对体验套餐感兴趣/);
    assert.match(html, /已续费季卡/);
  });

  test('shows empty state when no follow-up members', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, {
      ...BASE_PROPS,
      followUpMembers: [],
    }));
    assert.match(html, /暂无待跟进会员/);
  });

  test('renders loading skeleton', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, {
      ...BASE_PROPS,
      loading: true,
    }));
    assert.match(html, /data-testid="coachdashboard-loading"/);
    assert.match(html, /正在加载教练工作台数据/);
    assert.doesNotMatch(html, /data-testid="coachdashboard-root"/);
  });

  test('renders default metrics when no dailyMetrics', () => {
    const { dailyMetrics, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, rest));
    assert.match(html, /接待/);
    assert.match(html, /新会员/);
    assert.match(html, /推广/);
    assert.match(html, /回访/);
  });

  test('applies className', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, {
      ...BASE_PROPS,
      className: 'custom-coach-dash',
    }));
    assert.match(html, /class="custom-coach-dash"/);
  });

  test('shows lastSyncAt when provided', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /同步: 16:00/);
  });

  test('renders promo type labels', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /\[分享\]/);
    assert.match(html, /\[裂变\]/);
    assert.match(html, /\[活动\]/);
  });

  test('shows follow-up members count badge', () => {
    const html = renderToStaticMarkup(React.createElement(CoachDashboard, BASE_PROPS));
    assert.match(html, /\(3\)/);
  });
});
