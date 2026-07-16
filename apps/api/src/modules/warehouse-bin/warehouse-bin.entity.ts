// ── Warehouse Bin Enums ──

export enum BinStatus {
  Empty = 'EMPTY',
  Occupied = 'OCCUPIED',
  Reserved = 'RESERVED',
  Maintenance = 'MAINTENANCE'
}

export enum BinType {
  Shelf = 'SHELF',
  Floor = 'FLOOR',
  Cold = 'COLD',
  Hazardous = 'HAZARDOUS'
}

// ── Warehouse Bin ──

export interface WarehouseBin {
  id: string
  code: string
  area: string
  type: BinType
  status: BinStatus
  capacity: number
  usedCapacity: number
  currentItem?: string
  tenantId: string
  createdAt: string
  updatedAt: string
}
