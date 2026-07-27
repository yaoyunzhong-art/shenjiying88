import { readFoundationModuleDetailParam } from '@m5/types'

import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import FoundationModuleDetailClient from './foundation-module-detail-client'
import { loadFoundationModuleDetailPageSnapshot } from './foundation-module-detail-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: 'Foundation 模块详情访问受限',
  description:
    'Foundation 模块详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看模块职责、能力清单、契约关系与治理基线。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ module?: string | string[] }>
}

export default async function FoundationModuleDetailPage({ params }: PageProps) {
  const resolved = await params
  const moduleKey = readFoundationModuleDetailParam(resolved.module) ?? ''
  const snapshot = await loadFoundationModuleDetailPageSnapshot(moduleKey)
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
        <FoundationModuleDetailClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
