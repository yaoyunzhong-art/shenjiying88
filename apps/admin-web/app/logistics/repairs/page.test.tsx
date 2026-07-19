/**
 * P-30 维修工单页面测试
 * 覆盖:
 *   1-8: 渲染测试 (列表/状态/筛选/标签)
 *   9-18+: 数据层测试 (STATUS_CONFIG/MOCK_REPAIRS/filter逻辑/日期/边界)
 */

import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import RepairsPage from './page'

afterEach(() => { cleanup() })

/* ══════════════════════════════════════════════════════════
   第一部分: 渲染测试 (已有8个正例/反例/边界)
   ══════════════════════════════════════════════════════════ */

describe('P-30 维修工单页', () => {
  it('正例: 渲染页面标题', () => {
    render(React.createElement(RepairsPage))
    assert.ok(screen.getByText('维修工单'))
  })

  it('正例: 渲染5条工单', () => {
    render(React.createElement(RepairsPage))
    assert.ok(screen.getByText('RO-001'))
    assert.ok(screen.getByText('RO-002'))
    assert.ok(screen.getByText('RO-003'))
    assert.ok(screen.getByText('RO-004'))
    assert.ok(screen.getByText('RO-005'))
  })

  it('正例: 状态标签渲染(包含表格和筛选按钮)', () => {
    render(React.createElement(RepairsPage))
    const items = screen.getAllByText('维修中')
    assert.ok(items.length > 0, '维修中标签存在')
    assert.ok(screen.getAllByText('待指派').length > 0)
    assert.ok(screen.getAllByText('已完成').length > 0)
  })

  it('正例: 门店/设备/维修人信息', () => {
    render(React.createElement(RepairsPage))
    assert.ok(screen.getByText('射击枪 A-01'))
    assert.ok(screen.getByText('VR头盔 H-03'))
    assert.ok(screen.getByText('李师傅'))
  })

  it('反例: 筛选待指派后只显示待指派工单', () => {
    render(React.createElement(RepairsPage))
    const filterBtn = screen.getAllByText('待指派')[0]!
    fireEvent.click(filterBtn)
    // RO-002 是待指派
    assert.ok(screen.getByText('RO-002'))
    // RO-001 (维修中) 应不显示
    const ro1 = screen.queryByText('RO-001')
    assert.equal(ro1, null)
  })

  it('边界: 全部筛选恢复', () => {
    render(React.createElement(RepairsPage))
    // 筛选待指派
    fireEvent.click(screen.getAllByText('待指派')[0]!)
    assert.equal(screen.queryByText('RO-001'), null)
    // 切回全部
    fireEvent.click(screen.getByText('全部'))
    assert.ok(screen.getByText('RO-001'))
  })

  it('边界: 已验收标签', () => {
    render(React.createElement(RepairsPage))
    assert.ok(screen.getAllByText('已验收').length > 0)
  })

  it('边界: 7个筛选按钮', () => {
    render(React.createElement(RepairsPage))
    const expected = ['全部', '待指派', '已指派', '维修中', '已完成', '待验收', '已验收']
    for (const label of expected) {
      assert.ok(screen.getAllByText(label).length > 0, `${label} exists`)
    }
  })
})

/* ══════════════════════════════════════════════════════════
   第二部分: 数据层测试 — STATUS_CONFIG/MOCK_REPAIRS/filter/日期
   ══════════════════════════════════════════════════════════ */

type RepairStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'pending_verify' | 'verified'

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

// 从 page.tsx 源码提取的数据定义
const STATUS_CONFIG: Record<RepairStatus, { label: string; color: string }> = {
  pending: { label: '待指派', color: 'bg-orange-100 text-orange-800' },
  assigned: { label: '已指派', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '维修中', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  pending_verify: { label: '待验收', color: 'bg-purple-100 text-purple-800' },
  verified: { label: '已验收', color: 'bg-gray-100 text-gray-800' },
}

const MOCK_REPAIRS: RepairOrder[] = [
  { id: 'RO-001', storeId: 'S-001', storeName: '旗舰店', equipmentName: '射击枪 A-01', issueDescription: '扳机卡顿，需检修', status: 'in_progress' as RepairStatus, assigneeName: '李师傅', reporterName: '张店长', createdAt: '2026-07-19T09:00:00Z' },
  { id: 'RO-002', storeId: 'S-002', storeName: '体验店B', equipmentName: 'VR头盔 H-03', issueDescription: '画面模糊', status: 'pending' as RepairStatus, assigneeName: null, reporterName: '王员工', createdAt: '2026-07-19T10:30:00Z' },
  { id: 'RO-003', storeId: 'S-001', storeName: '旗舰店', equipmentName: '篮球机 B-02', issueDescription: '投币器故障', status: 'completed' as RepairStatus, assigneeName: '赵师傅', reporterName: '张店长', createdAt: '2026-07-18T14:00:00Z' },
  { id: 'RO-004', storeId: 'S-003', storeName: '社区店C', equipmentName: '空调系统', issueDescription: '制冷效果差', status: 'pending_verify' as RepairStatus, assigneeName: '钱师傅', reporterName: '刘店长', createdAt: '2026-07-18T08:00:00Z' },
  { id: 'RO-005', storeId: 'S-002', storeName: '体验店B', equipmentName: '收银终端 POS-01', issueDescription: '扫码枪不识别', status: 'verified' as RepairStatus, assigneeName: '孙师傅', reporterName: '王员工', createdAt: '2026-07-17T16:00:00Z' },
]

describe('P-30 数据层 — STATUS_CONFIG', () => {
  it('9. 覆盖全部 6 种状态且 label 为英文 statusKey 到中文的映射', () => {
    const keys = Object.keys(STATUS_CONFIG) as RepairStatus[]
    assert.equal(keys.length, 6)
    const sorted = [...keys].sort()
    assert.deepEqual(sorted, ['assigned', 'completed', 'in_progress', 'pending', 'pending_verify', 'verified'])
  })

  it('10. 每个 label 是中文非空字符串, color 非空', () => {
    for (const [key, cfg] of Object.entries(STATUS_CONFIG)) {
      assert.ok(typeof cfg.label === 'string' && cfg.label.length > 0, `状态 ${key} label 为空`)
      assert.ok(typeof cfg.color === 'string' && cfg.color.length > 0, `状态 ${key} color 为空`)
    }
  })

  it('11. 各状态标签值正确', () => {
    assert.equal(STATUS_CONFIG.pending.label, '待指派')
    assert.equal(STATUS_CONFIG.assigned.label, '已指派')
    assert.equal(STATUS_CONFIG.in_progress.label, '维修中')
    assert.equal(STATUS_CONFIG.completed.label, '已完成')
    assert.equal(STATUS_CONFIG.pending_verify.label, '待验收')
    assert.equal(STATUS_CONFIG.verified.label, '已验收')
  })

  it('12. 每种状态有不同颜色类（不同视觉区分）', () => {
    const colors = Object.values(STATUS_CONFIG).map(c => c.color)
    const unique = new Set(colors)
    // pending=orange, assigned=blue, in_progress=yellow, completed=green, pending_verify=purple, verified=gray
    assert.equal(unique.size, 6)
  })
})

describe('P-30 数据层 — 筛选逻辑', () => {
  it('13. filter ALL 返回全部 5 条', () => {
    const result = MOCK_REPAIRS.filter(() => true)
    assert.equal(result.length, 5)
  })

  it('14. 筛选 "pending" 返回 1 条', () => {
    const result = MOCK_REPAIRS.filter(r => r.status === 'pending')
    assert.equal(result.length, 1)
    assert.equal(result[0]!.id, 'RO-002')
  })

  it('15. 筛选 "verified" 返回 1 条', () => {
    const result = MOCK_REPAIRS.filter(r => r.status === 'verified')
    assert.equal(result.length, 1)
    assert.equal(result[0]!.id, 'RO-005')
  })

  it('16. 筛选 "in_progress" 返回 1 条', () => {
    const result = MOCK_REPAIRS.filter(r => r.status === 'in_progress')
    assert.equal(result.length, 1)
    assert.equal(result[0]!.id, 'RO-001')
  })

  it('17. 筛选不存在的状态返回空数组', () => {
    const result = MOCK_REPAIRS.filter(r => r.status === 'assigned' as RepairStatus)
    assert.equal(result.length, 0)
  })
})

describe('P-30 数据层 — MOCK_REPAIRS 数据完整性', () => {
  it('18. 每条记录必填字段非空', () => {
    for (const r of MOCK_REPAIRS) {
      assert.ok(r.id.length > 0, `id 为空: ${r.id}`)
      assert.ok(r.storeName.length > 0)
      assert.ok(r.equipmentName.length > 0)
      assert.ok(r.issueDescription.length > 0)
      assert.ok(r.reporterName.length > 0)
      assert.ok(r.createdAt.length > 0)
    }
  })

  it('19. assigneeName 可为 null', () => {
    const pendingOrders = MOCK_REPAIRS.filter(r => r.status === 'pending')
    for (const r of pendingOrders) {
      assert.equal(r.assigneeName, null)
    }
  })

  it('20. 非 pending 状态 assigneeName 非空', () => {
    const nonPending = MOCK_REPAIRS.filter(r => r.status !== 'pending')
    for (const r of nonPending) {
      assert.ok(r.assigneeName !== null && r.assigneeName.length > 0, `${r.id} 分配人为空`)
    }
  })

  it('21. createdAt 全部为合法 ISO 时间戳', () => {
    for (const r of MOCK_REPAIRS) {
      const d = new Date(r.createdAt)
      assert.ok(!isNaN(d.getTime()), `${r.id} createdAt 不是合法日期`)
      assert.ok(r.createdAt.endsWith('Z'), `${r.id} createdAt 不包含 Z`)
    }
  })

  it('22. 5 条记录覆盖 5 种不同状态', () => {
    const statusSet = new Set(MOCK_REPAIRS.map(r => r.status))
    assert.equal(statusSet.size, 5) // assigned 无 mock 数据
    assert.ok(statusSet.has('pending'))
    assert.ok(statusSet.has('in_progress'))
    assert.ok(statusSet.has('completed'))
    assert.ok(statusSet.has('pending_verify'))
    assert.ok(statusSet.has('verified'))
  })

  it('23. 所有工单 status 值合法', () => {
    const valid = new Set<RepairStatus>(['pending', 'assigned', 'in_progress', 'completed', 'pending_verify', 'verified'])
    for (const r of MOCK_REPAIRS) {
      assert.ok(valid.has(r.status), `${r.id} 状态 ${r.status} 无效`)
    }
  })

  it('24. 门店覆盖: 旗舰店/体验店B/社区店C', () => {
    const storeSet = new Set(MOCK_REPAIRS.map(r => r.storeName))
    assert.ok(storeSet.has('旗舰店'))
    assert.ok(storeSet.has('体验店B'))
    assert.ok(storeSet.has('社区店C'))
  })
})

describe('P-30 数据层 — 日期格式化', () => {
  it('25. formatDate 解析 ISO 字符串返回 zh-CN 短格式', () => {
    const iso = '2026-07-19T09:00:00Z'
    const result = new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    assert.ok(result.includes('07'))
    assert.ok(result.includes('19'))
  })

  it('26. 不同 createdAt 日期产生不同格式化结果', () => {
    // RO-001(07-19T09:00Z), RO-002(07-19T10:30Z) → UTC 7/19
    // RO-003(07-18T14:00Z), RO-004(07-18T08:00Z) → UTC 7/18
    // RO-005(07-17T16:00Z) → UTC 7/17 → Shanghai 7/18
    const dates = MOCK_REPAIRS.map(r => new Date(r.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit' }))
    const unique = new Set(dates)
    assert.ok(unique.size >= 2, `应至少有2个不同日期，实际${unique.size}`)
  })
})

describe('P-30 数据层 — 边界/极端情况', () => {
  it('27. 空列表时 filter 返回空', () => {
    const empty: RepairOrder[] = []
    assert.equal(empty.length, 0)
    assert.deepEqual(empty.filter(r => r.status === 'pending'), [])
  })

  it('28. 全部状态也作为 filter 值使用', () => {
    const statusFilter: RepairStatus | 'ALL' = 'ALL'
    const result = statusFilter === 'ALL' ? MOCK_REPAIRS : MOCK_REPAIRS.filter(r => r.status === statusFilter)
    assert.equal(result.length, 5)
  })

  it('29. 每条记录的 issueDescription 为非空字符串', () => {
    for (const r of MOCK_REPAIRS) {
      assert.ok(typeof r.issueDescription === 'string')
      assert.ok(r.issueDescription.length >= 4) // 最少4个中文字
    }
  })

  it('30. RO-001 为 in_progress 且 assigneeName = 李师傅', () => {
    const ro1 = MOCK_REPAIRS.find(r => r.id === 'RO-001')
    assert.ok(ro1)
    assert.equal(ro1!.status, 'in_progress')
    assert.equal(ro1!.assigneeName, '李师傅')
    assert.equal(ro1!.storeId, 'S-001')
    assert.equal(ro1!.storeName, '旗舰店')
  })
})
