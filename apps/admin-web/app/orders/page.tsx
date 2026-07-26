import { AdminPermissionGate } from '../components/admin-permission-gate'
import { loadOrdersSnapshot } from '../orders-data'
import OrdersClient from './orders-client'

const permissionGate = {
  requiredPermission: 'order:read',
  title: '订单管理访问受限',
  description:
    '订单管理中心已接入管理员本地 session，只有具备 order:read 的账号才能查看订单列表、状态流转与渠道统计结果。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrdersPage() {
  const snapshot = await loadOrdersSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadOrdersSnapshot -> transactions?type=order'
        : 'loadOrdersSnapshot -> MOCK_ORDERS fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'transaction order upstream API response'
        : 'local order samples',
    refreshPath: 'OrdersPage -> loadOrdersSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费订单服务端快照。'
        : '当前页面已回退到本地订单样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="space-y-6">
        <div className="mx-auto max-w-7xl px-8 pt-8">
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
        </div>
        <OrdersClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
