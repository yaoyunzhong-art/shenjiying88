import { describe, it, expect, assert } from 'vitest'
import 'reflect-metadata'
import { LogisticsManagementModule } from './logistics-management.module'
import { LogisticsManagementController } from './logistics-management.controller'
import { LogisticsManagementService } from './logistics-management.service'

describe('LogisticsManagementModule', () => {
  it('should be defined', () => {
    expect(LogisticsManagementModule).toBeDefined()
  })

  it('should have LogisticsManagementController', () => {
    const controllers = Reflect.getMetadata('controllers', LogisticsManagementModule)
    expect(controllers).toContain(LogisticsManagementController)
  })

  it('should have LogisticsManagementService', () => {
    const providers = Reflect.getMetadata('providers', LogisticsManagementModule)
    expect(providers).toContain(LogisticsManagementService)
  })

  it('should export LogisticsManagementService', () => {
    const exports = Reflect.getMetadata('exports', LogisticsManagementModule)
    expect(exports).toContain(LogisticsManagementService)
  })

  it('should be instantiable', () => {
    const instance = new LogisticsManagementModule()
    assert.ok(instance instanceof LogisticsManagementModule)
  })

  it('should have @Module decorator applied', () => {
    assert.ok(Reflect.hasOwnMetadata('controllers', LogisticsManagementModule))
    assert.ok(Reflect.hasOwnMetadata('providers', LogisticsManagementModule))
    assert.ok(Reflect.hasOwnMetadata('exports', LogisticsManagementModule))
  })
})
