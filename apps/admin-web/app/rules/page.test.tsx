/**
 * rules/page.test.tsx — 规则管理列表页 L1 测试
 *
 * 覆盖:
 *   正例 — 常量映射、过滤逻辑、统计数据、MOCK 数据完整性
 *   反例 — 空搜索、无匹配筛选、非法输入
 *   边界 — 空数组、空白搜索、全部状态/分类
 */

import assert from 'node:assert/strict';
import { describe, it, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  STATUS_LABELS,
  STATUS_BADGE_VARIANT,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  filterRules,
} from './page';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

// ---- 正例 ----

test('应导出一个默认组件 RulesPage', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('export default function RulesPage'), '缺少 RulesPage 默认导出');
});

test('应包含 use client 指令', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes("'use client'"), '缺少 use client');
});

test('CATEGORY_LABELS 应包含 5 个分类映射', () => {
  assert.strictEqual(Object.keys(CATEGORY_LABELS).length, 5);
  assert.strictEqual(CATEGORY_LABELS['risk-control'], '风控规则');
  assert.strictEqual(CATEGORY_LABELS.member, '会员规则');
  assert.strictEqual(CATEGORY_LABELS.promotion, '营销规则');
  assert.strictEqual(CATEGORY_LABELS.notification, '通知规则');
  assert.strictEqual(CATEGORY_LABELS.operation, '运维规则');
});

test('CATEGORY_OPTIONS 应包含 5 个分类选项', () => {
  assert.strictEqual(CATEGORY_OPTIONS.length, 5);
  assert.ok(CATEGORY_OPTIONS.every((o) => typeof o.value === 'string' && typeof o.label === 'string'));
  assert.ok(CATEGORY_OPTIONS.find((o) => o.value === 'risk-control' && o.label === '风控规则'));
});

test('STATUS_LABELS 与 STATUS_BADGE_VARIANT 应完整覆盖四种状态', () => {
  assert.strictEqual(Object.keys(STATUS_LABELS).length, 4);
  assert.strictEqual(STATUS_LABELS.enabled, '已启用');
  assert.strictEqual(STATUS_LABELS.disabled, '已停用');
  assert.strictEqual(STATUS_LABELS.draft, '草稿');
  assert.strictEqual(STATUS_LABELS.archived, '已归档');
  assert.strictEqual(STATUS_BADGE_VARIANT.enabled, 'success');
  assert.strictEqual(STATUS_BADGE_VARIANT.disabled, 'neutral');
  assert.strictEqual(STATUS_BADGE_VARIANT.draft, 'warning');
  assert.strictEqual(STATUS_BADGE_VARIANT.archived, 'danger');
});

test('PRIORITY_LABELS 与 PRIORITY_COLORS 应包含四种优先级', () => {
  assert.strictEqual(Object.keys(PRIORITY_LABELS).length, 4);
  assert.strictEqual(PRIORITY_LABELS.critical, '严重');
  assert.strictEqual(PRIORITY_LABELS.high, '高');
  assert.strictEqual(PRIORITY_LABELS.medium, '中');
  assert.strictEqual(PRIORITY_LABELS.low, '低');
  assert.strictEqual(Object.keys(PRIORITY_COLORS).length, 4);
  assert.ok(PRIORITY_COLORS.critical.startsWith('#'), '颜色值应以 # 开头');
  assert.ok(PRIORITY_COLORS.high.startsWith('#'));
  assert.ok(PRIORITY_COLORS.medium.startsWith('#'));
  assert.ok(PRIORITY_COLORS.low.startsWith('#'));
});

test('MOCK_RULES 应包含 35 条数据', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  const match = src.match(/MOCK_RULES.+Array\.from\(\{ length: (\d+)/);
  assert.ok(match, '未找到 MOCK_RULES 定义');
  assert.strictEqual(Number(match[1]), 35, 'MOCK_RULES 应为 35 条');
});

test('filterRules 应支持按状态筛选', () => {
  const rules = [
    { id: '1', name: '规则A', category: 'risk-control' as const, status: 'enabled' as const, priority: 'high' as const, description: '描述A', triggerCount: 100, successRate: 95, lastTriggered: '', updatedAt: '', createdBy: 'admin' },
    { id: '2', name: '规则B', category: 'member' as const, status: 'disabled' as const, priority: 'medium' as const, description: '描述B', triggerCount: 50, successRate: 80, lastTriggered: '', updatedAt: '', createdBy: 'op' },
    { id: '3', name: '规则C', category: 'promotion' as const, status: 'draft' as const, priority: 'low' as const, description: '描述C', triggerCount: 0, successRate: 0, lastTriggered: '', updatedAt: '', createdBy: 'dev' },
  ];

  assert.strictEqual(filterRules(rules, '', 'enabled', 'ALL').length, 1);
  assert.strictEqual(filterRules(rules, '', 'disabled', 'ALL').length, 1);
  assert.strictEqual(filterRules(rules, '', 'ALL', 'ALL').length, 3);
});

test('filterRules 应支持按分类筛选', () => {
  const rules = [
    { id: '1', name: '规则A', category: 'risk-control' as const, status: 'enabled' as const, priority: 'high' as const, description: '', triggerCount: 100, successRate: 95, lastTriggered: '', updatedAt: '', createdBy: 'admin' },
    { id: '2', name: '规则B', category: 'member' as const, status: 'enabled' as const, priority: 'medium' as const, description: '', triggerCount: 50, successRate: 80, lastTriggered: '', updatedAt: '', createdBy: 'op' },
  ];

  assert.strictEqual(filterRules(rules, '', 'ALL', 'risk-control').length, 1);
  assert.strictEqual(filterRules(rules, '', 'ALL', 'member').length, 1);
});

test('filterRules 应支持按名称搜索', () => {
  const rules = [
    { id: '1', name: '信用评分规则', category: 'risk-control' as const, status: 'enabled' as const, priority: 'high' as const, description: '基于行为数据', triggerCount: 100, successRate: 95, lastTriggered: '', updatedAt: '', createdBy: 'admin' },
    { id: '2', name: '优惠券发放规则', category: 'promotion' as const, status: 'disabled' as const, priority: 'medium' as const, description: '按条件发放', triggerCount: 50, successRate: 80, lastTriggered: '', updatedAt: '', createdBy: 'op' },
  ];

  assert.strictEqual(filterRules(rules, '信用', 'ALL', 'ALL').length, 1);
  assert.strictEqual(filterRules(rules, '评分', 'ALL', 'ALL').length, 1);
});

test('filterRules 应支持按描述搜索', () => {
  const rules = [
    { id: '1', name: '规则A', category: 'risk-control' as const, status: 'enabled' as const, priority: 'high' as const, description: '基于行为数据', triggerCount: 100, successRate: 95, lastTriggered: '', updatedAt: '', createdBy: 'admin' },
    { id: '2', name: '规则B', category: 'member' as const, status: 'disabled' as const, priority: 'medium' as const, description: '按条件发放', triggerCount: 50, successRate: 80, lastTriggered: '', updatedAt: '', createdBy: 'op' },
  ];

  assert.strictEqual(filterRules(rules, '行为', 'ALL', 'ALL').length, 1);
});

test('filterRules 应支持按创建人搜索', () => {
  const rules = [
    { id: '1', name: '规则A', category: 'risk-control' as const, status: 'enabled' as const, priority: 'high' as const, description: '描述', triggerCount: 100, successRate: 95, lastTriggered: '', updatedAt: '', createdBy: 'admin' },
    { id: '2', name: '规则B', category: 'member' as const, status: 'disabled' as const, priority: 'medium' as const, description: '描述', triggerCount: 50, successRate: 80, lastTriggered: '', updatedAt: '', createdBy: 'super-admin' },
  ];

  assert.strictEqual(filterRules(rules, 'super', 'ALL', 'ALL').length, 1);
  assert.strictEqual(filterRules(rules, 'admin', 'ALL', 'ALL').length, 2);
});

test('filterRules 应支持组合筛选（搜索+状态+分类）', () => {
  const rules = [
    { id: '1', name: '信用评分规则', category: 'risk-control' as const, status: 'enabled' as const, priority: 'high' as const, description: '基于行为数据', triggerCount: 100, successRate: 95, lastTriggered: '', updatedAt: '', createdBy: 'admin' },
    { id: '2', name: '会员升级规则', category: 'member' as const, status: 'disabled' as const, priority: 'medium' as const, description: '消费升级', triggerCount: 50, successRate: 80, lastTriggered: '', updatedAt: '', createdBy: 'op' },
    { id: '3', name: '风控拦截规则', category: 'risk-control' as const, status: 'disabled' as const, priority: 'critical' as const, description: '异常检测', triggerCount: 200, successRate: 70, lastTriggered: '', updatedAt: '', createdBy: 'admin' },
  ];

  // 搜索"评分"+状态enabled
  const result = filterRules(rules, '评分', 'enabled', 'ALL');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, '1');

  // 搜索"异常"+状态disabled+分类risk-control (应匹配规则 #3 风控拦截规则)
  const result2 = filterRules(rules, '异常', 'disabled', 'risk-control');
  assert.strictEqual(result2.length, 1);
  assert.strictEqual(result2[0].id, '3');
});

// ---- 反例 ----

test('filterRules 无匹配时应返回空数组', () => {
  const rules = [
    { id: '1', name: '信用评分规则', category: 'risk-control' as const, status: 'enabled' as const, priority: 'high' as const, description: '描述', triggerCount: 100, successRate: 95, lastTriggered: '', updatedAt: '', createdBy: 'admin' },
  ];

  assert.strictEqual(filterRules(rules, '不存在的规则名', 'ALL', 'ALL').length, 0);
  assert.strictEqual(filterRules(rules, '', 'archived', 'ALL').length, 0);
  assert.strictEqual(filterRules(rules, '', 'ALL', 'notification').length, 0);
});

test('空搜索字符串应返回全部匹配项', () => {
  const rules = [
    { id: '1', name: '规则A', category: 'risk-control' as const, status: 'enabled' as const, priority: 'high' as const, description: '描述', triggerCount: 100, successRate: 95, lastTriggered: '', updatedAt: '', createdBy: 'admin' },
    { id: '2', name: '规则B', category: 'member' as const, status: 'disabled' as const, priority: 'medium' as const, description: '描述', triggerCount: 50, successRate: 80, lastTriggered: '', updatedAt: '', createdBy: 'op' },
  ];

  assert.strictEqual(filterRules(rules, '', 'ALL', 'ALL').length, 2);
});

test('STATUS_LABELS 对未知 key 应返回 undefined', () => {
  const labels = STATUS_LABELS as Record<string, string | undefined>;
  assert.strictEqual(labels['invalid'], undefined);
});

// ---- 边界 ----

test('空规则数组应正常处理', () => {
  assert.strictEqual(filterRules([], '', 'ALL', 'ALL').length, 0);
  assert.strictEqual(filterRules([], '搜索', 'ALL', 'ALL').length, 0);
  assert.strictEqual(filterRules([], '', 'enabled', 'risk-control').length, 0);
});

test('仅含空格的搜索应不进行过滤', () => {
  const rules = [
    { id: '1', name: '规则A', category: 'risk-control' as const, status: 'enabled' as const, priority: 'high' as const, description: '描述', triggerCount: 100, successRate: 95, lastTriggered: '', updatedAt: '', createdBy: 'admin' },
  ];

  assert.strictEqual(filterRules(rules, '   ', 'ALL', 'ALL').length, 1);
});

test('全部状态/分类筛选应返回完整数据', () => {
  const rules = [
    { id: '1', name: '规则A', category: 'risk-control' as const, status: 'enabled' as const, priority: 'high' as const, description: '', triggerCount: 100, successRate: 95, lastTriggered: '', updatedAt: '', createdBy: 'admin' },
    { id: '2', name: '规则B', category: 'member' as const, status: 'disabled' as const, priority: 'medium' as const, description: '', triggerCount: 50, successRate: 80, lastTriggered: '', updatedAt: '', createdBy: 'op' },
  ];

  assert.strictEqual(filterRules(rules, '', 'ALL', 'ALL').length, 2);
});

test('页面应导出类型定义：RuleItem / RuleCategory / RuleStatus / RulePriority', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('export interface RuleItem'), '缺少导出 RuleItem');
  assert.ok(src.includes('export type RuleCategory'), '缺少导出 RuleCategory');
  assert.ok(src.includes('export type RuleStatus'), '缺少导出 RuleStatus');
  assert.ok(src.includes('export type RulePriority'), '缺少导出 RulePriority');
});

test('页面应包含 useMemo / usePagination / useSearchFilter 性能优化', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('useMemo'));
  assert.ok(src.includes('usePagination'));
  assert.ok(src.includes('useSearchFilter'));
});

test('页面应包含 DataTable / FilterChips / Pagination / SearchFilterInput / StatusBadge', () => {
  const src = readFileSync(SOURCE, 'utf-8');
  assert.ok(src.includes('DataTable'));
  assert.ok(src.includes('FilterChips'));
  assert.ok(src.includes('Pagination'));
  assert.ok(src.includes('SearchFilterInput'));
  assert.ok(src.includes('StatusBadge'));
});

test('PRIORITY_COLORS 值应为有效的十六进制颜色', () => {
  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  assert.ok(hexRegex.test(PRIORITY_COLORS.critical), `critical 颜色 ${PRIORITY_COLORS.critical} 无效`);
  assert.ok(hexRegex.test(PRIORITY_COLORS.high), `high 颜色 ${PRIORITY_COLORS.high} 无效`);
  assert.ok(hexRegex.test(PRIORITY_COLORS.medium), `medium 颜色 ${PRIORITY_COLORS.medium} 无效`);
  assert.ok(hexRegex.test(PRIORITY_COLORS.low), `low 颜色 ${PRIORITY_COLORS.low} 无效`);
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Rules — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
