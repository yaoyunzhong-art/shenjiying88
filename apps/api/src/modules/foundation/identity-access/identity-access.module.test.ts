import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { IdentityAccessModule } from './identity-access.module'
import { IdentityAccessController } from './identity-access.controller'
import { IdentityAccessService } from './identity-access.service'
import { IdentityAccessGuard } from './identity-access.guard'

describe('IdentityAccessModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [IdentityAccessModule]
    }).compile()

    assert.ok(moduleRef)
  })

  test('should provide IdentityAccessController', () => {
    const controller = moduleRef.get<IdentityAccessController>(IdentityAccessController)
    assert.ok(controller)
    assert.ok(controller instanceof IdentityAccessController)
  })

  test('should provide IdentityAccessService', () => {
    const service = moduleRef.get<IdentityAccessService>(IdentityAccessService)
    assert.ok(service)
    assert.ok(service instanceof IdentityAccessService)
  })

  test('should provide IdentityAccessGuard', () => {
    const guard = moduleRef.get<IdentityAccessGuard>(IdentityAccessGuard)
    assert.ok(guard)
    assert.ok(guard instanceof IdentityAccessGuard)
  })

  test('should export IdentityAccessService and IdentityAccessGuard for cross-module use', () => {
    const service = moduleRef.get<IdentityAccessService>(IdentityAccessService)
    const guard = moduleRef.get<IdentityAccessGuard>(IdentityAccessGuard)
    assert.ok(service)
    assert.ok(guard)
  })
})
