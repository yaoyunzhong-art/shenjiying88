import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { AutoRollbackModule } from './auto-rollback.module'
import { AutoRollbackController } from './auto-rollback.controller'
import { AutoRollbackService } from './auto-rollback.service'

describe('AutoRollbackModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [AutoRollbackModule],
    }).compile()

    expect(module).toBeDefined()
    expect(module.get(AutoRollbackController)).toBeInstanceOf(AutoRollbackController)
    expect(module.get(AutoRollbackService)).toBeInstanceOf(AutoRollbackService)
  })

  it('should export AutoRollbackService', async () => {
    const module = await Test.createTestingModule({
      imports: [AutoRollbackModule],
    }).compile()

    const exported = module.get(AutoRollbackService)
    expect(exported.trigger).toBeTypeOf('function')
    expect(exported.confirm).toBeTypeOf('function')
    expect(exported.cancel).toBeTypeOf('function')
  })

  it('should be instantiable without NestJS', () => {
    const instance = new AutoRollbackModule()
    expect(instance).toBeInstanceOf(AutoRollbackModule)
  })

  it('should have controller metadata', () => {
    const controllers = Reflect.getMetadata('controllers', AutoRollbackModule) ?? []
    expect(Array.isArray(controllers)).toBe(true)
    expect(controllers.length).toBe(1)
  })

  it('should have providers metadata', () => {
    const providers = Reflect.getMetadata('providers', AutoRollbackModule) ?? []
    expect(Array.isArray(providers)).toBe(true)
    expect(providers.length).toBeGreaterThanOrEqual(1)
  })

  it('should have exports metadata', () => {
    const exports = Reflect.getMetadata('exports', AutoRollbackModule) ?? []
    expect(Array.isArray(exports)).toBe(true)
    expect(exports.length).toBeGreaterThanOrEqual(1)
  })
})
