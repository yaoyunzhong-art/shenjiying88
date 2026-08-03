/**
 * inventory-alert.service.spec.ts — 库存预警 Service 单元测试 (V23)
 *
 * 覆盖: list / getById / getSummary / create / checkAlertLevel
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { InventoryAlertService, resetInventoryAlertTestState } from './inventory-alert.service'
import { AlertLevel, AlertStatus } from './inventory-alert.entity'

const TENANT_CONTEXT = { tenantId: 'default' }

describe('InventoryAlertService', () => {
  let service: InventoryAlertService

  beforeEach(() => {
    resetInventoryAlertTestState()
    service = new InventoryAlertService()
  })

  // ════════════════════════════════════════════
  // list
  // ════════════════════════════════════════════

  describe('list', () => {
    it('正例: 列出所有预警', () => {
      const result = service.list(TENANT_CONTEXT)
      expect(result.total).toBe(10)
      expect(result.items.length).toBe(10)
    })

    it('正例: 按 alertLevel 筛选', () => {
      const low = service.list(TENANT_CONTEXT, { alertLevel: AlertLevel.Low })
      expect(low.items.every(a => a.alertLevel === AlertLevel.Low)).toBe(true)
    })

    it('正例: 按 status 筛选', () => {
      const pending = service.list(TENANT_CONTEXT, { status: AlertStatus.Pending })
      expect(pending.items.every(a => a.status === AlertStatus.Pending)).toBe(true)
    })

    it('正例: 按 keyword 搜索', () => {
      const result = service.list(TENANT_CONTEXT, { keyword: '牛奶' })
      expect(result.items.every(a => a.productName.includes('牛奶'))).toBe(true)
    })

    it('反例: 不存在的 tenant 返回空', () => {
      const result = service.list({ tenantId: 'nonexistent' })
      expect(result.total).toBe(0)
    })

    it('边界: keyword 无匹配', () => {
      const result = service.list(TENANT_CONTEXT, { keyword: '不存在商品xyz' })
      expect(result.total).toBe(0)
    })
  })

  // ════════════════════════════════════════════
  // getById
  // ════════════════════════════════════════════

  describe('getById', () => {
    it('正例: 按ID查找', () => {
      const alert = service.getById('alert-low-1', TENANT_CONTEXT)
      expect(alert.sku).toBe('WATER-500')
    })

    it('反例: 不存在的ID抛异常', () => {
      expect(() => service.getById('nonexist', TENANT_CONTEXT)).toThrow('not found')
    })
  })

  // ════════════════════════════════════════════
  // getSummary
  // ════════════════════════════════════════════

  describe('getSummary', () => {
    it('正例: 返回汇总统计', () => {
      const summary = service.getSummary(TENANT_CONTEXT)
      expect(summary.total).toBe(10)
      expect(summary.lowCount).toBe(4)
      expect(summary.criticalCount).toBe(3)
      expect(summary.overstockCount).toBe(3)
      expect(summary.pending + summary.resolvedCount + summary.ignoredCount).toBe(summary.total)
    })
  })

  // ════════════════════════════════════════════
  // create
  // ════════════════════════════════════════════

  describe('create', () => {
    it('正例: 创建预警', () => {
      const alert = service.create(TENANT_CONTEXT, {
        alertLevel: AlertLevel.Critical,
        message: '测试预警: 库存不足',
        productId: 'prod-test',
      })
      expect(alert.id).toBeTruthy()
      expect(alert.status).toBe(AlertStatus.Pending)
      expect(alert.alertLevel).toBe(AlertLevel.Critical)
    })
  })

  // ════════════════════════════════════════════
  // checkAlertLevel
  // ════════════════════════════════════════════

  describe('checkAlertLevel', () => {
    it('正例: 库存为0返回Critical', () => {
      expect(service.checkAlertLevel(0, 20, 100)).toBe(AlertLevel.Critical)
    })

    it('正例: 库存低于30%安全库存返回Critical', () => {
      expect(service.checkAlertLevel(5, 20, 100)).toBe(AlertLevel.Critical)
    })

    it('正例: 库存低于安全库存返回Low', () => {
      expect(service.checkAlertLevel(15, 20, 100)).toBe(AlertLevel.Low)
    })

    it('正例: 库存超过最大库存返回Overstock', () => {
      expect(service.checkAlertLevel(150, 20, 100)).toBe(AlertLevel.Overstock)
    })

    it('正例: 正常库存返回null', () => {
      expect(service.checkAlertLevel(50, 20, 100)).toBeNull()
    })

    it('边界: 刚好等于minStock不触发预警', () => {
      expect(service.checkAlertLevel(20, 20, 100)).toBeNull()
    })
  })
})
