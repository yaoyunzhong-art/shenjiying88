/**
 * store-revenue/page.test.ts — 门店营收 L1 测试
 *
 * 覆盖: 数据模型 / KPI 汇总 / 渠道过滤 / 分页 / 边界条件 / 增长率计算
 * 角色视角: 👔 店长 / 💰 财务 / 🎯 运营总监
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync } from 'node:fs';

// ── 类型 (mirrors page.tsx) ──

type RevenuePeriod = 'daily' | 'weekly' | 'monthly';
type RevenueChannel = 'all' | 'offline' | 'online' | 'membership';

interface RevenueRecord {
  id: string;
  date: string;
  total: number;
  offline: number;
  online: number;
  membership: number;
  orderCount: number;
  avgOrderValue: number;
}

interface RevenueSummary {
  totalRevenue: number;
  avgDaily: number;
  maxDaily: number;
  minDaily: number;
  offlineRatio: number;
  onlineRatio: number;
  membershipRatio: number;
  totalOrders: number;
  avgOrderValue: number;
  growth: number;
}

// ── Mock 数据 (mirrors page.tsx MOCK_REVENUE) ──

const MOCK_REVENUE: RevenueRecord[] = [
  { id: 'R01', date: '2026-07-13', total: 48200, offline: 28500, online: 12500, membership: 7200, orderCount: 86, avgOrderValue: 560 },
  { id: 'R02', date: '2026-07-14', total: 51300, offline: 30200, online: 13800, membership: 7300, orderCount: 92, avgOrderValue: 558 },
  { id: 'R03', date: '2026-07-15', total: 46800, offline: 26800, online: 12400, membership: 7600, orderCount: 84, avgOrderValue: 557 },
  { id: 'R04', date: '2026-07-16', total: 55600, offline: 33800, online: 14200, membership: 7600, orderCount: 98, avgOrderValue: 567 },
  { id: 'R05', date: '2026-07-17', total: 61200, offline: 37800, online: 15800, membership: 7600, orderCount: 105, avgOrderValue: 583 },
  { id: 'R06', date: '2026-07-18', total: 58900, offline: 35200, online: 15100, membership: 8600, orderCount: 102, avgOrderValue: 577 },
  { id: 'R07', date: '2026-07-19', total: 44500, offline: 25800, online: 11500, membership: 7200, orderCount: 78, avgOrderValue: 570 },
  { id: 'R08', date: '2026-07-20', total: 49800, offline: 29500, online: 12800, membership: 7500, orderCount: 88, avgOrderValue: 566 },
  { id: 'R09', date: '2026-07-21', total: 52400, offline: 31500, online: 13600, membership: 7300, orderCount: 91, avgOrderValue: 576 },
  { id: 'R10', date: '2026-07-22', total: 56100, offline: 34100, online: 14500, membership: 7500, orderCount: 96, avgOrderValue: 584 },
  { id: 'R11', date: '2026-07-23', total: 63500, offline: 39800, online: 16200, membership: 7500, orderCount: 108, avgOrderValue: 588 },
  { id: 'R12', date: '2026-07-24', total: 67200, offline: 41800, online: 17200, membership: 8200, orderCount: 112, avgOrderValue: 600 },
  { id: 'R13', date: '2026-07-25', total: 59800, offline: 36200, online: 15400, membership: 8200, orderCount: 103, avgOrderValue: 581 },
  { id: 'R14', date: '2026-07-26', total: 48600, offline: 27800, online: 12600, membership: 8200, orderCount: 85, avgOrderValue: 572 },
];

// ── 纯函数 (mirrors page.tsx) ──

function computeRevenueSummary(records: RevenueRecord[]): RevenueSummary {
  if (records.length === 0) {
    return { totalRevenue: 0, avgDaily: 0, maxDaily: 0, minDaily: 0, offlineRatio: 0, onlineRatio: 0, membershipRatio: 0, totalOrders: 0, avgOrderValue: 0, growth: 0 };
  }
  const totalRevenue = records.reduce((s, r) => s + r.total, 0);
  const totalOrders = records.reduce((s, r) => s + r.orderCount, 0);
  const totalOffline = records.reduce((s, r) => s + r.offline, 0);
  const totalOnline = records.reduce((s, r) => s + r.online, 0);
  const totalMembership = records.reduce((s, r) => s + r.membership, 0);
  const avgDaily = Math.round(totalRevenue / records.length);
  const maxDaily = Math.max(...records.map(r => r.total));
  const minDaily = Math.min(...records.map(r => r.total));
  const offlineRatio = totalRevenue > 0 ? Math.round((totalOffline / totalRevenue) * 100) : 0;
  const onlineRatio = totalRevenue > 0 ? Math.round((totalOnline / totalRevenue) * 100) : 0;
  const membershipRatio = totalRevenue > 0 ? Math.round((totalMembership / totalRevenue) * 100) : 0;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // 增长率: 前后半段对比
  const mid = Math.floor(records.length / 2);
  const firstHalf = records.slice(0, mid).reduce((s, r) => s + r.total, 0);
  const secondHalf = records.slice(mid, records.length).reduce((s, r) => s + r.total, 0);
  const growth = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

  return { totalRevenue, avgDaily, maxDaily, minDaily, offlineRatio, onlineRatio, membershipRatio, totalOrders, avgOrderValue, growth };
}

function filterByChannel(records: RevenueRecord[], channel: RevenueChannel): RevenueRecord[] {
  if (channel === 'all') return records;
  return records.map(r => ({
    ...r,
    total: channel === 'offline' ? r.offline : channel === 'online' ? r.online : r.membership,
    offline: channel === 'offline' ? r.offline : 0,
    online: channel === 'online' ? r.online : 0,
    membership: channel === 'membership' ? r.membership : 0,
  }));
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  if (page < 1) throw new Error('page must be >= 1');
  if (pageSize < 1) throw new Error('pageSize must be >= 1');
  return items.slice((page - 1) * pageSize, page * pageSize);
}

// ══════════════════════════════════════════════════════
// 正例
// ══════════════════════════════════════════════════════

describe('门店营收（正例）', () => {

  it('Mock 数据应有 14 条营收记录', () => {
    assert.equal(MOCK_REVENUE.length, 14);
  });

  it('每条记录应包含所有必需字段', () => {
    for (const r of MOCK_REVENUE) {
      assert.ok(r.id);
      assert.ok(r.date);
      assert.equal(typeof r.total, 'number');
      assert.equal(typeof r.offline, 'number');
      assert.equal(typeof r.online, 'number');
      assert.equal(typeof r.membership, 'number');
      assert.equal(typeof r.orderCount, 'number');
      assert.equal(typeof r.avgOrderValue, 'number');
      assert.ok(r.total > 0);
      assert.ok(r.orderCount > 0);
    }
  });

  it('每条记录的总营收 = offline + online + membership', () => {
    for (const r of MOCK_REVENUE) {
      assert.equal(r.offline + r.online + r.membership, r.total,
        `${r.id}: ${r.offline}+${r.online}+${r.membership} != ${r.total}`);
    }
  });

  it('KPI 汇总: totalRevenue 应正确', () => {
    const summary = computeRevenueSummary(MOCK_REVENUE);
    const expected = MOCK_REVENUE.reduce((s, r) => s + r.total, 0);
    assert.equal(summary.totalRevenue, expected);
  });

  it('KPI 汇总: avgDaily 应正确', () => {
    const summary = computeRevenueSummary(MOCK_REVENUE);
    const expected = Math.round(MOCK_REVENUE.reduce((s, r) => s + r.total, 0) / 14);
    assert.equal(summary.avgDaily, expected);
  });

  it('KPI 汇总: totalOrders 应正确', () => {
    const summary = computeRevenueSummary(MOCK_REVENUE);
    const expected = MOCK_REVENUE.reduce((s, r) => s + r.orderCount, 0);
    assert.equal(summary.totalOrders, expected);
  });

  it('KPI 汇总: avgOrderValue 应正确', () => {
    const summary = computeRevenueSummary(MOCK_REVENUE);
    const totalRevenue = MOCK_REVENUE.reduce((s, r) => s + r.total, 0);
    const totalOrders = MOCK_REVENUE.reduce((s, r) => s + r.orderCount, 0);
    assert.equal(summary.avgOrderValue, Math.round(totalRevenue / totalOrders));
  });

  it('KPI 汇总: maxDaily 应正确', () => {
    const summary = computeRevenueSummary(MOCK_REVENUE);
    const expected = Math.max(...MOCK_REVENUE.map(r => r.total));
    assert.equal(summary.maxDaily, expected);
    assert.equal(summary.maxDaily, 67200); // R12
  });

  it('KPI 汇总: minDaily 应正确', () => {
    const summary = computeRevenueSummary(MOCK_REVENUE);
    const expected = Math.min(...MOCK_REVENUE.map(r => r.total));
    assert.equal(summary.minDaily, expected);
    assert.equal(summary.minDaily, 44500); // R07
  });

  it('KPI 汇总: offlineRatio 应正确', () => {
    const summary = computeRevenueSummary(MOCK_REVENUE);
    const totalOffline = MOCK_REVENUE.reduce((s, r) => s + r.offline, 0);
    const totalRevenue = MOCK_REVENUE.reduce((s, r) => s + r.total, 0);
    assert.equal(summary.offlineRatio, Math.round((totalOffline / totalRevenue) * 100));
  });

  it('KPI 汇总: onlineRatio 应正确', () => {
    const summary = computeRevenueSummary(MOCK_REVENUE);
    const totalOnline = MOCK_REVENUE.reduce((s, r) => s + r.online, 0);
    const totalRevenue = MOCK_REVENUE.reduce((s, r) => s + r.total, 0);
    assert.equal(summary.onlineRatio, Math.round((totalOnline / totalRevenue) * 100));
  });

  it('KPI 汇总: membershipRatio 应正确', () => {
    const summary = computeRevenueSummary(MOCK_REVENUE);
    const totalMembership = MOCK_REVENUE.reduce((s, r) => s + r.membership, 0);
    const totalRevenue = MOCK_REVENUE.reduce((s, r) => s + r.total, 0);
    assert.equal(summary.membershipRatio, Math.round((totalMembership / totalRevenue) * 100));
  });

  it('KPI 汇总: 三个渠道占比之合应为 100%', () => {
    const summary = computeRevenueSummary(MOCK_REVENUE);
    assert.equal(summary.offlineRatio + summary.onlineRatio + summary.membershipRatio, 100);
  });

  it('KPI 汇总: growth 应 > 0（下半段营收 > 上半段）', () => {
    const summary = computeRevenueSummary(MOCK_REVENUE);
    assert.ok(summary.growth > 0, '增长应为正');
  });

  it('filterByChannel: "all" 返回原始数据', () => {
    const r = filterByChannel(MOCK_REVENUE, 'all');
    assert.equal(r.length, 14);
    assert.equal(r[0].total, MOCK_REVENUE[0].total);
  });

  it('filterByChannel: "offline" 返回 offline 值作为 total', () => {
    const r = filterByChannel(MOCK_REVENUE, 'offline');
    assert.equal(r[0].total, MOCK_REVENUE[0].offline);
    assert.equal(r[0].online, 0);
    assert.equal(r[0].membership, 0);
  });

  it('filterByChannel: "online" 返回 online 值作为 total', () => {
    const r = filterByChannel(MOCK_REVENUE, 'online');
    assert.equal(r[0].total, MOCK_REVENUE[0].online);
    assert.equal(r[0].offline, 0);
    assert.equal(r[0].membership, 0);
  });

  it('filterByChannel: "membership" 返回 membership 值作为 total', () => {
    const r = filterByChannel(MOCK_REVENUE, 'membership');
    assert.equal(r[0].total, MOCK_REVENUE[0].membership);
    assert.equal(r[0].offline, 0);
    assert.equal(r[0].online, 0);
  });

  it('分页 pageSize=7 第1页返回 7 条', () => {
    assert.equal(paginate(MOCK_REVENUE, 1, 7).length, 7);
  });

  it('分页 pageSize=7 第2页返回 7 条', () => {
    assert.equal(paginate(MOCK_REVENUE, 2, 7).length, 7);
  });

  it('页面文件 page.tsx 应存在', () => {
    assert.ok(existsSync(new URL('./page.tsx', import.meta.url)), 'page.tsx 文件应存在');
  });

  it('日期字符串格式应合法', () => {
    for (const r of MOCK_REVENUE) {
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(r.date), `${r.id}: 日期格式无效 ${r.date}`);
    }
  });

  it('每条记录的 avgOrderValue 和订单数应一致', () => {
    for (const r of MOCK_REVENUE) {
      const computedAov = Math.round(r.total / r.orderCount);
      // 允许 1 元以内的四舍五入差异
      assert.ok(Math.abs(computedAov - r.avgOrderValue) <= 1,
        `${r.id}: aov ${r.avgOrderValue} !== computed ${computedAov}`);
    }
  });
});

// ══════════════════════════════════════════════════════
// 反例
// ══════════════════════════════════════════════════════

describe('门店营收（反例）', () => {

  it('记录 id 不应重复', () => {
    const ids = MOCK_REVENUE.map(r => r.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('分页 page=0 应抛异常', () => {
    assert.throws(() => paginate(MOCK_REVENUE, 0, 5), /page must be >= 1/);
  });

  it('分页 pageSize=0 应抛异常', () => {
    assert.throws(() => paginate(MOCK_REVENUE, 1, 0), /pageSize must be >= 1/);
  });

  it('total 不应为负数', () => {
    for (const r of MOCK_REVENUE) {
      assert.ok(r.total >= 0);
    }
  });

  it('offline/online/membership 不应为负数', () => {
    for (const r of MOCK_REVENUE) {
      assert.ok(r.offline >= 0);
      assert.ok(r.online >= 0);
      assert.ok(r.membership >= 0);
    }
  });

  it('orderCount 不应为负数', () => {
    for (const r of MOCK_REVENUE) {
      assert.ok(r.orderCount >= 0);
    }
  });

  it('avgOrderValue 不应为负数', () => {
    for (const r of MOCK_REVENUE) {
      assert.ok(r.avgOrderValue >= 0);
    }
  });
});

// ══════════════════════════════════════════════════════
// 边界
// ══════════════════════════════════════════════════════

describe('门店营收（边界）', () => {

  it('空数据 KPI 汇总应全零', () => {
    const s = computeRevenueSummary([]);
    assert.equal(s.totalRevenue, 0);
    assert.equal(s.avgDaily, 0);
    assert.equal(s.maxDaily, 0);
    assert.equal(s.minDaily, 0);
    assert.equal(s.offlineRatio, 0);
    assert.equal(s.onlineRatio, 0);
    assert.equal(s.membershipRatio, 0);
    assert.equal(s.totalOrders, 0);
    assert.equal(s.avgOrderValue, 0);
    assert.equal(s.growth, 0);
  });

  it('单条记录 KPI 汇总应与该记录一致', () => {
    const single = [MOCK_REVENUE[0]];
    const s = computeRevenueSummary(single);
    assert.equal(s.totalRevenue, single[0].total);
    assert.equal(s.avgDaily, single[0].total);
    assert.equal(s.maxDaily, single[0].total);
    assert.equal(s.minDaily, single[0].total);
    assert.equal(s.totalOrders, single[0].orderCount);
    assert.equal(s.growth, 0);
  });

  it('分页超过总页数返回空数组', () => {
    assert.equal(paginate(MOCK_REVENUE, 100, 5).length, 0);
  });

  it('分页 pageSize=14 一页返回全部', () => {
    assert.equal(paginate(MOCK_REVENUE, 1, 14).length, 14);
  });

  it('filterByChannel 不影响记录数', () => {
    assert.equal(filterByChannel(MOCK_REVENUE, 'all').length, 14);
    assert.equal(filterByChannel(MOCK_REVENUE, 'offline').length, 14);
    assert.equal(filterByChannel(MOCK_REVENUE, 'online').length, 14);
    assert.equal(filterByChannel(MOCK_REVENUE, 'membership').length, 14);
  });

  it('增长率计算: 前半段 sum 应正确', () => {
    const mid = Math.floor(MOCK_REVENUE.length / 2); // 7
    const firstHalf = MOCK_REVENUE.slice(0, mid).reduce((s, r) => s + r.total, 0);
    const expected = MOCK_REVENUE.slice(0, 7).reduce((s, r) => s + r.total, 0);
    assert.equal(firstHalf, expected);
  });

  it('增长率计算: 后半段 sum 应正确', () => {
    const mid = Math.floor(MOCK_REVENUE.length / 2);
    const secondHalf = MOCK_REVENUE.slice(mid).reduce((s, r) => s + r.total, 0);
    const expected = MOCK_REVENUE.slice(7).reduce((s, r) => s + r.total, 0);
    assert.equal(secondHalf, expected);
  });

  it('最高营收日应出现在周末附近', () => {
    const max = MOCK_REVENUE.reduce((max, r) => r.total > max.total ? r : max, MOCK_REVENUE[0]);
    // R12 date=2026-07-24 (Friday) has highest
    assert.equal(max.id, 'R12');
    assert.equal(max.date, '2026-07-24');
  });

  it('最低营收日应为 R07', () => {
    const min = MOCK_REVENUE.reduce((min, r) => r.total < min.total ? r : min, MOCK_REVENUE[0]);
    assert.equal(min.id, 'R07');
  });

  it('总营收应为各日之和', () => {
    const sum = MOCK_REVENUE.reduce((s, r) => s + r.total, 0);
    const s = computeRevenueSummary(MOCK_REVENUE);
    assert.equal(s.totalRevenue, sum);
  });
});

// ══════════════════════════════════════════════════════
// 渠道逻辑专项
// ══════════════════════════════════════════════════════

describe('门店营收（渠道逻辑）', () => {

  it('线下营收应占总营收约 60%', () => {
    const totalOffline = MOCK_REVENUE.reduce((s, r) => s + r.offline, 0);
    const totalRevenue = MOCK_REVENUE.reduce((s, r) => s + r.total, 0);
    const ratio = totalOffline / totalRevenue;
    assert.ok(ratio > 0.55 && ratio < 0.65, `线下占比 ${ratio} 超出预期`);
  });

  it('线上营收应占总营收约 25%', () => {
    const totalOnline = MOCK_REVENUE.reduce((s, r) => s + r.online, 0);
    const totalRevenue = MOCK_REVENUE.reduce((s, r) => s + r.total, 0);
    const ratio = totalOnline / totalRevenue;
    assert.ok(ratio > 0.2 && ratio < 0.3, `线上占比 ${ratio} 超出预期`);
  });

  it('会员营收应占总营收约 14%', () => {
    const totalMembership = MOCK_REVENUE.reduce((s, r) => s + r.membership, 0);
    const totalRevenue = MOCK_REVENUE.reduce((s, r) => s + r.total, 0);
    const ratio = totalMembership / totalRevenue;
    assert.ok(ratio > 0.12 && ratio < 0.17, `会员占比 ${ratio} 超出预期`);
  });

  it('总订单数应为各日订单之和', () => {
    const expected = MOCK_REVENUE.reduce((s, r) => s + r.orderCount, 0);
    const s = computeRevenueSummary(MOCK_REVENUE);
    assert.equal(s.totalOrders, expected);
  });

  it('avgOrderValue 应在合理的范围内 (500~650)', () => {
    for (const r of MOCK_REVENUE) {
      assert.ok(r.avgOrderValue >= 500 && r.avgOrderValue <= 650,
        `${r.id}: avgOrderValue ${r.avgOrderValue} 超出预期范围`);
    }
  });

  it('各渠道过滤后的 KPI 汇总应与 single-channel 一致', () => {
    const offlineFiltered = filterByChannel(MOCK_REVENUE, 'offline');
    const s = computeRevenueSummary(offlineFiltered);
    const expectedOfflineTotal = MOCK_REVENUE.reduce((sum, r) => sum + r.offline, 0);
    assert.equal(s.totalRevenue, expectedOfflineTotal);
  });
});
