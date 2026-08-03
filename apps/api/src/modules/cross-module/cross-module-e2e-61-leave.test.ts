/**
 * 🦞 链61: Leave 请假考勤管理全链路闭环
 *
 * 路径: LeaveRequest (请假申请→审批→取消→统计)
 *       → HR (员工数据关联校验)
 *       → Notification (请假通知审批人)
 *       → Auth (租户隔离/角色权限检查)
 *       → Analytics (请假统计趋势分析)
 *
 * 覆盖模块: leave-request · hr · notification · auth (4 模块)
 * 新增角色: 👔店长(审批人), 🛒前台(员工), 🎮导玩员
 * 新增模式: 请假申请→审批→销假→统计→租户隔离 完整闭环
 *
 * Pulse-v23 新增 · 2026-07-21
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

// 请假类型
type LeaveType = 'ANNUAL' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'MARRIAGE' | 'BEREAVEMENT' | 'OTHER'

// 请假状态
type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

// 员工类型
type EmployeeStatus = 'active' | 'probation' | 'resigned'

interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  type: LeaveType
  status: LeaveStatus
  startDate: string
  endDate: string
  days: number
  reason: string
  approver: string
  approvedAt?: string
  remark?: string
  tenantId: string
  createdAt: string
}

interface Employee {
  id: string
  tenantId: string
  name: string
  department: string
  position: string
  status: EmployeeStatus
  phone: string
  email: string
  joinDate: string
}

interface Notification {
  id: string
  type: 'LEAVE_CREATED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'LEAVE_CANCELLED' | 'LEAVE_REMINDER'
  title: string
  message: string
  targetRole: string
  targetUser: string
  relatedId: string
  isRead: boolean
  createdAt: string
}

interface LeaveStats {
  total: number
  byStatus: Record<LeaveStatus, number>
  byType: Record<LeaveType, number>
  totalDays: number
  approvedDays: number
  pendingDays: number
  rejectionRate: number
  monthlyTrend: Array<{ month: string; count: number; days: number }>
  employeeStats: Array<{
    employeeId: string
    employeeName: string
    totalLeaves: number
    totalDays: number
    approvedLeaves: number
  }>
}

interface LeaveAnalyticsLog {
  tenantId: string
  action: string
  details: string
  at: string
}

// ═══════════════════════════════════════════════════════════════════════
// 仓储层（模拟 4 个模块的 in-memory store）
// ═══════════════════════════════════════════════════════════════════════

const leaveStore: LeaveRequest[] = []
const employeeStore: Employee[] = []
const notificationStore: Notification[] = []
const analyticsLog: LeaveAnalyticsLog[] = []
const actionLog: string[] = []

let seqId = 0
function nextId(prefix: string): string {
  seqId++
  return `${prefix}-${String(seqId).padStart(4, '0')}`
}
function now(): string {
  return new Date().toISOString()
}
function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
function monthAgo(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString().slice(0, 10)
}

function seedData() {
  leaveStore.length = 0
  employeeStore.length = 0
  notificationStore.length = 0
  analyticsLog.length = 0
  actionLog.length = 0
  seqId = 0

  // ── 种子员工数据 ──
  const seedEmployees: Employee[] = [
    { id: 'EMP-001', tenantId: 'tenant-001', name: '张三', department: '前台', position: '前台', status: 'active', phone: '13800000001', email: 'zhangsan@test.com', joinDate: '2025-01-15' },
    { id: 'EMP-002', tenantId: 'tenant-001', name: '李四', department: '技术部', position: '工程师', status: 'active', phone: '13800000002', email: 'lisi@test.com', joinDate: '2025-03-01' },
    { id: 'EMP-003', tenantId: 'tenant-001', name: '王五', department: '运营', position: '运营专员', status: 'active', phone: '13800000003', email: 'wangwu@test.com', joinDate: '2025-06-01' },
    { id: 'EMP-004', tenantId: 'tenant-001', name: '李经理', department: '管理', position: '店长', status: 'active', phone: '13800000004', email: 'manager@test.com', joinDate: '2024-01-01' },
    { id: 'EMP-005', tenantId: 'tenant-001', name: '孙七', department: '人事', position: 'HR专员', status: 'active', phone: '13800000005', email: 'sunqi@test.com', joinDate: '2024-06-01' },
    { id: 'EMP-006', tenantId: 'tenant-002', name: '陈一', department: '前台', position: '前台', status: 'active', phone: '13900000001', email: 'chenyi@other.com', joinDate: '2025-02-01' },
  ]
  for (const e of seedEmployees) {
    employeeStore.push(e)
  }

  // ── 种子请假数据 ──
  const seedLeaves: Array<{
    employeeId: string; employeeName: string; type: LeaveType; status: LeaveStatus
    startDate: string; endDate: string; days: number; reason: string
    approver: string; remark?: string; approvedAt?: string
  }> = [
    { employeeId: 'EMP-001', employeeName: '张三', type: 'ANNUAL', status: 'APPROVED', startDate: daysAgo(15), endDate: daysAgo(11), days: 5, reason: '年假旅行', approver: '李经理', remark: '已批准', approvedAt: daysAgo(16) },
    { employeeId: 'EMP-002', employeeName: '李四', type: 'SICK', status: 'APPROVED', startDate: daysAgo(5), endDate: daysAgo(4), days: 2, reason: '感冒', approver: '李经理', approvedAt: daysAgo(6) },
    { employeeId: 'EMP-003', employeeName: '王五', type: 'PERSONAL', status: 'PENDING', startDate: daysFromNow(3), endDate: daysFromNow(3), days: 1, reason: '家里有事', approver: '李经理' },
    { employeeId: 'EMP-001', employeeName: '张三', type: 'SICK', status: 'CANCELLED', startDate: daysAgo(20), endDate: daysAgo(19), days: 2, reason: '身体不适', approver: '李经理', remark: '已取消' },
    { employeeId: 'EMP-004', employeeName: '李经理', type: 'ANNUAL', status: 'REJECTED', startDate: daysAgo(10), endDate: daysAgo(6), days: 5, reason: '年假', approver: '总经理', remark: '驳回：该时段人手不足', approvedAt: daysAgo(11) },
    { employeeId: 'EMP-005', employeeName: '孙七', type: 'MATERNITY', status: 'APPROVED', startDate: daysFromNow(10), endDate: daysFromNow(101), days: 92, reason: '产假', approver: '人事部', approvedAt: daysAgo(1) },
    { employeeId: 'EMP-003', employeeName: '王五', type: 'BEREAVEMENT', status: 'APPROVED', startDate: daysAgo(2), endDate: daysAgo(0), days: 3, reason: '家人去世', approver: '李经理', approvedAt: daysAgo(3) },
  ]

  for (const l of seedLeaves) {
    leaveStore.push({
      id: nextId('leave'),
      tenantId: 'tenant-001',
      createdAt: l.approvedAt ?? daysAgo(6),
      ...l,
    })
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 模块函数（模拟 4 个模块的业务逻辑）
// ═══════════════════════════════════════════════════════════════════════

// ── 1. leave-request 模块 ──
function modLeave_create(params: {
  employeeId: string; employeeName: string; type: LeaveType
  startDate: string; endDate: string; days: number; reason: string
  approver: string; remark?: string; tenantId: string
}): LeaveRequest {
  const leave: LeaveRequest = {
    id: nextId('leave'),
    status: 'PENDING',
    tenantId: params.tenantId,
    createdAt: now(),
    employeeId: params.employeeId,
    employeeName: params.employeeName,
    type: params.type,
    startDate: params.startDate,
    endDate: params.endDate,
    days: params.days,
    reason: params.reason,
    approver: params.approver,
    remark: params.remark,
  }
  leaveStore.push(leave)
  actionLog.push(`[leave-request] 创建请假 #${leave.id}: ${params.employeeName}(${params.type}) ${params.days}天`)

  // 跨模块: 通知审批人
  notificationStore.push({
    id: nextId('notif'),
    type: 'LEAVE_CREATED',
    title: `📋 请假申请: ${params.employeeName}`,
    message: `${params.employeeName} 申请 ${params.days}天${params.type}，理由: ${params.reason}`,
    targetRole: '👔店长',
    targetUser: params.approver,
    relatedId: leave.id,
    isRead: false,
    createdAt: now(),
  })
  actionLog.push(`[通知] 发送请假通知给审批人 ${params.approver}`)

  // 跨模块: HR关联校验
  const employee = employeeStore.find((e) => e.id === params.employeeId && e.tenantId === params.tenantId)
  if (!employee) {
    actionLog.push(`[HR] ⚠️ 员工 ${params.employeeId} 在HR系统中不存在`)
  } else {
    actionLog.push(`[HR] ✅ 员工 ${params.employeeName} (${employee.department}) 身份确认`)
  }

  return leave
}

function modLeave_get(leaveId: string, tenantId: string): LeaveRequest | undefined {
  return leaveStore.find((l) => l.id === leaveId && l.tenantId === tenantId)
}

function modLeave_list(tenantId: string, filters?: {
  type?: LeaveType; status?: LeaveStatus; employeeId?: string
  fromDate?: string; toDate?: string
}): LeaveRequest[] {
  return leaveStore.filter((l) => {
    if (l.tenantId !== tenantId) return false
    if (filters?.type && l.type !== filters.type) return false
    if (filters?.status && l.status !== filters.status) return false
    if (filters?.employeeId && l.employeeId !== filters.employeeId) return false
    if (filters?.fromDate && l.startDate < filters.fromDate) return false
    if (filters?.toDate && l.endDate > filters.toDate) return false
    return true
  }).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

function modLeave_approve(leaveId: string, status: LeaveStatus, tenantId: string, remark?: string): LeaveRequest | null {
  const leave = modLeave_get(leaveId, tenantId)
  if (!leave) return null
  if (leave.status !== 'PENDING') return null

  const nowStr = now()
  leave.status = status
  leave.approvedAt = nowStr
  if (remark !== undefined) leave.remark = remark
  actionLog.push(`[leave-request] ${status === 'APPROVED' ? '批准' : '驳回'}请假 #${leaveId}`)

  // 跨模块: 通知员工审批结果
  const notifType = status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED'
  const title = status === 'APPROVED' ? '✅ 请假已批准' : '❌ 请假已驳回'
  notificationStore.push({
    id: nextId('notif'),
    type: notifType,
    title,
    message: `您的请假(${leave.type})已${status === 'APPROVED' ? '批准' : '驳回'}`,
    targetRole: '员工',
    targetUser: leave.employeeName,
    relatedId: leave.id,
    isRead: false,
    createdAt: now(),
  })
  actionLog.push(`[通知] 发送审批结果通知给员工 ${leave.employeeName}`)

  return leave
}

function modLeave_cancel(leaveId: string, tenantId: string): LeaveRequest | null {
  const leave = modLeave_get(leaveId, tenantId)
  if (!leave || leave.status !== 'PENDING') return null

  leave.status = 'CANCELLED'
  actionLog.push(`[leave-request] 取消请假 #${leaveId}`)

  notificationStore.push({
    id: nextId('notif'),
    type: 'LEAVE_CANCELLED',
    title: '↩️ 请假已取消',
    message: `${leave.employeeName} 取消了 ${leave.type}`,
    targetRole: '👔店长',
    targetUser: leave.approver,
    relatedId: leave.id,
    isRead: false,
    createdAt: now(),
  })
  return leave
}

function modLeave_getStats(tenantId: string): LeaveStats {
  const leaves = modLeave_list(tenantId)

  // byStatus
  const byStatus: Record<LeaveStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 }
  for (const l of leaves) byStatus[l.status]++

  // byType
  const byType: Record<LeaveType, number> = { ANNUAL: 0, SICK: 0, PERSONAL: 0, MATERNITY: 0, MARRIAGE: 0, BEREAVEMENT: 0, OTHER: 0 }
  for (const l of leaves) byType[l.type]++

  const totalDays = leaves.reduce((a, l) => a + l.days, 0)
  const approvedDays = leaves.filter((l) => l.status === 'APPROVED').reduce((a, l) => a + l.days, 0)
  const pendingDays = leaves.filter((l) => l.status === 'PENDING').reduce((a, l) => a + l.days, 0)

  const decidedCount = byStatus['APPROVED'] + byStatus['REJECTED']
  const rejectionRate = decidedCount > 0 ? byStatus['REJECTED'] / decidedCount : 0

  // monthlyTrend
  const monthMap = new Map<string, { count: number; days: number }>()
  for (const l of leaves) {
    const month = l.startDate.slice(0, 7)
    const cur = monthMap.get(month) ?? { count: 0, days: 0 }
    cur.count++
    cur.days += l.days
    monthMap.set(month, cur)
  }
  const monthlyTrend = Array.from(monthMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // employeeStats
  const empMap = new Map<string, { employeeId: string; employeeName: string; totalLeaves: number; totalDays: number; approvedLeaves: number }>()
  for (const l of leaves) {
    const cur = empMap.get(l.employeeId) ?? {
      employeeId: l.employeeId, employeeName: l.employeeName,
      totalLeaves: 0, totalDays: 0, approvedLeaves: 0,
    }
    cur.totalLeaves++
    cur.totalDays += l.days
    if (l.status === 'APPROVED') cur.approvedLeaves++
    empMap.set(l.employeeId, cur)
  }
  const employeeStats = Array.from(empMap.values()).sort((a, b) => b.totalDays - a.totalDays)

  actionLog.push(`[analytics] 请假统计: 总数=${leaves.length} 总天数=${totalDays} 驳回率=${(rejectionRate * 100).toFixed(1)}%`)

  return { total: leaves.length, byStatus, byType, totalDays, approvedDays, pendingDays, rejectionRate, monthlyTrend, employeeStats }
}

function modLeave_getPendingForApprover(tenantId: string, approver: string): LeaveRequest[] {
  return leaveStore.filter((l) => l.tenantId === tenantId && l.approver === approver && l.status === 'PENDING')
}

// ── 2. hr 模块 ──
function modHR_findEmployee(employeeId: string, tenantId: string): Employee | undefined {
  return employeeStore.find((e) => e.id === employeeId && e.tenantId === tenantId)
}

function modHR_validateEmployee(employeeId: string, tenantId: string): { valid: boolean; employee?: Employee; reason?: string } {
  const emp = modHR_findEmployee(employeeId, tenantId)
  if (!emp) return { valid: false, reason: '员工不存在' }
  if (emp.status === 'resigned') return { valid: false, reason: '员工已离职' }
  if (emp.status === 'probation') return { valid: true, employee: emp, reason: '试用期员工，需主管审批' }
  return { valid: true, employee: emp }
}

function modHR_getActiveEmployees(tenantId: string): Employee[] {
  return employeeStore.filter((e) => e.tenantId === tenantId && e.status === 'active')
}

// ── 3. notification 模块 ──
function modNotif_getByTarget(targetUser: string): Notification[] {
  return notificationStore.filter((n) => n.targetUser === targetUser)
}

function modNotif_getByType(tenantId: string, ...types: string[]): Notification[] {
  return notificationStore.filter((n) => types.includes(n.type))
}

function modNotif_markRead(notifId: string): boolean {
  const notif = notificationStore.find((n) => n.id === notifId)
  if (!notif) return false
  notif.isRead = true
  actionLog.push(`[通知] 标记已读: ${notifId}`)
  return true
}

function modNotif_getUnread(targetUser: string): Notification[] {
  return notificationStore.filter((n) => n.targetUser === targetUser && !n.isRead)
}

// ── 4. auth/role 模块 ──
type Role = '👔店长' | '🛒前台' | '🎮导玩员' | '👥HR' | '🔧安监' | '🎯运行专员'

const rolePermissions: Record<string, string[]> = {
  'leave:create': ['👔店长', '🛒前台', '🎮导玩员', '👥HR', '🔧安监', '🎯运行专员'],
  'leave:approve': ['👔店长'],
  'leave:list': ['👔店长', '👥HR'],
  'leave:stats': ['👔店长', '👥HR'],
  'leave:cancel-self': ['👔店长', '🛒前台', '🎮导玩员', '👥HR', '🔧安监', '🎯运行专员'],
  'leave:view-self': ['👔店长', '🛒前台', '🎮导玩员', '👥HR', '🔧安监', '🎯运行专员'],
}

function modRole_checkAccess(role: Role, resource: string): boolean {
  return rolePermissions[resource]?.includes(role) ?? false
}

// ═══════════════════════════════════════════════════════════════════════
// 测试
// ═══════════════════════════════════════════════════════════════════════

describe('🦞 链61 E2E: Leave 请假考勤管理全链路闭环', () => {
  const TENANT = 'tenant-001'
  const OTHER_TENANT = 'tenant-002'

  beforeAll(() => {
    seedData()
  })

  // ─────────────────────────────────────────────────────────────────
  // S1-S5: 正例场景
  // ─────────────────────────────────────────────────────────────────

  it('S1-正例: 前台员工创建请假 → 关联HR员工 → 通知审批人', () => {
    // 角色检查：前台可以创建请假
    assert.ok(modRole_checkAccess('🛒前台', 'leave:create'))

    // HR验证员工身份
    const validation = modHR_validateEmployee('EMP-001', TENANT)
    assert.equal(validation.valid, true)
    assert.equal(validation.employee?.name, '张三')
    assert.equal(validation.employee?.department, '前台')

    // 创建请假
    const leave = modLeave_create({
      employeeId: 'EMP-001',
      employeeName: '张三',
      type: 'ANNUAL',
      startDate: daysFromNow(5),
      endDate: daysFromNow(7),
      days: 3,
      reason: 'E2E测试年假申请',
      approver: '李经理',
      tenantId: TENANT,
    })

    assert.equal(leave.status, 'PENDING')
    assert.equal(leave.days, 3)
    assert.equal(leave.employeeId, 'EMP-001')
    assert.ok(leave.id.startsWith('leave-'))

    // 验证跨模块: 创建了通知给审批人
    const notifs = modNotif_getByTarget('李经理')
    assert.ok(notifs.some((n) => n.type === 'LEAVE_CREATED' && n.relatedId === leave.id))

    // 验证HR关联校验
    assert.ok(actionLog.some((l) => l.includes('[HR] ✅ 员工')))
    assert.ok(actionLog.some((l) => l.includes('[通知] 发送请假通知给审批人')))
  })

  it('S2-正例: 店长审批请假 → 批准 → 通知员工', () => {
    // 角色检查：只有店长可以审批
    assert.ok(modRole_checkAccess('👔店长', 'leave:approve'))
    assert.equal(modRole_checkAccess('🛒前台', 'leave:approve'), false)

    // 获取待审批列表
    const pending = modLeave_getPendingForApprover(TENANT, '李经理')
    assert.ok(pending.length >= 1)

    // 批准请假
    const approved = modLeave_approve(pending[0].id, 'APPROVED', TENANT, 'E2E批准测试')
    assert.ok(approved !== null)
    assert.equal(approved?.status, 'APPROVED')
    assert.ok(approved?.approvedAt)

    // 验证跨模块: 员工收到通知
    const employeeNotifs = modNotif_getByTarget(pending[0].employeeName)
    assert.ok(employeeNotifs.some((n) => n.type === 'LEAVE_APPROVED' && n.relatedId === pending[0].id))
  })

  it('S3-正例: 统计看板完整展示', () => {
    const stats = modLeave_getStats(TENANT)

    // 种子数据 7条 + S1创建的1条，减去S2批准的1条(其实S2批准的是刚才S1创建的)
    assert.ok(stats.total >= 7)
    assert.ok(stats.byStatus['APPROVED'] >= 1)
    assert.ok(stats.byStatus['PENDING'] >= 1)
    assert.ok(stats.byStatus['REJECTED'] >= 1)
    assert.ok(stats.byStatus['CANCELLED'] >= 1)

    // byType 多样性
    const typesWithData = Object.entries(stats.byType)
      .filter(([, count]) => count > 0)
      .map(([type]) => type)
    assert.ok(typesWithData.includes('ANNUAL'))
    assert.ok(typesWithData.includes('SICK'))
    assert.ok(typesWithData.includes('PERSONAL'))
    assert.ok(typesWithData.includes('MATERNITY'))

    // totalDays包含产假的92天
    assert.ok(stats.totalDays >= 100)
    assert.ok(stats.approvedDays >= 100)

    // rejectionRate
    assert.ok(stats.rejectionRate >= 0)

    // monthlyTrend
    assert.ok(stats.monthlyTrend.length >= 1)
    assert.ok(stats.monthlyTrend.every((m) => m.count > 0 && m.days > 0))

    // employeeStats
    assert.ok(stats.employeeStats.length >= 2)
    assert.ok(stats.employeeStats[0].totalDays >= stats.employeeStats[1].totalDays)

    // 验证 analytics 日志
    assert.ok(actionLog.some((l) => l.startsWith('[analytics]')))
  })

  it('S4-正例: 查询特定员工的请假记录', () => {
    const empLeaves = modLeave_list(TENANT, { employeeId: 'EMP-001' })
    assert.ok(empLeaves.length >= 2)
    assert.ok(empLeaves.every((l) => l.employeeId === 'EMP-001'))

    // 按类型筛选
    const annualLeaves = modLeave_list(TENANT, { employeeId: 'EMP-001', type: 'ANNUAL' })
    assert.ok(annualLeaves.every((l) => l.employeeId === 'EMP-001' && l.type === 'ANNUAL'))
  })

  it('S5-正例: 员工取消自己待审批的请假', () => {
    // 创建新请假
    const leave = modLeave_create({
      employeeId: 'EMP-002',
      employeeName: '李四',
      type: 'PERSONAL',
      startDate: daysFromNow(1),
      endDate: daysFromNow(1),
      days: 1,
      reason: '临时有事',
      approver: '李经理',
      tenantId: TENANT,
    })

    // 取消（只能取消失效的 PENDING 状态）
    const cancelled = modLeave_cancel(leave.id, TENANT)
    assert.ok(cancelled !== null)
    assert.equal(cancelled?.status, 'CANCELLED')

    // 已取消恢复出不可以取消
    const secondCancel = modLeave_cancel(leave.id, TENANT)
    assert.equal(secondCancel, null)

    // 验证通知
    const cancelNotifs = modNotif_getByTarget('李经理')
    assert.ok(cancelNotifs.some((n) => n.type === 'LEAVE_CANCELLED' && n.relatedId === leave.id))
  })

  // ─────────────────────────────────────────────────────────────────
  // S6-S10: 反例场景
  // ─────────────────────────────────────────────────────────────────

  it('S6-反例: 前台不能审批请假', () => {
    assert.equal(modRole_checkAccess('🛒前台', 'leave:approve'), false)
  })

  it('S7-反例: 已取消的请假不能再审批', () => {
    // 先取消一个 PENDING 状态的
    const pending = modLeave_getPendingForApprover(TENANT, '李经理')
    if (pending.length > 0) {
      const cancelled = modLeave_cancel(pending[0].id, TENANT)
      assert.ok(cancelled !== null)

      // 已取消的不能审批
      const rejectResult = modLeave_approve(pending[0].id, 'REJECTED', TENANT)
      assert.equal(rejectResult, null)
    }
  })

  it('S8-反例: 跨租户 — 看不到其他租户请假数据', () => {
    // tenant-001 有数据
    const t1Leaves = modLeave_list(TENANT)
    assert.ok(t1Leaves.length > 0)

    // tenant-002 没有种子数据
    const t2Leaves = modLeave_list(OTHER_TENANT)
    assert.equal(t2Leaves.length, 0)

    // tenant-001 的员工在 tenant-002 查不到
    const t2Emp = modHR_findEmployee('EMP-001', OTHER_TENANT)
    assert.equal(t2Emp, undefined)
  })

  it('S9-反例: HR不能执行审批（只有店长可审批）', () => {
    assert.equal(modRole_checkAccess('👥HR', 'leave:approve'), false)
  })

  it('S10-反例: 已离职员工不能请假', () => {
    // 标记员工为已离职
    const resignedEmp = employeeStore.find((e) => e.id === 'EMP-002' && e.tenantId === TENANT)
    if (resignedEmp) {
      const origStatus = resignedEmp.status
      resignedEmp.status = 'resigned'

      const validation = modHR_validateEmployee('EMP-002', TENANT)
      assert.equal(validation.valid, false)
      assert.equal(validation.reason, '员工已离职')

      // 恢复状态
      resignedEmp.status = origStatus
    }
  })

  // ─────────────────────────────────────────────────────────────────
  // S11-S15: 边界/边缘场景
  // ─────────────────────────────────────────────────────────────────

  it('S11-边界: 超长假期（产假92天）正确处理', () => {
    const maternityLeaves = modLeave_list(TENANT, { type: 'MATERNITY' })
    assert.ok(maternityLeaves.length >= 1)
    const maternity = maternityLeaves[0]
    assert.equal(maternity.type, 'MATERNITY')
    assert.equal(maternity.days, 92)
    assert.ok(maternity.startDate < maternity.endDate)
  })

  it('S12-边界: 1天短假期的创建和查询', () => {
    const leave = modLeave_create({
      employeeId: 'EMP-003',
      employeeName: '王五',
      type: 'PERSONAL',
      startDate: daysFromNow(1),
      endDate: daysFromNow(1),
      days: 1,
      reason: 'E2E测试1天事假',
      approver: '李经理',
      tenantId: TENANT,
    })
    assert.equal(leave.days, 1)
    assert.equal(leave.startDate, leave.endDate)

    // 查询校验
    const found = modLeave_get(leave.id, TENANT)
    assert.ok(found)
    assert.equal(found?.days, 1)
  })

  it('S13-边界: 通知标记已读', () => {
    const unread = modNotif_getUnread('李经理')
    assert.ok(unread.length >= 1)

    const marked = modNotif_markRead(unread[0].id)
    assert.ok(marked)

    const stillUnread = modNotif_getUnread('李经理')
    assert.ok(!stillUnread.some((n) => n.id === unread[0].id))
  })

  it('S14-边界: 按日期范围筛选请假', () => {
    const startDate = monthAgo(2)
    const endDate = daysFromNow(30)
    const range = modLeave_list(TENANT, { fromDate: startDate, toDate: endDate })
    assert.ok(range.length > 0)
    assert.ok(range.every((l) => l.startDate >= startDate && l.endDate <= endDate))
  })

  it('S15-边缘: 全链路审计日志存在', () => {
    // 验证关键跨模块交互产生了审计记录
    assert.ok(actionLog.some((l) => l.startsWith('[leave-request]')))
    assert.ok(actionLog.some((l) => l.startsWith('[通知]')))
    assert.ok(actionLog.some((l) => l.startsWith('[HR]')))
    assert.ok(actionLog.some((l) => l.startsWith('[analytics]')))
  })
})
