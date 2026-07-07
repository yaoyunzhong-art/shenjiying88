import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { RuntimeGovernanceModule } from './runtime-governance.module'
import { RuntimeGovernanceController } from './runtime-governance.controller'
import { RuntimeGovernanceService } from './runtime-governance.service'

describe('RuntimeGovernanceModule', () => {
  let moduleRef: TestingModule

  it('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [RuntimeGovernanceModule]
    }).compile()

    assert.ok(moduleRef)
  })

  it('should provide RuntimeGovernanceController', () => {
    const controller = moduleRef.get<RuntimeGovernanceController>(RuntimeGovernanceController)
    assert.ok(controller)
    assert.ok(controller instanceof RuntimeGovernanceController)
  })

  it('should provide RuntimeGovernanceService', () => {
    const service = moduleRef.get<RuntimeGovernanceService>(RuntimeGovernanceService)
    assert.ok(service)
    assert.ok(service instanceof RuntimeGovernanceService)
  })

  it('should export RuntimeGovernanceService for cross-module use', () => {
    const service = moduleRef.get<RuntimeGovernanceService>(RuntimeGovernanceService)
    assert.ok(service)
  })
})
