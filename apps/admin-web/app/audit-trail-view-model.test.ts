import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { buildAuditTrailHref, type AuditRecordContract } from '@m5/types'
import {
  RISK_LEVEL_LABEL,
  RISK_LEVEL_VARIANT,
  loadAuditTrail,
  summarizeRecordSummary
} from './audit-trail-view-model'

const sampleRecord: AuditRecordContract = {
  auditId: 'audit_1',
  eventType: 'member.points.adjust',
  tenantId: 'tenant-demo',
  actorId: 'admin@m5.com',
  source: 'member-service',
  riskLevel: 'high',
  occurredAt: '2026-06-14T08:00:00.000Z',
  details: { memberId: 'm-1', points: 50 }
}

describe('audit-trail-view-model', () => {
  test('buildAuditTrailHref includes only non-empty keys', () => {
    const href = buildAuditTrailHref({ resourceType: 'Member', resourceId: 'm-1' })
    assert.equal(href, '/audit-trail?resourceType=Member&resourceId=m-1')
  })

  test('buildAuditTrailHref omits empty query', () => {
    const href = buildAuditTrailHref({})
    assert.equal(href, '/audit-trail')
  })

  test('summarizeRecordSummary composes event + source + actor', () => {
    assert.equal(
      summarizeRecordSummary(sampleRecord),
      'member.points.adjust · member-service · admin@m5.com'
    )
  })

  test('RISK_LEVEL_LABEL and VARIANT cover low/medium/high', () => {
    assert.equal(RISK_LEVEL_LABEL.low, '低风险')
    assert.equal(RISK_LEVEL_LABEL.medium, '中风险')
    assert.equal(RISK_LEVEL_LABEL.high, '高风险')
    assert.equal(RISK_LEVEL_VARIANT.low, 'success')
    assert.equal(RISK_LEVEL_VARIANT.medium, 'warning')
    assert.equal(RISK_LEVEL_VARIANT.high, 'danger')
  })

  test('loadAuditTrail falls back to empty snapshot when fetch fails', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch
    try {
      const snapshot = await loadAuditTrail({ resourceId: 'm-1' })
      assert.equal(snapshot.deliveryMode, 'fallback')
      assert.deepEqual(snapshot.trail.records, [])
      assert.equal(snapshot.trail.total, 0)
      assert.equal(snapshot.summary?.total ?? 0, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadAuditTrail returns api delivery when SDK returns records', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: 'OK', message: '', data: [sampleRecord] }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })) as typeof fetch
    try {
      const snapshot = await loadAuditTrail({ resourceId: 'm-1' })
      assert.equal(snapshot.deliveryMode, 'api')
      assert.equal(snapshot.trail.records.length, 1)
      assert.equal(snapshot.trail.records[0]?.eventType, 'member.points.adjust')
      assert.equal(snapshot.trail.total, 1)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
