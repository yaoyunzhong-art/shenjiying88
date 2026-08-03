export type EmployeeStatus = 'on' | 'off' | 'leave'

export interface Employee {
  id: string
  name: string
  role: string
  status: EmployeeStatus
  phone: string
  shift: string
  joinDate: string
  skills: string[]
  performance?: string
  attendance?: number
  emergency?: string
}

export interface StaffDistributionItem {
  label: string
  count: number
}

export interface StaffScheduleItem {
  shift: string
  count: number
}

export interface StaffSummary {
  totalEmployees: number
  onDuty: number
  leaveCount: number
  avgAttendance: number
  scheduledToday: number
  roleCount: number
}

export interface StaffSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-staff-mock'
  storeId: string
  employees: Employee[]
  roles: string[]
  roleDistribution: StaffDistributionItem[]
  todaySchedule: StaffScheduleItem[]
  summary: StaffSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const STAFF_EMPLOYEES: Employee[] = [
  { id: 'E001', name: '张三', role: '店长', status: 'on', phone: '138****1100', shift: '09:00-18:00', joinDate: '2024-03', skills: ['管理', '收银'], performance: 'A', attendance: 98, emergency: '李丽 138****0099' },
  { id: 'E002', name: '李四', role: '收银员', status: 'on', phone: '138****2200', shift: '09:00-18:00', joinDate: '2024-05', skills: ['收银', '接待'], performance: 'B', attendance: 95, emergency: '王刚 138****0088' },
  { id: 'E003', name: '王五', role: '导玩员', status: 'on', phone: '138****3300', shift: '14:00-22:00', joinDate: '2024-06', skills: ['设备引导', '活动'], performance: 'A', attendance: 97, emergency: '赵母 138****0077' },
  { id: 'E004', name: '赵六', role: '技术员', status: 'leave', phone: '138****4400', shift: '09:00-18:00', joinDate: '2024-04', skills: ['维修', '巡检'], performance: 'A', attendance: 100, emergency: '刘姐 138****0066' },
  { id: 'E005', name: '刘七', role: '收银员', status: 'off', phone: '138****5500', shift: '14:00-22:00', joinDate: '2024-07', skills: ['收银'], performance: 'B', attendance: 92, emergency: '刘父 138****0055' },
  { id: 'E006', name: '陈八', role: '保洁', status: 'on', phone: '138****6600', shift: '06:00-15:00', joinDate: '2024-02', skills: ['清洁'], performance: 'A', attendance: 99, emergency: '陈子 138****0044' },
  { id: 'E007', name: '周九', role: '导玩员', status: 'on', phone: '138****7700', shift: '09:00-18:00', joinDate: '2024-08', skills: ['设备引导', '销售'], performance: 'B', attendance: 94, emergency: '周某某 138****0033' },
  { id: 'E008', name: '吴十', role: '收银员', status: 'on', phone: '138****8800', shift: '06:00-15:00', joinDate: '2024-09', skills: ['收银', '接待'], performance: 'B', attendance: 90, emergency: '吴某某 138****0022' },
  { id: 'E009', name: '郑一', role: '导玩员', status: 'off', phone: '138****9900', shift: '14:00-22:00', joinDate: '2024-10', skills: ['活动', '销售'], performance: 'C', attendance: 85, emergency: '郑某某 138****0011' },
]

export function buildRoleDistribution(
  employees: Employee[]
): StaffDistributionItem[] {
  const roleCounter = employees.reduce<Record<string, number>>((current, item) => {
    current[item.role] = (current[item.role] || 0) + 1
    return current
  }, {})

  return Object.entries(roleCounter)
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
}

export function buildTodaySchedule(
  employees: Employee[]
): StaffScheduleItem[] {
  const shifts = ['06:00-15:00', '09:00-18:00', '14:00-22:00']

  return shifts.map((shift) => ({
    shift,
    count: employees.filter((item) => item.shift === shift && item.status !== 'leave').length,
  }))
}

export function buildStaffSummary(
  employees: Employee[],
  roleDistribution: StaffDistributionItem[],
  todaySchedule: StaffScheduleItem[]
): StaffSummary {
  return {
    totalEmployees: employees.length,
    onDuty: employees.filter((item) => item.status === 'on').length,
    leaveCount: employees.filter((item) => item.status === 'leave').length,
    avgAttendance: employees.length
      ? Math.round(
          employees.reduce((sum, item) => sum + (item.attendance || 0), 0) / employees.length
        )
      : 0,
    scheduledToday: todaySchedule.reduce((sum, item) => sum + item.count, 0),
    roleCount: roleDistribution.length,
  }
}

export async function loadStaffSnapshot(
  storeId: string
): Promise<StaffSnapshot> {
  const employees = STAFF_EMPLOYEES.map((item) => ({ ...item, skills: [...item.skills] }))
  const roleDistribution = buildRoleDistribution(employees)
  const todaySchedule = buildTodaySchedule(employees)

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-staff-mock',
    storeId,
    employees,
    roles: ['全部', '店长', '收银员', '导玩员', '技术员', '保洁'],
    roleDistribution,
    todaySchedule,
    summary: buildStaffSummary(employees, roleDistribution, todaySchedule),
    generatedAt: '2026-07-27T16:50:00.000Z',
    controlPlaneSource: 'loadStaffSnapshot -> STAFF_EMPLOYEES + buildRoleDistribution + buildTodaySchedule',
    businessDataSource: 'local staff roster samples + derived attendance/schedule summary',
    refreshPath: `StaffPage -> loadStaffSnapshot(${storeId})`,
    note: '当前门店员工页消费本地 staff snapshot loader，已显式暴露来源态、刷新路径与 mock 边界，不作为真实 HR 主数据凭据。',
    error: '门店员工控制面尚未接入真实排班与人事系统，当前展示 mock 快照。',
  }
}
