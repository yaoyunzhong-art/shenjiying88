import type {
  ObservabilitySignalContract,
  RecoveryPlanContract,
  ResilienceQuery,
  RetryPolicyContract
} from '@m5/types';
import {
  buildFoundationWorkspaceHref,
  buildResilienceHref,
  buildResilienceRecoveryPlanDetailHref,
  buildResilienceRetryPolicyDetailHref,
  buildResilienceSignalDetailHref
} from '@m5/types';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { buildAuditTrailHref } from './audit-trail-view-model';
import { loadResilienceOperationsSnapshot } from './resilience-view-model';

export interface ResilienceSignalDetail {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: ResilienceQuery;
  signal: string;
  record: ObservabilitySignalContract | null;
  notFound: boolean;
  signalHref: string;
  auditHref: string;
  approvalsHref: string;
  foundationHref: string;
  workspaceHref: string;
}

export interface ResilienceRetryPolicyDetail {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: ResilienceQuery;
  key: string;
  record: RetryPolicyContract | null;
  notFound: boolean;
  retryPolicyHref: string;
  auditHref: string;
  approvalsHref: string;
  foundationHref: string;
  workspaceHref: string;
}

export interface ResilienceRecoveryPlanDetail {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: ResilienceQuery;
  resource: string;
  record: RecoveryPlanContract | null;
  notFound: boolean;
  recoveryPlanHref: string;
  auditHref: string;
  approvalsHref: string;
  foundationHref: string;
  workspaceHref: string;
}

function buildCommonDeepLinks(args: { query: ResilienceQuery; auditPurpose: string; consumer: string }) {
  const { query, auditPurpose, consumer } = args;
  return {
    auditHref: buildAuditTrailHref({ source: 'resilience', purpose: auditPurpose, limit: 50 }),
    approvalsHref: adminGovernanceApprovalsRoute.href,
    foundationHref: buildFoundationWorkspaceHref({ moduleKey: 'resilience-operations', consumer }),
    workspaceHref: buildResilienceHref(query)
  };
}

export async function loadResilienceSignalDetail(
  signal: string,
  query: ResilienceQuery = {},
  init: RequestInit = {}
): Promise<ResilienceSignalDetail> {
  const snapshot = await loadResilienceOperationsSnapshot(init);
  const record = snapshot.overview.observability.signals.find((item) => item.signal === signal) ?? null;
  const links = buildCommonDeepLinks({
    query,
    auditPurpose: `resilience-signal:${signal}`,
    consumer: 'signal-detail-page'
  });
  return {
    deliveryMode: snapshot.deliveryMode,
    generatedAt: snapshot.generatedAt,
    query,
    signal,
    record,
    notFound: !record,
    signalHref: buildResilienceSignalDetailHref(signal),
    ...links
  };
}

export async function loadResilienceRetryPolicyDetail(
  key: string,
  query: ResilienceQuery = {},
  init: RequestInit = {}
): Promise<ResilienceRetryPolicyDetail> {
  const snapshot = await loadResilienceOperationsSnapshot(init);
  const record = snapshot.overview.retries.policies.find((item) => item.key === key) ?? null;
  const links = buildCommonDeepLinks({
    query,
    auditPurpose: `resilience-retry:${key}`,
    consumer: 'retry-policy-detail-page'
  });
  return {
    deliveryMode: snapshot.deliveryMode,
    generatedAt: snapshot.generatedAt,
    query,
    key,
    record,
    notFound: !record,
    retryPolicyHref: buildResilienceRetryPolicyDetailHref(key),
    ...links
  };
}

export async function loadResilienceRecoveryPlanDetail(
  resource: string,
  query: ResilienceQuery = {},
  init: RequestInit = {}
): Promise<ResilienceRecoveryPlanDetail> {
  const snapshot = await loadResilienceOperationsSnapshot(init);
  const record = snapshot.overview.recovery.plans.find((item) => item.resource === resource) ?? null;
  const links = buildCommonDeepLinks({
    query,
    auditPurpose: `resilience-recovery:${resource}`,
    consumer: 'recovery-plan-detail-page'
  });
  return {
    deliveryMode: snapshot.deliveryMode,
    generatedAt: snapshot.generatedAt,
    query,
    resource,
    record,
    notFound: !record,
    recoveryPlanHref: buildResilienceRecoveryPlanDetailHref(resource),
    ...links
  };
}
