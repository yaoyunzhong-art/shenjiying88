'use client';
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

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

import type { MemberDetail } from '../../../members-data';
import {
  updateAdminMemberProfile,
  isMemberMutationApprovalResult,
} from '../../../members-view-model';
import type { MemberEditPageSnapshot } from './member-edit-data';

interface EditFormData {
  name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  birthday: string;
  wechatId: string;
  address: string;
  notes: string;
  tags: string;
}

interface EditFormErrors {
  name?: string;
  phone?: string;
  email?: string;
  gender?: string;
  birthday?: string;
  wechatId?: string;
  address?: string;
  notes?: string;
  tags?: string;
}

interface ActionFeedback {
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
}

function formatDateForInput(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function buildInitialFormData(member: MemberDetail | null): EditFormData {
  return {
    name: member?.name ?? '',
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    gender: member?.gender ?? 'male',
    birthday: formatDateForInput(member?.birthday ?? ''),
    wechatId: member?.wechatId ?? '',
    address: member?.address ?? '',
    notes: member?.notes ?? '',
    tags: (member?.tags ?? []).join(', '),
  };
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '姓名不能为空';
  else if (data.name.trim().length > 50) errors.name = '姓名不能超过50个字符';

  if (!data.phone.trim()) errors.phone = '电话不能为空';
  else if (!/^[\d\s\-+()]{6,20}$/.test(data.phone.trim())) errors.phone = '电话号码格式不正确';

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确';
  }

  if (data.gender && !['male', 'female', 'other'].includes(data.gender)) {
    errors.gender = '性别选择不正确';
  }

  if (data.birthday) {
    const parsed = new Date(data.birthday);
    if (Number.isNaN(parsed.getTime())) {
      errors.birthday = '生日日期格式不正确';
    } else if (parsed > new Date()) {
      errors.birthday = '生日不能是未来日期';
    }
  }

  return errors;
}

export default function MemberEditClient({
  snapshot,
}: {
  snapshot: MemberEditPageSnapshot;
}) {
  const router = useRouter();
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [member, setMember] = useState<MemberDetail | null>(snapshot.member);
  const [formData, setFormData] = useState<EditFormData>(buildInitialFormData(snapshot.member));
  const [errors, setErrors] = useState<EditFormErrors>({});
  const [submitState, setSubmitState] = useState<ActionFeedback>({ isSubmitting: false });

  useEffect(() => {
    setMember(snapshot.member);
    setFormData(buildInitialFormData(snapshot.member));
    setErrors({});
  }, [snapshot]);

  const handleFieldChange = useCallback((field: keyof EditFormData, value: string) => {
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

  

  const handleSave = useCallback(async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitState({ isSubmitting: true });

    try {
      const result = await updateAdminMemberProfile(snapshot.memberId, {
        nickname: formData.name.trim(),
        mobile: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      if (!result) {
        throw new Error('会员资料更新失败，请稍后重试。');
      }

      if (isMemberMutationApprovalResult(result)) {
        setSubmitState({
          isSubmitting: false,
          successMessage: `${result.summary}${result.approvalTicket ? `，审批单 ${result.approvalTicket}` : ''}`,
        });
        handleRefresh();
        return;
      }

      setSubmitState({
        isSubmitting: false,
        successMessage: '会员资料已成功更新。',
      });
      handleRefresh();
    } catch (error) {
      setSubmitState({
        isSubmitting: false,
        errorMessage: error instanceof Error ? error.message : '保存失败，请稍后重试。',
      });
    }
  }, [formData, handleRefresh, snapshot.memberId]);

  if (!member) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
        <WorkspaceBreadcrumb workspaceLabel="会员管理" workspaceHref="/members" detailLabel="编辑资料" />
        <PageShell title="加载失败" subtitle="当前快照未命中会员详情，请返回列表重试。">
          <div
            style={{
              borderRadius: 16,
              padding: 24,
              border: '1px solid rgba(248, 113, 113, 0.24)',
              background: 'rgba(127, 29, 29, 0.22)',
              color: '#fecaca',
            }}
          >
            {snapshot.error ?? '未找到该会员'}
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <SubmitButton variant="secondary" onClick={() => router.push('/members')}>
              返回会员列表
            </SubmitButton>
            <SubmitButton variant="primary" onClick={handleRefresh} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </SubmitButton>
          </div>
        </PageShell>
      </div>
    );
  }

  const getFieldError = (field: keyof EditFormData): string | undefined => errors[field];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        workspaceLabel="会员管理"
        workspaceHref="/members"
        intermediateLabel={member.name}
        detailLabel="编辑资料"
      />

      <PageShell
        title={`编辑会员资料 · ${member.name}`}
        subtitle={`${member.code} · ${member.marketCode} · 修改后自动保存至持久化档案`}
      >
        <div
          style={{
            marginBottom: 24,
            borderRadius: 12,
            padding: '12px 16px',
            border: '1px solid rgba(96, 165, 250, 0.2)',
            background: 'rgba(30, 41, 59, 0.42)',
            color: '#dbeafe',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          当前编辑的是会员 {member.code} 的持久化档案。带 <span style={{ color: '#fca5a5' }}>*</span> 的字段为必填项。
          <div style={{ marginTop: 6, color: '#93c5fd' }}>
            deliveryMode: {snapshot.deliveryMode} · sourceLabel: {snapshot.sourceLabel}
          </div>
        </div>

        {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
          <div style={{ marginBottom: 24 }}>
            <FormSubmitFeedback state={submitState} />
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>基本信息</h3>
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <div data-field="name">
                  <FormField label="姓名" required error={getFieldError('name')}>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(event) => handleFieldChange('name', event.target.value)}
                      disabled={submitState.isSubmitting}
                      style={inputStyle(Boolean(errors.name))}
                      placeholder="输入会员姓名"
                    />
                  </FormField>
                </div>
                <div data-field="phone">
                  <FormField label="电话" required error={getFieldError('phone')}>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(event) => handleFieldChange('phone', event.target.value)}
                      disabled={submitState.isSubmitting}
                      style={inputStyle(Boolean(errors.phone))}
                      placeholder="输入电话号码"
                    />
                  </FormField>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <div data-field="email">
                  <FormField label="邮箱" error={getFieldError('email')} helper="选填">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(event) => handleFieldChange('email', event.target.value)}
                      disabled={submitState.isSubmitting}
                      style={inputStyle(Boolean(errors.email))}
                      placeholder="输入邮箱地址"
                    />
                  </FormField>
                </div>
                <div data-field="gender">
                  <FormField label="性别" error={getFieldError('gender')}>
                    <select
                      value={formData.gender}
                      onChange={(event) =>
                        handleFieldChange('gender', event.target.value as EditFormData['gender'])
                      }
                      disabled={submitState.isSubmitting}
                      style={{ ...inputStyle(false), minHeight: 40 }}
                    >
                      <option value="male">男</option>
                      <option value="female">女</option>
                      <option value="other">其他</option>
                    </select>
                  </FormField>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <div data-field="birthday">
                  <FormField label="生日" error={getFieldError('birthday')} helper="选填，格式 YYYY-MM-DD">
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(event) => handleFieldChange('birthday', event.target.value)}
                      disabled={submitState.isSubmitting}
                      style={inputStyle(Boolean(errors.birthday))}
                    />
                  </FormField>
                </div>
                <div data-field="wechatId">
                  <FormField label="微信ID" helper="选填">
                    <input
                      type="text"
                      value={formData.wechatId}
                      onChange={(event) => handleFieldChange('wechatId', event.target.value)}
                      disabled={submitState.isSubmitting}
                      style={inputStyle(false)}
                      placeholder="微信ID或昵称"
                    />
                  </FormField>
                </div>
              </div>

              <div data-field="address">
                <FormField label="地址" helper="选填">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(event) => handleFieldChange('address', event.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle(false)}
                    placeholder="输入地址"
                  />
                </FormField>
              </div>
            </div>
          </section>

          <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>标签与备注</h3>
            <div style={{ display: 'grid', gap: 20 }}>
              <div data-field="tags">
                <FormField label="标签" helper="多个标签用逗号分隔">
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(event) => handleFieldChange('tags', event.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle(false)}
                    placeholder="例如：高净值, 母婴, 数码"
                  />
                </FormField>
              </div>

              <div data-field="notes">
                <FormField label="内部备注" helper="管理后台可见">
                  <textarea
                    value={formData.notes}
                    onChange={(event) => handleFieldChange('notes', event.target.value)}
                    disabled={submitState.isSubmitting}
                    style={{ ...inputStyle(false), minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="输入会员备注信息"
                  />
                </FormField>
              </div>
            </div>
          </section>

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              padding: '16px 0',
              borderTop: '1px solid rgba(148, 163, 184, 0.15)',
            }}
          >
            <SubmitButton variant="secondary" onClick={() => router.push(`/members/${snapshot.memberId}`)} disabled={submitState.isSubmitting}>
              返回详情
            </SubmitButton>
            <SubmitButton variant="secondary" onClick={handleRefresh} disabled={submitState.isSubmitting} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </SubmitButton>
            <SubmitButton variant="primary" loading={submitState.isSubmitting} type="submit">
              {submitState.isSubmitting ? '保存中...' : '保存修改'}
            </SubmitButton>
          </div>
        </form>
      </PageShell>
    </div>
  );
}

const sectionStyle: CSSProperties = {
  borderRadius: 16,
  padding: 24,
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const sectionTitleStyle: CSSProperties = {
  margin: '0 0 20px',
  fontSize: 16,
  fontWeight: 700,
  color: '#e2e8f0',
};

function inputStyle(hasError: boolean): CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`,
    background: 'rgba(15, 23, 42, 0.4)',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
}
