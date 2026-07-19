/**
 * P-30 维修工单管理页面
 *
 * 功能:
 *   1. 维修工单列表 — 状态筛选(全部/待指派/进行中/已完成/待验收/已验收)
 *   2. 新建工单按钮
 *   3. 状态管理 — loading/空/error
 *
 * 路由: /logistics/repairs
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

// ─── 类型 ──────────────────────────────────────

type RepairStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'pending_verify' | 'verified'

const STATUS_CONFIG: Record<RepairStatus, { label: string; color: string }> = {
  pending: { label: '待指派', color: 'bg-orange-100 text-orange-800' },
  assigned: { label: '已指派', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '维修中', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  pending_verify: { label: '待验收', color: 'bg-purple-100 text-purple-800' },
  verified: { label: '已验收', color: 'bg-gray-100 text-gray-800' },
}

interface RepairOrder {
  id: string
  storeId: string
  storeName: string
  equipmentName: string
  issueDescription: string
  status: RepairStatus
  assigneeName: string | null
  reporterName: string
  createdAt: string
}

const MOCK_REPAIRS: RepairOrder[] = [
  { id: 'RO-001', storeId: 'S-001', storeName: '旗舰店', equipmentName: '射击枪 A-01', issueDescription: '扳机卡顿，需检修', status: 'in_progress', assigneeName: '李师傅', reporterName: '张店长', createdAt: '2026-07-19T09:00:00Z' },
  { id: 'RO-002', storeId: 'S-002', storeName: '体验店B', equipmentName: 'VR头盔 H-03', issueDescription: '画面模糊', status: 'pending', assigneeName: null, reporterName: '王员工', createdAt: '2026-07-19T10:30:00Z' },
  { id: 'RO-003', storeId: 'S-001', storeName: '旗舰店', equipmentName: '篮球机 B-02', issueDescription: '投币器故障', status: 'completed', assigneeName: '赵师傅', reporterName: '张店长', createdAt: '2026-07-18T14:00:00Z' },
  { id: 'RO-004', storeId: 'S-003', storeName: '社区店C', equipmentName: '空调系统', issueDescription: '制冷效果差', status: 'pending_verify', assigneeName: '钱师傅', reporterName: '刘店长', createdAt: '2026-07-18T08:00:00Z' },
  { id: 'RO-005', storeId: 'S-002', storeName: '体验店B', equipmentName: '收银终端 POS-01', issueDescription: '扫码枪不识别', status: 'verified', assigneeName: '孙师傅', reporterName: '王员工', createdAt: '2026-07-17T16:00:00Z' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function RepairsPage() {
  const [repairs] = useState<RepairOrder[]>(MOCK_REPAIRS)
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'ALL'>('ALL')
  const [loading, setLoading] = useState(false)
  const [error] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return repairs
    return repairs.filter(r => r.status === statusFilter)
  }, [repairs, statusFilter])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">维修工单</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* ── 筛选 ── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['ALL', 'pending', 'assigned', 'in_progress', 'completed', 'pending_verify', 'verified'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded text-sm ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {s === 'ALL' ? '全部' : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          加载中...
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🔧</div>
          <p>暂无维修工单</p>
        </div>
      )}

      {/* ── List ── */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2">工单号</th>
                <th className="text-left px-3 py-2">门店</th>
                <th className="text-left px-3 py-2">设备</th>
                <th className="text-left px-3 py-2">问题描述</th>
                <th className="text-left px-3 py-2">状态</th>
                <th className="text-left px-3 py-2">维修人</th>
                <th className="text-left px-3 py-2">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                  <td className="px-3 py-2">{r.storeName}</td>
                  <td className="px-3 py-2">{r.equipmentName}</td>
                  <td className="px-3 py-2 max-w-[200px] truncate">{r.issueDescription}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_CONFIG[r.status]?.color}`}>
                      {STATUS_CONFIG[r.status]?.label}
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.assigneeName || '—'}</td>
                  <td className="px-3 py-2 text-xs">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
