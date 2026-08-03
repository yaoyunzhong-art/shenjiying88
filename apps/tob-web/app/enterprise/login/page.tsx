'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormField, useFormSubmit, FormSubmitFeedback, SubmitButton } from '@m5/ui';
import { enterpriseAuthService, type EnterpriseLoginResponse } from '../../../lib/enterprise-auth-service';
import { storeEnterpriseSession } from '../lib/enterprise-session';
import { useEnterpriseFormFields } from '../lib/use-enterprise-form-fields';
import { email as emailValidator, passwordMin } from '../lib/enterprise-validators';
import { EnterpriseAuthPage } from '../components/EnterpriseAuthPage';
import { enterpriseInputStyle } from '../components/enterprise-input-style';

type LoginFields = { email: string; password: string };

export default function EnterpriseLoginPage() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);
  const { values, fieldErrors, handleChange, validate, clearAllErrors } =
    useEnterpriseFormFields<LoginFields>({ email: '', password: '' });

  const { state, submit } = useFormSubmit<EnterpriseLoginResponse>({
    onSubmit: async () => {
      const result = await enterpriseAuthService.login({
        email: values.email,
        password: values.password,
        loginType: 'email_password',
      });

      if (result.success && result.data) {
        storeEnterpriseSession({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
          user: result.data.user,
        });

        // 跳转到企业控制台
        router.push('/enterprise/console');
      }

      if (!result.success) {
        throw new Error(result.error?.message ?? '登录失败');
      }

      return result;
    },
    successMessage: () => '登录成功，正在跳转...',
    defaultErrorMessage: '登录失败，请检查邮箱和密码',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ok = validate({
      email: emailValidator,
      password: passwordMin(6),
    });

    if (!ok) return;
    clearAllErrors();
    submit();
  }

  return (
    <EnterpriseAuthPage
      title="企业用户登录"
      subtitle="神机营 SaaS 平台企业管理入口"
    >
      {/* 登录表单 */}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
        <FormField
          label="邮箱"
          error={fieldErrors.email}
          required
          disabled={state.isSubmitting}
          helper="请输入企业邮箱地址"
        >
          <input
            type="email"
            value={values.email}
            onChange={handleChange('email')}
            disabled={state.isSubmitting}
            placeholder="admin@company.com"
            style={enterpriseInputStyle}
            autoComplete="email"
          />
        </FormField>

        <FormField
          label="密码"
          error={fieldErrors.password}
          required
          disabled={state.isSubmitting}
          helper="8-20位，包含大小写字母和数字"
        >
          <input
            type="password"
            value={values.password}
            onChange={handleChange('password')}
            disabled={state.isSubmitting}
            placeholder="••••••••"
            style={enterpriseInputStyle}
            autoComplete="current-password"
          />
        </FormField>

        {/* 记住我 & 忘记密码 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#cbd5e1', cursor: state.isSubmitting ? 'not-allowed' : 'pointer', opacity: state.isSubmitting ? 0.7 : 1 }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={state.isSubmitting}
              style={{ accentColor: '#667eea' }}
            />
            记住登录状态
          </label>
          <span style={{ fontSize: 13, color: '#667eea', cursor: 'pointer' }}>
            忘记密码？
          </span>
        </div>

        {/* 提交按钮 */}
        <SubmitButton
          loading={state.isSubmitting}
          label="登录"
          loadingLabel="登录中..."
          variant="primary"
          style={{ marginTop: 8 }}
        />
      </form>

      {/* 提交反馈 */}
      <div style={{ marginTop: 16 }}>
        <FormSubmitFeedback state={state} onRetry={() => submit()} />
      </div>

      {/* 分隔线 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(148, 163, 184, 0.12)' }} />
        <span style={{ fontSize: 13, color: '#64748b' }}>或</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(148, 163, 184, 0.12)' }} />
      </div>

      {/* 注册入口 */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 14, color: '#94a3b8' }}>还没有企业账号？</span>
        <Link href="/enterprise/register" style={{ marginLeft: 8, fontSize: 14, color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>
          立即注册
        </Link>
      </div>
    </EnterpriseAuthPage>
  );
}
