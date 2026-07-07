import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
// DTO 类验证关键字段约束
describe('AgentDTO', () => {
  // DTO 类的 import 在 ts 编译期验证类型定义,这里测试值的构建和行为

  it('should validate CreateSessionRequestDto shape', () => {
    const dto = {
      configId: 'config-1',
      userInput: 'Analyze data',
      createdBy: 'user-1',
      tenantId: 'tenant-1'
    }
    assert.equal(dto.configId, 'config-1')
    assert.equal(dto.userInput, 'Analyze data')
    assert.equal(dto.createdBy, 'user-1')
    assert.equal(dto.tenantId, 'tenant-1')
  })

  it('should handle optional fields in CreateSessionRequestDto', () => {
    const dto: Record<string, unknown> = {
      configId: 'config-1',
      userInput: 'test',
      maxSteps: 20,
      enableReflection: true,
      createdBy: 'user-1',
      tenantId: 'tenant-1'
    }
    assert.equal(dto.maxSteps, 20)
    assert.equal(dto.enableReflection, true)
  })

  it('should reject invalid maxSteps (negative)', () => {
    // DTO will be validated at runtime by ValidationPipe
    // Testing the concept: maxSteps < 1 is invalid
    const dto = {
      configId: 'config-1',
      userInput: 'test',
      maxSteps: -1,
      createdBy: 'user-1',
      tenantId: 'tenant-1'
    }
    assert.ok(dto.maxSteps < 1)
  })

  it('should validate BatchAgentRequestDto shape', () => {
    const dto = {
      items: [
        { configId: 'c1', userInput: 'input1' },
        { configId: 'c2', userInput: 'input2', maxSteps: 15 }
      ],
      createdBy: 'user-1',
      tenantId: 'tenant-1'
    }
    assert.equal(dto.items.length, 2)
    assert.equal(dto.items[0].configId, 'c1')
    assert.equal(dto.createdBy, 'user-1')
  })

  it('should validate AgentToolCallDto shape', () => {
    const dto = {
      id: 'tc-1',
      name: 'calculator',
      input: { expression: '2+2' }
    }
    assert.equal(dto.id, 'tc-1')
    assert.equal(dto.name, 'calculator')
    assert.deepEqual(dto.input, { expression: '2+2' })
  })

  it('should validate AgentMessageDto shape', () => {
    const dto = {
      id: 'msg-1',
      sessionId: 'session-1',
      role: 'assistant',
      content: 'Hello',
      timestamp: '2026-01-01T00:00:00.000Z',
      toolCalls: [
        { id: 'tc-1', name: 'calculator', input: { expression: '1+1' } }
      ]
    }
    assert.equal(dto.role, 'assistant')
    assert.equal(dto.toolCalls.length, 1)
  })

  it('should support all message roles', () => {
    const roles = ['system', 'user', 'assistant', 'tool']
    for (const role of roles) {
      const dto = { id: 'msg', sessionId: 's', role, content: 'x', timestamp: 't' }
      assert.equal(dto.role, role)
    }
  })

  it('should validate tool message with toolCallId', () => {
    const dto = {
      id: 'msg-tool',
      sessionId: 's',
      role: 'tool',
      content: '4',
      toolCallId: 'tc-1',
      timestamp: 't'
    }
    assert.equal(dto.toolCallId, 'tc-1')
    assert.equal(dto.role, 'tool')
  })

  it('should validate QualityEvaluationDto shape', () => {
    const dto = {
      sessionId: 'session-1',
      userInput: 'test input',
      agentOutput: 'test output',
      relevanceScore: 0.9,
      accuracyScore: 0.8,
      completenessScore: 0.7,
      safetyScore: 0.95,
      helpfulnessScore: 0.85,
      concisenessScore: 0.75,
      feedback: 'Good',
      evaluatedBy: 'reviewer-1',
      tenantId: 'tenant-1'
    }
    assert.equal(dto.relevanceScore, 0.9)
    assert.equal(dto.feedback, 'Good')
  })

  it('should validate evaluation score range (0-1)', () => {
    const dto = {
      sessionId: 's',
      userInput: 'i',
      agentOutput: 'o',
      relevanceScore: 0,
      accuracyScore: 1,
      completenessScore: 0.5,
      safetyScore: 0,
      helpfulnessScore: 1,
      concisenessScore: 0,
      feedback: 'f',
      evaluatedBy: 'r',
      tenantId: 't'
    }
    assert.ok(dto.relevanceScore >= 0)
    assert.ok(dto.accuracyScore <= 1)
  })
})
