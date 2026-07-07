import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-model-config] [D] 合约测试
 *
 * 验证 ai-model-config 模块的实体 Shape、业务逻辑契约、加密工具契约
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiModelConfigService } from './ai-model-config.service'
import { encryptField, decryptField, maskApiKey } from './encryption.util'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT = { tenantId: 't-1', storeId: 's-1', userId: 'u-1' } as const

function makeService(): AiModelConfigService {
  return new AiModelConfigService()
}

async function withTenant<T>(fn: () => Promise<T>): Promise<T> {
  return runWithTenant(TENANT, fn)
}

describe('[ai-model-config] 合约: 系统预设 (4 包)', () => {
  it('listPresets 返回 4 个预设', async () => {
    const svc = makeService()
    const presets = await svc.listPresets()
    assert.equal(presets.length, 4)
  })

  it('每个预设包含必要字段', async () => {
    const svc = makeService()
    for (const p of await svc.listPresets()) {
      assert.equal(typeof p.id, 'string')
      assert.equal(typeof p.presetCode, 'string')
      assert.equal(typeof p.provider, 'string')
      assert.equal(typeof p.modelName, 'string')
      assert.equal(typeof p.defaultParams, 'object')
      assert.equal(typeof p.industry, 'string')
      assert.equal(typeof p.isActive, 'boolean')
    }
  })

  it('GPT-4o 预设 provider = openai', async () => {
    const svc = makeService()
    const presets = await svc.listPresets()
    const gpt4 = presets.find(p => p.presetCode === 'gpt4o-general')
    assert.ok(gpt4)
    assert.equal(gpt4?.provider, 'openai')
    assert.equal(gpt4?.modelName, 'gpt-4o')
    assert.equal(gpt4?.defaultParams.temperature, 0.7)
  })

  it('Claude 预设 industry = arcade', async () => {
    const svc = makeService()
    const presets = await svc.listPresets()
    const claude = presets.find(p => p.presetCode === 'claude-game')
    assert.ok(claude)
    assert.equal(claude?.provider, 'anthropic')
    assert.equal(claude?.industry, 'arcade')
  })

  it('Qwen 预设 industry = family-entertainment', async () => {
    const svc = makeService()
    const presets = await svc.listPresets()
    const qwen = presets.find(p => p.presetCode === 'qwen-family')
    assert.ok(qwen)
    assert.equal(qwen?.provider, 'qwen')
    assert.equal(qwen?.industry, 'family-entertainment')
  })

  it('Custom 预设 provider = custom', async () => {
    const svc = makeService()
    const presets = await svc.listPresets()
    const custom = presets.find(p => p.presetCode === 'custom')
    assert.ok(custom)
    assert.equal(custom?.provider, 'custom')
    assert.equal(custom?.isActive, true)
  })
})

describe('[ai-model-config] 合约: 门店配置 CRUD', () => {
  const baseInput = {
    configName: 'My Config',
    provider: 'openai' as const,
    endpointUrl: 'https://api.openai.com',
    apiKey: 'sk-test-key-12345',
    contextWindow: 128000,
    temperature: 0.7,
    maxTokens: 4096,
  }

  it('创建配置包含完整字段', async () => {
    const svc = makeService()
    const config = await withTenant(() => svc.createStoreConfig({ ...baseInput, storeId: TENANT.storeId! }))
    assert.equal(typeof config.id, 'string')
    assert.equal(config.tenantId, 't-1')
    assert.equal(config.storeId, 's-1')
    assert.equal(config.configName, 'My Config')
    assert.equal(config.provider, 'openai')
    assert.equal(config.createdBy, 'u-1')
    assert.ok(config.apiKeyMasked)
    assert.ok(config.apiKeyMasked.includes('***'))
    assert.ok(Date.parse(config.createdAt) > 0)
  })

  it('列表脱敏 apiKey', async () => {
    const svc = makeService()
    await withTenant(() => svc.createStoreConfig({ ...baseInput, storeId: TENANT.storeId! }))
    const list = await withTenant(() => svc.listStoreConfigs(TENANT.storeId!))
    assert.equal(list.length, 1)
    const item = list[0] as any
    assert.ok(item.apiKeyMasked)
    assert.ok(item.apiKeyMasked.startsWith('sk-'))
    assert.ok(item.apiKeyMasked.includes('***'))
  })
})

describe('[ai-model-config] 合约: 一键切换', () => {
  it('切换后 isCurrent 更新', async () => {
    const svc = makeService()
    const c1 = await withTenant(() => svc.createStoreConfig({
      storeId: TENANT.storeId!, configName: 'C1', provider: 'openai', endpointUrl: 'https://oai.com', apiKey: 'sk-1',
      contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
    }))
    const c2 = await withTenant(() => svc.createStoreConfig({
      storeId: TENANT.storeId!, configName: 'C2', provider: 'anthropic', endpointUrl: 'https://ant.com', apiKey: 'sk-2',
      contextWindow: 200000, temperature: 0.5, maxTokens: 8192,
    }))

    const result = await withTenant(() => svc.switchConfig({ configId: c2.id, reason: 'switch' }))
    assert.equal(result.config.id, c2.id)
    assert.equal(result.config.isCurrent, true)
    assert.ok(result.latencyMs >= 0)
    assert.equal(result.healthCheckOk, true)

    const current = await withTenant(() => svc.getCurrentConfig(TENANT.storeId!))
    assert.equal(current?.id, c2.id)
    assert.equal(current?.isCurrent, true)
  })

  it('不存在的配置抛异常', async () => {
    const svc = makeService()
    await assert.rejects(
      async () => await withTenant(() => svc.switchConfig({ configId: 'non-existent' })),
      /not found/,
    )
  })
})

describe('[ai-model-config] 合约: 历史版本 + 回滚', () => {
  it('创建和切换都会记录历史', async () => {
    const svc = makeService()
    const c1 = await withTenant(() => svc.createStoreConfig({
      storeId: TENANT.storeId!, configName: 'C1', provider: 'openai', endpointUrl: 'https://oai.com', apiKey: 'sk-1',
      contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
    }))
    await withTenant(() => svc.switchConfig({ configId: c1.id }))

    const history = await withTenant(() => svc.listHistory(c1.id))
    assert.equal(history.length, 2)
    assert.equal(history[1].changeType, 'create')
    assert.equal(history[0].changeType, 'activate')
  })

  it('回滚恢复配置', async () => {
    const svc = makeService()
    const c1 = await withTenant(() => svc.createStoreConfig({
      storeId: TENANT.storeId!, configName: 'Original', provider: 'openai', endpointUrl: 'https://oai.com', apiKey: 'sk-1',
      contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
    }))
    const history = await withTenant(() => svc.listHistory(c1.id))
    const rolled = await withTenant(() => svc.rollbackToHistory(history[0].id, 'restore'))
    assert.equal(rolled.configName, 'Original')
    assert.equal(rolled.temperature, 0.7)

    const newHistory = await withTenant(() => svc.listHistory(c1.id))
    assert.equal(newHistory[0].changeType, 'rollback')
  })

  it('不存在的历史抛异常', async () => {
    const svc = makeService()
    await withTenant(() => svc.createStoreConfig({
      storeId: TENANT.storeId!, configName: 'C1', provider: 'openai', endpointUrl: 'https://oai.com', apiKey: 'sk-1',
      contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
    }))
    await assert.rejects(
      async () => await withTenant(() => svc.rollbackToHistory('non-existent-history', 'bad')),
      /not found/,
    )
  })
})

describe('[ai-model-config] 合约: AES-256 加密工具', () => {
  it('加密解密 roundtrip', () => {
    const plain = 'sk-secret-key-12345'
    const encrypted = encryptField(plain)
    const decrypted = decryptField(encrypted)
    assert.equal(decrypted, plain)
  })

  it('每次加密结果不同 (random IV)', () => {
    const c1 = encryptField('same-value')
    const c2 = encryptField('same-value')
    assert.notEqual(c1, c2)
  })

  it('maskApiKey 格式正确', () => {
    const masked = maskApiKey('sk-abcdefghijklmnop')
    assert.ok(masked.startsWith('sk-'))
    assert.ok(masked.includes('***'))
  })

  it('maskApiKey 处理短 key', () => {
    const masked = maskApiKey('a')
    assert.ok(typeof masked === 'string')
    assert.ok(masked.includes('***'))
  })
})
