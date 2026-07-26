import { AdminPermissionGate } from '../components/admin-permission-gate'
import AiScenarioSimulatorClient from './ai-scenario-simulator-client'
import { loadAiScenarioSimulatorSnapshot } from './ai-scenario-simulator-data'

const permissionGate = {
  requiredPermission: 'ai-scenario-simulator:read',
  title: 'ai-scenario-simulator 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 ai-scenario-simulator:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AiScenarioSimulatorPage() {
  const snapshot = await loadAiScenarioSimulatorSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadAiScenarioSimulatorSnapshot -> local scenario presets',
    businessDataSource: 'preset variables + local simulation formulas',
    refreshPath: 'AiScenarioSimulatorPage -> loadAiScenarioSimulatorSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面消费本地 snapshot loader，适用于结构固证与交互演示，不作为实时复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div>
            Delivery {sourceEvidence.deliveryMode} · sourceLabel: {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>
            refreshPath: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <AiScenarioSimulatorClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
