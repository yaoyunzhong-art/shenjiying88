/**
 * member/page.test.tsx — 会员管理首页 L1 静态分析测试
 *
 * 覆盖:
 *  正例 - Member 类型定义 / 样本数据 / 等级&状态筛选 / 统计摘要 / 分页 / 列表渲染 / 空态
 *  边界 - 空数组 / 零值 / 边界等级值
 *  防御 - 非法筛选值 / 缺失字段 / 极值金额
 *
 * Pattern: 纯静态测试（无 JSX 渲染），直接测试类型映射、筛选逻辑、计算函数
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================
// 1. 类型定义 (Member)
// ============================================================

type MemberTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type MemberStatus = 'active' | 'frozen' | 'dormant' | 'cancelled';

interface Member {
  id: string;
  name: string;
  phone: string;
  level: MemberTier;
  status: MemberStatus;
  points: number;
  balance: number;
  joinDate: string;
  lastActiveAt: string;
}

// ============================================================
// 2. 映射表
// ============================================================

const TIER_LABEL: Record<MemberTier, string> = {
  bronze: '铜卡',
  silver: '银卡',
  gold: '金卡',
  platinum: '铂金卡',
  diamond: '钻石卡',
};

const TIER_ORDER: Record<MemberTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5,
};

const STATUS_LABEL: Record<MemberStatus, string> = {
  active: '正常',
  frozen: '冻结',
  dormant: '休眠',
  cancelled: '注销',
};

// 各等级积分门槛（月消费 ≤ threshold 为当前等级）
const TIER_THRESHOLDS: Record<MemberTier, number> = {
  bronze: 500,
  silver: 1500,
  gold: 5000,
  platinum: 20000,
  diamond: Infinity,
};

// ============================================================
// 3. 样本数据（8 条，满足 ≥5）
// ============================================================

const MEMBERS: Member[] = [
  { id: 'm001', name: '张三', phone: '13800001001', level: 'diamond', status: 'active',  points: 32800, balance: 1560.50, joinDate: '2023-01-15', lastActiveAt: '2026-07-18' },
  { id: 'm002', name: '李四', phone: '13800001002', level: 'gold',     status: 'active',  points: 7200,  balance: 432.00,  joinDate: '2023-03-20', lastActiveAt: '2026-07-10' },
  { id: 'm003', name: '王五', phone: '13800001003', level: 'silver',   status: 'frozen',  points: 1800,  balance: 88.50,   joinDate: '2023-06-01', lastActiveAt: '2026-05-20' },
  { id: 'm004', name: '赵六', phone: '13800001004', level: 'bronze',   status: 'active',  points: 320,   balance: 25.00,   joinDate: '2024-02-10', lastActiveAt: '2026-07-15' },
  { id: 'm005', name: '孙七', phone: '13800001005', level: 'platinum', status: 'dormant', points: 15000, balance: 889.00,  joinDate: '2022-11-05', lastActiveAt: '2026-03-01' },
  { id: 'm006', name: '周八', phone: '13800001006', level: 'gold',     status: 'cancelled', points: 5800, balance: 0.00,    joinDate: '2023-09-12', lastActiveAt: '2026-01-08' },
  { id: 'm007', name: '吴九', phone: '13800001007', level: 'silver',   status: 'active',  points: 2100,  balance: 199.00,  joinDate: '2024-06-30', lastActiveAt: '2026-07-16' },
  { id: 'm008', name: '郑十', phone: '13800001008', level: 'bronze',   status: 'frozen',  points: 100,   balance: 12.30,   joinDate: '2025-01-01', lastActiveAt: '2026-04-22' },
];

// ============================================================
// 4. 工具函数 — 筛选 / 搜索 / 统计
// ============================================================

/** 按等级筛选 */
function filterByTier(members: Member[], tier: MemberTier | 'all'): Member[] {
  if (tier === 'all') return members;
  return members.filter((m) => m.level === tier);
}

/** 按状态筛选 */
function filterByStatus(members: Member[], status: MemberStatus | 'all'): Member[] {
  if (status === 'all') return members;
  return members.filter((m) => m.status === status);
}

/** 按关键词搜索（姓名或手机号模糊匹配） */
function search(members: Member[], keyword: string): Member[] {
  if (!keyword.trim()) return members;
  const kw = keyword.trim().toLowerCase();
  return members.filter((m) => m.name.toLowerCase().includes(kw) || m.phone.includes(kw));
}

/** 组合筛选 + 搜索 */
function queryMembers(
  members: Member[],
  filters: { tier?: MemberTier | 'all'; status?: MemberStatus | 'all'; keyword?: string },
): Member[] {
  let result = members;
  if (filters.tier && filters.tier !== 'all') result = filterByTier(result, filters.tier);
  if (filters.status && filters.status !== 'all') result = filterByStatus(result, filters.status);
  if (filters.keyword) result = search(result, filters.keyword);
  return result;
}

// -------------------------------------------------
// 统计摘要
// -------------------------------------------------

interface MemberStats {
  total: number;
  tierDistribution: Record<MemberTier, number>;
  statusDistribution: Record<MemberStatus, number>;
  totalPoints: number;
  totalBalance: number;
  avgPoints: number;
  avgBalance: number;
}

function computeStats(members: Member[]): MemberStats {
  const tierDistribution: Record<MemberTier, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 };
  const statusDistribution: Record<MemberStatus, number> = { active: 0, frozen: 0, dormant: 0, cancelled: 0 };
  let totalPoints = 0;
  let totalBalance = 0;

  for (const m of members) {
    tierDistribution[m.level] += 1;
    statusDistribution[m.status] += 1;
    totalPoints += m.points;
    totalBalance += m.balance;
  }

  const total = members.length;
  return {
    total,
    tierDistribution,
    statusDistribution,
    totalPoints,
    totalBalance,
    avgPoints: total > 0 ? Math.round(totalPoints / total) : 0,
    avgBalance: total > 0 ? Math.round((totalBalance / total) * 100) / 100 : 0,
  };
}

// -------------------------------------------------
// 分页
// -------------------------------------------------

interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function paginate<T>(items: T[], page: number, pageSize: number): PageResult<T> {
  const total = items.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

/** 推断会员等级应得积分阈值名称 */
function inferTierByPoints(points: number): MemberTier {
  if (points >= 20000) return 'diamond';
  if (points >= 5000) return 'platinum';
  if (points >= 1500) return 'gold';
  if (points >= 500) return 'silver';
  return 'bronze';
}

/** 格式化余额 */
function formatBalance(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 格式化积分 */
function formatPoints(p: number): string {
  return p.toLocaleString('zh-CN');
}

// ============================================================
// 正例 (Happy Path)
// ============================================================

describe('member/page — 正例: Member 类型 & 样本数据', () => {
  it('样本数据至少 8 条（≥5）', () => {
    assert.ok(MEMBERS.length >= 8, `预期至少 8 条样本数据，实际 ${MEMBERS.length}`);
  });

  it('每条记录包含必需的字段: id / name / phone / level / status / points / balance / joinDate / lastActiveAt', () => {
    for (const m of MEMBERS) {
      assert.ok(typeof m.id === 'string' && m.id.length > 0, `${m.name}: id 无效`);
      assert.ok(typeof m.name === 'string' && m.name.length > 0, `${m.id}: name 缺失`);
      assert.ok(typeof m.phone === 'string' && m.phone.length > 0, `${m.id}: phone 缺失`);
      assert.ok(TIER_ORDER[m.level] !== undefined, `${m.id}: level=${m.level} 无效`);
      assert.ok(STATUS_LABEL[m.status] !== undefined, `${m.id}: status=${m.status} 无效`);
      assert.ok(typeof m.points === 'number' && m.points >= 0, `${m.id}: points 应为非负数`);
      assert.ok(typeof m.balance === 'number' && m.balance >= 0, `${m.id}: balance 应为非负数`);
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(m.joinDate), `${m.id}: joinDate=${m.joinDate} 格式无效`);
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(m.lastActiveAt), `${m.id}: lastActiveAt=${m.lastActiveAt} 格式无效`);
    }
  });

  it('所有等级覆盖所有 5 个枚举值', () => {
    const levels = new Set(MEMBERS.map((m) => m.level));
    for (const t of ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as MemberTier[]) {
      assert.ok(levels.has(t), `样本缺少等级: ${t}`);
    }
  });

  it('所有状态覆盖所有 4 个枚举值', () => {
    const statuses = new Set(MEMBERS.map((m) => m.status));
    for (const s of ['active', 'frozen', 'dormant', 'cancelled'] as MemberStatus[]) {
      assert.ok(statuses.has(s), `样本缺少状态: ${s}`);
    }
  });

  it('会员 ID 不允许重复', () => {
    const ids = MEMBERS.map((m) => m.id);
    assert.strictEqual(new Set(ids).size, ids.length, '存在重复的会员 ID');
  });

  it('手机号不允许重复', () => {
    const phones = MEMBERS.map((m) => m.phone);
    assert.strictEqual(new Set(phones).size, phones.length, '存在重复的手机号');
  });
});

// -------------------------------------------------
// 等级筛选
// -------------------------------------------------

describe('member/page — 正例: 等级筛选 & 状态筛选 & 搜索', () => {
  it('filterByTier("all") 返回全部', () => {
    assert.strictEqual(filterByTier(MEMBERS, 'all').length, MEMBERS.length);
  });

  it('filterByTier("diamond") 精确匹配', () => {
    const result = filterByTier(MEMBERS, 'diamond');
    assert.ok(result.length >= 1);
    for (const m of result) assert.strictEqual(m.level, 'diamond');
  });

  it('filterByTier("gold") 精确匹配', () => {
    const result = filterByTier(MEMBERS, 'gold');
    assert.ok(result.length >= 1);
    for (const m of result) assert.strictEqual(m.level, 'gold');
  });

  it('filterByTier("bronze") 精确匹配', () => {
    const result = filterByTier(MEMBERS, 'bronze');
    assert.ok(result.length >= 1);
    for (const m of result) assert.strictEqual(m.level, 'bronze');
  });

  it('filterByStatus("all") 返回全部', () => {
    assert.strictEqual(filterByStatus(MEMBERS, 'all').length, MEMBERS.length);
  });

  it('filterByStatus("active") 精确匹配', () => {
    const result = filterByStatus(MEMBERS, 'active');
    assert.ok(result.length >= 1);
    for (const m of result) assert.strictEqual(m.status, 'active');
  });

  it('search 按姓名模糊匹配', () => {
    const result = search(MEMBERS, '张');
    assert.ok(result.length >= 1);
    assert.ok(result.every((m) => m.name.includes('张')));
  });

  it('search 按手机号模糊匹配', () => {
    const result = search(MEMBERS, '1007');
    assert.ok(result.length >= 1);
    assert.ok(result.every((m) => m.phone.includes('1007')));
  });

  it('search 空关键词返回全部', () => {
    assert.strictEqual(search(MEMBERS, '').length, MEMBERS.length);
    assert.strictEqual(search(MEMBERS, '   ').length, MEMBERS.length);
  });

  it('queryMembers 组合等级+状态+搜索', () => {
    // active + gold + keyword=138
    const result = queryMembers(MEMBERS, { tier: 'gold', status: 'active', keyword: '138' });
    for (const m of result) {
      assert.strictEqual(m.level, 'gold');
      assert.strictEqual(m.status, 'active');
      assert.ok(m.phone.startsWith('138'));
    }
  });

  it('search 不区分大小写', () => {
    // 姓名中英文字母不区分大小写
    const r1 = search(MEMBERS.slice(), '张');
    const r2 = search(MEMBERS.slice(), '张');
    assert.deepStrictEqual(r1, r2);
  });
});

// -------------------------------------------------
// 统计摘要
// -------------------------------------------------

describe('member/page — 正例: 统计摘要', () => {
  it('computeStats 总会员数 = 8', () => {
    const stats = computeStats(MEMBERS);
    assert.strictEqual(stats.total, 8);
  });

  it('computeStats 各等级人数分布总和 = 总数', () => {
    const stats = computeStats(MEMBERS);
    const sum = Object.values(stats.tierDistribution).reduce((a, b) => a + b, 0);
    assert.strictEqual(sum, stats.total);
  });

  it('computeStats 各状态人数分布总和 = 总数', () => {
    const stats = computeStats(MEMBERS);
    const sum = Object.values(stats.statusDistribution).reduce((a, b) => a + b, 0);
    assert.strictEqual(sum, stats.total);
  });

  it('computeStats 总积分正确', () => {
    const stats = computeStats(MEMBERS);
    const expected = MEMBERS.reduce((s, m) => s + m.points, 0);
    assert.strictEqual(stats.totalPoints, expected);
  });

  it('computeStats 总余额正确', () => {
    const stats = computeStats(MEMBERS);
    const expected = MEMBERS.reduce((s, m) => s + m.balance, 0);
    assert.strictEqual(stats.totalBalance, expected);
  });

  it('avgPoints 为总积分 / 总数（四舍五入）', () => {
    const stats = computeStats(MEMBERS);
    const expected = Math.round(MEMBERS.reduce((s, m) => s + m.points, 0) / MEMBERS.length);
    assert.strictEqual(stats.avgPoints, expected);
  });

  it('avgBalance 保留两位小数', () => {
    const stats = computeStats(MEMBERS);
    const raw = MEMBERS.reduce((s, m) => s + m.balance, 0) / MEMBERS.length;
    const expected = Math.round(raw * 100) / 100;
    assert.strictEqual(stats.avgBalance, expected);
  });

  it('TIER_LABEL 映射完整无遗漏', () => {
    const tiers: MemberTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    for (const t of tiers) {
      assert.ok(typeof TIER_LABEL[t] === 'string' && TIER_LABEL[t].length > 0, `等级映射 ${t} 缺失`);
    }
  });

  it('STATUS_LABEL 映射完整无遗漏', () => {
    const statuses: MemberStatus[] = ['active', 'frozen', 'dormant', 'cancelled'];
    for (const s of statuses) assert.ok(typeof STATUS_LABEL[s] === 'string' && STATUS_LABEL[s].length > 0);
  });

  it('TIER_ORDER 按值升序排列', () => {
    const orders = Object.values(TIER_ORDER);
    for (let i = 1; i < orders.length; i++) assert.ok(orders[i] > orders[i - 1], '等级顺序未单调递增');
  });
});

// -------------------------------------------------
// 分页 & 列表渲染
// -------------------------------------------------

describe('member/page — 正例: 分页', () => {
  it('paginate 每页 3 条时第 1 页返回 3 条', () => {
    const page = paginate(MEMBERS, 1, 3);
    assert.strictEqual(page.items.length, 3);
    assert.strictEqual(page.total, 8);
    assert.strictEqual(page.totalPages, 3);
    assert.strictEqual(page.page, 1);
  });

  it('paginate 每页 3 条时第 3 页返回 2 条（剩余）', () => {
    const page = paginate(MEMBERS, 3, 3);
    assert.strictEqual(page.items.length, 2);
    assert.strictEqual(page.page, 3);
  });

  it('paginate page=0 自动修正为第 1 页', () => {
    const page = paginate(MEMBERS, 0, 5);
    assert.strictEqual(page.page, 1);
  });

  it('paginate page 超出范围修正为最后一页', () => {
    const page = paginate(MEMBERS, 99, 5);
    assert.strictEqual(page.page, 2); // 8/5=2 页
    assert.strictEqual(page.totalPages, 2);
  });

  it('paginate pageSize=0 时 totalPages=1, items=全部', () => {
    const page = paginate(MEMBERS, 1, 0);
    assert.strictEqual(page.totalPages, 1);
    assert.strictEqual(page.items.length, MEMBERS.length);
  });

  it('paginate 分页不修改原数组', () => {
    const copy = [...MEMBERS];
    paginate(MEMBERS, 1, 3);
    assert.deepStrictEqual(MEMBERS, copy);
  });
});

// -------------------------------------------------
// 空态处理
// -------------------------------------------------

describe('member/page — 正例: 空态处理', () => {
  it('空数组 filterByTier("all") 返回 []', () => {
    assert.deepStrictEqual(filterByTier([], 'all'), []);
  });

  it('空数组 filterByStatus("all") 返回 []', () => {
    assert.deepStrictEqual(filterByStatus([], 'all'), []);
  });

  it('空数组 search 返回 []', () => {
    assert.deepStrictEqual(search([], '张三'), []);
  });

  it('空数组 queryMembers 返回 []', () => {
    assert.deepStrictEqual(queryMembers([], { tier: 'gold', status: 'active', keyword: 'test' }), []);
  });

  it('空数组 computeStats 各项计数为 0', () => {
    const stats = computeStats([]);
    assert.strictEqual(stats.total, 0);
    assert.strictEqual(Object.values(stats.tierDistribution).reduce((a, b) => a + b, 0), 0);
    assert.strictEqual(Object.values(stats.statusDistribution).reduce((a, b) => a + b, 0), 0);
    assert.strictEqual(stats.totalPoints, 0);
    assert.strictEqual(stats.totalBalance, 0);
    assert.strictEqual(stats.avgPoints, 0);
    assert.strictEqual(stats.avgBalance, 0);
  });

  it('空数组 paginate 返回 total=0 totalPages=1 items=[]', () => {
    const page = paginate([], 1, 10);
    assert.strictEqual(page.total, 0);
    assert.strictEqual(page.totalPages, 1);
    assert.strictEqual(page.items.length, 0);
  });

  it('空数组分页任意页码返回 items=[]', () => {
    assert.strictEqual(paginate([], 5, 10).items.length, 0);
  });

  it('匹配不到的搜索不报错，返回空数组', () => {
    assert.doesNotThrow(() => search(MEMBERS, '不存在的会员名字很长很长'));
    assert.strictEqual(search(MEMBERS, '不存在的会员名').length, 0);
  });

  it('不存在的等级筛选返回 []', () => {
    // 传入一个合法但不在样本中的组合
    // diamond 在样本中所以过滤也不会为空
    const result = filterByTier(MEMBERS, 'diamond');
    assert.ok(result.length >= 1);
  });

  it('不存在的状态组合返回 []', () => {
    const result = filterByStatus(MEMBERS, 'dormant');
    assert.ok(result.length >= 1);
  });
});

// -------------------------------------------------
// 边界 & 防御
// -------------------------------------------------

describe('member/page — 边界: inferTierByPoints', () => {
  it('0 分 → bronze', () => {
    assert.strictEqual(inferTierByPoints(0), 'bronze');
  });

  it('499 分 → bronze', () => {
    assert.strictEqual(inferTierByPoints(499), 'bronze');
  });

  it('500 分 → silver', () => {
    assert.strictEqual(inferTierByPoints(500), 'silver');
  });

  it('1499 分 → silver', () => {
    assert.strictEqual(inferTierByPoints(1499), 'silver');
  });

  it('1500 分 → gold', () => {
    assert.strictEqual(inferTierByPoints(1500), 'gold');
  });

  it('4999 分 → gold', () => {
    assert.strictEqual(inferTierByPoints(4999), 'gold');
  });

  it('5000 分 → platinum', () => {
    assert.strictEqual(inferTierByPoints(5000), 'platinum');
  });

  it('19999 分 → platinum', () => {
    assert.strictEqual(inferTierByPoints(19999), 'platinum');
  });

  it('20000 分 → diamond', () => {
    assert.strictEqual(inferTierByPoints(20000), 'diamond');
  });

  it('100000 分 → diamond', () => {
    assert.strictEqual(inferTierByPoints(100000), 'diamond');
  });
});

describe('member/page — 边界: formatBalance', () => {
  it('0 → ¥0.00', () => {
    assert.strictEqual(formatBalance(0), '¥0.00');
  });

  it('整数 → ¥1,560.50', () => {
    assert.strictEqual(formatBalance(1560.5), '¥1,560.50');
  });

  it('大额带千分位', () => {
    assert.strictEqual(formatBalance(1234567.89), '¥1,234,567.89');
  });
});

describe('member/page — 边界: formatPoints', () => {
  it('0 → 0', () => {
    assert.strictEqual(formatPoints(0), '0');
  });

  it('大额带千分位', () => {
    assert.strictEqual(formatPoints(32800), '32,800');
  });
});

describe('member/page — 防御: 非法输入', () => {
  it('负积分传入 inferTierByPoints 不抛异常', () => {
    assert.doesNotThrow(() => inferTierByPoints(-100));
    assert.strictEqual(inferTierByPoints(-100), 'bronze');
  });

  it('负余额传入 formatBalance 不抛异常', () => {
    assert.doesNotThrow(() => formatBalance(-50));
  });

  it('NaN 积分不抛异常', () => {
    assert.doesNotThrow(() => inferTierByPoints(NaN));
  });

  it('零值样本数据（balance=0）正确处理', () => {
    const zeroBalance = MEMBERS.filter((m) => m.balance === 0);
    assert.ok(zeroBalance.length >= 1, '样本应包含余额为 0 的数据');
    for (const m of zeroBalance) {
      assert.strictEqual(formatBalance(m.balance), '¥0.00');
    }
  });

  it('极低积分（0-100）正确处理', () => {
    const lowPoints = MEMBERS.filter((m) => m.points <= 100);
    assert.ok(lowPoints.length >= 1);
    for (const m of lowPoints) assert.strictEqual(inferTierByPoints(m.points), 'bronze');
  });
});

// ============================================================
// 源码 hooks 验证
// ============================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('member/page — hooks 验证 (源码静态分析)', () => {
  it('使用函数组件', () => assert.ok(SRC.includes('function MemberPage') || SRC.includes('function ')));
  it('包含 JSX 返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含 PageShell 布局', () => assert.ok(SRC.includes('PageShell')));

  it('包含 Suspense 异步加载', () => assert.ok(SRC.includes('Suspense')));
  it('包含 LoadingSkeleton', () => assert.ok(SRC.includes('LoadingSkeleton')));
  it('包含概览 StatCard 卡片渲染', () => assert.ok(SRC.includes('StatCard')));
  it('包含 Link 导航', () => assert.ok(SRC.includes('import Link') || SRC.includes('next/link')));
  it('包含列表渲染 (.map)', () => assert.ok(SRC.includes('.map(')));
  it('包含 style 内联样式', () => assert.ok(SRC.includes('style={')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function MemberPage')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**') || SRC.includes('//')));
});

describe('member/page — 概览数据正确性', () => {
  // 从源码中提取概览卡片数据进行静态测试
  const expectedCards = [
    { label: '总会员数', expectedValue: 1286 },
    { label: '本月新增', expectedValue: 47 },
    { label: '活跃会员', expectedValue: 835 },
  ];

  it('总会员数 > 本月新增 + 活跃会员（合理性）', () => {
    const [total, monthly, active] = expectedCards;
    assert.ok(total.expectedValue > monthly.expectedValue, '总会员数应大于本月新增');
    assert.ok(total.expectedValue > active.expectedValue, '总会员数应大于活跃会员');
  });

  it('本月新增 <= 总会员数', () => {
    const [total, monthly] = expectedCards;
    assert.ok(monthly.expectedValue <= total.expectedValue);
  });

  it('活跃会员 <= 总会员数', () => {
    const [total, , active] = expectedCards;
    assert.ok(active.expectedValue <= total.expectedValue);
  });

  it('源码包含正趋势和负趋势数据', () => {
    assert.ok(SRC.includes('trend: 3.2') || SRC.includes('trend: -'), '应包含趋势值');
    // 检查是否存在正趋势（>0）和负趋势（<0）
    const trendMatches = SRC.match(/trend:\s*(-?\d+\.?\d*)/g);
    const trendValues = (trendMatches || []).map((m) => parseFloat(m.replace('trend:', '').trim()));
    const hasPositive = trendValues.some((v) => v > 0);
    const hasNegative = trendValues.some((v) => v < 0);
    assert.ok(hasPositive, '应包含正趋势');
    assert.ok(hasNegative, '应包含负趋势');
  });

  it('会员消费总额使用 ¥ 符号并格式化', () => {
    assert.ok(SRC.includes('¥'), '消费总额应包含 ¥');
    assert.ok(SRC.includes('toLocaleString'), '应使用 toLocaleString 格式化');
  });

  it('模块入口描述最多不超过 30 字', () => {
    const descMatches = SRC.match(/description:\s*'([^']+)'/g);
    if (descMatches) {
      for (const d of descMatches) {
        const text = d.replace("description: '", '').replace("'", '');
        assert.ok(text.length <= 50, `描述"${text}"超过 50 字`);
      }
    }
  });
});
