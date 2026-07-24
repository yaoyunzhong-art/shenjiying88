import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { HealthModule } from './health.module'
import { HealthController } from './health.controller'
import { HealthService } from './health.service'
import { LytModule } from '../lyt/lyt.module'
import { PrismaModule } from '../../prisma/prisma.module'

describe('HealthModule', () => {
  it('exposes controller in metadata', () => {
    const controllers: unknown[] = Reflect.getMetadata('controllers', HealthModule) || []

    assert.ok(controllers.includes(HealthController), 'should register HealthController')
    assert.equal(controllers.length, 1, 'should have exactly 1 controller')
  })

  it('exposes provider in metadata', () => {
    const providers: unknown[] = Reflect.getMetadata('providers', HealthModule) || []

    assert.ok(providers.includes(HealthService), 'should register HealthService')
    assert.equal(providers.length, 2, 'should have exactly 1 provider')
  })

  it('imports LytModule and PrismaModule', () => {
    const imports: unknown[] = Reflect.getMetadata('imports', HealthModule) || []

    assert.ok(imports.includes(LytModule), 'should import LytModule')
    assert.ok(imports.includes(PrismaModule), 'should import PrismaModule')
    assert.equal(imports.length, 2, 'should have exactly 2 imports')
  })

  it('exports HealthService', () => {
    const exports: unknown[] = Reflect.getMetadata('exports', HealthModule) || []

    assert.ok(exports.includes(HealthService), 'should export HealthService')
    assert.equal(exports.length, 2, 'should export exactly 1 symbol')
  })

  it('is a valid NestJS Module class', () => {
    const moduleMeta = Reflect.getMetadata('modules', HealthModule)
    // Module metadata key; NestJS decorator sets 'imports', 'controllers', 'providers', 'exports'
    assert.equal(typeof HealthModule, 'function')
    assert.equal(moduleMeta, undefined)
  })

  it('module can be instantiated', () => {
    const instance = new HealthModule()
    assert.ok(instance instanceof HealthModule)
  })

  it('controller/provider/import arrays do not overlap', () => {
    const controllers: unknown[] = Reflect.getMetadata('controllers', HealthModule) || []
    const providers: unknown[] = Reflect.getMetadata('providers', HealthModule) || []
    const imports: unknown[] = Reflect.getMetadata('imports', HealthModule) || []
    const exports: unknown[] = Reflect.getMetadata('exports', HealthModule) || []

    // HealthController should only be in controllers
    assert.ok(!providers.includes(HealthController), 'HealthController should not be in providers')
    // HealthService should only be in providers && exports
    assert.ok(!controllers.includes(HealthService), 'HealthService should not be in controllers')
    // Module dependencies should only be in imports
    assert.ok(!controllers.includes(LytModule), 'LytModule should not be in controllers')
    assert.ok(!providers.includes(LytModule), 'LytModule should not be in providers')
    assert.ok(!controllers.includes(PrismaModule), 'PrismaModule should not be in controllers')
    assert.ok(!providers.includes(PrismaModule), 'PrismaModule should not be in providers')
    assert.ok(!exports.includes(HealthController), 'export should not include controller')
  })
})
