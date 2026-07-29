/**
 * collab.service.spec.ts — 联名项目服务全覆盖测试 V24
 *
 * 覆盖:
 *   - create（正常/边界/异常/租户隔离）
 *   - findById（正常/不存在/跨租户）
 *   - findAll（多租户/过滤/排序/空）
 *   - update（字段更新/状态机转换/不合法转换/跨租户）
 *   - delete（正常/不存在/跨租户）
 *   - countByStatus（空统计/多状态/多租户隔离）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CollabService } from './collab.service'
import { CollabStatus } from './collab.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

function makeCtx(tenantId = 'tenant-1'): RequestTenantContext {
  return { tenantId } as RequestTenantContext
}

function makeInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantContext: makeCtx(),
    name: '测试联名',
    brandId: 'brand-1',
    startDate: '2026-07-01T00:00:00Z',
    endDate: '2026-09-30T00:00:00Z',
    revenueShareRate: 30,
    budget: 100000,
    ...overrides,
  }
}

describe('CollabService', () => {
  let service: CollabService

  beforeEach(() => {
    CollabService._resetStoreForTest()
    service = new CollabService()
  })

  // ════════════════════════════════════════════════════════
  // create
  // ════════════════════════════════════════════════════════

  describe('create', () => {
    it('正例: 创建正常联名项目返回完整结构', () => {
      const p = service.create(makeInput())
      expect(p.projectId).toMatch(/^collab-/)
      expect(p.name).toBe('测试联名')
      expect(p.status).toBe(CollabStatus.Draft)
      expect(p.revenueShareRate).toBe(30)
      expect(p.budget).toBe(100000)
      expect(typeof p.createdAt).toBe('string')
      expect(typeof p.updatedAt).toBe('string')
      expect(p.tenantContext.tenantId).toBe('tenant-1')
    })

    it('正例: 初始状态始终为 Draft', () => {
      const p = service.create(makeInput())
      expect(p.status).toBe(CollabStatus.Draft)
    })

    it('正例: 支持可选字段 brandName 和 description', () => {
      const p = service.create(makeInput({ brandName: '可口可乐', description: '夏季联名活动' }))
      expect(p.brandName).toBe('可口可乐')
      expect(p.description).toBe('夏季联名活动')
    })

    it('正例: 不含可选字段时不报错', () => {
      const p = service.create(makeInput({ brandName: undefined, description: undefined }))
      expect(p.brandName).toBeUndefined()
      expect(p.description).toBeUndefined()
    })

    it('边界: 分润比例为 0 可正常创建', () => {
      const p = service.create(makeInput({ revenueShareRate: 0 }))
      expect(p.revenueShareRate).toBe(0)
    })

    it('边界: 分润比例为 100 可正常创建', () => {
      const p = service.create(makeInput({ revenueShareRate: 100 }))
      expect(p.revenueShareRate).toBe(100)
    })

    it('边界: 预算为 0 可正常创建', () => {
      const p = service.create(makeInput({ budget: 0 }))
      expect(p.budget).toBe(0)
    })

    it('异常: 分润比例小于 0 抛错', () => {
      expect(() => service.create(makeInput({ revenueShareRate: -1 }))).toThrow(
        'Revenue share rate must be between 0 and 100',
      )
    })

    it('异常: 分润比例大于 100 抛错', () => {
      expect(() => service.create(makeInput({ revenueShareRate: 101 }))).toThrow(
        'Revenue share rate must be between 0 and 100',
      )
    })

    it('异常: 预算为负抛错', () => {
      expect(() => service.create(makeInput({ budget: -100 }))).toThrow(
        'Budget must be non-negative',
      )
    })

    it('异常: 结束时间早于开始时间抛错', () => {
      expect(() =>
        service.create(makeInput({ startDate: '2026-09-30T00:00:00Z', endDate: '2026-07-01T00:00:00Z' })),
      ).toThrow('End date must be after start date')
    })

    it('异常: 开始结束时间相同抛错', () => {
      const same = '2026-07-01T00:00:00Z'
      expect(() => service.create(makeInput({ startDate: same, endDate: same }))).toThrow(
        'End date must be after start date',
      )
    })
  })

  // ════════════════════════════════════════════════════════
  // findById
  // ════════════════════════════════════════════════════════

  describe('findById', () => {
    it('正例: 按 ID 查找存在的项目', () => {
      const created = service.create(makeInput())
      const found = service.findById(created.projectId, 'tenant-1')
      expect(found).toBeDefined()
      expect(found!.projectId).toBe(created.projectId)
    })

    it('异常: 不存在的 ID 返回 undefined', () => {
      expect(service.findById('collab-nonexistent', 'tenant-1')).toBeUndefined()
    })

    it('异常: 跨租户查询返回 undefined', () => {
      const p = service.create(makeInput({ tenantContext: makeCtx('t1') }))
      expect(service.findById(p.projectId, 't2')).toBeUndefined()
    })
  })

  // ════════════════════════════════════════════════════════
  // findAll
  // ════════════════════════════════════════════════════════

  describe('findAll', () => {
    it('正例: 返回租户所有项目', () => {
      service.create(makeInput({ name: '项目A' }))
      service.create(makeInput({ name: '项目B' }))
      expect(service.findAll('tenant-1')).toHaveLength(2)
    })

    it('正例: 无项目时返回空数组', () => {
      expect(service.findAll('tenant-1')).toEqual([])
    })

    it('正例: 支持按状态筛选', () => {
      const p = service.create(makeInput())
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Negotiating })
      expect(service.findAll('tenant-1', { status: CollabStatus.Draft })).toHaveLength(0)
      expect(service.findAll('tenant-1', { status: CollabStatus.Negotiating })).toHaveLength(1)
    })

    it('正例: 支持按品牌 ID 筛选', () => {
      service.create(makeInput({ brandId: 'b1' }))
      service.create(makeInput({ brandId: 'b2' }))
      expect(service.findAll('tenant-1', { brandId: 'b1' })).toHaveLength(1)
    })

    it('正例: 支持按名称模糊搜索', () => {
      service.create(makeInput({ name: '可口可乐联名' }))
      service.create(makeInput({ name: '百事可乐联名' }))
      expect(service.findAll('tenant-1', { name: '可乐' })).toHaveLength(2)
      expect(service.findAll('tenant-1', { name: '百事' })).toHaveLength(1)
    })

    it('正例: 按创建时间降序排列', () => {
      service.create(makeInput({ name: '最早' }))
      service.create(makeInput({ name: '中间' }))
      service.create(makeInput({ name: '最晚' }))
      const results = service.findAll('tenant-1')
      const times = results.map((r) => new Date(r.createdAt).getTime())
      expect(times[0]).toBeGreaterThanOrEqual(times[1])
      expect(times[1]).toBeGreaterThanOrEqual(times[2])
    })

    it('正例: 不同租户数据隔离', () => {
      service.create(makeInput({ tenantContext: makeCtx('t1'), name: 'A' }))
      service.create(makeInput({ tenantContext: makeCtx('t2'), name: 'B' }))
      expect(service.findAll('t1')).toHaveLength(1)
      expect(service.findAll('t2')).toHaveLength(1)
    })
  })

  // ════════════════════════════════════════════════════════
  // update
  // ════════════════════════════════════════════════════════

  describe('update', () => {
    it('正例: 更新名称和描述', () => {
      const p = service.create(makeInput())
      const u = service.update(p.projectId, 'tenant-1', { name: '新名称', description: '新描述' })
      expect(u.name).toBe('新名称')
      expect(u.description).toBe('新描述')
    })

    it('正例: 更新分润比例', () => {
      const p = service.create(makeInput())
      const u = service.update(p.projectId, 'tenant-1', { revenueShareRate: 50 })
      expect(u.revenueShareRate).toBe(50)
    })

    it('异常: 更新分润比例超范围抛错', () => {
      const p = service.create(makeInput())
      expect(() => service.update(p.projectId, 'tenant-1', { revenueShareRate: 150 })).toThrow()
    })

    it('异常: 更新预算为负抛错', () => {
      const p = service.create(makeInput())
      expect(() => service.update(p.projectId, 'tenant-1', { budget: -1 })).toThrow()
    })

    it('正例: Draft → NEGOTIATING 合法', () => {
      const p = service.create(makeInput())
      const u = service.update(p.projectId, 'tenant-1', { status: CollabStatus.Negotiating })
      expect(u.status).toBe(CollabStatus.Negotiating)
    })

    it('异常: Draft → ACTIVE 不合法', () => {
      const p = service.create(makeInput())
      expect(() => service.update(p.projectId, 'tenant-1', { status: CollabStatus.Active })).toThrow(
        'Invalid collab status transition',
      )
    })

    it('正例: NEGOTIATING → ACTIVE 合法', () => {
      const p = service.create(makeInput())
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Negotiating })
      const u = service.update(p.projectId, 'tenant-1', { status: CollabStatus.Active })
      expect(u.status).toBe(CollabStatus.Active)
    })

    it('正例: NEGOTIATING → CANCELLED 合法', () => {
      const p = service.create(makeInput())
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Negotiating })
      const u = service.update(p.projectId, 'tenant-1', { status: CollabStatus.Cancelled })
      expect(u.status).toBe(CollabStatus.Cancelled)
    })

    it('正例: ACTIVE → PAUSED → ACTIVE 来回切换合法', () => {
      const p = service.create(makeInput())
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Negotiating })
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Active })
      const paused = service.update(p.projectId, 'tenant-1', { status: CollabStatus.Paused })
      expect(paused.status).toBe(CollabStatus.Paused)
      const resumed = service.update(p.projectId, 'tenant-1', { status: CollabStatus.Active })
      expect(resumed.status).toBe(CollabStatus.Active)
    })

    it('异常: COMPLETED → 任何状态不合法', () => {
      const p = service.create(makeInput())
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Negotiating })
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Active })
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Completed })
      expect(() => service.update(p.projectId, 'tenant-1', { status: CollabStatus.Active })).toThrow()
    })

    it('异常: CANCELLED → 任何状态不合法', () => {
      const p = service.create(makeInput())
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Negotiating })
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Cancelled })
      expect(() => service.update(p.projectId, 'tenant-1', { status: CollabStatus.Draft })).toThrow()
    })

    it('异常: 不存在的项目更新抛错', () => {
      expect(() => service.update('nonexistent', 'tenant-1', { name: 'x' })).toThrow(
        'Collab project not found',
      )
    })

    it('异常: 跨租户更新抛错', () => {
      const p = service.create(makeInput({ tenantContext: makeCtx('t1') }))
      expect(() => service.update(p.projectId, 't2', { name: 'x' })).toThrow(
        'Collab project not found',
      )
    })

    it('正例: PAUSED → CANCELLED 合法', () => {
      const p = service.create(makeInput())
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Negotiating })
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Active })
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Paused })
      const u = service.update(p.projectId, 'tenant-1', { status: CollabStatus.Cancelled })
      expect(u.status).toBe(CollabStatus.Cancelled)
    })
  })

  // ════════════════════════════════════════════════════════
  // delete
  // ════════════════════════════════════════════════════════

  describe('delete', () => {
    it('正例: 删除后不可查询', () => {
      const p = service.create(makeInput())
      service.delete(p.projectId, 'tenant-1')
      expect(service.findById(p.projectId, 'tenant-1')).toBeUndefined()
    })

    it('异常: 删除不存在的项目抛错', () => {
      expect(() => service.delete('nonexistent', 'tenant-1')).toThrow(
        'Collab project not found',
      )
    })

    it('异常: 跨租户删除抛错', () => {
      const p = service.create(makeInput({ tenantContext: makeCtx('t1') }))
      expect(() => service.delete(p.projectId, 't2')).toThrow('Collab project not found')
    })
  })

  // ════════════════════════════════════════════════════════
  // countByStatus
  // ════════════════════════════════════════════════════════

  describe('countByStatus', () => {
    it('正例: 空租户所有状态计数为 0', () => {
      const counts = service.countByStatus('empty-tenant')
      for (const s of Object.values(CollabStatus)) {
        expect(counts[s]).toBe(0)
      }
    })

    it('正例: 正确统计多个状态', () => {
      const p1 = service.create(makeInput())
      const p2 = service.create(makeInput())
      service.update(p2.projectId, 'tenant-1', { status: CollabStatus.Negotiating })
      const c = service.countByStatus('tenant-1')
      expect(c[CollabStatus.Draft]).toBe(1)
      expect(c[CollabStatus.Negotiating]).toBe(1)
    })

    it('正例: 不同租户统计隔离', () => {
      service.create(makeInput({ tenantContext: makeCtx('t1') }))
      service.create(makeInput({ tenantContext: makeCtx('t2') }))
      service.create(makeInput({ tenantContext: makeCtx('t2') }))
      expect(service.countByStatus('t1')[CollabStatus.Draft]).toBe(1)
      expect(service.countByStatus('t2')[CollabStatus.Draft]).toBe(2)
    })
  })
})
