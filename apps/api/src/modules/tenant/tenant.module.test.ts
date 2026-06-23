import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { TenantModule } from './tenant.module'
import { TenantController } from './tenant.controller'
import { TenantService } from './tenant.service'

describe('TenantModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TenantModule],
    }).compile()

    assert.ok(moduleRef)
    assert.ok(moduleRef instanceof TestingModule)
  })

  test('should provide TenantController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TenantModule],
    }).compile()

    const controller = moduleRef.get<TenantController>(TenantController)
    assert.ok(controller)
    assert.ok(controller instanceof TenantController)
  })

  test('should provide TenantService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TenantModule],
    }).compile()

    const service = moduleRef.get<TenantService>(TenantService)
    assert.ok(service)
    assert.ok(service instanceof TenantService)
  })

  test('should export TenantService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TenantModule],
    }).compile()

    const exported = moduleRef.get<TenantService>(TenantService)
    assert.ok(exported)
  })
})
