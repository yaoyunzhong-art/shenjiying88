/**
 * SalesGuideTool 导购员工具测试
 *
 * 覆盖: 基础渲染、今日业绩、顾客信息、推荐商品列表、提醒列表、
 *       空状态、加载状态、错误状态、交互回调
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { SalesGuideTool } = require('./SalesGuideTool');

// ==================== 测试数据 ====================

const mockPerformance = {
  customersServed: 8,
  totalSales: 12560,
  conversionRate: 0.42,
  avgSpend: 1570,
};

const mockCustomer = {
  id: 'cust-001',
  name: '张伟',
  phone: '13800138000',
  memberTier: 'GOLD',
  totalSpent: 56800,
  visitCount: 23,
  lastVisit: '2026-07-05',
  preferences: ['羽毛球', '游泳', '运动鞋'],
  tags: ['高价值', '活跃'],
};

const mockRecommendations = [
  {
    id: 'prod-001',
    name: 'YY 专业羽毛球拍 NS-9900',
    price: 1280,
    originalPrice: 1580,
    reason: '顾客偏好的羽毛球品牌，当前促销',
    stock: 15,
  },
  {
    id: 'prod-002',
    name: '李宁 游泳镜防雾款',
    price: 199,
    reason: '根据购买历史推荐的配件',
    stock: 42,
  },
];

const mockAlerts = [
  {
    id: 'alert-001',
    type: 'follow_up' as const,
    message: '会员张伟上次到店已过3天，建议跟进',
    priority: 'medium' as const,
    createdAt: '2026-07-07T08:00:00Z',
  },
  {
    id: 'alert-002',
    type: 'vip_visit' as const,
    message: 'VIP会员李娜已到店，请优先接待',
    priority: 'high' as const,
    createdAt: '2026-07-07T08:15:00Z',
  },
];

// ==================== 测试用例 ====================

describe('SalesGuideTool 导购员工具', () => {
  // ── 基础渲染 ──
  test('L1-正例: 完整渲染所有区块', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesGuideTool, {
        guideName: '王导购',
        performance: mockPerformance,
        currentCustomer: mockCustomer,
        recommendations: mockRecommendations,
        alerts: mockAlerts,
      })
    );
    assert.ok(html.includes('data-testid="sales-guide-tool"'), '主容器应渲染');
    assert.ok(html.includes('王导购'), '导购姓名应渲染');
    assert.ok(html.includes('今日业绩'), '业绩区块应渲染');
    assert.ok(html.includes(mockCustomer.name), '顾客姓名应渲染');
    assert.ok(html.includes(mockRecommendations[0].name), '推荐商品应渲染');
    assert.ok(html.includes(mockAlerts[0].message), '提醒应渲染');
  });

  // ── 顾客信息 ──
  test('L1-正例: 顾客信息正确展示', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesGuideTool, {
        guideName: '王导购',
        currentCustomer: mockCustomer,
      })
    );
    assert.ok(html.includes(mockCustomer.memberTier), '会员等级应展示');
    assert.ok(html.includes('56,800'), '累计消费应展示 (带本地化格式)');
    assert.ok(html.includes('138****8000'), '手机号脱敏展示');
    assert.ok(html.includes(mockCustomer.preferences[0]), '偏好标签应展示');
  });

  // ── 空状态 ──
  test('L1-边界: 无顾客时应展示空状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesGuideTool, {
        guideName: '王导购',
      })
    );
    assert.ok(html.includes('暂无服务顾客'), '无顾客时应显示提示');
    assert.ok(html.includes('暂无推荐商品'), '无推荐时应显示提示');
    assert.ok(html.includes('暂无提醒'), '无提醒时应显示提示');
  });

  // ── 加载状态 ──
  test('L1-边界: 加载中应展示加载提示', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesGuideTool, {
        guideName: '王导购',
        loading: true,
      })
    );
    assert.ok(html.includes('加载中'), '加载中应展示');
    assert.ok(!html.includes('data-testid="sales-guide-tool"'), '加载时不展示主容器');
  });

  // ── 错误状态 ──
  test('L1-反例: 错误时应展示错误信息', () => {
    const errorMsg = '网络连接失败，请稍后重试';
    const html = renderToStaticMarkup(
      React.createElement(SalesGuideTool, {
        guideName: '王导购',
        error: errorMsg,
      })
    );
    assert.ok(html.includes(errorMsg), '错误信息应展示');
    assert.ok(!html.includes('data-testid="sales-guide-tool"'), '错误时不展示主容器');
  });

  // ── 推荐商品交互 ──
  test('L1-正例: 推荐商品展示价格和原因', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesGuideTool, {
        guideName: '王导购',
        recommendations: mockRecommendations,
      })
    );
    assert.ok(html.includes('1,280'), '价格应展示');
    assert.ok(html.includes(mockRecommendations[0].reason), '推荐原因应展示');
    assert.ok(html.includes(`库存: ${mockRecommendations[0].stock}`), '库存应展示');
  });

  // ── 提醒优先级 ──
  test('L1-正例: 提醒显示优先级和标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesGuideTool, {
        guideName: '王导购',
        alerts: mockAlerts,
      })
    );
    assert.ok(html.includes('medium'), '中等优先级标签');
    assert.ok(html.includes('high'), '高优先级标签');
    assert.ok(html.includes('VIP到店'), 'VIP到店标签');
  });

  // ── 业绩统计数据 ──
  test('L1-正例: 业绩统计Render完整', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesGuideTool, {
        guideName: '王导购',
        performance: mockPerformance,
      })
    );
    assert.ok(html.includes(mockPerformance.customersServed.toString()), '接待顾客数');
    assert.ok(html.includes('12,560'), '销售额');
    assert.ok(html.includes('42.0%'), '转化率');
    assert.ok(html.includes('1,570'), '客单价');
  });

  // ── data-testid 属性 ──
  test('L1-正例: 数据元素含 testid 属性', () => {
    const html = renderToStaticMarkup(
      React.createElement(SalesGuideTool, {
        guideName: '王导购',
        currentCustomer: mockCustomer,
        recommendations: mockRecommendations,
        alerts: mockAlerts,
      })
    );
    assert.ok(html.includes(`data-testid="customer-card-${mockCustomer.id}"`));
    assert.ok(html.includes(`data-testid="recommend-${mockRecommendations[0].id}"`));
    assert.ok(html.includes(`data-testid="alert-${mockAlerts[0].id}"`));
  });
});
