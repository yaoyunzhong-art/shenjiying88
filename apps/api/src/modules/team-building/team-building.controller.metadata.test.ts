import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { TeamBuildingController } from './team-building.controller'

describe('TeamBuildingController metadata', () => {
  it('controller should keep team-building path', () => {
    assert.equal(Reflect.getMetadata('path', TeamBuildingController), 'team-building')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [TeamBuildingController.prototype.findAll, 0, '/'],
      [TeamBuildingController.prototype.getStats, 0, 'stats'],
      [TeamBuildingController.prototype.getTypes, 0, 'types'],
      [TeamBuildingController.prototype.findById, 0, ':id'],
      [TeamBuildingController.prototype.create, 1, '/'],
      [TeamBuildingController.prototype.update, 4, ':id'],
      [TeamBuildingController.prototype.delete, 3, ':id'],
      [TeamBuildingController.prototype.recommend, 1, 'recommend'],
      [TeamBuildingController.prototype.checkEquipment, 1, 'check-equipment'],
      [TeamBuildingController.prototype.createEvent, 1, 'events'],
      [TeamBuildingController.prototype.getAllEvents, 0, 'events'],
      [TeamBuildingController.prototype.getEventById, 0, 'events/:id'],
      [TeamBuildingController.prototype.updateEvent, 4, 'events/:id'],
      [TeamBuildingController.prototype.completeEvent, 1, 'events/:id/complete'],
      [TeamBuildingController.prototype.lockEquipment, 1, 'events/:id/lock'],
      [TeamBuildingController.prototype.unlockEquipment, 1, 'events/:id/unlock'],
      [TeamBuildingController.prototype.generateReport, 1, 'events/:id/report'],
      [TeamBuildingController.prototype.getReport, 0, 'reports/:id'],
      [TeamBuildingController.prototype.syncToCrm, 1, 'events/:id/sync-crm'],
      [TeamBuildingController.prototype.getSyncStatus, 0, 'events/:id/sync-status'],
      [TeamBuildingController.prototype.getDashboard, 0, 'dashboard'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
