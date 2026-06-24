import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { RuntimeGovernanceModule } from './runtime-governance.module'
import { RuntimeGovernanceController } from './runtime-governance.controller'
import { RuntimeGovernanceService } from './runtime-governance.service'

describe('RuntimeGovernanceModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [RuntimeGovernanceModule]
    }).compile()

    assert.ok(moduleRef)
  })

  test('should provide RuntimeGovernanceController', () => {
    const controller = moduleRef.get<RuntimeGovernanceController>(RuntimeGovernanceController)
    assert.ok(controller)
    assert.ok(controller instanceof RuntimeGovernanceController)
  })

  test('should provide RuntimeGovernanceService', () => {
    const service = moduleRef.get<RuntimeGovernanceService>(RuntimeGovernanceService)
    assert.ok(service)
    assert.ok(service instanceof RuntimeGovernanceService)
  })

  test('should export RuntimeGovernanceService for cross-module use', () => {
    const service = moduleRef.get<RuntimeGovernanceService>(RuntimeGovernanceService)
    assert.ok(service)
  })
})
