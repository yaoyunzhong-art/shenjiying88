// @ts-nocheck
'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

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
  useToast,
  type DetailShellAction,
} from '@m5/ui'

import {
  LEVEL_STATUS_MAP as STATUS_MAP,
  STATUS_OPTIONS,
  formatLevelCurrency as formatCurrency,
  formatLevelDate as formatDate,
  levelColor,
  validateEditLevelForm as validateEditForm,
  type EditLevelErrors as EditFormErrors,
  type EditLevelFormData as EditFormData,
  type MemberLevelConfig,
  type MemberLevelDetailSnapshot,
} from './member-level-detail-data'

// ---- 状态映射 ----

// ---- 等级详情页 ----

export default function MemberLevelDetailClient({
  snapshot,
}: {
  snapshot: MemberLevelDetailSnapshot
}) {
  const router = useRouter()
  const toast = useToast()
  const [isRefreshing, startRefresh] = useTransition()
  const levelId = snapshot.levelId

  const [level, setLevel] = useState<MemberLevelConfig | null>(snapshot.level)

  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    setLevel(snapshot.level)
  }, [snapshot.level])

  // 编辑表单
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    minPoints: 0,
    maxPoints: 9999,
    discountRate: 100,
    annualFee: 0,
    benefits: '',
    renewalCondition: '',
    upgradeCondition: '',
    downgradeCondition: '',
    notes: '',
  });
  const [editErrors, setEditErrors] = useState<EditFormErrors>({})

  // 进入编辑模式
  const handleStartEdit = useCallback(() => {
    if (!level) return;
    setEditForm({
      name: level.name,
      minPoints: level.minPoints,
      maxPoints: level.maxPoints,
      discountRate: level.discountRate,
      annualFee: level.annualFee,
      benefits: level.benefits.join(', '),
      renewalCondition: `年度消费满 ¥${(level.minPoints * 10).toLocaleString()} 自动续费`,
      upgradeCondition: `累计积分达到 ${level.minPoints}`,
      downgradeCondition: `连续 6 个月消费不足 ¥${Math.max(level.minPoints, 1000).toLocaleString()}`,
      notes: '',
    });
    setEditErrors({})
    setSubmitResult(null)
    setIsEditing(true)
  }, [level])

  // 保存编辑
  const handleSave = useCallback(async () => {
    if (!level) return;
    const errs = validateEditForm(editForm);
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const updatedLevel: MemberLevelConfig = {
        ...level,
        name: editForm.name,
        minPoints: editForm.minPoints,
        maxPoints: editForm.maxPoints,
        discountRate: editForm.discountRate,
        annualFee: editForm.annualFee,
        benefits: editForm.benefits.split(',').map((b) => b.trim()).filter(Boolean),
        updatedAt: new Date().toISOString(),
      };

      setLevel(updatedLevel)
      toast.success(`等级「${editForm.name}」信息已更新`)
      setSubmitResult({ success: true, message: '编辑保存成功' })
      setIsEditing(false)
    } catch {
      toast.error('保存失败，请稍后重试')
      setSubmitResult({ success: false, message: '保存失败' })
    } finally {
      setIsSubmitting(false)
    }
  }, [editForm, level, toast])

  // 状态变更
  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!level) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLevel({
        ...level,
        status: newStatus as MemberLevelConfig['status'],
        updatedAt: new Date().toISOString(),
      })
      toast.success(`等级状态已变更为「${STATUS_OPTIONS.find((o) => o.value === newStatus)?.label}」`)
      setSubmitResult({ success: true, message: '状态更新成功' })
      setStatusDialogOpen(false)
      setTargetStatus(null)
    } catch {
      toast.error('状态更新失败')
      setSubmitResult({ success: false, message: '状态更新失败' })
    } finally {
      setIsSubmitting(false)
    }
  }, [level, toast])

  // 删除等级
  const handleDelete = useCallback(async () => {
    if (!level) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setLevel(null)
      toast.success(`等级「${level.name}」已删除`)
      setDeleteDialogOpen(false)
      router.push('/members/levels')
    } catch {
      toast.error('删除失败')
      setSubmitResult({ success: false, message: '删除失败' })
    } finally {
      setIsSubmitting(false)
    }
  }, [level, router, toast])

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

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
        key: 'delete',
        label: '删除等级',
        variant: 'danger',
        disabled: (level?.memberCount ?? 0) > 0,
        onClick: () => setDeleteDialogOpen(true),
      },
      {
        key: 'refresh',
        label: isRefreshing ? '刷新中...' : '刷新快照',
        variant: 'secondary',
        onClick: handleRefresh,
      },
      {
        key: 'view-members',
        label: '查看会员',
        variant: 'secondary',
        href: `/members?focus=tier:${level?.key ?? ''}`,
      },
    ],
    [handleStartEdit, isEditing, isRefreshing, level]
  )

  // 未找到
  if (!level) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
        <h2 style={{ color: '#ef4444' }}>等级不存在</h2>
        <p>未找到 ID 为「{levelId}」的会员等级</p>
        <button
          onClick={() => router.push('/members/levels')}
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
          返回等级列表
        </button>
      </div>
    )
  }

  const statusInfo = STATUS_MAP[level.status] ?? { label: level.status, variant: 'neutral' as const }

  return (
    <div style={{ padding: 24, background: '#0f172a', minHeight: '100vh' }}>
      <WorkspaceBreadcrumb
        workspaceLabel="会员管理"
        workspaceHref="/members"
        extraSegments={[
          { label: '等级列表', href: '/members/levels' },
          { label: level.name },
        ]}
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
        当前快照：{snapshot.sourceLabel} · Delivery {snapshot.deliveryMode} · 刷新统一通过{' '}
        router.refresh() 回源。
      </div>

      <DetailShell
        title={level.name}
        subtitle={`标识：${level.key} · 排序 #${level.level} · 状态：${statusInfo.label}`}
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
              <div data-field="name">
                <FormField label="等级名称" required error={editErrors.name}>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => {
                      setEditForm((f) => ({ ...f, name: e.target.value }));
                      setEditErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }}
                    disabled={isSubmitting}
                    style={formInputStyle(!!editErrors.name)}
                  />
                </FormField>
              </div>
              <div data-field="discountRate">
                <FormField label="折扣率 (%)" error={editErrors.discountRate}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editForm.discountRate}
                    onChange={(e) => setEditForm((f) => ({ ...f, discountRate: Number(e.target.value) }))}
                    disabled={isSubmitting}
                    style={formInputStyle(!!editErrors.discountRate)}
                  />
                </FormField>
              </div>
              <div data-field="minPoints">
                <FormField label="最低积分" error={editErrors.minPoints}>
                  <input
                    type="number"
                    min={0}
                    value={editForm.minPoints}
                    onChange={(e) => setEditForm((f) => ({ ...f, minPoints: Number(e.target.value) }))}
                    disabled={isSubmitting}
                    style={formInputStyle(!!editErrors.minPoints)}
                  />
                </FormField>
              </div>
              <div data-field="maxPoints">
                <FormField label="最高积分" error={editErrors.maxPoints}>
                  <input
                    type="number"
                    min={0}
                    value={editForm.maxPoints}
                    onChange={(e) => setEditForm((f) => ({ ...f, maxPoints: Number(e.target.value) }))}
                    disabled={isSubmitting}
                    style={formInputStyle(!!editErrors.maxPoints)}
                  />
                </FormField>
              </div>
              <div data-field="annualFee">
                <FormField label="年费 (元)" error={editErrors.annualFee}>
                  <input
                    type="number"
                    min={0}
                    value={editForm.annualFee}
                    onChange={(e) => setEditForm((f) => ({ ...f, annualFee: Number(e.target.value) }))}
                    disabled={isSubmitting}
                    style={formInputStyle(!!editErrors.annualFee)}
                  />
                </FormField>
              </div>
            </div>
            <div>
              <FormField label="权益列表" helper="多个权益用逗号分隔">
                <input
                  type="text"
                  value={editForm.benefits}
                  onChange={(e) => setEditForm((f) => ({ ...f, benefits: e.target.value }))}
                  disabled={isSubmitting}
                  style={formInputStyle(false)}
                />
              </FormField>
            </div>
            <div>
              <FormField label="升级条件">
                <input
                  type="text"
                  value={editForm.upgradeCondition}
                  onChange={(e) => setEditForm((f) => ({ ...f, upgradeCondition: e.target.value }))}
                  disabled={isSubmitting}
                  style={formInputStyle(false)}
                />
              </FormField>
            </div>
            <div>
              <FormField label="降级条件">
                <input
                  type="text"
                  value={editForm.downgradeCondition}
                  onChange={(e) => setEditForm((f) => ({ ...f, downgradeCondition: e.target.value }))}
                  disabled={isSubmitting}
                  style={formInputStyle(false)}
                />
              </FormField>
            </div>
            <div>
              <FormField label="续费条件">
                <input
                  type="text"
                  value={editForm.renewalCondition}
                  onChange={(e) => setEditForm((f) => ({ ...f, renewalCondition: e.target.value }))}
                  disabled={isSubmitting}
                  style={formInputStyle(false)}
                />
              </FormField>
            </div>
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
                {isSubmitting ? '保存中...' : '保存编辑'}
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
              <StatCard label="会员人数" value={level.memberCount.toLocaleString()} />
              <StatCard label="排序序号" value={`#${level.level}`} />
              <StatCard label="折扣率" value={`${level.discountRate}%`} />
              <StatCard
                label="年费"
                value={level.annualFee === 0 ? '免费' : formatCurrency(level.annualFee)}
              />
            </div>

            {/* 详细数据 */}
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
                等级配置
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
                  label="等级标识"
                  value={<code style={{ color: '#93c5fd', fontSize: 13 }}>{level.key}</code>}
                />
                <InfoRow label="排序序号" value={`#${level.level}`} />
                <InfoRow
                  label="积分区间"
                  value={
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                      {level.minPoints.toLocaleString()} ~{' '}
                      {level.maxPoints >= 999999 ? '∞' : level.maxPoints.toLocaleString()}
                    </span>
                  }
                />
                <InfoRow
                  label="折扣率"
                  value={
                    <span style={{ color: '#86efac', fontWeight: 600 }}>
                      {level.discountRate === 100 ? '无折扣' : `${level.discountRate}%`}
                    </span>
                  }
                />
                <InfoRow
                  label="年费"
                  value={
                    level.annualFee === 0 ? (
                      <span style={{ color: '#86efac' }}>免费</span>
                    ) : (
                      formatCurrency(level.annualFee)
                    )
                  }
                />
                <InfoRow label="状态" value={<StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" />} />
              </div>
            </div>

            {/* 权益列表 */}
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
                等级权益
              </h3>
              {level.benefits.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {level.benefits.map((benefit) => (
                    <span
                      key={benefit}
                      style={{
                        fontSize: 13,
                        padding: '6px 14px',
                        borderRadius: 8,
                        background: 'rgba(147, 197, 253, 0.12)',
                        border: '1px solid rgba(96, 165, 250, 0.2)',
                        color: '#93c5fd',
                      }}
                    >
                      ✓ {benefit}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ color: '#64748b', fontSize: 13 }}>暂未配置权益</span>
              )}
            </div>

            {/* 条件说明 */}
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
                升级 / 降级 / 续费
              </h3>
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>升级条件</div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>
                    累计积分达到 {level.minPoints.toLocaleString()} 分
                    {level.minPoints > 0 && level.annualFee > 0
                      ? `，或年度消费满 ¥${(level.minPoints * 20).toLocaleString()}`
                      : ''}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>降级条件</div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>
                    连续 6 个月消费不足 ¥{Math.max(level.minPoints, 1000).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>续费条件</div>
                  <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>
                    {level.annualFee === 0
                      ? '免费等级，无需续费'
                      : `年度消费满 ¥${(level.annualFee * 10).toLocaleString()} 自动续费`}
                  </div>
                </div>
              </div>
            </div>

            {/* 时间信息 */}
            <div
              style={{
                borderRadius: 16,
                padding: 16,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                display: 'flex',
                gap: 20,
                fontSize: 13,
                color: '#64748b',
              }}
            >
              <div>
                <span style={{ color: '#94a3b8' }}>创建时间：</span>
                {formatDate(level.createdAt)}
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>更新时间：</span>
                {formatDate(level.updatedAt)}
              </div>
            </div>
          </div>
        )}
      </DetailShell>

        {/* ---- 状态变更弹窗 ---- */}
        {statusDialogOpen && (
          <Dialog
            open
            onClose={() => setStatusDialogOpen(false)}
            title="变更等级状态"
          >
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
            当前状态：<StatusBadge variant={statusInfo.variant} label={statusInfo.label} />
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STATUS_OPTIONS.map((opt) => (
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
                  name="level-status"
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
              disabled={!targetStatus || targetStatus === level.status}
              variant="primary"
            >
              确认变更
            </SubmitButton>
          </div>
          </Dialog>
        )}

        {/* ---- 删除确认弹窗 ---- */}
        {deleteDialogOpen && (
          <Dialog
            open
            onClose={() => setDeleteDialogOpen(false)}
            title="确认删除等级"
          >
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>
            确定要删除等级「{level.name}」吗？此操作不可撤销。
          </p>
          {level.memberCount > 0 && (
            <p style={{ color: '#fbbf24', fontSize: 12 }}>
              注意：当前有 {level.memberCount} 名会员属于该等级，建议先调整会员等级后再删除。
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => setDeleteDialogOpen(false)}
              style={dialogBtnStyle(false)}
            >
              取消
            </button>
            <SubmitButton
              onClick={() => void handleDelete()}
              loading={isSubmitting}
              disabled={level.memberCount > 0}
              variant="danger"
            >
              确认删除
            </SubmitButton>
          </div>
          </Dialog>
        )}
    </div>
  )
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
