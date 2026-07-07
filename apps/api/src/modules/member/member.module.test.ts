import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module'
import { MemberModule } from './member.module'
import { MemberController } from './member.controller'
import { MemberService } from './member.service'

function createBootstrapService(): MemberService {
  return new MemberService()
}

describe('MemberModule', () => {
  let moduleRef: TestingModule

  it('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MemberModule],
    }).compile()

    assert.ok(moduleRef)
  })

  it('should provide MemberService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MemberModule],
    }).compile()

    const service = moduleRef.get<MemberService>(MemberService)
    assert.ok(service)
    assert.ok(service instanceof MemberService)
  })

  it('should provide MemberController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MemberModule],
    }).compile()

    const controller = moduleRef.get<MemberController>(MemberController)
    assert.ok(controller)
    assert.ok(controller instanceof MemberController)
  })

  it('MemberService.getBootstrap() should return scaffold capabilities', () => {
    const service = createBootstrapService()
    const result = service.getBootstrap({
      tenantId: 'test-tenant'
    })

    assert.equal(result.phase, 'scaffold')
    assert.deepEqual(result.capabilities, [
      'member-center',
      'points',
      'svip',
      'blind-box',
    ])
    assert.equal(result.tenantContext.tenantId, 'test-tenant')
  })

  it('should import MarketingMetricsModule for member operations metrics', () => {
    const importsList = Reflect.getMetadata('imports', MemberModule) as unknown[] | undefined
    assert.ok(importsList?.includes(MarketingMetricsModule))
  })
})
