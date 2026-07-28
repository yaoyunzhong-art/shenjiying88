/**
 * collab.service.spec.ts — 联名项目服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - create / findById / findAll
 *   - update / delete
 *   - countByStatus
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CollabService } from './collab.service'
import { CollabStatus } from './collab.entity'

describe('CollabService', () => {
  let service: CollabService

  beforeEach(() => {
    service = new CollabService()
    CollabService._resetStoreForTest()
  })

  const tenantCtx = () => ({ tenantId: 't1', userId: 'admin', roles: ['admin'] })
  const baseInput = () => ({
    tenantContext: tenantCtx(),
    name: '联名活动',
    brandId: 'b1',
    brandName: '测试品牌',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    revenueShareRate: 30,
    budget: 100000,
    description: '联名合作测试',
  })

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('正例: 创建联名项目应返回 Draft 状态', () => {
      const project = service.create(baseInput())
      expect(project.projectId).toMatch(/^collab-/)
      expect(project.status).toBe(CollabStatus.Draft)
      expect(project.name).toBe('联名活动')
    })

    it('异常: revenueShareRate 越界应抛错', () => {
      expect(() => service.create({ ...baseInput(), revenueShareRate: 150 })).toThrow()
      expect(() => service.create({ ...baseInput(), revenueShareRate: -1 })).toThrow()
    })

    it('异常: budget 负数应抛错', () => {
      expect(() => service.create({ ...baseInput(), budget: -100 })).toThrow()
    })

    it('异常: endDate 小于 startDate 应抛错', () => {
      expect(() => service.create({ ...baseInput(), startDate: '2026-09-01', endDate: '2026-08-01' })).toThrow()
    })
  })

  // ── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('正例: 按 ID 查找应返回项目', () => {
      const p = service.create(baseInput())
      const found = service.findById(p.projectId, 't1')
      expect(found).toBeTruthy()
      expect(found!.name).toBe('联名活动')
    })

    it('边缘: 跨租户应返回 undefined', () => {
      const p = service.create(baseInput())
      const found = service.findById(p.projectId, 't2')
      expect(found).toBeUndefined()
    })

    it('边缘: 不存在的 ID 应返回 undefined', () => {
      expect(service.findById('nonexistent', 't1')).toBeUndefined()
    })
  })

  // ── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('正例: 应返回租户下所有项目', () => {
      service.create(baseInput())
      service.create(baseInput())
      const list = service.findAll('t1')
      expect(list).toHaveLength(2)
    })

    it('正例: 支持按状态筛选', () => {
      service.create(baseInput())
      const list = service.findAll('t1', { status: CollabStatus.Draft })
      expect(list).toHaveLength(1)
    })
  })

  // ── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('正例: 更新项目名称和描述', () => {
      const p = service.create(baseInput())
      const updated = service.update(p.projectId, 't1', { name: '新名称', description: '新描述' })
      expect(updated.name).toBe('新名称')
      expect(updated.description).toBe('新描述')
    })

    it('异常: 不存的项目应抛错', () => {
      expect(() => service.update('nonexistent', 't1', { name: 'new' })).toThrow()
    })
  })

  // ── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('正例: 删除项目后不可查找', () => {
      const p = service.create(baseInput())
      service.delete(p.projectId, 't1')
      expect(service.findById(p.projectId, 't1')).toBeUndefined()
    })

    it('异常: 删除不存项目应抛错', () => {
      expect(() => service.delete('nonexistent', 't1')).toThrow()
    })
  })

  // ── countByStatus ────────────────────────────────────────────────────────

  describe('countByStatus', () => {
    it('正例: 应按状态统计项目数', () => {
      service.create(baseInput())
      const counts = service.countByStatus('t1')
      expect(counts[CollabStatus.Draft]).toBe(1)
      expect(counts[CollabStatus.Active]).toBe(0)
    })
  })
})
