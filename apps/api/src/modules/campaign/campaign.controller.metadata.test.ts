import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CampaignController } from './campaign.controller'

describe('CampaignController metadata', () => {
  it('controller should keep campaigns path', () => {
    assert.equal(Reflect.getMetadata('path', CampaignController), 'campaigns')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [CampaignController.prototype.registerCampaign, 1, '/'],
      [CampaignController.prototype.listCampaigns, 0, '/'],
      [CampaignController.prototype.getCampaign, 0, ':planId'],
      [CampaignController.prototype.updateCampaignStatus, 'patch', ':planId/status'],
      [CampaignController.prototype.listPlanDispatches, 0, ':planId/dispatches'],
      [CampaignController.prototype.listDispatches, 0, 'dispatches/list'],
      [CampaignController.prototype.evaluateTriggers, 1, 'evaluate'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      const actualMethod = Reflect.getMetadata('method', handler)
      if (method === 'patch') {
        assert.ok(actualMethod === 2 || actualMethod === 4)
      } else {
        assert.equal(actualMethod, method)
      }
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
