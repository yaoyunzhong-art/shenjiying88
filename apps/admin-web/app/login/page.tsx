'use client';

import React from 'react';
import { PageShell, FormField, useFormSubmit, FormSubmitFeedback, StatusBadge, SubmitButton } from '@m5/ui';
import { adminWebBootstrap } from '../bootstrap';

interface LoginResult {
  token: string;
  role: string;
}

/**
 * 模拟登录 API — 后续替换为真实统一认证接口。
 */
async function mockLoginApi(username: string, password: string): Promise<LoginResult> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!username.trim()) {
    throw new Error('请输入管理员账号');
  }

  if (password.length < 6) {
    throw new Error('至少 6 位字符');
  }

  // 模拟认证失败场景
  if (username !== 'admin' || password !== 'admin123') {
    throw new Error('用户名或密码错误，请检查后重试');
  }

  return { token: 'mock-jwt-token', role: 'super_admin' };
}

export default function LoginPage() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState<{ username?: string; password?: string }>({});

  const { state, submit } = useFormSubmit<LoginResult>({
    onSubmit: () => mockLoginApi(username, password),
    successMessage: (result) => `登录成功，角色：${result.role}`,
    defaultErrorMessage: '登录失败，请稍后重试'
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 客户端字段校验
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errors.username = '请输入管理员账号';
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

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value);
    if (fieldErrors.username) {
      setFieldErrors((prev) => ({ ...prev, username: undefined }));
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
      <section style={{ width: 420 }}>
        <PageShell title="管理后台登录" subtitle="统一认证入口，登录后按 foundation bootstrap 校验租户/品牌/门店作用域。">
          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>作用域解析：</span>
              <StatusBadge label={adminWebBootstrap.tenantScope.resolver} variant="info" size="sm" />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>挑战策略：</span>
              <StatusBadge label={adminWebBootstrap.riskChallenge.enforcement} variant="warning" size="sm" />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>重拉时机：</span>
              {adminWebBootstrap.tenantScope.revalidateOn.map((event) => (
                <StatusBadge key={event} label={event} variant="default" size="sm" />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <FormField
              label="用户名"
              error={fieldErrors.username}
              required
              disabled={state.isSubmitting}
              helper="请输入管理员账号"
            >
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                disabled={state.isSubmitting}
                placeholder="admin"
                style={inputStyle}
                autoComplete="username"
              />
            </FormField>

            <FormField
              label="密码"
              error={fieldErrors.password}
              required
              disabled={state.isSubmitting}
              helper="至少 6 位字符"
            >
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                disabled={state.isSubmitting}
                placeholder="••••••"
                style={inputStyle}
                autoComplete="current-password"
              />
            </FormField>

            {/* 提交按钮 */}
            <SubmitButton
              loading={state.isSubmitting}
              label="登录"
              loadingLabel="登录中..."
              variant="primary"
            />
          </form>

          {/* 提交反馈 */}
          <div style={{ marginTop: 16 }}>
            <FormSubmitFeedback state={state} onRetry={() => submit()} />
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
