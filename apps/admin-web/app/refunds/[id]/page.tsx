'use client';

/**
 * 退款详情页 — Refund Detail Page (admin-web)
 * B-页面: 详情页 (含编辑/删除/状态流转)
 *
 * 功能:
 *  - 查看退款详情 (订单/会员/商品/金额/渠道)
 *  - 状态流转操作 (待审批→通过/拒绝/处理中→完成/取消)
 *  - 审批日志展示
 *  - 操作确认弹窗
 *  - 返回列表
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PageShell,
  StatusBadge,
  Breadcrumb,
  DetailActionBar,
  DetailClosureBar,
  ConfirmActionDialog,
  ToastContainer,
  useToast,
  InfoRow,
} from '@m5/ui';
import type {
  RefundItem,
  RefundStatus,
  RefundType,
} from '../refund-types';
import {
  REFUND_STATUS_LABEL,
  REFUND_STATUS_VARIANT,
  REFUND_TYPE_LABEL,
  REFUND_CHANNEL_LABEL,
} from '../refund-types';
import { getRefunds } from '../refund-data';

// ============================================================
// 状态机: 允许的状态流转
// ============================================================

const STATUS_TRANSITIONS: Record<RefundStatus, RefundStatus[]> = {
  pending_approval: ['approved', 'rejected'],
  approved: ['processing', 'cancelled'],
  rejected: [],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// DetailActionBarAction.variant 允许值: 'default' | 'primary' | 'danger'
// 将 UI 语义映射到 DetailActionBarAction 可用 variant
function mapTransitionVariant(
  v: 'success' | 'danger' | 'info' | 'warning' | 'default',
): 'default' | 'primary' | 'danger' {
  switch (v) {
    case 'success':
    case 'info':
      return 'primary';
    case 'danger':
    case 'warning':
      return 'danger';
    default:
      return 'default';
  }
}

const TRANSITION_ACTIONS: Record<
  string,
  { label: string; variant: 'success' | 'danger' | 'info' | 'warning' | 'default' }
> = {
  pending_approval__approved: { label: '通过审批', variant: 'success' },
  pending_approval__rejected: { label: '拒绝', variant: 'danger' },
  approved__processing: { label: '开始处理', variant: 'info' },
  approved__cancelled: { label: '取消', variant: 'warning' },
  processing__completed: { label: '完成退款', variant: 'success' },
  processing__cancelled: { label: '取消处理', variant: 'warning' },
};

// ============================================================
// 格式化工具
// ============================================================

function formatYuan(amountFen: number): string {
  return `¥${(amountFen / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ============================================================
// 组件
// ============================================================

export default function RefundDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? '';

  const { toasts, success, info, dismiss } = useToast();

  // 查找退款记录
  const [refund, setRefund] = useState<RefundItem | null>(() => {
    const all = getRefunds();
    return all.find((r) => r.id === id) ?? null;
  });

  // 操作状态
  const [confirmAction, setConfirmAction] = useState<{
    from: RefundStatus;
    to: RefundStatus;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 可执行的状态流转
  const availableTransitions = useMemo(() => {
    if (!refund) return [];
    return STATUS_TRANSITIONS[refund.status] ?? [];
  }, [refund]);

  // 状态流转操作
  const handleTransition = useCallback(
    async (from: RefundStatus, to: RefundStatus) => {
      if (!refund) return;
      setLoading(true);
      // 模拟API调用
      await new Promise((r) => setTimeout(r, 500));

      const updated: RefundItem = {
        ...refund,
        status: to,
        processedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        processedBy: '当前用户',
      };
      setRefund(updated);
      setConfirmAction(null);
      setLoading(false);
      success(`${REFUND_STATUS_LABEL[from]} → ${REFUND_STATUS_LABEL[to]} 成功`);
    },
    [refund, success],
  );

  // 删除操作
  const handleDelete = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setShowDeleteConfirm(false);
    setLoading(false);
    info('退款记录已删除');
    setTimeout(() => router.push('/refunds'), 1500);
  }, [router, info]);

  // 返回列表
  const handleBack = useCallback(() => {
    router.push('/refunds');
  }, [router]);

  // DetailClosureBar links
  const closureLinks = useMemo(() => {
    const links: Array<{
      key: string;
      title: string;
      subtitle: string;
      href: string;
      variant?: 'default' | 'warning' | 'danger';
    }> = [
      {
        key: 'back-to-list',
        title: '返回退款列表',
        subtitle: '回到退款管理主页',
        href: '/refunds',
      },
    ];
    if (refund) {
      links.push({
        key: 'delete-record',
        title: '删除记录',
        subtitle: '删除此退款记录，不可撤回',
        href: '#',
        variant: 'danger' as const,
      });
    }
    return links;
  }, [refund]);

  // 点击 closure link 的处理（事件委托）
  const handleClosureLinkClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      const linkEl = target.closest('[data-testid^="detail-closure-link-"]');
      if (!linkEl) return;
      const testId = linkEl.getAttribute('data-testid') ?? '';
      const key = testId.replace('detail-closure-link-', '');
      if (key === 'back-to-list') {
        e.preventDefault();
        handleBack();
      } else if (key === 'delete-record') {
        e.preventDefault();
        setShowDeleteConfirm(true);
      }
    },
    [handleBack],
  );

  if (!refund) {
    return (
      <PageShell title="退款详情" description="未找到该退款记录">
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            color: '#64748b',
          }}
        >
          <p style={{ fontSize: 18, marginBottom: 16 }}>未找到退款记录</p>
          <p style={{ fontSize: 14, marginBottom: 24 }}>退单号: {id}</p>
          <button
            onClick={handleBack}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            返回退款列表
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`退款详情 · ${refund.id}`}
      description={`${REFUND_TYPE_LABEL[refund.type]} — ${refund.customerName}`}
    >
      {/* 面包屑 */}
      <Breadcrumb
        items={[
          { label: '退款管理', href: '/refunds' },
          { label: refund.id },
        ]}
      />

      {/* 主信息卡片 */}
      <div
        style={{
          marginTop: 16,
          borderRadius: 12,
          border: '1px solid rgba(148, 163, 184, 0.14)',
          background: '#1e293b',
          overflow: 'hidden',
        }}
      >
        {/* 头部 */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#f8fafc',
                marginBottom: 4,
              }}
            >
              {refund.id}
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              订单 {refund.orderId} · {refund.storeName}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>状态</span>
            <StatusBadge
              variant={REFUND_STATUS_VARIANT[refund.status]}
              label={REFUND_STATUS_LABEL[refund.status]}
              size="md"
            />
          </div>
        </div>

        {/* 信息行 */}
        <div style={{ padding: '20px 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            <InfoRow label="退单号" value={refund.id} />
            <InfoRow label="订单号" value={refund.orderId} />
            <InfoRow label="退款类型" value={REFUND_TYPE_LABEL[refund.type]} />
            <InfoRow label="退款渠道" value={REFUND_CHANNEL_LABEL[refund.channel]} />
            <InfoRow
              label="退款金额"
              value={
                <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: 18 }}>
                  {formatYuan(refund.amount)}
                </span>
              }
            />
            <InfoRow label="退款原因" value={refund.reason} />
            <InfoRow label="会员姓名" value={refund.customerName} />
            <InfoRow label="会员电话" value={refund.customerPhone} />
            <InfoRow label="商品名称" value={refund.productName} />
            <InfoRow label="商品 SKU" value={refund.productSku} />
            <InfoRow label="退货数量" value={`${refund.quantity} 件`} />
            <InfoRow label="门店" value={refund.storeName} />
            <InfoRow label="申请时间" value={refund.createdAt} />
            <InfoRow
              label="处理时间"
              value={refund.processedAt ?? '—'}
            />
            <InfoRow
              label="处理人"
              value={refund.processedBy ?? '—'}
            />
          </div>
        </div>

        {/* 备注 */}
        {refund.remark && (
          <div
            style={{
              padding: '12px 24px',
              borderTop: '1px solid rgba(148, 163, 184, 0.1)',
              fontSize: 13,
              color: '#94a3b8',
              background: 'rgba(148, 163, 184, 0.04)',
            }}
          >
            <strong style={{ color: '#cbd5e1' }}>备注：</strong>
            {refund.remark}
          </div>
        )}
      </div>

      {/* 操作按钮组 — 状态流转 */}
      {availableTransitions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <DetailActionBar
            actions={availableTransitions.map((targetStatus) => {
            const key = `${refund.status}__${targetStatus}`;
            const config = TRANSITION_ACTIONS[key];
            return {
              key,
              label: config?.label ?? targetStatus,
              variant: config ? mapTransitionVariant(config.variant) : 'default',
              onClick: () =>
                setConfirmAction({ from: refund.status, to: targetStatus }),
            };
          })}
          />
        </div>
      )}

      {/* 底部操作 */}
      <div onClick={handleClosureLinkClick}>
        <DetailClosureBar
          links={closureLinks}
          heading="操作"
          caption="从详情页返回列表或执行额外操作"
        />
      </div>

      {/* 状态流转确认弹窗 */}
      {confirmAction && (
        <ConfirmActionDialog
          open={!!confirmAction}
          title="确认操作"
          message={`确定将退款 ${refund.id} 从「${REFUND_STATUS_LABEL[confirmAction.from]}」转为「${REFUND_STATUS_LABEL[confirmAction.to]}」？`}
          confirmLabel="确认"
          cancelLabel="取消"
          loading={loading}
          onConfirm={() => handleTransition(confirmAction.from, confirmAction.to)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* 删除确认弹窗 */}
      <ConfirmActionDialog
        open={showDeleteConfirm}
        title="确认删除"
        message={`确定删除退款记录 ${refund.id}？此操作不可撤回。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        confirmVariant="danger"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Toast 通知 */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </PageShell>
  );
}
