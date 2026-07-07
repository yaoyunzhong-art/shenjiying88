import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-model-config] [D] E2E 集成测试
 *
 * 验证全流程：列出预设 → 创建配置 → 查看门店配置 → 切换 → 历史 → 回滚
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiModelConfigController } from './ai-model-config.controller'
import { AiModelConfigService } from './ai-model-config.service'

describe('AiModelConfig E2E: 完整业务流程', () => {
  let controller: AiModelConfigController
  const req = { user: { tenantId: 't-1', storeId: 's-1', id: 'u-1' } } as any

  beforeEach(() => {
    controller = new AiModelConfigController(new AiModelConfigService())
  })

  it('Step 1: 列出所有预设 (4 个)', async () => {
    const result = await controller.listPresets({})
    assert.equal(result.total, 4)
    assert.equal(result.data.length, 4)
  })

  it('Step 2: 查看特定预设', async () => {
    const preset = await controller.getPreset('preset-gpt4o-general')
    assert.ok(preset)
    assert.equal(preset?.provider, 'openai')
    assert.equal(preset?.modelName, 'gpt-4o')
  })

  it('Step 3: 创建门店配置', async () => {
    const config = await controller.createStoreConfig(req, {
      storeId: 's-1',
      configName: 'E2E Test Config',
      provider: 'openai',
      endpointUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-e2e-test-key',
      contextWindow: 128000,
      temperature: 0.7,
      maxTokens: 4096,
    })
    assert.ok(config.id)
    assert.equal(config.configName, 'E2E Test Config')
    assert.equal(config.tenantId, 't-1')
    assert.equal(config.storeId, 's-1')
  })

  it('Step 4: 创建第二个配置并切换', async () => {
    const c1 = await controller.createStoreConfig(req, {
      storeId: 's-1', configName: 'Primary', provider: 'openai',
      endpointUrl: 'https://oai.com', apiKey: 'sk-e2e-1',
      contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
    })
    const c2 = await controller.createStoreConfig(req, {
      storeId: 's-1', configName: 'Secondary', provider: 'anthropic',
      endpointUrl: 'https://ant.com', apiKey: 'sk-e2e-2',
      contextWindow: 200000, temperature: 0.5, maxTokens: 8192,
    })

    // 切换到 c2
    const result = await controller.switchConfig(req, { configId: c2.id, reason: 'E2E 切换测试' })
    assert.equal(result.config.id, c2.id)
    assert.equal(result.config.isCurrent, true)
    assert.ok(result.latencyMs < 500)

    // 查看门店配置应包含两个
    const list = await controller.listStoreConfigs(req)
    assert.equal(list.total, 2)
  })

  it('Step 5: 查看历史版本', async () => {
    const config = await controller.createStoreConfig(req, {
      storeId: 's-1', configName: 'History Test', provider: 'openai',
      endpointUrl: 'https://oai.com', apiKey: 'sk-hist',
      contextWindow: 8192, temperature: 0.5, maxTokens: 2048,
    })

    // 创建生成 1 条历史
    const history = await controller.listHistory(req, config.id)
    assert.equal(history.data.length, 1)
    assert.equal(history.data[0].changeType, 'create')
    assert.equal(history.data[0].configId, config.id)
  })

  it('Step 6: 回滚配置', async () => {
    const config = await controller.createStoreConfig(req, {
      storeId: 's-1', configName: 'Rollback Original', provider: 'openai',
      endpointUrl: 'https://oai.com', apiKey: 'sk-rb',
      contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
    })

    const history = await controller.listHistory(req, config.id)
    const histId = history.data[0].id
    const rolled = await controller.rollback(req, { historyId: histId, reason: 'E2E 回滚验证' })
    assert.equal(rolled.configName, 'Rollback Original')

    // 回滚新增一条 rollback 历史
    const newHistory = await controller.listHistory(req, config.id)
    assert.equal(newHistory.data.length, 2)
    assert.equal(newHistory.data[0].changeType, 'rollback')
  })

  it('Step 7: 完整用户旅程 (新配置 → 切换 → 回滚)', async () => {
    // 1. 创建 V1
    const v1 = await controller.createStoreConfig(req, {
      storeId: 's-1', configName: 'V1 Config', provider: 'openai',
      endpointUrl: 'https://oai.com', apiKey: 'sk-v1',
      contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
    })
    // 2. 激活 V1
    await controller.switchConfig(req, { configId: v1.id, reason: '激活 V1' })

    // 3. 创建 V2 并切换
    const v2 = await controller.createStoreConfig(req, {
      storeId: 's-1', configName: 'V2 Config', provider: 'anthropic',
      endpointUrl: 'https://ant.com', apiKey: 'sk-v2',
      contextWindow: 200000, temperature: 0.5, maxTokens: 8192,
    })
    await controller.switchConfig(req, { configId: v2.id, reason: '升级 V2' })

    // 4. 检查 V1 的历史，回滚到 V1 创建前的状态
    const v1History = await controller.listHistory(req, v1.id)
    const rollbackTarget = v1History.data.find((h: any) => h.changeType === 'create')
    assert.ok(rollbackTarget)
    const rolled = await controller.rollback(req, { historyId: rollbackTarget.id, reason: '回滚至 V1' })
    assert.equal(rolled.configName, 'V1 Config')
    assert.equal(rolled.provider, 'openai')

    // 5. 最终门店有 2 个配置，V1 是 current
    const list = await controller.listStoreConfigs(req)
    assert.equal(list.total, 2)
  })
})

describe('AiModelConfig E2E: 边界与异常', () => {
  let controller: AiModelConfigController
  const req = { user: { tenantId: 't-2', storeId: 's-2', id: 'u-2' } } as any

  beforeEach(() => {
    controller = new AiModelConfigController(new AiModelConfigService())
  })

  it('配置名为空字符串时（DTO 层面会拒，这里测 service 不崩溃）', async () => {
    // Service doesn't validate name length
    const config = await controller.createStoreConfig(req, {
      storeId: 's-2',
      configName: '',
      provider: 'openai',
      endpointUrl: 'https://oai.com', apiKey: 'sk-empty',
      contextWindow: 4096, temperature: 0.5, maxTokens: 1024,
    })
    assert.ok(config.id)
  })

  it('空门店返回空列表', async () => {
    const result = await controller.listStoreConfigs({ user: { tenantId: 't-empty', storeId: 's-empty', id: 'u-empty' } } as any)
    assert.equal(result.total, 0)
    assert.deepEqual(result.data, [])
  })

  it('切换不存在的配置应抛异常', async () => {
    await assert.rejects(
      async () => await controller.switchConfig(req, { configId: 'non-existent-id' }),
      /not found/,
    )
  })

  it('回滚不存在的历史应抛异常', async () => {
    await assert.rejects(
      async () => await controller.rollback(req, { historyId: 'non-existent-history', reason: 'test' }),
      /not found/,
    )
  })

  it('空门店配置列表不返回跨门店配置', async () => {
    const config = await controller.createStoreConfig(req, {
      storeId: 's-2', configName: 'Only Store 2', provider: 'openai',
      endpointUrl: 'https://oai.com', apiKey: 'sk-only',
      contextWindow: 8192, temperature: 0.5, maxTokens: 2048,
    })

    // 其他门店不应看到这个配置
    const otherReq = { user: { tenantId: 't-2', storeId: 'other-store', id: 'u-other' } } as any
    const otherResult = await controller.listStoreConfigs(otherReq)
    assert.equal(otherResult.total, 0)

    // 原门店仍可看到
    const sameResult = await controller.listStoreConfigs(req)
    assert.equal(sameResult.total, 1)
    assert.equal(sameResult.data[0].id, config.id)
  })
})
