import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * AI 模型配置 - Service 单元测试 V2 (V9 需求 1 · V10 Day 2)
 *
 * 使用 node:(跟 apps/api package.json 一致)
 */

import assert from 'node:assert/strict'
import { AiModelConfigService } from './ai-model-config.service'
import { encryptField, decryptField, maskApiKey } from './encryption.util'
import { runWithTenant } from '../../common/context/tenant-context'

const CTX = {
  tenantId: 'tenant-test',
  storeId: 'store-test-001',
  userId: 'user-test',
  role: 'tenant_admin' as const,
}

describe('AiModelConfigService - V10 Day 2', () => {
  let service: AiModelConfigService

  beforeEach(() => {
    service = new AiModelConfigService()
  })

  // ============ 1. 系统预设 ============

  describe('1. 系统预设 (4 包)', () => {
    it('should seed 4 default presets', async () => {
      const presets = await service.listPresets()
      assert.equal(presets.length, 4)
    })

    it('should filter by provider', async () => {
      const openai = await service.listPresets({ provider: 'openai' })
      assert.equal(openai.length, 1)
      assert.equal(openai[0].presetCode, 'gpt4o-general')
    })

    it('should filter by industry', async () => {
      const arcade = await service.listPresets({ industry: 'arcade' })
      assert.equal(arcade.length, 1)
      assert.equal(arcade[0].provider, 'anthropic')
    })

    it('preset 应包含 6 类参数', async () => {
      const p = await service.getPreset('preset-gpt4o-general')
      assert.ok(p)
      assert.equal(p!.defaultParams.temperature, 0.7)
      assert.equal(p!.defaultParams.maxTokens, 4096)
      assert.equal(p!.defaultParams.contextWindow, 128000)
    })
  })

  // ============ 2. 门店配置 CRUD ============

  describe('2. 门店配置 CRUD', () => {
    it('create - 加密 API key + 响应脱敏', async () => {
      let created: any = null
      await runWithTenant(CTX, async () => {
        created = await service.createStoreConfig({
          storeId: 'store-test-001',
          configName: '门店自建',
          provider: 'openai',
          endpointUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-test-plain-1234567890',
          contextWindow: 8192,
          temperature: 0.7,
          maxTokens: 2048,
        })
      })

      assert.ok(created)
      // 脱敏验证
      assert.match(created.apiKeyMasked, /^sk-\*+/)
      assert.equal(created.apiKeyEncrypted, undefined)
    })

    it('list - 返回脱敏版', async () => {
      await runWithTenant(CTX, async () => {
        await service.createStoreConfig({
          storeId: 'store-test-001',
          configName: '门店A',
          provider: 'openai',
          endpointUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-abcdef-123456',
          contextWindow: 8192,
          temperature: 0.7,
          maxTokens: 2048,
        })
      })

      await runWithTenant(CTX, async () => {
        const list = await service.listStoreConfigs('store-test-001')
        assert.equal(list.length, 1)
        assert.ok(!(list[0] as any).apiKeyMasked.includes('abcdef'), '不应该包含原始 key')
        assert.equal((list[0] as any).apiKeyEncrypted, undefined)
      })
    })
  })

  // ============ 3. 一键切换 ============

  describe('3. 一键切换', () => {
    it('switch - 切换延迟 < 500ms', async () => {
      let cfgId = ''
      await runWithTenant(CTX, async () => {
        const c = await service.createStoreConfig({
          storeId: 'store-test-001',
          configName: '切换测试',
          provider: 'openai',
          endpointUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-switch-test',
          contextWindow: 8192,
          temperature: 0.7,
          maxTokens: 2048,
        })
        cfgId = (c as any).id
      })

      const result = await runWithTenant(CTX, () =>
        service.switchConfig({ configId: cfgId, reason: 'unittest' }),
      )
      assert.ok(result.latencyMs < 500, `latency ${result.latencyMs}ms`)
      assert.equal(result.healthCheckOk, true)
      assert.match((result.config as any).apiKeyMasked, /^sk-\*+/)
    })

    it('switch - 不存在的 configId 应抛错', async () => {
      await assert.rejects(
        () => runWithTenant(CTX, () => service.switchConfig({ configId: 'non-existent' })),
      )
    })
  })

  // ============ 4. 历史 + 回滚 ============

  describe('4. 历史 + 回滚', () => {
    it('listHistory - 记录 create + activate', async () => {
      let cfgId = ''
      await runWithTenant(CTX, async () => {
        const c = await service.createStoreConfig({
          storeId: 'store-test-001',
          configName: '历史测试',
          provider: 'openai',
          endpointUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-hist',
          contextWindow: 8192,
          temperature: 0.7,
          maxTokens: 2048,
        })
        cfgId = (c as any).id
        await service.switchConfig({ configId: cfgId, reason: 'activate' })
      })

      const history = await runWithTenant(CTX, () => service.listHistory(cfgId))
      const types = history.map((h) => h.changeType)
      assert.ok(types.includes('create'))
      assert.ok(types.includes('activate'))
    })

    it('rollback - 回滚到历史版本', async () => {
      let cfgId = ''
      let histId = ''
      await runWithTenant(CTX, async () => {
        const c = await service.createStoreConfig({
          storeId: 'store-test-001',
          configName: '回滚测试',
          provider: 'openai',
          endpointUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-rb',
          contextWindow: 8192,
          temperature: 0.7,
          maxTokens: 2048,
        })
        cfgId = (c as any).id
        const history = await service.listHistory(cfgId)
        histId = history[0].id
      })

      const rolled = await runWithTenant(CTX, () =>
        service.rollbackToHistory(histId, 'unittest rollback'),
      )
      assert.equal((rolled as any).id, cfgId)

      const historyAfter = await runWithTenant(CTX, () => service.listHistory(cfgId))
      const types = historyAfter.map((h) => h.changeType)
      assert.ok(types.includes('rollback'))
    })
  })

  // ============ 5. 字段级隔离 ============

  describe('5. 字段级 API key 隔离', () => {
    it('maskApiKey - 保留前 3 后 4 (基于密文)', () => {
      // maskApiKey 是基于 ciphertext 截取后 4 位, 实际响应中密文是 base64 编码的字符串
      const cipher = encryptField('sk-abcdefghijklmnop1234')
      const masked = maskApiKey(cipher)
      assert.match(masked, /^sk-\*+-.+/)
      // 密文不含明文
      assert.ok(!masked.includes('abcdefghijklmnop'))
    })

    it('encryptField + decryptField 互逆', () => {
      const plain = 'sk-test-secret'
      const cipher = encryptField(plain)
      assert.ok(!cipher.includes('sk-test'))
      assert.equal(decryptField(cipher), plain)
    })

    it('getDecryptedApiKey - 仅 admin 可调用', async () => {
      let cfgId = ''
      await runWithTenant(CTX, async () => {
        const c = await service.createStoreConfig({
          storeId: 'store-test-001',
          configName: '解密测试',
          provider: 'openai',
          endpointUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-decrypt-test',
          contextWindow: 8192,
          temperature: 0.7,
          maxTokens: 2048,
        })
        cfgId = (c as any).id
      })

      // operator 角色应该被拒绝
      await assert.rejects(
        () => runWithTenant({ ...CTX, role: 'operator' }, () => service.getDecryptedApiKey(cfgId)),
        /admin/,
      )

      // tenant_admin 应该成功
      const decrypted = await runWithTenant(CTX, () => service.getDecryptedApiKey(cfgId))
      assert.equal(decrypted, 'sk-decrypt-test')
    })
  })

  // ============ 6. Tenant Context 强制校验 ============

  describe('6. Tenant Context 强制', () => {
    it('createStoreConfig 无 context 抛错', async () => {
      await assert.rejects(
        () => service.createStoreConfig({
          storeId: 'store-x',
          configName: 'no ctx',
          provider: 'openai',
          endpointUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-no-ctx',
          contextWindow: 8192,
          temperature: 0.7,
          maxTokens: 2048,
        }),
        /tenant context/,
      )
    })

    it('switchConfig 无 context 抛错', async () => {
      await assert.rejects(
        () => service.switchConfig({ configId: 'xxx' }),
        /tenant context/,
      )
    })
  })
})