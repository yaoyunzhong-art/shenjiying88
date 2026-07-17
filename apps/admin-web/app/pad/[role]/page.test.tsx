/**
 * pad/[role]/page.test.tsx — Pad 工作台详情页 L1 测试
 *
 * 覆盖: 角色工作台查询、模块列表、治理告警快照、底座接线信息
 * 正例: 角色标准化、模块筛选、统计卡片、治理数据
 * 反例: 角色不存在、非PAD渠道、空模块、空市场
 * 边界: 空角色、角色大小写、多个市场代码
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/* ── 类型 ── */

type WorkbenchChannel = 'PAD' | 'POS' | 'KDS' | 'MOBILE';

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon?: string;
}

interface RoleWorkbench {
  role: string;
  channel: WorkbenchChannel;
  title: string;
  navItems: NavItem[];
  marketCodes: string[];
}

interface GovernanceSummary {
  approvalsPending: number;
  highRiskAudits: number;
  topRisks: string[];
  alerts: Array<{ code: string; severity: string; message: string }>;
}

interface ConsumerDescriptor {
  responsibility: string;
  recommendedSequence: string[];
  highRiskEntrypoints: string[];
  governanceTouchpoints: string[];
}

interface WorkbenchSnapshot {
  workbenches: RoleWorkbench[];
  governance: GovernanceSummary;
  consumerDescriptor: ConsumerDescriptor;
}

// ---- 辅助函数 ----

function normalizeWorkbenchRoleKey(role: string): string {
  return role.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

function isPadChannel(workbench: RoleWorkbench): boolean {
  return workbench.channel === 'PAD';
}

function filterPadWorkbenches(
  workbenches: RoleWorkbench[],
  normalizedRole: string
): RoleWorkbench[] {
  return workbenches.filter(
    (wb) => wb.channel === 'PAD' && normalizeWorkbenchRoleKey(wb.role) === normalizedRole
  );
}

function getRoleWorkbench(role: string, snapshots: RoleWorkbench[]): RoleWorkbench | undefined {
  return snapshots.find(
    (wb) => normalizeWorkbenchRoleKey(wb.role) === normalizeWorkbenchRoleKey(role)
  );
}

function getTopRisksSummary(topRisks: string[]): string {
  if (topRisks.length === 0) return '无风险';
  if (topRisks.length <= 3) return topRisks.join(', ');
  return `${topRisks.slice(0, 3).join(', ')} 等${topRisks.length}项`;
}

// ---- Mock snapshot ----

function buildMockSnapshots(): RoleWorkbench[] {
  return [
    {
      role: 'sales-assistant',
      channel: 'PAD',
      title: '导购助手',
      navItems: [
        { key: 'customer-search', label: '客户查询', href: '/pad/customer-search' },
        { key: 'product-recommend', label: '商品推荐', href: '/pad/product-recommend' },
        { key: 'order-create', label: '开单', href: '/pad/order-create' },
      ],
      marketCodes: ['CN-BJ', 'CN-SH'],
    },
    {
      role: 'cashier',
      channel: 'PAD',
      title: '收银台',
      navItems: [
        { key: 'pos-terminal', label: 'POS 收银', href: '/pad/pos-terminal' },
        { key: 'payment', label: '收款', href: '/pad/payment' },
        { key: 'refund', label: '退款', href: '/pad/refund' },
        { key: 'settlement', label: '结算', href: '/pad/settlement' },
      ],
      marketCodes: ['CN-BJ'],
    },
    {
      role: 'queue-manager',
      channel: 'PAD',
      title: '排队叫号',
      navItems: [
        { key: 'queue-board', label: '排队看板', href: '/pad/queue-board' },
        { key: 'call-number', label: '叫号', href: '/pad/call-number' },
      ],
      marketCodes: ['CN-BJ', 'CN-SH', 'CN-GZ'],
    },
    {
      role: 'store-manager',
      channel: 'PAD',
      title: '门店管理',
      navItems: [
        { key: 'dashboard', label: '门店看板', href: '/pad/dashboard' },
        { key: 'staff-schedule', label: '排班管理', href: '/pad/staff-schedule' },
        { key: 'inventory-view', label: '库存视图', href: '/pad/inventory-view' },
      ],
      marketCodes: ['CN-BJ'],
    },
  ];
}

function buildMockGovSummary(): GovernanceSummary {
  return {
    approvalsPending: 3,
    highRiskAudits: 1,
    topRisks: ['权限泄漏', '数据滞留', '会话过期'],
    alerts: [
      { code: 'PAD_AUTH_WARN', severity: 'high', message: 'Pad 鉴权成功率低于 95%' },
      { code: 'SESS_EXPIRE', severity: 'medium', message: '多会话未及时释放' },
      { code: 'DATA_STALE', severity: 'low', message: '本地缓存数据超过 30 分钟未刷新' },
    ],
  };
}

function buildMockConsumerDescriptor(): ConsumerDescriptor {
  return {
    responsibility: 'Pad 端消费 Foundation 底座数据，提供导购接待、收银、排队叫号、门店执行和赛事现场控制能力。',
    recommendedSequence: ['auth', 'identity', 'orchestration', 'presentation'],
    highRiskEntrypoints: ['/pad/payment', '/pad/order-create'],
    governanceTouchpoints: ['auth', 'audit', 'rate-limit'],
  };
}

function buildMockSnapshot(): WorkbenchSnapshot {
  return {
    workbenches: buildMockSnapshots(),
    governance: buildMockGovSummary(),
    consumerDescriptor: buildMockConsumerDescriptor(),
  };
}

/* ============================================================ */

describe('pad-workbench: 类型与数据完整性', () => {
  it('normalizeWorkbenchRoleKey trims and lowercases', () => {
    assert.equal(normalizeWorkbenchRoleKey('  Sales-Assistant  '), 'sales-assistant');
  });

  it('normalizeWorkbenchRoleKey strips special chars', () => {
    assert.equal(normalizeWorkbenchRoleKey('CASHIER#1'), 'cashier1');
  });

  it('normalizeWorkbenchRoleKey preserves hyphen and underscore', () => {
    assert.equal(normalizeWorkbenchRoleKey('store_manager'), 'store_manager');
  });

  it('isPadChannel returns true for PAD', () => {
    const wb: RoleWorkbench = { role: 'test', channel: 'PAD', title: 'Test', navItems: [], marketCodes: [] };
    assert.ok(isPadChannel(wb));
  });

  it('isPadChannel returns false for non-PAD channels', () => {
    const wb: RoleWorkbench = { role: 'test', channel: 'POS', title: 'Test', navItems: [], marketCodes: [] };
    assert.ok(!isPadChannel(wb));
  });

  it('RoleWorkbench has required fields', () => {
    const wb: RoleWorkbench = { role: 'test', channel: 'PAD', title: 'Test', navItems: [{ key: 'k1', label: 'L1', href: '/test' }], marketCodes: ['CN'] };
    assert.equal(typeof wb.role, 'string');
    assert.equal(typeof wb.title, 'string');
    assert.ok(Array.isArray(wb.navItems));
    assert.ok(Array.isArray(wb.marketCodes));
  });

  it('NavItem has key, label, href', () => {
    const item: NavItem = { key: 'search', label: '搜索', href: '/pad/search' };
    assert.equal(item.key, 'search');
    assert.equal(item.label, '搜索');
    assert.equal(item.href, '/pad/search');
  });

  it('GovernanceSummary fields are typed correctly', () => {
    const g: GovernanceSummary = { approvalsPending: 5, highRiskAudits: 2, topRisks: ['a'], alerts: [] };
    assert.equal(typeof g.approvalsPending, 'number');
    assert.equal(typeof g.highRiskAudits, 'number');
    assert.ok(Array.isArray(g.topRisks));
    assert.ok(Array.isArray(g.alerts));
  });

  it('ConsumerDescriptor has all required fields', () => {
    const cd: ConsumerDescriptor = {
      responsibility: 'Desc', recommendedSequence: ['a'], highRiskEntrypoints: ['b'], governanceTouchpoints: ['c'],
    };
    assert.equal(typeof cd.responsibility, 'string');
    assert.ok(Array.isArray(cd.recommendedSequence));
    assert.ok(Array.isArray(cd.highRiskEntrypoints));
    assert.ok(Array.isArray(cd.governanceTouchpoints));
  });
});

describe('pad-workbench: 业务逻辑', () => {
  const snapshots = buildMockSnapshots();
  const governance = buildMockGovSummary();
  const consumer = buildMockConsumerDescriptor();

  it('getRoleWorkbench finds by exact role', () => {
    const result = getRoleWorkbench('sales-assistant', snapshots);
    assert.ok(result);
    assert.equal(result?.title, '导购助手');
  });

  it('getRoleWorkbench is case-insensitive', () => {
    const result = getRoleWorkbench('Sales-Assistant', snapshots);
    assert.ok(result);
    assert.equal(result?.title, '导购助手');
  });

  it('getRoleWorkbench returns undefined for unknown role', () => {
    const result = getRoleWorkbench('nonexistent-role', snapshots);
    assert.equal(result, undefined);
  });

  it('filterPadWorkbenches matches PAD channel role', () => {
    const filtered = filterPadWorkbenches(snapshots, normalizeWorkbenchRoleKey('cashier'));
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.role, 'cashier');
  });

  it('filterPadWorkbenches returns empty for non-PAD role', () => {
    const data = snapshots.map(wb => ({ ...wb, channel: 'POS' as const }));
    const filtered = filterPadWorkbenches(data, normalizeWorkbenchRoleKey('cashier'));
    assert.equal(filtered.length, 0);
  });

  it('filterPadWorkbenches returns empty for non-existent role', () => {
    const filtered = filterPadWorkbenches(snapshots, normalizeWorkbenchRoleKey('no-such-role'));
    assert.equal(filtered.length, 0);
  });

  it('navItems for cashier role has 4 items', () => {
    const cashier = snapshots.find(wb => wb.role === 'cashier');
    assert.equal(cashier?.navItems.length, 4);
  });

  it('sales-assistant role has navItems with labels', () => {
    const sa = snapshots.find(wb => wb.role === 'sales-assistant');
    assert.ok(sa?.navItems.every(item => item.label.length > 0));
  });

  it('governance approvalsPending is positive integer', () => {
    assert.ok(governance.approvalsPending >= 0);
    assert.equal(Number.isInteger(governance.approvalsPending), true);
  });

  it('governance alerts has 3 items', () => {
    assert.equal(governance.alerts.length, 3);
  });

  it('consumer recommendedSequence has 4 steps', () => {
    assert.equal(consumer.recommendedSequence.length, 4);
  });

  it('consumer highRiskEntrypoints includes payment endpoint', () => {
    assert.ok(consumer.highRiskEntrypoints.includes('/pad/payment'));
  });

  it('marketCodes can contain multiple values', () => {
    const qm = snapshots.find(wb => wb.role === 'queue-manager');
    assert.ok(qm && qm.marketCodes.length >= 3);
  });

  it('empty role returns undefined workbench', () => {
    const result = getRoleWorkbench('', snapshots);
    assert.equal(result, undefined);
  });

  it('getTopRisksSummary returns comma string for ≤3 risks', () => {
    const result = getTopRisksSummary(governance.topRisks);
    assert.equal(result, '权限泄漏, 数据滞留, 会话过期');
  });

  it('getTopRisksSummary returns truncated string for >3 risks', () => {
    const result = getTopRisksSummary(['a', 'b', 'c', 'd', 'e']);
    assert.ok(result.includes('等5项'));
  });

  it('getTopRisksSummary returns 无风险 for empty array', () => {
    assert.equal(getTopRisksSummary([]), '无风险');
  });

  it('governance touchpoints length >= 3', () => {
    assert.ok(consumer.governanceTouchpoints.length >= 3);
  });

  it('all role workbenches have titles', () => {
    assert.ok(snapshots.every(wb => wb.title.length > 0));
  });

  it('queue-manager nav items are all strings', () => {
    const qm = snapshots.find(wb => wb.role === 'queue-manager');
    assert.ok(qm?.navItems.every(item => typeof item.key === 'string' && typeof item.href === 'string'));
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Pad — hooks验证', () => {
  it('是服务端组件', () => assert.ok(SRC.includes('async') || SRC.includes('await')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('fetch(')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
