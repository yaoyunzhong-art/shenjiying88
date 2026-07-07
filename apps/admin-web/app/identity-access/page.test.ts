/**
 * identity-access/page.test.ts — Page-level tests for the Identity Access workspace page.
 * Tests query parameter normalization, validation check summaries, fallback data integrity,
 * and page-level rendering helpers.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: identity-access-view-model.ts, page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { buildIdentityAccessHref, type IdentityAccessValidationResult } from '@m5/types';
import {
  formatIdentityCheckLabel,
  summarizeIdentityValidation,
  loadIdentityAccessWorkspace,
} from '../identity-access-view-model';

// ---- Page-level helpers ----

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

const SAMPLE_ACTOR = {
  actorId: 'admin-workbench',
  actorType: 'employee-user',
  actorName: 'Admin Workbench',
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  roles: ['tenant-admin'],
  permissions: ['identity-access:read', 'tenant:read'],
  authenticated: true,
  source: 'headers',
};

// ---- 正例 ----

describe('identity-access-page: 正例 (positive cases)', () => {
  describe('query parameter normalization', () => {
    it('should read scalar query params', () => {
      assert.strictEqual(readQueryParam('tenant-demo'), 'tenant-demo');
      assert.strictEqual(readQueryParam(undefined), undefined);
    });

    it('should extract first value from array param', () => {
      assert.strictEqual(readQueryParam(['brand-demo', 'brand-002']), 'brand-demo');
    });
  });

  describe('buildIdentityAccessHref', () => {
    it('returns /identity-access for empty query', () => {
      assert.strictEqual(buildIdentityAccessHref(), '/identity-access');
    });

    it('includes all 4 scope params', () => {
      const href = buildIdentityAccessHref({
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-001',
        marketCode: 'cn-mainland',
      });
      assert.ok(href.includes('tenantId=tenant-demo'));
      assert.ok(href.includes('brandId=brand-demo'));
      assert.ok(href.includes('storeId=store-001'));
      assert.ok(href.includes('marketCode=cn-mainland'));
    });
  });

  describe('formatIdentityCheckLabel', () => {
    it('should label all check types correctly', () => {
      assert.strictEqual(formatIdentityCheckLabel('role'), '角色校验');
      assert.strictEqual(formatIdentityCheckLabel('permission'), '权限校验');
      assert.strictEqual(formatIdentityCheckLabel('tenant-scope'), '租户边界校验');
    });
  });

  describe('summarizeIdentityValidation', () => {
    it('should handle null result', () => {
      assert.strictEqual(summarizeIdentityValidation(null), '未执行');
    });

    it('should summarize role check', () => {
      const result: IdentityAccessValidationResult = {
        status: 'allowed',
        check: 'role',
        resolved: {
          authenticated: true,
          actor: SAMPLE_ACTOR,
          tenantContext: { tenantId: 'tenant-demo', brandId: 'brand-demo', storeId: 'store-001', marketCode: 'cn-mainland' },
          effectiveTenantId: 'tenant-demo',
          effectiveBrandId: 'brand-demo',
          effectiveStoreId: 'store-001',
          effectiveMarketCode: 'cn-mainland',
          roles: ['tenant-admin'],
          permissions: ['identity-access:read'],
        },
      };
      assert.strictEqual(summarizeIdentityValidation(result), '角色校验 · allowed');
    });

    it('should summarize permission check with action and scope', () => {
      const result: IdentityAccessValidationResult = {
        status: 'allowed',
        check: 'permission',
        authorization: {
          status: 'allowed',
          action: 'identity-access:read',
          resourceScope: { tenantId: 'tenant-demo' },
          actor: SAMPLE_ACTOR,
          permissionMatched: true,
          tenantScopeMatched: true,
          enforcedBy: ['IdentityAccessGuard'],
        },
      };
      const summary = summarizeIdentityValidation(result);
      assert.ok(summary.includes('权限校验'));
      assert.ok(summary.includes('identity-access:read'));
      assert.ok(summary.includes('tenant-demo'));
      assert.ok(summary.includes('allowed'));
    });

    it('should summarize tenant-scope check', () => {
      const result: IdentityAccessValidationResult = {
        status: 'allowed',
        check: 'tenant-scope',
        targetTenantId: 'tenant-demo',
        authorization: {
          status: 'allowed',
          action: 'tenant:read',
          resourceScope: { tenantId: 'tenant-demo' },
          actor: SAMPLE_ACTOR,
          permissionMatched: true,
          tenantScopeMatched: true,
          enforcedBy: ['fallback'],
        },
      };
      const summary = summarizeIdentityValidation(result);
      assert.ok(summary.includes('租户边界校验'));
      assert.ok(summary.includes('allowed'));
    });
  });

  describe('loadIdentityAccessWorkspace', () => {
    it('returns fallback when API fails', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
      try {
        const snapshot = await loadIdentityAccessWorkspace({ tenantId: 'tenant-demo' });
        assert.strictEqual(snapshot.deliveryMode, 'fallback');
        assert.strictEqual(snapshot.workspace.context.actor?.actorId, 'admin-workbench');
        assert.strictEqual(snapshot.workspace.roleValidation?.status, 'allowed');
        assert.strictEqual(snapshot.workspace.permissionValidation?.authorization?.action, 'identity-access:read');
        assert.strictEqual(snapshot.workspace.tenantScopeValidation?.status, 'allowed');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('fallback context data integrity', () => {
    it('fallback actor should have default tenant/brand/store info', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
      try {
        const snapshot = await loadIdentityAccessWorkspace({ tenantId: 'tenant-demo' });
        const { actor } = snapshot.workspace.context;
        assert.ok(actor?.authenticated);
        assert.strictEqual(actor?.actorId, 'admin-workbench');
        assert.strictEqual(actor?.tenantId, 'tenant-demo');
        assert.strictEqual(actor?.brandId, 'brand-demo');
        assert.strictEqual(actor?.storeId, 'store-001');
        assert.ok(actor?.roles.includes('tenant-admin'));
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});

// ---- 反例 ----

describe('identity-access-page: 反例 (negative cases)', () => {
  it('empty query parameters should fallback to defaults', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadIdentityAccessWorkspace({});
      assert.strictEqual(snapshot.query.tenantId, 'tenant-demo');
      assert.strictEqual(snapshot.query.brandId, 'brand-demo');
      assert.strictEqual(snapshot.query.storeId, 'store-001');
      assert.strictEqual(snapshot.query.marketCode, 'cn-mainland');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

// ---- 边界 ----

describe('identity-access-page: 边界 (boundary cases)', () => {
  it('custom tenantId should propagate through fallback data', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadIdentityAccessWorkspace({ tenantId: 'custom-tenant', brandId: 'custom-brand' });
      assert.strictEqual(snapshot.query.tenantId, 'custom-tenant');
      assert.strictEqual(snapshot.query.brandId, 'custom-brand');
      // Fallback context should use the custom values
      assert.strictEqual(snapshot.workspace.context.effectiveTenantId, 'custom-tenant');
      assert.strictEqual(snapshot.workspace.context.effectiveBrandId, 'custom-brand');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fallback role validation should always be allowed', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadIdentityAccessWorkspace({});
      assert.strictEqual(snapshot.workspace.roleValidation?.status, 'allowed');
      assert.strictEqual(snapshot.workspace.permissionValidation?.status, 'allowed');
      assert.strictEqual(snapshot.workspace.tenantScopeValidation?.status, 'allowed');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
