import { AdminPermissionGate } from '../../components/admin-permission-gate'
import ShopInventoryClient from './shop-inventory-client'
import { loadShopInventorySnapshot } from './shop-inventory-data'

const permissionGate = {
  requiredPermission: 'shop:inventory:read',
  title: '店铺库存访问受限',
  description:
    '店铺库存页已切换到 server wrapper + snapshot loader，仅具备 shop:inventory:read 权限的账号可查看库存来源态证据。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ShopInventoryPage() {
  const snapshot = await loadShopInventorySnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: snapshot.controlPlaneSource,
    businessDataSource: snapshot.businessDataSource,
    refreshPath: snapshot.refreshPath,
    generatedAt: snapshot.generatedAt,
    note: snapshot.note,
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
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
        <ShopInventoryClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
