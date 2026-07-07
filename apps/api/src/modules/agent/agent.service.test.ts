import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { AgentService } from './agent.service'
import { ToolRegistry } from './tool-registry'

describe('AgentService', () => {
  let service: AgentService
  let toolRegistry: ToolRegistry

  beforeEach(() => {
    toolRegistry = new ToolRegistry()
    service = new AgentService(toolRegistry)
  })

  // ── Config Tests ──

  it('should initialize with a default config', () => {
    const configs = service.getConfigs()
    assert.ok(configs.length > 0)
    assert.equal(configs[0].id, 'default-agent-v1')
    assert.equal(configs[0].enabled, true)
  })

  it('should create a new config', () => {
    const config = service.createConfig({
      id: 'custom-agent',
      name: 'Custom Agent',
      systemPrompt: 'Custom prompt',
      model: 'gpt-4',
      maxSteps: 20,
      enableReflection: true,
      allowedTools: ['calculator', 'web-search'],
      timeoutMs: 60000,
      enabled: true,
      createdAt: '',
      updatedAt: '',
      tenantId: 'test-tenant'
    })
    assert.equal(config.id, 'custom-agent')
    assert.ok(config.createdAt)
    assert.equal(service.getConfigs().length, 2)
  })

  it('should get config by id', () => {
    const config = service.getConfig('default-agent-v1')
    assert.ok(config)
    assert.equal(config!.name, 'Default Agent')
  })

  it('should return undefined for non-existent config', () => {
    const config = service.getConfig('non-existent')
    assert.equal(config, undefined)
  })

  it('should update existing config', () => {
    const updated = service.updateConfig('default-agent-v1', {
      name: 'Updated Agent',
      maxSteps: 15
    })
    assert.ok(updated)
    assert.equal(updated!.name, 'Updated Agent')
    assert.equal(updated!.maxSteps, 15)
  })

  it('should return undefined when updating non-existent config', () => {
    const updated = service.updateConfig('non-existent', { name: 'test' })
    assert.equal(updated, undefined)
  })

  it('should delete existing config', () => {
    const result = service.deleteConfig('default-agent-v1')
    assert.equal(result, true)
    assert.equal(service.getConfigs().length, 0)
  })

  it('should return false when deleting non-existent config', () => {
    const result = service.deleteConfig('non-existent')
    assert.equal(result, false)
  })

  // ── Session Tests ──

  it('should create and run a session successfully', () => {
    const result = service.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'Calculate 1+1',
      createdBy: 'test-user',
      tenantId: 'test-tenant'
    })
    assert.ok(result.session)
    assert.ok(result.execution)
    assert.equal(result.session.status, 'COMPLETED')
    assert.equal(result.execution.status, 'SUCCESS')
    assert.ok(result.execution.steps > 0)
  })

  it('should throw for non-existent config', () => {
    assert.throws(() => {
      service.createAndRunSession({
        configId: 'non-existent',
        userInput: 'test',
        createdBy: 'user',
        tenantId: 'tenant'
      })
    }, { message: /not found/ })
  })

  it('should throw for disabled config', () => {
    service.createConfig({
      id: 'disabled',
      name: 'D',
      systemPrompt: 'p',
      model: 'm',
      maxSteps: 5,
      enableReflection: false,
      allowedTools: [],
      timeoutMs: 0,
      enabled: false,
      createdAt: '',
      updatedAt: '',
      tenantId: 't'
    })
    assert.throws(() => {
      service.createAndRunSession({
        configId: 'disabled',
        userInput: 'test',
        createdBy: 'user',
        tenantId: 'tenant'
      })
    }, { message: /disabled/ })
  })

  it('should get all sessions', () => {
    service.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'Analysis please',
      createdBy: 'user',
      tenantId: 'tenant'
    })
    const sessions = service.getSessions()
    assert.ok(sessions.length >= 1)
  })

  it('should get session by id', () => {
    const result = service.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'Hi',
      createdBy: 'user',
      tenantId: 'tenant'
    })
    const session = service.getSession(result.session.id)
    assert.ok(session)
    assert.equal(session!.id, result.session.id)
  })

  it('should return undefined for non-existent session', () => {
    const session = service.getSession('non-existent')
    assert.equal(session, undefined)
  })

  it('should get session execution', () => {
    const result = service.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'test',
      createdBy: 'user',
      tenantId: 'tenant'
    })
    const execution = service.getSessionExecution(result.session.id)
    assert.ok(execution)
    assert.equal(execution!.sessionId, result.session.id)
  })

  it('should support custom maxSteps and reflection', () => {
    const result = service.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'Deep analysis',
      maxSteps: 3,
      enableReflection: false,
      createdBy: 'user',
      tenantId: 'tenant'
    })
    assert.equal(result.session.maxSteps, 3)
    assert.equal(result.session.enableReflection, false)
  })

  // ── Batch Tests ──

  it('should execute batch requests', () => {
    const result = service.batchExecute({
      items: [
        { configId: 'default-agent-v1', userInput: 'Req 1' },
        { configId: 'default-agent-v1', userInput: 'Req 2' }
      ],
      createdBy: 'user',
      tenantId: 'tenant'
    })
    assert.equal(result.total, 2)
    assert.equal(result.succeeded, 2)
    assert.equal(result.results.length, 2)
  })

  it('should handle partial batch failure', () => {
    const result = service.batchExecute({
      items: [
        { configId: 'default-agent-v1', userInput: 'OK' },
        { configId: 'non-existent', userInput: 'Fail' }
      ],
      createdBy: 'user',
      tenantId: 'tenant'
    })
    assert.equal(result.succeeded, 1)
    assert.equal(result.failed, 1)
  })

  it('should handle empty batch', () => {
    const result = service.batchExecute({
      items: [],
      createdBy: 'user',
      tenantId: 'tenant'
    })
    assert.equal(result.total, 0)
    assert.equal(result.succeeded, 0)
    assert.equal(result.failed, 0)
  })

  // ── Quality Evaluation Tests ──

  it('should submit and retrieve evaluation', () => {
    // 先创建会话获取 sessionId
    const sessionResult = service.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'test',
      createdBy: 'user',
      tenantId: 'tenant'
    })

    const eval_ = service.submitEvaluation({
      sessionId: sessionResult.session.id,
      userInput: 'test',
      agentOutput: 'output',
      relevanceScore: 0.9,
      accuracyScore: 0.8,
      completenessScore: 0.7,
      safetyScore: 1.0,
      helpfulnessScore: 0.85,
      concisenessScore: 0.75,
      feedback: 'Good quality',
      evaluatedBy: 'reviewer',
      tenantId: 'tenant',
      overallScore: 0.5
    })
    assert.ok(eval_.id)
    assert.ok(eval_.overallScore > 0)
    assert.ok(eval_.evaluatedAt)

    const retrieved = service.getEvaluation(sessionResult.session.id)
    assert.ok(retrieved)
    assert.equal(retrieved!.id, eval_.id)
  })

  it('should compute overallScore correctly', () => {
    const eval_ = service.submitEvaluation({
      sessionId: 'test-session-eval',
      userInput: 'in',
      agentOutput: 'out',
      relevanceScore: 1.0,
      accuracyScore: 1.0,
      completenessScore: 1.0,
      safetyScore: 1.0,
      helpfulnessScore: 1.0,
      concisenessScore: 1.0,
      feedback: 'Perfect',
      evaluatedBy: 'reviewer',
      tenantId: 'tenant',
      overallScore: 1.0
    })
    assert.equal(eval_.overallScore, 1.0)
  })

  it('should return undefined for non-existent evaluation', () => {
    const eval_ = service.getEvaluation('non-existent')
    assert.equal(eval_, undefined)
  })

  // ── Stats Tests ──

  it('should return stats', () => {
    const stats = service.getStats()
    assert.ok(stats.totalSessions >= 0)
    assert.ok(stats.avgQualityScore >= 0)
  })

  it('should return tenant-filtered stats', () => {
    const stats = service.getStats('test-tenant')
    assert.equal(stats.tenantId, 'test-tenant')
  })

  it('should update stats after sessions', () => {
    // Run some sessions first
    service.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'test1',
      createdBy: 'user',
      tenantId: 'tenant'
    })
    service.createAndRunSession({
      configId: 'default-agent-v1',
      userInput: 'test2',
      createdBy: 'user',
      tenantId: 'tenant'
    })

    const stats = service.getStats('tenant')
    assert.equal(stats.totalSessions, 2)
    assert.equal(stats.completedSessions, 2)
    assert.ok(stats.avgSteps > 0)
  })

  // ── Tool Registry Tests ──

  it('should list tools', () => {
    const tools = service.getTools()
    assert.ok(tools)
  })
})
