'use client'

import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ──────────────────────────────────────

interface MaintenanceTask {
  id: string
  storeName: string
  storeId: string
  type: 'clean' | 'repair' | 'inspect' | 'replace' | 'other'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'
  assignedTo?: string
  scheduledDate?: string
  completedAt?: string
  costCents?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

type MaintTab = 'pending' | 'in-progress' | 'completed' | 'all'

// ── 工具 ──

function fmtCents(cents: number): string {
  const abs = Math.abs(cents)
  return `¥${(abs / 100).toFixed(2)}`
}

function typeLabel(t: string): string {
  const map: Record<string, string> = { clean: '保洁', repair: '维修', inspect: '巡检', replace: '更换', other: '其他' }
  return map[t] ?? t
}

function priorityLabel(p: string): string {
  const map: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return map[p] ?? p
}

function priorityColor(p: string): string {
  const map: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700',
    high: 'bg-yellow-100 text-yellow-700', urgent: 'bg-red-100 text-red-700',
  }
  return map[p] ?? 'bg-gray-100 text-gray-600'
}

function statusColor(s: string): string {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600', assigned: 'bg-blue-100 text-blue-700',
    'in-progress': 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600',
  }
  return map[s] ?? 'bg-gray-100 text-gray-600'
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: '待处理', assigned: '已指派', 'in-progress': '进行中',
    completed: '已完成', cancelled: '已取消',
  }
  return map[s] ?? s
}

// ── 默认样本数据 ──

const defaultTasks: MaintenanceTask[] = [
  { id: 'mt-1', storeName: '北京朝阳店', storeId: 's1', type: 'repair', title: '空调故障', description: '2号机不制冷', priority: 'high', status: 'in-progress', assignedTo: '张师傅', scheduledDate: '2026-07-19', createdAt: '2026-07-17T10:00:00Z', updatedAt: '2026-07-18T08:00:00Z' },
  { id: 'mt-2', storeName: '上海南京路店', storeId: 's2', type: 'clean', title: '月度深度保洁', description: '全店地毯清洗+玻璃清洁', priority: 'medium', status: 'assigned', assignedTo: '保洁组', scheduledDate: '2026-07-20', createdAt: '2026-07-15T14:00:00Z', updatedAt: '2026-07-16T09:00:00Z' },
  { id: 'mt-3', storeName: '广州天河店', storeId: 's3', type: 'inspect', title: '消防设施检查', description: '月度消防安全巡检', priority: 'urgent', status: 'pending', createdAt: '2026-07-18T06:00:00Z', updatedAt: '2026-07-18T06:00:00Z' },
  { id: 'mt-4', storeName: '深圳南山店', storeId: 's4', type: 'replace', title: '损坏闸机更换', description: '入口闸机刷卡故障', priority: 'high', status: 'completed', assignedTo: '设备组', completedAt: '2026-07-17T16:00:00Z', costCents: 350000, createdAt: '2026-07-14T10:00:00Z', updatedAt: '2026-07-17T16:00:00Z' },
  { id: 'mt-5', storeName: '成都春熙路店', storeId: 's5', type: 'repair', title: '收银系统升级', description: '升级最新版收银软件', priority: 'low', status: 'pending', createdAt: '2026-07-16T11:00:00Z', updatedAt: '2026-07-16T11:00:00Z' },
]

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data as T
}

// ── 主组件 ──

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabView, setTabView] = useState<MaintTab>('pending')

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ tasks: MaintenanceTask[] }>('/api/logistics/maintenance')
      setTasks(data.tasks)
    } catch {
      setTasks(defaultTasks)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  const filtered = tasks.filter(t => {
    if (tabView === 'all') return true
    if (tabView === 'pending') return t.status === 'pending' || t.status === 'assigned'
    if (tabView === 'in-progress') return t.status === 'in-progress'
    if (tabView === 'completed') return t.status === 'completed' || t.status === 'cancelled'
    return true
  })

  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length
  const pendingCount = tasks.filter(t => t.status === 'pending' || t.status === 'assigned').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载后勤任务...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">后勤维护</h1>
          <p className="text-sm text-gray-500 mt-1">门店维护·保洁巡检·设备维修管理</p>
        </div>
        <button onClick={loadTasks} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">刷新</button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 概览 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">任务总数</p>
          <p className="text-2xl font-bold mt-1">{tasks.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">待处理</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">进行中</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{tasks.filter(t => t.status === 'in-progress').length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">紧急</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{urgentCount}</p>
        </div>
      </div>

      {/* Tab */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['pending', 'in-progress', 'completed', 'all'] as MaintTab[]).map(tab => (
            <button key={tab} onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {{ pending: '待处理', 'in-progress': '进行中', completed: '已完成', all: '全部' }[tab]}
            </button>
          ))}
        </nav>
      </div>

      {/* 列表 */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center">
            <div className="text-gray-300 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-lg text-gray-500 mb-1">暂无任务</p>
            <p className="text-sm text-gray-400">当前筛选条件下没有后勤任务</p>
          </div>
        ) : (
          filtered.map(task => (
            <div key={task.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-gray-900">{task.storeName} · {task.title}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${priorityColor(task.priority)}`}>
                      {priorityLabel(task.priority)}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(task.status)}`}>
                      {statusLabel(task.status)}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5">{typeLabel(task.type)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    {task.assignedTo && <span>负责人: {task.assignedTo}</span>}
                    {task.scheduledDate && <span>计划日期: {task.scheduledDate}</span>}
                    {task.costCents != null && task.costCents > 0 && <span>费用: {fmtCents(task.costCents)}</span>}
                    {task.completedAt && <span>完成于 {new Date(task.completedAt).toLocaleString('zh-CN')}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
