import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { MemberMarketerDashboard } = require('./MemberMarketerDashboard');

const BASE_PROPS = {
  managerName: '张经理',
  growthMetrics: {
    totalMembers: 18420,
    newToday: 38,
    newThisWeek: 215,
    newThisMonth: 920,
    monthYoY: 12.5,
    activeMembers: 11280,
    activeRate: 61.2,
    churnedMembers: 680,
    churnRate: 3.7,
  },
  marketingKpi: {
    totalSpend: 158000,
    cac: 85.6,
    ltv: 420,
    ltvCacRatio: 4.91,
    repurchaseRate: 34.2,
    monthlyTargetRate: 78.5,
  },
  recentCampaigns: [
    {
      id: 'c1', name: '年中促销活动', channel: 'wechat',
      status: 'running', targetSegment: '活跃会员',
      reachCount: 28000, conversionRate: 6.8, cost: 35000, roi: 4.2,
      startAt: '2026-06-01', endAt: '2026-06-20',
    },
    {
      id: 'c2', name: '新注册福利券', channel: 'app_push',
      status: 'ended', targetSegment: '新用户',
      reachCount: 5200, conversionRate: 18.3, cost: 8000, roi: 3.5,
      startAt: '2026-05-15', endAt: '2026-05-31',
    },
    {
      id: 'c3', name: '会员日双倍积分', channel: 'sms',
      status: 'scheduled', targetSegment: '全部会员',
      reachCount: 18420, conversionRate: 0, cost: 1200, roi: 0,
      startAt: '2026-07-05',
    },
  ],
  quickActions: [
    { key: 'new_campaign', label: '新建活动', primary: true },
    { key: 'member_segment', label: '会员分群' },
    { key: 'performance_report', label: '效果报告' },
  ],
};

describe('MemberMarketerDashboard', () => {
  test('renders manager name', () => {
    const html = renderToStaticMarkup(React.createElement(MemberMarketerDashboard, BASE_PROPS));
    assert.ok(html.includes('张经理，欢迎回来'), 'should show manager greeting');
  });

  test('renders title fallback when no managerName', () => {
    const html = renderToStaticMarkup(React.createElement(MemberMarketerDashboard, {}));
    assert.ok(html.includes('营销经理工作台'), 'should show default title');
  });

  test('renders quick action buttons', () => {
    const html = renderToStaticMarkup(React.createElement(MemberMarketerDashboard, BASE_PROPS));
    assert.ok(html.includes('新建活动'), 'should render primary action');
    assert.ok(html.includes('会员分群'), 'should render normal action');
    assert.ok(html.includes('效果报告'), 'should render report action');
  });

  test('renders growth metrics', () => {
    const html = renderToStaticMarkup(React.createElement(MemberMarketerDashboard, BASE_PROPS));
    assert.ok(html.includes('18,420'), 'should show total members');
    assert.ok(html.includes('61.2%'), 'should show active rate');
  });

  test('renders marketing efficiency panel', () => {
    const html = renderToStaticMarkup(React.createElement(MemberMarketerDashboard, BASE_PROPS));
    assert.ok(html.includes('营销效率概览'), 'should show efficiency section title');
    assert.ok(html.includes('¥158,000'), 'should show total spend');
    assert.ok(html.includes('4.91'), 'should show LTV/CAC ratio');
  });

  test('renders campaign section', () => {
    const html = renderToStaticMarkup(React.createElement(MemberMarketerDashboard, BASE_PROPS));
    assert.ok(html.includes('近期营销活动'), 'should show campaign section title');
    // DataTable cell content is rendered client-side only (use client directive)
  });

  test('renders no campaign section when empty', () => {
    const html = renderToStaticMarkup(React.createElement(MemberMarketerDashboard, {
      ...BASE_PROPS,
      recentCampaigns: [],
    }));
    assert.ok(!html.includes('近期营销活动'), 'should not render campaign section');
  });

  test('renders with only marketingKpi', () => {
    const html = renderToStaticMarkup(React.createElement(MemberMarketerDashboard, {
      marketingKpi: BASE_PROPS.marketingKpi,
    }));
    assert.ok(html.includes('营销效率概览'), 'should render KPI section');
    assert.ok(html.includes('4.91'), 'should show LTV/CAC');
  });

  test('renders with only growthMetrics', () => {
    const html = renderToStaticMarkup(React.createElement(MemberMarketerDashboard, {
      growthMetrics: BASE_PROPS.growthMetrics,
    }));
    assert.ok(html.includes('18,420'), 'should show members');
    assert.ok(html.includes('61.2%'), 'should show active rate');
  });
});
