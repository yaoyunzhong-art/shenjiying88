import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { ResilienceOperationsModule } from './resilience-operations.module'
import { ResilienceOperationsController } from './resilience-operations.controller'
import { ResilienceOperationsService } from './resilience-operations.service'

describe('ResilienceOperationsModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ResilienceOperationsModule]
    }).compile()

    assert.ok(moduleRef)
  })

  test('should provide ResilienceOperationsController', () => {
    const controller = moduleRef.get<ResilienceOperationsController>(ResilienceOperationsController)
    assert.ok(controller)
    assert.ok(controller instanceof ResilienceOperationsController)
  })

  test('should provide ResilienceOperationsService', () => {
    const service = moduleRef.get<ResilienceOperationsService>(ResilienceOperationsService)
    assert.ok(service)
    assert.ok(service instanceof ResilienceOperationsService)
  })

  test('should export ResilienceOperationsService for cross-module use', () => {
    const service = moduleRef.get<ResilienceOperationsService>(ResilienceOperationsService)
    assert.ok(service)
  })
})
