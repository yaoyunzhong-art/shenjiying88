import type {
  AuditRecordContract,
  AuditTrailQuery,
  AuditTrailResponse
} from '@m5/types';
import {
  buildAuditTrailHref,
  buildAuditTrailRecordDetailHref
} from '@m5/types';
import { adminGovernanceApprovalsRoute } from './approvals-data';
import { loadAuditTrail } from './audit-trail-view-model';

export interface AuditTrailRecordDetail {
  deliveryMode: 'api' | 'fallback';
  query: AuditTrailQuery;
  auditId: string;
  record: AuditRecordContract | null;
  relatedRecords: AuditRecordContract[];
  notFound: boolean;
  recordHref: string;
  approvalsHref: string;
  workspaceHref: string;
}

function buildRelatedQuery(record: AuditRecordContract): AuditTrailQuery {
  const query: AuditTrailQuery = {};
  if (record.actorId) {
    query.actorId = record.actorId;
  }
  if (record.source) {
    query.source = record.source;
  }
  if (record.eventType) {
    query.action = record.eventType;
  }
  query.limit = 50;
  return query;
}

function pickRelatedRecords(
  trail: AuditTrailResponse,
  current: AuditRecordContract | null,
  limit: number
): AuditRecordContract[] {
  if (!current) {
    return [];
  }
  const matches: AuditRecordContract[] = [];
  for (const candidate of trail.records) {
    if (candidate.auditId === current.auditId) {
      continue;
    }
    let shared = 0;
    if (candidate.actorId && candidate.actorId === current.actorId) {
      shared += 1;
    }
    if (candidate.source && candidate.source === current.source) {
      shared += 1;
    }
    if (candidate.eventType && candidate.eventType === current.eventType) {
      shared += 1;
    }
    if (shared >= 1) {
      matches.push(candidate);
      if (matches.length >= limit) {
        break;
      }
    }
  }
  return matches;
}

export async function loadAuditTrailRecordDetail(
  auditId: string,
  query: AuditTrailQuery = {},
  init: RequestInit = {}
): Promise<AuditTrailRecordDetail> {
  const expanded: AuditTrailQuery = { ...query, limit: Math.max(query.limit ?? 50, 100) };
  const snapshot = await loadAuditTrail(expanded, init);
  const record = snapshot.trail.records.find((item) => item.auditId === auditId) ?? null;
  const relatedRecords = pickRelatedRecords(snapshot.trail, record, 8);
  const relatedQuery = record ? buildRelatedQuery(record) : query;

  return {
    deliveryMode: snapshot.deliveryMode,
    query,
    auditId,
    record,
    relatedRecords,
    notFound: !record,
    recordHref: buildAuditTrailRecordDetailHref(auditId),
    approvalsHref: adminGovernanceApprovalsRoute.href,
    workspaceHref: buildAuditTrailHref(relatedQuery)
  };
}

export function summarizeAuditTrailRecord(record: AuditRecordContract): string {
  const eventType = record.eventType || 'UNKNOWN';
  const source = record.source ? ` · ${record.source}` : '';
  const actor = record.actorId ? ` · ${record.actorId}` : '';
  return `${eventType}${source}${actor}`;
}

export function describeAuditTrailRecordRisk(record: AuditRecordContract): string {
  if (record.riskLevel === 'high') {
    return '高风险审计，建议立刻复核审批、配置与 runtime 回执链。';
  }
  if (record.riskLevel === 'medium') {
    return '中风险审计，建议按本周节奏复核。';
  }
  return '低风险审计，按治理节奏归档即可。';
}
