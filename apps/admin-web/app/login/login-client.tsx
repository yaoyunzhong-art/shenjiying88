"use client"

import React, { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  DataTable,
  FormField,
  FormSubmitFeedback,
  PageShell,
  StatusBadge,
  SubmitButton,
  type DataTableColumn,
} from '@m5/ui'

import { clearAdminSession, storeAdminSession } from '../lib/admin-session'
import {
  computeSecurityScore,
  filterHistory,
  mockLoginApi,
  validatePasswordPolicy,
  type LoginHistoryEntry,
  type LoginPageSnapshot,
  type LoginResult,
} from './login-data'

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
}

const cardDark: React.CSSProperties = {
  borderRadius: 12,
  padding: 14,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
}

export default function LoginClient({ snapshot }: { snapshot: LoginPageSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSecurity, setShowSecurity] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null)
  const [historyQuery, setHistoryQuery] = useState('')
  const [historyOnlyFail, setHistoryOnlyFail] = useState(false)

  const stats = useMemo(() => computeSecurityScore(snapshot.history), [snapshot.history])
  const passwordPolicyResult = useMemo(() => validatePasswordPolicy(password), [password])
  const filteredHistory = useMemo(
    () => filterHistory(snapshot.history, historyQuery, historyOnlyFail),
    [historyOnlyFail, historyQuery, snapshot.history]
  )

  const historyColumns: DataTableColumn<LoginHistoryEntry>[] = useMemo(
    () => [
      { key: 'timestamp', title: '时间', render: (item) => <span>{item.timestamp}</span>, sortable: true, width: '160px' },
      { key: 'username', title: '账号', render: (item) => <span>{item.username}</span>, sortable: true, width: '100px' },
      { key: 'ip', title: 'IP 地址', render: (item) => <span>{item.ip}</span>, width: '140px' },
      {
        key: 'success',
        title: '结果',
        width: '80px',
        render: (item) => <StatusBadge label={item.success ? '成功' : '失败'} variant={item.success ? 'success' : 'danger'} size="sm" dot />,
      },
      { key: 'failReason', title: '失败原因', render: (item) => <span>{item.failReason || '—'}</span> },
      { key: 'userAgent', title: '客户端', render: (item) => <span>{item.userAgent}</span>, width: '160px' },
    ],
    []
  )

  const clearFieldError = (field: 'username' | 'password') => {
    if (fieldErrors[field]) {
      setFieldErrors((previous) => ({ ...previous, [field]: undefined }))
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const errors: { username?: string; password?: string } = {}
    if (!username.trim()) {
      errors.username = '请输入管理员账号'
    }
    if (password.length < 6) {
      errors.password = '至少 6 位字符'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)
    setLoginError(null)
    setLoginSuccess(false)
    setLoginResult(null)
    clearAdminSession()

    try {
      const result = await mockLoginApi(username, password)
      storeAdminSession({
        accessToken: result.token,
        refreshToken: rememberMe ? 'mock-refresh-token' : '',
        user: {
          userId: `admin:${username.trim()}`,
          username: username.trim(),
          role: result.role,
          permissions: result.permissions,
        },
      })
      setLoginResult(result)
      setLoginSuccess(true)
    } catch (error) {
      setLoginSuccess(false)
      setLoginError(error instanceof Error ? error.message : '登录失败，请稍后重试')
      clearAdminSession()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 560 }}>
        <PageShell title="管理后台登录" subtitle={`统一认证入口，当前快照：${snapshot.sourceLabel}。`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div style={{ ...cardDark, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd', marginBottom: 6 }}>安全状态</div>
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>作用域：{snapshot.bootstrap.tenantScopeResolver}</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>挑战策略：{snapshot.bootstrap.riskChallengeEnforcement}</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>重拉时机：{snapshot.bootstrap.revalidateOn.join(' / ')}</div>
              </div>
            </div>
            <button type="button" onClick={() => startRefresh(() => router.refresh())} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(96, 165, 250, 0.35)', background: 'rgba(59, 130, 246, 0.14)', color: '#dbeafe', cursor: 'pointer' }}>
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </button>
          </div>

          {loginSuccess ? (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#22c55e', fontSize: 13, marginBottom: 16 }}>
              <div>登录成功，已写入本地管理员 session。</div>
              {loginResult ? <div style={{ marginTop: 8 }}>角色: {loginResult.role} · 权限数: {loginResult.permissions.length}</div> : null}
            </div>
          ) : null}

          {loginError ? <FormSubmitFeedback error={loginError} onDismissError={() => setLoginError(null)} /> : null}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <FormField label="用户名" error={fieldErrors.username} required disabled={isSubmitting} helper="请输入管理员账号">
              <input
                type="text"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  clearFieldError('username')
                }}
                disabled={isSubmitting}
                placeholder="admin"
                style={inputStyle}
                autoComplete="username"
              />
            </FormField>

            <FormField label="密码" error={fieldErrors.password} required disabled={isSubmitting} helper="至少 6 位字符">
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  clearFieldError('password')
                }}
                disabled={isSubmitting}
                placeholder="••••••"
                style={inputStyle}
                autoComplete="current-password"
              />
            </FormField>

            {password.length > 0 && !passwordPolicyResult.valid ? (
              <div style={{ fontSize: 12, color: '#fbbf24', padding: '4px 8px', background: 'rgba(251, 191, 36, 0.08)', borderRadius: 4 }}>
                {passwordPolicyResult.errors.map((error) => (
                  <div key={error}>· {error}</div>
                ))}
              </div>
            ) : null}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="remember-me" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} style={{ accentColor: '#3b82f6' }} />
              <label htmlFor="remember-me" style={{ fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
                记住我（7天内免登录）
              </label>
            </div>

            <SubmitButton loading={isSubmitting} label="登录" loadingLabel="登录中..." variant="primary" />
          </form>

          <div style={{ marginTop: 14, textAlign: 'center', color: '#93c5fd', fontSize: 13 }}>忘记密码？联系管理员重置</div>

          <div style={{ marginTop: 16 }}>
            <button type="button" onClick={() => setShowSecurity((current) => !current)} style={{ background: 'none', border: 'none', color: '#93c5fd', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', fontWeight: 600 }}>
              {showSecurity ? '▼' : '▶'} 安全策略面板
            </button>
            {showSecurity ? (
              <div style={{ marginTop: 8, ...cardDark }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.08)', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>成功率</span>
                    <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 16 }}>{stats.successRate}%</div>
                  </div>
                  <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.08)', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>失败次数</span>
                    <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 16 }}>{stats.fail}</div>
                  </div>
                  <div style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(99, 102, 241, 0.08)', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>独立 IP</span>
                    <div style={{ color: '#818cf8', fontWeight: 700, fontSize: 16 }}>{stats.uniqueIPs}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                  密码策略：最少 {snapshot.passwordPolicy.minLength} 个字符，要求大写/小写/数字，{snapshot.passwordPolicy.maxAgeDays} 天过期。
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  推荐 IP 白名单：{snapshot.recommendedIps.map((item) => `${item.ip}(${item.label})`).join('；')}
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: 16 }}>
            <button type="button" onClick={() => setShowHistory((current) => !current)} style={{ background: 'none', border: 'none', color: '#93c5fd', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', fontWeight: 600 }}>
              {showHistory ? '▼' : '▶'} 最近登录历史
            </button>
            {showHistory ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input type="text" value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="搜索用户名、IP、原因..." style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 12 }} />
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={historyOnlyFail} onChange={(event) => setHistoryOnlyFail(event.target.checked)} style={{ accentColor: '#3b82f6' }} />
                    仅失败
                  </label>
                </div>
                {filteredHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: 13 }}>没有匹配的登录历史</div>
                ) : (
                  <DataTable columns={historyColumns} items={filteredHistory} rowKey={(entry) => entry.id} compact striped />
                )}
              </div>
            ) : null}
          </div>
        </PageShell>
      </section>
    </main>
  )
}
