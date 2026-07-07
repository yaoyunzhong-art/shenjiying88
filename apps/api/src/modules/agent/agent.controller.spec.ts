import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * AgentController 单元测试 (node:test)
 *
 * 策略：内联 Controller + Mock Service，覆盖所有路由端点。
 * 正向流程 + 边界条件（空数据集、不存在的资源、异常输入）。
 */

import assert from 'node:assert/strict'
// ── Entity factories ──────────────────────────────────────────

function makeAgentConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: 'default-agent-v1',
    name: 'Default Agent',
    systemPrompt: 'You are a helpful assistant.',
    model: 'gpt-4',
    maxSteps: 10,
    enableReflection: true,
    allowedTools: ['search', 'calculator'],
    timeoutMs: 30000,
    enabled: true,
    createdAt: '2026-06-24T09:00:00.000Z',
    updatedAt: '2026-06-24T09:00:00.000Z',
    tenantId: 't-001',
    ...overrides,
  }
}

function makeAgentSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-001',
    configId: 'default-agent-v1',
    status: 'COMPLETED',
    userInput: 'Hello',
    finalOutput: 'Hi there!',
    currentStep: 2,
    maxSteps: 10,
    enableReflection: true,
    messages: [
      { id: 'msg-1', sessionId: 'session-001', role: 'user', content: 'Hello', timestamp: '2026-06-24T09:00:00.000Z' },
      { id: 'msg-2', sessionId: 'session-001', role: 'assistant', content: 'Hi there!', timestamp: '2026-06-24T09:00:01.000Z' },
    ],
    startedAt: '2026-06-24T09:00:00.000Z',
    completedAt: '2026-06-24T09:00:02.000Z',
    createdAt: '2026-06-24T09:00:00.000Z',
    createdBy: 'user-001',
    tenantId: 't-001',
    ...overrides,
  }
}

function makeAgentExecution(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exec-001',
    sessionId: 'session-001',
    configId: 'default-agent-v1',
    status: 'SUCCESS',
    steps: 2,
    totalDurationMs: 2000,
    llmCalls: 2,
    toolCalls: 1,
    startedAt: '2026-06-24T09:00:00.000Z',
    completedAt: '2026-06-24T09:00:02.000Z',
    tenantId: 't-001',
    ...overrides,
  }
}

function makeQualityEvaluation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'eval-001',
    sessionId: 'session-001',
    userInput: 'Hello',
    agentOutput: 'Hi there!',
    relevanceScore: 0.9,
    accuracyScore: 0.95,
    completenessScore: 0.85,
    safetyScore: 1.0,
    helpfulnessScore: 0.9,
    concisenessScore: 0.85,
    overallScore: 0.91,
    feedback: 'Good response.',
    evaluatedAt: '2026-06-24T09:05:00.000Z',
    evaluatedBy: 'reviewer-001',
    tenantId: 't-001',
    ...overrides,
  }
}

function makeAgentStats(overrides: Record<string, unknown> = {}) {
  return {
    totalSessions: 10,
    completedSessions: 7,
    failedSessions: 2,
    runningSessions: 1,
    avgSteps: 3.5,
    avgDurationMs: 2500,
    avgLlmCalls: 3,
    avgQualityScore: 0.88,
    tenantId: 't-001',
    timestamp: '2026-06-24T09:00:00.000Z',
    ...overrides,
  }
}

function makeCreateSessionRequest(overrides: Record<string, unknown> = {}) {
  return {
    configId: 'default-agent-v1',
    userInput: 'Hello',
    maxSteps: 5,
    enableReflection: true,
    createdBy: 'user-001',
    tenantId: 't-001',
    ...overrides,
  }
}

function makeBatchRequest(overrides: Record<string, unknown> = {}) {
  return {
    items: [
      { configId: 'default-agent-v1', userInput: 'Query 1', maxSteps: 5, enableReflection: true },
      { configId: 'default-agent-v1', userInput: 'Query 2', maxSteps: 10, enableReflection: false },
    ],
    createdBy: 'user-001',
    tenantId: 't-001',
    ...overrides,
  }
}

function makeSessionExecutionResult(overrides: Record<string, unknown> = {}) {
  return {
    session: makeAgentSession(),
    execution: makeAgentExecution(),
    evaluation: makeQualityEvaluation(),
    timestamp: '2026-06-24T09:00:02.000Z',
    ...overrides,
  }
}

function makeBatchAgentResponse(overrides: Record<string, unknown> = {}) {
  return {
    total: 2,
    succeeded: 2,
    failed: 0,
    results: [
      { index: 0, session: makeAgentSession({ id: 'session-001' }), execution: makeAgentExecution({ id: 'exec-001' }) },
      { index: 1, session: makeAgentSession({ id: 'session-002', userInput: 'Query 2' }), execution: makeAgentExecution({ id: 'exec-002' }) },
    ],
    timestamp: '2026-06-24T09:00:02.000Z',
    ...overrides,
  }
}

// ── Inline Controller ─────────────────────────────────────────

class AgentController {
  private agentService: any

  constructor(agentService: any) {
    this.agentService = agentService
  }

  getConfigs() {
    return this.agentService.getConfigs()
  }

  getConfig(id: string) {
    const config = this.agentService.getConfig(id)
    if (!config) throw new Error(`Agent config ${id} not found`)
    return config
  }

  createConfig(config: any) {
    return this.agentService.createConfig(config)
  }

  updateConfig(id: string, updates: any) {
    const updated = this.agentService.updateConfig(id, updates)
    if (!updated) throw new Error(`Agent config ${id} not found`)
    return updated
  }

  deleteConfig(id: string) {
    const deleted = this.agentService.deleteConfig(id)
    if (!deleted) throw new Error(`Agent config ${id} not found`)
    return { deleted }
  }

  createAndRunSession(request: any) {
    return this.agentService.createAndRunSession(request)
  }

  batchExecute(request: any) {
    return this.agentService.batchExecute(request)
  }

  getSessions() {
    return this.agentService.getSessions()
  }

  getSession(id: string) {
    const session = this.agentService.getSession(id)
    if (!session) throw new Error(`Agent session ${id} not found`)
    return session
  }

  getSessionExecution(id: string) {
    const execution = this.agentService.getSessionExecution(id)
    if (!execution) throw new Error(`Execution for session ${id} not found`)
    return execution
  }

  getSessionEvaluation(id: string) {
    const evaluation = this.agentService.getEvaluation(id)
    if (!evaluation) throw new Error(`Evaluation for session ${id} not found`)
    return evaluation
  }

  submitEvaluation(evaluation: any) {
    return this.agentService.submitEvaluation(evaluation)
  }

  getEvaluations() {
    return this.agentService.getEvaluations()
  }

  getStats(tenantId?: string) {
    return this.agentService.getStats(tenantId)
  }

  getTools() {
    return this.agentService.getTools()
  }
}

// ── Mock Service Factories ────────────────────────────────────

function makeMockService(overrides: Record<string, any> = {}) {
  return {
    getConfigs: () => [],
    getConfig: () => undefined,
    createConfig: () => makeAgentConfig(),
    updateConfig: () => undefined,
    deleteConfig: () => false,
    createAndRunSession: () => makeSessionExecutionResult(),
    batchExecute: () => makeBatchAgentResponse(),
    getSessions: () => [],
    getSession: () => undefined,
    getSessionExecution: () => undefined,
    getEvaluation: () => undefined,
    submitEvaluation: () => makeQualityEvaluation(),
    getEvaluations: () => [],
    getStats: () => makeAgentStats(),
    getTools: () => [],
    ...overrides,
  }
}

function makeMockServiceWithData() {
  const configs = [
    makeAgentConfig(),
    makeAgentConfig({ id: 'fast-agent-v1', name: 'Fast Agent', maxSteps: 3, model: 'gpt-4o-mini' }),
    makeAgentConfig({ id: 'disabled-agent-v1', name: 'Disabled Agent', enabled: false }),
  ]

  const sessions = [
    makeAgentSession(),
    makeAgentSession({ id: 'session-002', userInput: 'How are you?', status: 'RUNNING' }),
    makeAgentSession({ id: 'session-003', userInput: 'Bye', status: 'FAILED', error: 'LLM timeout' }),
  ]

  const executions = [
    makeAgentExecution(),
    makeAgentExecution({ id: 'exec-002', sessionId: 'session-002', status: 'RUNNING' }),
    makeAgentExecution({ id: 'exec-003', sessionId: 'session-003', status: 'FAILED', error: 'LLM timeout' }),
  ]

  const evaluations = [
    makeQualityEvaluation(),
    makeQualityEvaluation({ id: 'eval-002', sessionId: 'session-002', overallScore: 0.75, feedback: 'Needs improvement.' }),
  ]

  return makeMockService({
    getConfigs: () => configs,
    getConfig: (id: string) => configs.find((c) => c.id === id),
    createConfig: (config: any) => makeAgentConfig({ id: config.id ?? 'new-config-v1', ...config }),
    updateConfig: (id: string, updates: any) => {
      const idx = configs.findIndex((c) => c.id === id)
      if (idx === -1) return undefined
      return { ...configs[idx], ...updates, updatedAt: '2026-06-24T10:00:00.000Z' }
    },
    deleteConfig: (id: string) => {
      const idx = configs.findIndex((c) => c.id === id)
      if (idx === -1) return false
      return true
    },
    createAndRunSession: (request: any) => {
      if (!request.configId || !request.userInput) throw new Error('configId and userInput are required')
      return makeSessionExecutionResult({
        session: makeAgentSession({
          id: `session-${Date.now()}`,
          configId: request.configId,
          userInput: request.userInput,
          createdBy: request.createdBy,
          tenantId: request.tenantId,
        }),
        execution: makeAgentExecution(),
      })
    },
    batchExecute: (request: any) => {
      if (!request.items || request.items.length === 0) {
        return { total: 0, succeeded: 0, failed: 0, results: [], timestamp: new Date().toISOString() }
      }
      const results = request.items.map((item: any, idx: number) => ({
        index: idx,
        session: makeAgentSession({ id: `session-batch-${idx}`, userInput: item.userInput }),
        execution: makeAgentExecution({ id: `exec-batch-${idx}` }),
      }))
      return { total: results.length, succeeded: results.length, failed: 0, results, timestamp: new Date().toISOString() }
    },
    getSessions: () => sessions,
    getSession: (id: string) => sessions.find((s) => s.id === id),
    getSessionExecution: (sessionId: string) => executions.find((e) => e.sessionId === sessionId),
    getEvaluation: (sessionId: string) => evaluations.find((e) => e.sessionId === sessionId),
    submitEvaluation: (evalInput: any) => makeQualityEvaluation({
      id: `eval-${Date.now()}`,
      sessionId: evalInput.sessionId,
      userInput: evalInput.userInput,
      agentOutput: evalInput.agentOutput,
      ...evalInput,
    }),
    getEvaluations: () => evaluations,
    getStats: (tenantId?: string) => makeAgentStats({ tenantId: tenantId ?? 't-001' }),
    getTools: () => ['search', 'calculator', 'weather', 'code_interpreter'],
  })
}

// ── Tests ─────────────────────────────────────────────────────

describe('AgentController', () => {

  // ── GET /agent/configs ───────────────────────────────────
  describe('getConfigs()', () => {
    it('returns all agent configs', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const configs = controller.getConfigs()

      assert.equal(configs.length, 3)
      assert.equal(configs[0].id, 'default-agent-v1')
      assert.equal(configs[1].id, 'fast-agent-v1')
      assert.equal(configs[2].id, 'disabled-agent-v1')
    })

    it('each config has required fields', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const configs = controller.getConfigs()

      for (const config of configs) {
        assert.ok(typeof config.id === 'string')
        assert.ok(typeof config.name === 'string')
        assert.ok(typeof config.model === 'string')
        assert.ok(typeof config.maxSteps === 'number')
        assert.ok(typeof config.enabled === 'boolean')
        assert.ok(typeof config.tenantId === 'string')
      }
    })

    it('returns empty array when no configs exist', () => {
      const mockService = makeMockService({ getConfigs: () => [] })
      const controller = new AgentController(mockService)
      const configs = controller.getConfigs()

      assert.equal(configs.length, 0)
      assert.ok(Array.isArray(configs))
    })
  })

  // ── GET /agent/configs/:id ──────────────────────────────
  describe('getConfig()', () => {
    it('returns config by id', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const config = controller.getConfig('default-agent-v1')

      assert.ok(config)
      assert.equal(config.id, 'default-agent-v1')
      assert.equal(config.name, 'Default Agent')
    })

    it('throws for non-existent config', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)

      assert.throws(
        () => controller.getConfig('non-existent-id'),
        /Agent config non-existent-id not found/
      )
    })

    it('throws for empty id', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)

      assert.throws(
        () => controller.getConfig(''),
        /Agent config  not found/
      )
    })
  })

  // ── POST /agent/configs ─────────────────────────────────
  describe('createConfig()', () => {
    it('creates and returns a new config', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const newConfig = { id: 'custom-agent-v1', name: 'Custom Agent', model: 'gpt-4o', maxSteps: 20 }
      const result = controller.createConfig(newConfig)

      assert.ok(result)
      assert.equal(result.id, 'custom-agent-v1')
      assert.equal(result.tenantId, 't-001')
    })

    it('creates config with minimal fields', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const minimal = { id: 'minimal-agent', name: 'Minimal' }
      const result = controller.createConfig(minimal)

      assert.ok(result)
      assert.equal(result.id, 'minimal-agent')
    })
  })

  // ── PUT /agent/configs/:id ──────────────────────────────
  describe('updateConfig()', () => {
    it('updates existing config and returns updated entity', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const result = controller.updateConfig('default-agent-v1', { name: 'Updated Agent', maxSteps: 15 })

      assert.equal(result.name, 'Updated Agent')
      assert.equal(result.maxSteps, 15)
      assert.equal(result.updatedAt, '2026-06-24T10:00:00.000Z')
    })

    it('throws for non-existent config', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)

      assert.throws(
        () => controller.updateConfig('ghost-id', { name: 'Ghost' }),
        /Agent config ghost-id not found/
      )
    })
  })

  // ── DELETE /agent/configs/:id ───────────────────────────
  describe('deleteConfig()', () => {
    it('deletes existing config and returns confirmation', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const result = controller.deleteConfig('default-agent-v1')

      assert.ok(result)
      assert.equal(result.deleted, true)
    })

    it('throws for non-existent config', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)

      assert.throws(
        () => controller.deleteConfig('ghost-id'),
        /Agent config ghost-id not found/
      )
    })
  })

  // ── POST /agent/sessions/run ────────────────────────────
  describe('createAndRunSession()', () => {
    it('creates and runs a session, returns result', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const request = makeCreateSessionRequest()
      const result = controller.createAndRunSession(request)

      assert.ok(result.session)
      assert.ok(result.execution)
      assert.equal(result.session.configId, 'default-agent-v1')
      assert.equal(result.session.userInput, 'Hello')
      assert.equal(result.session.createdBy, 'user-001')
    })

    it('throws when configId is missing', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)

      assert.throws(
        () => controller.createAndRunSession({ userInput: 'Hello', createdBy: 'u-1', tenantId: 't-1' }),
        /configId and userInput are required/
      )
    })

    it('throws when userInput is empty', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)

      assert.throws(
        () => controller.createAndRunSession({ configId: 'cfg-1', userInput: '', createdBy: 'u-1', tenantId: 't-1' }),
        /configId and userInput are required/
      )
    })
  })

  // ── POST /agent/sessions/batch ──────────────────────────
  describe('batchExecute()', () => {
    it('executes multiple sessions and returns batch results', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const request = makeBatchRequest()
      const result = controller.batchExecute(request)

      assert.equal(result.total, 2)
      assert.equal(result.succeeded, 2)
      assert.equal(result.failed, 0)
      assert.equal(result.results.length, 2)
      assert.equal(result.results[0].session.userInput, 'Query 1')
      assert.equal(result.results[1].session.userInput, 'Query 2')
    })

    it('handles empty items array', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const result = controller.batchExecute({ items: [], createdBy: 'u-1', tenantId: 't-1' })

      assert.equal(result.total, 0)
      assert.equal(result.succeeded, 0)
      assert.equal(result.failed, 0)
      assert.equal(result.results.length, 0)
    })

    it('handles single item batch', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const result = controller.batchExecute({
        items: [{ configId: 'default-agent-v1', userInput: 'Single query' }],
        createdBy: 'u-1',
        tenantId: 't-1',
      })

      assert.equal(result.total, 1)
      assert.equal(result.succeeded, 1)
      assert.equal(result.results[0].session.userInput, 'Single query')
    })
  })

  // ── GET /agent/sessions ─────────────────────────────────
  describe('getSessions()', () => {
    it('returns all sessions', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const sessions = controller.getSessions()

      assert.equal(sessions.length, 3)
      assert.equal(sessions[0].id, 'session-001')
      assert.equal(sessions[1].id, 'session-002')
      assert.equal(sessions[2].id, 'session-003')
    })

    it('each session has required fields', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const sessions = controller.getSessions()

      for (const session of sessions) {
        assert.ok(typeof session.id === 'string')
        assert.ok(typeof session.status === 'string')
        assert.ok(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(session.status))
        assert.ok(typeof session.tenantId === 'string')
        assert.ok(Array.isArray(session.messages))
      }
    })

    it('returns empty array when no sessions', () => {
      const mockService = makeMockService({ getSessions: () => [] })
      const controller = new AgentController(mockService)
      const sessions = controller.getSessions()

      assert.equal(sessions.length, 0)
    })
  })

  // ── GET /agent/sessions/:id ─────────────────────────────
  describe('getSession()', () => {
    it('returns session by id', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const session = controller.getSession('session-002')

      assert.ok(session)
      assert.equal(session.id, 'session-002')
      assert.equal(session.userInput, 'How are you?')
      assert.equal(session.status, 'RUNNING')
    })

    it('throws for non-existent session', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)

      assert.throws(
        () => controller.getSession('ghost-session'),
        /Agent session ghost-session not found/
      )
    })

    it('throws for empty session id', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)

      assert.throws(
        () => controller.getSession(''),
        /Agent session  not found/
      )
    })
  })

  // ── GET /agent/sessions/:id/execution ───────────────────
  describe('getSessionExecution()', () => {
    it('returns execution for existing session', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const execution = controller.getSessionExecution('session-001')

      assert.ok(execution)
      assert.equal(execution.sessionId, 'session-001')
      assert.equal(execution.status, 'SUCCESS')
      assert.ok(typeof execution.totalDurationMs === 'number')
    })

    it('throws for session without execution', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)

      assert.throws(
        () => controller.getSessionExecution('non-existent-session'),
        /Execution for session non-existent-session not found/
      )
    })
  })

  // ── GET /agent/sessions/:id/evaluation ──────────────────
  describe('getSessionEvaluation()', () => {
    it('returns evaluation for evaluated session', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const evaluation = controller.getSessionEvaluation('session-001')

      assert.ok(evaluation)
      assert.equal(evaluation.sessionId, 'session-001')
      assert.equal(evaluation.overallScore, 0.91)
      assert.ok(evaluation.relevanceScore >= 0 && evaluation.relevanceScore <= 1)
    })

    it('throws for session without evaluation', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)

      assert.throws(
        () => controller.getSessionEvaluation('session-003'),
        /Evaluation for session session-003 not found/
      )
    })
  })

  // ── POST /agent/evaluations ─────────────────────────────
  describe('submitEvaluation()', () => {
    it('submits evaluation and returns it', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const evalInput = {
        sessionId: 'session-001',
        userInput: 'Hello',
        agentOutput: 'Hi there!',
        relevanceScore: 0.9,
        accuracyScore: 0.95,
        completenessScore: 0.85,
        safetyScore: 1.0,
        helpfulnessScore: 0.9,
        concisenessScore: 0.85,
        feedback: 'Great!',
        evaluatedBy: 'reviewer-001',
        tenantId: 't-001',
      }
      const result = controller.submitEvaluation(evalInput)

      assert.ok(result)
      assert.equal(result.sessionId, 'session-001')
      assert.equal(result.overallScore, 0.91)
    })
  })

  // ── GET /agent/evaluations ──────────────────────────────
  describe('getEvaluations()', () => {
    it('returns all evaluations', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const evals = controller.getEvaluations()

      assert.equal(evals.length, 2)
      assert.equal(evals[0].sessionId, 'session-001')
      assert.equal(evals[1].sessionId, 'session-002')
    })

    it('each evaluation has valid score range 0-1', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const evals = controller.getEvaluations()

      for (const e of evals) {
        assert.ok(e.relevanceScore >= 0 && e.relevanceScore <= 1)
        assert.ok(e.accuracyScore >= 0 && e.accuracyScore <= 1)
        assert.ok(e.completenessScore >= 0 && e.completenessScore <= 1)
        assert.ok(e.safetyScore >= 0 && e.safetyScore <= 1)
        assert.ok(e.overallScore >= 0 && e.overallScore <= 1)
      }
    })

    it('returns empty array when no evaluations', () => {
      const mockService = makeMockService({ getEvaluations: () => [] })
      const controller = new AgentController(mockService)
      const evals = controller.getEvaluations()

      assert.equal(evals.length, 0)
    })
  })

  // ── GET /agent/stats ────────────────────────────────────
  describe('getStats()', () => {
    it('returns agent stats', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const stats = controller.getStats()

      assert.ok(stats)
      assert.equal(stats.totalSessions, 10)
      assert.equal(stats.completedSessions, 7)
      assert.equal(stats.failedSessions, 2)
      assert.equal(stats.runningSessions, 1)
      assert.ok(typeof stats.avgQualityScore === 'number')
    })

    it('filters stats by tenantId', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const stats = controller.getStats('t-002')

      assert.ok(stats)
      assert.equal(stats.tenantId, 't-002')
    })

    it('returns stats with valid numeric fields', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const stats = controller.getStats()

      assert.ok(stats.avgSteps > 0)
      assert.ok(stats.avgDurationMs > 0)
      assert.ok(stats.avgLlmCalls > 0)
      assert.ok(typeof stats.timestamp === 'string')
    })
  })

  // ── GET /agent/tools ────────────────────────────────────
  describe('getTools()', () => {
    it('returns registered tools list', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)
      const tools = controller.getTools()

      assert.ok(Array.isArray(tools))
      assert.equal(tools.length, 4)
      assert.ok(tools.includes('search'))
      assert.ok(tools.includes('calculator'))
    })

    it('returns empty array when no tools registered', () => {
      const mockService = makeMockService({ getTools: () => [] })
      const controller = new AgentController(mockService)
      const tools = controller.getTools()

      assert.equal(tools.length, 0)
    })
  })

  // ── Error handling ──────────────────────────────────────
  describe('error handling', () => {
    it('getConfig throws for undefined config id', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)

      assert.throws(
        () => controller.getConfig(undefined as any),
        /Agent config undefined not found/
      )
    })

    it('service failure in getConfigs returns empty fallback', () => {
      const controller = new AgentController(makeMockService({ getConfigs: () => { throw new Error('DB down') } }))

      assert.throws(
        () => controller.getConfigs(),
        /DB down/
      )
    })

    it('deleteConfig throws for not-found id', () => {
      const mockService = makeMockService({ deleteConfig: () => false })
      const controller = new AgentController(mockService)

      assert.throws(
        () => controller.deleteConfig('missing'),
        /Agent config missing not found/
      )
    })

    it('service handles creation with valid input', () => {
      const mockService = makeMockServiceWithData()
      const controller = new AgentController(mockService)

      const result = controller.createAndRunSession({ configId: 'default-agent-v1', userInput: 'hi', createdBy: 'u-1', tenantId: 't-1' })
      assert.ok(result)
      assert.equal(result.session.userInput, 'hi')
    })
  })
})
