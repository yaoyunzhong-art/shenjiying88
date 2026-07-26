import { AdminPermissionGate } from '../../components/admin-permission-gate'
import PaymentConfigClient from './payment-config-client'
import { loadPaymentConfigSnapshot } from './payment-config-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '支付配置访问受限',
  description:
    '支付配置页已切换为服务端快照壳层，仅具备 foundation.governance.read 权限的账号可查看支付通道、结算规则与来源态证据。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaymentConfigPage() {
  const snapshot = await loadPaymentConfigSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadPaymentConfigSnapshot -> local payment config snapshot',
    businessDataSource: 'local payment governance samples',
    refreshPath: 'PaymentConfigPage -> loadPaymentConfigSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      '当前页面使用本地支付配置样本，不代表真实支付网关主链，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 1080,
            margin: '0 auto',
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(148,163,184,0.08)',
            fontSize: 12,
            color: '#cbd5e1',
            lineHeight: 1.7,
          }}
        >
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>
            刷新路径: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <PaymentConfigClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
