'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { FormField, FormSubmitFeedback, PageShell, SubmitButton, WorkspaceBreadcrumb } from '@m5/ui';

import type { MemberTierFormPageSnapshot, MemberTierFormValues } from './member-tier-form-data';

interface FieldError {
  field: keyof MemberTierFormValues;
  message: string;
}

interface ActionFeedback {
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
}

function validateForm(values: MemberTierFormValues): FieldError[] {
  const errors: FieldError[] = [];
  if (!values.tierKey.trim()) errors.push({ field: 'tierKey', message: '等级标识不能为空' });
  if (!values.tierName.trim()) errors.push({ field: 'tierName', message: '等级名称不能为空' });
  if (!values.minPoints.trim()) errors.push({ field: 'minPoints', message: '最低积分不能为空' });
  if (!values.maxPoints.trim()) errors.push({ field: 'maxPoints', message: '最高积分不能为空' });
  if (!values.discountRate.trim()) errors.push({ field: 'discountRate', message: '折扣率不能为空' });
  if (values.benefitTypes.length === 0) errors.push({ field: 'benefitTypes', message: '至少选择一个权益类型' });
  return errors;
}

export default function MemberTierFormClient({ snapshot }: { snapshot: MemberTierFormPageSnapshot }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [values, setValues] = useState<MemberTierFormValues>(snapshot.formDefaults);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [submitState, setSubmitState] = useState<ActionFeedback>({ isSubmitting: false });

  useEffect(() => {
    setValues(snapshot.formDefaults);
    setFieldErrors([]);
    setSubmitState({ isSubmitting: false });
  }, [snapshot]);

  const handleRefresh = useCallback(() => {
    startRefresh(() => {
      router.refresh();
    });
  }, [router, startRefresh]);

  const getFieldError = useCallback((field: keyof MemberTierFormValues) => fieldErrors.find((item) => item.field === field)?.message, [fieldErrors]);

  const handleSubmit = useCallback(async () => {
    const errors = validateForm(values);
    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSubmitState({ isSubmitting: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    setSubmitState({ isSubmitting: false, successMessage: `等级 ${values.tierName || values.tierKey} 已完成模板保存。` });
  }, [values]);

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb workspaceLabel="会员管理" workspaceHref="/members" detailLabel="等级表单" />
      <PageShell title="会员等级权益配置" subtitle="配置等级积分区间、折扣率与权益组合。">
        {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
          <div style={{ marginBottom: 16 }}>
            <FormSubmitFeedback state={submitState} />
          </div>
        ) : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 16 }}>
          <SubmitButton variant="secondary" onClick={handleRefresh} loading={isRefreshing}>
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </SubmitButton>
        </div>
        <div style={sectionStyle}>
          <div style={gridStyle}>
            <FormField label="等级标识" required error={getFieldError('tierKey')}>
              <input value={values.tierKey} onChange={(event) => setValues((prev) => ({ ...prev, tierKey: event.target.value }))} style={inputStyle(Boolean(getFieldError('tierKey')))} />
            </FormField>
            <FormField label="等级名称" required error={getFieldError('tierName')}>
              <input value={values.tierName} onChange={(event) => setValues((prev) => ({ ...prev, tierName: event.target.value }))} style={inputStyle(Boolean(getFieldError('tierName')))} />
            </FormField>
            <FormField label="最低积分" required error={getFieldError('minPoints')}>
              <input value={values.minPoints} onChange={(event) => setValues((prev) => ({ ...prev, minPoints: event.target.value }))} style={inputStyle(Boolean(getFieldError('minPoints')))} />
            </FormField>
            <FormField label="最高积分" required error={getFieldError('maxPoints')}>
              <input value={values.maxPoints} onChange={(event) => setValues((prev) => ({ ...prev, maxPoints: event.target.value }))} style={inputStyle(Boolean(getFieldError('maxPoints')))} />
            </FormField>
            <FormField label="折扣率" required error={getFieldError('discountRate')}>
              <input value={values.discountRate} onChange={(event) => setValues((prev) => ({ ...prev, discountRate: event.target.value }))} style={inputStyle(Boolean(getFieldError('discountRate')))} />
            </FormField>
            <FormField label="状态">
              <select value={values.status} onChange={(event) => setValues((prev) => ({ ...prev, status: event.target.value as MemberTierFormValues['status'] }))} style={{ ...inputStyle(false), minHeight: 40 }}>
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
            </FormField>
          </div>

          <div style={{ marginTop: 16, color: getFieldError('benefitTypes') ? '#fca5a5' : '#cbd5e1' }}>
            权益类型: {getFieldError('benefitTypes') ?? ''}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {snapshot.benefitOptions.map((option) => {
              const selected = values.benefitTypes.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setValues((prev) => ({
                      ...prev,
                      benefitTypes: selected ? prev.benefitTypes.filter((item) => item !== option.value) : [...prev.benefitTypes, option.value],
                    }))
                  }
                  style={chipStyle(selected)}
                >
                  {selected ? '✓ ' : ''}{option.label}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            <FormField label="备注">
              <textarea value={values.notes} onChange={(event) => setValues((prev) => ({ ...prev, notes: event.target.value }))} style={{ ...inputStyle(false), minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }} />
            </FormField>
          </div>
        </div>
        <div style={actionStyle}>
          <SubmitButton variant="secondary" onClick={() => router.push('/members')}>返回列表</SubmitButton>
          <SubmitButton variant="primary" onClick={() => void handleSubmit()} loading={submitState.isSubmitting}>保存配置</SubmitButton>
        </div>
      </PageShell>
    </div>
  );
}

const sectionStyle: CSSProperties = { borderRadius: 16, padding: 24, background: 'rgba(15, 23, 42, 0.35)', border: '1px solid rgba(148, 163, 184, 0.18)' };
const gridStyle: CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' };
const actionStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 };
function chipStyle(selected: boolean): CSSProperties { return { padding: '8px 14px', borderRadius: 999, border: `1px solid ${selected ? '#fbbf24' : 'rgba(148, 163, 184, 0.2)'}`, background: selected ? 'rgba(251, 191, 36, 0.16)' : 'transparent', color: selected ? '#fbbf24' : '#cbd5e1', cursor: 'pointer' }; }
function inputStyle(hasError: boolean): CSSProperties { return { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`, background: 'rgba(15, 23, 42, 0.4)', color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }; }
