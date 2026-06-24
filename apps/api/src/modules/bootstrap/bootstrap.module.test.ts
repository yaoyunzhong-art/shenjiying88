import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { BootstrapModule } from './bootstrap.module'
import { BootstrapController } from './bootstrap.controller'
import { BootstrapService } from './bootstrap.service'

describe('BootstrapModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [BootstrapModule],
    }).compile()

    assert.ok(moduleRef)
  })

  test('should provide BootstrapController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [BootstrapModule],
    }).compile()

    const controller = moduleRef.get<BootstrapController>(BootstrapController)
    assert.ok(controller)
    assert.ok(controller instanceof BootstrapController)
  })

  test('should provide BootstrapService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [BootstrapModule],
    }).compile()

    const service = moduleRef.get<BootstrapService>(BootstrapService)
    assert.ok(service)
    assert.ok(service instanceof BootstrapService)
  })

  test('BootstrapService should be exported', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [BootstrapModule],
    }).compile()

    // exported providers can be retrieved from the module
    const service = moduleRef.get<BootstrapService>(BootstrapService)
    assert.ok(service)
    assert.ok(typeof service.getHealth === 'function')
    assert.ok(typeof service.getBootstrapMetadata === 'function')
  })
})
