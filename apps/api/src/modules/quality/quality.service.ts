import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { QualityInspectionService } from '../quality-inspection/quality-inspection.service'
import {
  PatrolTask,
  PatrolTaskStatus,
  PatrolTaskPriority,
  PatrolArea,
  PatrolTaskCheckItem,
  RectificationRecord,
  RectificationStatus,
  RectificationAction,
  Severity,
} from './quality.entity'

// ── In-memory stores ──

const patrolStore = new Map<string, PatrolTask>()
const rectificationStore = new Map<string, RectificationRecord>()

// ── Seed data ──

let seeded = false

function seedMockData(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'

  // ── Patrol tasks ──

  const mockPatrolTasks: Array<{
    patrolNo: string
    title: string
    description: string
    area: PatrolArea
    priority: PatrolTaskPriority
    status: PatrolTaskStatus
    assignedTo: string
    scheduledAt: string
    notes?: string
  }> = [
    {
      patrolNo: 'PT-2026-0001',
      title: '月度消防安全巡查',
      description: '检查灭火器、烟感、消防通道、应急灯是否正常',
      area: PatrolArea.Kitchen,
      priority: PatrolTaskPriority.High,
      status: PatrolTaskStatus.Completed,
      assignedTo: '张安全',
      scheduledAt: '2026-07-01T09:00:00.000Z',
      notes: '灭火器更新标签已更换',
    },
    {
      patrolNo: 'PT-2026-0002',
      title: '后厨卫生突击检查',
      description: '检查后厨卫生标准执行情况、食材存储条件、灭蝇灯运行',
      area: PatrolArea.Kitchen,
      priority: PatrolTaskPriority.High,
      status: PatrolTaskStatus.Completed,
      assignedTo: '王卫生',
      scheduledAt: '2026-07-03T10:00:00.000Z',
    },
    {
      patrolNo: 'PT-2026-0003',
      title: '仓库温湿度巡检',
      description: '检查制冷设备运行状态、温湿度记录、货物堆放规范',
      area: PatrolArea.Warehouse,
      priority: PatrolTaskPriority.Medium,
      status: PatrolTaskStatus.Completed,
      assignedTo: '李仓库',
      scheduledAt: '2026-07-05T14:00:00.000Z',
      notes: '冷冻库温度偏高，已报修',
    },
    {
      patrolNo: 'PT-2026-0004',
      title: '设备间安全检查',
      description: '检查配电箱、电气线路、接地保护、绝缘工具',
      area: PatrolArea.EquipmentRoom,
      priority: PatrolTaskPriority.Urgent,
      status: PatrolTaskStatus.InProgress,
      assignedTo: '陈电工',
      scheduledAt: '2026-07-08T08:30:00.000Z',
    },
    {
      patrolNo: 'PT-2026-0005',
      title: '每周食品安全巡查',
      description: '检查食材保质期、冷藏温度、生熟分离、清洗消毒记录',
      area: PatrolArea.Kitchen,
      priority: PatrolTaskPriority.High,
      status: PatrolTaskStatus.Pending,
      assignedTo: '张安全',
      scheduledAt: '2026-07-22T09:00:00.000Z',
    },
    {
      patrolNo: 'PT-2026-0006',
      title: '疫情防控专项巡查',
      description: '检查消毒记录、体温检测、口罩佩戴、通风情况',
      area: PatrolArea.DiningHall,
      priority: PatrolTaskPriority.Medium,
      status: PatrolTaskStatus.Pending,
      assignedTo: '赵防控',
      scheduledAt: '2026-07-25T10:00:00.000Z',
    },
    {
      patrolNo: 'PT-2026-0007',
      title: '消防通道专项检查',
      description: '检查所有安全出口是否畅通、应急照明是否正常',
      area: PatrolArea.Entrance,
      priority: PatrolTaskPriority.High,
      status: PatrolTaskStatus.Pending,
      assignedTo: '张安全',
      scheduledAt: '2026-07-28T08:00:00.000Z',
    },
    {
      patrolNo: 'PT-2026-0008',
      title: '洗手间卫生巡查',
      description: '检查洗手间清洁、消毒频率、设施完好性',
      area: PatrolArea.Restroom,
      priority: PatrolTaskPriority.Low,
      status: PatrolTaskStatus.Cancelled,
      assignedTo: '刘清洁',
      scheduledAt: '2026-07-10T11:00:00.000Z',
      notes: '因门店装修取消',
    },
  ]

  for (const p of mockPatrolTasks) {
    const checkItems: PatrolTaskCheckItem[] = [
      {
        id: `item-${randomUUID()}`,
        name: '设备运行状态',
        standard: '所有设备正常运行无异常',
        result: p.status === PatrolTaskStatus.Completed ? 'PASS' : undefined,
        checkedAt: p.status === PatrolTaskStatus.Completed ? p.scheduledAt : undefined,
      },
      {
        id: `item-${randomUUID()}`,
        name: '环境卫生',
        standard: '区域整洁无异味无杂物',
        result: p.status === PatrolTaskStatus.Completed ? 'PASS' : undefined,
        checkedAt: p.status === PatrolTaskStatus.Completed ? p.scheduledAt : undefined,
      },
      {
        id: `item-${randomUUID()}`,
        name: '安全隐患',
        standard: '无可见安全隐患',
        result: p.status === PatrolTaskStatus.Completed ? 'PASS' : undefined,
        checkedAt: p.status === PatrolTaskStatus.Completed ? p.scheduledAt : undefined,
      },
    ]

    const task: PatrolTask = {
      id: `patrol-${randomUUID()}`,
      patrolNo: p.patrolNo,
      title: p.title,
      description: p.description,
      area: p.area,
      priority: p.priority,
      status: p.status,
      checkItems,
      assignedTo: p.assignedTo,
      scheduledAt: p.scheduledAt,
      completedAt: p.status === PatrolTaskStatus.Completed ? p.scheduledAt : undefined,
      notes: p.notes,
      tenantId: tenant,
      createdAt: p.scheduledAt,
      updatedAt: p.scheduledAt,
    }
    patrolStore.set(task.id, task)
  }

  // ── Rectification records ──

  const mockRectificationRecords: Array<{
    rectificationNo: string
    sourceInspectionId: string
    sourceInspectNo: string
    title: string
    description: string
    status: RectificationStatus
    severity: Severity
    responsiblePerson: string
    deadline: string
    notes?: string
  }> = [
    {
      rectificationNo: 'REC-2026-0001',
      sourceInspectionId: 'inspect-seed-fail-001',
      sourceInspectNo: 'IQC-2026-0002',
      title: 'ABS塑料颗粒色差杂质问题整改',
      description: '供应商提供颜色偏差超标、杂质含量超标的ABS塑料颗粒需全数退回并更新检验标准',
      status: RectificationStatus.Closed,
      severity: Severity.Critical,
      responsiblePerson: '李采购',
      deadline: '2026-07-09T00:00:00.000Z',
      notes: '供应商已更换批次，复检通过',
    },
    {
      rectificationNo: 'REC-2026-0002',
      sourceInspectionId: 'inspect-seed-fail-002',
      sourceInspectNo: 'OQC-2026-0002',
      title: '智能手环功能失效整改',
      description: '心率监测功能失效、电池续航不足标称值50%，需全部返工',
      status: RectificationStatus.Verified,
      severity: Severity.Critical,
      responsiblePerson: '刘生产',
      deadline: '2026-07-12T00:00:00.000Z',
      notes: '返工完成待抽检验证',
    },
    {
      rectificationNo: 'REC-2026-0003',
      sourceInspectionId: 'inspect-seed-fail-003',
      sourceInspectNo: 'FQC-2026-0002',
      title: '空调扇噪音及振动超标整改',
      description: '运行噪音超标20dB，机身振动幅度过大，退回生产线调整',
      status: RectificationStatus.InProgress,
      severity: Severity.Critical,
      responsiblePerson: '吴生产',
      deadline: '2026-07-20T00:00:00.000Z',
    },
    {
      rectificationNo: 'REC-2026-0004',
      sourceInspectionId: 'inspect-seed-cond-001',
      sourceInspectNo: 'IQC-2026-0003',
      title: '精密轴承表面光洁度降级处理',
      description: '表面光洁度不达标，评估降级使用（特采处理）',
      status: RectificationStatus.Resolved,
      severity: Severity.Major,
      responsiblePerson: '张质检',
      deadline: '2026-07-06T00:00:00.000Z',
      notes: '已评估特采方案，降级为B类使用',
    },
    {
      rectificationNo: 'REC-2026-0005',
      sourceInspectionId: 'inspect-seed-cond-002',
      sourceInspectNo: 'IPQC-2026-0002',
      title: '注塑件飞边毛刺修整',
      description: '飞边毛刺需修整处理后复检',
      status: RectificationStatus.Open,
      severity: Severity.Major,
      responsiblePerson: '孙注塑',
      deadline: '2026-07-25T00:00:00.000Z',
    },
    {
      rectificationNo: 'REC-2026-0006',
      sourceInspectionId: 'inspect-seed-fail-005',
      sourceInspectNo: 'IQC-2026-0006',
      title: '冷冻三文鱼温控问题',
      description: '中心温度超标、解冻后重量与标称不符，整批拒收',
      status: RectificationStatus.Closed,
      severity: Severity.Critical,
      responsiblePerson: '曹采购',
      deadline: '2026-07-17T00:00:00.000Z',
      notes: '供应商已重新发货，物流全程温控',
    },
  ]

  for (const r of mockRectificationRecords) {
    const actions: RectificationAction[] = [
      {
        id: `action-${randomUUID()}`,
        description: `分析整改原因并制定方案`,
        assignee: r.responsiblePerson,
        deadline: r.deadline,
        status: r.status === RectificationStatus.Open ? 'PENDING' : 'COMPLETED',
        completedAt: r.status !== RectificationStatus.Open ? r.deadline : undefined,
      },
      {
        id: `action-${randomUUID()}`,
        description: `执行整改措施`,
        assignee: r.responsiblePerson,
        deadline: r.deadline,
        status: r.status === RectificationStatus.Closed || r.status === RectificationStatus.Verified ? 'COMPLETED' : 'PENDING',
        completedAt: r.status === RectificationStatus.Closed ? r.deadline : undefined,
      },
    ]

    const record: RectificationRecord = {
      id: `rect-${randomUUID()}`,
      rectificationNo: r.rectificationNo,
      sourceInspectionId: r.sourceInspectionId,
      sourceInspectNo: r.sourceInspectNo,
      title: r.title,
      description: r.description,
      status: r.status,
      severity: r.severity,
      responsiblePerson: r.responsiblePerson,
      actions,
      deadline: r.deadline,
      resolvedAt: r.status === RectificationStatus.Resolved || r.status === RectificationStatus.Closed || r.status === RectificationStatus.Verified
        ? r.deadline : undefined,
      verifiedBy: r.status === RectificationStatus.Verified || r.status === RectificationStatus.Closed ? '周验证员' : undefined,
      verifiedAt: r.status === RectificationStatus.Verified || r.status === RectificationStatus.Closed ? r.deadline : undefined,
      notes: r.notes,
      tenantId: tenant,
      createdAt: r.deadline,
      updatedAt: r.deadline,
    }
    rectificationStore.set(record.id, record)
  }
}

@Injectable()
export class QualityService {
  constructor(private readonly inspectionService: QualityInspectionService) {}

  // ═══════════════════════════════════════════════════════════════════
  // Delegation to QualityInspectionService
  // ═══════════════════════════════════════════════════════════════════

  get inspection(): QualityInspectionService {
    return this.inspectionService
  }

  // ═══════════════════════════════════════════════════════════════════
  // PatrolTask CRUD
  // ═══════════════════════════════════════════════════════════════════

  createPatrolTask(input: {
    tenantId: string
    patrolNo: string
    title: string
    description: string
    area: PatrolArea
    priority: PatrolTaskPriority
    checkItems: Array<{ name: string; standard: string }>
    assignedTo: string
    scheduledAt: string
    notes?: string
  }): PatrolTask {
    const now = new Date().toISOString()

    const checkItems: PatrolTaskCheckItem[] = input.checkItems.map((c) => ({
      id: `item-${randomUUID()}`,
      name: c.name,
      standard: c.standard,
    }))

    const task: PatrolTask = {
      id: `patrol-${randomUUID()}`,
      patrolNo: input.patrolNo,
      title: input.title,
      description: input.description,
      area: input.area,
      priority: input.priority,
      status: PatrolTaskStatus.Pending,
      checkItems,
      assignedTo: input.assignedTo,
      scheduledAt: input.scheduledAt,
      notes: input.notes,
      tenantId: input.tenantId,
      createdAt: now,
      updatedAt: now,
    }
    patrolStore.set(task.id, task)
    return task
  }

  getPatrolTask(patrolId: string, tenantId: string): PatrolTask | undefined {
    const task = patrolStore.get(patrolId)
    if (!task || task.tenantId !== tenantId) return undefined
    return task
  }

  listPatrolTasks(
    tenantId: string,
    filter?: {
      status?: PatrolTaskStatus
      area?: PatrolArea
      priority?: PatrolTaskPriority
      assignedTo?: string
      search?: string
    }
  ): PatrolTask[] {
    seedMockData()
    return Array.from(patrolStore.values())
      .filter((t) => t.tenantId === tenantId)
      .filter((t) => (filter?.status ? t.status === filter.status : true))
      .filter((t) => (filter?.area ? t.area === filter.area : true))
      .filter((t) => (filter?.priority ? t.priority === filter.priority : true))
      .filter((t) => (filter?.assignedTo ? t.assignedTo === filter.assignedTo : true))
      .filter((t) => {
        if (!filter?.search) return true
        const q = filter.search.toLowerCase()
        return (
          t.patrolNo.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.assignedTo.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
  }

  updatePatrolTask(
    patrolId: string,
    tenantId: string,
    input: {
      title?: string
      description?: string
      area?: PatrolArea
      priority?: PatrolTaskPriority
      status?: PatrolTaskStatus
      checkItems?: Array<{
        name: string
        standard: string
        result?: 'PASS' | 'FAIL' | 'N_A'
        remark?: string
      }>
      assignedTo?: string
      scheduledAt?: string
      notes?: string
    }
  ): PatrolTask {
    const task = this.requirePatrolTask(patrolId, tenantId)

    if (input.title !== undefined) task.title = input.title
    if (input.description !== undefined) task.description = input.description
    if (input.area !== undefined) task.area = input.area
    if (input.priority !== undefined) task.priority = input.priority
    if (input.status !== undefined) {
      task.status = input.status
      if (input.status === PatrolTaskStatus.Completed) {
        task.completedAt = new Date().toISOString()
      }
    }
    if (input.checkItems !== undefined) {
      task.checkItems = input.checkItems.map((c) => ({
        id: c.result ? `item-${randomUUID()}` : task.checkItems.find((existing) => existing.name === c.name)?.id ?? `item-${randomUUID()}`,
        name: c.name,
        standard: c.standard,
        result: c.result,
        remark: c.remark,
        checkedAt: c.result ? new Date().toISOString() : undefined,
      }))
    }
    if (input.assignedTo !== undefined) task.assignedTo = input.assignedTo
    if (input.scheduledAt !== undefined) task.scheduledAt = input.scheduledAt
    if (input.notes !== undefined) task.notes = input.notes

    task.updatedAt = new Date().toISOString()
    patrolStore.set(patrolId, task)
    return task
  }

  deletePatrolTask(patrolId: string, tenantId: string): void {
    const task = this.requirePatrolTask(patrolId, tenantId)
    patrolStore.delete(task.id)
  }

  // ── Patrol query views ──

  getPendingPatrolTasks(tenantId: string): PatrolTask[] {
    seedMockData()
    return Array.from(patrolStore.values())
      .filter((t) => t.tenantId === tenantId && t.status === PatrolTaskStatus.Pending)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  }

  getOverduePatrolTasks(tenantId: string): PatrolTask[] {
    seedMockData()
    const now = new Date().toISOString()
    return Array.from(patrolStore.values())
      .filter(
        (t) =>
          t.tenantId === tenantId &&
          (t.status === PatrolTaskStatus.Pending || t.status === PatrolTaskStatus.InProgress) &&
          t.scheduledAt < now
      )
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  }

  // ═══════════════════════════════════════════════════════════════════
  // RectificationRecord CRUD
  // ═══════════════════════════════════════════════════════════════════

  createRectificationRecord(input: {
    tenantId: string
    rectificationNo: string
    sourceInspectionId: string
    sourceInspectNo: string
    title: string
    description: string
    severity: Severity
    responsiblePerson: string
    actions: Array<{ description: string; assignee: string; deadline: string }>
    deadline: string
    notes?: string
  }): RectificationRecord {
    const now = new Date().toISOString()

    const actions: RectificationAction[] = input.actions.map((a) => ({
      id: `action-${randomUUID()}`,
      description: a.description,
      assignee: a.assignee,
      deadline: a.deadline,
      status: 'PENDING' as const,
    }))

    const record: RectificationRecord = {
      id: `rect-${randomUUID()}`,
      rectificationNo: input.rectificationNo,
      sourceInspectionId: input.sourceInspectionId,
      sourceInspectNo: input.sourceInspectNo,
      title: input.title,
      description: input.description,
      status: RectificationStatus.Open,
      severity: input.severity,
      responsiblePerson: input.responsiblePerson,
      actions,
      deadline: input.deadline,
      notes: input.notes,
      tenantId: input.tenantId,
      createdAt: now,
      updatedAt: now,
    }
    rectificationStore.set(record.id, record)
    return record
  }

  getRectificationRecord(rectId: string, tenantId: string): RectificationRecord | undefined {
    const record = rectificationStore.get(rectId)
    if (!record || record.tenantId !== tenantId) return undefined
    return record
  }

  listRectificationRecords(
    tenantId: string,
    filter?: {
      status?: RectificationStatus
      severity?: Severity
      responsiblePerson?: string
      search?: string
    }
  ): RectificationRecord[] {
    seedMockData()
    return Array.from(rectificationStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (filter?.status ? r.status === filter.status : true))
      .filter((r) => (filter?.severity ? r.severity === filter.severity : true))
      .filter((r) => (filter?.responsiblePerson ? r.responsiblePerson === filter.responsiblePerson : true))
      .filter((r) => {
        if (!filter?.search) return true
        const q = filter.search.toLowerCase()
        return (
          r.rectificationNo.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.responsiblePerson.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  updateRectificationRecord(
    rectId: string,
    tenantId: string,
    input: {
      status?: RectificationStatus
      description?: string
      responsiblePerson?: string
      deadline?: string
      notes?: string
    }
  ): RectificationRecord {
    const record = this.requireRectificationRecord(rectId, tenantId)

    if (input.status !== undefined) {
      record.status = input.status
      if (input.status === RectificationStatus.Resolved || input.status === RectificationStatus.Verified) {
        record.resolvedAt = new Date().toISOString()
      }
    }
    if (input.description !== undefined) record.description = input.description
    if (input.responsiblePerson !== undefined) record.responsiblePerson = input.responsiblePerson
    if (input.deadline !== undefined) record.deadline = input.deadline
    if (input.notes !== undefined) record.notes = input.notes

    record.updatedAt = new Date().toISOString()
    rectificationStore.set(rectId, record)
    return record
  }

  deleteRectificationRecord(rectId: string, tenantId: string): void {
    const record = this.requireRectificationRecord(rectId, tenantId)
    rectificationStore.delete(record.id)
  }

  // ── Rectification query views ──

  getOpenRectificationRecords(tenantId: string): RectificationRecord[] {
    seedMockData()
    return Array.from(rectificationStore.values())
      .filter(
        (r) =>
          r.tenantId === tenantId &&
          (r.status === RectificationStatus.Open || r.status === RectificationStatus.InProgress)
      )
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
  }

  getOverdueRectificationRecords(tenantId: string): RectificationRecord[] {
    seedMockData()
    const now = new Date().toISOString()
    return Array.from(rectificationStore.values())
      .filter(
        (r) =>
          r.tenantId === tenantId &&
          (r.status === RectificationStatus.Open || r.status === RectificationStatus.InProgress) &&
          r.deadline < now
      )
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
  }

  getRectificationStats(tenantId: string): {
    total: number
    open: number
    inProgress: number
    resolved: number
    verified: number
    closed: number
    overdue: number
  } {
    seedMockData()
    const records = Array.from(rectificationStore.values()).filter(
      (r) => r.tenantId === tenantId
    )
    const now = new Date().toISOString()
    return {
      total: records.length,
      open: records.filter((r) => r.status === RectificationStatus.Open).length,
      inProgress: records.filter((r) => r.status === RectificationStatus.InProgress).length,
      resolved: records.filter((r) => r.status === RectificationStatus.Resolved).length,
      verified: records.filter((r) => r.status === RectificationStatus.Verified).length,
      closed: records.filter((r) => r.status === RectificationStatus.Closed).length,
      overdue: records.filter(
        (r) =>
          (r.status === RectificationStatus.Open || r.status === RectificationStatus.InProgress) &&
          r.deadline < now
      ).length,
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Internals
  // ═══════════════════════════════════════════════════════════════════

  private requirePatrolTask(patrolId: string, tenantId: string): PatrolTask {
    const task = patrolStore.get(patrolId)
    if (!task || task.tenantId !== tenantId) {
      throw new Error(`Patrol task not found: ${patrolId}`)
    }
    return task
  }

  private requireRectificationRecord(rectId: string, tenantId: string): RectificationRecord {
    const record = rectificationStore.get(rectId)
    if (!record || record.tenantId !== tenantId) {
      throw new Error(`Rectification record not found: ${rectId}`)
    }
    return record
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetQualityStoresForTests(): void {
    patrolStore.clear()
    rectificationStore.clear()
    seeded = false
  }
}
