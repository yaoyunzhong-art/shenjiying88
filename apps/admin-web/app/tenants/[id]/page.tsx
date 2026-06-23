'use client';

import { useState, useCallback, use } from 'react';

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
  type DetailShellAction
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

// ---- 类型 ----

interface TenantDetail {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  storeCount: number;
  brandCount: number;
  adminCount: number;
  lastDeployed: string;
  plan: 'enterprise' | 'professional' | 'starter';
  billingMode: 'monthly' | 'yearly';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  registeredAt: string;
  timezone: string;
  description: string;
}

type StatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

const STATUS_MAP: Record<TenantDetail['status'], { label: string; variant: StatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
};

const PLAN_MAP: Record<TenantDetail['plan'], { label: string; variant: StatusVariant }> = {
  enterprise: { label: '企业版', variant: 'success' },
  professional: { label: '专业版', variant: 'neutral' },
  starter: { label: '入门版', variant: 'warning' },
};

const BILLING_MAP: Record<TenantDetail['billingMode'], string> = {
  monthly: '月付',
  yearly: '年付',
};

// ---- Mock 租户详情数据 ----

function getTenantById(id: string): TenantDetail {
  const lookup: Record<string, TenantDetail> = {
    t1: { id: 't1', code: 'TNT-001', name: '华润万象生活', marketCode: 'cn-mainland', status: 'active', storeCount: 5, brandCount: 3, adminCount: 12, lastDeployed: '2026-06-12 14:30', plan: 'enterprise', billingMode: 'yearly', contactName: '张华润', contactEmail: 'zhanghr@cr-mixc.com', contactPhone: '+86-10-8888-1111', registeredAt: '2024-01-15', timezone: 'Asia/Shanghai', description: '华润万象生活是中国领先的物业管理及商业运营服务提供商，已在全国多个核心城市部署 M5 体系。' },
    t2: { id: 't2', code: 'TNT-002', name: '龙湖集团', marketCode: 'cn-mainland', status: 'active', storeCount: 4, brandCount: 2, adminCount: 8, lastDeployed: '2026-06-12 10:15', plan: 'enterprise', billingMode: 'yearly', contactName: '李龙湖', contactEmail: 'lilh@longfor.com', contactPhone: '+86-23-6666-2222', registeredAt: '2024-03-20', timezone: 'Asia/Shanghai', description: '龙湖集团以商业运营为核心，在全国布局多个天街系商业综合体。' },
    t3: { id: 't3', code: 'TNT-003', name: '大悦城控股', marketCode: 'cn-mainland', status: 'active', storeCount: 3, brandCount: 2, adminCount: 6, lastDeployed: '2026-06-11 09:00', plan: 'professional', billingMode: 'monthly', contactName: '王悦城', contactEmail: 'wangyc@joycity.com', contactPhone: '+86-10-5555-3333', registeredAt: '2024-06-01', timezone: 'Asia/Shanghai', description: '大悦城控股专注于年轻消费群体，打造潮流生活方式的商业地产品牌。' },
    t6: { id: 't6', code: 'TNT-006', name: 'Westfield Corp', marketCode: 'us-default', status: 'active', storeCount: 6, brandCount: 4, adminCount: 15, lastDeployed: '2026-06-12 08:30', plan: 'enterprise', billingMode: 'yearly', contactName: 'John Westfield', contactEmail: 'john.westfield@westfield.com', contactPhone: '+1-310-555-0100', registeredAt: '2024-02-01', timezone: 'America/Los_Angeles', description: 'Westfield is a global leader in retail real estate with flagship shopping centers across the US.' },
    t9: { id: 't9', code: 'TNT-009', name: '万达集团', marketCode: 'cn-mainland', status: 'active', storeCount: 8, brandCount: 5, adminCount: 18, lastDeployed: '2026-06-12 16:45', plan: 'enterprise', billingMode: 'yearly', contactName: '王万达', contactEmail: 'wangwd@wanda.com', contactPhone: '+86-10-9999-8888', registeredAt: '2023-11-01', timezone: 'Asia/Shanghai', description: '万达集团是中国最大的商业地产运营商，万达广场覆盖全国所有省份。' },
    t5: { id: 't5', code: 'TNT-005', name: '恒隆地产', marketCode: 'cn-mainland', status: 'suspended', storeCount: 2, brandCount: 1, adminCount: 4, lastDeployed: '2026-06-10 11:00', plan: 'professional', billingMode: 'yearly', contactName: '陈恒隆', contactEmail: 'chenchl@hanglung.com', contactPhone: '+86-21-4444-5555', registeredAt: '2024-07-15', timezone: 'Asia/Shanghai', description: '恒隆地产专注于高端商业地产，因系统升级暂时暂停运营。' },
  };
  return lookup[id] ?? lookup['t1']!;
}

// ---- 编辑表单 ----

interface EditFormData {
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
}

interface EditFormErrors {
  name?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '租户名称不能为空';
  if (!data.contactName.trim()) errors.contactName = '联系人不能为空';
  if (!data.contactPhone.trim()) errors.contactPhone = '联系电话不能为空';
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = '邮箱格式不正确';
  }
  return errors;
}

async function submitTenantEdit(form: EditFormData): Promise<{ success: boolean }> {
  void form;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}

// ---- 页面组件 ----

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tenant = getTenantById(id);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    name: tenant.name,
    contactName: tenant.contactName,
    contactPhone: tenant.contactPhone,
    contactEmail: tenant.contactEmail,
    description: tenant.description,
  });
  const [errors, setErrors] = useState<EditFormErrors>({});

  const {
    submit,
    state: submitState,
    reset: resetSubmit
  } = useFormSubmit<{ success: boolean }>({
    async onSubmit() {
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error(Object.values(validationErrors)[0]);
      }
      setErrors({});
      return submitTenantEdit(formData);
    },
    successMessage: '租户信息已更新成功。',
  });

  const handleSave = useCallback(async () => {
    const result = await submit();
    if (result) {
      setEditOpen(false);
      resetSubmit();
    }
  }, [submit, resetSubmit]);

  const handleFieldChange = useCallback(
    (field: keyof EditFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const handleCancel = useCallback(() => {
    setEditOpen(false);
    setErrors({});
    resetSubmit();
    setFormData({
      name: tenant.name,
      contactName: tenant.contactName,
      contactPhone: tenant.contactPhone,
      contactEmail: tenant.contactEmail,
      description: tenant.description,
    });
  }, [tenant, resetSubmit]);

  const statusInfo = STATUS_MAP[tenant.status];
  const planInfo = PLAN_MAP[tenant.plan];

  const { actions: detailActions } = useDetailActions({
    workspace: 'tenants',
    detailId: tenant.id,
    record: tenant,
    shareTitle: `租户 · ${tenant.name}`,
    shareText: `查看租户 ${tenant.code} (${tenant.name}) 详情`
  });

  const actions: DetailShellAction[] = [
    {
      key: 'edit',
      label: editOpen ? '保存中...' : '编辑',
      variant: 'primary',
      loading: submitState.isSubmitting,
      disabled: submitState.isSubmitting,
      onClick: editOpen
        ? handleSave
        : () => setEditOpen(true),
    },
  ];

  if (editOpen) {
    actions.push({
      key: 'cancel',
      label: '取消',
      variant: 'secondary',
      onClick: handleCancel,
    });
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'tenants', detailLabel: tenant.name })}
      />
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
      {/* 统计数据卡片 */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        <StatCard label="运营状态" value={statusInfo.label} helper={tenant.lastDeployed} />
        <StatCard label="套餐" value={planInfo.label} helper={`${BILLING_MAP[tenant.billingMode]}`} />
        <StatCard label="关联门店" value={String(tenant.storeCount)} helper={`${tenant.brandCount} 个品牌`} />
        <StatCard label="注册时间" value={tenant.registeredAt} helper={`${tenant.adminCount} 名管理员`} />
      </div>

      {/* 编辑模式 */}
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
                onChange={(e) => handleFieldChange('name', e.target.value)}
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
                  onChange={(e) => handleFieldChange('contactName', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入联系人姓名"
                />
              </FormField>
              <FormField label="联系电话" required error={errors.contactPhone}>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
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
                onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                disabled={submitState.isSubmitting}
                style={inputStyle}
                placeholder="输入联系邮箱"
              />
            </FormField>
            <FormField label="描述" helper="简要描述租户的业务范围与特点">
              <textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                disabled={submitState.isSubmitting}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="输入租户描述"
              />
            </FormField>

            {/* 提交 / 取消按钮 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <SubmitButton
                loading={submitState.isSubmitting}
                disabled={submitState.isSubmitting}
                onClick={handleSave}
                variant="primary"
              >
                保存修改
              </SubmitButton>
              <SubmitButton
                disabled={submitState.isSubmitting}
                onClick={handleCancel}
                variant="secondary"
              >
                取消
              </SubmitButton>
            </div>
          </div>
        </section>
      ) : null}

      {/* 详情信息卡片 */}
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
          <InfoRow label="租户编码" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{tenant.code}<CopyToClipboard text={tenant.code} size="sm" iconOnly /></span>} />
          <InfoRow label="所属市场" value={tenant.marketCode} />
          <InfoRow
            label="运营状态"
            value={<StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" dot />}
          />
          <InfoRow
            label="套餐"
            value={<StatusBadge label={planInfo.label} variant={planInfo.variant} size="sm" />}
          />
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

        <DetailActionBar
          actions={detailActions}
          heading="详情收口动作"
          caption="复制 / 导出 / 分享当前租户详情"
        />
      </div>
    </DetailShell>
    <DetailClosureBar
      links={buildStandardClosureLinks({ workspace: 'tenants', detailId: tenant.id })}
    />
    </div>
  );
}

// ---- 样式 ----

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '10px 14px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.4)',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
