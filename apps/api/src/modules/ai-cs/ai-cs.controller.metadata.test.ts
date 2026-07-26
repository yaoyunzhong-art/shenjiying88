import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AiCsController } from './ai-cs.controller'

describe('AiCsController metadata', () => {
  it('controller should keep ai-cs path', () => {
    assert.equal(Reflect.getMetadata('path', AiCsController), 'ai-cs')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiCsController.prototype.sendMessage, 1, 'send'],
      [AiCsController.prototype.handoff, 1, 'handoff'],
      [AiCsController.prototype.addKnowledge, 1, 'knowledge'],
      [AiCsController.prototype.searchKnowledge, 0, 'knowledge/search'],
      [AiCsController.prototype.listSessions, 0, 'sessions'],
      [AiCsController.prototype.getSession, 0, 'sessions/:id'],
      [AiCsController.prototype.health, 0, 'health'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
