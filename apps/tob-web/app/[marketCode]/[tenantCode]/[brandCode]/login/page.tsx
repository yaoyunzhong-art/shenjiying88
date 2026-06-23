'use client';

import React from 'react';
import { PageShell, FormField, useFormSubmit, FormSubmitFeedback, StatusBadge, SubmitButton } from '@m5/ui';
import { tobWebBootstrap } from '../../../../bootstrap';

interface BrandLoginResult {
  token: string;
  tenantCode: string;
  brandCode: string;
  role: string;
}

/**
 * 模拟品牌登录 API — 后续替换为品牌域 SSO / 统一认证。
 */
async function mockBrandLoginApi(
  tenantCode: string,
  brandCode: string,
  email: string,
  password: string
): Promise<BrandLoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!email.trim() || !email.includes('@')) {
    throw new Error('请输入品牌管理员邮箱');
  }

  if (password.length < 6) {
    throw new Error('至少 6 位字符');
  }

  if (email !== 'brand@m5.dev' || password !== 'brand123') {
    throw new Error('邮箱或密码错误，请检查后重试');
  }

  return {
    token: `brand-jwt-${tenantCode}-${brandCode}`,
    tenantCode,
    brandCode,
    role: 'brand_manager'
  };
}

export default function BrandLoginPage({
  params
}: {
  params: Promise<{ marketCode: string; tenantCode: string; brandCode: string }>;
}) {
  const resolvedParams = React.use(params);
  const { marketCode, tenantCode, brandCode } = resolvedParams;

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string;
    password?: string;
  }>({});

  const { state, submit } = useFormSubmit<BrandLoginResult>({
    onSubmit: () => mockBrandLoginApi(tenantCode, brandCode, email, password),
    successMessage: (result) =>
      `品牌登录成功，角色：${result.role}`,
    defaultErrorMessage: '登录失败，请稍后重试'
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 客户端字段校验
    const errors: { email?: string; password?: string } = {};
    if (!email.trim() || !email.includes('@')) {
      errors.email = '请输入品牌管理员邮箱';
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
      <section
        style={{
          width: 460,
          borderRadius: 24,
          padding: 24,
          color: '#f8fafc',
          background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)'
        }}
      >
        <PageShell
          title="品牌后台登录"
          description={`${marketCode} / ${tenantCode} / ${brandCode} — 品牌域统一认证入口`}
        >
          {/* 上下文信息 */}
          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>市场：</span>
              <StatusBadge label={marketCode} variant="info" size="sm" />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>租户：</span>
              <StatusBadge label={tenantCode} variant="success" size="sm" />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>品牌：</span>
              <StatusBadge label={brandCode} variant="warning" size="sm" />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>作用域解析：</span>
              <StatusBadge
                label={tobWebBootstrap.tenantScope.resolver}
                variant="info"
                size="sm"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>挑战策略：</span>
              <StatusBadge
                label={tobWebBootstrap.riskChallenge.enforcement}
                variant="warning"
                size="sm"
              />
            </div>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <FormField
              label="邮箱"
              error={fieldErrors.email}
              required
              disabled={state.isSubmitting}
              helper="请输入品牌管理员邮箱"
            >
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                disabled={state.isSubmitting}
                placeholder="brand@m5.dev"
                style={inputStyle}
                autoComplete="email"
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

            {/* 记住我 */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#cbd5e1',
                cursor: state.isSubmitting ? 'not-allowed' : 'pointer',
                opacity: state.isSubmitting ? 0.7 : 1
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={state.isSubmitting}
                style={{ accentColor: '#a78bfa' }}
              />
              记住登录状态
            </label>

            {/* 提交按钮 */}
            <SubmitButton
              loading={state.isSubmitting}
              label="登录"
              loadingLabel="登录中..."
              variant="brand"
            />
          </form>

          {/* 提交反馈 */}
          <div style={{ marginTop: 16 }}>
            <FormSubmitFeedback state={state} onRetry={() => submit()} />
          </div>

          {/* 帮助链接 */}
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              color: '#94a3b8'
            }}
          >
            <span style={{ cursor: 'pointer', color: '#c4b5fd' }}>
              忘记密码？
            </span>
            <span style={{ cursor: 'pointer', color: '#c4b5fd' }}>
              联系品牌域管理员
            </span>
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
