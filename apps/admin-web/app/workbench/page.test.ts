/**
 * workbench/page.test.ts — Page-level tests for the Workbench role page.
 * Tests fallback data integrity, role resolution, consumer snapshot structure,
 * normalization, and capability access filtering.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: workbench-data.ts, bootstrap.ts, workbench/[role]/page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import type { RoleWorkbenchContract } from '@m5/types';
import { normalizeWorkbenchRoleKey } from '../bootstrap';

// ---- Page-level helpers (mirror workbench/[role]/page.tsx logic) ----

function isStoreScopedWorkbenchRole(role: string): boolean {
  return (
    role === 'STORE_MANAGER' ||
    role === 'GUIDE' ||
    role === 'CASHIER' ||
    role === 'WAREHOUSE' ||
    role === 'COACH'
  );
}

function findRoleWorkbench(
  workbenches: RoleWorkbenchContract[],
  role: string,
): RoleWorkbenchContract | undefined {
  const normalized = normalizeWorkbenchRoleKey(role);
  return workbenches.find((item) => normalizeWorkbenchRoleKey(item.role) === normalized);
}

// ---- 正例 ----

describe('workbench-page: 正例 (positive cases)', () => {
  describe('fallback data integrity', () => {
    it('fallbackRoleWorkbenches should contain 10 roles', async () => {
      const { fallbackRoleWorkbenches } = await import('../workbench-data');
      assert.strictEqual(fallbackRoleWorkbenches.length, 10);
    });

    it('each workbench should have required properties', async () => {
      const { fallbackRoleWorkbenches } = await import('../workbench-data');
      for (const wb of fallbackRoleWorkbenches) {
        assert.ok(typeof wb.role === 'string', `${wb.role} missing role`);
        assert.ok(['PC', 'PAD'].includes(wb.channel), `${wb.role} invalid channel: ${wb.channel}`);
        assert.ok(typeof wb.title === 'string' && wb.title.length > 0, `${wb.role} missing title`);
        assert.ok(typeof wb.description === 'string', `${wb.role} missing description`);
        assert.ok(Array.isArray(wb.navItems), `${wb.role} missing navItems`);
        assert.ok(wb.navItems.length > 0, `${wb.role} has empty navItems`);
      }
    });

    it('PC and PAD workbenches should each contain known roles', async () => {
      const { fallbackRoleWorkbenches } = await import('../workbench-data');
      const pcRoles = new Set(fallbackRoleWorkbenches.filter((w) => w.channel === 'PC').map((w) => w.role));
      const padRoles = new Set(fallbackRoleWorkbenches.filter((w) => w.channel === 'PAD').map((w) => w.role));

      // All 10 roles must be covered by PC or PAD
      assert.strictEqual(pcRoles.size + padRoles.size, 10);
    });
  });

  describe('fallbackWorkbenchMap', () => {
    it('should resolve all 10 roles by lowercased key', async () => {
      const { fallbackWorkbenchMap } = await import('../workbench-data');
      const roles = ['super_admin', 'tenant_admin', 'brand_manager', 'store_manager', 'guide', 'cashier', 'operations', 'finance', 'warehouse', 'coach'];
      for (const role of roles) {
        const contract = fallbackWorkbenchMap[role];
        assert.ok(contract, `${role} should resolve from fallbackWorkbenchMap`);
        assert.strictEqual(contract.role, role.toUpperCase());
      }
    });

    it('fallbackWorkbenchMap should provide fallback resolution within bootstrap', async () => {
      const { getRoleWorkbench } = await import('../bootstrap');
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
      try {
        const wb = await getRoleWorkbench('guide');
        assert.ok(wb, 'guide should resolve via fallbackWorkbenchMap');
        assert.strictEqual(wb!.role, 'GUIDE');
        assert.ok(wb!.navItems.length > 0);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('normalizeWorkbenchRoleKey', () => {
    it('should normalize all known role formats', () => {
      assert.strictEqual(normalizeWorkbenchRoleKey('SUPER_ADMIN'), 'super_admin');
      assert.strictEqual(normalizeWorkbenchRoleKey('super_admin'), 'super_admin');
      assert.strictEqual(normalizeWorkbenchRoleKey('Tenant-Admin'), 'tenant_admin');
      // Spaces are preserved (only hyphens become underscores)
      assert.strictEqual(normalizeWorkbenchRoleKey('store manager'), 'store manager');
    });
  });

  describe('isStoreScopedWorkbenchRole', () => {
    it('should identify store-scoped roles', () => {
      assert.strictEqual(isStoreScopedWorkbenchRole('STORE_MANAGER'), true);
      assert.strictEqual(isStoreScopedWorkbenchRole('GUIDE'), true);
      assert.strictEqual(isStoreScopedWorkbenchRole('CASHIER'), true);
      assert.strictEqual(isStoreScopedWorkbenchRole('WAREHOUSE'), true);
      assert.strictEqual(isStoreScopedWorkbenchRole('COACH'), true);
    });

    it('should not flag non-store-scoped roles', () => {
      assert.strictEqual(isStoreScopedWorkbenchRole('SUPER_ADMIN'), false);
      assert.strictEqual(isStoreScopedWorkbenchRole('TENANT_ADMIN'), false);
      assert.strictEqual(isStoreScopedWorkbenchRole('BRAND_MANAGER'), false);
      assert.strictEqual(isStoreScopedWorkbenchRole('OPERATIONS'), false);
      assert.strictEqual(isStoreScopedWorkbenchRole('FINANCE'), false);
    });
  });

  describe('findRoleWorkbench', () => {
    it('should find workbench by role name (case-insensitive)', async () => {
      const { fallbackRoleWorkbenches } = await import('../workbench-data');
      assert.ok(findRoleWorkbench(fallbackRoleWorkbenches, 'GUIDE'));
      assert.ok(findRoleWorkbench(fallbackRoleWorkbenches, 'guide'));
      assert.ok(findRoleWorkbench(fallbackRoleWorkbenches, 'STORE_MANAGER'));
    });
  });

  describe('consumer descriptor structure', () => {
    it('fallbackWorkbenchConsumerDescriptor should have all expected fields', async () => {
      const { fallbackWorkbenchConsumerDescriptor } = await import('../workbench-data');
      assert.strictEqual(fallbackWorkbenchConsumerDescriptor.consumer, 'workbench');
      assert.ok(fallbackWorkbenchConsumerDescriptor.dependsOn.length >= 5);
      assert.ok(fallbackWorkbenchConsumerDescriptor.highRiskEntrypoints.length >= 2);
      assert.ok(fallbackWorkbenchConsumerDescriptor.recommendedSequence.length >= 2);
      assert.ok(fallbackWorkbenchConsumerDescriptor.governanceTouchpoints.length >= 1);
    });
  });
});

// ---- 反例 ----

describe('workbench-page: 反例 (negative cases)', () => {
  it('fallbackWorkbenchMap should return undefined for unknown role', async () => {
    const { fallbackWorkbenchMap } = await import('../workbench-data');
    assert.strictEqual(fallbackWorkbenchMap['robot_overlord'], undefined);
  });

  it('getRoleWorkbench should return undefined for nonexistent role', async () => {
    const { getRoleWorkbench } = await import('../bootstrap');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const wb = await getRoleWorkbench('NONEXISTENT');
      assert.strictEqual(wb, undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('findRoleWorkbench should return undefined for nonexistent role', async () => {
    const { fallbackRoleWorkbenches } = await import('../workbench-data');
    assert.strictEqual(findRoleWorkbench(fallbackRoleWorkbenches, 'ROBOT_OVERLORD'), undefined);
  });
});

// ---- 边界 ----

describe('workbench-page: 边界 (boundary cases)', () => {
  it('getRoleWorkbench with hyphenated role should normalize correctly', async () => {
    const { getRoleWorkbench } = await import('../bootstrap');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const wb = await getRoleWorkbench('brand-manager');
      assert.ok(wb, 'brand-manager should resolve');
      assert.strictEqual(wb!.role, 'BRAND_MANAGER');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('normalizeWorkbenchRoleKey with special characters should handle gracefully', () => {
    assert.strictEqual(normalizeWorkbenchRoleKey('super!@#admin'), 'super!@#admin');
  });

  it('fallback workbenches should have unique role + channel combinations', async () => {
    const { fallbackRoleWorkbenches } = await import('../workbench-data');
    const seen = new Set<string>();
    for (const wb of fallbackRoleWorkbenches) {
      const key = `${wb.role}-${wb.channel}`;
      assert.ok(!seen.has(key), `Duplicate ${key}`);
      seen.add(key);
    }
  });

  it('each PC workbench should have at least 2 navItems', async () => {
    const { fallbackRoleWorkbenches } = await import('../workbench-data');
    const pc = fallbackRoleWorkbenches.filter((w) => w.channel === 'PC');
    for (const wb of pc) {
      assert.ok(wb.navItems.length >= 2, `${wb.role} PC has fewer than 2 navItems`);
    }
  });
});
