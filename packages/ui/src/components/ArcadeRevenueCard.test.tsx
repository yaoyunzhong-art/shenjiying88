/**
 * ArcadeRevenueCard 组件测试
 *
 * 覆盖: 基础渲染、空状态、机台行展示、日目标进度条、机器分类、汇总统计、格式化函数
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ArcadeRevenueCard, __utils } = require('./ArcadeRevenueCard');

// ==================== 测试数据 ====================

const sampleMachines = [
  {
    id: 'm1',
    name: '头文字D8',
    category: '竞速' as const,
    status: 'online' as const,
    todayRevenue: 285.50,
    todayPlays: 42,
    weekRevenue: 1890.00,
    weekPlays: 310,
    coinsPerPlay: 4,
    occupancyRate: 78,
    lastService: '2026-07-01T10:00:00Z',
    faultCount: 1,
  },
  {
    id: 'm2',
    name: '湾岸5',
    category: '竞速' as const,
    status: 'full' as const,
    todayRevenue: 420.00,
    todayPlays: 60,
    weekRevenue: 3100.00,
    weekPlays: 450,
    coinsPerPlay: 5,
    occupancyRate: 95,
    faultCount: 0,
  },
  {
    id: 'm3',
    name: '太鼓达人',
    category: '音乐' as const,
    status: 'online' as const,
    todayRevenue: 150.00,
    todayPlays: 35,
    weekRevenue: 980.00,
    weekPlays: 240,
    coinsPerPlay: 3,
    occupancyRate: 45,
  },
  {
    id: 'm4',
    name: '抓娃娃机#1',
    category: '抓物' as const,
    status: 'maintenance' as const,
    todayRevenue: 0,
    todayPlays: 0,
    weekRevenue: 650.00,
    weekPlays: 120,
    coinsPerPlay: 2,
    occupancyRate: 0,
    lastService: '2026-07-07T14:00:00Z',
    faultCount: 3,
  },
  {
    id: 'm5',
    name: '铁拳8',
    category: '格斗' as const,
    status: 'offline' as const,
    todayRevenue: 0,
    todayPlays: 0,
    weekRevenue: 550.00,
    weekPlays: 80,
    coinsPerPlay: 3,
    occupancyRate: 0,
    faultCount: 5,
  },
];

const baseProps = {
  storeName: 'Cyber Galaxy Arcade',
  date: '2026-07-08 周三',
  machines: sampleMachines,
};

// ==================== 测试套件 ====================

function render(overrides: Record<string, unknown> = {}) {
  return ArcadeRevenueCard({ ...baseProps, ...overrides });
}

describe('ArcadeRevenueCard', () => {
  test('renders store name and date', () => {
    const html = renderToStaticMarkup(render());
    assert.ok(html.includes('Cyber Galaxy Arcade'));
    assert.ok(html.includes('2026-07-08'));
  });

  test('renders all machine rows', () => {
    const html = renderToStaticMarkup(render());
    assert.ok(html.includes('头文字D8'));
    assert.ok(html.includes('湾岸5'));
    assert.ok(html.includes('太鼓达人'));
    assert.ok(html.includes('抓娃娃机#1'));
    assert.ok(html.includes('铁拳8'));
  });

  test('shows online/total machine count', () => {
    const html = renderToStaticMarkup(render());
    // m1 online, m2 full => 2 online
    // m3 online => total 3
    assert.ok(html.includes('3/5'));
  });

  test('shows total today revenue in the header', () => {
    const expectedTotal = (285.50 + 420.00 + 150.00 + 0 + 0).toFixed(2);
    const html = renderToStaticMarkup(render());
    assert.ok(html.includes(`$${expectedTotal}`));
  });

  test('renders daily target bar when dailyRevenueTarget is provided', () => {
    const html = renderToStaticMarkup(render({ dailyRevenueTarget: 2000 }));
    assert.ok(html.includes('目标'), 'HTML should contain "目标"');
    // 今日总收入 = 285.50+420+150 = 855.50, formatCurrency输出不带千分位
    assert.ok(html.includes('/ $2000.00'), 'HTML should contain target amount');
  });

  test('does not render daily target bar when dailyRevenueTarget is not provided', () => {
    const html = renderToStaticMarkup(render({ dailyRevenueTarget: undefined }));
    assert.ok(!html.includes('目标') || !html.includes('/ $'));
  });

  test('shows empty state when machines array is empty', () => {
    const html = renderToStaticMarkup(render({ machines: [] }));
    assert.ok(html.includes('暂无机台数据'));
  });

  test('shows machine status labels', () => {
    const html = renderToStaticMarkup(render());
    assert.ok(html.includes('运行中')); // online
    assert.ok(html.includes('满座'));    // full
    assert.ok(html.includes('维护中')); // maintenance
    assert.ok(html.includes('离线'));   // offline
  });

  test('shows 7-day total revenue in footer', () => {
    const weekTotal = (1890.00 + 3100.00 + 980.00 + 650.00 + 550.00).toFixed(2);
    const html = renderToStaticMarkup(render());
    assert.ok(html.includes(`$${weekTotal}`));
  });

  test('shows today total plays in footer', () => {
    const totalPlays = 42 + 60 + 35 + 0 + 0;
    const html = renderToStaticMarkup(render());
    assert.ok(html.includes(`${totalPlays} 次`));
  });

  test('renders footer slot when provided', () => {
    const footer = React.createElement('button', { 'data-testid': 'footer-btn' }, '查看详情');
    const html = renderToStaticMarkup(render({ footer }));
    assert.ok(html.includes('查看详情'));
  });

  test('renders occupancy bars for each machine', () => {
    const html = renderToStaticMarkup(render());
    assert.ok(html.includes('78%'));
    assert.ok(html.includes('95%'));
    assert.ok(html.includes('45%'));
  });

  test('has correct data-testid on container', () => {
    const html = renderToStaticMarkup(render());
    assert.ok(html.includes('data-testid="arcade-revenue-card"'));
  });

  test('target progress is 0% when today revenue is 0', () => {
    const zeroRevenue = sampleMachines.map(m => ({ ...m, todayRevenue: 0, todayPlays: 0 }));
    const html = renderToStaticMarkup(render({
      machines: zeroRevenue,
      dailyRevenueTarget: 2000,
    }));
    assert.ok(html.includes('0%'));
  });

  test('target progress exceeds 100% when revenue exceeds target', () => {
    const highRevenue = sampleMachines.map(m => ({ ...m, todayRevenue: 800 }));
    const html = renderToStaticMarkup(render({
      machines: highRevenue,
      dailyRevenueTarget: 2000,
    }));
    // 5 machines * 800 = 4000, pct = 200%
    assert.ok(html.includes('200%'));
  });

  test('all category variants render without error', () => {
    const categories: Array<MachineStats['category']> = ['竞速', '射击', '格斗', '音乐', '抓物', '运动', '模拟', '彩票'];
    const catMachines = categories.map((cat, i) => ({
      id: `cat-${i}`,
      name: `测试${cat}`,
      category: cat,
      status: 'online' as const,
      todayRevenue: 100,
      todayPlays: 10,
      weekRevenue: 700,
      weekPlays: 70,
      coinsPerPlay: 3,
      occupancyRate: 50,
    }));
    const html = renderToStaticMarkup(render({ machines: catMachines }));
    for (const cat of categories) {
      assert.ok(html.includes(`测试${cat}`), `category ${cat} should render`);
    }
  });

  test('machine row has correct data-testid', () => {
    const html = renderToStaticMarkup(render());
    for (let i = 0; i < sampleMachines.length; i++) {
      assert.ok(html.includes(`data-testid="machine-row-${i}"`));
    }
  });
});

// ==================== 工具函数测试 ====================

describe('ArcadeRevenueCard 工具函数', () => {
  test('formatCurrency formats correctly', () => {
    assert.equal(__utils.formatCurrency(123.456), '$123.46');
    assert.equal(__utils.formatCurrency(0), '$0.00');
    assert.equal(__utils.formatCurrency(1000), '$1000.00');
  });

  test('formatPlays formats correctly', () => {
    assert.equal(__utils.formatPlays(42), '42');
    assert.equal(__utils.formatPlays(1200), '1.2k');
    assert.equal(__utils.formatPlays(0), '0');
  });

  test('statusColor returns correct colors', () => {
    assert.equal(__utils.statusColor('online'), '#4ade80');
    assert.equal(__utils.statusColor('offline'), '#f87171');
    assert.equal(__utils.statusColor('maintenance'), '#fbbf24');
    assert.equal(__utils.statusColor('full'), '#60a5fa');
  });

  test('statusLabel returns correct labels', () => {
    assert.equal(__utils.statusLabel('online'), '运行中');
    assert.equal(__utils.statusLabel('offline'), '离线');
    assert.equal(__utils.statusLabel('maintenance'), '维护中');
    assert.equal(__utils.statusLabel('full'), '满座');
  });
});
