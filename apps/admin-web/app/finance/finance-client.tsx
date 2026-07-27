'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type {
  FinanceSnapshotDelivery,
  Payment,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
} from './finance-data'

const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: '待支付',
  SUCCESS: '已支付',
  FAILED: '已失败',
  REFUNDED: '已退款',
}

const refundStatusLabel: Record<RefundStatus, string> = {
  REQUESTED: '待审批',
  APPROVED: '已批准',
  COMPLETED: '已完成',
  REJECTED: '已拒绝',
}

function formatMoney(cents: number, currency = 'CNY'): string {
  const amount = (cents / 100).toFixed(2)
  return currency === 'CNY' ? `¥${amount}` : `${currency} ${amount}`
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN')
}

function buildDraftPayment(method: PaymentMethod): Payment {
  return {
    id: `draft-${Date.now()}`,
    tenantId: 'demo-tenant',
    orderId: `ord-draft-${Date.now().toString().slice(-6)}`,
    amountCents: 3990,
    currency: 'CNY',
    method,
    status: 'PENDING',
    version: 1,
    idempotencyKey: `draft-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
}

export default function FinanceClient({
  snapshot,
}: {
  snapshot: FinanceSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [payments, setPayments] = useState(snapshot.payments)
  const [paymentStatus, setPaymentStatus] = useState<'all' | PaymentStatus>('all')
  const [paymentMethod, setPaymentMethod] = useState<'all' | PaymentMethod>('all')
  const [localNote, setLocalNote] = useState<string | null>(null)

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        if (paymentStatus !== 'all' && payment.status !== paymentStatus) return false
        if (paymentMethod !== 'all' && payment.method !== paymentMethod) return false
        return true
      }),
    [paymentMethod, paymentStatus, payments]
  )

  const paymentSummary = useMemo(
    () => ({
      totalAmount: payments.reduce((sum, item) => sum + item.amountCents, 0),
      pendingCount: payments.filter((item) => item.status === 'PENDING').length,
      refundedCount: payments.filter((item) => item.status === 'REFUNDED').length,
    }),
    [payments]
  )

  const refundSummary = useMemo(
    () => ({
      totalAmount: snapshot.refunds.reduce((sum, item) => sum + item.amountCents, 0),
      totalCount: snapshot.refunds.length,
    }),
    [snapshot.refunds]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">财务管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            支付与退款首屏已切换为服务端快照；交互操作仍以样本模拟为主，便于后续替换真实写链路。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPayments((current) => [buildDraftPayment('WECHAT'), ...current])
              setLocalNote('已在客户端插入一条支付草案样本，用于占位演示创建链路。')
            }}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            插入支付草案
          </button>
          <button
            type="button"
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          snapshot.deliveryMode === 'api'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}
      >
        {`deliveryMode: ${snapshot.deliveryMode} · tenantId: ${snapshot.tenantId}`}
        {snapshot.deliveryMode !== 'api' ? ' · 该页面当前不可作为闭环复签证据' : ''}
      </div>

      {(snapshot.error || localNote) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {snapshot.error ?? localNote}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">支付单总数</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{payments.length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">支付总额</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {formatMoney(paymentSummary.totalAmount)}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">待支付</div>
          <div className="mt-2 text-2xl font-semibold text-amber-600">{paymentSummary.pendingCount}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">已退款</div>
          <div className="mt-2 text-2xl font-semibold text-sky-600">{paymentSummary.refundedCount}</div>
        </div>
      </div>

      <section className="rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">支付单</h2>
          <select
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value as 'all' | PaymentStatus)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">全部状态</option>
            <option value="PENDING">待支付</option>
            <option value="SUCCESS">已支付</option>
            <option value="FAILED">已失败</option>
            <option value="REFUNDED">已退款</option>
          </select>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value as 'all' | PaymentMethod)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">全部方式</option>
            <option value="WECHAT">微信</option>
            <option value="ALIPAY">支付宝</option>
            <option value="CARD">银行卡</option>
            <option value="CASH">现金</option>
            <option value="BALANCE">余额</option>
          </select>
          <div className="ml-auto text-sm text-slate-400">当前展示 {filteredPayments.length} 条</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="px-3 py-3 font-medium">支付单号</th>
                <th className="px-3 py-3 font-medium">订单号</th>
                <th className="px-3 py-3 font-medium">金额</th>
                <th className="px-3 py-3 font-medium">方式</th>
                <th className="px-3 py-3 font-medium">状态</th>
                <th className="px-3 py-3 font-medium">版本</th>
                <th className="px-3 py-3 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b last:border-b-0">
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{payment.id}</td>
                  <td className="px-3 py-3">{payment.orderId}</td>
                  <td className="px-3 py-3 font-medium">{formatMoney(payment.amountCents, payment.currency)}</td>
                  <td className="px-3 py-3">{payment.method}</td>
                  <td className="px-3 py-3">{paymentStatusLabel[payment.status]}</td>
                  <td className="px-3 py-3">v{payment.version}</td>
                  <td className="px-3 py-3 text-slate-500">{formatTime(payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">退款单</h2>
          <div className="text-sm text-slate-400">退款总额 {formatMoney(refundSummary.totalAmount)}</div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="px-3 py-3 font-medium">退款单号</th>
                <th className="px-3 py-3 font-medium">关联支付</th>
                <th className="px-3 py-3 font-medium">金额</th>
                <th className="px-3 py-3 font-medium">原因</th>
                <th className="px-3 py-3 font-medium">状态</th>
                <th className="px-3 py-3 font-medium">申请人</th>
                <th className="px-3 py-3 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.refunds.map((refund) => (
                <tr key={refund.id} className="border-b last:border-b-0">
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{refund.id}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-700">{refund.paymentId}</td>
                  <td className="px-3 py-3 font-medium">{formatMoney(refund.amountCents)}</td>
                  <td className="px-3 py-3">{refund.reason}</td>
                  <td className="px-3 py-3">{refundStatusLabel[refund.status]}</td>
                  <td className="px-3 py-3">{refund.requestedBy}</td>
                  <td className="px-3 py-3 text-slate-500">{formatTime(refund.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
