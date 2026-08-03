import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { AnalyticsV2Service } from './analytics-v2.service'
import { EventCollector } from './event-collector'
import { CDCStream } from './cdc-stream'
import { CohortAnalyzer } from './cohort-analyzer'
import { FunnelCalculator } from './funnel-calculator'
import { CohortService } from './services/cohort.service'
import { FunnelService } from './services/funnel.service'
import { RetentionService } from './services/retention.service'
import { MetricsService } from './services/metrics.service'
import { EventAdapter } from './datasources/event.adapter'
import { CDCAdapter } from './datasources/cdc.adapter'
import { CohortAdapter } from './datasources/cohort.adapter'
import { FunnelAdapter } from './datasources/funnel.adapter'
import { RetentionAdapter } from './datasources/retention.adapter'
import type { AnalyticsEvent } from './analytics-v2.entity'

function makeBaseEvent(overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tenantId: 't1',
    eventId: `evt-${Math.random().toString(36).slice(2, 10)}`,
    type: 'PAGEVIEW',
    who: 'm1',
    when: new Date().toISOString(),
    where: {},
    what: { name: 'pageview' },
    timestamp: new Date().toISOString(),
    properties: {},
    ...overrides,
  }
}

describe('AnalyticsV2Service', () => {
  let service: AnalyticsV2Service
  let eventAdapter: EventAdapter
  let cohortAdapter: CohortAdapter
  let funnelAdapter: FunnelAdapter
  let cdcAdapter: CDCAdapter
  let collector: EventCollector
  let cdcStream: CDCStream

  const TENANT_ID = 't1'

  beforeEach(() => {
    eventAdapter = new EventAdapter()
    cohortAdapter = new CohortAdapter()
    funnelAdapter = new FunnelAdapter()
    const retentionAdapter = new RetentionAdapter()
    cdcAdapter = new CDCAdapter()

    collector = new EventCollector(eventAdapter)
    cdcStream = new CDCStream(cdcAdapter)
    const cohortAnalyzer = new CohortAnalyzer(cohortAdapter, eventAdapter)
    const funnelCalculator = new FunnelCalculator(funnelAdapter, eventAdapter)

    const cohortService = new CohortService(cohortAnalyzer, cohortAdapter, collector, cdcStream, eventAdapter)
    const funnelService = new FunnelService(funnelCalculator, funnelAdapter)
    const retentionService = new RetentionService(cohortAnalyzer, retentionAdapter)
    const metricsService = new MetricsService(
      collector, cdcStream, cohortService, funnelService, retentionService,
      eventAdapter, cdcAdapter, funnelAdapter, retentionAdapter, cohortAdapter
    )

    service = new AnalyticsV2Service(
      collector, cdcStream, cohortAnalyzer, funnelCalculator,
      cohortService, funnelService, retentionService, metricsService,
      eventAdapter, cohortAdapter, funnelAdapter, retentionAdapter, cdcAdapter
    )
  })

  // ─── orchestrateEventIngestion ───

  describe('orchestrateEventIngestion', () => {
    it('should accept valid event and return full result', () => {
      const event = makeBaseEvent({ eventId: 'evt-001', type: 'PAGEVIEW', who: 'm1' })

      const result = service.orchestrateEventIngestion(event)
      assert.equal(result.eventAccepted, true)
      assert.equal(typeof result.cdcApplied, 'boolean')
      assert.ok('cohortUpdated' in result)
    })

    it('should handle event with missing memberId', () => {
      const event = makeBaseEvent({
        eventId: 'evt-002',
        type: 'CLICK',
        who: 'anonymous',
        memberId: undefined,
        what: { name: 'click', target: 'btn-login' },
      })

      const result = service.orchestrateEventIngestion(event)
      assert.equal(result.eventAccepted, true)
      assert.equal(typeof result.cdcApplied, 'boolean')
      assert.ok('cohortUpdated' in result)
    })

    it('should handle PURCHASE event with revenue', () => {
      const event = makeBaseEvent({
        eventId: 'evt-003',
        type: 'PURCHASE',
        who: 'm2',
        memberId: 'm2',
        what: { name: 'purchase' },
        properties: { product: 'p1', price: 4999 },
        revenueCents: 499900,
      })

      const result = service.orchestrateEventIngestion(event)
      assert.equal(result.eventAccepted, true)
      const events = eventAdapter.queryByTenant(TENANT_ID)
      assert.ok(events.length >= 1)
      const saved = events.find(e => e.eventId === event.eventId)
      assert.ok(saved)
      assert.equal(saved?.revenueCents, 499900)
    })

    it('should reject event with missing who field', () => {
      const event = makeBaseEvent({
        eventId: 'evt-no-who',
        who: '',
      })

      const result = service.orchestrateEventIngestion(event)
      // Collector sanitizes empty who → empty string → adapter rejects missing required fields
      assert.equal(result.eventAccepted, false)
      assert.equal(result.cdcApplied, false)
      assert.equal(result.cohortUpdated, false)
      assert.equal(result.summary, null)
    })

    it('should reject duplicate eventId', () => {
      const event1 = makeBaseEvent({ eventId: 'evt-dup', type: 'CLICK', who: 'm1' })
      const event2 = makeBaseEvent({ eventId: 'evt-dup', type: 'CLICK', who: 'm1' })

      const r1 = service.orchestrateEventIngestion(event1)
      assert.equal(r1.eventAccepted, true)

      const r2 = service.orchestrateEventIngestion(event2)
      assert.equal(r2.eventAccepted, false)
    })

    it('should preserve 5W1H metadata through orchestration', () => {
      const event = makeBaseEvent({
        eventId: 'evt-5w1h',
        type: 'CUSTOM',
        who: 'm_insight',
        memberId: 'm_insight',
        sessionId: 'sess-abc-123',
        where: { url: '/dashboard', channel: 'web', referrer: 'https://google.com' },
        what: { name: 'insight_view', category: 'analytics' },
        why: 'user_requested',
        how: 'desktop_chrome',
        properties: { dashboardId: 'd-42', timeRange: '7d' },
      })

      const result = service.orchestrateEventIngestion(event)
      assert.equal(result.eventAccepted, true)

      const events = eventAdapter.queryByTenant(TENANT_ID)
      const saved = events.find(e => e.eventId === 'evt-5w1h')
      assert.ok(saved)
      assert.equal(saved?.type, 'CUSTOM')
      assert.equal(saved?.sessionId, 'sess-abc-123')
      assert.ok(saved?.where)
      assert.equal(typeof saved?.where, 'object')
      assert.equal(saved?.properties?.dashboardId, 'd-42')
    })
  })

  // ─── orchestrateBatchIngestion ───

  describe('orchestrateBatchIngestion', () => {
    it('should accept batch of multiple events', () => {
      const events: AnalyticsEvent[] = [
        makeBaseEvent({ eventId: 'b001', type: 'PAGEVIEW', who: 'm1', timestamp: '2026-06-28T07:00:00Z' }),
        makeBaseEvent({ eventId: 'b002', type: 'CLICK', who: 'm1', memberId: 'm1', timestamp: '2026-06-28T07:01:00Z' }),
        makeBaseEvent({ eventId: 'b003', type: 'CONVERSION', who: 'm2', memberId: 'm2', timestamp: '2026-06-28T07:02:00Z' }),
      ]

      const result = service.orchestrateBatchIngestion(events)
      assert.equal(result.total, 3)
      assert.equal(result.accepted, 3)
      assert.equal(result.failed, 0)
      assert.equal(result.results.length, 3)
      assert.ok(result.results.every(r => r.accepted === true))
    })

    it('should handle empty batch gracefully', () => {
      const result = service.orchestrateBatchIngestion([])
      assert.equal(result.total, 0)
      assert.equal(result.accepted, 0)
      assert.equal(result.failed, 0)
    })

    it('should count failed events for invalid input', () => {
      const events: AnalyticsEvent[] = [
        makeBaseEvent({ eventId: 'g001', type: 'PAGEVIEW', who: 'm1' }),
        makeBaseEvent({ eventId: '', type: 'PAGEVIEW', who: 'm1' }),
        makeBaseEvent({ eventId: 'g003', type: 'PAGEVIEW', who: '' }),
      ]

      const result = service.orchestrateBatchIngestion(events)
      assert.equal(result.total, 3)
      assert.ok(result.accepted >= 1) // first event accepted
      assert.ok(result.failed >= 1)   // at least one rejected
      assert.equal(result.results.length, 3)
    })
  })

  // ─── getDiagnostics ───

  describe('getDiagnostics', () => {
    it('should return comprehensive diagnostics report', () => {
      const event = makeBaseEvent({ eventId: 'd001', type: 'PAGEVIEW', who: 'm1' })
      // Seed via adapter directly
      eventAdapter.ingest(event)

      const diag = service.getDiagnostics(TENANT_ID)
      assert.ok(diag.events.total >= 1)
      assert.ok(diag.events.byType.PAGEVIEW >= 1)
      assert.ok(typeof diag.cdc.total === 'number')
      assert.ok(typeof diag.cdc.lastWatermark === 'number')
      assert.ok(typeof diag.cohorts.avgRetention === 'object')
      assert.ok(typeof diag.funnels.avgConversionRate === 'number')
    })

    it('should handle tenant with no data', () => {
      const diag = service.getDiagnostics('empty-tenant')
      assert.equal(diag.events.total, 0)
      assert.deepEqual(diag.events.byType, {})
      assert.equal(diag.cohorts.totalGroups, 0)
      assert.equal(diag.funnels.total, 0)
    })

    it('should correctly count events by type with multiple types', () => {
      eventAdapter.ingest(makeBaseEvent({ eventId: 'ty001', type: 'PAGEVIEW', who: 'm1' }))
      eventAdapter.ingest(makeBaseEvent({ eventId: 'ty002', type: 'PAGEVIEW', who: 'm1' }))
      eventAdapter.ingest(makeBaseEvent({ eventId: 'ty003', type: 'CLICK', who: 'm1' }))
      eventAdapter.ingest(makeBaseEvent({ eventId: 'ty004', type: 'PURCHASE', who: 'm1' }))

      const diag = service.getDiagnostics(TENANT_ID)
      assert.equal(diag.events.total, 4)
      assert.equal(diag.events.byType.PAGEVIEW, 2)
      assert.equal(diag.events.byType.CLICK, 1)
      assert.equal(diag.events.byType.PURCHASE, 1)
    })
  })

  // ─── getHealth ───

  describe('getHealth', () => {
    it('should return health object with valid structure', () => {
      const event = makeBaseEvent({ eventId: 'h001', type: 'PAGEVIEW', who: 'm1' })
      collector.collect({
        tenantId: event.tenantId,
        eventId: event.eventId,
        type: event.type,
        who: event.who,
        what: 'pageview',
        memberId: event.memberId,
        timestamp: event.timestamp,
      })

      const health = service.getHealth(TENANT_ID)
      assert.ok(['healthy', 'degraded'].includes(health.status))
      assert.ok(typeof health.latencyMs === 'number')
      assert.ok(typeof health.lastActivityAt === 'string')
    })

    it('should report on empty tenant', () => {
      const health = service.getHealth('empty-tenant')
      assert.equal(health.status, 'unhealthy')
    })

    it('should report degraded when only events exist but no cdc/cohort', () => {
      eventAdapter.ingest(makeBaseEvent({ eventId: 'hdeg', type: 'PAGEVIEW', who: 'm1' }))
      const health = service.getHealth(TENANT_ID)
      // Events exist (ok) but no cdc watermark → degraded
      assert.equal(health.componentStatus.events.ok, true)
      assert.equal(health.componentStatus.cdc.ok, false)
      assert.equal(health.status, 'degraded')
    })
  })

  // ─── getGlobalSummary ───

  describe('getGlobalSummary', () => {
    it('should return summary object', () => {
      const summary = service.getGlobalSummary()
      assert.ok(typeof summary.totalTenants === 'number')
      assert.ok(typeof summary.totalEvents === 'number')
      assert.ok(typeof summary.totalCohorts === 'number')
      assert.ok(typeof summary.totalFunnels === 'number')
    })

    it('should reflect seeded events', () => {
      eventAdapter.ingest(makeBaseEvent({ eventId: 'gs001', type: 'PAGEVIEW', who: 'm1' }))
      eventAdapter.ingest(makeBaseEvent({ eventId: 'gs002', type: 'CLICK', who: 'm1' }))

      const summary = service.getGlobalSummary()
      assert.equal(summary.totalEvents, 2)
    })
  })

  // ─── resetTenantData ───

  describe('resetTenantData', () => {
    it('should clear data and report cleared', () => {
      const event = makeBaseEvent({ eventId: 'r001', type: 'PAGEVIEW', who: 'm1' })
      collector.collect({
        tenantId: event.tenantId,
        eventId: event.eventId,
        type: event.type,
        who: event.who,
        what: 'pageview',
        memberId: event.memberId,
        timestamp: event.timestamp,
      })

      const beforeCount = eventAdapter.queryByTenant(TENANT_ID).length
      assert.ok(beforeCount > 0)

      const result = service.resetTenantData(TENANT_ID)
      assert.equal(result.cleared, true)

      const afterCount = eventAdapter.queryByTenant(TENANT_ID).length
      assert.equal(afterCount, 0)
    })

    it('should handle reset on empty tenant', () => {
      const result = service.resetTenantData('empty-tenant')
      assert.equal(result.cleared, true)
      assert.ok(typeof result.recordsCleared === 'number')
    })

    it('should make tenant queryable with fresh data after reset', () => {
      eventAdapter.ingest(makeBaseEvent({ eventId: 'rs001', type: 'PAGEVIEW', who: 'm1' }))
      assert.ok(eventAdapter.queryByTenant(TENANT_ID).length > 0)

      service.resetTenantData(TENANT_ID)
      assert.equal(eventAdapter.queryByTenant(TENANT_ID).length, 0)

      // Re-ingest after reset
      const fresh = makeBaseEvent({ eventId: 'rs-reborn', type: 'CLICK', who: 'm2' })
      collector.collect({
        tenantId: fresh.tenantId,
        eventId: fresh.eventId,
        type: fresh.type,
        who: fresh.who,
        what: 'fresh_click',
      })
      assert.equal(eventAdapter.queryByTenant(TENANT_ID).length, 1)
    })
  })
})
