// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-model-config] [D] Controller 单元测试
 *
 * 验证路由元数据 + 业务逻辑
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
describe('AiModelConfigController', () => {
  const { AiModelConfigController } = require('./ai-model-config.controller')
  const { AiModelConfigService } = require('./ai-model-config.service')

  let controller: InstanceType<typeof AiModelConfigController>
  let service: InstanceType<typeof AiModelConfigService>

  beforeEach(() => {
    service = new AiModelConfigService()
    controller = new AiModelConfigController(service)
  })

  describe('route metadata', () => {
    it('controller path metadata should be ai-model-config', () => {
      const path = Reflect.getMetadata('path', AiModelConfigController)
      assert.equal(path, 'ai-model-config')
    })

    it('listPresets route should have GET method and presets path', () => {
      const method = Reflect.getMetadata('method', AiModelConfigController.prototype.listPresets)
      const path = Reflect.getMetadata('path', AiModelConfigController.prototype.listPresets)
      assert.equal(method, 0) // GET
      assert.equal(path, 'presets')
    })

    it('getPreset route should have GET method and presets/:id path', () => {
      const method = Reflect.getMetadata('method', AiModelConfigController.prototype.getPreset)
      const path = Reflect.getMetadata('path', AiModelConfigController.prototype.getPreset)
      assert.equal(method, 0) // GET
      assert.equal(path, 'presets/:id')
    })

    it('createStoreConfig route should have POST method and store-configs path', () => {
      const method = Reflect.getMetadata('method', AiModelConfigController.prototype.createStoreConfig)
      const path = Reflect.getMetadata('path', AiModelConfigController.prototype.createStoreConfig)
      assert.equal(method, 1) // POST
      assert.equal(path, 'store-configs')
    })

    it('listStoreConfigs route should have GET method and store-configs path', () => {
      const method = Reflect.getMetadata('method', AiModelConfigController.prototype.listStoreConfigs)
      const path = Reflect.getMetadata('path', AiModelConfigController.prototype.listStoreConfigs)
      assert.equal(method, 0) // GET
      assert.equal(path, 'store-configs')
    })

    it('switchConfig route should have POST method and switch path', () => {
      const method = Reflect.getMetadata('method', AiModelConfigController.prototype.switchConfig)
      const path = Reflect.getMetadata('path', AiModelConfigController.prototype.switchConfig)
      assert.equal(method, 1) // POST
      assert.equal(path, 'switch')
    })

    it('listHistory route should have GET method and history/:configId path', () => {
      const method = Reflect.getMetadata('method', AiModelConfigController.prototype.listHistory)
      const path = Reflect.getMetadata('path', AiModelConfigController.prototype.listHistory)
      assert.equal(method, 0) // GET
      assert.equal(path, 'history/:configId')
    })

    it('rollback route should have POST method and rollback path', () => {
      const method = Reflect.getMetadata('method', AiModelConfigController.prototype.rollback)
      const path = Reflect.getMetadata('path', AiModelConfigController.prototype.rollback)
      assert.equal(method, 1) // POST
      assert.equal(path, 'rollback')
    })
  })

  describe('GET /ai-model-config/presets', () => {
    it('should return 4 default presets', async () => {
      const result = await controller.listPresets({})
      assert.ok(Array.isArray(result.data))
      assert.equal(result.data.length, 4)
      assert.equal(result.total, 4)
    })

    it('should filter by provider', async () => {
      const result = await controller.listPresets({ provider: 'openai' })
      assert.equal(result.data.length, 1)
      assert.equal(result.data[0].provider, 'openai')
    })

    it('should filter by industry', async () => {
      const result = await controller.listPresets({ industry: 'arcade' })
      assert.equal(result.data.length, 1)
      assert.equal(result.data[0].industry, 'arcade')
    })

    it('should filter by isActive', async () => {
      const result = await controller.listPresets({ isActive: false })
      assert.equal(result.data.length, 0)
    })
  })

  describe('GET /ai-model-config/presets/:id', () => {
    it('should return preset by ID', async () => {
      const preset = await controller.getPreset('preset-gpt4o-general')
      assert.ok(preset)
      assert.equal(preset?.presetCode, 'gpt4o-general')
      assert.equal(preset?.provider, 'openai')
    })

    it('should return null for non-existent preset', async () => {
      const preset = await controller.getPreset('non-existent')
      assert.equal(preset, null)
    })
  })

  describe('POST /ai-model-config/store-configs', () => {
    it('should create store config with encrypted API key', async () => {
      const req = { user: { tenantId: 'tenant-1', storeId: 'store-1', id: 'user-1' } }
      const config = await controller.createStoreConfig(req, {
        storeId: 'store-1',
        configName: 'My Config',
        provider: 'openai',
        endpointUrl: 'https://api.openai.com',
        apiKey: 'sk-test-key',
        contextWindow: 128000,
        temperature: 0.7,
        maxTokens: 4096,
      })
      assert.ok(config.id)
      assert.equal(config.tenantId, 'tenant-1')
      assert.equal(config.storeId, 'store-1')
      assert.ok(config.apiKeyMasked)
      assert.ok(!config.apiKeyMasked.includes('sk-test-key'))
    })
  })

  describe('GET /ai-model-config/store-configs', () => {
    it('should return masked store configs', async () => {
      const req = { user: { tenantId: 'tenant-1', storeId: 'store-1', id: 'user-1' } }
      await controller.createStoreConfig(req, {
        storeId: 'store-1',
        configName: 'C1', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-abcdef',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      })
      const result = await controller.listStoreConfigs(req)
      assert.equal(result.total, 1)
      assert.ok(result.data[0].apiKeyMasked)
      assert.ok(result.data[0].apiKeyMasked.includes('***'))
    })
  })

  describe('POST /ai-model-config/switch', () => {
    it('should switch active config', async () => {
      const req = { user: { tenantId: 'tenant-1', storeId: 'store-1', id: 'user-1' } }
      const c1 = await controller.createStoreConfig(req, {
        storeId: 'store-1',
        configName: 'C1', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-1',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      })
      const c2 = await controller.createStoreConfig(req, {
        storeId: 'store-1',
        configName: 'C2', provider: 'anthropic',
        endpointUrl: 'https://api.anthropic.com', apiKey: 'sk-2',
        contextWindow: 200000, temperature: 0.5, maxTokens: 8192,
      })

      const result = await controller.switchConfig(req, { configId: c2.id, reason: 'switch' })
      assert.equal(result.config.id, c2.id)
      assert.ok(result.latencyMs < 500)
      assert.equal(result.healthCheckOk, true)
    })
  })

  describe('GET /ai-model-config/history/:configId', () => {
    it('should return history for a config', async () => {
      const req = { user: { tenantId: 'tenant-1', storeId: 'store-1', id: 'user-1' } }
      const config = await controller.createStoreConfig(req, {
        storeId: 'store-1',
        configName: 'C1', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-1',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      })

      const history = await controller.listHistory(req, config.id)
      assert.ok(Array.isArray(history.data))
      assert.equal(history.data.length, 1)
      assert.equal(history.data[0].changeType, 'create')
    })
  })

  describe('POST /ai-model-config/rollback', () => {
    it('should rollback to history version', async () => {
      const req = { user: { tenantId: 'tenant-1', storeId: 'store-1', id: 'user-1' } }
      const config = await controller.createStoreConfig(req, {
        storeId: 'store-1',
        configName: 'Original', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-1',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      })
      const history = await controller.listHistory(req, config.id)
      const histId = history.data[0].id

      const rolled = await controller.rollback(req, { historyId: histId, reason: 'rollback test' })
      assert.equal(rolled.configName, 'Original')
    })
  })
})
