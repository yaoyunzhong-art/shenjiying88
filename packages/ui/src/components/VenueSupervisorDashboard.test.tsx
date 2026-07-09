import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { VenueSupervisorDashboard } = require('./VenueSupervisorDashboard');

// ---- 测试数据 ----

const MOCK_ZONE_DEVICES = [
  { zoneId: 'z1', zoneName: '电玩区', total: 30, online: 28, fault: 1, utilizationRate: 85 },
  { zoneId: 'z2', zoneName: '抓娃娃区', total: 20, online: 18, fault: 0, utilizationRate: 72 },
  { zoneId: 'z3', zoneName: '彩票区', total: 10, online: 10, fault: 0, utilizationRate: 90 },
];

const MOCK_TRAFFIC = {
  currentVisitors: 186,
  capacity: 300,
  entryCount: 320,
  exitCount: 134,
  avgStayMinutes: 48,
  peakTime: '13:00-15:00',
};

const MOCK_REVENUE = {
  grossRevenue: 48560,
  ticketRevenue: 18200,
  gameRevenue: 20360,
  foodBeverage: 7200,
  otherRevenue: 2800,
  targetRevenue: 50000,
  completionRate: 97,
};

const MOCK_ALERTS = [
  { id: 'a1', type: 'device', typeLabel: '设备', severity: 'critical', message: '电玩区 #08 机台离线超2小时', zoneName: '电玩区', reportedAt: '15:45', handler: '张三', status: 'processing' },
  { id: 'a2', type: 'security', typeLabel: '安保', severity: 'warning', message: '东侧出口门禁异常', zoneName: '彩票区', reportedAt: '15:20', status: 'pending' },
  { id: 'a3', type: 'revenue', typeLabel: '营收', severity: 'info', message: '抓娃娃区本时段营收偏低', zoneName: '抓娃娃区', reportedAt: '14:55', handler: '李四', status: 'resolved' },
];

function renderComponent(overrides = {}) {
  const html = renderToStaticMarkup(
    React.createElement(VenueSupervisorDashboard, {
      zoneDevices: MOCK_ZONE_DEVICES,
      traffic: MOCK_TRAFFIC,
      revenue: MOCK_REVENUE,
      alerts: MOCK_ALERTS,
      shiftName: '中班 (12:00-20:00)',
      ...overrides,
    }),
  );
  return html;
}

// ---- 测试用例 ----

describe('VenueSupervisorDashboard', () => {
  test('渲染标题和班次信息', () => {
    const html = renderComponent();
    assert.ok(html.includes('场地主管工作台'), '应包含标题');
    assert.ok(html.includes('中班'), '应包含班次信息');
  });

  test('渲染快速统计数据', () => {
    const html = renderComponent();
    assert.ok(html.includes('186'), '应显示当前客流');
    assert.ok(html.includes('320'), '应显示今日入场');
    assert.ok(html.includes('48,560'), '应显示总收入');
    assert.ok(html.includes('97%'), '应显示完成率');
  });

  test('渲染三个区域设备卡片', () => {
    const html = renderComponent();
    assert.ok(html.includes('电玩区'), '应包含电玩区');
    assert.ok(html.includes('抓娃娃区'), '应包含抓娃娃区');
    assert.ok(html.includes('彩票区'), '应包含彩票区');
    assert.ok(html.includes('85%'), '电玩区利用率为85%');
    assert.ok(html.includes('72%'), '抓娃娃区利用率为72%');
    assert.ok(html.includes('90%'), '彩票区利用率为90%');
  });

  test('渲染容量指示条', () => {
    const html = renderComponent();
    assert.ok(html.includes('场馆容量'), '应显示容量标题');
    assert.ok(html.includes('62%'), '容量百分比应为62%');
  });

  test('渲染营收项目', () => {
    const html = renderComponent();
    assert.ok(html.includes('门票'), '应包含门票');
    assert.ok(html.includes('游戏'), '应包含游戏');
    assert.ok(html.includes('餐饮'), '应包含餐饮');
    assert.ok(html.includes('其他'), '应包含其他');
    assert.ok(html.includes('¥18,200'), '门票金额');
    assert.ok(html.includes('¥20,360'), '游戏金额');
  });

  test('渲染目标完成率', () => {
    const html = renderComponent();
    assert.ok(html.includes('¥50,000'), '目标营收');
    assert.ok(html.includes('完成 97%'), '完成率文字');
  });

  test('渲染告警标题区域', () => {
    const html = renderComponent();
    assert.ok(html.includes('异常告警'), '告警标题');
    // a1=processing, a2=pending: 2条未处理；a3=resolved不计数
    assert.ok(html.includes('(2 条未处理)'), '应显示2条未处理');
  });

  test('渲染空告警状态', () => {
    const html = renderComponent({ alerts: [] });
    assert.ok(html.includes('暂无告警，运营一切正常'), '空状态消息');
    assert.ok(!html.includes('条未处理'), '不应显示未处理计数');
  });

  test('不同客流比例显示不同容量百分比', () => {
    const fullHtml = renderComponent({
      traffic: { ...MOCK_TRAFFIC, currentVisitors: 285, capacity: 300 },
    });
    assert.ok(fullHtml.includes('95%'), '客流285/300=95%');

    const lightHtml = renderComponent({
      traffic: { ...MOCK_TRAFFIC, currentVisitors: 45, capacity: 300 },
    });
    assert.ok(lightHtml.includes('15%'), '客流45/300=15%');
  });

  test('无营收目标时底部不显示完成文字', () => {
    const html = renderComponent({
      revenue: { ...MOCK_REVENUE, targetRevenue: 0, completionRate: 0 },
    });
    // QuickStats 仍然会显示目标完成率这项，但底部条件渲染的完成行不应出现
    // 如果 targetRevenue=0，条件 revenue.targetRevenue > 0 不成立
    assert.ok(html.includes('目标完成率'), 'QuickStats仍显示目标完成率字段');
    // 确保底部条件渲染的「目标 ¥0 · 完成 0」不出现
    assert.ok(!html.includes('目标 ¥0'), '底部不应渲染零目标文本');
  });

  test('渲染三个操作按钮', () => {
    const html = renderComponent();
    assert.ok(html.includes('客流分析'), '客流分析按钮');
    assert.ok(html.includes('开始巡检'), '开始巡检按钮');
    assert.ok(html.includes('生成报表'), '生成报表按钮');
  });

  test('渲染区域设备统计信息', () => {
    const html = renderComponent();
    assert.ok(html.includes('30'), '电玩区总数');
    assert.ok(html.includes('28'), '电玩区在线数');
    assert.ok(html.includes('1'), '电玩区故障数');
    assert.ok(html.includes('在线'), '在线标签');
    assert.ok(html.includes('故障'), '故障标签');
  });
});
