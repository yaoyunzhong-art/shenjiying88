'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { FormField, FormSubmitFeedback, PageShell, SubmitButton, WorkspaceBreadcrumb } from '@m5/ui';

import type { MemberTierDetailPageSnapshot } from './member-tier-detail-data';

interface ActionFeedback {
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
}

export default function MemberTierDetailClient({ snapshot }: { snapshot: MemberTierDetailPageSnapshot }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [tier, setTier] = useState(snapshot.tier);
  const [isEditing, setIsEditing] = useState(false);
  const [submitState, setSubmitState] = useState<ActionFeedback>({ isSubmitting: false });

  useEffect(() => {
    setTier(snapshot.tier);
    setIsEditing(false);
    setSubmitState({ isSubmitting: false });
  }, [snapshot]);

  const handleRefresh = useCallback(() => {
    startRefresh(() => {
      router.refresh();
    });
  }, [router, startRefresh]);

  if (!tier) {
    return (
      <div style={{ maxWidth: 840, margin: '0 auto', padding: 32 }}>
        <WorkspaceBreadcrumb workspaceLabel="会员管理" workspaceHref="/members" intermediateLabel="等级列表" detailLabel="等级详情" />
        <PageShell title="等级不存在" subtitle="当前快照未命中目标等级。">
          <div style={missingStyle}>{snapshot.error}</div>
          <div style={actionStyle}>
            <SubmitButton variant="secondary" onClick={() => router.push('/members/tiers')}>返回列表</SubmitButton>
            <SubmitButton variant="primary" onClick={handleRefresh} loading={isRefreshing}>{isRefreshing ? '刷新中...' : '刷新快照'}</SubmitButton>
          </div>
        </PageShell>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb workspaceLabel="会员管理" workspaceHref="/members" intermediateLabel="等级列表" detailLabel={tier.name} />
      <PageShell title={`等级详情 · ${tier.name}`} subtitle={`${tier.key} · 共 ${tier.memberCount.toLocaleString()} 名会员命中该等级`}>
        {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
          <div style={{ marginBottom: 16 }}>
            <FormSubmitFeedback state={submitState} />
          </div>
        ) : null}
        <div style={actionStyle}>
          <SubmitButton variant="secondary" onClick={() => router.push('/members/tiers')}>返回列表</SubmitButton>
          <SubmitButton variant="secondary" onClick={handleRefresh} loading={isRefreshing}>{isRefreshing ? '刷新中...' : '刷新快照'}</SubmitButton>
          <SubmitButton variant="primary" onClick={() => setIsEditing((prev) => !prev)}>{isEditing ? '取消编辑' : '编辑等级'}</SubmitButton>
        </div>

        {isEditing ? (
          <div style={sectionStyle}>
            <div style={gridStyle}>
              <FormField label="等级名称">
                <input value={tier.name} onChange={(event) => setTier((prev) => prev && ({ ...prev, name: event.target.value }))} style={inputStyle(false)} />
              </FormField>
              <FormField label="等级标识">
                <input value={tier.key} onChange={(event) => setTier((prev) => prev && ({ ...prev, key: event.target.value }))} style={inputStyle(false)} />
              </FormField>
            </div>
            <div style={actionStyle}>
              <SubmitButton variant="primary" onClick={async () => { setSubmitState({ isSubmitting: true }); await new Promise((resolve) => setTimeout(resolve, 200)); setSubmitState({ isSubmitting: false, successMessage: '等级配置已完成本地保存。' }); setIsEditing(false); handleRefresh(); }}>
                保存修改
              </SubmitButton>
            </div>
          </div>
        ) : (
          <div style={sectionStyle}>
            <div style={{ color: '#cbd5e1', lineHeight: 1.8 }}>
              <div>等级标识: {tier.key}</div>
              <div>积分区间: {tier.minPoints.toLocaleString()} - {tier.maxPoints.toLocaleString()}</div>
              <div>会员数: {tier.memberCount.toLocaleString()}</div>
              <div>权益: {tier.benefits.join('、') || '暂无权益'}</div>
            </div>
          </div>
        )}
      </PageShell>
    </div>
  );
}

const sectionStyle: CSSProperties = { borderRadius: 16, padding: 24, background: 'rgba(15, 23, 42, 0.35)', border: '1px solid rgba(148, 163, 184, 0.18)' };
const gridStyle: CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' };
const actionStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 16 };
const missingStyle: CSSProperties = { borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(248, 113, 113, 0.24)', background: 'rgba(127, 29, 29, 0.22)', color: '#fecaca', marginBottom: 16 };
function inputStyle(hasError: boolean): CSSProperties { return { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`, background: 'rgba(15, 23, 42, 0.4)', color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }; }
