'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormField, useFormSubmit, FormSubmitFeedback, SubmitButton } from '@m5/ui';
import { memberAuthService, type MemberLoginResponse } from '../../lib/member-auth-service';
import { getDefaultApiBaseUrl } from '@m5/sdk';
import { buildStorefrontScopeHeaders, resolveStorefrontScope } from '../../lib/storefront-transactions';

// ============================================================
// 类型定义
// ============================================================

interface LoginAttemptRecord {
  id: string;
  mobile: string;
  time: string;
  ip: string;
  success: boolean;
  device: string;
}

interface SecurityEvent {
  id: string;
  type: 'failed_attempt' | 'new_device' | 'location_change' | 'password_change';
  time: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
}

interface LoginSuggestion {
  id: string;
  text: string;
  icon: string;
  priority: number;
}

// ============================================================
// 静态建议数据（非 mock，是 UI 固定内容）
// ============================================================

const LOGIN_SUGGESTIONS: LoginSuggestion[] = [
  { id: 'SG1', text: '建议开启微信登录快捷入口', icon: '💡', priority: 1 },
  { id: 'SG2', text: '开启登录提醒通知，保障账户安全', icon: '🔔', priority: 2 },
  { id: 'SG3', text: '建议绑定邮箱作为备用验证方式', icon: '📧', priority: 3 },
  { id: 'SG4', text: '定期检查登录设备列表', icon: '🔐', priority: 4 },
];

// ============================================================
// 工具函数
// ============================================================

function getSecuritySeverityColor(severity: SecurityEvent['severity']): string {
  switch (severity) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#60a5fa';
  }
}

function getSecuritySeverityLabel(severity: SecurityEvent['severity']): string {
  switch (severity) {
    case 'high': return '高风险';
    case 'medium': return '需关注';
    case 'low': return '一般';
  }
}

function getEventTypeLabel(type: SecurityEvent['type']): string {
  switch (type) {
    case 'failed_attempt': return '登录失败';
    case 'new_device': return '新设备';
    case 'location_change': return '异地登录';
    case 'password_change': return '密码变更';
  }
}

// ============================================================
// 子组件: 安全事件面板
// ============================================================

function SecurityEventsPanel({ events }: { events: SecurityEvent[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayEvents = expanded ? events : events.slice(0, 2);

  return (
    <div style={{
      marginTop: 20,
      borderRadius: 12,
      border: '1px solid rgba(239, 68, 68, 0.2)',
      background: 'rgba(239, 68, 68, 0.04)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid rgba(239, 68, 68, 0.1)',
      }}>
        <span>🛡️</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5' }}>安全事件</span>
        <span style={{
          fontSize: 11,
          color: '#64748b',
          background: 'rgba(148,163,184,0.1)',
          padding: '1px 8px',
          borderRadius: 10,
        }}>
          {events.length} 条
        </span>
      </div>
      {events.length === 0 ? (
        <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 12, color: '#64748b' }}>
          暂无安全事件记录
        </div>
      ) : (
        <>
          {displayEvents.map((evt) => (
            <div key={evt.id} style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(239, 68, 68, 0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ fontSize: 12, color: '#e2e8f0', marginBottom: 2 }}>
                  {getEventTypeLabel(evt.type)}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{evt.detail}</div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{evt.time}</div>
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 6,
                background: `${getSecuritySeverityColor(evt.severity)}20`,
                color: getSecuritySeverityColor(evt.severity),
                whiteSpace: 'nowrap',
              }}>
                {getSecuritySeverityLabel(evt.severity)}
              </span>
            </div>
          ))}
          {events.length > 2 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {expanded ? '收起' : `查看全部 ${events.length} 条`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// 子组件: 登录记录表格
// ============================================================

function LoginHistoryTable({ records }: { records: LoginAttemptRecord[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => records.filter(r =>
      r.mobile.toLowerCase().includes(search.toLowerCase()) ||
      r.ip.includes(search)
    ),
    [records, search],
  );

  return (
    <div style={{
      marginTop: 20,
      borderRadius: 12,
      border: '1px solid rgba(148,163,184,0.12)',
      background: 'rgba(15,23,42,0.4)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(148,163,184,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📋</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>登录记录</span>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索手机号/IP…"
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.15)',
            background: 'rgba(15,23,42,0.5)',
            color: '#e2e8f0',
            fontSize: 12,
            outline: 'none',
            width: 140,
          }}
        />
      </div>
      <div style={{ padding: '8px 14px' }}>
        {records.length === 0 && filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: 12 }}>
            暂无登录记录
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11 }}>手机号</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11 }}>时间</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11 }}>IP</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11 }}>设备</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: 11 }}>结果</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.04)' }}>
                    <td style={{ padding: '6px 8px', color: '#e2e8f0' }}>{rec.mobile}</td>
                    <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{rec.time}</td>
                    <td style={{ padding: '6px 8px', color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>{rec.ip}</td>
                    <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{rec.device}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: rec.success ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
                        color: rec.success ? '#34d399' : '#f87171',
                      }}>
                        {rec.success ? '成功' : '失败'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && records.length > 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: 12 }}>
                无匹配记录
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 子组件: 登录建议面板
// ============================================================

function LoginSuggestionsPanel({ suggestions }: { suggestions: LoginSuggestion[] }) {
  return (
    <div style={{
      marginTop: 20,
      borderRadius: 12,
      border: '1px solid rgba(251, 191, 36, 0.15)',
      background: 'rgba(251, 191, 36, 0.04)',
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', marginBottom: 8 }}>
        💡 登录建议
      </div>
      {suggestions.map((sg) => (
        <div key={sg.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 0',
          fontSize: 12,
          color: '#94a3b8',
          borderBottom: '1px solid rgba(148,163,184,0.06)',
        }}>
          <span>{sg.icon}</span>
          <span>{sg.text}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 子组件: 快捷统计
// ============================================================

function LoginStatsPanel() {
  const stats = {
    todayLogins: 42,
    successRate: 95,
    failedAttempts: 3,
    uniqueUsers: 38,
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8,
      marginBottom: 16,
    }}>
      {[
        { label: '今日登录', value: stats.todayLogins, color: '#60a5fa' },
        { label: '成功率', value: `${stats.successRate}%`, color: '#34d399' },
        { label: '失败次数', value: stats.failedAttempts, color: stats.failedAttempts > 0 ? '#f87171' : '#34d399' },
        { label: '活跃用户', value: stats.uniqueUsers, color: '#a78bfa' },
      ].map((s) => (
        <div key={s.label} style={{
          textAlign: 'center',
          padding: '12px 10px',
          borderRadius: 10,
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(148,163,184,0.08)',
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// API 工具函数
// ============================================================

async function fetchLoginRecords(memberId: string): Promise<LoginAttemptRecord[]> {
  try {
    const scope = resolveStorefrontScope();
    const res = await fetch(`${getDefaultApiBaseUrl()}/members/${memberId}/login-history`, {
      headers: {
        'Content-Type': 'application/json',
        ...buildStorefrontScopeHeaders(scope),
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data as LoginAttemptRecord[] : [];
  } catch {
    return [];
  }
}

async function fetchSecurityEvents(memberId: string): Promise<SecurityEvent[]> {
  try {
    const scope = resolveStorefrontScope();
    const res = await fetch(`${getDefaultApiBaseUrl()}/members/${memberId}/security-events`, {
      headers: {
        'Content-Type': 'application/json',
        ...buildStorefrontScopeHeaders(scope),
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data as SecurityEvent[] : [];
  } catch {
    return [];
  }
}

// ============================================================
// 主页面组件
// ============================================================

export default function MemberLoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    mobile?: string;
    code?: string;
  }>({});
  const [loginRecords, setLoginRecords] = useState<LoginAttemptRecord[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const { state, submit } = useFormSubmit<MemberLoginResponse>({
    onSubmit: async () => {
      const result = await memberAuthService.login({ mobile, code });

      if (result.success && result.data) {
        localStorage.setItem('member_access_token', result.data.accessToken);
        localStorage.setItem('member_refresh_token', result.data.refreshToken);
        localStorage.setItem('member_info', JSON.stringify(result.data.member));
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

  // 从本地存储读取 memberId 并获取登录记录/安全事件
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        const infoStr = localStorage.getItem('member_info');
        if (infoStr) {
          const info = JSON.parse(infoStr);
          const memberId = info.memberId || info.id;
          if (memberId) {
            const [records, events] = await Promise.all([
              fetchLoginRecords(memberId),
              fetchSecurityEvents(memberId),
            ]);
            setLoginRecords(records);
            setSecurityEvents(events);
          }
        }
      } catch {
        // 静默失败，显示空态
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSendCode = useCallback(async () => {
    if (!mobile || !/^1[3-9]\d{9}$/.test(mobile)) {
      setFieldErrors({ mobile: '请输入有效的手机号' });
      return;
    }

    const result = await memberAuthService.sendSmsCode(mobile);
    if (result.success) {
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
  }, [mobile]);

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
      <div style={{
        width: '100%',
        maxWidth: 860,
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        gap: 24,
        alignItems: 'start',
      }}>
        {/* 左侧: 登录表单 */}
        <section
          style={{
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
              <span style={{ fontSize: 24, color: '#fff' }}>神</span>
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
                style={{
                  width: '100%',
                  borderRadius: 8,
                  padding: '12px 14px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#f8fafc',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
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
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    padding: '12px 14px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#f8fafc',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
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

          {/* 微信登录 */}
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
              <span style={{ fontSize: 18 }}>微</span>
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

        {/* 右侧: 统计面板 + 安全事件 + 登录记录 */}
        <div>
          {/* 快捷统计 */}
          <LoginStatsPanel />

          {/* 登录建议 */}
          <LoginSuggestionsPanel suggestions={LOGIN_SUGGESTIONS} />

          {/* 安全事件面板 */}
          <SecurityEventsPanel events={securityEvents} />

          {/* 登录记录 */}
          {dataLoading ? (
            <div style={{ marginTop: 20, textAlign: 'center', padding: '20px', color: '#64748b', fontSize: 12 }}>
              加载中...
            </div>
          ) : (
            <>
              <LoginHistoryTable records={loginRecords} />

              {/* 展开登录历史按钮 */}
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.15)',
                    background: 'transparent',
                    color: '#64748b',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {showHistory ? '收起详情' : '查看完整登录历史'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 底部 */}
      <footer style={{
        position: 'fixed',
        bottom: 16,
        textAlign: 'center',
        fontSize: 12,
        color: '#64748b',
        width: '100%',
      }}>
        © 2024 神机营 SaaS · 会员服务 · 登录页面 v3.0
      </footer>
    </main>
  );
}
