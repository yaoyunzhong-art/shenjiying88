import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { MaintenancePlanController } from './maintenance-plan.controller'

describe('MaintenancePlanController metadata', () => {
  it('controller should keep maintenance-plans path', () => {
    assert.equal(Reflect.getMetadata('path', MaintenancePlanController), 'maintenance-plans')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [MaintenancePlanController.prototype.createPlan, 1, '/'],
      [MaintenancePlanController.prototype.listPlans, 0, '/'],
      [MaintenancePlanController.prototype.getPlan, 0, ':planId'],
      [MaintenancePlanController.prototype.updatePlan, 4, ':planId'],
      [MaintenancePlanController.prototype.updatePlanStatus, 4, ':planId/status'],
      [MaintenancePlanController.prototype.getScheduledPlans, 0, 'analysis/scheduled'],
      [MaintenancePlanController.prototype.seedMockData, 1, 'seed'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
