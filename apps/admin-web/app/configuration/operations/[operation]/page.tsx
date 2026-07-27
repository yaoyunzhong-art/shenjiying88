import { readConfigurationOperationDetailParam } from '@m5/types'
import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import ConfigurationOperationDetailClient from './configuration-operation-detail-client'
import { loadConfigurationOperationDetailPageSnapshot } from './configuration-operation-detail-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '配置操作边界访问受限',
  description:
    '配置操作边界页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看 RBAC、审批条件、审计等级与治理深链。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ operation?: string | string[] }>
}

export default async function ConfigurationOperationDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const operation = readConfigurationOperationDetailParam(resolvedParams.operation)
  const snapshot = await loadConfigurationOperationDetailPageSnapshot(operation ?? '')
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadConfigurationOperationDetailPageSnapshot -> loadConfigurationOperationDetail(api)'
        : 'loadConfigurationOperationDetailPageSnapshot -> loadConfigurationOperationDetail fallback',
    businessDataSource:
      snapshot.detail.deliveryMode === 'api'
        ? 'configuration governance metadata API snapshot'
        : 'fallback configuration governance metadata snapshot',
    refreshPath: 'ConfigurationOperationDetailPage -> loadConfigurationOperationDetailPageSnapshot',
    generatedAt: snapshot.generatedAt,
    note: snapshot.detail.notFound
      ? '当前 operation 未命中 configuration metadata，详情面板展示 notFound 固证。'
      : '当前详情页已切换为服务端快照首屏，客户端交互仅负责渲染与刷新。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>
            refreshPath: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <ConfigurationOperationDetailClient snapshot={snapshot.detail} />
      </div>
    </AdminPermissionGate>
  )
}
