import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  ProductStatus,
  StockRecordType,
  PurchaseOrderStatus,
  type Product,
  type StockRecord,
  type PurchaseOrder,
  type PurchaseOrderItem
} from './inventory.entity'
import { InventoryService } from './inventory.service'

// ─── 盘点单实体 ─────────────────────────────────────────

export enum StockCheckStatus {
  Draft = 'draft',
  InProgress = 'in_progress',
  Submitted = 'submitted',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export interface StockCheckItem {
  productId: string
  productName: string
  sku: string
  systemQty: number
  actualQty: number
  discrepancy: number
}

export interface StockCheck {
  id: string
  tenantId: string
  storeId: string
  status: StockCheckStatus
  items: StockCheckItem[]
  startedAt: string
  submittedAt?: string
  completedAt?: string
}

// ─── 跨店调拨实体 ─────────────────────────────────────

export enum TransferStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Outbound = 'outbound',
  Inbound = 'inbound',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export interface TransferItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitCost: number
}

export interface TransferCostBreakdown {
  freight: number
  lossRatio: number
  lossAmount: number
  laborPerUnit: number
  laborTotal: number
  total: number
}

export interface CrossStoreTransfer {
  id: string
  tenantId: string
  fromStoreId: string
  toStoreId: string
  status: TransferStatus
  items: TransferItem[]
  totalAmount: number
  costBreakdown?: TransferCostBreakdown
  rejectReason?: string
  requestedAt: string
  approvedAt?: string
  outboundAt?: string
  inboundAt?: string
  completedAt?: string
}

// ─── 内存存储 ─────────────────────────────────────────

const stockCheckStore = new Map<string, StockCheck>()
const crossStoreTransferStore = new Map<string, CrossStoreTransfer>()

export function resetInventoryMgmtTestState() {
  stockCheckStore.clear()
  crossStoreTransferStore.clear()
}

// ─── 采购订单服务 ─────────────────────────────────────

@Injectable()
export class PurchaseOrderService {
  constructor(private readonly inventoryService: InventoryService) {}

  createPurchaseOrder(
    tenantContext: RequestTenantContext,
    items: Array<{
      productId: string
      productName: string
      sku: string
      quantity: number
      unitPrice: number
    }>,
    supplierId?: string,
    storeId?: string
  ): PurchaseOrder {
    return this.inventoryService.createPurchaseOrder(tenantContext, {
      supplierId,
      storeId,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      })),
      totalAmount: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    })
  }

  receivePO(
    poId: string,
    items: Array<{
      productId: string
      quantity: number
    }>,
    tenantContext: RequestTenantContext
  ): { purchaseOrder: PurchaseOrder; stockRecords: StockRecord[] } {
    const po = this.inventoryService.listPurchaseOrders(tenantContext)
      .find((o) => o.id === poId && o.status === PurchaseOrderStatus.Confirmed)

    if (!po) {
      throw new Error(`Purchase order ${poId} not found or not confirmed`)
    }

    const stockRecords: StockRecord[] = []

    for (const receiveItem of items) {
      const { record } = this.inventoryService.stockIn(tenantContext, {
        productId: receiveItem.productId,
        quantity: receiveItem.quantity,
        reason: `采购收货 PO#${poId}`,
        batchNo: poId
      })
      stockRecords.push(record)
    }

    po.status = PurchaseOrderStatus.Received
    po.receivedAt = new Date().toISOString()

    return { purchaseOrder: po, stockRecords }
  }

  cancelPO(poId: string, tenantContext: RequestTenantContext): PurchaseOrder {
    const po = this.inventoryService.listPurchaseOrders(tenantContext)
      .find((o) => o.id === poId)

    if (!po) {
      throw new Error(`Purchase order ${poId} not found`)
    }

    if (po.status === PurchaseOrderStatus.Received) {
      throw new Error(`Cannot cancel received purchase order ${poId}`)
    }

    po.status = PurchaseOrderStatus.Cancelled
    return po
  }

  getPO(poId: string, tenantContext: RequestTenantContext): PurchaseOrder {
    const po = this.inventoryService.listPurchaseOrders(tenantContext)
      .find((o) => o.id === poId)

    if (!po) {
      throw new Error(`Purchase order ${poId} not found`)
    }

    return po
  }

  listPOs(tenantContext: RequestTenantContext, status?: PurchaseOrderStatus): PurchaseOrder[] {
    return this.inventoryService.listPurchaseOrders(tenantContext, status ? { status } : undefined)
  }
}

// ─── 库存盘点服务 ─────────────────────────────────────

@Injectable()
export class InventoryCheckService {
  constructor(private readonly inventoryService: InventoryService) {}

  startCheck(tenantContext: RequestTenantContext, storeId: string): StockCheck {
    const now = new Date().toISOString()

    const products = this.inventoryService.listProducts(tenantContext)
      .filter((p) => p.storeId === storeId && p.status === ProductStatus.Active)

    const items: StockCheckItem[] = products.map((p) => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      systemQty: p.currentStock,
      actualQty: 0,
      discrepancy: 0
    }))

    const check: StockCheck = {
      id: `sc-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      storeId,
      status: StockCheckStatus.InProgress,
      items,
      startedAt: now
    }

    stockCheckStore.set(check.id, check)
    return check
  }

  recordCount(
    checkId: string,
    skuId: string,
    actualQty: number,
    tenantContext: RequestTenantContext
  ): StockCheck {
    const check = this.requireStockCheck(checkId, tenantContext)

    if (check.status !== StockCheckStatus.InProgress) {
      throw new Error(`Stock check ${checkId} is not in progress`)
    }

    const item = check.items.find((i) => i.productId === skuId)
    if (!item) {
      throw new Error(`Product ${skuId} not found in stock check ${checkId}`)
    }

    item.actualQty = actualQty
    item.discrepancy = actualQty - item.systemQty

    stockCheckStore.set(checkId, check)
    return check
  }

  submitCheck(checkId: string, tenantContext: RequestTenantContext): StockCheck {
    const check = this.requireStockCheck(checkId, tenantContext)

    if (check.status !== StockCheckStatus.InProgress) {
      throw new Error(`Stock check ${checkId} is not in progress`)
    }

    for (const item of check.items) {
      if (item.actualQty === 0 && item.systemQty === 0) {
        continue
      }
    }

    check.status = StockCheckStatus.Submitted
    check.submittedAt = new Date().toISOString()

    stockCheckStore.set(checkId, check)
    return check
  }

  calculateDiscrepancy(checkId: string, tenantContext: RequestTenantContext): StockCheckItem[] {
    const check = this.requireStockCheck(checkId, tenantContext)

    return check.items.map((item) => ({
      ...item,
      discrepancy: item.actualQty - item.systemQty
    }))
  }

  adjustStock(
    checkId: string,
    discrepancies: Array<{ productId: string; adjustQty: number }>,
    tenantContext: RequestTenantContext
  ): { product: Product; record: StockRecord }[] {
    const check = this.requireStockCheck(checkId, tenantContext)

    if (check.status !== StockCheckStatus.Submitted) {
      throw new Error(`Stock check ${checkId} must be submitted before adjustment`)
    }

    const results: { product: Product; record: StockRecord }[] = []

    for (const discrepancy of discrepancies) {
      const item = check.items.find((i) => i.productId === discrepancy.productId)
      if (!item) continue

      const currentProduct = this.inventoryService.listProducts(tenantContext)
        .find((p) => p.id === discrepancy.productId)

      if (currentProduct) {
        const newQty = currentProduct.currentStock + discrepancy.adjustQty
        const { product, record } = this.inventoryService.adjustStock(tenantContext, {
          productId: discrepancy.productId,
          newQuantity: newQty,
          reason: `盘点调整 SC#${checkId}`
        })
        results.push({ product, record })
      }
    }

    check.status = StockCheckStatus.Completed
    check.completedAt = new Date().toISOString()
    stockCheckStore.set(checkId, check)

    return results
  }

  getCheck(checkId: string, tenantContext: RequestTenantContext): StockCheck {
    return this.requireStockCheck(checkId, tenantContext)
  }

  listChecks(tenantContext: RequestTenantContext, storeId?: string): StockCheck[] {
    let checks = Array.from(stockCheckStore.values())
      .filter((c) => c.tenantId === tenantContext.tenantId)

    if (storeId) {
      checks = checks.filter((c) => c.storeId === storeId)
    }

    return checks.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  }

  private requireStockCheck(checkId: string, tenantContext: RequestTenantContext): StockCheck {
    const check = stockCheckStore.get(checkId)
    if (!check || check.tenantId !== tenantContext.tenantId) {
      throw new Error(`Stock check ${checkId} not found`)
    }
    return check
  }
}

// ─── 跨店调拨服务 ─────────────────────────────────────

export const TRANSFER_COST_CONFIG = {
  freight: 50,
  lossRatio: 0.005,
  laborPerUnit: 2
}

@Injectable()
export class CrossStoreTransferService {
  constructor(private readonly inventoryService: InventoryService) {}

  requestTransfer(
    tenantContext: RequestTenantContext,
    fromStore: string,
    toStore: string,
    items: Array<{
      productId: string
      productName: string
      sku: string
      quantity: number
      unitCost: number
    }>
  ): CrossStoreTransfer {
    const now = new Date().toISOString()

    if (fromStore === toStore) {
      throw new Error('Source and destination stores must be different')
    }

    for (const item of items) {
      const product = this.inventoryService.listProducts(tenantContext)
        .find((p) => p.id === item.productId && p.storeId === fromStore)

      if (!product) {
        throw new Error(`Product ${item.productId} not found in store ${fromStore}`)
      }

      if (product.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productName}: required ${item.quantity}, available ${product.currentStock}`)
      }
    }

    const transferItems: TransferItem[] = items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitCost: item.unitCost
    }))

    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    )

    const transfer: CrossStoreTransfer = {
      id: `xfer-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      fromStoreId: fromStore,
      toStoreId: toStore,
      status: TransferStatus.Pending,
      items: transferItems,
      totalAmount,
      requestedAt: now
    }

    crossStoreTransferStore.set(transfer.id, transfer)
    return transfer
  }

  approveTransfer(transferId: string, tenantContext: RequestTenantContext): CrossStoreTransfer {
    const transfer = this.requireTransfer(transferId, tenantContext)

    if (transfer.status !== TransferStatus.Pending) {
      throw new Error(`Transfer ${transferId} is not pending`)
    }

    transfer.status = TransferStatus.Approved
    transfer.approvedAt = new Date().toISOString()

    crossStoreTransferStore.set(transferId, transfer)
    return transfer
  }

  rejectTransfer(transferId: string, reason: string, tenantContext: RequestTenantContext): CrossStoreTransfer {
    const transfer = this.requireTransfer(transferId, tenantContext)

    if (transfer.status !== TransferStatus.Pending) {
      throw new Error(`Transfer ${transferId} is not pending`)
    }

    transfer.status = TransferStatus.Rejected
    transfer.rejectReason = reason

    crossStoreTransferStore.set(transferId, transfer)
    return transfer
  }

  executeTransfer(transferId: string, tenantContext: RequestTenantContext): CrossStoreTransfer {
    const transfer = this.requireTransfer(transferId, tenantContext)

    if (transfer.status !== TransferStatus.Approved) {
      throw new Error(`Transfer ${transferId} must be approved before outbound`)
    }

    for (const item of transfer.items) {
      const product = this.inventoryService.listProducts(tenantContext)
        .find((p) => p.id === item.productId && p.storeId === transfer.fromStoreId)

      if (product) {
        if (product.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.productName}: required ${item.quantity}, available ${product.currentStock}`)
        }

        this.inventoryService.stockOut(tenantContext, {
          productId: item.productId,
          quantity: item.quantity,
          reason: `跨店调拨出库 XFER#${transferId}`
        })
      }
    }

    transfer.status = TransferStatus.Outbound
    transfer.outboundAt = new Date().toISOString()

    crossStoreTransferStore.set(transferId, transfer)
    return transfer
  }

  receiveTransfer(transferId: string, tenantContext: RequestTenantContext): CrossStoreTransfer {
    const transfer = this.requireTransfer(transferId, tenantContext)

    if (transfer.status !== TransferStatus.Outbound) {
      throw new Error(`Transfer ${transferId} must be outbound before inbound`)
    }

    for (const item of transfer.items) {
      this.inventoryService.stockIn(tenantContext, {
        productId: item.productId,
        quantity: item.quantity,
        reason: `跨店调拨入库 XFER#${transferId}`,
        batchNo: transferId
      })
    }

    transfer.status = TransferStatus.Inbound
    transfer.inboundAt = new Date().toISOString()

    crossStoreTransferStore.set(transferId, transfer)
    return transfer
  }

  calculateTransferCost(transferId: string, tenantContext: RequestTenantContext): TransferCostBreakdown {
    const transfer = this.requireTransfer(transferId, tenantContext)

    const totalQty = transfer.items.reduce((sum, item) => sum + item.quantity, 0)
    const totalValue = transfer.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)

    const freight = TRANSFER_COST_CONFIG.freight
    const lossAmount = Math.round(totalValue * TRANSFER_COST_CONFIG.lossRatio)
    const laborTotal = totalQty * TRANSFER_COST_CONFIG.laborPerUnit
    const total = freight + lossAmount + laborTotal

    const costBreakdown: TransferCostBreakdown = {
      freight,
      lossRatio: TRANSFER_COST_CONFIG.lossRatio,
      lossAmount,
      laborPerUnit: TRANSFER_COST_CONFIG.laborPerUnit,
      laborTotal,
      total
    }

    transfer.costBreakdown = costBreakdown
    crossStoreTransferStore.set(transferId, transfer)

    return costBreakdown
  }

  completeTransfer(transferId: string, tenantContext: RequestTenantContext): CrossStoreTransfer {
    const transfer = this.requireTransfer(transferId, tenantContext)

    if (transfer.status !== TransferStatus.Inbound) {
      throw new Error(`Transfer ${transferId} must be inbound before completion`)
    }

    if (!transfer.costBreakdown) {
      this.calculateTransferCost(transferId, tenantContext)
    }

    transfer.status = TransferStatus.Completed
    transfer.completedAt = new Date().toISOString()

    crossStoreTransferStore.set(transferId, transfer)
    return transfer
  }

  getTransfer(transferId: string, tenantContext: RequestTenantContext): CrossStoreTransfer {
    return this.requireTransfer(transferId, tenantContext)
  }

  listTransfers(tenantContext: RequestTenantContext, status?: TransferStatus): CrossStoreTransfer[] {
    let transfers = Array.from(crossStoreTransferStore.values())
      .filter((t) => t.tenantId === tenantContext.tenantId)

    if (status) {
      transfers = transfers.filter((t) => t.status === status)
    }

    return transfers.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
  }

  private requireTransfer(transferId: string, tenantContext: RequestTenantContext): CrossStoreTransfer {
    const transfer = crossStoreTransferStore.get(transferId)
    if (!transfer || transfer.tenantId !== tenantContext.tenantId) {
      throw new Error(`Transfer ${transferId} not found`)
    }
    return transfer
  }
}
