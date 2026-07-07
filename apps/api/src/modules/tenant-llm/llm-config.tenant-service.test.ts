/**
 * 🐜 自动: [tenant-llm] [A] TenantLLMService 测试补全
 *
 * 覆盖 TenantLLMService 全部方法:
 * - 配置 CRUD (创建/查询/更新/删除 + 跨租户隔离)
 * - 接入申请与审批
 * - 调用日志与统计
 * - API Key 管理
 *
 * 注意: configStore/callLogStore 为模块级常量(跨测试持久化),
 *       因此计数类断言使用 `>=` 而非精确 `toBe`
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'

// Mock the tenant guard import — TenantScopeGuard is @ts-ignore'd
vi.mock('../../agent/tenant.guard', () => ({
  TenantScopeGuard: class MockTenantScopeGuard {
    canActivate() { return true }
  },
}))

import { TenantLLMService } from './llm-config.service'

describe('TenantLLMService', () => {
  let service: TenantLLMService

  beforeEach(() => {
    const guard = new (class MockTenantScopeGuard {
      canActivate() { return true }
    })()
    service = new TenantLLMService(guard as any)
  })

  // ============ 配置 CRUD ============

  describe('createConfig', () => {
    it('应创建配置并设置默认值 (status=pending, enabled=false)', async () => {
      const config = await service.createConfig('tenant-001', {
        name: '测试 DeepSeek 配置',
        provider: 'deepseek',
        modelName: 'deepseek-chat',
        apiKey: 'sk-test-key-123',
        siteId: 'site-001',
        storeId: 'store-001',
      })
      expect(config).toBeDefined()
      expect(config.id).toMatch(/^llm-/)
      expect(config.tenantId).toBe('tenant-001')
      expect(config.name).toBe('测试 DeepSeek 配置')
      expect(config.provider).toBe('deepseek')
      expect(config.modelName).toBe('deepseek-chat')
      expect(config.status).toBe('pending')
      expect(config.enabled).toBe(false)
      expect(config.temperature).toBe(0.7)
      expect(config.maxTokens).toBe(4096)
      expect(config.quotaUsed).toBe(0)
      expect(config.quotaAlertThreshold).toBe(0.8)
      expect(config.createdAt).toBeDefined()
      expect(config.updatedAt).toBeDefined()
      // API Key 不应在返回中暴露
      expect((config as any).apiKey).toBeUndefined()
    })

    it('应接受所有可选字段覆盖默认值', async () => {
      const config = await service.createConfig('tenant-001', {
        name: '高精度配置',
        provider: 'openai',
        modelName: 'gpt-4',
        apiKey: 'sk-gpt4',
        apiEndpoint: 'https://api.openai.com/v1',
        temperature: 0.1,
        maxTokens: 8192,
        topP: 0.95,
        quotaLimit: 100000,
        quotaAlertThreshold: 0.9,
      })
      expect(config.temperature).toBe(0.1)
      expect(config.maxTokens).toBe(8192)
      expect(config.topP).toBe(0.95)
      expect(config.quotaLimit).toBe(100000)
      expect(config.quotaAlertThreshold).toBe(0.9)
    })
  })

  describe('getConfig', () => {
    it('应通过 ID 获取已创建的配置', async () => {
      const created = await service.createConfig('tenant-001', {
        name: '查询测试', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-key',
      })
      const found = await service.getConfig(created.id, 'tenant-001')
      expect(found).not.toBeNull()
      expect(found!.id).toBe(created.id)
      expect(found!.name).toBe('查询测试')
    })

    it('跨租户隔离: 租户 B 不能访问租户 A 的配置', async () => {
      const created = await service.createConfig('tenant-A', {
        name: 'A的配置', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-a',
      })
      const found = await service.getConfig(created.id, 'tenant-B')
      expect(found).toBeNull()
    })

    it('不存在的配置返回 null', async () => {
      const found = await service.getConfig('non-existent-id', 'tenant-001')
      expect(found).toBeNull()
    })
  })

  describe('getConfigs', () => {
    it('应返回同一租户的配置 (至少包含刚创建的)', async () => {
      const config = await service.createConfig('tenant-001', {
        name: '列表测试', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-list',
      })
      const configs = await service.getConfigs('tenant-001')
      expect(configs.length).toBeGreaterThanOrEqual(1)
      expect(configs.some(c => c.id === config.id)).toBe(true)
    })

    it('跨租户隔离: 其他租户看不到', async () => {
      await service.createConfig('tenant-A', {
        name: 'A的配置', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-a',
      })
      const configsB = await service.getConfigs('tenant-B')
      // 租户A的配置不应出现在B中
      expect(configsB.every(c => c.tenantId === 'tenant-B')).toBe(true)
    })

    it('按 siteId 过滤', async () => {
      const configA = await service.createConfig('tenant-001', {
        name: '站点A-配置', provider: 'anthropic', modelName: 'claude-3', apiKey: 'sk-c',
        siteId: 'site-A-test',
      })
      const siteAConfigs = await service.getConfigs('tenant-001', 'site-A-test')
      expect(siteAConfigs.length).toBeGreaterThanOrEqual(1)
      expect(siteAConfigs.some(c => c.id === configA.id)).toBe(true)
    })

    it('无数据租户返回空数组', async () => {
      const configs = await service.getConfigs('empty-tenant-unique-' + Date.now())
      expect(configs).toEqual([])
    })
  })

  describe('updateConfig', () => {
    it('应更新配置字段并保留未修改字段', async () => {
      const created = await service.createConfig('tenant-001', {
        name: '原始配置', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-old',
        temperature: 0.7, maxTokens: 4096,
      })
      const updated = await service.updateConfig(created.id, 'tenant-001', {
        name: '更新后的配置', temperature: 0.5, maxTokens: 8192,
      })
      expect(updated).not.toBeNull()
      expect(updated!.name).toBe('更新后的配置')
      expect(updated!.temperature).toBe(0.5)
      expect(updated!.maxTokens).toBe(8192)
      // 未更新的字段保留原值
      expect(updated!.provider).toBe('openai')
      // updatedAt 应更新
      const createdUpdatedAt = new Date(created.updatedAt).getTime()
      const updatedUpdatedAt = new Date(updated!.updatedAt).getTime()
      expect(updatedUpdatedAt).toBeGreaterThanOrEqual(createdUpdatedAt)
    })

    it('跨租户更新返回 null', async () => {
      const created = await service.createConfig('tenant-A', {
        name: 'A的配置', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-a',
      })
      const updated = await service.updateConfig(created.id, 'tenant-B', { name: '不应该更新' })
      expect(updated).toBeNull()
    })

    it('不存在的配置返回 null', async () => {
      const updated = await service.updateConfig('non-existent-update', 'tenant-001', { name: '新名字' })
      expect(updated).toBeNull()
    })
  })

  describe('deleteConfig', () => {
    it('应删除配置并返回 true', async () => {
      const created = await service.createConfig('tenant-001', {
        name: '待删除-del-test', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-del',
      })
      const deleted = await service.deleteConfig(created.id, 'tenant-001')
      expect(deleted).toBe(true)
      // 确认已删除
      const found = await service.getConfig(created.id, 'tenant-001')
      expect(found).toBeNull()
    })

    it('跨租户删除返回 false', async () => {
      const created = await service.createConfig('tenant-A', {
        name: 'A的配置-del', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-a',
      })
      const deleted = await service.deleteConfig(created.id, 'tenant-B')
      expect(deleted).toBe(false)
    })

    it('不存在的配置返回 false', async () => {
      const deleted = await service.deleteConfig('non-existent-del', 'tenant-001')
      expect(deleted).toBe(false)
    })
  })

  // ============ 接入申请与审批 ============

  describe('applyConfig', () => {
    it('应提交接入申请并返回成功信息', async () => {
      const created = await service.createConfig('tenant-001', {
        name: '申请配置-apply', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-apply',
      })
      const result = await service.applyConfig(created.id, 'tenant-001', {
        configId: created.id,
        useCase: '智能客服对话',
        expectedVolume: 5000,
        businessJustification: '需要AI辅助客服',
      })
      expect(result.success).toBe(true)
      expect(result.message).toContain('接入申请已提交')
    })

    it('不存在的配置应抛出 NotFoundException', async () => {
      await expect(
        service.applyConfig('non-existent-apply', 'tenant-001', {
          configId: 'non-existent-apply',
          useCase: '测试',
          expectedVolume: 100,
        })
      ).rejects.toThrow(NotFoundException)
    })

    it('跨租户申请应抛出 NotFoundException', async () => {
      const created = await service.createConfig('tenant-A-apply', {
        name: 'A的配置-apply', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-a',
      })
      await expect(
        service.applyConfig(created.id, 'tenant-B-apply', {
          configId: created.id,
          useCase: '跨界申请',
          expectedVolume: 100,
        })
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('approveConfig', () => {
    it('审批通过: 状态变为 approved, enabled=true', async () => {
      const created = await service.createConfig('tenant-001', {
        name: '待审批配置-approve', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-approve',
      })
      const approved = await service.approveConfig(created.id, 'admin-001', true)
      expect(approved).not.toBeNull()
      expect(approved!.status).toBe('approved')
      expect(approved!.enabled).toBe(true)
      expect(approved!.approvedBy).toBe('admin-001')
      expect(approved!.approvedAt).toBeDefined()
    })

    it('审批拒绝: 状态变为 rejected, enabled=false', async () => {
      const created = await service.createConfig('tenant-001', {
        name: '待拒绝配置-reject', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-reject',
      })
      const rejected = await service.approveConfig(created.id, 'admin-002', false)
      expect(rejected).not.toBeNull()
      expect(rejected!.status).toBe('rejected')
      expect(rejected!.enabled).toBe(false)
      expect(rejected!.approvedBy).toBe('admin-002')
    })

    it('不存在的配置返回 null', async () => {
      const result = await service.approveConfig('non-existent-approve', 'admin', true)
      expect(result).toBeNull()
    })
  })

  // ============ 调用统计与日志 ============

  describe('logCall + getCallLogs', () => {
    it('应记录调用日志并可查询', async () => {
      const created = await service.createConfig('tenant-001', {
        name: '统计测试-log', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-stats',
      })
      const log = await service.logCall({
        configId: created.id,
        tenantId: 'tenant-001',
        sessionId: 'session-001',
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        costEstimate: 0.015,
        currency: 'USD',
        latencyMs: 850,
        status: 'success',
      })
      expect(log.id).toMatch(/^log-/)
      expect(log.status).toBe('success')
      expect(log.createdAt).toBeDefined()

      const logs = await service.getCallLogs('tenant-001')
      expect(logs.length).toBeGreaterThanOrEqual(1)
      expect(logs.some(l => l.configId === created.id)).toBe(true)
    })

    it('调用日志按租户隔离', async () => {
      await service.logCall({
        configId: 'cfg-tenant-a-log-test', tenantId: 'tenant-A-log',
        promptTokens: 50, completionTokens: 100, totalTokens: 150,
        costEstimate: 0.005, currency: 'USD', latencyMs: 500,
        status: 'success',
      })
      const logsB = await service.getCallLogs('tenant-B-log')
      expect(logsB.length).toBe(0)
    })

    it('调用日志按 configId 过滤', async () => {
      await service.logCall({
        configId: 'cfg-red-filter', tenantId: 'tenant-001',
        promptTokens: 10, completionTokens: 20, totalTokens: 30,
        costEstimate: 0.001, currency: 'USD', latencyMs: 300,
        status: 'success',
      })
      await service.logCall({
        configId: 'cfg-blue-filter', tenantId: 'tenant-001',
        promptTokens: 30, completionTokens: 60, totalTokens: 90,
        costEstimate: 0.003, currency: 'USD', latencyMs: 600,
        status: 'success',
      })
      const redLogs = await service.getCallLogs('tenant-001', 'cfg-red-filter')
      expect(redLogs.length).toBe(1)
      expect(redLogs[0].configId).toBe('cfg-red-filter')
    })

    it('调用日志默认按时间倒序排列', async () => {
      await service.logCall({
        configId: 'cfg-order-1', tenantId: 'tenant-001',
        promptTokens: 1, completionTokens: 1, totalTokens: 2,
        costEstimate: 0.001, currency: 'USD', latencyMs: 100,
        status: 'success',
      })
      // 短暂等待确保时间戳差异
      await new Promise(r => setTimeout(r, 5))
      await service.logCall({
        configId: 'cfg-order-2', tenantId: 'tenant-001',
        promptTokens: 2, completionTokens: 2, totalTokens: 4,
        costEstimate: 0.002, currency: 'USD', latencyMs: 200,
        status: 'success',
      })
      const logs = await service.getCallLogs('tenant-001', undefined, undefined, undefined)
      // 最新的在前: 找到我们刚插入的两个日志
      const order1Idx = logs.findIndex(l => l.configId === 'cfg-order-1')
      const order2Idx = logs.findIndex(l => l.configId === 'cfg-order-2')
      expect(order2Idx).toBeGreaterThanOrEqual(0)
      expect(order1Idx).toBeGreaterThanOrEqual(0)
      // order-2 应在 order-1 之前 (时间倒序)
      expect(order2Idx).toBeLessThan(order1Idx)
    })
  })

  describe('getStats', () => {
    it('应计算调用统计', async () => {
      const created = await service.createConfig('tenant-001', {
        name: '统计配置-stats', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-stats',
      })
      await service.logCall({
        configId: created.id, tenantId: 'tenant-001',
        promptTokens: 100, completionTokens: 200, totalTokens: 300,
        costEstimate: 0.01, currency: 'USD', latencyMs: 500,
        status: 'success',
      })
      await service.logCall({
        configId: created.id, tenantId: 'tenant-001',
        promptTokens: 50, completionTokens: 100, totalTokens: 150,
        costEstimate: 0.005, currency: 'USD', latencyMs: 800,
        status: 'success',
      })
      await service.logCall({
        configId: created.id, tenantId: 'tenant-001',
        promptTokens: 200, completionTokens: 400, totalTokens: 600,
        costEstimate: 0.02, currency: 'USD', latencyMs: 1500,
        status: 'error',
      })
      const stats = await service.getStats('tenant-001')
      // 这些配置的日志总计数
      expect(stats.totalCalls).toBeGreaterThanOrEqual(3)
      expect(stats.totalPromptTokens).toBeGreaterThanOrEqual(350)
      expect(stats.totalCompletionTokens).toBeGreaterThanOrEqual(700)
      expect(stats.totalTokens).toBeGreaterThanOrEqual(1050)
      expect(stats.totalCost).toBeGreaterThanOrEqual(0.035)
      expect(stats.avgLatencyMs).toBeGreaterThan(0)
    })

    it('无数据租户各项指标为 0', async () => {
      const stats = await service.getStats('empty-tenant-stats-' + Date.now())
      expect(stats.totalCalls).toBe(0)
      expect(stats.successCalls).toBe(0)
      expect(stats.failedCalls).toBe(0)
      expect(stats.avgLatencyMs).toBe(0)
      expect(stats.totalCost).toBe(0)
    })

    it('时间范围过滤', async () => {
      const created = await service.createConfig('tenant-001', {
        name: '时间过滤-stats', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-time',
      })
      await service.logCall({
        configId: created.id, tenantId: 'tenant-001',
        promptTokens: 10, completionTokens: 10, totalTokens: 20,
        costEstimate: 0.001, currency: 'USD', latencyMs: 100,
        status: 'success',
      })
      // 未来时间段应没有数据
      const statsFuture = await service.getStats('tenant-001', undefined, '2099-01-01T00:00:00Z')
      expect(statsFuture.totalCalls).toBe(0)
    })
  })

  describe('getApiKey', () => {
    it('应返回 null (当前实现从加密存储获取)', async () => {
      const created = await service.createConfig('tenant-001', {
        name: 'Key测试-apikey', provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-secret-xxx',
      })
      const key = service.getApiKey(created.id, 'tenant-001')
      expect(key).toBeNull()
    })

    it('不存在的配置返回 null', () => {
      const key = service.getApiKey('non-existent-apikey', 'tenant-001')
      expect(key).toBeNull()
    })
  })
})
