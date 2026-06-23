'use client';

import React from 'react';
import { PageShell, FormField, useFormSubmit, FormSubmitFeedback, StatusBadge, SubmitButton } from '@m5/ui';
import { tobWebBootstrap } from '../../../bootstrap';

interface TenantLoginResult {
  token: string;
  tenantCode: string;
  role: string;
}

/**
 * 模拟租户登录 API — 后续替换为 SSO / 统一认证。
 */
async function mockTenantLoginApi(tenantCode: string, email: string, password: string): Promise<TenantLoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!email.trim() || !email.includes('@')) {
    throw new Error('请输入企业邮箱');
  }

  if (password.length < 6) {
    throw new Error('至少 6 位字符');
  }

  if (email !== 'admin@m5.dev' || password !== 'admin123') {
    throw new Error('邮箱或密码错误，请检查后重试');
  }

  return { token: `tenant-jwt-${tenantCode}`, tenantCode, role: 'manager' };
}

export default function TenantLoginPage({
  params
}: {
  params: Promise<{ marketCode: string; tenantCode: string }>;
}) {
  const resolvedParams = React.use(params);
  const { marketCode, tenantCode } = resolvedParams;

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState<{ email?: string; password?: string }>({});

  const { submitting, error, success, submit, clearError, clearSuccess } = useFormSubmit({
    onSubmit: async () => {
      await mockTenantLoginApi(tenantCode, email, password);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors: { email?: string; password?: string } = {};
    if (!email.trim() || !email.includes('@')) {
      errors.email = '请输入企业邮箱';
    }
    if (password.length < 6) {
      errors.password = '至少 6 位字符';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    submit();
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 460 }}>
        <PageShell
          title="租户后台登录"
          description="统一认证入口，支持 SSO、市场化登录策略和地区性邮箱通知。"
        >
          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>市场：</span>
              <StatusBadge label={marketCode} variant="info" size="sm" />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>租户：</span>
              <StatusBadge label={tenantCode} variant="success" size="sm" />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>作用域解析：</span>
              <StatusBadge label={tobWebBootstrap.tenantScope.resolver} variant="info" size="sm" />
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <FormField
              label="邮箱"
              error={fieldErrors.email}
              required
              disabled={submitting}
              helper="请输入企业邮箱"
            >
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                disabled={submitting}
                placeholder="admin@m5.dev"
                style={inputStyle}
                autoComplete="email"
              />
            </FormField>

            <FormField
              label="密码"
              error={fieldErrors.password}
              required
              disabled={submitting}
              helper="至少 6 位字符"
            >
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                disabled={submitting}
                placeholder="••••••"
                style={inputStyle}
                autoComplete="current-password"
              />
            </FormField>

            <SubmitButton
              loading={submitting}
              label="登录"
              loadingLabel="登录中..."
              variant="primary"
            />
          </form>

          <div style={{ marginTop: 16 }}>
            <FormSubmitFeedback
              submitting={submitting}
              error={error}
              success={success}
              onDismissError={clearError}
              onDismissSuccess={clearSuccess}
            />
          </div>
        </PageShell>
      </section>

    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '10px 12px',
  background: 'rgba(15, 23, 42, 0.48)',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  color: '#f8fafc',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box'
};
