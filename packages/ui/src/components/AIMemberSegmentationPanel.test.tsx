/**
 * AIMemberSegmentationPanel.test.tsx — AI 会员分群分析面板 L1 冒烟测试
 * C类-AI前端组件
 * 覆盖: 正例(渲染/数据展示/统计概览/交互) + 反例(空数据/边界) + 统计逻辑
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

const { renderToStaticMarkup } = require(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { AIMemberSegmentationPanel } = require('./AIMemberSegmentationPanel');
import type { MemberSegment, SegmentAnalysis } from './AIMemberSegmentationPanel';

// ==================== 测试工具 ====================

function makeSegment(overrides?: Partial<MemberSegment>): MemberSegment {
  return {
    id: `seg-${Math.random().toString(36).slice(2, 8)}`,
    name: '高价值会员',
    description: '月均消费超过¥500的高价值群体',
    memberCount: 256,
    percentage: 0.256,
    avgMonthlySpend: 1280,
    avgMonthlyVisits: 4.5,
    growthRate: 0.12,
    color: '#7c3aed',
    icon: '💎',
    ...overrides,
  };
}

function makeDefaultSegments(): MemberSegment[] {
  return [
    makeSegment({
      id: 's1',
      name: '高价值会员',
      description: '月均消费超¥500',
      memberCount: 256,
      percentage: 0.256,
      avgMonthlySpend: 1280,
      avgMonthlyVisits: 4.5,
      growthRate: 0.12,
      color: '#7c3aed',
      icon: '💎',
    }),
    makeSegment({
      id: 's2',
      name: '潜力会员',
      description: '月均消费¥100-500，需要提升提升消费频次',
      memberCount: 384,
      percentage: 0.384,
      avgMonthlySpend: 320,
      avgMonthlyVisits: 2.1,
      growthRate: -0.03,
      color: '#3b82f6',
      icon: '⭐',
    }),
    makeSegment({
      id: 's3',
      name: '睡眠会员',
      description: '超过30天未到店',
      memberCount: 160,
      percentage: 0.16,
      avgMonthlySpend: 0,
      avgMonthlyVisits: 0,
      growthRate: -0.25,
      color: '#ef4444',
      icon: '💤',
    }),
  ];
}

function makeDefaultAnalysis(): SegmentAnalysis {
  return {
    totalMembers: 1000,
    activeMembers: 640,
    activeRate: 0.64,
    highValueCount: 2,
    dormantCount: 1,
  };
}

// ==================== 测试用例 ====================

test('AIMemberSegmentationPanel: renders title and segments count', () => {
  const segments = makeDefaultSegments();
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, {
      segments,
    })
  );
  assert.match(html, /AI 会员分群分析/);
  assert.match(html, /3 个分群/);
  assert.match(html, /800.*会员/); // 256+384+160
});

test('AIMemberSegmentationPanel: renders all segment cards', () => {
  const segments = makeDefaultSegments();
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, { segments })
  );
  assert.match(html, /高价值会员/);
  assert.match(html, /潜力会员/);
  assert.match(html, /睡眠会员/);
  assert.match(html, /¥1,280/);
  assert.match(html, /¥320/);
  assert.match(html, /\+12\.0%/);
  assert.match(html, /-3\.0%/);
});

test('AIMemberSegmentationPanel: renders analysis overview when provided', () => {
  const segments = makeDefaultSegments();
  const analysis = makeDefaultAnalysis();
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, {
      segments,
      analysis,
    })
  );
  assert.match(html, /1,000/); // totalMembers
  assert.match(html, /640/); // activeMembers
  assert.match(html, /64\.0%/); // activeRate
  assert.match(html, /2/); // highValueCount
  assert.match(html, /1/); // dormantCount
});

test('AIMemberSegmentationPanel: renders empty state when segments is empty', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, {
      segments: [],
    })
  );
  assert.match(html, /暂无分群数据/);
  assert.doesNotMatch(html, /高价值会员/);
});

test('AIMemberSegmentationPanel: renders empty state when segments is undefined', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, {
      segments: undefined as unknown as MemberSegment[],
    })
  );
  assert.match(html, /暂无分群数据/);
});

test('AIMemberSegmentationPanel: renders custom title', () => {
  const segments = makeDefaultSegments();
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, {
      segments,
      title: '自定义标题',
    })
  );
  assert.match(html, /自定义标题/);
  assert.doesNotMatch(html, /AI 会员分群分析/);
});

test('AIMemberSegmentationPanel: renders custom empty text', () => {
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, {
      segments: [],
      emptyText: '暂无数据',
    })
  );
  assert.match(html, /暂无数据/);
});

test('AIMemberSegmentationPanel: renders data-testid attribute', () => {
  const segments = makeDefaultSegments();
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, {
      segments,
      'data-testid': 'my-custom-testid',
    })
  );
  assert.match(html, /data-testid="my-custom-testid"/);
});

test('AIMemberSegmentationPanel: renders segment cards with data-testid', () => {
  const segments = makeDefaultSegments();
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, { segments })
  );
  assert.match(html, /segment-card-s1/);
  assert.match(html, /segment-card-s2/);
  assert.match(html, /segment-card-s3/);
});

test('AIMemberSegmentationPanel: renders view details button when callback provided', () => {
  const segments = makeDefaultSegments();
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, {
      segments,
      onViewDetails: () => {},
    })
  );
  assert.match(html, /view-details-s1/);
});

test('AIMemberSegmentationPanel: renders progress bar for each segment', () => {
  const segments = makeDefaultSegments();
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, { segments })
  );
  // segment s1 has 25.6% progress (inline style)
  assert.match(html, /width:25\.6%/);
  // segment s2 has 38.4%
  assert.match(html, /width:38\.4%/);
  // segment s3 has 16%
  assert.match(html, /width:16%/);
});

// ==================== 边界测试 ====================

test('AIMemberSegmentationPanel: single segment renders', () => {
  const segments = [makeSegment({ id: 'single', name: '仅有一个分群', memberCount: 1, percentage: 1 })];
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, { segments })
  );
  assert.match(html, /仅有一个分群/);
});

test('AIMemberSegmentationPanel: large numbers render', () => {
  const segments = [
    makeSegment({
      id: 'big',
      name: '海量会员',
      memberCount: 999999,
      percentage: 0.8,
      avgMonthlySpend: 99999,
      avgMonthlyVisits: 99,
    }),
  ];
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, { segments })
  );
  assert.match(html, /999,999/); // memberCount formatted
  assert.match(html, /¥99,999/); // avgMonthlySpend formatted
  assert.match(html, /80%/); // percentage
});

test('AIMemberSegmentationPanel: zero growth renders correctly', () => {
  const segments = [
    makeSegment({
      id: 'zero-growth',
      name: '稳定会员',
      growthRate: 0,
    }),
  ];
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, { segments })
  );
  assert.match(html, /\+0\.0%/);
});

test('AIMemberSegmentationPanel: negative growth renders in red', () => {
  const segments = [
    makeSegment({
      id: 'neg-growth',
      name: '衰退群体',
      growthRate: -0.5,
    }),
  ];
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, { segments })
  );
  assert.match(html, /-50\.0%/);
});

// ==================== 统计逻辑测试 ====================

test('AIMemberSegmentationPanel: total member count in summary matches sum of segments', () => {
  const segments = makeDefaultSegments();
  const expectedTotal = segments.reduce((sum, s) => sum + s.memberCount, 0);
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, { segments })
  );
  // Header shows "800 会员"
  assert.match(html, new RegExp(String(expectedTotal).replace(/\B(?=(\d{3})+(?!\d))/g, ',')));
});

test('AIMemberSegmentationPanel: segment count in header matches array length', () => {
  const segments = makeDefaultSegments();
  const html = renderToStaticMarkup(
    React.createElement(AIMemberSegmentationPanel, { segments })
  );
  assert.match(html, /3 个分群/);
});
