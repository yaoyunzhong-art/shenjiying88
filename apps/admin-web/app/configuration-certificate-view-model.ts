import {
  type ConfigurationCertificateMetadata,
  type ConfigurationCertificateStatus,
  type ConfigurationOverview,
  type ConfigurationOverviewQuery,
  buildConfigurationCertificateDetailHref,
  buildConfigurationHref,
  buildFoundationWorkspaceHref
} from '@m5/types';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { buildAuditTrailHref } from './audit-trail-view-model';
import { loadConfigurationGovernanceSnapshot } from './configuration-view-model';

export interface ConfigurationCertificateDetailDelivery {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  name: string;
  certificate: ConfigurationCertificateMetadata | null;
  related: ConfigurationCertificateMetadata[];
  overview: ConfigurationOverview;
  query: ConfigurationOverviewQuery;
  notFound: boolean;
}

export interface ConfigurationCertificateDeepLinks {
  approvalsHref: string;
  auditHref: string;
  foundationHref: string;
  workspaceHref: string;
  certificateHref: string;
}

export interface ConfigurationCertificateDeepLinkOptions {
  consumer?: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

function findRelatedCertificates(
  certificate: ConfigurationCertificateMetadata,
  all: ConfigurationCertificateMetadata[]
): ConfigurationCertificateMetadata[] {
  const issuer = certificate.issuer;
  return all
    .filter((item) => item.name !== certificate.name)
    .filter((item) => Boolean(issuer) && item.issuer === issuer)
    .slice(0, 6);
}

export function buildConfigurationCertificateDeepLinks(
  certificate: ConfigurationCertificateMetadata,
  options: ConfigurationCertificateDeepLinkOptions = {}
): ConfigurationCertificateDeepLinks {
  const certificateHref = buildConfigurationCertificateDetailHref(certificate.name);
  const auditHref = buildAuditTrailHref({
    source: 'configuration-governance',
    purpose: `configuration-certificate:${certificate.name}`,
    limit: 50
  });
  const foundationHref = buildFoundationWorkspaceHref({
    moduleKey: 'configuration-governance',
    consumer: options.consumer ?? 'workbench'
  });
  const needsApproval =
    certificate.status === 'expiring-soon' || certificate.status === 'expired';
  const approvalsHref = needsApproval
    ? `${adminGovernanceApprovalsRoute.href}?status=${certificate.status === 'expired' ? 'ALL' : 'PENDING'}`
    : adminGovernanceApprovalsRoute.href;
  const workspaceHref = buildConfigurationHref({
    tenantId: options.tenantId,
    brandId: options.brandId,
    storeId: options.storeId,
    marketCode: options.marketCode
  });

  return { approvalsHref, auditHref, foundationHref, workspaceHref, certificateHref };
}

export async function loadConfigurationCertificateDetail(
  name: string,
  query: ConfigurationOverviewQuery = {},
  init: RequestInit = {}
): Promise<ConfigurationCertificateDetailDelivery> {
  const generatedAt = new Date().toISOString();
  if (!name || name.trim().length === 0) {
    const fallbackSnapshot = await loadConfigurationGovernanceSnapshot(query, init);
    return {
      deliveryMode: 'fallback',
      generatedAt,
      name,
      certificate: null,
      related: [],
      overview: fallbackSnapshot.overview,
      query: fallbackSnapshot.query,
      notFound: true
    };
  }

  try {
    const snapshot = await loadConfigurationGovernanceSnapshot(query, init);
    const matched = snapshot.overview.configuration.certificates.items.find(
      (item) => item.name === name
    );
    if (!matched) {
      return {
        deliveryMode: snapshot.deliveryMode,
        generatedAt,
        name,
        certificate: null,
        related: snapshot.overview.configuration.certificates.items
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
      certificate: matched,
      related: findRelatedCertificates(
        matched,
        snapshot.overview.configuration.certificates.items
      ),
      overview: snapshot.overview,
      query: snapshot.query,
      notFound: false
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      generatedAt,
      name,
      certificate: null,
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

export type { ConfigurationCertificateStatus };
