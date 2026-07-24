/**
 * dashboard/page.test.tsx — 概览仪表盘 L1 冒烟测试
 * 覆盖: 服务端数据加载、客户端渲染、统计卡片、营收趋势、设备状态、待办列表、视图Tab(总览/运营/财务/增长)
 */
import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let SRC: string;
let CLIENT_SRC: string;

beforeEach(() => {
  SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'dashboard-client.tsx'), 'utf-8');
});

// ---- 页面级验证 ----
// SRC = page.tsx (server component)
// CLIENT_SRC = dashboard-client.tsx (client component)

describe('Dashboard — 服务端页面', () => {
  it('包含async服务端组件', () => assert.ok(SRC.includes('async function DashboardPage')));
  it('包含PageShell包装', () => assert.ok(SRC.includes('<PageShell')));
  it('包含Suspense加载态', () => assert.ok(SRC.includes('<Suspense')));
  it('包含LoadingSkeleton', () => assert.ok(SRC.includes('LoadingSkeleton')));
  it('包含ErrorBoundary', () => assert.ok(SRC.includes('<ErrorBoundary')));
  it('包含dashboard-client引用', () => assert.ok(SRC.includes('dashboard-client')));
  it('包含统计卡片数据加载', () => assert.ok(SRC.includes('async function loadDashboardStats')));
  it('使用force-dynamic模式', () => assert.ok(SRC.includes("export const dynamic = 'force-dynamic'")));
  it('DashboardViewTabs组件含4个视图Tab', () => assert.ok(SRC.includes('总览') && SRC.includes('运营') && SRC.includes('财务') && SRC.includes('增长')));
  it('包含视图Tab按钮role=tablist', () => assert.ok(SRC.includes('role=\"tablist\"')));
  it('包含DashboardViewTabs组件声明', () => assert.ok(SRC.includes('DashboardViewTabs')));
  it('包含monthlyRevenue数据类型', () => assert.ok(SRC.includes('monthlyRevenue')));
  it('包含customerSatisfaction数据类型', () => assert.ok(SRC.includes('customerSatisfaction')));
  it('包含DashboardView类型导出', () => assert.ok(SRC.includes('export type DashboardView')));
  it('包含isDashboardView类型守卫', () => assert.ok(SRC.includes('isDashboardView')));
  it('包含weeklyGrowth数据类型', () => assert.ok(SRC.includes('weeklyGrowth')));
});

// ---- 客户端组件验证 ----

describe('Dashboard — 客户端组件', () => {
  it('使用useState钩子', () => assert.ok(CLIENT_SRC.includes('useState')));
  it('使用useEffect恢复管理员会话', () => assert.ok(CLIENT_SRC.includes('useEffect')));
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
  it('读取admin-session helper', () => assert.ok(CLIENT_SRC.includes('getCachedAdminUser') && CLIENT_SRC.includes('hasAdminPermission')));
  it('包含空状态处理', () => assert.ok(CLIENT_SRC.includes('空状态') || CLIENT_SRC.includes('待办已完成')));
  it('包含趋势柱状图', () => assert.ok(CLIENT_SRC.includes('heightPercent')));

  // ---- 视图Tab相关测试（客户端） ----
  it('包含activeView状态管理', () => assert.ok(CLIENT_SRC.includes('setActiveView')));
  it('包含activeSubTab子Tab状态', () => assert.ok(CLIENT_SRC.includes('activeSubTab')));
  it('包含总览视图组件', () => assert.ok(CLIENT_SRC.includes('OverviewView')));
  it('包含运营视图组件', () => assert.ok(CLIENT_SRC.includes('OperationsView')));
  it('包含财务视图组件', () => assert.ok(CLIENT_SRC.includes('FinancialView')));
  it('包含增长视图组件', () => assert.ok(CLIENT_SRC.includes('GrowthView')));
  it('包含FallbackView未知视图处理', () => assert.ok(CLIENT_SRC.includes('FallbackView')));
  it('包含VIEW_PERMISSIONS视图权限映射', () => assert.ok(CLIENT_SRC.includes('VIEW_PERMISSIONS')));
  it('包含accessibleViewTabs过滤结果', () => assert.ok(CLIENT_SRC.includes('accessibleViewTabs')));
  it('视图Tab使用segment变体', () => assert.ok(CLIENT_SRC.includes("'segment'") || CLIENT_SRC.includes('"segment"')));
  it('视图Tab使用fill填充', () => assert.ok(CLIENT_SRC.includes('fill')));

  // ---- 运营视图内容测试 ----
  it('运营视图含区域占用率数据', () => assert.ok(CLIENT_SRC.includes('occupancy')));
  it('运营视图含高峰时段', () => assert.ok(CLIENT_SRC.includes('peakTime')));
  it('运营视图含设备统计', () => assert.ok(CLIENT_SRC.includes('总设备') && CLIENT_SRC.includes('在线')));

  // ---- 财务视图内容测试 ----
  it('财务视图含月度财务标题', () => assert.ok(CLIENT_SRC.includes('月度财务数据')));
  it('财务视图含成本和利润', () => assert.ok(CLIENT_SRC.includes('cost') && CLIENT_SRC.includes('profit')));
  it('财务视图含月度汇总', () => assert.ok(CLIENT_SRC.includes('月度汇总')));
  it('财务视图展示满意度', () => assert.ok(CLIENT_SRC.includes('customerSatisfaction')));

  // ---- 增长视图内容测试 ----
  it('增长视图含增长指标标题', () => assert.ok(CLIENT_SRC.includes('增长指标')));
  it('增长视图含趋势方向(trend up/down)', () => assert.ok(CLIENT_SRC.includes("'up'") || CLIENT_SRC.includes('"up"')));
  it('增长视图含复购率', () => assert.ok(CLIENT_SRC.includes('复购率')));
  it('增长视图含流失率', () => assert.ok(CLIENT_SRC.includes('流失率')));
  it('增长视图含新客占比', () => assert.ok(CLIENT_SRC.includes('新客占比')));

  // ---- 边界情况测试 ----
  it('未知视图显示错误提示', () => assert.ok(CLIENT_SRC.includes('未知视图') || CLIENT_SRC.includes('未知')));
  it('DashboardView类型定义在client', () => assert.ok(CLIENT_SRC.includes("DashboardView")));
  it('使用renderView函数渲染', () => assert.ok(CLIENT_SRC.includes('renderView')));
});
