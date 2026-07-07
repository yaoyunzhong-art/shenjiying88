import { MOCK_CAMPAIGNS, type CampaignItem } from '../campaigns-data'

const TENANT = 'demo-tenant'

type LiveCampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
type LiveCampaignTrigger =
  | 'payment.success'
  | 'member.profile-synced'
  | 'order.created'
  | 'member.activity-recurring'

export interface LiveCampaignPlan {
  planId: string
  tenantContext?: {
    tenantId?: string
    brandId?: string
    storeId?: string
  }
  code: string
  title: string
  description?: string
  status: LiveCampaignStatus
  triggerEvent: LiveCampaignTrigger | string
  conditions: Array<{ type: string; value: unknown }>
  actions: Array<{ kind: string; params?: Record<string, unknown> }>
  priority: number
  scheduledStart?: string
  scheduledEnd?: string
  createdAt: string
  updatedAt: string
}

export type LiveDispatchStatus = 'PENDING' | 'DISPATCHED' | 'FAILED' | 'SKIPPED'

export interface LiveCampaignDispatch {
  dispatchId: string
  planId: string
  actionIndex: number
  tenantContext?: {
    tenantId?: string
    brandId?: string
    storeId?: string
  }
  memberId?: string
  orderId?: string
  paymentId?: string
  triggerEvent: string
  status: LiveDispatchStatus
  errorMessage?: string
  resultRef?: string
  createdAt: string
}

export type DispatchResultKind = 'points' | 'tag' | 'coupon' | 'blindbox' | 'unknown' | 'none'

export interface CampaignDispatchItem {
  dispatchId: string
  planId: string
  actionIndex: number
  actionLabel: string
  status: LiveDispatchStatus
  statusLabel: string
  triggerEvent: string
  memberId?: string
  memberLabel: string
  resultLabel: string
  scopeLabel: string
  orderId?: string
  paymentId?: string
  resultRef?: string
  resultKind: DispatchResultKind
  resultTypeLabel: string
  resultDetailLabel: string
  errorMessage?: string
  createdAtLabel: string
}

function buildDispatchScopeLabel(dispatch: LiveCampaignDispatch): string {
  return (
    dispatch.tenantContext?.storeId ??
    dispatch.tenantContext?.brandId ??
    dispatch.tenantContext?.tenantId ??
    '默认租户'
  )
}

function parseDispatchResult(resultRef?: string): {
  resultKind: DispatchResultKind
  resultTypeLabel: string
  resultDetailLabel: string
} {
  if (!resultRef) {
    return {
      resultKind: 'none',
      resultTypeLabel: '无回执',
      resultDetailLabel: '-'
    }
  }

  if (resultRef.startsWith('points+')) {
    const payload = resultRef.slice('points+'.length)
    const [amount, ...reasonParts] = payload.split(':')
    const reason = reasonParts.join(':')
    return {
      resultKind: 'points',
      resultTypeLabel: '积分发放',
      resultDetailLabel: reason ? `+${amount} 积分 / ${reason}` : `+${amount} 积分`
    }
  }

  if (resultRef.startsWith('tag:')) {
    return {
      resultKind: 'tag',
      resultTypeLabel: '标签推荐',
      resultDetailLabel: resultRef.slice('tag:'.length) || resultRef
    }
  }

  if (
    resultRef.includes('fulfillment') ||
    resultRef.includes('blindbox')
  ) {
    return {
      resultKind: 'blindbox',
      resultTypeLabel: '盲盒发放',
      resultDetailLabel: resultRef
    }
  }

  if (
    resultRef.includes('redemption') ||
    resultRef.includes('coupon')
  ) {
    return {
      resultKind: 'coupon',
      resultTypeLabel: '优惠券发放',
      resultDetailLabel: resultRef
    }
  }

  return {
    resultKind: 'unknown',
    resultTypeLabel: '执行回执',
    resultDetailLabel: resultRef
  }
}

function formatDateOnly(value?: string, fallback = ''): string {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toISOString().slice(0, 10)
}

export function mapLiveStatus(status: LiveCampaignStatus): CampaignItem['status'] {
  switch (status) {
    case 'DRAFT':
      return 'draft'
    case 'SCHEDULED':
      return 'scheduled'
    case 'ACTIVE':
      return 'active'
    case 'PAUSED':
      return 'paused'
    case 'COMPLETED':
      return 'ended'
    default:
      return 'draft'
  }
}

export function mapUiStatusToLive(status: CampaignItem['status']): LiveCampaignStatus {
  switch (status) {
    case 'draft':
      return 'DRAFT'
    case 'scheduled':
      return 'SCHEDULED'
    case 'active':
      return 'ACTIVE'
    case 'paused':
      return 'PAUSED'
    case 'ended':
    case 'archived':
      return 'COMPLETED'
    default:
      return 'DRAFT'
  }
}

export function inferCampaignType(plan: Pick<LiveCampaignPlan, 'triggerEvent' | 'actions'>): CampaignItem['type'] {
  if (plan.actions.some(action => action.kind === 'RECOMMEND_TAG')) {
    return 'cross_sell'
  }
  if (plan.actions.some(action => action.kind === 'ISSUE_COUPON')) {
    return 'promotion'
  }
  if (plan.actions.some(action => action.kind === 'AWARD_POINTS')) {
    return 'retention'
  }
  if (plan.triggerEvent === 'member.profile-synced' || plan.triggerEvent === 'member.activity-recurring') {
    return 'retention'
  }
  if (plan.triggerEvent === 'order.created') {
    return 'new_product'
  }
  return 'promotion'
}

export function inferCampaignChannel(plan: Pick<LiveCampaignPlan, 'conditions'>): CampaignItem['channel'] {
  const types = new Set(plan.conditions.map(condition => condition.type))
  if (types.has('STORE_SCOPE')) {
    return 'offline'
  }
  if (types.has('BRAND_SCOPE')) {
    return 'omni'
  }
  return 'online'
}

export function mapLiveCampaignToItem(plan: LiveCampaignPlan): CampaignItem {
  const startDate = formatDateOnly(plan.scheduledStart, formatDateOnly(plan.createdAt, ''))
  const endDate = formatDateOnly(plan.scheduledEnd, startDate)

  return {
    id: plan.planId,
    code: plan.code,
    name: plan.title,
    type: inferCampaignType(plan),
    channel: inferCampaignChannel(plan),
    status: mapLiveStatus(plan.status),
    budget: 0,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    roi: 0,
    startDate,
    endDate,
    createdBy: plan.tenantContext?.storeId ?? plan.tenantContext?.brandId ?? plan.tenantContext?.tenantId ?? '系统',
    triggerEvent: plan.triggerEvent,
    source: 'live',
    deletionDisabled: true
  }
}

export function mapDispatchStatusLabel(status: LiveDispatchStatus): string {
  switch (status) {
    case 'PENDING':
      return '待执行'
    case 'DISPATCHED':
      return '已下发'
    case 'FAILED':
      return '失败'
    case 'SKIPPED':
      return '已跳过'
    default:
      return '未知'
  }
}

export function mapLiveDispatchToItem(dispatch: LiveCampaignDispatch): CampaignDispatchItem {
  const createdAt = new Date(dispatch.createdAt)
  const createdAtLabel = Number.isNaN(createdAt.getTime())
    ? dispatch.createdAt
    : createdAt.toLocaleString('zh-CN', { hour12: false })
  const parsedResult = parseDispatchResult(dispatch.resultRef)

  return {
    dispatchId: dispatch.dispatchId,
    planId: dispatch.planId,
    actionIndex: dispatch.actionIndex,
    actionLabel: `动作 #${dispatch.actionIndex + 1}`,
    status: dispatch.status,
    statusLabel: mapDispatchStatusLabel(dispatch.status),
    triggerEvent: dispatch.triggerEvent,
    memberId: dispatch.memberId,
    memberLabel: dispatch.memberId ?? '匿名触发',
    resultLabel: dispatch.errorMessage ?? dispatch.resultRef ?? dispatch.paymentId ?? dispatch.orderId ?? '-',
    scopeLabel: buildDispatchScopeLabel(dispatch),
    orderId: dispatch.orderId,
    paymentId: dispatch.paymentId,
    resultRef: dispatch.resultRef,
    resultKind: dispatch.errorMessage ? 'unknown' : parsedResult.resultKind,
    resultTypeLabel: dispatch.errorMessage ? '执行失败' : parsedResult.resultTypeLabel,
    resultDetailLabel: dispatch.errorMessage ?? parsedResult.resultDetailLabel,
    errorMessage: dispatch.errorMessage,
    createdAtLabel
  }
}

function buildHeaders(): HeadersInit {
  return {
    'x-tenant-id': TENANT
  }
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers ?? {})
    },
    cache: 'no-store'
  })
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

export async function loadCampaigns(): Promise<CampaignItem[]> {
  try {
    const livePlans = await requestJson<LiveCampaignPlan[]>('/api/campaigns')
    if (!Array.isArray(livePlans) || livePlans.length === 0) {
      return MOCK_CAMPAIGNS
    }
    return livePlans.map(mapLiveCampaignToItem)
  } catch {
    return MOCK_CAMPAIGNS
  }
}

export async function loadCampaignDetail(id: string): Promise<CampaignItem | null> {
  try {
    const livePlan = await requestJson<LiveCampaignPlan>(`/api/campaigns/${id}`)
    return mapLiveCampaignToItem(livePlan)
  } catch {
    return MOCK_CAMPAIGNS.find(campaign => campaign.id === id) ?? null
  }
}

export async function loadCampaignDispatches(id: string): Promise<CampaignDispatchItem[]> {
  try {
    const liveDispatches = await requestJson<LiveCampaignDispatch[]>(`/api/campaigns/${id}/dispatches`)
    if (!Array.isArray(liveDispatches)) {
      return []
    }
    return liveDispatches.map(mapLiveDispatchToItem)
  } catch {
    return []
  }
}

export async function loadGlobalCampaignDispatches(filter?: {
  memberId?: string
  status?: LiveDispatchStatus
}): Promise<CampaignDispatchItem[]> {
  const query = new URLSearchParams()
  if (filter?.memberId) {
    query.set('memberId', filter.memberId)
  }
  if (filter?.status) {
    query.set('status', filter.status)
  }

  const suffix = query.toString()
  const path = suffix ? `/api/campaigns/dispatches/list?${suffix}` : '/api/campaigns/dispatches/list'

  try {
    const liveDispatches = await requestJson<LiveCampaignDispatch[]>(path)
    if (!Array.isArray(liveDispatches)) {
      return []
    }
    return liveDispatches.map(mapLiveDispatchToItem)
  } catch {
    return []
  }
}

export async function transitionCampaignStatus(
  id: string,
  status: CampaignItem['status']
): Promise<CampaignItem | null> {
  const next = mapUiStatusToLive(status)

  try {
    const updated = await requestJson<LiveCampaignPlan>(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ status: next })
    })
    return mapLiveCampaignToItem(updated)
  } catch {
    const fallback = MOCK_CAMPAIGNS.find(campaign => campaign.id === id)
    return fallback ? { ...fallback, status } : null
  }
}
