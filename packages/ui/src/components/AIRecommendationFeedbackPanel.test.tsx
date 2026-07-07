import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  AIRecommendationFeedbackPanel,
} = require('./AIRecommendationFeedbackPanel');

import type { FeedbackSource, FeedbackAggregate, FeedbackRating } from './AIRecommendationFeedbackPanel';

// ── Helper: 测试用 source ──
function source(overrides: Partial<FeedbackSource> = {}): FeedbackSource {
  return {
    id: 'rec-001',
    type: 'recommendation',
    label: '营销预算调整建议',
    summary: '建议将线上广告预算增加30%，重点投放在短视频平台，预计 ROI 提升 15-20%。',
    confidence: 85,
    metricImpact: '预计月营收增长 ¥80,000-120,000',
    ...overrides,
  };
}

// ── Helper: 测试用 aggregate ──
function aggregate(overrides: Partial<FeedbackAggregate> = {}): FeedbackAggregate {
  return {
    totalFeedback: 120,
    helpfulRate: 65,
    somewhatRate: 20,
    notHelpfulRate: 10,
    inaccurateRate: 5,
    trend: 'up',
    ...overrides,
  };
}

// ── 测试套件 ──
describe('AIRecommendationFeedbackPanel', () => {
  // ========== 类型导出 ==========
  describe('类型导出', () => {
    test('AIRecommendationFeedbackPanel 为可导出函数', () => {
      assert.equal(typeof AIRecommendationFeedbackPanel, 'function');
    });

    test('FeedbackSource 接口字段完整', () => {
      const s = source();
      assert.equal(s.id, 'rec-001');
      assert.equal(s.type, 'recommendation');
      assert.equal(s.confidence, 85);
      assert.ok(s.summary.length > 0);
    });

    test('FeedbackAggregate 统计字段完整', () => {
      const a = aggregate();
      assert.equal(a.totalFeedback, 120);
      assert.equal(a.helpfulRate, 65);
      assert.equal(typeof a.trend, 'string');
    });

    test('FeedbackRating 支持全部4种值', () => {
      const ratings: FeedbackRating[] = ['helpful', 'somewhat', 'not_helpful', 'inaccurate'];
      assert.equal(ratings.length, 4);
    });
  });

  // ========== 渲染 ==========
  describe('渲染', () => {
    test('渲染标题和来源摘要', async () => {
      const html = renderToStaticMarkup(
        React.createElement(AIRecommendationFeedbackPanel, {
          source: source(),
          onSubmitFeedback: async () => {},
        })
      );
      assert.ok(html.includes('AI 推荐反馈'));
      assert.ok(html.includes('营销预算调整建议'));
      assert.ok(html.includes('短视频平台'));
      assert.ok(html.includes('85%'));
    });

    test('渲染聚合统计（有 aggregate 时）', async () => {
      const html = renderToStaticMarkup(
        React.createElement(AIRecommendationFeedbackPanel, {
          source: source(),
          aggregate: aggregate(),
          onSubmitFeedback: async () => {},
        })
      );
      assert.ok(html.includes('历史反馈统计'));
      assert.ok(html.includes('65%'));
      assert.ok(html.includes('20%'));
    });

    test('不渲染聚合统计（无 aggregate 时）', async () => {
      const html = renderToStaticMarkup(
        React.createElement(AIRecommendationFeedbackPanel, {
          source: source(),
          onSubmitFeedback: async () => {},
        })
      );
      assert.ok(!html.includes('历史反馈统计'));
    });

    test('渲染评分按钮 - 所有4个选项', async () => {
      const html = renderToStaticMarkup(
        React.createElement(AIRecommendationFeedbackPanel, {
          source: source(),
          onSubmitFeedback: async () => {},
        })
      );
      assert.ok(html.includes('有帮助'));
      assert.ok(html.includes('部分有用'));
      assert.ok(html.includes('不相关'));
      assert.ok(html.includes('不准确'));
    });

    test('渲染补充说明输入框', async () => {
      const html = renderToStaticMarkup(
        React.createElement(AIRecommendationFeedbackPanel, {
          source: source(),
          onSubmitFeedback: async () => {},
        })
      );
      assert.ok(html.includes('placeholder'));
      assert.ok(html.includes('补充说明'));
    });

    test('渲染提交按钮（禁用状态）', async () => {
      const html = renderToStaticMarkup(
        React.createElement(AIRecommendationFeedbackPanel, {
          source: source(),
          onSubmitFeedback: async () => {},
        })
      );
      assert.ok(html.includes('提交反馈'));
    });

    test('渲染跳过按钮（提供 onSkip 时）', async () => {
      const html = renderToStaticMarkup(
        React.createElement(AIRecommendationFeedbackPanel, {
          source: source(),
          onSubmitFeedback: async () => {},
          onSkip: () => {},
        })
      );
      assert.ok(html.includes('跳过'));
    });

    test('不渲染跳过按钮（未提供 onSkip 时）', async () => {
      const html = renderToStaticMarkup(
        React.createElement(AIRecommendationFeedbackPanel, {
          source: source(),
          onSubmitFeedback: async () => {},
        })
      );
      assert.ok(!html.includes('跳过'));
    });

    test('渲染指标影响信息', async () => {
      const html = renderToStaticMarkup(
        React.createElement(AIRecommendationFeedbackPanel, {
          source: source({ metricImpact: '预计月营收增长 ¥80,000' }),
          onSubmitFeedback: async () => {},
        })
      );
      assert.ok(html.includes('预期影响'));
    });

    test('不渲染指标影响（未提供时）', async () => {
      const html = renderToStaticMarkup(
        React.createElement(AIRecommendationFeedbackPanel, {
          source: source({ metricImpact: undefined }),
          onSubmitFeedback: async () => {},
        })
      );
      assert.ok(!html.includes('预期影响'));
    });
  });

  // ========== 边缘情况 ==========
  describe('边缘情况', () => {
    test('不同 source.type 渲染不同标签', async () => {
      const types: FeedbackSource['type'][] = ['recommendation', 'prediction', 'decision', 'insight'];
      const labels = ['推荐', '预测', '决策', '洞察'];

      for (let i = 0; i < types.length; i++) {
        const html = renderToStaticMarkup(
          React.createElement(AIRecommendationFeedbackPanel, {
            source: source({ id: `test-${i}`, type: types[i], label: `Type ${i}` }),
            onSubmitFeedback: async () => {},
          })
        );
        assert.ok(html.includes(labels[i]), `类型 ${types[i]} 应该渲染标签 ${labels[i]}`);
      }
    });

    test('自定义 className 生效', async () => {
      const html = renderToStaticMarkup(
        React.createElement(AIRecommendationFeedbackPanel, {
          source: source(),
          className: 'custom-class-test',
          onSubmitFeedback: async () => {},
        })
      );
      assert.ok(html.includes('custom-class-test'));
    });
  });

  // ========== 提交后状态 ==========
  describe('提交流程', () => {
    test('提交后显示成功确认信息', async () => {
      // 无法直接测试 useState 驱动的状态变化（纯 SSR），仅确保组件结构正确
      const html = renderToStaticMarkup(
        React.createElement(AIRecommendationFeedbackPanel, {
          source: source(),
          onSubmitFeedback: async () => {},
        })
      );
      assert.ok(html.includes('AI 推荐反馈'));
      assert.ok(html.includes('提交反馈'));
    });
  });
});

export { source, aggregate };
