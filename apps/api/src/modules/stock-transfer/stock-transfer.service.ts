import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

// ── 类型 ────────────────────────────────────────────────────────────────────

export type TransferStatus = 'pending' | 'approved' | 'in_transit' | 'received' | 'cancelled' | 'rejected'
export type TransferType = 'store_to_store' | 'warehouse_to_store' | 'store_to_warehouse' | 'warehouse_to_warehouse'

export interface StockTransferItem { productId: string; productName: string; sku: string; quantity: number; unit: string }

export interface StockTransfer {
  id: string; tenantId: string; transferNumber: string; transferType: TransferType
  fromLocationId: string; fromLocationName: string; toLocationId: string; toLocationName: string
  items: StockTransferItem[]; status: TransferStatus; notes?: string
  requestedById: string; approvedById?: string; receivedById?: string
  requestedAt: Date; approvedAt?: Date; shippedAt?: Date; receivedAt?: Date; cancelledAt?: Date
  createdAt: Date; updatedAt: Date
}

@Injectable()
export class StockTransferService {
  private transfers = new Map<string, StockTransfer>()

  async create(data: Omit<StockTransfer, 'id' | 'transferNumber' | 'status' | 'requestedAt' | 'createdAt' | 'updatedAt'>): Promise<StockTransfer> {
    if (!data.items.length) throw new BadRequestException('Transfer must have at least one item')
    const transfer: StockTransfer = {
      id: `st-${randomUUID()}`, transferNumber: `TF${Date.now()}`, status: 'pending',
      requestedAt: new Date(), createdAt: new Date(), updatedAt: new Date(), ...data,
    }
    this.transfers.set(transfer.id, transfer)
    return transfer
  }

  async getById(id: string): Promise<StockTransfer> {
    const t = this.transfers.get(id)
    if (!t) throw new NotFoundException(`Transfer ${id} not found`)
    return t
  }

  async list(filter?: { status?: TransferStatus; tenantId?: string; fromLocationId?: string; toLocationId?: string }): Promise<StockTransfer[]> {
    return Array.from(this.transfers.values()).filter(t => {
      if (filter?.status && t.status !== filter.status) return false
      if (filter?.tenantId && t.tenantId !== filter.tenantId) return false
      if (filter?.fromLocationId && t.fromLocationId !== filter.fromLocationId) return false
      if (filter?.toLocationId && t.toLocationId !== filter.toLocationId) return false
      return true
    })
  }

  async approve(id: string, approvedById: string): Promise<StockTransfer> {
    const t = await this.getById(id)
    if (t.status !== 'pending') throw new BadRequestException('Only pending transfers can be approved')
    const u = { ...t, status: 'approved' as TransferStatus, approvedById, approvedAt: new Date(), updatedAt: new Date() }
    this.transfers.set(id, u); return u
  }

  async startTransit(id: string): Promise<StockTransfer> {
    const t = await this.getById(id)
    if (t.status !== 'approved') throw new BadRequestException('Only approved transfers can start transit')
    const u = { ...t, status: 'in_transit' as TransferStatus, shippedAt: new Date(), updatedAt: new Date() }
    this.transfers.set(id, u); return u
  }

  async receive(id: string, receivedById: string): Promise<StockTransfer> {
    const t = await this.getById(id)
    if (t.status !== 'in_transit') throw new BadRequestException('Only in-transit transfers can be received')
    const u = { ...t, status: 'received' as TransferStatus, receivedById, receivedAt: new Date(), updatedAt: new Date() }
    this.transfers.set(id, u); return u
  }

  async cancel(id: string): Promise<StockTransfer> {
    const t = await this.getById(id)
    if (['received','cancelled'].includes(t.status)) throw new BadRequestException(`Cannot cancel transfer with status ${t.status}`)
    const u = { ...t, status: 'cancelled' as TransferStatus, cancelledAt: new Date(), updatedAt: new Date() }
    this.transfers.set(id, u); return u
  }

  async reject(id: string): Promise<StockTransfer> {
    const t = await this.getById(id)
    if (t.status !== 'pending') throw new BadRequestException('Only pending transfers can be rejected')
    const u = { ...t, status: 'rejected' as TransferStatus, updatedAt: new Date() }
    this.transfers.set(id, u); return u
  }

  async getStats(tenantId: string): Promise<{ total: number; byStatus: Record<TransferStatus, number>; totalItems: number }> {
    const all = await this.list({ tenantId })
    const byStatus: Record<TransferStatus, number> = { pending:0, approved:0, in_transit:0, received:0, cancelled:0, rejected:0 }
    let totalItems = 0
    for (const t of all) { byStatus[t.status]++; totalItems += t.items.reduce((s,i) => s + i.quantity, 0) }
    return { total: all.length, byStatus, totalItems }
  }
}
