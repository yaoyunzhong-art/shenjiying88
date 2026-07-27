'use client'

import { useCallback, useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  CopyToClipboard,
  DetailActionBar,
  DetailClosureBar,
  DetailShell,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatCard,
  StatusBadge,
  SubmitButton,
  WorkspaceBreadcrumb,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui'
import { useDetailActions } from '../../components/use-detail-actions'
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry'
import {
  BILLING_MAP,
  PLAN_MAP,
  STATUS_MAP,
  submitTenantEdit,
  validateForm,
  type EditFormData,
  type EditFormErrors,
  type TenantDetailSnapshot,
} from './tenant-detail-data'

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '10px 14px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.4)',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}

export default function TenantDetailClient({ snapshot }: { snapshot: TenantDetailSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const tenant = snapshot.tenant
  const [editOpen, setEditOpen] = useState(false)
  const [formData, setFormData] = useState<EditFormData>({
    name: tenant.name,
    contactName: tenant.contactName,
    contactPhone: tenant.contactPhone,
    contactEmail: tenant.contactEmail,
    description: tenant.description,
  })
  const [errors, setErrors] = useState<EditFormErrors>({})

  const {
    submit,
    state: submitState,
    reset: resetSubmit,
  } = useFormSubmit<{ success: boolean }>({
    async onSubmit() {
      const validationErrors = validateForm(formData)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        throw new Error(Object.values(validationErrors)[0])
      }
      setErrors({})
      return submitTenantEdit(formData)
    },
    successMessage: '租户信息已更新成功。',
  })

  const handleSave = useCallback(async () => {
    const result = await submit()
    if (result) {
      setEditOpen(false)
      resetSubmit()
    }
  }, [resetSubmit, submit])

  const handleFieldChange = useCallback(
    (field: keyof EditFormData, value: string) => {
      setFormData((previous) => ({ ...previous, [field]: value }))
      if (errors[field]) {
        setErrors((previous) => {
          const next = { ...previous }
          delete next[field]
          return next
        })
      }
    },
    [errors],
  )

  const handleCancel = useCallback(() => {
    setEditOpen(false)
    setErrors({})
    resetSubmit()
    setFormData({
      name: tenant.name,
      contactName: tenant.contactName,
      contactPhone: tenant.contactPhone,
      contactEmail: tenant.contactEmail,
      description: tenant.description,
    })
  }, [resetSubmit, tenant])

  const handleRefresh = useCallback(() => {
    startRefresh(() => router.refresh())
  }, [router])

  const statusInfo = STATUS_MAP[tenant.status]
  const planInfo = PLAN_MAP[tenant.plan]

  const { actions: detailActions } = useDetailActions({
    workspace: 'tenants',
    detailId: tenant.id,
    record: tenant,
    shareTitle: `租户 · ${tenant.name}`,
    shareText: `查看租户 ${tenant.code} (${tenant.name}) 详情`,
  })

  const actions: DetailShellAction[] = [
    {
      key: 'edit',
      label: editOpen ? '保存中...' : '编辑',
      variant: 'primary',
      loading: submitState.isSubmitting,
      disabled: submitState.isSubmitting,
      onClick: editOpen ? handleSave : () => setEditOpen(true),
    },
  ]

  if (editOpen) {
    actions.push({
      key: 'cancel',
      label: '取消',
      variant: 'secondary',
      onClick: handleCancel,
    })
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          padding: 14,
          borderRadius: 12,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          color: '#cbd5e1',
          fontSize: 12,
        }}
      >
        <div>
          客户端快照上下文: {snapshot.sourceLabel} · 租户样本: {tenant.code} · 刷新路径: {snapshot.refreshPath}
        </div>
        <button type="button" onClick={handleRefresh}>
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <WorkspaceBreadcrumb {...buildStandardBreadcrumb({ workspace: 'tenants', detailLabel: tenant.name })} />

      <DetailShell
        title={tenant.name}
        subtitle={`${tenant.code} · ${tenant.marketCode}`}
        breadcrumbs={[
          { label: '租户管理', href: '/tenants' },
          { label: tenant.name },
        ]}
        backLink={{ label: '返回租户列表', href: '/tenants' }}
        actions={actions}
      >
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
          <StatCard label="运营状态" value={statusInfo.label} helper={tenant.lastDeployed} />
          <StatCard label="套餐" value={planInfo.label} helper={BILLING_MAP[tenant.billingMode]} />
          <StatCard label="关联门店" value={String(tenant.storeCount)} helper={`${tenant.brandCount} 个品牌`} />
          <StatCard label="注册时间" value={tenant.registeredAt} helper={`${tenant.adminCount} 名管理员`} />
        </div>

        {editOpen ? (
          <section
            style={{
              borderRadius: 16,
              padding: 24,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>编辑租户信息</h2>

            {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
              <div style={{ marginBottom: 16 }}>
                <FormSubmitFeedback state={submitState} />
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 16 }}>
              <FormField label="租户名称" required error={errors.name}>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => handleFieldChange('name', event.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入租户名称"
                />
              </FormField>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <FormField label="联系人" required error={errors.contactName}>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(event) => handleFieldChange('contactName', event.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="输入联系人姓名"
                  />
                </FormField>
                <FormField label="联系电话" required error={errors.contactPhone}>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(event) => handleFieldChange('contactPhone', event.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="输入联系电话"
                  />
                </FormField>
              </div>
              <FormField label="联系邮箱" error={errors.contactEmail} helper="选填">
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(event) => handleFieldChange('contactEmail', event.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入联系邮箱"
                />
              </FormField>
              <FormField label="描述" helper="简要描述租户的业务范围与特点">
                <textarea
                  value={formData.description}
                  onChange={(event) => handleFieldChange('description', event.target.value)}
                  disabled={submitState.isSubmitting}
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  placeholder="输入租户描述"
                />
              </FormField>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <SubmitButton loading={submitState.isSubmitting} disabled={submitState.isSubmitting} onClick={handleSave} variant="primary">
                  保存修改
                </SubmitButton>
                <SubmitButton disabled={submitState.isSubmitting} onClick={handleCancel} variant="secondary">
                  取消
                </SubmitButton>
              </div>
            </div>
          </section>
        ) : null}

        <div
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>租户信息</h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <InfoRow
              label="租户编码"
              value={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {tenant.code}
                  <CopyToClipboard text={tenant.code} size="sm" iconOnly />
                </span>
              }
            />
            <InfoRow label="所属市场" value={tenant.marketCode} />
            <InfoRow label="运营状态" value={<StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" dot />} />
            <InfoRow label="套餐" value={<StatusBadge label={planInfo.label} variant={planInfo.variant} size="sm" />} />
            <InfoRow label="计费方式" value={BILLING_MAP[tenant.billingMode]} />
            <InfoRow label="时区" value={tenant.timezone} />
            <InfoRow label="联系人" value={tenant.contactName} />
            <InfoRow label="联系邮箱" value={tenant.contactEmail} />
            <InfoRow label="联系电话" value={tenant.contactPhone} />
            <InfoRow label="关联门店数" value={`${tenant.storeCount} 个`} />
            <InfoRow label="关联品牌数" value={`${tenant.brandCount} 个`} />
            <InfoRow label="管理员数" value={`${tenant.adminCount} 人`} />
            <InfoRow label="注册时间" value={tenant.registeredAt} />
            <InfoRow label="最后部署" value={tenant.lastDeployed} />
          </div>

          {tenant.description ? (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>描述</div>
              <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>{tenant.description}</div>
            </div>
          ) : null}

          <DetailActionBar actions={detailActions} heading="详情收口动作" caption="复制 / 导出 / 分享当前租户详情" />
        </div>
      </DetailShell>

      <DetailClosureBar links={buildStandardClosureLinks({ workspace: 'tenants', detailId: tenant.id })} />
    </div>
  )
}
