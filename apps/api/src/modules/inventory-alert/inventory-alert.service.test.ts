/**
 * inventory-alert.service.test.ts - 库存预警 Service 单元测试
 *
 * 覆盖: 正例 + 反例 + 边界（三件套）
 * 原则: 无 as any · 无 describe.skip · 无 it.only
 * 隔离: beforeEach 重置
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

  // ═════════════════════════════════════════════════════════════
  // list
  // ═════════════════════════════════════════════════════════════

  describe('list', () => {
    it('正例: 列出所有预警', () => {
      const result = service.list(TENANT_CONTEXT)
      expect(result.total).toBe(10)
      expect(result.items.length).toBe(10)
    })

    it('正例: 按 alertLevel 筛选', () => {
      const low = service.list(TENANT_CONTEXT, { alertLevel: AlertLevel.Low })
      expect(low.items.every(a => a.alertLevel === AlertLevel.Low)).toBe(true)
      expect(low.items.length).toBe(4)

      const critical = service.list(TENANT_CONTEXT, { alertLevel: AlertLevel.Critical })
      expect(critical.items.length).toBe(3)
    })

    it('正例: 按 status 筛选', () => {
      const pending = service.list(TENANT_CONTEXT, { status: AlertStatus.Pending })
      expect(pending.items.every(a => a.status === AlertStatus.Pending)).toBe(true)
    })

    it('正例: 按 keyword 搜索', () => {
      const result = service.list(TENANT_CONTEXT, { keyword: '牛奶' })
      expect(result.items.every(a => a.productName.includes('牛奶'))).toBe(true)
    })

    it('正例: limit 和 offset 分页', () => {
      const result = service.list(TENANT_CONTEXT, { limit: 3, offset: 0 })
      expect(result.items.length).toBe(3)
      expect(result.limit).toBe(3)
    })

    it('正例: offset 跳过前几条', () => {
      const page1 = service.list(TENANT_CONTEXT, { limit: 2, offset: 0 })
      const page2 = service.list(TENANT_CONTEXT, { limit: 2, offset: 2 })
      // 确保不同页没有重叠
      const ids1 = new Set(page1.items.map(i => i.id))
      const ids2 = new Set(page2.items.map(i => i.id))
      expect([...ids1].filter(id => ids2.has(id)).length).toBe(0)
    })

    it('反例: 不存在的 tenant 返回空', () => {
      const result = service.list({ tenantId: 'nonexistent' })
      expect(result.total).toBe(0)
      expect(result.items.length).toBe(0)
    })

    it('边界: keyword 无匹配', () => {
      const result = service.list(TENANT_CONTEXT, { keyword: '不存在商品xyz' })
      expect(result.total).toBe(0)
    })

    it('边界: offset 超出总数', () => {
      const result = service.list(TENANT_CONTEXT, { limit: 10, offset: 100 })
      expect(result.items.length).toBe(0)
    })
  })

  // ═════════════════════════════════════════════════════════════
  // getById
  // ═════════════════════════════════════════════════════════════

  describe('getById', () => {
    it('正例: 通过 ID 获取预警', () => {
      const alert = service.getById('alert-low-1', TENANT_CONTEXT)
      expect(alert.productName).toBe('矿泉水 500ml')
      expect(alert.alertLevel).toBe(AlertLevel.Low)
    })

    it('反例: 不存在的 ID 抛异常', () => {
      expect(() => service.getById('nonexistent', TENANT_CONTEXT)).toThrow()
    })
  })

  // ═════════════════════════════════════════════════════════════
  // getSummary
  // ═════════════════════════════════════════════════════════════

  describe('getSummary', () => {
    it('正例: 返回预警摘要统计', () => {
      const summary = service.getSummary(TENANT_CONTEXT)
      expect(summary.total).toBe(10)
      expect(summary.lowCount).toBe(4)
      expect(summary.criticalCount).toBe(3)
      expect(summary.overstockCount).toBe(3)
      expect(summary.pending).toBeGreaterThan(0)
    })
  })

  // ═════════════════════════════════════════════════════════════
  // create
  // ═════════════════════════════════════════════════════════════

  describe('create', () => {
    it('正例: 创建新预警，总数 +1', () => {
      const before = service.getSummary(TENANT_CONTEXT)
      service.create(TENANT_CONTEXT, { productId: 'prod-new', alertLevel: AlertLevel.Critical, message: '测试预警' })
      const after = service.getSummary(TENANT_CONTEXT)
      expect(after.total).toBe(before.total + 1)
    })
  })

  // ═════════════════════════════════════════════════════════════
  // checkAlertLevel
  // ═════════════════════════════════════════════════════════════

  describe('checkAlertLevel', () => {
    it('正例: 库存为 0 返回 Critical', () => {
      expect(service.checkAlertLevel(0, 30, 200)).toBe(AlertLevel.Critical)
    })

    it('正例: 库存低于 30% minStock 返回 Critical', () => {
      expect(service.checkAlertLevel(5, 30, 200)).toBe(AlertLevel.Critical)
    })

    it('正例: 库存低于 minStock 返回 Low', () => {
      expect(service.checkAlertLevel(20, 30, 200)).toBe(AlertLevel.Low)
    })

    it('正例: 库存超过 maxStock 返回 Overstock', () => {
      expect(service.checkAlertLevel(300, 30, 200)).toBe(AlertLevel.Overstock)
    })

    it('正例: 库存正常返回 null', () => {
      expect(service.checkAlertLevel(100, 30, 200)).toBeNull()
    })

    it('边界: 负库存返回 Critical', () => {
      expect(service.checkAlertLevel(-5, 30, 200)).toBe(AlertLevel.Critical)
    })

    it('边界: 库存等于 minStock 不触发（< 才触发）', () => {
      expect(service.checkAlertLevel(30, 30, 200)).toBeNull()
    })

    it('边界: 库存等于 maxStock 不触发（> 才触发）', () => {
      expect(service.checkAlertLevel(200, 30, 200)).toBeNull()
    })
  })
})
