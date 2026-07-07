/**
 * orders/[id]/page.tsx — 订单详情页 (ToB 订单管理)
 *
 * DetailShell + InfoSection / InfoRow 结构展示订单信息
 * 支持状态流转 + 编辑弹窗 + 删除确认 + 付款备注
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useCallback } from 'react';
import {
  PageShell,
  DetailShell,
  Modal,
  SubmitButton,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  type DetailShellAction,
} from '@m5/ui';
import {
  MOCK_ORDERS,
  ORDER_STATUS_MAP,
  ORDER_PAYMENT_STATUS_MAP,
  ORDER_SOURCE_MAP,
  type OrderItem,
  type OrderStatus,
  type OrderPaymentStatus,
} from '../../orders-data';

// ── Helpers ──

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1_000).toFixed(1)}K`;
  return `¥${n.toLocaleString()}`;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
  delivered: undefined,
  cancelled: undefined,
};

const STATUS_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  pending: '确认订单',
  confirmed: '开始处理',
  processing: '标记发货',
  shipped: '确认签收',
  delivered: undefined,
  cancelled: undefined,
};

function confirmMessage(order: OrderItem, next: OrderStatus): string {
  const from = ORDER_STATUS_MAP[order.status].label;
  const to = ORDER_STATUS_MAP[next].label;
  return `确定将订单 "${order.orderNo}" 从 [${from}] 变更为 [${to}] 吗？`;
}

// ── 编辑表单数据类型 ──

type EditFormData = {
  productName: string;
  quantity: number;
  unitPrice: number;
  remark: string;
  expectedDelivery: string;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 14,
  boxSizing: 'border-box' as const,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'auto' as const,
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(true);

  // 编辑弹窗状态
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<EditFormData | null>(null);

  // 状态流转确认
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);

  // 删除确认
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Toast 状态
  const [toastState, setToastState] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  // ── 加载订单数据 ──
  useMemo(() => {
    setLoading(true);
    const found = MOCK_ORDERS.find((o) => o.id === id) ?? null;
    setTimeout(() => {
      setOrder(found);
      setLoading(false);
    }, 50);
  }, [id]);

  // ── 状态流转 ──
  const handleStatusTransition = useCallback(() => {
    if (!order || !targetStatus) return;
    const updated: OrderItem = { ...order, status: targetStatus };
    setOrder(updated);
    setConfirmOpen(false);
    setTargetStatus(null);
    setToastState({ message: `订单状态已更新为 [${ORDER_STATUS_MAP[targetStatus].label}]`, variant: 'success' });
  }, [order, targetStatus]);

  // ── 编辑提交 ──
  const handleEditSubmit = useCallback(() => {
    if (!order || !editData) return;
    const updated: OrderItem = {
      ...order,
      productName: editData.productName,
      quantity: editData.quantity,
      unitPrice: editData.unitPrice,
      totalAmount: editData.quantity * editData.unitPrice,
      remark: editData.remark,
      expectedDelivery: editData.expectedDelivery,
    };
    setOrder(updated);
    setEditOpen(false);
    setToastState({ message: '订单已更新', variant: 'success' });
  }, [order, editData]);

  // ── 删除 ──
  const handleDelete = useCallback(() => {
    setToastState({ message: '订单已删除', variant: 'success' });
    setDeleteOpen(false);
    setTimeout(() => router.push('/orders'), 300);
  }, [router]);

  // ── 构建操作按钮 ──
  const actions: DetailShellAction[] = useMemo(() => {
    const list: DetailShellAction[] = [];

    if (order) {
      const next = NEXT_STATUS[order.status];
      const label = STATUS_ACTION_LABELS[order.status];
      if (next && label) {
        list.push({
          key: 'status-transition',
          label,
          variant: 'primary',
          onClick: () => {
            setTargetStatus(next);
            setConfirmOpen(true);
          },
        });
      }
    }

    list.push(
      {
        key: 'edit',
        label: '编辑',
        variant: 'secondary',
        onClick: () => {
          if (!order) return;
          setEditData({
            productName: order.productName,
            quantity: order.quantity,
            unitPrice: order.unitPrice,
            remark: order.remark,
            expectedDelivery: order.expectedDelivery,
          });
          setEditOpen(true);
        },
      },
      {
        key: 'delete',
        label: '删除',
        variant: 'danger',
        onClick: () => setDeleteOpen(true),
      },
    );

    return list;
  }, [order]);

  // ── 加载中状态 ──
  if (loading) {
    return (
      <PageShell title="订单详情">
        <div style={{ padding: 32, color: '#94a3b8' }}>正在加载订单详情...</div>
      </PageShell>
    );
  }

  // ── 未找到 ──
  if (!order) {
    return (
      <PageShell title="订单详情">
        <div style={{ padding: 32, color: '#94a3b8' }}>
          订单不存在（ID: {id ?? 'unknown'}）
        </div>
      </PageShell>
    );
  }

  const next = NEXT_STATUS[order.status];
  const statusActionLabel = STATUS_ACTION_LABELS[order.status];
  const needPay = order.paymentStatus === 'unpaid' || order.paymentStatus === 'partial';

  // ── 配套数据 ──
  const paymentRecords: Array<{ date: string; amount: number; method: string; status: 'success' | 'pending' }> = [
    { date: order.createdAt, amount: order.paidAmount, method: '银行转账', status: 'success' },
  ];
  if (order.paymentStatus === 'partial') {
    paymentRecords.push({ date: today(), amount: order.totalAmount - order.paidAmount, method: '待支付', status: 'pending' });
  }

  const activityLog = [
    { time: order.createdAt, action: '订单创建', operator: order.salesPerson },
    { time: order.expectedDelivery, action: `状态变更为 ${ORDER_STATUS_MAP[order.status].label}`, operator: '系统' },
  ];

  return (
    <PageShell title="订单详情">
      <DetailShell
        title={`订单详情 — ${order.orderNo}`}
        subtitle={`${order.customerCompany} · ${order.customerName}`}
        actions={actions}
        loading={false}
      >
        {/* ── 基本信息 ── */}
        <div
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 12px',
          }}>
            基本信息
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            <InfoRow label="订单编号" value={<span style={{ fontFamily: 'monospace' }}>{order.orderNo}</span>} />
            <InfoRow label="订单状态" value={ORDER_STATUS_MAP[order.status].label} />
            <InfoRow label="付款状态" value={ORDER_PAYMENT_STATUS_MAP[order.paymentStatus].label} />
            <InfoRow label="客户公司" value={order.customerCompany} />
            <InfoRow label="客户姓名" value={order.customerName} />
            <InfoRow label="客户ID" value={order.customerId} />
            <InfoRow label="业务员" value={order.salesPerson} />
            <InfoRow label="订单来源" value={ORDER_SOURCE_MAP[order.source]} />
            <InfoRow label="创建日期" value={order.createdAt} />
          </div>
        </div>

        {/* ── 产品明细 ── */}
        <div
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 12px',
          }}>
            产品明细
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            <InfoRow label="产品名称" value={order.productName} />
            <InfoRow label="数量" value={`${order.quantity}`} />
            <InfoRow label="单价" value={formatAmount(order.unitPrice)} />
            <InfoRow label="订单金额" value={formatAmount(order.totalAmount)} />
            <InfoRow label="已付金额" value={formatAmount(order.paidAmount)} />
            <InfoRow label="待付金额" value={needPay ? formatAmount(order.totalAmount - order.paidAmount) : '¥0'} />
          </div>
        </div>

        {/* ── 物流信息 ── */}
        <div
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 12px',
          }}>
            物流信息
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            <InfoRow label="地区" value={`${order.region} · ${order.city}`} />
            <InfoRow label="期望交付" value={order.expectedDelivery} />
            <InfoRow label="实际交付" value={order.actualDelivery ?? '尚未交付'} />
          </div>
        </div>

        {/* ── 备注 ── */}
        {order.remark && (
          <div
            style={{
              background: 'rgba(15,23,42,0.5)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 12px',
            }}>
              备注
            </h3>
            <div style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>
              {order.remark}
            </div>
          </div>
        )}

        {/* ── 付款记录 ── */}
        <div
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 12px',
          }}>
            付款记录
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>日期</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8' }}>金额</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>付款方式</th>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {paymentRecords.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                  <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{r.date}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0', fontFamily: 'monospace' }}>
                    {formatAmount(r.amount)}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{r.method}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      color: r.status === 'success' ? '#22c55e' : '#f59e0b',
                      fontSize: 13,
                    }}>
                      {r.status === 'success' ? '✅ 已到账' : '⏳ 待支付'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── 操作日志 ── */}
        <div
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 12px',
          }}>
            操作日志
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activityLog.map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, fontSize: 13, color: '#94a3b8' }}>
                <span style={{ fontFamily: 'monospace', minWidth: 80, color: '#64748b' }}>{log.time}</span>
                <span>{log.action}</span>
                <span style={{ color: '#64748b' }}>— {log.operator}</span>
              </div>
            ))}
          </div>
        </div>
      </DetailShell>

      {/* ── 状态流转确认弹窗 ── */}
      <Modal open={confirmOpen} onClose={() => { setConfirmOpen(false); setTargetStatus(null); }}>
        {order && targetStatus && (
          <div style={{ padding: 16 }}>
            <h3 style={{ color: '#e2e8f0', marginBottom: 12 }}>确认状态变更</h3>
            <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
              {confirmMessage(order, targetStatus)}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <SubmitButton
                label="取消"
                variant="secondary"
                onClick={() => { setConfirmOpen(false); setTargetStatus(null); }}
              />
              <SubmitButton
                label="确认变更"
                variant="primary"
                onClick={handleStatusTransition}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ── 编辑弹窗 ── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        {editData && (
          <div style={{ padding: 16 }}>
            <h3 style={{ color: '#e2e8f0', marginBottom: 20 }}>编辑订单</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormField label="产品名称" required>
                <input
                  style={inputStyle}
                  value={editData.productName}
                  onChange={(e) => setEditData({ ...editData, productName: e.target.value })}
                />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="数量" required>
                  <input
                    style={inputStyle}
                    type="number"
                    min={1}
                    value={editData.quantity}
                    onChange={(e) => setEditData({ ...editData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  />
                </FormField>
                <FormField label="单价 (元)" required>
                  <input
                    style={inputStyle}
                    type="number"
                    min={0}
                    step={0.01}
                    value={editData.unitPrice}
                    onChange={(e) => setEditData({ ...editData, unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                  />
                </FormField>
              </div>
              <FormField label="期望交付日期">
                <input
                  style={inputStyle}
                  type="date"
                  value={editData.expectedDelivery}
                  onChange={(e) => setEditData({ ...editData, expectedDelivery: e.target.value })}
                />
              </FormField>
              <FormField label="备注">
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  value={editData.remark}
                  onChange={(e) => setEditData({ ...editData, remark: e.target.value })}
                />
              </FormField>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <SubmitButton label="取消" variant="secondary" onClick={() => setEditOpen(false)} />
              <SubmitButton label="保存" variant="primary" onClick={handleEditSubmit} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── 删除确认弹窗 ── */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div style={{ padding: 16 }}>
          <h3 style={{ color: '#e2e8f0', marginBottom: 12 }}>确认删除</h3>
          <p style={{ color: '#94a3b8', marginBottom: 20, fontSize: 14 }}>
            确定要删除订单 "{order.orderNo}" 吗？此操作不可撤销。
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <SubmitButton label="取消" variant="secondary" onClick={() => setDeleteOpen(false)} />
            <SubmitButton label="确认删除" variant="danger" onClick={handleDelete} />
          </div>
        </div>
      </Modal>

      {/* ── Toast ── */}
      {toastState && (
        <FormSubmitFeedback
          {...(toastState.variant === 'error'
            ? { error: toastState.message, onDismissError: () => setToastState(null) }
            : { success: toastState.message, onDismissSuccess: () => setToastState(null) }
          )}
        />
      )}
    </PageShell>
  );
}
