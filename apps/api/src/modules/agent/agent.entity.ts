/**
 * agent.entity.ts - Agent 模块实体定义
 *
 * 定义 Agent 运行的核心实体：
 * - AgentConfig: Agent 配置
 * - AgentSession: Agent 运行会话
 * - AgentMessage: Agent 消息记录
 * - AgentToolCall: 工具调用记录
 * - AgentExecution: 执行记录
 * - QualityEvaluation: 质量评估结果
 */

/** Agent 运行时配置 */
export interface AgentConfig {
  /** Agent 唯一标识 */
  id: string
  /** Agent 名称 */
  name: string
  /** 系统提示词 */
  systemPrompt: string
  /** LLM 模型名称 */
  model: string
  /** 最大推理步数 */
  maxSteps: number
  /** 是否启用反思 (Reflection) */
  enableReflection: boolean
  /** 允许使用的工具名称列表 */
  allowedTools: string[]
  /** 超时时间 (ms) */
  timeoutMs: number
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 租户 ID */
  tenantId: string
}

/** Agent 运行会话 */
export interface AgentSession {
  /** 会话 ID */
  id: string
  /** Agent 配置 ID */
  configId: string
  /** 会话状态 */
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  /** 用户输入 */
  userInput: string
  /** 最终输出 */
  finalOutput?: string
  /** 当前步数 */
  currentStep: number
  /** 最大步数 */
  maxSteps: number
  /** 是否启用反思 */
  enableReflection: boolean
  /** 消息列表 */
  messages: AgentMessage[]
  /** 错误信息 */
  error?: string
  /** 开始时间 */
  startedAt?: string
  /** 完成时间 */
  completedAt?: string
  /** 创建时间 */
  createdAt: string
  /** 创建者 */
  createdBy: string
  /** 租户 ID */
  tenantId: string
}

/** Agent 消息 */
export interface AgentMessage {
  /** 消息 ID */
  id: string
  /** 会话 ID */
  sessionId: string
  /** 角色 */
  role: 'system' | 'user' | 'assistant' | 'tool'
  /** 消息内容 */
  content: string
  /** 工具调用 ID (role=tool) */
  toolCallId?: string
  /** 工具调用列表 (role=assistant) */
  toolCalls?: AgentToolCall[]
  /** 时间戳 */
  timestamp: string
}

/** Agent 工具调用 */
export interface AgentToolCall {
  /** 工具调用 ID */
  id: string
  /** 工具名称 */
  name: string
  /** 工具输入 */
  input: unknown
  /** 工具输出 */
  output?: unknown
  /** 执行状态 */
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  /** 执行耗时 (ms) */
  durationMs?: number
  /** 错误信息 */
  error?: string
}

/** Agent 执行记录 */
export interface AgentExecution {
  /** 执行记录 ID */
  id: string
  /** 会话 ID */
  sessionId: string
  /** Agent 配置 ID */
  configId: string
  /** 执行状态 */
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT'
  /** 执行步数 */
  steps: number
  /** 总耗时 (ms) */
  totalDurationMs: number
  /** LLM 调用次数 */
  llmCalls: number
  /** 工具调用次数 */
  toolCalls: number
  /** 错误信息 */
  error?: string
  /** 开始时间 */
  startedAt: string
  /** 完成时间 */
  completedAt?: string
  /** 租户 ID */
  tenantId: string
}

/** 质量评估结果 */
export interface QualityEvaluation {
  /** 评估 ID */
  id: string
  /** Agent 会话 ID */
  sessionId: string
  /** 用户输入 */
  userInput: string
  /** Agent 输出 */
  agentOutput: string
  /** 相关性分数 0-1 */
  relevanceScore: number
  /** 准确性分数 0-1 */
  accuracyScore: number
  /** 完整性分数 0-1 */
  completenessScore: number
  /** 安全性分数 0-1 */
  safetyScore: number
  /** 有用性分数 0-1 */
  helpfulnessScore: number
  /** 简洁性分数 0-1 */
  concisenessScore: number
  /** 综合分数 0-1 */
  overallScore: number
  /** 评估意见 */
  feedback: string
  /** 评估时间 */
  evaluatedAt: string
  /** 评估人 */
  evaluatedBy: string
  /** 租户 ID */
  tenantId: string
}

/** 创建 Agent 会话请求 */
export interface CreateSessionRequest {
  /** Agent 配置 ID */
  configId: string
  /** 用户输入 */
  userInput: string
  /** 最大步数 (覆盖配置) */
  maxSteps?: number
  /** 是否启用反思 (覆盖配置) */
  enableReflection?: boolean
  /** 创建者 */
  createdBy: string
  /** 租户 ID */
  tenantId: string
}

/** Agent 会话执行响应 */
export interface SessionExecutionResult {
  /** 会话 */
  session: AgentSession
  /** 执行记录 */
  execution: AgentExecution
  /** 质量评估 (可选) */
  evaluation?: QualityEvaluation
  /** 时间戳 */
  timestamp: string
}

/** 批量 Agent 请求 */
export interface BatchAgentRequest {
  /** 请求项列表 */
  items: Array<{
    configId: string
    userInput: string
    maxSteps?: number
    enableReflection?: boolean
  }>
  /** 创建者 */
  createdBy: string
  /** 租户 ID */
  tenantId: string
}

/** 批量 Agent 响应 */
export interface BatchAgentResponse {
  /** 总请求数 */
  total: number
  /** 成功数 */
  succeeded: number
  /** 失败数 */
  failed: number
  /** 结果列表 */
  results: Array<{
    index: number
    session: AgentSession
    execution: AgentExecution
  }>
  /** 时间戳 */
  timestamp: string
}

/** Agent 统计 */
export interface AgentStats {
  /** 总会话数 */
  totalSessions: number
  /** 成功会话数 */
  completedSessions: number
  /** 失败会话数 */
  failedSessions: number
  /** 运行中数 */
  runningSessions: number
  /** 平均步数 */
  avgSteps: number
  /** 平均耗时 (ms) */
  avgDurationMs: number
  /** 平均 LLM 调用数 */
  avgLlmCalls: number
  /** 平均质量评分 */
  avgQualityScore: number
  /** 租户 ID */
  tenantId: string
  /** 统计时间 */
  timestamp: string
}

// ── Phase-27: Agent Session Event Stream ──

/** Agent 会话流事件 — discriminated union */
export type AgentSessionEvent =
  | { type: 'session_started'; session: AgentSession; timestamp: string }
  | { type: 'message_added'; message: AgentMessage; timestamp: string }
  | { type: 'tool_call_started'; toolCall: AgentToolCall; timestamp: string }
  | { type: 'tool_call_completed'; toolCall: AgentToolCall; timestamp: string }
  | { type: 'step_progress'; step: number; maxSteps: number; timestamp: string }
  | { type: 'reflection_started'; step: number; timestamp: string }
  | {
      type: 'session_completed'
      session: AgentSession
      execution: AgentExecution
      timestamp: string
    }
  | { type: 'session_failed'; session: AgentSession; error: string; timestamp: string }

/** Agent Session Event 回调类型 */
export type AgentSessionEventListener = (event: AgentSessionEvent) => void
