/**
 * collab.service.test.ts — 联名项目管理 Service 单元测试
 *
 * 覆盖: create / findById / findAll / update / delete / countByStatus
 * 正例 + 反例 + 边界
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CollabService, type CreateCollabInput } from './collab.service'
import { CollabStatus } from './collab.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

function makeCtx(tenantId = 'tenant-1'): RequestTenantContext {
  return { tenantId } as RequestTenantContext
}

function makeInput(overrides: Partial<CreateCollabInput> = {}): CreateCollabInput {
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

  // ═══════════════════════════════════════════════════════════════
  // create
  // ═══════════════════════════════════════════════════════════════

  describe('create', () => {
    it('正常创建一个联名项目，返回完整结构', () => {
      const project = service.create(makeInput())

      expect(project.projectId).toMatch(/^collab-/)
      expect(project.name).toBe('测试联名')
      expect(project.brandId).toBe('brand-1')
      expect(project.status).toBe(CollabStatus.Draft)
      expect(project.revenueShareRate).toBe(30)
      expect(project.budget).toBe(100000)
      expect(typeof project.createdAt).toBe('string')
      expect(typeof project.updatedAt).toBe('string')
    })

    it('新建项目的状态默认为 Draft', () => {
      const project = service.create(makeInput())
      expect(project.status).toBe(CollabStatus.Draft)
    })

    it('分润比例为 0 时也可以正常创建', () => {
      const project = service.create(makeInput({ revenueShareRate: 0 }))
      expect(project.revenueShareRate).toBe(0)
    })

    it('分润比例为 100 时也可以正常创建', () => {
      const project = service.create(makeInput({ revenueShareRate: 100 }))
      expect(project.revenueShareRate).toBe(100)
    })

    it('预算是 0 时也可以正常创建', () => {
      const project = service.create(makeInput({ budget: 0 }))
      expect(project.budget).toBe(0)
    })

    it('分润比例小于 0 时抛出异常', () => {
      expect(() => service.create(makeInput({ revenueShareRate: -1 }))).toThrow(
        'Revenue share rate must be between 0 and 100',
      )
    })

    it('分润比例大于 100 时抛出异常', () => {
      expect(() => service.create(makeInput({ revenueShareRate: 101 }))).toThrow(
        'Revenue share rate must be between 0 and 100',
      )
    })

    it('预算是负值时抛出异常', () => {
      expect(() => service.create(makeInput({ budget: -100 }))).toThrow(
        'Budget must be non-negative',
      )
    })

    it('结束时间早于开始时间时抛出异常', () => {
      expect(() =>
        service.create(
          makeInput({
            startDate: '2026-09-30T00:00:00Z',
            endDate: '2026-07-01T00:00:00Z',
          }),
        ),
      ).toThrow('End date must be after start date')
    })

    it('开始和结束时间相等时抛出异常', () => {
      const same = '2026-07-01T00:00:00Z'
      expect(() =>
        service.create(makeInput({ startDate: same, endDate: same })),
      ).toThrow('End date must be after start date')
    })

    it('不同租户之间数据隔离', () => {
      const p1 = service.create(makeInput({ tenantContext: makeCtx('tenant-1'), name: '项目A' }))
      const p2 = service.create(makeInput({ tenantContext: makeCtx('tenant-2'), name: '项目B' }))
      expect(p1.projectId).not.toBe(p2.projectId)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // findById
  // ═══════════════════════════════════════════════════════════════

  describe('findById', () => {
    it('根据 ID 查找到已存在的项目', () => {
      const created = service.create(makeInput())
      const found = service.findById(created.projectId, 'tenant-1')
      expect(found).toBeDefined()
      expect(found!.projectId).toBe(created.projectId)
    })

    it('项目不存在时返回 undefined', () => {
      const found = service.findById('collab-nonexistent', 'tenant-1')
      expect(found).toBeUndefined()
    })

    it('不同租户不能跨租户查询', () => {
      const created = service.create(makeInput({ tenantContext: makeCtx('tenant-1') }))
      const found = service.findById(created.projectId, 'tenant-2')
      expect(found).toBeUndefined()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // findAll
  // ═══════════════════════════════════════════════════════════════

  describe('findAll', () => {
    it('返回租户的所有项目（无过滤）', () => {
      service.create(makeInput({ name: '项目1' }))
      service.create(makeInput({ name: '项目2' }))
      const projects = service.findAll('tenant-1')
      expect(projects.length).toBe(2)
    })

    it('不同租户的数据互不干扰', () => {
      service.create(makeInput({ tenantContext: makeCtx('tenant-1'), name: '项目A' }))
      service.create(makeInput({ tenantContext: makeCtx('tenant-2'), name: '项目B' }))
      expect(service.findAll('tenant-1').length).toBe(1)
      expect(service.findAll('tenant-2').length).toBe(1)
    })

    it('没有项目时返回空数组', () => {
      expect(service.findAll('tenant-1')).toEqual([])
    })

    it('按状态过滤', () => {
      const p = service.create(makeInput())
      // 更新为 ACTIVE 后过滤
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Negotiating })

      const draftProjects = service.findAll('tenant-1', { status: CollabStatus.Draft })
      expect(draftProjects.length).toBe(0)

      const negotiatingProjects = service.findAll('tenant-1', { status: CollabStatus.Negotiating })
      expect(negotiatingProjects.length).toBe(1)
    })

    it('按品牌 ID 过滤', () => {
      service.create(makeInput({ brandId: 'brand-1', name: '项目1' }))
      service.create(makeInput({ brandId: 'brand-2', name: '项目2' }))

      expect(service.findAll('tenant-1', { brandId: 'brand-1' }).length).toBe(1)
      expect(service.findAll('tenant-1', { brandId: 'brand-none' }).length).toBe(0)
    })

    it('按名称模糊搜索', () => {
      service.create(makeInput({ name: '可口可乐联名' }))
      service.create(makeInput({ name: '百事可乐联名' }))
      service.create(makeInput({ name: '星巴克活动' }))

      expect(service.findAll('tenant-1', { name: '可乐' }).length).toBe(2)
      expect(service.findAll('tenant-1', { name: '星巴克' }).length).toBe(1)
    })

    it('结果按创建时间降序排列', () => {
      const p1 = service.create(makeInput({ name: '最早' }))
      const p2 = service.create(makeInput({ name: '中间' }))
      const p3 = service.create(makeInput({ name: '最晚' }))

      const results = service.findAll('tenant-1')
      expect(results[0].name).toBe('最晚')
      expect(results[1].name).toBe('中间')
      expect(results[2].name).toBe('最早')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // update
  // ═══════════════════════════════════════════════════════════════

  describe('update', () => {
    it('更新项目名称', () => {
      const p = service.create(makeInput())
      const updated = service.update(p.projectId, 'tenant-1', { name: '新名称' })
      expect(updated.name).toBe('新名称')
    })

    it('更新分润比例', () => {
      const p = service.create(makeInput({ revenueShareRate: 30 }))
      const updated = service.update(p.projectId, 'tenant-1', { revenueShareRate: 50 })
      expect(updated.revenueShareRate).toBe(50)
    })

    it('更新分润比例超范围时抛出异常', () => {
      const p = service.create(makeInput())
      expect(() =>
        service.update(p.projectId, 'tenant-1', { revenueShareRate: 150 }),
      ).toThrow('Revenue share rate must be between 0 and 100')
    })

    it('更新预算为负值时抛出异常', () => {
      const p = service.create(makeInput())
      expect(() =>
        service.update(p.projectId, 'tenant-1', { budget: -1 }),
      ).toThrow('Budget must be non-negative')
    })

    it('Draft → NEGOTIATING 合法转换', () => {
      const p = service.create(makeInput())
      const updated = service.update(p.projectId, 'tenant-1', { status: CollabStatus.Negotiating })
      expect(updated.status).toBe(CollabStatus.Negotiating)
    })

    it('Draft → ACTIVE 不合法转换抛异常', () => {
      const p = service.create(makeInput())
      expect(() =>
        service.update(p.projectId, 'tenant-1', { status: CollabStatus.Active }),
      ).toThrow('Invalid collab status transition')
    })

    it('COMPLETED → 任何状态都不合法', () => {
      const p = service.create(makeInput())
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Negotiating })
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Active })
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Completed })
      expect(() =>
        service.update(p.projectId, 'tenant-1', { status: CollabStatus.Active }),
      ).toThrow('Invalid collab status transition')
    })

    it('ACTIVE → PAUSED → ACTIVE 来回切换合法', () => {
      const p = service.create(makeInput())
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Negotiating })
      service.update(p.projectId, 'tenant-1', { status: CollabStatus.Active })
      const paused = service.update(p.projectId, 'tenant-1', { status: CollabStatus.Paused })
      expect(paused.status).toBe(CollabStatus.Paused)
      const resumed = service.update(p.projectId, 'tenant-1', { status: CollabStatus.Active })
      expect(resumed.status).toBe(CollabStatus.Active)
    })

    it('不存在的项目更新抛异常', () => {
      expect(() =>
        service.update('collab-nonexistent', 'tenant-1', { name: 'test' }),
      ).toThrow('Collab project not found')
    })

    it('跨租户更新抛异常', () => {
      const p = service.create(makeInput({ tenantContext: makeCtx('tenant-1') }))
      expect(() =>
        service.update(p.projectId, 'tenant-2', { name: 'cross-tenant' }),
      ).toThrow('Collab project not found')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // delete
  // ═══════════════════════════════════════════════════════════════

  describe('delete', () => {
    it('删除已存在的项目，后续查询不到', () => {
      const p = service.create(makeInput())
      service.delete(p.projectId, 'tenant-1')
      expect(service.findById(p.projectId, 'tenant-1')).toBeUndefined()
    })

    it('删除不存在的项目抛异常', () => {
      expect(() => service.delete('collab-nonexistent', 'tenant-1')).toThrow(
        'Collab project not found',
      )
    })

    it('跨租户删除抛异常', () => {
      const p = service.create(makeInput({ tenantContext: makeCtx('tenant-1') }))
      expect(() => service.delete(p.projectId, 'tenant-2')).toThrow('Collab project not found')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // countByStatus
  // ═══════════════════════════════════════════════════════════════

  describe('countByStatus', () => {
    it('没有项目时所有状态计数为 0', () => {
      const counts = service.countByStatus('tenant-1')
      for (const status of Object.values(CollabStatus)) {
        expect(counts[status]).toBe(0)
      }
    })

    it('正确统计各状态的项目数量', () => {
      service.create(makeInput({ name: '项目1' })) // Draft
      const p2 = service.create(makeInput({ name: '项目2' })) // Draft
      service.update(p2.projectId, 'tenant-1', { status: CollabStatus.Negotiating })

      const counts = service.countByStatus('tenant-1')
      expect(counts[CollabStatus.Draft]).toBe(1)
      expect(counts[CollabStatus.Negotiating]).toBe(1)
    })

    it('不同租户的统计互不干扰', () => {
      service.create(makeInput({ tenantContext: makeCtx('tenant-1'), name: '项目A' }))
      service.create(makeInput({ tenantContext: makeCtx('tenant-2'), name: '项目B' }))
      service.create(makeInput({ tenantContext: makeCtx('tenant-2'), name: '项目C' }))

      expect(service.countByStatus('tenant-1')[CollabStatus.Draft]).toBe(1)
      expect(service.countByStatus('tenant-2')[CollabStatus.Draft]).toBe(2)
    })
  })
})
