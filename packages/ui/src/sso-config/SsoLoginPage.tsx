/**
 * Phase 96 SSO 连接登录页 (V10 Sprint 2 Day 24)
 *
 * 用户登录入口,展示所有 active 的 SSO 连接 + 跳转到 IdP
 */

import React from 'react'
import { useSsoConnections, useSsoLogin } from './useSso'
import { SSO_PROTOCOL_LABELS } from './types'

export interface SsoLoginPageProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
  /** 默认连接 ID (直接跳转到该 SSO,跳过选择页) */
  defaultConnectionId?: string
}

export function SsoLoginPage({ variant = 'pc', defaultConnectionId }: SsoLoginPageProps) {
  const { data: connections = [] } = useSsoConnections()
  const loginMut = useSsoLogin()

  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'
  const activeConns = connections.filter((c) => c.status === 'active')

  const handleLogin = (connectionId: string) => {
    loginMut.mutate(
      { connectionId, forceAuthn: false },
      {
        onSuccess: (data) => {
          if (typeof window !== 'undefined') {
            window.location.href = data.redirectUrl
          }
        },
      },
    )
  }

  return (
    <div
      data-testid="sso-login-page"
      data-variant={variant}
      style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isCompact ? 16 : 40,
      }}
    >
      <div
        style={{
          background: '#fff', borderRadius: 12, padding: isCompact ? 24 : 40,
          maxWidth: 440, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <h1 style={{ fontSize: isCompact ? 20 : 24, margin: '0 0 8px', color: '#262626' }}>企业 SSO 登录</h1>
        <p style={{ color: '#8c8c8c', fontSize: 13, margin: '0 0 24px' }}>使用您的企业账号登录审计鹰 V10</p>

        {defaultConnectionId ? (
          <button
            type="button"
            data-testid="sso-direct-login"
            onClick={() => handleLogin(defaultConnectionId)}
            style={{
              width: '100%', padding: '12px', fontSize: 15, fontWeight: 600,
              background: '#1890ff', color: '#fff', border: 'none', borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            {loginMut.isPending ? '跳转中...' : '使用企业账号登录'}
          </button>
        ) : activeConns.length === 0 ? (
          <div
            data-testid="sso-no-conns"
            style={{ padding: 24, textAlign: 'center', color: '#8c8c8c', background: '#fafafa', borderRadius: 6 }}
          >
            暂未配置 SSO 连接
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {activeConns.map((conn) => (
              <button
                key={conn.id}
                type="button"
                data-testid={`sso-login-${conn.id}`}
                onClick={() => handleLogin(conn.id)}
                style={{
                  padding: '12px 16px', fontSize: 14, textAlign: 'left',
                  background: '#fafafa', border: '1px solid #d9d9d9', borderRadius: 6,
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span>
                  <strong>{conn.name}</strong>
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#1890ff' }}>{SSO_PROTOCOL_LABELS[conn.protocol]}</span>
                </span>
                <span style={{ color: '#1890ff' }}>→</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0', fontSize: 12, color: '#8c8c8c', textAlign: 'center' }}>
          登录即表示同意 <a href="#terms">服务条款</a> 与 <a href="#privacy">隐私政策</a>
        </div>
      </div>
    </div>
  )
}