/**
 * Stock Transfer Detail Client — 库存调拨详情页
 * 角色视角: 👔运营主管 / 📦仓储经理 / 💰财务
 * 功能: 调拨详情展示、状态流转、备注编辑、生命周期时间线
 */
'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';

import {
  DetailClosureBar,
  DetailShell,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatusBadge,
  StatCard,
  SubmitButton,
  Timeline,
  WorkspaceBreadcrumb,
  useFormSubmit,
  type DetailShellAction,
  type TimelineItem,
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';
import {
  buildStandardBreadcrumb,
  buildStandardClosureLinks,
} from '../../components/detail-workspace-registry';
import {
  MOCK_TRANSFERS,
  TYPE_LABEL,
  STATUS_LABEL,
  STATUS_STYLE,
  URGENCY_LABEL,
  URGENCY_VARIANT,
  STATUS_FLOW,
  type StockTransferItem,
  type TransferStatus,
} from '../stock-transfer-data';

// ---- 辅助 ----

const TYPE_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
  supply: 'info',
  return: 'warning',
  move: 'success',
  emergency: 'default',
};

function formatDate(dateStr: string): string {
  return dateStr;
}

function generateTimeline(item: StockTransferItem): TimelineItem[] {
  const items: TimelineItem[] = [];

  items.push({
    key: 'created',
    heading: '创建调拨单',
    subtitle: formatDate(item.createdAt),
    content: `由 ${item.createdBy} 创建 · ${TYPE_LABEL[item.type]}`,
    variant: 'info',
  });

  if (item.status === 'approved' || item.status === 'shipped' || item.status === 'received') {
    items.push({
      key: 'approved',
      heading: '审核通过',
      subtitle: formatDate(item.updatedAt),
      content: '调拨申请已审批通过',
      variant: 'success',
    });
  }

  if (item.status === 'shipped' || item.status === 'received') {
    items.push({
      key: 'shipped',
      heading: '已发货',
      subtitle: formatDate(item.updatedAt),
      content: `从 ${item.sourceStoreName} 发出 ${item.quantity} 件`,
      variant: 'info',
    });
  }

  if (item.status === 'received') {
    items.push({
      key: 'received',
      heading: '已收货',
      subtitle: formatDate(item.updatedAt),
      content: `${item.targetStoreName} 已确认收货`,
      variant: 'success',
    });
  }

  if (item.status === 'rejected') {
    items.push({
      key: 'rejected',
      heading: '已驳回',
      subtitle: formatDate(item.updatedAt),
      content: '调拨申请被驳回',
      variant: 'error',
    });
  }

  if (item.status === 'cancelled') {
    items.push({
      key: 'cancelled',
      heading: '已撤销',
      subtitle: formatDate(item.updatedAt),
      content: '调拨单已被撤销',
      variant: 'warning',
    });
  }

  // 终态标记
  const terminalStatuses: TransferStatus[] = ['received', 'rejected', 'cancelled'];
  if (!terminalStatuses.includes(item.status)) {
    items.push({
      key: 'pending-flow',
      heading: item.status === 'pending' ? '待审核' : item.status === 'approved' ? '待发货' : '待收货',
      subtitle: '进行中',
      content: '等待下一步操作',
      variant: 'default' as const,
      pending: true,
    });
  }

  return items;
}

function findNextStatuses(status: TransferStatus): TransferStatus[] {
  return STATUS_FLOW[status] ?? [];
}

const STATUS_ACTION_LABEL: Record<TransferStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  shipped: '已发货',
  received: '已收货',
  rejected: '已驳回',
  cancelled: '已撤销',
};

// ---- 组件 ----

function StockTransferDetailContent({ transferId }: { transferId: string }) {
  const transfer = useMemo(
    () => MOCK_TRANSFERS.find((t) => t.id === transferId),
    [transferId],
  );

  const [remark, setRemark] = useState(transfer?.remark ?? '');

  const nextStatuses = useMemo(() => transfer ? findNextStatuses(transfer.status) : [], [transfer]);
  const isTerminal = useMemo(() => transfer ? findNextStatuses(transfer.status).length === 0 : false, [transfer]);
  const timeline = useMemo(() => transfer ? generateTimeline(transfer) : [], [transfer]);

  const formSubmit = useFormSubmit({
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 300));
    },
  });

  const { actions: detailBarActions } = useDetailActions({
    workspace: 'stock-transfer',
    detailId: transferId,
    record: transfer,
    shareTitle: transfer?.transferNo ?? transferId,
    shareText: `查看库存调拨单 ${transfer?.transferNo ?? transferId} 详情`,
  });

  if (!transfer) {
    return (
      <main style={{ maxWidth: 860, margin: '0 auto', padding: 32, color: '#f87171' }}>
        <p>未找到该调拨单（ID: {transferId}）</p>
        <Link href="/stock-transfer" style={{ color: '#60a5fa' }}>← 返回调拨列表</Link>
      </main>
    );
  }

  const c = transfer;

  const actions: DetailShellAction[] = detailBarActions.map((a) => ({
    key: a.key,
    label: a.label,
    variant: 'primary' as const,
    onClick: a.onClick,
  }));

  const statusFlowActions: DetailShellAction[] = nextStatuses.map((ns) => ({
    key: `flow-${ns}`,
    label: STATUS_ACTION_LABEL[ns],
    variant: (ns === 'rejected' || ns === 'cancelled') ? 'danger' as const : 'primary' as const,
    onClick: async () => {
      await formSubmit.submit();
    },
  }));

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'stock-transfer', detailLabel: c.transferNo })}
      />

      <DetailShell
        title={c.transferNo}
        subtitle={`${TYPE_LABEL[c.type]} · ${c.productName} (${c.productSku})`}
        actions={actions}
      >
        {/* 顶部统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 24,
          }}
        >
          <StatCard label="调拨数量" value={`${c.quantity}`} />
          <StatCard label="调出" value={c.sourceStoreName} />
          <StatCard label="调入" value={c.targetStoreName} />
          <StatCard label="创建人" value={c.createdBy} />
        </div>

        {/* 状态概要横幅 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            padding: '16px 20px',
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <StatusBadge label={STATUS_LABEL[c.status]} variant={STATUS_STYLE[c.status]} size="md" dot />
          <StatusBadge label={TYPE_LABEL[c.type]} variant={TYPE_VARIANT[c.type]} size="sm" />
          <StatusBadge label={URGENCY_LABEL[c.urgency]} variant={URGENCY_VARIANT[c.urgency]} size="sm" />
          {isTerminal && (
            <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
              终态 · 不可流转
            </span>
          )}
        </div>

        {/* 基本信息 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            margin: '20px 0',
            padding: 20,
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <InfoRow label="调拨单号" value={c.transferNo} />
          <InfoRow
            label="状态"
            value={<StatusBadge label={STATUS_LABEL[c.status]} variant={STATUS_STYLE[c.status]} size="sm" dot />}
          />
          <InfoRow label="调出库房" value={`${c.sourceStoreName} (${c.sourceStore})`} />
          <InfoRow label="调入库房" value={`${c.targetStoreName} (${c.targetStore})`} />
          <InfoRow label="商品名称" value={c.productName} />
          <InfoRow label="商品SKU" value={c.productSku} />
          <InfoRow label="调拨数量" value={`${c.quantity} 件`} />
          <InfoRow label="紧急程度" value={URGENCY_LABEL[c.urgency]} />
          <InfoRow label="创建人" value={c.createdBy} />
          <InfoRow label="创建时间" value={c.createdAt} />
          <InfoRow label="最后更新" value={c.updatedAt} />
          <InfoRow label="备注" value={c.remark || '(无)'} />
        </div>

        {/* 状态流转操作 */}
        {!isTerminal && statusFlowActions.length > 0 && (
          <div
            style={{
              marginBottom: 24,
              padding: 16,
              borderRadius: 12,
              border: '1px solid rgba(148, 163, 184, 0.15)',
              background: 'rgba(15, 23, 42, 0.3)',
            }}
          >
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
              状态流转操作
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {statusFlowActions.map((action) => (
                <SubmitButton
                  key={action.key}
                  onClick={action.onClick}
                  loading={formSubmit.submitting}
                  variant={action.variant === 'danger' ? 'danger' : 'primary'}
                >
                  {action.label}
                </SubmitButton>
              ))}
            </div>
          </div>
        )}

        {/* 备注编辑 */}
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(148, 163, 184, 0.15)',
            background: 'rgba(15, 23, 42, 0.3)',
          }}
        >
          <FormField label="备注信息" helper="编辑备注后点击保存">
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(148, 163, 184, 0.25)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#e2e8f0',
                fontSize: 14,
                minHeight: 80,
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                boxSizing: 'border-box',
              }}
              placeholder="输入备注信息"
            />
          </FormField>
          <SubmitButton
            onClick={async () => {
              await formSubmit.submit();
            }}
            loading={formSubmit.submitting}
            style={{ marginTop: 8 }}
          >
            保存备注
          </SubmitButton>
          {formSubmit.success && (
            <FormSubmitFeedback success="备注已更新" />
          )}
          {formSubmit.error && (
            <FormSubmitFeedback error={formSubmit.error} />
          )}
        </div>

        {/* 生命周期时间线 */}
        <div style={{ marginTop: 28, marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>
            调拨生命周期
          </h3>
          <Timeline items={timeline} />
        </div>
      </DetailShell>

      <DetailClosureBar
        links={buildStandardClosureLinks({
          workspace: 'stock-transfer',
          detailId: transferId,
          closureLabel: '返回调拨列表',
        })}
      />
    </main>
  );
}

export default function StockTransferDetailClient({ transferId }: { transferId: string }) {
  return <StockTransferDetailContent transferId={transferId} />;
}
