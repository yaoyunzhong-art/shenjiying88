/**
 * store-rank/page.test.ts — 门店排名 L1 测试
 *
 * 覆盖: 数据模型 / 过滤排序 / KPI 汇总 / 分页 / 边界条件 / 排名升降逻辑
 * 角色视角: 👔 店长 / 🎯 运营总监
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync } from 'node:fs';

// ── 类型 (mirrors page.tsx) ──

type SortField = 'rank' | 'name' | 'revenue' | 'rating' | 'attendance' | 'growth';
type SortDir = 'asc' | 'desc';
type Period = 'daily' | 'weekly' | 'monthly';

interface StoreRankItem {
  id: string;
  rank: number;
  prevRank: number;
  name: string;
  revenue: number;
  rating: number;
  attendance: number;
  growth: number;
  orderCount: number;
  avgOrderValue: number;
}

interface KpiSummary {
  totalRevenue: number;
  avgRating: number;
  avgAttendance: number;
  avgGrowth: number;
  totalOrders: number;
  topStore: string;
}

// ── Mock 数据 (mirrors page.tsx MOCK_STORES) ──

const MOCK_STORES: StoreRankItem[] = [
  { id: 'S001', rank: 1, prevRank: 2, name: '旗舰店', revenue: 286500, rating: 4.9, attendance: 1560, growth: 12.5, orderCount: 423, avgOrderValue: 677 },
  { id: 'S002', rank: 2, prevRank: 1, name: '天河城店', revenue: 251200, rating: 4.7, attendance: 1430, growth: 8.3, orderCount: 387, avgOrderValue: 649 },
  { id: 'S003', rank: 3, prevRank: 3, name: '万象城店', revenue: 198400, rating: 4.8, attendance: 1120, growth: 15.1, orderCount: 312, avgOrderValue: 636 },
  { id: 'S004', rank: 4, prevRank: 5, name: '宝安中心店', revenue: 165800, rating: 4.6, attendance: 980, growth: 5.2, orderCount: 256, avgOrderValue: 648 },
  { id: 'S005', rank: 5, prevRank: 7, name: '龙岗万达店', revenue: 143200, rating: 4.5, attendance: 870, growth: 18.7, orderCount: 218, avgOrderValue: 657 },
  { id: 'S006', rank: 6, prevRank: 4, name: '南山科技园店', revenue: 138900, rating: 4.4, attendance: 820, growth: -2.3, orderCount: 205, avgOrderValue: 678 },
  { id: 'S007', rank: 7, prevRank: 6, name: '福田CBD店', revenue: 121600, rating: 4.3, attendance: 760, growth: -1.5, orderCount: 189, avgOrderValue: 643 },
  { id: 'S008', rank: 8, prevRank: 8, name: '盐田店', revenue: 98700, rating: 4.2, attendance: 620, growth: 3.8, orderCount: 152, avgOrderValue: 649 },
  { id: 'S009', rank: 9, prevRank: 10, name: '光明新区店', revenue: 82300, rating: 4.1, attendance: 540, growth: 22.4, orderCount: 134, avgOrderValue: 614 },
  { id: 'S010', rank: 10, prevRank: 9, name: '大鹏店', revenue: 69600, rating: 3.9, attendance: 460, growth: -4.7, orderCount: 108, avgOrderValue: 644 },
  { id: 'S011', rank: 11, prevRank: 12, name: '坪山店', revenue: 59800, rating: 4.0, attendance: 380, growth: 6.1, orderCount: 92, avgOrderValue: 650 },
  { id: 'S012', rank: 12, prevRank: 11, name: '深汕合作区店', revenue: 47500, rating: 3.8, attendance: 310, growth: -8.2, orderCount: 75, avgOrderValue: 633 },
];

// ── 纯函数 (mirrors page.tsx) ──

function filterAndSort(
  stores: StoreRankItem[],
  search: string,
  sortField: SortField,
  sortDir: SortDir,
): StoreRankItem[] {
  let filtered = stores;
  if (search) {
    const q = search.toLowerCase();
    filtered = stores.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }
  const sorted = [...filtered];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'rank': cmp = a.rank - b.rank; break;
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'revenue': cmp = a.revenue - b.revenue; break;
      case 'rating': cmp = a.rating - b.rating; break;
      case 'attendance': cmp = a.attendance - b.attendance; break;
      case 'growth': cmp = a.growth - b.growth; break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

function computeKpiSummary(stores: StoreRankItem[]): KpiSummary {
  const len = stores.length;
  if (len === 0) return { totalRevenue: 0, avgRating: 0, avgAttendance: 0, avgGrowth: 0, totalOrders: 0, topStore: '' };
  const totalRevenue = stores.reduce((s, st) => s + st.revenue, 0);
  const avgRating = Math.round((stores.reduce((s, st) => s + st.rating, 0) / len) * 10) / 10;
  const totalOrders = stores.reduce((s, st) => s + st.orderCount, 0);
  const avgAttendance = Math.round(stores.reduce((s, st) => s + st.attendance, 0) / len);
  const avgGrowth = Math.round((stores.reduce((s, st) => s + st.growth, 0) / len) * 10) / 10;
  const topStore = stores.reduce((best, st) => st.revenue > best.revenue ? st : best, stores[0]).name;
  return { totalRevenue, avgRating, avgAttendance, avgGrowth, totalOrders, topStore };
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  if (page < 1) throw new Error('page must be >= 1');
  if (pageSize < 1) throw new Error('pageSize must be >= 1');
  return items.slice((page - 1) * pageSize, page * pageSize);
}

// ══════════════════════════════════════════════════════
// 正例
// ══════════════════════════════════════════════════════

describe('门店排名（正例）', () => {

  it('Mock 数据应有 12 家门店', () => {
    assert.equal(MOCK_STORES.length, 12);
  });

  it('每条门店记录应包含所有必需字段', () => {
    for (const s of MOCK_STORES) {
      assert.ok(s.id);
      assert.ok(s.name);
      assert.equal(typeof s.rank, 'number');
      assert.equal(typeof s.revenue, 'number');
      assert.equal(typeof s.rating, 'number');
      assert.equal(typeof s.attendance, 'number');
      assert.equal(typeof s.growth, 'number');
      assert.equal(typeof s.orderCount, 'number');
      assert.equal(typeof s.avgOrderValue, 'number');
    }
  });

  it('不筛选返回全部 12 家门店', () => {
    const r = filterAndSort(MOCK_STORES, '', 'rank', 'asc');
    assert.equal(r.length, 12);
  });

  it('默认按 rank asc 排序返回正确顺序', () => {
    const r = filterAndSort(MOCK_STORES, '', 'rank', 'asc');
    assert.equal(r[0].rank, 1);
    assert.equal(r[0].name, '旗舰店');
    assert.equal(r[11].rank, 12);
    assert.equal(r[11].name, '深汕合作区店');
    assert.equal(r[5].name, '南山科技园店');
  });

  it('按 rank desc 排序反转顺序', () => {
    const r = filterAndSort(MOCK_STORES, '', 'rank', 'desc');
    assert.equal(r[0].rank, 12);
    assert.equal(r[11].rank, 1);
  });

  it('按 revenue desc 排序营收从高到低', () => {
    const r = filterAndSort(MOCK_STORES, '', 'revenue', 'desc');
    assert.equal(r[0].name, '旗舰店');
    assert.equal(r[0].revenue, 286500);
    assert.equal(r[11].name, '深汕合作区店');
  });

  it('按 growth desc 排序增长从高到低', () => {
    const r = filterAndSort(MOCK_STORES, '', 'growth', 'desc');
    assert.equal(r[0].name, '光明新区店');
    assert.equal(r[0].growth, 22.4);
    assert.equal(r[11].name, '深汕合作区店');
    assert.equal(r[11].growth, -8.2);
  });

  it('按 rating desc 排序评分从高到低', () => {
    const r = filterAndSort(MOCK_STORES, '', 'rating', 'desc');
    assert.equal(r[0].rating, 4.9);
    assert.equal(r[0].name, '旗舰店');
    assert.equal(r[11].rating, 3.8);
  });

  it('搜索"店"返回所有包含"店"的门店（12 家都含"店"）', () => {
    const r = filterAndSort(MOCK_STORES, '店', 'rank', 'asc');
    assert.equal(r.length, 12);
  });

  it('搜索"旗舰"返回唯一匹配', () => {
    const r = filterAndSort(MOCK_STORES, '旗舰', 'rank', 'asc');
    assert.equal(r.length, 1);
    assert.equal(r[0].name, '旗舰店');
  });

  it('搜索"龙岗"返回龙岗万达店', () => {
    const r = filterAndSort(MOCK_STORES, '龙岗', 'rank', 'asc');
    assert.equal(r.length, 1);
    assert.equal(r[0].name, '龙岗万达店');
  });

  it('搜索"S001"返回旗舰店', () => {
    const r = filterAndSort(MOCK_STORES, 'S001', 'rank', 'asc');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'S001');
  });

  it('按 attendance desc 排序客流从高到低', () => {
    const r = filterAndSort(MOCK_STORES, '', 'attendance', 'desc');
    assert.equal(r[0].name, '旗舰店');
    assert.equal(r[0].attendance, 1560);
  });

  it('KPI 汇总: totalRevenue 应正确', () => {
    const summary = computeKpiSummary(MOCK_STORES);
    const expectedRevenue = MOCK_STORES.reduce((s, st) => s + st.revenue, 0);
    assert.equal(summary.totalRevenue, expectedRevenue);
    // 手动验证已知值
    assert.equal(MOCK_STORES[0].revenue + MOCK_STORES[1].revenue, 286500 + 251200);
    assert.ok(summary.totalRevenue > 0);
  });

  it('KPI 汇总: avgRating 应正确', () => {
    const summary = computeKpiSummary(MOCK_STORES);
    const expectedAvg = Math.round((MOCK_STORES.reduce((s, st) => s + st.rating, 0) / 12) * 10) / 10;
    assert.equal(summary.avgRating, expectedAvg);
    assert.equal(summary.avgRating, 4.4);
  });

  it('KPI 汇总: totalOrders 应正确', () => {
    const summary = computeKpiSummary(MOCK_STORES);
    const expectedOrders = MOCK_STORES.reduce((s, st) => s + st.orderCount, 0);
    assert.equal(summary.totalOrders, expectedOrders);
  });

  it('KPI 汇总: topStore 应为营收最高的门店', () => {
    const summary = computeKpiSummary(MOCK_STORES);
    assert.equal(summary.topStore, '旗舰店');
  });

  it('KPI 汇总: avgGrowth 应正确', () => {
    const summary = computeKpiSummary(MOCK_STORES);
    const expectedGrowth = Math.round((MOCK_STORES.reduce((s, st) => s + st.growth, 0) / 12) * 10) / 10;
    assert.equal(summary.avgGrowth, expectedGrowth);
  });

  it('分页 pageSize=6 第1页返回 6 条', () => {
    assert.equal(paginate(MOCK_STORES, 1, 6).length, 6);
  });

  it('分页 pageSize=6 第2页返回 6 条', () => {
    assert.equal(paginate(MOCK_STORES, 2, 6).length, 6);
  });

  it('分页 pageSize=5 第3页返回 2 条', () => {
    assert.equal(paginate(MOCK_STORES, 3, 5).length, 2);
  });

  it('页面文件 page.tsx 应存在', () => {
    assert.ok(existsSync(new URL('./page.tsx', import.meta.url)), 'page.tsx 文件应存在');
  });
});

// ══════════════════════════════════════════════════════
// 反例
// ══════════════════════════════════════════════════════

describe('门店排名（反例）', () => {

  it('搜索不存在的名称返回空', () => {
    assert.equal(filterAndSort(MOCK_STORES, '不存在的门店', 'rank', 'asc').length, 0);
  });

  it('分页 page=0 应抛异常', () => {
    assert.throws(() => paginate(MOCK_STORES, 0, 5), /page must be >= 1/);
  });

  it('分页 pageSize=0 应抛异常', () => {
    assert.throws(() => paginate(MOCK_STORES, 1, 0), /pageSize must be >= 1/);
  });

  it('门店 id 不应重复', () => {
    const ids = MOCK_STORES.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('revenue 不应为负数', () => {
    for (const s of MOCK_STORES) {
      assert.ok(s.revenue >= 0, `${s.name}: revenue ${s.revenue} 不应为负`);
    }
  });

  it('rating 应在 0~5 范围内', () => {
    for (const s of MOCK_STORES) {
      assert.ok(s.rating >= 0 && s.rating <= 5, `${s.name}: rating ${s.rating} 超出范围`);
    }
  });

  it('attendance 不应为负数', () => {
    for (const s of MOCK_STORES) {
      assert.ok(s.attendance >= 0, `${s.name}: attendance ${s.attendance} 不应为负`);
    }
  });

  it('avgOrderValue 不应为负数', () => {
    for (const s of MOCK_STORES) {
      assert.ok(s.avgOrderValue >= 0, `${s.name}: avgOrderValue ${s.avgOrderValue} 不应为负`);
    }
  });

  it('rank 应为连续无重复的 1~12', () => {
    const ranks = MOCK_STORES.map(s => s.rank).sort((a, b) => a - b);
    assert.deepEqual(ranks, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

// ══════════════════════════════════════════════════════
// 边界
// ══════════════════════════════════════════════════════

describe('门店排名（边界）', () => {

  it('空搜索字符串返回全部', () => {
    assert.equal(filterAndSort(MOCK_STORES, '', 'rank', 'asc').length, 12);
  });

  it('按 name 字符串排序返回所有 12 条', () => {
    const r = filterAndSort(MOCK_STORES, '', 'name', 'asc');
    assert.equal(r.length, 12);
    // 验证排序稳定：各条记录均出现
    const names = r.map(s => s.name);
    assert.ok(names.includes('旗舰店'));
    assert.ok(names.includes('宝安中心店'));
  });

  it('按 name desc 排序返回所有 12 条', () => {
    const r = filterAndSort(MOCK_STORES, '', 'name', 'desc');
    assert.equal(r.length, 12);
    // desc 排序应反转 asc 的顺序
    const asc = filterAndSort(MOCK_STORES, '', 'name', 'asc');
    assert.deepEqual(r.map(s => s.name), asc.map(s => s.name).reverse());
  });

  it('排名升降逻辑: 旗舰店 prevRank=2 rank=1 (上升)', () => {
    const store = MOCK_STORES.find(s => s.id === 'S001')!;
    assert.ok(store.prevRank > store.rank);
  });

  it('排名升降逻辑: 天河城店 prevRank=1 rank=2 (下降)', () => {
    const store = MOCK_STORES.find(s => s.id === 'S002')!;
    assert.ok(store.prevRank < store.rank);
  });

  it('排名升降逻辑: 万象城店 prevRank=3 rank=3 (持平)', () => {
    const store = MOCK_STORES.find(s => s.id === 'S003')!;
    assert.equal(store.prevRank, store.rank);
  });

  it('排名升降逻辑: 光明新区店 prevRank=10 rank=9 (上升)', () => {
    const store = MOCK_STORES.find(s => s.id === 'S009')!;
    assert.ok(store.prevRank > store.rank);
  });

  it('排名升降逻辑: 深汕合作区店 prevRank=11 rank=12 (下降)', () => {
    const store = MOCK_STORES.find(s => s.id === 'S012')!;
    assert.ok(store.prevRank < store.rank);
  });

  it('分页超过总页数返回空数组', () => {
    assert.equal(paginate(MOCK_STORES, 100, 5).length, 0);
  });

  it('分页 pageSize=12 一页返回全部', () => {
    assert.equal(paginate(MOCK_STORES, 1, 12).length, 12);
  });

  it('空数据 KPI 汇总应全零/空', () => {
    const s = computeKpiSummary([]);
    assert.equal(s.totalRevenue, 0);
    assert.equal(s.avgRating, 0);
    assert.equal(s.avgAttendance, 0);
    assert.equal(s.avgGrowth, 0);
    assert.equal(s.totalOrders, 0);
    assert.equal(s.topStore, '');
  });

  it('单条数据 KPI 汇总应正确', () => {
    const single = [MOCK_STORES[0]];
    const s = computeKpiSummary(single);
    assert.equal(s.totalRevenue, single[0].revenue);
    assert.equal(s.topStore, single[0].name);
    assert.equal(s.avgGrowth, single[0].growth);
  });

  it('搜索 id 前缀 "S00" 应返回 9 条 (S001~S009)', () => {
    const r = filterAndSort(MOCK_STORES, 'S00', 'rank', 'asc');
    assert.equal(r.length, 9); // S001~S009, S010 starts with S01
  });

  it('增长为正的门店数量 (growth > 0)', () => {
    const positive = MOCK_STORES.filter(s => s.growth > 0);
    assert.equal(positive.length, 8);
  });

  it('增长为负的门店数量 (growth < 0)', () => {
    const negative = MOCK_STORES.filter(s => s.growth < 0);
    assert.equal(negative.length, 4);
  });

  it('营收前 3 名累计占比应合理', () => {
    const top3Revenue = MOCK_STORES.slice(0, 3).reduce((s, st) => s + st.revenue, 0);
    const totalRevenue = MOCK_STORES.reduce((s, st) => s + st.revenue, 0);
    const ratio = top3Revenue / totalRevenue;
    assert.ok(ratio > 0.35 && ratio < 0.5, `top3 占比 ${ratio} 超出预期范围`);
  });
});

// ══════════════════════════════════════════════════════
// KPI 逻辑专项
// ══════════════════════════════════════════════════════

describe('门店排名（KPI 逻辑）', () => {

  it('avgAttendance 计算正确', () => {
    const s = computeKpiSummary(MOCK_STORES);
    const expected = Math.round(MOCK_STORES.reduce((a, st) => a + st.attendance, 0) / 12);
    assert.equal(s.avgAttendance, expected);
  });

  it('总营收 = 各门店营收之和', () => {
    const s = computeKpiSummary(MOCK_STORES);
    assert.equal(s.totalRevenue, 286500 + 251200 + 198400 + 165800 + 143200 + 138900 + 121600 + 98700 + 82300 + 69600 + 59800 + 47500);
  });

  it('topStore = 营收最高的门店名称', () => {
    const maxStore = MOCK_STORES.reduce((best, st) => st.revenue > best.revenue ? st : best, MOCK_STORES[0]);
    const s = computeKpiSummary(MOCK_STORES);
    assert.equal(s.topStore, maxStore.name);
  });

  it('highest growth store is 光明新区店', () => {
    const highGrowth = MOCK_STORES.reduce((max, st) => st.growth > max.growth ? st : max, MOCK_STORES[0]);
    assert.equal(highGrowth.name, '光明新区店');
    assert.equal(highGrowth.growth, 22.4);
  });

  it('lowest growth store is 深汕合作区店', () => {
    const lowGrowth = MOCK_STORES.reduce((min, st) => st.growth < min.growth ? st : min, MOCK_STORES[0]);
    assert.equal(lowGrowth.name, '深汕合作区店');
    assert.equal(lowGrowth.growth, -8.2);
  });

  it('avgOrderValue 总和应大于 0', () => {
    const totalAOV = MOCK_STORES.reduce((s, st) => s + st.avgOrderValue, 0);
    assert.ok(totalAOV > 0);
  });

  it('营收和评分无明显矛盾：评分最高的店营收应在前列', () => {
    const topRated = MOCK_STORES.filter(s => s.rating >= 4.6);
    const topRevenue = MOCK_STORES.filter(s => s.revenue >= 165800);
    // 至少有部分重叠
    const overlap = topRated.some(tr => topRevenue.some(tre => tre.id === tr.id));
    assert.ok(overlap, '高评分门店应与高营收门店有重叠');
  });
});
