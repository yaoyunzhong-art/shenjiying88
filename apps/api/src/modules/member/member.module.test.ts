import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { MemberModule } from './member.module'
import { MemberController } from './member.controller'
import { MemberService } from './member.service'

function createBootstrapService(): MemberService {
  return new MemberService()
}

describe('MemberModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MemberModule],
    }).compile()

    assert.ok(moduleRef)
  })

  test('should provide MemberService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MemberModule],
    }).compile()

    const service = moduleRef.get<MemberService>(MemberService)
    assert.ok(service)
    assert.ok(service instanceof MemberService)
  })

  test('should provide MemberController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MemberModule],
    }).compile()

    const controller = moduleRef.get<MemberController>(MemberController)
    assert.ok(controller)
    assert.ok(controller instanceof MemberController)
  })

  test('MemberService.getBootstrap() should return scaffold capabilities', () => {
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
})
