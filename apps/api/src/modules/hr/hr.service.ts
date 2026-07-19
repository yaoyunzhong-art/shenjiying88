import { randomUUID } from 'node:crypto'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'

// ── Type definitions ──

export type EmployeeStatus = 'active' | 'probation' | 'resigned'
export type AttendanceType = 'check-in' | 'check-out' | 'late' | 'early-leave' | 'absent' | 'overtime'

export interface Employee {
  id: string
  tenantId: string
  name: string
  department: string
  position: string
  status: EmployeeStatus
  phone: string
  email: string
  joinDate: string
  emergencyContact?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface AttendanceRecord {
  id: string
  tenantId: string
  employeeId: string
  date: string
  type: AttendanceType
  time: string
  note?: string
  createdAt: string
}

export interface Contract {
  id: string
  tenantId: string
  employeeId: string
  type: 'full-time' | 'part-time' | 'fixed-term' | 'probation'
  startDate: string
  endDate: string
  salary: number
  status: 'active' | 'expired' | 'terminated'
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface OnboardingRecord {
  id: string
  tenantId: string
  employeeId: string
  plannedDate: string
  completedDate?: string
  mentor?: string
  status: 'pending' | 'completed' | 'cancelled'
  checklist: string[]
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface OffboardingRecord {
  id: string
  tenantId: string
  employeeId: string
  resignationDate: string
  lastWorkingDate: string
  reason: string
  type: 'voluntary' | 'involuntary' | 'retirement'
  status: 'pending' | 'approved' | 'completed'
  checklist: string[]
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface HrStats {
  totalEmployees: number
  active: number
  probation: number
  resigned: number
  departmentCounts: Record<string, number>
}

export interface AttendanceStats {
  total: number
  checkIns: number
  checkOuts: number
  late: number
  earlyLeave: number
  absent: number
  overtime: number
}

const DEPARTMENTS = ['技术部', '运营部', '市场部', '财务部', '人事部', '客服部', '门店管理']

// ── In-memory store ──

const employeeStore = new Map<string, Employee>()
const attendanceStore = new Map<string, AttendanceRecord>()
const contractStore = new Map<string, Contract>()
const onboardingStore = new Map<string, OnboardingRecord>()
const offboardingStore = new Map<string, OffboardingRecord>()
let seeded = false

function seedData(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'

  interface SeedEmployee {
    name: string
    department: string
    position: string
    status: EmployeeStatus
    phone: string
    email: string
    joinDate: string
    emergencyContact?: string
  }

  const employees: SeedEmployee[] = [
    { name: '张三', department: '技术部', position: '技术总监', status: 'active', phone: '13800138001', email: 'zhangsan@company.com', joinDate: '2022-03-01', emergencyContact: '李四 13900139001' },
    { name: '李四', department: '技术部', position: '高级工程师', status: 'active', phone: '13800138002', email: 'lisi@company.com', joinDate: '2023-06-15', emergencyContact: '张三 13900139002' },
    { name: '王五', department: '运营部', position: '运营总监', status: 'active', phone: '13800138003', email: 'wangwu@company.com', joinDate: '2023-01-10' },
    { name: '赵六', department: '市场部', position: '市场专员', status: 'probation', phone: '13800138004', email: 'zhaoliu@company.com', joinDate: '2026-05-01', emergencyContact: '王五 13900139004' },
    { name: '钱七', department: '门店管理', position: '区域店长', status: 'resigned', phone: '13800138005', email: 'qianqi@company.com', joinDate: '2021-09-01' },
    { name: '孙八', department: '客服部', position: '客服主管', status: 'active', phone: '13800138006', email: 'sunba@company.com', joinDate: '2024-03-20', emergencyContact: '赵六 13900139006' },
    { name: '周九', department: '技术部', position: '前端开发', status: 'active', phone: '13800138007', email: 'zhoujiu@company.com', joinDate: '2025-11-01' },
    { name: '吴十', department: '人事部', position: 'HR经理', status: 'probation', phone: '13800138008', email: 'wushi@company.com', joinDate: '2026-04-15', emergencyContact: '孙八 13900139008' },
    { name: '郑冬', department: '财务部', position: '财务主管', status: 'active', phone: '13800138009', email: 'zhengdong@company.com', joinDate: '2024-07-01' },
    { name: '冯夏', department: '运营部', position: '运营专员', status: 'active', phone: '13800138010', email: 'fengxia@company.com', joinDate: '2025-02-10', emergencyContact: '王五 13900139010' },
  ]

  for (const e of employees) {
    const now = new Date().toISOString()
    const employee: Employee = {
      id: `E${String(employeeStore.size + 1).padStart(3, '0')}`,
      tenantId: tenant,
      ...e,
      createdAt: now,
      updatedAt: now,
    }
    employeeStore.set(employee.id, employee)
  }
}

@Injectable()
export class HrService implements OnModuleInit {
  private readonly logger = new Logger(HrService.name)

  onModuleInit(): void {
    seedData()
    this.logger.log(`Seeded ${employeeStore.size} employees`)
  }

  // ─────────────────────────────────────────────────────────────────
  // Employee CRUD
  // ─────────────────────────────────────────────────────────────────

  create(input: {
    tenantId: string
    name: string
    department: string
    position: string
    phone: string
    email: string
    joinDate: string
    emergencyContact?: string
    remark?: string
  }): Employee {
    const now = new Date().toISOString()
    const maxNum = Array.from(employeeStore.values())
      .map(e => parseInt(e.id.replace('E', ''), 10))
      .reduce((max, n) => Math.max(max, n), 0)
    const employee: Employee = {
      id: `E${String(maxNum + 1).padStart(3, '0')}`,
      tenantId: input.tenantId,
      name: input.name,
      department: input.department,
      position: input.position,
      status: 'probation',
      phone: input.phone,
      email: input.email,
      joinDate: input.joinDate,
      emergencyContact: input.emergencyContact,
      remark: input.remark,
      createdAt: now,
      updatedAt: now,
    }
    employeeStore.set(employee.id, employee)
    return employee
  }

  findAll(tenantId: string, filter?: {
    department?: string
    status?: EmployeeStatus | 'all'
    search?: string
  }): Employee[] {
    seedData()
    return Array.from(employeeStore.values())
      .filter(e => e.tenantId === tenantId)
      .filter(e => filter?.department && filter.department !== 'all' ? e.department === filter.department : true)
      .filter(e => filter?.status && filter.status !== 'all' ? e.status === filter.status : true)
      .filter(e => {
        if (!filter?.search) return true
        const q = filter.search.toLowerCase()
        return (
          e.name.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.phone.includes(q) ||
          e.email.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  }

  findById(id: string, tenantId: string): Employee | undefined {
    seedData()
    const emp = employeeStore.get(id)
    if (!emp || emp.tenantId !== tenantId) return undefined
    return emp
  }

  update(
    id: string,
    tenantId: string,
    input: Partial<Omit<Employee, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Employee {
    const emp = this.requireEmployee(id, tenantId)
    const now = new Date().toISOString()
    if (input.name !== undefined) emp.name = input.name
    if (input.department !== undefined) emp.department = input.department
    if (input.position !== undefined) emp.position = input.position
    if (input.status !== undefined) emp.status = input.status
    if (input.phone !== undefined) emp.phone = input.phone
    if (input.email !== undefined) emp.email = input.email
    if (input.joinDate !== undefined) emp.joinDate = input.joinDate
    if (input.emergencyContact !== undefined) emp.emergencyContact = input.emergencyContact
    if (input.remark !== undefined) emp.remark = input.remark
    emp.updatedAt = now
    employeeStore.set(id, emp)
    return emp
  }

  delete(id: string, tenantId: string): void {
    this.requireEmployee(id, tenantId)
    employeeStore.delete(id)
  }

  // ─────────────────────────────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────────────────────────────

  getStats(tenantId: string): HrStats {
    seedData()
    const employees = Array.from(employeeStore.values()).filter(e => e.tenantId === tenantId)
    const departmentCounts: Record<string, number> = {}
    for (const e of employees) {
      departmentCounts[e.department] = (departmentCounts[e.department] || 0) + 1
    }
    return {
      totalEmployees: employees.length,
      active: employees.filter(e => e.status === 'active').length,
      probation: employees.filter(e => e.status === 'probation').length,
      resigned: employees.filter(e => e.status === 'resigned').length,
      departmentCounts,
    }
  }

  getDepartments(): string[] {
    return [...DEPARTMENTS]
  }

  // ─────────────────────────────────────────────────────────────────
  // Attendance
  // ─────────────────────────────────────────────────────────────────

  recordAttendance(input: {
    tenantId: string
    employeeId: string
    date: string
    type: AttendanceType
    time: string
    note?: string
  }): AttendanceRecord {
    this.requireEmployee(input.employeeId, input.tenantId)
    const now = new Date().toISOString()
    const record: AttendanceRecord = {
      id: `att-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      date: input.date,
      type: input.type,
      time: input.time,
      note: input.note,
      createdAt: now,
    }
    attendanceStore.set(record.id, record)
    return record
  }

  getAttendance(employeeId: string, tenantId: string, filter?: {
    startDate?: string
    endDate?: string
  }): AttendanceRecord[] {
    this.requireEmployee(employeeId, tenantId)
    return Array.from(attendanceStore.values())
      .filter(a => a.employeeId === employeeId && a.tenantId === tenantId)
      .filter(a => filter?.startDate ? a.date >= filter.startDate : true)
      .filter(a => filter?.endDate ? a.date <= filter.endDate : true)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  getAttendanceStats(employeeId: string, tenantId: string): AttendanceStats {
    const records = this.getAttendance(employeeId, tenantId)
    return {
      total: records.length,
      checkIns: records.filter(r => r.type === 'check-in').length,
      checkOuts: records.filter(r => r.type === 'check-out').length,
      late: records.filter(r => r.type === 'late').length,
      earlyLeave: records.filter(r => r.type === 'early-leave').length,
      absent: records.filter(r => r.type === 'absent').length,
      overtime: records.filter(r => r.type === 'overtime').length,
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Contract management
  // ─────────────────────────────────────────────────────────────────

  getContracts(employeeId: string, tenantId: string): Contract[] {
    this.requireEmployee(employeeId, tenantId)
    return Array.from(contractStore.values())
      .filter(c => c.employeeId === employeeId && c.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  createContract(input: {
    tenantId: string
    employeeId: string
    type: Contract['type']
    startDate: string
    endDate: string
    salary: number
    remark?: string
  }): Contract {
    this.requireEmployee(input.employeeId, input.tenantId)
    const now = new Date().toISOString()
    const contract: Contract = {
      id: `ctr-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      salary: input.salary,
      status: 'active',
      remark: input.remark,
      createdAt: now,
      updatedAt: now,
    }
    contractStore.set(contract.id, contract)
    return contract
  }

  renewContract(contractId: string, tenantId: string, input: {
    startDate: string
    endDate: string
    salary: number
  }): Contract {
    const contract = Array.from(contractStore.values())
      .find(c => c.id === contractId && c.tenantId === tenantId)
    if (!contract) throw new Error(`Contract not found: ${contractId}`)
    const now = new Date().toISOString()
    contract.startDate = input.startDate
    contract.endDate = input.endDate
    contract.salary = input.salary
    contract.status = 'active'
    contract.updatedAt = now
    contractStore.set(contract.id, contract)
    return contract
  }

  // ─────────────────────────────────────────────────────────────────
  // Onboarding
  // ─────────────────────────────────────────────────────────────────

  onboard(input: {
    tenantId: string
    employeeId: string
    plannedDate: string
    mentor?: string
    checklist?: string[]
    remark?: string
  }): OnboardingRecord {
    this.requireEmployee(input.employeeId, input.tenantId)
    const now = new Date().toISOString()
    const record: OnboardingRecord = {
      id: `onb-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      plannedDate: input.plannedDate,
      mentor: input.mentor,
      status: 'pending',
      checklist: input.checklist ?? ['IT设备领用', '工位分配', '公司制度学习', '导师分配'],
      remark: input.remark,
      createdAt: now,
      updatedAt: now,
    }
    onboardingStore.set(record.id, record)
    // Change employee status to probation
    this.update(input.employeeId, input.tenantId, { status: 'probation' })
    return record
  }

  getOnboardingList(tenantId: string): OnboardingRecord[] {
    return Array.from(onboardingStore.values())
      .filter(o => o.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // ─────────────────────────────────────────────────────────────────
  // Offboarding
  // ─────────────────────────────────────────────────────────────────

  offboard(input: {
    tenantId: string
    employeeId: string
    resignationDate: string
    lastWorkingDate: string
    reason: string
    type: OffboardingRecord['type']
    checklist?: string[]
    remark?: string
  }): OffboardingRecord {
    this.requireEmployee(input.employeeId, input.tenantId)
    const now = new Date().toISOString()
    const record: OffboardingRecord = {
      id: `offb-${randomUUID().slice(0, 8)}`,
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      resignationDate: input.resignationDate,
      lastWorkingDate: input.lastWorkingDate,
      reason: input.reason,
      type: input.type,
      status: 'pending',
      checklist: input.checklist ?? ['工作交接', '资产归还', '账号注销', '离职证明'],
      remark: input.remark,
      createdAt: now,
      updatedAt: now,
    }
    offboardingStore.set(record.id, record)
    // Change employee status to resigned
    this.update(input.employeeId, input.tenantId, { status: 'resigned' })
    return record
  }

  getOffboardingList(tenantId: string): OffboardingRecord[] {
    return Array.from(offboardingStore.values())
      .filter(o => o.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // ─────────────────────────────────────────────────────────────────
  // Internals
  // ─────────────────────────────────────────────────────────────────

  private requireEmployee(id: string, tenantId: string): Employee {
    const emp = employeeStore.get(id)
    if (!emp || emp.tenantId !== tenantId) {
      throw new Error(`Employee not found: ${id}`)
    }
    return emp
  }
}
