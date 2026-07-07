import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const { AISuggestionCard } = require('./AISuggestionCard') as typeof import('./AISuggestionCard');
import type { SuggestionItem } from './AISuggestionCard';

// ---- Helpers ----

function containsText(html: string, text: string): boolean {
  return html.includes(text);
}

function getAttr(html: string, attr: string): string | null {
  const match = html.match(new RegExp(`${attr}="([^"]*)"`));
  return match ? match[1] : null;
}

function countOccurrences(html: string, text: string): number {
  return (html.match(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
}

// ---- Sample Data ----

const mockSuggestion: SuggestionItem = {
  id: 'sug-001',
  title: '增加夜间促销活动',
  description: '基于近7日数据分析，22:00-24:00时段客单价提升40%，建议增加夜间专属优惠。',
  priority: 'high',
  source: 'ai',
  confidence: 87,
  expectedBenefit: '提升夜间营收 15-20%',
  relatedMetrics: [
    { label: '夜间客单价', value: '¥128', trend: 'up' },
    { label: '夜间客流', value: '+23%', trend: 'up' },
  ],
  actions: [
    { label: '查看详情', key: 'view', variant: 'primary' },
    { label: '配置规则', key: 'config', variant: 'secondary' },
  ],
  createdAt: '2026-07-07T10:30:00Z',
  tags: ['促销', '夜间'],
};

const criticalSuggestion: SuggestionItem = {
  id: 'sug-002',
  title: '库存预警：A类商品不足',
  description: 'A类商品SKU-2034库存仅剩12件，低于安全库存线，建议立即补货。',
  priority: 'critical',
  source: 'rule',
  confidence: 95,
  expectedBenefit: '避免缺货损失',
  actions: [{ label: '创建补货单', key: 'replenish', variant: 'primary' }],
  createdAt: '2026-07-07T11:00:00Z',
};

const lowPrioritySuggestion: SuggestionItem = {
  id: 'sug-003',
  title: '优化商品陈列布局',
  description: '热区B3区块转化率低于平均值，建议调整陈列布局。',
  priority: 'low',
  source: 'system',
  confidence: 45,
};

// ---- Tests ----

void test('AISuggestionCard — renders title and priority/source badges', () => {
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={mockSuggestion} />);
  assert.ok(containsText(html, '增加夜间促销活动'), 'should render title');
  assert.ok(containsText(html, '高'), 'should render high priority badge');
  assert.ok(containsText(html, 'AI 分析'), 'should render AI source badge');
});

void test('AISuggestionCard — renders description, confidence and expected benefit', () => {
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={mockSuggestion} />);
  assert.ok(containsText(html, '22:00-24:00'), 'should render description');
  assert.ok(containsText(html, '87%'), 'should render confidence 87%');
  assert.ok(containsText(html, '提升夜间营收 15-20%'), 'should render expected benefit');
});

void test('AISuggestionCard — renders related metrics with trends', () => {
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={mockSuggestion} />);
  assert.ok(containsText(html, '¥128'), 'should render metric value');
  assert.ok(containsText(html, '+23%'), 'should render growth metric');
  assert.ok(containsText(html, '↑'), 'should render up trend');
});

void test('AISuggestionCard — renders tags', () => {
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={mockSuggestion} />);
  assert.ok(containsText(html, '促销'), 'should render tag: 促销');
  assert.ok(containsText(html, '夜间'), 'should render tag: 夜间');
});

void test('AISuggestionCard — renders action buttons', () => {
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={mockSuggestion} />);
  assert.ok(containsText(html, '查看详情'), 'should render primary action');
  assert.ok(containsText(html, '配置规则'), 'should render secondary action');
});

void test('AISuggestionCard — pre-fills adopted state', () => {
  const adopted = { ...mockSuggestion, adopted: true };
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={adopted} />);
  assert.ok(containsText(html, '✓ 已采纳'), 'should show adopted state');
});

void test('AISuggestionCard — renders compact variant with expand toggle', () => {
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={lowPrioritySuggestion} variant="compact" />);
  assert.ok(containsText(html, '优化商品陈列布局'), 'should render title in compact mode');
  assert.ok(containsText(html, '低'), 'should render low priority badge');
});

void test('AISuggestionCard — renders critical priority', () => {
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={criticalSuggestion} />);
  assert.ok(containsText(html, '紧急'), 'should render critical badge');
  assert.ok(containsText(html, '规则引擎'), 'should render rule source');
  assert.ok(containsText(html, '95%'), 'should render 95% confidence');
  assert.ok(containsText(html, '创建补货单'), 'should render action button');
});

void test('AISuggestionCard — renders without actions gracefully', () => {
  const sugNoActions: SuggestionItem = { ...lowPrioritySuggestion, id: 'sug-test', title: '无操作建议' };
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={sugNoActions} />);
  assert.ok(containsText(html, '无操作建议'), 'should render title');
  // should not contain adopt button (no onAdopt callback)
  assert.ok(!containsText(html, '采纳建议'), 'should not render adopt button');
});

void test('AISuggestionCard — renders with data-testid', () => {
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={mockSuggestion} className="test-card" />);
  assert.ok(containsText(html, 'test-card'), 'should render className');
});

void test('AISuggestionCard — exports component as function', () => {
  assert.equal(typeof AISuggestionCard, 'function', 'AISuggestionCard should be a function');
});

void test('AISuggestionCard — medium priority renders correctly', () => {
  const medium: SuggestionItem = {
    id: 'sug-med',
    title: '建议优化库存周转',
    description: '当前周转天数偏高。',
    priority: 'medium',
    source: 'ai',
    confidence: 72,
  };
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={medium} />);
  assert.ok(containsText(html, '建议优化库存周转'), 'should render medium suggestion title');
  assert.ok(containsText(html, '中'), 'should render medium badge');
});

void test('AISuggestionCard — renders expected benefit with green color', () => {
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={criticalSuggestion} />);
  assert.ok(containsText(html, '避免缺货损失'), 'should render expected benefit');
});

void test('AISuggestionCard — detailed variant shows all content', () => {
  const html = renderToStaticMarkup(<AISuggestionCard suggestion={criticalSuggestion} />);
  assert.ok(containsText(html, criticalSuggestion.description), 'should render description in detailed');
});
