export interface StoreOrder {
  id: string
  customer: string
  items: string
  amount: number
  method: string
  status: 'completed' | 'pending' | 'refunded' | 'cancelled'
  time: string
  note?: string
  contact?: string
}

export interface StoreOrdersSnapshotDelivery {
  deliveryMode: 'mock'
  storeId: string
  orders: StoreOrder[]
  generatedAt: string
}

export const DEFAULT_STORE_ORDERS: StoreOrder[] = [
  {
    id: 'ORD-001',
    customer: '张明',
    items: '游戏套餐x1',
    amount: 168,
    method: '微信',
    status: 'completed',
    time: '2026-07-12 14:30',
    contact: '138****1234',
  },
  {
    id: 'ORD-002',
    customer: '李芳',
    items: '游戏币x50',
    amount: 85,
    method: '支付宝',
    status: 'completed',
    time: '2026-07-12 13:15',
  },
  {
    id: 'ORD-003',
    customer: '王强',
    items: '充值200',
    amount: 200,
    method: '微信',
    status: 'completed',
    time: '2026-07-12 12:00',
  },
  {
    id: 'ORD-004',
    customer: '赵丽',
    items: '生日派对套餐',
    amount: 1280,
    method: '刷卡',
    status: 'pending',
    time: '2026-07-12 10:00',
    note: '待确认库存',
    contact: '139****5678',
  },
  {
    id: 'ORD-005',
    customer: '刘伟',
    items: 'VR体验30min',
    amount: 88,
    method: '支付宝',
    status: 'completed',
    time: '2026-07-11 20:30',
  },
  {
    id: 'ORD-006',
    customer: '陈静',
    items: '饮品x3',
    amount: 45,
    method: '现金',
    status: 'refunded',
    time: '2026-07-11 19:00',
    note: '已退款-重复收费',
  },
  {
    id: 'ORD-007',
    customer: '杨磊',
    items: '台球2h',
    amount: 60,
    method: '微信',
    status: 'completed',
    time: '2026-07-11 18:00',
  },
  {
    id: 'ORD-008',
    customer: '黄敏',
    items: '会员充值500',
    amount: 500,
    method: '支付宝',
    status: 'completed',
    time: '2026-07-11 16:30',
  },
  {
    id: 'ORD-009',
    customer: '周杰',
    items: '游戏币x100+饮品',
    amount: 185,
    method: '微信',
    status: 'cancelled',
    time: '2026-07-11 15:00',
    note: '用户取消',
  },
  {
    id: 'ORD-010',
    customer: '吴芳',
    items: '会员充值1000',
    amount: 1000,
    method: '微信',
    status: 'completed',
    time: '2026-07-11 14:00',
  },
  {
    id: 'ORD-011',
    customer: '郑鑫',
    items: '游戏币x200',
    amount: 340,
    method: '支付宝',
    status: 'pending',
    time: '2026-07-11 12:30',
    note: '待支付确认',
  },
  {
    id: 'ORD-012',
    customer: '孙丽',
    items: '生日派对套餐B',
    amount: 880,
    method: '微信',
    status: 'refunded',
    time: '2026-07-10 18:00',
    note: '退款-场地冲突',
  },
]

export async function loadStoreOrdersSnapshot(
  storeId: string
): Promise<StoreOrdersSnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    storeId,
    orders: DEFAULT_STORE_ORDERS,
    generatedAt: new Date().toISOString(),
  }
}
