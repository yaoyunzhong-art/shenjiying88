/**
 * device-usage-report.service.spec.ts — 设备使用报告服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - list (无筛选 / 按门店 / 按类型 / 按日期)
 *   - getById (存在/不存在)
 *   - getSummary (正常/空数据)
 *   - create
 *   - delete (存在/不存在)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DeviceUsageReportService } from './device-usage-report.service'
import { DeviceType } from './device-usage-report.entity'

describe('DeviceUsageReportService', () => {
  let service: DeviceUsageReportService

  beforeEach(() => {
    service = new DeviceUsageReportService()
  })

  const ctx = () => ({ tenantId: 'default', userId: 'test', roles: ['admin'] })

  // ── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('正例: 无筛选应返回所有种子数据', () => {
      const result = service.list(ctx())
      expect(result.total).toBe(8)
    })

    it('正例: 按门店筛选', () => {
      const result = service.list(ctx(), { storeId: 'store-001' })
      expect(result.items.every(r => r.storeId === 'store-001')).toBe(true)
    })

    it('正例: 按设备类型筛选', () => {
      const result = service.list(ctx(), { deviceType: DeviceType.Racing })
      result.items.forEach(r => expect(r.deviceType).toBe(DeviceType.Racing))
    })

    it('边缘: 无匹配应返回 total=0', () => {
      const result = service.list(ctx(), { storeId: 'nonexistent' })
      expect(result.total).toBe(0)
    })
  })

  // ── getById ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('正例: 按 ID 获取应返回记录', () => {
      const r = service.getById('dev-usage-001', ctx())
      expect(r.deviceName).toBe('街机-拳皇97')
    })

    it('异常: 不存在的 ID 应抛错', () => {
      expect(() => service.getById('nonexistent', ctx())).toThrow()
    })
  })

  // ── getSummary ───────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('正例: 应返回汇总统计', () => {
      const s = service.getSummary(ctx())
      expect(s.totalDevices).toBe(8)
      expect(s.avgUsageRate).toBeGreaterThan(0)
      expect(s.avgIdleRate).toBeGreaterThan(0)
      expect(s.peakDeviceType).toBeTruthy()
      expect(s.lowestUsageDevice).toBeTruthy()
      expect(s.totalDailyRevenue).toBeGreaterThan(0)
    })

    it('边缘: 空租户应返回零值', () => {
      const emptyCtx = () => ({ tenantId: 'empty', userId: 't', roles: ['admin'] })
      const s = service.getSummary(emptyCtx())
      expect(s.totalDevices).toBe(0)
      expect(s.avgUsageRate).toBe(0)
      expect(s.lowestUsageDevice).toBe('')
    })
  })

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('正例: 创建新设备使用报告', () => {
      const r = service.create(ctx(), {
        deviceId: 'dev-new-01', deviceName: '新设备', deviceType: DeviceType.Arcade,
        storeId: 'store-001', usageRate: 90, idleRate: 5, maintenanceRate: 5,
        peakHours: '14:00-17:00', avgSessionMinutes: 30, dailyRevenue: 2000,
        date: '2026-07-20',
      })
      expect(r.id).toMatch(/^dev-usage-/)
      expect(r.usageRate).toBe(90)
    })
  })

  // ── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('正例: 删除已存在的记录', () => {
      service.delete('dev-usage-001', ctx())
      expect(() => service.getById('dev-usage-001', ctx())).toThrow()
    })

    it('异常: 删除不存在的记录应抛错', () => {
      expect(() => service.delete('nonexistent', ctx())).toThrow()
    })
  })
})
