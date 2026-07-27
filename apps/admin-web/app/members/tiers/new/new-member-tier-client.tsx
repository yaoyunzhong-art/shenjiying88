'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { FormField, FormSubmitFeedback, PageShell, SubmitButton, WorkspaceBreadcrumb } from '@m5/ui';

import type { NewMemberTierFormData, NewMemberTierPageSnapshot } from './new-member-tier-data';

interface ActionFeedback {
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
}

export default function NewMemberTierClient({ snapshot }: { snapshot: NewMemberTierPageSnapshot }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [formData, setFormData] = useState<NewMemberTierFormData>(snapshot.formDefaults);
  const [submitState, setSubmitState] = useState<ActionFeedback>({ isSubmitting: false });

  useEffect(() => {
    setFormData(snapshot.formDefaults);
    setSubmitState({ isSubmitting: false });
  }, [snapshot]);

  const handleRefresh = useCallback(() => {
    startRefresh(() => {
      router.refresh();
    });
  }, [router, startRefresh]);

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb workspaceLabel="会员管理" workspaceHref="/members" intermediateLabel="等级列表" detailLabel="新建等级" />
      <PageShell title="新建会员等级" subtitle="创建等级基础规则和积分门槛。">
        {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
          <div style={{ marginBottom: 16 }}>
            <FormSubmitFeedback state={submitState} />
          </div>
        ) : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 16 }}>
          <SubmitButton variant="secondary" onClick={handleRefresh} loading={isRefreshing}>{isRefreshing ? '刷新中...' : '刷新快照'}</SubmitButton>
        </div>
        <div style={sectionStyle}>
          <div style={gridStyle}>
            <FormField label="等级标识"><input value={formData.key} onChange={(event) => setFormData((prev) => ({ ...prev, key: event.target.value }))} style={inputStyle(false)} /></FormField>
            <FormField label="等级名称"><input value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} style={inputStyle(false)} /></FormField>
            <FormField label="最低积分"><input value={formData.minPoints} onChange={(event) => setFormData((prev) => ({ ...prev, minPoints: event.target.value }))} style={inputStyle(false)} /></FormField>
            <FormField label="最高积分"><input value={formData.maxPoints} onChange={(event) => setFormData((prev) => ({ ...prev, maxPoints: event.target.value }))} style={inputStyle(false)} /></FormField>
            <FormField label="折扣率"><input value={formData.discountRate} onChange={(event) => setFormData((prev) => ({ ...prev, discountRate: event.target.value }))} style={inputStyle(false)} /></FormField>
          </div>
          <div style={{ marginTop: 16 }}>
            <FormField label="备注"><textarea value={formData.notes} onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))} style={{ ...inputStyle(false), minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }} /></FormField>
          </div>
        </div>
        <div style={actionStyle}>
          <SubmitButton variant="secondary" onClick={() => router.push('/members/tiers')}>返回列表</SubmitButton>
          <SubmitButton variant="primary" onClick={async () => { setSubmitState({ isSubmitting: true }); await new Promise((resolve) => setTimeout(resolve, 200)); setSubmitState({ isSubmitting: false, successMessage: `等级 ${formData.key || 'new-tier'} 已完成演示保存。` }); handleRefresh(); }}>保存等级</SubmitButton>
        </div>
      </PageShell>
    </div>
  );
}

const sectionStyle: CSSProperties = { borderRadius: 16, padding: 24, background: 'rgba(15, 23, 42, 0.35)', border: '1px solid rgba(148, 163, 184, 0.18)' };
const gridStyle: CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' };
const actionStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 };
function inputStyle(hasError: boolean): CSSProperties { return { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`, background: 'rgba(15, 23, 42, 0.4)', color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }; }
