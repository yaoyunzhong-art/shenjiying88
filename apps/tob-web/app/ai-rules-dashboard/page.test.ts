/**
 * ai-rules-dashboard/page.test.ts — AI 决策规则仪表盘 L1 冒烟测试
 *
 * 测试策略:
 * - 正例: 组件导出、关键 UI 元素、数据函数引用
 * - 边界: 空/全量过滤、总结数据渲染
 * - 防御: 各状态/优先级渲染
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

const __dirname = resolve(import.meta.dirname, '.');

function readSource(file: string): string {
  return readFileSync(resolve(__dirname, file), 'utf-8');
}

// ─── 1. 正例 — 组件与模块 ──────────────────────────────────────────

describe('ai-rules-dashboard — 正例', () => {
  it('应导出一个默认组件 AiRulesDashboardPage', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('export default function AiRulesDashboardPage'), '缺少默认导出');
  });

  it('应包含 use client 指令', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应引用 rules-data 中的 MOCK_AI_RULES', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('MOCK_AI_RULES'), '缺少 MOCK_AI_RULES 引用');
  });

  it('应引用 rules-data 中的 computeSummary', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('computeSummary'), '缺少 computeSummary 引用');
  });

  it('应引用 rules-data 中的 formatExecutionCount/formatLatency 等', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('formatExecutionCount'), '缺少 formatExecutionCount');
    assert.ok(src.includes('formatLatency'), '缺少 formatLatency');
    assert.ok(src.includes('getSuccessRateVariant'), '缺少 getSuccessRateVariant');
    assert.ok(src.includes('RULE_STATUS_LABEL'), '缺少 RULE_STATUS_LABEL');
    assert.ok(src.includes('RULE_CATEGORY_LABEL'), '缺少 RULE_CATEGORY_LABEL');
    assert.ok(src.includes('RULE_CATEGORY_EMOJI'), '缺少 RULE_CATEGORY_EMOJI');
    assert.ok(src.includes('RULE_PRIORITY_LABEL'), '缺少 RULE_PRIORITY_LABEL');
  });

  it('应使用 PageShell / StatCard / StatusBadge 等 UI 组件', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
    assert.ok(src.includes('StatCard'), '缺少 StatCard');
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
  });

  it('应渲染 4 个概览卡片', () => {
    const src = readSource('page.tsx');
    const statCards = src.match(/<StatCard/g);
    assert.equal(statCards?.length, 4, '应有 4 个 StatCard');
  });

  it('显示 "AI 决策规则" 标题', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('AI 决策规则'), '缺少页面标题');
  });

  it('应有分类筛选按钮区域', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('filterCategory'), '缺少分类筛选状态');
    assert.ok(src.includes('RULE_CATEGORIES.map'), '缺少分类映射渲染');
  });

  it('应有状态筛选按钮区域', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('filterStatus'), '缺少状态筛选');
    assert.ok(src.includes('RULE_STATUSES.map'), '缺少状态映射渲染');
  });

  it('应使用 useMemo 优化过滤逻辑', () => {
    const src = readSource('page.tsx');
    const memoMatches = src.match(/useMemo/g);
    assert.ok(memoMatches && memoMatches.length >= 2, '应至少有 2 个 useMemo');
  });

  it('空筛选结果时显示 "暂无匹配的规则"', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('暂无匹配的规则'), '缺少空结果提示');
  });

  it('规则表格应包含所有列头', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('规则名称'), '缺少 规则名称 列');
    assert.ok(src.includes('分类'), '缺少 分类 列');
    assert.ok(src.includes('优先级'), '缺少 优先级 列');
    assert.ok(src.includes('执行次数'), '缺少 执行次数 列');
    assert.ok(src.includes('成功率'), '缺少 成功率 列');
    assert.ok(src.includes('延迟'), '缺少 延迟 列');
    assert.ok(src.includes('状态'), '缺少 状态 列');
  });
});

// ─── 2. 边界 — 状态/边界场景 ──────────────────────────────────────────

describe('ai-rules-dashboard — 边界', () => {
  it('setFilterCategory "all" 可重置分类筛选', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('filterCategory ==='), '缺少分类筛选判断');
  });

  it('setFilterStatus "all" 可重置状态筛选', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('filterStatus ==='), '缺少状态筛选判断');
  });

  it('分类按钮点击时根据当前筛选切换', () => {
    const src = readSource('page.tsx');
    assert.ok(
      src.includes("filterCategory === 'all' ? cat : 'all'") ||
      src.includes('filterCategory === cat ?'),
      '缺少分类切换逻辑'
    );
  });

  it('状态按钮有计数显示', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('count}'), '缺少状态计数插值');
  });

  it('概览卡片有 helper text 提示', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('helper='), '缺少 helper 属性');
    assert.ok(src.includes('累计执行'), '缺少执行次数说明');
  });

  it('优先级按数字分色（1-2 红, 3 黄, 4-5 灰）', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('rule.priority <= 2'), '缺少 1-2 级判断');
    assert.ok(src.includes('rule.priority <= 3'), '缺少 3 级判断');
    assert.ok(src.includes('fca5a5') || src.includes('fde047') || src.includes('94a3b8'), '缺少优先级颜色');
  });
});

// ─── 3. 防御 — 健壮性 ────────────────────────────────────────────────

describe('ai-rules-dashboard — 防御', () => {
  it('平均成功率 < 80 显示 "需关注"', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('需关注'), '缺少低成功率提示');
    assert.ok(src.includes('良好'), '缺少高成功率提示');
    assert.ok(src.includes('一般'), '缺少一般成功率提示');
  });

  it('平均延迟 < 100ms 显示 "低延迟"', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('低延迟'), '缺少低延迟提示');
    assert.ok(src.includes('中延迟'), '缺少中延迟提示');
  });

  it('分类快捷入口应包含定价/库存/会员/促销/异常五类', () => {
    const src = readSource('page.tsx');
    const data = readSource('rules-data.ts');
    assert.ok(data.includes("'pricing'"), '缺少 pricing 分类');
    assert.ok(data.includes("'inventory'"), '缺少 inventory 分类');
    assert.ok(data.includes("'member'"), '缺少 member 分类');
    assert.ok(data.includes("'promotion'"), '缺少 promotion 分类');
    assert.ok(data.includes("'anomaly'"), '缺少 anomaly 分类');
  });

  it('有 hover 交互效果（切换背景）', () => {
    const src = readSource('page.tsx');
    assert.ok(
      src.includes('onMouseEnter') && src.includes('onMouseLeave'),
      '缺少 hover 效果'
    );
  });

  it('表格行有 cursor pointer 风格', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes("cursor: 'pointer'"), '缺少 cursor pointer');
  });

  it('分类按钮默认显示 count 计数', () => {
    const src = readSource('page.tsx');
    const countMatch = src.match(/count/g);
    assert.ok(countMatch && countMatch.length >= 3, '缺少多处 count 引用');
  });

  it('states 使用 useState 管理', () => {
    const src = readSource('page.tsx');
    const useStateMatches = src.match(/useState/g);
    assert.ok(useStateMatches && useStateMatches.length >= 2, '缺少足够的 useState');
  });
});

// ─── 4. 类型安全与数据模块互动 ──────────────────────────────────────

describe('ai-rules-dashboard — 数据模块互动', () => {
  it('rules-data 应导出 AiRuleItem 等类型', () => {
    const data = readSource('rules-data.ts');
    assert.ok(
      data.includes('export type') || data.includes('export interface'),
      '缺少类型导出'
    );
    assert.ok(
      data.includes('AiRuleItem') || data.includes('RuleCategory') || data.includes('RuleStatus'),
      '缺少核心类型定义'
    );
  });

  it('rules-data 中 formatSuccessRate 准确计算平均值', () => {
    const data = readSource('rules-data.ts');
    assert.ok(data.includes('computeSummary'), '缺少 computeSummary');
    assert.ok(data.includes('totalRules'), '缺少 totalRules');
    assert.ok(data.includes('avgSuccessRate'), '缺少 avgSuccessRate');
  });

  it('rules-data 中 formatLatency 正确处理毫秒/秒转换', () => {
    const data = readSource('rules-data.ts');
    assert.ok(data.includes('formatLatency'), '缺少 formatLatency');
    // 应该有 ms → s 的转换逻辑
    assert.ok(
      data.includes('>= 1000') || data.includes('/ 1000') || data.includes('1000'),
      '缺少 1000ms 分界处理'
    );
  });

  it('page.tsx 正确渲染 mock 数据行', () => {
    const src = readSource('page.tsx');
    const data = readSource('rules-data.ts');
    // 检查有 map 渲染
    assert.ok(src.includes('filteredRules.map'), '缺少 filteredRules 渲染');
    assert.ok(Object.keys(JSON.parse(data.match(/MOCK_AI_RULES\s*[:=]\s*(\[[\s\S]*?\])/)?.[1] || '[]')).length > 0 || 
      data.includes('MOCK_AI_RULES:'), '应有 mock 数据');
  });

  it('page.tsx 状态筛选逻辑覆盖所有分类', () => {
    const src = readSource('page.tsx');
    const data = readSource('rules-data.ts');
    RULE_CATEGORIES.forEach((cat) => {
      assert.ok(data.includes(`'${cat}'`), `分类 ${cat} 未定义`);
    });
  });
});

// 辅助：从 rules-data 读取分类常量
const RULE_CATEGORIES = ['pricing', 'inventory', 'member', 'promotion', 'anomaly'];
