import {
  type ConfigurationOverview,
  type ConfigurationOverviewQuery,
  type ConfigurationSecretMetadata,
  buildConfigurationHref,
  buildConfigurationSecretDetailHref,
  buildFoundationWorkspaceHref
} from '@m5/types';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { buildAuditTrailHref } from './audit-trail-view-model';
import { loadConfigurationGovernanceSnapshot } from './configuration-view-model';

export interface ConfigurationSecretDetailDelivery {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  name: string;
  secret: ConfigurationSecretMetadata | null;
  related: ConfigurationSecretMetadata[];
  overview: ConfigurationOverview;
  query: ConfigurationOverviewQuery;
  notFound: boolean;
}

export interface ConfigurationSecretDeepLinks {
  approvalsHref: string;
  auditHref: string;
  foundationHref: string;
  workspaceHref: string;
  secretHref: string;
}

export interface ConfigurationSecretDeepLinkOptions {
  consumer?: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

function findRelatedSecrets(
  secret: ConfigurationSecretMetadata,
  all: ConfigurationSecretMetadata[]
): ConfigurationSecretMetadata[] {
  const consumerSet = new Set(secret.consumers ?? []);
  if (consumerSet.size === 0) {
    return [];
  }
  return all
    .filter((item) => item.name !== secret.name)
    .filter((item) => (item.consumers ?? []).some((consumer) => consumerSet.has(consumer)))
    .slice(0, 6);
}

export function buildConfigurationSecretDeepLinks(
  secret: ConfigurationSecretMetadata,
  options: ConfigurationSecretDeepLinkOptions = {}
): ConfigurationSecretDeepLinks {
  const secretHref = buildConfigurationSecretDetailHref(secret.name);
  const auditHref = buildAuditTrailHref({
    source: 'configuration-governance',
    purpose: `configuration-secret:${secret.name}`,
    limit: 50
  });
  const foundationHref = buildFoundationWorkspaceHref({
    moduleKey: 'configuration-governance',
    consumer: options.consumer ?? 'workbench'
  });
  const requiresApproval = secret.status === 'rotation-due' || secret.status === 'expired';
  const approvalsHref = requiresApproval
    ? `${adminGovernanceApprovalsRoute.href}?status=${secret.status === 'rotation-due' ? 'PENDING' : 'ALL'}`
    : adminGovernanceApprovalsRoute.href;
  const workspaceHref = buildConfigurationHref({
    tenantId: options.tenantId,
    brandId: options.brandId,
    storeId: options.storeId,
    marketCode: options.marketCode
  });

  return { approvalsHref, auditHref, foundationHref, workspaceHref, secretHref };
}

export async function loadConfigurationSecretDetail(
  name: string,
  query: ConfigurationOverviewQuery = {},
  init: RequestInit = {}
): Promise<ConfigurationSecretDetailDelivery> {
  const generatedAt = new Date().toISOString();
  if (!name || name.trim().length === 0) {
    const fallbackSnapshot = await loadConfigurationGovernanceSnapshot(query, init);
    return {
      deliveryMode: 'fallback',
      generatedAt,
      name,
      secret: null,
      related: [],
      overview: fallbackSnapshot.overview,
      query: fallbackSnapshot.query,
      notFound: true
    };
  }

  try {
    const snapshot = await loadConfigurationGovernanceSnapshot(query, init);
    const matched = snapshot.overview.configuration.secrets.items.find(
      (item) => item.name === name
    );
    if (!matched) {
      return {
        deliveryMode: snapshot.deliveryMode,
        generatedAt,
        name,
        secret: null,
        related: snapshot.overview.configuration.secrets.items
          .filter((item) => item.name !== name)
          .slice(0, 6),
        overview: snapshot.overview,
        query: snapshot.query,
        notFound: true
      };
    }
    return {
      deliveryMode: snapshot.deliveryMode,
      generatedAt,
      name,
      secret: matched,
      related: findRelatedSecrets(matched, snapshot.overview.configuration.secrets.items),
      overview: snapshot.overview,
      query: snapshot.query,
      notFound: false
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt,
      name,
      secret: null,
      related: [],
      overview: {
        generatedAt,
        approvals: {},
        audits: {},
        configuration: {
          entries: { total: 0, active: 0, namespaces: {}, items: [] },
          featureFlags: { total: 0, enabled: 0, active: 0, byStrategy: {}, items: [] },
          secrets: { total: 0, persisted: 0, static: 0, rotationDue: 0, expired: 0, items: [] },
          certificates: { total: 0, autoRenew: 0, expiringSoon: 0, expired: 0, items: [] }
        },
        posture: {
          generatedAt,
          secrets: { total: 0, rotationDue: 0, expired: 0, sharedConsumers: 0 },
          certificates: { total: 0, expiringSoon: 0, expired: 0, autoRenewDisabled: 0 },
          attention: { secrets: [], certificates: [] }
        },
        scopeChain: []
      },
      query,
      notFound: true
    };
  }
}
