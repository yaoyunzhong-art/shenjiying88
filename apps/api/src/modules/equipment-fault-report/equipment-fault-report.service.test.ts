/**
 * equipment-fault-report.service.spec.ts — 设备故障报告服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - list (无筛选 / 按严重程度 / 按状态 / 按设备类型 / 关键词 / 分页)
 *   - getById (存在/不存在)
 *   - getSummary
 *   - create
 *   - update (状态/指派人/解决方案)
 *   - delete (存在/不存在)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EquipmentFaultReportService, resetEquipmentFaultReportTestState } from './equipment-fault-report.service'
import { FaultSeverity, FaultStatus } from './equipment-fault-report.entity'

describe('EquipmentFaultReportService', () => {
  let service: EquipmentFaultReportService

  beforeEach(() => {
    resetEquipmentFaultReportTestState()
    service = new EquipmentFaultReportService()
  })

  const ctx = () => ({ tenantId: 'default', userId: 'test', roles: ['admin'] })

  // ── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('正例: 无筛选应返回所有种子数据', () => {
      const result = service.list(ctx())
      expect(result.total).toBe(8)
      expect(result.items.length).toBe(8)
    })

    it('正例: 按严重程度筛选', () => {
      const result = service.list(ctx(), { severity: FaultSeverity.Critical })
      result.items.forEach(r => expect(r.severity).toBe(FaultSeverity.Critical))
    })

    it('正例: 按状态筛选', () => {
      const result = service.list(ctx(), { status: FaultStatus.Pending })
      result.items.forEach(r => expect(r.status).toBe(FaultStatus.Pending))
    })

    it('正例: 按设备类型筛选', () => {
      const result = service.list(ctx(), { equipmentType: '收银设备' })
      result.items.forEach(r => expect(r.equipmentType).toBe('收银设备'))
    })

    it('正例: 按关键词搜索', () => {
      const result = service.list(ctx(), { keyword: '冷柜' })
      expect(result.items.every(r => r.equipmentName.includes('冷柜') || r.faultDescription.includes('冷柜'))).toBe(true)
    })

    it('正例: 分页应正确截取', () => {
      const result = service.list(ctx(), { limit: 3, offset: 0 })
      expect(result.items.length).toBe(3)
      expect(result.total).toBe(8)
      expect(result.offset).toBe(0)
      expect(result.limit).toBe(3)
    })

    it('边缘: 无匹配应返回空', () => {
      const result = service.list(ctx(), { keyword: 'zzznoexist' })
      expect(result.total).toBe(0)
    })
  })

  // ── getById ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('正例: 按 ID 获取应返回记录', () => {
      const r = service.getById('fault-minor-1', ctx())
      expect(r.equipmentName).toBe('收银机 A01')
    })

    it('异常: 不存在的 ID 应抛错', () => {
      expect(() => service.getById('nonexistent', ctx())).toThrow()
    })
  })

  // ── getSummary ───────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('正例: 应返回汇总统计', () => {
      const s = service.getSummary(ctx())
      expect(s.total).toBe(8)
      expect(s.pending).toBeGreaterThan(0)
      expect(s.inProgress).toBeGreaterThan(0)
      expect(s.resolved).toBeGreaterThan(0)
      expect(s.minorCount).toBe(3)
      expect(s.majorCount).toBe(3)
      expect(s.criticalCount).toBe(2)
      expect(Object.keys(s.byEquipmentType).length).toBeGreaterThan(0)
    })
  })

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('正例: 创建新故障报告', () => {
      const r = service.create(ctx(), {
        equipmentId: 'eq-999', equipmentName: '新设备', equipmentType: '测试设备',
        faultDescription: '测试故障', severity: FaultSeverity.Minor,
        reporterName: '测试员', occurredAt: new Date().toISOString(),
      })
      expect(r.id).toMatch(/^fault-/)
      expect(r.status).toBe(FaultStatus.Pending)
    })
  })

  // ── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('正例: 更新状态和指派人', () => {
      const updated = service.update('fault-minor-1', ctx(), {
        status: FaultStatus.InProgress, assignee: '李工',
      })
      expect(updated.status).toBe(FaultStatus.InProgress)
      expect(updated.assignee).toBe('李工')
    })

    it('正例: 更新为 Resolved 应记录解决时间', () => {
      const updated = service.update('fault-minor-1', ctx(), {
        status: FaultStatus.Resolved, resolution: '已完成修复',
      })
      expect(updated.resolvedAt).toBeTruthy()
      expect(updated.resolution).toBe('已完成修复')
    })
  })

  // ── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('正例: 删除已存在的记录', () => {
      service.delete('fault-minor-1', ctx())
      expect(() => service.getById('fault-minor-1', ctx())).toThrow()
    })

    it('异常: 删除不存在的记录应抛错', () => {
      expect(() => service.delete('nonexistent', ctx())).toThrow()
    })
  })
})
