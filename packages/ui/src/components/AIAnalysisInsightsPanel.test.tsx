import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  AIAnalysisInsightsPanel,
} = require('./AIAnalysisInsightsPanel');

import type { AnalysisInsight } from './AIAnalysisInsightsPanel';

// ── Helper: 生成一条测试洞察 ──
function insight(overrides: Partial<AnalysisInsight> = {}): AnalysisInsight {
  return {
    id: 'ins-default',
    category: 'sales',
    title: '测试洞察',
    description: '这是一条测试洞察描述',
    severity: 'medium',
    confidence: 80,
    generatedAt: '2026-06-26T08:00:00Z',
    isRead: false,
    ...overrides,
  };
}

// ── 测试套件 ──
describe('AIAnalysisInsightsPanel', () => {
  // ========== 类型导出 ==========
  describe('类型导出', () => {
    test('AIAnalysisInsightsPanel 为可导出函数', () => {
      assert.equal(typeof AIAnalysisInsightsPanel, 'function');
    });

    test('AnalysisInsight 接口字段完整', () => {
      const i = insight();
      assert.equal(i.id, 'ins-default');
      assert.equal(i.category, 'sales');
      assert.equal(i.severity, 'medium');
      assert.equal(i.confidence, 80);
    });

    test('支持全部6种 category 枚举值', () => {
      const cats: AnalysisInsight['category'][] = [
        'sales', 'customer', 'inventory', 'anomaly', 'recommendation', 'trend',
      ];
      assert.equal(cats.length, 6);
    });

    test('支持全部5种 severity 枚举值', () => {
      const sevs: AnalysisInsight['severity'][] = [
        'critical', 'high', 'medium', 'low', 'info',
      ];
      assert.equal(sevs.length, 5);
    });

    test('可选字段兼容', () => {
      const i: AnalysisInsight = {
        id: 'opt-test',
        category: 'anomaly',
        title: '测试',
        description: 'desc',
        severity: 'critical',
        confidence: 95,
        generatedAt: new Date().toISOString(),
        impactValue: '¥999',
        impactLabel: '潜在损失 ¥999',
        isRead: true,
        relatedId: 'order-123',
      };
      assert.equal(i.impactValue, '¥999');
      assert.equal(i.relatedId, 'order-123');
    });
  });

  // ========== SSR 渲染 ==========
  describe('SSR 渲染', () => {
    test('渲染自定义标题和描述', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [
            insight({ id: 'a1', title: 'A1' }),
            insight({ id: 'a2', title: 'A2' }),
          ],
          title: '智能分析洞察',
          description: 'AI 驱动',
        }),
      );
      assert.ok(html.includes('智能分析洞察'), 'should have custom title');
      assert.ok(html.includes('AI 驱动'), 'should have description');
    });

    test('渲染默认标题', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [insight()],
        }),
      );
      assert.ok(html.includes('AI 分析洞察'), 'should have default title');
    });

    test('渲染洞察标题和描述', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [
            insight({ id: 'i1', title: '销售额增长', description: '环比+23%' }),
            insight({ id: 'i2', title: '库存预警', description: '库存不足' }),
          ],
        }),
      );
      assert.ok(html.includes('销售额增长'), 'should render insight title');
      assert.ok(html.includes('环比+23%'), 'should render description');
      assert.ok(html.includes('库存预警'), 'should render 2nd title');
      assert.ok(html.includes('库存不足'), 'should render 2nd desc');
    });

    test('渲染严重度标签', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [
            insight({ id: 'i1', severity: 'critical' }),
            insight({ id: 'i2', severity: 'high' }),
            insight({ id: 'i3', severity: 'medium' }),
            insight({ id: 'i4', severity: 'info' }),
          ],
        }),
      );
      assert.ok(html.includes('严重'));
      assert.ok(html.includes('高'));
      assert.ok(html.includes('中'));
      assert.ok(html.includes('信息'));
    });

    test('渲染可信度百分比', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [
            insight({ id: 'i1', confidence: 85 }),
            insight({ id: 'i2', confidence: 72 }),
          ],
        }),
      );
      assert.ok(html.includes('85%'));
      assert.ok(html.includes('72%'));
    });

    test('渲染影响数值', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [
            insight({
              id: 'i1',
              impactValue: '¥12,000',
              impactLabel: '预计增收 ¥12,000',
            }),
          ],
        }),
      );
      assert.ok(html.includes('预计增收 ¥12,000'));
    });

    test('渲染类别标签', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [
            insight({ id: 'i1', category: 'sales' }),
            insight({ id: 'i2', category: 'customer' }),
            insight({ id: 'i3', category: 'inventory' }),
          ],
        }),
      );
      assert.ok(html.includes('销售洞察'));
      assert.ok(html.includes('客户洞察'));
      assert.ok(html.includes('库存洞察'));
    });
  });

  // ========== 状态处理 ==========
  describe('状态处理', () => {
    test('空数据时显示空状态', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, { insights: [] }),
      );
      assert.ok(html.includes('暂未生成分析洞察'));
    });

    test('错误时显示错误提示', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [],
          error: 'API Error',
        }),
      );
      assert.ok(html.includes('加载洞察失败'));
      assert.ok(html.includes('API Error'));
    });

    test('错误时显示重新加载按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [],
          error: 'err',
          onRefresh: function () {},
        }),
      );
      assert.ok(html.includes('重新加载'));
    });

    test('加载中渲染骨架（无空状态文字）', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [],
          loading: true,
        }),
      );
      assert.ok(!html.includes('暂未生成分析洞察'), 'loading should suppress empty state');
    });
  });

  // ========== 未读与分类 ==========
  describe('未读与统计', () => {
    test('有未读时渲染"全部已读"按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [
            insight({ id: 'i1', isRead: false }),
            insight({ id: 'i2', isRead: true }),
          ],
          onMarkAllRead: function () {},
        }),
      );
      assert.ok(html.includes('全部已读'));
    });

    test('全部已读时隐藏"全部已读"按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [
            insight({ id: 'i1', isRead: true }),
            insight({ id: 'i2', isRead: true }),
          ],
          onMarkAllRead: function () {},
        }),
      );
      assert.ok(!html.includes('全部已读'));
    });

    test('未读计数徽标被渲染', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [
            insight({ id: 'i1', isRead: false }),
            insight({ id: 'i2', isRead: false, category: 'anomaly', severity: 'critical' }),
            insight({ id: 'i3', isRead: true }),
          ],
        }),
      );
      assert.ok(html.includes('严重洞察'), 'should render severity analysis');
      assert.ok(html.includes('未读'), 'should render unread section');
    });

    test('渲染刷新按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AIAnalysisInsightsPanel, {
          insights: [insight()],
          onRefresh: function () {},
        }),
      );
      assert.ok(html.includes('🔄'), 'should render refresh button');
    });
  });
});
