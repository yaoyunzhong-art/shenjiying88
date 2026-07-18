/**
 * equipment-fault-report.service.test.ts - 设备故障报告 Service 单元测试
 *
 * 覆盖: 正例 + 反例 + 边界（三件套）
 * 原则: 无 as any · 无 describe.skip · 无 it.only
 * 隔离: beforeEach 重置
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EquipmentFaultReportService, resetEquipmentFaultReportTestState } from './equipment-fault-report.service'
import { FaultSeverity, FaultStatus } from './equipment-fault-report.entity'

const TENANT_CONTEXT = { tenantId: 'default' }

describe('EquipmentFaultReportService', () => {
  let service: EquipmentFaultReportService

  beforeEach(() => {
    resetEquipmentFaultReportTestState()
    service = new EquipmentFaultReportService()
  })

  // ═════════════════════════════════════════════════════════════
  // list
  // ═════════════════════════════════════════════════════════════

  describe('list', () => {
    it('正例: 列出所有故障报告', () => {
      const result = service.list(TENANT_CONTEXT)
      expect(result.total).toBe(8)
      expect(result.items.length).toBe(8)
    })

    it('正例: 按 severity 筛选', () => {
      const minor = service.list(TENANT_CONTEXT, { severity: FaultSeverity.Minor })
      expect(minor.items.every(f => f.severity === FaultSeverity.Minor)).toBe(true)
      expect(minor.items.length).toBe(3)

      const critical = service.list(TENANT_CONTEXT, { severity: FaultSeverity.Critical })
      expect(critical.items.length).toBe(2)
    })

    it('正例: 按 status 筛选', () => {
      const pending = service.list(TENANT_CONTEXT, { status: FaultStatus.Pending })
      expect(pending.items.every(f => f.status === FaultStatus.Pending)).toBe(true)
    })

    it('正例: 按 equipmentType 筛选', () => {
      const result = service.list(TENANT_CONTEXT, { equipmentType: '制冷设备' })
      expect(result.items.every(f => f.equipmentType === '制冷设备')).toBe(true)
    })

    it('正例: 按 keyword 搜索', () => {
      const result = service.list(TENANT_CONTEXT, { keyword: '冷柜' })
      expect(result.items.every(f => f.equipmentName.includes('冷柜'))).toBe(true)
    })

    it('正例: limit 和 offset 分页', () => {
      const result = service.list(TENANT_CONTEXT, { limit: 3, offset: 0 })
      expect(result.items.length).toBe(3)
      expect(result.limit).toBe(3)
      expect(result.offset).toBe(0)
    })

    it('反例: 不存在的 tenant 返回空', () => {
      const result = service.list({ tenantId: 'nonexistent' })
      expect(result.total).toBe(0)
      expect(result.items.length).toBe(0)
    })

    it('边界: keyword 无匹配', () => {
      const result = service.list(TENANT_CONTEXT, { keyword: '不存在的设备abc' })
      expect(result.total).toBe(0)
    })
  })

  // ═════════════════════════════════════════════════════════════
  // getById
  // ═════════════════════════════════════════════════════════════

  describe('getById', () => {
    it('正例: 获取已存在的故障报告', () => {
      const fault = service.getById('fault-major-1', TENANT_CONTEXT)
      expect(fault.equipmentName).toBe('冷柜 D01')
      expect(fault.severity).toBe(FaultSeverity.Major)
    })

    it('反例: 不存在的 ID 抛异常', () => {
      expect(() => service.getById('nonexistent', TENANT_CONTEXT)).toThrow()
    })
  })

  // ═════════════════════════════════════════════════════════════
  // getSummary
  // ═════════════════════════════════════════════════════════════

  describe('getSummary', () => {
    it('正例: 返回故障报告摘要', () => {
      const summary = service.getSummary(TENANT_CONTEXT)
      expect(summary.total).toBe(8)
      expect(summary.minorCount).toBe(3)
      expect(summary.majorCount).toBe(3)
      expect(summary.criticalCount).toBe(2)
      expect(summary.pending).toBeGreaterThan(0)
      expect(summary.inProgress).toBeGreaterThan(0)
      expect(summary.resolved).toBeGreaterThan(0)
    })

    it('正例: byEquipmentType 包含设备类型分布', () => {
      const summary = service.getSummary(TENANT_CONTEXT)
      expect(Object.keys(summary.byEquipmentType).length).toBeGreaterThanOrEqual(7)
    })
  })

  // ═════════════════════════════════════════════════════════════
  // create
  // ═════════════════════════════════════════════════════════════

  describe('create', () => {
    it('正例: 创建新故障报告，总数 +1', () => {
      const before = service.getSummary(TENANT_CONTEXT)
      service.create(TENANT_CONTEXT, {
        equipmentId: 'eq-999',
        equipmentName: '测试设备',
        equipmentType: '测试类型',
        faultDescription: '测试故障',
        severity: FaultSeverity.Minor,
        reporterName: '测试人',
        occurredAt: new Date().toISOString(),
      })
      const after = service.getSummary(TENANT_CONTEXT)
      expect(after.total).toBe(before.total + 1)
    })

    it('正例: 创建后可通过 ID 查到', () => {
      const created = service.create(TENANT_CONTEXT, {
        equipmentId: 'eq-999',
        equipmentName: '可查设备',
        equipmentType: '测试类型',
        faultDescription: '可查询',
        severity: FaultSeverity.Critical,
        reporterName: '测试人',
        occurredAt: new Date().toISOString(),
      })
      const found = service.getById(created.id, TENANT_CONTEXT)
      expect(found.equipmentName).toBe('可查设备')
    })
  })

  // ═════════════════════════════════════════════════════════════
  // delete
  // ═════════════════════════════════════════════════════════════

  describe('delete', () => {
    it('正例: 删除已存在的故障报告', () => {
      service.delete('fault-minor-1', TENANT_CONTEXT)
      expect(() => service.getById('fault-minor-1', TENANT_CONTEXT)).toThrow()
    })

    it('反例: 删除不存在的故障报告抛异常', () => {
      expect(() => service.delete('nonexistent', TENANT_CONTEXT)).toThrow()
    })
  })
})
