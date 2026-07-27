export type LogisticsOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'returned'
  | 'cancelled'

export type LogisticsUrgency = 'normal' | 'urgent' | 'emergency'

export interface LogisticsOrder {
  id: string
  orderNo: string
  supplierName: string
  totalAmount: number
  totalQuantity: number
  status: LogisticsOrderStatus
  urgency: LogisticsUrgency
  orderDate: string
  expectedDelivery: string
  contactPerson: string
  department: string
  deliveryAddress: string
  remark: string
}

export interface LogisticsSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-logistics-snapshot'
  orders: LogisticsOrder[]
  generatedAt: string
}

export const LOGISTICS_STATUS_LABEL: Record<LogisticsOrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  shipped: '已发货',
  in_transit: '配送中',
  delivered: '已签收',
  returned: '已退回',
  cancelled: '已取消',
}

export const LOGISTICS_URGENCY_LABEL: Record<LogisticsUrgency, string> = {
  normal: '普通',
  urgent: '紧急',
  emergency: '特急',
}

export const LOGISTICS_ORDERS: LogisticsOrder[] = [
  { id: 'log-001', orderNo: 'LOG-2026-0001', supplierName: '绿源食品有限公司', totalAmount: 86500, totalQuantity: 240, status: 'delivered', urgency: 'normal', orderDate: '2026-07-01', expectedDelivery: '2026-07-05', contactPerson: '王建国', department: '后厨', deliveryAddress: '北京市朝阳区建国路 88 号', remark: '月度常规配送' },
  { id: 'log-002', orderNo: 'LOG-2026-0002', supplierName: '鼎盛包装科技有限公司', totalAmount: 32000, totalQuantity: 10000, status: 'in_transit', urgency: 'urgent', orderDate: '2026-07-10', expectedDelivery: '2026-07-12', contactPerson: '李志强', department: '前厅', deliveryAddress: '北京市朝阳区建国路 88 号', remark: '外卖包装盒加急配送' },
  { id: 'log-003', orderNo: 'LOG-2026-0003', supplierName: '鲜生活食材配送', totalAmount: 12800, totalQuantity: 85, status: 'confirmed', urgency: 'normal', orderDate: '2026-07-15', expectedDelivery: '2026-07-18', contactPerson: '赵敏', department: '后厨', deliveryAddress: '北京市朝阳区建国路 88 号', remark: '周末活动特供食材' },
  { id: 'log-004', orderNo: 'LOG-2026-0004', supplierName: '海龙物流集团', totalAmount: 45500, totalQuantity: 1, status: 'shipped', urgency: 'urgent', orderDate: '2026-07-12', expectedDelivery: '2026-07-14', contactPerson: '陈海', department: '物流', deliveryAddress: '上海市浦东新区陆家嘴环路 1000 号', remark: '冷链配送服务' },
  { id: 'log-005', orderNo: 'LOG-2026-0005', supplierName: '欧风烘焙原料进口', totalAmount: 98000, totalQuantity: 300, status: 'pending', urgency: 'normal', orderDate: '2026-07-18', expectedDelivery: '2026-07-25', contactPerson: '欧阳雪', department: '西点房', deliveryAddress: '北京市朝阳区建国路 88 号', remark: '进口烘焙原料' },
  { id: 'log-006', orderNo: 'LOG-2026-0006', supplierName: '星空科技服务有限公司', totalAmount: 25000, totalQuantity: 20, status: 'returned', urgency: 'emergency', orderDate: '2026-07-05', expectedDelivery: '2026-07-08', contactPerson: '林星辰', department: 'IT', deliveryAddress: '上海市浦东新区陆家嘴环路 1000 号', remark: '设备维护配件配送后退回' },
]

export function computeLogisticsStats(orders: LogisticsOrder[]) {
  return {
    total: orders.length,
    pending: orders.filter((item) => item.status === 'pending').length,
    inTransit: orders.filter((item) => item.status === 'in_transit').length,
    delivered: orders.filter((item) => item.status === 'delivered').length,
    urgentCount: orders.filter((item) => item.urgency !== 'normal').length,
    totalAmount: orders.reduce((sum, item) => sum + item.totalAmount, 0),
  }
}

export function filterLogisticsOrders(
  orders: LogisticsOrder[],
  activeStatus: LogisticsOrderStatus | 'all',
  searchText: string,
) {
  return orders.filter((item) => {
    if (activeStatus !== 'all' && item.status !== activeStatus) return false
    if (!searchText) return true
    const query = searchText.toLowerCase()
    return (
      item.orderNo.toLowerCase().includes(query) ||
      item.supplierName.toLowerCase().includes(query) ||
      item.contactPerson.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query)
    )
  })
}

export async function loadLogisticsSnapshot(): Promise<LogisticsSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-logistics-snapshot',
    orders: LOGISTICS_ORDERS,
    generatedAt: new Date().toISOString(),
  }
}
