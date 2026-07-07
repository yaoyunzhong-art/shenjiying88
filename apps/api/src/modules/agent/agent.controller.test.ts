import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { AgentController } from './agent.controller'
import { AgentService } from './agent.service'
import { ToolRegistry } from './tool-registry'

describe('AgentController', () => {
  let controller: AgentController
  let service: AgentService

  beforeEach(() => {
    service = new AgentService(new ToolRegistry())
    controller = new AgentController(service, null as any)
  })

  // ── Config Endpoints ──

  describe('GET /agent/configs', () => {
    it('should return all configs', () => {
      const configs = controller.getConfigs()
      assert.ok(configs instanceof Array)
      assert.ok(configs.length > 0)
      assert.equal(configs[0].id, 'default-agent-v1')
    })
  })

  describe('GET /agent/configs/:id', () => {
    it('should return config by id', () => {
      const config = controller.getConfig('default-agent-v1')
      assert.ok(config)
      assert.equal(config!.id, 'default-agent-v1')
    })

    it('should throw for non-existent config', () => {
      assert.throws(() => controller.getConfig('non-existent'), { message: /not found/ })
    })
  })

  describe('POST /agent/configs', () => {
    it('should create a new config', () => {
      const config = controller.createConfig({
        id: 'new-config',
        name: 'New Config',
        systemPrompt: 'prompt',
        model: 'model',
        maxSteps: 10,
        enableReflection: true,
        allowedTools: [],
        timeoutMs: 30000,
        enabled: true,
        createdAt: '',
        updatedAt: '',
        tenantId: 't'
      })
      assert.equal(config.id, 'new-config')
      assert.equal(controller.getConfigs().length, 2)
    })
  })

  describe('PUT /agent/configs/:id', () => {
    it('should update config', () => {
      const updated = controller.updateConfig('default-agent-v1', {
        name: 'Updated'
      })
      assert.equal(updated.name, 'Updated')
    })

    it('should throw for non-existent config', () => {
      assert.throws(() => controller.updateConfig('non-existent', { name: 'x' }), { message: /not found/ })
    })
  })

  describe('DELETE /agent/configs/:id', () => {
    it('should delete config', () => {
      const result = controller.deleteConfig('default-agent-v1')
      assert.equal(result.deleted, true)
    })

    it('should throw for non-existent config', () => {
      assert.throws(() => controller.deleteConfig('non-existent'), { message: /not found/ })
    })
  })

  // ── Session Endpoints ──

  describe('POST /agent/sessions/run', () => {
    it('should create and run a session', () => {
      const result = controller.createAndRunSession({
        configId: 'default-agent-v1',
        userInput: 'Hello',
        createdBy: 'user',
        tenantId: 'tenant'
      })
      assert.ok(result.session)
      assert.ok(result.execution)
      assert.equal(result.session.status, 'COMPLETED')
    })

    it('should throw for non-existent config', () => {
      assert.throws(() =>
        controller.createAndRunSession({
          configId: 'non-existent',
          userInput: 'test',
          createdBy: 'user',
          tenantId: 'tenant'
        })
      , { message: /not found/ })
    })
  })

  describe('POST /agent/sessions/batch', () => {
    it('should execute batch requests', () => {
      const result = controller.batchExecute({
        items: [
          { configId: 'default-agent-v1', userInput: 'Req 1' },
          { configId: 'default-agent-v1', userInput: 'Req 2' }
        ],
        createdBy: 'user',
        tenantId: 'tenant'
      })
      assert.equal(result.total, 2)
      assert.equal(result.succeeded, 2)
    })
  })

  describe('GET /agent/sessions', () => {
    it('should return all sessions', () => {
      // First create a session
      controller.createAndRunSession({
        configId: 'default-agent-v1',
        userInput: 'test',
        createdBy: 'user',
        tenantId: 'tenant'
      })
      const sessions = controller.getSessions()
      assert.ok(sessions.length >= 1)
    })
  })

  describe('GET /agent/sessions/:id', () => {
    it('should return session by id', () => {
      const result = controller.createAndRunSession({
        configId: 'default-agent-v1',
        userInput: 'test',
        createdBy: 'user',
        tenantId: 'tenant'
      })
      const session = controller.getSession(result.session.id)
      assert.equal(session.id, result.session.id)
    })

    it('should throw for non-existent session', () => {
      assert.throws(() => controller.getSession('non-existent'), { message: /not found/ })
    })
  })

  describe('GET /agent/sessions/:id/execution', () => {
    it('should return session execution', () => {
      const result = controller.createAndRunSession({
        configId: 'default-agent-v1',
        userInput: 'test',
        createdBy: 'user',
        tenantId: 'tenant'
      })
      const execution = controller.getSessionExecution(result.session.id)
      assert.equal(execution.sessionId, result.session.id)
    })

    it('should throw for non-existent execution', () => {
      assert.throws(() => controller.getSessionExecution('non-existent'), { message: /not found/ })
    })
  })

  describe('GET /agent/sessions/:id/evaluation', () => {
    it('should return session evaluation', () => {
      const eval_ = controller.submitEvaluation({
        sessionId: 'session-1',
        userInput: 'test',
        agentOutput: 'output',
        relevanceScore: 0.9,
        accuracyScore: 0.8,
        completenessScore: 0.7,
        safetyScore: 1.0,
        helpfulnessScore: 0.85,
        concisenessScore: 0.75,
        feedback: 'Good',
        evaluatedBy: 'reviewer',
        tenantId: 'tenant'
      })
      const retrieved = controller.getSessionEvaluation('session-1')
      assert.equal(retrieved.id, eval_.id)
    })

    it('should throw for non-existent evaluation', () => {
      assert.throws(() => controller.getSessionEvaluation('non-existent'), { message: /not found/ })
    })
  })

  // ── Quality Evaluation Endpoints ──

  describe('POST /agent/evaluations', () => {
    it('should submit evaluation', () => {
      const result = controller.submitEvaluation({
        sessionId: 'eval-session',
        userInput: 'in',
        agentOutput: 'out',
        relevanceScore: 0.8,
        accuracyScore: 0.8,
        completenessScore: 0.8,
        safetyScore: 0.8,
        helpfulnessScore: 0.8,
        concisenessScore: 0.8,
        feedback: 'Good',
        evaluatedBy: 'reviewer',
        tenantId: 'tenant'
      })
      assert.ok(result.id)
      assert.equal(result.overallScore, 0.8)
    })
  })

  describe('GET /agent/evaluations', () => {
    it('should return all evaluations', () => {
      controller.submitEvaluation({
        sessionId: 's1', userInput: 'i', agentOutput: 'o',
        relevanceScore: 0.9, accuracyScore: 0.9,
        completenessScore: 0.9, safetyScore: 0.9,
        helpfulnessScore: 0.9, concisenessScore: 0.9,
        feedback: 'f', evaluatedBy: 'r', tenantId: 't'
      })
      const evals = controller.getEvaluations()
      assert.ok(evals.length >= 1)
    })
  })

  // ── Stats Endpoint ──

  describe('GET /agent/stats', () => {
    it('should return stats', () => {
      const stats = controller.getStats()
      assert.ok(stats.totalSessions >= 0)
    })

    it('should filter by tenantId', () => {
      const stats = controller.getStats('my-tenant')
      assert.equal(stats.tenantId, 'my-tenant')
    })
  })

  // ── Tool Registry Endpoint ──

  describe('GET /agent/tools', () => {
    it('should list tools', () => {
      const tools = controller.getTools()
      assert.ok(tools)
    })
  })
})
