/**
 * tenant-llm DTO 单元测试
 *
 * 验证 DTO 装饰器行为：正常输入通过，无效输入被拒绝。
 */

import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  CreateLlmConfigDto,
  UpdateLlmConfigDto,
  ApplyLlmConfigDto,
  ApproveLlmConfigDto,
  LlmConfigQueryDto,
  LlmProvider,
} from './tenant-llm.dto'

// ─── CreateLlmConfigDto ────────────────────────────────────────

describe('CreateLlmConfigDto', () => {
  it('应该通过合法输入', async () => {
    const dto = plainToInstance(CreateLlmConfigDto, {
      name: '生产环境 DeepSeek',
      provider: LlmProvider.DEEPSEEK,
      modelName: 'deepseek-chat',
      apiKey: 'sk-xxxxxxxxxxxxxxxx',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('应该通过带可选字段的合法输入', async () => {
    const dto = plainToInstance(CreateLlmConfigDto, {
      name: '测试配置',
      provider: LlmProvider.OPENAI,
      modelName: 'gpt-4',
      apiKey: 'sk-test',
      temperature: 0.5,
      maxTokens: 2048,
      topP: 0.9,
      quotaLimit: 50000,
      quotaAlertThreshold: 0.8,
      siteId: 'site-001',
      storeId: 'store-001',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('空名称应报错', async () => {
    const dto = plainToInstance(CreateLlmConfigDto, {
      name: '',
      provider: LlmProvider.DEEPSEEK,
      modelName: 'deepseek-chat',
      apiKey: 'sk-key',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.property === 'name')).toBe(true)
  })

  it('缺失必填字段应报错', async () => {
    const dto = plainToInstance(CreateLlmConfigDto, {})
    const errors = await validate(dto)
    // name, provider, modelName, apiKey 都必填
    const missingProps = new Set(errors.map(e => e.property))
    expect(missingProps.has('name')).toBe(true)
    expect(missingProps.has('provider')).toBe(true)
    expect(missingProps.has('modelName')).toBe(true)
    expect(missingProps.has('apiKey')).toBe(true)
  })

  it('无效的提供商枚举值应报错', async () => {
    const dto = plainToInstance(CreateLlmConfigDto, {
      name: '测试',
      provider: 'invalid_provider',
      modelName: 'gpt-4',
      apiKey: 'sk-key',
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'provider')).toBe(true)
  })

  it('temperature 超出范围应报错', async () => {
    const dto = plainToInstance(CreateLlmConfigDto, {
      name: '测试',
      provider: LlmProvider.OPENAI,
      modelName: 'gpt-4',
      apiKey: 'sk-key',
      temperature: -1,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'temperature')).toBe(true)
  })

  it('maxTokens 超出范围应报错', async () => {
    const dto = plainToInstance(CreateLlmConfigDto, {
      name: '测试',
      provider: LlmProvider.OPENAI,
      modelName: 'gpt-4',
      apiKey: 'sk-key',
      maxTokens: 200000,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'maxTokens')).toBe(true)
  })

  it('name 超长应报错', async () => {
    const dto = plainToInstance(CreateLlmConfigDto, {
      name: 'a'.repeat(101),
      provider: LlmProvider.OPENAI,
      modelName: 'gpt-4',
      apiKey: 'sk-key',
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'name')).toBe(true)
  })
})

// ─── UpdateLlmConfigDto ────────────────────────────────────────

describe('UpdateLlmConfigDto', () => {
  it('所有字段可选时应该通过空对象', async () => {
    const dto = plainToInstance(UpdateLlmConfigDto, {})
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('应该通过部分字段更新', async () => {
    const dto = plainToInstance(UpdateLlmConfigDto, {
      name: '新名称',
      temperature: 0.8,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('temperature 超出范围应报错', async () => {
    const dto = plainToInstance(UpdateLlmConfigDto, {
      temperature: 3,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'temperature')).toBe(true)
  })

  it('provider 无效枚举应报错', async () => {
    const dto = plainToInstance(UpdateLlmConfigDto, {
      provider: 'nonexistent',
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'provider')).toBe(true)
  })
})

// ─── ApplyLlmConfigDto ─────────────────────────────────────────

describe('ApplyLlmConfigDto', () => {
  it('应该通过合法申请', async () => {
    const dto = plainToInstance(ApplyLlmConfigDto, {
      configId: 'llm-abc123',
      useCase: '智能客服对话',
      expectedVolume: 1000,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('应该通过带 businessJustification 的申请', async () => {
    const dto = plainToInstance(ApplyLlmConfigDto, {
      configId: 'llm-abc123',
      useCase: '数据分析助手',
      expectedVolume: 5000,
      businessJustification: '需要 AI 辅助运营数据分析',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('空 configId 应报错', async () => {
    const dto = plainToInstance(ApplyLlmConfigDto, {
      configId: '',
      useCase: '测试',
      expectedVolume: 100,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'configId')).toBe(true)
  })

  it('空 useCase 应报错', async () => {
    const dto = plainToInstance(ApplyLlmConfigDto, {
      configId: 'llm-abc',
      useCase: '',
      expectedVolume: 100,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'useCase')).toBe(true)
  })

  it('expectedVolume 小于 1 应报错', async () => {
    const dto = plainToInstance(ApplyLlmConfigDto, {
      configId: 'llm-abc',
      useCase: '测试',
      expectedVolume: 0,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'expectedVolume')).toBe(true)
  })

  it('useCase 超长应报错', async () => {
    const dto = plainToInstance(ApplyLlmConfigDto, {
      configId: 'llm-abc',
      useCase: 'x'.repeat(501),
      expectedVolume: 100,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'useCase')).toBe(true)
  })
})

// ─── ApproveLlmConfigDto ───────────────────────────────────────

describe('ApproveLlmConfigDto', () => {
  it('应该通过合法审批（通过）', async () => {
    const dto = plainToInstance(ApproveLlmConfigDto, {
      approved: true,
      approvedBy: 'admin-001',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('应该通过合法审批（拒绝）', async () => {
    const dto = plainToInstance(ApproveLlmConfigDto, {
      approved: false,
      approvedBy: 'admin-002',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('空 approvedBy 应报错', async () => {
    const dto = plainToInstance(ApproveLlmConfigDto, {
      approved: true,
      approvedBy: '',
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'approvedBy')).toBe(true)
  })

  it('approved 不是布尔值应报错', async () => {
    const dto = plainToInstance(ApproveLlmConfigDto, {
      approved: 'yes',
      approvedBy: 'admin',
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'approved')).toBe(true)
  })
})

// ─── LlmConfigQueryDto ─────────────────────────────────────────

describe('LlmConfigQueryDto', () => {
  it('空对象应该通过', async () => {
    const dto = plainToInstance(LlmConfigQueryDto, {})
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('应该接受全部可选字段', async () => {
    const dto = plainToInstance(LlmConfigQueryDto, {
      siteId: 'site-001',
      configId: 'llm-abc',
      periodStart: '2025-01-01T00:00:00Z',
      periodEnd: '2025-12-31T23:59:59Z',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})
