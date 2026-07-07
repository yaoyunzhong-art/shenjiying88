import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * AI 模型配置 - Repository 单元测试 (V9 需求 1 · V10 Day 2)
 *
 * 使用 node:(无 vitest globals 依赖,跟 package.json 一致)
 */

import assert from 'node:assert/strict'
import { createRepository, type AiModelConfigRepository } from './ai-model-config.repository'
import { runWithTenant } from '../../common/context/tenant-context'

// ============ Helpers ============

const TEST_TENANT_A = {
  tenantId: 'tenant-A',
  storeId: 'store-001',
  userId: 'user-1',
  role: 'tenant_admin' as const,
}

const TEST_TENANT_B = {
  tenantId: 'tenant-B',
  storeId: 'store-002',
  userId: 'user-2',
  role: 'tenant_admin' as const,
}

function makeRepo(): AiModelConfigRepository {
  return createRepository()
}

describe('AiModelConfigRepository (V10 Day 2)', () => {
  let repo: AiModelConfigRepository

  beforeEach(() => {
    repo = makeRepo()
  })

  // ============ 预设 (跨租户共享) ============

  describe('系统预设 (Memory)', () => {
    it('返回 4 个预设', async () => {
      const presets = await repo.listPresets()
      assert.equal(presets.length, 4)
    })

    it('按 provider 过滤', async () => {
      const openai = await repo.listPresets({ provider: 'openai' })
      assert.equal(openai.length, 1)
      assert.equal(openai[0].provider, 'openai')
    })

    it('按 industry 过滤', async () => {
      const arcade = await repo.listPresets({ industry: 'arcade' })
      assert.equal(arcade.length, 1)
      assert.equal(arcade[0].presetCode, 'claude-game')
    })

    it('按 id 查预设', async () => {
      const p = await repo.getPreset('preset-gpt4o-general')
      assert.ok(p)
      assert.equal(p?.modelName, 'gpt-4o')
    })
  })

  // ============ 门店配置 (Tenant Context) ============

  describe('门店配置 (Memory + Tenant Context)', () => {
    it('创建门店配置 - tenant A 可见', async () => {
      let createdId = ''
      await runWithTenant(TEST_TENANT_A, async () => {
        const config = await repo.createStoreConfig({
          tenantId: TEST_TENANT_A.tenantId,
          storeId: TEST_TENANT_A.storeId,
          configName: '门店自建 GPT-4o',
          provider: 'openai',
          endpointUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-test-1234567890',
          contextWindow: 8192,
          temperature: 0.7,
          maxTokens: 2048,
          createdBy: TEST_TENANT_A.userId,
        })
        assert.ok(!config.apiKeyEncrypted.includes('sk-test'), 'API key 应该被加密')
        assert.equal(config.isCurrent, false)
        createdId = config.id
      })

      await runWithTenant(TEST_TENANT_A, async () => {
        const list = await repo.listStoreConfigsByStore(TEST_TENANT_A.storeId)
        assert.equal(list.length, 1)
        assert.equal(list[0].id, createdId)
      })
    })

    it('切换延迟 < 500ms (V9 硬约束)', async () => {
      let cfgId = ''
      await runWithTenant(TEST_TENANT_A, async () => {
        const c = await repo.createStoreConfig({
          tenantId: TEST_TENANT_A.tenantId,
          storeId: TEST_TENANT_A.storeId,
          configName: '性能测试',
          provider: 'openai',
          endpointUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-perf',
          contextWindow: 8192,
          temperature: 0.7,
          maxTokens: 2048,
          createdBy: TEST_TENANT_A.userId,
        })
        cfgId = c.id
      })

      const start = Date.now()
      await runWithTenant(TEST_TENANT_A, async () => {
        const result = await repo.switchConfig(cfgId, 'user-1', 'perf test')
        assert.ok(result.latencyMs < 500, `latency ${result.latencyMs}ms 应该 < 500ms`)
        assert.equal(result.healthCheckOk, true)
      })
      const totalMs = Date.now() - start
      assert.ok(totalMs < 500, `总耗时 ${totalMs}ms 应该 < 500ms`)
    })
  })

  // ============ 历史 + 回滚 ============

  describe('历史版本 (Memory)', () => {
    it('记录 create + activate 两条历史', async () => {
      let cfgId = ''
      await runWithTenant(TEST_TENANT_A, async () => {
        const c = await repo.createStoreConfig({
          tenantId: TEST_TENANT_A.tenantId,
          storeId: TEST_TENANT_A.storeId,
          configName: '历史测试',
          provider: 'openai',
          endpointUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-hist',
          contextWindow: 8192,
          temperature: 0.7,
          maxTokens: 2048,
          createdBy: TEST_TENANT_A.userId,
        })
        cfgId = c.id
        await repo.switchConfig(cfgId, TEST_TENANT_A.userId, '激活')
      })

      await runWithTenant(TEST_TENANT_A, async () => {
        const history = await repo.listHistory(cfgId)
        assert.ok(history.length >= 2, `应该有 >= 2 条历史, 实际 ${history.length}`)
        const types = history.map((h) => h.changeType)
        assert.ok(types.includes('create'), '应该包含 create')
        assert.ok(types.includes('activate'), '应该包含 activate')
      })
    })

    it('回滚到历史版本', async () => {
      let cfgId = ''
      let histId = ''
      await runWithTenant(TEST_TENANT_A, async () => {
        const c = await repo.createStoreConfig({
          tenantId: TEST_TENANT_A.tenantId,
          storeId: TEST_TENANT_A.storeId,
          configName: '回滚测试',
          provider: 'openai',
          endpointUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-rollback',
          contextWindow: 8192,
          temperature: 0.7,
          maxTokens: 2048,
          createdBy: TEST_TENANT_A.userId,
        })
        cfgId = c.id

        const history = await repo.listHistory(cfgId)
        histId = history[0].id
      })

      await runWithTenant(TEST_TENANT_A, async () => {
        const rolled = await repo.rollbackToHistory(histId, TEST_TENANT_A.userId, 'test rollback')
        assert.equal(rolled.id, cfgId)

        const historyAfter = await repo.listHistory(cfgId)
        const types = historyAfter.map((h) => h.changeType)
        assert.ok(types.includes('rollback'), '应该包含 rollback')
      })
    })
  })

  // ============ Tenant Context 缺失校验 ============

  describe('Tenant Context 强制 (V9 需求 5)', () => {
    it('没有 tenant context 调用会抛错', async () => {
      // async 函数的同步抛错会被包装为 rejected promise
      const p = repo.listStoreConfigsByStore('store-x')
      await assert.rejects(p, /tenant context/)
    })
  })
})