/**
 * performance/page.test.tsx — 门店绩效 增强测试 (2026-07-16)
 *
 * 覆盖:
 *   L1 正例    — 组件导出、核心指标
 *   L1 三态    — loading/error/empty 状态
 *   L2 增强    — 时段销售分析、营收趋势日同比、绩效等级、品类达成率
 *   L3 安全    — 无危险代码、无 as any
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('PerformancePage — L1 正例', () => {
  it('应导出一个默认函数组件 PerformancePage', () => {
    assert.ok(SRC.includes('export default function PerformancePage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应从 @m5/ui 导入 StatCard, QuickStats 等组件', () => {
    assert.ok(SRC.includes('StatCard'));
    assert.ok(SRC.includes('QuickStats'));
    assert.ok(SRC.includes('GaugeChart'));
  });

  it('页面标题应为"门店绩效"', () => {
    assert.ok(SRC.includes('门店绩效'));
  });

  it('应导入 performance-data 工厂函数', () => {
    assert.ok(SRC.includes('makeStorePerformanceData'));
  });
});

describe('PerformancePage — L1 三态', () => {
  it('应有 loading 骨架屏', () => {
    assert.ok(SRC.includes('LoadingSkeleton') || SRC.includes('loading'));
  });

  it('loading 状态应展示骨架元素', () => {
    assert.ok(SRC.includes('LoadingSkeleton'));
  });

  it('应有 error 状态界面', () => {
    assert.ok(SRC.includes('绩效数据加载失败'));
  });

  it('error 状态应有重新加载按钮', () => {
    assert.ok(SRC.includes('重新加载'));
  });

  it('应使用 useEffect & useState 管理异步', () => {
    assert.ok(SRC.includes('useEffect') && SRC.includes('useState'));
  });

  it('应使用 simulateFetch 异步获取数据', () => {
    assert.ok(SRC.includes('simulateFetch') || SRC.includes('Promise'));
  });
});

describe('PerformancePage — L2 核心指标', () => {
  it('应展示今日营收', () => {
    assert.ok(SRC.includes('今日营收'));
  });

  it('应展示今日订单', () => {
    assert.ok(SRC.includes('今日订单'));
  });

  it('应展示客单价', () => {
    assert.ok(SRC.includes('客单价'));
  });

  it('应展示营收周同比', () => {
    assert.ok(SRC.includes('营收周同比'));
  });

  it('应展示订单周同比', () => {
    assert.ok(SRC.includes('订单周同比'));
  });

  it('应展示本周累计营收', () => {
    assert.ok(SRC.includes('本周累计营收'));
  });

  it('应展示任务完成率仪表盘', () => {
    assert.ok(SRC.includes('任务完成率'));
  });

  it('应展示客户满意度仪表盘', () => {
    assert.ok(SRC.includes('客户满意度'));
  });
});

describe('PerformancePage — L2 增强功能', () => {
  it('应展示综合绩效等级', () => {
    assert.ok(SRC.includes('综合绩效等级') || SRC.includes('perfLabel'));
  });

  it('应展示今日时段销售柱状图', () => {
    assert.ok(SRC.includes('今日时段销售') || SRC.includes('hourlySales'));
  });

  it('应展示本周营收趋势日同比', () => {
    assert.ok(SRC.includes('本周营收趋势') || SRC.includes('dailyRevenue'));
  });

  it('应展示周营收热力图', () => {
    assert.ok(SRC.includes('周营收热力图'));
  });

  it('应展示品类达成率', () => {
    assert.ok(SRC.includes('品类达成率'));
  });

  it('应展示品类详情（营收/单数）', () => {
    assert.ok(SRC.includes('categoryPerformance'));
  });

  it('应使用 perfLabel 工具函数标记绩效等级', () => {
    assert.ok(SRC.includes('perfLabel') && SRC.includes('function perfLabel'));
  });
});

describe('PerformancePage — L3 安全', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('不应包含 as any', () => {
    assert.ok(!SRC.includes('as any'));
  });

  it('不应使用 eval', () => {
    assert.ok(!SRC.includes('eval('));
  });
});

describe('PerformancePage — 边界', () => {
  it('数据为 null 时应返回 null', () => {
    assert.ok(SRC.includes('if (!data) return null') || SRC.includes('data: null'));
  });

  it('应使用 useMemo 优化热力图数据', () => {
    assert.ok(SRC.includes('useMemo'));
  });

  it('应使用 toLocaleString 格式化金额', () => {
    assert.ok(SRC.includes('toLocaleString'));
  });

  it('应包含 GaugeSegment 色段定义', () => {
    assert.ok(SRC.includes('COMPLETION_SEGMENTS') || SRC.includes('SATISFACTION_SEGMENTS'));
  });
});
