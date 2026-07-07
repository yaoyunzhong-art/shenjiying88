import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 94 智能分析 Module Test (V10 Sprint 2 Day 16)
 *
 * 验证模块元数据 + controller + service 基本 DI 配置
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { InsightController } from './insight.controller'
import { InsightService } from './insight.service'
import { InsightModule } from './insight.module'
import { runWithTenant } from '../../common/context/tenant-context'

describe('InsightModule', () => {
  it('should export InsightController and InsightService', () => {
    assert.ok(InsightModule)
    assert.ok(InsightController)
    assert.ok(InsightService)
  })

  it('should have module metadata with correct decorator', () => {
    const imports = Reflect.getMetadata('imports', InsightModule) ?? []
    const controllers = Reflect.getMetadata('controllers', InsightModule) ?? []
    const providers = Reflect.getMetadata('providers', InsightModule) ?? []
    const exports = Reflect.getMetadata('exports', InsightModule) ?? []

    // InsightModule 用 @Global()
    assert.ok(Array.isArray(imports))
    assert.ok(controllers.includes(InsightController))
    assert.ok(providers.includes(InsightService))
    assert.ok(exports.includes(InsightService))
  })

  it('service instance works standalone', () => {
    // Mock AiModelConfigService
    const mockAiConfig = {
      getCurrentConfig: async (_storeId: string) => ({
        id: 'mock-ai-001',
        provider: 'mock',
        endpointUrl: 'https://mock.api/',
        apiKeyEncrypted: '',
        modelName: 'mock-model',
        maxTokens: 1024,
        temperature: 0.3,
      }),
      getDecryptedApiKey: async (_id: string) => 'sk-mock-decrypted-key',
    }

    const service = new InsightService(mockAiConfig as any)
    const controller = new InsightController(service)

    assert.ok(service)
    assert.ok(controller)
    assert.equal(typeof controller.generate, 'function')
    assert.equal(typeof controller.getTemplates, 'function')
    assert.equal(typeof controller.getById, 'function')
    assert.equal(typeof controller.list, 'function')
    assert.equal(typeof controller.pruneCache, 'function')
  })

  it('controller returns template list', async () => {
    const mockAiConfig = {
      getCurrentConfig: async () => null,
      getDecryptedApiKey: async () => null,
    }
    const service = new InsightService(mockAiConfig as any)
    const controller = new InsightController(service)
    const result = await controller.getTemplates()
    assert.ok(result.items)
    assert.ok(result.items.length > 0)
    const types = result.items.map((t: any) => t.type)
    assert.ok(types.includes('sales'))
  })

  it('controller throws BadRequest on empty sources', async () => {
    const mockAiConfig = {
      getCurrentConfig: async () => null,
      getDecryptedApiKey: async () => null,
    }
    const service = new InsightService(mockAiConfig as any)
    const controller = new InsightController(service)

    const ctx = { tenantId: 'T-test', storeId: 'S-test', userId: 'u-test', roles: [] as any, isAdmin: false, isAuthenticated: true }

    await assert.rejects(
      () =>
        runWithTenant(ctx, () =>
          controller.generate({
            templateType: 'sales',
            sources: [],
          }),
        ),
      (err: any) => err.message.includes('At least one source'),
    )
  })

  it('controller throws 404 for non-existent insight', async () => {
    const mockAiConfig = {
      getCurrentConfig: async () => null,
      getDecryptedApiKey: async () => null,
    }
    const service = new InsightService(mockAiConfig as any)
    const controller = new InsightController(service)

    const ctx = { tenantId: 'T-test', storeId: 'S-test', userId: 'u-test', roles: [] as any, isAdmin: false, isAuthenticated: true }

    await assert.rejects(
      () =>
        runWithTenant(ctx, () =>
          controller.getById('non-existent-insight'),
        ),
      (err: any) => err.message.includes('not found'),
    )
  })
})
