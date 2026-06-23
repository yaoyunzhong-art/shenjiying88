import type {
  QuotaLedgerRecord,
  RateLimitPolicyRecord,
  RateLimitWorkspaceQuery
} from '@m5/types';
import {
  buildFoundationWorkspaceHref,
  buildRateLimitsHref,
  buildRateLimitsLedgerDetailHref,
  buildRateLimitsPolicyDetailHref
} from '@m5/types';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { buildAuditTrailHref } from './audit-trail-view-model';
import { loadRateLimitWorkspace } from './rate-limits-view-model';

export interface RateLimitsPolicyDetail {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: RateLimitWorkspaceQuery;
  policyId: string;
  record: RateLimitPolicyRecord | null;
  matchedLedgers: QuotaLedgerRecord[];
  notFound: boolean;
  policyHref: string;
  auditHref: string;
  approvalsHref: string;
  foundationHref: string;
  workspaceHref: string;
}

export interface RateLimitsLedgerDetail {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: RateLimitWorkspaceQuery;
  ledgerId: string;
  record: QuotaLedgerRecord | null;
  matchedPolicy: RateLimitPolicyRecord | null;
  notFound: boolean;
  ledgerHref: string;
  auditHref: string;
  approvalsHref: string;
  foundationHref: string;
  workspaceHref: string;
}

function buildCommonDeepLinks(args: { query: RateLimitWorkspaceQuery; auditPurpose: string; consumer: string }) {
  const { query, auditPurpose, consumer } = args;
  return {
    auditHref: buildAuditTrailHref({ source: 'rate-limits', purpose: auditPurpose, limit: 50 }),
    approvalsHref: adminGovernanceApprovalsRoute.href,
    foundationHref: buildFoundationWorkspaceHref({ moduleKey: 'rate-limits', consumer }),
    workspaceHref: buildRateLimitsHref(query)
  };
}

export async function loadRateLimitsPolicyDetail(
  policyId: string,
  query: RateLimitWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<RateLimitsPolicyDetail> {
  const snapshot = await loadRateLimitWorkspace(query, init);
  const workspace = snapshot.workspace;
  const record = workspace.policies.find((item) => item.id === policyId) ?? null;
  const matchedLedgers = workspace.ledgers.filter((item) => item.policy.id === policyId);
  const links = buildCommonDeepLinks({
    query,
    auditPurpose: `rate-limit-policy:${policyId}`,
    consumer: 'policy-detail-page'
  });
  return {
    deliveryMode: snapshot.deliveryMode,
    generatedAt: snapshot.generatedAt,
    query: snapshot.query,
    policyId,
    record,
    matchedLedgers,
    notFound: !record,
    policyHref: buildRateLimitsPolicyDetailHref(policyId),
    ...links
  };
}

export async function loadRateLimitsLedgerDetail(
  ledgerId: string,
  query: RateLimitWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<RateLimitsLedgerDetail> {
  const snapshot = await loadRateLimitWorkspace(query, init);
  const workspace = snapshot.workspace;
  const record = workspace.ledgers.find((item) => item.id === ledgerId) ?? null;
  const matchedPolicy = record ? workspace.policies.find((item) => item.id === record.policy.id) ?? null : null;
  const links = buildCommonDeepLinks({
    query,
    auditPurpose: `rate-limit-ledger:${ledgerId}`,
    consumer: 'ledger-detail-page'
  });
  return {
    deliveryMode: snapshot.deliveryMode,
    generatedAt: snapshot.generatedAt,
    query: snapshot.query,
    ledgerId,
    record,
    matchedPolicy,
    notFound: !record,
    ledgerHref: buildRateLimitsLedgerDetailHref(ledgerId),
    ...links
  };
}
