import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import StoreOrdersClient from './orders-client'
import { loadStoreOrdersSnapshot } from './orders-data'

const permissionGate = {
  requiredPermission: 'store:read',
  title: '门店订单访问受限',
  description:
    '门店订单页已接入管理员本地 session，只有具备 store:read 的账号才能查看订单列表、退款处理与订单详情。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function OrdersPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadStoreOrdersSnapshot(id)
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadStoreOrdersSnapshot -> transactions?type=order&storeId={id}'
        : 'loadStoreOrdersSnapshot -> DEFAULT_STORE_ORDERS',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'transactions order upstream responses'
        : 'local store order fallback samples',
    refreshPath: 'OrdersPage -> loadStoreOrdersSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费交易订单服务端快照。'
        : snapshot.error ?? '当前页面已回退到门店订单样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel} ·
            控制面来源: {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <StoreOrdersClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
