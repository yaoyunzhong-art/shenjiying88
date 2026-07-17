/**
 * dashboard/page.test.tsx — 概览仪表盘 L1 冒烟测试
 * 覆盖: 服务端数据加载、客户端渲染、统计卡片、营收趋势、设备状态、待办列表
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'dashboard-client.tsx'), 'utf-8');

// ---- 页面级验证 ----

describe('Dashboard — 服务端页面', () => {
  it('包含async服务端组件', () => assert.ok(SRC.includes('async function DashboardPage')));
  it('包含PageShell包装', () => assert.ok(SRC.includes('<PageShell')));
  it('包含Suspense加载态', () => assert.ok(SRC.includes('<Suspense')));
  it('包含LoadingSkeleton', () => assert.ok(SRC.includes('LoadingSkeleton')));
  it('包含ErrorBoundary', () => assert.ok(SRC.includes('<ErrorBoundary')));
  it('包含dashboard-client引用', () => assert.ok(SRC.includes('dashboard-client')));
  it('包含统计卡片数据加载', () => assert.ok(SRC.includes('async function loadDashboardStats')));
  it('使用force-dynamic模式', () => assert.ok(SRC.includes("export const dynamic = 'force-dynamic'")));
});

// ---- 客户端组件验证 ----

describe('Dashboard — 客户端组件', () => {
  it('使用useState钩子', () => assert.ok(CLIENT_SRC.includes('useState')));
  it('包含use client指令', () => assert.ok(CLIENT_SRC.includes("'use client'")));
  it('包含营收趋势展示', () => assert.ok(CLIENT_SRC.includes('revenue')));
  it('包含设备状态过滤', () => assert.ok(CLIENT_SRC.includes('online') && CLIENT_SRC.includes('offline')));
  it('包含待办事项状态', () => assert.ok(CLIENT_SRC.includes('pending') && CLIENT_SRC.includes('in_progress')));
  it('包含条件渲染', () => assert.ok(CLIENT_SRC.includes(' && ') || CLIENT_SRC.includes(' ? ')));
  it('包含列表渲染map', () => assert.ok(CLIENT_SRC.includes('.map(')));
  it('包含DataTable组件', () => assert.ok(CLIENT_SRC.includes('<DataTable') || CLIENT_SRC.includes('DataTable')));
  it('包含StatusBadge组件', () => assert.ok(CLIENT_SRC.includes('StatusBadge')));
  it('包含Tabs组件', () => assert.ok(CLIENT_SRC.includes('<Tabs')));
  it('包含Card组件', () => assert.ok(CLIENT_SRC.includes('<Card')));
  it('包含空状态处理', () => assert.ok(CLIENT_SRC.includes('空状态') || CLIENT_SRC.includes('待办已完成')));
  it('包含趋势柱状图', () => assert.ok(CLIENT_SRC.includes('heightPercent')));
});
