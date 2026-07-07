import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {
  RuleRecommendationPanel,
} from './RuleRecommendationPanel';
import type {
  RuleRecommendation,
  RecommendationSummary,
  RecommendationConfidence,
  RecommendationCategory,
} from './RuleRecommendationPanel';

// ==================== 辅助函数 ====================

/** 递归解析 React 元素树，将函数组件节点替换为其实例化输出 */
function resolveElements(el: unknown): unknown {
  if (el == null || typeof el === 'boolean') return el;
  if (typeof el === 'string' || typeof el === 'number') return el;
  if (Array.isArray(el)) return el.map(resolveElements);
  if (typeof el === 'object') {
    const type = (el as Record<string, unknown>).type;
    const props = (el as Record<string, unknown>).props as Record<string, unknown> | undefined;
    if (typeof type === 'function') {
      return resolveElements((type as (p: unknown) => unknown)(props));
    }
    if (typeof type === 'string' && props?.children != null) {
      return { type, props: { ...props, children: resolveElements(props.children) } };
    }
  }
  return el;
}

function render(props: Record<string, unknown> = {}) {
  const raw = RuleRecommendationPanel(props as any);
  return resolveElements(raw) as Record<string, unknown>;
}

/** 将 JSX 节点树展平为单一文本字符串 */
function flattenText(children: unknown): string {
  if (children == null || typeof children === 'boolean') return '';
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(flattenText).join('');
  if (typeof children === 'object') {
    return flattenText(((children as Record<string, unknown>).props as Record<string, unknown> | undefined)?.children);
  }
  return '';
}

/** 递归查找 props.children 中匹配某个文本的元素 */
function findTextInChildren(children: unknown, target: string): boolean {
  return flattenText(children).includes(target);
}

/** 查找含指定文本的元素的 props */
function findElementProps(children: unknown, target: string): Record<string, unknown> | null {
  if (!children) return null;
  if (typeof children === 'string') return null;
  if (Array.isArray(children)) {
    for (const c of children) {
      const found = findElementProps(c, target);
      if (found) return found;
    }
    return null;
  }
  if (typeof children === 'object' && children !== null) {
    const el = children as Record<string, unknown>;
    const childProps = el.props as Record<string, unknown> | undefined;
    if (childProps?.children && findTextInChildren(childProps.children, target)) {
      return childProps;
    }
    if (childProps?.children) {
      const found = findElementProps(childProps.children, target);
      if (found) return found;
    }
  }
  return null;
}

// ==================== 测试数据 ====================

const mockRecommendations: RuleRecommendation[] = [
  {
    id: 'rec-1',
    title: '夜间交易风控规则',
    description: '建议对 23:00-05:00 的交易设置单笔上限，降低异常交易风险',
    category: 'security',
    confidence: 'high',
    impact: '预计减少 30% 异常交易',
    estimatedBenefit: '降低损失 15%',
    createdAt: '2026-06-25T10:00:00Z',
  },
  {
    id: 'rec-2',
    title: '会员积分过期提醒规则',
    description: '为即将过期的积分自动发送提醒通知，提升会员活跃度',
    category: 'member_retention',
    confidence: 'medium',
    impact: '预计提升积分兑换率 20%',
    createdAt: '2026-06-24T08:30:00Z',
  },
  {
    id: 'rec-3',
    title: '库存预警阈值调优',
    description: '根据近期销量波动，建议将热销品预警阈值从 50 下调至 30',
    category: 'performance',
    confidence: 'low',
    estimatedBenefit: '减少 8% 缺货损失',
    createdAt: '2026-06-23T14:00:00Z',
  },
];

// ==================== 测试 ====================

test('RuleRecommendationPanel: renders title', () => {
  const result = render({ recommendations: mockRecommendations });
  assert.ok(findTextInChildren(result.props.children, 'AI 规则建议'));
});

test('RuleRecommendationPanel: renders summary stats', () => {
  const summary: RecommendationSummary = {
    total: 3,
    highConfidence: 1,
    adopted: 0,
    totalEstimatedBenefit: '降低损失 15%',
  };
  const result = render({ recommendations: mockRecommendations, summary });
  assert.ok(findTextInChildren(result.props.children, '3 条建议'));
  assert.ok(findTextInChildren(result.props.children, '降低损失 15%'));
});

test('RuleRecommendationPanel: renders all recommendation titles', () => {
  const result = render({ recommendations: mockRecommendations });
  assert.ok(findTextInChildren(result.props.children, '夜间交易风控规则'));
  assert.ok(findTextInChildren(result.props.children, '会员积分过期提醒规则'));
  assert.ok(findTextInChildren(result.props.children, '库存预警阈值调优'));
});

test('RuleRecommendationPanel: renders confidence labels', () => {
  const result = render({ recommendations: mockRecommendations });
  assert.ok(findTextInChildren(result.props.children, '高置信'));
  assert.ok(findTextInChildren(result.props.children, '中置信'));
  assert.ok(findTextInChildren(result.props.children, '低置信'));
});

test('RuleRecommendationPanel: renders category labels', () => {
  const result = render({ recommendations: mockRecommendations });
  assert.ok(findTextInChildren(result.props.children, '安全'));
  assert.ok(findTextInChildren(result.props.children, '会员留存'));
  assert.ok(findTextInChildren(result.props.children, '性能'));
});

test('RuleRecommendationPanel: loading state shows skeleton', () => {
  const result = render({ recommendations: [], loading: true });
  assert.ok(findTextInChildren(result.props.children, '加载推荐规则中'));
});

test('RuleRecommendationPanel: empty state shows message', () => {
  const result = render({ recommendations: [] });
  assert.ok(findTextInChildren(result.props.children, '暂无待处理的规则建议'));
  assert.ok(findTextInChildren(result.props.children, '系统将根据运行数据自动生成建议'));
});

test('RuleRecommendationPanel: renders total count in footer', () => {
  const result = render({ recommendations: mockRecommendations });
  assert.ok(findTextInChildren(result.props.children, '共 3 条建议'));
});

test('RuleRecommendationPanel: renders 提交/查看全部 buttons', () => {
  const result = render({ recommendations: mockRecommendations });
  assert.ok(findTextInChildren(result.props.children, '查看全部'));
  assert.ok(findTextInChildren(result.props.children, '采纳'));
  assert.ok(findTextInChildren(result.props.children, '忽略'));
  assert.ok(findTextInChildren(result.props.children, '详情'));
});

test('RuleRecommendationPanel: adopted item shows checkmark', () => {
  const adoptedRecomendations = mockRecommendations.map((r) =>
    r.id === 'rec-1' ? { ...r, adopted: true, resultingRuleId: 'rule-001' } : r
  );
  const result = render({ recommendations: adoptedRecomendations });
  // The adopted item should render "已采纳" text
  assert.ok(findTextInChildren(result.props.children, '已采纳'));
});

test('RuleRecommendationPanel: passed summary fields display correctly', () => {
  const summary: RecommendationSummary = {
    total: 3,
    highConfidence: 1,
    adopted: 1,
  };
  const result = render({ recommendations: mockRecommendations, summary });
  assert.ok(findTextInChildren(result.props.children, '3 条建议'));
  assert.ok(findTextInChildren(result.props.children, '已采纳'));
});

test('RuleRecommendationPanel: confidence badge colors', () => {
  // Test that high/medium/low confidence badges render correctly
  const highRec: RuleRecommendation = {
    id: 'h1',
    title: 'High',
    description: 'test high',
    category: 'security',
    confidence: 'high',
    createdAt: '2026-06-25T10:00:00Z',
  };
  const mediumRec: RuleRecommendation = {
    id: 'm1',
    title: 'Medium',
    description: 'test medium',
    category: 'governance',
    confidence: 'medium',
    createdAt: '2026-06-25T10:00:00Z',
  };
  const lowRec: RuleRecommendation = {
    id: 'l1',
    title: 'Low',
    description: 'test low',
    category: 'compliance',
    confidence: 'low',
    createdAt: '2026-06-25T10:00:00Z',
  };
  const result = render({
    recommendations: [highRec, mediumRec, lowRec],
  });
  assert.ok(findTextInChildren(result.props.children, '高置信'));
  assert.ok(findTextInChildren(result.props.children, '中置信'));
  assert.ok(findTextInChildren(result.props.children, '低置信'));
});
