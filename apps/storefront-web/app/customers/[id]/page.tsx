'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useCallback } from 'react';
import {
  PageShell,
  DetailShell,
  DetailActionBar,
  StatusBadge,
  Modal,
  SubmitButton,
  FormField,
  FormSubmitFeedback,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';

// ── 类型 ──

type CustomerStatus = 'active' | 'inactive' | 'churned';
type CustomerSource = 'direct' | 'referral' | 'online' | 'event';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  registeredDate: string;
  status: CustomerStatus;
  source: CustomerSource;
  storeName: string;
  tags: string[];
  remark: string;
}

const STATUS_VARIANTS: Record<CustomerStatus, 'success' | 'warning' | 'neutral' | 'error'> = {
  active: 'success',
  inactive: 'warning',
  churned: 'error',
};

const STATUS_LABELS: Record<CustomerStatus, string> = {
  active: '活跃',
  inactive: '静默',
  churned: '流失',
};

const SOURCE_LABELS: Record<CustomerSource, string> = {
  direct: '到店',
  referral: '推荐',
  online: '线上',
  event: '活动',
};

const NEXT_STATUS: Partial<Record<CustomerStatus, CustomerStatus>> = {
  active: 'inactive',
  inactive: 'churned',
  churned: 'active',
};

const STATUS_ACTION_LABELS: Partial<Record<CustomerStatus, string>> = {
  active: '标记静默',
  inactive: '标记流失',
  churned: '重新激活',
};

// ── Mock 详情 ──

function getCustomerById(id: string): Customer | undefined {
  const mock: Customer[] = [
    {
      id: 'c001', name: '张伟', phone: '138****1234', email: 'zhangwei@example.com',
      totalOrders: 24, totalSpent: 6800, lastOrderDate: '2026-06-20', registeredDate: '2025-03-10',
      status: 'active', source: 'direct', storeName: 'Demo Store 旗舰店',
      tags: ['VIP', '高频消费'], remark: '偏好到店体验，建议定期推送新品。',
    },
    {
      id: 'c002', name: '李娜', phone: '139****5678', email: 'lina@example.com',
      totalOrders: 42, totalSpent: 15200, lastOrderDate: '2026-06-22', registeredDate: '2024-11-05',
      status: 'active', source: 'referral', storeName: 'Demo Store 旗舰店',
      tags: ['黄金会员', '推荐达人'], remark: '推荐了多位朋友，可考虑邀请参与内测。',
    },
    {
      id: 'c003', name: '王磊', phone: '136****9012', email: 'wanglei@example.com',
      totalOrders: 8, totalSpent: 2100, lastOrderDate: '2026-05-15', registeredDate: '2025-08-20',
      status: 'inactive', source: 'online', storeName: 'Demo Store 社区店',
      tags: [], remark: '近期无到店记录，建议发送优惠券激活。',
    },
    {
      id: 'c004', name: '赵芳', phone: '137****3456', email: 'zhaofang@example.com',
      totalOrders: 56, totalSpent: 28000, lastOrderDate: '2026-06-21', registeredDate: '2024-06-01',
      status: 'active', source: 'direct', storeName: 'Demo Store 旗舰店',
      tags: ['钻石会员', '高频消费'], remark: '最高消费客户，生日月应重点维护。',
    },
    {
      id: 'c005', name: '陈强', phone: '150****7890', email: 'chenqiang@example.com',
      totalOrders: 3, totalSpent: 450, lastOrderDate: '2026-03-28', registeredDate: '2025-12-15',
      status: 'churned', source: 'event', storeName: 'Demo Store 社区店',
      tags: [], remark: '流失客户，可尝试召回活动。',
    },
  ];
  return mock.find((c) => c.id === id);
}

// ── 编辑表单 ──

type EditFormData = {
  name: string;
  phone: string;
  email: string;
  remark: string;
};

function EditModal({
  customer,
  open,
  onClose,
  onSaved,
}: {
  customer: Customer;
  open: boolean;
  onClose: () => void;
  onSaved: (data: EditFormData) => void;
}) {
  const [form, setForm] = useState<EditFormData>({
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    remark: customer.remark,
  });

  const { submitting, error, success, submit, clearError } = useFormSubmit({
    onSubmit: async () => {
      if (!form.name.trim()) throw new Error('姓名不能为空');
      if (!form.phone.trim()) throw new Error('手机号不能为空');
      onSaved(form);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <Modal open={open} onClose={onClose} title="编辑客户">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="姓名" error={!form.name.trim() ? '姓名不能为空' : undefined}>
          <input
            data-testid="edit-name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="客户姓名"
            style={inputStyle}
          />
        </FormField>
        <FormField label="手机号">
          <input
            data-testid="edit-phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="手机号"
            style={inputStyle}
          />
        </FormField>
        <FormField label="邮箱">
          <input
            data-testid="edit-email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="邮箱"
            style={inputStyle}
          />
        </FormField>
        <FormField label="备注">
          <textarea
            data-testid="edit-remark"
            value={form.remark}
            onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))}
            placeholder="客户备注"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </FormField>
        <FormSubmitFeedback submitting={submitting} error={error} success={success} onDismissError={clearError} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>取消</button>
          <SubmitButton loading={submitting} type="submit">保存</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ── 删除确认 ──

function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  itemName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}) {
  const { submitting, submit } = useFormSubmit({
    onSubmit: async () => { onConfirm(); },
  });

  return (
    <Modal open={open} onClose={onClose} title="确认删除">
      <div style={{ color: '#cbd5e1', marginBottom: 16 }}>
        确定要删除客户 <strong style={{ color: '#f87171' }}>{itemName}</strong> 吗？此操作不可撤销。
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>取消</button>
          <SubmitButton loading={submitting} type="submit" variant="danger">删除</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ── 常量样式 ──

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

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'transparent',
  color: '#cbd5e1',
  cursor: 'pointer',
  fontSize: 13,
};

// ── 详情页 ──

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | undefined>(() => getCustomerById(params.id));
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // 状态流转
  const transitionStatus = useCallback(() => {
    if (!customer) return;
    const next = NEXT_STATUS[customer.status];
    if (!next) return;
    setCustomer((prev) => prev ? { ...prev, status: next } : prev);
  }, [customer]);

  // 保存编辑
  const handleSaved = useCallback((data: EditFormData) => {
    setCustomer((prev) =>
      prev ? { ...prev, name: data.name, phone: data.phone, email: data.email, remark: data.remark } : prev,
    );
    setEditOpen(false);
  }, []);

  // 删除
  const handleDelete = useCallback(() => {
    setDeleted(true);
    setDeleteOpen(false);
  }, []);

  const detailActions: DetailShellAction[] = useMemo(() => [
    { key: 'edit', label: '编辑', onClick: () => setEditOpen(true), variant: 'primary' },
    {
      key: 'transition',
      label: customer ? STATUS_ACTION_LABELS[customer.status] ?? '状态流转' : '状态流转',
      onClick: transitionStatus,
      variant: 'secondary',
    },
    { key: 'delete', label: '删除', onClick: () => setDeleteOpen(true), variant: 'danger' },
  ], [customer, transitionStatus]);

  if (!customer) {
    return (
      <PageShell title="客户详情">
        <div style={{ textAlign: 'center', padding: 64, color: '#64748b', fontSize: 14 }}>
          未找到客户 (ID: {params.id})
        </div>
      </PageShell>
    );
  }

  if (deleted) {
    return (
      <PageShell title="客户详情">
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
            客户已删除
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
            &ldquo;{customer.name}&rdquo; 已被移除。
          </div>
          <button onClick={() => router.push('/customers')} style={{
            padding: '8px 20px', borderRadius: 8,
            border: '1px solid rgba(99,102,241,0.4)',
            background: 'rgba(99,102,241,0.12)',
            color: '#a5b4fc', cursor: 'pointer', fontSize: 13,
          }}>
            返回客户列表
          </button>
        </div>
      </PageShell>
    );
  }

  const avgOrderValue = customer.totalOrders > 0
    ? (customer.totalSpent / customer.totalOrders).toFixed(0)
    : '0';

  return (
    <PageShell title={customer.name} description={`${SOURCE_LABELS[customer.source]} · ${customer.storeName}`}>
      <DetailShell title={customer.name} subtitle={`${SOURCE_LABELS[customer.source]} · ${customer.storeName}`} actions={detailActions}>
        {/* 统计卡片 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          {[
            { label: '总订单', value: `${customer.totalOrders} 单` },
            { label: '消费总额', value: `¥${customer.totalSpent.toLocaleString()}` },
            { label: '客单价', value: `¥${Number(avgOrderValue).toLocaleString()}` },
            { label: '最近消费', value: customer.lastOrderDate },
          ].map((s) => (
            <div key={s.label} style={{
              flex: 1, borderRadius: 12, padding: '14px 16px',
              background: 'rgba(15,23,42,0.35)',
              border: '1px solid rgba(148,163,184,0.12)',
            }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: '#e2e8f0' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* 基本信息 */}
        <InfoSection title="基本信息">
          <InfoRow label="姓名" value={customer.name} />
          <InfoRow label="手机号" value={customer.phone} />
          <InfoRow label="邮箱" value={customer.email} />
          <InfoRow label="所属门店" value={customer.storeName} />
          <InfoRow label="客户来源" value={SOURCE_LABELS[customer.source]} />
          <InfoRow label="状态">
            <StatusBadge label={STATUS_LABELS[customer.status]} variant={STATUS_VARIANTS[customer.status]} size="sm" />
          </InfoRow>
        </InfoSection>

        {/* 标签 */}
        <InfoSection title="标签">
          {customer.tags.length > 0 ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {customer.tags.map((tag) => (
                <span key={tag} style={{
                  display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                  fontSize: 12, fontWeight: 500,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  color: '#a5b4fc',
                }}>{tag}</span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: '#64748b' }}>暂无标签</span>
          )}
        </InfoSection>

        {/* 备注 */}
        <InfoSection title="备注">
          <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>
            {customer.remark || '暂无备注'}
          </div>
        </InfoSection>

        {/* 时间戳 */}
        <InfoSection title="时间记录">
          <InfoRow label="注册日期" value={customer.registeredDate} />
          <InfoRow label="最近消费" value={customer.lastOrderDate} />
        </InfoSection>
      </DetailShell>

      {editOpen && (
        <EditModal customer={customer} open={editOpen} onClose={() => setEditOpen(false)} onSaved={handleSaved} />
      )}
      {deleteOpen && (
        <DeleteConfirmModal
          open={deleteOpen} onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete} itemName={customer.name}
        />
      )}
    </PageShell>
  );
}

// ── 辅助组件 ──

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      marginBottom: 16, borderRadius: 12,
      border: '1px solid rgba(148,163,184,0.12)',
      background: 'rgba(15,23,42,0.4)', padding: 20,
    }}>
      <h3 style={{
        margin: '0 0 12px 0', fontSize: 14, fontWeight: 600,
        color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </section>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 0', minHeight: 28,
    }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
      {children ?? <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{value}</span>}
    </div>
  );
}
