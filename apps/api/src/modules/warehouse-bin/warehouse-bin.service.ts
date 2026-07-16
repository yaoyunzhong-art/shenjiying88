import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  BinStatus,
  BinType,
  type WarehouseBin,
} from './warehouse-bin.entity'

// ── In-memory store ──

const binStore = new Map<string, WarehouseBin>()

// ── Mock data seeded on first use ──

let seeded = false

function seedMockBins(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'

  interface MockBinData {
    code: string; area: string; type: BinType; status: BinStatus
    capacity: number; usedCapacity: number; currentItem?: string
  }

  const mockBins: MockBinData[] = [
    { code: 'A-01-01', area: 'A区', type: BinType.Shelf, status: BinStatus.Occupied, capacity: 100, usedCapacity: 80, currentItem: '电子元器件' },
    { code: 'A-01-02', area: 'A区', type: BinType.Shelf, status: BinStatus.Occupied, capacity: 100, usedCapacity: 100, currentItem: '精密轴承' },
    { code: 'A-01-03', area: 'A区', type: BinType.Shelf, status: BinStatus.Empty, capacity: 100, usedCapacity: 0 },
    { code: 'A-02-01', area: 'A区', type: BinType.Shelf, status: BinStatus.Reserved, capacity: 80, usedCapacity: 0, currentItem: '待入库PCB板' },
    { code: 'A-02-02', area: 'A区', type: BinType.Shelf, status: BinStatus.Occupied, capacity: 80, usedCapacity: 50, currentItem: '传感器模块' },
    { code: 'B-01-01', area: 'B区', type: BinType.Floor, status: BinStatus.Occupied, capacity: 500, usedCapacity: 300, currentItem: '瓦楞纸箱' },
    { code: 'B-01-02', area: 'B区', type: BinType.Floor, status: BinStatus.Occupied, capacity: 500, usedCapacity: 450, currentItem: '气泡膜' },
    { code: 'B-02-01', area: 'B区', type: BinType.Floor, status: BinStatus.Empty, capacity: 500, usedCapacity: 0 },
    { code: 'B-02-02', area: 'B区', type: BinType.Floor, status: BinStatus.Maintenance, capacity: 500, usedCapacity: 0 },
    { code: 'C-01-01', area: 'C区冷库', type: BinType.Cold, status: BinStatus.Occupied, capacity: 200, usedCapacity: 150, currentItem: '冻虾仁' },
    { code: 'C-01-02', area: 'C区冷库', type: BinType.Cold, status: BinStatus.Occupied, capacity: 200, usedCapacity: 200, currentItem: '冷冻三文鱼' },
    { code: 'C-01-03', area: 'C区冷库', type: BinType.Cold, status: BinStatus.Empty, capacity: 200, usedCapacity: 0 },
    { code: 'C-02-01', area: 'C区冷库', type: BinType.Cold, status: BinStatus.Reserved, capacity: 150, usedCapacity: 0, currentItem: '待入库冰淇淋' },
    { code: 'D-01-01', area: 'D区危险品', type: BinType.Hazardous, status: BinStatus.Occupied, capacity: 100, usedCapacity: 60, currentItem: '盐酸(工业级)' },
    { code: 'D-01-02', area: 'D区危险品', type: BinType.Hazardous, status: BinStatus.Occupied, capacity: 100, usedCapacity: 40, currentItem: '氢氧化钠' },
    { code: 'D-01-03', area: 'D区危险品', type: BinType.Hazardous, status: BinStatus.Empty, capacity: 100, usedCapacity: 0 },
    { code: 'A-03-01', area: 'A区', type: BinType.Shelf, status: BinStatus.Empty, capacity: 120, usedCapacity: 0 },
    { code: 'A-03-02', area: 'A区', type: BinType.Shelf, status: BinStatus.Occupied, capacity: 120, usedCapacity: 30, currentItem: 'LED显示屏' },
    { code: 'B-03-01', area: 'B区', type: BinType.Floor, status: BinStatus.Empty, capacity: 600, usedCapacity: 0 },
    { code: 'C-03-01', area: 'C区冷库', type: BinType.Cold, status: BinStatus.Maintenance, capacity: 250, usedCapacity: 0 },
    { code: 'A-04-01', area: 'A区', type: BinType.Shelf, status: BinStatus.Empty, capacity: 90, usedCapacity: 0 },
    { code: 'D-02-01', area: 'D区危险品', type: BinType.Hazardous, status: BinStatus.Reserved, capacity: 80, usedCapacity: 0, currentItem: '待入库化学品' },
  ]

  for (const m of mockBins) {
    const now = new Date()
    const bin: WarehouseBin = {
      id: `bin-${randomUUID()}`,
      code: m.code,
      area: m.area,
      type: m.type,
      status: m.status,
      capacity: m.capacity,
      usedCapacity: m.usedCapacity,
      currentItem: m.currentItem,
      tenantId: tenant,
      createdAt: new Date(now.getTime() - Math.random() * 30 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    }
    binStore.set(bin.id, bin)
  }
}

@Injectable()
export class WarehouseBinService {
  // ═══════════════════════════════════════════════════════════════════
  // Bin CRUD
  // ═══════════════════════════════════════════════════════════════════

  createBin(input: {
    tenantId: string
    code: string
    area: string
    type: BinType
    status?: BinStatus
    capacity: number
    usedCapacity?: number
    currentItem?: string
  }): WarehouseBin {
    const now = new Date().toISOString()
    const bin: WarehouseBin = {
      id: `bin-${randomUUID()}`,
      tenantId: input.tenantId,
      code: input.code,
      area: input.area,
      type: input.type,
      status: input.status ?? BinStatus.Empty,
      capacity: input.capacity,
      usedCapacity: input.usedCapacity ?? 0,
      currentItem: input.currentItem,
      createdAt: now,
      updatedAt: now,
    }
    binStore.set(bin.id, bin)
    return bin
  }

  updateBin(
    binId: string,
    tenantId: string,
    input: {
      code?: string
      area?: string
      type?: BinType
      status?: BinStatus
      capacity?: number
      usedCapacity?: number
      currentItem?: string
    }
  ): WarehouseBin {
    const bin = this.requireBin(binId, tenantId)

    if (input.code !== undefined) bin.code = input.code
    if (input.area !== undefined) bin.area = input.area
    if (input.type !== undefined) bin.type = input.type
    if (input.status !== undefined) bin.status = input.status
    if (input.capacity !== undefined) bin.capacity = input.capacity
    if (input.usedCapacity !== undefined) bin.usedCapacity = input.usedCapacity
    if (input.currentItem !== undefined) bin.currentItem = input.currentItem

    bin.updatedAt = new Date().toISOString()
    binStore.set(binId, bin)
    return bin
  }

  getBin(binId: string, tenantId: string): WarehouseBin | undefined {
    const bin = binStore.get(binId)
    if (!bin || bin.tenantId !== tenantId) return undefined
    return bin
  }

  listBins(
    tenantId: string,
    filter?: {
      status?: BinStatus
      type?: BinType
      area?: string
      search?: string
    }
  ): WarehouseBin[] {
    seedMockBins()
    return Array.from(binStore.values())
      .filter((b) => b.tenantId === tenantId)
      .filter((b) => (filter?.status ? b.status === filter.status : true))
      .filter((b) => (filter?.type ? b.type === filter.type : true))
      .filter((b) => (filter?.area ? b.area === filter.area : true))
      .filter((b) => {
        if (!filter?.search) return true
        const q = filter.search.toLowerCase()
        return (
          b.code.toLowerCase().includes(q) ||
          b.area.toLowerCase().includes(q) ||
          (b.currentItem ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.code.localeCompare(b.code))
  }

  deleteBin(binId: string, tenantId: string): void {
    const bin = this.requireBin(binId, tenantId)
    binStore.delete(bin.id)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Capacity tracking
  // ═══════════════════════════════════════════════════════════════════

  assignItem(binId: string, itemName: string, quantity: number, tenantId: string): WarehouseBin {
    const bin = this.requireBin(binId, tenantId)

    if (bin.status === BinStatus.Maintenance) {
      throw new Error(`Bin ${bin.code} is under maintenance`)
    }

    if (bin.usedCapacity + quantity > bin.capacity) {
      throw new Error(`Insufficient capacity in bin ${bin.code}: used ${bin.usedCapacity}/${bin.capacity}, need ${quantity}`)
    }

    bin.usedCapacity += quantity
    bin.currentItem = itemName
    bin.status = BinStatus.Occupied
    bin.updatedAt = new Date().toISOString()
    binStore.set(binId, bin)
    return bin
  }

  removeItem(binId: string, quantity: number, tenantId: string): WarehouseBin {
    const bin = this.requireBin(binId, tenantId)

    if (bin.usedCapacity < quantity) {
      throw new Error(`Cannot remove ${quantity}, only ${bin.usedCapacity} used in bin ${bin.code}`)
    }

    bin.usedCapacity -= quantity

    if (bin.usedCapacity === 0) {
      bin.status = BinStatus.Empty
      bin.currentItem = undefined
    }

    bin.updatedAt = new Date().toISOString()
    binStore.set(binId, bin)
    return bin
  }

  reserveBin(binId: string, tenantId: string): WarehouseBin {
    const bin = this.requireBin(binId, tenantId)

    if (bin.status !== BinStatus.Empty) {
      throw new Error(`Cannot reserve bin ${bin.code}, current status: ${bin.status}`)
    }

    bin.status = BinStatus.Reserved
    bin.updatedAt = new Date().toISOString()
    binStore.set(binId, bin)
    return bin
  }

  setMaintenance(binId: string, tenantId: string): WarehouseBin {
    const bin = this.requireBin(binId, tenantId)
    bin.status = BinStatus.Maintenance
    bin.updatedAt = new Date().toISOString()
    binStore.set(binId, bin)
    return bin
  }

  // ═══════════════════════════════════════════════════════════════════
  // Query helpers
  // ═══════════════════════════════════════════════════════════════════

  getEmptyBins(tenantId: string): WarehouseBin[] {
    seedMockBins()
    return Array.from(binStore.values())
      .filter((b) => b.tenantId === tenantId && b.status === BinStatus.Empty)
      .sort((a, b) => a.code.localeCompare(b.code))
  }

  getOccupiedBinsByArea(area: string, tenantId: string): WarehouseBin[] {
    seedMockBins()
    return Array.from(binStore.values())
      .filter((b) => b.tenantId === tenantId && b.area === area && b.status === BinStatus.Occupied)
      .sort((a, b) => a.code.localeCompare(b.code))
  }

  getCapacityUtilization(tenantId: string): {
    totalCapacity: number
    totalUsed: number
    utilizationRate: number
    bins: WarehouseBin[]
  } {
    seedMockBins()
    const bins = Array.from(binStore.values()).filter((b) => b.tenantId === tenantId)
    const totalCapacity = bins.reduce((sum, b) => sum + b.capacity, 0)
    const totalUsed = bins.reduce((sum, b) => sum + b.usedCapacity, 0)
    return {
      totalCapacity,
      totalUsed,
      utilizationRate: totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0,
      bins,
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Internals
  // ═══════════════════════════════════════════════════════════════════

  private requireBin(binId: string, tenantId: string): WarehouseBin {
    const bin = binStore.get(binId)
    if (!bin || bin.tenantId !== tenantId) {
      throw new Error(`Warehouse bin not found: ${binId}`)
    }
    return bin
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetBinStoresForTests(): void {
    binStore.clear()
    seeded = false
  }
}
