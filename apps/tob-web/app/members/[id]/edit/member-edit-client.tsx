'use client';

import React, { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  StatusBadge,
  SubmitButton,
  useFormSubmit,
} from '@m5/ui';
import {
  ALL_MARKETS,
  ALL_SALESPERSONS,
  ALL_STORES,
  MEMBER_STATUS_MAP,
  MEMBER_STATUSES,
  MEMBER_TIER_MAP,
  MEMBER_TIERS,
  type MemberItem,
  type MemberStatus,
  type MemberTier,
} from '../../../members-data';
import type { MemberEditSnapshot } from '../../member-edit-data';

type EditMemberForm = {
  name: string;
  phone: string;
  marketCode: string;
  storeName: string;
  salesperson: string;
  tier: MemberTier;
  status: MemberStatus;
  points: string;
  totalSpent: string;
  lastVisit: string;
  tags: string;
};

function createInitialForm(member: MemberItem | null): EditMemberForm {
  return {
    name: member?.name ?? '',
    phone: member?.phone ?? '',
    marketCode: member?.marketCode ?? ALL_MARKETS[0] ?? '',
    storeName: member?.storeName ?? ALL_STORES[0] ?? '',
    salesperson: member?.salesperson ?? ALL_SALESPERSONS[0] ?? '',
    tier: member?.tier ?? 'standard',
    status: member?.status ?? 'inactive',
    points: member ? String(member.points) : '0',
    totalSpent: member ? String(member.totalSpent) : '0',
    lastVisit: member?.lastVisit ?? new Date().toISOString().slice(0, 10),
    tags: member?.tags.join(', ') ?? '',
  };
}

function toPreviewMember(member: MemberItem, form: EditMemberForm): MemberItem {
  return {
    ...member,
    name: form.name.trim(),
    phone: form.phone.trim(),
    marketCode: form.marketCode,
    storeName: form.storeName,
    salesperson: form.salesperson,
    tier: form.tier,
    status: form.status,
    points: Number(form.points) || 0,
    totalSpent: Number(form.totalSpent) || 0,
    lastVisit: form.lastVisit,
    tags: form.tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(1)}万`;
  }

  return `¥${amount.toLocaleString()}`;
}

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

const secondaryButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(15,23,42,0.4)',
  color: '#cbd5e1',
  cursor: 'pointer',
  fontSize: 13,
};

export default function MemberEditClient({
  snapshot,
}: {
  snapshot: MemberEditSnapshot;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [form, setForm] = useState<EditMemberForm>(() => createInitialForm(snapshot.member));
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const previewMember = useMemo(
    () => (snapshot.member ? toPreviewMember(snapshot.member, form) : null),
    [form, snapshot.member],
  );

  const refreshSnapshot = useCallback(() => {
    startRefresh(() => {
      router.refresh();
    });
  }, [router]);

  const { submitting, error, success, submit, clearError } = useFormSubmit({
    onSubmit: async () => {
      if (!snapshot.member) {
        throw new Error('当前会员不存在，无法保存编辑草稿。');
      }

      if (!form.name.trim()) {
        throw new Error('会员姓名不能为空。');
      }

      if (!/^1\d{10}$/.test(form.phone.trim())) {
        throw new Error('手机号格式不正确，请输入 11 位手机号。');
      }

      if (!/^\d+$/.test(form.points.trim())) {
        throw new Error('积分只能输入非负整数。');
      }

      if (!/^\d+$/.test(form.totalSpent.trim())) {
        throw new Error('累计消费只能输入非负整数。');
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });

      setSavedAt(new Date().toISOString());
    },
  });

  if (!snapshot.member) {
    return (
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
        <PageShell title="编辑会员" description="当前会员未命中本地样本，无法生成编辑表单。">
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              border: '1px solid rgba(248,113,113,0.24)',
              background: 'rgba(127,29,29,0.18)',
              color: '#fecaca',
            }}
          >
            <p style={{ margin: 0 }}>{snapshot.error}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={() => router.push('/members')} style={secondaryButtonStyle}>
              返回会员列表
            </button>
            <button type="button" onClick={refreshSnapshot} style={secondaryButtonStyle}>
              {isRefreshing ? '刷新中...' : '重取快照'}
            </button>
          </div>
        </PageShell>
      </main>
    );
  }

  const tierMeta = MEMBER_TIER_MAP[previewMember.tier];
  const statusMeta = MEMBER_STATUS_MAP[previewMember.status];

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={`编辑会员 · ${snapshot.member.name}`}
        description={`${snapshot.member.code} · ${snapshot.member.storeName} · fallback 样本编辑页`}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>
            编辑表单由服务端快照预填充，刷新统一走 `router.refresh()`，保存只更新当前客户端草稿。
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => router.push(`/members/${snapshot.member.id}`)}
              style={secondaryButtonStyle}
            >
              查看详情
            </button>
            <button type="button" onClick={() => router.push('/members')} style={secondaryButtonStyle}>
              返回列表
            </button>
            <button type="button" onClick={refreshSnapshot} style={secondaryButtonStyle}>
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </button>
          </div>
        </div>

        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            border: '1px solid rgba(250,204,21,0.28)',
            background: 'rgba(250,204,21,0.08)',
            color: '#fde68a',
          }}
        >
          {snapshot.error}
        </div>

        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 0.9fr)',
            alignItems: 'start',
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            style={{
              padding: 20,
              borderRadius: 16,
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'rgba(15,23,42,0.38)',
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#f8fafc' }}>编辑会员资料</h2>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <FormField label="会员姓名" error={!form.name.trim() ? '会员姓名不能为空' : undefined}>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="请输入会员姓名"
                  style={inputStyle}
                />
              </FormField>
              <FormField label="手机号">
                <input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="请输入 11 位手机号"
                  style={inputStyle}
                />
              </FormField>
              <FormField label="归属市场">
                <select
                  value={form.marketCode}
                  onChange={(event) => setForm((current) => ({ ...current, marketCode: event.target.value }))}
                  style={inputStyle}
                >
                  {ALL_MARKETS.map((market) => (
                    <option key={market} value={market}>
                      {market}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="所属门店">
                <select
                  value={form.storeName}
                  onChange={(event) => setForm((current) => ({ ...current, storeName: event.target.value }))}
                  style={inputStyle}
                >
                  {ALL_STORES.map((store) => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="专属导购">
                <select
                  value={form.salesperson}
                  onChange={(event) => setForm((current) => ({ ...current, salesperson: event.target.value }))}
                  style={inputStyle}
                >
                  {ALL_SALESPERSONS.map((salesperson) => (
                    <option key={salesperson} value={salesperson}>
                      {salesperson}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="会员等级">
                <select
                  value={form.tier}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, tier: event.target.value as MemberTier }))
                  }
                  style={inputStyle}
                >
                  {MEMBER_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {MEMBER_TIER_MAP[tier].label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="会员状态">
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value as MemberStatus }))
                  }
                  style={inputStyle}
                >
                  {MEMBER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {MEMBER_STATUS_MAP[status].label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="最近到店">
                <input
                  type="date"
                  value={form.lastVisit}
                  onChange={(event) => setForm((current) => ({ ...current, lastVisit: event.target.value }))}
                  style={inputStyle}
                />
              </FormField>
              <FormField label="积分">
                <input
                  value={form.points}
                  onChange={(event) => setForm((current) => ({ ...current, points: event.target.value }))}
                  placeholder="请输入积分"
                  style={inputStyle}
                />
              </FormField>
              <FormField label="累计消费">
                <input
                  value={form.totalSpent}
                  onChange={(event) => setForm((current) => ({ ...current, totalSpent: event.target.value }))}
                  placeholder="请输入累计消费"
                  style={inputStyle}
                />
              </FormField>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="标签">
                  <input
                    value={form.tags}
                    onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                    placeholder="多个标签用英文逗号分隔"
                    style={inputStyle}
                  />
                </FormField>
              </div>
            </div>

            <FormSubmitFeedback
              submitting={submitting}
              error={error}
              success={success}
              onDismissError={clearError}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 16 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {savedAt ? `最近本地保存时间: ${savedAt}` : '尚未执行本地保存'}
              </span>
              <SubmitButton loading={submitting} type="submit">
                保存草稿
              </SubmitButton>
            </div>
          </form>

          <aside
            style={{
              padding: 20,
              borderRadius: 16,
              border: '1px solid rgba(148,163,184,0.16)',
              background: 'rgba(15,23,42,0.32)',
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#f8fafc' }}>预览快照</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <StatusBadge label={tierMeta.label} variant={tierMeta.variant} size="sm" />
              <StatusBadge label={statusMeta.label} variant={statusMeta.variant} size="sm" dot />
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <PreviewItem label="会员编号" value={previewMember.code} />
              <PreviewItem label="姓名" value={previewMember.name} />
              <PreviewItem label="手机号" value={previewMember.phone} />
              <PreviewItem label="所属门店" value={previewMember.storeName} />
              <PreviewItem label="归属市场" value={previewMember.marketCode} />
              <PreviewItem label="专属导购" value={previewMember.salesperson} />
              <PreviewItem label="积分" value={previewMember.points.toLocaleString()} />
              <PreviewItem label="累计消费" value={formatCurrency(previewMember.totalSpent)} />
              <PreviewItem label="最近到店" value={previewMember.lastVisit} />
              <PreviewItem label="标签" value={previewMember.tags.join(', ') || '暂无'} />
            </div>
          </aside>
        </div>
      </PageShell>
    </main>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        paddingBottom: 10,
        borderBottom: '1px solid rgba(148,163,184,0.12)',
      }}
    >
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#e2e8f0', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
