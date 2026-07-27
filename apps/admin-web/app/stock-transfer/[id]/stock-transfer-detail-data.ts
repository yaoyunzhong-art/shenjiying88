import { MOCK_TRANSFERS, TYPE_LABEL, STATUS_LABEL, type StockTransferItem } from '../stock-transfer-data'

export interface StockTransferDetailSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'stock-transfer-detail-mock'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  transfer: StockTransferItem | null
}

export function findStockTransferById(id: string): StockTransferItem | null {
  return MOCK_TRANSFERS.find((item) => item.id === id) ?? null
}

export async function loadStockTransferDetailSnapshot(
  id: string,
): Promise<StockTransferDetailSnapshot> {
  const transfer = findStockTransferById(id)

  return {
    deliveryMode: 'mock',
    sourceLabel: 'stock-transfer-detail-mock',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadStockTransferDetailSnapshot -> findStockTransferById()',
    businessDataSource: 'stock transfer local detail samples',
    refreshPath: `StockTransferDetailPage -> loadStockTransferDetailSnapshot(${id})`,
    note: transfer
      ? `当前调拨详情沿用本地样本快照，调拨类型为 ${TYPE_LABEL[transfer.type]}，当前状态为 ${STATUS_LABEL[transfer.status]}。`
      : `当前未命中调拨单 ${id} 的本地样本，详情页显示为空态提示。`,
    transfer,
  }
}
