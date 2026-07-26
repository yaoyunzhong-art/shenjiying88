import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import SchedulingClient from './scheduling-client'
import { loadSchedulingSnapshot } from './scheduling-data'

const permissionGate = {
  requiredPermission: 'store:read',
  title: '门店排班访问受限',
  description:
    '门店排班页已接入管理员本地 session，只有具备 store:read 的账号才能查看排班列表、签到状态与班次统计。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function SchedulingPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadSchedulingSnapshot(id)
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadSchedulingSnapshot -> logistics/clean-schedules'
        : 'loadSchedulingSnapshot -> buildFallbackSchedules fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'clean schedule upstream API responses'
        : 'local clean schedule samples',
    refreshPath: 'SchedulingPage -> loadSchedulingSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费门店排班服务端快照。'
        : '当前页面已回退到本地排班样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="space-y-6 p-6">
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
        <SchedulingClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
