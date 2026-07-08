import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { DeployModule } from './deploy.module'
import { DeployController } from './deploy.controller'
import { DeployService } from './deploy.service'

describe('DeployModule', () => {
  let moduleRef: TestingModule

  const buildModule = () =>
    Test.createTestingModule({
      imports: [DeployModule],
    }).compile()

  it('should compile and instantiate', async () => {
    moduleRef = await buildModule()
    assert.ok(moduleRef)
  })

  it('should provide DeployController', async () => {
    moduleRef = await buildModule()
    const controller = moduleRef.get<DeployController>(DeployController)
    assert.ok(controller)
    assert.ok(controller instanceof DeployController)
  })

  it('should provide DeployService', async () => {
    moduleRef = await buildModule()
    const service = moduleRef.get<DeployService>(DeployService)
    assert.ok(service)
    assert.ok(service instanceof DeployService)
  })

  it('should have singleton service between controller instances', async () => {
    moduleRef = await buildModule()
    const controller1 = moduleRef.get<DeployController>(DeployController)
    const controller2 = moduleRef.get<DeployController>(DeployController)
    assert.strictEqual(controller1, controller2)
  })

  it('should bootstrap controller with service injected', async () => {
    moduleRef = await buildModule()
    const controller = moduleRef.get<DeployController>(DeployController)
    // Access private service through prototype chain
    const service = Reflect.get(controller, 'deployService')
    assert.ok(service)
    assert.ok(service instanceof DeployService)
  })
})
