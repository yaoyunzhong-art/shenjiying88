/**
 * 支付详情页 — Payment Detail Page (admin-web)
 * B-页面: 详情页 (含编辑/删除/状态流转)
 *
 * 功能:
 *  - 查看支付详情
 *  - 状态流转操作 (PENDING→SUCCESS/FAILED, SUCCESS→REFUNDED)
 *  - 关联退款列表
 *  - 操作确认弹窗
 *  - 返回列表
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  StatusBadge,
} from '@m5/ui';

// ============================================================
// 类型定义
// ============================================================

type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
type PaymentMethod = 'WECHAT' | 'ALIPAY' | 'CARD' | 'CASH' | 'BALANCE';
type RefundStatus = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

interface PaymentDetail {
  id: string;
  tenantId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  version: number;
  idempotencyKey: string;
  transactionId?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  payerName?: string;
  payerPhone?: string;
  remark?: string;
}

interface RefundRecord {
  id: string;
  paymentId: string;
  orderId: string;
  amountCents: number;
  reason: string;
  status: RefundStatus;
  version: number;
  requestedBy: string;
  createdAt: string;
}

// ============================================================
// 状态机: 允许的状态流转
// ============================================================

const STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['SUCCESS', 'FAILED'],
  SUCCESS: ['REFUNDED'],
  FAILED: [],
  REFUNDED: [],
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: '待支付',
  SUCCESS: '支付成功',
  FAILED: '支付失败',
  REFUNDED: '已退款',
};

const STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: '#fef3c7',
  SUCCESS: '#d1fae5',
  FAILED: '#fee2e2',
  REFUNDED: '#e5e7eb',
};

const STATUS_TEXT_COLORS: Record<PaymentStatus, string> = {
  PENDING: '#92400e',
  SUCCESS: '#065f46',
  FAILED: '#991b1b',
  REFUNDED: '#374151',
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  WECHAT: '微信支付',
  ALIPAY: '支付宝',
  CARD: '银行卡',
  CASH: '现金',
  BALANCE: '余额',
};

const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  REQUESTED: '退款申请',
  APPROVED: '已审批',
  COMPLETED: '已完成',
  REJECTED: '已拒绝',
};

const REFUND_STATUS_COLORS: Record<RefundStatus, string> = {
  REQUESTED: '#dbeafe',
  APPROVED: '#fef3c7',
  COMPLETED: '#d1fae5',
  REJECTED: '#fee2e2',
};

const REFUND_STATUS_TEXT_COLORS: Record<RefundStatus, string> = {
  REQUESTED: '#1e40af',
  APPROVED: '#92400e',
  COMPLETED: '#065f46',
  REJECTED: '#991b1b',
};

// ============================================================
// 工具函数
// ============================================================

function formatAmount(cents: number, currency = 'CNY'): string {
  const yuan = (cents / 100).toFixed(2);
  return currency === 'CNY' ? `¥${yuan}` : `${currency} ${yuan}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================
// Mock 数据
// ============================================================

const MOCK_PAYMENT: PaymentDetail = {
  id: 'pay-demo-1',
  tenantId: 'demo-tenant',
  orderId: 'ord-2024-001',
  amountCents: 9900,
  currency: 'CNY',
  method: 'WECHAT',
  status: 'SUCCESS',
  version: 2,
  idempotencyKey: 'idem-demo-1',
  transactionId: 'wx-tx-42001',
  payerName: '张三',
  payerPhone: '138****8888',
  remark: '会员续费充值',
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
  failureReason: undefined,
};

const MOCK_REFUNDS: RefundRecord[] = [
  {
    id: 'ref-demo-1',
    paymentId: 'pay-demo-1',
    orderId: 'ord-2024-001',
    amountCents: 9900,
    reason: '客户取消订单',
    status: 'COMPLETED',
    version: 3,
    requestedBy: 'cs-001',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

// ============================================================
// 组件
// ============================================================

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function FinanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // 状态
  const [payment, setPayment] = useState<PaymentDetail>(MOCK_PAYMENT);
  const [refunds, setRefunds] = useState<RefundRecord[]>(MOCK_REFUNDS);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmAction, setConfirmAction] = useState<{
    target: PaymentStatus;
    label: string;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    transactionId: payment.transactionId || '',
    payerName: payment.payerName || '',
    payerPhone: payment.payerPhone || '',
    remark: payment.remark || '',
  });

  const addToast = useCallback((message: string, type: ToastItem['type']) => {
    const toastId = Date.now();
    setToasts((prev) => [...prev, { id: toastId, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 3500);
  }, []);

  // 可用状态流转
  const availableTransitions = useMemo(
    () => STATUS_TRANSITIONS[payment.status] || [],
    [payment.status]
  );

  // 处理状态变更
  const handleStatusChange = useCallback(
    async (target: PaymentStatus) => {
      setConfirmAction(null);
      addToast(`支付单 ${id.slice(-8)} 状态变更为 ${STATUS_LABEL[target]}`, 'success');

      // 模拟异步更新
      await new Promise((r) => setTimeout(r, 200));

      setPayment((prev) => ({
        ...prev,
        status: target,
        version: prev.version + 1,
        updatedAt: new Date().toISOString(),
      }));
    },
    [id, addToast]
  );

  // 处理编辑保存
  const handleSave = useCallback(async () => {
    addToast('编辑信息已保存', 'success');
    setEditing(false);
    setPayment((prev) => ({
      ...prev,
      transactionId: editForm.transactionId || prev.transactionId,
      payerName: editForm.payerName || prev.payerName,
      payerPhone: editForm.payerPhone || prev.payerPhone,
      remark: editForm.remark || prev.remark,
      version: prev.version + 1,
      updatedAt: new Date().toISOString(),
    }));
  }, [editForm, addToast]);

  // 处理删除
  const handleDelete = useCallback(() => {
    addToast(`支付单 ${id.slice(-8)} 已删除`, 'info');
    setTimeout(() => router.push('/finance'), 800);
  }, [id, addToast, router]);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 960, margin: '0 auto' }}>
      {/* 面包屑 */}
      <div style={{ marginBottom: 16, fontSize: 14, color: '#6b7280' }}>
        <a
          href="/finance"
          onClick={(e) => { e.preventDefault(); router.push('/finance'); }}
          style={{ color: '#3b82f6', textDecoration: 'none', cursor: 'pointer' }}
        >
          💰 财务管理
        </a>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: '#111827' }}>支付详情</span>
      </div>

      {/* 顶部操作栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            支付详情
          </h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            ID: {payment.id} | Version: {payment.version} | 幂等键: {payment.idempotencyKey.slice(0, 8)}...
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing ? (
            <>
              <button
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
                💾 保存
              </button>
              <button
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
                ✏️ 编辑
              </button>
              <button
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
                🗑️ 删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* 状态流转按钮组 */}
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
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>
            状态操作:
          </span>
          {availableTransitions.map((target) => (
            <button
              key={target}
              onClick={() =>
                setConfirmAction({ target, label: STATUS_LABEL[target] })
              }
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background:
                  target === 'SUCCESS'
                    ? '#10b981'
                    : target === 'FAILED'
                      ? '#ef4444'
                      : target === 'REFUNDED'
                        ? '#f59e0b'
                        : '#6b7280',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              ➡️ {STATUS_LABEL[target]}
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

      {/* 基本信息 Card */}
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
          📌 基本信息
        </div>
        <div style={{ padding: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            {/* 行1 */}
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                支付单号
              </label>
              <span style={{ fontSize: 14, fontFamily: 'monospace' }}>
                {payment.id}
              </span>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                订单编号
              </label>
              <span style={{ fontSize: 14, fontFamily: 'monospace' }}>
                {payment.orderId}
              </span>
            </div>

            {/* 行2 */}
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                支付金额
              </label>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>
                {formatAmount(payment.amountCents, payment.currency)}
              </span>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                支付方式
              </label>
              <span style={{ fontSize: 14 }}>
                {METHOD_LABEL[payment.method]}
              </span>
            </div>

            {/* 行3 */}
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                状态
              </label>
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
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                交易流水号
              </label>
              <span style={{ fontSize: 14, fontFamily: 'monospace' }}>
                {payment.transactionId || '-'}
              </span>
            </div>

            {/* 行4 - 编辑模式 */}
            {editing ? (
              <>
                <div>
                  <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                    付款人姓名
                  </label>
                  <input
                    value={editForm.payerName}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, payerName: e.target.value }))
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
                  <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                    付款人手机
                  </label>
                  <input
                    value={editForm.payerPhone}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, payerPhone: e.target.value }))
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
                  <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                    备注
                  </label>
                  <textarea
                    value={editForm.remark}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, remark: e.target.value }))
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
                  <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                    付款人姓名
                  </label>
                  <span style={{ fontSize: 14 }}>
                    {payment.payerName || '-'}
                  </span>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                    付款人手机
                  </label>
                  <span style={{ fontSize: 14 }}>
                    {payment.payerPhone || '-'}
                  </span>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                    备注
                  </label>
                  <span style={{ fontSize: 14 }}>
                    {payment.remark || '-'}
                  </span>
                </div>
              </>
            )}

            {/* 时间行 */}
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                创建时间
              </label>
              <span style={{ fontSize: 14 }}>
                {formatDate(payment.createdAt)}
              </span>
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block' }}>
                更新时间
              </label>
              <span style={{ fontSize: 14 }}>
                {formatDate(payment.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 关联退款列表 Card */}
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
          🔄 关联退款 ({refunds.length})
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
              {refunds.map((ref) => (
                <tr
                  key={ref.id}
                  style={{ borderTop: '1px solid #e5e7eb' }}
                >
                  <td
                    style={{
                      padding: 12,
                      fontFamily: 'monospace',
                      fontSize: 12,
                    }}
                  >
                    {ref.id.slice(0, 12)}...
                  </td>
                  <td style={{ padding: 12, fontWeight: 600 }}>
                    {formatAmount(ref.amountCents)}
                  </td>
                  <td style={{ padding: 12, fontSize: 13 }}>
                    {ref.reason}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background:
                          REFUND_STATUS_COLORS[ref.status],
                        color:
                          REFUND_STATUS_TEXT_COLORS[ref.status],
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {REFUND_STATUS_LABEL[ref.status]}
                    </span>
                  </td>
                  <td style={{ padding: 12, fontSize: 13 }}>
                    {ref.requestedBy}
                  </td>
                  <td style={{ padding: 12, fontSize: 13 }}>
                    {formatDate(ref.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
            暂无退款记录
          </div>
        )}
      </div>

      {/* Tenant 信息 */}
      <div
        style={{
          padding: 12,
          background: '#f3f4f6',
          borderRadius: 8,
          fontSize: 13,
          color: '#6b7280',
        }}
      >
        <strong>Tenant:</strong> {payment.tenantId} |{' '}
        <strong>幂等键:</strong> {payment.idempotencyKey} |{' '}
        <strong>乐观锁 Version:</strong> {payment.version}
      </div>

      {/* 确认对话框 */}
      {confirmAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
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
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>
              🔄 确认状态变更
            </h3>
            <p style={{ color: '#6b7280', margin: '0 0 20px', fontSize: 14 }}>
              将支付单 <strong>{payment.id.slice(-8)}</strong>
              的状态从 <strong>{STATUS_LABEL[payment.status]}</strong>
              变更为 <strong>{confirmAction.label}</strong>？
            </p>
            {confirmAction.target === 'SUCCESS' && (
              <div
                style={{
                  padding: 12,
                  background: '#d1fae5',
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#065f46',
                }}
              >
                ✅ 确认后将标记支付成功，客户订单将继续流转。
              </div>
            )}
            {confirmAction.target === 'FAILED' && (
              <div
                style={{
                  padding: 12,
                  background: '#fee2e2',
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#991b1b',
                }}
              >
                ⚠️ 支付失败后需要重新发起支付，请确认已沟通客户。
              </div>
            )}
            {confirmAction.target === 'REFUNDED' && (
              <div
                style={{
                  padding: 12,
                  background: '#fef3c7',
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#92400e',
                }}
              >
                💰 标记为已退款后系统将冻结该金额，请确认退款已到账。
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
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

      {/* Toast */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              marginBottom: 8,
              background:
                t.type === 'success'
                  ? '#d1fae5'
                  : t.type === 'error'
                    ? '#fee2e2'
                    : '#dbeafe',
              color:
                t.type === 'success'
                  ? '#065f46'
                  : t.type === 'error'
                    ? '#991b1b'
                    : '#1e40af',
              fontWeight: 500,
              fontSize: 14,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              animation: 'slideIn 0.2s ease',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
