'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  FinanceDetailSnapshotDelivery,
  PaymentDetail,
  PaymentStatus,
  RefundRecord,
  RefundStatus,
} from './finance-detail-data'

const STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['SUCCESS', 'FAILED'],
  SUCCESS: ['REFUNDED'],
  FAILED: [],
  REFUNDED: [],
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: '待支付',
  SUCCESS: '支付成功',
  FAILED: '支付失败',
  REFUNDED: '已退款',
}

const STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: '#fef3c7',
  SUCCESS: '#d1fae5',
  FAILED: '#fee2e2',
  REFUNDED: '#e5e7eb',
}

const STATUS_TEXT_COLORS: Record<PaymentStatus, string> = {
  PENDING: '#92400e',
  SUCCESS: '#065f46',
  FAILED: '#991b1b',
  REFUNDED: '#374151',
}

const METHOD_LABEL: Record<PaymentDetail['method'], string> = {
  WECHAT: '微信支付',
  ALIPAY: '支付宝',
  CARD: '银行卡',
  CASH: '现金',
  BALANCE: '余额',
}

const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  REQUESTED: '退款申请',
  APPROVED: '已审批',
  COMPLETED: '已完成',
  REJECTED: '已拒绝',
}

const REFUND_STATUS_COLORS: Record<RefundStatus, string> = {
  REQUESTED: '#dbeafe',
  APPROVED: '#fef3c7',
  COMPLETED: '#d1fae5',
  REJECTED: '#fee2e2',
}

const REFUND_STATUS_TEXT_COLORS: Record<RefundStatus, string> = {
  REQUESTED: '#1e40af',
  APPROVED: '#92400e',
  COMPLETED: '#065f46',
  REJECTED: '#991b1b',
}

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

function formatAmount(cents: number, currency = 'CNY'): string {
  const yuan = (cents / 100).toFixed(2)
  return currency === 'CNY' ? `¥${yuan}` : `${currency} ${yuan}`
}

function formatDate(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    return iso
  }

  return parsed.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function FinanceDetailClient({
  snapshot,
}: {
  snapshot: FinanceDetailSnapshotDelivery
}) {
  const router = useRouter()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [payment, setPayment] = useState<PaymentDetail>(snapshot.payment)
  const [refunds, setRefunds] = useState<RefundRecord[]>(snapshot.refunds)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [confirmAction, setConfirmAction] = useState<{
    target: PaymentStatus
    label: string
  } | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    transactionId: snapshot.payment.transactionId ?? '',
    payerName: snapshot.payment.payerName ?? '',
    payerPhone: snapshot.payment.payerPhone ?? '',
    remark: snapshot.payment.remark ?? '',
  })

  useEffect(() => {
    setPayment(snapshot.payment)
    setRefunds(snapshot.refunds)
    setEditing(false)
    setConfirmAction(null)
    setEditForm({
      transactionId: snapshot.payment.transactionId ?? '',
      payerName: snapshot.payment.payerName ?? '',
      payerPhone: snapshot.payment.payerPhone ?? '',
      remark: snapshot.payment.remark ?? '',
    })
  }, [snapshot])

  const addToast = useCallback((message: string, type: ToastItem['type']) => {
    const toastId = Date.now()
    setToasts((prev) => [...prev, { id: toastId, message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toastId))
    }, 2400)
  }, [])

  const availableTransitions = useMemo(
    () => STATUS_TRANSITIONS[payment.status] ?? [],
    [payment.status]
  )

  const handleStatusChange = useCallback(
    (target: PaymentStatus) => {
      setConfirmAction(null)
      setPayment((prev) => ({
        ...prev,
        status: target,
        version: prev.version + 1,
        updatedAt: new Date().toISOString(),
      }))
      addToast(`支付单 ${payment.id} 状态已变更为 ${STATUS_LABEL[target]}`, 'success')
    },
    [addToast, payment.id]
  )

  const handleSave = useCallback(() => {
    setPayment((prev) => ({
      ...prev,
      transactionId: editForm.transactionId || prev.transactionId,
      payerName: editForm.payerName || prev.payerName,
      payerPhone: editForm.payerPhone || prev.payerPhone,
      remark: editForm.remark || prev.remark,
      version: prev.version + 1,
      updatedAt: new Date().toISOString(),
    }))
    setEditing(false)
    addToast('支付详情编辑信息已保存', 'success')
  }, [addToast, editForm])

  const handleDelete = useCallback(() => {
    addToast(`支付单 ${payment.id} 已标记删除并返回列表`, 'info')
    window.setTimeout(() => router.push('/finance'), 300)
  }, [addToast, payment.id, router])

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 16, fontSize: 14, color: '#6b7280' }}>
          <a
            href="/finance"
            onClick={(event) => {
              event.preventDefault()
              router.push('/finance')
            }}
            style={{ color: '#3b82f6', textDecoration: 'none', cursor: 'pointer' }}
          >
            财务管理
          </a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#111827' }}>支付详情</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>支付详情</h1>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              ID: {payment.id} | Version: {payment.version} | 幂等键: {payment.idempotencyKey} | 当前数据源:{' '}
              {snapshot.sourceLabel}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleRefresh()}
              disabled={isRefreshing}
              style={{
                padding: '8px 20px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </button>
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#10b981',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  取消
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: '1px solid #fca5a5',
                    background: 'white',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  删除
                </button>
              </>
            )}
          </div>
        </div>

        {snapshot.error && (
          <div
            style={{
              marginBottom: 24,
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#92400e',
              fontSize: 13,
            }}
          >
            {snapshot.error}
          </div>
        )}

        {availableTransitions.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 24,
              padding: 16,
              background: '#f9fafb',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>状态操作:</span>
            {availableTransitions.map((target) => (
              <button
                key={target}
                type="button"
                onClick={() => setConfirmAction({ target, label: STATUS_LABEL[target] })}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background:
                    target === 'SUCCESS'
                      ? '#10b981'
                      : target === 'FAILED'
                        ? '#ef4444'
                        : '#f59e0b',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {STATUS_LABEL[target]}
              </button>
            ))}
            <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
              <strong>当前:</strong>{' '}
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: STATUS_COLORS[payment.status],
                  color: STATUS_TEXT_COLORS[payment.status],
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {STATUS_LABEL[payment.status]}
              </span>
            </span>
          </div>
        )}

        <div
          style={{
            background: 'white',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb',
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            基本信息
          </div>
          <div style={{ padding: 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
              }}
            >
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>支付单号</label>
                <span style={{ fontSize: 14, fontFamily: 'monospace' }}>{payment.id}</span>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>订单编号</label>
                <span style={{ fontSize: 14, fontFamily: 'monospace' }}>{payment.orderId}</span>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>支付金额</label>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>
                  {formatAmount(payment.amountCents, payment.currency)}
                </span>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>支付方式</label>
                <span style={{ fontSize: 14 }}>{METHOD_LABEL[payment.method]}</span>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>状态</label>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 4,
                    background: STATUS_COLORS[payment.status],
                    color: STATUS_TEXT_COLORS[payment.status],
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {STATUS_LABEL[payment.status]}
                </span>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>交易流水号</label>
                <span style={{ fontSize: 14, fontFamily: 'monospace' }}>{payment.transactionId || '-'}</span>
              </div>
              {editing ? (
                <>
                  <div>
                    <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>付款人姓名</label>
                    <input
                      value={editForm.payerName}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, payerName: event.target.value }))
                      }
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 4,
                        border: '1px solid #d1d5db',
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>付款人手机</label>
                    <input
                      value={editForm.payerPhone}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, payerPhone: event.target.value }))
                      }
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 4,
                        border: '1px solid #d1d5db',
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>备注</label>
                    <textarea
                      value={editForm.remark}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, remark: event.target.value }))
                      }
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 4,
                        border: '1px solid #d1d5db',
                        fontSize: 14,
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>付款人姓名</label>
                    <span style={{ fontSize: 14 }}>{payment.payerName || '-'}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>付款人手机</label>
                    <span style={{ fontSize: 14 }}>{payment.payerPhone || '-'}</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>备注</label>
                    <span style={{ fontSize: 14 }}>{payment.remark || '-'}</span>
                  </div>
                </>
              )}
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>创建时间</label>
                <span style={{ fontSize: 14 }}>{formatDate(payment.createdAt)}</span>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>更新时间</label>
                <span style={{ fontSize: 14 }}>{formatDate(payment.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'white',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb',
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            关联退款 ({refunds.length})
          </div>
          {refunds.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                  <th style={{ padding: 12, fontSize: 13 }}>退款单号</th>
                  <th style={{ padding: 12, fontSize: 13 }}>金额</th>
                  <th style={{ padding: 12, fontSize: 13 }}>原因</th>
                  <th style={{ padding: 12, fontSize: 13 }}>状态</th>
                  <th style={{ padding: 12, fontSize: 13 }}>请求人</th>
                  <th style={{ padding: 12, fontSize: 13 }}>时间</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 12 }}>{refund.id}</td>
                    <td style={{ padding: 12, fontWeight: 600 }}>{formatAmount(refund.amountCents)}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{refund.reason}</td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: REFUND_STATUS_COLORS[refund.status],
                          color: REFUND_STATUS_TEXT_COLORS[refund.status],
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {REFUND_STATUS_LABEL[refund.status]}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontSize: 13 }}>{refund.requestedBy}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{formatDate(refund.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>暂无退款记录</div>
          )}
        </div>

        <div
          style={{
            padding: 12,
            background: '#f3f4f6',
            borderRadius: 8,
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          <strong>Tenant:</strong> {snapshot.tenantId} | <strong>幂等键:</strong> {payment.idempotencyKey} |{' '}
          <strong>Delivery:</strong> {snapshot.deliveryMode}
        </div>

        {confirmAction && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 1000,
            }}
            onClick={() => setConfirmAction(null)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: 12,
                padding: 24,
                maxWidth: 420,
                width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>确认状态变更</h3>
              <p style={{ color: '#6b7280', margin: '0 0 20px', fontSize: 14 }}>
                将支付单 <strong>{payment.id}</strong> 的状态从 <strong>{STATUS_LABEL[payment.status]}</strong> 变更为{' '}
                <strong>{confirmAction.label}</strong>？
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange(confirmAction.target)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background:
                      confirmAction.target === 'SUCCESS'
                        ? '#10b981'
                        : confirmAction.target === 'FAILED'
                          ? '#ef4444'
                          : '#f59e0b',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  确认变更
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                marginBottom: 8,
                background:
                  toast.type === 'success'
                    ? '#d1fae5'
                    : toast.type === 'error'
                      ? '#fee2e2'
                      : '#dbeafe',
                color:
                  toast.type === 'success'
                    ? '#065f46'
                    : toast.type === 'error'
                      ? '#991b1b'
                      : '#1e40af',
                fontWeight: 500,
                fontSize: 14,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </div>
  )
}
