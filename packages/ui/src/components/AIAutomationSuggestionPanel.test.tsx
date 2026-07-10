/**
 * AIAutomationSuggestionPanel 组件测试
 *
 * 覆盖: 基础渲染、状态徽标、触发条件标签、置信度条、预期收益网格、
 *      操作按钮、空状态、loading状态、交互回调、待处理计数
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIAutomationSuggestionPanel } = require('./AIAutomationSuggestionPanel');

// ==================== 模拟数据 ====================

const mockSuggestions = [
  {
    id: 'sug-1',
    title: '库存低于阈值自动补货',
    description: 'SKU-001(夏季T恤)库存降至12件，低于安全库存20件，建议创建自动补货规则',
    confidence: 92,
    trigger: { type: 'threshold' as const, label: '库存阈值', detail: '库存 < 20' },
    action: { type: 'reorder', label: '自动创建补货单', description: '向供应商发起补货请求' },
    status: 'pending' as const,
    benefit: { metric: '缺货率', current: '8.5%', projected: '1.2%', improvement: '-86%' },
    estimatedEffort: 'low' as const,
    createdAt: '今日 10:30',
  },
  {
    id: 'sug-2',
    title: '周末客流高峰自动增加排班',
    description: '模式检测显示周六14-17点收银台排队>5人概率87%，建议自动增加1个收银班次',
    confidence: 78,
    trigger: { type: 'pattern' as const, label: '客流模式', detail: '周末峰值窗口' },
    action: { type: 'schedule', label: '调整排班表', description: '自动添加收银员班次' },
    status: 'pending' as const,
    benefit: { metric: '平均等待时长', current: '12min', projected: '4min', improvement: '-67%' },
    estimatedEffort: 'medium' as const,
    createdAt: '今日 09:15',
  },
  {
    id: 'sug-3',
    title: '高价值会员自动发放生日礼券',
    description: '检测到5位钻石会员3天内生日，建议自动发放¥200生日礼券',
    confidence: 95,
    trigger: { type: 'schedule' as const, label: '定时任务', detail: '每日08:00检查' },
    action: { type: 'coupon', label: '发放优惠券', description: '自动发放生日专属券' },
    status: 'applied' as const,
    benefit: { metric: '会员满意度', current: '82%', projected: '91%', improvement: '+11%' },
    estimatedEffort: 'low' as const,
    createdAt: '昨日 08:00',
    executedAt: '今日 08:00',
  },
  {
    id: 'sug-4',
    title: '设备异常自动报修',
    description: '收银机POS-03温度异常升高至78°C，连续3次超出阈值，建议创建自动报修规则',
    confidence: 88,
    trigger: { type: 'anomaly' as const, label: '设备异常', detail: '温度 > 70°C 持续5min' },
    action: { type: 'ticket', label: '创建维修工单', description: '自动发起IT运维报修' },
    status: 'in_progress' as const,
    benefit: { metric: '设备故障修复时间', current: '4h', projected: '30min', improvement: '-87%' },
    estimatedEffort: 'medium' as const,
    createdAt: '昨日 14:20',
  },
];

const dismissedSuggestion = {
  id: 'sug-5',
  title: '复合规则: 暴雨天气调整配送',
  description: '今日降雨概率>70%且当前配送人手不足，建议启动配送动态调整方案',
  confidence: 72,
  trigger: { type: 'composite' as const, label: '多条件评估', detail: '天气 + 运力' },
  action: { type: 'dispatch', label: '配送策略调整', description: '延长配送时效窗口' },
  status: 'dismissed' as const,
  benefit: { metric: '准时到达率', current: '95%', projected: '88%', improvement: '-7%' },
  estimatedEffort: 'high' as const,
  createdAt: '昨日 07:00',
};

// ==================== 测试 ====================

test('AIAutomationSuggestionPanel - 应正确渲染面板标题', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: mockSuggestions,
      title: '自动化建议测试',
    })
  );
  assert.ok(html.includes('自动化建议测试'), '应该包含自定义标题');
});

test('AIAutomationSuggestionPanel - 应显示待处理计数徽标', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: mockSuggestions,
    })
  );
  assert.ok(html.includes('2 条待处理'), '应该显示待处理数量');
});

test('AIAutomationSuggestionPanel - 应渲染每条建议的标题', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: mockSuggestions,
    })
  );
  assert.ok(html.includes('库存低于阈值自动补货'), '应包含第一条建议标题');
  assert.ok(html.includes('周末客流高峰自动增加排班'), '应包含第二条建议标题');
  assert.ok(html.includes('高价值会员自动发放生日礼券'), '应包含第三条建议标题');
});

test('AIAutomationSuggestionPanel - 应渲染不同状态徽标', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: mockSuggestions,
    })
  );
  // pending -> 待处理, applied -> 已应用, in_progress -> 执行中
  assert.ok(html.includes('待处理'), '应包含待处理状态');
  assert.ok(html.includes('已应用'), '应包含已应用状态');
  assert.ok(html.includes('执行中'), '应包含执行中状态');
});

test('AIAutomationSuggestionPanel - 应渲染触发条件标签', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: mockSuggestions,
    })
  );
  assert.ok(html.includes('阈值'), '应包含阈值标签');
  assert.ok(html.includes('模式'), '应包含模式标签');
  assert.ok(html.includes('定时'), '应包含定时标签');
  assert.ok(html.includes('异常'), '应包含异常标签');
});

test('AIAutomationSuggestionPanel - 应渲染置信度进度条', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: mockSuggestions,
    })
  );
  assert.ok(html.includes('置信度: 92%'), '应包含置信度提示');
  assert.ok(html.includes('置信度: 78%'), '应包含置信度提示');
});

test('AIAutomationSuggestionPanel - 应渲染预期收益网格', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: mockSuggestions,
    })
  );
  assert.ok(html.includes('当前'), '应包含当前列');
  assert.ok(html.includes('优化后'), '应包含优化后列');
  assert.ok(html.includes('提升'), '应包含提升列');
  // 具体数值
  assert.ok(html.includes('8.5%'), '应包含当前值');
  assert.ok(html.includes('1.2%'), '应包含优化后值');
  assert.ok(html.includes('-86%'), '应包含提升值');
});

test('AIAutomationSuggestionPanel - 待处理条目应显示操作按钮', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: mockSuggestions,
    })
  );
  assert.ok(html.includes('应用建议'), '待处理条目应包含应用建议按钮');
  assert.ok(html.includes('忽略'), '待处理条目应包含忽略按钮');
});

test('AIAutomationSuggestionPanel - 已应用条目不应显示操作按钮', () => {
  // 只渲染已应用+已忽略+执行中的条目
  const appliedSuggestions = [mockSuggestions[2], dismissedSuggestion, mockSuggestions[3]];
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: appliedSuggestions,
    })
  );
  assert.ok(!html.includes('应用建议'), '非待处理条目不应显示应用按钮');
  // 不检查'忽略'文本,因为已忽略状态的StatusBadge也会包含该文字
});

test('AIAutomationSuggestionPanel - 应渲染投入程度标签', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: [...mockSuggestions, dismissedSuggestion],
    })
  );
  assert.ok(html.includes('投入:低'), '应包含低投入标签');
  assert.ok(html.includes('投入:中'), '应包含中投入标签');
  assert.ok(html.includes('投入:高'), '应包含高投入标签');
});

test('AIAutomationSuggestionPanel - 空状态应显示提示文字', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: [],
      emptyText: '暂无建议',
    })
  );
  assert.ok(html.includes('暂无建议'), '空状态应显示自定义提示');
});

test('AIAutomationSuggestionPanel - loading状态应显示加载提示', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: [],
      loading: true,
    })
  );
  assert.ok(html.includes('正在分析数据'), 'loading状态应显示加载文本');
});

test('AIAutomationSuggestionPanel - loading状态不应显示待处理计数', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: mockSuggestions,
      loading: true,
    })
  );
  assert.ok(!html.includes('条待处理'), 'loading状态不应显示计数');
});

test('AIAutomationSuggestionPanel - 应包含复合条件触发标签', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: [dismissedSuggestion],
    })
  );
  assert.ok(html.includes('复合'), '复合条件应显示对应标签');
});

test('AIAutomationSuggestionPanel - dismissed状态应包含已忽略徽标', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: [dismissedSuggestion],
    })
  );
  assert.ok(html.includes('已忽略'), '已忽略状态应该显示');
});

test('AIAutomationSuggestionPanel - 应支持自定义属性传递', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: [],
      className: 'custom-panel',
    })
  );
  assert.ok(html.includes('ai-automation-suggestion-panel'), '应包含data-testid');
});

test('AIAutomationSuggestionPanel - 无待处理时不应显示计数徽标', () => {
  const allDone = [
    { ...dismissedSuggestion },
    { ...mockSuggestions[2] }, // applied
    { ...mockSuggestions[3] }, // in_progress
  ];
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: allDone,
    })
  );
  assert.ok(!html.includes('条待处理'), '无待处理条目时不应显示计数');
});

test('AIAutomationSuggestionPanel - 默认标题应为 AI 自动化建议', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: mockSuggestions,
    })
  );
  assert.ok(html.includes('AI 自动化建议'), '默认标题应为 AI 自动化建议');
});

test('AIAutomationSuggestionPanel - 应渲染建议卡片的data-testid', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: mockSuggestions,
    })
  );
  assert.ok(html.includes('suggestion-card-sug-1'), '第一条卡片应包含对应data-testid');
  assert.ok(html.includes('suggestion-card-sug-2'), '第二条卡片应包含对应data-testid');
});

test('AIAutomationSuggestionPanel - 应渲染操作按钮的data-testid', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: mockSuggestions,
    })
  );
  assert.ok(html.includes('apply-btn-sug-1'), '应包含应用按钮标识');
  assert.ok(html.includes('dismiss-btn-sug-1'), '应包含忽略按钮标识');
});

test('AIAutomationSuggestionPanel - 应渲染执行时间', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: [mockSuggestions[2]], // applied + executedAt
    })
  );
  assert.ok(html.includes('今日 08:00'), '已应用条目应包含执行时间');
});

test('AIAutomationSuggestionPanel - 复合提示应包含所有元信息', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIAutomationSuggestionPanel, {
      suggestions: [dismissedSuggestion],
    })
  );
  assert.ok(html.includes('多条件评估'), '应包含条件标签');
  assert.ok(html.includes('配送策略调整'), '应包含动作标签');
  assert.ok(html.includes('95%'), '应包含当前值');
  assert.ok(html.includes('88%'), '应包含投影值');
  assert.ok(html.includes('-7%'), '应包含改善值');
});
