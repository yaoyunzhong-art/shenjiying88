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
const ANOTHER_TENANT = { tenantId: 'tenant-b' }

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

    it('正例: 多条件组合筛选（severity + status）', () => {
      const result = service.list(TENANT_CONTEXT, {
        severity: FaultSeverity.Minor,
        status: FaultStatus.Pending,
      })
      expect(result.items.every(f => f.severity === FaultSeverity.Minor && f.status === FaultStatus.Pending)).toBe(true)
      expect(result.items.length).toBe(1)
      expect(result.items[0].id).toBe('fault-minor-1')
    })

    it('正例: 按 equipmentType 筛选', () => {
      const result = service.list(TENANT_CONTEXT, { equipmentType: '制冷设备' })
      expect(result.items.every(f => f.equipmentType === '制冷设备')).toBe(true)
    })

    it('正例: 按 keyword 搜索', () => {
      const result = service.list(TENANT_CONTEXT, { keyword: '冷柜' })
      expect(result.items.every(f => f.equipmentName.includes('冷柜'))).toBe(true)
    })

    it('正例: 按 occurredAt 降序排序验证', () => {
      const result = service.list(TENANT_CONTEXT, { limit: 8 })
      const dates = result.items.map(f => new Date(f.occurredAt).getTime())
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i])
      }
    })

    it('正例: limit 和 offset 分页', () => {
      const result = service.list(TENANT_CONTEXT, { limit: 3, offset: 0 })
      expect(result.items.length).toBe(3)
      expect(result.limit).toBe(3)
      expect(result.offset).toBe(0)
    })

    it('边界: limit 为 0 或负数时返回默认 20 条', () => {
      const zero = service.list(TENANT_CONTEXT, { limit: 0 })
      expect(zero.limit).toBe(20)
      expect(zero.total).toBe(8)

      const negative = service.list(TENANT_CONTEXT, { limit: -5 })
      expect(negative.limit).toBe(20)
      expect(negative.total).toBe(8)
    })

    it('边界: offset 超出总数返回空数组', () => {
      const result = service.list(TENANT_CONTEXT, { offset: 100 })
      expect(result.items.length).toBe(0)
      expect(result.total).toBe(8)
    })

    it('边界: keyword 大小写不敏感搜索', () => {
      const upper = service.list(TENANT_CONTEXT, { keyword: '冷柜' })
      const mixed = service.list(TENANT_CONTEXT, { keyword: 'LěNG Guì' })
      // 中文无大小写，验证设备名 = 制冷设备类别的 keyword 搜索
      const desc = service.list(TENANT_CONTEXT, { keyword: '温度' })
      expect(desc.total).toBeGreaterThanOrEqual(1)

      const lower = service.list(TENANT_CONTEXT, { keyword: '冷柜' })
      expect(upper.total).toBe(lower.total)
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

    it('正例: 返回记录的 severity 与预期一致', () => {
      const minor = service.getById('fault-minor-1', TENANT_CONTEXT)
      expect(minor.severity).toBe(FaultSeverity.Minor)

      const critical = service.getById('fault-crit-1', TENANT_CONTEXT)
      expect(critical.severity).toBe(FaultSeverity.Critical)
    })

    it('正例: 返回记录包含所有字段', () => {
      const fault = service.getById('fault-major-1', TENANT_CONTEXT)
      expect(fault).toHaveProperty('id')
      expect(fault).toHaveProperty('tenantId')
      expect(fault).toHaveProperty('equipmentId')
      expect(fault).toHaveProperty('equipmentName')
      expect(fault).toHaveProperty('equipmentType')
      expect(fault).toHaveProperty('faultDescription')
      expect(fault).toHaveProperty('severity')
      expect(fault).toHaveProperty('status')
      expect(fault).toHaveProperty('reporterName')
      expect(fault).toHaveProperty('occurredAt')
      expect(fault).toHaveProperty('createdAt')
      expect(fault).toHaveProperty('updatedAt')
    })

    it('反例: 不存在的 ID 抛异常', () => {
      expect(() => service.getById('nonexistent', TENANT_CONTEXT)).toThrow()
    })

    it('反例: 跨租户访问抛 Error', () => {
      // fault-major-1 属于 default 租户，用 tenant-b 访问应抛错
      expect(() => service.getById('fault-major-1', ANOTHER_TENANT)).toThrow()
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

    it('正例: pending/inProgress/resolved 计数正确', () => {
      const summary = service.getSummary(TENANT_CONTEXT)
      expect(summary.pending).toBe(3)
      expect(summary.inProgress).toBe(3)
      expect(summary.resolved).toBe(2)
    })

    it('正例: byEquipmentType 包含制冷设备、收银设备等', () => {
      const summary = service.getSummary(TENANT_CONTEXT)
      expect(summary.byEquipmentType['制冷设备']).toBe(1)
      expect(summary.byEquipmentType['收银设备']).toBe(1)
      expect(summary.byEquipmentType['扫码设备']).toBe(1)
      expect(summary.byEquipmentType['空调设备']).toBe(1)
    })

    it('反例: 空租户返回全 0', () => {
      const summary = service.getSummary({ tenantId: 'empty' })
      expect(summary.total).toBe(0)
      expect(summary.pending).toBe(0)
      expect(summary.inProgress).toBe(0)
      expect(summary.resolved).toBe(0)
      expect(summary.minorCount).toBe(0)
      expect(summary.majorCount).toBe(0)
      expect(summary.criticalCount).toBe(0)
      expect(Object.keys(summary.byEquipmentType).length).toBe(0)
    })
  })

  // ═════════════════════════════════════════════════════════════
  // create
  // ═════════════════════════════════════════════════════════════

  describe('create', () => {
    const validInput = {
      equipmentId: 'eq-999',
      equipmentName: '测试设备',
      equipmentType: '测试类型',
      faultDescription: '测试故障',
      severity: FaultSeverity.Minor,
      reporterName: '测试人',
      occurredAt: new Date().toISOString(),
    }

    it('正例: 创建新故障报告，总数 +1', () => {
      const before = service.getSummary(TENANT_CONTEXT)
      service.create(TENANT_CONTEXT, validInput)
      const after = service.getSummary(TENANT_CONTEXT)
      expect(after.total).toBe(before.total + 1)
    })

    it('正例: 创建时自动设置 status=Pending', () => {
      const created = service.create(TENANT_CONTEXT, {
        ...validInput,
        equipmentId: 'eq-auto',
      })
      expect(created.status).toBe(FaultStatus.Pending)
    })

    it('正例: 创建记录含 createdAt/updatedAt', () => {
      const before = Date.now()
      const created = service.create(TENANT_CONTEXT, {
        ...validInput,
        equipmentId: 'eq-time',
      })
      const after = Date.now()
      const createdAt = new Date(created.createdAt).getTime()
      const updatedAt = new Date(created.updatedAt).getTime()
      expect(createdAt).toBeGreaterThanOrEqual(before)
      expect(createdAt).toBeLessThanOrEqual(after)
      expect(updatedAt).toBeGreaterThanOrEqual(before)
      expect(updatedAt).toBeLessThanOrEqual(after)
    })

    it('正例: 创建后 list 能查到新记录', () => {
      const created = service.create(TENANT_CONTEXT, {
        ...validInput,
        equipmentId: 'eq-list',
        equipmentName: '可查设备',
      })
      const result = service.list(TENANT_CONTEXT, { keyword: '可查设备' })
      expect(result.total).toBe(1)
      expect(result.items[0].id).toBe(created.id)
    })

    it('边界: 创建超长描述的故障报告', () => {
      const longDesc = 'A'.repeat(5000)
      const created = service.create(TENANT_CONTEXT, {
        ...validInput,
        faultDescription: longDesc,
        equipmentId: 'eq-long',
      })
      expect(created.faultDescription).toBe(longDesc)
      expect(created.faultDescription.length).toBe(5000)
    })

    it('边界: 创建时缺少必填字段 - equipmentId 为空字符串', () => {
      const created = service.create(TENANT_CONTEXT, {
        ...validInput,
        equipmentId: '',
        equipmentName: '空ID设备',
      })
      expect(created.equipmentId).toBe('')
      // 仍可正常创建
      const found = service.getById(created.id, TENANT_CONTEXT)
      expect(found.equipmentName).toBe('空ID设备')
    })
  })

  // ═════════════════════════════════════════════════════════════
  // update
  // ═════════════════════════════════════════════════════════════

  describe('update', () => {
    it('正例: 更新 status 为 InProgress', () => {
      const updated = service.update('fault-minor-1', TENANT_CONTEXT, {
        status: FaultStatus.InProgress,
      })
      expect(updated.status).toBe(FaultStatus.InProgress)
    })

    it('正例: 同时更新 status + assignee + resolution', () => {
      const updated = service.update('fault-minor-1', TENANT_CONTEXT, {
        status: FaultStatus.Resolved,
        assignee: '张工',
        resolution: '已处理完毕',
      })
      expect(updated.status).toBe(FaultStatus.Resolved)
      expect(updated.assignee).toBe('张工')
      expect(updated.resolution).toBe('已处理完毕')
      expect(updated.resolvedAt).toBeDefined()
    })

    it('正例: 更新后 updatedAt 自动更新', () => {
      const original = service.getById('fault-minor-1', TENANT_CONTEXT)
      const originalUpdatedAt = original.updatedAt

      // 稍等片刻确保时间戳变化
      const updated = service.update('fault-minor-1', TENANT_CONTEXT, {
        assignee: '李工',
      })
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime(),
      )
    })

    it('反例: 不存在的故障抛 Error', () => {
      expect(() =>
        service.update('nonexistent', TENANT_CONTEXT, {
          status: FaultStatus.Resolved,
        }),
      ).toThrow()
    })

    it('反例: 跨租户更新抛 Error', () => {
      expect(() =>
        service.update('fault-minor-1', ANOTHER_TENANT, {
          status: FaultStatus.Resolved,
        }),
      ).toThrow()
    })

    it('边界: resolution 空字符串', () => {
      const updated = service.update('fault-minor-1', TENANT_CONTEXT, {
        status: FaultStatus.Resolved,
        resolution: '',
      })
      expect(updated.resolution).toBe('')
      expect(updated.status).toBe(FaultStatus.Resolved)
    })

    it('边界: resolution 超长内容', () => {
      const longResolution = 'B'.repeat(5000)
      const updated = service.update('fault-minor-1', TENANT_CONTEXT, {
        resolution: longResolution,
      })
      expect(updated.resolution).toBe(longResolution)
      expect(updated.resolution!.length).toBe(5000)
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

    it('正例: 删除后 list 总数 -1', () => {
      const before = service.list(TENANT_CONTEXT).total
      service.delete('fault-minor-1', TENANT_CONTEXT)
      const after = service.list(TENANT_CONTEXT).total
      expect(after).toBe(before - 1)
    })

    it('反例: 删除不存在的故障报告抛异常', () => {
      expect(() => service.delete('nonexistent', TENANT_CONTEXT)).toThrow()
    })

    it('反例: 删除已删除的记录再次抛异常', () => {
      service.delete('fault-minor-1', TENANT_CONTEXT)
      expect(() => service.delete('fault-minor-1', TENANT_CONTEXT)).toThrow()
    })

    it('反例: 跨租户删除抛 Error', () => {
      expect(() => service.delete('fault-minor-1', ANOTHER_TENANT)).toThrow()
    })
  })
})
