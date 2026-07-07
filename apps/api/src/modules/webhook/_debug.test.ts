import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'

type WebhookEventType = 'canary.created' | 'insight.generated'

class MockController {
  endpoints = new Map<string, any>()
  deliveries = new Map<string, any>()
  endpointsByTenant = new Map<string, Set<string>>()

  async create(body: any) {
    const endpoint = {
      id: 'wh-' + Math.random().toString(36).slice(2, 8),
      tenantId: 'tenant-default',
      name: body.name,
      url: body.url,
      events: body.events,
      createdAt: new Date().toISOString(),
    }
    this.endpoints.set(endpoint.id, endpoint)
    if (!this.endpointsByTenant.has('tenant-default')) this.endpointsByTenant.set('tenant-default', new Set())
    this.endpointsByTenant.get('tenant-default')!.add(endpoint.id)
    return endpoint
  }

  async it(id: string, body: any) {
    const delivery = {
      id: 'whd-' + Math.random().toString(36).slice(2, 8),
      endpointId: id,
      tenantId: 'tenant-default',
      eventType: body.eventType,
      status: 'success',
    }
    this.deliveries.set(delivery.id, delivery)
    return delivery
  }

  async listDeliveries(endpointId?: string) {
    let items = Array.from(this.deliveries.values())
    console.log('DEBUG: total deliveries:', this.deliveries.size)
    for (const d of this.deliveries.values()) {
      console.log(`  delivery id=${d.id} endpointId=${d.endpointId}`)
    }
    if (endpointId) {
      console.log('filtering by endpointId:', endpointId)
      items = items.filter((d: any) => d.endpointId === endpointId)
    }
    return { items: items.map((d: any) => ({ id: d.id, endpointId: d.endpointId })), total: items.length }
  }
}

describe('debug', () => {
  it('endpointId filter', async () => {
    const ctrl = new MockController()
    const e1 = await ctrl.create({ name: 'EP1', url: 'https://a.com', events: ['canary.created'] })
    const e2 = await ctrl.create({ name: 'EP2', url: 'https://b.com', events: ['canary.created'] })
    const d1 = await ctrl.it(e1.id, { eventType: 'canary.created' })
    const d2 = await ctrl.it(e2.id, { eventType: 'canary.created' })
    console.log('e1.id:', e1.id)
    console.log('e2.id:', e2.id)
    const res = await ctrl.listDeliveries(e1.id)
    console.log('Result:', JSON.stringify(res))
    assert.equal(res.items.length, 1)
    assert.equal(res.items[0].endpointId, e1.id)
  })
})
