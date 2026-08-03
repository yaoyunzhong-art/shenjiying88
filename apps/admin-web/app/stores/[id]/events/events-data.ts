export type EventStatus = 'draft' | 'published' | 'running' | 'completed' | 'cancelled'

export interface StoreEvent {
  id: string
  name: string
  type: string
  date: string
  status: EventStatus
  participants: number
  budget: number
  owner: string
  channel: string
  objective: string
}

export interface EventsDiagnostic {
  id: string
  title: string
  status: 'stable' | 'watch' | 'risk'
  detail: string
}

export interface EventsSummary {
  total: number
  published: number
  running: number
  completed: number
  totalBudget: number
  totalParticipants: number
}

export interface EventsSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'store-events-fallback'
  storeId: string
  events: StoreEvent[]
  summary: EventsSummary
  diagnostics: EventsDiagnostic[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const EVENT_STATUS_META: Record<EventStatus, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  published: { color: 'blue', label: '已发布' },
  running: { color: 'green', label: '进行中' },
  completed: { color: 'purple', label: '已完成' },
  cancelled: { color: 'red', label: '已取消' },
}

export const STORE_EVENTS: StoreEvent[] = [
  {
    id: 'EVT-240701',
    name: '暑期开卡冲刺周',
    type: '会员增长',
    date: '2026-07-29 10:00',
    status: 'published',
    participants: 86,
    budget: 28000,
    owner: '王静',
    channel: '社群 + 短视频',
    objective: '提升暑期储值转化与新客办卡',
  },
  {
    id: 'EVT-240702',
    name: '夜场电竞挑战赛',
    type: '赛事活动',
    date: '2026-07-30 19:30',
    status: 'running',
    participants: 124,
    budget: 18000,
    owner: '陈朗',
    channel: '门店海报 + 会员短信',
    objective: '拉升夜场客流与赛事消费',
  },
  {
    id: 'EVT-240703',
    name: '亲子周末联票',
    type: '亲子营销',
    date: '2026-08-02 14:00',
    status: 'draft',
    participants: 42,
    budget: 12000,
    owner: '徐诺',
    channel: '小程序预约',
    objective: '提升周末家庭客群渗透率',
  },
  {
    id: 'EVT-240704',
    name: '设备焕新体验日',
    type: '品牌活动',
    date: '2026-07-24 15:00',
    status: 'completed',
    participants: 63,
    budget: 9000,
    owner: '沈宁',
    channel: '门店推介',
    objective: '为新设备上线做预热体验',
  },
  {
    id: 'EVT-240705',
    name: '暑期校园合作场',
    type: '异业合作',
    date: '2026-08-05 13:00',
    status: 'cancelled',
    participants: 0,
    budget: 15000,
    owner: '郑琪',
    channel: '校园渠道',
    objective: '尝试校园合作拉新',
  },
]

export function buildEventsSummary(events: StoreEvent[]): EventsSummary {
  return {
    total: events.length,
    published: events.filter((item) => item.status === 'published').length,
    running: events.filter((item) => item.status === 'running').length,
    completed: events.filter((item) => item.status === 'completed').length,
    totalBudget: events.reduce((sum, item) => sum + item.budget, 0),
    totalParticipants: events.reduce((sum, item) => sum + item.participants, 0),
  }
}

export function buildEventsDiagnostics(storeId: string): EventsDiagnostic[] {
  return [
    {
      id: 'events-source',
      title: '活动快照已壳层化',
      status: 'stable',
      detail: `门店 ${storeId} 当前通过 snapshot loader 下发活动台账、预算与状态样本。`,
    },
    {
      id: 'events-approval',
      title: '审批链路待回源',
      status: 'watch',
      detail: '创建活动与发布审批仍处于演示态，尚未接入正式营销审批流。',
    },
    {
      id: 'events-roi',
      title: 'ROI 归因未闭环',
      status: 'risk',
      detail: '活动预算与成单转化仍为本地样本，暂不能作为正式复盘结论。',
    },
  ]
}

export async function loadEventsSnapshot(storeId: string): Promise<EventsSnapshot> {
  const events = STORE_EVENTS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'store-events-fallback',
    storeId,
    events,
    summary: buildEventsSummary(events),
    diagnostics: buildEventsDiagnostics(storeId),
    generatedAt: '2026-07-27T18:35:00.000Z',
    controlPlaneSource: 'loadEventsSnapshot fallback -> STORE_EVENTS + derived summary',
    businessDataSource: 'local event roster samples + derived budget and participant aggregates',
    refreshPath: `EventsPage -> loadEventsSnapshot(${storeId})`,
    note: '当前页面消费本地活动快照，适用于来源态透明化、结构固证与交互演示，不作为正式活动 ROI 复盘证据。',
    error: '门店活动尚未接入正式营销控制面回源，当前展示 fallback 样本快照。',
  }
}
