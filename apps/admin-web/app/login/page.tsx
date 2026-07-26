import { headers } from 'next/headers'

import LoginClient from './login-client'
import { loadLoginPageSnapshot } from './login-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LoginPage() {
  const requestHeaders = await headers()
  const snapshot = await loadLoginPageSnapshot({ requestHeaders })
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadLoginPageSnapshot -> auth/me'
        : 'loadLoginPageSnapshot -> adminWebBootstrap + MOCK_LOGIN_HISTORY fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'auth current session API response + fallback login history/password policy'
        : 'local login samples and security bootstrap snapshot',
    refreshPath: 'LoginPage -> loadLoginPageSnapshot',
    generatedAt: snapshot.generatedAt,
    sourceLabel: snapshot.sourceLabel,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前登录页已探测到真实认证会话，历史与策略看板仍保留 fallback 演练快照。'
        : '当前登录页展示的是本地认证演练快照，已显式暴露来源态与安全策略证据。',
  } as const

  return (
    <div style={{ minHeight: '100vh', background: '#020617' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 24 }}>
        <div
          style={{
            marginBottom: 24,
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.18)',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: 16,
            color: '#cbd5e1',
            fontSize: 12,
            lineHeight: 1.8,
          }}
        >
          <div>Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}</div>
          <div>业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}</div>
          <div>generatedAt: {sourceEvidence.generatedAt} · 来源标签: {sourceEvidence.sourceLabel}</div>
          <div>{sourceEvidence.note}</div>
        </div>
        <LoginClient snapshot={snapshot} />
      </div>
    </div>
  )
}
