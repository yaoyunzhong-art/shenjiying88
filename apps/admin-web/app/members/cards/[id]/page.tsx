// @ts-nocheck
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  DetailShell,
  Dialog,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatusBadge,
  StatCard,
  SubmitButton,
  WorkspaceBreadcrumb,
  CopyToClipboard,
  useToast,
  type DetailShellAction,
} from '@m5/ui';

import {
  MOCK_MEMBER_CARDS,
  MEMBER_CARD_TYPE_MAP,
  MEMBER_CARD_STATUS_MAP,
  type MemberCard,
} from '../../../members-data';

// ---- 状态映射 ----

const CARD_TYPE_OPTIONS = [
  { value: 'virtual', label: '虚拟卡' },
  { value: 'physical', label: '实体卡' },
  { value: 'digital', label: '数字卡' },
] as const;

const CARD_STATUS_OPTIONS = [
  { value: 'active', label: '正常' },
  { value: 'frozen', label: '已冻结' },
  { value: 'expired', label: '已过期' },
  { value: 'cancelled', label: '已注销' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  active: '#86efac',
  frozen: '#fde68a',
  expired: '#fca5a5',
  cancelled: '#94a3b8',
};

// ---- 辅助 ----

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function cardTypeColor(type: MemberCard['cardType']): string {
  const colors: Record<string, string> = {
    physical: '#86efac',
    virtual: '#93c5fd',
    digital: '#fde68a',
  };
  return colors[type] ?? '#94a3b8';
}

// ---- 编辑表单类型 ----

interface EditCardFormData {
  pointsMultiplier: number;
  designatedStore: string;
  linkedWechat: boolean;
  notes: string;
}

// ---- 页面 ----

export default function MemberCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const cardId = params.id as string;

  const [cards, setCards] = useState<MemberCard[]>(MOCK_MEMBER_CARDS);
  const card = useMemo(() => cards.find((c) => c.id === cardId), [cards, cardId]);

  const [isEditing, setIsEditing] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const [editForm, setEditForm] = useState<EditCardFormData>({
    pointsMultiplier: 1.0,
    designatedStore: '',
    linkedWechat: false,
    notes: '',
  });

  // 进入编辑模式
  const handleStartEdit = useCallback(() => {
    if (!card) return;
    setEditForm({
      pointsMultiplier: card.pointsMultiplier,
      designatedStore: card.designatedStore ?? '',
      linkedWechat: card.linkedWechat,
      notes: card.notes,
    });
    setSubmitResult(null);
    setIsEditing(true);
  }, [card]);

  // 保存编辑
  const handleSave = useCallback(async () => {
    if (!card) return;
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id
            ? {
                ...c,
                pointsMultiplier: editForm.pointsMultiplier,
                designatedStore: editForm.designatedStore.trim() || null,
                linkedWechat: editForm.linkedWechat,
                notes: editForm.notes.trim(),
              }
            : c
        )
      );

      toast.success('会员卡信息已更新');
      setSubmitResult({ success: true, message: '编辑保存成功' });
      setIsEditing(false);
    } catch {
      toast.error('保存失败，请稍后重试');
      setSubmitResult({ success: false, message: '保存失败' });
    } finally {
      setIsSubmitting(false);
    }
  }, [card, editForm, toast]);

  // 状态变更
  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!card) return;
      setIsSubmitting(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        setCards((prev) =>
          prev.map((c) =>
            c.id === card.id
              ? { ...c, status: newStatus as MemberCard['status'] }
              : c
          )
        );

        const label = CARD_STATUS_OPTIONS.find((o) => o.value === newStatus)?.label ?? newStatus;
        toast.success(`卡片状态已变更为「${label}」`);
        setSubmitResult({ success: true, message: '状态更新成功' });
        setStatusDialogOpen(false);
        setTargetStatus(null);
      } catch {
        toast.error('状态更新失败');
        setSubmitResult({ success: false, message: '状态更新失败' });
      } finally {
        setIsSubmitting(false);
      }
    },
    [card, toast]
  );

  // 注销卡片
  const handleCancel = useCallback(async () => {
    if (!card) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, status: 'cancelled' as const } : c))
      );
      toast.success(`会员卡 ${card.cardNumber} 已注销`);
      setCancelDialogOpen(false);
    } catch {
      toast.error('注销失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [card, toast]);

  // 操作栏
  const actions: DetailShellAction[] = useMemo(
    () => [
      {
        key: 'edit',
        label: isEditing ? '取消编辑' : '编辑',
        variant: 'secondary',
        onClick: isEditing ? () => setIsEditing(false) : handleStartEdit,
      },
      {
        key: 'status-toggle',
        label: '变更状态',
        variant: 'primary',
        onClick: () => setStatusDialogOpen(true),
      },
      {
        key: 'cancel',
        label: '注销卡片',
        variant: 'danger',
        disabled: card?.status === 'cancelled' || card?.status === 'expired',
        onClick: () => setCancelDialogOpen(true),
      },
      {
        key: 'view-member',
        label: '查看会员',
        variant: 'secondary',
        href: card ? `/members/${card.memberId}` : undefined,
      },
    ],
    [isEditing, handleStartEdit, card]
  );

  // 未找到
  if (!card) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
        <h2 style={{ color: '#ef4444' }}>卡片不存在</h2>
        <p>未找到 ID 为「{cardId}」的会员卡</p>
        <button
          onClick={() => router.push('/members/cards')}
          style={{
            marginTop: 16,
            padding: '8px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          返回卡片列表
        </button>
      </div>
    );
  }

  const typeInfo = MEMBER_CARD_TYPE_MAP[card.cardType];
  const statusInfo = MEMBER_CARD_STATUS_MAP[card.status];

  return (
    <div style={{ padding: 24, background: '#0f172a', minHeight: '100vh' }}>
      <WorkspaceBreadcrumb
        workspaceLabel="会员管理"
        workspaceHref="/members"
        detailLabel={card.cardNumber}
        extraSegments={[
          { label: '会员卡管理', href: '/members/cards' },
        ]}
      />

      <DetailShell
        title={card.cardNumber}
        subtitle={`持卡人：${card.memberName} · ${typeInfo.label} · 状态：${statusInfo.label}`}
        actions={actions}
      >
        {/* ---- 编辑模式 ---- */}
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {submitResult && (
              <FormSubmitFeedback
                success={submitResult.success ? submitResult.message : undefined}
                error={submitResult.success ? undefined : submitResult.message}
              />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="积分倍率">
                <input
                  type="number"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={editForm.pointsMultiplier}
                  onChange={(e) => setEditForm((f) => ({ ...f, pointsMultiplier: Number(e.target.value) }))}
                  disabled={isSubmitting}
                  style={formInputStyle(false)}
                />
              </FormField>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0', fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editForm.linkedWechat}
                    onChange={(e) => setEditForm((f) => ({ ...f, linkedWechat: e.target.checked }))}
                    disabled={isSubmitting}
                    style={{ accentColor: '#3b82f6' }}
                  />
                  已关联微信
                </label>
              </div>
            </div>
            <FormField label="指定门店" helper="选填，不填则不限制门店">
              <input
                type="text"
                value={editForm.designatedStore}
                onChange={(e) => setEditForm((f) => ({ ...f, designatedStore: e.target.value }))}
                disabled={isSubmitting}
                style={formInputStyle(false)}
                placeholder="例如: 朝阳大悦城旗舰店"
              />
            </FormField>
            <FormField label="备注">
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                disabled={isSubmitting}
                style={{ ...formInputStyle(false), minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </FormField>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <SubmitButton
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setSubmitResult(null);
                }}
                disabled={isSubmitting}
              >
                取消
              </SubmitButton>
              <SubmitButton
                loading={isSubmitting}
                onClick={() => void handleSave()}
                variant="primary"
              >
                {isSubmitting ? '保存中...' : '保存修改'}
              </SubmitButton>
            </div>
          </div>
        ) : (
          /* ---- 展示模式 ---- */
          <div>
            {/* 概览卡片 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <StatCard
                label="卡内余额"
                value={formatCurrency(card.balance)}
              />
              <StatCard
                label="积分倍率"
                value={`${card.pointsMultiplier}x`}
              />
              <StatCard
                label="卡类型"
                value={
                  <span style={{ color: cardTypeColor(card.cardType), fontWeight: 600 }}>
                    {typeInfo.label}
                  </span>
                }
              />
              <StatCard
                label="状态"
                value={
                  <StatusBadge
                    label={statusInfo.label}
                    variant={statusInfo.variant as 'success' | 'warning' | 'danger' | 'neutral'}
                    size="sm"
                  />
                }
              />
            </div>

            {/* 详细信息 */}
            <div
              style={{
                borderRadius: 16,
                padding: 20,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
                卡片信息
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <InfoRow
                  label="卡号"
                  value={
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ color: '#cbd5e1', fontSize: 14 }}>{card.cardNumber}</code>
                      <CopyToClipboard text={card.cardNumber} size="sm" iconOnly />
                    </span>
                  }
                />
                <InfoRow
                  label="持卡人"
                  value={
                    <a
                      href={`/members/${card.memberId}`}
                      style={{ color: '#93c5fd', textDecoration: 'none' }}
                    >
                      {card.memberName}
                    </a>
                  }
                />
                <InfoRow label="卡类型" value={typeInfo.label} />
                <InfoRow label="卡片状态" value={<StatusBadge label={statusInfo.label} variant={statusInfo.variant as 'success' | 'warning' | 'danger' | 'neutral'} size="sm" />} />
                <InfoRow label="余额" value={<span style={{ fontWeight: 600, color: '#fbbf24' }}>{formatCurrency(card.balance)}</span>} />
                <InfoRow label="积分倍率" value={`${card.pointsMultiplier}x`} />
                <InfoRow
                  label="关联微信"
                  value={
                    card.linkedWechat ? (
                      <span style={{ color: '#86efac' }}>✓ 已关联</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>未关联</span>
                    )
                  }
                />
                <InfoRow
                  label="指定门店"
                  value={card.designatedStore ?? <span style={{ color: '#64748b' }}>不限</span>}
                />
                <InfoRow label="发行日期" value={formatDateShort(card.issuedAt)} />
                <InfoRow label="激活日期" value={formatDateShort(card.activatedAt)} />
                <InfoRow label="过期时间" value={card.expiresAt ? formatDateShort(card.expiresAt) : <span style={{ color: '#64748b' }}>永久</span>} />
              </div>
            </div>

            {/* 备注 */}
            {card.notes && (
              <div
                style={{
                  borderRadius: 16,
                  padding: 16,
                  background: 'rgba(15, 23, 42, 0.35)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                }}
              >
                <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                  备注
                </h3>
                <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
                  {card.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </DetailShell>

      {/* ---- 状态变更弹窗 ---- */}
      {statusDialogOpen && (
        <Dialog
          open
          onClose={() => {
            setStatusDialogOpen(false);
            setTargetStatus(null);
          }}
          title="变更会员卡状态"
        >
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
            当前状态：<StatusBadge label={statusInfo.label} variant={statusInfo.variant as 'success' | 'warning' | 'danger' | 'neutral'} size="sm" />
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CARD_STATUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: targetStatus === opt.value ? 'rgba(59,130,246,0.15)' : 'transparent',
                  border: `1px solid ${targetStatus === opt.value ? '#3b82f6' : 'rgba(148,163,184,0.2)'}`,
                  color: '#e2e8f0',
                }}
              >
                <input
                  type="radio"
                  name="card-status"
                  value={opt.value}
                  checked={targetStatus === opt.value}
                  onChange={() => setTargetStatus(opt.value)}
                  style={{ accentColor: '#3b82f6' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => {
                setStatusDialogOpen(false);
                setTargetStatus(null);
              }}
              style={dialogBtnStyle(false)}
            >
              取消
            </button>
            <SubmitButton
              onClick={() => targetStatus && handleStatusChange(targetStatus)}
              loading={isSubmitting}
              disabled={!targetStatus || targetStatus === card.status}
              variant="primary"
            >
              确认变更
            </SubmitButton>
          </div>
        </Dialog>
      )}

      {/* ---- 注销弹窗 ---- */}
      {cancelDialogOpen && (
        <Dialog
          open
          onClose={() => setCancelDialogOpen(false)}
          title="确认注销会员卡"
        >
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>
            确定要注销会员卡「{card.cardNumber}」吗？
          </p>
          {card.balance > 0 && (
            <p style={{ color: '#fbbf24', fontSize: 12 }}>
              注意：卡内还有余额 {formatCurrency(card.balance)}，注销后余额将不可用。
            </p>
          )}
          <p style={{ color: '#94a3b8', fontSize: 12 }}>此操作不可撤销。</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => setCancelDialogOpen(false)}
              style={dialogBtnStyle(false)}
            >
              取消
            </button>
            <SubmitButton
              onClick={() => void handleCancel()}
              loading={isSubmitting}
              variant="danger"
            >
              确认注销
            </SubmitButton>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// ---- 样式 ----

function formInputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(148,163,184,0.2)'}`,
    background: 'rgba(30,41,59,0.8)',
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
}

function dialogBtnStyle(isPrimary: boolean): React.CSSProperties {
  return {
    padding: '6px 16px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    border: `1px solid ${isPrimary ? 'rgba(96,165,250,0.3)' : 'rgba(148,163,184,0.2)'}`,
    background: isPrimary ? 'rgba(59,130,246,0.16)' : 'rgba(148,163,184,0.1)',
    color: isPrimary ? '#dbeafe' : '#94a3b8',
  };
}
