import { AdminPermissionGate } from '../components/admin-permission-gate'
import PaymentChannelsClient from './payment-channels-client'
import { loadPaymentChannelsSnapshot } from './payment-channels-data'

const permissionGate = {
  requiredPermission: 'payment-channels:read',
  title: 'payment-channels 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 payment-channels:read 权限的账号可访问。',
} as const
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaymentChannelsPage() {
  const snapshot = await loadPaymentChannelsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadPaymentChannelsSnapshot -> cashier/channels'
        : 'loadPaymentChannelsSnapshot -> defaultChannels fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'payment channels upstream API response'
        : 'local payment channel samples',
    refreshPath: 'PaymentChannelsPage -> loadPaymentChannelsSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费支付渠道服务端快照。'
        : '当前页面已回退到本地支付渠道样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate
      requiredPermission={permissionGate.requiredPermission}
      title={permissionGate.title}
      description={permissionGate.description}
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div>
            Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <PaymentChannelsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
