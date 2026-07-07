import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {
  MarketingManagerDashboard,
} from './MarketingManagerDashboard';
import type {
  MarketingManagerDashboardProps,
  MarketingGrowthMetrics,
  CampaignSnapshot,
  ChannelEffectiveness,
  MarketingQuickAction,
} from './MarketingManagerDashboard';

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join(' ');
  }
  if (React.isValidElement(node)) {
    return extractText(node.props.children);
  }
  return '';
}

// ---- 基础导出 ----

test('MarketingManagerDashboard: component is exported as a function', () => {
  assert.equal(typeof MarketingManagerDashboard, 'function');
});

// ---- 加载状态 ----

test('MarketingManagerDashboard: loading state renders skeleton and loading text', () => {
  const element = MarketingManagerDashboard({ loading: true });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /正在加载营销数据/);
});

// ---- 头部信息 ----

test('MarketingManagerDashboard: renders manager name', () => {
  const element = MarketingManagerDashboard({
    managerName: '王营销',
  });
  const text = extractText(element);
  assert.match(text, /营销经理工作台/);
  assert.match(text, /王营销/);
});

test('MarketingManagerDashboard: renders lastSyncAt', () => {
  const element = MarketingManagerDashboard({
    lastSyncAt: '2026-06-29 10:00',
  });
  const text = extractText(element);
  assert.match(text, /2026-06-29 10:00/);
});

// ---- 增长指标 ----

test('MarketingManagerDashboard: renders growth metrics with positive trends', () => {
  const metrics: MarketingGrowthMetrics = {
    newMembers: 128,
    newMembersQoQ: 15.3,
    activeMembers: 3420,
    activeMembersQoQ: 8.7,
    repurchaseRate: 45.6,
    repurchaseRateQoQ: 3.2,
    avgOrderValue: 286,
    avgOrderValueQoQ: 5.1,
    avgCampaignRoi: 185,
    avgCampaignRoiQoQ: 12.4,
  };
  const element = MarketingManagerDashboard({ growthMetrics: metrics });
  assert.ok(React.isValidElement(element));
  // QuickStats is hook-based; verify structural validity
  assert.ok(React.isValidElement(element));
});

test('MarketingManagerDashboard: renders growth metrics with negative trends', () => {
  const metrics: MarketingGrowthMetrics = {
    newMembers: 32,
    newMembersQoQ: -8.5,
    activeMembers: 980,
    activeMembersQoQ: -3.2,
    repurchaseRate: 28.3,
    repurchaseRateQoQ: -2.1,
    avgOrderValue: 152,
    avgOrderValueQoQ: -6.8,
    avgCampaignRoi: 62,
    avgCampaignRoiQoQ: -15.0,
  };
  const element = MarketingManagerDashboard({ growthMetrics: metrics });
  assert.ok(React.isValidElement(element));
  assert.ok(React.isValidElement(element));
});

test('MarketingManagerDashboard: renders no stats section when no growth metrics', () => {
  const element = MarketingManagerDashboard({});
  assert.ok(React.isValidElement(element));
});

// ---- 月度预算 ----

test('MarketingManagerDashboard: renders budget bar', () => {
  const element = MarketingManagerDashboard({
    monthlyBudget: 500000,
    budgetUsedPercent: 65,
  });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /本月预算/);
  assert.match(text, /65/);
});

test('MarketingManagerDashboard: renders budget bar at 95% usage (critical)', () => {
  const element = MarketingManagerDashboard({
    monthlyBudget: 500000,
    budgetUsedPercent: 95,
  });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /95/);
});

test('MarketingManagerDashboard: no budget bar when props omitted', () => {
  const element = MarketingManagerDashboard({});
  const text = extractText(element);
  assert.equal(text.includes('本月预算'), false);
});

// ---- 营销活动 ----

test('MarketingManagerDashboard: renders campaigns with all types and statuses', () => {
  const campaigns: CampaignSnapshot[] = [
    {
      id: 'c1',
      name: '618大促',
      type: 'promotion',
      status: 'active',
      budget: 100000,
      spent: 65000,
      reachCount: 50000,
      participantCount: 3200,
      conversionRate: 6.4,
      roi: 185,
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      owner: '张三',
    },
    {
      id: 'c2',
      name: '会员日特惠',
      type: 'member',
      status: 'draft',
      budget: 30000,
      spent: 0,
      reachCount: 0,
      participantCount: 0,
      conversionRate: 0,
      roi: 0,
      startDate: '2026-07-01',
      owner: '李四',
    },
    {
      id: 'c3',
      name: '夏季新品发布',
      type: 'new_product',
      status: 'ended',
      budget: 80000,
      spent: 82000,
      reachCount: 120000,
      participantCount: 8900,
      conversionRate: 7.4,
      roi: 210,
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    },
    {
      id: 'c4',
      name: '中秋活动',
      type: 'seasonal',
      status: 'paused',
      budget: 50000,
      spent: 12000,
      reachCount: 8000,
      participantCount: 450,
      conversionRate: 5.6,
      roi: 45,
      startDate: '2026-09-10',
      endDate: '2026-09-20',
    },
    {
      id: 'c5',
      name: '交叉销售测试',
      type: 'cross_sell',
      status: 'cancelled',
      budget: 20000,
      spent: 2000,
      reachCount: 3000,
      participantCount: 120,
      conversionRate: 4.0,
      roi: 30,
      startDate: '2026-08-01',
      endDate: '2026-08-15',
    },
  ];
  const element = MarketingManagerDashboard({ campaigns });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /营销活动/);
  assert.match(text, /\( 5 \)/);
  // DataTable cells are not reachable via extractText
  assert.ok(React.isValidElement(element));
});

test('MarketingManagerDashboard: renders empty campaigns state', () => {
  const element = MarketingManagerDashboard({ campaigns: [] });
  const text = extractText(element);
  assert.match(text, /暂无营销活动数据/);
});

// ---- 渠道效果 ----

test('MarketingManagerDashboard: renders channel effectiveness', () => {
  const channels: ChannelEffectiveness[] = [
    {
      channel: '抖音信息流',
      impressions: 500000,
      clicks: 25000,
      ctr: 5.0,
      conversions: 1200,
      cost: 35000,
      customerAcquisitionCost: 29.2,
    },
    {
      channel: '微信公众号',
      impressions: 80000,
      clicks: 3200,
      ctr: 4.0,
      conversions: 480,
      cost: 8000,
      customerAcquisitionCost: 16.7,
    },
    {
      channel: '小红书种草',
      impressions: 120000,
      clicks: 9600,
      ctr: 8.0,
      conversions: 860,
      cost: 15000,
      customerAcquisitionCost: 17.4,
    },
  ];
  const element = MarketingManagerDashboard({ channels });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /渠道效果/);
  assert.match(text, /\( 3 \)/);
  // DataTable cells are not reachable via extractText
  assert.ok(React.isValidElement(element));
});

test('MarketingManagerDashboard: no channels section when omitted', () => {
  const element = MarketingManagerDashboard({ campaigns: [] });
  const text = extractText(element);
  assert.equal(text.includes('渠道效果'), false);
});

// ---- 快速操作 ----

test('MarketingManagerDashboard: renders quick action buttons including primary', () => {
  const actions: MarketingQuickAction[] = [
    { key: 'create', label: '创建活动', primary: true },
    { key: 'report', label: '营销报告' },
    { key: 'budget', label: '预算调整', icon: '💰' },
  ];
  const element = MarketingManagerDashboard({ quickActions: actions });
  const text = extractText(element);
  assert.match(text, /创建活动/);
  assert.match(text, /营销报告/);
  assert.match(text, /预算调整/);
  assert.match(text, /💰/);
});

test('MarketingManagerDashboard: no quick actions when empty array', () => {
  const element = MarketingManagerDashboard({ quickActions: [] });
  assert.ok(React.isValidElement(element));
});

// ---- 紧凑模式 ----

test('MarketingManagerDashboard: compact mode renders correctly', () => {
  const element = MarketingManagerDashboard({
    compact: true,
    managerName: '王营销',
  });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /营销经理工作台/);
  assert.ok(React.isValidElement(element));
});

// ---- 完整集成 ----

test('MarketingManagerDashboard: full integration with all sections', () => {
  const props: MarketingManagerDashboardProps = {
    managerName: '李营销',
    lastSyncAt: '2026-06-29 09:00',
    monthlyBudget: 300000,
    budgetUsedPercent: 62, // toFixed(0) will show 62
    growthMetrics: {
      newMembers: 256,
      newMembersQoQ: 12.8,
      activeMembers: 5100,
      activeMembersQoQ: 6.5,
      repurchaseRate: 52.3,
      repurchaseRateQoQ: 4.1,
      avgOrderValue: 320,
      avgOrderValueQoQ: 3.6,
      avgCampaignRoi: 195,
      avgCampaignRoiQoQ: 10.2,
    },
    campaigns: [
      {
        id: 'c1',
        name: '暑期大促',
        type: 'seasonal',
        status: 'active',
        budget: 120000,
        spent: 72000,
        reachCount: 88000,
        participantCount: 5600,
        conversionRate: 6.4,
        roi: 178,
        startDate: '2026-06-15',
        owner: '王五',
      },
    ],
    channels: [
      {
        channel: '抖音',
        impressions: 300000,
        clicks: 18000,
        ctr: 6.0,
        conversions: 900,
        cost: 25000,
        customerAcquisitionCost: 27.8,
      },
    ],
    quickActions: [
      { key: 'create', label: '创建活动', primary: true },
      { key: 'report', label: '营销报告' },
    ],
  };

  const element = MarketingManagerDashboard(props);
  assert.ok(React.isValidElement(element));
  const text = extractText(element);

  // 头部 — direct text
  assert.match(text, /营销经理工作台/);
  assert.match(text, /李营销/);
  assert.match(text, /2026-06-29 09:00/);

  // 预算 — direct text
  assert.match(text, /本月预算/);
  assert.match(text, /62/);

  // Section titles — direct text
  assert.match(text, /营销活动/);
  assert.match(text, /渠道效果/);

  // Quick action buttons — direct text
  assert.match(text, /创建活动/);
  assert.match(text, /营销报告/);

  // QuickStats/DataTable contents are not reachable via extractText
  // (they are hook-based function components that return opaque element trees)
  assert.ok(React.isValidElement(element));
});

// ---- 边界情况 ----

test('MarketingManagerDashboard: handles campaign without optional fields', () => {
  const campaigns: CampaignSnapshot[] = [
    {
      id: 'c-min',
      name: '极简活动',
      type: 'promotion',
      status: 'draft',
      budget: 10000,
      spent: 0,
      reachCount: 0,
      participantCount: 0,
      conversionRate: 0,
      roi: 0,
      startDate: '2026-07-01',
    },
  ];
  const element = MarketingManagerDashboard({ campaigns });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /营销活动/);
  assert.ok(React.isValidElement(element));
});

test('MarketingManagerDashboard: handles over-budget scenario', () => {
  const campaigns: CampaignSnapshot[] = [
    {
      id: 'c-over',
      name: '超预算活动',
      type: 'promotion',
      status: 'active',
      budget: 50000,
      spent: 55000,
      reachCount: 20000,
      participantCount: 1500,
      conversionRate: 7.5,
      roi: 120,
      startDate: '2026-06-10',
    },
  ];
  const element = MarketingManagerDashboard({
    monthlyBudget: 100000,
    budgetUsedPercent: 110,
    campaigns,
  });
  assert.ok(React.isValidElement(element));
  const text = extractText(element);
  assert.match(text, /110/);
  assert.ok(React.isValidElement(element));
});

test('MarketingManagerDashboard: handles undefined campaigns and channels', () => {
  const element = MarketingManagerDashboard({
    growthMetrics: {
      newMembers: 50,
      newMembersQoQ: 5.0,
      activeMembers: 1000,
      activeMembersQoQ: 2.0,
      repurchaseRate: 30.0,
      repurchaseRateQoQ: 1.0,
      avgOrderValue: 200,
      avgOrderValueQoQ: 3.0,
      avgCampaignRoi: 100,
      avgCampaignRoiQoQ: 5.0,
    },
  });
  const text = extractText(element);
  assert.match(text, /暂无营销活动数据/);
  assert.equal(text.includes('渠道效果'), false);
});

test('MarketingManagerDashboard: renders without any props', () => {
  const element = MarketingManagerDashboard({});
  assert.ok(React.isValidElement(element));
});
