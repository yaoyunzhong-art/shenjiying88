import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { DECORATORS } from '@nestjs/swagger/dist/constants'
import { PortalController } from './portal.controller'

describe('PortalController metadata', () => {
  it('controller should keep portal path and swagger tags', () => {
    assert.equal(Reflect.getMetadata('path', PortalController), 'portals')
    assert.deepEqual(Reflect.getMetadata(DECORATORS.API_TAGS, PortalController), ['portal'])
  })

  it('bootstrap and portal routes should keep GET metadata and summaries', () => {
    const cases = [
      [PortalController.prototype.getBootstrap, 'bootstrap', '获取门户 bootstrap 信息'],
      [PortalController.prototype.getTenantPortal, 'tenant-portal', '获取租户级门户'],
      [PortalController.prototype.getBrandPortal, 'brand-portal', '获取品牌级门户'],
      [PortalController.prototype.getStorePortal, 'store-portal', '获取门店级门户'],
      [PortalController.prototype.getDomainGovernance, 'domain-governance', '获取门户域名治理摘要'],
    ] as const

    cases.forEach(([handler, path, summary]) => {
      assert.equal(Reflect.getMetadata('method', handler), 0)
      assert.equal(Reflect.getMetadata('path', handler), path)
      assert.equal(Reflect.getMetadata(DECORATORS.API_OPERATION, handler)?.summary, summary)
    })
  })
})
