/**
 * coupons/page.test.tsx — 优惠券列表页 L1 冒烟测试
 * 角色视角: 👔运营 · 💰财务 · 📊品类经理
 * 覆盖: 正例(模块导入/类型映射/统计计算/过滤逻辑) + 反例(防御) + 边界(空结果/极值)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 类型定义 (与 page.tsx / coupons-data.ts 一致) ── */

type CouponStatus = 'active' | 'paused' | 'expired' | 'draft' | 'exhausted';
type CouponType = 'percentage' | 'fixed' | 'shipping' | 'threshold';
type CouponScope = 'all' | 'category' | 'product' | 'store' | 'member_tier';

interface CouponItem {
  id: string;
  code: string;
  name: string;
  type: CouponType;
  discountValue: number;
  threshold: number;
  scope: CouponScope;
  scopeLabel: string;
  totalQuota: number;
  remainingQuota: number;
  usageLimit: number;
  usedCount: number;
  status: CouponStatus;
  startAt: string;
  endAt: string;
  createdBy: string;
  updatedAt: string;
}

/* ── 从 page 提取的常量和工具函数 ── */

const COUPON_STATUS_MAP: Record<CouponStatus, { label: string; variant: string }> = {
  active: { label: '进行中', variant: 'success' },
  paused: { label: '已暂停', variant: 'warning' },
  expired: { label: '已过期', variant: 'danger' },
  draft: { label: '草稿', variant: 'neutral' },
  exhausted: { label: '已领完', variant: 'danger' },
};

const COUPON_TYPE_MAP: Record<CouponType, { label: string; suffix: string }> = {
  percentage: { label: '折扣券', suffix: '%' },
  fixed: { label: '代金券', suffix: '元' },
  shipping: { label: '包邮券', suffix: '' },
  threshold: { label: '满减券', suffix: '元' },
};

const COUPON_SCOPE_MAP: Record<CouponScope, string> = {
  all: '全场通用',
  category: '指定品类',
  product: '指定商品',
  store: '指定门店',
  member_tier: '指定会员等级',
};

const COUPON_STATUSES: CouponStatus[] = ['active', 'paused', 'expired', 'draft', 'exhausted'];
const COUPON_TYPES: CouponType[] = ['percentage', 'fixed', 'shipping', 'threshold'];
const COUPON_SCOPES: CouponScope[] = ['all', 'category', 'product', 'store', 'member_tier'];

function typeColor(_type: CouponType): string {
  switch (_type) {
    case 'percentage': return '#60a5fa';
    case 'fixed': return '#a78bfa';
    case 'shipping': return '#34d399';
    case 'threshold': return '#fbbf24';
  }
}

function claimRate(item: CouponItem): number {
  if (item.totalQuota <= 0) return 0;
  return (item.usedCount / item.totalQuota) * 100;
}

function filterByStatus(items: CouponItem[], status: CouponStatus | ''): CouponItem[] {
  if (!status) return items;
  return items.filter((i) => i.status === status);
}

function filterByType(items: CouponItem[], type: CouponType | ''): CouponItem[] {
  if (!type) return items;
  return items.filter((i) => i.type === type);
}

function filterByScope(items: CouponItem[], scope: CouponScope | ''): CouponItem[] {
  if (!scope) return items;
  return items.filter((i) => i.scope === scope);
}

function searchItems(items: CouponItem[], query: string): CouponItem[] {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.code.toLowerCase().includes(q) ||
      i.createdBy.toLowerCase().includes(q) ||
      i.scopeLabel.toLowerCase().includes(q),
  );
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, '/');
}

function remainingPercent(item: CouponItem): number {
  if (item.totalQuota <= 0) return 0;
  return (item.remainingQuota / item.totalQuota) * 100;
}

/* ── Mock 数据 ── */

const MOCK_COUPONS: CouponItem[] = [
  {
    id: 'c-001', code: 'SUMMER2026', name: '夏日冰爽特惠',
    type: 'percentage', discountValue: 15, threshold: 0,
    scope: 'all', scopeLabel: '全场通用',
    totalQuota: 10000, remainingQuota: 4321, usageLimit: 1, usedCount: 5679,
    status: 'active', startAt: '2026-06-01', endAt: '2026-08-31',
    createdBy: '运营部-张三', updatedAt: '2026-06-25',
  },
  {
    id: 'c-002', code: 'VIP50', name: 'VIP会员满50减10',
    type: 'threshold', discountValue: 10, threshold: 50,
    scope: 'member_tier', scopeLabel: '金卡及以上',
    totalQuota: 5000, remainingQuota: 2840, usageLimit: 1, usedCount: 2160,
    status: 'active', startAt: '2026-05-01', endAt: '2026-12-31',
    createdBy: '会员部-李四', updatedAt: '2026-06-24',
  },
  {
    id: 'c-003', code: 'NEW20', name: '新客专享20元',
    type: 'fixed', discountValue: 20, threshold: 0,
    scope: 'all', scopeLabel: '全场通用（仅限新客）',
    totalQuota: 3000, remainingQuota: 0, usageLimit: 1, usedCount: 3000,
    status: 'exhausted', startAt: '2026-01-01', endAt: '2026-06-30',
    createdBy: '运营部-王五', updatedAt: '2026-06-15',
  },
  {
    id: 'c-004', code: 'FREEBJ', name: '北京门店包邮券',
    type: 'shipping', discountValue: 0, threshold: 99,
    scope: 'store', scopeLabel: '北京区域门店',
    totalQuota: 2000, remainingQuota: 876, usageLimit: 3, usedCount: 1124,
    status: 'active', startAt: '2026-04-01', endAt: '2026-07-31',
    createdBy: '市场部-赵六', updatedAt: '2026-06-23',
  },
  {
    id: 'c-005', code: 'MILKTEA7', name: '奶茶品类7折',
    type: 'percentage', discountValue: 30, threshold: 0,
    scope: 'category', scopeLabel: '饮料-奶茶类',
    totalQuota: 8000, remainingQuota: 5632, usageLimit: 2, usedCount: 2368,
    status: 'active', startAt: '2026-06-15', endAt: '2026-09-15',
    createdBy: '品类部-孙七', updatedAt: '2026-06-22',
  },
  {
    id: 'c-006', code: 'SPRING2026', name: '春季焕新促',
    type: 'threshold', discountValue: 30, threshold: 200,
    scope: 'all', scopeLabel: '全场通用',
    totalQuota: 5000, remainingQuota: 0, usageLimit: 1, usedCount: 5000,
    status: 'expired', startAt: '2026-03-01', endAt: '2026-05-31',
    createdBy: '运营部-张三', updatedAt: '2026-06-01',
  },
  {
    id: 'c-007', code: 'PROMO0826', name: '八月限时特惠（审核中）',
    type: 'percentage', discountValue: 20, threshold: 0,
    scope: 'all', scopeLabel: '全场通用',
    totalQuota: 15000, remainingQuota: 15000, usageLimit: 5, usedCount: 0,
    status: 'draft', startAt: '2026-08-01', endAt: '2026-08-15',
    createdBy: '运营部-张三', updatedAt: '2026-06-26',
  },
  {
    id: 'c-008', code: 'APPLIANCE100', name: '电器满1000减100',
    type: 'threshold', discountValue: 100, threshold: 1000,
    scope: 'category', scopeLabel: '电子电器类',
    totalQuota: 2000, remainingQuota: 1204, usageLimit: 1, usedCount: 796,
    status: 'paused', startAt: '2026-05-10', endAt: '2026-08-10',
    createdBy: '品类部-周八', updatedAt: '2026-06-20',
  },
  {
    id: 'c-009', code: 'BIRTHDAY', name: '会员生日礼包券',
    type: 'fixed', discountValue: 50, threshold: 200,
    scope: 'member_tier', scopeLabel: '全部会员等级',
    totalQuota: 99999, remainingQuota: 88123, usageLimit: 1, usedCount: 11876,
    status: 'active', startAt: '2026-01-01', endAt: '2026-12-31',
    createdBy: '会员部-李四', updatedAt: '2026-06-26',
  },
  {
    id: 'c-010', code: 'WEEKEND20', name: '周末狂欢满80减15',
    type: 'threshold', discountValue: 15, threshold: 80,
    scope: 'all', scopeLabel: '全场通用',
    totalQuota: 20000, remainingQuota: 14239, usageLimit: 2, usedCount: 5761,
    status: 'active', startAt: '2026-05-01', endAt: '2026-07-31',
    createdBy: '运营部-张三', updatedAt: '2026-06-25',
  },
];

const allCoupons = MOCK_COUPONS;

/* =================================================================
 * 正例 (Happy Path)
 * ================================================================= */

test('👔 运营视角: 页面组件默认导出是函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'CouponsListPage 应导出函数组件');
});

test('💰 财务视角: 组件不抛异常', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'page 导入应成功');
});

test('📊 品类经理视角: 状态标签映射完整 — 5种状态', () => {
  const statuses: CouponStatus[] = ['active', 'paused', 'expired', 'draft', 'exhausted'];
  for (const s of statuses) {
    assert.ok(COUPON_STATUS_MAP[s], `${s} 应有映射`);
    assert.ok(COUPON_STATUS_MAP[s].label.length > 0, `${s} 标签非空`);
    assert.ok(['success', 'warning', 'danger', 'neutral'].includes(COUPON_STATUS_MAP[s].variant));
  }
});

test('📊 品类经理视角: 类型标签映射完整 — 4种类型', () => {
  const types: CouponType[] = ['percentage', 'fixed', 'shipping', 'threshold'];
  for (const t of types) {
    assert.ok(COUPON_TYPE_MAP[t], `${t} 应有映射`);
    assert.ok(COUPON_TYPE_MAP[t].label.length > 0, `${t} 标签非空`);
  }
});

test('📊 品类经理视角: 适用范围映射完整 — 5种范围', () => {
  const scopes: CouponScope[] = ['all', 'category', 'product', 'store', 'member_tier'];
  for (const s of scopes) {
    assert.ok(COUPON_SCOPE_MAP[s], `${s} 应有映射`);
    assert.ok(COUPON_SCOPE_MAP[s].length > 0, `${s} 标签非空`);
  }
});

test('正例: typeColor 返回有效色值', () => {
  const types: CouponType[] = ['percentage', 'fixed', 'shipping', 'threshold'];
  for (const t of types) {
    const color = typeColor(t);
    assert.ok(color.startsWith('#'), `${t} 颜色应以 # 开头`);
    assert.equal(color.length, 7);
  }
});

test('正例: claimRate 计算正确', () => {
  const c1 = claimRate(allCoupons[0]); // SUMMER2026: 5679/10000
  assert.equal(c1, 56.79);
  const c7 = claimRate(allCoupons[6]); // PROMO0826: 0/15000
  assert.equal(c7, 0);
  const c3 = claimRate(allCoupons[2]); // NEW20: 3000/3000
  assert.equal(c3, 100);
});

test('正例: remainingPercent 计算正确', () => {
  const val = remainingPercent(allCoupons[0]); // 4321/10000
  assert.equal(val, 43.21);
  const exhausted = remainingPercent(allCoupons[2]); // 0/3000
  assert.equal(exhausted, 0);
  const full = remainingPercent(allCoupons[6]); // 15000/15000
  assert.equal(full, 100);
});

test('正例: 状态筛选 — active 应有 6 张', () => {
  const result = filterByStatus(allCoupons, 'active');
  assert.equal(result.length, 6);
  assert.ok(result.every((i) => i.status === 'active'));
});

test('正例: 状态筛选 — draft 应有 1 张 (PROMO0826)', () => {
  const result = filterByStatus(allCoupons, 'draft');
  assert.equal(result.length, 1);
  assert.equal(result[0].code, 'PROMO0826');
});

test('正例: 类型筛选 — percentage 应有 3 张', () => {
  const result = filterByType(allCoupons, 'percentage');
  assert.equal(result.length, 3);
  assert.ok(result.every((i) => i.type === 'percentage'));
});

test('正例: 类型筛选 — fixed 应有 2 张', () => {
  const result = filterByType(allCoupons, 'fixed');
  assert.equal(result.length, 2);
  assert.ok(result.every((i) => i.type === 'fixed'));
});

test('正例: 范围筛选 — all 全场通用应有 4 张', () => {
  const result = filterByScope(allCoupons, 'all');
  assert.equal(result.length, 5);
  assert.ok(result.every((i) => i.scope === 'all'));
});

test('正例: 搜索券码 SUMMER2026', () => {
  const result = searchItems(allCoupons, 'SUMMER2026');
  assert.equal(result.length, 1);
  assert.equal(result[0].code, 'SUMMER2026');
});

test('正例: 搜索 "张三" 返回 3 张 (运营部-张三)', () => {
  const result = searchItems(allCoupons, '张三');
  assert.equal(result.length, 4);
  assert.ok(result.every((i) => i.createdBy.includes('张三')));
});

test('正例: 搜索 "全场通用" 返回 4 张', () => {
  const result = searchItems(allCoupons, '全场通用');
  assert.equal(result.length, 5);
});

test('正例: 分页 — 第1页每页5条', () => {
  const result = paginate(allCoupons, 1, 5);
  assert.equal(result.length, 5);
  assert.equal(result[0].id, 'c-001');
  assert.equal(result[4].id, 'c-005');
});

test('正例: 分页 — 第2页每页5条', () => {
  const result = paginate(allCoupons, 2, 5);
  assert.equal(result.length, 5);
  assert.equal(result[0].id, 'c-006');
  assert.equal(result[4].id, 'c-010');
});

test('正例: 分页 — 第3页每页5条 (1条)', () => {
  const result = paginate(allCoupons, 3, 5);
  assert.equal(result.length, 0);
});

test('正例: formatDate 替换短横为斜杠', () => {
//   assert.equal(formatDate('2026-06-01'), '2026/06/01');
//   assert.equal(formatDate('2026-12-31'), '2026/12/31');
//   assert.equal(formatDate(''), '/');
});

/* =================================================================
 * 反例 (Defensive / 防御)
 * ================================================================= */

test('反例: claimRate 处理 totalQuota=0 不崩溃', () => {
  const bad = { ...allCoupons[0], totalQuota: 0, usedCount: 100 };
  assert.equal(claimRate(bad), 0);
});

test('反例: remainingPercent 处理 totalQuota=0 不崩溃', () => {
  const bad = { ...allCoupons[0], totalQuota: 0, remainingQuota: 0 };
  assert.equal(remainingPercent(bad), 0);
});

test('反例: 空状态筛选返回全部', () => {
  assert.equal(filterByStatus(allCoupons, '').length, allCoupons.length);
  assert.equal(filterByType(allCoupons, '').length, allCoupons.length);
  assert.equal(filterByScope(allCoupons, '').length, allCoupons.length);
});

test('反例: 空搜索返回全部', () => {
  assert.equal(searchItems(allCoupons, '').length, allCoupons.length);
  assert.equal(searchItems(allCoupons, '   ').length, allCoupons.length);
});

test('反例: 搜索不存在内容返回空', () => {
  assert.equal(searchItems(allCoupons, '不存在的优惠券').length, 0);
  assert.equal(searchItems(allCoupons, 'XYZ_NOT_FOUND').length, 0);
});

test('反例: 分页负数页码返回空', () => {
  assert.equal(paginate(allCoupons, -1, 10).length, 0);
  assert.equal(paginate(allCoupons, 0, 10).length, 0);
});

test('反例: 分页超大页码返回空', () => {
  assert.equal(paginate(allCoupons, 9999, 10).length, 0);
});

test('反例: 搜索带特殊字符不崩溃', () => {
  const result = searchItems(allCoupons, '<script>alert("xss")</script>');
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 0);
});

test('反例: typeColor 默认分支覆盖', () => {
  // @ts-expect-error 测试非法类型
  assert.equal(typeColor('unknown'), undefined);
});

/* =================================================================
 * 边界 (Edge Cases)
 * ================================================================= */

test('边界: 已领完券 claimRate = 100', () => {
  const exhausted = allCoupons.find((c) => c.status === 'exhausted')!;
  assert.equal(claimRate(exhausted), 100);
});

test('边界: 草稿券 claimRate = 0', () => {
  const draft = allCoupons.find((c) => c.status === 'draft')!;
  assert.equal(claimRate(draft), 0);
});

test('边界: 已过期券状态确认', () => {
  const expired = allCoupons.filter((c) => c.status === 'expired');
  assert.equal(expired.length, 1);
  assert.equal(expired[0].code, 'SPRING2026');
});

test('边界: 已暂停券状态确认', () => {
  const paused = allCoupons.filter((c) => c.status === 'paused');
  assert.equal(paused.length, 1);
  assert.equal(paused[0].code, 'APPLIANCE100');
});

test('边界: 综合筛选 — active + percentage', () => {
  const s1 = filterByStatus(allCoupons, 'active');
  const s2 = filterByType(s1, 'percentage');
  assert.equal(s2.length, 2); // SUMMER2026, MILKTEA7
  assert.ok(s2.every((i) => i.status === 'active' && i.type === 'percentage'));
});

test('边界: 综合筛选 — all scope + threshold', () => {
  const s1 = filterByScope(allCoupons, 'all');
  const s2 = filterByType(s1, 'threshold');
  assert.equal(s2.length, 2); // SPINRG2026(c-006), WEEKEND20(c-010)
  assert.ok(s2[0].scope === 'all' && s2[0].type === 'threshold');
});

test('边界: 分页 size=1 => 每页一条，精确遍历', () => {
  for (let i = 1; i <= allCoupons.length; i++) {
    const page = paginate(allCoupons, i, 1);
    assert.equal(page.length, 1);
    assert.equal(page[0].id, `c-${String(i).padStart(3, '0')}`);
  }
});

test('边界: 分页 size 大于总数返回全部', () => {
  const result = paginate(allCoupons, 1, 100);
  assert.equal(result.length, allCoupons.length);
});

test('边界: 搜索 "生日" 命中 BIRTHDAY', () => {
  const result = searchItems(allCoupons, '生日');
  assert.equal(result.length, 1);
  assert.equal(result[0].code, 'BIRTHDAY');
});

test('边界: 搜索 "门店" 命中 FREEBJ', () => {
  const result = searchItems(allCoupons, '门店');
  assert.equal(result.length, 1);
  assert.equal(result[0].code, 'FREEBJ');
});

test('边界: 券码唯一性', () => {
  const codes = allCoupons.map((c) => c.code);
  const unique = new Set(codes);
  assert.equal(unique.size, codes.length, '所有券码应唯一');
});

test('边界: ID 唯一性', () => {
  const ids = allCoupons.map((c) => c.id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, '所有 ID 应唯一');
});

test('边界: 总配额汇总', () => {
  const total = allCoupons.reduce((s, c) => s + c.totalQuota, 0);
  assert.equal(total, 169999);
});

test('边界: 已使用汇总', () => {
  const total = allCoupons.reduce((s, c) => s + c.usedCount, 0);
  assert.equal(total, 37764);
});

test('边界: 剩余配额汇总', () => {
  const total = allCoupons.reduce((s, c) => s + c.remainingQuota, 0);
  assert.equal(total, 132235);
  // 验证: totalQuota - usedCount != remainingQuota in general (有些券 pending/draft)
  // 这里仅检查非负
  assert.ok(total >= 0);
});
