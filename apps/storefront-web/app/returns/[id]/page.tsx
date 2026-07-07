/**
 * 退货单详情页 — Return Detail Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🛒客服 / 💰财务
 * 功能: 退货单详情查看、状态流转、编辑、删除
 * 类型: B-详情页 (含编辑/删除/状态流转)
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DetailShell,
  InfoRow,
  StatusBadge,
  Button,
  DetailActionBar,
  DetailClosureBar,
  DescriptionList,
  EmptyState,
  ConfirmDialog,
  type DetailShellAction,
  type DetailActionBarAction,
  type DetailClosureLink,
  type DescriptionItem,
} from '@m5/ui';
import {
  ReturnStatusBadge,
  RETURN_STATUS_LABELS,
  type ReturnStatus,
  type ReturnItem,
} from '../components/ReturnStatusBadge';

/* ── 常量 ── */

/** 正序流转方向 */
const FORWARD_FLOW: ReturnStatus[] = ['pending', 'approved', 'processing', 'shipped', 'received', 'completed'];

/** 状态 → 可流转的下一状态 */
const NEXT_STATUS_MAP: Record<ReturnStatus, ReturnStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['processing', 'rejected'],
  processing: ['shipped', 'rejected'],
  shipped: ['received', 'rejected'],
  received: ['completed'],
  completed: [],
  rejected: [],
};

/** 各状态的 Action Bar 按钮 */
function makeStatusActions(
  status: ReturnStatus,
  onTransition: (key: string) => void,
): DetailActionBarAction[] {
  const nextStatuses = NEXT_STATUS_MAP[status] ?? [];
  const result: DetailActionBarAction[] = [];

  for (const ns of nextStatuses) {
    const label = RETURN_STATUS_LABELS[ns] ?? ns;
    if (ns === 'rejected') {
      result.push({
        key: `reject-${status}`,
        label: `❌ 拒绝（当前：${RETURN_STATUS_LABELS[status] ?? status} → ${label}）`,
        variant: 'danger',
        onClick: () => onTransition(`reject-${status}`),
      });
    } else {
      result.push({
        key: `advance-${ns}`,
        label: `✅ ${RETURN_STATUS_LABELS[status] ?? status} → ${label}`,
        variant: 'primary',
        onClick: () => onTransition(`advance-${ns}`),
      });
    }
  }
  return result;
}

/* ── Mock 数据 ── */

const FULL_RETURN: ReturnItem = {
  id: 'r-1',
  orderNo: 'ORD-20260627-001',
  returnNo: 'RET-20260628-001',
  customerName: '王芳',
  customerPhone: '138****5678',
  productName: '有机蔬菜拼盘',
  productSku: 'VEG-001',
  quantity: 2,
  reason: '商品质量问题',
  amount: 156.00,
  status: 'processing',
  createdBy: '张明',
  createdAt: '2026-06-28 10:30',
  updatedAt: '2026-06-29 14:20',
};

/** 示例数据站 */
const MOCK_RETURNS: Record<string, ReturnItem> = {
  'r-1': FULL_RETURN,
  'r-2': {
    id: 'r-2', orderNo: 'ORD-20260625-003', returnNo: 'RET-20260626-002',
    customerName: '李明', customerPhone: '159****2341',
    productName: '进口红酒礼盒', productSku: 'WINE-001',
    quantity: 1, reason: '尺寸/规格不符', amount: 388.00,
    status: 'pending', createdBy: '赵雪', createdAt: '2026-06-26 09:15', updatedAt: '2026-06-26 09:15',
  },
  'r-3': {
    id: 'r-3', orderNo: 'ORD-20260620-012', returnNo: 'RET-20260621-003',
    customerName: '陈伟', customerPhone: '182****4532',
    productName: '澳洲牛排套餐', productSku: 'MEAT-003',
    quantity: 3, reason: '收到已损坏', amount: 267.00,
    status: 'completed', createdBy: '张明', createdAt: '2026-06-21 16:40', updatedAt: '2026-06-25 10:00',
  },
};

/* ── 格式化 ── */

function fmtCurrency(v: number): string {
  return `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

/* ── 组件 ── */

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const returnId = params?.id as string;

  const [returnsDb, setReturnsDb] = useState(MOCK_RETURNS);
  const ret = returnsDb[returnId];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /** 状态流转 */
  const handleStatusTransition = useCallback(
    (actionKey: string) => {
      if (!ret) return;
      if (actionKey.startsWith('advance-')) {
        const nextStatus = actionKey.replace('advance-', '') as ReturnStatus;
        const allowed = NEXT_STATUS_MAP[ret.status] ?? [];
        if (allowed.includes(nextStatus)) {
          setReturnsDb((prev) => {
            const item = prev[returnId];
            if (!item) return prev;
            return {
              ...prev,
              [returnId]: { ...item, status: nextStatus, updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') },
            };
          });
          showToast(`状态已流转为: ${RETURN_STATUS_LABELS[nextStatus]}`);
        }
      } else if (actionKey.startsWith('reject-')) {
        setReturnsDb((prev) => {
          const item = prev[returnId];
          if (!item) return prev;
          return {
            ...prev,
            [returnId]: { ...item, status: 'rejected', updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') },
          };
        });
        showToast('退货单已拒绝');
      }
    },
    [ret, returnId, showToast],
  );

  /** 删除 */
  const handleDelete = useCallback(() => {
    if (!ret) return;
    setReturnsDb((prev) => {
      const next = { ...prev };
      delete next[returnId];
      return next;
    });
    setIsDeleted(true);
    showToast('退货单已删除');
    setTimeout(() => router.push('/returns'), 2000);
  }, [ret, returnId, router, showToast]);

  /** 编辑占位 */
  const handleEdit = useCallback(() => {
    showToast('编辑功能已触发（跳转待实现）');
  }, [showToast]);

  if (isDeleted) {
    return (
      <DetailShell title="退货单详情">
        <EmptyState title="已删除" description="该退货单已成功删除，即将返回列表" />
      </DetailShell>
    );
  }

  if (!ret) {
    return (
      <DetailShell title="退货单详情">
        <EmptyState title="未找到退货单" description={`ID 为 "${returnId}" 的退货单不存在`} />
      </DetailShell>
    );
  }

  const closureLinks: DetailClosureLink[] = [
    { key: 'back-to-returns', title: '退货单列表', subtitle: '点击返回退货单管理页面', href: '/returns' },
  ];

  const actionItems: DetailActionBarAction[] = [
    { key: 'edit', label: '✏️ 编辑', variant: 'default', onClick: handleEdit },
    ...makeStatusActions(ret.status, handleStatusTransition),
    { key: 'delete', label: '🗑️ 删除', variant: 'danger', onClick: () => setShowDeleteConfirm(true) },
  ];

  const infoFields: DescriptionItem[] = [
    { label: '退货单号', value: ret.returnNo },
    { label: '关联订单', value: ret.orderNo },
    { label: '客户姓名', value: ret.customerName },
    { label: '联系电话', value: ret.customerPhone },
    { label: '商品名称', value: ret.productName },
    { label: '商品 SKU', value: ret.productSku },
    { label: '退货数量', value: `${ret.quantity} 件` },
    { label: '退款金额', value: fmtCurrency(ret.amount) },
    { label: '退货原因', value: ret.reason },
    { label: '当前状态', value: <ReturnStatusBadge status={ret.status} /> },
    { label: '创建人', value: ret.createdBy },
    { label: '创建时间', value: ret.createdAt },
    { label: '更新时间', value: ret.updatedAt },
  ];

  return (
    <>
      {toast && (
        <div
          style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            padding: '12px 24px', borderRadius: 12,
            background: '#22c55e', color: '#fff', fontWeight: 600,
            fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {toast}
        </div>
      )}

      <DetailShell
        title={`退货单详情 — ${ret.returnNo}`}
        subtitle={`客户: ${ret.customerName} | 商品: ${ret.productName}  |  状态: ${RETURN_STATUS_LABELS[ret.status]}`}
      >
        <DescriptionList items={infoFields} columns={2} />

        <DetailActionBar actions={actionItems} />

        <DetailClosureBar links={closureLinks} />
      </DetailShell>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="确认删除"
        message={`确定要删除退货单 "${ret.returnNo}" 吗？此操作不可撤销。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        variant="danger"
        onConfirm={() => { setShowDeleteConfirm(false); handleDelete(); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
