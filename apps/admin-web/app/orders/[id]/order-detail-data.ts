import { loadOrderDetail, type OrderDetailViewModel } from '../../orders-detail-view-model'

export interface OrderDetailSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'order-detail-mock'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  viewModel: OrderDetailViewModel | null
}

export function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

export async function loadOrderDetailSnapshot(id: string): Promise<OrderDetailSnapshot> {
  const viewModel = loadOrderDetail(id)

  return {
    deliveryMode: 'mock',
    sourceLabel: 'order-detail-mock',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadOrderDetailSnapshot -> loadOrderDetail()',
    businessDataSource: 'orders-data MOCK_ORDERS samples',
    refreshPath: `OrderDetailPage -> loadOrderDetailSnapshot(${id})`,
    note: viewModel
      ? `当前订单详情沿用本地订单样本，后续真实替换仅需替换 data 层。当前状态为 ${viewModel.statusLabel}。`
      : '未命中订单样本，本轮仅完成 E54 三层壳与 not-found 收口。',
    viewModel,
  }
}
