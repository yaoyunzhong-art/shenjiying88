'use client';

import React, { useCallback, useState } from 'react';
import { DetailShell } from './DetailShell';
import type { DetailShellAction } from './DetailShell';
import { Steps } from './Steps';
import type { StepItem, StepStatus } from './Steps';
import { StatusBadge } from './StatusBadge';
import { DescriptionList } from './DescriptionList';
import type { DescriptionItem } from './DescriptionList';
import { Modal } from './Modal';
import { TextArea } from './TextArea';
import { Button } from './Button';
import { Toast } from './Toast';
import { Spin } from './Spin';

// ---- 类型定义 ----

/** 订单状态枚举 */
export type OrderStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned';

/** 订单状态对应的 Step 配置 */
export const ORDER_STATUS_STEPS: { label: string; statusKey: OrderStatus }[] = [
  { label: '待审核', statusKey: 'pending_approval' },
  { label: '已审核', statusKey: 'approved' },
  { label: '处理中', statusKey: 'processing' },
  { label: '已发货', statusKey: 'shipped' },
  { label: '已完成', statusKey: 'completed' },
];

/** 判断某个状态在 Steps 中的位置 (0-based) */
function statusToStepIndex(status: OrderStatus): number {
  const idx = ORDER_STATUS_STEPS.findIndex((s) => s.statusKey === status);
  return idx >= 0 ? idx : 0;
}

/** 状态对应的 StatusBadge variant */
function orderStatusToVariant(status: OrderStatus): 'info' | 'success' | 'warning' | 'error' | 'pending' | 'neutral' {
  switch (status) {
    case 'pending_approval':
      return 'pending';
    case 'approved':
    case 'processing':
      return 'info';
    case 'shipped':
    case 'delivered':
      return 'warning';
    case 'completed':
      return 'success';
    case 'rejected':
    case 'cancelled':
      return 'error';
    case 'returned':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** 状态中文名映射 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_approval: '待审核',
  approved: '已审核',
  rejected: '已驳回',
  processing: '处理中',
  shipped: '已发货',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
  returned: '已退货',
};

/** 状态流转配置 */
export interface StatusTransition {
  /** 当前状态 */
  from: OrderStatus;
  /** 目标状态 */
  to: OrderStatus;
  /** 操作名称（按钮文案） */
  actionLabel: string;
  /** 操作类型 */
  variant?: 'primary' | 'secondary' | 'danger';
  /** 是否需要确认弹窗 */
  requiresConfirm?: boolean;
  /** 确认弹窗标题 */
  confirmTitle?: string;
  /** 确认弹窗描述 */
  confirmDescription?: string;
  /** 是否需要填写备注 */
  requiresRemark?: boolean;
  /** 备注输入框提示 */
  remarkPlaceholder?: string;
}

/** 订单基础信息 */
export interface OrderBasicInfo {
  id: string;
  orderNo: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
  items?: DescriptionItem[];
}

/** OrderDetailWithStatusFlow Props */
export interface OrderDetailWithStatusFlowProps {
  /** 订单基本信息 */
  order: OrderBasicInfo;
  /** 额外信息区段 */
  extraSections?: { title: string; items: DescriptionItem[] }[];
  /** 可用的状态流转 */
  transitions?: StatusTransition[];
  /** 加载中 */
  loading?: boolean;
  /** 错误消息 */
  error?: string;
  /** 面包屑 */
  breadcrumbs?: Array<{ label: string; href?: string }>;
  /** 返回链接 */
  backLink?: { label: string; href: string };
  /** 状态变更回调 */
  onStatusChange?: (from: OrderStatus, to: OrderStatus, remark?: string) => Promise<void>;
  /** 额外操作 */
  extraActions?: DetailShellAction[];
}

// ---- 组件 ----

export function OrderDetailWithStatusFlow({
  order,
  extraSections,
  transitions,
  loading = false,
  error,
  breadcrumbs,
  backLink,
  onStatusChange,
  extraActions,
}: OrderDetailWithStatusFlowProps) {
  // 确认弹窗状态
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmingTransition, setConfirmingTransition] = useState<StatusTransition | null>(null);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 弹窗关闭
  const handleCloseConfirm = useCallback(() => {
    if (submitting) return;
    setConfirmVisible(false);
    setConfirmingTransition(null);
    setRemark('');
  }, [submitting]);

  // 执行状态流转
  const executeTransition = useCallback(
    async (transition: StatusTransition) => {
      if (!onStatusChange) return;
      setSubmitting(true);
      try {
        await onStatusChange(order.status, transition.to, remark);
        setToast({ type: 'success', message: `${transition.actionLabel}成功` });
        handleCloseConfirm();
      } catch (err) {
        setToast({ type: 'error', message: `${transition.actionLabel}失败: ${err instanceof Error ? err.message : '未知错误'}` });
      } finally {
        setSubmitting(false);
      }
    },
    [onStatusChange, order.status, remark, handleCloseConfirm],
  );

  // 触发操作
  const handleAction = useCallback(
    (transition: StatusTransition) => {
      if (transition.requiresConfirm || transition.requiresRemark) {
        setConfirmingTransition(transition);
        setRemark('');
        setConfirmVisible(true);
      } else {
        executeTransition(transition);
      }
    },
    [executeTransition],
  );

  // 构建 Step 列表
  const steps: StepItem[] = ORDER_STATUS_STEPS.map((s, index) => {
    const currentIdx = statusToStepIndex(order.status);
    let stepStatus: StepStatus;
    if (order.status === 'rejected' || order.status === 'cancelled' || order.status === 'returned') {
      // 异常终止状态: 高亮到当前, 剩余灰色
      stepStatus = index <= currentIdx ? 'completed' : 'waiting';
    } else {
      if (index < currentIdx) stepStatus = 'completed';
      else if (index === currentIdx) stepStatus = 'processing';
      else stepStatus = 'waiting';
    }
    return { title: s.label, status: stepStatus };
  });

  // 操作按钮
  const transitionActions: DetailShellAction[] =
    transitions
      ?.filter((t) => t.from === order.status)
      .map((t) => ({
        key: `transition-${t.to}`,
        label: t.actionLabel,
        variant: t.variant ?? 'primary',
        onClick: () => handleAction(t),
      })) ?? [];

  const allActions = [...transitionActions, ...(extraActions ?? [])];

  // 基本信息
  const basicItems: DescriptionItem[] = [
    { label: '订单编号', value: order.orderNo },
    { label: '客户姓名', value: order.customerName },
    { label: '联系电话', value: order.customerPhone },
    {
      label: '订单金额',
      value: `¥${order.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    { label: '创建时间', value: order.createdAt },
    { label: '更新时间', value: order.updatedAt },
  ];

  if (order.items) {
    basicItems.push(...order.items);
  }

  return (
    <>
      <DetailShell
        title={`订单详情 · ${order.orderNo}`}
        subtitle={
          <StatusBadge
            label={ORDER_STATUS_LABELS[order.status]}
            variant={orderStatusToVariant(order.status)}
          />
        }
        breadcrumbs={breadcrumbs}
        backLink={backLink}
        actions={allActions}
        loading={loading}
        error={error}
      >
        {/* 状态进度条 */}
        <div style={{ marginBottom: 24, padding: '20px 24px', background: 'rgba(15,23,42,0.3)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.12)' }}>
          <Steps items={steps} current={statusToStepIndex(order.status)} size="sm" />
        </div>

        {/* 基本信息 */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12, fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
            基本信息
          </h4>
          <DescriptionList items={basicItems} />
        </div>

        {/* 额外信息区段 */}
        {extraSections?.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12, fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
              {section.title}
            </h4>
            <DescriptionList items={section.items} />
          </div>
        ))}
      </DetailShell>

      {/* Toast 反馈 */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* 确认弹窗 */}
      <Modal
        open={confirmVisible}
        onClose={handleCloseConfirm}
        title={confirmingTransition?.confirmTitle ?? '确认操作'}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={handleCloseConfirm} disabled={submitting}>
              取消
            </Button>
            <Button
              variant={confirmingTransition?.variant ?? 'primary'}
              onClick={() => confirmingTransition && executeTransition(confirmingTransition)}
              loading={submitting}
            >
              确认{confirmingTransition?.actionLabel ?? ''}
            </Button>
          </div>
        }
      >
        <p style={{ color: '#94a3b8', marginBottom: confirmingTransition?.requiresRemark ? 12 : 0 }}>
          {confirmingTransition?.confirmDescription ?? `确定要${confirmingTransition?.actionLabel ?? ''}吗？`}
        </p>
        {confirmingTransition?.requiresRemark && (
          <TextArea
            placeholder={confirmingTransition.remarkPlaceholder ?? '请输入备注（可选）'}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
          />
        )}
      </Modal>

      {/* 提交中遮罩 */}
      {submitting && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 9999,
        }}>
          <Spin />
        </div>
      )}
    </>
  );
}
