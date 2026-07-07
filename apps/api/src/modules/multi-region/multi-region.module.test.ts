import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multi-region] [D] module.test.ts 补全
 *
 * MultiRegionModule 模块测试:
 * - 模块元数据: controllers/providers/exports/imports
 * - 模块完整性: 所有提供者和导出可实例化
 * - 全局模块装饰器验证
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MultiRegionModule } from './multi-region.module'
import { MultiRegionController } from './multi-region.controller'
import { MultiRegionService } from './multi-region.service'
import { FailoverService } from './failover.service'

describe('MultiRegionModule Metadata', () => {

  it('@Global 装饰器存在', () => {
    const isGlobal = Reflect.getMetadata('__module:global__', MultiRegionModule)
    assert.equal(isGlobal, true, 'MultiRegionModule should be @Global()')
  })

  it('controllers 包含 MultiRegionController', () => {
    const controllers: unknown[] =
      Reflect.getMetadata('controllers', MultiRegionModule) ?? []
    assert.ok(controllers.includes(MultiRegionController))
  })

  it('providers 包含 MultiRegionService 和 FailoverService', () => {
    const providers: unknown[] =
      Reflect.getMetadata('providers', MultiRegionModule) ?? []
    assert.ok(providers.includes(MultiRegionService))
    assert.ok(providers.includes(FailoverService))
  })

  it('exports 包含 MultiRegionService 和 FailoverService', () => {
    const exportsList: unknown[] =
      Reflect.getMetadata('exports', MultiRegionModule) ?? []
    assert.ok(exportsList.includes(MultiRegionService))
    assert.ok(exportsList.includes(FailoverService))
  })

  it('imports 为空（无外部依赖）', () => {
    const importsList: unknown[] =
      Reflect.getMetadata('imports', MultiRegionModule) ?? []
    assert.equal(importsList.length, 0)
  })
})

describe('MultiRegionModule — 提供者实例化', () => {

  it('MultiRegionService 可实例化', () => {
    const service = new MultiRegionService()
    assert.ok(service)
    assert.equal(typeof service.route, 'function')
    assert.equal(typeof service.geoLookup, 'function')
  })

  it('FailoverService 可实例化', () => {
    const regions = new MultiRegionService()
    const failover = new FailoverService(regions)
    assert.ok(failover)
    assert.equal(typeof failover.checkHealth, 'function')
    assert.equal(typeof failover.failover, 'function')
  })

  it('MultiRegionController 可实例化', () => {
    const regions = new MultiRegionService()
    const failover = new FailoverService(regions)
    const ctrl = new MultiRegionController(regions, failover)
    assert.ok(ctrl)
    assert.equal(typeof ctrl.listEndpoints, 'function')
    assert.equal(typeof ctrl.failoverCheck, 'function')
  })
})

describe('MultiRegionModule — Controller 路径验证', () => {

  it('controller path 为 multi-region', () => {
    const path = Reflect.getMetadata('path', MultiRegionController)
    assert.equal(path, 'multi-region')
  })

  it('端点管理路由已定义', () => {
    const proto = MultiRegionController.prototype
    const get = (key: string) => {
      const fn = (proto as any)[key]
        ?? Object.getOwnPropertyDescriptor(proto, key)?.value
      return fn ? Reflect.getMetadata('path', fn) : undefined
    }
    assert.equal(get('listEndpoints'), 'endpoints')
    assert.equal(get('registerEndpoint'), 'endpoints')
    assert.equal(get('updateEndpoint'), 'endpoints/:region')
    assert.equal(get('getEndpoint'), 'endpoints/:region')
  })

  it('故障切换路由已定义', () => {
    const proto = MultiRegionController.prototype
    const get = (key: string) => {
      const fn = (proto as any)[key]
        ?? Object.getOwnPropertyDescriptor(proto, key)?.value
      return fn ? [Reflect.getMetadata('method', fn), Reflect.getMetadata('path', fn)] : undefined
    }
    assert.deepEqual(get('failoverCheck'), [1, 'failover/check'])
    assert.deepEqual(get('configureFailover'), [1, 'failover/configure'])
    assert.deepEqual(get('getFailoverStates'), [0, 'failover/state'])
    assert.deepEqual(get('getFailoverEvents'), [0, 'failover/events'])
    assert.deepEqual(get('batchCheck'), [1, 'failover/batch-check'])
  })
})
