import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CampaignPerformanceController } from './campaign-performance.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, CampaignPerformanceController)

describe('CampaignPerformanceController metadata', () => {
  const readHandlers = [
    CampaignPerformanceController.prototype.listCampaigns,
    CampaignPerformanceController.prototype.getSummary,
    CampaignPerformanceController.prototype.getCampaign,
  ]

  it('controller should keep campaign-performance path and stay non-public', () => {
    assert.equal(Reflect.getMetadata('path', CampaignPerformanceController), 'campaign-performance')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, CampaignPerformanceController), undefined)
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, CampaignPerformanceController), {})
    assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, CampaignPerformanceController), ['report:read'])
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [CampaignPerformanceController.prototype.listCampaigns, 0, '/'],
      [CampaignPerformanceController.prototype.getSummary, 0, 'summary'],
      [CampaignPerformanceController.prototype.getCampaign, 0, ':id'],
      [CampaignPerformanceController.prototype.createCampaign, 1, '/'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })

  it('read routes should reuse report:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['report:read'])
    })
  })

  it('write routes should reuse report:export', () => {
    assert.deepEqual(
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, CampaignPerformanceController.prototype.createCampaign),
      ['report:export'],
    )
  })
})
