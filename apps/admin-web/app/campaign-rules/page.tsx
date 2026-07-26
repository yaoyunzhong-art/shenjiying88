import { AdminPermissionGate } from '../components/admin-permission-gate'
import CampaignRulesClient from './campaign-rules-client'
import { loadCampaignRulesSnapshot } from './campaign-rules-data'

const permissionGate = {
  requiredPermission: 'campaign-rules:read',
  title: '活动规则管理访问受限',
  description:
    '活动规则页已切换到 server wrapper + snapshot loader，仅具备 campaign-rules:read 权限的账号可查看来源态证据与规则结构。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CampaignRulesPage() {
  const snapshot = await loadCampaignRulesSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadCampaignRulesSnapshot -> defaultCampaignRules snapshot',
    businessDataSource: 'local campaign rule sample snapshot records',
    refreshPath: 'CampaignRulesPage -> loadCampaignRulesSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面消费本地活动规则快照样本，适用于结构固证与交互演示，不作为实时复签证据。',
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
        <CampaignRulesClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
