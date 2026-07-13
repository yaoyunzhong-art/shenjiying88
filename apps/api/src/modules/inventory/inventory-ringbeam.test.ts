/**
 * 🏗️ P-37 库存模块圈梁测试
 * PRD-008 驱动 · 5个AC验收卡
 *
 * AC-37-01 创建商品 → 品类"饮品"，库存=0
 * AC-37-02 入库+100 → 库存从0→100
 * AC-37-03 销售扣减 → 库存100, 卖出2 → 库存98
 * AC-37-04 库存不足 → 库存1, 卖出2 → 提示"库存不足，仅剩1"
 * AC-37-05 预警标记 → 下限5, 库存3 → 标记"需补货"
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  ProductStatus,
  StockRecordType,
} from './inventory.entity'
import { InventoryService, resetInventoryServiceTestState } from './inventory.service'

const tenantCtx = {
  tenantId: 'tenant-p37',
  brandId: 'brand-p37',
  storeId: 'store-p37',
}

describe('P-37 圈梁: PRD-008 库存采购 AC', () => {
  let svc: InventoryService

  beforeEach(() => {
    resetInventoryServiceTestState()
    svc = new InventoryService()
  })

  // ─── AC-37-01: 创建商品 ───────────────────────────────
  it('AC-37-01 创建商品: 品类"饮品" → 创建成功, 库存=0', () => {
    const product = svc.createProduct(tenantCtx, {
      name: '冰红茶',
      sku: 'SKU-ICEDTEA',
      unit: '瓶',
      price: 300,   // 3元
      cost: 150,    // 1.5元
      minStock: 10,
      maxStock: 200,
      currentStock: 0,
      category: '饮品',
    })

    expect(product.id).toMatch(/^prod-/)
    expect(product.name).toBe('冰红茶')
    expect(product.category).toBe('饮品')
    expect(product.currentStock).toBe(0)
    expect(product.sku).toBe('SKU-ICEDTEA')
    expect(product.status).toBe(ProductStatus.Active)
  })

  // ─── AC-37-02: 入库+100 ───────────────────────────────
  it('AC-37-02 入库+100: 库存从0→100', () => {
    const product = svc.createProduct(tenantCtx, {
      name: '冰红茶',
      sku: 'SKU-ICEDTEA',
      unit: '瓶',
      price: 300,
      cost: 150,
      minStock: 10,
      maxStock: 200,
      currentStock: 0,
      category: '饮品',
    })

    const { product: updated, record } = svc.stockIn(tenantCtx, {
      productId: product.id,
      quantity: 100,
      reason: '采购入库',
    })

    expect(updated.currentStock).toBe(100)
    expect(record.type).toBe(StockRecordType.Inbound)
    expect(record.quantity).toBe(100)
    expect(record.beforeStock).toBe(0)
    expect(record.afterStock).toBe(100)
  })

  // ─── AC-37-03: 销售扣减 ───────────────────────────────
  it('AC-37-03 销售扣减: 库存100, 卖出2 → 库存98', () => {
    const product = svc.createProduct(tenantCtx, {
      name: '冰红茶',
      sku: 'SKU-ICEDTEA',
      unit: '瓶',
      price: 300,
      cost: 150,
      minStock: 10,
      maxStock: 200,
      currentStock: 100,
      category: '饮品',
    })

    const { product: updated, record } = svc.stockOut(tenantCtx, {
      productId: product.id,
      quantity: 2,
      reason: '销售出库',
    })

    expect(updated.currentStock).toBe(98)
    expect(record.type).toBe(StockRecordType.Outbound)
    expect(record.quantity).toBe(2)
    expect(record.beforeStock).toBe(100)
    expect(record.afterStock).toBe(98)
  })

  // ─── AC-37-04: 库存不足 ───────────────────────────────
  it('AC-37-04 库存不足: 库存1, 卖出2 → 提示"库存不足", 库存不变', () => {
    const product = svc.createProduct(tenantCtx, {
      name: '冰红茶',
      sku: 'SKU-ICEDTEA',
      unit: '瓶',
      price: 300,
      cost: 150,
      minStock: 10,
      maxStock: 200,
      currentStock: 1,
      category: '饮品',
    })

    expect(() => {
      svc.stockOut(tenantCtx, {
        productId: product.id,
        quantity: 2,
        reason: '销售出库',
      })
    }).toThrow(/Insufficient stock/)

    // 库存不变
    const pAfter = svc.getProduct(product.id, tenantCtx)
    expect(pAfter.currentStock).toBe(1)
  })

  // ─── AC-37-05: 预警标记 ───────────────────────────────
  it('AC-37-05 预警标记: 下限5, 库存3 → 标记"需补货"(low)', () => {
    const product = svc.createProduct(tenantCtx, {
      name: '冰红茶',
      sku: 'SKU-ICEDTEA',
      unit: '瓶',
      price: 300,
      cost: 150,
      minStock: 5,     // 预警下限=5
      maxStock: 200,
      currentStock: 3,  // 当前库存=3 < 下限5
      category: '饮品',
    })

    const alerts = svc.getLowStockProducts(tenantCtx)

    expect(alerts.length).toBeGreaterThanOrEqual(1)
    const alert = alerts.find((a) => a.product.id === product.id)
    expect(alert).toBeDefined()
    expect(alert!.currentStock).toBe(3)
    expect(alert!.minStock).toBe(5)
    expect(alert!.status).toBe('low')
  })
})
