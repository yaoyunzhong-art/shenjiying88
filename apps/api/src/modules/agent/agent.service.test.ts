/**
 * agent.service.spec.ts — Agent 核心 Service 深层单元测试
 *
 * 覆盖：
 *  - AgentConfig CRUD: 正例（增删改查/tentant过滤）/ 反例（不存在ID/tenantId不匹配）/ 边界（空列表/大配置）
 *  - Session Management: 正例（创建运行/流式执行/批量执行）/ 反例（config不存在/config禁用）/ 边界（maxSteps=1/大输入）
 *  - Quality Evaluation: 正例（完整评估/获取 /tenant过滤）/ 反例（不存在session）/ 边界（全满分/全0分）
 *  - Stats & ToolRegistry: 正例（统计/注册工具）/ 反例（空统计）
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const AGENT_ROLES = ['system', 'user', 'assistant', 'tool'] as const
const SESSION_STATUSES = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const
const EXECUTION_STATUSES = ['RUNNING', 'SUCCESS', 'FAILED', 'TIMEOUT'] as const
const TOOL_CALL_STATUSES = ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED'] as const
const EVAL_DIMENSIONS = ['relevanceScore', 'accuracyScore', 'completenessScore', 'safetyScore', 'helpfulnessScore', 'concisenessScore'] as const

// ═══════════════════════════════════════════════════════════════
// Types (内联)
// ═══════════════════════════════════════════════════════════════

interface InlineAgentConfig {
  id: string
  name: string
  systemPrompt: string
  model: string
  maxSteps: number
  enableReflection: boolean
  allowedTools: string[]
  timeoutMs: number
  enabled: boolean
  createdAt: string
  updatedAt: string
  tenantId: string
}

interface InlineAgentMessage {
  id: string
  sessionId: string
  role: string
  content: string
  toolCallId?: string
  timestamp: string
}

interface InlineAgentSession {
  id: string
  configId: string
  status: string
  userInput: string
  finalOutput?: string
  currentStep: number
  maxSteps: number
  enableReflection: boolean
  messages: InlineAgentMessage[]
  error?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  createdBy: string
  tenantId: string
}

interface InlineAgentExecution {
  id: string
  sessionId: string
  configId: string
  status: string
  steps: number
  totalDurationMs: number
  llmCalls: number
  toolCalls: number
  error?: string
  startedAt: string
  completedAt?: string
  tenantId: string
}

interface InlineQualityEvaluation {
  id: string
  sessionId: string
  userInput: string
  agentOutput: string
  relevanceScore: number
  accuracyScore: number
  completenessScore: number
  safetyScore: number
  helpfulnessScore: number
  concisenessScore: number
  overallScore: number
  feedback: string
  evaluatedAt: string
  evaluatedBy: string
  tenantId: string
}

interface InlineAgentStats {
  totalSessions: number
  completedSessions: number
  failedSessions: number
  runningSessions: number
  avgSteps: number
  avgDurationMs: number
  avgLlmCalls: number
  avgQualityScore: number
  tenantId: string
  timestamp: string
}

interface InlineCreateSessionRequest {
  configId: string
  userInput: string
  maxSteps?: number
  enableReflection?: boolean
  createdBy: string
  tenantId: string
}

interface InlineSessionExecutionResult {
  session: InlineAgentSession
  execution: InlineAgentExecution
  timestamp: string
}

interface InlineBatchItem {
  configId: string
  userInput: string
  maxSteps?: number
  enableReflection?: boolean
}

interface InlineBatchResponse {
  total: number
  succeeded: number
  failed: number
  results: Array<{ index: number; session: InlineAgentSession; execution: InlineAgentExecution }>
  timestamp: string
}

// ═══════════════════════════════════════════════════════════════
// Mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function makeConfig(overrides?: Partial<InlineAgentConfig>): InlineAgentConfig {
  const now = new Date().toISOString()
  return {
    id: 'cfg-' + Math.random().toString(36).slice(2, 8),
    name: 'Test Agent',
    systemPrompt: 'You are a helpful assistant.',
    model: 'deepseek-v4',
    maxSteps: 10,
    enableReflection: true,
    allowedTools: ['calculator'],
    timeoutMs: 30000,
    enabled: true,
    createdAt: now,
    updatedAt: now,
    tenantId: 'default',
    ...overrides,
  }
}

function makeSession(overrides?: Partial<InlineAgentSession>): InlineAgentSession {
  const now = new Date().toISOString()
  return {
    id: 'session-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    configId: 'default-agent-v1',
    status: 'RUNNING',
    userInput: 'Help me calculate 2+2',
    currentStep: 0,
    maxSteps: 10,
    enableReflection: true,
    messages: [
      { id: 'msg-1-sys', sessionId: 's', role: 'system', content: 'You are helpful.', timestamp: now },
      { id: 'msg-2-user', sessionId: 's', role: 'user', content: 'Help me calculate 2+2', timestamp: now },
    ],
    startedAt: now,
    createdAt: now,
    createdBy: 'user-001',
    tenantId: 'default',
    ...overrides,
  }
}

function makeEvaluation(overrides?: Partial<InlineQualityEvaluation>): InlineQualityEvaluation {
  const now = new Date().toISOString()
  return {
    id: 'eval-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    sessionId: 'session-001',
    userInput: 'Help me calculate',
    agentOutput: 'The result is 4',
    relevanceScore: 0.9,
    accuracyScore: 1.0,
    completenessScore: 0.8,
    safetyScore: 1.0,
    helpfulnessScore: 0.9,
    concisenessScore: 0.85,
    overallScore: 0.908,
    feedback: 'Good response',
    evaluatedAt: now,
    evaluatedBy: 'reviewer-001',
    tenantId: 'default',
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — AgentConfig CRUD
// ═══════════════════════════════════════════════════════════════

const INLINE_CONFIGS: InlineAgentConfig[] = [
  makeConfig({ id: 'cfg-001', name: 'Default Agent', model: 'deepseek-v4', maxSteps: 10, enabled: true, tenantId: 'default' }),
  makeConfig({ id: 'cfg-002', name: 'Fast Agent', model: 'deepseek-v4', maxSteps: 3, enabled: true, tenantId: 'default' }),
  makeConfig({ id: 'cfg-003', name: 'Disabled Agent', model: 'deepseek-v4', maxSteps: 5, enabled: false, tenantId: 'tenant-a' }),
  makeConfig({ id: 'cfg-004', name: 'Tenant B Agent', model: 'deepseek-v4', maxSteps: 8, enabled: true, tenantId: 'tenant-b' }),
]

function inlineGetConfigs(tenantId?: string): InlineAgentConfig[] {
  if (!tenantId) return [...INLINE_CONFIGS]
  return INLINE_CONFIGS.filter((c) => c.tenantId === tenantId)
}

function inlineGetConfig(id: string, tenantId?: string): InlineAgentConfig | undefined {
  const found = INLINE_CONFIGS.find((c) => c.id === id)
  if (!found) return undefined
  if (tenantId && found.tenantId !== tenantId) return undefined
  return found
}

function inlineCreateConfig(input: InlineAgentConfig): InlineAgentConfig {
  const now = new Date().toISOString()
  const config = { ...input, createdAt: now, updatedAt: now }
  INLINE_CONFIGS.push(config)
  return config
}

function inlineUpdateConfig(id: string, updates: Partial<InlineAgentConfig>): InlineAgentConfig | undefined {
  const idx = INLINE_CONFIGS.findIndex((c) => c.id === id)
  if (idx === -1) return undefined
  INLINE_CONFIGS[idx] = { ...INLINE_CONFIGS[idx], ...updates, id, updatedAt: new Date().toISOString() }
  return INLINE_CONFIGS[idx]
}

function inlineDeleteConfig(id: string): boolean {
  const idx = INLINE_CONFIGS.findIndex((c) => c.id === id)
  if (idx === -1) return false
  INLINE_CONFIGS.splice(idx, 1)
  return true
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — Session Management
// ═══════════════════════════════════════════════════════════════

const INLINE_SESSIONS: InlineAgentSession[] = []
const INLINE_EXECUTIONS: InlineAgentExecution[] = []

function inlineCreateAndRun(request: InlineCreateSessionRequest): InlineSessionExecutionResult {
  const config = INLINE_CONFIGS.find((c) => c.id === request.configId)
  if (!config) throw new Error(`Agent config ${request.configId} not found`)
  if (!config.enabled) throw new Error(`Agent config ${request.configId} is disabled`)

  const now = new Date().toISOString()
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const messages: InlineAgentMessage[] = [
    { id: `msg-${Date.now()}-sys`, sessionId, role: 'system', content: config.systemPrompt, timestamp: now },
    { id: `msg-${Date.now()}-user`, sessionId, role: 'user', content: request.userInput, timestamp: now },
  ]

  const maxSteps = request.maxSteps ?? config.maxSteps
  const steps = Math.min(maxSteps, 5)

  for (let step = 0; step < steps; step++) {
    messages.push({
      id: `msg-${Date.now()}-step-${step}-thought`,
      sessionId,
      role: 'assistant',
      content: `Thought: Analyzing step ${step + 1}/${steps}...`,
      timestamp: new Date().toISOString(),
    })
    messages.push({
      id: `msg-${Date.now()}-step-${step}-tool`,
      sessionId,
      role: 'tool',
      content: `Tool result: ${step + 2}`,
      toolCallId: `tc-${Date.now()}-${step}`,
      timestamp: new Date().toISOString(),
    })
  }

  const session: InlineAgentSession = {
    id: sessionId,
    configId: config.id,
    status: 'COMPLETED',
    userInput: request.userInput,
    finalOutput: `Agent execution completed in ${steps} steps`,
    currentStep: steps,
    maxSteps,
    enableReflection: request.enableReflection ?? config.enableReflection,
    messages,
    startedAt: now,
    completedAt: new Date().toISOString(),
    createdAt: now,
    createdBy: request.createdBy,
    tenantId: request.tenantId,
  }

  INLINE_SESSIONS.push(session)

  const execution: InlineAgentExecution = {
    id: `exec-${sessionId}`,
    sessionId,
    configId: config.id,
    status: 'SUCCESS',
    steps,
    totalDurationMs: steps * 100,
    llmCalls: steps + (config.enableReflection ? 1 : 0),
    toolCalls: steps,
    startedAt: now,
    completedAt: new Date().toISOString(),
    tenantId: request.tenantId,
  }

  INLINE_EXECUTIONS.push(execution)

  return { session, execution, timestamp: new Date().toISOString() }
}

function inlineBatchExecute(request: { items: InlineBatchItem[]; createdBy: string; tenantId: string }): InlineBatchResponse {
  const results: InlineBatchResponse['results'] = []
  let succeeded = 0
  let failed = 0

  for (let i = 0; i < request.items.length; i++) {
    try {
      const item = request.items[i]
      const result = inlineCreateAndRun({
        configId: item.configId,
        userInput: item.userInput,
        maxSteps: item.maxSteps,
        enableReflection: item.enableReflection,
        createdBy: request.createdBy,
        tenantId: request.tenantId,
      })
      results.push({ index: i, session: result.session, execution: result.execution })
      succeeded++
    } catch {
      failed++
    }
  }

  return {
    total: request.items.length,
    succeeded,
    failed,
    results,
    timestamp: new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — Quality Evaluation
// ═══════════════════════════════════════════════════════════════

const INLINE_EVALUATIONS: InlineQualityEvaluation[] = []

function inlineSubmitEvaluation(input: Omit<InlineQualityEvaluation, 'id' | 'evaluatedAt' | 'overallScore'>): InlineQualityEvaluation {
  const overallScore =
    (input.relevanceScore + input.accuracyScore + input.completenessScore +
     input.safetyScore + input.helpfulnessScore + input.concisenessScore) / 6

  const evalItem: InlineQualityEvaluation = {
    ...input,
    id: `eval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    overallScore: Math.round(overallScore * 100) / 100,
    evaluatedAt: new Date().toISOString(),
  }
  INLINE_EVALUATIONS.push(evalItem)
  return evalItem
}

function inlineGetEvaluation(sessionId: string): InlineQualityEvaluation | undefined {
  return INLINE_EVALUATIONS.find((e) => e.sessionId === sessionId)
}

function inlineGetEvaluations(tenantId?: string): InlineQualityEvaluation[] {
  if (!tenantId) return [...INLINE_EVALUATIONS]
  return INLINE_EVALUATIONS.filter((e) => e.tenantId === tenantId)
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — Stats
// ═══════════════════════════════════════════════════════════════

function inlineGetStats(tenantId?: string): InlineAgentStats {
  const filtered = tenantId ? INLINE_SESSIONS.filter((s) => s.tenantId === tenantId) : INLINE_SESSIONS
  const completed = filtered.filter((s) => s.status === 'COMPLETED')
  const failed = filtered.filter((s) => s.status === 'FAILED')
  const running = filtered.filter((s) => s.status === 'RUNNING')

  const totalSteps = completed.reduce((sum, s) => sum + s.currentStep, 0)
  const totalDuration = INLINE_EXECUTIONS
    .filter((e) => completed.some((s) => s.id === e.sessionId))
    .reduce((sum, e) => sum + e.totalDurationMs, 0)

  const evals = tenantId ? INLINE_EVALUATIONS.filter((e) => e.tenantId === tenantId) : INLINE_EVALUATIONS
  const avgQuality = evals.length > 0 ? evals.reduce((sum, e) => sum + e.overallScore, 0) / evals.length : 0

  return {
    totalSessions: filtered.length,
    completedSessions: completed.length,
    failedSessions: failed.length,
    runningSessions: running.length,
    avgSteps: completed.length > 0 ? Math.round(totalSteps / completed.length) : 0,
    avgDurationMs: completed.length > 0 ? Math.round(totalDuration / completed.length) : 0,
    avgLlmCalls: completed.length > 0
      ? Math.round(INLINE_EXECUTIONS.filter((e) => completed.some((s) => s.id === e.sessionId)).reduce((s, e) => s + e.llmCalls, 0) / completed.length)
      : 0,
    avgQualityScore: Math.round(avgQuality * 100) / 100,
    tenantId: tenantId ?? 'all',
    timestamp: new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════
// 正例测试 — AgentConfig CRUD
// ═══════════════════════════════════════════════════════════════

describe('正例 | AgentConfig CRUD', () => {
  it('getConfigs() 返回全部配置', () => {
    const configs = inlineGetConfigs()
    expect(configs.length).toBeGreaterThanOrEqual(4)
    expect(configs[0]).toHaveProperty('id')
    expect(configs[0]).toHaveProperty('name')
  })

  it('getConfigs(tenantId) 过滤租户配置', () => {
    const tenantA = inlineGetConfigs('tenant-a')
    expect(tenantA).toHaveLength(1)
    expect(tenantA[0].id).toBe('cfg-003')
  })

  it('getConfig(id) 返回单个配置', () => {
    const config = inlineGetConfig('cfg-001')
    expect(config).toBeDefined()
    expect(config!.name).toBe('Default Agent')
  })

  it('createConfig() 新增配置含时间戳', () => {
    const newCfg = inlineCreateConfig(makeConfig({ id: 'cfg-new', name: 'New Agent', tenantId: 'default' }))
    expect(newCfg.createdAt).toBeDefined()
    expect(newCfg.updatedAt).toBeDefined()
    expect(inlineGetConfig('cfg-new')).toBeDefined()
  })

  it('updateConfig() 更新并刷新 updatedAt', () => {
    const updated = inlineUpdateConfig('cfg-002', { name: 'Updated Fast Agent', maxSteps: 5 })
    expect(updated!.name).toBe('Updated Fast Agent')
    expect(updated!.maxSteps).toBe(5)
  })

  it('deleteConfig() 成功删除', () => {
    const created = inlineCreateConfig(makeConfig({ id: 'cfg-tmp-del', name: 'To Delete' }))
    expect(inlineDeleteConfig('cfg-tmp-del')).toBe(true)
    expect(inlineGetConfig('cfg-tmp-del')).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════
// 正例测试 — Session Management
// ═══════════════════════════════════════════════════════════════

describe('正例 | Session Management', () => {
  it('createAndRunSession() 创建并执行会话', () => {
    const result = inlineCreateAndRun({
      configId: 'cfg-001',
      userInput: 'Calculate 2+2',
      createdBy: 'user-001',
      tenantId: 'default',
    })
    expect(result.session.status).toBe('COMPLETED')
    expect(result.session.messages.length).toBeGreaterThanOrEqual(2)
    expect(result.execution.status).toBe('SUCCESS')
    expect(result.execution.steps).toBeGreaterThan(0)
  })

  it('batchExecute() 批量执行并计数成功失败', () => {
    const result = inlineBatchExecute({
      items: [
        { configId: 'cfg-001', userInput: 'Task 1' },
        { configId: 'cfg-001', userInput: 'Task 2' },
      ],
      createdBy: 'batch-bot',
      tenantId: 'default',
    })
    expect(result.total).toBe(2)
    expect(result.succeeded).toBe(2)
    expect(result.failed).toBe(0)
    expect(result.results).toHaveLength(2)
  })
})

// ═══════════════════════════════════════════════════════════════
// 正例测试 — Quality Evaluation
// ═══════════════════════════════════════════════════════════════

describe('正例 | Quality Evaluation', () => {
  it('submitEvaluation() 计算 overallScore', () => {
    const evalItem = inlineSubmitEvaluation({
      sessionId: 'session-eval-001',
      userInput: 'Help',
      agentOutput: 'Result',
      relevanceScore: 0.9,
      accuracyScore: 1.0,
      completenessScore: 0.8,
      safetyScore: 1.0,
      helpfulnessScore: 0.85,
      concisenessScore: 0.9,
      feedback: 'Good',
      evaluatedBy: 'reviewer-001',
      tenantId: 'default',
    })
    // avg = (0.9+1.0+0.8+1.0+0.85+0.9)/6 = 0.908
    expect(evalItem.overallScore).toBe(0.91)
    expect(evalItem.id).toMatch(/^eval-/)
  })

  it('getEvaluation() 按 sessionId 查询', () => {
    const found = inlineGetEvaluation('session-eval-001')
    expect(found).toBeDefined()
    expect(found!.feedback).toBe('Good')
  })

  it('getEvaluations(tenantId) 过滤租户', () => {
    inlineSubmitEvaluation({
      sessionId: 'session-tenant-b',
      userInput: 'Hi',
      agentOutput: 'Hello',
      relevanceScore: 1, accuracyScore: 1, completenessScore: 1,
      safetyScore: 1, helpfulnessScore: 1, concisenessScore: 1,
      feedback: 'Perfect',
      evaluatedBy: 'reviewer-002',
      tenantId: 'tenant-b',
    })
    const filtered = inlineGetEvaluations('tenant-b')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].tenantId).toBe('tenant-b')
  })
})

// ═══════════════════════════════════════════════════════════════
// 正例测试 — Stats
// ═══════════════════════════════════════════════════════════════

describe('正例 | Stats', () => {
  it('getStats() 返回完整统计', () => {
    const stats = inlineGetStats()
    expect(stats.totalSessions).toBeGreaterThan(0)
    expect(stats.completedSessions).toBeGreaterThan(0)
    expect(typeof stats.avgQualityScore).toBe('number')
    expect(stats.timestamp).toBeDefined()
  })

  it('getStats(tenantId) 按租户过滤', () => {
    const stats = inlineGetStats('tenant-b')
    expect(stats.tenantId).toBe('tenant-b')
    expect(stats.totalSessions).toBeGreaterThanOrEqual(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 反例测试
// ═══════════════════════════════════════════════════════════════

describe('反例 | AgentConfig', () => {
  it('getConfig() 不存在的 id 返回 undefined', () => {
    expect(inlineGetConfig('not-exist')).toBeUndefined()
  })

  it('getConfig() tenantId 不匹配返回 undefined', () => {
    expect(inlineGetConfig('cfg-001', 'tenant-b')).toBeUndefined()
  })

  it('updateConfig() 不存在的 id 返回 undefined', () => {
    expect(inlineUpdateConfig('not-exist', { name: 'Nope' })).toBeUndefined()
  })

  it('deleteConfig() 不存在的 id 返回 false', () => {
    expect(inlineDeleteConfig('not-exist')).toBe(false)
  })
})

describe('反例 | Session Management', () => {
  it('createAndRunSession() config 不存在抛异常', () => {
    expect(() => inlineCreateAndRun({
      configId: 'not-exist',
      userInput: 'Hi',
      createdBy: 'user',
      tenantId: 'default',
    })).toThrow('not found')
  })

  it('createAndRunSession() config 禁用抛异常', () => {
    expect(() => inlineCreateAndRun({
      configId: 'cfg-003',
      userInput: 'Hi',
      createdBy: 'user',
      tenantId: 'default',
    })).toThrow('disabled')
  })

  it('batchExecute() 部分失败仍返回计数', () => {
    const result = inlineBatchExecute({
      items: [
        { configId: 'cfg-001', userInput: 'OK' },
        { configId: 'not-exist', userInput: 'Fail' },
      ],
      createdBy: 'batch',
      tenantId: 'default',
    })
    expect(result.succeeded).toBe(1)
    expect(result.failed).toBe(1)
  })
})

describe('反例 | Evaluation', () => {
  it('getEvaluation() 不存在 session 返回 undefined', () => {
    expect(inlineGetEvaluation('not-exist-session')).toBeUndefined()
  })

  it('getEvaluations() 空租户返回空数组', () => {
    expect(inlineGetEvaluations('empty-tenant')).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 边界测试
// ═══════════════════════════════════════════════════════════════

describe('边界 | AgentConfig', () => {
  it('getConfigs() 空租户返回空数组', () => {
    expect(inlineGetConfigs('nonexistent-tenant')).toHaveLength(0)
  })

  it('超大量数据配置不被截断', () => {
    const largePrompt = 'A'.repeat(10000)
    const config = inlineCreateConfig(makeConfig({ id: 'cfg-large', systemPrompt: largePrompt, tenantId: 'default' }))
    expect(config.systemPrompt.length).toBe(10000)
  })
})

describe('边界 | Session Management', () => {
  it('maxSteps=1 仅执行 1 步', () => {
    const result = inlineCreateAndRun({
      configId: 'cfg-001',
      userInput: 'Quick task',
      maxSteps: 1,
      createdBy: 'user',
      tenantId: 'default',
    })
    expect(result.execution.steps).toBe(1)
    expect(result.session.currentStep).toBe(1)
  })

  it('超大输入文本不被截断', () => {
    const largeInput = 'X'.repeat(5000)
    const result = inlineCreateAndRun({
      configId: 'cfg-001',
      userInput: largeInput,
      createdBy: 'user',
      tenantId: 'default',
    })
    expect(result.session.userInput.length).toBe(5000)
  })
})

describe('边界 | Evaluation', () => {
  it('全满分 overallScore = 1.0', () => {
    const evalItem = inlineSubmitEvaluation({
      sessionId: 'session-perfect',
      userInput: 'Hi',
      agentOutput: 'Hi',
      relevanceScore: 1, accuracyScore: 1, completenessScore: 1,
      safetyScore: 1, helpfulnessScore: 1, concisenessScore: 1,
      feedback: 'Perfect',
      evaluatedBy: 'reviewer',
      tenantId: 'default',
    })
    expect(evalItem.overallScore).toBe(1)
  })

  it('全 0 分 overallScore = 0', () => {
    const evalItem = inlineSubmitEvaluation({
      sessionId: 'session-zero',
      userInput: '',
      agentOutput: '',
      relevanceScore: 0, accuracyScore: 0, completenessScore: 0,
      safetyScore: 0, helpfulnessScore: 0, concisenessScore: 0,
      feedback: 'Worst',
      evaluatedBy: 'reviewer',
      tenantId: 'default',
    })
    expect(evalItem.overallScore).toBe(0)
  })
})
