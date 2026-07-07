import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import type {
  AgentConfig,
  AgentSession,
  AgentMessage,
  AgentToolCall,
  AgentExecution,
  QualityEvaluation,
  CreateSessionRequest,
  SessionExecutionResult,
  BatchAgentRequest,
  BatchAgentResponse,
  AgentStats
} from './agent.entity'

describe('AgentEntity', () => {
  // ── AgentConfig ──

  it('should create a valid AgentConfig', () => {
    const config: AgentConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      systemPrompt: 'You are a test assistant.',
      model: 'deepseek-v4',
      maxSteps: 10,
      enableReflection: true,
      allowedTools: ['calculator', 'web-search'],
      timeoutMs: 30000,
      enabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      tenantId: 'tenant-1'
    }
    assert.equal(config.id, 'test-agent')
    assert.equal(config.name, 'Test Agent')
    assert.equal(config.maxSteps, 10)
    assert.equal(config.enabled, true)
    assert.ok(config.allowedTools.includes('calculator'))
    assert.equal(config.tenantId, 'tenant-1')
  })

  it('should handle AgentConfig with disabled status', () => {
    const config: AgentConfig = {
      id: 'disabled-agent',
      name: 'Disabled Agent',
      systemPrompt: 'System prompt',
      model: 'model-x',
      maxSteps: 5,
      enableReflection: false,
      allowedTools: [],
      timeoutMs: 10000,
      enabled: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      tenantId: 'tenant-1'
    }
    assert.equal(config.enabled, false)
    assert.equal(config.allowedTools.length, 0)
    assert.equal(config.enableReflection, false)
  })

  it('should handle edge: empty allowedTools and zero maxSteps', () => {
    const config: AgentConfig = {
      id: 'edge-agent',
      name: 'Edge Agent',
      systemPrompt: '',
      model: '',
      maxSteps: 0,
      enableReflection: false,
      allowedTools: [],
      timeoutMs: 0,
      enabled: false,
      createdAt: '',
      updatedAt: '',
      tenantId: ''
    }
    assert.equal(config.maxSteps, 0)
    assert.equal(config.timeoutMs, 0)
    assert.equal(config.systemPrompt, '')
    assert.deepEqual(config.allowedTools, [])
  })

  // ── AgentSession ──

  it('should create a valid AgentSession', () => {
    const session: AgentSession = {
      id: 'session-1',
      configId: 'config-1',
      status: 'RUNNING',
      userInput: 'Hello, agent!',
      currentStep: 2,
      maxSteps: 10,
      enableReflection: true,
      messages: [],
      startedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'user-1',
      tenantId: 'tenant-1'
    }
    assert.equal(session.status, 'RUNNING')
    assert.equal(session.userInput, 'Hello, agent!')
    assert.equal(session.currentStep, 2)
    assert.equal(session.createdBy, 'user-1')
  })

  it('should support all session statuses', () => {
    const statuses: AgentSession['status'][] = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']
    for (const status of statuses) {
      const session: AgentSession = {
        id: `session-${status}`,
        configId: 'config-1',
        status,
        userInput: 'test',
        currentStep: 0,
        maxSteps: 10,
        enableReflection: false,
        messages: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        createdBy: 'user-1',
        tenantId: 'tenant-1'
      }
      assert.equal(session.status, status)
    }
  })

  it('should handle completed session with final output', () => {
    const session: AgentSession = {
      id: 'session-completed',
      configId: 'config-1',
      status: 'COMPLETED',
      userInput: 'test input',
      finalOutput: 'Execution completed in 5 steps',
      currentStep: 5,
      maxSteps: 10,
      enableReflection: true,
      messages: [],
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:01:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'user-1',
      tenantId: 'tenant-1'
    }
    assert.ok(session.finalOutput)
    assert.ok(session.completedAt)
    assert.ok(new Date(session.completedAt!).getTime() >
      new Date(session.createdAt).getTime()
    )
  })

  it('should handle failed session with error', () => {
    const session: AgentSession = {
      id: 'session-failed',
      configId: 'config-1',
      status: 'FAILED',
      userInput: 'test',
      finalOutput: undefined,
      currentStep: 2,
      maxSteps: 10,
      enableReflection: false,
      messages: [],
      error: 'LLM timeout after 30000ms',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:30.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'user-1',
      tenantId: 'tenant-1'
    }
    assert.equal(session.error, 'LLM timeout after 30000ms')
    assert.equal(session.finalOutput, undefined)
  })

  // ── AgentMessage ──

  it('should create a valid AgentMessage', () => {
    const msg: AgentMessage = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'user',
      content: 'Hello!',
      timestamp: '2026-01-01T00:00:00.000Z'
    }
    assert.equal(msg.role, 'user')
    assert.equal(msg.content, 'Hello!')
    assert.equal(msg.toolCallId, undefined)
    assert.equal(msg.toolCalls, undefined)
  })

  it('should support all message roles', () => {
    const roles: AgentMessage['role'][] = ['system', 'user', 'assistant', 'tool']
    for (const role of roles) {
      const msg: AgentMessage = {
        id: `msg-${role}`,
        sessionId: 'session-1',
        role,
        content: `Message from ${role}`,
        timestamp: '2026-01-01T00:00:00.000Z'
      }
      assert.equal(msg.role, role)
    }
  })

  it('should support assistant message with tool calls', () => {
    const msg: AgentMessage = {
      id: 'msg-assistant',
      sessionId: 'session-1',
      role: 'assistant',
      content: 'I will use calculator.',
      toolCalls: [
        { id: 'tc-1', name: 'calculator', input: { expression: '2+2' }, status: 'SUCCESS', output: 4, durationMs: 50 }
      ],
      timestamp: '2026-01-01T00:00:00.000Z'
    }
    assert.equal(msg.toolCalls!.length, 1)
    assert.equal(msg.toolCalls![0].name, 'calculator')
    assert.equal(msg.toolCalls![0].output, 4)
  })

  it('should support tool message with toolCallId', () => {
    const msg: AgentMessage = {
      id: 'msg-tool',
      sessionId: 'session-1',
      role: 'tool',
      content: '4',
      toolCallId: 'tc-1',
      timestamp: '2026-01-01T00:00:00.000Z'
    }
    assert.equal(msg.toolCallId, 'tc-1')
    assert.equal(msg.role, 'tool')
  })

  // ── AgentExecution ──

  it('should create a valid AgentExecution', () => {
    const exec: AgentExecution = {
      id: 'exec-1',
      sessionId: 'session-1',
      configId: 'config-1',
      status: 'SUCCESS',
      steps: 5,
      totalDurationMs: 2500,
      llmCalls: 6,
      toolCalls: 5,
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:02.500Z',
      tenantId: 'tenant-1'
    }
    assert.equal(exec.steps, 5)
    assert.ok(exec.llmCalls > exec.steps)
    assert.equal(exec.totalDurationMs, 2500)
  })

  it('should handle execution failure', () => {
    const exec: AgentExecution = {
      id: 'exec-2',
      sessionId: 'session-2',
      configId: 'config-1',
      status: 'FAILED',
      steps: 2,
      totalDurationMs: 15000,
      llmCalls: 3,
      toolCalls: 2,
      error: 'Tool execution timeout',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:15.000Z',
      tenantId: 'tenant-1'
    }
    assert.equal(exec.status, 'FAILED')
    assert.equal(exec.error, 'Tool execution timeout')
    assert.equal(exec.toolCalls, 2)
  })

  it('should support TIMEOUT status', () => {
    const exec: AgentExecution = {
      id: 'exec-timeout',
      sessionId: 'session-3',
      configId: 'config-1',
      status: 'TIMEOUT',
      steps: 0,
      totalDurationMs: 30000,
      llmCalls: 0,
      toolCalls: 0,
      error: 'Exceeded max duration of 30000ms',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:30.000Z',
      tenantId: 'tenant-1'
    }
    assert.equal(exec.status, 'TIMEOUT')
    assert.equal(exec.totalDurationMs, 30000)
  })

  // ── QualityEvaluation ──

  it('should create a valid QualityEvaluation', () => {
    const eval_: QualityEvaluation = {
      id: 'eval-1',
      sessionId: 'session-1',
      userInput: 'test input',
      agentOutput: 'test output',
      relevanceScore: 0.9,
      accuracyScore: 0.85,
      completenessScore: 0.8,
      safetyScore: 1.0,
      helpfulnessScore: 0.9,
      concisenessScore: 0.75,
      overallScore: 0.87,
      feedback: 'Good performance overall.',
      evaluatedAt: '2026-01-01T00:00:00.000Z',
      evaluatedBy: 'reviewer-1',
      tenantId: 'tenant-1'
    }
    assert.ok(eval_.overallScore > 0)
    assert.equal(eval_.safetyScore, 1.0)
    assert.equal(eval_.evaluatedBy, 'reviewer-1')
  })

  it('should handle minimum quality scores', () => {
    const eval_: QualityEvaluation = {
      id: 'eval-min',
      sessionId: 'session-2',
      userInput: '',
      agentOutput: '',
      relevanceScore: 0,
      accuracyScore: 0,
      completenessScore: 0,
      safetyScore: 0,
      helpfulnessScore: 0,
      concisenessScore: 0,
      overallScore: 0,
      feedback: '',
      evaluatedAt: '2026-01-01T00:00:00.000Z',
      evaluatedBy: '',
      tenantId: ''
    }
    assert.equal(eval_.relevanceScore, 0)
    assert.equal(eval_.overallScore, 0)
  })

  // ── CreateSessionRequest ──

  it('should create a valid CreateSessionRequest', () => {
    const req: CreateSessionRequest = {
      configId: 'config-1',
      userInput: 'Analyze monthly report.',
      maxSteps: 15,
      enableReflection: true,
      createdBy: 'user-1',
      tenantId: 'tenant-1'
    }
    assert.equal(req.userInput, 'Analyze monthly report.')
    assert.equal(req.maxSteps, 15)
  })

  it('should handle session request without optional fields', () => {
    const req: CreateSessionRequest = {
      configId: 'config-1',
      userInput: 'Hello',
      createdBy: 'user-1',
      tenantId: 'tenant-1'
    }
    assert.equal(req.maxSteps, undefined)
    assert.equal(req.enableReflection, undefined)
  })

  // ── BatchAgentRequest / Response ──

  it('should create a valid BatchAgentRequest', () => {
    const req: BatchAgentRequest = {
      items: [
        { configId: 'config-1', userInput: 'input-1' },
        { configId: 'config-2', userInput: 'input-2', maxSteps: 20 }
      ],
      createdBy: 'user-1',
      tenantId: 'tenant-1'
    }
    assert.equal(req.items.length, 2)
    assert.equal(req.items[1].maxSteps, 20)
  })

  it('should create a valid BatchAgentResponse', () => {
    const res: BatchAgentResponse = {
      total: 2,
      succeeded: 1,
      failed: 1,
      results: [
        {
          index: 0,
          session: {
            id: 'session-1', configId: 'config-1', status: 'COMPLETED',
            userInput: 'test', currentStep: 3, maxSteps: 10,
            enableReflection: true, messages: [],
            createdAt: '', createdBy: 'user', tenantId: 'tenant'
          },
          execution: {
            id: 'exec-1', sessionId: 'session-1', configId: 'config-1',
            status: 'SUCCESS', steps: 3, totalDurationMs: 1000,
            llmCalls: 4, toolCalls: 3,
            startedAt: '', completedAt: '', tenantId: 'tenant'
          }
        }
      ],
      timestamp: '2026-01-01T00:00:00.000Z'
    }
    assert.equal(res.total, 2)
    assert.equal(res.succeeded, 1)
    assert.equal(res.failed, 1)
    assert.equal(res.results[0].index, 0)
  })

  // ── AgentStats ──

  it('should compute AgentStats correctly', () => {
    const stats: AgentStats = {
      totalSessions: 100,
      completedSessions: 80,
      failedSessions: 15,
      runningSessions: 5,
      avgSteps: 7,
      avgDurationMs: 2000,
      avgLlmCalls: 8,
      avgQualityScore: 0.85,
      tenantId: 'tenant-1',
      timestamp: '2026-01-01T00:00:00.000Z'
    }
    assert.equal(stats.completedSessions + stats.failedSessions + stats.runningSessions, stats.totalSessions)
    assert.ok(stats.avgSteps > 0)
    assert.ok(stats.avgQualityScore <= 1)
  })
})
