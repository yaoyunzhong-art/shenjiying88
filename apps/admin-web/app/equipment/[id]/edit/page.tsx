import { AdminPermissionGate } from '../../../components/admin-permission-gate'

import EquipmentEditClient from './equipment-edit-client'
import { loadEquipmentEditSnapshot } from './equipment-edit-data'

interface PageProps {
  params: Promise<{ id: string }>
}

const permissionGate = {
  requiredPermission: 'equipment:read',
  title: '编辑设备访问受限',
  description: '该页面已接入管理员权限管控，仅具备 equipment:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EquipmentEditPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadEquipmentEditSnapshot(id)
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
        <EquipmentEditClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
