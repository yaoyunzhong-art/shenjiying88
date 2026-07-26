export type FeedbackType = 'complaint' | 'suggestion' | 'praise' | 'inquiry'
export type FeedbackStatus = 'pending' | 'processing' | 'resolved'
export type FeedbackTab = 'all' | 'pending' | 'processing' | 'resolved'
export type ReplyTab = 'all' | 'unhandled' | 'handled' | 'replied'

export interface FeedbackItem {
  id: string
  customerName: string
  storeName: string
  type: FeedbackType
  rating: number
  content: string
  createdAt: string
  status: FeedbackStatus
  handler?: string
  remark?: string
}

export interface FeedbackSnapshotDelivery {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-feedback-snapshot'
  feedbacks: FeedbackItem[]
  generatedAt: string
}

export const REPLY_TABS: { key: ReplyTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unhandled', label: '未处理' },
  { key: 'handled', label: '已处理' },
  { key: 'replied', label: '已回复' },
]

export const FEEDBACK_TABS: { key: FeedbackTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已处理' },
]

export const FEEDBACK_TYPE_MAP: Record<
  FeedbackType,
  { label: string; variant: 'danger' | 'info' | 'success' | 'warning' }
> = {
  complaint: { label: '投诉', variant: 'danger' },
  suggestion: { label: '建议', variant: 'info' },
  praise: { label: '表扬', variant: 'success' },
  inquiry: { label: '咨询', variant: 'warning' },
}

export const FEEDBACK_STATUS_MAP: Record<
  FeedbackStatus,
  { label: string; variant: 'danger' | 'warning' | 'success' }
> = {
  pending: { label: '待处理', variant: 'danger' },
  processing: { label: '处理中', variant: 'warning' },
  resolved: { label: '已处理', variant: 'success' },
}

export const defaultFeedbacks: FeedbackItem[] = [
  { id: '1', customerName: '张三', storeName: '北京路店', type: 'complaint', rating: 2, content: '游戏币机故障，投币后不出游戏币', createdAt: '2026-07-18 14:30', status: 'pending' },
  { id: '2', customerName: '李四', storeName: '天河店', type: 'suggestion', rating: 4, content: '建议增加几台新款娃娃机', createdAt: '2026-07-17 10:00', status: 'processing', handler: '小王', remark: '已反馈采购部' },
  { id: '3', customerName: '王五', storeName: '南山店', type: 'praise', rating: 5, content: '门店服务员态度非常好，主动帮忙兑换礼品', createdAt: '2026-07-16 09:15', status: 'resolved', handler: '小李' },
  { id: '4', customerName: '赵六', storeName: '福田店', type: 'inquiry', rating: 3, content: '请问会员卡怎么充值？可以在线吗？', createdAt: '2026-07-15 16:45', status: 'resolved', handler: '小张', remark: '已回复在线充值方式' },
  { id: '5', customerName: '孙七', storeName: '北京路店', type: 'complaint', rating: 1, content: '周末排队太久了，需要等30分钟', createdAt: '2026-07-18 11:20', status: 'pending' },
  { id: '6', customerName: '周八', storeName: '天河店', type: 'suggestion', rating: 4, content: '建议增加自助充值机，减少人工排队', createdAt: '2026-07-14 08:00', status: 'processing', handler: '小王' },
  { id: '7', customerName: '吴九', storeName: '南山店', type: 'praise', rating: 5, content: '门店装修后环境非常整洁舒适', createdAt: '2026-07-13 20:30', status: 'resolved' },
  { id: '8', customerName: '郑十', storeName: '福田店', type: 'inquiry', rating: 3, content: '请问节假日营业时间有调整吗？', createdAt: '2026-07-12 12:00', status: 'pending' },
]

export function applyReplyTab(items: FeedbackItem[], tab: ReplyTab): FeedbackItem[] {
  if (tab === 'all') return items
  return items.filter((item) => {
    switch (tab) {
      case 'unhandled':
        return item.status === 'pending'
      case 'handled':
        return item.status === 'resolved' && !item.remark
      case 'replied':
        return item.status === 'processing' || (item.status === 'resolved' && Boolean(item.remark))
      default:
        return true
    }
  })
}

export function filterFeedbackItems(
  items: FeedbackItem[],
  replyTab: ReplyTab,
  statusTab: FeedbackTab,
  keyword: string,
  typeFilter: FeedbackType | 'all'
): FeedbackItem[] {
  let result = applyReplyTab(items, replyTab)
  if (statusTab !== 'all') {
    result = result.filter((item) => item.status === statusTab)
  }
  if (keyword.trim()) {
    const normalized = keyword.toLowerCase()
    result = result.filter((item) =>
      [item.customerName, item.storeName, item.content].join(' ').toLowerCase().includes(normalized)
    )
  }
  if (typeFilter !== 'all') {
    result = result.filter((item) => item.type === typeFilter)
  }
  return result
}

export interface FeedbackStats {
  total: number
  pendingCount: number
  processingCount: number
  resolvedCount: number
  unhandledCount: number
  handledCount: number
  repliedCount: number
  monthlyAvgRating: number
}

export function computeFeedbackStats(items: FeedbackItem[]): FeedbackStats {
  const thisMonthItems = items.filter((item) => item.createdAt.startsWith('2026-07'))
  const totalRating = thisMonthItems.reduce((sum, item) => sum + item.rating, 0)
  return {
    total: items.length,
    pendingCount: items.filter((item) => item.status === 'pending').length,
    processingCount: items.filter((item) => item.status === 'processing').length,
    resolvedCount: items.filter((item) => item.status === 'resolved').length,
    unhandledCount: items.filter((item) => item.status === 'pending').length,
    handledCount: items.filter((item) => item.status === 'resolved' && !item.remark).length,
    repliedCount: items.filter((item) => item.status === 'processing' || (item.status === 'resolved' && Boolean(item.remark))).length,
    monthlyAvgRating: thisMonthItems.length > 0 ? Math.round((totalRating / thisMonthItems.length) * 10) / 10 : 0,
  }
}

function getLatestFeedbackTimestamp(items: FeedbackItem[]): string {
  if (items.length === 0) return '—'
  return items.reduce((latest, item) => (item.createdAt > latest ? item.createdAt : latest), items[0]!.createdAt)
}

export async function loadFeedbackSnapshot(): Promise<FeedbackSnapshotDelivery> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-feedback-snapshot',
    feedbacks: defaultFeedbacks,
    generatedAt: getLatestFeedbackTimestamp(defaultFeedbacks),
  }
}
