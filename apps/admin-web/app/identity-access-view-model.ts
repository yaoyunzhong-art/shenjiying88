import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import type {
  IdentityAccessResolvedContext,
  IdentityAccessValidationResult,
  IdentityAccessWorkspace,
  IdentityAccessWorkspaceQuery
} from '@m5/types';

const FALLBACK_TENANT_ID = 'tenant-demo';
const FALLBACK_BRAND_ID = 'brand-demo';
const FALLBACK_STORE_ID = 'store-001';
const FALLBACK_MARKET_CODE = 'cn-mainland';
const IDENTITY_ACCESS_HEADERS = {
  'x-actor-id': 'admin-workbench',
  'x-actor-type': 'employee-user',
  'x-actor-name': 'Admin Workbench',
  'x-actor-tenant-id': FALLBACK_TENANT_ID,
  'x-roles': 'tenant-admin',
  'x-permissions': 'identity-access:read,tenant:read'
};

export interface IdentityAccessWorkspaceSnapshot {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: IdentityAccessWorkspaceQuery;
  workspace: IdentityAccessWorkspace;
}

function createIdentityAccessClient(query: IdentityAccessWorkspaceQuery = {}) {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: query.tenantId ?? FALLBACK_TENANT_ID,
    brandId: query.brandId ?? FALLBACK_BRAND_ID,
    storeId: query.storeId ?? FALLBACK_STORE_ID,
    marketCode: query.marketCode ?? FALLBACK_MARKET_CODE,
    headers: IDENTITY_ACCESS_HEADERS
  });
}

function buildFallbackContext(query: IdentityAccessWorkspaceQuery = {}): IdentityAccessResolvedContext {
  return {
    authenticated: true,
    actor: {
      actorId: 'admin-workbench',
      actorType: 'employee-user',
      actorName: 'Admin Workbench',
      tenantId: query.tenantId ?? FALLBACK_TENANT_ID,
      brandId: query.brandId ?? FALLBACK_BRAND_ID,
      storeId: query.storeId ?? FALLBACK_STORE_ID,
      roles: ['tenant-admin'],
      permissions: ['identity-access:read', 'tenant:read'],
      authenticated: true,
      source: 'fallback'
    },
    tenantContext: {
      tenantId: query.tenantId ?? FALLBACK_TENANT_ID,
      brandId: query.brandId ?? FALLBACK_BRAND_ID,
      storeId: query.storeId ?? FALLBACK_STORE_ID,
      marketCode: query.marketCode ?? FALLBACK_MARKET_CODE
    },
    effectiveTenantId: query.tenantId ?? FALLBACK_TENANT_ID,
    effectiveBrandId: query.brandId ?? FALLBACK_BRAND_ID,
    effectiveStoreId: query.storeId ?? FALLBACK_STORE_ID,
    effectiveMarketCode: query.marketCode ?? FALLBACK_MARKET_CODE,
    roles: ['tenant-admin'],
    permissions: ['identity-access:read', 'tenant:read']
  };
}

function buildFallbackValidation(
  check: IdentityAccessValidationResult['check'],
  context: IdentityAccessResolvedContext
): IdentityAccessValidationResult {
  if (check === 'role') {
    return {
      status: 'allowed',
      check,
      resolved: context
    };
  }

  if (check === 'tenant-scope') {
    return {
      status: 'allowed',
      check,
      targetTenantId: context.tenantContext.tenantId,
      authorization: {
        status: 'allowed',
        action: 'tenant:read',
        resourceScope: { tenantId: context.tenantContext.tenantId },
        actor: context.actor,
        permissionMatched: true,
        tenantScopeMatched: true,
        enforcedBy: ['fallback']
      }
    };
  }

  return {
    status: 'allowed',
    check,
    authorization: {
      status: 'allowed',
      action: 'identity-access:read',
      resourceScope: { tenantId: context.tenantContext.tenantId },
      actor: context.actor,
      permissionMatched: true,
      tenantScopeMatched: true,
      enforcedBy: ['fallback']
    }
  };
}

export async function loadIdentityAccessWorkspace(
  query: IdentityAccessWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<IdentityAccessWorkspaceSnapshot> {
  const normalized: IdentityAccessWorkspaceQuery = {
    tenantId: query.tenantId ?? FALLBACK_TENANT_ID,
    brandId: query.brandId ?? FALLBACK_BRAND_ID,
    storeId: query.storeId ?? FALLBACK_STORE_ID,
    marketCode: query.marketCode ?? FALLBACK_MARKET_CODE
  };
  const client = createIdentityAccessClient(normalized);

  try {
    const [context, roleValidation, permissionValidation, tenantScopeValidation] = await Promise.all([
      client.getIdentityAccessContext(normalized, init),
      client.validateIdentityRole(normalized, init),
      client.validateIdentityPermission(normalized, init),
      client.validateIdentityTenantScope(normalized.tenantId ?? FALLBACK_TENANT_ID, normalized, init)
    ]);

    return {
      deliveryMode: 'api',
      generatedAt: new Date().toISOString(),
      query: normalized,
      workspace: {
        generatedAt: new Date().toISOString(),
        context,
        roleValidation,
        permissionValidation,
        tenantScopeValidation
      }
    };
  } catch {
    const context = buildFallbackContext(normalized);
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      query: normalized,
      workspace: {
        generatedAt: new Date().toISOString(),
        context,
        roleValidation: buildFallbackValidation('role', context),
        permissionValidation: buildFallbackValidation('permission', context),
        tenantScopeValidation: buildFallbackValidation('tenant-scope', context)
      }
    };
  }
}

export function formatIdentityCheckLabel(check: IdentityAccessValidationResult['check']) {
  if (check === 'role') {
    return '角色校验';
  }
  if (check === 'permission') {
    return '权限校验';
  }
  return '租户边界校验';
}

export function summarizeIdentityValidation(result: IdentityAccessValidationResult | null) {
  if (!result) {
    return '未执行';
  }
  if (result.check === 'role') {
    return `${formatIdentityCheckLabel(result.check)} · ${result.status}`;
  }
  const authorization = result.authorization;
  const action = authorization?.action ?? result.check;
  const scope = authorization?.resourceScope?.tenantId ? ` · tenant ${authorization.resourceScope.tenantId}` : '';
  return `${formatIdentityCheckLabel(result.check)} · ${action}${scope} · ${result.status}`;
}
