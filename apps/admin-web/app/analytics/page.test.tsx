/**
 * analytics/page.test.tsx — 数据分析页 L1 冒烟测试
 * 覆盖: 服务端数据加载、客户端组件、统计卡片、商品排行、时段分布、品类占比
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'analytics-client.tsx'), 'utf-8');

// ---- 服务端 ----

describe('analytics — 服务端页面', () => {
  it('包含async服务端组件', () => assert.ok(SRC.includes('async function AnalyticsPage')));
  it('包含PageShell包装', () => assert.ok(SRC.includes('<PageShell')));
  it('包含Suspense加载态', () => assert.ok(SRC.includes('<Suspense')));
  it('包含LoadingSkeleton', () => assert.ok(SRC.includes('LoadingSkeleton')));
  it('包含ErrorBoundary', () => assert.ok(SRC.includes('<ErrorBoundary')));
  it('包含analytics-client引用', () => assert.ok(SRC.includes('analytics-client')));
  it('包含数据加载函数', () => assert.ok(SRC.includes('async function loadAnalytics')));
  it('使用force-dynamic', () => assert.ok(SRC.includes("export const dynamic = 'force-dynamic'")));
});

// ---- 客户端 ----

describe('analytics — 客户端组件', () => {
  it('使用useState', () => assert.ok(CLIENT_SRC.includes('useState')));
  it('包含use client指令', () => assert.ok(CLIENT_SRC.includes("'use client'")));
  it('包含营收数据', () => assert.ok(CLIENT_SRC.includes('periodRevenue')));
  it('包含商品排行', () => assert.ok(CLIENT_SRC.includes('topSellingProducts')));
  it('包含时段分布', () => assert.ok(CLIENT_SRC.includes('hourlyDistribution')));
  it('包含品类占比', () => assert.ok(CLIENT_SRC.includes('categoryBreakdown')));
  it('包含留存率', () => assert.ok(CLIENT_SRC.includes('customerRetentionRate')));
  it('包含列表渲染', () => assert.ok(CLIENT_SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(CLIENT_SRC.includes(' && ') || CLIENT_SRC.includes(' ? ')));
  it('包含StatusBadge', () => assert.ok(CLIENT_SRC.includes('StatusBadge')));
  it('包含Card组件', () => assert.ok(CLIENT_SRC.includes('<Card')));
  it('包含Tabs组件', () => assert.ok(CLIENT_SRC.includes('<Tabs')));
  it('包含柱状图高度', () => assert.ok(CLIENT_SRC.includes('heightPercent')));
  it('包含品类进度条', () => assert.ok(CLIENT_SRC.includes('borderRadius: 3')));
});
