import {
  type ConfigurationFeatureFlag,
  type ConfigurationOverview,
  type ConfigurationOverviewQuery,
  buildConfigurationFeatureFlagDetailHref,
  buildConfigurationHref,
  buildFoundationWorkspaceHref
} from '@m5/types';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { buildAuditTrailHref } from './audit-trail-view-model';
import { loadConfigurationGovernanceSnapshot } from './configuration-view-model';

export interface ConfigurationFeatureFlagDetailDelivery {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  key: string;
  flag: ConfigurationFeatureFlag | null;
  related: ConfigurationFeatureFlag[];
  overview: ConfigurationOverview;
  query: ConfigurationOverviewQuery;
  notFound: boolean;
}

export interface ConfigurationFeatureFlagDeepLinks {
  approvalsHref: string;
  auditHref: string;
  foundationHref: string;
  workspaceHref: string;
  flagHref: string;
}

export interface ConfigurationFeatureFlagDeepLinkOptions {
  consumer?: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

function findRelatedFlags(
  flag: ConfigurationFeatureFlag,
  all: ConfigurationFeatureFlag[]
): ConfigurationFeatureFlag[] {
  const subjectKey = flag.subjectKey;
  return all
    .filter((item) => item.key !== flag.key)
    .filter((item) => Boolean(subjectKey) && item.subjectKey === subjectKey)
    .slice(0, 6);
}

export function buildConfigurationFeatureFlagDeepLinks(
  flag: ConfigurationFeatureFlag,
  options: ConfigurationFeatureFlagDeepLinkOptions = {}
): ConfigurationFeatureFlagDeepLinks {
  const flagHref = buildConfigurationFeatureFlagDetailHref(flag.key);
  const auditHref = buildAuditTrailHref({
    source: 'configuration-governance',
    purpose: `configuration-flag:${flag.key}`,
    limit: 50
  });
  const foundationHref = buildFoundationWorkspaceHref({
    moduleKey: 'configuration-governance',
    consumer: options.consumer ?? 'workbench'
  });
  const needsApproval = flag.enabled && (flag.rolloutPercentage ?? 0) >= 50;
  const approvalsHref = needsApproval
    ? `${adminGovernanceApprovalsRoute.href}?status=PENDING`
    : adminGovernanceApprovalsRoute.href;
  const workspaceHref = buildConfigurationHref({
    tenantId: options.tenantId,
    brandId: options.brandId,
    storeId: options.storeId,
    marketCode: options.marketCode
  });

  return { approvalsHref, auditHref, foundationHref, workspaceHref, flagHref };
}

export async function loadConfigurationFeatureFlagDetail(
  key: string,
  query: ConfigurationOverviewQuery = {},
  init: RequestInit = {}
): Promise<ConfigurationFeatureFlagDetailDelivery> {
  const generatedAt = new Date().toISOString();
  if (!key || key.trim().length === 0) {
    const fallbackSnapshot = await loadConfigurationGovernanceSnapshot(query, init);
    return {
      deliveryMode: 'fallback',
      generatedAt,
      key,
      flag: null,
      related: [],
      overview: fallbackSnapshot.overview,
      query: fallbackSnapshot.query,
      notFound: true
    };
  }

  try {
    const snapshot = await loadConfigurationGovernanceSnapshot(query, init);
    const matched = snapshot.overview.configuration.featureFlags.items.find(
      (item) => item.key === key
    );
    if (!matched) {
      return {
        deliveryMode: snapshot.deliveryMode,
        generatedAt,
        key,
        flag: null,
        related: snapshot.overview.configuration.featureFlags.items
          .filter((item) => item.key !== key)
          .slice(0, 6),
        overview: snapshot.overview,
        query: snapshot.query,
        notFound: true
      };
    }
    return {
      deliveryMode: snapshot.deliveryMode,
      generatedAt,
      key,
      flag: matched,
      related: findRelatedFlags(
        matched,
        snapshot.overview.configuration.featureFlags.items
      ),
      overview: snapshot.overview,
      query: snapshot.query,
      notFound: false
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt,
      key,
      flag: null,
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
