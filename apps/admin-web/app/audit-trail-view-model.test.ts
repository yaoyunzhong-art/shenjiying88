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

const sampleRecordLow: AuditRecordContract = {
  ...sampleRecord,
  auditId: 'audit_2',
  riskLevel: 'low',
  eventType: 'member.login',
  actorId: 'user@guest.com',
  details: { ip: '192.168.1.1' }
}

const sampleRecordMed: AuditRecordContract = {
  ...sampleRecord,
  auditId: 'audit_3',
  riskLevel: 'medium',
  eventType: 'member.password.reset',
  details: { method: 'email' }
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

  test('buildAuditTrailHref handles many non-empty keys', () => {
    const href = buildAuditTrailHref({
      resourceType: 'Order',
      resourceId: 'o-1',
      tenantId: 't-1',
      actorId: 'admin',
      eventType: 'order.created',
      riskLevel: 'low',
      source: 'order-service',
    })
    assert.ok(href.startsWith('/audit-trail?'))
    assert.ok(href.includes('resourceType=Order'))
    assert.ok(href.includes('resourceId=o-1'))
    assert.ok(href.includes('tenantId=t-1'))
  })

  test('buildAuditTrailHref skips undefined and null keys', () => {
    const href = buildAuditTrailHref({} as Record<string, string>)
    assert.equal(href, '/audit-trail')
  })

  test('summarizeRecordSummary composes event + source + actor', () => {
    assert.equal(
      summarizeRecordSummary(sampleRecord),
      'member.points.adjust · member-service · admin@m5.com'
    )
  })

  test('summarizeRecordSummary handles low risk record', () => {
    assert.equal(
      summarizeRecordSummary(sampleRecordLow),
      'member.login · member-service · user@guest.com'
    )
  })

  test('summarizeRecordSummary with missing source', () => {
    const record: AuditRecordContract = { ...sampleRecord, source: '' }
    const summary = summarizeRecordSummary(record)
    assert.ok(summary.includes('member.points.adjust'))
    assert.ok(summary.includes('admin@m5.com'))
  })

  test('RISK_LEVEL_LABEL and VARIANT cover low/medium/high', () => {
    assert.equal(RISK_LEVEL_LABEL.low, '低风险')
    assert.equal(RISK_LEVEL_LABEL.medium, '中风险')
    assert.equal(RISK_LEVEL_LABEL.high, '高风险')
    assert.equal(RISK_LEVEL_VARIANT.low, 'success')
    assert.equal(RISK_LEVEL_VARIANT.medium, 'warning')
    assert.equal(RISK_LEVEL_VARIANT.high, 'danger')
  })

  test('RISK_LEVEL_LABEL and VARIANT have correct count', () => {
    assert.equal(Object.keys(RISK_LEVEL_LABEL).length, 3)
    assert.equal(Object.keys(RISK_LEVEL_VARIANT).length, 3)
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

  test('loadAuditTrail handles network error gracefully', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => { throw new TypeError('fetch failed') }) as typeof fetch
    try {
      const snapshot = await loadAuditTrail({ resourceId: 'm-1' })
      assert.equal(snapshot.deliveryMode, 'fallback')
      assert.equal(snapshot.trail.total, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadAuditTrail handles non-JSON response', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => new Response('<html>error</html>', { status: 200, headers: { 'content-type': 'text/html' } })) as typeof fetch
    try {
      const snapshot = await loadAuditTrail({ resourceId: 'm-1' })
      assert.equal(snapshot.deliveryMode, 'fallback')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadAuditTrail with multiple records', async () => {
    const originalFetch = globalThis.fetch
    const records = [sampleRecord, sampleRecordLow, sampleRecordMed]
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: 'OK', message: '', data: records }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })) as typeof fetch
    try {
      const snapshot = await loadAuditTrail({ resourceId: 'm-1' })
      assert.equal(snapshot.deliveryMode, 'api')
      assert.equal(snapshot.trail.records.length, 3)
      assert.equal(snapshot.trail.total, 3)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
