'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormField, useFormSubmit, FormSubmitFeedback, SubmitButton } from '@m5/ui';
import { memberAuthService } from '../../lib/member-auth-service';

export default function MemberRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    mobile: '',
    code: '',
    nickname: '',
    agreeTerms: false,
  });
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { state, submit } = useFormSubmit<any>({
    onSubmit: async () => {
      // TODO: 调用后端注册API
      // 当前Mock成功注册
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/member-login?registered=true');
      return { success: true };
    },
    successMessage: () => '注册成功，即将跳转到登录页...',
    defaultErrorMessage: '注册失败，请稍后重试',
  });

  async function handleSendCode() {
    if (!formData.mobile || !/^1[3-9]\d{9}$/.test(formData.mobile)) {
      setFieldErrors({ mobile: '请输入有效的手机号' });
      return;
    }

    const result = await memberAuthService.sendSmsCode(formData.mobile);
    if (result.success) {
      setCodeSent(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
  }

  function handleChange(field: keyof typeof formData) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (field === 'agreeTerms') {
        setFormData((prev) => ({ ...prev, [field]: (e.target as HTMLInputElement).checked }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      }
      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.mobile || !/^1[3-9]\d{9}$/.test(formData.mobile)) {
      errors.mobile = '请输入有效的手机号';
    }

    if (!formData.code || formData.code.length !== 6) {
      errors.code = '请输入6位验证码';
    }

    if (!formData.nickname.trim()) {
      errors.nickname = '请输入昵称';
    }

    if (!formData.agreeTerms) {
      errors.agreeTerms = '请同意服务条款';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validateForm()) {
      submit();
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '24px 16px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        {/* 头部 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link
            href="/member-login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 24,
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            <span>←</span> 返回登录
          </Link>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 24, color: '#fff' }}>会</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', margin: '0 0 4px' }}>
            会员注册
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>加入神机营 SaaS 会员体系</p>
        </div>

        {/* 注册表单 */}
        <section
          style={{
            borderRadius: 20,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
            <FormField label="手机号" error={fieldErrors.mobile} required disabled={state.isSubmitting}>
              <input
                type="tel"
                value={formData.mobile}
                onChange={handleChange('mobile')}
                disabled={state.isSubmitting}
                placeholder="13800138000"
                style={inputStyle}
                autoComplete="tel"
              />
            </FormField>

            <FormField label="验证码" error={fieldErrors.code} required disabled={state.isSubmitting}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={formData.code}
                  onChange={handleChange('code')}
                  disabled={state.isSubmitting}
                  placeholder="6位验证码"
                  style={{ ...inputStyle, flex: 1 }}
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || state.isSubmitting}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: countdown > 0 ? 'rgba(148, 163, 184, 0.1)' : 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: countdown > 0 ? '#64748b' : '#fbbf24',
                    fontSize: 13,
                    cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </FormField>

            <FormField label="昵称" error={fieldErrors.nickname} required disabled={state.isSubmitting}>
              <input
                type="text"
                value={formData.nickname}
                onChange={handleChange('nickname')}
                disabled={state.isSubmitting}
                placeholder="设置您的昵称"
                style={inputStyle}
              />
            </FormField>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 13,
                color: fieldErrors.agreeTerms ? '#f87171' : '#94a3b8',
                cursor: state.isSubmitting ? 'not-allowed' : 'pointer',
                opacity: state.isSubmitting ? 0.7 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={handleChange('agreeTerms')}
                disabled={state.isSubmitting}
                style={{ marginTop: 3, accentColor: '#f59e0b' }}
              />
              <span>
                我已阅读并同意<a href="#" style={{ color: '#f59e0b', textDecoration: 'none' }}>《服务条款》</a>
                和<a href="#" style={{ color: '#f59e0b', textDecoration: 'none' }}>《隐私政策》</a>
              </span>
            </label>

            <SubmitButton
              loading={state.isSubmitting}
              label="立即注册"
              loadingLabel="注册中..."
              variant="primary"
            />
          </form>

          <div style={{ marginTop: 16 }}>
            <FormSubmitFeedback state={state} onRetry={() => submit()} />
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>已有账号？</span>
            <Link
              href="/member-login"
              style={{ marginLeft: 8, fontSize: 13, color: '#f59e0b', textDecoration: 'none', fontWeight: 500 }}
            >
              立即登录
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 8,
  padding: '12px 14px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  color: '#f8fafc',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
