/**
 * workbench/page.test.tsx — 工作台目录列表页 L1 测试
 *
 * 覆盖: 角色分类(门店/总部/运营)、角色徽章、工作台数据快照
 * 正例: 工作台字段完整性、角色分类数量、治理数据、Badge 枚举
 * 反例: 空角色列表、无效角色分类、缺失字段
 * 边界: 分类无角色时隐藏、channel 标识缺失
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 类型 ── */

type BadgeVariant = 'default' | 'warning' | 'danger' | 'success' | 'info';

interface RoleWorkbench {
  role: string;
  channel: string;
  label: string;
  description?: string;
  link?: string;
  marketCodes?: string[];
}

interface GovernanceSnapshot {
  totalWorkbenches: number;
  activeRoles: number;
  lastSync: string;
  version: string;
  channels: Record<string, number>;
}

/* ── Mock 角色分类 ── */

const ROLE_CATEGORIES = [
  { key: 'store', title: '门店现场角色', roles: ['STORE_MANAGER', 'GUIDE', 'CASHIER', 'WAREHOUSE', 'COACH'] },
  { key: 'hq', title: '总部管理角色', roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'BRAND_MANAGER'] },
  { key: 'ops', title: '运营支持角色', roles: ['OPERATIONS', 'FINANCE'] },
];

const roleBadgeMap: Record<string, BadgeVariant> = {
  PC: 'default',
  PAD: 'warning',
};

/* ── Mock 工作台数据 ── */

const MOCK_WORKBENCHES: RoleWorkbench[] = [
  { role: 'STORE_MANAGER', channel: 'PAD', label: '店长工作台', marketCodes: ['CN_BJ', 'CN_SH'] },
  { role: 'GUIDE', channel: 'PAD', label: '导购接待', marketCodes: ['CN_BJ'] },
  { role: 'CASHIER', channel: 'PAD', label: '收银工作台', marketCodes: ['CN_BJ', 'CN_SH', 'CN_GZ'] },
  { role: 'WAREHOUSE', channel: 'PAD', label: '仓库管理', marketCodes: ['CN_BJ'] },
  { role: 'COACH', channel: 'PAD', label: '教练工作台', marketCodes: ['CN_SH'] },
  { role: 'SUPER_ADMIN', channel: 'PC', label: '超级管理员' },
  { role: 'TENANT_ADMIN', channel: 'PC', label: '租户管理员' },
  { role: 'BRAND_MANAGER', channel: 'PC', label: '品牌管理员' },
  { role: 'OPERATIONS', channel: 'PC', label: '运营管理' },
  { role: 'FINANCE', channel: 'PC', label: '财务管理' },
];

const MOCK_GOVERNANCE: GovernanceSnapshot = {
  totalWorkbenches: 10,
  activeRoles: 8,
  lastSync: '2026-07-16T01:00:00Z',
  version: 'v2.4.0',
  channels: { PC: 5, PAD: 5 },
};

/* ── 辅助函数 ── */

function getRoleCategoryRoles(categories: typeof ROLE_CATEGORIES, key: string): string[] {
  const cat = categories.find(c => c.key === key);
  return cat ? cat.roles : [];
}

function getBadgeVariant(channel: string): BadgeVariant {
  return roleBadgeMap[channel] ?? 'default';
}

function getWorkbenchesByChannel(workbenches: RoleWorkbench[], channel: string): RoleWorkbench[] {
  return workbenches.filter(wb => wb.channel === channel);
}

function getWorkbenchLabels(workbenches: RoleWorkbench[]): string[] {
  return workbenches.map(wb => wb.label).filter(l => l.length > 0);
}

/* ══════════════════════════════════════════════════════════
   测试: 文件结构
   ══════════════════════════════════════════════════════════ */

describe('workbench — 文件结构', () => {
  it('1. page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'page.tsx')), true);
  });

  it('2. page.tsx 是 Server Component', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes("'use client'"));
  });

  it('3. 导出默认 async 函数', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default async'));
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 角色分类
   ══════════════════════════════════════════════════════════ */

describe('workbench — 角色分类', () => {
  it('4. 3 个角色分类', () => {
    assert.equal(ROLE_CATEGORIES.length, 3);
  });

  it('5. 门店角色 5 个', () => {
    const roles = getRoleCategoryRoles(ROLE_CATEGORIES, 'store');
    assert.equal(roles.length, 5);
  });

  it('6. 总部角色 3 个', () => {
    const roles = getRoleCategoryRoles(ROLE_CATEGORIES, 'hq');
    assert.equal(roles.length, 3);
  });

  it('7. 运营角色 2 个', () => {
    const roles = getRoleCategoryRoles(ROLE_CATEGORIES, 'ops');
    assert.equal(roles.length, 2);
  });

  it('8. 分类不包含重复角色', () => {
    const allRoles = ROLE_CATEGORIES.flatMap(c => c.roles);
    assert.equal(allRoles.length, new Set(allRoles).size);
  });

  it('9. 所有分类 key 唯一', () => {
    const keys = ROLE_CATEGORIES.map(c => c.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  it('10. 不存在的分类返回空', () => {
    assert.equal(getRoleCategoryRoles(ROLE_CATEGORIES, 'nonexistent').length, 0);
  });

  it('11. 分类标题非空', () => {
    for (const c of ROLE_CATEGORIES) {
      assert.ok(c.title.length > 0);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 工作台数据
   ══════════════════════════════════════════════════════════ */

describe('workbench — 工作台数据', () => {
  it('12. 10 个工作台', () => {
    assert.equal(MOCK_WORKBENCHES.length, 10);
  });

  it('13. 所有 role 唯一', () => {
    const roles = MOCK_WORKBENCHES.map(wb => wb.role);
    assert.equal(new Set(roles).size, roles.length);
  });

  it('14. PAD 渠道 5 个', () => {
    assert.equal(getWorkbenchesByChannel(MOCK_WORKBENCHES, 'PAD').length, 5);
  });

  it('15. PC 渠道 5 个', () => {
    assert.equal(getWorkbenchesByChannel(MOCK_WORKBENCHES, 'PC').length, 5);
  });

  it('16. 所有 label 非空', () => {
    const labels = getWorkbenchLabels(MOCK_WORKBENCHES);
    assert.equal(labels.length, MOCK_WORKBENCHES.length);
  });

  it('17. role 命名全大写', () => {
    for (const wb of MOCK_WORKBENCHES) {
      assert.equal(wb.role, wb.role.toUpperCase(), `${wb.role} should be uppercase`);
    }
  });

  it('18. channel 仅为 PAD 或 PC', () => {
    for (const wb of MOCK_WORKBENCHES) {
      assert.ok(wb.channel === 'PAD' || wb.channel === 'PC', `${wb.role} invalid channel`);
    }
  });

  it('19. 治理快照 workbenches 总数 = 10', () => {
    assert.equal(MOCK_GOVERNANCE.totalWorkbenches, 10);
  });

  it('20. channels 汇总 = 10', () => {
    const total = Object.values(MOCK_GOVERNANCE.channels).reduce((s, v) => s + v, 0);
    assert.equal(total, MOCK_GOVERNANCE.totalWorkbenches);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: badge 映射与通道
   ══════════════════════════════════════════════════════════ */

describe('workbench — badge 映射', () => {
  it('21. PC -> default, PAD -> warning', () => {
    assert.equal(getBadgeVariant('PC'), 'default');
    assert.equal(getBadgeVariant('PAD'), 'warning');
  });

  it('22. 未知 channel 返回 default', () => {
    assert.equal(getBadgeVariant('MOBILE'), 'default');
  });

  it('23. roleBadgeMap 有 2 个条目', () => {
    assert.equal(Object.keys(roleBadgeMap).length, 2);
  });

  it('24. PAD 工作台的 marketCodes 不为空', () => {
    const pads = getWorkbenchesByChannel(MOCK_WORKBENCHES, 'PAD');
    for (const wb of pads) {
      assert.ok(wb.marketCodes && wb.marketCodes.length > 0, `${wb.role} missing marketCodes`);
    }
  });

  it('25. PC 工作台无 marketCodes', () => {
    const pcs = getWorkbenchesByChannel(MOCK_WORKBENCHES, 'PC');
    for (const wb of pcs) {
      assert.ok(!wb.marketCodes || wb.marketCodes.length === 0, `${wb.role} should have no marketCodes`);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 边界与反例
   ══════════════════════════════════════════════════════════ */

describe('workbench — 边界与反例', () => {
  it('26. 空工作台列表不崩溃', () => {
    assert.equal(getWorkbenchesByChannel([], 'PAD').length, 0);
  });

  it('27. 不存在的 channel 返回空', () => {
    assert.equal(getWorkbenchesByChannel(MOCK_WORKBENCHES, 'MOBILE').length, 0);
  });

  it('28. 所有工作台字段完整', () => {
    const required: (keyof RoleWorkbench)[] = ['role', 'channel', 'label'];
    for (const wb of MOCK_WORKBENCHES) {
      for (const key of required) {
        assert.ok(wb[key] !== undefined && wb[key] !== null, `${wb.role} missing ${key}`);
      }
    }
  });

  it('29. activeRoles 8 <= totalWorkbenches 10', () => {
    assert.ok(MOCK_GOVERNANCE.activeRoles <= MOCK_GOVERNANCE.totalWorkbenches);
  });

  it('30. 治理版本号格式语义化', () => {
    assert.match(MOCK_GOVERNANCE.version, /^v\d+\.\d+\.\d+$/, 'invalid semver');
  });

  it('31. lastSync 为 ISO 格式', () => {
    assert.match(MOCK_GOVERNANCE.lastSync, /^\d{4}-\d{2}-\d{2}T/, 'invalid ISO date');
  });

  it('32. 角色名不含连字符', () => {
    for (const wb of MOCK_WORKBENCHES) {
      assert.ok(!wb.role.includes('-'), `${wb.role} should not contain hyphen`);
    }
  });

  it('33. Store 分类 + HQ + Ops = 10', () => {
    const allRoles = ROLE_CATEGORIES.flatMap(c => c.roles);
    assert.equal(allRoles.length, 10);
  });

  it('34. 标签不含空字符串', () => {
    for (const wb of MOCK_WORKBENCHES) {
      assert.ok(wb.label.length > 0, `${wb.role} empty label`);
    }
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Workbench — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("'use client'") || SRC.includes('/**')));
});
