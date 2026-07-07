/**
 * stock-transfer/[id]/page.tsx — 库存调拨详情页 (ToB Next.js App Router Page)
 *
 * 展示调拨单详细信息（调出/调入地、SKU明细、审批流转日志）
 * 支持编辑 / 审批 / 取消 / 删除操作
 * 角色视角: 👔品牌运营 / 📦仓库管理员 / 💳采购经理
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useCallback } from 'react';

import {
  PageShell,
  DetailShell,
  StatusBadge,
  Badge,
  Modal,
  SubmitButton,
  FormField,
  FormSubmitFeedback,
  DataTable,
  DataTableColumn,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';

import {
  type StockTransferItem,
  type TransferStatus,
  type TransferType,
  type StockTransferItem as STItem,
  TRANSFER_STATUS_LABELS,
  TRANSFER_TYPE_LABELS,
  MOCK_TRANSFERS,
} from '../data';

// ---- 扩展：调拨明细行 ----

interface TransferLineItem {
  sku: string;
  productName: string;
  specification: string;
  quantity: number;
  unit: string;
  remark: string;
}

const LINE_ITEMS: Record<string, TransferLineItem[]> = {
  '1': [
    { sku: 'M5-FC-001', productName: '氨基酸洁面乳', specification: '120ml', quantity: 60, unit: '支', remark: '热销SKU紧急补货' },
    { sku: 'M5-FC-002', productName: '水润保湿水', specification: '200ml', quantity: 30, unit: '瓶', remark: '' },
    { sku: 'M5-FC-003', productName: '净透卸妆油', specification: '150ml', quantity: 30, unit: '瓶', remark: '新品推广' },
  ],
  '2': [
    { sku: 'M5-LP-001', productName: '丝绒哑光唇膏 #08', specification: '3.5g', quantity: 8, unit: '支', remark: '调拨热销色号' },
    { sku: 'M5-LP-002', productName: '丝绒哑光唇膏 #12', specification: '3.5g', quantity: 7, unit: '支', remark: '' },
  ],
  '3': [
    { sku: 'M5-EX-001', productName: '紧致眼霜', specification: '15g', quantity: 20, unit: '瓶', remark: '临期品退回（效期至2026-09）' },
    { sku: 'M5-EX-002', productName: '修护精华液', specification: '30ml', quantity: 28, unit: '瓶', remark: '临期品退回' },
  ],
  '4': [
    { sku: 'M5-SP-001', productName: '防晒乳 SPF50+', specification: '60ml', quantity: 100, unit: '支', remark: '' },
    { sku: 'M5-SP-002', productName: '防晒喷雾 SPF30', specification: '150ml', quantity: 60, unit: '瓶', remark: '' },
    { sku: 'M5-SP-003', productName: '晒后修复凝胶', specification: '100ml', quantity: 40, unit: '支', remark: '' },
  ],
  '8': [
    { sku: 'M5-MS-001', productName: '玻尿酸面膜', specification: '5片/盒', quantity: 10, unit: '盒', remark: '调拨爆款' },
  ],
};

// ---- 审批日志 ----

interface ApprovalLog {
  id: string;
  timestamp: string;
  action: string;
  operator: string;
  comment: string;
}

const APPROVAL_LOGS: Record<string, ApprovalLog[]> = {
  '1': [
    { id: 'log-1', timestamp: '2026-06-28 08:30', action: '提交申请', operator: '张经理', comment: '门店补货-洁面系列' },
    { id: 'log-2', timestamp: '2026-06-28 09:00', action: '审批通过', operator: '陈主管', comment: '同意调拨' },
    { id: 'log-3', timestamp: '2026-06-28 10:30', action: '开始发货', operator: '仓库-李师傅', comment: '已打包并发货' },
  ],
  '3': [
    { id: 'log-1', timestamp: '2026-06-27 14:00', action: '提交申请', operator: '王店长', comment: '临期品退回' },
    { id: 'log-2', timestamp: '2026-06-27 14:30', action: '审批通过', operator: '陈主管', comment: '确认退货' },
    { id: 'log-3', timestamp: '2026-06-27 15:00', action: '已发货', operator: '北京分店-小王', comment: '打包完成' },
    { id: 'log-4', timestamp: '2026-06-27 16:30', action: '已收货', operator: '仓库-李师傅', comment: '验收无误，已入库' },
  ],
};

// ---- 状态映射 ----

const STATUS_VARIANTS: Record<TransferStatus, 'success' | 'warning' | 'info' | 'neutral' | 'error'> = {
  draft: 'neutral',
  pending: 'warning',
  approved: 'info',
  in_transit: 'warning',
  completed: 'success',
  cancelled: 'error',
};

const TYPE_VARIANTS: Record<TransferType, 'info' | 'success' | 'warning'> = {
  store_to_store: 'info',
  warehouse_to_store: 'success',
  store_to_warehouse: 'warning',
};

// ---- 样式 ----

const sectionStyle: React.CSSProperties = {
  marginBottom: 16,
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,0.12)',
  background: 'rgba(15,23,42,0.4)',
  padding: 20,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: 14,
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={sectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </section>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', minHeight: 28 }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
      {children ?? <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{value}</span>}
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 8, background: 'rgba(15,23,42,0.3)' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'transparent',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: 13,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'rgba(15,23,42,0.6)',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

// ---- 列定义 ----

const LINE_COLUMNS: DataTableColumn<TransferLineItem>[] = [
  { key: 'sku', header: 'SKU' },
  { key: 'productName', header: '商品名称' },
  { key: 'specification', header: '规格' },
  { key: 'quantity', header: '数量', align: 'right' },
  { key: 'unit', header: '单位' },
  { key: 'remark', header: '备注' },
];

// ---- 编辑弹窗 ----

type EditFormData = {
  reason: string;
  itemsCount: number;
  totalQuantity: number;
};

function EditTransferModal({
  open,
  onClose,
  onSaved,
  transfer,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (data: EditFormData) => void;
  transfer: StockTransferItem;
}) {
  const [form, setForm] = useState<EditFormData>({
    reason: transfer.reason,
    itemsCount: transfer.itemsCount,
    totalQuantity: transfer.totalQuantity,
  });

  const { submitting, error, success, submit, clearError } = useFormSubmit({
    onSubmit: async () => {
      if (!form.reason.trim()) throw new Error('调拨原因不能为空');
      onSaved(form);
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="编辑调拨单">
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="调拨原因" error={!form.reason.trim() ? '原因不能为空' : undefined}>
          <input value={form.reason} onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="调拨原因" style={inputStyle} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="SKU 数">
            <input type="number" value={form.itemsCount} onChange={(e) => setForm(p => ({ ...p, itemsCount: +e.target.value }))} style={inputStyle} />
          </FormField>
          <FormField label="总数量">
            <input type="number" value={form.totalQuantity} onChange={(e) => setForm(p => ({ ...p, totalQuantity: +e.target.value }))} style={inputStyle} />
          </FormField>
        </div>
        <FormSubmitFeedback submitting={submitting} error={error} success={success} onDismissError={clearError} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>取消</button>
          <SubmitButton loading={submitting} type="submit">保存</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ---- 审批弹窗 ----

function ApproveModal({
  open,
  onClose,
  onConfirm,
  transfer,
  action,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  transfer: StockTransferItem;
  action: 'approve' | 'cancel';
}) {
  const [comment, setComment] = useState('');
  const { submitting, submit } = useFormSubmit({
    onSubmit: async () => { onConfirm(comment); },
  });

  const actionLabel = action === 'approve' ? '审批通过' : '取消调拨';
  const actionColor = action === 'approve' ? '#22c55e' : '#ef4444';

  return (
    <Modal open={open} onClose={onClose} title={actionLabel}>
      <div style={{ color: '#cbd5e1', marginBottom: 16 }}>
        确定{actionLabel}调拨单「{transfer.transferNo}」吗？
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="审批意见（可选）"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>取消</button>
          <SubmitButton loading={submitting} type="submit" style={{ background: actionColor, border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            确认{actionLabel}
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ---- 详情页 ----

export default function StockTransferDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [transfer, setTransfer] = useState<StockTransferItem | undefined>(
    () => MOCK_TRANSFERS.find((t) => t.id === params.id),
  );
  const [editOpen, setEditOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const lineItems = useMemo(() => {
    const items = LINE_ITEMS[transfer?.id ?? ''];
    return items ?? [];
  }, [transfer?.id]);

  const approvalLogs = useMemo(() => {
    return APPROVAL_LOGS[transfer?.id ?? ''] ?? [];
  }, [transfer?.id]);

  const handleEditSave = useCallback((data: EditFormData) => {
    setTransfer((prev) =>
      prev ? { ...prev, reason: data.reason, itemsCount: data.itemsCount, totalQuantity: data.totalQuantity } : prev,
    );
    setEditOpen(false);
  }, []);

  const handleApprove = useCallback((comment: string) => {
    setTransfer((prev) =>
      prev ? { ...prev, status: 'in_transit' as TransferStatus } : prev,
    );
    setApproveOpen(false);
  }, []);

  const handleCancel = useCallback((comment: string) => {
    setTransfer((prev) =>
      prev ? { ...prev, status: 'cancelled' as TransferStatus } : prev,
    );
    setCancelOpen(false);
  }, []);

  const detailActions: DetailShellAction[] = useMemo(() => {
    if (!transfer) return [];

    const actions: DetailShellAction[] = [];
    const status = transfer.status;

    // 草稿/待审批 → 可编辑 + 可取消
    if (status === 'draft' || status === 'pending') {
      actions.push({ key: 'edit', label: '编辑', onClick: () => setEditOpen(true), variant: 'primary' });
    }

    // 待审批 → 可审批
    if (status === 'pending') {
      actions.push({ key: 'approve', label: '审批通过', onClick: () => setApproveOpen(true), variant: 'primary' });
    }

    // 非已完成/已取消 → 可取消
    if (status !== 'completed' && status !== 'cancelled') {
      actions.push({ key: 'cancel', label: '取消调拨', onClick: () => setCancelOpen(true), variant: 'secondary' });
    }

    actions.push({ key: 'back', label: '返回列表', onClick: () => router.push('/stock-transfer'), variant: 'secondary' });

    return actions;
  }, [transfer]);

  if (!transfer) {
    return (
      <PageShell title="调拨单详情">
        <div style={{ textAlign: 'center', padding: 64, color: '#64748b', fontSize: 14 }}>
          未找到调拨单 (ID: {params.id})
        </div>
      </PageShell>
    );
  }

  const typeLabel = TRANSFER_TYPE_LABELS[transfer.type];
  const typeVar = TYPE_VARIANTS[transfer.type];
  const statusLabel = TRANSFER_STATUS_LABELS[transfer.status];
  const statusVar = STATUS_VARIANTS[transfer.status];

  return (
    <PageShell
      title={transfer.transferNo}
      description={`调拨单详情 · ${typeLabel}`}
    >
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
        <StatBadge label="类型" value={typeLabel} color="#60a5fa" />
        <StatBadge label="SKU 数" value={String(transfer.itemsCount)} color="#fbbf24" />
        <StatBadge label="总数量" value={String(transfer.totalQuantity)} color="#4ade80" />
        <StatBadge label="状态" value={statusLabel} color={statusVar === 'success' ? '#4ade80' : statusVar === 'error' ? '#ef4444' : '#fbbf24'} />
      </div>

      {/* 基本信息 */}
      <InfoSection title="调拨信息">
        <InfoRow label="调拨单号" value={transfer.transferNo} />
        <InfoRow label="类型">
          <Badge variant={typeVar}>{typeLabel}</Badge>
        </InfoRow>
        <InfoRow label="调出地">{transfer.fromLocation}</InfoRow>
        <InfoRow label="调入地">{transfer.toLocation}</InfoRow>
        <InfoRow label="状态">
          <StatusBadge label={statusLabel} variant={statusVar} size="sm" dot />
        </InfoRow>
        <InfoRow label="调拨原因" value={transfer.reason} />
      </InfoSection>

      {/* 人员信息 */}
      <InfoSection title="人员信息">
        <InfoRow label="申请人" value={transfer.applicant} />
        <InfoRow label="审批人" value={transfer.approver || '待审批'} />
        <InfoRow label="申请时间" value={transfer.appliedAt} />
        {transfer.completedAt && <InfoRow label="完成时间" value={transfer.completedAt} />}
      </InfoSection>

      {/* SKU 明细 */}
      {lineItems.length > 0 && (
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>商品明细</h3>
          <DataTable columns={LINE_COLUMNS} rows={lineItems} rowKey={(r) => r.sku} />
        </section>
      )}

      {/* 审批日志 */}
      {approvalLogs.length > 0 && (
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>操作日志</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {approvalLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(15,23,42,0.3)',
                }}
              >
                <div style={{ minWidth: 100, fontSize: 12, color: '#64748b' }}>{log.timestamp}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{log.action}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {log.operator}{log.comment ? ` · ${log.comment}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 弹窗 */}
      <EditTransferModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={handleEditSave} transfer={transfer} />
      <ApproveModal open={approveOpen} onClose={() => setApproveOpen(false)} onConfirm={handleApprove} transfer={transfer} action="approve" />
      <ApproveModal open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={handleCancel} transfer={transfer} action="cancel" />
    </PageShell>
  );
}
