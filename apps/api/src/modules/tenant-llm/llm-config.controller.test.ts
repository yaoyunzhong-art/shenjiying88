/**
 * llm-config.controller.test.ts
 * TenantLLMController 单元测试 — 正例 + 反例 + 边界
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'reflect-metadata'

// Mock TenantScopeGuard before importing service
vi.mock('../../agent/tenant.guard', () => ({
  TenantScopeGuard: class MockGuard {
    canActivate() { return true }
  },
}))

import { TenantLLMController } from './llm-config.controller'
import { TenantLLMService } from './llm-config.service'

describe('TenantLLMController', () => {
  let controller: TenantLLMController
  let service: TenantLLMService

  beforeEach(() => {
    // Fresh instance each test; module-level stores persist across instances
    // so tests need to be isolated by tenant ID within each describe
    service = new TenantLLMService({ canActivate: () => true } as any)
    controller = new TenantLLMController(service)
  })

  // ── GET /llm/configs (getConfigs) ─────────────────────────────────

  describe('GET /llm/configs', () => {
    it('正例: 空租户返回空数组', async () => {
      const result = await controller.getConfigs('t-empty-configs')
      expect(result).toEqual([])
    })

    it('正例: 有配置时返回列表', async () => {
      await controller.createConfig('t-config-list', {
        name: 'Test LLM',
        provider: 'deepseek',
        modelName: 'deepseek-chat',
        apiKey: 'sk-test',
      })
      const result = await controller.getConfigs('t-config-list')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test LLM')
      expect(result[0].status).toBe('pending')
    })

    it('正例: 按 siteId 筛选', async () => {
      await controller.createConfig('t-site-filter', {
        name: 'Site A', provider: 'deepseek', modelName: 'deepseek-chat',
        apiKey: 'sk-a', siteId: 'site-a',
      })
      await controller.createConfig('t-site-filter', {
        name: 'Site B', provider: 'deepseek', modelName: 'deepseek-chat',
        apiKey: 'sk-b', siteId: 'site-b',
      })
      const result = await controller.getConfigs('t-site-filter', 'site-a')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Site A')
    })

    it('反例: 不存在的 siteId 返回空数组', async () => {
      await controller.createConfig('t-nonexist-site', {
        name: 'Default', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk',
      })
      const result = await controller.getConfigs('t-nonexist-site', 'nobody-here')
      expect(result).toEqual([])
    })
  })

  // ── GET /llm/configs/:id (getConfig) ──────────────────────────────

  describe('GET /llm/configs/:id', () => {
    it('正例: 按 ID 获取单个配置', async () => {
      const created = await controller.createConfig('t-get-id', {
        name: 'My Config', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-test',
      })
      const result = await controller.getConfig(created.id, 't-get-id')
      expect(result).not.toBeNull()
      expect((result as { error?: string }).error).toBeUndefined()
      expect((result as any).name).toBe('My Config')
    })

    it('反例: 不存在的 ID 返回错误消息', async () => {
      const result = await controller.getConfig('non-existent', 't-not-found')
      expect(result).toEqual({ error: '配置不存在' })
    })

    it('反例: 跨租户不可见', async () => {
      const created = await controller.createConfig('t-cross-tenant-get', {
        name: 'Secret Config', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk',
      })
      const result = await controller.getConfig(created.id, 't-cross-tenant-get-other')
      expect(result).toEqual({ error: '配置不存在' })
    })
  })

  // ── POST /llm/configs (createConfig) ──────────────────────────────

  describe('POST /llm/configs', () => {
    it('正例: 创建配置返回完整对象', async () => {
      const result = await controller.createConfig('t-create-1', {
        name: 'Production DeepSeek',
        provider: 'deepseek',
        modelName: 'deepseek-chat',
        apiKey: 'sk-production',
      })
      expect(result.id).toMatch(/^llm-/)
      expect(result.name).toBe('Production DeepSeek')
      expect(result.provider).toBe('deepseek')
      expect(result.status).toBe('pending')
      expect(result.enabled).toBe(false)
      expect(result.temperature).toBe(0.7) // 默认值
      expect(result.maxTokens).toBe(4096)   // 默认值
    })

    it('正例: 自定义参数同步覆盖', async () => {
      const result = await controller.createConfig('t-create-2', {
        name: 'Custom', provider: 'anthropic', modelName: 'claude-3-opus',
        apiKey: 'sk-ant', temperature: 0.1, maxTokens: 8000, topP: 0.9,
      })
      expect(result.temperature).toBe(0.1)
      expect(result.maxTokens).toBe(8000)
      expect(result.topP).toBe(0.9)
    })

    it('边界: 挂载 siteId 和 storeId', async () => {
      const result = await controller.createConfig('t-create-3', {
        name: 'Store Config', provider: 'openai', modelName: 'gpt-4o',
        apiKey: 'sk', siteId: 'site-store', storeId: 'store-01',
      })
      expect(result.siteId).toBe('site-store')
      expect(result.storeId).toBe('store-01')
    })
  })

  // ── PUT /llm/configs/:id (updateConfig) ──────────────────────────

  describe('PUT /llm/configs/:id', () => {
    it('正例: 更新名称', async () => {
      const created = await controller.createConfig('t-upd-1', {
        name: 'Old Name', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk',
      })
      const updated = await controller.updateConfig(created.id, 't-upd-1', { name: 'New Name' })
      expect(updated!.name).toBe('New Name')
    })

    it('正例: 部分字段更新', async () => {
      const created = await controller.createConfig('t-upd-2', {
        name: 'Orig', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk',
      })
      const updated = await controller.updateConfig(created.id, 't-upd-2', { enabled: true, temperature: 0.5 })
      expect(updated!.enabled).toBe(true)
      expect(updated!.temperature).toBe(0.5)
      expect(updated!.name).toBe('Orig')
    })

    it('反例: 不存在的配置返回 null', async () => {
      const result = await controller.updateConfig('non-existent', 't-upd-none', { name: 'Any' })
      expect(result).toBeNull()
    })

    it('反例: 跨租户更新返回 null', async () => {
      const created = await controller.createConfig('t-upd-tenant', {
        name: 'Mine', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk',
      })
      const result = await controller.updateConfig(created.id, 't-upd-tenant-other', { name: 'Hack' })
      expect(result).toBeNull()
    })
  })

  // ── DELETE /llm/configs/:id (deleteConfig) ────────────────────────

  describe('DELETE /llm/configs/:id', () => {
    it('正例: 删除成功', async () => {
      const created = await controller.createConfig('t-del-1', {
        name: 'To Delete', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk',
      })
      const result = await controller.deleteConfig(created.id, 't-del-1')
      expect(result).toEqual({ deleted: true })
      const getResult = await controller.getConfig(created.id, 't-del-1')
      expect(getResult).toEqual({ error: '配置不存在' })
    })

    it('反例: 不存在的配置删除返回 false', async () => {
      const result = await controller.deleteConfig('non-existent', 't-del-none')
      expect(result).toEqual({ deleted: false })
    })

    it('反例: 跨租户删除返回 false', async () => {
      const created = await controller.createConfig('t-del-tenant', {
        name: 'Mine', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk',
      })
      const result = await controller.deleteConfig(created.id, 't-del-tenant-other')
      expect(result).toEqual({ deleted: false })
    })
  })

  // ── POST /llm/configs/:id/apply (applyConfig) ────────────────────

  describe('POST /llm/configs/:id/apply', () => {
    it('正例: 提交接入申请成功', async () => {
      const created = await controller.createConfig('t-apply-1', {
        name: 'Apply Test', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk',
      })
      const result = await controller.applyConfig(created.id, 't-apply-1', {
        configId: created.id, useCase: '智能客服', expectedVolume: 1000,
      })
      expect(result.success).toBe(true)
      expect(result.message).toContain('等待平台管理员审批')
    })

    it('反例: 不存在配置抛异常', async () => {
      await expect(
        controller.applyConfig('non-existent', 't-apply-none', {
          configId: 'non-existent', useCase: 'test', expectedVolume: 100,
        })
      ).rejects.toThrow('配置不存在')
    })

    it('反例: 跨租户抛异常', async () => {
      const created = await controller.createConfig('t-apply-tenant', {
        name: 'Private', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk',
      })
      await expect(
        controller.applyConfig(created.id, 't-apply-tenant-other', {
          configId: created.id, useCase: 'hack', expectedVolume: 1,
        })
      ).rejects.toThrow('配置不存在')
    })
  })

  // ── POST /llm/configs/:id/approve (approveConfig) ────────────────

  describe('POST /llm/configs/:id/approve', () => {
    it('正例: 审批通过', async () => {
      const created = await controller.createConfig('t-appr-1', {
        name: 'Approve Me', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk',
      })
      const result = await controller.approveConfig(created.id, {
        approved: true, approvedBy: 'admin-01',
      })
      expect(result!.status).toBe('approved')
      expect(result!.enabled).toBe(true)
      expect(result!.approvedBy).toBe('admin-01')
    })

    it('正例: 审批驳回', async () => {
      const created = await controller.createConfig('t-appr-2', {
        name: 'Reject Me', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk',
      })
      const result = await controller.approveConfig(created.id, {
        approved: false, approvedBy: 'admin-01',
      })
      expect(result!.status).toBe('rejected')
      expect(result!.enabled).toBe(false)
    })

    it('反例: 不存在的配置返回 null', async () => {
      const result = await controller.approveConfig('non-existent', {
        approved: true, approvedBy: 'admin',
      })
      expect(result).toBeNull()
    })
  })

  // ── GET /llm/stats (getStats) ────────────────────────────────────

  describe('GET /llm/stats', () => {
    it('正例: 无调用记录时各项为 0', async () => {
      const stats = await controller.getStats('t-stats-empty')
      expect(stats.totalCalls).toBe(0)
      expect(stats.successCalls).toBe(0)
      expect(stats.failedCalls).toBe(0)
      expect(stats.totalTokens).toBe(0)
      expect(stats.totalCost).toBe(0)
    })
  })

  // ── GET /llm/logs (getCallLogs) ──────────────────────────────────

  describe('GET /llm/logs', () => {
    it('正例: 无日志时返回空数组', async () => {
      const logs = await controller.getCallLogs('t-logs-empty')
      expect(logs).toEqual([])
    })
  })

  // ── 路由元数据与守卫 ──────────────────────────────────────────────

  describe('路由元数据', () => {
    it('Controller 注册了正确的路由前缀', () => {
      const path = Reflect.getMetadata('path', TenantLLMController)
      expect(path).toBe('llm')
    })

    it('Controller 注册了守卫', () => {
      const guards = Reflect.getMetadata('__guards__', TenantLLMController)
      expect(guards).toBeDefined()
      expect(guards).toHaveLength(1)
    })
  })
})
