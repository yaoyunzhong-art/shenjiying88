/**
 * agent.contract.ts - Agent 模块跨模块契约
 *
 * 定义稳定的跨模块通信接口，供其他模块通过 cross-boundary 消费。
 * 只暴露安全的子集，隐藏实现细节。
 */

import type {
  AgentConfig,
  AgentSession,
  AgentMessage,
  AgentToolCall,
  AgentExecution,
  QualityEvaluation,
  SessionExecutionResult,
  BatchAgentResponse,
  AgentStats,
  AgentSessionEvent,
} from './agent.entity'

// ── Contract Interfaces ──

/** 跨模块安全的 Agent 配置契约 */
export interface AgentConfigContract {
  id: string
  name: string
  model: string
  maxSteps: number
  enableReflection: boolean
  enabled: boolean
  createdAt: string
  updatedAt: string
  tenantId: string
}

/** 跨模块安全的 Agent 会话契约 */
export interface AgentSessionContract {
  id: string
  configId: string
  status: string
  userInput: string
  finalOutput?: string
  currentStep: number
  maxSteps: number
  error?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  createdBy: string
  tenantId: string
}

/** 跨模块安全的 Agent 消息契约 */
export interface AgentMessageContract {
  id: string
  sessionId: string
  role: string
  content: string
  timestamp: string
  toolCallCount?: number
}

/** 跨模块安全的工具调用契约 */
export interface AgentToolCallContract {
  id: string
  name: string
  status: string
  durationMs?: number
  error?: string
}

/** 跨模块安全的执行记录契约 */
export interface AgentExecutionContract {
  id: string
  sessionId: string
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

/** 跨模块安全的质量评估契约 */
export interface QualityEvaluationContract {
  id: string
  sessionId: string
  overallScore: number
  feedback: string
  evaluatedAt: string
  evaluatedBy: string
  tenantId: string
}

/** 跨模块安全的会话执行结果契约 */
export interface SessionExecutionResultContract {
  sessionId: string
  status: string
  finalOutput?: string
  executionStatus: string
  steps: number
  totalDurationMs: number
  overallScore?: number
  timestamp: string
}

// ── Conversion Functions ──

export function toAgentConfigContract(config: AgentConfig): AgentConfigContract {
  return {
    id: config.id,
    name: config.name,
    model: config.model,
    maxSteps: config.maxSteps,
    enableReflection: config.enableReflection,
    enabled: config.enabled,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    tenantId: config.tenantId,
  }
}

export function toAgentSessionContract(session: AgentSession): AgentSessionContract {
  return {
    id: session.id,
    configId: session.configId,
    status: session.status,
    userInput: session.userInput,
    finalOutput: session.finalOutput,
    currentStep: session.currentStep,
    maxSteps: session.maxSteps,
    error: session.error,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    createdAt: session.createdAt,
    createdBy: session.createdBy,
    tenantId: session.tenantId,
  }
}

export function toAgentMessageContract(msg: AgentMessage): AgentMessageContract {
  return {
    id: msg.id,
    sessionId: msg.sessionId,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    toolCallCount: msg.toolCalls?.length ?? 0,
  }
}

export function toAgentToolCallContract(tc: AgentToolCall): AgentToolCallContract {
  return {
    id: tc.id,
    name: tc.name,
    status: tc.status,
    durationMs: tc.durationMs,
    error: tc.error,
  }
}

export function toAgentExecutionContract(exec: AgentExecution): AgentExecutionContract {
  return {
    id: exec.id,
    sessionId: exec.sessionId,
    status: exec.status,
    steps: exec.steps,
    totalDurationMs: exec.totalDurationMs,
    llmCalls: exec.llmCalls,
    toolCalls: exec.toolCalls,
    error: exec.error,
    startedAt: exec.startedAt,
    completedAt: exec.completedAt,
    tenantId: exec.tenantId,
  }
}

export function toQualityEvaluationContract(evalResult: QualityEvaluation): QualityEvaluationContract {
  return {
    id: evalResult.id,
    sessionId: evalResult.sessionId,
    overallScore: evalResult.overallScore,
    feedback: evalResult.feedback,
    evaluatedAt: evalResult.evaluatedAt,
    evaluatedBy: evalResult.evaluatedBy,
    tenantId: evalResult.tenantId,
  }
}

export function toSessionExecutionResultContract(
  result: SessionExecutionResult
): SessionExecutionResultContract {
  return {
    sessionId: result.session.id,
    status: result.session.status,
    finalOutput: result.session.finalOutput,
    executionStatus: result.execution.status,
    steps: result.execution.steps,
    totalDurationMs: result.execution.totalDurationMs,
    overallScore: result.evaluation?.overallScore,
    timestamp: result.timestamp,
  }
}

// ── Helper Functions ──

export function isSessionTerminal(session: AgentSession): boolean {
  return ['COMPLETED', 'FAILED', 'CANCELLED'].includes(session.status)
}

export function getSessionDurationMs(session: AgentSession): number | undefined {
  if (!session.startedAt || !session.completedAt) return undefined
  return new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()
}
