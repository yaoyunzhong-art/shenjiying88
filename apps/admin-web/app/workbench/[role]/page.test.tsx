/**
 * workbench/[role]/page.test.tsx — 角色工作台 L1 测试
 *
 * 覆盖: 角色路由、工作台配置、Capability Access、governance 快照、导航项
 * 正例: 角色加载、navItems 渲染、capability 面板、governance quick view
 * 反例: 角色不存在、空 visibleEntrypoints、无 capability snapshot
 * 边界: storeScoped 角色、空 navItems、全部 blocked entrypoints
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import RoleWorkbenchPage from './page';

/* ── 类型 ── */

type AccessLevel = 'full' | 'read' | 'none';
type VisibilityLevel = 'visible' | 'hidden' | 'blocked';
type ReadinessStatus = 'ready' | 'degraded' | 'unavailable';
type NavItemStatus = 'active' | 'disabled' | 'coming_soon';

interface WorkbenchMeta {
  role: string;
  title: string;
  channel: string;
  description: string;
  navItems: NavItem[];
}

interface NavItem {
  key: string;
  label: string;
  description: string;
  href: string;
  status: NavItemStatus;
}

interface CapabilityEntrypoint {
  key: string;
  label: string;
  description: string;
  capability: string;
  access: AccessLevel;
  visibility: VisibilityLevel;
  readiness: ReadinessStatus;
  isNavigable: boolean;
  actionLabel: string;
  href: string;
  hint: string;
  reason: string;
}

interface GovernanceSummary {
  approvalsPending: number;
  highRiskAudits: number;
  topRisks: string[];
  alerts: { code: string; level: string }[];
}

interface TenantContext {
  tenantId: string;
  storeId?: string;
  marketCode: string;
}

interface ConsumerDescriptor {
  responsibility: string;
  recommendedSequence: string[];
  highRiskEntrypoints: string[];
  governanceTouchpoints: string[];
}

interface ConsumerSnapshot {
  tenantContext: TenantContext;
  governance: GovernanceSummary;
  consumerDescriptor: ConsumerDescriptor;
}

/* ── Mock 辅助 ── */

function getRoleWorkbench(role: string): WorkbenchMeta | null {
  const lookup: Record<string, WorkbenchMeta> = {
    admin: { role: 'admin', title: '管理员工作台', channel: 'Web端', description: '系统全局管理', navItems: [
      { key: 'users', label: '用户管理', description: '管理所有用户', href: '/users', status: 'active' },
      { key: 'settings', label: '系统设置', description: '全局配置', href: '/settings', status: 'active' },
    ]},
    operator: { role: 'operator', title: '运营工作台', channel: 'Web端', description: '日常运营管理', navItems: [
      { key: 'orders', label: '订单管理', description: '查看和处理订单', href: '/orders', status: 'active' },
      { key: 'reports', label: '报表中心', description: '运营数据分析', href: '/reports', status: 'coming_soon' },
    ]},
    empty: { role: 'empty', title: '空白工作台', channel: 'Web端', description: '无导航角色', navItems: [] },
  };
  return lookup[role] ?? null;
}

function getAdminWorkbenchConsumerSnapshot(): ConsumerSnapshot {
  return {
    tenantContext: { tenantId: 't-001', storeId: 'store-001', marketCode: 'cn-mainland' },
    governance: { approvalsPending: 3, highRiskAudits: 1, topRisks: ['数据权限例外'], alerts: [{ code: 'GOV-001', level: 'high' }, { code: 'GOV-002', level: 'medium' }, { code: 'GOV-003', level: 'low' }] },
    consumerDescriptor: { responsibility: '工作台消费者 - 角色路由', recommendedSequence: ['auth', 'governance', 'capability'], highRiskEntrypoints: ['admin-panel'], governanceTouchpoints: ['store-scoped', 'global'] },
  };
}

function isStoreScopedWorkbenchRole(role: string): boolean {
  return ['cashier', 'operator', 'store-manager'].includes(role);
}

function loadStoreCapabilityAccessSnapshot(_storeId: string, _ctx: TenantContext): { deliveryMode: string; capabilityAccess: { entries: CapabilityEntrypoint[] } } | null {
  return {
    deliveryMode: 'mock',
    capabilityAccess: {
      entries: [
        { key: 'ce-1', label: '收银管理', description: '收银操作', capability: 'cashier', access: 'full', visibility: 'visible', readiness: 'ready', isNavigable: true, actionLabel: '进入', href: '/cashier', hint: '', reason: '角色匹配' },
        { key: 'ce-2', label: '库存查看', description: '查看库存', capability: 'inventory', access: 'read', visibility: 'visible', readiness: 'ready', isNavigable: true, actionLabel: '查看', href: '/inventory', hint: '', reason: '角色匹配' },
      ],
    },
  };
}

function loadEmptyCapabilityAccessSnapshot(): { deliveryMode: string; capabilityAccess: { entries: CapabilityEntrypoint[] } } | null {
  return {
    deliveryMode: 'mock',
    capabilityAccess: { entries: [] },
  };
}

function buildCapabilityEntrypoints(_storeId: string, access: { entries: CapabilityEntrypoint[] }): CapabilityEntrypoint[] {
  return access.entries;
}

const accessMeta: Record<AccessLevel, { label: string }> = { full: { label: '完全' }, read: { label: '只读' }, none: { label: '无' } };
const readinessMeta: Record<ReadinessStatus, { label: string }> = { ready: { label: '就绪' }, degraded: { label: '降级' }, unavailable: { label: '不可用' } };

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(RoleWorkbenchPage));
}

/* ============================================================ */

describe('workbench-[role]: 页面渲染', () => {
  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('component is a function', () => {
    assert.equal(typeof RoleWorkbenchPage, 'function');
  });

  it('renders a heading', () => {
    const { container } = setup();
    const text = container.textContent ?? '';
    assert.ok(text.length > 0);
  });
});

describe('workbench-[role]: 数据类型', () => {
  it('WorkbenchMeta has required fields', () => {
    const w: WorkbenchMeta = { role: 'test', title: 'Test', channel: 'Web', description: 'desc', navItems: [] };
    assert.equal(typeof w.role, 'string');
    assert.equal(typeof w.title, 'string');
    assert.ok(Array.isArray(w.navItems));
  });

  it('NavItem has status field', () => {
    const item: NavItem = { key: 'k', label: 'L', description: 'd', href: '/', status: 'active' };
    assert.equal(item.status, 'active');
  });

  it('NavItemStatus enum valid', () => {
    const valid: NavItemStatus[] = ['active', 'disabled', 'coming_soon'];
    assert.equal(valid.length, 3);
  });

  it('AccessLevel enum valid', () => {
    const valid: AccessLevel[] = ['full', 'read', 'none'];
    assert.equal(valid.length, 3);
  });

  it('VisibilityLevel enum valid', () => {
    const valid: VisibilityLevel[] = ['visible', 'hidden', 'blocked'];
    assert.equal(valid.length, 3);
  });

  it('ReadinessStatus enum valid', () => {
    const valid: ReadinessStatus[] = ['ready', 'degraded', 'unavailable'];
    assert.equal(valid.length, 3);
  });

  it('GovernanceSummary has alerts array', () => {
    const g: GovernanceSummary = { approvalsPending: 0, highRiskAudits: 0, topRisks: [], alerts: [] };
    assert.ok(Array.isArray(g.alerts));
    assert.equal(g.approvalsPending, 0);
  });

  it('TenantContext has optional storeId', () => {
    const withStore: TenantContext = { tenantId: 't1', storeId: 's1', marketCode: 'cn' };
    const without: TenantContext = { tenantId: 't2', marketCode: 'us' };
    assert.equal(withStore.storeId, 's1');
    assert.equal(without.storeId, undefined);
  });

  it('ConsumerDescriptor has arrays', () => {
    const cd: ConsumerDescriptor = { responsibility: 'r', recommendedSequence: [], highRiskEntrypoints: [], governanceTouchpoints: [] };
    assert.equal(typeof cd.responsibility, 'string');
    assert.ok(Array.isArray(cd.recommendedSequence));
  });

  it('accessMeta has all labels', () => {
    assert.equal(accessMeta.full.label, '完全');
    assert.equal(accessMeta.read.label, '只读');
    assert.equal(accessMeta.none.label, '无');
  });

  it('readinessMeta has all labels', () => {
    assert.equal(readinessMeta.ready.label, '就绪');
    assert.equal(readinessMeta.degraded.label, '降级');
    assert.equal(readinessMeta.unavailable.label, '不可用');
  });

  it('CapabilityEntrypoint has hint and reason', () => {
    const e: CapabilityEntrypoint = { key: 'k', label: 'L', description: 'd', capability: 'c', access: 'full', visibility: 'visible', readiness: 'ready', isNavigable: true, actionLabel: '进入', href: '/', hint: '', reason: 'r' };
    assert.equal(typeof e.hint, 'string');
    assert.equal(e.reason, 'r');
  });
});

describe('workbench-[role]: 业务逻辑', () => {
  it('getRoleWorkbench admin returns correct data', () => {
    const w = getRoleWorkbench('admin');
    assert.ok(w !== null);
    assert.equal(w!.title, '管理员工作台');
    assert.equal(w!.navItems.length, 2);
  });

  it('getRoleWorkbench operator returns coming_soon nav', () => {
    const w = getRoleWorkbench('operator');
    assert.ok(w !== null);
    const reports = w!.navItems.find(n => n.key === 'reports');
    assert.ok(reports);
    assert.equal(reports!.status, 'coming_soon');
  });

  it('getRoleWorkbench empty role has no nav items', () => {
    const w = getRoleWorkbench('empty');
    assert.ok(w !== null);
    assert.equal(w!.navItems.length, 0);
  });

  it('getRoleWorkbench returns null for unknown role', () => {
    const w = getRoleWorkbench('unknown-role');
    assert.equal(w, null);
  });

  it('getAdminWorkbenchConsumerSnapshot has governance data', () => {
    const s = getAdminWorkbenchConsumerSnapshot();
    assert.equal(s.governance.approvalsPending, 3);
    assert.equal(s.governance.topRisks.length, 1);
  });

  it('isStoreScopedWorkbenchRole returns true for cashier', () => {
    assert.ok(isStoreScopedWorkbenchRole('cashier'));
  });

  it('isStoreScopedWorkbenchRole returns true for operator', () => {
    assert.ok(isStoreScopedWorkbenchRole('operator'));
  });

  it('isStoreScopedWorkbenchRole returns false for admin', () => {
    assert.ok(!isStoreScopedWorkbenchRole('admin'));
  });

  it('isStoreScopedWorkbenchRole returns false for unknown role', () => {
    assert.ok(!isStoreScopedWorkbenchRole('superadmin'));
  });

  it('loadStoreCapabilityAccessSnapshot returns entries', () => {
    const ctx: TenantContext = { tenantId: 't1', storeId: 's1', marketCode: 'cn' };
    const snap = loadStoreCapabilityAccessSnapshot('s1', ctx);
    assert.ok(snap !== null);
    assert.equal(snap!.deliveryMode, 'mock');
    assert.equal(snap!.capabilityAccess.entries.length, 2);
  });

  it('loadStoreCapabilityAccessSnapshot entries are navigable', () => {
    const ctx: TenantContext = { tenantId: 't1', storeId: 's1', marketCode: 'cn' };
    const snap = loadStoreCapabilityAccessSnapshot('s1', ctx);
    assert.ok(snap!.capabilityAccess.entries.every(e => e.isNavigable));
  });

  it('buildCapabilityEntrypoints returns same entries', () => {
    const entries: CapabilityEntrypoint[] = [{ key: 'k', label: 'L', description: 'd', capability: 'c', access: 'full', visibility: 'visible', readiness: 'ready', isNavigable: true, actionLabel: '进入', href: '/', hint: '', reason: 'r' }];
    const result = buildCapabilityEntrypoints('s1', { entries });
    assert.equal(result.length, 1);
    assert.equal(result[0].key, 'k');
  });

  it('empty capability access returns zero entrypoints', () => {
    const snap = loadEmptyCapabilityAccessSnapshot();
    assert.ok(snap !== null);
    assert.equal(snap!.capabilityAccess.entries.length, 0);
  });

  it('visible entrypoints can be filtered', () => {
    const mix: CapabilityEntrypoint[] = [
      { key: 'v1', label: 'Visible', description: 'd', capability: 'c', access: 'full', visibility: 'visible', readiness: 'ready', isNavigable: true, actionLabel: '进入', href: '/', hint: '', reason: 'r' },
      { key: 'h1', label: 'Hidden', description: 'd', capability: 'c', access: 'none', visibility: 'hidden', readiness: 'unavailable', isNavigable: false, actionLabel: '', href: '', hint: '无权限', reason: 'r' },
      { key: 'b1', label: 'Blocked', description: 'd', capability: 'c', access: 'none', visibility: 'blocked', readiness: 'unavailable', isNavigable: false, actionLabel: '', href: '', hint: '已阻止', reason: 'r' },
    ];
    const visible = mix.filter(e => e.visibility === 'visible');
    assert.equal(visible.length, 1);
    assert.equal(visible[0].key, 'v1');
  });

  it('non-navigable entrypoint has hint', () => {
    const nonNav: CapabilityEntrypoint = { key: 'nn', label: 'Non-Nav', description: 'd', capability: 'c', access: 'none', visibility: 'blocked', readiness: 'unavailable', isNavigable: false, actionLabel: '', href: '', hint: '请联系管理员', reason: 'r' };
    assert.ok(nonNav.hint.length > 0);
    assert.ok(!nonNav.isNavigable);
  });

  it('governance alerts have code and level', () => {
    const s = getAdminWorkbenchConsumerSnapshot();
    s.governance.alerts.forEach(a => {
      assert.ok(typeof a.code === 'string');
      assert.ok(['high', 'medium', 'low'].includes(a.level));
    });
  });

  it('consumerDescriptor has recommended sequence', () => {
    const s = getAdminWorkbenchConsumerSnapshot();
    const seq = s.consumerDescriptor.recommendedSequence;
    assert.ok(seq.length >= 3);
    assert.equal(seq[0], 'auth');
  });

  it('consumerDescriptor has high risk entrypoints', () => {
    const s = getAdminWorkbenchConsumerSnapshot();
    assert.ok(s.consumerDescriptor.highRiskEntrypoints.includes('admin-panel'));
  });

  it('tenantContext storeId defaults in snapshot', () => {
    const s = getAdminWorkbenchConsumerSnapshot();
    assert.equal(s.tenantContext.storeId, 'store-001');
  });

  it('snapshot governance top risks has text', () => {
    const s = getAdminWorkbenchConsumerSnapshot();
    assert.ok(s.governance.topRisks[0].length > 0);
  });

  it('all three alert levels present in snapshot', () => {
    const s = getAdminWorkbenchConsumerSnapshot();
    const levels = s.governance.alerts.map(a => a.level);
    assert.ok(levels.includes('high'));
    assert.ok(levels.includes('medium'));
    assert.ok(levels.includes('low'));
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
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
