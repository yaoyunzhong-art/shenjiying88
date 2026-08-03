'use client';
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  SubmitButton,
  WorkspaceBreadcrumb,
} from '@m5/ui';

import type { CreateMemberFormData, CreateMemberPageSnapshot } from './create-member-data';

type CreateFormErrors = Partial<Record<keyof CreateMemberFormData, string>>;

interface ActionFeedback {
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
}

function validateForm(data: CreateMemberFormData): CreateFormErrors {
  const errors: CreateFormErrors = {};
  if (!data.name.trim()) {
    errors.name = '姓名不能为空';
  }
  if (!data.phone.trim()) {
    errors.phone = '电话不能为空';
  } else if (!/^[\d\s\-+()]{6,20}$/.test(data.phone.trim())) {
    errors.phone = '电话号码格式不正确';
  }
  if (!data.storeName.trim()) {
    errors.storeName = '所属门店不能为空';
  }
  if (!data.marketCode) {
    errors.marketCode = '所属市场不能为空';
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确';
  }
  return errors;
}

async function submitCreateMember(
  data: CreateMemberFormData,
  snapshot: CreateMemberPageSnapshot
): Promise<{ memberId: string; code: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (snapshot.duplicatePhoneSamples.includes(data.phone.trim())) {
    throw new Error('该手机号已被注册为会员');
  }
  const suffix = String(Date.now()).slice(-5);
  return { memberId: `m${suffix}`, code: `MEM-${suffix}` };
}

export default function CreateMemberClient({ snapshot }: { snapshot: CreateMemberPageSnapshot }) {
  const router = useRouter();
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [formData, setFormData] = useState<CreateMemberFormData>(snapshot.formDefaults);
  const [errors, setErrors] = useState<CreateFormErrors>({});
  const [submitState, setSubmitState] = useState<ActionFeedback>({ isSubmitting: false });
  const [createdMemberCode, setCreatedMemberCode] = useState<string | null>(null);

  useEffect(() => {
    setFormData(snapshot.formDefaults);
    setErrors({});
    setSubmitState({ isSubmitting: false });
    setCreatedMemberCode(null);
  }, [snapshot]);

  

  const handleFieldChange = useCallback((field: keyof CreateMemberFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitState({ isSubmitting: true });
    try {
      const result = await submitCreateMember(formData, snapshot);
      setCreatedMemberCode(result.code);
      setSubmitState({ isSubmitting: false, successMessage: `会员创建成功，编号 ${result.code}` });
    } catch (error) {
      setSubmitState({
        isSubmitting: false,
        errorMessage: error instanceof Error ? error.message : '创建失败，请稍后重试。',
      });
    }
  }, [formData, snapshot]);

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb workspaceLabel="会员管理" workspaceHref="/members" detailLabel="新增会员" />
      <PageShell title="新增会员" subtitle="按建档模板补充基础资料、门店归属和初始化标签。">
        <div style={hintStyle}>重复手机号样本: {snapshot.duplicatePhoneSamples.join(' / ')}</div>

        {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
          <div style={{ marginBottom: 16 }}>
            <FormSubmitFeedback state={submitState} />
          </div>
        ) : null}

        {createdMemberCode ? (
          <div style={successStyle}>已完成会员 {createdMemberCode} 的演示建档，可继续刷新或返回列表。</div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 16 }}>
          <SubmitButton variant="secondary" onClick={handleRefresh} loading={isRefreshing}>
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </SubmitButton>
        </div>

        <div style={sectionStyle}>
          <div style={gridStyle}>
            <FormField label="姓名" required error={errors.name}>
              <input value={formData.name} onChange={(event) => handleFieldChange('name', event.target.value)} style={inputStyle(Boolean(errors.name))} />
            </FormField>
            <FormField label="电话" required error={errors.phone}>
              <input value={formData.phone} onChange={(event) => handleFieldChange('phone', event.target.value)} style={inputStyle(Boolean(errors.phone))} />
            </FormField>
            <FormField label="邮箱" error={errors.email}>
              <input value={formData.email} onChange={(event) => handleFieldChange('email', event.target.value)} style={inputStyle(Boolean(errors.email))} />
            </FormField>
            <FormField label="所属门店" required error={errors.storeName}>
              <input value={formData.storeName} onChange={(event) => handleFieldChange('storeName', event.target.value)} style={inputStyle(Boolean(errors.storeName))} />
            </FormField>
            <FormField label="所属市场" required error={errors.marketCode}>
              <select value={formData.marketCode} onChange={(event) => handleFieldChange('marketCode', event.target.value)} style={{ ...inputStyle(Boolean(errors.marketCode)), minHeight: 40 }}>
                {snapshot.marketOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="初始等级">
              <select value={formData.tier} onChange={(event) => handleFieldChange('tier', event.target.value)} style={{ ...inputStyle(false), minHeight: 40 }}>
                {snapshot.tierOptions.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ marginTop: 16 }}>
            <FormField label="备注">
              <textarea value={formData.notes} onChange={(event) => handleFieldChange('notes', event.target.value)} style={{ ...inputStyle(false), minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }} />
            </FormField>
          </div>
        </div>

        <div style={actionStyle}>
          <SubmitButton variant="secondary" onClick={() => router.push('/members')}>
            返回列表
          </SubmitButton>
          <SubmitButton variant="primary" onClick={() => void handleSubmit()} loading={submitState.isSubmitting}>
            {submitState.isSubmitting ? '创建中...' : '创建会员'}
          </SubmitButton>
        </div>
      </PageShell>
    </div>
  );
}

const sectionStyle: CSSProperties = { borderRadius: 16, padding: 24, background: 'rgba(15, 23, 42, 0.35)', border: '1px solid rgba(148, 163, 184, 0.18)' };
const gridStyle: CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' };
const actionStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 };
const hintStyle: CSSProperties = { marginBottom: 16, borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(96, 165, 250, 0.2)', background: 'rgba(30, 41, 59, 0.45)', color: '#dbeafe', fontSize: 13 };
const successStyle: CSSProperties = { marginBottom: 16, borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(74, 222, 128, 0.28)', background: 'rgba(21, 128, 61, 0.12)', color: '#dcfce7' };
function inputStyle(hasError: boolean): CSSProperties { return { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`, background: 'rgba(15, 23, 42, 0.4)', color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }; }
