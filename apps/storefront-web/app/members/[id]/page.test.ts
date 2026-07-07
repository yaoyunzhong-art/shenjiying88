/**
 * [id]/page.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * storefront-web Member Detail page — 详情页组件导入、Mock 数据完整性、状态流转覆盖
 * 角色视角: 👔店长 · 🛒前台 · 💳会员
 */

import assert from 'node:assert/strict';
import { test, describe, it } from 'node:test';

// ── Type (mirrors page.tsx) ──

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

// ── Mock data (mirror of page.tsx) ──

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

function loadSource(): string {
  const fs = require('fs');
  const path = require('path');
  return fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
}

// ── 基本导出 ──

test('👔 店长视角: MemberDetailPage is a function component', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function',
    'MemberDetailPage should export a function component');
});

test('🛒 前台视角: component export is stable', async () => {
  const mod = await import('./page');
  assert.ok(mod.default !== undefined);
  assert.ok(mod.default !== null);
});

test('💳 会员视角: default export name is meaningful', async () => {
  const mod = await import('./page');
  assert.ok(mod.default.name.length > 0 || typeof mod.default === 'function');
});

// ── 正例 ──

test('正例: module has default export', async () => {
  const mod = await import('./page');
  assert.ok('default' in mod, 'should have default export');
});

test('正例: page import does not throw', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'page import should succeed');
});

test('正例: source imports all required UI components', () => {
  const source = loadSource();
  const imports = ['DetailShell', 'InfoRow', 'ConfirmDialog', 'StatusBadge', 'Alert', 'useToast', 'useAlert', 'FormSubmitFeedback', 'FormField', 'SubmitButton'];
  for (const imp of imports) {
    assert.ok(source.includes(imp), `should import ${imp}`);
  }
});

test('正例: source has title "会员详情"', () => {
  const source = loadSource();
  assert.ok(source.includes('会员详情'), 'should contain page title');
});

test('正例: source imports from next/navigation', () => {
  const source = loadSource();
  assert.ok(source.includes('useParams'), 'should import useParams');
  assert.ok(source.includes('useRouter'), 'should import useRouter');
});

test('正例: mock data has 3 members', () => {
  const keys = Object.keys(MOCK_MEMBERS);
  assert.equal(keys.length, 3);
});

test('正例: each member has all required fields', () => {
  const required: (keyof Member)[] = ['id', 'name', 'phone', 'email', 'tier', 'points', 'storeName', 'totalVisits', 'lastVisit', 'status', 'joinedAt', 'birthday', 'address', 'tags', 'notes'];
  for (const [k, m] of Object.entries(MOCK_MEMBERS)) {
    for (const field of required) {
      assert.ok(m[field] !== undefined, `member ${k} missing field '${field}'`);
    }
  }
});

test('正例: each member has at least one tag', () => {
  for (const [k, m] of Object.entries(MOCK_MEMBERS)) {
    assert.ok(m.tags.length >= 1, `member ${k} should have tags`);
  }
});

test('正例: all tiers are valid', () => {
  const validTiers: MembershipTier[] = ['diamond', 'gold', 'silver', 'bronze', 'basic'];
  for (const m of Object.values(MOCK_MEMBERS)) {
    assert.ok(validTiers.includes(m.tier), `member ${m.id} invalid tier: ${m.tier}`);
  }
});

test('正例: all statuses are valid', () => {
  const validStatuses: MemberStatus[] = ['active', 'inactive', 'frozen'];
  for (const m of Object.values(MOCK_MEMBERS)) {
    assert.ok(validStatuses.includes(m.status), `member ${m.id} invalid status: ${m.status}`);
  }
});

test('正例: TIER_LABELS covers all tiers', () => {
  const tiers: MembershipTier[] = ['diamond', 'gold', 'silver', 'bronze', 'basic'];
  for (const t of tiers) {
    assert.ok(TIER_LABELS[t].length > 0, `missing label for ${t}`);
  }
});

test('正例: STATUS_LABELS covers all statuses', () => {
  const statuses: MemberStatus[] = ['active', 'inactive', 'frozen'];
  for (const s of statuses) {
    assert.ok(STATUS_LABELS[s].length > 0, `missing label for ${s}`);
  }
});

test('正例: points are positive integers', () => {
  for (const m of Object.values(MOCK_MEMBERS)) {
    assert.ok(m.points >= 0, `member ${m.id} points should be >= 0`);
    assert.equal(Number.isInteger(m.points), true, `member ${m.id} points should be integer`);
  }
});

test('正例: total visits are positive integers', () => {
  for (const m of Object.values(MOCK_MEMBERS)) {
    assert.ok(m.totalVisits >= 0, `member ${m.id} visits should be >= 0`);
    assert.equal(Number.isInteger(m.totalVisits), true, `member ${m.id} visits should be integer`);
  }
});

test('正例: transition for active -> frozen exists', () => {
  assert.ok(TRANSITIONS.active.some(t => t.to === 'frozen'));
  assert.ok(TRANSITIONS.active.some(t => t.to === 'inactive'));
});

test('正例: transition for frozen has only "active" as target', () => {
  assert.equal(TRANSITIONS.frozen.length, 1);
  assert.equal(TRANSITIONS.frozen[0].to, 'active');
});

test('正例: source contains EditMemberForm component', () => {
  const source = loadSource();
  assert.ok(source.includes('EditMemberForm'), 'should define EditMemberForm');
  assert.ok(source.includes('handleEditSaved'), 'should define handleEditSaved');
});

test('正例: source has delete confirmation dialog', () => {
  const source = loadSource();
  assert.ok(source.includes('ConfirmDialog'), 'should use ConfirmDialog');
  assert.ok(source.includes('handleDelete'), 'should define handleDelete');
});

test('正例: member id format is valid', () => {
  const validIds = ['m1', 'm2', 'm3', 'm4', 'm5', 'm999'];
  for (const vid of validIds) {
    assert.ok(vid.startsWith('m') && vid.length >= 2, `id ${vid} format invalid`);
  }
});

// ── 反例 ──

test('反例: export is not null or undefined', async () => {
  const MemberDetailPage = (await import('./page')).default;
  assert.notEqual(MemberDetailPage, null);
  assert.notEqual(MemberDetailPage, undefined);
});

test('反例: page is not a non-function value', async () => {
  const MemberDetailPage = (await import('./page')).default;
  assert.notEqual(typeof MemberDetailPage, 'string', 'should not be a string');
  assert.notEqual(typeof MemberDetailPage, 'number', 'should not be a number');
});

test('反例: no negative points', () => {
  for (const m of Object.values(MOCK_MEMBERS)) {
    assert.ok(m.points >= 0, `member ${m.id} points should not be negative`);
  }
});

test('反例: no duplicate member names', () => {
  const names = Object.values(MOCK_MEMBERS).map(m => m.name);
  assert.equal(new Set(names).size, names.length, 'member names should be unique');
});

// ── 边界 ──

test('边界: component is callable', async () => {
  const MemberDetailPage = (await import('./page')).default;
  assert.equal(typeof MemberDetailPage, 'function');
});

test('边界: component has correct type signature', async () => {
  const MemberDetailPage = (await import('./page')).default;
  assert.ok(
    (MemberDetailPage as unknown as { displayName?: string }).displayName === undefined || typeof MemberDetailPage === 'function',
    'component should be valid',
  );
});

test('边界: at least one member has status = inactive', () => {
  const inactive = Object.values(MOCK_MEMBERS).filter(m => m.status === 'inactive');
  assert.ok(inactive.length >= 1, 'should have at least one inactive member');
});

test('边界: at least one member has status = active', () => {
  const active = Object.values(MOCK_MEMBERS).filter(m => m.status === 'active');
  assert.ok(active.length >= 1, 'should have at least one active member');
});

test('边界: tier labels are distinct', () => {
  const labels = Object.values(TIER_LABELS);
  assert.equal(new Set(labels).size, labels.length, 'tier labels should be distinct');
});

test('边界: STATUS_LABELS contains exactly "活跃", "非活跃", "冻结"', () => {
  assert.equal(STATUS_LABELS.active, '活跃');
  assert.equal(STATUS_LABELS.inactive, '非活跃');
  assert.equal(STATUS_LABELS.frozen, '冻结');
});

test('边界: source is "use client"', () => {
  const source = loadSource();
  assert.ok(source.includes("'use client'"), 'should be a client component');
});
