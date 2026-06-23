import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import type {
  IdentityAccessResolvedContext,
  IdentityAccessValidationResult,
  IdentityAccessWorkspace
} from '@m5/types';
import {
  buildIdentityAccessPermissionDetailHref,
  buildIdentityAccessRoleDetailHref,
  buildIdentityAccessSessionDetailHref
} from '@m5/types';
import {
  buildIdentityAccessPermissionDeepLinks,
  buildIdentityAccessRoleDeepLinks,
  buildIdentityAccessSessionDeepLinks,
  loadIdentityAccessPermissionDetail,
  loadIdentityAccessRoleDetail,
  loadIdentityAccessSessionDetail
} from './identity-access-detail-view-model';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { buildAuditTrailHref } from './audit-trail-view-model';

const sampleContext: IdentityAccessResolvedContext = {
  authenticated: true,
  actor: {
    actorId: 'admin-workbench',
    actorType: 'employee-user',
    actorName: 'Admin Workbench',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    roles: ['tenant-admin', 'auditor'],
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
  roles: ['tenant-admin', 'auditor'],
  permissions: ['identity-access:read', 'tenant:read']
};

const sampleRoleValidation: IdentityAccessValidationResult = {
  status: 'allowed',
  check: 'role',
  resolved: sampleContext
};

const samplePermissionValidation: IdentityAccessValidationResult = {
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
};

const sampleTenantScopeValidation: IdentityAccessValidationResult = {
  status: 'allowed',
  check: 'tenant-scope',
  targetTenantId: 'tenant-demo',
  authorization: samplePermissionValidation.authorization
};

const sampleWorkspace: IdentityAccessWorkspace = {
  generatedAt: '2026-06-21T00:00:00.000Z',
  context: sampleContext,
  roleValidation: sampleRoleValidation,
  permissionValidation: samplePermissionValidation,
  tenantScopeValidation: sampleTenantScopeValidation
};

function mockIdentityAccessFetch(workspace: IdentityAccessWorkspace = sampleWorkspace) {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/identity-access/context')) {
      return new Response(JSON.stringify({ code: 'OK', message: '', data: workspace.context }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    if (url.includes('/identity-access/validate/role')) {
      return new Response(
        JSON.stringify({ code: 'OK', message: '', data: { status: 'allowed', check: 'role', resolved: workspace.context } }),
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
              actor: workspace.context.actor,
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
              actor: workspace.context.actor,
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
}

function installFailingFetch() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('boom', { status: 500 })) as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

describe('identity-access-detail-view-model', () => {
  describe('buildIdentityAccessRoleDeepLinks', () => {
    test('encodes role href and reuses shared deep link helpers', () => {
      const links = buildIdentityAccessRoleDeepLinks('tenant-admin', {
        tenantId: 'tenant-demo',
        brandId: 'brand-demo'
      });
      assert.equal(links.roleHref, buildIdentityAccessRoleDetailHref('tenant-admin'));
      assert.equal(
        links.auditHref,
        buildAuditTrailHref({
          source: 'identity-access',
          purpose: 'identity-role:tenant-admin',
          limit: 50
        })
      );
      assert.equal(links.approvalsHref, adminGovernanceApprovalsRoute.href);
      assert.equal(
        links.workspaceHref,
        '/identity-access?tenantId=tenant-demo&brandId=brand-demo'
      );
    });

    test('respects custom consumer for foundation link', () => {
      const links = buildIdentityAccessRoleDeepLinks(
        'tenant-admin',
        {},
        'role-detail-page'
      );
      assert.equal(
        links.foundationHref,
        '/foundation?moduleKey=identity-access&consumer=role-detail-page'
      );
    });
  });

  describe('buildIdentityAccessPermissionDeepLinks', () => {
    test('encodes permission href with colons preserved', () => {
      const links = buildIdentityAccessPermissionDeepLinks('identity-access:read');
      assert.equal(
        links.permissionHref,
        buildIdentityAccessPermissionDetailHref('identity-access:read')
      );
      assert.equal(
        links.auditHref,
        buildAuditTrailHref({
          source: 'identity-access',
          purpose: 'identity-permission:identity-access:read',
          limit: 50
        })
      );
    });
  });

  describe('buildIdentityAccessSessionDeepLinks', () => {
    test('encodes session href and uses session purpose', () => {
      const links = buildIdentityAccessSessionDeepLinks('sess-123');
      assert.equal(
        links.sessionHref,
        buildIdentityAccessSessionDetailHref('sess-123')
      );
      assert.equal(
        links.auditHref,
        buildAuditTrailHref({
          source: 'identity-access',
          purpose: 'identity-session:sess-123',
          limit: 50
        })
      );
    });
  });

  describe('loadIdentityAccessRoleDetail', () => {
    test('returns notFound when role is empty', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockIdentityAccessFetch();
      try {
        const detail = await loadIdentityAccessRoleDetail('');
        assert.equal(detail.notFound, true);
        assert.equal(detail.role, '');
        assert.equal(detail.hasRole, false);
        assert.equal(detail.actorRoles.length, 0);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('identifies role held by actor regardless of delivery mode', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockIdentityAccessFetch();
      try {
        const detail = await loadIdentityAccessRoleDetail('tenant-admin', {
          tenantId: 'tenant-demo',
          brandId: 'brand-demo',
          storeId: 'store-001',
          marketCode: 'cn-mainland'
        });
        assert.equal(detail.notFound, false);
        assert.equal(detail.hasRole, true);
        assert.ok(detail.actorRoles.includes('tenant-admin'));
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('identifies role not held by actor regardless of delivery mode', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockIdentityAccessFetch();
      try {
        const detail = await loadIdentityAccessRoleDetail('store-manager', {
          tenantId: 'tenant-demo',
          brandId: 'brand-demo',
          storeId: 'store-001',
          marketCode: 'cn-mainland'
        });
        assert.equal(detail.notFound, false);
        assert.equal(detail.hasRole, false);
        assert.ok(!detail.actorRoles.includes('store-manager'));
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('falls back to fallback delivery when fetch fails', async () => {
      const restore = installFailingFetch();
      try {
        const detail = await loadIdentityAccessRoleDetail('tenant-admin');
        assert.equal(detail.deliveryMode, 'fallback');
        assert.equal(detail.hasRole, true);
        assert.ok(detail.actorRoles.includes('tenant-admin'));
      } finally {
        restore();
      }
    });
  });

  describe('loadIdentityAccessPermissionDetail', () => {
    test('returns notFound when permission is empty', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockIdentityAccessFetch();
      try {
        const detail = await loadIdentityAccessPermissionDetail('');
        assert.equal(detail.notFound, true);
        assert.equal(detail.permission, '');
        assert.equal(detail.hasPermission, false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('identifies permission held by actor regardless of delivery mode', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockIdentityAccessFetch();
      try {
        const detail = await loadIdentityAccessPermissionDetail(
          'identity-access:read',
          {
            tenantId: 'tenant-demo',
            brandId: 'brand-demo',
            storeId: 'store-001',
            marketCode: 'cn-mainland'
          }
        );
        assert.equal(detail.notFound, false);
        assert.equal(detail.hasPermission, true);
        assert.ok(detail.actorPermissions.includes('identity-access:read'));
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('identifies permission not held by actor regardless of delivery mode', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockIdentityAccessFetch();
      try {
        const detail = await loadIdentityAccessPermissionDetail('order:write', {
          tenantId: 'tenant-demo',
          brandId: 'brand-demo',
          storeId: 'store-001',
          marketCode: 'cn-mainland'
        });
        assert.equal(detail.notFound, false);
        assert.equal(detail.hasPermission, false);
        assert.ok(!detail.actorPermissions.includes('order:write'));
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('falls back to fallback delivery when fetch fails', async () => {
      const restore = installFailingFetch();
      try {
        const detail = await loadIdentityAccessPermissionDetail('identity-access:read');
        assert.equal(detail.deliveryMode, 'fallback');
        assert.equal(detail.hasPermission, true);
        assert.ok(detail.actorPermissions.includes('identity-access:read'));
      } finally {
        restore();
      }
    });
  });

  describe('loadIdentityAccessSessionDetail', () => {
    test('returns notFound when session is empty', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockIdentityAccessFetch();
      try {
        const detail = await loadIdentityAccessSessionDetail('');
        assert.equal(detail.notFound, true);
        assert.equal(detail.matchedActorId, null);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('marks notFound true when actor id does not match session', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockIdentityAccessFetch();
      try {
        const detail = await loadIdentityAccessSessionDetail('someone-else');
        assert.equal(detail.notFound, true);
        assert.equal(detail.matchedActorId, 'admin-workbench');
        assert.equal(detail.context?.actor?.actorId, 'admin-workbench');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('marks notFound false when actor id matches session', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockIdentityAccessFetch();
      try {
        const detail = await loadIdentityAccessSessionDetail('admin-workbench');
        assert.equal(detail.notFound, false);
        assert.equal(detail.matchedActorId, 'admin-workbench');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('falls back to fallback delivery but matches fallback actor id when fetch fails', async () => {
      const restore = installFailingFetch();
      try {
        const detail = await loadIdentityAccessSessionDetail('admin-workbench');
        assert.equal(detail.deliveryMode, 'fallback');
        assert.equal(detail.notFound, false);
        assert.equal(detail.matchedActorId, 'admin-workbench');
      } finally {
        restore();
      }
    });
  });
});