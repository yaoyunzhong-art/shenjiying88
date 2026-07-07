/**
 * [role]/page.test.ts — Page-level tests for admin-web role workbench detail page
 *
 * Pattern: L1 正例 + 反例 + 边界
 * Covers: server component export, data-level logic, role resolution, store scoping,
 *         capability entrypoint filtering, fallback resolution
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getAdminWorkbenchConsumerSnapshot,
  getRoleWorkbench,
  normalizeWorkbenchRoleKey,
} from '../../bootstrap';
import type { RoleWorkbenchContract } from '@m5/types';
import {
  accessMeta,
  buildCapabilityEntrypoints,
  isStoreScopedWorkbenchRole,
  loadStoreCapabilityAccessSnapshot,
  readinessMeta,
} from '../../lyt-capability-access';
import { fallbackRoleWorkbenches, fallbackWorkbenchMap } from '../../workbench-data';

// ─── Helpers (mirroring page logic) ──────────────────────────────────────

function resolveRoleWorkbench(role: string): RoleWorkbenchContract | undefined {
  const key = normalizeWorkbenchRoleKey(role);
  return fallbackWorkbenchMap[key];
}

async function getVisibleEntrypoints(
  storeId: string,
  role: string,
): Promise<ReturnType<typeof buildCapabilityEntrypoints>> {
  const wb = resolveRoleWorkbench(role);
  if (!wb) return [];
  if (!isStoreScopedWorkbenchRole(wb.role)) return [];
  const snapshot = await loadStoreCapabilityAccessSnapshot(storeId, {
    tenantId: 'tenant-001',
    brandId: 'brand-001',
    storeId,
  });
  if (!snapshot) return [];
  return buildCapabilityEntrypoints(storeId, snapshot.capabilityAccess).filter(
    (e) => e.visibility === 'visible',
  );
}

// ─── 正例 ────────────────────────────────────────────────────────────────

describe('[role] 正例 (positive)', () => {
  it('page default export should be an async function (server component)', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function', 'default export is a function');
    // Server component returns a Promise (async)
    const result = mod.default({ params: Promise.resolve({ role: 'store_manager' }) });
    // Cannot render in Node env, but it should be a Promise (thenable)
    assert.ok(result instanceof Promise || (result && typeof (result as any).then === 'function'),
      'server component call should return a Promise');
  });

  it('should resolve role workbench for all 10 known roles', async () => {
    const roles = [
      'super_admin', 'tenant_admin', 'brand_manager', 'store_manager',
      'guide', 'cashier', 'operations', 'finance', 'warehouse', 'coach',
    ];
    for (const role of roles) {
      const wb = await getRoleWorkbench(role);
      assert.ok(wb, `${role} should resolve`);
      assert.equal(typeof wb.title, 'string', `${role} title is string`);
      assert.equal(typeof wb.description, 'string', `${role} description is string`);
      assert.ok(wb.navItems.length >= 1, `${role} has navItems`);
    }
  });

  it('should identify all store-scoped roles correctly', () => {
    const storeScoped = ['STORE_MANAGER', 'GUIDE', 'CASHIER'];
    const nonStoreScoped = ['SUPER_ADMIN', 'TENANT_ADMIN', 'BRAND_MANAGER', 'OPERATIONS', 'FINANCE', 'WAREHOUSE', 'COACH'];
    for (const role of storeScoped) {
      assert.equal(isStoreScopedWorkbenchRole(role), true, `${role} is store-scoped`);
    }
    for (const role of nonStoreScoped) {
      assert.equal(isStoreScopedWorkbenchRole(role), false, `${role} is not store-scoped`);
    }
  });

  it('should build visible entrypoints for store-manager role', async () => {
    const entries = await getVisibleEntrypoints('store-001', 'store_manager');
    assert.ok(Array.isArray(entries));
    for (const e of entries) {
      assert.equal(e.visibility, 'visible');
      assert.ok(typeof e.key === 'string', 'entry key is string');
      assert.ok(e.access in accessMeta, `entry access ${e.access} is valid`);
      assert.ok(e.readiness in readinessMeta, `entry readiness ${e.readiness} is valid`);
    }
  });

  it('should build visible entrypoints for cashier role', async () => {
    const entries = await getVisibleEntrypoints('store-002', 'cashier');
    assert.ok(Array.isArray(entries));
    for (const e of entries) {
      assert.equal(e.visibility, 'visible');
      assert.ok(typeof e.actionLabel === 'string' || typeof e.hint === 'string');
    }
  });

  it('non-store-scoped role should return empty entrypoints', async () => {
    const entries = await getVisibleEntrypoints('store-001', 'super_admin');
    assert.equal(entries.length, 0, 'super_admin has no store-scoped entrypoints');
  });

  it('consumer snapshot should have expected structure', async () => {
    const snapshot = await getAdminWorkbenchConsumerSnapshot();
    assert.ok(snapshot, 'snapshot exists');
    assert.ok(snapshot.consumerDescriptor, 'has consumerDescriptor');
    assert.ok(snapshot.governance, 'has governance');
    assert.ok(snapshot.tenantContext, 'has tenantContext');
    assert.ok(typeof snapshot.consumerDescriptor.responsibility === 'string');
    assert.ok(Array.isArray(snapshot.consumerDescriptor.dependsOn));
    assert.ok(Array.isArray(snapshot.governance.alerts));
  });

  it('fallback workbench data has 10 role entries', () => {
    assert.equal(fallbackRoleWorkbenches.length, 10);
  });

  it('each workbench has valid navItems with key, label, description, href', () => {
    for (const wb of fallbackRoleWorkbenches) {
      for (const item of wb.navItems) {
        assert.ok(typeof item.key === 'string', `${wb.role} item key`);
        assert.ok(typeof item.label === 'string', `${wb.role} item label`);
        assert.ok(typeof item.href === 'string', `${wb.role} item href`);
        assert.ok(item.href.startsWith('/'), `${wb.role} href starts with /`);
      }
    }
  });
});

// ─── 反例 ────────────────────────────────────────────────────────────────

describe('[role] 反例 (negative)', () => {
  it('unknown role should trigger notFound (getRoleWorkbench returns undefined)', async () => {
    const wb = await getRoleWorkbench('nonexistent_role');
    assert.equal(wb, undefined);
  });

  it('unknown role in resolveRoleWorkbench returns undefined', () => {
    const wb = resolveRoleWorkbench('robot_overlord');
    assert.equal(wb, undefined);
  });

  it('empty string role does not match any workbench', async () => {
    const wb = await getRoleWorkbench('');
    assert.equal(wb, undefined);
  });

  it('unknown store-scoped role returns empty entrypoints', async () => {
    const entries = await getVisibleEntrypoints('store-001', 'nonexistent_store_role');
    assert.equal(entries.length, 0);
  });
});

// ─── 边界 ────────────────────────────────────────────────────────────────

describe('[role] 边界 (boundary)', () => {
  it('case-insensitive role resolution for GUIDE', async () => {
    const wb1 = await getRoleWorkbench('guide');
    const wb2 = await getRoleWorkbench('GUIDE');
    const wb3 = await getRoleWorkbench('Guide');
    assert.ok(wb1 && wb2 && wb3, 'all case variants resolve');
    assert.equal(wb1.role, 'GUIDE');
    assert.equal(wb2.role, 'GUIDE');
    assert.equal(wb3.role, 'GUIDE');
  });

  it('hyphenated role normalizes correctly (brand-manager)', async () => {
    const wb = await getRoleWorkbench('brand-manager');
    assert.ok(wb, 'brand-manager resolves');
    assert.equal(wb!.role, 'BRAND_MANAGER');
  });

  it('fallbackWorkbenchMap resolves all roles by normalized key', () => {
    const roles = ['super_admin', 'tenant_admin', 'brand_manager', 'store_manager',
      'guide', 'cashier', 'operations', 'finance', 'warehouse', 'coach'];
    for (const role of roles) {
      const contract = fallbackWorkbenchMap[role];
      assert.ok(contract, `${role} in fallbackWorkbenchMap`);
      assert.equal(normalizeWorkbenchRoleKey(contract.role), role);
    }
  });

  it('PC workbenches have ≥2 navItems, PAD ≥1', () => {
    for (const wb of fallbackRoleWorkbenches) {
      if (wb.channel === 'PC') {
        assert.ok(wb.navItems.length >= 2, `${wb.role} PC navItems >=2`);
      } else {
        assert.ok(wb.navItems.length >= 1, `${wb.role} PAD navItems >=1`);
      }
    }
  });

  it('unique role+channel combinations across all fallback workbenches', () => {
    const seen = new Set<string>();
    for (const wb of fallbackRoleWorkbenches) {
      const key = `${wb.role}-${wb.channel}`;
      assert.ok(!seen.has(key), `no duplicate ${key}`);
      seen.add(key);
    }
  });

  it('capability entrypoint access and readiness values are valid', async () => {
    const entries = await getVisibleEntrypoints('store-001', 'store_manager');
    const accessKeys = Object.keys(accessMeta);
    const readinessKeys = Object.keys(readinessMeta);
    for (const e of entries) {
      assert.ok(accessKeys.includes(e.access as any), `access ${e.access} is valid`);
      assert.ok(readinessKeys.includes(e.readiness as any), `readiness ${e.readiness} is valid`);
    }
  });

  it('consumer snapshot governance has required fields', async () => {
    const snapshot = await getAdminWorkbenchConsumerSnapshot();
    assert.ok(typeof snapshot.governance.summary.approvalsPending === 'number');
    assert.ok(typeof snapshot.governance.summary.highRiskAudits === 'number');
    assert.ok(Array.isArray(snapshot.governance.topRisks));
    assert.ok(Array.isArray(snapshot.governance.alerts));
  });
});
