export type FulfillmentStatus = 'pending' | 'picking' | 'packed' | 'shipped' | 'delivered' | 'issue'

export interface FulfillmentOrderRecord {
  id: string
  memberName: string
  address: string
  status: FulfillmentStatus
  shippingMethod: string
  amountCents: number
  createdAt: string
}

export interface FulfillmentSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-fulfillment-snapshot'
  orders: FulfillmentOrderRecord[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export const FULFILLMENT_ORDERS: FulfillmentOrderRecord[] = [
  { id: 'ORD-2701', memberName: '张伟', address: '北京朝阳区望京街道', status: 'pending', shippingMethod: '标准配送', amountCents: 12900, createdAt: '2026-07-27 09:10' },
  { id: 'ORD-2702', memberName: '李娜', address: '上海浦东新区金科路', status: 'picking', shippingMethod: '门店自提', amountCents: 23800, createdAt: '2026-07-27 08:45' },
  { id: 'ORD-2703', memberName: '王强', address: '深圳南山区科技园', status: 'packed', shippingMethod: '同城急送', amountCents: 7600, createdAt: '2026-07-27 08:20' },
  { id: 'ORD-2704', memberName: '刘洋', address: '杭州西湖区古墩路', status: 'shipped', shippingMethod: '标准配送', amountCents: 16900, createdAt: '2026-07-27 07:50' },
  { id: 'ORD-2705', memberName: '陈静', address: '广州天河区体育西路', status: 'delivered', shippingMethod: '标准配送', amountCents: 19800, createdAt: '2026-07-26 19:30' },
  { id: 'ORD-2706', memberName: '杨帆', address: '苏州工业园区星湖街', status: 'issue', shippingMethod: '预约配送', amountCents: 22100, createdAt: '2026-07-26 18:10' },
]

export async function loadFulfillmentSnapshot(): Promise<FulfillmentSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-fulfillment-snapshot',
    orders: FULFILLMENT_ORDERS,
    generatedAt: '2026-07-27T09:45:00.000Z',
    controlPlaneSource: 'loadFulfillmentSnapshot -> FULFILLMENT_ORDERS',
    businessDataSource: 'local fulfillment sample records',
    refreshPath: 'FulfillmentPage -> loadFulfillmentSnapshot',
    note: '当前页面消费本地履约快照，适用于结构固证与状态流转演示。',
  }
}
