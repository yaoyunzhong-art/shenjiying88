'use client';

/**
 * 管理后台登录 — Login Page
 * 功能: 统一认证入口，支持用户名密码登录、忘记密码、登录历史查看
 * 角色: 👤 所有管理员
 *
 * 页面结构:
 * - 作用域信息展示
 * - 登录表单 (用户名 + 密码 + 记住我)
 * - 提交反馈/错误提示
 * - 登录历史表格
 * - 忘记密码链接
 */

import React, { useState, useMemo } from 'react';
import {
  DataTable,
  FormField,
  FormSubmitFeedback,
  PageShell,
  StatusBadge,
  SubmitButton,
  type DataTableColumn,
} from '@m5/ui';
import { adminWebBootstrap } from '../bootstrap';

// ==================== 类型定义 ====================

interface LoginResult {
  token: string;
  role: string;
}

interface LoginHistoryEntry {
  id: string;
  username: string;
  ip: string;
  timestamp: string;
  success: boolean;
  failReason: string;
  userAgent: string;
}

// ==================== Mock 登录 API ====================

async function mockLoginApi(username: string, password: string): Promise<LoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (!username.trim()) {
    throw new Error('请输入管理员账号');
  }

  if (password.length < 6) {
    throw new Error('至少 6 位字符');
  }

  if (username !== 'admin' || password !== 'admin123') {
    throw new Error('用户名或密码错误，请检查后重试');
  }

  return { token: 'mock-jwt-token', role: 'super_admin' };
}

// ==================== Mock 登录历史 ====================

const MOCK_LOGIN_HISTORY: LoginHistoryEntry[] = [
  { id: 'lh-1', username: 'admin', ip: '192.168.1.100', timestamp: '2026-07-16 04:30:00', success: true, failReason: '', userAgent: 'Chrome 128 / macOS' },
  { id: 'lh-2', username: 'admin', ip: '192.168.1.101', timestamp: '2026-07-15 18:22:00', success: true, failReason: '', userAgent: 'Chrome 128 / macOS' },
  { id: 'lh-3', username: 'operator', ip: '192.168.1.50', timestamp: '2026-07-15 14:10:00', success: false, failReason: '密码错误', userAgent: 'Safari / macOS' },
  { id: 'lh-4', username: 'admin', ip: '192.168.1.100', timestamp: '2026-07-15 09:05:00', success: true, failReason: '', userAgent: 'Chrome 128 / macOS' },
  { id: 'lh-5', username: 'admin', ip: '10.0.0.55', timestamp: '2026-07-14 22:45:00', success: false, failReason: 'IP不在白名单', userAgent: 'Firefox / Windows' },
];

// ==================== 样式常量 ====================

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '10px 12px',
  background: 'rgba(15, 23, 42, 0.48)',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  color: '#f8fafc',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

// ==================== 主页面 ====================

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginHistory] = useState<LoginHistoryEntry[]>(MOCK_LOGIN_HISTORY);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    setIsSubmitting(true);
    setLoginError(null);
    setLoginSuccess(false);

    try {
      const result = await mockLoginApi(username, password);
      setLoginSuccess(true);
      setLoginError(null);
    } catch (err) {
      setLoginSuccess(false);
      setLoginError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 历史记录列
  const historyColumns: DataTableColumn<LoginHistoryEntry>[] = useMemo(
    () => [
      { key: 'timestamp', title: '时间', dataKey: 'timestamp', sortable: true, width: 160 },
      { key: 'username', title: '账号', dataKey: 'username', sortable: true, width: 100 },
      { key: 'ip', title: 'IP 地址', dataKey: 'ip', width: 140 },
      {
        key: 'success',
        title: '结果',
        width: 80,
        render: (item) => (
          <StatusBadge
            label={item.success ? '成功' : '失败'}
            variant={item.success ? 'success' : 'danger'}
            size="sm"
            dot
          />
        ),
      },
      {
        key: 'failReason',
        title: '失败原因',
        dataKey: 'failReason',
        render: (item) => item.failReason || '—',
      },
      { key: 'userAgent', title: '客户端', dataKey: 'userAgent', width: 160 },
    ],
    [],
  );

  // 清除单个字段错误
  const clearFieldError = (field: 'username' | 'password') => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // 安全统计
  const stats = useMemo(() => ({
    total: loginHistory.length,
    success: loginHistory.filter((h) => h.success).length,
    fail: loginHistory.filter((h) => !h.success).length,
    recentFail: loginHistory.filter((h) => !h.success && h.timestamp.startsWith('2026-07-16')).length,
  }), [loginHistory]);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 460 }}>
        <PageShell title="管理后台登录" subtitle="统一认证入口，登录后按 foundation bootstrap 校验租户/品牌/门店作用域。">
          {/* 作用域状态 */}
          <div
            style={{
              display: 'grid',
              gap: 8,
              marginBottom: 20,
              padding: 14,
              borderRadius: 12,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd', marginBottom: 6 }}>
              🛡️ 安全状态
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>作用域：</span>
              <StatusBadge label={adminWebBootstrap.tenantScope.resolver} variant="info" size="sm" />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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

          {/* 登录反馈 */}
          {loginSuccess && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              ✅ 登录成功！正在跳转至工作台...
            </div>
          )}

          {loginError && (
            <FormSubmitFeedback error={loginError} onDismissError={() => setLoginError(null)} />
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <FormField
              label="用户名"
              error={fieldErrors.username}
              required
              disabled={isSubmitting}
              helper="请输入管理员账号"
            >
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); clearFieldError('username'); }}
                disabled={isSubmitting}
                placeholder="admin"
                style={inputStyle}
                autoComplete="username"
              />
            </FormField>

            <FormField
              label="密码"
              error={fieldErrors.password}
              required
              disabled={isSubmitting}
              helper="至少 6 位字符"
            >
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                disabled={isSubmitting}
                placeholder="••••••"
                style={inputStyle}
                autoComplete="current-password"
              />
            </FormField>

            {/* 记住我 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#3b82f6' }}
              />
              <label htmlFor="remember-me" style={{ fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
                记住我（7天内免登录）
              </label>
            </div>

            {/* 提交按钮 */}
            <SubmitButton
              loading={isSubmitting}
              label="登录"
              loadingLabel="登录中..."
              variant="primary"
            />
          </form>

          {/* 忘记密码链接 */}
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                // TODO: 跳转忘记密码页面
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#93c5fd',
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              忘记密码？联系管理员重置
            </button>
          </div>

          {/* 登录历史 */}
          <div style={{ marginTop: 24 }}>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              style={{
                background: 'none',
                border: 'none',
                color: '#93c5fd',
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 0',
                fontWeight: 600,
              }}
            >
              {showHistory ? '▼' : '▶'} 最近登录历史
              <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 4 }}>
                ({stats.total} 次 · 失败 {stats.fail} 次)
              </span>
            </button>

            {showHistory && (
              <div style={{ marginTop: 8 }}>
                {/* 安全统计小卡片 */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.08)', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>成功登录</span>
                    <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 16 }}>{stats.success}</div>
                  </div>
                  <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.08)', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>失败尝试</span>
                    <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 16 }}>{stats.fail}</div>
                  </div>
                  <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(234, 179, 8, 0.08)', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>今日异常</span>
                    <div style={{ color: '#eab308', fontWeight: 700, fontSize: 16 }}>{stats.recentFail}</div>
                  </div>
                </div>

                <DataTable
                  columns={historyColumns}
                  items={loginHistory}
                  rowKey={(h) => h.id}
                  compact
                  striped
                />
              </div>
            )}
          </div>
        </PageShell>
      </section>
    </main>
  );
}
