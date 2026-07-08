/**
 * 退换货详情页 — Return Detail Page (Next.js App Router Page)
 * 角色视角: 👤运营管理 / 💰财务 / 🛒客服
 * 功能: 查看详情、编辑、删除、状态流转（审核/收货/退款/换货/关闭）
 */
'use client';

import { use, useState, useCallback } from 'react';
import {
  DetailActionBar,
  DetailClosureBar,
  DetailShell,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatusBadge,
  StatCard,
  CopyToClipboard,
  SubmitButton,
  WorkspaceBreadcrumb,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

// ---- 类型 ----

type ReturnType = 'refund' | 'exchange' | 'repair';
type ReturnStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'return_received'
  | 'refund_issued'
  | 'replacement_sent'
  | 'closed';

interface ReturnItem {
  sku: string;
  name: string;
  spec: string;
  purchasedQty: number;
  returnQty: number;
  unitPrice: number;
  defective: boolean;
  reason: string;
}

interface ReturnDetail {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  memberTier?: string;
  returnType: ReturnType;
  status: ReturnStatus;
  appliedAt: string;
  handler?: string;
  remark?: string;
  items: ReturnItem[];
  refundAmount: number;
  exchangeExtra?: number;
}

// ---- 常量和映射 ----

const RETURN_TYPE_LABELS: Record<ReturnType, string> = {
  refund: '仅退款',
  exchange: '换货',
  repair: '维修',
};

const RETURN_STATUS_MAP: Record<ReturnStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'error' | 'neutral' | 'default' }> = {
  pending_review: { label: '待审核', variant: 'warning' },
  approved: { label: '已通过', variant: 'info' },
  rejected: { label: '已拒绝', variant: 'error' },
  return_received: { label: '已收货', variant: 'info' },
  refund_issued: { label: '已退款', variant: 'success' },
  replacement_sent: { label: '已换货', variant: 'success' },
  closed: { label: '已关闭', variant: 'neutral' },
};

/** 状态流转配置 */
const TRANSITION_ACTIONS: { from: ReturnStatus; to: ReturnStatus; label: string }[] = [
  { from: 'pending_review', to: 'approved', label: '通过审核' },
  { from: 'pending_review', to: 'rejected', label: '拒绝申请' },
  { from: 'approved', to: 'return_received', label: '确认收货' },
  { from: 'approved', to: 'rejected', label: '撤销通过' },
  { from: 'return_received', to: 'refund_issued', label: '确认退款' },
  { from: 'return_received', to: 'replacement_sent', label: '发出换货' },
  { from: 'refund_issued', to: 'closed', label: '关闭退单' },
  { from: 'replacement_sent', to: 'closed', label: '完成换货' },
  { from: 'rejected', to: 'pending_review', label: '重新审核' },
  { from: 'refund_issued', to: 'closed', label: '关闭' },
  { from: 'replacement_sent', to: 'closed', label: '关闭' },
];

function formatPrice(cents: number): string {
  return `¥${(cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

// ---- Mock 退换货详情数据 ----

const MOCK_RETURN_DETAILS: Record<string, ReturnDetail> = {
  'RET-20260708-001': {
    id: 'RET-20260708-001', orderNo: 'ORD-20260708-1001',
    customerName: '张明', customerPhone: '138****0001', memberTier: 'gold',
    returnType: 'refund', status: 'pending_review',
    appliedAt: '2026-07-08T09:15:00Z',
    refundAmount: 29900,
    items: [
      { sku: 'SKU-A001', name: '电竞椅', spec: '黑色/标准', purchasedQty: 1, returnQty: 1, unitPrice: 29900, defective: false, reason: '尺寸不合适' },
    ],
  },
  'RET-20260708-002': {
    id: 'RET-20260708-002', orderNo: 'ORD-20260708-1002',
    customerName: '李丽', customerPhone: '139****0002', memberTier: 'platinum',
    returnType: 'exchange', status: 'approved',
    appliedAt: '2026-07-07T14:30:00Z', handler: '王经理',
    remark: '同意换货，已通知仓库备货',
    refundAmount: 0,
    items: [
      { sku: 'SKU-B002', name: '机械键盘', spec: '青轴/RGB', purchasedQty: 1, returnQty: 1, unitPrice: 59900, defective: true, reason: '按键失灵' },
      { sku: 'SKU-C003', name: '鼠标垫', spec: '大号/900x400mm', purchasedQty: 1, returnQty: 1, unitPrice: 8900, defective: false, reason: '配套更换' },
    ],
  },
  'RET-20260708-003': {
    id: 'RET-20260708-003', orderNo: 'ORD-20260708-1003',
    customerName: '赵强', customerPhone: '136****0003',
    returnType: 'repair', status: 'return_received',
    appliedAt: '2026-07-06T10:00:00Z', handler: '李工',
    remark: '已收到返修品，检测中',
    refundAmount: 0,
    items: [
      { sku: 'SKU-D004', name: '无线耳机', spec: '白色/降噪版', purchasedQty: 1, returnQty: 1, unitPrice: 129900, defective: true, reason: '左耳无法充电' },
    ],
  },
  'RET-20260708-004': {
    id: 'RET-20260708-004', orderNo: 'ORD-20260708-1004',
    customerName: '王芳', customerPhone: '137****0004', memberTier: 'diamond',
    returnType: 'refund', status: 'refund_issued',
    appliedAt: '2026-07-05T16:20:00Z', handler: '财务-张',
    remark: '已原路退款',
    refundAmount: 45000,
    items: [
      { sku: 'SKU-E005', name: '智能手表', spec: '钛金属/46mm', purchasedQty: 1, returnQty: 1, unitPrice: 45000, defective: false, reason: '七天无理由退货' },
    ],
  },
  'RET-20260708-005': {
    id: 'RET-20260708-005', orderNo: 'ORD-20260708-1005',
    customerName: '陈伟', customerPhone: '158****0005',
    returnType: 'exchange', status: 'rejected',
    appliedAt: '2026-07-04T08:45:00Z', handler: '客服-刘',
    remark: '超过退换货期限（已购买45天），已电话沟通顾客',
    refundAmount: 0,
    items: [
      { sku: 'SKU-F006', name: '台灯', spec: '白色/触控调光', purchasedQty: 1, returnQty: 1, unitPrice: 19900, defective: false, reason: '觉得亮度不够' },
    ],
  },
  'RET-20260708-007': {
    id: 'RET-20260708-007', orderNo: 'ORD-20260708-1007',
    customerName: '刘洋', customerPhone: '176****0007',
    returnType: 'repair', status: 'pending_review',
    appliedAt: '2026-07-08T07:00:00Z',
    refundAmount: 0,
    items: [
      { sku: 'SKU-H008', name: '咖啡机', spec: '黑色/全自动', purchasedQty: 1, returnQty: 1, unitPrice: 299900, defective: true, reason: '蒸汽棒不出蒸汽' },
    ],
  },
};

function getReturnDetail(id: string): ReturnDetail | undefined {
  return MOCK_RETURN_DETAILS[id];
}

// ---- 组件 ----

export default function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }): React.ReactElement {
  const { id } = use(params);
  const [detail, setDetail] = useState<ReturnDetail | undefined>(() => getReturnDetail(id));
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{ remark: string; handler: string }>({ remark: '', handler: '' });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // useFormSubmit 需要 options，但这里我们只做本地状态模拟，不使用 hook 的功能
  const [submitting, setSubmitting] = useState(false);
  const submit = useCallback(async (data: { status: ReturnStatus; remark: string }) => {
    setSubmitting(true);
    // 模拟异步操作
    await new Promise((r) => setTimeout(r, 100));
    setSubmitting(false);
    return { success: true as const, data };
  }, []);

  const { actions: detailActions } = useDetailActions({
    workspace: 'returns',
    detailId: detail?.id ?? id,
    record: detail ?? null,
    shareTitle: `退换单 · ${detail?.id ?? id}`,
    shareText: `查看退换单 ${detail?.id ?? id} 详情`,
  });

  // ---- 状态流转处理 ----

  const handleTransition = useCallback(async (newStatus: ReturnStatus) => {
    if (!detail) return;
    const result = await submit({
      status: newStatus,
      remark: '',
    });
    if (result.success) {
      setDetail((prev) => prev ? { ...prev, status: newStatus, handler: '当前用户' } : prev);
      setStatusMessage({ type: 'success', text: `状态已变更为 ${RETURN_STATUS_MAP[newStatus].label}` });
    } else {
      setStatusMessage({ type: 'error', text: '状态变更失败' });
    }
  }, [detail, submit]);

  const handleDelete = useCallback(async () => {
    if (!detail) return;
    setDetail(undefined);
    setConfirmDelete(false);
    setStatusMessage({ type: 'success', text: '退换单已删除' });
  }, [detail]);

  // ---- 编辑处理 ----

  const handleStartEdit = useCallback(() => {
    if (!detail) return;
    setEditForm({ remark: detail.remark ?? '', handler: detail.handler ?? '' });
    setIsEditing(true);
  }, [detail]);

  const handleSaveEdit = useCallback(async () => {
    if (!detail) return;
    setDetail((prev) => prev ? { ...prev, remark: editForm.remark, handler: editForm.handler } : prev);
    setIsEditing(false);
    setStatusMessage({ type: 'success', text: '修改已保存' });
  }, [detail, editForm]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  // ---- 操作栏 ----

  if (!detail) {
    return (
      <DetailShell title="退换货详情" subtitle="记录不存在或已被删除">
        <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
          <p>该退换货申请记录不存在或已被删除</p>
          <SubmitButton onClick={() => window.history.back()}>返回列表</SubmitButton>
        </div>
      </DetailShell>
    );
  }

  const statusConfig = RETURN_STATUS_MAP[detail.status];

  const shellActions: DetailShellAction[] = [
    { key: 'edit', label: '编辑', onClick: handleStartEdit, variant: 'secondary' },
    { key: 'delete', label: '删除', onClick: () => setConfirmDelete(true), variant: 'danger' },
  ];

  const availableTransitions = TRANSITION_ACTIONS
    .filter((t) => t.from === detail.status)
    .map((t) => ({
      label: t.label,
      onClick: () => handleTransition(t.to),
      variant: 'primary' as const,
    }));

  const closureLinks = [
    { key: 'returns-list', title: '退换货列表', subtitle: '返回退换货管理工作台', href: '/returns' },
    { key: 'orders-mgmt', title: '订单管理', subtitle: '查看订单管理模块', href: '/orders' },
    { key: 'members-mgmt', title: '客户管理', subtitle: '查看客户管理模块', href: '/members' },
  ];

  return (
    <DetailShell
      title={`退换单 ${detail.id}`}
      subtitle={`订单 ${detail.orderNo}`}
      actions={shellActions}
    >
      {/* 状态提示 */}
      {statusMessage && (
        <FormSubmitFeedback
          {...(statusMessage.type === 'success' ? { success: statusMessage.text, onDismissSuccess: () => setStatusMessage(null) } : { error: statusMessage.text, onDismissError: () => setStatusMessage(null) })}
        />
      )}

      {/* 反馈会通过 statusMessage 显示，无需额外 feedback 块 */}

      {/* 顶部统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <StatCard label="类型" value={RETURN_TYPE_LABELS[detail.returnType]} />
        <StatCard label="状态" value={statusConfig.label} />
        <StatCard label="退款金额" value={formatPrice(detail.refundAmount)} />
        <StatCard label="商品数" value={`${detail.items.reduce((s, i) => s + i.returnQty, 0)} 件`} />
      </div>

      {/* 客户信息 */}
      <InfoRow label="客户姓名" value={detail.customerName} />
      <InfoRow label="联系电话" value={detail.customerPhone} />
      {detail.memberTier && <InfoRow label="会员等级" value={detail.memberTier} />}
      <InfoRow label="申请时间" value={formatDate(detail.appliedAt)} />
      <InfoRow label="处理人" value={detail.handler ?? '-'} />

      {/* 商品明细 */}
      <div style={{ marginTop: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>商品明细</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>SKU</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>商品名称</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>规格</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>单价</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>购买数</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>退货数</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>问题</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>退换原因</th>
            </tr>
          </thead>
          <tbody>
            {detail.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                <td style={{ padding: '8px 12px', color: '#94a3b8', fontFamily: 'monospace' }}>{item.sku}</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{item.name}</td>
                <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{item.spec}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{formatPrice(item.unitPrice)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#e2e8f0' }}>{item.purchasedQty}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', color: '#e2e8f0' }}>{item.returnQty}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  {item.defective ? <StatusBadge variant="error" label="质量问题" /> : <StatusBadge variant="neutral" label="无" />}
                </td>
                <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 备注信息 */}
      {isEditing ? (
        <div style={{ marginBottom: 16 }}>
          <FormField label="处理人">
            <input
              value={editForm.handler}
              onChange={(e) => setEditForm((f) => ({ ...f, handler: e.target.value }))}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(15,23,42,0.6)',
                color: '#e2e8f0', fontSize: 14,
              }}
            />
          </FormField>
          <FormField label="备注">
            <textarea
              value={editForm.remark}
              onChange={(e) => setEditForm((f) => ({ ...f, remark: e.target.value }))}
              rows={3}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.25)', background: 'rgba(15,23,42,0.6)',
                color: '#e2e8f0', fontSize: 14, resize: 'vertical',
              }}
            />
          </FormField>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <SubmitButton onClick={handleSaveEdit} loading={submitting}>保存</SubmitButton>
            <SubmitButton variant="secondary" onClick={handleCancelEdit}>取消</SubmitButton>
          </div>
        </div>
      ) : (
        <>
          {detail.remark && <InfoRow label="备注" value={detail.remark} />}
        </>
      )}

      {/* 状态流转按钮 */}
      {availableTransitions.length > 0 && (
        <div style={{ marginTop: 24, borderTop: '1px solid rgba(148,163,184,0.15)', paddingTop: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>状态流转</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {availableTransitions.map((action, idx) => (
              <SubmitButton key={idx} onClick={action.onClick} loading={submitting}>
                {action.label}
              </SubmitButton>
            ))}
          </div>
        </div>
      )}

      {/* 上下文闭环 */}
      <DetailClosureBar links={closureLinks} />

      {/* 删除确认弹窗 */}

      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', zIndex: 1000,
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%',
            border: '1px solid rgba(148,163,184,0.15)',
          }}>
            <h3 style={{ color: '#f87171', marginBottom: 12, fontSize: 16 }}>确认删除</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
              确定要删除退换单 <strong style={{ color: '#e2e8f0' }}>{detail.id}</strong> 吗？此操作不可撤销。
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <SubmitButton variant="secondary" onClick={() => setConfirmDelete(false)}>取消</SubmitButton>
              <SubmitButton onClick={handleDelete} loading={submitting}>确认删除</SubmitButton>
            </div>
          </div>
        </div>
      )}
    </DetailShell>
  );
}
