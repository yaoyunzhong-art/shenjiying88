export type ReviewStatus = 'pending' | 'replied' | 'hidden'

export interface OrderReviewRecord {
  id: string
  memberName: string
  productName: string
  rating: number
  content: string
  reply: string | null
  status: ReviewStatus
  createdAt: string
}

export interface OrderReviewsSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-order-reviews-snapshot'
  reviews: OrderReviewRecord[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export const ORDER_REVIEW_RECORDS: OrderReviewRecord[] = [
  { id: 'rv-201', memberName: '张伟', productName: '游戏币 100 枚', rating: 5, content: '孩子很喜欢，兑换很顺畅。', reply: '感谢支持，欢迎再来。', status: 'replied', createdAt: '2026-07-27 09:10' },
  { id: 'rv-202', memberName: '李娜', productName: '扭蛋盲盒', rating: 4, content: '内容不错，但补货稍慢。', reply: null, status: 'pending', createdAt: '2026-07-27 08:35' },
  { id: 'rv-203', memberName: '王强', productName: '限定手办', rating: 2, content: '包装有压痕，希望改进。', reply: null, status: 'pending', createdAt: '2026-07-26 21:20' },
  { id: 'rv-204', memberName: '陈静', productName: '会员月卡', rating: 3, content: '整体还可以，活动再丰富些更好。', reply: '已记录建议，后续会持续优化活动。', status: 'replied', createdAt: '2026-07-26 18:40' },
]

export async function loadOrderReviewsSnapshot(): Promise<OrderReviewsSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-order-reviews-snapshot',
    reviews: ORDER_REVIEW_RECORDS,
    generatedAt: '2026-07-27T10:00:00.000Z',
    controlPlaneSource: 'loadOrderReviewsSnapshot -> ORDER_REVIEW_RECORDS',
    businessDataSource: 'local order review sample records',
    refreshPath: 'OrderReviewsPage -> loadOrderReviewsSnapshot',
    note: '当前页面消费本地订单评价快照，适用于结构固证与回复交互演示。',
  }
}
