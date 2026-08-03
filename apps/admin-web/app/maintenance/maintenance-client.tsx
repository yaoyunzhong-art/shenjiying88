'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import {
  MAINTENANCE_PRIORITY_MAP,
  MAINTENANCE_STATUS_MAP,
  MAINTENANCE_TYPE_MAP,
  type MaintenanceSnapshotDelivery,
  type MaintenanceTaskStatus,
} from './maintenance-data'

type MaintenanceTab = 'pending' | 'in_progress' | 'completed' | 'all'

function formatTimestamp(value?: string): string {
  if (!value) {
    return '—'
  }

  return new Date(value).toLocaleString('zh-CN')
}

export default function MaintenanceClient({
  snapshot,
}: {
  snapshot: MaintenanceSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [tabView, setTabView] = useState<MaintenanceTab>('pending')

  const filteredTasks = useMemo(() => {
    return snapshot.tasks.filter((task) => {
      if (tabView === 'all') return true
      if (tabView === 'pending') return task.status === 'pending' || task.status === 'assigned'
      if (tabView === 'in_progress') return task.status === 'in_progress'
      return task.status === 'completed' || task.status === 'cancelled'
    })
  }, [snapshot.tasks, tabView])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">后勤维护</h1>
          <p className="mt-1 text-sm text-gray-500">
            门店维护 · 保洁巡检 · 设备维保 · Delivery {snapshot.deliveryMode}
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {snapshot.error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          {snapshot.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">任务总数</p>
          <p className="mt-1 text-2xl font-bold">{snapshot.stats.total}</p>
          <p className="text-xs text-gray-400">当前服务端快照透传</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">待处理</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{snapshot.stats.pending}</p>
          <p className="text-xs text-gray-400">含待处理与已指派</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">进行中</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{snapshot.stats.inProgress}</p>
          <p className="text-xs text-gray-400">现场执行中任务</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">紧急</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{snapshot.stats.critical}</p>
          <p className="text-xs text-gray-400">critical 优先级工单</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {(
            [
              ['pending', '待处理'],
              ['in_progress', '进行中'],
              ['completed', '已完成'],
              ['all', '全部'],
            ] as Array<[MaintenanceTab, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTabView(key)}
              className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                tabView === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center">
            <p className="text-lg text-gray-500">暂无任务</p>
            <p className="mt-1 text-sm text-gray-400">当前筛选条件下没有后勤任务</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const priority = MAINTENANCE_PRIORITY_MAP[task.priority]
            const status = MAINTENANCE_STATUS_MAP[task.status as MaintenanceTaskStatus]

            return (
              <div
                key={task.id}
                className="rounded-lg border bg-white p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-medium text-gray-900">
                        {task.storeName} · {task.equipmentName}
                      </h2>
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${priority.tone}`}
                      >
                        {priority.label}
                      </span>
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${status.tone}`}
                      >
                        {status.label}
                      </span>
                      <span className="rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                        {MAINTENANCE_TYPE_MAP[task.taskType]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{task.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span>门店编码: {task.storeId}</span>
                      {task.assigneeName && <span>负责人: {task.assigneeName}</span>}
                      {task.reportedByName && <span>上报人: {task.reportedByName}</span>}
                      {task.scheduledAt && <span>计划时间: {formatTimestamp(task.scheduledAt)}</span>}
                      {task.completedAt && <span>完成时间: {formatTimestamp(task.completedAt)}</span>}
                    </div>
                    {task.completionNote && (
                      <div className="rounded border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        完成备注: {task.completionNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
