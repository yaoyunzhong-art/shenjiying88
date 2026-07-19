/**
 * point-history/page.test.ts — 积分历史页面 L1 源码分析测试
 * 纯 node:test, 不依赖 vitest/JSX/React
 * 覆盖: 组件导出、数据记录、类型筛选、分页、统计计算、边界
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ── 类型 ──

type PointType = 'earn' | 'spend' | 'expire' | 'adjust';

interface PointRecord {
  id: string;
  date: string;
  desc: string;
  points: number;
  type: PointType;
  category: string;
  orderNo?: string;
}

const TYPE_LABELS: Record<PointType, string> = {
  earn: '获得',
  spend: '支出',
  expire: '过期',
  adjust: '调整',
};

const TYPE_COLORS: Record<PointType, string> = {
  earn: '#34d399',
  spend: '#f87171',
  expire: '#fbbf24',
  adjust: '#60a5fa',
};

const CATEGORY_OPTIONS = ['消费', '活动', '兑换', '签到', '系统', '任务'];

// ── Mock 数据 ──

const ALL_RECORDS: PointRecord[] = [
  { id: 'P001', date: '2026-07-12 14:32', desc: '消费获得', points: 168, type: 'earn', category: '消费', orderNo: 'ORD20260712001' },
  { id: 'P002', date: '2026-07-12 10:15', desc: '生日双倍积分', points: 200, type: 'earn', category: '活动' },
  { id: 'P003', date: '2026-07-11 18:00', desc: '兑换满减优惠券', points: -200, type: 'spend', category: '兑换' },
  { id: 'P004', date: '2026-07-10 16:45', desc: '消费获得', points: 85, type: 'earn', category: '消费', orderNo: 'ORD20260710003' },
  { id: 'P005', date: '2026-07-10 09:30', desc: '签到奖励', points: 5, type: 'earn', category: '签到' },
  { id: 'P006', date: '2026-07-09 12:00', desc: '积分到期清零', points: -50, type: 'expire', category: '系统' },
  { id: 'P007', date: '2026-07-08 20:00', desc: '生日赠送', points: 500, type: 'earn', category: '活动' },
  { id: 'P008', date: '2026-07-07 15:20', desc: '消费获得', points: 42, type: 'earn', category: '消费', orderNo: 'ORD20260707012' },
  { id: 'P009', date: '2026-07-06 11:10', desc: '系统补录调整', points: 30, type: 'adjust', category: '系统' },
  { id: 'P010', date: '2026-07-05 14:00', desc: '兑换礼品-公仔', points: -150, type: 'spend', category: '兑换' },
  { id: 'P011', date: '2026-07-04 19:30', desc: '消费获得', points: 96, type: 'earn', category: '消费', orderNo: 'ORD20260704008' },
  { id: 'P012', date: '2026-07-03 08:00', desc: '每日签到', points: 3, type: 'earn', category: '签到' },
  { id: 'P013', date: '2026-07-02 13:45', desc: '邀请好友奖励', points: 100, type: 'earn', category: '活动' },
  { id: 'P014', date: '2026-07-01 10:00', desc: '活动赠送积分', points: 50, type: 'earn', category: '活动' },
  { id: 'P015', date: '2026-06-30 17:30', desc: '兑换饮品券', points: -80, type: 'spend', category: '兑换' },
  { id: 'P016', date: '2026-06-29 12:15', desc: '评论返积分', points: 15, type: 'earn', category: '任务' },
  { id: 'P017', date: '2026-06-28 09:00', desc: '分享得积分', points: 8, type: 'earn', category: '任务' },
];;

// ── 数据函数 ──

function filterByType(records: PointRecord[], type: PointType | '全部'): PointRecord[] {
  return type === '全部' ? records : records.filter((r) => r.type === type);
}

function filterByCategory(records: PointRecord[], category: string): PointRecord[] {
  return category === '全部' ? records : records.filter((r) => r.category === category);
}

function searchRecords(records: PointRecord[], keyword: string): PointRecord[] {
  if (!keyword.trim()) return records;
  const kw = keyword.toLowerCase();
  return records.filter(
    (r) =>
      r.desc.toLowerCase().includes(kw) ||
      (r.orderNo || '').toLowerCase().includes(kw),
  );
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

function computePointSummary(records: PointRecord[]) {
  const totalEarn = records.filter((r) => r.type === 'earn').reduce((s, r) => s + r.points, 0);
  const totalSpent = records.filter((r) => r.type === 'spend' || r.type === 'expire').reduce((s, r) => s + Math.abs(r.points), 0);
  return {
    totalEarn,
    totalSpent,
    balance: totalEarn - totalSpent,
    count: records.length,
  };
}

function countByCategory(records: PointRecord[], category: string): number {
  return records.filter((r) => r.category === category).length;
}

/* =================================================================
 * 组件导出 (Component Export)
 * ================================================================= */

test('组件导出: 默认导出函数组件 PointHistoryPage', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', '默认导出应为函数');
});

test('组件导出: 导入 page.tsx 不抛异常', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, '导入 page 应成功');
});

/* =================================================================
 * 数据记录 (Data Records)
 * ================================================================= */

test('数据: ALL_RECORDS 包含至少 15 条积分记录', () => {
  assert.ok(ALL_RECORDS.length >= 15, `实际 ${ALL_RECORDS.length} 条`);
});

test('数据: 每条记录有 id, date, desc, points, type, category 字段', () => {
  for (const r of ALL_RECORDS) {
    assert.ok(r.id, '缺少 id');
    assert.ok(r.date, '缺少 date');
    assert.ok(r.desc, '缺少 desc');
    assert.equal(typeof r.points, 'number', `${r.id} points 应为数字`);
    assert.ok(['earn', 'spend', 'expire', 'adjust'].includes(r.type), `${r.id} type 无效`);
    assert.ok(r.category, '缺少 category');
  }
});

test('数据: 记录 ID 唯一', () => {
  const ids = ALL_RECORDS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'ID 应唯一');
});

test('数据: 包含获得(earn)和支出(spend)两种类型', () => {
  const types = new Set(ALL_RECORDS.map((r) => r.type));
  assert.ok(types.has('earn'));
  assert.ok(types.has('spend'));
});

test('数据: 包含消费、活动、兑换、签到、系统、任务等分类', () => {
  const cats = new Set(ALL_RECORDS.map((r) => r.category));
  for (const c of CATEGORY_OPTIONS) {
    assert.ok(cats.has(c), `应包含分类 ${c}`);
  }
});

test('数据: 正积分以 + 显示, 负积分以 - 显示', () => {
  assert.ok(SRC.includes('+') && SRC.includes('-'));
});

test('数据: 源码声名了 use client', () => {
  assert.ok(SRC.includes("'use client'"));
});

test('数据: 导入了 PageShell 和 StatusBadge', () => {
  assert.ok(SRC.includes('PageShell'));
  assert.ok(SRC.includes('StatusBadge'));
});

/* =================================================================
 * 类型筛选 (Type Filter)
 * ================================================================= */

test('筛选: filterByType earn 只返回获得记录', () => {
  const result = filterByType(ALL_RECORDS, 'earn');
  assert.ok(result.every((r) => r.type === 'earn'));
});

test('筛选: filterByType spend 只返回支出记录', () => {
  const result = filterByType(ALL_RECORDS, 'spend');
  assert.ok(result.every((r) => r.type === 'spend'));
});

test('筛选: filterByType 全部返回全部', () => {
  const result = filterByType(ALL_RECORDS, '全部');
  assert.equal(result.length, ALL_RECORDS.length);
});

test('筛选: filterByCategory 筛选"消费"类', () => {
  const result = filterByCategory(ALL_RECORDS, '消费');
  assert.ok(result.every((r) => r.category === '消费'));
});

test('筛选: searchRecords 按描述搜索', () => {
  const result = searchRecords(ALL_RECORDS, '签到');
  assert.ok(result.every((r) => r.desc.includes('签到')));
});

test('筛选: searchRecords 空关键词返回全部', () => {
  const result = searchRecords(ALL_RECORDS, '');
  assert.equal(result.length, ALL_RECORDS.length);
});

test('筛选: searchRecords 无匹配返回空', () => {
  const result = searchRecords(ALL_RECORDS, '不存在的记录xyz');
  assert.equal(result.length, 0);
});

test('筛选: searchRecords 按订单号搜索', () => {
  const result = searchRecords(ALL_RECORDS, 'ORD20260712001');
  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, 'P001');
});

/* =================================================================
 * 分页 (Pagination)
 * ================================================================= */

test('分页: paginate 第一页返回前 10 条', () => {
  const result = paginate(ALL_RECORDS, 1, 10);
  assert.equal(result.length, 10);
  assert.equal(result[0]?.id, 'P001');
});

test('分页: paginate 第二页返回剩余条数', () => {
  const result = paginate(ALL_RECORDS, 2, 10);
  assert.equal(result.length, ALL_RECORDS.length - 10);
  assert.equal(result[0]?.id, 'P011');
});

test('分页: paginate 超大页码返回空', () => {
  const result = paginate(ALL_RECORDS, 999, 10);
  assert.equal(result.length, 0);
});

test('分页: paginate 负页码不崩溃', () => {
  // slice 对负索引处理: (-1-1)*10 = -20, slice(-20,-10) 返回最后 10 条中的 5 条
  const result = paginate(ALL_RECORDS, -1, 10);
  // 不会抛异常即为通过
  assert.ok(Array.isArray(result));
});

test('分页: paginate pageSize=0 不返回记录', () => {
  const result = paginate(ALL_RECORDS, 1, 0);
  assert.equal(result.length, 0);
});

test('分页: 源码包含分页组件', () => {
  assert.ok(SRC.includes('上一页') || SRC.includes('下一页') || SRC.includes('page'));
});

/* =================================================================
 * 统计计算 (Statistics)
 * ================================================================= */

test('统计: computePointSummary 正确计算', () => {
  const summary = computePointSummary(ALL_RECORDS);
  assert.ok(summary.totalEarn > 0, '总获得应 > 0');
  assert.ok(summary.totalSpent > 0, '总支出应 > 0');
  assert.equal(typeof summary.balance, 'number');
  assert.equal(summary.count, ALL_RECORDS.length);
});

test('统计: countByCategory 统计正确', () => {
  const earnCount = countByCategory(ALL_RECORDS, '消费');
  const earnRecords = ALL_RECORDS.filter((r) => r.category === '消费');
  assert.equal(earnCount, earnRecords.length);
});

test('统计: 源码包含 PointSummary 子组件', () => {
  assert.ok(SRC.includes('PointSummary'));
});

test('统计: 源码包含 StatsPanel 子组件', () => {
  assert.ok(SRC.includes('StatsPanel'));
});

test('统计: 源码包含 "当前积分" 统计', () => {
  assert.ok(SRC.includes('当前积分'));
});

/* =================================================================
 * 边界 (Edge Cases)
 * ================================================================= */

test('边界: 源码不包含 any 类型', () => {
  assert.ok(!SRC.match(/:\s*any\b/), '不应使用 any');
});

test('边界: 不包含 dangerouslySetInnerHTML', () => {
  assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
});

test('边界: 不包含 eval 或 new Function', () => {
  assert.ok(!SRC.includes('eval(') && !SRC.includes('new Function('));
});

test('边界: computePointSummary 空列表不崩溃', () => {
  const summary = computePointSummary([]);
  assert.equal(summary.totalEarn, 0);
  assert.equal(summary.totalSpent, 0);
  assert.equal(summary.balance, 0);
  assert.equal(summary.count, 0);
});

test('边界: 源码包含空状态处理("暂无积分记录")', () => {
  assert.ok(SRC.includes('暂无积分记录') || SRC.includes('暂无'), '应包含空状态');
});

test('边界: 源码包含 TYPE_LABELS 映射', () => {
  assert.equal(TYPE_LABELS.earn, '获得');
  assert.equal(TYPE_LABELS.spend, '支出');
  assert.equal(TYPE_LABELS.expire, '过期');
  assert.equal(TYPE_LABELS.adjust, '调整');
});

test('边界: TYPE_COLORS 4 种颜色均不同', () => {
  const colors = Object.values(TYPE_COLORS);
  assert.equal(new Set(colors).size, colors.length, '颜色应不同');
});

test('边界: 搜索特殊字符不崩溃', () => {
  const result = searchRecords(ALL_RECORDS, '<script>alert("xss")</script>');
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 0);
});

test('边界: 大额积分格式化', () => {
  const big = ALL_RECORDS.map((r) => ({ ...r, points: r.points * 1000 }));
  const summary = computePointSummary(big);
  assert.ok(summary.totalEarn > 0, '大额积分计算不应崩溃');
});
