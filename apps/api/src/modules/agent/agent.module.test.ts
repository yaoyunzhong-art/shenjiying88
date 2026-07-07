import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import { AgentModule } from './agent.module'
import { AgentService } from './agent.service'
import { AgentController } from './agent.controller'
import { ToolRegistry } from './tool-registry'

describe('AgentModule', () => {
  it('should be defined', () => {
    assert.ok(AgentModule)
  })

  it('should compile the module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AgentModule]
    }).compile()
    assert.ok(moduleRef)
  })

  it('should provide AgentService', async () => {
    const m = await Test.createTestingModule({
      imports: [AgentModule]
    }).compile()
    const service = m.get<AgentService>(AgentService)
    assert.ok(service)
    assert.ok(service instanceof AgentService)
  })

  it('should provide AgentController', async () => {
    const m = await Test.createTestingModule({
      imports: [AgentModule]
    }).compile()
    const controller = m.get<AgentController>(AgentController)
    assert.ok(controller)
    assert.ok(controller instanceof AgentController)
  })

  it('should wire controller with service (manual instantiation)', () => {
    // Note: tsx/esbuild does not support emitDecoratorMetadata, so DI cannot
    // infer constructor parameter types and properties remain undefined.
    // We verify wiring by manually constructing controller + service.
    const service = new AgentService(new ToolRegistry())
    const controller = new AgentController(service, null as any)
    const configs = controller.getConfigs()
    assert.ok(configs.length > 0)
    assert.equal(configs[0].id, 'default-agent-v1')
  })
})
