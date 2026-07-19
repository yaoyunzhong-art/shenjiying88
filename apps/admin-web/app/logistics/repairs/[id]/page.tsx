'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'

type RepairStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'pending_verify' | 'verified'

const STATUS_LABELS: Record<RepairStatus, string> = {
  pending: '待指派',
  assigned: '已指派',
  in_progress: '维修中',
  completed: '已完成',
  pending_verify: '待验收',
  verified: '已验收',
}

const MOCK_DETAIL = {
  id: 'RO-001',
  storeName: '旗舰店',
  equipmentName: '射击枪 A-01',
  equipmentId: 'EQ-001',
  issueDescription: '扳机卡顿，反应不灵敏，需要检修',
  status: 'in_progress' as RepairStatus,
  assigneeName: '李师傅',
  reporterName: '张店长',
  reporterPhone: '13800000001',
  createdAt: '2026-07-19T09:00:00Z',
  completedAt: null as string | null,
  note: '已检查扳机弹簧，需更换配件',
}

export default function RepairDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [status, setStatus] = useState(MOCK_DETAIL.status)
  const [actionLoading, setActionLoading] = useState(false)

  const mockRepair = { ...MOCK_DETAIL, id, status }

  const handleAction = async (newStatus: RepairStatus) => {
    setActionLoading(true)
    await new Promise(r => setTimeout(r, 200))
    setStatus(newStatus)
    setActionLoading(false)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="text-blue-600 hover:underline mb-4 block">&larr; 返回工单列表</button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">{mockRepair.id}</h1>
            <p className="text-gray-500">{mockRepair.storeName} · {mockRepair.equipmentName}</p>
          </div>
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            status === 'pending' ? 'bg-orange-100 text-orange-800' :
            status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
            status === 'completed' || status === 'verified' ? 'bg-green-100 text-green-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {STATUS_LABELS[status]}
          </span>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">报修人</p>
              <p className="font-medium">{mockRepair.reporterName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">联系电话</p>
              <p className="font-medium">{mockRepair.reporterPhone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">设备编号</p>
              <p className="font-medium">{mockRepair.equipmentId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">维修人员</p>
              <p className="font-medium">{mockRepair.assigneeName || '待指派'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">创建时间</p>
              <p className="font-medium">{new Date(mockRepair.createdAt).toLocaleString('zh-CN')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">完成时间</p>
              <p className="font-medium">{mockRepair.completedAt ? new Date(mockRepair.completedAt).toLocaleString('zh-CN') : '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">问题描述</p>
            <p className="font-medium mt-1">{mockRepair.issueDescription}</p>
          </div>
          {mockRepair.note && (
            <div>
              <p className="text-sm text-gray-500">维修备注</p>
              <p className="font-medium mt-1">{mockRepair.note}</p>
            </div>
          )}
        </div>

        {/* ── 操作按钮 ── */}
        {status === 'pending' && (
          <button onClick={() => handleAction('assigned')} disabled={actionLoading}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 w-full">
            {actionLoading ? '处理中...' : '指派维修'}
          </button>
        )}
        {status === 'assigned' && (
          <button onClick={() => handleAction('in_progress')} disabled={actionLoading}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 w-full">
            {actionLoading ? '处理中...' : '开始维修'}
          </button>
        )}
        {status === 'in_progress' && (
          <button onClick={() => handleAction('completed')} disabled={actionLoading}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 w-full">
            {actionLoading ? '处理中...' : '完成维修'}
          </button>
        )}
        {status === 'completed' && (
          <button onClick={() => handleAction('pending_verify')} disabled={actionLoading}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 w-full">
            {actionLoading ? '处理中...' : '发起验收'}
          </button>
        )}
        {status === 'pending_verify' && (
          <button onClick={() => handleAction('verified')} disabled={actionLoading}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 w-full">
            {actionLoading ? '处理中...' : '确认验收'}
          </button>
        )}
        {status === 'verified' && (
          <p className="mt-4 text-center text-green-600 font-medium">✅ 工单已完成验收闭环</p>
        )}
      </div>
    </div>
  )
}
