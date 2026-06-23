import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { CrossModuleModule } from './cross-module.module'
import { CrossModuleController } from './cross-module.controller'
import { CrossModuleService } from './cross-module.service'

describe('CrossModuleModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CrossModuleModule],
    }).compile()

    assert.ok(moduleRef)
  })

  test('should provide CrossModuleController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CrossModuleModule],
    }).compile()

    const controller = moduleRef.get<CrossModuleController>(CrossModuleController)
    assert.ok(controller)
    assert.ok(controller instanceof CrossModuleController)
  })

  test('should provide CrossModuleService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CrossModuleModule],
    }).compile()

    const service = moduleRef.get<CrossModuleService>(CrossModuleService)
    assert.ok(service)
    assert.ok(service instanceof CrossModuleService)
  })
})
