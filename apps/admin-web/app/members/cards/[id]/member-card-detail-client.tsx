'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CopyToClipboard,
  DetailShell,
  Dialog,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatusBadge,
  StatCard,
  SubmitButton,
  WorkspaceBreadcrumb,
  useToast,
  type DetailShellAction,
} from '@m5/ui'

import {
  CARD_STATUS_OPTIONS,
  MEMBER_CARD_STATUS_MAP,
  MEMBER_CARD_TYPE_MAP,
  cardTypeColor,
  formatCardCurrency,
  formatCardDateShort,
  type EditCardFormData,
  type MemberCard,
  type MemberCardDetailSnapshot,
} from './member-card-detail-data'

export default function MemberCardDetailClient({
  snapshot,
}: {
  snapshot: MemberCardDetailSnapshot
}) {
  const router = useRouter()
  const toast = useToast()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [card, setCard] = useState(snapshot.card)
  const [isEditing, setIsEditing] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<MemberCard['status'] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [editForm, setEditForm] = useState<EditCardFormData>({
    pointsMultiplier: 1,
    designatedStore: '',
    linkedWechat: false,
    notes: '',
  })

  useEffect(() => {
    setCard(snapshot.card)
  }, [snapshot.card])

  

  function handleStartEdit() {
    if (!card) {
      return
    }

    setEditForm({
      pointsMultiplier: card.pointsMultiplier,
      designatedStore: card.designatedStore ?? '',
      linkedWechat: card.linkedWechat,
      notes: card.notes,
    })
    setSubmitResult(null)
    setIsEditing(true)
  }

  async function handleSave() {
    if (!card) {
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      setCard({
        ...card,
        pointsMultiplier: editForm.pointsMultiplier,
        designatedStore: editForm.designatedStore.trim() || null,
        linkedWechat: editForm.linkedWechat,
        notes: editForm.notes.trim(),
      })
      toast.success('会员卡信息已更新')
      setSubmitResult({ success: true, message: '编辑保存成功' })
      setIsEditing(false)
    } catch {
      toast.error('保存失败，请稍后重试')
      setSubmitResult({ success: false, message: '保存失败' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStatusChange(nextStatus: MemberCard['status']) {
    if (!card) {
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setCard({ ...card, status: nextStatus })
      const label =
        CARD_STATUS_OPTIONS.find((item) => item.value === nextStatus)?.label ?? nextStatus
      toast.success(`卡片状态已变更为「${label}」`)
      setSubmitResult({ success: true, message: '状态更新成功' })
      setStatusDialogOpen(false)
      setTargetStatus(null)
    } catch {
      toast.error('状态更新失败')
      setSubmitResult({ success: false, message: '状态更新失败' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCancel() {
    if (!card) {
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setCard({ ...card, status: 'cancelled' })
      toast.success(`会员卡 ${card.cardNumber} 已注销`)
      setCancelDialogOpen(false)
      setSubmitResult({ success: true, message: '注销成功' })
    } catch {
      toast.error('注销失败')
      setSubmitResult({ success: false, message: '注销失败' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const actions: DetailShellAction[] = useMemo(
    () => [
      {
        key: 'refresh',
        label: isRefreshing ? '刷新中...' : '刷新快照',
        variant: 'secondary',
        onClick: handleRefresh,
      },
      {
        key: 'edit',
        label: isEditing ? '取消编辑' : '编辑',
        variant: 'secondary',
        onClick: isEditing
          ? () => {
              setIsEditing(false)
              setSubmitResult(null)
            }
          : handleStartEdit,
      },
      {
        key: 'status-toggle',
        label: '变更状态',
        variant: 'primary',
        disabled: !card,
        onClick: () => setStatusDialogOpen(true),
      },
      {
        key: 'cancel',
        label: '注销卡片',
        variant: 'danger',
        disabled: !card || card.status === 'cancelled' || card.status === 'expired',
        onClick: () => setCancelDialogOpen(true),
      },
      {
        key: 'view-member',
        label: '查看会员',
        variant: 'secondary',
        href: card ? `/members/${card.memberId}` : undefined,
      },
    ],
    [card, isEditing, isRefreshing]
  )

  if (!card) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
        <h2 style={{ color: '#ef4444' }}>卡片不存在</h2>
        <p>未找到 ID 为「{snapshot.cardId}」的会员卡</p>
        <button
          type="button"
          onClick={() => router.push('/members/cards')}
          style={primaryButtonStyle}
        >
          返回卡片列表
        </button>
      </div>
    )
  }

  const typeInfo = MEMBER_CARD_TYPE_MAP[card.cardType]
  const statusInfo = MEMBER_CARD_STATUS_MAP[card.status]

  return (
    <div style={{ padding: 24, background: '#0f172a', minHeight: '100vh' }}>
      <WorkspaceBreadcrumb
        workspaceLabel="会员管理"
        workspaceHref="/members"
        detailLabel={card.cardNumber}
        extraSegments={[{ label: '会员卡管理', href: '/members/cards' }]}
      />

      <div
        style={{
          marginBottom: 16,
          borderRadius: 16,
          padding: 16,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          color: '#94a3b8',
          fontSize: 13,
          lineHeight: 1.7,
        }}
      >
        当前快照：{snapshot.sourceLabel} · Delivery {snapshot.deliveryMode} · 刷新统一通过
        {' '}router.refresh() 回源。
      </div>

      <DetailShell
        title={card.cardNumber}
        subtitle={`持卡人：${card.memberName} · ${typeInfo.label} · 状态：${statusInfo.label}`}
        actions={actions}
      >
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {submitResult ? (
              <FormSubmitFeedback
                success={submitResult.success ? submitResult.message : undefined}
                error={submitResult.success ? undefined : submitResult.message}
              />
            ) : null}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="积分倍率">
                <input
                  type="number"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={editForm.pointsMultiplier}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      pointsMultiplier: Number(event.target.value),
                    }))
                  }
                  disabled={isSubmitting}
                  style={formInputStyle(false)}
                />
              </FormField>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={editForm.linkedWechat}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        linkedWechat: event.target.checked,
                      }))
                    }
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
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    designatedStore: event.target.value,
                  }))
                }
                disabled={isSubmitting}
                style={formInputStyle(false)}
                placeholder="例如：朝阳大悦城旗舰店"
              />
            </FormField>
            <FormField label="备注">
              <textarea
                value={editForm.notes}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, notes: event.target.value }))
                }
                disabled={isSubmitting}
                style={{
                  ...formInputStyle(false),
                  minHeight: 80,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </FormField>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <SubmitButton
                variant="secondary"
                onClick={() => {
                  setIsEditing(false)
                  setSubmitResult(null)
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
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <StatCard label="卡内余额" value={formatCardCurrency(card.balance)} />
              <StatCard label="积分倍率" value={`${card.pointsMultiplier}x`} />
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
                    variant={
                      statusInfo.variant as 'success' | 'warning' | 'danger' | 'neutral'
                    }
                    size="sm"
                  />
                }
              />
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>卡片信息</h3>
              <div style={infoGridStyle}>
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
                <InfoRow
                  label="卡片状态"
                  value={
                    <StatusBadge
                      label={statusInfo.label}
                      variant={
                        statusInfo.variant as 'success' | 'warning' | 'danger' | 'neutral'
                      }
                      size="sm"
                    />
                  }
                />
                <InfoRow
                  label="余额"
                  value={
                    <span style={{ fontWeight: 600, color: '#fbbf24' }}>
                      {formatCardCurrency(card.balance)}
                    </span>
                  }
                />
                <InfoRow label="积分倍率" value={`${card.pointsMultiplier}x`} />
                <InfoRow
                  label="关联微信"
                  value={
                    card.linkedWechat ? (
                      <span style={{ color: '#86efac' }}>已关联</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>未关联</span>
                    )
                  }
                />
                <InfoRow
                  label="指定门店"
                  value={card.designatedStore ?? <span style={{ color: '#64748b' }}>不限</span>}
                />
                <InfoRow label="发行日期" value={formatCardDateShort(card.issuedAt)} />
                <InfoRow label="激活日期" value={formatCardDateShort(card.activatedAt)} />
                <InfoRow
                  label="过期时间"
                  value={
                    card.expiresAt ? (
                      formatCardDateShort(card.expiresAt)
                    ) : (
                      <span style={{ color: '#64748b' }}>永久</span>
                    )
                  }
                />
              </div>
            </div>

            {card.notes ? (
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>备注</h3>
                <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
                  {card.notes}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </DetailShell>

      {statusDialogOpen ? (
        <Dialog
          open
          onClose={() => {
            setStatusDialogOpen(false)
            setTargetStatus(null)
          }}
          title="变更会员卡状态"
        >
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
            当前状态：
            <StatusBadge
              label={statusInfo.label}
              variant={statusInfo.variant as 'success' | 'warning' | 'danger' | 'neutral'}
              size="sm"
            />
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CARD_STATUS_OPTIONS.map((option) => (
              <label key={option.value} style={dialogOptionStyle(targetStatus === option.value)}>
                <input
                  type="radio"
                  name="card-status"
                  value={option.value}
                  checked={targetStatus === option.value}
                  onChange={() => setTargetStatus(option.value)}
                  style={{ accentColor: '#3b82f6' }}
                />
                {option.label}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              type="button"
              onClick={() => {
                setStatusDialogOpen(false)
                setTargetStatus(null)
              }}
              style={dialogButtonStyle()}
            >
              取消
            </button>
            <SubmitButton
              onClick={() => (targetStatus ? handleStatusChange(targetStatus) : undefined)}
              loading={isSubmitting}
              disabled={!targetStatus || targetStatus === card.status}
              variant="primary"
            >
              确认变更
            </SubmitButton>
          </div>
        </Dialog>
      ) : null}

      {cancelDialogOpen ? (
        <Dialog open onClose={() => setCancelDialogOpen(false)} title="确认注销会员卡">
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>
            确定要注销会员卡「{card.cardNumber}」吗？
          </p>
          {card.balance > 0 ? (
            <p style={{ color: '#fbbf24', fontSize: 12 }}>
              注意：卡内还有余额 {formatCardCurrency(card.balance)}，注销后余额将不可用。
            </p>
          ) : null}
          <p style={{ color: '#94a3b8', fontSize: 12 }}>此操作不可撤销。</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              type="button"
              onClick={() => setCancelDialogOpen(false)}
              style={dialogButtonStyle()}
            >
              取消
            </button>
            <SubmitButton onClick={() => void handleCancel()} loading={isSubmitting} variant="danger">
              确认注销
            </SubmitButton>
          </div>
        </Dialog>
      ) : null}
    </div>
  )
}

const primaryButtonStyle: React.CSSProperties = {
  marginTop: 16,
  padding: '8px 20px',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
}

const sectionStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  marginBottom: 20,
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 15,
  fontWeight: 600,
  color: '#e2e8f0',
}

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  background: 'rgba(30, 41, 59, 0.6)',
  borderRadius: 12,
  padding: 16,
}

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#e2e8f0',
  fontSize: 13,
  cursor: 'pointer',
}

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
  }
}

function dialogButtonStyle(): React.CSSProperties {
  return {
    padding: '6px 16px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(148,163,184,0.1)',
    color: '#94a3b8',
  }
}

function dialogOptionStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
    border: `1px solid ${active ? '#3b82f6' : 'rgba(148,163,184,0.2)'}`,
    color: '#e2e8f0',
  }
}
