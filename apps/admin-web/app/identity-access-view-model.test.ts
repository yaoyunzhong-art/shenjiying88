import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { buildIdentityAccessHref, type IdentityAccessResolvedContext } from '@m5/types';
import {
  formatIdentityCheckLabel,
  loadIdentityAccessWorkspace,
  summarizeIdentityValidation
} from './identity-access-view-model';

const sampleContext: IdentityAccessResolvedContext = {
  authenticated: true,
  actor: {
    actorId: 'admin-workbench',
    actorType: 'employee-user',
    actorName: 'Admin Workbench',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    roles: ['tenant-admin'],
    permissions: ['identity-access:read', 'tenant:read'],
    authenticated: true,
    source: 'headers'
  },
  tenantContext: {
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  },
  effectiveTenantId: 'tenant-demo',
  effectiveBrandId: 'brand-demo',
  effectiveStoreId: 'store-001',
  effectiveMarketCode: 'cn-mainland',
  roles: ['tenant-admin'],
  permissions: ['identity-access:read', 'tenant:read']
};

describe('identity-access-view-model', () => {
  // ── 正例: buildIdentityAccessHref ──

  test('buildIdentityAccessHref omits empty query', () => {
    assert.equal(buildIdentityAccessHref(), '/identity-access');
  });

  test('buildIdentityAccessHref includes scope query', () => {
    assert.equal(
      buildIdentityAccessHref({
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-001',
        marketCode: 'cn-mainland'
      }),
      '/identity-access?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland'
    );
  });

  test('buildIdentityAccessHref includes only tenantId', () => {
    assert.equal(
      buildIdentityAccessHref({ tenantId: 'tenant-demo' }),
      '/identity-access?tenantId=tenant-demo'
    );
  });

  // ── 正例: formatIdentityCheckLabel ──

  test('formatIdentityCheckLabel covers all checks', () => {
    assert.equal(formatIdentityCheckLabel('role'), '角色校验');
    assert.equal(formatIdentityCheckLabel('permission'), '权限校验');
    assert.equal(formatIdentityCheckLabel('tenant-scope'), '租户边界校验');
  });

  test('formatIdentityCheckLabel handles unknown check', () => {
    assert.equal(formatIdentityCheckLabel('custom-check' as never), 'custom-check');
  });

  // ── 正例: summarizeIdentityValidation ──

  test('summarizeIdentityValidation covers role and permission checks', () => {
    assert.equal(
      summarizeIdentityValidation({ status: 'allowed', check: 'role', resolved: sampleContext }),
      '角色校验 · allowed'
    );
    assert.equal(
      summarizeIdentityValidation({
        status: 'allowed',
        check: 'permission',
        authorization: {
          status: 'allowed',
          action: 'identity-access:read',
          resourceScope: { tenantId: 'tenant-demo' },
          actor: sampleContext.actor,
          permissionMatched: true,
          tenantScopeMatched: true,
          enforcedBy: ['IdentityAccessGuard']
        }
      }),
      '权限校验 · identity-access:read · tenant tenant-demo · allowed'
    );
  });

  test('summarizeIdentityValidation handles denied permission', () => {
    assert.equal(
      summarizeIdentityValidation({
        status: 'denied',
        check: 'permission',
        authorization: {
          status: 'denied',
          action: 'identity-access:write',
          resourceScope: { tenantId: 'tenant-demo' },
          actor: sampleContext.actor,
          permissionMatched: false,
          tenantScopeMatched: false,
          enforcedBy: ['IdentityAccessGuard']
        }
      }),
      '权限校验 · identity-access:write · tenant tenant-demo · denied'
    );
  });

  test('summarizeIdentityValidation handles tenant-scope denied', () => {
    assert.equal(
      summarizeIdentityValidation({
        status: 'denied',
        check: 'tenant-scope',
        targetTenantId: 'tenant-other',
        authorization: {
          status: 'denied',
          action: 'tenant:read',
          resourceScope: { tenantId: 'tenant-other' },
          actor: sampleContext.actor,
          permissionMatched: true,
          tenantScopeMatched: false,
          enforcedBy: ['IdentityAccessGuard', 'tenant-scope-check']
        }
      }),
      '租户边界校验 · tenant-other · denied'
    );
  });

  test('summarizeIdentityValidation handles null result', () => {
    assert.equal(summarizeIdentityValidation(null), '-');
  });

  // ── 正例: loadIdentityAccessWorkspace ──

  test('loadIdentityAccessWorkspace returns api snapshot when all endpoints succeed', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const headers = init?.headers as Record<string, string> | undefined;
      assert.equal(headers?.['x-actor-id'], 'admin-workbench');
      assert.equal(headers?.['x-actor-roles'], 'tenant-admin');
      assert.equal(headers?.['x-actor-permissions'], 'identity-access:read,tenant:read');
      if (url.includes('/identity-access/context')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: sampleContext }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/identity-access/validate/role')) {
        return new Response(
          JSON.stringify({ code: 'OK', message: '', data: { status: 'allowed', check: 'role', resolved: sampleContext } }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (url.includes('/identity-access/validate/permission')) {
        return new Response(
          JSON.stringify({
            code: 'OK',
            message: '',
            data: {
              status: 'allowed',
              check: 'permission',
              authorization: {
                status: 'allowed',
                action: 'identity-access:read',
                resourceScope: { tenantId: 'tenant-demo' },
                actor: sampleContext.actor,
                permissionMatched: true,
                tenantScopeMatched: true,
                enforcedBy: ['IdentityAccessGuard']
              }
            }
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      if (url.includes('/identity-access/validate/tenant/tenant-demo')) {
        return new Response(
          JSON.stringify({
            code: 'OK',
            message: '',
            data: {
              status: 'allowed',
              check: 'tenant-scope',
              targetTenantId: 'tenant-demo',
              authorization: {
                status: 'allowed',
                action: 'tenant:read',
                resourceScope: { tenantId: 'tenant-demo' },
                actor: sampleContext.actor,
                permissionMatched: true,
                tenantScopeMatched: true,
                enforcedBy: ['IdentityAccessGuard', 'tenant-scope-check']
              }
            }
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('not-found', { status: 404 });
    }) as typeof fetch;

    try {
      const snapshot = await loadIdentityAccessWorkspace({ tenantId: 'tenant-demo' });
      assert.equal(snapshot.deliveryMode, 'api');
      assert.equal(snapshot.workspace.context.effectiveTenantId, 'tenant-demo');
      assert.equal(snapshot.workspace.roleValidation?.status, 'allowed');
      assert.equal(snapshot.workspace.permissionValidation?.authorization?.action, 'identity-access:read');
      assert.equal(snapshot.workspace.tenantScopeValidation?.targetTenantId, 'tenant-demo');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // ── 反例: loadIdentityAccessWorkspace ──

  test('loadIdentityAccessWorkspace falls back when any request fails', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadIdentityAccessWorkspace({ tenantId: 'tenant-demo' });
      assert.equal(snapshot.deliveryMode, 'fallback');
      assert.equal(snapshot.workspace.context.actor?.actorId, 'admin-workbench');
      assert.equal(snapshot.workspace.roleValidation?.status, 'allowed');
      assert.equal(snapshot.workspace.permissionValidation?.authorization?.action, 'identity-access:read');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('loadIdentityAccessWorkspace falls back when context endpoint returns empty', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ code: 'OK', message: '', data: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch;
    try {
      const snapshot = await loadIdentityAccessWorkspace({ tenantId: 'tenant-demo' });
      assert.equal(snapshot.deliveryMode, 'fallback');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // ── 边界 ──

  test('loadIdentityAccessWorkspace without tenantId still works', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadIdentityAccessWorkspace({});
      assert.equal(snapshot.deliveryMode, 'fallback');
      assert.ok(snapshot.workspace.context.actor !== undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('loadIdentityAccessWorkspace with brand/store context', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/identity-access/context')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: sampleContext }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('not-found', { status: 404 });
    }) as typeof fetch;

    try {
      const snapshot = await loadIdentityAccessWorkspace({ tenantId: 'tenant-demo', brandId: 'brand-demo', storeId: 'store-001' });
      assert.equal(snapshot.deliveryMode, 'fallback');
      assert.equal(snapshot.workspace.context.effectiveTenantId, 'tenant-demo');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('summarizeIdentityValidation handles authorization without action', () => {
    assert.equal(
      summarizeIdentityValidation({
        status: 'denied',
        check: 'permission',
        authorization: {
          status: 'denied',
          action: '',
          resourceScope: {},
          actor: sampleContext.actor,
          permissionMatched: false,
          tenantScopeMatched: false,
          enforcedBy: ['Guard']
        }
      }),
      '权限校验 ·  · tenant  · denied'
    );
  });
});
