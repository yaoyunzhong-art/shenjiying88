export type OpType = 'purchase_in' | 'sale_out' | 'transfer_out' | 'transfer_in' | 'return_in' | 'damage_out' | 'adjustment'
export type OpStatus = 'draft' | 'pending_approval' | 'approved' | 'completed' | 'cancelled'

export interface StockOp {
  id: string
  date: string
  type: OpType
  refNo: string
  items: number
  totalQty: number
  totalCost: number
  status: OpStatus
  creator: string
  approver: string
  warehouse: string
  supplier: string
  department: string
}

export interface StockOperationsSnapshot {
  deliveryMode: 'snapshot'
  sourceLabel: string
  generatedAt: string
  operations: StockOp[]
}

export const OT: Record<OpType, string> = {
  purchase_in: '采购入库',
  sale_out: '销售出库',
  transfer_out: '调拨出库',
  transfer_in: '调拨入库',
  return_in: '退货入库',
  damage_out: '损耗出库',
  adjustment: '盘点调整',
}

export const OS: Record<OpStatus, string> = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已审批',
  completed: '已完成',
  cancelled: '已取消',
}

export function buildStockOperations(): StockOp[] {
  const types: OpType[] = ['purchase_in', 'purchase_in', 'sale_out', 'transfer_out', 'transfer_in', 'return_in', 'damage_out', 'adjustment']
  const statuses: OpStatus[] = ['completed', 'completed', 'completed', 'approved', 'pending_approval', 'draft', 'cancelled', 'completed']
  const warehouses = ['主仓库', '备用仓', '前厅', '冷冻库', '干货库'] as const
  const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D'] as const
  const departments = ['采购部', '销售部', '仓储部', '前厅部', '行政部'] as const
  const creators = ['张三', '李四', '王五'] as const

  return Array.from({ length: 20 }, (_, index) => {
    const date = new Date(Date.now() - index * 86400000).toISOString().split('T')[0] ?? ''
    return {
      id: `STK-OP-${String(index + 1).padStart(3, '0')}`,
      date,
      type: types[index % types.length] ?? 'purchase_in',
      refNo: `REF-${date.replace(/-/g, '')}-${String(1000 + index).slice(-4)}`,
      items: 1 + (index % 6),
      totalQty: 10 + index * 3,
      totalCost: 800 + index * 126,
      status: statuses[index % statuses.length] ?? 'completed',
      creator: creators[index % creators.length] ?? creators[0],
      approver: index % 3 === 0 ? '店长' : '李娜',
      warehouse: warehouses[index % warehouses.length] ?? warehouses[0],
      supplier: suppliers[index % suppliers.length] ?? suppliers[0],
      department: departments[index % departments.length] ?? departments[0],
    }
  })
}

export async function loadStockOperationsSnapshot(): Promise<StockOperationsSnapshot> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-stock-operations-snapshot',
    generatedAt: new Date().toISOString(),
    operations: buildStockOperations(),
  }
}
