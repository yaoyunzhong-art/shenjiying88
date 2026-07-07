'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormField, useFormSubmit, FormSubmitFeedback, SubmitButton } from '@m5/ui';
import { memberAuthService, type MemberLoginResponse } from '../../lib/member-auth-service';

export default function MemberLoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<{
    mobile?: string;
    code?: string;
  }>({});

  const { state, submit } = useFormSubmit<MemberLoginResponse>({
    onSubmit: async () => {
      const result = await memberAuthService.login({ mobile, code });

      if (result.success && result.data) {
        // 保存登录状态
        localStorage.setItem('member_access_token', result.data.accessToken);
        localStorage.setItem('member_refresh_token', result.data.refreshToken);
        localStorage.setItem('member_info', JSON.stringify(result.data.member));

        // 跳转到会员中心
        router.push('/member-center');
      }

      if (!result.success) {
        throw new Error(result.error?.message ?? '登录失败');
      }

      return result;
    },
    successMessage: () => '登录成功',
    defaultErrorMessage: '登录失败，请检查验证码',
  });

  async function handleSendCode() {
    if (!mobile || !/^1[3-9]\d{9}$/.test(mobile)) {
      setFieldErrors({ mobile: '请输入有效的手机号' });
      return;
    }

    const result = await memberAuthService.sendSmsCode(mobile);
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors: { mobile?: string; code?: string } = {};
    if (!mobile || !/^1[3-9]\d{9}$/.test(mobile)) {
      errors.mobile = '请输入有效的手机号';
    }
    if (!code || code.length !== 6) {
      errors.code = '请输入6位验证码';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    submit();
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 380,
          borderRadius: 20,
          padding: 32,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
            会员登录
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            神机营 SaaS 会员服务
          </p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
          <FormField
            label="手机号"
            error={fieldErrors.mobile}
            required
            disabled={state.isSubmitting}
          >
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              disabled={state.isSubmitting}
              placeholder="13800138000"
              style={inputStyle}
              autoComplete="tel"
            />
          </FormField>

          <FormField
            label="验证码"
            error={fieldErrors.code}
            required
            disabled={state.isSubmitting}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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

          <SubmitButton
            loading={state.isSubmitting}
            label="登录"
            loadingLabel="登录中..."
            variant="primary"
          />
        </form>

        <div style={{ marginTop: 16 }}>
          <FormSubmitFeedback state={state} onRetry={() => submit()} />
        </div>

        {/* 微信登录提示 */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(148, 163, 184, 0.12)' }} />
            <span style={{ fontSize: 12, color: '#64748b' }}>其他登录方式</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(148, 163, 184, 0.12)' }} />
          </div>
          <button
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ade80',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>微信</span>
            微信一键登录
          </button>
        </div>

        {/* 注册链接 */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>还没有会员账号？</span>
          <Link
            href="/member-register"
            style={{ marginLeft: 8, fontSize: 13, color: '#f59e0b', textDecoration: 'none', fontWeight: 500 }}
          >
            立即注册
          </Link>
        </div>
      </section>

      <footer style={{ position: 'fixed', bottom: 16, textAlign: 'center', fontSize: 12, color: '#64748b' }}>
        © 2024 神机营 SaaS · 会员服务
      </footer>
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
