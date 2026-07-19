'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

// ─── 类型定义 ──────────────────────────────────────

interface DiscrepancyDetail {
  diffKey: string
  kind: 'amount-mismatch' | 'missing-internal' | 'missing-external' | 'duplicate'
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
  // 扩展详情
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
  // 对账快照
  reconciliationRun?: {
    runId: string
    date: string
    strategy: string
    executedAt: string
    matched: boolean
  }
  // 操作日志
  history: Array<{
    action: string
    operator: string
    timestamp: string
    detail?: string
  }>
}

// ── 工具 ──

function fmtCents(cents: number): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '-' : ''
  return `${sign}¥${(abs / 100).toFixed(2)}`
}

function diffKindLabel(kind: string): string {
  const map: Record<string, string> = {
    'amount-mismatch': '金额不一致',
    'missing-internal': '外部无匹配',
    'missing-external': '内部无匹配',
    'duplicate': '重复记录',
  }
  return map[kind] ?? kind
}

function diffKindColor(kind: string): string {
  const map: Record<string, string> = {
    'amount-mismatch': 'bg-yellow-100 text-yellow-800',
    'missing-internal': 'bg-red-100 text-red-800',
    'missing-external': 'bg-orange-100 text-orange-800',
    'duplicate': 'bg-purple-100 text-purple-800',
  }
  return map[kind] ?? 'bg-gray-100 text-gray-800'
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data as T
}

// ── 默认样本数据 ──

function defaultDetail(id: string): DiscrepancyDetail {
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
      { action: '对账发起', operator: '系统', timestamp: '2026-07-16T02:00:00Z', detail: '自动对账 2026-07-15' },
      { action: '差异标记', operator: '系统', timestamp: '2026-07-16T02:00:05Z', detail: '金额不一致 (¥158.00 vs ¥157.00)' },
      { action: '查看', operator: 'admin', timestamp: '2026-07-16T09:15:00Z' },
    ],
  }
}

// ── 操作类型颜色映射 ──

const actionColors: Record<string, { dot: string; line: string; label: string }> = {
  '对账发起':      { dot: 'bg-blue-500', line: 'bg-blue-200',  label: 'text-blue-700' },
  '差异标记':      { dot: 'bg-yellow-500', line: 'bg-yellow-200', label: 'text-yellow-700' },
  '查看':          { dot: 'bg-gray-400', line: 'bg-gray-200',  label: 'text-gray-600' },
  '人工复核':      { dot: 'bg-indigo-500', line: 'bg-indigo-200', label: 'text-indigo-700' },
  '手动调账':      { dot: 'bg-purple-500', line: 'bg-purple-200', label: 'text-purple-700' },
  '标记已处理':    { dot: 'bg-green-500', line: 'bg-green-200',  label: 'text-green-700' },
}

const defaultActionColor = { dot: 'bg-gray-400', line: 'bg-gray-200', label: 'text-gray-600' }

function getActionColor(action: string) {
  return actionColors[action] ?? defaultActionColor
}

// ── 对账日志时间线组件 ──

function OperationLogTimeline({ history }: { history: DiscrepancyDetail['history'] }) {
  return (
    <div className="bg-white border rounded-lg p-5">
      <h3 className="text-sm font-medium text-gray-700 mb-4">操作日志</h3>
      {history.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">暂无操作记录</p>
      ) : (
        <div className="relative">
          {history.map((h, i) => {
            const colors = getActionColor(h.action)
            return (
              <div key={h.timestamp + i} className="flex items-stretch gap-3 pb-5 relative">
                {/* 左侧时间线 */}
                <div className="flex flex-col items-center min-w-[1.25rem]">
                  <div className={`w-3 h-3 rounded-full ${colors.dot} ring-2 ring-white z-10`} />
                  {i < history.length - 1 && (
                    <div className={`w-0.5 flex-1 ${colors.line} -mt-0.5`} />
                  )}
                </div>
                {/* 右侧内容 */}
                <div className="flex-1 min-w-0 -mt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${colors.label}`}>{h.action}</span>
                    <span className="text-xs text-gray-400">
                      {h.operator} · {new Date(h.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {h.detail && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{h.detail}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 主组件 ──

export default function DiscrepancyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const diffKey = typeof params.id === 'string' ? params.id : ''

  const [detail, setDetail] = useState<DiscrepancyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)

  // 手动调账
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [adjustmentAmount, setAdjustmentAmount] = useState<number | ''>('')
  const [adjustmentNote, setAdjustmentNote] = useState('')
  const [adjusting, setAdjusting] = useState(false)

  const loadDetail = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<DiscrepancyDetail>(`/api/finance/reconciliation/${encodeURIComponent(diffKey)}`)
      setDetail(data)
    } catch {
      // Fallback for offline/demo
      setDetail(defaultDetail(diffKey || 'unknown'))
    } finally {
      setLoading(false)
    }
  }, [diffKey])

  useEffect(() => { loadDetail() }, [loadDetail])

  const handleAdjustment = async () => {
    if (!detail || adjustmentAmount === '' || Number(adjustmentAmount) === 0) return
    setAdjusting(true)
    try {
      const cents = Number(adjustmentAmount)
      await apiFetch(`/api/finance/reconciliation/${encodeURIComponent(diffKey)}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ amountCents: cents, note: adjustmentNote }),
      })
      const newEntry = {
        action: '手动调账',
        operator: 'admin',
        timestamp: new Date().toISOString(),
        detail: `调账 ${fmtCents(cents)}${adjustmentNote ? ` · ${adjustmentNote}` : ''}`,
      }
      setDetail({ ...detail, history: [...detail.history, newEntry] })
      setAdjustmentAmount('')
      setAdjustmentNote('')
      setShowAdjustment(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAdjusting(false)
    }
  }

  const handleResolve = async () => {
    if (!detail) return
    setResolving(true)
    try {
      await apiFetch(`/api/finance/reconciliation/${encodeURIComponent(diffKey)}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolvedBy: 'admin', note: resolveNote }),
      })
      setDetail({ ...detail, resolved: true, resolvedAt: new Date().toISOString(), resolvedBy: 'admin', resolveNote })
      setResolveNote('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setResolving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载差异详情...</span>
      </div>
    )
  }

  if (error && !detail) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">加载失败</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button onClick={loadDetail} className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            重试
          </button>
        </div>
      </div>
    )
  }

  if (!detail) return null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* 导航和标题 */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            差异详情 · <span className="font-mono">{detail.orderNo || detail.diffKey}</span>
          </h1>
          <p className="text-sm text-gray-500">
            对账日期 {detail.reconciliationRun?.date || '-'} · {diffKindLabel(detail.kind)}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${diffKindColor(detail.kind)}`}>
            {diffKindLabel(detail.kind)}
          </span>
          <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
            detail.resolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {detail.resolved ? '已处理' : '待处理'}
          </span>
        </div>
      </div>

      {/* 差异概览统计条 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">总差额</p>
          <p className={`text-lg font-bold ${detail.diffCents !== 0 ? 'text-red-700' : 'text-blue-900'}`}>
            {fmtCents(detail.diffCents)}
          </p>
        </div>
        <div className={`bg-gradient-to-br rounded-lg border p-4 ${detail.resolved ? 'from-green-50 to-green-100 border-green-200' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
          <p className={`text-xs font-medium mb-1 ${detail.resolved ? 'text-green-600' : 'text-gray-400'}`}>已处理</p>
          <p className={`text-lg font-bold ${detail.resolved ? 'text-green-900' : 'text-gray-300'}`}>
            {detail.resolved ? '1' : '0'}
          </p>
        </div>
        <div className={`bg-gradient-to-br rounded-lg border p-4 ${!detail.resolved ? 'from-yellow-50 to-yellow-100 border-yellow-200' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
          <p className={`text-xs font-medium mb-1 ${!detail.resolved ? 'text-yellow-600' : 'text-gray-400'}`}>未处理</p>
          <p className={`text-lg font-bold ${!detail.resolved ? 'text-yellow-900' : 'text-gray-300'}`}>
            {detail.resolved ? '0' : '1'}
          </p>
        </div>
        <div className={`bg-gradient-to-br rounded-lg border p-4 ${
          detail.kind === 'missing-internal' || detail.kind === 'missing-external'
            ? 'from-red-50 to-red-100 border-red-200'
            : detail.kind === 'duplicate'
              ? 'from-purple-50 to-purple-100 border-purple-200'
              : 'from-gray-50 to-gray-100 border-gray-200'
        }`}>
          <p className={`text-xs font-medium mb-1 ${
            detail.kind === 'missing-internal' || detail.kind === 'missing-external'
              ? 'text-red-600'
              : detail.kind === 'duplicate'
                ? 'text-purple-600'
                : 'text-gray-500'
          }`}>异常</p>
          <p className={`text-lg font-bold ${
            detail.kind === 'missing-internal' || detail.kind === 'missing-external'
              ? 'text-red-900'
              : detail.kind === 'duplicate'
                ? 'text-purple-900'
                : 'text-gray-400'
          }`}>{diffKindLabel(detail.kind)}</p>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 差异金额卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-5">
          <p className="text-sm text-gray-500 mb-1">内部金额</p>
          <p className="text-xl font-bold">{detail.internalAmountCents != null ? fmtCents(detail.internalAmountCents) : '-'}</p>
          <p className="text-xs text-gray-400 mt-1">订单金额（含手续费）</p>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <p className="text-sm text-gray-500 mb-1">外部金额</p>
          <p className="text-xl font-bold">{detail.externalAmountCents != null ? fmtCents(detail.externalAmountCents) : '-'}</p>
          <p className="text-xs text-gray-400 mt-1">渠道结算金额</p>
        </div>
        <div className={`bg-white border rounded-lg p-5 ${detail.diffCents !== 0 ? 'border-red-200' : ''}`}>
          <p className="text-sm text-gray-500 mb-1">差异金额</p>
          <p className={`text-xl font-bold ${detail.diffCents !== 0 ? 'text-red-600' : 'text-green-600'}`}>
            {fmtCents(detail.diffCents)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {detail.diffCents > 0 ? '内部多出' : detail.diffCents < 0 ? '外部多出' : '完全匹配'}
          </p>
        </div>
      </div>

      {/* 内部交易详情 */}
      {detail.internalTransaction && (
        <div className="bg-white border rounded-lg p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3">内部交易信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">交易号:</span> <span className="font-mono">{detail.internalTransaction.orderNo}</span></div>
            <div><span className="text-gray-500">内部ID:</span> <span className="font-mono">{detail.internalTransaction.id}</span></div>
            <div><span className="text-gray-500">金额:</span> <span className="font-medium">{fmtCents(detail.internalTransaction.amountCents)}</span></div>
            <div><span className="text-gray-500">支付渠道:</span> {detail.internalTransaction.channel}</div>
            <div><span className="text-gray-500">客户:</span> {detail.internalTransaction.customerName}</div>
            <div><span className="text-gray-500">状态:</span> {detail.internalTransaction.status}</div>
            <div><span className="text-gray-500">时间:</span> {new Date(detail.internalTransaction.createdAt).toLocaleString('zh-CN')}</div>
          </div>
        </div>
      )}

      {/* 外部交易详情 */}
      {detail.externalTransaction && (
        <div className="bg-white border rounded-lg p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3">外部交易信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">渠道单号:</span> <span className="font-mono">{detail.externalTransaction.tradeNo}</span></div>
            <div><span className="text-gray-500">渠道:</span> {detail.externalTransaction.channel}</div>
            <div><span className="text-gray-500">金额:</span> <span className="font-medium">{fmtCents(detail.externalTransaction.amountCents)}</span></div>
            <div><span className="text-gray-500">手续费:</span> {detail.externalTransaction.feeCents ? fmtCents(detail.externalTransaction.feeCents) : '-'}</div>
            <div><span className="text-gray-500">付款账户:</span> {detail.externalTransaction.payerAccount}</div>
            <div><span className="text-gray-500">时间:</span> {new Date(detail.externalTransaction.createdAt).toLocaleString('zh-CN')}</div>
          </div>
        </div>
      )}

      {/* 对账快照 */}
      {detail.reconciliationRun && (
        <div className="bg-white border rounded-lg p-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3">对账快照</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">对账批次:</span> <span className="font-mono">{detail.reconciliationRun.runId}</span></div>
            <div><span className="text-gray-500">对账日期:</span> {detail.reconciliationRun.date}</div>
            <div><span className="text-gray-500">匹配策略:</span> {detail.reconciliationRun.strategy}</div>
            <div><span className="text-gray-500">执行时间:</span> {new Date(detail.reconciliationRun.executedAt).toLocaleString('zh-CN')}</div>
            <div><span className="text-gray-500">匹配结果:</span>
              <span className={`ml-1 ${detail.reconciliationRun.matched ? 'text-green-600' : 'text-yellow-600'}`}>
                {detail.reconciliationRun.matched ? '已匹配' : '未匹配'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 对账日志时间线 */}
      <OperationLogTimeline history={detail.history} />

      {/* 手动调账（可折叠） */}
      <div className="bg-white border rounded-lg p-5">
        <button
          onClick={() => setShowAdjustment(!showAdjustment)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-sm font-medium text-gray-700">手动调账</h3>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${showAdjustment ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdjustment && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">调整金额（分）</label>
              <input
                type="number"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="输入金额（单位：分）"
                className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
              />
              {adjustmentAmount !== '' && (
                <p className="text-xs text-gray-400 mt-1">
                  金额预览: {fmtCents(Number(adjustmentAmount))}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">备注</label>
              <textarea
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                placeholder="输入调账备注（可选）"
                className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAdjustment}
                disabled={adjusting || adjustmentAmount === '' || Number(adjustmentAmount) === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                {adjusting ? '提交中...' : '提交调账'}
              </button>
              <button
                onClick={() => {
                  setShowAdjustment(false)
                  setAdjustmentAmount('')
                  setAdjustmentNote('')
                }}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 备注与处理 */}
      <div className="bg-white border rounded-lg p-5">
        <h3 className="text-sm font-medium text-gray-700 mb-3">差异说明</h3>
        <p className="text-sm text-gray-600 mb-4">{detail.note || '无备注'}</p>

        {detail.resolved ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">已处理</p>
            {detail.resolvedBy && (
              <p className="text-xs text-green-600 mt-1">处理人: {detail.resolvedBy}</p>
            )}
            {detail.resolvedAt && (
              <p className="text-xs text-green-600">处理时间: {new Date(detail.resolvedAt).toLocaleString('zh-CN')}</p>
            )}
            {detail.resolveNote && (
              <p className="text-xs text-green-600 mt-1">备注: {detail.resolveNote}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="输入处理备注（可选）"
              className="border border-gray-300 rounded px-3 py-2 w-full text-sm"
              rows={2}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {resolving ? '处理中...' : '标记已处理'}
              </button>
              <button
                onClick={() => {
                  // 主动匹配重试
                  router.push('/finance/reconciliation')
                }}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                返回对账列表
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
