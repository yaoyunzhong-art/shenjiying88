import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { AiProfileController } from './ai-profile.controller'

describe('AiProfileController metadata', () => {
  it('controller should keep ai-profile path', () => {
    assert.equal(Reflect.getMetadata('path', AiProfileController), 'ai-profile')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiProfileController.prototype.createProfile, 1, 'profile'],
      [AiProfileController.prototype.getProfile, 0, 'profile/:id'],
      [AiProfileController.prototype.getProfileByUser, 0, 'profile/user/:userId'],
      [AiProfileController.prototype.listProfiles, 0, 'profiles'],
      [AiProfileController.prototype.getSegmentUsers, 0, 'segment/:tags'],
      [AiProfileController.prototype.calculateTiming, 1, 'timing/:userId'],
      [AiProfileController.prototype.getTiming, 0, 'timing/:userId'],
      [AiProfileController.prototype.generateRecommendations, 1, 'recommendations/:userId'],
      [AiProfileController.prototype.getRecommendations, 0, 'recommendations/:userId'],
      [AiProfileController.prototype.createCampaign, 1, 'campaigns'],
      [AiProfileController.prototype.launchCampaign, 1, 'campaigns/:id/launch'],
      [AiProfileController.prototype.completeCampaign, 1, 'campaigns/:id/complete'],
      [AiProfileController.prototype.listCampaigns, 0, 'campaigns'],
      [AiProfileController.prototype.getCampaign, 0, 'campaigns/:id'],
      [AiProfileController.prototype.generateReport, 1, 'report/:storeId'],
      [AiProfileController.prototype.getReport, 0, 'report/:storeId'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
