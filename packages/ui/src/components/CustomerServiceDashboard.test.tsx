import React from 'react';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { CustomerServiceDashboard } = require('./CustomerServiceDashboard');

describe('CustomerServiceDashboard (SSR renderToStaticMarkup)', () => {
  // ===== 基础渲染 =====
  it('应渲染团队名称和标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服团队',
        pendingTickets: [],
      })
    );
    assert.ok(html.includes('客服团队'));
    assert.ok(html.includes('客服主管工作台'));
  });

  it('应渲染自定义团队名称', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: 'VIP客服组',
        pendingTickets: [],
      })
    );
    assert.ok(html.includes('VIP客服组'));
  });

  // ===== 快速操作按钮 =====
  it('应渲染快速操作按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        pendingTickets: [],
        quickActions: [
          { key: 'assign', label: '分配工单', primary: true },
          { key: 'export', label: '导出报表' },
        ],
      })
    );
    assert.ok(html.includes('分配工单'));
    assert.ok(html.includes('导出报表'));
  });

  // ===== 服务概览 =====
  it('应显示今日服务概览', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        pendingTickets: [],
        serviceMetrics: {
          resolvedTickets: 42,
          avgResponseTime: 3.5,
          avgResolutionTime: 28,
          satisfactionScore: 4.7,
          resolvedTrend: 12,
          responseTrend: -8,
          resolutionTrend: -5,
          satisfactionTrend: 3,
        },
      })
    );
    assert.ok(html.includes('今日服务概览'));
    assert.ok(html.includes('已处理工单'));
    assert.ok(html.includes('平均响应'));
    assert.ok(html.includes('平均解决'));
    assert.ok(html.includes('客户满意度'));
  });

  it('不传 serviceMetrics 时不显示服务概览', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        pendingTickets: [],
      })
    );
    assert.equal(html.includes('今日服务概览'), false);
  });

  // ===== 座席状态 =====
  it('应显示座席状态摘要', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        pendingTickets: [],
        agentStatus: { total: 10, online: 5, busy: 2, away: 2, offline: 1 },
      })
    );
    assert.ok(html.includes('座席状态'));
    assert.ok(html.includes('在线'));
    assert.ok(html.includes('离线'));
  });

  it('座席状态显示正确的数字', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        pendingTickets: [],
        agentStatus: { total: 10, online: 5, busy: 2, away: 2, offline: 1 },
      })
    );
    assert.ok(html.includes('5'));
    assert.ok(html.includes('1'));
  });

  it('不传 agentStatus 时不显示座席状态', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        pendingTickets: [],
      })
    );
    assert.equal(html.includes('座席状态'), false);
  });

  // ===== 工单列表 =====
  it('待处理工单数量显示正确', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        pendingTickets: [
          { id: 'TK-001', title: '投诉1', customerName: 'A', priority: 'high', status: 'open', category: 'complaint', createdAt: '2026-06-26T08:00:00Z' },
          { id: 'TK-002', title: '投诉2', customerName: 'B', priority: 'medium', status: 'in_progress', category: 'inquiry', createdAt: '2026-06-26T09:00:00Z' },
        ],
      })
    );
    assert.ok(html.includes('2'));
  });

  it('空工单显示空状态提示', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        pendingTickets: [],
        serviceMetrics: {
          resolvedTickets: 10,
          avgResponseTime: 3,
          avgResolutionTime: 20,
          satisfactionScore: 4.5,
          resolvedTrend: 0,
          responseTrend: 0,
          resolutionTrend: 0,
          satisfactionTrend: 0,
        },
      })
    );
    assert.ok(html.includes('所有工单已处理完毕'));
    assert.ok(html.includes('暂无待处理的客户服务请求'));
  });

  // ===== 加载状态 =====
  it('loading=true 显示加载提示', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        loading: true,
        pendingTickets: [],
      })
    );
    assert.ok(html.includes('加载中...'));
  });

  it('loading=true 时不显示业务内容', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        loading: true,
        pendingTickets: [],
        serviceMetrics: {
          resolvedTickets: 10,
          avgResponseTime: 3,
          avgResolutionTime: 20,
          satisfactionScore: 4.5,
          resolvedTrend: 0,
          responseTrend: 0,
          resolutionTrend: 0,
          satisfactionTrend: 0,
        },
        agentStatus: { total: 5, online: 3, busy: 1, away: 0, offline: 1 },
      })
    );
    assert.equal(html.includes('今日服务概览'), false);
    assert.equal(html.includes('座席状态'), false);
  });

  // ===== 紧凑模式 =====
  it('compact 模式下正常渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        compact: true,
        pendingTickets: [],
      })
    );
    assert.ok(html.includes('客服'));
  });

  // ===== 边界情况 =====
  it('所有座席离线时正确显示', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        pendingTickets: [],
        agentStatus: { total: 5, online: 0, busy: 0, away: 0, offline: 5 },
      })
    );
    assert.ok(html.includes('离线'));
    assert.ok(html.includes('0'));
  });

  it('完全无数据不报错', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        pendingTickets: [],
      })
    );
    assert.ok(html);
  });

  // ===== 最后同步时间 =====
  it('显示最后同步时间', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        pendingTickets: [],
        lastSyncAt: '2026-06-26T08:30:00Z',
      })
    );
    assert.ok(html.includes('最后同步'));
  });

  it('不传 lastSyncAt 不显示同步时间', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerServiceDashboard, {
        teamName: '客服',
        pendingTickets: [],
      })
    );
    assert.equal(html.includes('最后同步'), false);
  });


});
