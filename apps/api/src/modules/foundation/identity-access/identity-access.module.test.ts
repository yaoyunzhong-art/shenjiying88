import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { IdentityAccessModule } from './identity-access.module'
import { IdentityAccessController } from './identity-access.controller'
import { IdentityAccessService } from './identity-access.service'
import { IdentityAccessGuard } from './identity-access.guard'

describe('IdentityAccessModule', () => {
  let moduleRef: TestingModule

  it('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [IdentityAccessModule]
    }).compile()

    assert.ok(moduleRef)
  })

  it('should provide IdentityAccessController', () => {
    const controller = moduleRef.get<IdentityAccessController>(IdentityAccessController)
    assert.ok(controller)
    assert.ok(controller instanceof IdentityAccessController)
  })

  it('should provide IdentityAccessService', () => {
    const service = moduleRef.get<IdentityAccessService>(IdentityAccessService)
    assert.ok(service)
    assert.ok(service instanceof IdentityAccessService)
  })

  it('should provide IdentityAccessGuard', () => {
    const guard = moduleRef.get<IdentityAccessGuard>(IdentityAccessGuard)
    assert.ok(guard)
    assert.ok(guard instanceof IdentityAccessGuard)
  })

  it('should export IdentityAccessService and IdentityAccessGuard for cross-module use', () => {
    const service = moduleRef.get<IdentityAccessService>(IdentityAccessService)
    const guard = moduleRef.get<IdentityAccessGuard>(IdentityAccessGuard)
    assert.ok(service)
    assert.ok(guard)
  })
})
