import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { CrossModuleModule } from './cross-module.module'
import { CrossModuleController } from './cross-module.controller'
import { CrossModuleService } from './cross-module.service'

describe('CrossModuleModule', () => {
  let moduleRef: TestingModule

  it('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CrossModuleModule],
    }).compile()

    assert.ok(moduleRef)
  })

  it('should provide CrossModuleController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CrossModuleModule],
    }).compile()

    const controller = moduleRef.get<CrossModuleController>(CrossModuleController)
    assert.ok(controller)
    assert.ok(controller instanceof CrossModuleController)
  })

  it('should provide CrossModuleService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CrossModuleModule],
    }).compile()

    const service = moduleRef.get<CrossModuleService>(CrossModuleService)
    assert.ok(service)
    assert.ok(service instanceof CrossModuleService)
  })
})
