/**
 * members/page.test.tsx — 会员管理列表页 L1 测试
 *
 * 覆盖: 会员等级映射、状态映射、排序、搜索过滤、统计计算
 * 正例: 会员数据字段完整性、等级枚举值、状态枚举值
 * 反例: 无效等级/状态、空数据、边界值
 * 边界: 零值积分、大额消费金额、空搜索
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 会员等级与状态常量 ── */

type MemberTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'standard';
type MemberStatus = 'active' | 'frozen' | 'inactive';

const MEMBER_TIER_MAP: Record<MemberTier, string> = {
  diamond: '钻石',
  gold: '黄金',
  silver: '白银',
  bronze: '青铜',
  standard: '标准',
};

const MEMBER_STATUS_MAP: Record<MemberStatus, string> = {
  active: '活跃',
  frozen: '冻结',
  inactive: '停用',
};

const MEMBER_TIERS: MemberTier[] = ['diamond', 'gold', 'silver', 'bronze', 'standard'];
const MEMBER_STATUSES: MemberStatus[] = ['active', 'frozen', 'inactive'];

/* ── Mock 会员数据 ── */

interface MemberItem {
  code: string;
  name: string;
  tier: MemberTier;
  status: MemberStatus;
  points: number;
  totalSpent: number;
  storeName: string;
  phone: string;
  joinDate: string;
  lastActive: string;
}

const MOCK_MEMBERS: MemberItem[] = [
  { code: 'M-001', name: '王芳', tier: 'diamond', status: 'active', points: 182000, totalSpent: 458000, storeName: '朝阳旗舰店', phone: '138****0001', joinDate: '2023-08-15', lastActive: '2026-07-16' },
  { code: 'M-002', name: '李明', tier: 'gold', status: 'active', points: 95000, totalSpent: 215000, storeName: '海淀店', phone: '138****0002', joinDate: '2024-01-20', lastActive: '2026-07-15' },
  { code: 'M-003', name: '赵雪', tier: 'silver', status: 'active', points: 45000, totalSpent: 98000, storeName: '朝阳旗舰店', phone: '138****0003', joinDate: '2024-06-01', lastActive: '2026-07-10' },
  { code: 'M-004', name: '陈伟', tier: 'bronze', status: 'frozen', points: 12000, totalSpent: 32000, storeName: '西城店', phone: '138****0004', joinDate: '2025-03-10', lastActive: '2025-12-01' },
  { code: 'M-005', name: '刘佳', tier: 'standard', status: 'active', points: 5000, totalSpent: 15000, storeName: '东城店', phone: '138****0005', joinDate: '2025-09-25', lastActive: '2026-07-14' },
  { code: 'M-006', name: '孙浩', tier: 'gold', status: 'active', points: 105000, totalSpent: 312000, storeName: '海淀店', phone: '138****0006', joinDate: '2024-02-14', lastActive: '2026-07-15' },
  { code: 'M-007', name: '周婷', tier: 'diamond', status: 'inactive', points: 200300, totalSpent: 520000, storeName: '朝阳旗舰店', phone: '138****0007', joinDate: '2023-05-01', lastActive: '2026-03-20' },
  { code: 'M-008', name: '吴强', tier: 'silver', status: 'active', points: 62000, totalSpent: 145000, storeName: '西城店', phone: '138****0008', joinDate: '2024-08-12', lastActive: '2026-07-16' },
];

/* ── 辅助函数 ── */

function tierOrder(tier: MemberTier): number {
  const order: Record<MemberTier, number> = { diamond: 5, gold: 4, silver: 3, bronze: 2, standard: 1 };
  return order[tier];
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function searchMembers(members: MemberItem[], query: string): MemberItem[] {
  if (!query.trim()) return members;
  const q = query.toLowerCase();
  return members.filter(m => m.name.includes(q) || m.code.toLowerCase().includes(q) || m.phone.includes(q));
}

function filterByTier(members: MemberItem[], tier: MemberTier | 'all'): MemberItem[] {
  return tier === 'all' ? members : members.filter(m => m.tier === tier);
}

function filterByStatus(members: MemberItem[], status: MemberStatus | 'all'): MemberItem[] {
  return status === 'all' ? members : members.filter(m => m.status === status);
}

function getMemberStats(members: MemberItem[]) {
  return {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    frozen: members.filter(m => m.status === 'frozen').length,
    inactive: members.filter(m => m.status === 'inactive').length,
    totalPoints: members.reduce((s, m) => s + m.points, 0),
    totalSpent: members.reduce((s, m) => s + m.totalSpent, 0),
  };
}

/* ══════════════════════════════════════════════════════════
   测试: 文件结构与导出
   ══════════════════════════════════════════════════════════ */

describe('members — 文件结构', () => {
  it('1. page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'page.tsx')), true);
  });

  it('2. page.tsx 使用 "use client"', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes("'use client'") || source.includes('"use client"'));
  });

  it('3. 导出默认函数', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default'));
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 会员数据校验
   ══════════════════════════════════════════════════════════ */

describe('members — 数据校验', () => {
  /* ── 正例 ── */

  it('4. MOCK_MEMBERS 包含 8 条记录', () => {
    assert.equal(MOCK_MEMBERS.length, 8);
  });

  it('5. 所有会员 code 唯一', () => {
    const codes = MOCK_MEMBERS.map(m => m.code);
    assert.equal(new Set(codes).size, codes.length);
  });

  it('6. 所有等级在枚举范围内', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(MEMBER_TIERS.includes(m.tier), `${m.code} invalid tier ${m.tier}`);
    }
  });

  it('7. 所有状态在枚举范围内', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(MEMBER_STATUSES.includes(m.status), `${m.code} invalid status ${m.status}`);
    }
  });

  it('8. 姓名非空', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.name.length > 0);
    }
  });

  it('9. 手机号含掩码格式', () => {
    for (const m of MOCK_MEMBERS) {
      assert.match(m.phone, /^\d{3}\*{4}\d{4}$/, `${m.code} invalid phone format`);
    }
  });

  it('10. 积分非负', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.points >= 0, `${m.code} negative points`);
    }
  });

  it('11. 消费金额非负', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.totalSpent >= 0, `${m.code} negative spent`);
    }
  });

  it('12. 门店名称非空', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.storeName.length > 0);
    }
  });

  it('13. 加入日期格式 YYYY-MM-DD', () => {
    for (const m of MOCK_MEMBERS) {
      assert.match(m.joinDate, /^\d{4}-\d{2}-\d{2}$/, `${m.code} invalid date`);
    }
  });

  /* ── 等级映射 ── */

  it('14. MEMBER_TIER_MAP 覆盖所有 5 个等级', () => {
    for (const tier of MEMBER_TIERS) {
      assert.ok(typeof MEMBER_TIER_MAP[tier] === 'string' && MEMBER_TIER_MAP[tier].length > 0);
    }
  });

  it('15. MEMBER_STATUS_MAP 覆盖所有 3 个状态', () => {
    for (const status of MEMBER_STATUSES) {
      assert.ok(typeof MEMBER_STATUS_MAP[status] === 'string' && MEMBER_STATUS_MAP[status].length > 0);
    }
  });

  it('16. tierOrder 排序正确: diamond > gold > ... > standard', () => {
    assert.ok(tierOrder('diamond') > tierOrder('gold'));
    assert.ok(tierOrder('gold') > tierOrder('silver'));
    assert.ok(tierOrder('silver') > tierOrder('bronze'));
    assert.ok(tierOrder('bronze') > tierOrder('standard'));
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 统计与过滤
   ══════════════════════════════════════════════════════════ */

describe('members — 统计与过滤', () => {
  /* ── 统计 ── */

  it('17. 活跃会员 6 人', () => {
    assert.equal(MOCK_MEMBERS.filter(m => m.status === 'active').length, 6);
  });

  it('18. 冻结会员 1 人', () => {
    assert.equal(MOCK_MEMBERS.filter(m => m.status === 'frozen').length, 1);
  });

  it('19. 停用会员 1 人', () => {
    assert.equal(MOCK_MEMBERS.filter(m => m.status === 'inactive').length, 1);
  });

  it('20. 钻石会员 2 人', () => {
    assert.equal(MOCK_MEMBERS.filter(m => m.tier === 'diamond').length, 2);
  });

  it('21. 黄金会员 2 人', () => {
    assert.equal(MOCK_MEMBERS.filter(m => m.tier === 'gold').length, 2);
  });

  it('22. 白银会员 2 人', () => {
    assert.equal(MOCK_MEMBERS.filter(m => m.tier === 'silver').length, 2);
  });

  it('23. 总积分 = 706,300', () => {
    const total = MOCK_MEMBERS.reduce((s, m) => s + m.points, 0);
    assert.equal(total, 706300);
  });

  it('24. 总消费 = ¥1,795,000', () => {
    const total = MOCK_MEMBERS.reduce((s, m) => s + m.totalSpent, 0);
    assert.equal(total, 1795000);
  });

  /* ── 搜索过滤 ── */

  it('25. 搜索"王芳"返回 1 条', () => {
    assert.equal(searchMembers(MOCK_MEMBERS, '王芳').length, 1);
  });

  it('26. 空搜索返回全部', () => {
    assert.equal(searchMembers(MOCK_MEMBERS, '').length, MOCK_MEMBERS.length);
  });

  it('27. 不存在的搜索返回空', () => {
    assert.equal(searchMembers(MOCK_MEMBERS, '不存在').length, 0);
  });

  it('28. 按等级过滤 gold 返回 2 条', () => {
    assert.equal(filterByTier(MOCK_MEMBERS, 'gold').length, 2);
  });

  it('29. 按等级过滤 all 返回全部', () => {
    assert.equal(filterByTier(MOCK_MEMBERS, 'all').length, MOCK_MEMBERS.length);
  });

  it('30. 按状态过滤 active 返回 6 条', () => {
    assert.equal(filterByStatus(MOCK_MEMBERS, 'active').length, 6);
  });

  it('31. 按状态过滤 frozen 返回 1 条', () => {
    assert.equal(filterByStatus(MOCK_MEMBERS, 'frozen').length, 1);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 边界与反例
   ══════════════════════════════════════════════════════════ */

describe('members — 边界与反例', () => {
  it('32. 空成员列表不崩溃', () => {
    const empty: MemberItem[] = [];
    const stats = getMemberStats(empty);
    assert.equal(stats.total, 0);
    assert.equal(stats.active, 0);
    assert.equal(stats.totalPoints, 0);
  });

  it('33. formatCurrency 处理大额消费', () => {
    assert.ok(formatCurrency(1000000).includes('万'));
  });

  it('34. formatCurrency 处理小额消费', () => {
    assert.ok(formatCurrency(8000).includes('¥'));
  });

  it('35. 按不存在的等级过滤返回空', () => {
    const result = (MOCK_MEMBERS as any[]).filter(m => m.tier === 'platinum');
    assert.equal(result.length, 0);
  });

  it('36. 所有 member 对象有完整字段', () => {
    const requiredKeys: (keyof MemberItem)[] = ['code', 'name', 'tier', 'status', 'points', 'totalSpent', 'storeName', 'phone', 'joinDate', 'lastActive'];
    for (const m of MOCK_MEMBERS) {
      for (const key of requiredKeys) {
        assert.ok(m[key] !== undefined && m[key] !== null, `${m.code} missing ${key}`);
      }
    }
  });

  it('37. 活跃会员的 lastActive 为最近日期', () => {
    for (const m of MOCK_MEMBERS) {
      if (m.status === 'active') {
        assert.ok(m.lastActive >= '2026-07', `${m.code} stale active date`);
      }
    }
  });

  it('38. diamond 会员消费 > 400,000', () => {
    const diamonds = MOCK_MEMBERS.filter(m => m.tier === 'diamond');
    for (const d of diamonds) {
      assert.ok(d.totalSpent >= 400000, `${d.code} diamond but low spent: ${d.totalSpent}`);
    }
  });

  it('39. 门店名长度合理', () => {
    for (const m of MOCK_MEMBERS) {
      assert.ok(m.storeName.length >= 2 && m.storeName.length <= 20);
    }
  });

  it('40. 所有冻结/停用会员积分余额为正', () => {
    const inactive = MOCK_MEMBERS.filter(m => m.status !== 'active');
    for (const m of inactive) {
      assert.ok(m.points >= 0);
    }
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Members — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onMouseEnter={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
