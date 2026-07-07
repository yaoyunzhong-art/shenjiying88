import { Injectable, Logger } from '@nestjs/common'
import { ToolRegistry } from './tool-registry'
import type {
  AgentConfig,
  AgentSession,
  AgentMessage,
  AgentExecution,
  QualityEvaluation,
  CreateSessionRequest,
  SessionExecutionResult,
  BatchAgentRequest,
  BatchAgentResponse,
  AgentStats,
  AgentToolCall,
  AgentSessionEventListener
} from './agent.entity'

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name)

  // In-memory stores (production would use DB)
  private configs: AgentConfig[] = []
  private sessions: AgentSession[] = []
  private executions: AgentExecution[] = []
  private evaluations: QualityEvaluation[] = []

  constructor(private readonly toolRegistry: ToolRegistry) {
    this.initDefaultConfig()
  }

  /**
   * 初始化默认 Agent 配置
   */
  private initDefaultConfig(): void {
    const defaultConfig: AgentConfig = {
      id: 'default-agent-v1',
      name: 'Default Agent',
      systemPrompt: 'You are a helpful assistant for a game center management system.',
      model: 'deepseek-v4',
      maxSteps: 10,
      enableReflection: true,
      allowedTools: ['calculator'],
      timeoutMs: 30000,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tenantId: 'default'
    }
    this.configs.push(defaultConfig)
  }

  // ── Config CRUD ──

  /** 获取所有 Agent 配置 (Phase-31: 支持 tenantId 过滤) */
  getConfigs(tenantId?: string): AgentConfig[] {
    return tenantId ? this.configs.filter((c) => c.tenantId === tenantId) : this.configs
  }

  /** 获取单个 Agent 配置 (Phase-31: 支持 tenantId 校验) */
  getConfig(id: string, tenantId?: string): AgentConfig | undefined {
    const found = this.configs.find((c) => c.id === id)
    if (!found) return undefined
    if (tenantId && found.tenantId !== tenantId) return undefined
    return found
  }

  /** 创建 Agent 配置 */
  createConfig(config: AgentConfig): AgentConfig {
    const newConfig: AgentConfig = {
      ...config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.configs.push(newConfig)
    return newConfig
  }

  /** 更新 Agent 配置 */
  updateConfig(id: string, updates: Partial<AgentConfig>): AgentConfig | undefined {
    const idx = this.configs.findIndex((c) => c.id === id)
    if (idx === -1) return undefined
    this.configs[idx] = {
      ...this.configs[idx],
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    }
    return this.configs[idx]
  }

  /** 删除 Agent 配置 */
  deleteConfig(id: string): boolean {
    const idx = this.configs.findIndex((c) => c.id === id)
    if (idx === -1) return false
    this.configs.splice(idx, 1)
    return true
  }

  // ── Session Management ──

  /** 创建并运行 Agent 会话 */
  createAndRunSession(request: CreateSessionRequest): SessionExecutionResult {
    const config = this.configs.find((c) => c.id === request.configId)
    if (!config) {
      throw new Error(`Agent config ${request.configId} not found`)
    }
    if (!config.enabled) {
      throw new Error(`Agent config ${request.configId} is disabled`)
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const startedAt = new Date().toISOString()

    // 创建初始消息
    const messages: AgentMessage[] = [
      {
        id: `msg-${Date.now()}-sys`,
        sessionId,
        role: 'system',
        content: config.systemPrompt,
        timestamp: startedAt
      },
      {
        id: `msg-${Date.now()}-user`,
        sessionId,
        role: 'user',
        content: request.userInput,
        timestamp: startedAt
      }
    ]

    const session: AgentSession = {
      id: sessionId,
      configId: config.id,
      status: 'RUNNING',
      userInput: request.userInput,
      currentStep: 0,
      maxSteps: request.maxSteps ?? config.maxSteps,
      enableReflection: request.enableReflection ?? config.enableReflection,
      messages,
      startedAt,
      createdAt: startedAt,
      createdBy: request.createdBy,
      tenantId: request.tenantId
    }

    this.sessions.push(session)

    // 模拟执行 (简化版，生产环境对接真实 LLM)
    const execution = this.executeSession(session, config)

    // 更新会话状态
    const sessionIdx = this.sessions.findIndex((s) => s.id === sessionId)
    if (sessionIdx !== -1) {
      this.sessions[sessionIdx] = {
        ...this.sessions[sessionIdx],
        status: execution.status === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
        finalOutput: execution.status === 'SUCCESS'
          ? `Agent execution completed in ${execution.steps} steps`
          : execution.error,
        currentStep: execution.steps,
        completedAt: execution.completedAt
      }
    }

    return {
      session: this.sessions[sessionIdx] ?? session,
      execution,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 运行 Agent 会话并实时推送事件 (Phase-27)
   *
   * 与 createAndRunSession 行为一致,但在执行过程中通过 listener 回调推送 7 类事件:
   *   - session_started    会话开始
   *   - message_added      新增消息 (system/user/assistant/tool)
   *   - tool_call_started  工具调用开始
   *   - tool_call_completed 工具调用完成
   *   - step_progress      步数进度
   *   - reflection_started 反思开始 (enableReflection 时)
   *   - session_completed  会话完成 (终态)
   *   - session_failed     会话失败 (终态)
   *
   * 生产环境: 配合 SSE/WebSocket 推送给前端
   * 开发/测试: 传入 collector 函数累积事件用于验证
   */
  runSessionWithStream(
    request: CreateSessionRequest,
    listener: AgentSessionEventListener
  ): SessionExecutionResult {
    const config = this.configs.find((c) => c.id === request.configId)
    if (!config) {
      throw new Error(`Agent config ${request.configId} not found`)
    }
    if (!config.enabled) {
      throw new Error(`Agent config ${request.configId} is disabled`)
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const startedAt = new Date().toISOString()

    // 初始消息 (复用 createAndRunSession 逻辑)
    const messages: AgentMessage[] = [
      {
        id: `msg-${Date.now()}-sys`,
        sessionId,
        role: 'system',
        content: config.systemPrompt,
        timestamp: startedAt
      },
      {
        id: `msg-${Date.now()}-user`,
        sessionId,
        role: 'user',
        content: request.userInput,
        timestamp: startedAt
      }
    ]

    const session: AgentSession = {
      id: sessionId,
      configId: config.id,
      status: 'RUNNING',
      userInput: request.userInput,
      currentStep: 0,
      maxSteps: request.maxSteps ?? config.maxSteps,
      enableReflection: request.enableReflection ?? config.enableReflection,
      messages,
      startedAt,
      createdAt: startedAt,
      createdBy: request.createdBy,
      tenantId: request.tenantId
    }

    this.sessions.push(session)

    // ── 事件: session_started ──
    listener({
      type: 'session_started',
      session: { ...session, messages: [...messages] },
      timestamp: startedAt
    })
    // 同时推送已创建的初始消息
    for (const m of messages) {
      listener({ type: 'message_added', message: m, timestamp: startedAt })
    }

    // 执行并发射中间事件
    let execution: AgentExecution
    try {
      execution = this.executeSessionWithEvents(session, config, listener)
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      const sessionIdx = this.sessions.findIndex((s) => s.id === sessionId)
      if (sessionIdx !== -1) {
        this.sessions[sessionIdx] = {
          ...this.sessions[sessionIdx],
          status: 'FAILED',
          error,
          completedAt: new Date().toISOString()
        }
      }
      listener({
        type: 'session_failed',
        session: this.sessions[sessionIdx] ?? session,
        error,
        timestamp: new Date().toISOString()
      })
      throw err
    }

    // 更新最终状态
    const sessionIdx = this.sessions.findIndex((s) => s.id === sessionId)
    if (sessionIdx !== -1) {
      this.sessions[sessionIdx] = {
        ...this.sessions[sessionIdx],
        status: execution.status === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
        finalOutput:
          execution.status === 'SUCCESS'
            ? `Agent execution completed in ${execution.steps} steps`
            : execution.error,
        currentStep: execution.steps,
        completedAt: execution.completedAt
      }
    }

    const finalSession = this.sessions[sessionIdx] ?? session

    // ── 事件: session_completed ──
    listener({
      type: 'session_completed',
      session: finalSession,
      execution,
      timestamp: new Date().toISOString()
    })

    return {
      session: finalSession,
      execution,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 执行会话并发射中间事件 (Phase-27)
   */
  private executeSessionWithEvents(
    session: AgentSession,
    config: AgentConfig,
    listener: AgentSessionEventListener
  ): AgentExecution {
    const startTime = Date.now()
    const steps = Math.min(session.maxSteps, 5)
    let success = true
    let error: string | undefined

    try {
      for (let step = 0; step < steps; step++) {
        // 事件: step_progress
        listener({
          type: 'step_progress',
          step: step + 1,
          maxSteps: steps,
          timestamp: new Date().toISOString()
        })

        // 助手思考消息
        const thoughtMsg: AgentMessage = {
          id: `msg-${startTime}-step-${step}-thought`,
          sessionId: session.id,
          role: 'assistant',
          content: `Thought: Analyzing step ${step + 1}/${steps}...`,
          timestamp: new Date().toISOString()
        }
        session.messages.push(thoughtMsg)
        listener({ type: 'message_added', message: thoughtMsg, timestamp: thoughtMsg.timestamp })

        // 工具调用
        const toolCall: AgentToolCall = {
          id: `tc-${startTime}-${step}`,
          name: 'calculator',
          input: { expression: `${step + 1}+1` },
          status: 'PENDING',
          timestamp: new Date().toISOString()
        } as AgentToolCall & { timestamp: string }

        // 事件: tool_call_started
        listener({
          type: 'tool_call_started',
          toolCall,
          timestamp: new Date().toISOString()
        })

        // Mock 执行工具
        const completedToolCall: AgentToolCall = {
          ...toolCall,
          status: 'SUCCESS',
          output: step + 2,
          durationMs: 50
        }
        listener({
          type: 'tool_call_completed',
          toolCall: completedToolCall,
          timestamp: new Date().toISOString()
        })

        // 工具结果消息
        const toolMsg: AgentMessage = {
          id: `msg-${startTime}-step-${step}-tool`,
          sessionId: session.id,
          role: 'tool',
          content: `Tool result: ${String(completedToolCall.output)}`,
          toolCallId: completedToolCall.id,
          timestamp: new Date().toISOString()
        }
        session.messages.push(toolMsg)
        listener({ type: 'message_added', message: toolMsg, timestamp: toolMsg.timestamp })

        // 反思 (使用 session 覆盖,不是 config 默认)
        if (session.enableReflection && step === steps - 1) {
          listener({
            type: 'reflection_started',
            step: step + 1,
            timestamp: new Date().toISOString()
          })
          const refMsg: AgentMessage = {
            id: `msg-${startTime}-step-${step}-reflection`,
            sessionId: session.id,
            role: 'assistant',
            content: 'Reflection: The execution completed successfully.',
            timestamp: new Date().toISOString()
          }
          session.messages.push(refMsg)
          listener({ type: 'message_added', message: refMsg, timestamp: refMsg.timestamp })
        }
      }
    } catch (err) {
      success = false
      error = err instanceof Error ? err.message : String(err)
      this.logger.error(`Session ${session.id} failed: ${error}`)
    }

    const totalDurationMs = Date.now() - startTime

    const execution: AgentExecution = {
      id: `exec-${session.id}`,
      sessionId: session.id,
      configId: config.id,
      status: success ? 'SUCCESS' : 'FAILED',
      steps: success ? steps : session.currentStep,
      totalDurationMs,
      llmCalls: success ? steps + (config.enableReflection ? 1 : 0) : session.currentStep,
      toolCalls: success ? steps : 0,
      error,
      startedAt: session.startedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      tenantId: session.tenantId
    }

    this.executions.push(execution)
    return execution
  }

  /**
   * 模拟执行 Agent 会话
   * 生产环境: 对接 LLM (OpenAI/DeepSeek) 和工具注册中心
   */
  private executeSession(session: AgentSession, config: AgentConfig): AgentExecution {
    const startTime = Date.now()
    const steps = Math.min(session.maxSteps, 5) // Mock: 最多 5 步
    let success = true
    let error: string | undefined

    try {
      for (let step = 0; step < steps; step++) {
        const msg: AgentMessage = {
          id: `msg-${startTime}-step-${step}-thought`,
          sessionId: session.id,
          role: 'assistant',
          content: `Thought: Analyzing step ${step + 1}/${steps}...`,
          timestamp: new Date().toISOString()
        }
        session.messages.push(msg)

        // Mock 模拟一次工具调用
        const toolCall: AgentToolCall = {
          id: `tc-${startTime}-${step}`,
          name: 'calculator',
          input: { expression: `${step + 1}+1` },
          status: 'SUCCESS',
          output: step + 2,
          durationMs: 50
        }

        const wsMsg: AgentMessage = {
          id: `msg-${startTime}-step-${step}-tool`,
          sessionId: session.id,
          role: 'tool',
          content: `Tool result: ${String(toolCall.output)}`,
          toolCallId: toolCall.id,
          timestamp: new Date().toISOString()
        }
        session.messages.push(wsMsg)

        // 如果启用反思，插入反思步骤
        if (config.enableReflection && step === steps - 1) {
          const refMsg: AgentMessage = {
            id: `msg-${startTime}-step-${step}-reflection`,
            sessionId: session.id,
            role: 'assistant',
            content: 'Reflection: The execution completed successfully.',
            timestamp: new Date().toISOString()
          }
          session.messages.push(refMsg)
        }
      }
    } catch (err) {
      success = false
      error = err instanceof Error ? err.message : String(err)
      this.logger.error(`Session ${session.id} failed: ${error}`)
    }

    const totalDurationMs = Date.now() - startTime

    const execution: AgentExecution = {
      id: `exec-${session.id}`,
      sessionId: session.id,
      configId: config.id,
      status: success ? 'SUCCESS' : 'FAILED',
      steps: success ? steps : session.currentStep,
      totalDurationMs,
      llmCalls: success ? steps + (config.enableReflection ? 1 : 0) : session.currentStep,
      toolCalls: success ? steps : 0,
      error,
      startedAt: session.startedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      tenantId: session.tenantId
    }

    this.executions.push(execution)
    return execution
  }

  // ── Session Queries ──

  /** 获取所有会话 (Phase-31: 支持 tenantId 过滤) */
  getSessions(tenantId?: string): AgentSession[] {
    return tenantId ? this.sessions.filter((s) => s.tenantId === tenantId) : this.sessions
  }

  /** 获取单个会话 (Phase-31: 支持 tenantId 校验) */
  getSession(id: string, tenantId?: string): AgentSession | undefined {
    const found = this.sessions.find((s) => s.id === id)
    if (!found) return undefined
    if (tenantId && found.tenantId !== tenantId) return undefined
    return found
  }

  /** 获取会话的执行记录 */
  getSessionExecution(sessionId: string): AgentExecution | undefined {
    return this.executions.find((e) => e.sessionId === sessionId)
  }

  // ── Batch ──

  /** 批量执行 Agent 请求 */
  batchExecute(request: BatchAgentRequest): BatchAgentResponse {
    const results: BatchAgentResponse['results'] = []
    let succeeded = 0
    let failed = 0

    for (let i = 0; i < request.items.length; i++) {
      try {
        const item = request.items[i]
        const result = this.createAndRunSession({
          configId: item.configId,
          userInput: item.userInput,
          maxSteps: item.maxSteps,
          enableReflection: item.enableReflection,
          createdBy: request.createdBy,
          tenantId: request.tenantId
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
      timestamp: new Date().toISOString()
    }
  }

  // ── Quality Evaluation ──

  /** 提交质量评估 */
  submitEvaluation(evaluation: Omit<QualityEvaluation, 'id' | 'evaluatedAt'>): QualityEvaluation {
    const overallScore =
      (evaluation.relevanceScore +
        evaluation.accuracyScore +
        evaluation.completenessScore +
        evaluation.safetyScore +
        evaluation.helpfulnessScore +
        evaluation.concisenessScore) /
      6

    const newEval: QualityEvaluation = {
      ...evaluation,
      id: `eval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      overallScore: Math.round(overallScore * 100) / 100,
      evaluatedAt: new Date().toISOString()
    }
    this.evaluations.push(newEval)
    return newEval
  }

  /** 获取会话的质量评估 */
  getEvaluation(sessionId: string): QualityEvaluation | undefined {
    return this.evaluations.find((e) => e.sessionId === sessionId)
  }

  /** 获取所有质量评估 */
  /** 获取评估列表 (Phase-31: 支持 tenantId 过滤) */
  getEvaluations(tenantId?: string): QualityEvaluation[] {
    return tenantId ? this.evaluations.filter((e) => e.tenantId === tenantId) : this.evaluations
  }

  // ── Stats ──

  /** 获取 Agent 统计 */
  getStats(tenantId?: string): AgentStats {
    const filteredSessions = tenantId
      ? this.sessions.filter((s) => s.tenantId === tenantId)
      : this.sessions

    const completed = filteredSessions.filter((s) => s.status === 'COMPLETED')
    const failed = filteredSessions.filter((s) => s.status === 'FAILED')
    const running = filteredSessions.filter((s) => s.status === 'RUNNING')

    const totalSteps = completed.reduce((sum, s) => sum + s.currentStep, 0)
    const totalDuration = this.executions
      .filter((e) => completed.some((s) => s.id === e.sessionId))
      .reduce((sum, e) => sum + e.totalDurationMs, 0)

    const tenantEvaluations = tenantId
      ? this.evaluations.filter((e) => e.tenantId === tenantId)
      : this.evaluations

    const avgQuality =
      tenantEvaluations.length > 0
        ? tenantEvaluations.reduce((sum, e) => sum + e.overallScore, 0) /
          tenantEvaluations.length
        : 0

    return {
      totalSessions: filteredSessions.length,
      completedSessions: completed.length,
      failedSessions: failed.length,
      runningSessions: running.length,
      avgSteps: completed.length > 0 ? Math.round(totalSteps / completed.length) : 0,
      avgDurationMs:
        completed.length > 0 ? Math.round(totalDuration / completed.length) : 0,
      avgLlmCalls:
        completed.length > 0
          ? Math.round(
              this.executions
                .filter((e) => completed.some((s) => s.id === e.sessionId))
                .reduce((s, e) => s + e.llmCalls, 0) / completed.length
            )
          : 0,
      avgQualityScore: Math.round(avgQuality * 100) / 100,
      tenantId: tenantId ?? 'all',
      timestamp: new Date().toISOString()
    }
  }

  // ── Tool Registry Passthrough ──

  /** 注册工具 */
  registerTool(name: string, definition: unknown): boolean {
    try {
      return (this.toolRegistry as unknown as { registerTool: (name: string, def: unknown) => boolean }).registerTool(
        name,
        definition
      )

    } catch {
      return false
    }
  }

  /** 获取所有工具定义 */
  getTools(): unknown {
    return this.toolRegistry.list()
  }
}
