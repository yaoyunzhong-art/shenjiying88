import { AdminPermissionGate } from '../../components/admin-permission-gate'
import CustomFieldsClient from './custom-fields-client'
import { loadCustomFieldsSnapshot } from './custom-fields-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '自定义字段访问受限',
  description:
    '自定义字段页已切换为服务端快照壳层，只有具备 foundation.governance.read 权限的账号才能查看字段定义、分组筛选与创建编辑能力。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CustomFieldsPage() {
  const snapshot = await loadCustomFieldsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadCustomFieldsSnapshot -> local custom field snapshot',
    businessDataSource: 'local custom field definitions and group samples',
    refreshPath: 'CustomFieldsPage -> loadCustomFieldsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用本地自定义字段样本，不代表真实字段配置主链，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto 16px',
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
        <CustomFieldsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
