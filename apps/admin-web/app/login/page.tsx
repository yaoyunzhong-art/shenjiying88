import LoginClient from './login-client'
import { loadLoginPageSnapshot } from './login-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LoginPage() {
  const snapshot = await loadLoginPageSnapshot()

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
          <div>Delivery {snapshot.deliveryMode} · 控制面来源: {snapshot.controlPlaneSource}</div>
          <div>业务数据: {snapshot.businessDataSource} · 刷新路径: {snapshot.refreshPath}</div>
          <div>generatedAt: {snapshot.generatedAt} · 来源标签: {snapshot.sourceLabel}</div>
          <div>{snapshot.note}</div>
        </div>
        <LoginClient snapshot={snapshot} />
      </div>
    </div>
  )
}
