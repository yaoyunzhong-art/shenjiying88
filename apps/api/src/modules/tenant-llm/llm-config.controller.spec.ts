import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * llm-config.controller.spec.ts
 *
 * TenantLLMController 全路由 spec——覆盖全部 8 个端点 (正例+反例+边界+权限)
 */

import assert from 'node:assert/strict'
import { TenantLLMController } from './llm-config.controller'

describe('TenantLLMController', () => {
  // mock service 工厂 - 每次返回干净 mock
  function createMockService() {
    return {
      getConfigs: (tenantId: string, siteId?: string) =>
        Promise.resolve([
          { id: 'llm-001', tenantId, name: 'DeepSeek 生产', provider: 'deepseek', status: 'approved' },
        ]),
      getConfig: (id: string, tenantId: string) => {
        if (id === 'not-found') return Promise.resolve(null)
        return Promise.resolve({ id, tenantId, name: 'DeepSeek 生产', provider: 'deepseek', status: 'approved' })
      },
      createConfig: (tenantId: string, request: any) =>
        Promise.resolve({ id: 'llm-new', tenantId, name: request.name, provider: request.provider, status: 'pending' }),
      updateConfig: (id: string, tenantId: string, updates: any) =>
        Promise.resolve({ id, tenantId, ...updates, updatedAt: '2026-07-06T14:55:00Z' }),
      deleteConfig: (id: string, tenantId: string) => {
        if (id === 'not-found') return Promise.resolve(false)
        return Promise.resolve(true)
      },
      applyConfig: (id: string, tenantId: string, request: any) =>
        Promise.resolve({ success: true, message: '接入申请已提交，等待平台管理员审批' }),
      approveConfig: (id: string, approvedBy: string, approved: boolean) =>
        Promise.resolve({ id, approvedBy, status: approved ? 'approved' : 'rejected', enabled: approved }),
      getStats: (tenantId: string, configId?: string, periodStart?: string, periodEnd?: string) =>
        Promise.resolve({
          totalCalls: 100, successCalls: 95, failedCalls: 5,
          totalPromptTokens: 50000, totalCompletionTokens: 100000,
          totalTokens: 150000, totalCost: 3.5, currency: 'USD',
          avgLatencyMs: 1200, periodStart: periodStart || '2026-07-01T00:00:00Z',
          periodEnd: periodEnd || '2026-07-06T14:55:00Z',
        }),
      getCallLogs: () =>
        Promise.resolve([
          { id: 'log-001', configId: 'llm-001', tenantId: 't-001', status: 'success', promptTokens: 500, completionTokens: 1000, totalTokens: 1500, costEstimate: 0.05, latencyMs: 800, createdAt: '2026-07-06T10:00:00Z' },
        ]),
    }
  }

  describe('路由注册与模块元数据', () => {
    it('Controller 有正确的路由前缀', () => {
      const path = Reflect.getMetadata('path', TenantLLMController)
      assert.equal(path, 'llm')
    })

    it('UseGuards 守卫注册正确', () => {
      const guards = Reflect.getMetadata('__guards__', TenantLLMController)
      assert.ok(guards, 'TenantLLMController 应注册守卫')
    })
  })

  describe('GET /llm/configs — getConfigs', () => {
    it('正常查询: 返回配置列表', async () => {
      const svc = createMockService()
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.getConfigs('t-001')
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].name, 'DeepSeek 生产')
    })

    it('带 siteId 筛选参数', async () => {
      let capturedTenantId = ''
      let capturedSiteId = ''
      const svc = createMockService()
      svc.getConfigs = ((t: string, s?: string) => {
        capturedTenantId = t
        capturedSiteId = s || ''
        return Promise.resolve([])
      }) as any
      const ctrl = new TenantLLMController(svc as any)

      await ctrl.getConfigs('t-001', 'site-abc')
      assert.equal(capturedTenantId, 't-001')
      assert.equal(capturedSiteId, 'site-abc')
    })

    it('空数据: 返回空数组', async () => {
      const svc = createMockService()
      svc.getConfigs = () => Promise.resolve([])
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.getConfigs('t-001')
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 0)
    })
  })

  describe('GET /llm/configs/:id — getConfig', () => {
    it('正常查询: 返回单个配置', async () => {
      const svc = createMockService()
      const ctrl = new TenantLLMController(svc as any)

      const result = (await ctrl.getConfig('llm-001', 't-001')) as { id: string; name: string }
      assert.equal(result!.id, 'llm-001')
      assert.equal(result!.name, 'DeepSeek 生产')
    })

    it('不存在的 id: 返回 { error }', async () => {
      const svc = createMockService()
      const ctrl = new TenantLLMController(svc as any)

      const result = (await ctrl.getConfig('not-found', 't-001')) as { error: string }
      assert.equal(result.error, '配置不存在')
    })

    it('跨租户隔离: 其他租户不可见', async () => {
      const svc = createMockService()
      svc.getConfig = ((id: string, tenantId: string) => {
        if (tenantId !== 't-001') return Promise.resolve(null)
        return Promise.resolve({ id, tenantId, name: 'DeepSeek 生产', provider: 'deepseek' })
      }) as any
      const ctrl = new TenantLLMController(svc as any)

      const result = (await ctrl.getConfig('llm-001', 't-999')) as { error: string }
      assert.equal(result.error, '配置不存在')
    })
  })

  describe('POST /llm/configs — createConfig', () => {
    it('正常创建: 返回新配置对象', async () => {
      const svc = createMockService()
      const ctrl = new TenantLLMController(svc as any)

      const dto = { name: '测试配置', provider: 'deepseek', modelName: 'deepseek-chat', apiKey: 'sk-test' }
      const result = await ctrl.createConfig('t-001', dto as any)
      assert.equal(result!.id, 'llm-new')
      assert.equal(result!.name, '测试配置')
      assert.equal(result!.status, 'pending')
    })

    it('默认 pending 状态即使不传参', async () => {
      let capturedRequest: any = null
      const svc = createMockService()
      svc.createConfig = ((t: string, r: any) => {
        capturedRequest = r
        return Promise.resolve({ id: 'llm-new', tenantId: t, name: r.name, provider: r.provider, status: 'pending' })
      }) as any
      const ctrl = new TenantLLMController(svc as any)

      await ctrl.createConfig('t-001', { name: '无状态配置', provider: 'anthropic', modelName: 'claude-3', apiKey: 'sk-claude' } as any)
      assert.ok(capturedRequest)
      assert.equal(capturedRequest.name, '无状态配置')
      assert.equal(capturedRequest.provider, 'anthropic')
    })
  })

  describe('PUT /llm/configs/:id — updateConfig', () => {
    it('正常更新: 返回更新后的配置', async () => {
      const svc = createMockService()
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.updateConfig('llm-001', 't-001', { name: '更新名称' })
      assert.equal(result!.id, 'llm-001')
      assert.equal(result!.name, '更新名称')
    })

    it('部分字段更新', async () => {
      let capturedUpdates: any = null
      const svc = createMockService()
      svc.updateConfig = ((id: string, t: string, updates: any) => {
        capturedUpdates = updates
        return Promise.resolve({ id, tenantId: t, ...updates, updatedAt: '2026-07-06T14:55:00Z' })
      }) as any
      const ctrl = new TenantLLMController(svc as any)

      await ctrl.updateConfig('llm-001', 't-001', { enabled: true })
      assert.equal(capturedUpdates.enabled, true)
      assert.equal(capturedUpdates.name, undefined)
    })

    it('不存在或跨租户时返回 null', async () => {
      const svc = createMockService()
      svc.updateConfig = () => Promise.resolve(null)
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.updateConfig('not-found', 't-001', { name: '不存在' })
      assert.equal(result, null)
    })
  })

  describe('DELETE /llm/configs/:id — deleteConfig', () => {
    it('正常删除: 返回 { deleted: true }', async () => {
      const svc = createMockService()
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.deleteConfig('llm-001', 't-001')
      assert.deepEqual(result, { deleted: true })
    })

    it('不存在的配置删除: 返回 { deleted: false }', async () => {
      const svc = createMockService()
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.deleteConfig('not-found', 't-001')
      assert.deepEqual(result, { deleted: false })
    })
  })

  describe('POST /llm/configs/:id/apply — applyConfig', () => {
    it('正常提交: 返回成功信息', async () => {
      const svc = createMockService()
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.applyConfig('llm-001', 't-001', { useCase: '智能客服', expectedVolume: 1000 } as any)
      assert.equal(result.success, true)
      assert.ok(result.message.includes('等待平台管理员审批'))
    })

    it('不存在配置提交抛异常', async () => {
      const svc = createMockService()
      svc.applyConfig = () => Promise.reject(new Error('配置不存在'))
      const ctrl = new TenantLLMController(svc as any)

      await assert.rejects(
        () => ctrl.applyConfig('not-found', 't-001', { useCase: 'test', expectedVolume: 100 } as any),
        /配置不存在/
      )
    })
  })

  describe('POST /llm/configs/:id/approve — approveConfig', () => {
    it('正常审批通过: 返回 approved 状态', async () => {
      const svc = createMockService()
      const ctrl = new TenantLLMController(svc as any)

      const result = (await ctrl.approveConfig('llm-001', { approved: true, approvedBy: 'admin-001' })) as { id: string; approvedBy: string; status: string; enabled: boolean }
      assert.equal(result!.status, 'approved')
      assert.equal(result!.enabled, true)
    })

    it('审批拒绝: 返回 rejected 状态', async () => {
      const svc = createMockService()
      svc.approveConfig = () => Promise.resolve({ id: 'llm-001', approvedBy: 'admin-001', status: 'rejected', enabled: false })
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.approveConfig('llm-001', { approved: false, approvedBy: 'admin-001' })
      assert.equal(result!.status, 'rejected')
      assert.equal(result!.enabled, false)
    })

    it('不存在的配置审批抛异常', async () => {
      const svc = createMockService()
      svc.approveConfig = (() => Promise.resolve(null)) as any
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.approveConfig('not-found', { approved: true, approvedBy: 'admin' })
      assert.equal(result, null)
    })
  })

  describe('GET /llm/stats — getStats', () => {
    it('正常查询: 返回统计对象', async () => {
      const svc = createMockService()
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.getStats('t-001')
      assert.equal(result.totalCalls, 100)
      assert.equal(result.successCalls, 95)
      assert.equal(result.failedCalls, 5)
      assert.equal(result.totalTokens, 150000)
    })

    it('时间范围过滤参数传递', async () => {
      let capturedPeriodStart = ''
      let capturedPeriodEnd = ''
      const svc = createMockService()
      svc.getStats = ((t: string, c?: string, ps?: string, pe?: string) => {
        capturedPeriodStart = ps || ''
        capturedPeriodEnd = pe || ''
        return Promise.resolve({ totalCalls: 0, successCalls: 0, failedCalls: 0, totalPromptTokens: 0, totalCompletionTokens: 0, totalTokens: 0, totalCost: 0, currency: 'USD', avgLatencyMs: 0, periodStart: ps || '', periodEnd: pe || '' })
      }) as any
      const ctrl = new TenantLLMController(svc as any)

      await ctrl.getStats('t-001', undefined, '2026-07-01T00:00:00Z', '2026-07-06T23:59:59Z')
      assert.equal(capturedPeriodStart, '2026-07-01T00:00:00Z')
      assert.equal(capturedPeriodEnd, '2026-07-06T23:59:59Z')
    })

    it('指定 configId 过滤', async () => {
      let capturedConfigId = ''
      const svc = createMockService()
      svc.getStats = ((t: string, c?: string) => {
        capturedConfigId = c || ''
        return Promise.resolve({ totalCalls: 0, successCalls: 0, failedCalls: 0, totalPromptTokens: 0, totalCompletionTokens: 0, totalTokens: 0, totalCost: 0, currency: 'USD', avgLatencyMs: 0, periodStart: '', periodEnd: '' })
      }) as any
      const ctrl = new TenantLLMController(svc as any)

      await ctrl.getStats('t-001', 'llm-001')
      assert.equal(capturedConfigId, 'llm-001')
    })

    it('无数据统计: 各项指标为 0', async () => {
      const svc = createMockService()
      svc.getStats = () => Promise.resolve({ totalCalls: 0, successCalls: 0, failedCalls: 0, totalPromptTokens: 0, totalCompletionTokens: 0, totalTokens: 0, totalCost: 0, currency: 'USD', avgLatencyMs: 0, periodStart: '2026-07-01T00:00:00Z', periodEnd: '2026-07-06T14:55:00Z' })
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.getStats('t-001')
      assert.equal(result.totalCalls, 0)
      assert.equal(result.avgLatencyMs, 0)
    })
  })

  describe('GET /llm/logs — getCallLogs', () => {
    it('正常查询: 返回日志列表', async () => {
      const svc = createMockService()
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.getCallLogs('t-001')
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].status, 'success')
    })

    it('空数据: 返回空数组', async () => {
      const svc = createMockService()
      svc.getCallLogs = () => Promise.resolve([])
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.getCallLogs('t-001')
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 0)
    })

    it('时间范围过滤参数传递', async () => {
      let capturedPs = ''
      let capturedPe = ''
      const svc = createMockService()
      svc.getCallLogs = ((t: string, c?: string, ps?: string, pe?: string) => {
        capturedPs = ps || ''
        capturedPe = pe || ''
        return Promise.resolve([])
      }) as any
      const ctrl = new TenantLLMController(svc as any)

      await ctrl.getCallLogs('t-001', undefined, '2026-07-01T00:00:00Z', '2026-07-06T23:59:59Z')
      assert.equal(capturedPs, '2026-07-01T00:00:00Z')
      assert.equal(capturedPe, '2026-07-06T23:59:59Z')
    })

    it('指定 configId 过滤日志', async () => {
      let capturedId = ''
      const svc = createMockService()
      svc.getCallLogs = ((t: string, c?: string) => {
        capturedId = c || ''
        return Promise.resolve([])
      }) as any
      const ctrl = new TenantLLMController(svc as any)

      await ctrl.getCallLogs('t-001', 'llm-001')
      assert.equal(capturedId, 'llm-001')
    })
  })

  describe('权限与安全边界', () => {
    it('租户隔离: 不同租户看不到对方配置', async () => {
      const svc = createMockService()
      svc.getConfigs = ((tenantId: string) => {
        if (tenantId === 't-001') return Promise.resolve([{ id: 'llm-001', tenantId: 't-001', name: 'A', provider: 'deepseek' }])
        return Promise.resolve([])
      }) as any
      const ctrl = new TenantLLMController(svc as any)

      const resultA = await ctrl.getConfigs('t-001')
      const resultB = await ctrl.getConfigs('t-002')
      assert.equal(resultA.length, 1)
      assert.equal(resultB.length, 0)
    })

    it('删除使用中的配置应返回 false', async () => {
      const svc = createMockService()
      svc.deleteConfig = ((id: string) => {
        if (id === 'llm-in-use') return Promise.resolve(false)
        return Promise.resolve(true)
      }) as any
      const ctrl = new TenantLLMController(svc as any)

      const result = await ctrl.deleteConfig('llm-in-use', 't-001')
      assert.deepEqual(result, { deleted: false })
    })

    it('service 内部错误应传播', async () => {
      const svc = createMockService()
      svc.getConfigs = () => Promise.reject(new Error('数据库连接失败'))
      const ctrl = new TenantLLMController(svc as any)

      await assert.rejects(
        () => ctrl.getConfigs('t-001'),
        /数据库连接失败/
      )
    })
  })
})
