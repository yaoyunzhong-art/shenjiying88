/**
 * customers/[id]/page.tsx — 企业客户详情页 (ToB 客户管理)
 *
 * B型任务：详情页（含编辑/删除/状态流转）
 */
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  DetailShell,
  InfoRow,
  StatusBadge,
  Badge,
  FormField,
  SubmitButton,
  FormSubmitFeedback,
  useToast,
  ConfirmDialog,
  type DetailShellAction,
} from '@m5/ui';

import {
  MOCK_CUSTOMERS,
  CUSTOMER_STATUS_MAP,
  CUSTOMER_TIER_MAP,
  CUSTOMER_INDUSTRY_MAP,
  CUSTOMER_STATUSES,
  CUSTOMER_TIERS,
  type CustomerItem,
  type CustomerStatus,
  type CustomerTier,
} from '../../customers-data';

type CustomerIndustry = CustomerItem['industry'];

const INDUSTRIES: CustomerIndustry[] = ['retail', 'tech', 'finance', 'manufacturing', 'healthcare', 'education'];

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 14,
  boxSizing: 'border-box' as const,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'auto',
};

// ---- 编辑表单接口 ----

interface EditFormData {
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  industry: CustomerIndustry;
  tier: CustomerTier;
  city: string;
}

// ---- 编辑表单子组件 ----

function EditCustomerForm({
  customer,
  onCancel,
  onSaved,
  onError,
}: {
  customer: CustomerItem;
  onCancel: () => void;
  onSaved: (data: EditFormData) => void;
  onError: (msg: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data: EditFormData = {
      companyName: (form.elements.namedItem('companyName') as HTMLInputElement).value.trim(),
      contactName: (form.elements.namedItem('contactName') as HTMLInputElement).value.trim(),
      contactPhone: (form.elements.namedItem('contactPhone') as HTMLInputElement).value.trim(),
      contactEmail: (form.elements.namedItem('contactEmail') as HTMLInputElement).value.trim(),
      industry: (form.elements.namedItem('industry') as HTMLSelectElement).value as CustomerIndustry,
      tier: (form.elements.namedItem('tier') as HTMLSelectElement).value as CustomerTier,
      city: (form.elements.namedItem('city') as HTMLInputElement).value.trim(),
    };
    if (!data.companyName) {
      setError('公司名称不能为空');
      return;
    }
    if (!data.contactName) {
      setError('联系人姓名不能为空');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      onSaved(data);
    } catch {
      setError('保存失败，请重试');
      onError('保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="customer-edit-form"
      style={{
        background: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 12,
        padding: 20,
        border: '1px solid rgba(148, 163, 184, 0.16)',
        marginTop: 20,
      }}
    >
      <div style={{ marginBottom: 16, fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
        编辑客户信息
      </div>

      <FormField label="公司名称" htmlFor="edit-companyName" required>
        <input id="edit-companyName" name="companyName" defaultValue={customer.companyName} style={inputStyle} data-testid="edit-companyName" />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="联系人" htmlFor="edit-contactName" required>
          <input id="edit-contactName" name="contactName" defaultValue={customer.contactName} style={inputStyle} data-testid="edit-contactName" />
        </FormField>
        <FormField label="手机号" htmlFor="edit-contactPhone" required>
          <input id="edit-contactPhone" name="contactPhone" defaultValue={customer.contactPhone} style={inputStyle} data-testid="edit-contactPhone" />
        </FormField>
      </div>

      <FormField label="邮箱" htmlFor="edit-contactEmail">
        <input id="edit-contactEmail" name="contactEmail" type="email" defaultValue={customer.contactEmail} style={inputStyle} data-testid="edit-contactEmail" />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="行业" htmlFor="edit-industry">
          <select id="edit-industry" name="industry" defaultValue={customer.industry} style={selectStyle} data-testid="edit-industry">
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{CUSTOMER_INDUSTRY_MAP[ind]}</option>
            ))}
          </select>
        </FormField>
        <FormField label="客户等级" htmlFor="edit-tier" required>
          <select id="edit-tier" name="tier" defaultValue={customer.tier} style={selectStyle} data-testid="edit-tier">
            {CUSTOMER_TIERS.map((t) => (
              <option key={t} value={t}>{CUSTOMER_TIER_MAP[t].label}</option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="城市" htmlFor="edit-city">
        <input id="edit-city" name="city" defaultValue={customer.city} style={inputStyle} data-testid="edit-city" />
      </FormField>

      {error && <FormSubmitFeedback error={error} />}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <SubmitButton type="submit" loading={submitting} data-testid="customer-save-btn">
          保存
        </SubmitButton>
        <button
          type="button"
          onClick={onCancel}
          data-testid="customer-cancel-btn"
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            border: '1px solid rgba(148,163,184,0.25)',
            color: '#94a3b8',
            background: 'transparent',
          }}
        >
          取消
        </button>
      </div>
    </form>
  );
}

// ---- 页面 ----

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [customer, setCustomer] = useState<CustomerItem | null>(
    () => MOCK_CUSTOMERS.find((c) => c.id === params.id) ?? null,
  );
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // ---- 状态流转 ----

  const STATUS_TRANSITIONS: Record<CustomerStatus, Array<{ label: string; to: CustomerStatus; variant: DetailShellAction['variant'] }>> = {
    active: [
      { label: '暂停服务', to: 'suspended', variant: 'secondary' },
      { label: '标记流失', to: 'churned', variant: 'danger' },
    ],
    suspended: [
      { label: '恢复合作', to: 'active', variant: 'primary' },
    ],
    pending: [
      { label: '通过审核', to: 'active', variant: 'primary' },
      { label: '拒绝', to: 'churned', variant: 'danger' },
    ],
    churned: [
      { label: '重新激活', to: 'active', variant: 'primary' },
    ],
  };

  const handleTransition = useCallback((to: CustomerStatus) => {
    if (!customer) return;
    setCustomer({ ...customer, status: to });
    toast.success(`已${CUSTOMER_STATUS_MAP[to].label}`, { durationMs: 2000 });
  }, [customer, toast]);

  // ---- 删除 ----

  const handleDelete = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 500));
    setCustomer(null);
    setDeleteDialogOpen(false);
    toast.success('客户已删除', { durationMs: 2000 });
    setTimeout(() => router.push('/customers'), 1200);
  }, [router, toast]);

  // ---- 编辑 ----

  const handleEditSaved = useCallback((data: EditFormData) => {
    if (!customer) return;
    setCustomer({ ...customer, ...data });
    setEditing(false);
    toast.success('保存成功', { durationMs: 2000 });
  }, [customer, toast]);

  const handleEditError = useCallback((_msg: string) => {
    // error is shown inline already
  }, []);

  // ---- 操作按钮 ----

  const detailActions: DetailShellAction[] = editing
    ? []
    : customer
      ? [
          {
            key: 'edit',
            label: '编辑',
            variant: 'primary',
            onClick: () => setEditing(true),
          },
          ...(STATUS_TRANSITIONS[customer.status]?.map((t) => ({
            key: `transition-${t.to}`,
            label: t.label,
            variant: t.variant,
            onClick: () => handleTransition(t.to),
          })) ?? []),
          {
            key: 'delete',
            label: '删除',
            variant: 'danger',
            onClick: () => setDeleteDialogOpen(true),
          },
        ]
      : [];

  // ---- 信息区域 ----

  const infoSections = useMemo(() => {
    if (!customer) return [];
    return [
      {
        title: '企业信息',
        content: (
          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(15, 23, 42, 0.25)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <InfoRow label="公司名称" value={customer.companyName} />
            <InfoRow label="行业" value={CUSTOMER_INDUSTRY_MAP[customer.industry]} />
            <InfoRow label="所在城市" value={`${customer.city}（${customer.region}）`} />
            <InfoRow label="合作起始" value={customer.since} />
            <InfoRow label="最近活跃" value={customer.lastActivity} />
          </div>
        ),
      },
      {
        title: '联系人信息',
        content: (
          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(15, 23, 42, 0.25)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <InfoRow label="联系人" value={customer.contactName} />
            <InfoRow label="手机号" value={customer.contactPhone} />
            <InfoRow label="邮箱" value={customer.contactEmail} />
          </div>
        ),
      },
      {
        title: '等级 & 状态',
        content: (
          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(15, 23, 42, 0.25)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <InfoRow
              label="客户等级"
              value={<StatusBadge label={CUSTOMER_TIER_MAP[customer.tier].label} variant={CUSTOMER_TIER_MAP[customer.tier].variant as 'success' | 'warning' | 'danger' | 'neutral'} size="sm" />}
            />
            <InfoRow
              label="合作状态"
              value={<StatusBadge label={CUSTOMER_STATUS_MAP[customer.status].label} variant={CUSTOMER_STATUS_MAP[customer.status].variant} size="sm" />}
            />
          </div>
        ),
      },
      {
        title: '合作数据',
        content: (
          <div style={{ padding: 16, borderRadius: 10, background: 'rgba(15, 23, 42, 0.25)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <InfoRow label="总合同数" value={String(customer.totalContracts)} />
            <InfoRow label="进行中合同" value={String(customer.activeContracts)} />
            <InfoRow label="月均消费" value={formatCurrency(customer.monthlySpend)} />
            <InfoRow label="累计消费" value={formatCurrency(customer.totalSpend)} />
          </div>
        ),
      },
    ];
  }, [customer]);

  // ---- 404 ----

  if (!customer) {
    return (
      <DetailShell
        title="客户详情"
        backLabel="返回列表"
        backHref="/customers"
      >
        <div style={{ textAlign: 'center', padding: 64, color: '#64748b', fontSize: 14 }}>
          客户不存在或已被删除
        </div>
      </DetailShell>
    );
  }

  return (
    <DetailShell
      title={`${customer.companyName} - 客户详情`}
      subtitle={`${CUSTOMER_TIER_MAP[customer.tier].label} · ${CUSTOMER_INDUSTRY_MAP[customer.industry]}`}
      backLabel="返回列表"
      backHref="/customers"
      actions={detailActions}
      sections={infoSections}
      breadcrumbs={[
        { label: '首页', href: '/' },
        { label: '客户管理', href: '/customers' },
        { label: customer.companyName },
      ]}
    >
      {editing && (
        <EditCustomerForm
          customer={customer}
          onCancel={() => setEditing(false)}
          onSaved={handleEditSaved}
          onError={handleEditError}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        title="确认删除"
        message={`确定要删除客户「${customer.companyName}」吗？此操作不可撤销。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        variant="danger"
      />
    </DetailShell>
  );
}
