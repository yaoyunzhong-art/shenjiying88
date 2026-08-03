import { TRANSFER_TYPES, TYPE_LABEL, URGENCY_LEVELS, URGENCY_LABEL } from '../stock-transfer-data'

export interface TransferStoreOption {
  value: string
  label: string
}

export interface StockTransferFormSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'stock-transfer-form-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  stores: TransferStoreOption[]
}

export const STORE_OPTIONS: TransferStoreOption[] = [
  { value: 'S-001', label: '杭州银泰旗舰店' },
  { value: 'S-002', label: '杭州万象城店' },
  { value: 'S-003', label: '深圳万象天地店' },
  { value: 'S-004', label: '北京三里屯店' },
  { value: 'WH-001', label: '中央仓库-华东' },
  { value: 'WH-002', label: '中央仓库-华南' },
  { value: 'WH-003', label: '中央仓库-华北' },
]

export async function loadStockTransferFormSnapshot(): Promise<StockTransferFormSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'stock-transfer-form-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadStockTransferFormSnapshot -> local E54 snapshot shell',
    businessDataSource: `store options + transfer enums (${TRANSFER_TYPES.length} transfer types / ${URGENCY_LEVELS.length} urgency levels)`,
    refreshPath: `loadStockTransferFormSnapshot(${'root'})`,
    note: `当前页面保留 mock 表单校验与提交反馈，默认类型 ${TYPE_LABEL.supply}，默认紧急度 ${URGENCY_LABEL.normal}。`,
    stores: STORE_OPTIONS,
  }
}
