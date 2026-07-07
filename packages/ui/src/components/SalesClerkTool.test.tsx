/**
 * SalesClerkTool 组件测试
 *
 * 覆盖: 基础渲染、统计数据、Tab标签、会员速查区域、空状态、回调类型校验、边缘情况
 *
 * 注意：组件使用客户端 useState 控制 Tab 切换，SSR 仅渲染默认 Tab（会员速查）
 * 故 FollowUp 和 Scripts 内容在 SSR 测试中不可见，仅验证 Tab 标签和对应数量
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { SalesClerkTool } = require('./SalesClerkTool');

// ==================== 测试数据 ====================

const defaultStats = {
  totalReceptions: 38,
  newLeads: 12,
  conversions: 5,
  conversionRate: 41.7,
  avgResponseMin: 3.2,
};

const followUpClients = [
  { id: 'c1', name: '张三', phone: '13800138001', tier: 'VIP' as const, lastVisit: '2026-06-25', reason: '意向大单未成交', priority: 'high' as const },
  { id: 'c2', name: '李四', phone: '13800138002', tier: 'GOLD' as const, lastVisit: '2026-06-20', reason: '优惠到期提醒', priority: 'medium' as const },
  { id: 'c3', name: '王五', phone: '13800138003', tier: 'SILVER' as const, lastVisit: '2026-05-30', reason: '回访调查', priority: 'low' as const },
];

const scripts = [
  { id: 's1', scenario: '新客进店问候', text: '您好，欢迎光临！请问有什么可以帮您的？', tags: ['接待', '初次'] },
  { id: 's2', scenario: '推荐会员卡', text: '您本月消费已达VIP门槛，要不要升级会员卡？', tags: ['会员', '转化'] },
];

describe('SalesClerkTool', () => {
  // ==================== 基础渲染 ====================

  test('渲染组件标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients, scripts })
    );
    assert.match(html, /导购工作台/);
  });

  test('渲染店员姓名', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients, scripts, clerkName: '小杨' })
    );
    assert.match(html, /小杨/);
  });

  test('渲染门店名称', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients, scripts, storeName: '旗舰店' })
    );
    assert.match(html, /旗舰店/);
  });

  test('显示在线状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients, scripts })
    );
    assert.match(html, /在线/);
  });

  // ==================== 统计卡片 ====================

  test('渲染接待统计数据 - 数值', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients, scripts })
    );
    assert.match(html, />38</);
    assert.match(html, />12</);
    assert.match(html, />5</);
    assert.match(html, /41\.7%/);
    assert.match(html, /3\.2min/);
  });

  test('渲染接待统计数据 - 标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients, scripts })
    );
    assert.match(html, /今日接待/);
    assert.match(html, /新增线索/);
    assert.match(html, /转化率/);
    assert.match(html, /平均响应/);
  });

  // ==================== Tab 标签验证（SSR 可见） ====================

  test('Tab 标签全部渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients, scripts })
    );
    assert.match(html, /会员速查/);
    assert.match(html, /待跟进 \(3\)/);
    assert.match(html, /推荐话术 \(2\)/);
  });

  test('默认 Tab 被选中（会员速查）', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients, scripts })
    );
    // 第一个 button 的 background 应为 #1e293b 表示选中
    const searchTab = /<button[^>]*background:#1e293b[^>]*>会员速查<\/button>/;
    assert.match(html, searchTab);
  });

  // ==================== 会员速查 Tab 内容（SSR 可见） ====================

  test('会员速查区域渲染搜索输入框', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients, scripts })
    );
    assert.match(html, /输入手机号或姓名查询会员/);
    assert.match(html, /查询/);
  });

  // ==================== 空状态（SSR 可见的缺省计数标签） ====================

  test('空跟进列表显示待跟进 = 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients: [], scripts })
    );
    assert.match(html, /待跟进 \(0\)/);
  });

  test('空话术列表显示推荐话术 = 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients, scripts: [] })
    );
    assert.match(html, /推荐话术 \(0\)/);
  });

  test('全空数据', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients: [], scripts: [] })
    );
    assert.match(html, /待跟进 \(0\)/);
    assert.match(html, /推荐话术 \(0\)/);
  });

  // ==================== 默认副标题 ====================

  test('无店员姓名和门店显示默认副标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients, scripts })
    );
    assert.match(html, /客户接待与转化工具/);
  });

  // ==================== 边缘情况：异常数据 ====================

  test('大量统计数据显示正确', () => {
    const highStats = {
      totalReceptions: 999,
      newLeads: 888,
      conversions: 777,
      conversionRate: 99.9,
      avgResponseMin: 0.5,
    };
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: highStats, followUpClients, scripts })
    );
    assert.match(html, />999</);
    assert.match(html, />888</);
    assert.match(html, />777</);
    assert.match(html, /99\.9%/);
    assert.match(html, /0\.5min/);
  });

  test('零统计数据显示正确', () => {
    const zeroStats = {
      totalReceptions: 0,
      newLeads: 0,
      conversions: 0,
      conversionRate: 0,
      avgResponseMin: 0,
    };
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: zeroStats, followUpClients: [], scripts: [] })
    );
    assert.match(html, />0</);
  });

  // ==================== 导出类型校验 ====================

  test('组件为函数', () => {
    assert.equal(typeof SalesClerkTool, 'function');
  });

  // ==================== 会员速查区域的静态元素 ====================

  test('会员速查标题渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesClerkTool, { stats: defaultStats, followUpClients, scripts })
    );
    assert.match(html, /会员速查/);
  });
});
