/**
 * equipment-fault-report.service.boost.test.ts - EquipmentFaultReportService 增强测试 (B路)
 *
 * 覆盖：list 查询（无过滤/severity/status/keyword）、getById（正常/不存在/跨租户）、
 * getSummary 统计汇总、create/update/delete、种子数据验证
 *
 * 总计: 15+ test cases
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EquipmentFaultReportService, resetEquipmentFaultReportTestState } from './equipment-fault-report.service'
import { FaultSeverity, FaultStatus } from './equipment-fault-report.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

const defaultTenant: RequestTenantContext = { tenantId: 'default' }
const otherTenant: RequestTenantContext = { tenantId: 'other-tenant' }

function createService(): EquipmentFaultReportService {
  // 每次创建前重置 store，确保测试隔离
  resetEquipmentFaultReportTestState()
  return new EquipmentFaultReportService()
}

function makeCreateInput(overrides?: Partial<{
  equipmentId: string
  equipmentName: string
  equipmentType: string
  faultDescription: string
  severity: FaultSeverity
  reporterName: string
  occurredAt: string
}>): Parameters<EquipmentFaultReportService['create']>[1] {
  return {
    equipmentId: overrides?.equipmentId ?? 'eq-test-001',
    equipmentName: overrides?.equipmentName ?? '测试设备',
    equipmentType: overrides?.equipmentType ?? '测试类型',
    faultDescription: overrides?.faultDescription ?? '测试故障描述',
    severity: overrides?.severity ?? FaultSeverity.Minor,
    reporterName: overrides?.reporterName ?? '测试报告人',
    occurredAt: overrides?.occurredAt ?? new Date().toISOString(),
  }
}

describe('EquipmentFaultReportService Boost Tests', () => {
  let svc: EquipmentFaultReportService

  beforeEach(() => {
    svc = createService()
  })

  // ─── 1. list 查询 ──────────────────────────────

  describe('list - 查询', () => {
    it('无过滤条件返回所有种子数据', () => {
      const result = svc.list(defaultTenant)
      expect(result.items.length).toBeGreaterThanOrEqual(8)
      expect(result.total).toBeGreaterThanOrEqual(8)
      expect(result.offset).toBe(0)
      expect(result.limit).toBe(20)
    })

    it('按 severity 过滤，只返回对应严重程度的故障', () => {
      const minor = svc.list(defaultTenant, { severity: FaultSeverity.Minor })
      expect(minor.items.every(f => f.severity === FaultSeverity.Minor)).toBe(true)
      expect(minor.total).toBeGreaterThanOrEqual(3)

      const critical = svc.list(defaultTenant, { severity: FaultSeverity.Critical })
      expect(critical.items.every(f => f.severity === FaultSeverity.Critical)).toBe(true)
      expect(critical.total).toBeGreaterThanOrEqual(2)
    })

    it('按 status 过滤', () => {
      const pending = svc.list(defaultTenant, { status: FaultStatus.Pending })
      expect(pending.items.every(f => f.status === FaultStatus.Pending)).toBe(true)
      expect(pending.total).toBeGreaterThanOrEqual(3)

      const resolved = svc.list(defaultTenant, { status: FaultStatus.Resolved })
      expect(resolved.items.every(f => f.status === FaultStatus.Resolved)).toBe(true)
      expect(resolved.total).toBeGreaterThanOrEqual(2)
    })

    it('按 keyword 搜索设备名称', () => {
      const result = svc.list(defaultTenant, { keyword: '收银' })
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.items.some(f => f.equipmentName.includes('收银'))).toBe(true)
    })

    it('按 keyword 搜索故障描述', () => {
      const result = svc.list(defaultTenant, { keyword: '打印模糊' })
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    it('按 keyword 搜索报告人', () => {
      const result = svc.list(defaultTenant, { keyword: '张明' })
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    it('keyword 不区分大小写', () => {
      // 故障描述中含有英文，验证大小写不敏感
      const result = svc.list(defaultTenant, { keyword: 'KG' })
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    it('keyword 无匹配时返回空列表', () => {
      const result = svc.list(defaultTenant, { keyword: '不存在的设备xxxx' })
      expect(result.items).toEqual([])
      expect(result.total).toBe(0)
    })

    it('按 equipmentType 过滤', () => {
      const result = svc.list(defaultTenant, { equipmentType: '收银设备' })
      expect(result.items.every(f => f.equipmentType === '收银设备')).toBe(true)
    })

    it('支持 offset 和 limit 分页', () => {
      const firstPage = svc.list(defaultTenant, { limit: 3, offset: 0 })
      expect(firstPage.items.length).toBeLessThanOrEqual(3)
      expect(firstPage.offset).toBe(0)
      expect(firstPage.limit).toBe(3)

      const secondPage = svc.list(defaultTenant, { limit: 3, offset: 3 })
      expect(secondPage.offset).toBe(3)

      // 两页不重叠（无重复 id）
      const firstIds = new Set(firstPage.items.map(f => f.id))
      const secondIds = secondPage.items.map(f => f.id)
      expect(secondIds.some(id => firstIds.has(id))).toBe(false)
    })

    it('结果按 occurredAt 降序排列', () => {
      const result = svc.list(defaultTenant)
      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i - 1].occurredAt.localeCompare(result.items[i].occurredAt)).toBeGreaterThanOrEqual(0)
      }
    })

    it('多条件组合过滤', () => {
      const result = svc.list(defaultTenant, {
        severity: FaultSeverity.Major,
        status: FaultStatus.Pending,
      })
      expect(result.items.every(f => f.severity === FaultSeverity.Major && f.status === FaultStatus.Pending)).toBe(true)
    })
  })

  // ─── 2. getById ──────────────────────────────

  describe('getById - 获取单个故障', () => {
    it('正常获取存在的故障报告', () => {
      const fault = svc.getById('fault-minor-1', defaultTenant)
      expect(fault.id).toBe('fault-minor-1')
      expect(fault.equipmentName).toBeTruthy()
    })

    it('不存在的 ID 抛出 Error', () => {
      expect(() => svc.getById('non-existent', defaultTenant)).toThrow(/not found/)
    })

    it('跨租户隔离 - 其他租户无法访问默认租户的数据', () => {
      expect(() => svc.getById('fault-minor-1', otherTenant)).toThrow(/not found/)
    })
  })

  // ─── 3. getSummary 统计汇总 ─────────────────

  describe('getSummary - 统计汇总', () => {
    it('返回正确的统计字段和种子数据计数', () => {
      const summary = svc.getSummary(defaultTenant)
      expect(summary.total).toBeGreaterThanOrEqual(8)
      expect(summary.pending).toBeGreaterThanOrEqual(3)
      expect(summary.inProgress).toBeGreaterThanOrEqual(3)
      expect(summary.resolved).toBeGreaterThanOrEqual(2)
      expect(summary.minorCount).toBeGreaterThanOrEqual(3)
      expect(summary.majorCount).toBeGreaterThanOrEqual(3)
      expect(summary.criticalCount).toBeGreaterThanOrEqual(2)
    })

    it('byEquipmentType 包含所有设备类型', () => {
      const summary = svc.getSummary(defaultTenant)
      expect(Object.keys(summary.byEquipmentType).length).toBeGreaterThanOrEqual(5)
    })

    it('total = pending + inProgress + resolved', () => {
      const summary = svc.getSummary(defaultTenant)
      expect(summary.total).toBe(summary.pending + summary.inProgress + summary.resolved)
    })

    it('不同租户的统计隔离', () => {
      const defaultSummary = svc.getSummary(defaultTenant)
      const otherSummary = svc.getSummary(otherTenant)
      expect(defaultSummary.total).toBeGreaterThan(0)
      expect(otherSummary.total).toBe(0)
    })
  })

  // ─── 4. create ─────────────────────────────

  describe('create - 创建故障', () => {
    it('创建故障成功，返回完整的故障报告', () => {
      const fault = svc.create(defaultTenant, makeCreateInput())
      expect(fault.id).toBeTruthy()
      expect(fault.id).toMatch(/^fault-/)
      expect(fault.tenantId).toBe('default')
      expect(fault.status).toBe(FaultStatus.Pending)
      expect(fault.severity).toBe(FaultSeverity.Minor)
      expect(fault.createdAt).toBeTruthy()
      expect(fault.updatedAt).toBeTruthy()
    })

    it('创建后可以通过 list 查到', () => {
      const fault = svc.create(defaultTenant, makeCreateInput({ equipmentName: '新建设备' }))
      const result = svc.list(defaultTenant, { keyword: '新建设备' })
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.items[0].id).toBe(fault.id)
    })

    it('为不同租户创建互不干扰', () => {
      svc.create(defaultTenant, makeCreateInput({ equipmentName: '默认租户设备' }))
      svc.create(otherTenant, makeCreateInput({ equipmentName: '其他租户设备' }))
      expect(svc.list(defaultTenant, { keyword: '默认租户' }).total).toBe(1)
      expect(svc.list(defaultTenant, { keyword: '其他租户' }).total).toBe(0)
      expect(svc.list(otherTenant, { keyword: '其他租户' }).total).toBe(1)
    })

    it('创建 Critical 严重程度的故障', () => {
      const fault = svc.create(defaultTenant, makeCreateInput({ severity: FaultSeverity.Critical }))
      expect(fault.severity).toBe(FaultSeverity.Critical)
    })
  })

  // ─── 5. update ─────────────────────────────

  describe('update - 更新故障', () => {
    it('更新故障状态为 InProgress', () => {
      const updated = svc.update('fault-minor-1', defaultTenant, { status: FaultStatus.InProgress })
      expect(updated.status).toBe(FaultStatus.InProgress)
      expect(updated.assignee).toBeUndefined()
    })

    it('更新故障状态为 Resolved 并记录解决时间', () => {
      const before = svc.getById('fault-minor-2', defaultTenant)
      expect(before.resolvedAt).toBeUndefined()

      const resolution = '已修复'
      const updated = svc.update('fault-minor-2', defaultTenant, {
        status: FaultStatus.Resolved,
        resolution,
      })
      expect(updated.status).toBe(FaultStatus.Resolved)
      expect(updated.resolution).toBe(resolution)
      expect(updated.resolvedAt).toBeTruthy()
    })

    it('更新指派人', () => {
      const updated = svc.update('fault-minor-1', defaultTenant, { assignee: '李工' })
      expect(updated.assignee).toBe('李工')
      // status 不变
      expect(updated.status).toBe(FaultStatus.Pending)
    })

    it('更新不存在的故障报错', () => {
      expect(() =>
        svc.update('non-existent', defaultTenant, { status: FaultStatus.Resolved }),
      ).toThrow(/not found/)
    })

    it('跨租户无法更新故障', () => {
      expect(() =>
        svc.update('fault-minor-1', otherTenant, { status: FaultStatus.Resolved }),
      ).toThrow(/not found/)
    })
  })

  // ─── 6. delete ─────────────────────────────

  describe('delete - 删除故障', () => {
    it('删除存在的故障', () => {
      expect(() => svc.delete('fault-crit-1', defaultTenant)).not.toThrow()
      expect(() => svc.getById('fault-crit-1', defaultTenant)).toThrow(/not found/)
    })

    it('删除不存在的故障报错', () => {
      expect(() => svc.delete('non-existent', defaultTenant)).toThrow(/not found/)
    })

    it('跨租户无法删除故障', () => {
      expect(() => svc.delete('fault-minor-1', otherTenant)).toThrow(/not found/)
      // 原租户数据不受影响
      expect(() => svc.getById('fault-minor-1', defaultTenant)).not.toThrow()
    })
  })

  // ─── 7. 初始种子数据验证 ──────────────────

  describe('种子数据验证', () => {
    it('种子数据包含所有 8 条故障', () => {
      const result = svc.list(defaultTenant)
      expect(result.total).toBe(8)
    })

    it('种子故障具有完整的必填字段', () => {
      const result = svc.list(defaultTenant)
      for (const f of result.items) {
        expect(f.id).toBeTruthy()
        expect(f.tenantId).toBe('default')
        expect(f.equipmentId).toBeTruthy()
        expect(f.equipmentName).toBeTruthy()
        expect(f.faultDescription).toBeTruthy()
        expect(f.severity).toBeTruthy()
        expect(f.status).toBeTruthy()
        expect(f.reporterName).toBeTruthy()
        expect(f.occurredAt).toBeTruthy()
        expect(f.createdAt).toBeTruthy()
        expect(f.updatedAt).toBeTruthy()
      }
    })

    it('种子数据中 resolved 故障有 resolution 和 resolvedAt', () => {
      const resolved = svc.list(defaultTenant, { status: FaultStatus.Resolved })
      for (const f of resolved.items) {
        expect(f.resolution).toBeTruthy()
        expect(f.resolvedAt).toBeTruthy()
      }
    })

    it('种子数据中 InProgress 故障有 assignee', () => {
      const inProgress = svc.list(defaultTenant, { status: FaultStatus.InProgress })
      for (const f of inProgress.items) {
        expect(f.assignee).toBeTruthy()
      }
    })
  })
})
