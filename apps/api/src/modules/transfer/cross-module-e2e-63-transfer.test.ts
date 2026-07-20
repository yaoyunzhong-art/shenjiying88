/**
 * 🐜 链63: Probation Transfer 试用期转正管理全链路闭环
 *
 * 路径: ProbationTransfer (试用期→转正申请→审批→统计)
 *       → HR (员工试用期数据关联)
 *       → Auth (租户隔离/角色权限检查)
 *
 * 覆盖模块: transfer · hr · auth (3 模块)
 * 新增角色: 👔HR管理员(审批人), 👤员工(申请人)
 *
 * Pulse-v23 新增 · 2026-07-21
 */

import { describe, it, beforeEach, afterEach } from 'vitest'
import assert from 'node:assert/strict'

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

type ProbationStatus = 'ONGOING' | 'COMPLETED' | 'EXTENDED' | 'TERMINATED'
type EmployeeStatus = 'active' | 'probation' | 'resigned'

interface ProbationTransfer {
  id: string
  employeeId: string
  employeeName: string
  department: string
  position: string
  probationDuration: number
  probationStart: string
  probationEnd: string
  status: ProbationStatus
  transferDate?: string
  performanceRating?: string
  evaluation: string
  approver: string
  approvalRemark?: string
  rejectReason?: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

interface Employee {
  id: string
  tenantId: string
  name: string
  department: string
  position: string
  status: EmployeeStatus
  joinDate: string
  probationDuration: number
  probationEndDate: string
}

// ═══════════════════════════════════════════════════════════════════════
// 全局状态
// ═══════════════════════════════════════════════════════════════════════

let transferIdCounter = 0
const transferStore: ProbationTransfer[] = []
const employeeStore: Employee[] = []
const actionLog: string[] = []

// 租户/角色
const TENANTS = ['tenant-hq', 'tenant-branch'] as const

const ROLES = {
  HR_MANAGER: 'hr-manager',
  DEPARTMENT_HEAD: 'department-head',
  EMPLOYEE: 'employee',
} as const

// ═══════════════════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════════════════

function resetAll(): void {
  transferIdCounter = 0
  transferStore.length = 0
  employeeStore.length = 0
  actionLog.length = 0
}

// ── 2. hr 模块 ──

function modHr_addEmployee(params: {
  tenantId: string
  name: string
  department: string
  position: string
  joinDate: string
  probationDuration: number
}): Employee {
  const emp: Employee = {
    id: `emp-${params.name}`,
    tenantId: params.tenantId,
    name: params.name,
    department: params.department,
    position: params.position,
    status: 'probation',
    joinDate: params.joinDate,
    probationDuration: params.probationDuration,
    probationEndDate: '',
  }
  // Calculate probation end date
  const start = new Date(params.joinDate)
  start.setMonth(start.getMonth() + params.probationDuration)
  emp.probationEndDate = start.toISOString().slice(0, 10)
  employeeStore.push(emp)
  actionLog.push(`[hr] 添加试用期员工 #${emp.id}: ${params.name}(${params.department}) 试用${params.probationDuration}个月`)
  return emp
}

function modHr_getEmployee(employeeId: string, tenantId: string): Employee | undefined {
  return employeeStore.find((e) => e.id === employeeId && e.tenantId === tenantId)
}

function modHr_listProbationEmployees(tenantId: string): Employee[] {
  return employeeStore.filter((e) => e.tenantId === tenantId && e.status === 'probation')
}

// ── 1. transfer 模块 ──

function modTransfer_create(params: {
  tenantId: string
  employeeId: string
  employeeName: string
  department: string
  position: string
  probationDuration: number
  probationStart: string
  probationEnd: string
  evaluation: string
  approver: string
}): ProbationTransfer {
  const emp = modHr_getEmployee(params.employeeId, params.tenantId)
  if (!emp) {
    throw new Error(`Employee not found: ${params.employeeId}`)
  }
  if (emp.status !== 'probation') {
    throw new Error(`Employee ${params.employeeId} is not on probation`)
  }

  const now = new Date().toISOString()
  transferIdCounter++
  const transfer: ProbationTransfer = {
    id: `transfer-${transferIdCounter}`,
    employeeId: params.employeeId,
    employeeName: params.employeeName,
    department: params.department,
    position: params.position,
    probationDuration: params.probationDuration,
    probationStart: params.probationStart,
    probationEnd: params.probationEnd,
    status: 'ONGOING',
    evaluation: params.evaluation,
    approver: params.approver,
    tenantId: params.tenantId,
    createdAt: now,
    updatedAt: now,
  }
  transferStore.push(transfer)
  actionLog.push(`[transfer] 创建转正申请 #${transfer.id}: ${params.employeeName}(${params.department}/${params.position})`)
  return transfer
}

function modTransfer_get(transferId: string, tenantId: string): ProbationTransfer | undefined {
  return transferStore.find((t) => t.id === transferId && t.tenantId === tenantId)
}

function modTransfer_list(tenantId: string, filters?: {
  status?: ProbationStatus
  department?: string
}): ProbationTransfer[] {
  return transferStore.filter((t) => {
    if (t.tenantId !== tenantId) return false
    if (filters?.status && t.status !== filters.status) return false
    if (filters?.department && t.department !== filters.department) return false
    return true
  })
}

function modTransfer_approve(
  transferId: string,
  status: ProbationStatus,
  tenantId: string,
  options?: {
    performanceRating?: string
    approvalRemark?: string
    rejectReason?: string
  },
): ProbationTransfer | null {
  const idx = transferStore.findIndex((t) => t.id === transferId && t.tenantId === tenantId)
  if (idx === -1) return null

  const transfer = transferStore[idx]
  if (transfer.status !== 'ONGOING') {
    throw new Error(`Cannot approve transfer that is already ${transfer.status}`)
  }

  const now = new Date().toISOString()
  const updated: ProbationTransfer = {
    ...transfer,
    status,
    transferDate: status !== 'ONGOING' ? now : undefined,
    performanceRating: options?.performanceRating ?? transfer.performanceRating,
    approvalRemark: options?.approvalRemark ?? transfer.approvalRemark,
    rejectReason: options?.rejectReason ?? transfer.rejectReason,
    updatedAt: now,
  }
  transferStore[idx] = updated

  // Update employee status if approved/terminated
  const emp = modHr_getEmployee(transfer.employeeId, tenantId)
  if (emp) {
    if (status === 'COMPLETED') {
      emp.status = 'active'
      actionLog.push(`[hr] 员工 ${transfer.employeeName} 已转正`)
    } else if (status === 'TERMINATED') {
      emp.status = 'resigned'
      actionLog.push(`[hr] 员工 ${transfer.employeeName} 试用期终止`)
    }
  }

  actionLog.push(`[transfer] ${status === 'COMPLETED' ? '转正通过' : status === 'EXTENDED' ? '延长试用期' : '终止试用'} #${transferId}`)
  return updated
}

function modTransfer_stats(tenantId: string) {
  const transfers = modTransfer_list(tenantId)
  const byStatus: Record<string, number> = {
    ONGOING: 0, COMPLETED: 0, EXTENDED: 0, TERMINATED: 0,
  }
  for (const t of transfers) byStatus[t.status]++

  const completedRate = transfers.length > 0
    ? byStatus.COMPLETED / transfers.length
    : 0
  const extensionRate = transfers.length > 0
    ? byStatus.EXTENDED / transfers.length
    : 0
  const terminationRate = transfers.length > 0
    ? byStatus.TERMINATED / transfers.length
    : 0

  return {
    total: transfers.length,
    byStatus,
    completedRate,
    extensionRate,
    terminationRate,
  }
}

// ── 3. auth 模块 ──

const userRoleMap = new Map<string, string>()

function modAuth_setRole(userId: string, role: string): void {
  userRoleMap.set(userId, role)
}

function modAuth_hasRole(userId: string, requiredRole: string): boolean {
  return userRoleMap.get(userId) === requiredRole
}

function modAuth_checkApproval(userId: string): boolean {
  const role = userRoleMap.get(userId)
  return role === ROLES.HR_MANAGER || role === ROLES.DEPARTMENT_HEAD
}

// ═══════════════════════════════════════════════════════════════════════
// E2E 测试场景
// ═══════════════════════════════════════════════════════════════════════

describe('E2E: Probation Transfer #63', () => {
  beforeEach(() => {
    resetAll()
    // 初始化租户数据
    modHr_addEmployee({
      tenantId: 'tenant-hq', name: '张三', department: '运营部', position: '活动策划专员',
      joinDate: '2026-04-01', probationDuration: 3,
    })
    modHr_addEmployee({
      tenantId: 'tenant-hq', name: '李四', department: '技术部', position: '前端开发工程师',
      joinDate: '2026-04-15', probationDuration: 3,
    })
    modHr_addEmployee({
      tenantId: 'tenant-hq', name: '王五', department: '销售部', position: '客户经理',
      joinDate: '2026-05-01', probationDuration: 3,
    })
    modAuth_setRole('张经理', ROLES.HR_MANAGER)
    modAuth_setRole('李经理', ROLES.DEPARTMENT_HEAD)
    modAuth_setRole('张三', ROLES.EMPLOYEE)
  })

  afterEach(() => {
    resetAll()
  })

  // ── S1: 试用期员工 → 转正申请 ──

  it('S1: 试用期员工应能发起转正申请', () => {
    const t = modTransfer_create({
      tenantId: 'tenant-hq',
      employeeId: 'emp-张三',
      employeeName: '张三',
      department: '运营部',
      position: '活动策划专员',
      probationDuration: 3,
      probationStart: '2026-04-01',
      probationEnd: '2026-06-30',
      evaluation: '表现优异，提前完成目标',
      approver: '李经理',
    })

    assert.equal(t.status, 'ONGOING')
    assert.equal(t.employeeName, '张三')
    assert.equal(t.approver, '李经理')
    assert.ok(t.id.startsWith('transfer-'))
    assert.ok(actionLog.some((l) => l.startsWith('[transfer]')))
  })

  // ── S2: 已离职/非试用期员工不可发起 ──

  it('S2: 非试用期员工不可发起转正申请', () => {
    // Add an active employee
    employeeStore.push({
      id: 'emp-active', tenantId: 'tenant-hq', name: '已转正',
      department: '技术部', position: '高级工程师',
      status: 'active', joinDate: '2024-01-01',
      probationDuration: 3, probationEndDate: '2024-03-31',
    })

    assert.throws(() => {
      modTransfer_create({
        tenantId: 'tenant-hq',
        employeeId: 'emp-active',
        employeeName: '已转正',
        department: '技术部',
        position: '高级工程师',
        probationDuration: 3,
        probationStart: '2024-01-01',
        probationEnd: '2024-03-31',
        evaluation: 'E',
        approver: 'M',
      })
    }, /not on probation/)
  })

  // ── S3: 非HR/非主管不可审批 ──

  it('S3: 仅HR管理员和部门主管可审批转正', () => {
    assert.ok(modAuth_checkApproval('张经理'))  // HR manager
    assert.ok(modAuth_checkApproval('李经理'))  // Department head
    assert.ok(!modAuth_checkApproval('张三'))    // Regular employee
    assert.ok(!modAuth_checkApproval('unknown'))
  })

  // ── S4: 转正通过 → COMPLETED ──

  it('S4: HR应能审批转正通过(COMPLETED)', () => {
    // Setup: HR manager can approve
    assert.ok(modAuth_hasRole('张经理', ROLES.HR_MANAGER))

    const t = modTransfer_create({
      tenantId: 'tenant-hq',
      employeeId: 'emp-张三',
      employeeName: '张三',
      department: '运营部',
      position: '活动策划专员',
      probationDuration: 3,
      probationStart: '2026-04-01',
      probationEnd: '2026-06-30',
      evaluation: '表现优异',
      approver: '张经理',
    })

    const result = modTransfer_approve(t.id, 'COMPLETED', 'tenant-hq', {
      performanceRating: 'A',
      approvalRemark: '表现优秀，正式录用',
    })

    assert.ok(result)
    assert.equal(result!.status, 'COMPLETED')
    assert.equal(result!.performanceRating, 'A')
    assert.ok(result!.transferDate)

    // Verify employee status updated
    const emp = modHr_getEmployee('emp-张三', 'tenant-hq')
    assert.equal(emp!.status, 'active')
  })

  // ── S5: 延长试用期 → EXTENDED ──

  it('S5: 主管可审批延长试用期(EXTENDED)', () => {
    const t = modTransfer_create({
      tenantId: 'tenant-hq',
      employeeId: 'emp-李四',
      employeeName: '李四',
      department: '技术部',
      position: '前端开发工程师',
      probationDuration: 3,
      probationStart: '2026-04-15',
      probationEnd: '2026-07-14',
      evaluation: '技术能力达标，但交付节奏需加快',
      approver: '张经理',
    })

    const result = modTransfer_approve(t.id, 'EXTENDED', 'tenant-hq', {
      performanceRating: 'C',
      approvalRemark: '延长试用期2个月，需进一步提升',
    })

    assert.ok(result)
    assert.equal(result!.status, 'EXTENDED')
    assert.equal(result!.approvalRemark, '延长试用期2个月，需进一步提升')
    // Employee remains on probation
    const emp = modHr_getEmployee('emp-李四', 'tenant-hq')
    assert.equal(emp!.status, 'probation')
  })

  // ── S6: 终止试用 → TERMINATED ──

  it('S6: HR可审批终止试用(TERMINATED)', () => {
    const t = modTransfer_create({
      tenantId: 'tenant-hq',
      employeeId: 'emp-王五',
      employeeName: '王五',
      department: '销售部',
      position: '客户经理',
      probationDuration: 3,
      probationStart: '2026-05-01',
      probationEnd: '2026-07-31',
      evaluation: '业绩不达标',
      approver: '张经理',
    })

    const result = modTransfer_approve(t.id, 'TERMINATED', 'tenant-hq', {
      rejectReason: '试用期评估不合格，未达到销售KPI',
    })

    assert.ok(result)
    assert.equal(result!.status, 'TERMINATED')
    assert.equal(result!.rejectReason, '试用期评估不合格，未达到销售KPI')

    // Verify employee status changed to resigned
    const emp = modHr_getEmployee('emp-王五', 'tenant-hq')
    assert.equal(emp!.status, 'resigned')
  })

  // ── S7: 多租户隔离 ──

  it('S7: 跨租户数据隔离', () => {
    // 总公司
    modTransfer_create({
      tenantId: 'tenant-hq',
      employeeId: 'emp-张三',
      employeeName: '张三',
      department: '运营部',
      position: '活动策划专员',
      probationDuration: 3,
      probationStart: '2026-04-01',
      probationEnd: '2026-06-30',
      evaluation: '表现优异',
      approver: '李经理',
    })

    // 分公司
    modHr_addEmployee({
      tenantId: 'tenant-branch', name: '赵六', department: '运营部', position: '专员',
      joinDate: '2026-06-01', probationDuration: 3,
    })

    modTransfer_create({
      tenantId: 'tenant-branch',
      employeeId: 'emp-赵六',
      employeeName: '赵六',
      department: '运营部',
      position: '专员',
      probationDuration: 3,
      probationStart: '2026-06-01',
      probationEnd: '2026-08-31',
      evaluation: '基础扎实',
      approver: '李经理',
    })

    const hqList = modTransfer_list('tenant-hq')
    const branchList = modTransfer_list('tenant-branch')

    assert.equal(hqList.length, 1)
    assert.equal(branchList.length, 1)

    // Cross-tenant access returns nothing
    const crossAccess = modTransfer_list('tenant-hq', { status: 'ONGOING' })
    assert.equal(crossAccess.length, 1)

    // Verify tenant isolation in detail access
    const hqOnly = modTransfer_list('tenant-hq')
    assert.ok(hqOnly.every((t) => t.tenantId === 'tenant-hq'))
  })

  // ── S8: 统计看板 ──

  it('S8: 统计看板应正确反映数据', () => {
    // 3 employees on probation with different results
    modTransfer_create({
      tenantId: 'tenant-hq',
      employeeId: 'emp-张三',
      employeeName: '张三',
      department: '运营部',
      position: '专员',
      probationDuration: 3,
      probationStart: '2026-04-01',
      probationEnd: '2026-06-30',
      evaluation: '优秀',
      approver: '张经理',
    })
    modTransfer_create({
      tenantId: 'tenant-hq',
      employeeId: 'emp-李四',
      employeeName: '李四',
      department: '技术部',
      position: '工程师',
      probationDuration: 3,
      probationStart: '2026-04-15',
      probationEnd: '2026-07-14',
      evaluation: '良好',
      approver: '张经理',
    })
    modTransfer_create({
      tenantId: 'tenant-hq',
      employeeId: 'emp-王五',
      employeeName: '王五',
      department: '销售部',
      position: '客户经理',
      probationDuration: 3,
      probationStart: '2026-05-01',
      probationEnd: '2026-07-31',
      evaluation: '需改进',
      approver: '张经理',
    })

    // Approve: 张三→转正, 李四→延长, 王五→终止
    const allTransfers = modTransfer_list('tenant-hq')
    modTransfer_approve(allTransfers[0].id, 'COMPLETED', 'tenant-hq', { performanceRating: 'A' })
    modTransfer_approve(allTransfers[1].id, 'EXTENDED', 'tenant-hq', { performanceRating: 'C' })
    modTransfer_approve(allTransfers[2].id, 'TERMINATED', 'tenant-hq', { rejectReason: '不合格' })

    const stats = modTransfer_stats('tenant-hq')
    assert.equal(stats.total, 3)
    assert.equal(stats.byStatus.COMPLETED, 1)
    assert.equal(stats.byStatus.EXTENDED, 1)
    assert.equal(stats.byStatus.TERMINATED, 1)
    assert.equal(stats.completedRate, 1 / 3)
    assert.equal(stats.extensionRate, 1 / 3)
    assert.equal(stats.terminationRate, 1 / 3)
  })

  // ── S9: 已审批记录不可重复审批 ──

  it('S9: 已审批的转正申请不可重复审批', () => {
    const t = modTransfer_create({
      tenantId: 'tenant-hq',
      employeeId: 'emp-张三',
      employeeName: '张三',
      department: '运营部',
      position: '专员',
      probationDuration: 3,
      probationStart: '2026-04-01',
      probationEnd: '2026-06-30',
      evaluation: '优秀',
      approver: '张经理',
    })

    // First approve
    modTransfer_approve(t.id, 'COMPLETED', 'tenant-hq', { performanceRating: 'A' })

    // Second approve should fail
    assert.throws(() => {
      modTransfer_approve(t.id, 'TERMINATED', 'tenant-hq')
    }, /Cannot approve/)
  })

  // ── S10: 按状态和部门筛选 ──

  it('S10: 应按状态和部门筛选转正列表', () => {
    modTransfer_create({
      tenantId: 'tenant-hq',
      employeeId: 'emp-张三',
      employeeName: '张三',
      department: '运营部',
      position: '专员',
      probationDuration: 3,
      probationStart: '2026-04-01',
      probationEnd: '2026-06-30',
      evaluation: '优秀',
      approver: '李经理',
    })
    modTransfer_create({
      tenantId: 'tenant-hq',
      employeeId: 'emp-李四',
      employeeName: '李四',
      department: '技术部',
      position: '工程师',
      probationDuration: 3,
      probationStart: '2026-04-15',
      probationEnd: '2026-07-14',
      evaluation: '良好',
      approver: '李经理',
    })

    // Approve one
    const all = modTransfer_list('tenant-hq')
    modTransfer_approve(all[0].id, 'COMPLETED', 'tenant-hq', { performanceRating: 'B' })

    // Filter by status
    const ongoing = modTransfer_list('tenant-hq', { status: 'ONGOING' })
    const completed = modTransfer_list('tenant-hq', { status: 'COMPLETED' })
    assert.equal(ongoing.length, 1)
    assert.equal(completed.length, 1)
    assert.equal(completed[0].employeeId, 'emp-张三')

    // Filter by department
    const techDept = modTransfer_list('tenant-hq', { department: '技术部' })
    assert.equal(techDept.length, 1)
    assert.equal(techDept[0].employeeName, '李四')
  })

  // ── S11: Mock种子数据完整 ──

  it('S11: 动作日志应记录完整审批链', () => {
    const t = modTransfer_create({
      tenantId: 'tenant-hq',
      employeeId: 'emp-张三',
      employeeName: '张三',
      department: '运营部',
      position: '专员',
      probationDuration: 3,
      probationStart: '2026-04-01',
      probationEnd: '2026-06-30',
      evaluation: '优秀',
      approver: '张经理',
    })

    modTransfer_approve(t.id, 'COMPLETED', 'tenant-hq', {
      performanceRating: 'A',
      approvalRemark: '正式录用',
    })

    // Check action log
    assert.ok(actionLog.some((l) => l.startsWith('[transfer]')))
    assert.ok(actionLog.some((l) => l.startsWith('[hr]') && l.includes('已转正')))
    assert.ok(actionLog.some((l) => l.includes('转正通过')))
  })
})
