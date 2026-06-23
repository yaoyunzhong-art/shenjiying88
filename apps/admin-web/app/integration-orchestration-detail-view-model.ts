import type {
  IntegrationEventEnvelopeContract,
  IntegrationIdempotencyRecordContract,
  IntegrationOrchestrationWorkspaceQuery,
  IntegrationWebhookSourceContract
} from '@m5/types';
import {
  buildFoundationWorkspaceHref,
  buildIntegrationOrchestrationEventDetailHref,
  buildIntegrationOrchestrationHref,
  buildIntegrationOrchestrationIdempotencyDetailHref,
  buildIntegrationOrchestrationSourceDetailHref
} from '@m5/types';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { buildAuditTrailHref } from './audit-trail-view-model';
import { loadIntegrationOrchestrationWorkspace } from './integration-orchestration-view-model';

export interface IntegrationOrchestrationSourceDetail {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: IntegrationOrchestrationWorkspaceQuery;
  source: string;
  record: IntegrationWebhookSourceContract | null;
  matchedEvents: IntegrationEventEnvelopeContract[];
  matchedIdempotencyRecords: IntegrationIdempotencyRecordContract[];
  notFound: boolean;
  sourceHref: string;
  auditHref: string;
  approvalsHref: string;
  foundationHref: string;
  workspaceHref: string;
}

export interface IntegrationOrchestrationEventDetail {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: IntegrationOrchestrationWorkspaceQuery;
  envelopeId: string;
  record: IntegrationEventEnvelopeContract | null;
  matchedIdempotency: IntegrationIdempotencyRecordContract | null;
  notFound: boolean;
  eventHref: string;
  auditHref: string;
  approvalsHref: string;
  foundationHref: string;
  workspaceHref: string;
}

export interface IntegrationOrchestrationIdempotencyDetail {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: IntegrationOrchestrationWorkspaceQuery;
  key: string;
  record: IntegrationIdempotencyRecordContract | null;
  matchedEvent: IntegrationEventEnvelopeContract | null;
  notFound: boolean;
  idempotencyHref: string;
  auditHref: string;
  approvalsHref: string;
  foundationHref: string;
  workspaceHref: string;
}

function buildCommonDeepLinks(args: {
  query: IntegrationOrchestrationWorkspaceQuery;
  auditPurpose: string;
  consumer: string;
}) {
  const { query, auditPurpose, consumer } = args;
  return {
    auditHref: buildAuditTrailHref({ source: 'integration-orchestration', purpose: auditPurpose, limit: 50 }),
    approvalsHref: adminGovernanceApprovalsRoute.href,
    foundationHref: buildFoundationWorkspaceHref({ moduleKey: 'integration-orchestration', consumer }),
    workspaceHref: buildIntegrationOrchestrationHref(query)
  };
}

export async function loadIntegrationOrchestrationSourceDetail(
  source: string,
  query: IntegrationOrchestrationWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<IntegrationOrchestrationSourceDetail> {
  const snapshot = await loadIntegrationOrchestrationWorkspace(query, init);
  const workspace = snapshot.workspace;
  const record = workspace.sources.find((item) => item.source === source) ?? null;
  const matchedEvents = workspace.events.filter((item) => item.source === source);
  const matchedIdempotencyRecords = workspace.idempotencyRecords.filter((item) => item.source === source);
  const links = buildCommonDeepLinks({
    query,
    auditPurpose: `integration-source:${source}`,
    consumer: 'source-detail-page'
  });
  return {
    deliveryMode: snapshot.deliveryMode,
    generatedAt: snapshot.generatedAt,
    query: snapshot.query,
    source,
    record,
    matchedEvents,
    matchedIdempotencyRecords,
    notFound: !record,
    sourceHref: buildIntegrationOrchestrationSourceDetailHref(source),
    ...links
  };
}

export async function loadIntegrationOrchestrationEventDetail(
  envelopeId: string,
  query: IntegrationOrchestrationWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<IntegrationOrchestrationEventDetail> {
  const snapshot = await loadIntegrationOrchestrationWorkspace(query, init);
  const workspace = snapshot.workspace;
  const record = workspace.events.find((item) => item.envelopeId === envelopeId) ?? null;
  const matchedIdempotency = workspace.idempotencyRecords.find((item) => item.envelopeId === envelopeId) ?? null;
  const links = buildCommonDeepLinks({
    query,
    auditPurpose: `integration-event:${envelopeId}`,
    consumer: 'event-detail-page'
  });
  return {
    deliveryMode: snapshot.deliveryMode,
    generatedAt: snapshot.generatedAt,
    query: snapshot.query,
    envelopeId,
    record,
    matchedIdempotency,
    notFound: !record,
    eventHref: buildIntegrationOrchestrationEventDetailHref(envelopeId),
    ...links
  };
}

export async function loadIntegrationOrchestrationIdempotencyDetail(
  key: string,
  query: IntegrationOrchestrationWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<IntegrationOrchestrationIdempotencyDetail> {
  const snapshot = await loadIntegrationOrchestrationWorkspace(query, init);
  const workspace = snapshot.workspace;
  const record = workspace.idempotencyRecords.find((item) => item.key === key) ?? null;
  const matchedEvent = workspace.events.find((item) => item.idempotencyKey === key) ?? null;
  const links = buildCommonDeepLinks({
    query,
    auditPurpose: `integration-idempotency:${key}`,
    consumer: 'idempotency-detail-page'
  });
  return {
    deliveryMode: snapshot.deliveryMode,
    generatedAt: snapshot.generatedAt,
    query: snapshot.query,
    key,
    record,
    matchedEvent,
    notFound: !record,
    idempotencyHref: buildIntegrationOrchestrationIdempotencyDetailHref(key),
    ...links
  };
}