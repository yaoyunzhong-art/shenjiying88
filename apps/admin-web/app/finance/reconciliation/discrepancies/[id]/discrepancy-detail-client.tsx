'use client'
import { useSnapshotRefresh } from '../../../../components/use-snapshot-refresh'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  diffKindColor,
  diffKindLabel,
  fmtCents,
  getActionColor,
  resolveDiscrepancy,
  submitDiscrepancyAdjustment,
  type DiscrepancyDetailSnapshotDelivery,
} from './discrepancy-detail-data'

export default function DiscrepancyDetailClient({
  snapshot,
}: {
  snapshot: DiscrepancyDetailSnapshotDelivery
}) {
  const router = useRouter()
  const [detail, setDetail] = useState(snapshot.detail)
  const [error, setError] = useState<string | null>(snapshot.error ?? null)
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [adjustmentAmount, setAdjustmentAmount] = useState<number | ''>('')
  const [adjustmentNote, setAdjustmentNote] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const dataSourceLabel = snapshot.deliveryMode === 'api' ? '真实 API' : 'fallback'
  const isReviewable = snapshot.deliveryMode === 'api'

  const handleAdjustment = async () => {
    if (adjustmentAmount === '' || Number(adjustmentAmount) === 0) return
    setAdjusting(true)
    setError(null)
    try {
      const entry = await submitDiscrepancyAdjustment(
        detail.diffKey,
        Number(adjustmentAmount),
        adjustmentNote
      )
      setDetail((current) => ({ ...current, history: [...current.history, entry] }))
      setAdjustmentAmount('')
      setAdjustmentNote('')
      setShowAdjustment(false)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '提交调账失败')
    } finally {
      setAdjusting(false)
    }
  }

  const handleResolve = async () => {
    setResolving(true)
    setError(null)
    try {
      const resolvedState = await resolveDiscrepancy(detail.diffKey, resolveNote)
      setDetail((current) => ({
        ...current,
        ...resolvedState,
        history: [
          ...current.history,
          {
            action: '标记已处理',
            operator: resolvedState.resolvedBy ?? 'admin',
            timestamp: resolvedState.resolvedAt ?? new Date().toISOString(),
            detail: resolvedState.resolveNote || '已完成差异处理',
          },
        ],
      }))
      setResolveNote('')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '处理差异失败')
    } finally {
      setResolving(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            差异详情 · <span className="font-mono">{detail.orderNo || detail.diffKey}</span>
          </h1>
          <p className="text-sm text-gray-500">
            {`对账日期 ${detail.reconciliationRun?.date || '-'} · ${diffKindLabel(detail.kind)} · 当前数据源：${dataSourceLabel}`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className="rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
          <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${diffKindColor(detail.kind)}`}>
            {diffKindLabel(detail.kind)}
          </span>
          <span
            className={`inline-block px-3 py-1 rounded text-sm font-medium ${
              detail.resolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {detail.resolved ? '已处理' : '待处理'}
          </span>
        </div>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          snapshot.deliveryMode === 'api'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-yellow-200 bg-yellow-50 text-yellow-700'
        }`}
      >
        {`deliveryMode: ${snapshot.deliveryMode} · dataSourceLabel: ${dataSourceLabel} · generatedAt: ${snapshot.generatedAt}`}
        {!isReviewable ? ' · 该页面当前不可作为闭环复签证据' : ''}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <p className="mb-1 text-xs font-medium text-blue-600">总差额</p>
          <p className={`text-lg font-bold ${detail.diffCents !== 0 ? 'text-red-700' : 'text-blue-900'}`}>
            {fmtCents(detail.diffCents)}
          </p>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            detail.resolved
              ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100'
              : 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100'
          }`}
        >
          <p className={`mb-1 text-xs font-medium ${detail.resolved ? 'text-green-600' : 'text-gray-400'}`}>
            已处理
          </p>
          <p className={`text-lg font-bold ${detail.resolved ? 'text-green-900' : 'text-gray-300'}`}>
            {detail.resolved ? '1' : '0'}
          </p>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            !detail.resolved
              ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100'
              : 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100'
          }`}
        >
          <p className={`mb-1 text-xs font-medium ${!detail.resolved ? 'text-yellow-600' : 'text-gray-400'}`}>
            未处理
          </p>
          <p className={`text-lg font-bold ${!detail.resolved ? 'text-yellow-900' : 'text-gray-300'}`}>
            {detail.resolved ? '0' : '1'}
          </p>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            detail.kind === 'missing-internal' || detail.kind === 'missing-external'
              ? 'border-red-200 bg-gradient-to-br from-red-50 to-red-100'
              : detail.kind === 'duplicate'
                ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100'
                : 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100'
          }`}
        >
          <p
            className={`mb-1 text-xs font-medium ${
              detail.kind === 'missing-internal' || detail.kind === 'missing-external'
                ? 'text-red-600'
                : detail.kind === 'duplicate'
                  ? 'text-purple-600'
                  : 'text-gray-500'
            }`}
          >
            异常
          </p>
          <p
            className={`text-lg font-bold ${
              detail.kind === 'missing-internal' || detail.kind === 'missing-external'
                ? 'text-red-900'
                : detail.kind === 'duplicate'
                  ? 'text-purple-900'
                  : 'text-gray-400'
            }`}
          >
            {diffKindLabel(detail.kind)}
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-5">
          <p className="mb-1 text-sm text-gray-500">内部金额</p>
          <p className="text-xl font-bold">
            {detail.internalAmountCents != null ? fmtCents(detail.internalAmountCents) : '-'}
          </p>
          <p className="mt-1 text-xs text-gray-400">订单金额（含手续费）</p>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <p className="mb-1 text-sm text-gray-500">外部金额</p>
          <p className="text-xl font-bold">
            {detail.externalAmountCents != null ? fmtCents(detail.externalAmountCents) : '-'}
          </p>
          <p className="mt-1 text-xs text-gray-400">渠道结算金额</p>
        </div>
        <div className={`rounded-lg border bg-white p-5 ${detail.diffCents !== 0 ? 'border-red-200' : ''}`}>
          <p className="mb-1 text-sm text-gray-500">差异金额</p>
          <p className={`text-xl font-bold ${detail.diffCents !== 0 ? 'text-red-600' : 'text-green-600'}`}>
            {fmtCents(detail.diffCents)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {detail.diffCents > 0 ? '内部多出' : detail.diffCents < 0 ? '外部多出' : '完全匹配'}
          </p>
        </div>
      </div>

      {detail.internalTransaction ? (
        <div className="rounded-lg border bg-white p-5">
          <h3 className="mb-3 text-sm font-medium text-gray-700">内部交易信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">交易号:</span>{' '}
              <span className="font-mono">{detail.internalTransaction.orderNo}</span>
            </div>
            <div>
              <span className="text-gray-500">内部ID:</span>{' '}
              <span className="font-mono">{detail.internalTransaction.id}</span>
            </div>
            <div>
              <span className="text-gray-500">金额:</span>{' '}
              <span className="font-medium">{fmtCents(detail.internalTransaction.amountCents)}</span>
            </div>
            <div>
              <span className="text-gray-500">支付渠道:</span> {detail.internalTransaction.channel}
            </div>
            <div>
              <span className="text-gray-500">客户:</span> {detail.internalTransaction.customerName}
            </div>
            <div>
              <span className="text-gray-500">状态:</span> {detail.internalTransaction.status}
            </div>
            <div>
              <span className="text-gray-500">时间:</span>{' '}
              {new Date(detail.internalTransaction.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      ) : null}

      {detail.externalTransaction ? (
        <div className="rounded-lg border bg-white p-5">
          <h3 className="mb-3 text-sm font-medium text-gray-700">外部交易信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">渠道单号:</span>{' '}
              <span className="font-mono">{detail.externalTransaction.tradeNo}</span>
            </div>
            <div>
              <span className="text-gray-500">渠道:</span> {detail.externalTransaction.channel}
            </div>
            <div>
              <span className="text-gray-500">金额:</span>{' '}
              <span className="font-medium">{fmtCents(detail.externalTransaction.amountCents)}</span>
            </div>
            <div>
              <span className="text-gray-500">手续费:</span>{' '}
              {detail.externalTransaction.feeCents
                ? fmtCents(detail.externalTransaction.feeCents)
                : '-'}
            </div>
            <div>
              <span className="text-gray-500">付款账户:</span> {detail.externalTransaction.payerAccount}
            </div>
            <div>
              <span className="text-gray-500">时间:</span>{' '}
              {new Date(detail.externalTransaction.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      ) : null}

      {detail.reconciliationRun ? (
        <div className="rounded-lg border bg-white p-5">
          <h3 className="mb-3 text-sm font-medium text-gray-700">对账快照</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">对账批次:</span>{' '}
              <span className="font-mono">{detail.reconciliationRun.runId}</span>
            </div>
            <div>
              <span className="text-gray-500">对账日期:</span> {detail.reconciliationRun.date}
            </div>
            <div>
              <span className="text-gray-500">匹配策略:</span> {detail.reconciliationRun.strategy}
            </div>
            <div>
              <span className="text-gray-500">执行时间:</span>{' '}
              {new Date(detail.reconciliationRun.executedAt).toLocaleString('zh-CN')}
            </div>
            <div>
              <span className="text-gray-500">匹配结果:</span>
              <span className={`ml-1 ${detail.reconciliationRun.matched ? 'text-green-600' : 'text-yellow-600'}`}>
                {detail.reconciliationRun.matched ? '已匹配' : '未匹配'}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <OperationLogTimeline history={detail.history} />

      <div className="rounded-lg border bg-white p-5">
        <button
          type="button"
          onClick={() => setShowAdjustment((current) => !current)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-sm font-medium text-gray-700">手动调账</h3>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${showAdjustment ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdjustment ? (
          <div className="mt-4 space-y-3 border-t pt-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500">调整金额（分）</label>
              <input
                type="number"
                value={adjustmentAmount}
                onChange={(event) =>
                  setAdjustmentAmount(
                    event.target.value === '' ? '' : Number(event.target.value)
                  )
                }
                placeholder="输入金额（单位：分）"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              {adjustmentAmount !== '' ? (
                <p className="mt-1 text-xs text-gray-400">
                  金额预览: {fmtCents(Number(adjustmentAmount))}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">备注</label>
              <textarea
                value={adjustmentNote}
                onChange={(event) => setAdjustmentNote(event.target.value)}
                placeholder="输入调账备注（可选）"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAdjustment}
                disabled={adjusting || adjustmentAmount === '' || Number(adjustmentAmount) === 0}
                className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {adjusting ? '提交中...' : '提交调账'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdjustment(false)
                  setAdjustmentAmount('')
                  setAdjustmentNote('')
                }}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h3 className="mb-3 text-sm font-medium text-gray-700">差异说明</h3>
        <p className="mb-4 text-sm text-gray-600">{detail.note || '无备注'}</p>

        {detail.resolved ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">已处理</p>
            {detail.resolvedBy ? (
              <p className="mt-1 text-xs text-green-600">处理人: {detail.resolvedBy}</p>
            ) : null}
            {detail.resolvedAt ? (
              <p className="text-xs text-green-600">
                处理时间: {new Date(detail.resolvedAt).toLocaleString('zh-CN')}
              </p>
            ) : null}
            {detail.resolveNote ? (
              <p className="mt-1 text-xs text-green-600">备注: {detail.resolveNote}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={resolveNote}
              onChange={(event) => setResolveNote(event.target.value)}
              placeholder="输入处理备注（可选）"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              rows={2}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolving}
                className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                {resolving ? '处理中...' : '标记已处理'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/finance/reconciliation')}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
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

function OperationLogTimeline({
  history,
}: {
  history: DiscrepancyDetailSnapshotDelivery['detail']['history']
}) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="mb-4 text-sm font-medium text-gray-700">操作日志</h3>
      {history.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">暂无操作记录</p>
      ) : (
        <div className="relative">
          {history.map((entry, index) => {
            const colors = getActionColor(entry.action)
            return (
              <div key={`${entry.timestamp}-${index}`} className="relative flex items-stretch gap-3 pb-5">
                <div className="flex min-w-[1.25rem] flex-col items-center">
                  <div className={`z-10 h-3 w-3 rounded-full ring-2 ring-white ${colors.dot}`} />
                  {index < history.length - 1 ? (
                    <div className={`-mt-0.5 w-0.5 flex-1 ${colors.line}`} />
                  ) : null}
                </div>
                <div className="-mt-0.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-semibold ${colors.label}`}>{entry.action}</span>
                    <span className="text-xs text-gray-400">
                      {entry.operator} · {new Date(entry.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {entry.detail ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{entry.detail}</p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
