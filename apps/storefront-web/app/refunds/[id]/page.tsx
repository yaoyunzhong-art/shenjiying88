/**
 * 退换货详情页 — Refund Detail Page (Next.js App Router Page)
 * 功能: 查看退换货申请详情、审批/驳回、处理流转
 * 角色视角: 👔店长 / 🛒前台
 */
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@m5/ui';
import {
  MOCK_REFUNDS,
  REFUND_STATUS_LABEL,
  REFUND_STATUS_VARIANT,
  REFUND_TYPE_LABEL,
} from '../refund-data';
import type { RefundItem, RefundStatus } from '../refund-data';

/* ── 状态流转顺序 ── */
const STATUS_FLOW: RefundStatus[] = [
  'pending_approval',
  'approved',
  'processing',
  'completed',
];
const REJECTABLE_STATUSES: RefundStatus[] = ['pending_approval'];
const CANCELLABLE_STATUSES: RefundStatus[] = ['pending_approval', 'approved'];

/* ── 格式化金额 ── */
function formatAmount(cents: number): string {
  return `¥${(cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

export default function RefundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const item = useMemo(() => MOCK_REFUNDS.find((r) => r.id === id), [id]);

  const [currentStatus, setCurrentStatus] = useState<RefundStatus | null>(item?.status ?? null);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleBack = useCallback(() => router.push('/refunds'), [router]);

  const handleApprove = useCallback(() => {
    setProcessing(true);
    setTimeout(() => {
      setCurrentStatus('approved');
      setActionMessage({ type: 'success', text: '✅ 已通过审批，退换货申请进入处理阶段' });
      setProcessing(false);
    }, 500);
  }, []);

  const handleReject = useCallback(() => {
    if (!rejectReason.trim()) return;
    setProcessing(true);
    setTimeout(() => {
      setCurrentStatus('rejected');
      setActionMessage({ type: 'success', text: `❌ 已驳回，原因: ${rejectReason}` });
      setShowRejectInput(false);
      setProcessing(false);
    }, 500);
  }, [rejectReason]);

  const handleCancel = useCallback(() => {
    setProcessing(true);
    setTimeout(() => {
      setCurrentStatus('cancelled');
      setActionMessage({ type: 'success', text: '⏹️ 已取消该退换货申请' });
      setProcessing(false);
    }, 500);
  }, []);

  const handleComplete = useCallback(() => {
    setProcessing(true);
    setTimeout(() => {
      setCurrentStatus('completed');
      setActionMessage({ type: 'success', text: '✅ 退换货处理已完成' });
      setProcessing(false);
    }, 500);
  }, []);

  if (!item || currentStatus === null) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>退换货申请未找到</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          未找到 ID 为 <strong>{id}</strong> 的退换货记录，可能已被删除。
        </p>
        <button
          onClick={handleBack}
          style={{
            padding: '8px 24px', borderRadius: 8, border: '1px solid #d1d5db',
            background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
          }}
          data-testid="refund-detail-back-list"
        >
          返回退换货列表
        </button>
      </div>
    );
  }

  const flowIdx = STATUS_FLOW.indexOf(currentStatus);
  const isRejectable = REJECTABLE_STATUSES.includes(currentStatus);
  const isCancellable = CANCELLABLE_STATUSES.includes(currentStatus);
  const isCompletable = currentStatus === 'processing';

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 24 }}>
      {/* 返回按钮 */}
      <button
        onClick={handleBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
          background: '#fff', color: '#374151', fontSize: 14, cursor: 'pointer',
          marginBottom: 20,
        }}
        data-testid="refund-detail-back"
      >
        ← 返回退换货列表
      </button>

      {/* 操作反馈 */}
      {actionMessage && (
        <div
          style={{
            marginBottom: 20, padding: '12px 18px', borderRadius: 10,
            background: actionMessage.type === 'error' ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${actionMessage.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            fontSize: 14, color: actionMessage.type === 'error' ? '#991b1b' : '#166534',
          }}
          data-testid="refund-detail-action-msg"
        >
          {actionMessage.text}
        </div>
      )}

      {/* 标题区 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 4 }}>
            🔄 退单 #{item.id}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6b7280' }}>
            <span>订单: {item.orderId}</span>
            <span>·</span>
            <StatusBadge variant={REFUND_STATUS_VARIANT[currentStatus]} label={REFUND_STATUS_LABEL[currentStatus]} />
            <span>·</span>
            <span>{item.createdAt}</span>
          </div>
        </div>
      </div>

      {/* 状态流转操作栏 */}
      {!actionMessage && (
        <div
          style={{
            marginBottom: 24, padding: 16, borderRadius: 12,
            background: '#f0f9ff', border: '1px solid #bae6fd',
          }}
          data-testid="refund-detail-status-bar"
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0369a1', marginBottom: 12 }}>
            操作
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* 审批通过 */}
            {currentStatus === 'pending_approval' && (
              <button
                onClick={handleApprove}
                disabled={processing}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: processing ? '#9ca3af' : '#059669',
                  color: '#fff', fontWeight: 600, fontSize: 14, cursor: processing ? 'not-allowed' : 'pointer',
                }}
                data-testid="refund-detail-approve"
              >
                ✅ 审批通过
              </button>
            )}

            {/* 驳回 */}
            {isRejectable && !showRejectInput && (
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={processing}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: '1px solid #dc2626',
                  background: '#fff', color: '#dc2626', fontWeight: 600,
                  fontSize: 14, cursor: processing ? 'not-allowed' : 'pointer',
                }}
                data-testid="refund-detail-reject-btn"
              >
                ❌ 驳回
              </button>
            )}

            {/* 驳回理由输入 */}
            {showRejectInput && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="请输入驳回原因…"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db',
                    fontSize: 14, minWidth: 220,
                  }}
                  data-testid="refund-detail-reject-reason"
                />
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectReason.trim()}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: 'none',
                    background: rejectReason.trim() && !processing ? '#dc2626' : '#9ca3af',
                    color: '#fff', fontWeight: 600, fontSize: 14,
                    cursor: rejectReason.trim() && !processing ? 'pointer' : 'not-allowed',
                  }}
                  data-testid="refund-detail-reject-confirm"
                >
                  确认驳回
                </button>
                <button
                  onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db',
                    background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer',
                  }}
                  data-testid="refund-detail-reject-cancel"
                >
                  取消
                </button>
              </div>
            )}

            {/* 完成处理 */}
            {isCompletable && (
              <button
                onClick={handleComplete}
                disabled={processing}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: processing ? '#9ca3af' : '#2563eb',
                  color: '#fff', fontWeight: 600, fontSize: 14, cursor: processing ? 'not-allowed' : 'pointer',
                }}
                data-testid="refund-detail-complete"
              >
                ✅ 完成处理
              </button>
            )}

            {/* 取消 */}
            {isCancellable && (
              <button
                onClick={handleCancel}
                disabled={processing}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: '1px solid #d1d5db',
                  background: '#fff', color: '#6b7280', fontWeight: 600,
                  fontSize: 14, cursor: processing ? 'not-allowed' : 'pointer',
                }}
                data-testid="refund-detail-cancel"
              >
                ⏹️ 取消
              </button>
            )}
          </div>
        </div>
      )}

      {/* 主信息区：两列布局 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* 申请信息 */}
        <div style={{ padding: 20, borderRadius: 12, background: '#fff', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
            申请信息
          </h2>
          <InfoRow label="退单编号" value={item.id} />
          <InfoRow label="订单编号" value={item.orderId} />
          <InfoRow label="类型" value={REFUND_TYPE_LABEL[item.type]} />
          <InfoRow label="金额" value={
            <span style={{ fontWeight: 600, color: '#dc2626' }}>{formatAmount(item.amount)}</span>
          } />
          <InfoRow label="申请时间" value={item.createdAt} />
          <InfoRow label="处理时间" value={item.processedAt ?? '—'} />
          <InfoRow label="当前状态" value={
            <StatusBadge variant={REFUND_STATUS_VARIANT[currentStatus]} label={REFUND_STATUS_LABEL[currentStatus]} />
          } />
        </div>

        {/* 客户与商品信息 */}
        <div style={{ padding: 20, borderRadius: 12, background: '#fff', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
            客户与商品
          </h2>
          <InfoRow label="会员姓名" value={item.customerName} />
          <InfoRow label="联系电话" value={item.customerPhone} />
          <InfoRow label="商品名称" value={item.productName} />
          <InfoRow label="退货原因" value={
            <span style={{ color: '#6b7280', lineHeight: 1.5 }}>{item.reason}</span>
          } />
        </div>
      </div>
    </div>
  );
}

/* ── InfoRow 小组件 ── */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '8px 0', borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{ fontSize: 13, color: '#6b7280', minWidth: 80, flexShrink: 0 }}>{label}</span>
      <div style={{ fontSize: 14, color: '#111827', textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}
