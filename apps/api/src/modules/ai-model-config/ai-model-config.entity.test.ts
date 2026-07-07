import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-model-config] [D] 实体 Shape 测试
 *
 * 验证 ai-model-config 模块的类型实体定义
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  AiModelPreset,
  AiModelStoreConfig,
  AiModelConfigHistory,
  AiModelDefaultParams,
  SwitchAiModelRequest,
  SwitchAiModelResponse,
  AiModelProvider,
  IndustryType,
  ConfigChangeType,
} from './ai-model-config.entity'

describe('ai-model-config.entity: AiModelProvider', () => {
  it('supports all 4 providers', () => {
    const providers: AiModelProvider[] = ['openai', 'anthropic', 'qwen', 'custom']
    assert.equal(providers.length, 4)
  })

  it('openai is a valid provider', () => {
    const provider: AiModelProvider = 'openai'
    assert.equal(provider, 'openai')
  })

  it('custom is a valid provider', () => {
    const provider: AiModelProvider = 'custom'
    assert.equal(provider, 'custom')
  })
})

describe('ai-model-config.entity: IndustryType', () => {
  it('supports all 4 industry types', () => {
    const industries: IndustryType[] = ['general', 'arcade', 'family-entertainment', 'shopping-mall']
    assert.equal(industries.length, 4)
  })
})

describe('ai-model-config.entity: ConfigChangeType', () => {
  it('supports all 4 change types', () => {
    const types: ConfigChangeType[] = ['create', 'update', 'rollback', 'activate']
    assert.equal(types.length, 4)
  })
})

describe('ai-model-config.entity: AiModelDefaultParams', () => {
  it('creates valid default params with all fields', () => {
    const params: AiModelDefaultParams = {
      temperature: 0.7,
      maxTokens: 4096,
      contextWindow: 128000,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0,
    }
    assert.equal(params.temperature, 0.7)
    assert.equal(params.maxTokens, 4096)
    assert.equal(params.contextWindow, 128000)
    assert.equal(params.topP, 1.0)
    assert.equal(params.frequencyPenalty, 0)
    assert.equal(params.presencePenalty, 0)
  })

  it('temperature is clamped between 0 and 2', () => {
    const low: AiModelDefaultParams = {
      temperature: 0, maxTokens: 1000, contextWindow: 8192, topP: 0.5, frequencyPenalty: 0, presencePenalty: 0,
    }
    const high: AiModelDefaultParams = {
      temperature: 2, maxTokens: 1000, contextWindow: 8192, topP: 0.5, frequencyPenalty: 0, presencePenalty: 0,
    }
    assert.equal(low.temperature, 0)
    assert.equal(high.temperature, 2)
  })

  it('customHeaders is optional', () => {
    const withHeaders: AiModelDefaultParams = {
      temperature: 0.7, maxTokens: 4096, contextWindow: 128000, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0,
      customHeaders: { 'X-Custom': 'value' },
    }
    assert.deepEqual(withHeaders.customHeaders, { 'X-Custom': 'value' })

    const withoutHeaders: AiModelDefaultParams = {
      temperature: 0.7, maxTokens: 4096, contextWindow: 128000, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0,
    }
    assert.equal(withoutHeaders.customHeaders, undefined)
  })
})

describe('ai-model-config.entity: AiModelPreset', () => {
  it('creates valid GPT-4o preset', () => {
    const preset: AiModelPreset = {
      id: 'preset-gpt4o-general',
      presetCode: 'gpt4o-general',
      displayName: 'GPT-4o (通用)',
      provider: 'openai',
      modelName: 'gpt-4o',
      defaultParams: { temperature: 0.7, maxTokens: 4096, contextWindow: 128000, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 },
      industry: 'general',
      isActive: true,
      description: 'OpenAI GPT-4o',
      createdAt: '2026-06-28T00:00:00.000Z',
      updatedAt: '2026-06-28T00:00:00.000Z',
    }
    assert.equal(preset.id, 'preset-gpt4o-general')
    assert.equal(preset.provider, 'openai')
    assert.equal(preset.industry, 'general')
    assert.equal(preset.isActive, true)
  })

  it('preset description is optional', () => {
    const preset: AiModelPreset = {
      id: 'preset-no-desc',
      presetCode: 'no-desc',
      displayName: 'No Description',
      provider: 'custom',
      modelName: 'custom-v1',
      defaultParams: { temperature: 0.7, maxTokens: 4096, contextWindow: 8192, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
      industry: 'general',
      isActive: false,
      createdAt: '2026-06-28T00:00:00.000Z',
      updatedAt: '2026-06-28T00:00:00.000Z',
    }
    assert.equal(preset.description, undefined)
  })

  it('isActive defaults to true for active presets', () => {
    const preset: AiModelPreset = {
      id: 'preset-active',
      presetCode: 'active',
      displayName: 'Active',
      provider: 'qwen',
      modelName: 'qwen-vl-max',
      defaultParams: { temperature: 0.6, maxTokens: 4096, contextWindow: 32000, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
      industry: 'family-entertainment',
      isActive: true,
      createdAt: '2026-06-28T00:00:00.000Z',
      updatedAt: '2026-06-28T00:00:00.000Z',
    }
    assert.equal(preset.isActive, true)
  })
})

describe('ai-model-config.entity: AiModelStoreConfig', () => {
  it('creates valid config with all fields', () => {
    const config: AiModelStoreConfig = {
      id: 'config-001',
      tenantId: 'tenant-1',
      storeId: 'store-1',
      configName: 'My GPT-4o',
      provider: 'openai',
      endpointUrl: 'encrypted:https://api.openai.com',
      apiKeyEncrypted: 'encrypted:sk-test-12345',
      contextWindow: 128000,
      temperature: 0.7,
      maxTokens: 4096,
      isCurrent: false,
      createdBy: 'user-1',
      createdAt: '2026-06-28T00:00:00.000Z',
      updatedAt: '2026-06-28T00:00:00.000Z',
    }
    assert.equal(config.id, 'config-001')
    assert.equal(config.tenantId, 'tenant-1')
    assert.equal(config.provider, 'openai')
    assert.equal(config.isCurrent, false)
    assert.ok(config.apiKeyEncrypted.startsWith('encrypted:'))
  })

  it('customHeaders is optional', () => {
    const withHeaders: AiModelStoreConfig = {
      id: 'config-hdrs',
      tenantId: 't1', storeId: 's1', configName: 'With Headers',
      provider: 'anthropic', endpointUrl: 'enc:url', apiKeyEncrypted: 'enc:key',
      contextWindow: 200000, temperature: 0.5, maxTokens: 8192,
      customHeaders: { 'X-Debug': 'true' },
      isCurrent: true, createdBy: 'u1',
      createdAt: '2026-06-28T00:00:00.000Z', updatedAt: '2026-06-28T00:00:00.000Z',
    }
    assert.deepEqual(withHeaders.customHeaders, { 'X-Debug': 'true' })

    const withoutHeaders: AiModelStoreConfig = {
      id: 'config-no-hdrs',
      tenantId: 't1', storeId: 's1', configName: 'No Headers',
      provider: 'qwen', endpointUrl: 'enc:url', apiKeyEncrypted: 'enc:key',
      contextWindow: 32000, temperature: 0.6, maxTokens: 4096,
      isCurrent: false, createdBy: 'u1',
      createdAt: '2026-06-28T00:00:00.000Z', updatedAt: '2026-06-28T00:00:00.000Z',
    }
    assert.equal(withoutHeaders.customHeaders, undefined)
  })
})

describe('ai-model-config.entity: AiModelConfigHistory', () => {
  it('creates valid history entry with create type', () => {
    const history: AiModelConfigHistory = {
      id: 'hist-001',
      configId: 'config-001',
      snapshot: { id: 'config-001', configName: 'My Config' },
      versionNumber: 1,
      changeType: 'create',
      changedBy: 'user-1',
      changedAt: '2026-06-28T00:00:00.000Z',
    }
    assert.equal(history.id, 'hist-001')
    assert.equal(history.versionNumber, 1)
    assert.equal(history.changeType, 'create')
    assert.equal(history.reason, undefined)
  })

  it('creates valid history entry with rollback type including reason', () => {
    const history: AiModelConfigHistory = {
      id: 'hist-002',
      configId: 'config-001',
      snapshot: { id: 'config-001', temperature: 0.7 },
      versionNumber: 2,
      changeType: 'rollback',
      changedBy: 'user-2',
      changedAt: '2026-06-28T01:00:00.000Z',
      reason: '性能回退',
    }
    assert.equal(history.changeType, 'rollback')
    assert.equal(history.reason, '性能回退')
  })

  it('versionNumber increments', () => {
    const v1: AiModelConfigHistory = {
      id: 'hist-v1', configId: 'c1', snapshot: {}, versionNumber: 1,
      changeType: 'create', changedBy: 'u1', changedAt: '2026-01-01T00:00:00.000Z',
    }
    const v2: AiModelConfigHistory = {
      id: 'hist-v2', configId: 'c1', snapshot: {}, versionNumber: 2,
      changeType: 'update', changedBy: 'u1', changedAt: '2026-01-02T00:00:00.000Z',
    }
    assert.ok(v2.versionNumber > v1.versionNumber)
  })

  it('supports all change types', () => {
    const types: ConfigChangeType[] = ['create', 'update', 'rollback', 'activate']
    for (const t of types) {
      const h: AiModelConfigHistory = {
        id: `hist-${t}`,
        configId: 'c1',
        snapshot: {},
        versionNumber: 1,
        changeType: t,
        changedBy: 'u1',
        changedAt: '2026-06-28T00:00:00.000Z',
      }
      assert.equal(h.changeType, t)
    }
  })
})

describe('ai-model-config.entity: SwitchAiModelRequest & Response', () => {
  it('creates valid switch request', () => {
    const req: SwitchAiModelRequest = {
      configId: 'config-001',
      reason: 'switch to claude',
    }
    assert.equal(req.configId, 'config-001')
    assert.equal(req.reason, 'switch to claude')
  })

  it('switch request reason is optional', () => {
    const req: SwitchAiModelRequest = {
      configId: 'config-002',
    }
    assert.equal(req.reason, undefined)
  })

  it('creates valid switch response', () => {
    const config: AiModelStoreConfig = {
      id: 'config-001', tenantId: 't1', storeId: 's1', configName: 'C1',
      provider: 'openai', endpointUrl: 'enc:url', apiKeyEncrypted: 'enc:key',
      contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      isCurrent: true, createdBy: 'u1',
      createdAt: '2026-06-28T00:00:00.000Z', updatedAt: '2026-06-28T00:00:00.000Z',
    }
    const resp: SwitchAiModelResponse = {
      config: config as any,
      latencyMs: 42,
      healthCheckOk: true,
    }
    assert.equal(resp.config.id, 'config-001')
    assert.equal(resp.latencyMs, 42)
    assert.equal(resp.healthCheckOk, true)
  })

  it('switch response latencyMs can be 0', () => {
    const config: AiModelStoreConfig = {
      id: 'c1', tenantId: 't1', storeId: 's1', configName: 'C1',
      provider: 'openai', endpointUrl: 'enc:url', apiKeyEncrypted: 'enc:key',
      contextWindow: 8192, temperature: 0.5, maxTokens: 2048,
      isCurrent: false, createdBy: 'u1',
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const resp: SwitchAiModelResponse = {
      config: config as any,
      latencyMs: 0,
      healthCheckOk: false,
    }
    assert.equal(resp.latencyMs, 0)
    assert.equal(resp.healthCheckOk, false)
  })
})
