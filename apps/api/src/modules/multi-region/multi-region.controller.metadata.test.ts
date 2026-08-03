import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { MultiRegionController } from './multi-region.controller'

describe('MultiRegionController metadata', () => {
  it('controller should keep multi-region path', () => {
    assert.equal(Reflect.getMetadata('path', MultiRegionController), 'multi-region')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [MultiRegionController.prototype.listEndpoints, 0, 'endpoints'],
      [MultiRegionController.prototype.getEndpoint, 0, 'endpoints/:region'],
      [MultiRegionController.prototype.registerEndpoint, 1, 'endpoints'],
      [MultiRegionController.prototype.updateEndpoint, 4, 'endpoints/:region'],
      [MultiRegionController.prototype.route, 0, 'route'],
      [MultiRegionController.prototype.routeByLatency, 0, 'route/latency'],
      [MultiRegionController.prototype.geoLookup, 0, 'geo/:ip'],
      [MultiRegionController.prototype.pinTenant, 1, 'tenants/pin'],
      [MultiRegionController.prototype.unpinTenant, 3, 'tenants/:tenantId/pin'],
      [MultiRegionController.prototype.listPinnedTenants, 0, 'tenants'],
      [MultiRegionController.prototype.getTenantRegion, 0, 'tenants/:tenantId/region'],
      [MultiRegionController.prototype.setHealth, 1, 'health'],
      [MultiRegionController.prototype.getAllHealth, 0, 'health'],
      [MultiRegionController.prototype.getHealth, 0, 'health/:region'],
      [MultiRegionController.prototype.failoverCheck, 1, 'failover/check'],
      [MultiRegionController.prototype.configureFailover, 1, 'failover/configure'],
      [MultiRegionController.prototype.getFailoverStates, 0, 'failover/state'],
      [MultiRegionController.prototype.getFailoverEvents, 0, 'failover/events'],
      [MultiRegionController.prototype.getHealthyRegions, 0, 'failover/healthy'],
      [MultiRegionController.prototype.canMigrate, 0, 'can-migrate'],
      [MultiRegionController.prototype.batchCheck, 1, 'failover/batch-check'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
