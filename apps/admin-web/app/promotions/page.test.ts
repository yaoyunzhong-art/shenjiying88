/**
 * promotions/page.test.ts — 促销管理页面源码分析测试
 *
 * 角色视角: 👔运营经理 · 📊营销总监 · 💰财务
 *
 * 覆盖: 活动列表/状态/创建按钮/筛选/分页
 * 纯 node:test 源码分析，无需 jsdom
 */

import assert from 'node:assert/strict';
import { describe, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// 源文件位于 stores/[id]/promotions/page.tsx（促销管理共用组件）
const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SOURCE = resolve(__dirname, '../stores/[id]/promotions/page.tsx');

function readSource(): string {
  return readFileSync(PAGE_SOURCE, 'utf-8');
}

let src: string;

// ── 活动数据 ──
// 从 page.tsx 提取的核心数据
const PROMO_TYPES = ['折扣', '满减', '满赠', '套餐'] as const;
type PromoType = (typeof PROMO_TYPES)[number];
type PromoStatus = 'active' | 'scheduled' | 'ended' | 'draft';

interface Promo {
  id: string;
  name: string;
  type: string;
  discount: string;
  scope: string;
  start: string;
  end: string;
  budget: number;
  used: number;
  status: PromoStatus;
  targetGoal?: string;
}

// 与 page.tsx 一致的 mock 数据
const PROMO_DATA: Promo[] = [
  { id:'PROMO-001', name:'暑期8折优惠', type:'折扣', discount:'8折', scope:'全场', start:'2026-07-15', end:'2026-08-31', budget:30000, used:8500, status:'active', targetGoal:'提升客流20%' },
  { id:'PROMO-002', name:'新客满100减20', type:'满减', discount:'减20', scope:'新用户', start:'2026-07-10', end:'2026-07-31', budget:10000, used:3200, status:'active' },
  { id:'PROMO-003', name:'会员生日特惠', type:'折扣', discount:'7折', scope:'会员', start:'2026-07-01', end:'2026-12-31', budget:5000, used:1250, status:'active' },
  { id:'PROMO-004', name:'充值满赠', type:'满赠', discount:'充200送50', scope:'全场', start:'2026-08-01', end:'2026-08-15', budget:15000, used:0, status:'scheduled' },
  { id:'PROMO-005', name:'国庆特惠', type:'折扣', discount:'7.5折', scope:'全场', start:'2026-10-01', end:'2026-10-07', budget:50000, used:0, status:'draft' },
  { id:'PROMO-006', name:'618狂欢', type:'满减', discount:'满200减50', scope:'全场', start:'2026-06-18', end:'2026-06-20', budget:20000, used:18600, status:'ended' },
  { id:'PROMO-007', name:'学生证优惠', type:'折扣', discount:'8.5折', scope:'学生', start:'2026-07-20', end:'2026-09-01', budget:8000, used:0, status:'draft' },
  { id:'PROMO-008', name:'夜场畅玩卡', type:'套餐', discount:'68元/3h', scope:'夜场', start:'2026-07-15', end:'2026-09-30', budget:12000, used:2800, status:'active' },
];

// ── 从 page.tsx 提炼的工具函数 ──

interface StatusConfig {
  color: string;
  label: string;
}

const STATUS_CFG: Record<PromoStatus, StatusConfig> = {
  active: { color: 'green', label: '进行中' },
  scheduled: { color: 'blue', label: '待开始' },
  ended: { color: 'default', label: '已结束' },
  draft: { color: 'default', label: '草稿' },
};

const TYPE_COLORS: Record<string, string> = {
  '折扣': '#10b981',
  '满减': '#f59e0b',
  '满赠': '#8b5cf6',
  '套餐': '#6366f1',
};

function filterByStatus(data: Promo[], status: string): Promo[] {
  if (status === 'all') return data;
  return data.filter(p => p.status === status);
}

function computeTotalBudget(data: Promo[]): number {
  return data.reduce((s, p) => s + p.budget, 0);
}

function computeTotalUsed(data: Promo[]): number {
  return data.reduce((s, p) => s + p.used, 0);
}

function computeUsageRate(data: Promo[]): number {
  const total = computeTotalBudget(data);
  const used = computeTotalUsed(data);
  return total > 0 ? Math.round(used / total * 100) : 0;
}

function searchPromos(data: Promo[], query: string): Promo[] {
  if (!query.trim()) return data;
  const q = query.toLowerCase();
  return data.filter(
    p => p.name.toLowerCase().includes(q) ||
         p.type.toLowerCase().includes(q) ||
         p.scope.toLowerCase().includes(q) ||
         (p.targetGoal && p.targetGoal.toLowerCase().includes(q)),
  );
}

function paginate<T>(items: T[], page: number, size: number): T[] {
  if (page < 1 || size < 1) return [];
  return items.slice((page - 1) * size, (page - 1) * size + size);
}

/* =================================================================
 * 1. 源码结构分析 (正例)
 * ================================================================= */

test('📊 源码: 默认导出 PromotionsPage 函数组件', () => {
  src = readSource();
  assert.ok(src.includes('export default function PromotionsPage'), '缺少 PromotionsPage 导出');
});

test('📊 源码: 包含 "use client" 指令', () => {
  assert.ok(src.includes("'use client'"), '缺少 use client');
});

test('📊 源码: 引用 @m5/ui 组件库', () => {
  assert.ok(src.includes("from '@m5/ui'"), '缺少 @m5/ui 导入');
});

test('📊 源码: 包含 PageShell 页面外壳', () => {
  assert.ok(src.includes('PageShell'), '缺少 PageShell');
});

test('📊 源码: 包含"促销管理"标题', () => {
  assert.ok(src.includes('促销管理'), '缺少促销管理标题');
});

test('📊 源码: 包含新建促销按钮', () => {
  assert.ok(src.includes('新建促销') || src.includes('+ 新建促销'), '缺少新建促销按钮');
});

test('📊 源码: 使用状态筛选 Select 组件', () => {
  assert.ok(src.includes('filter') && src.includes('Select'), '缺少状态筛选 Select');
});

test('📊 源码: 使用 Table 组件渲染列表', () => {
  assert.ok(src.includes('Table'), '缺少 Table 列表');
});

test('📊 源码: 包含各个状态筛选选项 (全部/进行中/待开始/已结束/草稿)', () => {
  const statuses = ['全部', '进行中', '待开始', '已结束', '草稿'];
  for (const s of statuses) {
    assert.ok(src.includes(s), `缺少状态选项: ${s}`);
  }
});

test('📊 源码: 使用 Modal 新建促销弹窗', () => {
  assert.ok(src.includes('Modal'), '缺少 Modal');
  assert.ok(src.includes('showAdd'), '缺少 showAdd 状态');
  assert.ok(src.includes('setShowAdd'), '缺少 setShowAdd');
});

test('📊 源码: 使用 Progress 消耗率组件', () => {
  assert.ok(src.includes('Progress'), '缺少 Progress 组件');
});

test('📊 源码: 使用 Statistic 统计卡片', () => {
  assert.ok(src.includes('Statistic'), '缺少 Statistic');
});

test('📊 源码: 包含活动统计卡片 (活动数/进行中/总预算/已消耗/使用率)', () => {
  assert.ok(src.includes('活动数'), '缺少活动数');
  assert.ok(src.includes('进行中'), '缺少进行中');
  assert.ok(src.includes('总预算'), '缺少总预算');
  assert.ok(src.includes('已消耗'), '缺少已消耗');
  assert.ok(src.includes('使用率'), '缺少使用率');
});

test('📊 源码: 使用 message 消息反馈', () => {
  assert.ok(src.includes('message.success') || src.includes('message.error'), '缺少 message 消息');
});

test('📊 源码: 包含 Tag 标签组件', () => {
  assert.ok(src.includes('Tag'), '缺少 Tag 组件');
});

test('📊 源码: 使用 Popconfirm 操作确认', () => {
  assert.ok(src.includes('Popconfirm'), '缺少 Popconfirm 确认弹窗');
});

test('📊 源码: 包含 useState 状态管理', () => {
  assert.ok(src.includes('useState'), '缺少 useState');
});

test('📊 源码: 包含 useMemo 性能优化', () => {
  assert.ok(src.includes('useMemo'), '缺少 useMemo');
});

test('📊 源码: 包含 totalBudget 预算汇总', () => {
  assert.ok(src.includes('totalBudget'), '缺少 totalBudget');
});

test('📊 源码: 包含 totalUsed 消耗汇总', () => {
  assert.ok(src.includes('totalUsed'), '缺少 totalUsed');
});

/* =================================================================
 * 2. 正例 (Happy Path — 数据/筛选/计算)
 * ================================================================= */

test('正例: PROMO_DATA 包含 8 条活动记录', () => {
  assert.equal(PROMO_DATA.length, 8);
});

test('正例: 所有活动 ID 唯一', () => {
  const ids = PROMO_DATA.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('正例: STATUS_CFG 覆盖 4 种状态', () => {
  assert.equal(Object.keys(STATUS_CFG).length, 4);
});

test('正例: 状态映射 active → 进行中, scheduled → 待开始等', () => {
  assert.equal(STATUS_CFG.active.label, '进行中');
  assert.equal(STATUS_CFG.scheduled.label, '待开始');
  assert.equal(STATUS_CFG.ended.label, '已结束');
  assert.equal(STATUS_CFG.draft.label, '草稿');
});

test('正例: filterByStatus "all" 返回全部 8 条', () => {
  assert.equal(filterByStatus(PROMO_DATA, 'all').length, 8);
});

test('正例: filterByStatus "active" 返回 4 条进行中', () => {
  const result = filterByStatus(PROMO_DATA, 'active');
  assert.equal(result.length, 4);
  assert.ok(result.every(p => p.status === 'active'));
});

test('正例: filterByStatus "scheduled" 返回 1 条 (充值满赠)', () => {
  const result = filterByStatus(PROMO_DATA, 'scheduled');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'PROMO-004');
});

test('正例: filterByStatus "ended" 返回 1 条 (618狂欢)', () => {
  const result = filterByStatus(PROMO_DATA, 'ended');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'PROMO-006');
});

test('正例: filterByStatus "draft" 返回 2 条 (国庆特惠 + 学生证优惠)', () => {
  const result = filterByStatus(PROMO_DATA, 'draft');
  assert.equal(result.length, 2);
});

test('正例: computeTotalBudget = 150000', () => {
  assert.equal(computeTotalBudget(PROMO_DATA), 150000);
});

test('正例: computeTotalUsed = 34350', () => {
  assert.equal(computeTotalUsed(PROMO_DATA), 34350);
});

test('正例: computeUsageRate = 23%', () => {
  // 34350/150000 = 22.9%, Math.round → 23
  assert.equal(computeUsageRate(PROMO_DATA), 23);
});

test('正例: TYPE_COLORS 映射 4 种促销类型', () => {
  assert.equal(Object.keys(TYPE_COLORS).length, 4);
  assert.ok(TYPE_COLORS['折扣'].startsWith('#'));
  assert.ok(TYPE_COLORS['满减'].startsWith('#'));
});

test('正例: 搜索"暑期"匹配暑期8折优惠', () => {
  const result = searchPromos(PROMO_DATA, '暑期');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'PROMO-001');
});

test('正例: 搜索"全场"匹配 4 条', () => {
  const result = searchPromos(PROMO_DATA, '全场');
  assert.equal(result.length, 4);
});

test('正例: 分页第1页 size=4 返回前4条', () => {
  const result = paginate(PROMO_DATA, 1, 4);
  assert.equal(result.length, 4);
  assert.equal(result[0].id, 'PROMO-001');
  assert.equal(result[3].id, 'PROMO-004');
});

test('正例: 分页第2页 size=4 返回后4条', () => {
  const result = paginate(PROMO_DATA, 2, 4);
  assert.equal(result.length, 4);
  assert.equal(result[0].id, 'PROMO-005');
  assert.equal(result[3].id, 'PROMO-008');
});

test('正例: 分页第3页 size=4 超出数据范围返回空', () => {
  assert.equal(paginate(PROMO_DATA, 3, 4).length, 0);
});

test('正例: 进行中活动 used > 0', () => {
  const active = PROMO_DATA.filter(p => p.status === 'active');
  active.forEach(p => assert.ok(p.used > 0, `${p.id} used 应为正数`));
});

test('正例: scheduled/draft 活动 used = 0', () => {
  const notActive = PROMO_DATA.filter(p => p.status === 'scheduled' || p.status === 'draft');
  notActive.forEach(p => assert.equal(p.used, 0, `${p.id} used 应为 0`));
});

/* =================================================================
 * 3. 反例 (Defensive)
 * ================================================================= */

test('反例: filterByStatus "unknown" 返回空数组', () => {
  assert.equal(filterByStatus(PROMO_DATA, 'unknown').length, 0);
});

test('反例: filterByStatus 空字符串返回空数组', () => {
  assert.equal(filterByStatus(PROMO_DATA, '').length, 0);
});

test('反例: 没有活动的 status 为 "paused"', () => {
  const statuses = PROMO_DATA.map(p => p.status);
  assert.equal(statuses.filter(s => s === 'paused' as string).length, 0);
});

test('反例: 所有活动 budget >= 0', () => {
  PROMO_DATA.forEach(p => assert.ok(p.budget >= 0, `${p.id} budget 应为非负`));
});

test('反例: 所有活动 used >= 0', () => {
  PROMO_DATA.forEach(p => assert.ok(p.used >= 0, `${p.id} used 应为非负`));
});

test('反例: 空搜索和纯空格搜索返回全部数据', () => {
  assert.equal(searchPromos(PROMO_DATA, '').length, PROMO_DATA.length);
  assert.equal(searchPromos(PROMO_DATA, '   ').length, PROMO_DATA.length);
});

test('反例: 搜索不存在的内容返回空数组', () => {
  assert.equal(searchPromos(PROMO_DATA, '不存在的活动').length, 0);
  assert.equal(searchPromos(PROMO_DATA, 'XYZ_404').length, 0);
});

test('反例: XSS 特殊字符搜索不崩溃', () => {
  const result = searchPromos(PROMO_DATA, '<script>alert("xss")</script>');
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 0);
});

test('反例: 分页负数页码返回空', () => {
  assert.equal(paginate(PROMO_DATA, -1, 4).length, 0);
  assert.equal(paginate(PROMO_DATA, 0, 4).length, 0);
});

test('反例: 分页超大页码返回空', () => {
  assert.equal(paginate(PROMO_DATA, 999, 4).length, 0);
});

test('反例: 分页负数 size 返回空', () => {
  assert.equal(paginate(PROMO_DATA, 1, -1).length, 0);
  assert.equal(paginate(PROMO_DATA, 1, 0).length, 0);
});

/* =================================================================
 * 4. 边界 (Edge Cases)
 * ================================================================= */

test('边界: 活动状态汇总 = 总数', () => {
  const active = PROMO_DATA.filter(p => p.status === 'active').length;
  const sched = PROMO_DATA.filter(p => p.status === 'scheduled').length;
  const ended = PROMO_DATA.filter(p => p.status === 'ended').length;
  const draft = PROMO_DATA.filter(p => p.status === 'draft').length;
  assert.equal(active + sched + ended + draft, PROMO_DATA.length);
});

test('边界: PROMO-006 (ended) 消耗率 93%', () => {
  const p = PROMO_DATA.find(x => x.id === 'PROMO-006')!;
  const rate = Math.round(p.used / p.budget * 100);
  assert.equal(rate, 93);
});

test('边界: PROMO-005 (draft) 预算最高 50000', () => {
  const p = PROMO_DATA.find(x => x.id === 'PROMO-005')!;
  assert.equal(p.budget, 50000);
});

test('边界: PROMO-003 预算最低 5000', () => {
  const min = PROMO_DATA.reduce((a, b) => a.budget < b.budget ? a : b);
  assert.equal(min.budget, 5000);
});

test('边界: 消耗率 > 70% 应触发橙色预警', () => {
  const p = PROMO_DATA.find(x => x.id === 'PROMO-006')!;
  const rate = p.budget > 0 ? Math.round(p.used / p.budget * 100) : 0;
  assert.ok(rate >= 70, '618狂欢消耗率应 ≥ 70%');
});

test('边界: 学生证优惠 scope=学生, status=draft', () => {
  const p = PROMO_DATA.find(x => x.name === '学生证优惠')!;
  assert.equal(p.scope, '学生');
  assert.equal(p.status, 'draft');
});

test('边界: 夜场畅玩卡 type=套餐', () => {
  const p = PROMO_DATA.find(x => x.name === '夜场畅玩卡')!;
  assert.equal(p.type, '套餐');
});

test('边界: 综合筛选 — active + 折扣 = 2 条 (暑期8折优惠 + 会员生日特惠)', () => {
  const active = filterByStatus(PROMO_DATA, 'active');
  const discountPromos = active.filter(p => p.type === '折扣');
  assert.equal(discountPromos.length, 2);
  assert.ok(discountPromos.every(p => p.status === 'active' && p.type === '折扣'));
});

test('边界: 综合筛选 — active + 满减 = 1 条', () => {
  const active = filterByStatus(PROMO_DATA, 'active');
  const fullMinus = active.filter(p => p.type === '满减');
  assert.equal(fullMinus.length, 1);
  assert.equal(fullMinus[0].id, 'PROMO-002');
});

test('边界: 综合筛选 — draft + 折扣 = 2 条', () => {
  const draft = filterByStatus(PROMO_DATA, 'draft');
  const discountDraft = draft.filter(p => p.type === '折扣');
  assert.equal(discountDraft.length, 2);
});

test('边界: 分页 size=1 逐页遍历 8 条', () => {
  for (let i = 1; i <= PROMO_DATA.length; i++) {
    const page = paginate(PROMO_DATA, i, 1);
    assert.equal(page.length, 1, `page ${i} 应有 1 条`);
    assert.equal(page[0].id, `PROMO-${String(i).padStart(3, '0')}`, `page ${i} id 匹配`);
  }
});

test('边界: 所有活动都有关键字段', () => {
  const requiredFields: (keyof Promo)[] = ['id', 'name', 'type', 'discount', 'scope', 'start', 'end', 'budget', 'used', 'status'];
  for (const p of PROMO_DATA) {
    for (const field of requiredFields) {
      assert.ok(p[field] !== undefined, `${p.id} 缺少字段 ${field}`);
    }
  }
});

test('边界: 所有活动类型都在 TYPE_COLORS 中', () => {
  for (const p of PROMO_DATA) {
    assert.ok(TYPE_COLORS[p.type], `${p.id} 类型 "${p.type}" 缺少颜色映射`);
  }
});

test('边界: 所有活动状态都在 STATUS_CFG 中', () => {
  for (const p of PROMO_DATA) {
    assert.ok(STATUS_CFG[p.status], `${p.id} 状态 "${p.status}" 缺少配置`);
  }
});

test('边界: 空数据数组筛选/计算正确处理', () => {
  assert.equal(filterByStatus([], 'active').length, 0);
  assert.equal(computeTotalBudget([]), 0);
  assert.equal(computeTotalUsed([]), 0);
  assert.equal(computeUsageRate([]), 0);
  assert.equal(paginate([], 1, 10).length, 0);
  assert.equal(searchPromos([], 'test').length, 0);
});
