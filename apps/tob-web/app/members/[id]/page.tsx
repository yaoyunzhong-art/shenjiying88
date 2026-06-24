/**
 * members/[id]/page.tsx — 会员详情页 (ToB 会员管理)
 *
 * 使用 DetailShell + InfoSection / InfoRow 结构展示会员信息
 * 支持编辑 + 状态流转
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useCallback } from 'react';
import {
  PageShell,
  DetailShell,
  StatusBadge,
  Modal,
  SubmitButton,
  FormField,
  FormSubmitFeedback,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';
import {
  MOCK_MEMBERS,
  MEMBER_TIER_MAP,
  MEMBER_STATUS_MAP,
  ALL_STORES,
  ALL_SALESPERSONS,
  type MemberItem,
  type MemberStatus,
} from '../../members-data';

// ── Helpers ──

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const NEXT_STATUS: Partial<Record<MemberStatus, MemberStatus>> = {
  active: 'inactive',
  inactive: 'active',
  suspended: 'churned',
  churned: 'active',
};

const STATUS_ACTION_LABELS: Partial<Record<MemberStatus, string>> = {
  active: '静默标记',
  inactive: '重新激活',
  suspended: '标记流失',
  churned: '恢复激活',
};

function confirmMessage(member: MemberItem, next: MemberStatus): string {
  const from = MEMBER_STATUS_MAP[member.status].label;
  const to = MEMBER_STATUS_MAP[next].label;
  return `确定将会员 "${member.name}" 从 [${from}] 变更为 [${to}] 吗？`;
}

// ── 编辑表单数据类型 ──

type EditFormData = {
  name: string;
  phone: string;
  storeName: string;
  salesperson: string;
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

function EditMemberModal({
  open,
  onClose,
  onSaved,
  member,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (data: EditFormData) => void;
  member: MemberItem;
}) {
  const [form, setForm] = useState<EditFormData>({
    name: member.name,
    phone: member.phone,
    storeName: member.storeName,
    salesperson: member.salesperson,
  });

  const { submitting, error, success, submit, clearError } = useFormSubmit({
    onSubmit: async () => {
      if (!form.name.trim()) throw new Error('会员名称不能为空');
      onSaved(form);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <Modal open={open} onClose={onClose} title="编辑会员信息">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="姓名" error={!form.name.trim() ? '名称不能为空' : undefined}>
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="会员姓名"
            style={inputStyle}
          />
        </FormField>
        <FormField label="手机号">
          <input
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="手机号"
            style={inputStyle}
          />
        </FormField>
        <FormField label="所属门店">
          <select
            style={inputStyle}
            value={form.storeName}
            onChange={(e) => setForm((prev) => ({ ...prev, storeName: e.target.value }))}
          >
            {ALL_STORES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="专属导购">
          <select
            style={inputStyle}
            value={form.salesperson}
            onChange={(e) => setForm((prev) => ({ ...prev, salesperson: e.target.value }))}
          >
            {ALL_SALESPERSONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
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

// ── 状态流转确认弹窗 ──

function TransitionModal({
  open,
  onClose,
  onConfirm,
  member,
  nextStatus,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  member: MemberItem;
  nextStatus: MemberStatus;
}) {
  const { submitting, submit } = useFormSubmit({
    onSubmit: async () => {
      onConfirm();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="变更状态">
      <div style={{ color: '#cbd5e1', marginBottom: 16 }}>
        {confirmMessage(member, nextStatus)}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>取消</button>
          <SubmitButton loading={submitting} type="submit">确认变更</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ── 详情页 ──

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [member, setMember] = useState<MemberItem | undefined>(() =>
    MOCK_MEMBERS.find((m) => m.id === params.id),
  );
  const [editOpen, setEditOpen] = useState(false);
  const [transitionOpen, setTransitionOpen] = useState(false);

  // 状态流转
  const transitionStatus = useCallback(() => {
    if (!member) return;
    const next = NEXT_STATUS[member.status];
    if (!next) return;
    setMember((prev) =>
      prev ? { ...prev, status: next, lastVisit: today() } : prev,
    );
    setTransitionOpen(false);
  }, [member]);

  // 保存编辑
  const handleSaved = useCallback((data: EditFormData) => {
    setMember((prev) =>
      prev
        ? {
            ...prev,
            name: data.name,
            phone: data.phone,
            storeName: data.storeName,
            salesperson: data.salesperson,
          }
        : prev,
    );
    setEditOpen(false);
  }, []);

  const detailActions: DetailShellAction[] = useMemo(
    () => [
      {
        key: 'edit',
        label: '编辑',
        onClick: () => setEditOpen(true),
        variant: 'primary',
      },
      {
        key: 'transition',
        label: member ? STATUS_ACTION_LABELS[member.status] ?? '状态流转' : '状态流转',
        onClick: () => setTransitionOpen(true),
        variant: 'secondary',
      },
      {
        key: 'back',
        label: '返回列表',
        onClick: () => router.push('/members'),
        variant: 'secondary',
      },
    ],
    [member],
  );

  if (!member) {
    return (
      <PageShell title="会员详情" description="">
        <div style={{ textAlign: 'center', padding: 64, color: '#64748b', fontSize: 14 }}>
          未找到会员 (ID: {params.id})
        </div>
      </PageShell>
    );
  }

  const currentTierMeta = MEMBER_TIER_MAP[member.tier];
  const s = MEMBER_STATUS_MAP[member.status];
  const nextStatus = NEXT_STATUS[member.status];

  return (
    <PageShell
      title={member.name}
      description={`${member.code} · ${currentTierMeta.label} · ${member.storeName}`}
    >
      <DetailShell
        title={member.name}
        subtitle={`${member.code} · ${currentTierMeta.label} · ${member.storeName}`}
        actions={detailActions}
      >
        {/* 财务指标卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <StatBadge label="等级" value={currentTierMeta.label} color={currentTierMeta.color} />
          <StatBadge label="积分" value={member.points.toLocaleString()} color="#fbbf24" />
          <StatBadge label="累计消费" value={formatCurrency(member.totalSpent)} color="#4ade80" />
          <StatBadge label="状态" value={s.label} color={s.variant === 'success' ? '#4ade80' : '#f87171'} />
        </div>

        {/* 基础信息 */}
        <InfoSection title="基础信息">
          <InfoRow label="会员编码" value={member.code} />
          <InfoRow label="姓名" value={member.name} />
          <InfoRow label="手机号" value={member.phone} />
          <InfoRow label="状态">
            <StatusBadge label={s.label} variant={s.variant} size="sm" dot />
          </InfoRow>
          <InfoRow label="会员等级">
            <StatusBadge label={currentTierMeta.label} variant={currentTierMeta.variant} size="sm" dot={false} />
          </InfoRow>
        </InfoSection>

        {/* 归属信息 */}
        <InfoSection title="归属信息">
          <InfoRow label="归属市场" value={member.marketCode} />
          <InfoRow label="所属门店" value={member.storeName} />
          <InfoRow label="专属导购" value={member.salesperson} />
        </InfoSection>

        {/* 积分与消费 */}
        <InfoSection title="积分与消费">
          <InfoRow label="当前积分" value={member.points.toLocaleString()} />
          <InfoRow label="累计消费" value={formatCurrency(member.totalSpent)} />
        </InfoSection>

        {/* 标签 */}
        <InfoSection title="标签">
          {member.tags.length > 0
            ? <InfoRow label="标签" value={member.tags.join(', ')} />
            : <InfoRow label="标签" value="暂无" />}
        </InfoSection>

        {/* 时间线 */}
        <InfoSection title="时间信息">
          <InfoRow label="创建时间" value={member.createdAt} />
          <InfoRow label="最后到店" value={member.lastVisit} />
        </InfoSection>
      </DetailShell>

      {/* 编辑弹窗 */}
      {member && (
        <EditMemberModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
          member={member}
        />
      )}

      {/* 状态流转弹窗 */}
      {member && nextStatus && (
        <TransitionModal
          open={transitionOpen}
          onClose={() => setTransitionOpen(false)}
          onConfirm={transitionStatus}
          member={member}
          nextStatus={nextStatus}
        />
      )}
    </PageShell>
  );
}
