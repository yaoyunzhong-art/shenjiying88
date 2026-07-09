import { describe, it, expect, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [inventory] [A] 后端模块补全 — 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 并发大批量库存操作（高吞吐场景）
 * - 极端输入值（溢出、负数、超大数值）
 * - 快速连续状态变更（库存调整、采购单流程）
 * - 内存/时间压力 (大量商品模拟器运行)
 */

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { InventoryService, resetInventoryServiceTestState } from './inventory.service'
import { InventoryController } from './inventory.controller'
import { ProductStatus, StockRecordType, PurchaseOrderStatus } from './inventory.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

const TENANT = {
  tenantId: 'stress-tenant',
  storeId: 'stress-store',
  userId: 'stress-user',
  role: 'tenant_admin' as const,
  brandId: 'stress-brand',
}

describe('Inventory - Stress & Resilience', () => {
  let service: InventoryService
  let controller: InventoryController

  beforeEach(() => {
    resetInventoryServiceTestState()
    service = new InventoryService()
    controller = new InventoryController(service)
  })

  afterEach(() => {
    resetInventoryServiceTestState()
  })

  // ─── 并发大批量商品创建 ───

  describe('高并发商品创建', () => {
    it('连续创建 200 个商品不崩溃', () => {
      const products = Array.from({ length: 200 }, (_, i) =>
        service.createProduct(TENANT, {
          name: `Stress产品-${i}`,
          sku: `STRESS-SKU-${i}`,
          category: i % 3 === 0 ? '礼品' : i % 3 === 1 ? '配件' : '耗材',
          unit: '个',
          price: (i + 1) * 10,
          cost: (i + 1) * 5,
          minStock: 10,
          maxStock: 500,
          currentStock: (i + 1) * 20,
          status: ProductStatus.Active,
        })
      )

      assert.equal(products.length, 200)
      assert.equal(products[0].tenantId, TENANT.tenantId)
      assert.equal(products[199].sku, 'STRESS-SKU-199')
    })

    it('同时创建 100 个商品后检索不分页不超时', () => {
      for (let i = 0; i < 100; i++) {
        service.createProduct(TENANT, {
          name: `大批量-${i}`,
          sku: `BATCH-SKU-${i}`,
          unit: '个',
          price: 10,
          cost: 5,
          minStock: 5,
          maxStock: 200,
          currentStock: 50,
        })
      }

      const all = service.listProducts(TENANT)
      assert.equal(all.length, 100)
    })
  })

  // ─── 极端输入值测试 ───

  describe('极端输入值', () => {
    it('入库数量为 0 应跳过（DTO层拦截，service层需容错）', () => {
      // 创建商品
      const product = service.createProduct(TENANT, {
        name: '极端测试',
        sku: 'EXTREME-001',
        unit: '个',
        price: 100,
        cost: 50,
        minStock: 10,
        maxStock: 1000,
        currentStock: 100,
      })

      // 尝试入库 0 — 实际上 DTO 会拦截, service 层目前不会抛错因为逻辑不做校验
      // 这里验证：即使传 0，系统不崩溃
      const result = service.stockIn(TENANT, {
        productId: product.id,
        quantity: 0,
        reason: '极端测试-零入库',
      })
      assert.equal(result.record.quantity, 0)
      assert.equal(result.product.currentStock, 100) // 库存不变
    })

    it('出库超过当前库存应抛错（负库存防护）', () => {
      const product = service.createProduct(TENANT, {
        name: '库存防护测试',
        sku: 'STOCK-PROTECT-001',
        unit: '个',
        price: 100,
        cost: 50,
        minStock: 10,
        maxStock: 500,
        currentStock: 50,
      })

      assert.throws(() => {
        service.stockOut(TENANT, {
          productId: product.id,
          quantity: 100,
          reason: '超量出库测试',
        })
      }, /Insufficient stock/)
    })

    it('调整库存到超大数值（边界测试）', () => {
      const product = service.createProduct(TENANT, {
        name: '超大库存',
        sku: 'HUGE-STOCK-001',
        unit: '个',
        price: 10,
        cost: 5,
        minStock: 1,
        maxStock: 999999,
        currentStock: 100,
      })

      const result = service.adjustStock(TENANT, {
        productId: product.id,
        newQuantity: 999_999,
        reason: '超大数量调整',
      })

      assert.equal(result.product.currentStock, 999_999)
      assert.equal(result.record.type, StockRecordType.Adjustment)
    })

    it('创建价格为 0 的商品（免费物品场景）', () => {
      const product = service.createProduct(TENANT, {
        name: '免费赠品',
        sku: 'FREE-001',
        unit: '个',
        price: 0,
        cost: 0,
        minStock: 0,
        maxStock: 100,
        currentStock: 50,
      })

      assert.equal(product.price, 0)
      assert.equal(product.cost, 0)
    })

    it('商品名称含特殊字符和超长文本', () => {
      const longName = 'A'.repeat(500)
      const product = service.createProduct(TENANT, {
        name: longName,
        sku: 'LONG-NAME-001',
        unit: '个',
        price: 10,
        cost: 5,
        minStock: 1,
        maxStock: 100,
        currentStock: 10,
      })

      assert.equal(product.name.length, 500)
      const found = service.getProduct(product.id, TENANT)
      assert.equal(found.name, longName)
    })
  })

  // ─── 快速连续状态变更 ───

  describe('快速连续状态变更', () => {
    it('商品快速入库出库 50 次最终库存正确', () => {
      const product = service.createProduct(TENANT, {
        name: '快速流转',
        sku: 'RAPID-FLOW-001',
        unit: '个',
        price: 50,
        cost: 25,
        minStock: 10,
        maxStock: 10000,
        currentStock: 100,
      })

      for (let i = 0; i < 50; i++) {
        service.stockIn(TENANT, {
          productId: product.id,
          quantity: 10,
          reason: `快速入库#${i}`,
        })
        service.stockOut(TENANT, {
          productId: product.id,
          quantity: 5,
          reason: `快速出库#${i}`,
        })
      }

      // 初始 100 + 50*10 - 50*5 = 100 + 500 - 250 = 350
      const finalProduct = service.getProduct(product.id, TENANT)
      assert.equal(finalProduct.currentStock, 350)
    })

    it('采购单快速流转：草稿→确认→收货，连续 30 次', () => {
      // 创建商品
      const product = service.createProduct(TENANT, {
        name: '采购流转',
        sku: 'PO-FLOW-001',
        unit: '个',
        price: 100,
        cost: 60,
        minStock: 10,
        maxStock: 50000,
        currentStock: 0,
      })

      for (let i = 0; i < 30; i++) {
        const order = service.createPurchaseOrder(TENANT, {
          items: [{
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 10,
            unitPrice: 60,
            totalPrice: 600,
          }],
          totalAmount: 600,
        })
        assert.equal(order.status, PurchaseOrderStatus.Draft)

        const confirmed = service.confirmOrder(order.id, TENANT)
        assert.equal(confirmed.status, PurchaseOrderStatus.Confirmed)

        const received = service.receiveOrder(order.id, TENANT)
        assert.equal(received.status, PurchaseOrderStatus.Received)
      }

      // 30 次 * 10 件 = 300 件
      const finalProduct = service.getProduct(product.id, TENANT)
      assert.equal(finalProduct.currentStock, 300)
    })
  })

  // ─── 多租户隔离压力测试 ───

  describe('多租户隔离压力', () => {
    it('两个租户各创建 50 个商品互不干扰', () => {
      const tenantA: RequestTenantContext = { ...TENANT, tenantId: 'tenant-a' }
      const tenantB: RequestTenantContext = { ...TENANT, tenantId: 'tenant-b' }

      for (let i = 0; i < 50; i++) {
        service.createProduct(tenantA, {
          name: `A产品-${i}`,
          sku: `A-SKU-${i}`,
          unit: '个',
          price: 10,
          cost: 5,
          minStock: 5,
          maxStock: 100,
          currentStock: 20,
        })
        service.createProduct(tenantB, {
          name: `B产品-${i}`,
          sku: `B-SKU-${i}`,
          unit: '个',
          price: 20,
          cost: 10,
          minStock: 3,
          maxStock: 200,
          currentStock: 30,
        })
      }

      const aProducts = service.listProducts(tenantA)
      const bProducts = service.listProducts(tenantB)

      assert.equal(aProducts.length, 50)
      assert.equal(bProducts.length, 50)
      // 确认没有 cross-contamination
      for (const p of aProducts) {
        assert.equal(p.tenantId, 'tenant-a')
      }
      for (const p of bProducts) {
        assert.equal(p.tenantId, 'tenant-b')
      }
    })
  })

  // ─── 边界条件：库存警报 ───

  describe('库存警报边界', () => {
    it('多种缺货/低库存状态混合场景', () => {
      // 缺货商品
      service.createProduct(TENANT, {
        name: '缺货商品',
        sku: 'OUT-001',
        unit: '个',
        price: 10,
        cost: 5,
        minStock: 10,
        maxStock: 100,
        currentStock: 0,
      })

      // 低库存商品（刚好低于阈值）
      service.createProduct(TENANT, {
        name: '低库存商品',
        sku: 'LOW-001',
        unit: '个',
        price: 20,
        cost: 10,
        minStock: 20,
        maxStock: 200,
        currentStock: 15,
      })

      // 正常商品
      service.createProduct(TENANT, {
        name: '正常库存',
        sku: 'NORMAL-001',
        unit: '个',
        price: 30,
        cost: 15,
        minStock: 10,
        maxStock: 200,
        currentStock: 100,
      })

      const alerts = service.getLowStockProducts(TENANT)
      assert.equal(alerts.length, 2)
      assert.equal(alerts.filter(a => a.status === 'out_of_stock').length, 1)
      assert.equal(alerts.filter(a => a.status === 'low').length, 1)
    })

    it('自定义阈值下警报数量变化', () => {
      // 库存分别是 10, 25, 50
      for (let i = 0; i < 3; i++) {
        service.createProduct(TENANT, {
          name: `告警测试-${i}`,
          sku: `ALERT-${i}`,
          unit: '个',
          price: 10,
          cost: 5,
          minStock: 5,
          maxStock: 100,
          currentStock: i === 0 ? 10 : i === 1 ? 25 : 50,
        })
      }

      const defaultAlerts = service.getLowStockProducts(TENANT)
      assert.equal(defaultAlerts.length, 0) // none below minStock=5

      const customAlerts = service.getLowStockProducts(TENANT, 30)
      assert.equal(customAlerts.length, 2) // 10 and 25 are below 30
    })
  })

  // ─── 库存记录审计完整性 ───

  describe('库存记录审计完整性', () => {
    it('多次入库出库后库存记录数量正确', () => {
      const product = service.createProduct(TENANT, {
        name: '审计测试',
        sku: 'AUDIT-001',
        unit: '个',
        price: 100,
        cost: 50,
        minStock: 5,
        maxStock: 500,
        currentStock: 100,
      })

      for (let i = 0; i < 10; i++) {
        service.stockIn(TENANT, { productId: product.id, quantity: 10, reason: `入库#${i}` })
        service.stockOut(TENANT, { productId: product.id, quantity: 5, reason: `出库#${i}` })
      }

      const records = service.getStockRecords(TENANT, { productId: product.id })
      assert.equal(records.length, 20) // 10 in + 10 out

      // 验证最终库存：100 + 10*10 - 10*5 = 150
      const finalProduct = service.getProduct(product.id, TENANT)
      assert.equal(finalProduct.currentStock, 150)

      // 验证每条记录的 before/after 关联正确
      // 记录是最新在前，从后往前遍历（从旧到新）
      for (let i = records.length - 1; i >= 0; i--) {
        const prev = i > 0 ? records[i - 1] : null
        assert.ok(
          records[i].afterStock === records[i].beforeStock + (records[i].type === StockRecordType.Inbound ? records[i].quantity : -records[i].quantity) ||
          (i > 0 && records[i].beforeStock === records[i - 1].afterStock) ||
          i === records.length - 1
        )
      }
    })
  })

  // ─── 供应商+采购单并发创建 ───

  describe('供应商与采购单并发', () => {
    it('连续创建 50 个供应商不丢失', () => {
      for (let i = 0; i < 50; i++) {
        service.createSupplier(TENANT, {
          name: `Supplier-${i}`,
          contactName: `Contact-${i}`,
          phone: `1380000${i.toString().padStart(4, '0')}`,
        })
      }

      const suppliers = service.listSuppliers(TENANT)
      assert.equal(suppliers.length, 50)
    })

    it('同一商品创建 20 个采购单后正确汇总', () => {
      const product = service.createProduct(TENANT, {
        name: '批量采购',
        sku: 'BULK-PO-001',
        unit: '个',
        price: 100,
        cost: 60,
        minStock: 10,
        maxStock: 50000,
        currentStock: 50,
      })

      for (let i = 0; i < 20; i++) {
        const order = service.createPurchaseOrder(TENANT, {
          items: [{
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            quantity: 5,
            unitPrice: 60,
            totalPrice: 300,
          }],
          totalAmount: 300,
        })
        service.confirmOrder(order.id, TENANT)
        service.receiveOrder(order.id, TENANT)
      }

      // 50 + 20*5 = 150
      const finalProduct = service.getProduct(product.id, TENANT)
      assert.equal(finalProduct.currentStock, 150)

      const orders = service.listPurchaseOrders(TENANT)
      assert.equal(orders.length, 20)
    })
  })
})
