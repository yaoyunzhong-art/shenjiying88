/**
 * contracts/[id]/page.tsx — 合同详情页 (ToB 合同管理)
 *
 * DetailShell + InfoSection / InfoRow 结构展示合同信息
 * 支持状态流转 + 编辑弹窗 + 删除确认
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useCallback } from 'react';
import {
  PageShell,
  DetailShell,
  Modal,
  SubmitButton,
  FormField,
  FormSubmitFeedback,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';
import {
  MOCK_CONTRACTS,
  CONTRACT_STATUS_MAP,
  CONTRACT_TYPE_MAP,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  fmtAmount,
  daysUntil,
  type ContractItem,
  type ContractStatus,
  type ContractType,
} from '../../contracts-data';

// ── Helpers ──

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1_000).toFixed(1)}K`;
  return `¥${n.toLocaleString()}`;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const NEXT_STATUS: Partial<Record<ContractStatus, ContractStatus>> = {
  draft: 'pending_approval',
  pending_approval: 'active',
  active: 'suspended',
  suspended: 'terminated',
  expiring_soon: 'active',
  terminated: 'draft',
};

const STATUS_ACTION_LABELS: Partial<Record<ContractStatus, string>> = {
  draft: '提交审批',
  pending_approval: '激活合同',
  active: '暂停合同',
  suspended: '终止合同',
  expiring_soon: '续约激活',
  terminated: '重新起草',
};

function confirmMessage(contract: ContractItem, next: ContractStatus): string {
  const from = CONTRACT_STATUS_MAP[contract.status].label;
  const to = CONTRACT_STATUS_MAP[next].label;
  return `确定将合同 "${contract.title}" 从 [${from}] 变更为 [${to}] 吗？`;
}

// ── 编辑表单数据类型 ──

type EditFormData = {
  title: string;
  amount: number;
  description: string;
  signatory: string;
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

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 80,
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'transparent',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: 13,
};

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 16,
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.12)',
        background: 'rgba(15,23,42,0.4)',
        padding: 20,
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
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

// ── 编辑弹窗 ──

function EditContractModal({
  open,
  onClose,
  onSaved,
  contract,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (data: EditFormData) => void;
  contract: ContractItem;
}) {
  const [form, setForm] = useState<EditFormData>({
    title: contract.title,
    amount: contract.amount,
    description: contract.description ?? '',
    signatory: contract.signatory,
  });

  const { submitting, error, success, submit, clearError } = useFormSubmit({
    onSubmit: async () => {
      if (!form.title.trim()) throw new Error('合同名称不能为空');
      if (form.amount <= 0) throw new Error('合同金额必须大于 0');
      onSaved(form);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <Modal open={open} onClose={onClose} title="编辑合同信息">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="合同名称" error={!form.title.trim() ? '名称不能为空' : undefined}>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="合同标题"
            style={inputStyle}
          />
        </FormField>
        <FormField label="合同金额（元）" error={form.amount <= 0 ? '金额必须大于 0' : undefined}>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
            style={inputStyle}
          />
        </FormField>
        <FormField label="签约人">
          <input
            value={form.signatory}
            onChange={(e) => setForm((prev) => ({ ...prev, signatory: e.target.value }))}
            placeholder="签约人姓名"
            style={inputStyle}
          />
        </FormField>
        <FormField label="备注说明">
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="合同备注"
            style={textareaStyle}
          />
        </FormField>
        <FormSubmitFeedback error={error} success={success} onDismissError={clearError} onDismissSuccess={clearError} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>取消</button>
          <SubmitButton loading={submitting} disabled={submitting}>保存</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ── 主页面 ──

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const contract = useMemo(() => MOCK_CONTRACTS.find((c) => c.id === id) ?? null, [id]);

  const [editOpen, setEditOpen] = useState(false);
  const [delConfirmOpen, setDelConfirmOpen] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<ContractStatus | null>(null);

  // ── 状态流转 ──

  const nextStatus = contract ? NEXT_STATUS[contract.status] : undefined;
  const hasNext = nextStatus !== undefined;

  const handleStatusTransition = useCallback(() => {
    if (!contract || !statusTarget) return;
    // In a real app, would call API here. Mock: simulate success.
    setStatusConfirmOpen(false);
    setStatusTarget(null);
  }, [contract, statusTarget]);

  // ── 编辑 ──

  const handleEditSaved = useCallback((_data: EditFormData) => {
    setEditOpen(false);
  }, []);

  // ── 删除 ──

  const handleDelete = useCallback(() => {
    setDelConfirmOpen(false);
    router.push('/contracts');
  }, [router]);

  // ── 操作按钮 ──

  const actions: DetailShellAction[] = useMemo(() => {
    if (!contract) return [];
    const list: DetailShellAction[] = [];

    if (hasNext) {
      list.push({
        key: 'status',
        label: STATUS_ACTION_LABELS[contract.status] ?? '流转状态',
        variant: 'primary',
        onClick: () => {
          setStatusTarget(nextStatus!);
          setStatusConfirmOpen(true);
        },
      });
    }

    list.push(
      {
        key: 'edit',
        label: '编辑',
        variant: 'secondary',
        onClick: () => setEditOpen(true),
      },
      {
        key: 'delete',
        label: '删除',
        variant: 'danger',
        onClick: () => setDelConfirmOpen(true),
      },
    );

    return list;
  }, [contract, hasNext, nextStatus]);

  // ── 计算价值指标 ──

  const stats = useMemo(() => {
    if (!contract) return null;
    const paidRatio = contract.amount > 0 ? (contract.paid / contract.amount * 100).toFixed(0) : '0';
    const totalDays = (new Date(contract.endDate).getTime() - new Date(contract.startDate).getTime()) / 86400000;
    const elapsedDays = (new Date(today()).getTime() - new Date(contract.startDate).getTime()) / 86400000;
    const progress = totalDays > 0 ? Math.min(100, Math.round((elapsedDays / totalDays) * 100)) : 0;
    return { paidRatio, totalDays: Math.round(totalDays), progress };
  }, [contract]);

  // ── loading 状态 ──

  if (!contract) {
    return (
      <PageShell title="合同详情" subtitle="未找到该合同">
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <p>未找到合同信息 (ID: {id})</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={contract.title}
      subtitle={`合同编号: ${contract.contractNo}`}
    >
      <DetailShell
        title={contract.title}
        subtitle={`${CONTRACT_TYPE_MAP[contract.type]} · ${CONTRACT_STATUS_MAP[contract.status].label}`}
        actions={actions}
      >
        {/* 价值概览 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <StatBadge label="合同金额" value={formatAmount(contract.amount)} color="#60a5fa" />
          <StatBadge label="已付款" value={formatAmount(contract.paid)} color="#34d399" />
          <StatBadge label="付款率" value={`${stats?.paidRatio ?? 0}%`} color={Number(stats?.paidRatio ?? 0) >= 100 ? '#34d399' : '#fbbf24'} />
          <StatBadge label="续约次数" value={`${contract.renewalCount} 次`} color="#a78bfa" />
        </div>

        {/* 基本信息 */}
        <InfoSection title="基本信息">
          <InfoRow label="合同编号" value={contract.contractNo} />
          <InfoRow label="合同类型" value={CONTRACT_TYPE_MAP[contract.type]} />
          <InfoRow label="客户公司" value={contract.companyName} />
          <InfoRow label="签约人" value={contract.signatory} />
          <InfoRow label="更新日期" value={contract.updatedAt} />
          {contract.description && <InfoRow label="备注" value={contract.description} />}
        </InfoSection>

        {/* 时间与执行 */}
        <InfoSection title="合同期限">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            <StatBadge label="开始日期" value={contract.startDate} color="#94a3b8" />
            <StatBadge label="结束日期" value={contract.endDate} color="#94a3b8" />
            <StatBadge label="执行天数" value={`${stats?.totalDays ?? 0}天`} color="#60a5fa" />
            <StatBadge label="到期倒计时" value={String(daysUntil(contract.endDate))} color={daysUntil(contract.endDate) <= 30 ? '#f87171' : '#34d399'} />
          </div>
          {/* 进度条 */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              <span>执行进度</span>
              <span>{stats?.progress ?? 0}%</span>
            </div>
            <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.15)', overflow: 'hidden' }}>
              <div style={{ width: `${stats?.progress ?? 0}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #60a5fa, #34d399)', transition: 'width 0.3s' }} />
            </div>
          </div>
        </InfoSection>

        {/* 财务明细 */}
        <InfoSection title="财务明细">
          <InfoRow label="合同金额">
            <span style={{ fontSize: 14, color: '#60a5fa', fontWeight: 600 }}>{formatAmount(contract.amount)}</span>
          </InfoRow>
          <InfoRow label="已付款">
            <span style={{ fontSize: 14, color: '#34d399', fontWeight: 600 }}>{formatAmount(contract.paid)}</span>
          </InfoRow>
          <InfoRow label="未付款">
            <span style={{ fontSize: 14, color: contract.amount - contract.paid > 0 ? '#f87171' : '#e2e8f0', fontWeight: 600 }}>
              {formatAmount(contract.amount - contract.paid)}
            </span>
          </InfoRow>
        </InfoSection>
      </DetailShell>

      {/* ── 编辑弹窗 ── */}
      <EditContractModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={handleEditSaved}
        contract={contract}
      />

      {/* ── 状态流转确认 ── */}
      <Modal open={statusConfirmOpen} onClose={() => { setStatusConfirmOpen(false); setStatusTarget(null); }} title="确认状态变更">
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, margin: '8px 0 16px' }}>
          {statusTarget ? confirmMessage(contract, statusTarget) : ''}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={() => { setStatusConfirmOpen(false); setStatusTarget(null); }}
            style={secondaryBtnStyle}
          >
            取消
          </button>
          <SubmitButton onClick={handleStatusTransition}>确认变更</SubmitButton>
        </div>
      </Modal>

      {/* ── 删除确认 ── */}
      <Modal open={delConfirmOpen} onClose={() => setDelConfirmOpen(false)} title="确认删除">
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, margin: '8px 0 16px' }}>
          确定删除合同 "{contract.title}" 吗？此操作不可恢复。
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setDelConfirmOpen(false)} style={secondaryBtnStyle}>取消</button>
          <SubmitButton onClick={handleDelete} style={{ background: '#ef4444', borderColor: '#ef4444' }}>确认删除</SubmitButton>
        </div>
      </Modal>
    </PageShell>
  );
}
