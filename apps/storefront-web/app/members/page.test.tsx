/**
 * members/page.test.tsx — 会员列表页 L1 冒烟测试
 * 角色视角: 👔店长 · 🛒前台 · 💳会员运营
 * 覆盖: 正例(组件导出/统计计算/过滤逻辑) + 反例(防御) + 边界(空结果)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 会员数据工厂 ── */

type MembershipTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic';
type MemberStatus = 'active' | 'inactive' | 'frozen';

interface Member {
  id: string;
  name: string;
  phone: string;
  tier: MembershipTier;
  points: number;
  storeName: string;
  totalVisits: number;
  lastVisit: string;
  status: MemberStatus;
  joinedAt: string;
}

function makeMember(overrides?: Partial<Member>): Member {
  return {
    id: `m-${Date.now()}`,
    name: '测试会员',
    phone: '138****1234',
    tier: 'silver',
    points: 5000,
    storeName: 'Demo Store 旗舰店',
    totalVisits: 42,
    lastVisit: '2026-06-20',
    status: 'active',
    joinedAt: '2025-06-10',
    ...overrides,
  };
}

/* ── 数据工具函数 (从 page 提取的逻辑) ── */

const TIER_LABELS: Record<MembershipTier, string> = {
  diamond: '钻石会员',
  gold: '黄金会员',
  silver: '银卡会员',
  bronze: '铜卡会员',
  basic: '普通会员',
};

const STATUS_LABELS: Record<MemberStatus, string> = {
  active: '活跃',
  inactive: '非活跃',
  frozen: '冻结',
};

function computeStats(members: Member[]) {
  const active = members.filter((m) => m.status === 'active').length;
  const diamond = members.filter((m) => m.tier === 'diamond').length;
  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
  return {
    total: members.length,
    active,
    diamond,
    avgPoints: members.length > 0 ? Math.round(totalPoints / members.length) : 0,
  };
}

function filterByTier(members: Member[], tier: MembershipTier | 'ALL'): Member[] {
  return tier === 'ALL' ? members : members.filter((m) => m.tier === tier);
}

function filterByStatus(members: Member[], status: MemberStatus | 'ALL'): Member[] {
  return status === 'ALL' ? members : members.filter((m) => m.status === status);
}

function searchMembers(members: Member[], term: string): Member[] {
  if (!term.trim()) return members;
  const lower = term.toLowerCase();
  return members.filter(
    (m) =>
      m.name.toLowerCase().includes(lower) ||
      m.phone.includes(term) ||
      m.tier.toLowerCase().includes(lower) ||
      m.storeName.toLowerCase().includes(lower),
  );
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

/* ── 测试数据 ── */

const MOCK_MEMBERS: Member[] = [
  makeMember({ id: 'm1', name: '张伟', tier: 'diamond', points: 28500, status: 'active', storeName: 'Demo Store 旗舰店' }),
  makeMember({ id: 'm2', name: '李娜', tier: 'gold', points: 12400, status: 'active', storeName: 'Demo Store 旗舰店' }),
  makeMember({ id: 'm3', name: '王芳', tier: 'silver', points: 5600, status: 'active', storeName: 'Demo Store 社区店' }),
  makeMember({ id: 'm4', name: '赵强', tier: 'gold', points: 9800, status: 'active', storeName: 'Demo Store 旗舰店' }),
  makeMember({ id: 'm5', name: '孙丽', tier: 'bronze', points: 2100, status: 'inactive', storeName: 'Demo Store 社区店' }),
  makeMember({ id: 'm6', name: '周杰', tier: 'diamond', points: 32000, status: 'active', storeName: 'Demo Store 旗舰店' }),
];

/* =================================================================
 * 正例 (Happy Path)
 * ================================================================= */

test('👔 店长视角: 页面组件默认导出是函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'MembersListPage 应导出函数组件');
});

test('🛒 前台视角: 组件不抛异常', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'page 导入应成功');
});

test('💳 会员运营视角: 统计功能正确计算各维度', () => {
  const stats = computeStats(MOCK_MEMBERS);
  assert.equal(stats.total, 6, '总会员数应为 6');
  assert.equal(stats.active, 5, '活跃会员数应为 5');
  assert.equal(stats.diamond, 2, '钻石会员数应为 2');
  assert.equal(stats.avgPoints, 15067, '平均积分应为 15067');
});

test('正例: 等级过滤 — 筛选钻石会员', () => {
  const result = filterByTier(MOCK_MEMBERS, 'diamond');
  assert.equal(result.length, 2);
  assert.ok(result.every((m) => m.tier === 'diamond'));
});

test('正例: 等级过滤 — 筛选金卡会员', () => {
  const result = filterByTier(MOCK_MEMBERS, 'gold');
  assert.equal(result.length, 2);
  assert.ok(result.every((m) => m.tier === 'gold'));
});

test('正例: 状态过滤 — 筛选活跃会员', () => {
  const result = filterByStatus(MOCK_MEMBERS, 'active');
  assert.equal(result.length, 5);
  assert.ok(result.every((m) => m.status === 'active'));
});

test('正例: 搜索 — 按姓名搜索命中', () => {
  const result = searchMembers(MOCK_MEMBERS, '张伟');
  assert.equal(result.length, 1);
  assert.equal(result[0].name, '张伟');
});

test('正例: 搜索 — 按门店搜索命中', () => {
  const result = searchMembers(MOCK_MEMBERS, '社区店');
  assert.equal(result.length, 2);
  assert.ok(result.every((m) => m.storeName.includes('社区店')));
});

test('正例: 分页 — 第一页返回预期数量', () => {
  const page1 = paginate(MOCK_MEMBERS, 1, 4);
  assert.equal(page1.length, 4);
  assert.equal(page1[0].id, 'm1');
});

test('正例: 分页 — 第二页返回剩余数据', () => {
  const page2 = paginate(MOCK_MEMBERS, 2, 4);
  assert.equal(page2.length, 2);
  assert.equal(page2[0].id, 'm5');
});

test('正例: 等级标签映射完整性', () => {
  const tiers: MembershipTier[] = ['diamond', 'gold', 'silver', 'bronze', 'basic'];
  for (const tier of tiers) {
    assert.ok(TIER_LABELS[tier].length > 0, `${tier} 应有中文标签`);
    assert.ok(TIER_LABELS[tier].endsWith('会员'), `${tier} 标签应以"会员"结尾`);
  }
});

test('正例: 状态标签映射完整性', () => {
  const statuses: MemberStatus[] = ['active', 'inactive', 'frozen'];
  for (const s of statuses) {
    assert.ok(STATUS_LABELS[s].length > 0, `${s} 应有中文标签`);
  }
});

/* =================================================================
 * 反例 (Defensive / 防御)
 * ================================================================= */

test('反例: 搜索空字符串返回全部', () => {
  const result = searchMembers(MOCK_MEMBERS, '');
  assert.equal(result.length, MOCK_MEMBERS.length);
});

test('反例: 搜索无匹配返回空数组', () => {
  const result = searchMembers(MOCK_MEMBERS, '不存在的会员名xyz');
  assert.equal(result.length, 0);
});

test('反例: 不存在的等级过滤返回空', () => {
  // @ts-expect-error 测试传递非法等级
  const result = filterByTier(MOCK_MEMBERS, 'platinum');
  assert.equal(result.length, 0);
});

test('反例: 不存在的状态过滤返回空', () => {
  // @ts-expect-error 测试传递非法状态
  const result = filterByStatus(MOCK_MEMBERS, 'deleted');
  assert.equal(result.length, 0);
});

test('反例: 统计空列表不崩溃', () => {
  const stats = computeStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.active, 0);
  assert.equal(stats.diamond, 0);
  assert.equal(stats.avgPoints, 0);
});

test('反例: 分页超出范围返回空数组', () => {
  const result = paginate(MOCK_MEMBERS, 999, 10);
  assert.equal(result.length, 0);
});

test('反例: 分页从负数页码不崩溃', () => {
  const result = paginate(MOCK_MEMBERS, -1, 10);
  assert.equal(result.length, 0);
});

test('反例: 搜索特殊字符不崩溃', () => {
  const result = searchMembers(MOCK_MEMBERS, '<script>alert("xss")</script>');
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 0);
});

/* =================================================================
 * 边界 (Edge Cases)
 * ================================================================= */

test('边界: 全量过滤 = 不过滤，返回全部', () => {
  const tierAll = filterByTier(MOCK_MEMBERS, 'ALL');
  assert.equal(tierAll.length, MOCK_MEMBERS.length);
  const statusAll = filterByStatus(MOCK_MEMBERS, 'ALL');
  assert.equal(statusAll.length, MOCK_MEMBERS.length);
});

test('边界: 搜索单个字符也能命中', () => {
  const result = searchMembers(MOCK_MEMBERS, '张');
  assert.equal(result.length, 1);
  assert.equal(result[0].name, '张伟');
});

test('边界: 大小写不影响搜索', () => {
  const result = searchMembers(MOCK_MEMBERS, 'diamond');
  assert.equal(result.length, 2);
});

test('边界: 高积分会员统计', () => {
  const highPoints = MOCK_MEMBERS.filter((m) => m.points >= 10000);
  const stats = computeStats(highPoints);
  assert.equal(stats.total, 3);
  assert.equal(stats.diamond, 2);
  assert.equal(stats.avgPoints, 24300);
});

test('边界: 分页 size=1 时每页一条', () => {
  for (let i = 1; i <= MOCK_MEMBERS.length; i++) {
    const page = paginate(MOCK_MEMBERS, i, 1);
    assert.equal(page.length, 1);
    assert.equal(page[0].id, `m${i}`);
  }
});

test('边界: 搜索同一门店的精确匹配', () => {
  const result = searchMembers(MOCK_MEMBERS, 'Demo Store 旗舰店');
  assert.equal(result.length, 4);
});

test('边界: 非活跃 + 铜卡叠加过滤', () => {
  const tierFiltered = filterByTier(MOCK_MEMBERS, 'bronze');
  const statusFiltered = filterByStatus(tierFiltered, 'inactive');
  assert.equal(statusFiltered.length, 1);
  assert.equal(statusFiltered[0].name, '孙丽');
});

test('边界: 最大分页不越界', () => {
  const result = paginate(MOCK_MEMBERS, 1, 100);
  assert.equal(result.length, MOCK_MEMBERS.length);
});

test('边界: 会员 ID 唯一性', () => {
  const ids = MOCK_MEMBERS.map((m) => m.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length, '所有会员 ID 应唯一');
});
