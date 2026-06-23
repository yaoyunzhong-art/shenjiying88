import {
  type IdentityAccessResolvedContext,
  type IdentityAccessValidationResult,
  type IdentityAccessWorkspace,
  type IdentityAccessWorkspaceQuery,
  buildFoundationWorkspaceHref,
  buildIdentityAccessHref,
  buildIdentityAccessPermissionDetailHref,
  buildIdentityAccessRoleDetailHref,
  buildIdentityAccessSessionDetailHref
} from '@m5/types';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { buildAuditTrailHref } from './audit-trail-view-model';
import { loadIdentityAccessWorkspace } from './identity-access-view-model';

export interface IdentityAccessRoleDetailDelivery {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  role: string;
  actorRoles: string[];
  actorPermissions: string[];
  hasRole: boolean;
  validation: IdentityAccessValidationResult | null;
  workspace: IdentityAccessWorkspace;
  query: IdentityAccessWorkspaceQuery;
  notFound: boolean;
}

export interface IdentityAccessRoleDeepLinks {
  approvalsHref: string;
  auditHref: string;
  foundationHref: string;
  workspaceHref: string;
  roleHref: string;
}

export interface IdentityAccessPermissionDetailDelivery {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  permission: string;
  actorRoles: string[];
  actorPermissions: string[];
  hasPermission: boolean;
  validation: IdentityAccessValidationResult | null;
  workspace: IdentityAccessWorkspace;
  query: IdentityAccessWorkspaceQuery;
  notFound: boolean;
}

export interface IdentityAccessPermissionDeepLinks {
  approvalsHref: string;
  auditHref: string;
  foundationHref: string;
  workspaceHref: string;
  permissionHref: string;
}

export interface IdentityAccessSessionDetailDelivery {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  session: string;
  matchedActorId: string | null;
  context: IdentityAccessResolvedContext | null;
  roleValidation: IdentityAccessValidationResult | null;
  permissionValidation: IdentityAccessValidationResult | null;
  tenantScopeValidation: IdentityAccessValidationResult | null;
  workspace: IdentityAccessWorkspace;
  query: IdentityAccessWorkspaceQuery;
  notFound: boolean;
}

export interface IdentityAccessSessionDeepLinks {
  approvalsHref: string;
  auditHref: string;
  foundationHref: string;
  workspaceHref: string;
  sessionHref: string;
}

function buildActorContextFallback(query: IdentityAccessWorkspaceQuery = {}): IdentityAccessResolvedContext {
  return {
    authenticated: false,
    actor: null,
    tenantContext: {
      tenantId: query.tenantId ?? 'tenant-demo',
      brandId: query.brandId ?? 'brand-demo',
      storeId: query.storeId ?? 'store-001',
      marketCode: query.marketCode ?? 'cn-mainland'
    },
    effectiveTenantId: query.tenantId ?? 'tenant-demo',
    effectiveBrandId: query.brandId ?? 'brand-demo',
    effectiveStoreId: query.storeId ?? 'store-001',
    effectiveMarketCode: query.marketCode ?? 'cn-mainland',
    roles: [],
    permissions: []
  };
}

export function buildIdentityAccessRoleDeepLinks(
  role: string,
  query: IdentityAccessWorkspaceQuery = {},
  consumer?: string
): IdentityAccessRoleDeepLinks {
  const roleHref = buildIdentityAccessRoleDetailHref(role);
  const auditHref = buildAuditTrailHref({
    source: 'identity-access',
    purpose: `identity-role:${role}`,
    limit: 50
  });
  const foundationHref = buildFoundationWorkspaceHref({
    moduleKey: 'identity-access',
    consumer: consumer ?? 'workbench'
  });
  const approvalsHref = adminGovernanceApprovalsRoute.href;
  const workspaceHref = buildIdentityAccessHref({
    tenantId: query.tenantId,
    brandId: query.brandId,
    storeId: query.storeId,
    marketCode: query.marketCode
  });

  return { approvalsHref, auditHref, foundationHref, workspaceHref, roleHref };
}

export function buildIdentityAccessPermissionDeepLinks(
  permission: string,
  query: IdentityAccessWorkspaceQuery = {},
  consumer?: string
): IdentityAccessPermissionDeepLinks {
  const permissionHref = buildIdentityAccessPermissionDetailHref(permission);
  const auditHref = buildAuditTrailHref({
    source: 'identity-access',
    purpose: `identity-permission:${permission}`,
    limit: 50
  });
  const foundationHref = buildFoundationWorkspaceHref({
    moduleKey: 'identity-access',
    consumer: consumer ?? 'workbench'
  });
  const approvalsHref = adminGovernanceApprovalsRoute.href;
  const workspaceHref = buildIdentityAccessHref({
    tenantId: query.tenantId,
    brandId: query.brandId,
    storeId: query.storeId,
    marketCode: query.marketCode
  });

  return { approvalsHref, auditHref, foundationHref, workspaceHref, permissionHref };
}

export function buildIdentityAccessSessionDeepLinks(
  session: string,
  query: IdentityAccessWorkspaceQuery = {},
  consumer?: string
): IdentityAccessSessionDeepLinks {
  const sessionHref = buildIdentityAccessSessionDetailHref(session);
  const auditHref = buildAuditTrailHref({
    source: 'identity-access',
    purpose: `identity-session:${session}`,
    limit: 50
  });
  const foundationHref = buildFoundationWorkspaceHref({
    moduleKey: 'identity-access',
    consumer: consumer ?? 'workbench'
  });
  const approvalsHref = adminGovernanceApprovalsRoute.href;
  const workspaceHref = buildIdentityAccessHref({
    tenantId: query.tenantId,
    brandId: query.brandId,
    storeId: query.storeId,
    marketCode: query.marketCode
  });

  return { approvalsHref, auditHref, foundationHref, workspaceHref, sessionHref };
}

export async function loadIdentityAccessRoleDetail(
  role: string,
  query: IdentityAccessWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<IdentityAccessRoleDetailDelivery> {
  const generatedAt = new Date().toISOString();
  if (!role || role.trim().length === 0) {
    const fallbackSnapshot = await loadIdentityAccessWorkspace(query, init);
    return {
      deliveryMode: 'fallback',
      generatedAt,
      role,
      actorRoles: [],
      actorPermissions: [],
      hasRole: false,
      validation: null,
      workspace: fallbackSnapshot.workspace,
      query: fallbackSnapshot.query,
      notFound: true
    };
  }

  try {
    const snapshot = await loadIdentityAccessWorkspace(query, init);
    const ctx = snapshot.workspace.context;
    const hasRole = ctx.roles.includes(role);
    return {
      deliveryMode: snapshot.deliveryMode,
      generatedAt,
      role,
      actorRoles: ctx.roles,
      actorPermissions: ctx.permissions,
      hasRole,
      validation: snapshot.workspace.roleValidation,
      workspace: snapshot.workspace,
      query: snapshot.query,
      notFound: false
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt,
      role,
      actorRoles: [],
      actorPermissions: [],
      hasRole: false,
      validation: null,
      workspace: {
        generatedAt,
        context: buildActorContextFallback(query),
        roleValidation: null,
        permissionValidation: null,
        tenantScopeValidation: null
      },
      query,
      notFound: true
    };
  }
}

export async function loadIdentityAccessPermissionDetail(
  permission: string,
  query: IdentityAccessWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<IdentityAccessPermissionDetailDelivery> {
  const generatedAt = new Date().toISOString();
  if (!permission || permission.trim().length === 0) {
    const fallbackSnapshot = await loadIdentityAccessWorkspace(query, init);
    return {
      deliveryMode: 'fallback',
      generatedAt,
      permission,
      actorRoles: [],
      actorPermissions: [],
      hasPermission: false,
      validation: null,
      workspace: fallbackSnapshot.workspace,
      query: fallbackSnapshot.query,
      notFound: true
    };
  }

  try {
    const snapshot = await loadIdentityAccessWorkspace(query, init);
    const ctx = snapshot.workspace.context;
    const hasPermission = ctx.permissions.includes(permission);
    return {
      deliveryMode: snapshot.deliveryMode,
      generatedAt,
      permission,
      actorRoles: ctx.roles,
      actorPermissions: ctx.permissions,
      hasPermission,
      validation: snapshot.workspace.permissionValidation,
      workspace: snapshot.workspace,
      query: snapshot.query,
      notFound: false
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt,
      permission,
      actorRoles: [],
      actorPermissions: [],
      hasPermission: false,
      validation: null,
      workspace: {
        generatedAt,
        context: buildActorContextFallback(query),
        roleValidation: null,
        permissionValidation: null,
        tenantScopeValidation: null
      },
      query,
      notFound: true
    };
  }
}

export async function loadIdentityAccessSessionDetail(
  session: string,
  query: IdentityAccessWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<IdentityAccessSessionDetailDelivery> {
  const generatedAt = new Date().toISOString();
  if (!session || session.trim().length === 0) {
    const fallbackSnapshot = await loadIdentityAccessWorkspace(query, init);
    return {
      deliveryMode: 'fallback',
      generatedAt,
      session,
      matchedActorId: null,
      context: fallbackSnapshot.workspace.context,
      roleValidation: fallbackSnapshot.workspace.roleValidation,
      permissionValidation: fallbackSnapshot.workspace.permissionValidation,
      tenantScopeValidation: fallbackSnapshot.workspace.tenantScopeValidation,
      workspace: fallbackSnapshot.workspace,
      query: fallbackSnapshot.query,
      notFound: true
    };
  }

  try {
    const snapshot = await loadIdentityAccessWorkspace(query, init);
    const ctx = snapshot.workspace.context;
    const matchedActorId = ctx.actor?.actorId ?? null;
    const notFound = matchedActorId !== session;
    return {
      deliveryMode: snapshot.deliveryMode,
      generatedAt,
      session,
      matchedActorId,
      context: ctx,
      roleValidation: snapshot.workspace.roleValidation,
      permissionValidation: snapshot.workspace.permissionValidation,
      tenantScopeValidation: snapshot.workspace.tenantScopeValidation,
      workspace: snapshot.workspace,
      query: snapshot.query,
      notFound
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt,
      session,
      matchedActorId: null,
      context: buildActorContextFallback(query),
      roleValidation: null,
      permissionValidation: null,
      tenantScopeValidation: null,
      workspace: {
        generatedAt,
        context: buildActorContextFallback(query),
        roleValidation: null,
        permissionValidation: null,
        tenantScopeValidation: null
      },
      query,
      notFound: true
    };
  }
}

export { buildIdentityAccessRoleDetailHref, buildIdentityAccessPermissionDetailHref, buildIdentityAccessSessionDetailHref };
