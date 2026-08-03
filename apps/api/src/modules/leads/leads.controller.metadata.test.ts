import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { LeadsController } from './leads.controller'

describe('LeadsController metadata', () => {
  it('controller should keep leads path', () => {
    assert.equal(Reflect.getMetadata('path', LeadsController), 'leads')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [LeadsController.prototype.ingestWebhook, 1, 'webhook'],
      [LeadsController.prototype.getLead, 0, ':leadId'],
      [LeadsController.prototype.followUp, 1, 'follow-up'],
      [LeadsController.prototype.closeLead, 1, 'close/:leadId'],
      [LeadsController.prototype.registerRule, 1, 'rules'],
      [LeadsController.prototype.getFunnelMetrics, 0, 'funnel/metrics'],
      [LeadsController.prototype.listLeads, 0, '/'],
      [LeadsController.prototype.scanSlaAlerts, 1, 'sla-scan'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
