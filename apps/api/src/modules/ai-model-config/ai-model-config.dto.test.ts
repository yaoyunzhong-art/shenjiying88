import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-model-config] [D] DTO 校验测试
 *
 * 验证 ai-model-config 模块的 class-validator DTO 定义
 */

import 'reflect-metadata'
import assert from 'node:assert'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  CreateAiModelStoreConfigDto,
  UpdateAiModelStoreConfigDto,
  SwitchAiModelDto,
  RollbackAiModelDto,
  QueryAiModelPresetDto,
} from './ai-model-config.dto'

const validCreateDto = {
  storeId: 'store-1',
  configName: 'My GPT-4o Config',
  provider: 'openai' as const,
  endpointUrl: 'https://api.openai.com/v1',
  apiKey: 'sk-test-key-12345',
  contextWindow: 128000,
  temperature: 0.7,
  maxTokens: 4096,
}

describe('CreateAiModelStoreConfigDto', () => {
  it('should validate a complete valid DTO', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, validCreateDto)
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('should reject empty configName', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, {
      ...validCreateDto,
      configName: '',
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'configName'))
  })

  it('should reject too long configName', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, {
      ...validCreateDto,
      configName: 'A'.repeat(101),
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'configName'))
  })

  it('should reject invalid provider', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, {
      ...validCreateDto,
      provider: 'invalid-provider',
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'provider'))
  })

  it('should reject invalid endpointUrl', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, {
      ...validCreateDto,
      endpointUrl: 'not a url',
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'endpointUrl'))
  })

  it('should reject empty apiKey', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, {
      ...validCreateDto,
      apiKey: '',
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'apiKey'))
  })

  it('should reject contextWindow below 1024', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, {
      ...validCreateDto,
      contextWindow: 512,
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'contextWindow'))
  })

  it('should reject contextWindow above 128000', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, {
      ...validCreateDto,
      contextWindow: 200000,
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'contextWindow'))
  })

  it('should reject temperature below 0', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, {
      ...validCreateDto,
      temperature: -0.5,
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'temperature'))
  })

  it('should reject temperature above 2', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, {
      ...validCreateDto,
      temperature: 3.0,
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'temperature'))
  })

  it('should reject maxTokens below 1', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, {
      ...validCreateDto,
      maxTokens: 0,
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'maxTokens'))
  })

  it('should reject maxTokens above 32000', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, {
      ...validCreateDto,
      maxTokens: 50000,
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'maxTokens'))
  })

  it('should accept all valid providers', async () => {
    const providers = ['openai', 'anthropic', 'qwen', 'custom']
    for (const provider of providers) {
      const dto = plainToInstance(CreateAiModelStoreConfigDto, {
        ...validCreateDto,
        configName: `Test ${provider}`,
        provider,
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0, `provider "${provider}" should be valid`)
    }
  })

  it('should accept optional customHeaders', async () => {
    const dto = plainToInstance(CreateAiModelStoreConfigDto, {
      ...validCreateDto,
      customHeaders: { 'X-Trace': 'abc123' },
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })
})

describe('UpdateAiModelStoreConfigDto', () => {
  it('should validate with all fields optional', async () => {
    const dto = plainToInstance(UpdateAiModelStoreConfigDto, {
      configName: 'Updated Name',
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('should validate empty DTO (no fields)', async () => {
    const dto = plainToInstance(UpdateAiModelStoreConfigDto, {})
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('should validate partial update with temperature only', async () => {
    const dto = plainToInstance(UpdateAiModelStoreConfigDto, {
      temperature: 0.3,
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('should reject invalid temperature', async () => {
    const dto = plainToInstance(UpdateAiModelStoreConfigDto, {
      temperature: 5,
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'temperature'))
  })

  it('should reject invalid endpointUrl in update', async () => {
    const dto = plainToInstance(UpdateAiModelStoreConfigDto, {
      endpointUrl: 'not a url',
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'endpointUrl'))
  })
})

describe('SwitchAiModelDto', () => {
  it('should validate valid switch request', async () => {
    const dto = plainToInstance(SwitchAiModelDto, {
      configId: '550e8400-e29b-41d4-a716-446655440000',
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('should validate switch request with reason', async () => {
    const dto = plainToInstance(SwitchAiModelDto, {
      configId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'Switch to better model',
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('should reject invalid UUID configId', async () => {
    const dto = plainToInstance(SwitchAiModelDto, {
      configId: 'not-a-uuid',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('should reject missing configId', async () => {
    const dto = plainToInstance(SwitchAiModelDto, {})
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'configId'))
  })
})

describe('RollbackAiModelDto', () => {
  it('should validate valid rollback request', async () => {
    const dto = plainToInstance(RollbackAiModelDto, {
      historyId: '550e8400-e29b-41d4-a716-446655440000',
      reason: 'Performance regression',
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('should reject empty reason', async () => {
    const dto = plainToInstance(RollbackAiModelDto, {
      historyId: '550e8400-e29b-41d4-a716-446655440000',
      reason: '',
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'reason'))
  })

  it('should reject missing reason', async () => {
    const dto = plainToInstance(RollbackAiModelDto, {
      historyId: '550e8400-e29b-41d4-a716-446655440000',
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'reason'))
  })

  it('should reject invalid historyId UUID', async () => {
    const dto = plainToInstance(RollbackAiModelDto, {
      historyId: 'invalid',
      reason: 'Fix issue',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

describe('QueryAiModelPresetDto', () => {
  it('should validate empty query (no filters)', async () => {
    const dto = plainToInstance(QueryAiModelPresetDto, {})
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('should validate with provider filter', async () => {
    const dto = plainToInstance(QueryAiModelPresetDto, {
      provider: 'openai',
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('should validate with industry filter', async () => {
    const dto = plainToInstance(QueryAiModelPresetDto, {
      industry: 'arcade',
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('should validate with isActive filter', async () => {
    const dto = plainToInstance(QueryAiModelPresetDto, {
      isActive: true,
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('should reject invalid provider value', async () => {
    const dto = plainToInstance(QueryAiModelPresetDto, {
      provider: 'invalid',
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'provider'))
  })

  it('should reject invalid industry value', async () => {
    const dto = plainToInstance(QueryAiModelPresetDto, {
      industry: 'invalid-industry',
    })
    const errors = await validate(dto)
    assert.ok(errors.some(e => e.property === 'industry'))
  })

  it('should accept boolean-ish isActive (coerced by Type(() => Boolean))', async () => {
    const dto = plainToInstance(QueryAiModelPresetDto, {
      isActive: 'true',
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })
})
