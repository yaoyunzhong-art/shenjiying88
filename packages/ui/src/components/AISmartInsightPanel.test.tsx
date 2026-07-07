/**
 * AISmartInsightPanel 组件测试
 *
 * 覆盖: 基础渲染、优先级标签、分类筛选、置信度条、空状态、交互回调、未读数徽标、忽略操作、compact模式
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AISmartInsightPanel } = require('./AISmartInsightPanel');


// ==================== 模拟数据 ====================

const mockInsights = [
  {
    id: 'insight-1',
    title: '周末客流高峰预警',
    description: '根据历史数据，本周末预计客流量将增长35%，建议增加收银台班次',
    priority: 'critical' as const,
    category: 'operation' as const,
    expectedImpact: '排队时长减少40%',
    confidence: 92,
    generatedAt: '今日 18:00',
  },
  {
    id: 'insight-2',
    title: '会员复购率下降',
    description: '近7天会员复购率下降12%，建议推送专属优惠券刺激回店',
    priority: 'high' as const,
    category: 'member' as const,
    expectedImpact: '复购率提升15-20%',
    confidence: 78,
    generatedAt: '今日 16:30',
  },
  {
    id: 'insight-3',
    title: '热销商品库存预警',
    description: '春季连衣裙SKU-001库存仅剩15件，建议及时补货',
    priority: 'high' as const,
    category: 'inventory' as const,
    expectedImpact: '避免断货损失约¥12,000',
    confidence: 85,
    generatedAt: '今日 15:00',
  },
  {
    id: 'insight-4',
    title: '周末促销建议',
    description: '数据分析显示满减活动转化率优于折扣，建议周末采用满300减50方案',
    priority: 'medium' as const,
    category: 'marketing' as const,
    expectedImpact: '客单价提升22%',
    confidence: 65,
    generatedAt: '今日 14:00',
  },
];

// ==================== 测试用例 ====================

test('AISmartInsightPanel: 渲染组件标题', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  assert.ok(html.includes('AI 智能建议'));
  assert.ok(html.includes('ai-smart-insight-panel'));
});

test('AISmartInsightPanel: 自定义标题', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, {
      insights: mockInsights,
      title: '今日运营建议',
    })
  );
  assert.ok(html.includes('今日运营建议'));
});

test('AISmartInsightPanel: 渲染所有建议标题', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  assert.ok(html.includes('周末客流高峰预警'));
  assert.ok(html.includes('会员复购率下降'));
  assert.ok(html.includes('热销商品库存预警'));
  assert.ok(html.includes('周末促销建议'));
});

test('AISmartInsightPanel: 渲染空状态', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: [] })
  );
  assert.ok(html.includes('暂无智能建议'));
  assert.ok(html.includes('empty-state'));
});

test('AISmartInsightPanel: 自定义空状态文案', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, {
      insights: [],
      emptyText: '分析中，请稍候',
    })
  );
  assert.ok(html.includes('分析中，请稍候'));
});

test('AISmartInsightPanel: 渲染优先级标签', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  assert.ok(html.includes('priority-badge-critical'));
  assert.ok(html.includes('priority-badge-high'));
  assert.ok(html.includes('priority-badge-medium'));
});

test('AISmartInsightPanel: 优先级标签包含文案', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  assert.ok(html.includes('紧急'));
  assert.ok(html.includes('高优'));
  assert.ok(html.includes('中等'));
});

test('AISmartInsightPanel: 渲染类别标签', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  assert.ok(html.includes('category-tag-operation'));
  assert.ok(html.includes('category-tag-member'));
  assert.ok(html.includes('category-tag-inventory'));
  assert.ok(html.includes('category-tag-marketing'));
});

test('AISmartInsightPanel: 类别标签显示中文', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  assert.ok(html.includes('运营效率'));
  assert.ok(html.includes('会员运营'));
  assert.ok(html.includes('库存优化'));
  assert.ok(html.includes('营销策略'));
});

test('AISmartInsightPanel: 渲染置信度条', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  assert.ok(html.includes('confidence-bar'));
  assert.ok(html.includes('92%'));
  assert.ok(html.includes('78%'));
  assert.ok(html.includes('85%'));
  assert.ok(html.includes('65%'));
});

test('AISmartInsightPanel: 渲染预期影响', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  assert.ok(html.includes('排队时长减少40%'));
  assert.ok(html.includes('复购率提升15-20%'));
  assert.ok(html.includes('避免断货损失约¥12,000'));
  assert.ok(html.includes('客单价提升22%'));
});

test('AISmartInsightPanel: 渲染生成时间', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  assert.ok(html.includes('今日 18:00'));
  assert.ok(html.includes('今日 16:30'));
});

test('AISmartInsightPanel: 未读提示徽标', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  // 默认未读，4条建议
  assert.ok(html.includes('unread-badge'));
  assert.ok(html.includes('mark-all-read-btn'));
});

test('AISmartInsightPanel: 全部标记已读按钮存在', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  assert.ok(html.includes('全部已读'));
});

test('AISmartInsightPanel: 组件具有region role和aria-label', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, {
      insights: mockInsights,
      title: '智能建议',
    })
  );
  assert.ok(html.includes('role="region"'));
  assert.ok(html.includes('aria-label="智能建议"'));
});

test('AISmartInsightPanel: 类别筛选渲染', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  assert.ok(html.includes('category-filter'));
  assert.ok(html.includes('filter-all'));
  assert.ok(html.includes('filter-member'));
  assert.ok(html.includes('filter-inventory'));
  assert.ok(html.includes('filter-operation'));
  assert.ok(html.includes('filter-marketing'));
});

test('AISmartInsightPanel: 自定义className', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, {
      insights: [],
      className: 'my-insight-panel',
    })
  );
  assert.ok(html.includes('my-insight-panel'));
});

test('AISmartInsightPanel: compact模式样式不同', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, {
      insights: mockInsights,
      compact: true,
    })
  );
  assert.ok(html.includes('AI 智能建议'));
  assert.ok(html.includes('周末客流高峰预警'));
  // compact模式下padding更小
  assert.ok(html.includes('padding:6px'));
});

test('AISmartInsightPanel: showCategoryFilter=false隐藏筛选栏', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, {
      insights: mockInsights,
      showCategoryFilter: false,
    })
  );
  assert.ok(!html.includes('category-filter'));
});

test('AISmartInsightPanel: 存在忽略按钮', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, {
      insights: [mockInsights[0]],
      onInsightDismiss: () => {},
    })
  );
  assert.ok(html.includes('dismiss-insight-1'));
});

test('AISmartInsightPanel: 忽略按钮含aria-label', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, {
      insights: [mockInsights[0]],
      onInsightDismiss: () => {},
    })
  );
  assert.ok(html.includes('aria-label="忽略 &quot;周末客流高峰预警&quot;"'));
});

test('AISmartInsightPanel: 描述渲染', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  assert.ok(html.includes('根据历史数据，本周末预计客流量将增长35%，建议增加收银台班次'));
});

test('AISmartInsightPanel: 组件是函数组件可被创建', () => {
  assert.equal(typeof AISmartInsightPanel, 'function');
});

test('AISmartInsightPanel: 可通过createElement创建有效元素', () => {
  const el = React.createElement(AISmartInsightPanel, { insights: [] });
  assert.ok(React.isValidElement(el));
});

test('AISmartInsightPanel: 优先级标签含aria-label', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: [mockInsights[0]] })
  );
  assert.ok(html.includes('aria-label="紧急优先级"'));
});

test('AISmartInsightPanel: 低优先级渲染', () => {
  const lowInsight = {
    id: 'insight-low',
    title: '营业时间调整参考',
    description: '数据显示早10点前客流较少，可考虑推迟开门时间',
    priority: 'low' as const,
    category: 'operation' as const,
    confidence: 45,
  };
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: [lowInsight] })
  );
  assert.ok(html.includes('priority-badge-low'));
  assert.ok(html.includes('参考'));
  assert.ok(html.includes('营业时间调整参考'));
  assert.ok(html.includes('45%'));
});

test('AISmartInsightPanel: 不使用showCategoryFilter时默认显示筛选', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: mockInsights })
  );
  // 默认showCategoryFilter=true, 应该显示全部按钮
  assert.ok(html.includes('全部'));
});

test('AISmartInsightPanel: 高置信度显示绿色', () => {
  const html = renderToStaticMarkup(
    React.createElement(AISmartInsightPanel, { insights: [mockInsights[0]] })
  );
  // CSS颜色 #22c55e 表示高置信度绿色 (SSR驼峰命名)
  assert.ok(html.includes('#22c55e'));
});
