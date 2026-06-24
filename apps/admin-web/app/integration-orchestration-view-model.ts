import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import type {
  IntegrationEventEnvelopeContract,
  IntegrationIdempotencyRecordContract,
  IntegrationOrchestrationWorkspace,
  IntegrationOrchestrationWorkspaceQuery,
  IntegrationWebhookSourceContract
} from '@m5/types';

const FALLBACK_TENANT_ID = 'tenant-demo';
const FALLBACK_BRAND_ID = 'brand-demo';
const FALLBACK_STORE_ID = 'store-001';
const FALLBACK_MARKET_CODE = 'cn-mainland';

export interface IntegrationOrchestrationSnapshot {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  query: IntegrationOrchestrationWorkspaceQuery;
  workspace: IntegrationOrchestrationWorkspace;
}

function createClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: FALLBACK_TENANT_ID,
    brandId: FALLBACK_BRAND_ID,
    storeId: FALLBACK_STORE_ID,
    marketCode: FALLBACK_MARKET_CODE
  });
}

function buildFallbackSources(): IntegrationWebhookSourceContract[] {
  return [
    {
      source: 'lyt',
      algorithm: 'hmac-sha256',
      toleranceSeconds: 300,
      description: 'LYT 适配器回调验签。',
      secretRef: 'lyt-webhook-signing-secret'
    },
    {
      source: 'payment',
      algorithm: 'hmac-sha256',
      toleranceSeconds: 300,
      description: '支付网关回调验签。',
      secretRef: 'payment-webhook-signing-secret'
    }
  ];
}

function buildFallbackEvents(): IntegrationEventEnvelopeContract[] {
  return [
    {
      envelopeId: 'evt_fallback_001',
      eventName: 'foundation.webhook.received',
      source: 'lyt',
      aggregateId: 'order-001',
      idempotencyKey: 'lyt:order-001',
      occurredAt: '2026-06-14T08:00:00.000Z',
      receivedAt: '2026-06-14T08:00:02.000Z',
      payload: { orderId: 'order-001', amount: 88 },
      headers: { 'x-event-source': 'lyt' }
    }
  ];
}

function buildFallbackIdempotencyRecords(): IntegrationIdempotencyRecordContract[] {
  return [
    {
      key: 'lyt:order-001',
      source: 'lyt',
      eventId: 'order-001',
      eventType: 'foundation.webhook.received',
      firstSeenAt: '2026-06-14T08:00:02.000Z',
      envelopeId: 'evt_fallback_001',
      status: 'accepted',
      payloadChecksum: 'fallback-checksum'
    }
  ];
}

function buildWorkspace(
  sources: IntegrationWebhookSourceContract[],
  events: IntegrationEventEnvelopeContract[],
  idempotencyRecords: IntegrationIdempotencyRecordContract[]
): IntegrationOrchestrationWorkspace {
  return {
    generatedAt: new Date().toISOString(),
    sources,
    events,
    idempotencyRecords,
    summary: {
      sources: sources.length,
      events: events.length,
      idempotencyRecords: idempotencyRecords.length,
      uniqueEventSources: new Set(events.map((item) => item.source)).size,
      duplicateSensitiveRecords: idempotencyRecords.filter(
        (item) => item.key.startsWith('lyt:') || item.key.startsWith('payment:')
      ).length
    }
  };
}

export async function loadIntegrationOrchestrationWorkspace(
  query: IntegrationOrchestrationWorkspaceQuery = {},
  init: RequestInit = {}
): Promise<IntegrationOrchestrationSnapshot> {
  const client = createClient();
  try {
    const workspace = await client.getIntegrationOrchestrationWorkspace(query, init);
    return {
      deliveryMode: 'api',
      generatedAt: workspace.generatedAt,
      query,
      workspace
    };
  } catch {
    const sources = buildFallbackSources();
    const events = buildFallbackEvents();
    const idempotencyRecords = buildFallbackIdempotencyRecords();
    return {
      deliveryMode: 'fallback',
      generatedAt: new Date().toISOString(),
      query,
      workspace: buildWorkspace(sources, events, idempotencyRecords)
    };
  }
}

export function summarizeIntegrationEvent(event: IntegrationEventEnvelopeContract) {
  return `${event.eventName} · ${event.source} · ${event.aggregateId ?? 'no-aggregate'}`;
}

export function summarizeIdempotencyRecord(record: IntegrationIdempotencyRecordContract) {
  return `${record.eventType} · ${record.source} · ${record.status}`;
}

export function summarizeWebhookSource(source: IntegrationWebhookSourceContract) {
  return `${source.source} · ${source.algorithm} · ${source.toleranceSeconds}s`;
}
