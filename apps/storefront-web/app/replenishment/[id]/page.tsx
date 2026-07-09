/**
 * 补货单详情页 — Replenishment Detail Page (Next.js App Router Page)
 * 类型: B-详情页 (含编辑/删除/状态流转)
 * 角色视角: 👔店长 / 🔧仓管
 * 功能: 查看补货单详情、审核/驳回/取消操作、状态流转
 */
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  PageShell,
  DetailShell,
  Badge,
  StatusBadge,
  DescriptionList,
  Timeline,
  ConfirmActionDialog,
  LoadingSkeleton,
  EmptyState,
  Button,
} from '@m5/ui';
import type {
  TimelineItem,
  TimelineItemVariant,
  DetailShellAction,
} from '@m5/ui';

/** 补货申请状态 */
type ReplenishmentStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'shipped'
  | 'completed'
  | 'rejected'
  | 'cancelled';

/** 补货明细项 */
interface ReplenishmentLine {
  id: string;
  productName: string;
  sku: string;
  currentStock: number;
  suggestedQty: number;
  unit: string;
  remark?: string;
}

/** 补货申请单详情 */
interface ReplenishmentDetail {
  id: string;
  orderNo: string;
  storeName: string;
  applicant: string;
  applicantPhone: string;
  itemCount: number;
  totalEstimatedQty: number;
  urgent: boolean;
  status: ReplenishmentStatus;
  reason: string;
  remark: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
  lines: ReplenishmentLine[];
}

/** 状态流转操作 */
type Action = 'approve' | 'reject' | 'cancel' | 'ship' | 'complete';

/* ── Mock 详情数据 ── */
const MOCK_DETAIL: ReplenishmentDetail = {
  id: 'rp-001',
  orderNo: 'BC-20260709-001',
  storeName: '朝阳旗舰店',
  applicant: '张三',
  applicantPhone: '138****5678',
  itemCount: 15,
  totalEstimatedQty: 320,
  urgent: true,
  status: 'pending_approval',
  reason: '库存预警，热销商品库存不足',
  remark: '下周有大型促销活动，请优先处理',
  createdAt: '2026-07-09 08:30',
  lines: [
    { id: 'l1', productName: '可乐（罐装）', sku: 'CL-001', currentStock: 12, suggestedQty: 60, unit: '罐', remark: '畅销饮品' },
    { id: 'l2', productName: '薯片（大包装）', sku: 'SP-002', currentStock: 5, suggestedQty: 40, unit: '袋' },
    { id: 'l3', productName: '矿泉水 500ml', sku: 'WTR-003', currentStock: 20, suggestedQty: 80, unit: '瓶', remark: '夏季高峰' },
    { id: 'l4', productName: '纸巾（抽式）', sku: 'TSS-004', currentStock: 8, suggestedQty: 30, unit: '包' },
    { id: 'l5', productName: '口香糖（薄荷味）', sku: 'GM-005', currentStock: 3, suggestedQty: 20, unit: '瓶' },
  ],
};

const mockGetDetail = (id: string): Promise<ReplenishmentDetail> =>
  Promise.resolve({ ...MOCK_DETAIL, id });

/** 状态 → 徽章映射 */
const statusVariant = (s: ReplenishmentStatus): 'success' | 'warning' | 'info' | 'default' | 'error' => {
  const map: Record<ReplenishmentStatus, 'success' | 'warning' | 'info' | 'default' | 'error'> = {
    draft: 'default',
    pending_approval: 'warning',
    approved: 'info',
    shipped: 'info',
    completed: 'success',
    rejected: 'error',
    cancelled: 'error',
  };
  return map[s];
};

const STATUS_LABEL: Record<ReplenishmentStatus, string> = {
  draft: '草稿',
  pending_approval: '待审核',
  approved: '已通过',
  shipped: '已发货',
  completed: '已完成',
  rejected: '已驳回',
  cancelled: '已取消',
};

/** 根据当前状态计算可用操作 */
const getAvailableActions = (status: ReplenishmentStatus): Action[] => {
  const map: Record<ReplenishmentStatus, Action[]> = {
    draft: ['cancel'],
    pending_approval: ['approve', 'reject'],
    approved: ['ship'],
    shipped: ['complete'],
    completed: [],
    rejected: [],
    cancelled: [],
  };
  return map[status] ?? [];
};

const ACTION_LABEL: Record<Action, string> = {
  approve: '审核通过',
  reject: '驳回',
  cancel: '取消申请',
  ship: '标记已发货',
  complete: '标记已完成',
};

/** 生成时间线 */
const buildTimeline = (detail: ReplenishmentDetail): TimelineItem[] => {
  const vSuccess: TimelineItemVariant = 'success';
  const vError: TimelineItemVariant = 'error';
  const vInfo: TimelineItemVariant = 'info';
  const items: TimelineItem[] = [
    { key: 'created', heading: '创建申请', subtitle: `${detail.applicant} · ${detail.createdAt}`, variant: vSuccess },
  ];
  if (detail.approvedAt) {
    const variant: TimelineItemVariant = detail.status === 'rejected' ? vError : vSuccess;
    items.push({
      key: 'approval',
      heading: detail.status === 'rejected' ? '已驳回' : '审核通过',
      subtitle: detail.approvedAt,
      variant,
    });
  }
  if (detail.status === 'shipped' || detail.status === 'completed') {
    items.push({ key: 'shipped', heading: '已发货', variant: vSuccess });
  }
  if (detail.status === 'completed') {
    items.push({ key: 'completed', heading: '已完成', variant: vSuccess });
  }
  if (detail.status === 'cancelled') {
    items.push({ key: 'cancelled', heading: '已取消', variant: vError });
  }
  if (!['draft', 'completed', 'rejected', 'cancelled'].includes(detail.status)) {
    items.push({ key: 'pending', heading: '进行中', variant: vInfo });
  }
  return items;
};

// ── 组件 ──

export default function ReplenishmentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [detail, setDetail] = useState<ReplenishmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  React.useEffect(() => {
    mockGetDetail(id).then((data) => {
      setDetail(data);
      setLoading(false);
    });
  }, [id]);

  const availableActions = useMemo(() => detail ? getAvailableActions(detail.status) : [], [detail]);

  const handleAction = useCallback((action: Action) => {
    setConfirmAction(action);
  }, []);

  const confirmExecute = useCallback(() => {
    if (!confirmAction || !detail) return;
    setActionLoading(true);
    setTimeout(() => {
      const nextStatus: Record<Action, ReplenishmentStatus> = {
        approve: 'approved',
        reject: 'rejected',
        cancel: 'cancelled',
        ship: 'shipped',
        complete: 'completed',
      };
      const newStatus = nextStatus[confirmAction];
      setDetail((prev) => prev ? { ...prev, status: newStatus } : prev);
      setActionLoading(false);
      setConfirmAction(null);
    }, 800);
  }, [confirmAction, detail]);

  if (loading) {
    return (
      <PageShell title="补货单详情">
        <LoadingSkeleton />
      </PageShell>
    );
  }

  if (!detail) {
    return (
      <PageShell title="补货单详情">
        <EmptyState title="补货单不存在" description={`ID: ${id}`} />
      </PageShell>
    );
  }

  const timelineItems = buildTimeline(detail);

  const shellActions: DetailShellAction[] = availableActions.map((a) => ({
    key: a,
    label: ACTION_LABEL[a],
    variant: a === 'approve' ? 'primary' : a === 'reject' ? 'danger' : 'secondary',
    onClick: () => handleAction(a),
  }));

  return (
    <PageShell title={`补货单 · ${detail.orderNo}`} description={`${detail.storeName} · ${detail.applicant}`}>
      <DetailShell
        title={`补货单 · ${detail.orderNo}`}
        subtitle={`${detail.storeName} · ${detail.applicant}`}
        actions={shellActions}
        onBack={() => router.push('/replenishment')}
      >
        <DescriptionList
          items={[
            { label: '单号', value: detail.orderNo },
            { label: '门店', value: detail.storeName },
            { label: '申请人', value: `${detail.applicant}（${detail.applicantPhone}）` },
            {
              label: '状态',
              value: <StatusBadge label={STATUS_LABEL[detail.status]} variant={statusVariant(detail.status)} />,
            },
            { label: '紧急程度', value: detail.urgent ? <Badge variant="error">紧急</Badge> : <Badge>普通</Badge> },
            { label: '申请原因', value: detail.reason },
            { label: '备注', value: detail.remark || '无' },
            { label: '创建时间', value: detail.createdAt },
          ]}
          columns={2}
        />

        <h3 style={{ margin: '24px 0 12px', fontSize: 16, fontWeight: 600 }}>
          补货明细（{detail.lines.length} 项）
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={thStyle}>商品名称</th>
              <th style={thStyle}>SKU</th>
              <th style={thStyle}>当前库存</th>
              <th style={thStyle}>建议补货</th>
              <th style={thStyle}>单位</th>
              <th style={thStyle}>备注</th>
            </tr>
          </thead>
          <tbody>
            {detail.lines.map((line) => (
              <tr key={line.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>{line.productName}</td>
                <td style={tdStyle}><code>{line.sku}</code></td>
                <td style={tdStyle}>{line.currentStock}</td>
                <td style={tdStyle}>{line.suggestedQty}</td>
                <td style={tdStyle}>{line.unit}</td>
                <td style={tdStyle}>{line.remark || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{ margin: '24px 0 12px', fontSize: 16, fontWeight: 600 }}>状态流转</h3>
        <Timeline items={timelineItems} />

        <div style={{ marginTop: 24 }}>
          <Button variant="ghost" onClick={() => router.push('/replenishment')}>
            {'← 返回列表'}
          </Button>
        </div>
      </DetailShell>

      {confirmAction && (
        <ConfirmActionDialog
          open
          title={ACTION_LABEL[confirmAction]}
          message={`确认${ACTION_LABEL[confirmAction]}该补货申请？`}
          confirmLabel={ACTION_LABEL[confirmAction]}
          loading={actionLoading}
          confirmVariant={confirmAction === 'reject' || confirmAction === 'cancel' ? 'danger' : 'primary'}
          onConfirm={confirmExecute}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </PageShell>
  );
}

const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#666' };
const tdStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left' };
