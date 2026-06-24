import {
  type AuditRecordContract,
  type AuditRiskLevel,
  type AuditTrailQuery,
  type AuditTrailResponse,
  type AuditTrailSummary,
  buildAuditTrailHref
} from '@m5/types';
import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';

export interface AuditTrailSnapshot {
  deliveryMode: 'api' | 'fallback';
  trail: AuditTrailResponse;
  summary?: AuditTrailSummary;
  query: AuditTrailQuery;
}

const FALLBACK_TENANT_ID = 'tenant-demo';

function createClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: FALLBACK_TENANT_ID,
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  });
}

function emptySummary(): AuditTrailSummary {
  return {
    total: 0,
    byAction: {},
    bySource: {},
    byRiskLevel: { low: 0, medium: 0, high: 0 }
  };
}

function normalizeQuery(query: AuditTrailQuery): AuditTrailQuery {
  return {
    ...query,
    limit: Math.min(Math.max(query.limit ?? 50, 1), 100)
  };
}

export async function loadAuditTrail(
  query: AuditTrailQuery = {},
  init: RequestInit = {}
): Promise<AuditTrailSnapshot> {
  const normalized = normalizeQuery(query);
  const client = createClient();
  try {
    const [records, summary] = await Promise.all([
      client.listAuditRecords(normalized, init),
      client.summarizeAuditRecords(normalized, init).catch(() => undefined)
    ]);
    return {
      deliveryMode: 'api',
      trail: {
        records: records ?? [],
        total: records?.length ?? 0,
        query: normalized
      },
      summary,
      query: normalized
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      trail: {
        records: [],
        total: 0,
        query: normalized
      },
      summary: emptySummary(),
      query: normalized
    };
  }
}

export const RISK_LEVEL_LABEL: Record<AuditRiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险'
};

export const RISK_LEVEL_VARIANT: Record<AuditRiskLevel, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger'
};

export function summarizeRecordSummary(record: AuditRecordContract): string {
  const eventType = record.eventType || 'UNKNOWN';
  const source = record.source ? ` · ${record.source}` : '';
  const actor = record.actorId ? ` · ${record.actorId}` : '';
  return `${eventType}${source}${actor}`;
}

export { buildAuditTrailHref };
