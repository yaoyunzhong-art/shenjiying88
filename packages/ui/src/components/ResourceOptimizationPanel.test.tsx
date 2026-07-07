import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { ResourceOptimizationPanel } = require('./ResourceOptimizationPanel');
import type { ResourceOptimizationSuggestion } from './ResourceOptimizationPanel';

const mockSuggestions: ResourceOptimizationSuggestion[] = [
  {
    id: 's1',
    category: 'STAFF',
    title: '优化早班排班',
    description: '早高峰客流增加28%，建议增加1名收银员',
    estimatedBenefit: '日均增收¥1,200',
    effortLevel: 'LOW',
    priority: 1,
  },
  {
    id: 's2',
    category: 'EQUIPMENT',
    title: '收银机维护提醒',
    description: '3号收银机交易耗时超平均值42%，建议检修',
    estimatedBenefit: '减少排队时间35%',
    effortLevel: 'MEDIUM',
    priority: 2,
  },
  {
    id: 's3',
    category: 'INVENTORY',
    title: 'A类商品补货',
    description: '生鲜类库存周转率提升15%，建议增加30%备货量',
    estimatedBenefit: '减少缺货损失¥3,500/周',
    effortLevel: 'HIGH',
    priority: 3,
  },
]

function render(props: Record<string, unknown> = {}) {
  return ResourceOptimizationPanel({
    suggestions: mockSuggestions,
    ...props,
  });
}

function renderedText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(renderedText).join('');
  const el = node as React.ReactElement;
  if (el.props?.children) return renderedText(el.props.children);
  return '';
}

test('ResourceOptimizationPanel: renders title', () => {
  const text = renderedText(render());
  assert.ok(text.includes('AI 资源优化建议'));
});

test('ResourceOptimizationPanel: loads with skeleton when isLoading', () => {
  const r = render({ isLoading: true, suggestions: [] });
  assert.equal(r.props['data-testid'], 'resource-optimization-loading');
});

test('ResourceOptimizationPanel: shows empty state when no suggestions', () => {
  const text = renderedText(render({ suggestions: [] }));
  assert.ok(text.includes('暂无优化建议'));
});

test('ResourceOptimizationPanel: renders all suggestion titles', () => {
  const text = renderedText(render());
  assert.ok(text.includes('优化早班排班'));
  assert.ok(text.includes('收银机维护提醒'));
  assert.ok(text.includes('A类商品补货'));
});

test('ResourceOptimizationPanel: displays category badges text', () => {
  const text = renderedText(render());
  assert.ok(text.includes('人员'));
  assert.ok(text.includes('设备'));
  assert.ok(text.includes('库存'));
});

test('ResourceOptimizationPanel: displays estimated benefit', () => {
  const text = renderedText(render());
  assert.ok(text.includes('日均增收'));
  assert.ok(text.includes('减少排队时间'));
  assert.ok(text.includes('减少缺货损失'));
});

test('ResourceOptimizationPanel: displays effort level labels', () => {
  const text = renderedText(render());
  assert.ok(text.includes('低投入'));
  assert.ok(text.includes('中等投入'));
  assert.ok(text.includes('高投入'));
});
