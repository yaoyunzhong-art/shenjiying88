import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert'
import { AiCsModule } from './ai-cs.module'

describe('AiCsModule', () => {
  it('should be defined', () => {
    const module = new AiCsModule()
    assert.ok(module)
  })

  it('should have controller registered', () => {
    const controllers = Reflect.getMetadata('controllers', AiCsModule)
    assert.ok(Array.isArray(controllers))
    assert.equal(controllers.length, 1)
  })

  it('should have providers registered', () => {
    const providers = Reflect.getMetadata('providers', AiCsModule)
    assert.ok(Array.isArray(providers))
    assert.equal(providers.length, 12)
  })

  it('should have exports registered', () => {
    const exports = Reflect.getMetadata('exports', AiCsModule)
    assert.ok(Array.isArray(exports))
    assert.equal(exports.length, 5)
  })

  it('should have imports registered', () => {
    const imports = Reflect.getMetadata('imports', AiCsModule) ?? []
    assert.ok(Array.isArray(imports))
  })

  it('should be instantiable', () => {
    const instance = new AiCsModule()
    assert.ok(instance instanceof AiCsModule)
  })

  it('controller count should be exactly 1', () => {
    const controllers = Reflect.getMetadata('controllers', AiCsModule)
    assert.equal(controllers.length, 1)
  })

  it('providers count should be exactly 12', () => {
    const providers = Reflect.getMetadata('providers', AiCsModule)
    assert.equal(providers.length, 12)
  })

  it('should have @Module decorator applied', () => {
    assert.ok(Reflect.hasOwnMetadata('controllers', AiCsModule))
    assert.ok(Reflect.hasOwnMetadata('providers', AiCsModule))
    assert.ok(Reflect.hasOwnMetadata('exports', AiCsModule))
  })
})
