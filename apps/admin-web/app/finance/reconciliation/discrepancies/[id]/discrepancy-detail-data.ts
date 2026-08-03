export type DiscrepancyKind =
  | 'amount-mismatch'
  | 'missing-internal'
  | 'missing-external'
  | 'duplicate'

export interface DiscrepancyHistoryEntry {
  action: string
  operator: string
  timestamp: string
  detail?: string
}

export interface DiscrepancyDetail {
  diffKey: string
  kind: DiscrepancyKind
  orderNo?: string
  internalId?: string
  externalId?: string
  internalAmountCents?: number
  externalAmountCents?: number
  diffCents: number
  duplicateIds?: string[]
  note?: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  resolveNote?: string
  internalTransaction?: {
    id: string
    orderNo: string
    amountCents: number
    channel: string
    createdAt: string
    status: string
    customerName: string
  }
  externalTransaction?: {
    id: string
    tradeNo: string
    amountCents: number
    channel: string
    createdAt: string
    feeCents: number
    payerAccount: string
  }
  reconciliationRun?: {
    runId: string
    date: string
    strategy: string
    executedAt: string
    matched: boolean
  }
  history: DiscrepancyHistoryEntry[]
}

export interface DiscrepancyDetailSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  detail: DiscrepancyDetail
  generatedAt: string
  error?: string
}

export function fmtCents(cents: number): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '-' : ''
  return `${sign}¥${(abs / 100).toFixed(2)}`
}

export function diffKindLabel(kind: string): string {
  const map: Record<string, string> = {
    'amount-mismatch': '金额不一致',
    'missing-internal': '外部无匹配',
    'missing-external': '内部无匹配',
    duplicate: '重复记录',
  }
  return map[kind] ?? kind
}

export function diffKindColor(kind: string): string {
  const map: Record<string, string> = {
    'amount-mismatch': 'bg-yellow-100 text-yellow-800',
    'missing-internal': 'bg-red-100 text-red-800',
    'missing-external': 'bg-orange-100 text-orange-800',
    duplicate: 'bg-purple-100 text-purple-800',
  }
  return map[kind] ?? 'bg-gray-100 text-gray-800'
}

export const actionColors: Record<string, { dot: string; line: string; label: string }> = {
  对账发起: { dot: 'bg-blue-500', line: 'bg-blue-200', label: 'text-blue-700' },
  差异标记: { dot: 'bg-yellow-500', line: 'bg-yellow-200', label: 'text-yellow-700' },
  查看: { dot: 'bg-gray-400', line: 'bg-gray-200', label: 'text-gray-600' },
  人工复核: { dot: 'bg-indigo-500', line: 'bg-indigo-200', label: 'text-indigo-700' },
  手动调账: { dot: 'bg-purple-500', line: 'bg-purple-200', label: 'text-purple-700' },
  标记已处理: { dot: 'bg-green-500', line: 'bg-green-200', label: 'text-green-700' },
}

const defaultActionColor = {
  dot: 'bg-gray-400',
  line: 'bg-gray-200',
  label: 'text-gray-600',
}

export function getActionColor(action: string) {
  return actionColors[action] ?? defaultActionColor
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const payload = (await response.json()) as {
    success?: boolean
    message?: string
    data?: T
  }
  if (!payload.success) {
    throw new Error(payload.message || 'API error')
  }
  return payload.data as T
}

export function defaultDetail(id: string): DiscrepancyDetail {
  return {
    diffKey: id,
    kind: 'amount-mismatch',
    orderNo: 'ORD-20260715-0042',
    internalAmountCents: 15800,
    externalAmountCents: 15700,
    diffCents: 100,
    note: '微信手续费差异（0.6% 手续费计入）',
    resolved: false,
    internalTransaction: {
      id: 'txn-internal-001',
      orderNo: 'ORD-20260715-0042',
      amountCents: 15800,
      channel: '微信支付',
      createdAt: '2026-07-15T14:30:00Z',
      status: '已完成',
      customerName: '张三',
    },
    externalTransaction: {
      id: 'txn-external-001',
      tradeNo: 'WX202607151430123456',
      amountCents: 15700,
      channel: '微信支付',
      createdAt: '2026-07-15T14:30:05Z',
      feeCents: 100,
      payerAccount: 'wx_****1234',
    },
    reconciliationRun: {
      runId: 'recon-20260715-001',
      date: '2026-07-15',
      strategy: 'amount+date',
      executedAt: '2026-07-16T02:00:00Z',
      matched: false,
    },
    history: [
      {
        action: '对账发起',
        operator: '系统',
        timestamp: '2026-07-16T02:00:00Z',
        detail: '自动对账 2026-07-15',
      },
      {
        action: '差异标记',
        operator: '系统',
        timestamp: '2026-07-16T02:00:05Z',
        detail: '金额不一致 (¥158.00 vs ¥157.00)',
      },
      {
        action: '查看',
        operator: 'admin',
        timestamp: '2026-07-16T09:15:00Z',
      },
    ],
  }
}

function getDiscrepancyGeneratedAt(detail: DiscrepancyDetail): string {
  const timestamps = [
    detail.resolvedAt,
    detail.internalTransaction?.createdAt,
    detail.externalTransaction?.createdAt,
    detail.reconciliationRun?.executedAt,
    ...detail.history.map((entry) => entry.timestamp),
  ].filter((value): value is string => Boolean(value))

  if (timestamps.length === 0) {
    return '—'
  }

  return timestamps.reduce((latest, timestamp) => (timestamp > latest ? timestamp : latest))
}

export async function loadDiscrepancyDetailSnapshot(
  diffKey: string
): Promise<DiscrepancyDetailSnapshotDelivery> {
  try {
    const detail = await apiFetch<DiscrepancyDetail>(
      `/api/finance/reconciliation/${encodeURIComponent(diffKey)}`
    )
    return {
      deliveryMode: 'api',
      detail,
      generatedAt: getDiscrepancyGeneratedAt(detail),
    }
  } catch {
    const fallbackDetail = defaultDetail(diffKey || 'unknown')
    return {
      deliveryMode: 'fallback',
      detail: fallbackDetail,
      generatedAt: getDiscrepancyGeneratedAt(fallbackDetail),
      error: '对账差异详情实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}

export async function submitDiscrepancyAdjustment(
  diffKey: string,
  amountCents: number,
  note: string
): Promise<DiscrepancyHistoryEntry> {
  if (!diffKey) {
    throw new Error('缺少差异ID')
  }
  if (!amountCents) {
    throw new Error('调账金额不能为空')
  }

  await apiFetch<null>(`/api/finance/reconciliation/${encodeURIComponent(diffKey)}/adjust`, {
    method: 'POST',
    body: JSON.stringify({ amountCents, note }),
  })

  return {
    action: '手动调账',
    operator: 'admin',
    timestamp: new Date().toISOString(),
    detail: `调账 ${fmtCents(amountCents)}${note ? ` · ${note}` : ''}`,
  }
}

export async function resolveDiscrepancy(
  diffKey: string,
  note: string
): Promise<Pick<DiscrepancyDetail, 'resolved' | 'resolvedAt' | 'resolvedBy' | 'resolveNote'>> {
  if (!diffKey) {
    throw new Error('缺少差异ID')
  }

  await apiFetch<null>(`/api/finance/reconciliation/${encodeURIComponent(diffKey)}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolvedBy: 'admin', note }),
  })

  return {
    resolved: true,
    resolvedAt: new Date().toISOString(),
    resolvedBy: 'admin',
    resolveNote: note,
  }
}
