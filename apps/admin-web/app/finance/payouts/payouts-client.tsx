'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  FinancePayoutsSnapshotDelivery,
  PayoutMethod,
  PayoutRecord,
  PayoutStatus,
} from './payouts-data'

const statusLabel: Record<PayoutStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  PROCESSING: '处理中',
  COMPLETED: '已完成',
  FAILED: '打款失败',
}

function formatMoney(cents: number, currency = 'CNY'): string {
  const amount = (cents / 100).toFixed(2)
  return currency === 'CNY' ? `¥${amount}` : `${currency} ${amount}`
}

function accountLabel(record: PayoutRecord): string {
  if (record.method === 'BANK') return `${record.bankName ?? ''} ${record.bankCardNo ?? ''}`.trim()
  if (record.method === 'ALIPAY') return record.alipayAccount ?? '-'
  return record.wechatAccount ?? '-'
}

export default function FinancePayoutsClient({
  snapshot,
}: {
  snapshot: FinancePayoutsSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [payouts, setPayouts] = useState(snapshot.payouts)
  const [statusFilter, setStatusFilter] = useState<'all' | PayoutStatus>('all')
  const [methodFilter, setMethodFilter] = useState<'all' | PayoutMethod>('all')
  const [localMessage, setLocalMessage] = useState<string | null>(null)

  const filteredPayouts = useMemo(
    () =>
      payouts.filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false
        if (methodFilter !== 'all' && item.method !== methodFilter) return false
        return true
      }),
    [methodFilter, payouts, statusFilter]
  )

  const stats = useMemo(
    () => ({
      totalAmount: payouts.reduce((sum, item) => sum + item.amountCents, 0),
      pendingCount: payouts.filter((item) => item.status === 'PENDING').length,
      processingCount: payouts.filter((item) => item.status === 'PROCESSING').length,
    }),
    [payouts]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">提现管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            提现域尚未接入稳定上游接口，当前以服务端 fallback 快照承载首屏和审核视图。
          </p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        {`deliveryMode: ${snapshot.deliveryMode} · 提现审核与打款状态目前来自本地快照`}
      </div>

      {(snapshot.error || localMessage) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {snapshot.error ?? localMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">提现单总数</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{payouts.length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">提现总额</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(stats.totalAmount)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">待审核</div>
          <div className="mt-2 text-2xl font-semibold text-amber-600">{stats.pendingCount}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">处理中</div>
          <div className="mt-2 text-2xl font-semibold text-sky-600">{stats.processingCount}</div>
        </div>
      </div>

      <section className="rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">提现审核视图</h2>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | PayoutStatus)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">全部状态</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已拒绝</option>
            <option value="PROCESSING">处理中</option>
            <option value="COMPLETED">已完成</option>
            <option value="FAILED">打款失败</option>
          </select>
          <select
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value as 'all' | PayoutMethod)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">全部方式</option>
            <option value="BANK">银行卡</option>
            <option value="ALIPAY">支付宝</option>
            <option value="WECHAT">微信</option>
          </select>
          <div className="ml-auto text-sm text-slate-400">当前展示 {filteredPayouts.length} 条</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="px-3 py-3 font-medium">提现单号</th>
                <th className="px-3 py-3 font-medium">申请人</th>
                <th className="px-3 py-3 font-medium">金额</th>
                <th className="px-3 py-3 font-medium">方式</th>
                <th className="px-3 py-3 font-medium">账户</th>
                <th className="px-3 py-3 font-medium">状态</th>
                <th className="px-3 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((record) => (
                <tr key={record.id} className="border-b last:border-b-0">
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{record.id}</td>
                  <td className="px-3 py-3">{record.applicant}</td>
                  <td className="px-3 py-3 font-medium">{formatMoney(record.amountCents, record.currency)}</td>
                  <td className="px-3 py-3">{record.method}</td>
                  <td className="px-3 py-3 text-slate-500">{accountLabel(record)}</td>
                  <td className="px-3 py-3">{statusLabel[record.status]}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPayouts((current) =>
                            current.map((item) =>
                              item.id === record.id && item.status === 'PENDING'
                                ? {
                                    ...item,
                                    status: 'APPROVED',
                                    reviewer: 'finance-manager',
                                    updatedAt: new Date().toISOString(),
                                    version: item.version + 1,
                                  }
                                : item
                            )
                          )
                          setLocalMessage(`提现单 ${record.id} 已在客户端演示流中标记为通过。`)
                        }}
                        disabled={record.status !== 'PENDING'}
                        className="rounded bg-emerald-50 px-3 py-1 text-xs text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        通过
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPayouts((current) =>
                            current.map((item) =>
                              item.id === record.id && item.status === 'PENDING'
                                ? {
                                    ...item,
                                    status: 'REJECTED',
                                    reviewer: 'finance-manager',
                                    reviewNote: '资料待补充',
                                    updatedAt: new Date().toISOString(),
                                    version: item.version + 1,
                                  }
                                : item
                            )
                          )
                          setLocalMessage(`提现单 ${record.id} 已在客户端演示流中标记为拒绝。`)
                        }}
                        disabled={record.status !== 'PENDING'}
                        className="rounded bg-rose-50 px-3 py-1 text-xs text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        拒绝
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
