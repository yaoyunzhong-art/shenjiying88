/**
 * stores-page.test.ts — 门店列表页数据/过滤/排序/分页逻辑测试
 *
 * 测试 stores-data 导出的数据模型、过滤谓词、排序比较器、
 * 分页计算以及页面内联使用的 StoreItem 类型完整性。
 * 对应页面: apps/admin-web/app/stores/page.tsx
 * 对应数据: apps/admin-web/app/stores-data.ts
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  MOCK_STORES,
  MOCK_STORE_DETAILS,
  STORE_STATUS_MAP,
  STORE_RISK_LEVEL_MAP,
  STORE_STATUSES,
  STORE_RISK_LEVELS,
  computeStoreStats,
  computeStoreMarketDistribution,
  adminStoreRoute,
  type StoreItem,
  type StoreStatus,
  type StoreRiskLevel,
} from './stores-data';

// ---- 页面中使用的搜索字段 ----
const PAGE_SEARCH_FIELDS: (keyof StoreItem)[] = ['code', 'name', 'marketCode'];

// ---- 过滤辅助（模拟页面 useMemo 中的过滤链） ----
function filterBySearch(items: StoreItem[], term: string): StoreItem[] {
  if (!term.trim()) return items;
  const lower = term.toLowerCase();
  return items.filter((item) =>
    PAGE_SEARCH_FIELDS.some((field) => String(item[field]).toLowerCase().includes(lower))
  );
}

function filterByStatus(items: StoreItem[], status: StoreStatus | 'ALL'): StoreItem[] {
  if (status === 'ALL') return items;
  return items.filter((item) => item.status === status);
}

function filterByMarket(items: StoreItem[], market: string): StoreItem[] {
  if (market === 'ALL') return items;
  return items.filter((item) => item.marketCode === market);
}

function filterByRisk(items: StoreItem[], risk: StoreRiskLevel | 'ALL'): StoreItem[] {
  if (risk === 'ALL') return items;
  return items.filter((item) => item.riskLevel === risk);
}

function fullFilterChain(
  items: StoreItem[],
  searchTerm: string,
  status: StoreStatus | 'ALL',
  market: string,
  risk: StoreRiskLevel | 'ALL',
): StoreItem[] {
  let result = filterBySearch(items, searchTerm);
  result = filterByStatus(result, status);
  result = filterByMarket(result, market);
  result = filterByRisk(result, risk);
  return result;
}

// ---- 排序辅助 ----
function sortItems(
  items: StoreItem[],
  key: string,
  direction: 'asc' | 'desc',
): StoreItem[] {
  const sorted = [...items].sort((a, b) => {
    const aVal = a[key as keyof StoreItem];
    const bVal = b[key as keyof StoreItem];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return aVal - bVal;
    }
    return String(aVal).localeCompare(String(bVal));
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}

// ---- 分页辅助 ----
function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
}

// ═══════════════════════════════════════════════════════════
// 数据完整性
// ═══════════════════════════════════════════════════════════

describe('stores page — 数据完整性', () => {
  test('MOCK_STORES 至少有 15 条记录覆盖 3 个市场', () => {
    assert.ok(MOCK_STORES.length >= 15);
    const markets = new Set(MOCK_STORES.map((s) => s.marketCode));
    assert.ok(markets.has('cn-mainland'));
    assert.ok(markets.has('us-default'));
    assert.ok(markets.has('uk-default'));
  });

  test('每条记录必需字段完整', () => {
    for (const s of MOCK_STORES) {
      assert.ok(s.id, `${s.code}: missing id`);
      assert.ok(s.code, 'missing code');
      assert.ok(s.name, `${s.code}: missing name`);
      assert.ok(s.marketCode, `${s.code}: missing marketCode`);
      assert.ok(STORE_STATUSES.includes(s.status), `${s.code}: invalid status ${s.status}`);
      assert.ok(STORE_RISK_LEVELS.includes(s.riskLevel), `${s.code}: invalid riskLevel ${s.riskLevel}`);
      assert.ok(typeof s.tenantCount === 'number' && s.tenantCount >= 0, `${s.code}: invalid tenantCount`);
      assert.ok(typeof s.brandCount === 'number' && s.brandCount >= 0, `${s.code}: invalid brandCount`);
      assert.ok(s.lastDeployed, `${s.code}: missing lastDeployed`);
    }
  });

  test('所有 id 和 code 唯一', () => {
    const ids = MOCK_STORES.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    const codes = MOCK_STORES.map((s) => s.code);
    assert.equal(new Set(codes).size, codes.length);
  });

  test('四种状态均有代表', () => {
    for (const st of STORE_STATUSES) {
      const count = MOCK_STORES.filter((s) => s.status === st).length;
      assert.ok(count > 0, `status ${st} has no records`);
    }
  });

  test('三种风险等级均有代表', () => {
    for (const r of STORE_RISK_LEVELS) {
      const count = MOCK_STORES.filter((s) => s.riskLevel === r).length;
      assert.ok(count > 0, `riskLevel ${r} has no records`);
    }
  });
});

// ═══════════════════════════════════════════════════════════
// 搜索过滤
// ═══════════════════════════════════════════════════════════

describe('stores page — 搜索过滤', () => {
  test('空搜索返回全部', () => {
    assert.equal(filterBySearch(MOCK_STORES, '').length, MOCK_STORES.length);
    assert.equal(filterBySearch(MOCK_STORES, '   ').length, MOCK_STORES.length);
  });

  test('按门店编码搜索', () => {
    const result = filterBySearch(MOCK_STORES, 'STORE-001');
    assert.equal(result.length, 1);
    assert.equal(result[0]!.code, 'STORE-001');
  });

  test('按门店名称搜索（部分匹配）', () => {
    const result = filterBySearch(MOCK_STORES, '朝阳');
    assert.equal(result.length, 1);
    assert.equal(result[0]!.name, '朝阳大悦城旗舰店');
  });

  test('按市场代码搜索', () => {
    const us = filterBySearch(MOCK_STORES, 'us-default');
    assert.ok(us.length >= 3);
    assert.ok(us.every((s) => s.marketCode === 'us-default'));
  });

  test('搜索不区分大小写', () => {
    const lower = filterBySearch(MOCK_STORES, 'san francisco');
    const upper = filterBySearch(MOCK_STORES, 'SAN FRANCISCO');
    assert.equal(lower.length, upper.length);
    assert.ok(lower.length >= 1);
  });

  test('搜索无匹配返回空数组', () => {
    assert.equal(filterBySearch(MOCK_STORES, '不存在的门店').length, 0);
  });
});

// ═══════════════════════════════════════════════════════════
// 状态/市场/风险过滤
// ═══════════════════════════════════════════════════════════

describe('stores page — 过滤链', () => {
  test('status=ALL 不过滤', () => {
    assert.equal(filterByStatus(MOCK_STORES, 'ALL').length, MOCK_STORES.length);
  });

  test('按 active 过滤', () => {
    const active = filterByStatus(MOCK_STORES, 'active');
    assert.ok(active.length > 0);
    assert.ok(active.every((s) => s.status === 'active'));
  });

  test('按 suspended 过滤', () => {
    const suspended = filterByStatus(MOCK_STORES, 'suspended');
    assert.ok(suspended.length > 0);
    assert.ok(suspended.every((s) => s.status === 'suspended'));
  });

  test('market=ALL 不过滤', () => {
    assert.equal(filterByMarket(MOCK_STORES, 'ALL').length, MOCK_STORES.length);
  });

  test('按 cn-mainland 过滤', () => {
    const cn = filterByMarket(MOCK_STORES, 'cn-mainland');
    assert.ok(cn.length > 5);
    assert.ok(cn.every((s) => s.marketCode === 'cn-mainland'));
  });

  test('risk=ALL 不过滤', () => {
    assert.equal(filterByRisk(MOCK_STORES, 'ALL').length, MOCK_STORES.length);
  });

  test('按 high 风险过滤', () => {
    const high = filterByRisk(MOCK_STORES, 'high');
    assert.ok(high.length > 0);
    assert.ok(high.every((s) => s.riskLevel === 'high'));
  });

  test('组合过滤: status + market + risk', () => {
    const result = fullFilterChain(MOCK_STORES, '', 'active', 'cn-mainland', 'low');
    assert.ok(result.length > 0);
    assert.ok(result.every(
      (s) => s.status === 'active' && s.marketCode === 'cn-mainland' && s.riskLevel === 'low'
    ));
  });

  test('组合过滤: 搜索 + 过滤链', () => {
    const result = fullFilterChain(MOCK_STORES, '朝阳', 'ALL', 'ALL', 'ALL');
    assert.equal(result.length, 1);
    assert.equal(result[0]!.name, '朝阳大悦城旗舰店');

    // 搜索 + active + cn-mainland
    const result2 = fullFilterChain(MOCK_STORES, '上海', 'active', 'cn-mainland', 'ALL');
    assert.equal(result2.length, 1);
    assert.equal(result2[0]!.name, '上海陆家嘴中心店');
  });
});

// ═══════════════════════════════════════════════════════════
// 排序
// ═══════════════════════════════════════════════════════════

describe('stores page — 排序', () => {
  test('按 tenantCount 升序', () => {
    const sorted = sortItems(MOCK_STORES, 'tenantCount', 'asc');
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i]!.tenantCount >= sorted[i - 1]!.tenantCount);
    }
  });

  test('按 tenantCount 降序', () => {
    const sorted = sortItems(MOCK_STORES, 'tenantCount', 'desc');
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i]!.tenantCount <= sorted[i - 1]!.tenantCount);
    }
  });

  test('按 name 升序（中文排序）', () => {
    const sorted = sortItems(MOCK_STORES, 'name', 'asc');
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(
        sorted[i]!.name.localeCompare(sorted[i - 1]!.name) >= 0,
        `${sorted[i]!.name} should be after ${sorted[i - 1]!.name}`
      );
    }
  });

  test('按 code 降序', () => {
    const sorted = sortItems(MOCK_STORES, 'code', 'desc');
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i]!.code <= sorted[i - 1]!.code);
    }
  });
});

// ═══════════════════════════════════════════════════════════
// 分页
// ═══════════════════════════════════════════════════════════

describe('stores page — 分页', () => {
  test('首页 pageSize=5 返回 5 条', () => {
    const page = paginate(MOCK_STORES, 1, 5);
    assert.equal(page.length, 5);
  });

  test('第 2 页 pageSize=5 返回不同的记录', () => {
    const page1 = paginate(MOCK_STORES, 1, 5);
    const page2 = paginate(MOCK_STORES, 2, 5);
    assert.equal(page2.length, 5);
    for (const item of page2) {
      assert.ok(!page1.some((p) => p.id === item.id));
    }
  });

  test('最后一页返回剩余记录', () => {
    const pages = totalPages(MOCK_STORES.length, 5);
    const lastPage = paginate(MOCK_STORES, pages, 5);
    assert.ok(lastPage.length > 0);
    assert.ok(lastPage.length <= 5);
  });

  test('totalPages 计算正确', () => {
    assert.equal(totalPages(15, 5), 3);
    assert.equal(totalPages(15, 10), 2);
    assert.equal(totalPages(15, 15), 1);
    assert.equal(totalPages(0, 5), 1);
    assert.equal(totalPages(1, 10), 1);
  });

  test('pageSize=0 时防御性处理', () => {
    // pageSize=0 would produce Infinity from Math.ceil, but actual pagination
    // always uses minimum pageSize of 5 (from preset pageSizeOptions)
    const result = totalPages(15, 0);
    assert.ok(!Number.isNaN(result), 'should not be NaN');
  });

  test('分页后过滤结果正确', () => {
    const filtered = fullFilterChain(MOCK_STORES, '', 'active', 'ALL', 'ALL');
    const page1 = paginate(filtered, 1, 5);
    assert.ok(page1.length > 0);
    assert.ok(page1.every((s) => s.status === 'active'));
  });
});

// ═══════════════════════════════════════════════════════════
// 统计计算
// ═══════════════════════════════════════════════════════════

describe('stores page — 统计', () => {
  test('computeStoreStats 总和正确', () => {
    const stats = computeStoreStats(MOCK_STORES);
    assert.equal(stats.total, 15);
    const sumStatuses = stats.active + stats.inactive + stats.pending + stats.suspended;
    assert.equal(sumStatuses, stats.total);
  });

  test('computeStoreStats 运营中门店 > 50%', () => {
    const stats = computeStoreStats(MOCK_STORES);
    assert.ok(stats.active >= 8, `active ${stats.active} too low`);
  });

  test('computeStoreStats 高风险 >= 2', () => {
    const stats = computeStoreStats(MOCK_STORES);
    assert.ok(stats.highRisk >= 2);
  });

  test('computeStoreMarketDistribution 返回 3 个市场', () => {
    const dist = computeStoreMarketDistribution(MOCK_STORES);
    const keys = Object.keys(dist);
    assert.equal(keys.length, 3);
    assert.ok(keys.includes('cn-mainland'));
    assert.ok(keys.includes('us-default'));
    assert.ok(keys.includes('uk-default'));
  });

  test('computeStoreMarketDistribution cn-mainland 最多', () => {
    const dist = computeStoreMarketDistribution(MOCK_STORES);
    const cn = dist['cn-mainland'] ?? 0;
    const us = dist['us-default'] ?? 0;
    const uk = dist['uk-default'] ?? 0;
    assert.ok(cn > us);
    assert.ok(us > uk);
  });
});

// ═══════════════════════════════════════════════════════════
// 状态映射 & 风险映射
// ═══════════════════════════════════════════════════════════

describe('stores page — 状态映射', () => {
  test('STORE_STATUS_MAP 覆盖所有状态', () => {
    for (const s of STORE_STATUSES) {
      assert.ok(STORE_STATUS_MAP[s], `missing status: ${s}`);
      assert.ok(STORE_STATUS_MAP[s].label.length > 0, `status ${s} has empty label`);
    }
  });

  test('STORE_STATUS_MAP 映射标签正确', () => {
    assert.equal(STORE_STATUS_MAP.active.label, '运营中');
    assert.equal(STORE_STATUS_MAP.inactive.label, '已停用');
    assert.equal(STORE_STATUS_MAP.pending.label, '待激活');
    assert.equal(STORE_STATUS_MAP.suspended.label, '已暂停');
  });

  test('STORE_STATUS_MAP variant 映射正确', () => {
    assert.equal(STORE_STATUS_MAP.active.variant, 'success');
    assert.equal(STORE_STATUS_MAP.suspended.variant, 'danger');
    assert.equal(STORE_STATUS_MAP.pending.variant, 'warning');
    assert.equal(STORE_STATUS_MAP.inactive.variant, 'neutral');
  });

  test('STORE_RISK_LEVEL_MAP 覆盖所有风险等级', () => {
    for (const r of STORE_RISK_LEVELS) {
      assert.ok(STORE_RISK_LEVEL_MAP[r], `missing risk: ${r}`);
      assert.ok(STORE_RISK_LEVEL_MAP[r].label.length > 0, `risk ${r} has empty label`);
    }
  });

  test('STORE_RISK_LEVEL_MAP 映射标签正确', () => {
    assert.equal(STORE_RISK_LEVEL_MAP.low.label, '低');
    assert.equal(STORE_RISK_LEVEL_MAP.medium.label, '中');
    assert.equal(STORE_RISK_LEVEL_MAP.high.label, '高');
  });
});

// ═══════════════════════════════════════════════════════════
// 路由预设
// ═══════════════════════════════════════════════════════════

describe('stores page — 路由', () => {
  test('adminStoreRoute 定义正确', () => {
    assert.equal(adminStoreRoute.href, '/stores');
    assert.equal(adminStoreRoute.title, '门店管理中心');
    assert.ok(adminStoreRoute.description.length > 0);
  });
});

// ═══════════════════════════════════════════════════════════
// 详情数据一致性
// ═══════════════════════════════════════════════════════════

describe('stores page — 详情一致性', () => {
  test('MOCK_STORE_DETAILS ids 是 MOCK_STORES 的子集', () => {
    const listIds = new Set(MOCK_STORES.map((s) => s.id));
    for (const id of Object.keys(MOCK_STORE_DETAILS)) {
      assert.ok(listIds.has(id), `detail id ${id} not in MOCK_STORES`);
    }
  });

  test('详情字段与列表字段一致', () => {
    for (const [id, detail] of Object.entries(MOCK_STORE_DETAILS)) {
      const listItem = MOCK_STORES.find((s) => s.id === id);
      assert.ok(listItem, `no list item for detail ${id}`);
      assert.equal(detail.code, listItem!.code);
      assert.equal(detail.name, listItem!.name);
      assert.equal(detail.status, listItem!.status);
      assert.equal(detail.riskLevel, listItem!.riskLevel);
      assert.equal(detail.marketCode, listItem!.marketCode);
    }
  });

  test('详情扩展字段完整', () => {
    for (const [id, detail] of Object.entries(MOCK_STORE_DETAILS)) {
      assert.ok(detail.address, `${id}: missing address`);
      assert.ok(detail.city, `${id}: missing city`);
      assert.ok(detail.phone, `${id}: missing phone`);
      assert.ok(detail.email, `${id}: missing email`);
      assert.ok(detail.managerName, `${id}: missing managerName`);
      assert.ok(detail.managerPhone, `${id}: missing managerPhone`);
      assert.ok(detail.floorCount > 0, `${id}: invalid floorCount`);
      assert.ok(detail.totalArea > 0, `${id}: invalid totalArea`);
      assert.ok(detail.tenantNames.length > 0, `${id}: no tenantNames`);
      assert.ok(detail.brandNames.length > 0, `${id}: no brandNames`);
      assert.ok(detail.deviceCount > 0, `${id}: no devices`);
      assert.ok(detail.deviceOnlineRate >= 0 && detail.deviceOnlineRate <= 1, `${id}: invalid onlineRate`);
    }
  });

  test('suspended 门店有合理原因', () => {
    const s5 = MOCK_STORE_DETAILS['s5'];
    assert.ok(s5);
    assert.equal(s5.status, 'suspended');
    assert.ok(s5.notes.includes('暂停') || s5.notes.includes('整改'));
    assert.ok(s5.deviceOnlineRate < 0.8);
  });
});

// ═══════════════════════════════════════════════════════════
// 边界场景
// ═══════════════════════════════════════════════════════════

describe('stores page — 边界场景', () => {
  test('空数组过滤', () => {
    assert.equal(filterBySearch([], 'anything').length, 0);
    assert.equal(filterByStatus([], 'active').length, 0);
    assert.equal(fullFilterChain([], '', 'ALL', 'ALL', 'ALL').length, 0);
  });

  test('空数组排序不抛异常', () => {
    const sorted = sortItems([], 'name', 'asc');
    assert.equal(sorted.length, 0);
  });

  test('空数组分页返回空', () => {
    const page = paginate([] as StoreItem[], 1, 10);
    assert.equal(page.length, 0);
  });

  test('单条数据各种操作', () => {
    const single = [MOCK_STORES[0]!];
    assert.equal(filterBySearch(single, 'STORE-001').length, 1);
    assert.equal(filterBySearch(single, '不存在').length, 0);
    assert.equal(paginate(single, 1, 10).length, 1);
    assert.equal(paginate(single, 999, 10).length, 0);
  });

  test('页码越界不抛异常', () => {
    const p = paginate(MOCK_STORES, 999, 10);
    assert.equal(p.length, 0);
  });
});
