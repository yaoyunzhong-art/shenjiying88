import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AgentController } from './agent.controller'

describe('AgentController metadata', () => {
  it('controller should keep agent path', () => {
    assert.equal(Reflect.getMetadata('path', AgentController), 'agent')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AgentController.prototype.getConfigs, 0, 'configs'],
      [AgentController.prototype.getConfig, 0, 'configs/:id'],
      [AgentController.prototype.createConfig, 1, 'configs'],
      [AgentController.prototype.updateConfig, 2, 'configs/:id'],
      [AgentController.prototype.deleteConfig, 3, 'configs/:id'],
      [AgentController.prototype.createAndRunSession, 1, 'sessions/run'],
      [AgentController.prototype.runSessionStream, 0, 'sessions/run-stream'],
      [AgentController.prototype.getSessionEvents, 0, 'sessions/:id/events'],
      [AgentController.prototype.batchExecute, 1, 'sessions/batch'],
      [AgentController.prototype.getSessions, 0, 'sessions'],
      [AgentController.prototype.getSession, 0, 'sessions/:id'],
      [AgentController.prototype.getSessionExecution, 0, 'sessions/:id/execution'],
      [AgentController.prototype.getSessionEvaluation, 0, 'sessions/:id/evaluation'],
      [AgentController.prototype.submitEvaluation, 1, 'evaluations'],
      [AgentController.prototype.getEvaluations, 0, 'evaluations'],
      [AgentController.prototype.getStats, 0, 'stats'],
      [AgentController.prototype.getTools, 0, 'tools'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
