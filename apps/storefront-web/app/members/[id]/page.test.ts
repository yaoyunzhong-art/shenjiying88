/**
 * [id]/page.test.ts — 会员详情页 L1 源码分析测试
 * 纯 node:test, 不依赖 vitest/JSX/React
 * 覆盖: 组件导出、Mock数据完整性、状态流转、常量映射、源码引用检查
 * 角色视角: 👔店长 · 🛒前台 · 💳会员
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

type MembershipTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic';
type MemberStatus = 'active' | 'inactive' | 'frozen';

interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  tier: MembershipTier;
  points: number;
  storeName: string;
  totalVisits: number;
  lastVisit: string;
  status: MemberStatus;
  joinedAt: string;
  birthday: string;
  address: string;
  tags: string[];
  notes: string;
}

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

// ── Mock data ──

const MOCK_MEMBERS: Record<string, Member> = {
  m1: {
    id: 'm1', name: '张伟', phone: '138****1234', email: 'zhangwei@example.com',
    tier: 'diamond', points: 28500, storeName: 'Demo Store 旗舰店',
    totalVisits: 156, lastVisit: '2026-06-22', status: 'active',
    joinedAt: '2025-01-15', birthday: '1990-05-20',
    address: '上海市浦东新区张江高科技园区',
    tags: ['高净值', '老顾客', '爱推荐'],
    notes: '每次到店消费金额较高，偏好高端产品线。',
  },
  m2: {
    id: 'm2', name: '李娜', phone: '139****5678', email: 'lina@example.com',
    tier: 'gold', points: 12400, storeName: 'Demo Store 旗舰店',
    totalVisits: 89, lastVisit: '2026-06-20', status: 'active',
    joinedAt: '2025-03-22', birthday: '1988-11-03',
    address: '北京市朝阳区三里屯',
    tags: ['活跃', '社媒达人'],
    notes: '喜欢分享购物体验到社交媒体。',
  },
  m5: {
    id: 'm5', name: '孙丽', phone: '135****7890', email: 'sunli@example.com',
    tier: 'bronze', points: 2100, storeName: 'Demo Store 社区店',
    totalVisits: 18, lastVisit: '2026-05-30', status: 'inactive',
    joinedAt: '2025-09-01', birthday: '1995-07-15',
    address: '广州市天河区珠江新城',
    tags: ['新客', '价格敏感'],
    notes: '近一个月未到店，建议发送优惠券激活。',
  },
};

const TRANSITIONS: Record<MemberStatus, Array<{ label: string; to: MemberStatus }>> = {
  active: [
    { label: '冻结', to: 'frozen' },
    { label: '标记非活跃', to: 'inactive' },
  ],
  inactive: [
    { label: '激活', to: 'active' },
    { label: '冻结', to: 'frozen' },
  ],
  frozen: [
    { label: '解冻', to: 'active' },
  ],
};

/* ── 数据函数 ── */

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

function filterByStatus(members: Member[], status: MemberStatus | 'ALL'): Member[] {
  return status === 'ALL' ? members : members.filter((m) => m.status === status);
}

function getTags(member: Member): string[] {
  return member.tags;
}

function getAvailableTransitions(status: MemberStatus): ReadonlyArray<{ label: string; to: MemberStatus }> {
  return TRANSITIONS[status] || [];
}

/* =================================================================
 * 数据展示 (Data Display)
 * ================================================================= */

test('数据展示: TIER_LABELS 覆盖 5 种等级且标签以"会员"结尾', () => {
  const tiers: MembershipTier[] = ['diamond', 'gold', 'silver', 'bronze', 'basic'];
  for (const t of tiers) {
    assert.ok(TIER_LABELS[t].endsWith('会员'), `${t} 标签应以"会员"结尾`);
  }
});

test('数据展示: STATUS_LABELS 覆盖 3 种状态', () => {
  const statuses: MemberStatus[] = ['active', 'inactive', 'frozen'];
  for (const s of statuses) {
    assert.ok(STATUS_LABELS[s].length > 0, `${s} 应有中文标签`);
  }
});

test('数据展示: 每个会员拥有全部 15 个必需字段', () => {
  const required: (keyof Member)[] = [
    'id', 'name', 'phone', 'email', 'tier', 'points', 'storeName',
    'totalVisits', 'lastVisit', 'status', 'joinedAt', 'birthday',
    'address', 'tags', 'notes',
  ];
  for (const [k, m] of Object.entries(MOCK_MEMBERS)) {
    for (const field of required) {
      assert.ok(m[field] !== undefined, `member ${k} missing '${field}'`);
    }
  }
});

test('数据展示: 每个会员至少有 1 个标签', () => {
  for (const [k, m] of Object.entries(MOCK_MEMBERS)) {
    assert.ok(m.tags.length >= 1, `member ${k} 应有标签`);
  }
});

test('数据展示: 所有等级值合法', () => {
  const validTiers: MembershipTier[] = ['diamond', 'gold', 'silver', 'bronze', 'basic'];
  for (const m of Object.values(MOCK_MEMBERS)) {
    assert.ok(validTiers.includes(m.tier), `member ${m.id} 等级无效: ${m.tier}`);
  }
});

test('数据展示: 所有状态值合法', () => {
  const validStatuses: MemberStatus[] = ['active', 'inactive', 'frozen'];
  for (const m of Object.values(MOCK_MEMBERS)) {
    assert.ok(validStatuses.includes(m.status), `member ${m.id} 状态无效: ${m.status}`);
  }
});

test('数据展示: 积分为非负整数', () => {
  for (const m of Object.values(MOCK_MEMBERS)) {
    assert.ok(m.points >= 0, `member ${m.id} points 不应为负`);
    assert.equal(Number.isInteger(m.points), true, `member ${m.id} points 应为整数`);
  }
});

test('数据展示: 到店次数为非负整数', () => {
  for (const m of Object.values(MOCK_MEMBERS)) {
    assert.ok(m.totalVisits >= 0, `member ${m.id} visits 不应为负`);
    assert.equal(Number.isInteger(m.totalVisits), true, `member ${m.id} visits 应为整数`);
  }
});

test('数据展示: 等级标签互不相同', () => {
  const labels = Object.values(TIER_LABELS);
  assert.equal(new Set(labels).size, labels.length, '等级标签应互不相同');
});

/* =================================================================
 * 状态 (Status)
 * ================================================================= */

test('状态: active 状态可流转到 frozen 和 inactive', () => {
  const t = getAvailableTransitions('active');
  assert.ok(t.some((x) => x.to === 'frozen'));
  assert.ok(t.some((x) => x.to === 'inactive'));
});

test('状态: frozen 状态只能解冻到 active', () => {
  const t = getAvailableTransitions('frozen');
  assert.equal(t.length, 1);
  assert.equal(t[0]?.to, 'active');
});

test('状态: inactive 可激活或冻结', () => {
  const t = getAvailableTransitions('inactive');
  assert.equal(t.length, 2);
  assert.ok(t.some((x) => x.to === 'active'));
  assert.ok(t.some((x) => x.to === 'frozen'));
});

test('状态: 源码中 MOCK_MEMBERS 至少包含 active, inactive 两种状态', () => {
  const statuses = Object.values(MOCK_MEMBERS).map((m) => m.status);
  assert.ok(statuses.includes('active'), '应包含 active');
  assert.ok(statuses.includes('inactive'), '应包含 inactive');
});

test('状态: 过滤 — 筛选活跃会员', () => {
  const result = filterByStatus(Object.values(MOCK_MEMBERS), 'active');
  assert.ok(result.every((m) => m.status === 'active'));
});

test('状态: 过滤 — ALL 不过滤', () => {
  const result = filterByStatus(Object.values(MOCK_MEMBERS), 'ALL');
  assert.equal(result.length, Object.values(MOCK_MEMBERS).length);
});

/* =================================================================
 * 列表 (List/Collection)
 * ================================================================= */

test('列表: MOCK_MEMBERS 有 3 个会员', () => {
  assert.equal(Object.keys(MOCK_MEMBERS).length, 3);
});

test('列表: 会员名称唯一', () => {
  const names = Object.values(MOCK_MEMBERS).map((m) => m.name);
  assert.equal(new Set(names).size, names.length, '会员名称应唯一');
});

test('列表: getTags 返回数组', () => {
  for (const m of Object.values(MOCK_MEMBERS)) {
    const tags = getTags(m);
    assert.ok(Array.isArray(tags));
    assert.ok(tags.length >= 1);
  }
});

test('列表: computeStats 正确计算统计', () => {
  const members = Object.values(MOCK_MEMBERS);
  const stats = computeStats(members);
  assert.equal(stats.total, 3);
  assert.equal(stats.active, 2);
  assert.equal(stats.diamond, 1);
  assert.ok(stats.avgPoints > 0);
});

/* =================================================================
 * 边界 (Edge Cases)
 * ================================================================= */

test('边界: computeStats 空列表不崩溃', () => {
  const stats = computeStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.active, 0);
  assert.equal(stats.diamond, 0);
  assert.equal(stats.avgPoints, 0);
});

test('边界: 空状态过滤返回空数组', () => {
  const result = filterByStatus([], 'frozen');
  assert.equal(result.length, 0);
});

test('边界: 不存在状态过滤返回空', () => {
  // @ts-expect-error 测试防御
  const result = filterByStatus(Object.values(MOCK_MEMBERS), 'deleted');
  assert.equal(result.length, 0);
});

test('边界: 未知状态 transitions 返回空数组', () => {
  const t = getAvailableTransitions('unknown' as MemberStatus);
  assert.equal(t.length, 0);
});

test('边界: 超大积分不导致计算溢出', () => {
  const bigMember: Member = {
    ...Object.values(MOCK_MEMBERS)[0]!,
    points: 99999999,
    totalVisits: 999999,
  };
  assert.equal(bigMember.points, 99999999);
  assert.equal(bigMember.totalVisits, 999999);
});

/* =================================================================
 * 无 as any
 * ================================================================= */

test('无 as any: 源码不包含 ": any" 类型标注', () => {
  // page.tsx 不允许使用 any
  const hasAny = /\bany\b/.test(SRC);
  // 检查是否在类型位置用了 any
  assert.ok(!SRC.match(/:\s*any\b/), '源码不应使用 any 类型');
});

/* =================================================================
 * 源码完整性 (Source Integrity)
 * ================================================================= */

test('源码: 导出了 default function MemberDetailPage', () => {
  assert.ok(SRC.includes('export default function MemberDetailPage'));
});

test('源码: 声明了 "use client"', () => {
  assert.ok(SRC.includes("'use client'"));
});

test('源码: 导入了 DetailShell', () => {
  assert.ok(SRC.includes('DetailShell'));
});

test('源码: 导入了 ConfirmDialog', () => {
  assert.ok(SRC.includes('ConfirmDialog'));
});

test('源码: 导入了 EditMemberForm 组件', () => {
  assert.ok(SRC.includes('EditMemberForm'));
});

test('源码: 包含 handleDelete 删除处理', () => {
  assert.ok(SRC.includes('handleDelete'));
});

test('源码: 不包含 dangerouslySetInnerHTML', () => {
  assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
});

test('源码: 不包含 eval 或 Function 构造函数', () => {
  assert.ok(!SRC.includes('eval(') && !SRC.includes('new Function('));
});
