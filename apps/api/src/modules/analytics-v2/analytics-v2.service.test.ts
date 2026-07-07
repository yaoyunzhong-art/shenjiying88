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
      const event: AnalyticsEvent = {
        id: 'evt-1',
        tenantId: TENANT_ID,
        eventId: 'evt-001',
        type: 'PAGEVIEW',
        who: 'm1',
        when: new Date().toISOString(),
        where: { url: '/home' },
        what: { name: 'pageview', category: 'navigation' },
        memberId: 'm1',
        sessionId: 's1',
        timestamp: new Date().toISOString(),
        properties: {}
      }

      const result = service.orchestrateEventIngestion(event)
      assert.equal(result.eventAccepted, true)
      assert.equal(typeof result.cdcApplied, 'boolean')
      assert.ok('cohortUpdated' in result)
    })

    it('should handle event with missing memberId', () => {
      const event: AnalyticsEvent = {
        id: 'evt-2',
        tenantId: TENANT_ID,
        eventId: 'evt-002',
        type: 'CLICK',
        who: 'anonymous',
        when: new Date().toISOString(),
        where: {},
        what: { name: 'click', target: 'btn-login' },
        timestamp: new Date().toISOString(),
        properties: {}
      }

      const result = service.orchestrateEventIngestion(event)
      assert.equal(result.eventAccepted, true)
      assert.equal(typeof result.cdcApplied, 'boolean')
      assert.ok('cohortUpdated' in result)
    })

    it('should handle PURCHASE event with revenue', () => {
      const event: AnalyticsEvent = {
        id: 'evt-3',
        tenantId: TENANT_ID,
        eventId: 'evt-003',
        type: 'PURCHASE',
        who: 'm2',
        when: new Date().toISOString(),
        where: { url: '/checkout' },
        what: { name: 'purchase' },
        memberId: 'm2',
        timestamp: new Date().toISOString(),
        properties: { product: 'p1', price: 4999 },
        revenueCents: 499900
      }

      const result = service.orchestrateEventIngestion(event)
      assert.equal(result.eventAccepted, true)
      const events = eventAdapter.queryByTenant(TENANT_ID)
      assert.ok(events.length >= 1)
      const saved = events.find(e => e.eventId === event.eventId)
      assert.ok(saved)
      assert.equal(saved?.revenueCents, 499900)
    })
  })

  // ─── orchestrateBatchIngestion ───

  describe('orchestrateBatchIngestion', () => {
    it('should accept batch of multiple events', () => {
      const events: AnalyticsEvent[] = [
        {
          id: 'b1', tenantId: TENANT_ID, eventId: 'b001', type: 'PAGEVIEW',
          who: 'm1', when: '2026-06-28T07:00:00Z', where: {}, what: { name: 'pv' },
          timestamp: '2026-06-28T07:00:00Z', properties: {}
        },
        {
          id: 'b2', tenantId: TENANT_ID, eventId: 'b002', type: 'CLICK',
          who: 'm1', when: '2026-06-28T07:01:00Z', where: {}, what: { name: 'click' },
          memberId: 'm1', timestamp: '2026-06-28T07:01:00Z', properties: {}
        },
        {
          id: 'b3', tenantId: TENANT_ID, eventId: 'b003', type: 'CONVERSION',
          who: 'm2', when: '2026-06-28T07:02:00Z', where: {}, what: { name: 'signup' },
          memberId: 'm2', timestamp: '2026-06-28T07:02:00Z', properties: {}
        },
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
  })

  // ─── getDiagnostics ───

  describe('getDiagnostics', () => {
    it('should return comprehensive diagnostics report', () => {
      const event: AnalyticsEvent = {
        id: 'd1', tenantId: TENANT_ID, eventId: 'd001', type: 'PAGEVIEW',
        who: 'm1', when: new Date().toISOString(), where: {}, what: { name: 'pv' },
        memberId: 'm1', timestamp: new Date().toISOString(), properties: {}
      }
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
  })

  // ─── getHealth ───

  describe('getHealth', () => {
    it('should return health object with valid structure', () => {
      const event: AnalyticsEvent = {
        id: 'h1', tenantId: TENANT_ID, eventId: 'h001', type: 'PAGEVIEW',
        who: 'm1', when: new Date().toISOString(), where: {}, what: { name: 'pv' },
        memberId: 'm1', timestamp: new Date().toISOString(), properties: {}
      }
      collector.collect({
        tenantId: event.tenantId, eventId: event.eventId, type: event.type,
        who: event.who, what: 'pageview', memberId: event.memberId, timestamp: event.timestamp
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
  })

  // ─── resetTenantData ───

  describe('resetTenantData', () => {
    it('should clear data and report cleared', () => {
      const event: AnalyticsEvent = {
        id: 'r1', tenantId: TENANT_ID, eventId: 'r001', type: 'PAGEVIEW',
        who: 'm1', when: new Date().toISOString(), where: {}, what: { name: 'pv' },
        memberId: 'm1', timestamp: new Date().toISOString(), properties: {}
      }
      collector.collect({
        tenantId: event.tenantId, eventId: event.eventId, type: event.type,
        who: event.who, what: 'pageview', memberId: event.memberId, timestamp: event.timestamp
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
  })
})
