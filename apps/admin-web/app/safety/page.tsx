import { AdminPermissionGate } from '../components/admin-permission-gate'
import { loadSafetySnapshot, SEVERITY_MAP, STATUS_MAP } from './safety-data'

const permissionGate = {
  requiredPermission: 'safety:read',
  title: 'safety 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 safety:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

function count(records: Awaited<ReturnType<typeof loadSafetySnapshot>>['records'], status: keyof typeof STATUS_MAP) {
  return records.filter((record) => record.status === status).length
}

export default async function SafetyPage() {
  const snapshot = await loadSafetySnapshot()
  const criticalCount = snapshot.records.filter((record) => record.severity === 'critical').length
  const completionRate = Math.round(((count(snapshot.records, 'resolved') + count(snapshot.records, 'closed')) / snapshot.records.length) * 100)
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadSafetySnapshot -> buildSafetyRecords',
    businessDataSource: 'local safety incident snapshot samples',
    refreshPath: 'SafetyPage -> loadSafetySnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面已收敛为 snapshot page，来源态与结构证据可直接透出。',
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

        <header>
          <h1 className="text-2xl font-bold text-slate-900">安全记录</h1>
          <p className="mt-1 text-sm text-slate-500">安全事件、隐患与整改跟踪快照页</p>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">待处理</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{count(snapshot.records, 'open')}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">调查中</div>
            <div className="mt-2 text-2xl font-bold text-amber-600">{count(snapshot.records, 'investigating')}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">已解决 / 已关闭</div>
            <div className="mt-2 text-2xl font-bold text-green-600">
              {count(snapshot.records, 'resolved')} / {count(snapshot.records, 'closed')}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">严重 / 完成率</div>
            <div className="mt-2 text-2xl font-bold text-red-600">
              {criticalCount} / {completionRate}%
            </div>
          </div>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">安全记录快照</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-4">编号</th>
                  <th className="py-2 pr-4">类别</th>
                  <th className="py-2 pr-4">状态</th>
                  <th className="py-2 pr-4">严重程度</th>
                  <th className="py-2 pr-4">位置</th>
                  <th className="py-2 pr-4">上报日期</th>
                  <th className="py-2 pr-4">处理人</th>
                  <th className="py-2 pr-4">描述</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.records.map((record) => (
                  <tr key={record.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium text-slate-900">{record.id}</td>
                    <td className="py-2 pr-4">{record.category}</td>
                    <td className={`py-2 pr-4 ${STATUS_MAP[record.status].tone}`}>{STATUS_MAP[record.status].label}</td>
                    <td className={`py-2 pr-4 ${SEVERITY_MAP[record.severity].tone}`}>{SEVERITY_MAP[record.severity].label}</td>
                    <td className="py-2 pr-4">{record.location}</td>
                    <td className="py-2 pr-4">{record.reportedDate}</td>
                    <td className="py-2 pr-4">{record.assignee}</td>
                    <td className="py-2 pr-4 text-slate-600">{record.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminPermissionGate>
  )
}
