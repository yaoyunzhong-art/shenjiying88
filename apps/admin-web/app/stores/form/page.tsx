import { AdminPermissionGate } from '../../components/admin-permission-gate'
import StoreFormClient from './store-form-client'
import { loadStoreFormSnapshot } from './store-form-data'

export * from './store-form-legacy'

const permissionGate = {
  requiredPermission: 'store:read',
  title: '门店编辑访问受限',
  description: '门店编辑页已接入管理员本地 session，只有具备 store:read 的账号才能修改门店档案、运营配置与风险等级。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0
export default async function StoreFormPage() {
  const snapshot = await loadStoreFormSnapshot()
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
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <div
          style={{
            marginBottom: 24,
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.18)',
            background: 'rgba(248, 250, 252, 0.92)',
            padding: 16,
            color: '#334155',
            fontSize: 12,
            lineHeight: 1.8,
          }}
        >
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel} · 控制面来源:{' '}
            {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <StoreFormClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
