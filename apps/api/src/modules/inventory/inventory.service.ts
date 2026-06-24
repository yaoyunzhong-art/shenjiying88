import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  ProductStatus,
  StockRecordType,
  PurchaseOrderStatus,
  type Product,
  type StockRecord,
  type Supplier,
  type PurchaseOrder,
  type StockAlert,
  type PurchaseOrderItem
} from './inventory.entity'
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  StockInDto,
  StockOutDto,
  AdjustStockDto,
  StockRecordQueryDto,
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  PurchaseOrderQueryDto
} from './inventory.dto'
import type { CreatePurchaseOrderItemDto } from './inventory.dto'

const productStore = new Map<string, Product>()
const stockRecordStore = new Map<string, StockRecord>()
const supplierStore = new Map<string, Supplier>()
const purchaseOrderStore = new Map<string, PurchaseOrder>()

export function resetInventoryServiceTestState() {
  productStore.clear()
  stockRecordStore.clear()
  supplierStore.clear()
  purchaseOrderStore.clear()
}

@Injectable()
export class InventoryService {
  // ─── Product CRUD ─────────────────────────────────────

  createProduct(
    tenantContext: RequestTenantContext,
    input: CreateProductDto
  ): Product {
    const now = new Date().toISOString()
    const product: Product = {
      id: `prod-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      brandId: tenantContext.brandId,
      storeId: tenantContext.storeId,
      name: input.name,
      sku: input.sku,
      category: input.category,
      unit: input.unit,
      price: input.price,
      cost: input.cost,
      minStock: input.minStock,
      maxStock: input.maxStock,
      currentStock: input.currentStock,
      status: input.status ?? ProductStatus.Active,
      imageUrl: input.imageUrl,
      barcode: input.barcode,
      createdAt: now,
      updatedAt: now
    }
    productStore.set(product.id, product)
    return product
  }

  updateProduct(
    productId: string,
    tenantContext: RequestTenantContext,
    input: UpdateProductDto
  ): Product {
    const product = this.requireProduct(productId, tenantContext)
    const now = new Date().toISOString()
    const updated: Product = {
      ...product,
      name: input.name ?? product.name,
      sku: input.sku ?? product.sku,
      category: input.category !== undefined ? input.category : product.category,
      unit: input.unit ?? product.unit,
      price: input.price ?? product.price,
      cost: input.cost ?? product.cost,
      minStock: input.minStock ?? product.minStock,
      maxStock: input.maxStock ?? product.maxStock,
      status: input.status ?? product.status,
      imageUrl: input.imageUrl !== undefined ? input.imageUrl : product.imageUrl,
      barcode: input.barcode !== undefined ? input.barcode : product.barcode,
      updatedAt: now
    }
    productStore.set(productId, updated)
    return updated
  }

  getProduct(productId: string, tenantContext: RequestTenantContext): Product {
    return this.requireProduct(productId, tenantContext)
  }

  listProducts(
    tenantContext: RequestTenantContext,
    query?: ProductQueryDto
  ): Product[] {
    const limit = query?.limit && query.limit > 0 ? query.limit : undefined
    const offset = query?.offset && query.offset > 0 ? query.offset : 0

    let products = Array.from(productStore.values())
      .filter((p) => p.tenantId === tenantContext.tenantId)

    if (query?.category) {
      products = products.filter((p) => p.category === query.category)
    }
    if (query?.status) {
      products = products.filter((p) => p.status === query.status)
    }
    if (query?.keyword) {
      const keyword = query.keyword.toLowerCase()
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(keyword) ||
          p.sku.toLowerCase().includes(keyword) ||
          (p.barcode && p.barcode.includes(keyword))
      )
    }

    products.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    if (typeof limit === 'number') {
      products = products.slice(offset, offset + limit)
    }

    return products
  }

  // ─── Stock Operations ─────────────────────────────────

  stockIn(
    tenantContext: RequestTenantContext,
    input: StockInDto
  ): { product: Product; record: StockRecord } {
    const product = this.requireProduct(input.productId, tenantContext)
    const beforeStock = product.currentStock
    const afterStock = beforeStock + input.quantity

    return this.applyStockChange(product, {
      type: StockRecordType.Inbound,
      quantity: input.quantity,
      beforeStock,
      afterStock,
      reason: input.reason,
      batchNo: input.batchNo
    })
  }

  stockOut(
    tenantContext: RequestTenantContext,
    input: StockOutDto
  ): { product: Product; record: StockRecord } {
    const product = this.requireProduct(input.productId, tenantContext)
    this.checkProductStock(product, input.quantity)
    const beforeStock = product.currentStock
    const afterStock = beforeStock - input.quantity

    return this.applyStockChange(product, {
      type: StockRecordType.Outbound,
      quantity: input.quantity,
      beforeStock,
      afterStock,
      reason: input.reason
    })
  }

  adjustStock(
    tenantContext: RequestTenantContext,
    input: AdjustStockDto
  ): { product: Product; record: StockRecord } {
    const product = this.requireProduct(input.productId, tenantContext)
    const beforeStock = product.currentStock
    const diff = input.newQuantity - beforeStock
    const type = diff >= 0 ? StockRecordType.Adjustment : StockRecordType.Adjustment

    return this.applyStockChange(product, {
      type,
      quantity: Math.abs(diff),
      beforeStock,
      afterStock: input.newQuantity,
      reason: input.reason
    })
  }

  checkStock(productId: string, requiredQty: number, tenantContext: RequestTenantContext): boolean {
    const product = this.requireProduct(productId, tenantContext)
    return this.checkProductStock(product, requiredQty)
  }

  getLowStockProducts(
    tenantContext: RequestTenantContext,
    threshold?: number
  ): StockAlert[] {
    return Array.from(productStore.values())
      .filter((p) => p.tenantId === tenantContext.tenantId && p.status === ProductStatus.Active)
      .reduce<StockAlert[]>((alerts, product) => {
        const effectiveThreshold = threshold ?? product.minStock
        if (product.currentStock <= 0) {
          alerts.push({
            product,
            currentStock: product.currentStock,
            minStock: effectiveThreshold,
            maxStock: product.maxStock,
            status: 'out_of_stock'
          })
        } else if (product.currentStock <= effectiveThreshold) {
          alerts.push({
            product,
            currentStock: product.currentStock,
            minStock: effectiveThreshold,
            maxStock: product.maxStock,
            status: 'low'
          })
        }
        return alerts
      }, [])
  }

  getStockRecords(
    tenantContext: RequestTenantContext,
    query?: StockRecordQueryDto
  ): StockRecord[] {
    const limit = query?.limit && query.limit > 0 ? query.limit : undefined
    const offset = query?.offset && query.offset > 0 ? query.offset : 0

    let records = Array.from(stockRecordStore.values())

    // Filter by tenant via product ownership
    records = records.filter((r) => {
      const product = productStore.get(r.productId)
      return product && product.tenantId === tenantContext.tenantId
    })

    if (query?.productId) {
      records = records.filter((r) => r.productId === query.productId)
    }
    if (query?.type) {
      records = records.filter((r) => r.type === query.type)
    }
    if (query?.dateFrom) {
      records = records.filter((r) => r.createdAt >= query.dateFrom!)
    }
    if (query?.dateTo) {
      records = records.filter((r) => r.createdAt <= query.dateTo!)
    }

    records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (typeof limit === 'number') {
      records = records.slice(offset, offset + limit)
    }

    return records
  }

  // ─── Supplier CRUD ────────────────────────────────────

  createSupplier(
    tenantContext: RequestTenantContext,
    input: CreateSupplierDto
  ): Supplier {
    const now = new Date().toISOString()
    const supplier: Supplier = {
      id: `supplier-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      name: input.name,
      contactName: input.contactName,
      phone: input.phone,
      email: input.email,
      address: input.address,
      createdAt: now
    }
    supplierStore.set(supplier.id, supplier)
    return supplier
  }

  listSuppliers(tenantContext: RequestTenantContext): Supplier[] {
    return Array.from(supplierStore.values())
      .filter((s) => s.tenantId === tenantContext.tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // ─── Purchase Order ───────────────────────────────────

  createPurchaseOrder(
    tenantContext: RequestTenantContext,
    input: CreatePurchaseOrderDto
  ): PurchaseOrder {
    const now = new Date().toISOString()
    const items: PurchaseOrderItem[] = input.items.map((item: CreatePurchaseOrderItemDto) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }))

    const order: PurchaseOrder = {
      id: `po-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      storeId: input.storeId ?? tenantContext.storeId,
      supplierId: input.supplierId,
      status: PurchaseOrderStatus.Draft,
      items,
      totalAmount: input.totalAmount,
      createdAt: now
    }
    purchaseOrderStore.set(order.id, order)
    return order
  }

  confirmOrder(
    orderId: string,
    tenantContext: RequestTenantContext
  ): PurchaseOrder {
    const order = this.requirePurchaseOrder(orderId, tenantContext)
    if (order.status !== PurchaseOrderStatus.Draft && order.status !== PurchaseOrderStatus.Submitted) {
      throw new Error(`Purchase order ${orderId} cannot be confirmed (current status: ${order.status})`)
    }
    order.status = PurchaseOrderStatus.Confirmed
    order.orderedAt = new Date().toISOString()
    purchaseOrderStore.set(orderId, order)
    return order
  }

  receiveOrder(
    orderId: string,
    tenantContext: RequestTenantContext
  ): PurchaseOrder {
    const order = this.requirePurchaseOrder(orderId, tenantContext)
    if (order.status !== PurchaseOrderStatus.Confirmed) {
      throw new Error(`Purchase order ${orderId} must be confirmed before receiving`)
    }

    // Auto stock-in for each item
    for (const item of order.items) {
      const product = productStore.get(item.productId)
      if (product && product.tenantId === tenantContext.tenantId) {
        this.stockIn(tenantContext, {
          productId: item.productId,
          quantity: item.quantity,
          reason: `采购收货 PO#${orderId}`,
          batchNo: orderId
        })
      }
    }

    order.status = PurchaseOrderStatus.Received
    order.receivedAt = new Date().toISOString()
    purchaseOrderStore.set(orderId, order)
    return order
  }

  listPurchaseOrders(
    tenantContext: RequestTenantContext,
    query?: PurchaseOrderQueryDto
  ): PurchaseOrder[] {
    const limit = query?.limit && query.limit > 0 ? query.limit : undefined
    const offset = query?.offset && query.offset > 0 ? query.offset : 0

    let orders = Array.from(purchaseOrderStore.values())
      .filter((o) => o.tenantId === tenantContext.tenantId)

    if (query?.status) {
      orders = orders.filter((o) => o.status === query.status)
    }
    if (query?.supplierId) {
      orders = orders.filter((o) => o.supplierId === query.supplierId)
    }
    if (query?.storeId) {
      orders = orders.filter((o) => o.storeId === query.storeId)
    }

    orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (typeof limit === 'number') {
      orders = orders.slice(offset, offset + limit)
    }

    return orders
  }

  // ─── Private Helpers ──────────────────────────────────

  private requireProduct(productId: string, tenantContext: RequestTenantContext): Product {
    const product = productStore.get(productId)
    if (!product || product.tenantId !== tenantContext.tenantId) {
      throw new Error(`Product ${productId} not found`)
    }
    return product
  }

  private requirePurchaseOrder(orderId: string, tenantContext: RequestTenantContext): PurchaseOrder {
    const order = purchaseOrderStore.get(orderId)
    if (!order || order.tenantId !== tenantContext.tenantId) {
      throw new Error(`Purchase order ${orderId} not found`)
    }
    return order
  }

  private checkProductStock(product: Product, requiredQty: number): boolean {
    if (product.currentStock < requiredQty) {
      throw new Error(
        `Insufficient stock for product ${product.name} (${product.sku}): ` +
        `required ${requiredQty}, available ${product.currentStock}`
      )
    }
    return true
  }

  private applyStockChange(
    product: Product,
    params: {
      type: StockRecordType
      quantity: number
      beforeStock: number
      afterStock: number
      reason?: string
      batchNo?: string
    }
  ): { product: Product; record: StockRecord } {
    const now = new Date().toISOString()
    const record: StockRecord = {
      id: `sr-${randomUUID()}`,
      productId: product.id,
      storeId: product.storeId,
      type: params.type,
      quantity: params.quantity,
      beforeStock: params.beforeStock,
      afterStock: params.afterStock,
      reason: params.reason,
      batchNo: params.batchNo,
      createdAt: now
    }
    stockRecordStore.set(record.id, record)

    product.currentStock = params.afterStock
    product.updatedAt = now
    productStore.set(product.id, product)

    return { product, record }
  }
}
