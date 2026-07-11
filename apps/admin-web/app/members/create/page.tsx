// @ts-nocheck
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  SubmitButton,
  WorkspaceBreadcrumb,
} from '@m5/ui';

import { MEMBER_TIER_MAP, MEMBER_STATUSES, MEMBER_STATUS_MAP, type MemberTier, type MemberStatus } from '../../members-data';

// ---- 创建表单数据类型 ----

interface CreateFormData {
  name: string;
  phone: string;
  email: string;
  tier: MemberTier;
  gender: 'male' | 'female' | 'other';
  birthday: string;
  wechatId: string;
  address: string;
  storeName: string;
  marketCode: string;
  notes: string;
  tags: string;
}

interface CreateFormErrors {
  name?: string;
  phone?: string;
  email?: string;
  tier?: string;
  gender?: string;
  birthday?: string;
  wechatId?: string;
  address?: string;
  storeName?: string;
  marketCode?: string;
  notes?: string;
  tags?: string;
}

interface ActionFeedback {
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
}

const DEFAULT_FORM_DATA: CreateFormData = {
  name: '',
  phone: '',
  email: '',
  tier: 'standard',
  gender: 'male',
  birthday: '',
  wechatId: '',
  address: '',
  storeName: '',
  marketCode: 'cn-mainland',
  notes: '',
  tags: '',
};

const MARKET_OPTIONS = [
  { value: 'cn-mainland', label: '中国大陆' },
  { value: 'us-default', label: '美国' },
  { value: 'uk-default', label: '英国' },
  { value: 'jp-default', label: '日本' },
  { value: 'kr-default', label: '韩国' },
  { value: 'de-default', label: '德国' },
];

const MEMBER_TIER_KEYS: { key: MemberTier; label: string }[] = [
  { key: 'diamond', label: '钻石卡' },
  { key: 'gold', label: '金卡' },
  { key: 'silver', label: '银卡' },
  { key: 'bronze', label: '铜卡' },
  { key: 'standard', label: '标准' },
];

// ---- 验证逻辑 ----

function validateForm(data: CreateFormData): CreateFormErrors {
  const errors: CreateFormErrors = {};

  if (!data.name.trim()) {
    errors.name = '姓名不能为空';
  } else if (data.name.trim().length > 50) {
    errors.name = '姓名不能超过50个字符';
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

  if (data.birthday) {
    const parsed = new Date(data.birthday);
    if (isNaN(parsed.getTime())) {
      errors.birthday = '生日日期格式不正确';
    } else if (parsed > new Date()) {
      errors.birthday = '生日不能是未来日期';
    }
  }

  return errors;
}

// ---- 模拟提交 ----

async function submitCreateMember(data: CreateFormData): Promise<{ memberId: string; code: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 模拟重复检测
  if (data.phone === '13800000000') {
    throw new Error('该手机号已被注册为会员');
  }

  return {
    memberId: `m${String(Date.now()).slice(-5)}`,
    code: `MEM-${String(Date.now()).slice(-5)}`,
  };
}

// ---- 创建页面组件 ----

export default function CreateMemberPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<CreateFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<CreateFormErrors>({});
  const [submitState, setSubmitState] = useState<ActionFeedback>({ isSubmitting: false });
  const [createdMember, setCreatedMember] = useState<{ id: string; code: string } | null>(null);

  const getFieldError = (field: keyof CreateFormErrors): string | undefined => errors[field];

  const handleFieldChange = useCallback(
    (field: keyof CreateFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof CreateFormErrors]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field as keyof CreateFormErrors];
          return next;
        });
      }
    },
    [errors]
  );

  const handleGenderChange = useCallback(
    (value: string) => {
      handleFieldChange('gender', value);
    },
    [handleFieldChange]
  );

  const handleTierChange = useCallback(
    (value: string) => {
      handleFieldChange('tier', value);
    },
    [handleFieldChange]
  );

  const handleMarketChange = useCallback(
    (value: string) => {
      handleFieldChange('marketCode', value);
    },
    [handleFieldChange]
  );

  // 提交
  const handleSubmit = useCallback(async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorField = Object.keys(validationErrors)[0] as keyof CreateFormData;
      const el = document.querySelector(`[data-field="${firstErrorField}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});
    setSubmitState({ isSubmitting: true, errorMessage: undefined, successMessage: undefined });

    try {
      const result = await submitCreateMember(formData);
      setCreatedMember({ id: result.memberId, code: result.code });
      setSubmitState({
        isSubmitting: false,
        successMessage: `会员创建成功！会员编号：${result.code}`,
      });
    } catch (error) {
      setSubmitState({
        isSubmitting: false,
        errorMessage: error instanceof Error ? error.message : '创建失败，请稍后重试。',
      });
    }
  }, [formData]);

  const handleReset = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setErrors({});
    setSubmitState({ isSubmitting: false, errorMessage: undefined, successMessage: undefined });
    setCreatedMember(null);
  }, []);

  const handleViewMember = useCallback(() => {
    if (createdMember) {
      router.push(`/members/${createdMember.id}`);
    }
  }, [createdMember, router]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        workspaceLabel="会员管理"
        workspaceHref="/members"
        detailLabel="新增会员"
      />

      <PageShell
        title="新增会员"
        subtitle="创建新的会员档案，带 * 的字段为必填项"
      >
        {/* 提交反馈 */}
        {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
          <div style={{ marginBottom: 24 }}>
            <FormSubmitFeedback state={submitState} />
          </div>
        ) : null}

        {/* 创建成功后的操作 */}
        {createdMember && (
          <div
            style={{
              marginBottom: 24,
              borderRadius: 12,
              padding: 16,
              border: '1px solid rgba(74, 222, 128, 0.3)',
              background: 'rgba(22, 163, 74, 0.12)',
              color: '#bbf7d0',
              fontSize: 13,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>会员 {createdMember.code} 已创建成功！</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <SubmitButton variant="primary" onClick={handleViewMember}>
                查看会员详情
              </SubmitButton>
              <SubmitButton variant="secondary" onClick={handleReset}>
                继续新增
              </SubmitButton>
            </div>
          </div>
        )}

        {/* 表单主体 */}
        {!createdMember && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* 基本信息 */}
            <section
              style={{
                borderRadius: 16,
                padding: 24,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
              }}
            >
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
                基本信息
              </h3>

              <div style={{ display: 'grid', gap: 20 }}>
                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                  <div data-field="name">
                    <FormField label="姓名" required error={getFieldError('name')}>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        disabled={submitState.isSubmitting}
                        style={inputStyle(!!errors.name)}
                        placeholder="输入会员姓名"
                      />
                    </FormField>
                  </div>
                  <div data-field="phone">
                    <FormField label="电话" required error={getFieldError('phone')}>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        disabled={submitState.isSubmitting}
                        style={inputStyle(!!errors.phone)}
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
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        disabled={submitState.isSubmitting}
                        style={inputStyle(!!errors.email)}
                        placeholder="输入邮箱地址"
                      />
                    </FormField>
                  </div>
                  <div data-field="gender">
                    <FormField label="性别">
                      <select
                        value={formData.gender}
                        onChange={(e) => handleGenderChange(e.target.value)}
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
                    <FormField label="生日" helper="选填">
                      <input
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => handleFieldChange('birthday', e.target.value)}
                        disabled={submitState.isSubmitting}
                        style={inputStyle(!!errors.birthday)}
                      />
                    </FormField>
                  </div>
                  <div data-field="wechatId">
                    <FormField label="微信ID" helper="选填">
                      <input
                        type="text"
                        value={formData.wechatId}
                        onChange={(e) => handleFieldChange('wechatId', e.target.value)}
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
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      disabled={submitState.isSubmitting}
                      style={inputStyle(false)}
                      placeholder="输入地址"
                    />
                  </FormField>
                </div>
              </div>
            </section>

            {/* 所属信息 */}
            <section
              style={{
                borderRadius: 16,
                padding: 24,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
              }}
            >
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
                所属信息
              </h3>

              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <div data-field="storeName">
                  <FormField label="所属门店" required error={getFieldError('storeName')}>
                    <input
                      type="text"
                      value={formData.storeName}
                      onChange={(e) => handleFieldChange('storeName', e.target.value)}
                      disabled={submitState.isSubmitting}
                      style={inputStyle(!!errors.storeName)}
                      placeholder="输入门店名称"
                    />
                  </FormField>
                </div>
                <div data-field="marketCode">
                  <FormField label="所属市场" required error={getFieldError('marketCode')}>
                    <select
                      value={formData.marketCode}
                      onChange={(e) => handleMarketChange(e.target.value)}
                      disabled={submitState.isSubmitting}
                      style={{ ...inputStyle(!!errors.marketCode), minHeight: 40 }}
                    >
                      {MARKET_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <FormField label="初始等级" helper="新建会员默认为标准">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {MEMBER_TIER_KEYS.map((t) => {
                      const selected = formData.tier === t.key;
                      const tierInfo = MEMBER_TIER_MAP[t.key];
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => handleTierChange(t.key)}
                          disabled={submitState.isSubmitting}
                          style={{
                            padding: '8px 16px',
                            fontSize: 13,
                            fontWeight: 500,
                            borderRadius: 8,
                            border: `2px solid ${selected ? '#fbbf24' : 'rgba(148,163,184,0.2)'}`,
                            background: selected ? 'rgba(251,191,36,0.15)' : 'transparent',
                            color: selected ? '#fbbf24' : '#94a3b8',
                            cursor: submitState.isSubmitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {selected ? '✓ ' : ''}{tierInfo.label}
                        </button>
                      );
                    })}
                  </div>
                </FormField>
              </div>
            </section>

            {/* 标签与备注 */}
            <section
              style={{
                borderRadius: 16,
                padding: 24,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
                标签与备注
              </h3>

              <div data-field="tags">
                <FormField label="标签" helper="多个标签用逗号分隔">
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleFieldChange('tags', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle(false)}
                    placeholder="例如：高净值, 母婴, 数码"
                  />
                </FormField>
              </div>

              <div style={{ marginTop: 20 }} data-field="notes">
                <FormField label="内部备注" helper="管理后台可见，选填">
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={{ ...inputStyle(false), minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="输入会员备注信息"
                  />
                </FormField>
              </div>
            </section>

            {/* 提交按钮 */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
                padding: '16px 0',
                borderTop: '1px solid rgba(148, 163, 184, 0.15)',
              }}
            >
              <SubmitButton
                variant="secondary"
                onClick={() => router.push('/members')}
                disabled={submitState.isSubmitting}
              >
                取消
              </SubmitButton>
              <SubmitButton
                variant="primary"
                loading={submitState.isSubmitting}
                type="submit"
              >
                {submitState.isSubmitting ? '创建中...' : '创建会员'}
              </SubmitButton>
            </div>
          </form>
        )}
      </PageShell>
    </div>
  );
}

// ---- 输入框样式 ----

function inputStyle(hasError: boolean): React.CSSProperties {
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
