import {
  type ConfigurationConfigEntry,
  type ConfigurationConfigEntryRevision,
  type ConfigurationOverview,
  type ConfigurationOverviewQuery,
  buildConfigurationConfigEntryDetailHref,
  buildConfigurationHref,
  buildFoundationWorkspaceHref
} from '@m5/types';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { buildAuditTrailHref } from './audit-trail-view-model';
import { loadConfigurationGovernanceSnapshot } from './configuration-view-model';

export interface ConfigurationConfigEntryDetailDelivery {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  id: string;
  entry: ConfigurationConfigEntry | null;
  revisions: ConfigurationConfigEntryRevision[];
  related: ConfigurationConfigEntry[];
  overview: ConfigurationOverview;
  query: ConfigurationOverviewQuery;
  notFound: boolean;
}

export interface ConfigurationConfigEntryDeepLinks {
  approvalsHref: string;
  auditHref: string;
  foundationHref: string;
  workspaceHref: string;
  entryHref: string;
}

export interface ConfigurationConfigEntryDeepLinkOptions {
  consumer?: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

function findRelatedEntries(
  entry: ConfigurationConfigEntry,
  all: ConfigurationConfigEntry[]
): ConfigurationConfigEntry[] {
  const namespace = entry.namespace;
  const schemaRef = entry.schemaRef;
  return all
    .filter((item) => item.id !== entry.id)
    .filter((item) => {
      if (namespace && item.namespace === namespace) {
        return true;
      }
      if (schemaRef && item.schemaRef === schemaRef) {
        return true;
      }
      return false;
    })
    .slice(0, 6);
}

export function buildConfigurationConfigEntryDeepLinks(
  entry: ConfigurationConfigEntry,
  options: ConfigurationConfigEntryDeepLinkOptions = {}
): ConfigurationConfigEntryDeepLinks {
  const entryHref = buildConfigurationConfigEntryDetailHref(entry.id);
  const auditHref = buildAuditTrailHref({
    source: 'configuration-governance',
    purpose: `configuration-entry:${entry.id}`,
    limit: 50
  });
  const foundationHref = buildFoundationWorkspaceHref({
    moduleKey: 'configuration-governance',
    consumer: options.consumer ?? 'workbench'
  });
  const needsApproval = entry.status === 'pending-review' || entry.status === 'deprecated';
  const approvalsHref = needsApproval
    ? `${adminGovernanceApprovalsRoute.href}?status=PENDING`
    : adminGovernanceApprovalsRoute.href;
  const workspaceHref = buildConfigurationHref({
    tenantId: options.tenantId,
    brandId: options.brandId,
    storeId: options.storeId,
    marketCode: options.marketCode
  });

  return { approvalsHref, auditHref, foundationHref, workspaceHref, entryHref };
}

export async function loadConfigurationConfigEntryDetail(
  id: string,
  query: ConfigurationOverviewQuery = {},
  init: RequestInit = {}
): Promise<ConfigurationConfigEntryDetailDelivery> {
  const generatedAt = new Date().toISOString();
  if (!id || id.trim().length === 0) {
    const fallbackSnapshot = await loadConfigurationGovernanceSnapshot(query, init);
    return {
      deliveryMode: 'fallback',
      generatedAt,
      id,
      entry: null,
      revisions: [],
      related: [],
      overview: fallbackSnapshot.overview,
      query: fallbackSnapshot.query,
      notFound: true
    };
  }

  try {
    const snapshot = await loadConfigurationGovernanceSnapshot(query, init);
    const matched = snapshot.overview.configuration.entries.items.find(
      (item) => item.id === id
    );
    if (!matched) {
      return {
        deliveryMode: snapshot.deliveryMode,
        generatedAt,
        id,
        entry: null,
        revisions: [],
        related: snapshot.overview.configuration.entries.items
          .filter((item) => item.id !== id)
          .slice(0, 6),
        overview: snapshot.overview,
        query: snapshot.query,
        notFound: true
      };
    }
    return {
      deliveryMode: snapshot.deliveryMode,
      generatedAt,
      id,
      entry: matched,
      revisions: matched.latestRevision ? [matched.latestRevision] : [],
      related: findRelatedEntries(
        matched,
        snapshot.overview.configuration.entries.items
      ),
      overview: snapshot.overview,
      query: snapshot.query,
      notFound: false
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt,
      id,
      entry: null,
      revisions: [],
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
