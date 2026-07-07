import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * agent.contract.test.ts - Agent 契约测试
 *
 * 验证跨模块转换函数正确性 + 边界情况。
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  toAgentConfigContract,
  toAgentSessionContract,
  toAgentMessageContract,
  toAgentToolCallContract,
  toAgentExecutionContract,
  toQualityEvaluationContract,
  toSessionExecutionResultContract,
  isSessionTerminal,
  getSessionDurationMs,
} from './agent.contract'
import type {
  AgentConfig,
  AgentSession,
  AgentMessage,
  AgentToolCall,
  AgentExecution,
  QualityEvaluation,
  SessionExecutionResult,
} from './agent.entity'

const BASE_TS = '2026-06-27T00:00:00.000Z'
const BASE_TS_PLUS_1 = '2026-06-27T00:01:00.000Z'

describe('AgentContract - toAgentConfigContract', () => {
  it('正常转换所有字段', () => {
    const input: AgentConfig = {
      id: 'cfg-001',
      name: '测试 Agent',
      systemPrompt: '你是助手',
      model: 'gpt-4o',
      maxSteps: 10,
      enableReflection: true,
      allowedTools: ['search', 'calc'],
      timeoutMs: 30000,
      enabled: true,
      createdAt: BASE_TS,
      updatedAt: BASE_TS,
      tenantId: 't-001',
    }
    const result = toAgentConfigContract(input)
    assert.equal(result.id, 'cfg-001')
    assert.equal(result.name, '测试 Agent')
    assert.equal(result.model, 'gpt-4o')
    assert.equal(result.maxSteps, 10)
    assert.equal(result.enableReflection, true)
    assert.equal(result.enabled, true)
    assert.equal(result.tenantId, 't-001')
    // 不暴露内部字段 (systemPrompt, allowedTools, timeoutMs)
    assert.equal((result as any).systemPrompt, undefined)
    assert.equal((result as any).allowedTools, undefined)
    assert.equal((result as any).timeoutMs, undefined)
  })

  it('边界: disable 状态正确传递', () => {
    const input: AgentConfig = {
      id: 'cfg-002',
      name: '禁用 Agent',
      systemPrompt: '',
      model: 'gpt-3.5-turbo',
      maxSteps: 5,
      enableReflection: false,
      allowedTools: [],
      timeoutMs: 10000,
      enabled: false,
      createdAt: BASE_TS,
      updatedAt: BASE_TS,
      tenantId: 't-002',
    }
    const result = toAgentConfigContract(input)
    assert.equal(result.enabled, false)
    assert.equal(result.enableReflection, false)
  })
})

describe('AgentContract - toAgentSessionContract', () => {
  it('正常转换已完成会话', () => {
    const input: AgentSession = {
      id: 'sess-001',
      configId: 'cfg-001',
      status: 'COMPLETED',
      userInput: '你好',
      finalOutput: '你好！有什么可以帮助你的？',
      currentStep: 3,
      maxSteps: 10,
      enableReflection: true,
      messages: [],
      startedAt: BASE_TS,
      completedAt: BASE_TS_PLUS_1,
      createdAt: BASE_TS,
      createdBy: 'user-001',
      tenantId: 't-001',
    }
    const result = toAgentSessionContract(input)
    assert.equal(result.id, 'sess-001')
    assert.equal(result.status, 'COMPLETED')
    assert.equal(result.finalOutput, '你好！有什么可以帮助你的？')
    assert.equal(result.completedAt, BASE_TS_PLUS_1)
    // 不暴露 messages
    assert.equal((result as any).messages, undefined)
  })

  it('边界: 失败会话无 finalOutput', () => {
    const input: AgentSession = {
      id: 'sess-002',
      configId: 'cfg-001',
      status: 'FAILED',
      userInput: '危险操作',
      finalOutput: undefined,
      currentStep: 1,
      maxSteps: 10,
      enableReflection: false,
      messages: [],
      error: 'LLM 调用超时',
      startedAt: BASE_TS,
      createdAt: BASE_TS,
      createdBy: 'user-002',
      tenantId: 't-001',
    }
    const result = toAgentSessionContract(input)
    assert.equal(result.status, 'FAILED')
    assert.equal(result.finalOutput, undefined)
    assert.equal(result.error, 'LLM 调用超时')
  })
})

describe('AgentContract - toAgentMessageContract', () => {
  it('正常转换 assistant 消息（含工具调用）', () => {
    const input: AgentMessage = {
      id: 'msg-001',
      sessionId: 'sess-001',
      role: 'assistant',
      content: '让我搜索一下',
      timestamp: BASE_TS,
      toolCalls: [
        {
          id: 'tc-001',
          name: 'search',
          input: { query: '天气' },
          status: 'SUCCESS',
          durationMs: 200,
        },
        {
          id: 'tc-002',
          name: 'calc',
          input: { expr: '1+1' },
          status: 'SUCCESS',
          durationMs: 50,
        },
      ],
    }
    const result = toAgentMessageContract(input)
    assert.equal(result.role, 'assistant')
    assert.equal(result.toolCallCount, 2)
  })

  it('边界: user 消息无工具调用', () => {
    const input: AgentMessage = {
      id: 'msg-002',
      sessionId: 'sess-001',
      role: 'user',
      content: '帮我查一下',
      timestamp: BASE_TS,
    }
    const result = toAgentMessageContract(input)
    assert.equal(result.role, 'user')
    assert.equal(result.toolCallCount, 0)
  })
})

describe('AgentContract - toAgentToolCallContract', () => {
  it('正常转换成功调用', () => {
    const input: AgentToolCall = {
      id: 'tc-001',
      name: 'search',
      input: { query: '上海天气' },
      output: { temp: 28 },
      status: 'SUCCESS',
      durationMs: 150,
    }
    const result = toAgentToolCallContract(input)
    assert.equal(result.name, 'search')
    assert.equal(result.status, 'SUCCESS')
    assert.equal(result.durationMs, 150)
    // 不暴露 input/output
    assert.equal((result as any).input, undefined)
    assert.equal((result as any).output, undefined)
  })

  it('边界: PENDING 调用无 duration/error', () => {
    const input: AgentToolCall = {
      id: 'tc-002',
      name: 'search',
      input: {},
      status: 'PENDING',
    }
    const result = toAgentToolCallContract(input)
    assert.equal(result.status, 'PENDING')
    assert.equal(result.durationMs, undefined)
    assert.equal(result.error, undefined)
  })

  it('边界: FAILED 调用有 error', () => {
    const input: AgentToolCall = {
      id: 'tc-003',
      name: 'calc',
      input: {},
      status: 'FAILED',
      error: '除以零',
    }
    const result = toAgentToolCallContract(input)
    assert.equal(result.status, 'FAILED')
    assert.equal(result.error, '除以零')
  })
})

describe('AgentContract - toAgentExecutionContract', () => {
  it('正常转换成功执行', () => {
    const input: AgentExecution = {
      id: 'exec-001',
      sessionId: 'sess-001',
      configId: 'cfg-001',
      status: 'SUCCESS',
      steps: 3,
      totalDurationMs: 5000,
      llmCalls: 4,
      toolCalls: 2,
      startedAt: BASE_TS,
      completedAt: BASE_TS_PLUS_1,
      tenantId: 't-001',
    }
    const result = toAgentExecutionContract(input)
    assert.equal(result.id, 'exec-001')
    assert.equal(result.status, 'SUCCESS')
    assert.equal(result.steps, 3)
    assert.equal(result.totalDurationMs, 5000)
    assert.equal(result.llmCalls, 4)
  })

  it('边界: TIMEOUT 执行无 completedAt', () => {
    const input: AgentExecution = {
      id: 'exec-002',
      sessionId: 'sess-002',
      configId: 'cfg-001',
      status: 'TIMEOUT',
      steps: 1,
      totalDurationMs: 30000,
      llmCalls: 1,
      toolCalls: 0,
      error: '超时',
      startedAt: BASE_TS,
      tenantId: 't-001',
    }
    const result = toAgentExecutionContract(input)
    assert.equal(result.status, 'TIMEOUT')
    assert.equal(result.completedAt, undefined)
    assert.equal(result.error, '超时')
  })
})

describe('AgentContract - toQualityEvaluationContract', () => {
  it('正常转换', () => {
    const input: QualityEvaluation = {
      id: 'eval-001',
      sessionId: 'sess-001',
      userInput: '你好',
      agentOutput: '你好！',
      relevanceScore: 0.9,
      accuracyScore: 0.95,
      completenessScore: 0.85,
      safetyScore: 1.0,
      helpfulnessScore: 0.9,
      concisenessScore: 0.8,
      overallScore: 0.9,
      feedback: '回答准确',
      evaluatedAt: BASE_TS,
      evaluatedBy: 'reviewer-001',
      tenantId: 't-001',
    }
    const result = toQualityEvaluationContract(input)
    assert.equal(result.sessionId, 'sess-001')
    assert.equal(result.overallScore, 0.9)
    assert.equal(result.feedback, '回答准确')
    // 不暴露详细评分
    assert.equal((result as any).relevanceScore, undefined)
    assert.equal((result as any).accuracyScore, undefined)
  })
})

describe('AgentContract - toSessionExecutionResultContract', () => {
  it('正常转换完整结果（含评估）', () => {
    const session: AgentSession = {
      id: 'sess-001',
      configId: 'cfg-001',
      status: 'COMPLETED',
      userInput: '你好',
      finalOutput: '回复',
      currentStep: 3,
      maxSteps: 10,
      enableReflection: true,
      messages: [],
      startedAt: BASE_TS,
      completedAt: BASE_TS_PLUS_1,
      createdAt: BASE_TS,
      createdBy: 'u-1',
      tenantId: 't-001',
    }
    const execution: AgentExecution = {
      id: 'exec-001',
      sessionId: 'sess-001',
      configId: 'cfg-001',
      status: 'SUCCESS',
      steps: 3,
      totalDurationMs: 5000,
      llmCalls: 4,
      toolCalls: 2,
      startedAt: BASE_TS,
      completedAt: BASE_TS_PLUS_1,
      tenantId: 't-001',
    }
    const evaluation: QualityEvaluation = {
      id: 'eval-001',
      sessionId: 'sess-001',
      userInput: '你好',
      agentOutput: '回复',
      relevanceScore: 0.9,
      accuracyScore: 0.9,
      completenessScore: 0.9,
      safetyScore: 1.0,
      helpfulnessScore: 0.9,
      concisenessScore: 0.8,
      overallScore: 0.9,
      feedback: '不错',
      evaluatedAt: BASE_TS,
      evaluatedBy: 'r-1',
      tenantId: 't-001',
    }
    const input: SessionExecutionResult = {
      session,
      execution,
      evaluation,
      timestamp: BASE_TS,
    }
    const result = toSessionExecutionResultContract(input)
    assert.equal(result.sessionId, 'sess-001')
    assert.equal(result.status, 'COMPLETED')
    assert.equal(result.overallScore, 0.9)
    assert.equal(result.steps, 3)
  })

  it('边界: 无评估', () => {
    const session: AgentSession = {
      id: 'sess-002',
      configId: 'cfg-001',
      status: 'FAILED',
      userInput: 'x',
      currentStep: 0,
      maxSteps: 5,
      enableReflection: false,
      messages: [],
      error: '系统错误',
      createdAt: BASE_TS,
      createdBy: 'u-1',
      tenantId: 't-001',
    }
    const execution: AgentExecution = {
      id: 'exec-002',
      sessionId: 'sess-002',
      configId: 'cfg-001',
      status: 'FAILED',
      steps: 0,
      totalDurationMs: 100,
      llmCalls: 0,
      toolCalls: 0,
      error: '系统错误',
      startedAt: BASE_TS,
      tenantId: 't-001',
    }
    const input: SessionExecutionResult = {
      session,
      execution,
      timestamp: BASE_TS,
    }
    const result = toSessionExecutionResultContract(input)
    assert.equal(result.overallScore, undefined)
    assert.equal(result.finalOutput, undefined)
  })
})

describe('AgentContract - isSessionTerminal', () => {
  it('COMPLETED 是终端状态', () => {
    assert.ok(isSessionTerminal({ status: 'COMPLETED' } as AgentSession))
  })

  it('FAILED 是终端状态', () => {
    assert.ok(isSessionTerminal({ status: 'FAILED' } as AgentSession))
  })

  it('CANCELLED 是终端状态', () => {
    assert.ok(isSessionTerminal({ status: 'CANCELLED' } as AgentSession))
  })

  it('RUNNING 不是终端状态', () => {
    assert.equal(isSessionTerminal({ status: 'RUNNING' } as AgentSession), false)
  })

  it('PENDING 不是终端状态', () => {
    assert.equal(isSessionTerminal({ status: 'PENDING' } as AgentSession), false)
  })
})

describe('AgentContract - getSessionDurationMs', () => {
  it('正常计算时长', () => {
    const session = {
      startedAt: BASE_TS,
      completedAt: BASE_TS_PLUS_1,
    } as AgentSession
    assert.equal(getSessionDurationMs(session), 60000)
  })

  it('无完成时间返回 undefined', () => {
    const session = {
      startedAt: BASE_TS,
    } as AgentSession
    assert.equal(getSessionDurationMs(session), undefined)
  })

  it('无开始时间返回 undefined', () => {
    const session = {
      completedAt: BASE_TS,
    } as AgentSession
    assert.equal(getSessionDurationMs(session), undefined)
  })
})
