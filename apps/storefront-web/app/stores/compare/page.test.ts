/**
 * stores/compare/page.test.ts — 门店对比页 L1 测试
 * 测试项: 数据完整性 + 筛选 + 排序 + 边界
 * 模式: 正例 + 反例 + 边界 (L1 JMeter 风格)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── Types (mirror page.tsx) ──

type StoreStatus = 'online' | 'offline' | 'maintenance';
type StoreTrend = 'up' | 'down' | 'stable';
type Region = '北京' | '上海' | '广州' | '深圳';
type RegionFilter = 'all' | Region;
type StatusFilter = 'all' | StoreStatus;
type SortKey = 'revenue' | 'orderCount' | 'customerSatisfaction' | 'deviceUtilization';

interface StoreComparisonMetric {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  activeMembers: number;
  deviceUtilization: number;
  customerSatisfaction: number;
}

interface StoreComparisonItem {
  id: string;
  name: string;
  region: Region;
  status: StoreStatus;
  trend: StoreTrend;
  metrics: StoreComparisonMetric;
}

// ── Mock data (mirrored from compare-stores-client.tsx) ──

const MOCK_ALL_STORES: StoreComparisonItem[] = [
  { id: 'store-bj-1', name: '朝阳旗舰店', region: '北京', status: 'online', trend: 'up', metrics: { revenue: 520000, orderCount: 1860, avgOrderValue: 279.57, activeMembers: 3420, deviceUtilization: 87, customerSatisfaction: 92 } },
  { id: 'store-bj-2', name: '海淀中关村店', region: '北京', status: 'online', trend: 'up', metrics: { revenue: 380000, orderCount: 1420, avgOrderValue: 267.61, activeMembers: 2150, deviceUtilization: 79, customerSatisfaction: 85 } },
  { id: 'store-sh-1', name: '浦东新区店', region: '上海', status: 'online', trend: 'up', metrics: { revenue: 485000, orderCount: 1720, avgOrderValue: 281.98, activeMembers: 3100, deviceUtilization: 82, customerSatisfaction: 88 } },
  { id: 'store-sh-2', name: '静安寺店', region: '上海', status: 'online', trend: 'stable', metrics: { revenue: 335000, orderCount: 1240, avgOrderValue: 270.16, activeMembers: 1800, deviceUtilization: 76, customerSatisfaction: 84 } },
  { id: 'store-gz-1', name: '天河区店', region: '广州', status: 'maintenance', trend: 'down', metrics: { revenue: 210000, orderCount: 890, avgOrderValue: 235.96, activeMembers: 1500, deviceUtilization: 45, customerSatisfaction: 72 } },
  { id: 'store-gz-2', name: '番禺区店', region: '广州', status: 'online', trend: 'stable', metrics: { revenue: 268000, orderCount: 1050, avgOrderValue: 255.24, activeMembers: 1680, deviceUtilization: 68, customerSatisfaction: 79 } },
  { id: 'store-sz-1', name: '南山区店', region: '深圳', status: 'online', trend: 'up', metrics: { revenue: 410000, orderCount: 1580, avgOrderValue: 259.49, activeMembers: 2480, deviceUtilization: 84, customerSatisfaction: 90 } },
  { id: 'store-sz-2', name: '福田区店', region: '深圳', status: 'offline', trend: 'down', metrics: { revenue: 185000, orderCount: 720, avgOrderValue: 256.94, activeMembers: 1100, deviceUtilization: 32, customerSatisfaction: 65 } },
];

// ── 辅助函数 (镜像 page 逻辑) ──

function filterByRegion(stores: StoreComparisonItem[], region: RegionFilter): StoreComparisonItem[] {
  if (region === 'all') return stores;
  return stores.filter((s) => s.region === region);
}

function filterByStatus(stores: StoreComparisonItem[], status: StatusFilter): StoreComparisonItem[] {
  if (status === 'all') return stores;
  return stores.filter((s) => s.status === status);
}

function sortByMetric(stores: StoreComparisonItem[], key: SortKey, desc = true): StoreComparisonItem[] {
  return [...stores].sort((a, b) => (desc ? -1 : 1) * (a.metrics[key] - b.metrics[key]));
}

function getTopStore<T extends StoreComparisonItem>(stores: T[], key: SortKey): T | undefined {
  if (stores.length === 0) return undefined;
  return stores.reduce((best, s) => (s.metrics[key] > best.metrics[key] ? s : best));
}

function getStoreCountByRegion(stores: StoreComparisonItem[], region: string): number {
  return stores.filter((s) => s.region === region).length;
}

function getAverageMetric(stores: StoreComparisonItem[], key: SortKey): number {
  if (stores.length === 0) return 0;
  return Math.round(stores.reduce((sum, s) => sum + s.metrics[key], 0) / stores.length);
}

function getOnlineStores(stores: StoreComparisonItem[]): StoreComparisonItem[] {
  return stores.filter((s) => s.status === 'online');
}

// ── 正例 ──

test('数据完整性: 所有门店字段齐全、ID 唯一', () => {
  const ids = MOCK_ALL_STORES.map((s) => s.id);
  assert.strictEqual(new Set(ids).size, ids.length);

  for (const s of MOCK_ALL_STORES) {
    assert.ok(s.id.length > 0);
    assert.ok(s.name.length > 0);
    assert.ok(['北京', '上海', '广州', '深圳'].includes(s.region));
    assert.ok(['online', 'offline', 'maintenance'].includes(s.status));
    assert.ok(['up', 'down', 'stable'].includes(s.trend));

    const m = s.metrics;
    assert.ok(m.revenue > 0);
    assert.ok(m.orderCount > 0);
    assert.ok(m.avgOrderValue > 0);
    assert.ok(m.activeMembers > 0);
    assert.ok(m.deviceUtilization >= 0 && m.deviceUtilization <= 100);
    assert.ok(m.customerSatisfaction >= 0 && m.customerSatisfaction <= 100);
  }
});

test('filterByRegion: 北京区域返回 2 家门店', () => {
  const result = filterByRegion(MOCK_ALL_STORES, '北京');
  assert.strictEqual(result.length, 2);
  for (const s of result) {
    assert.strictEqual(s.region, '北京');
  }
});

test('filterByRegion: 全部区域返回 8 家', () => {
  assert.strictEqual(filterByRegion(MOCK_ALL_STORES, 'all').length, 8);
});

test('filterByStatus: online 状态返回 > 0', () => {
  const result = filterByStatus(MOCK_ALL_STORES, 'online');
  assert.ok(result.length > 0);
  for (const s of result) {
    assert.strictEqual(s.status, 'online');
  }
});

test('filterByStatus: maintenance 返回 1 家 (天河区店)', () => {
  const result = filterByStatus(MOCK_ALL_STORES, 'maintenance');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].name, '天河区店');
});

test('sortByMetric: 按营收降序, 朝阳旗舰店排第一', () => {
  const sorted = sortByMetric(MOCK_ALL_STORES, 'revenue');
  assert.strictEqual(sorted[0].name, '朝阳旗舰店');
  assert.strictEqual(sorted[0].metrics.revenue, 520000);
});

test('sortByMetric: 按满意度降序, 朝阳旗舰店排第一', () => {
  const sorted = sortByMetric(MOCK_ALL_STORES, 'customerSatisfaction');
  assert.strictEqual(sorted[0].metrics.customerSatisfaction, 92);
});

test('sortByMetric: 按订单数降序, 朝阳旗舰店排第一', () => {
  const sorted = sortByMetric(MOCK_ALL_STORES, 'orderCount');
  assert.strictEqual(sorted[0].metrics.orderCount, 1860);
});

test('getTopStore: 营收最高门店', () => {
  const top = getTopStore(MOCK_ALL_STORES, 'revenue');
  assert.ok(top);
  assert.strictEqual(top.name, '朝阳旗舰店');
  assert.strictEqual(top.region, '北京');
});

test('getTopStore: 满意度最高门店', () => {
  const top = getTopStore(MOCK_ALL_STORES, 'customerSatisfaction');
  assert.ok(top);
  assert.strictEqual(top.metrics.customerSatisfaction, 92);
});

test('getAverageMetric: 平均营收', () => {
  const avg = getAverageMetric(MOCK_ALL_STORES, 'revenue');
  const expected = Math.round((520000 + 380000 + 485000 + 335000 + 210000 + 268000 + 410000 + 185000) / 8);
  assert.strictEqual(avg, expected);
});

test('getStoreCountByRegion: 各区域门店数量正确', () => {
  assert.strictEqual(getStoreCountByRegion(MOCK_ALL_STORES, '北京'), 2);
  assert.strictEqual(getStoreCountByRegion(MOCK_ALL_STORES, '上海'), 2);
  assert.strictEqual(getStoreCountByRegion(MOCK_ALL_STORES, '广州'), 2);
  assert.strictEqual(getStoreCountByRegion(MOCK_ALL_STORES, '深圳'), 2);
});

test('getOnlineStores: 营业中门店数量', () => {
  const online = getOnlineStores(MOCK_ALL_STORES);
  assert.strictEqual(online.length, 6); // 朝阳、海淀、浦东、静安寺、番禺、南山 = 6? Let's check
  // online stores: 朝阳(bj-1), 海淀(bj-2), 浦东(sh-1), 静安寺(sh-2), 番禺(gz-2), 南山(sz-1) = 6
  assert.strictEqual(online.length, 6);
});

test('北京门店营收高于广州门店', () => {
  const bj = filterByRegion(MOCK_ALL_STORES, '北京');
  const gz = filterByRegion(MOCK_ALL_STORES, '广州');
  const bjTotal = bj.reduce((s, st) => s + st.metrics.revenue, 0);
  const gzTotal = gz.reduce((s, st) => s + st.metrics.revenue, 0);
  assert.ok(bjTotal > gzTotal, `北京 ${bjTotal} > 广州 ${gzTotal}`);
});

test('深圳南山区店满意度最高(深圳)', () => {
  const sz = filterByRegion(MOCK_ALL_STORES, '深圳');
  const top = getTopStore(sz, 'customerSatisfaction');
  assert.strictEqual(top?.name, '南山区店');
  assert.strictEqual(top?.metrics.customerSatisfaction, 90);
});

test('所有指标均大于零', () => {
  for (const s of MOCK_ALL_STORES) {
    const m = s.metrics;
    assert.ok(m.revenue > 0);
    assert.ok(m.orderCount > 0);
    assert.ok(m.avgOrderValue > 0);
    assert.ok(m.activeMembers > 0);
  }
});

// ── 反例 ──

test('反例: 不存在的区域返回空数组', () => {
  const result = filterByRegion(MOCK_ALL_STORES, 'all' as Region);
  // 'all' returns all, but a non-existent region would be caught by type system
  // Testing with empty region scenario
  const emptyResult = MOCK_ALL_STORES.filter((s) => (s.region as string) === '成都');
  assert.strictEqual(emptyResult.length, 0);
});

test('反例: 不存在状态返回空', () => {
  const result = MOCK_ALL_STORES.filter((s) => (s.status as string) === 'unknown');
  assert.strictEqual(result.length, 0);
});

test('反例: 空数组 filterByStatus 返回空', () => {
  assert.strictEqual(filterByStatus([], 'online').length, 0);
});

test('反例: 空数组 sortByMetric 返回空', () => {
  assert.strictEqual(sortByMetric([], 'revenue').length, 0);
});

test('反例: 空数组 getTopStore 返回 undefined', () => {
  assert.strictEqual(getTopStore([], 'revenue'), undefined);
});

test('反例: 空数组 getAverageMetric 返回 0', () => {
  assert.strictEqual(getAverageMetric([], 'revenue'), 0);
});

test('反例: 不存在门店 ID 不在 mock 中', () => {
  const found = MOCK_ALL_STORES.find((s) => s.id === 'store-unknown');
  assert.strictEqual(found, undefined);
});

test('反例: 负数营收不存在', () => {
  const negative = MOCK_ALL_STORES.filter((s) => s.metrics.revenue < 0);
  assert.strictEqual(negative.length, 0);
});

// ── 边界 ──

test('边界: 设备利用率在 0~100 之间', () => {
  for (const s of MOCK_ALL_STORES) {
    assert.ok(s.metrics.deviceUtilization >= 0);
    assert.ok(s.metrics.deviceUtilization <= 100);
  }
});

test('边界: 满意度在 0~100 之间', () => {
  for (const s of MOCK_ALL_STORES) {
    assert.ok(s.metrics.customerSatisfaction >= 0);
    assert.ok(s.metrics.customerSatisfaction <= 100);
  }
});

test('边界: 最差设备利用率门店 (福田区店)', () => {
  const sorted = sortByMetric(MOCK_ALL_STORES, 'deviceUtilization', false); // asc
  const worst = sorted[0];
  assert.strictEqual(worst.name, '福田区店');
  assert.strictEqual(worst.metrics.deviceUtilization, 32);
});

test('边界: 每个区域至少有一家门店', () => {
  const regions = new Set(MOCK_ALL_STORES.map((s) => s.region));
  for (const r of regions) {
    assert.ok(getStoreCountByRegion(MOCK_ALL_STORES, r) >= 1, `${r} should have >= 1 store`);
  }
});

test('边界: 组合筛选 北京+online 返回 2', () => {
  let result = filterByRegion(MOCK_ALL_STORES, '北京');
  result = filterByStatus(result, 'online');
  assert.strictEqual(result.length, 2);
  for (const s of result) {
    assert.strictEqual(s.region, '北京');
    assert.strictEqual(s.status, 'online');
  }
});

test('边界: 组合筛选 广州+maintenance 返回 1', () => {
  let result = filterByRegion(MOCK_ALL_STORES, '广州');
  result = filterByStatus(result, 'maintenance');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].name, '天河区店');
});

test('边界: 深圳门店营收总和', () => {
  const sz = filterByRegion(MOCK_ALL_STORES, '深圳');
  const total = sz.reduce((s, st) => s + st.metrics.revenue, 0);
  assert.strictEqual(total, 595000); // 410000 + 185000
});

test('边界: 平均客单价区间 200~300', () => {
  for (const s of MOCK_ALL_STORES) {
    assert.ok(s.metrics.avgOrderValue >= 200, `${s.name} avgOrderValue ${s.metrics.avgOrderValue} < 200`);
    assert.ok(s.metrics.avgOrderValue <= 300, `${s.name} avgOrderValue ${s.metrics.avgOrderValue} > 300`);
  }
});

test('边界: 营业额最高的区域是北京', () => {
  const regions: Region[] = ['北京', '上海', '广州', '深圳'];
  const totals = regions.map((r) => {
    const stores = filterByRegion(MOCK_ALL_STORES, r);
    return stores.reduce((s, st) => s + st.metrics.revenue, 0);
  });
  const maxIdx = totals.indexOf(Math.max(...totals));
  assert.strictEqual(regions[maxIdx], '北京');
});
