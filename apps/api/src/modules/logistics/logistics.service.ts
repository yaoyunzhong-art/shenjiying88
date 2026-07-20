import { randomUUID } from 'node:crypto'
import { Injectable, Optional } from '@nestjs/common'
import {
  FoundationScopeType,
  NotificationChannelType
} from '../notification/notification.entity'
import { NotificationService } from '../notification/notification.service'
import type {
  CleanScheduleEntity,
  CleanScheduleStatus,
  InspectionResultStatus,
  InspectionTaskEntity,
  InspectionTaskResult,
  InspectionTaskStatus,
  MaintenanceOrderEntity,
  MaintenanceOrderStatus,
  MaterialRequestEntity,
  MaterialRequestItem,
  MaterialRequestStatus,
  ProcurementApproval,
  ProcurementOrderRecord,
  ProcurementReceiveRecord,
  ProcurementRequestEntity,
  ProcurementRequestStatus,
  RepairOrderEntity,
  RepairOrderStatus
} from './logistics.entity'
import type {
  Supplier,
  SupplierStatus,
  CreditLevel,
  SupplierContract,
  SupplierEvaluation,
  SupplierMetrics,
} from './logistics.supplier.entity'
import type {
  InventoryReservation,
  ReservationStatus,
  InventoryReservationItem,
  InventoryCheckResult,
} from './logistics.inventory.entity'
import type {
  SchedulePlan,
  SchedulePlanStatus,
  ScheduleTaskLog,
  SchedulePlanMetrics,
} from './logistics.schedule.entity'

export interface CreateInspectionTaskInput {
  tenantId: string
  storeId?: string
  equipmentId: string
  equipmentName: string
  assigneeId: string
  assigneeName: string
  scheduledAt: string
}

export interface RecordInspectionResultInput {
  status: InspectionResultStatus
  note: string
  inspectorId: string
  inspectorName: string
}

export interface CreateCleanScheduleInput {
  tenantId: string
  storeId?: string
  assigneeId: string
  assigneeName: string
  shiftName: string
  shiftTime: string
  scheduledDate: string
}

export interface AssignCleanAreaInput {
  areaCode: string
  areaName: string
  assignedAt?: string
}

export interface CheckInCleanScheduleInput {
  cleanerId: string
  cleanerName: string
  checkedInAt?: string
  note?: string
}

export interface CreateRepairOrderInput {
  tenantId: string
  storeId?: string
  inspectionTaskId?: string
  equipmentId: string
  equipmentName: string
  issueDescription: string
  reporterId: string
  reporterName: string
}

export interface AssignRepairOrderInput {
  assigneeId: string
  assigneeName: string
  assignedAt?: string
}

export interface StartRepairOrderInput {
  startedAt?: string
}

export interface CompleteRepairOrderInput {
  completionNote: string
  technicianId: string
  technicianName: string
  completedAt?: string
}

export interface VerifyRepairOrderInput {
  verifierId: string
  verifierName: string
  note: string
  verifiedAt?: string
}

export interface CreateMaterialRequestInput {
  tenantId: string
  storeId?: string
  requesterId: string
  requesterName: string
  department?: string
  purpose: string
  items: Array<{
    itemId: string
    itemName: string
    category: string
    unit: string
    quantity: number
  }>
}

export interface ApproveMaterialRequestInput {
  approverId: string
  approverName: string
  note: string
  approvedAt?: string
}

export interface OutboundMaterialRequestInput {
  operatorId: string
  operatorName: string
  warehouseCode?: string
  note?: string
  outboundAt?: string
}

// ── 设备维保输入 ─────────────────────────────────────────────────────────────

export interface CreateMaintenanceOrderInput {
  tenantId: string
  storeId?: string
  equipmentId: string
  equipmentName: string
  issueDescription: string
  reporterId: string
  reporterName: string
}

export interface StartMaintenanceOrderInput {
  assigneeId: string
  assigneeName: string
  startedAt?: string
}

export interface CompleteMaintenanceOrderInput {
  completionNote: string
  completedAt?: string
}

export interface AcceptMaintenanceOrderInput {
  acceptedBy: string
  acceptanceNote: string
  acceptedAt?: string
}

// ── 耗材采购输入 (对接P-37审批流) ───────────────────────────────────────────

export interface CreateProcurementRequestInput {
  tenantId: string
  storeId?: string
  requesterId: string
  requesterName: string
  department?: string
  purpose: string
  vendorName?: string
  notes?: string
}

export interface ApproveProcurementRequestInput {
  approverId: string
  approverName: string
  note: string
  approvalTicket?: string // P-37 审批工单号
  approvedAt?: string
}

export interface RejectProcurementRequestInput {
  rejecterId: string
  rejecterName: string
  reason: string
  rejectedAt?: string
}

export interface OrderProcurementInput {
  orderNumber: string
  vendorName: string
  operatorId: string
  operatorName: string
  orderedAt?: string
}

export interface ReceiveProcurementInput {
  receivedBy: string
  receivedByName: string
  note?: string
  receivedAt?: string
}

const inspectionTaskStore = new Map<string, InspectionTaskEntity>()
const cleanScheduleStore = new Map<string, CleanScheduleEntity>()
const repairOrderStore = new Map<string, RepairOrderEntity>()
const materialRequestStore = new Map<string, MaterialRequestEntity>()
const maintenanceOrderStore = new Map<string, MaintenanceOrderEntity>()
const procurementRequestStore = new Map<string, ProcurementRequestEntity>()

// ── P-30 Phase 60% new stores ──
const supplierStore = new Map<string, Supplier>()
const supplierContractStore = new Map<string, SupplierContract>()
const supplierEvaluationStore = new Map<string, SupplierEvaluation>()
const inventoryReservationStore = new Map<string, InventoryReservation>()
const schedulePlanStore = new Map<string, SchedulePlan>()
const scheduleTaskLogStore = new Map<string, ScheduleTaskLog>()

@Injectable()
export class LogisticsService {
  constructor(
    @Optional() private readonly notificationService?: NotificationService
  ) {}

  createInspectionTask(input: CreateInspectionTaskInput): InspectionTaskEntity {
    const scheduledAt = new Date(input.scheduledAt)
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new Error('scheduledAt must be a valid datetime')
    }

    const now = new Date().toISOString()
    const task: InspectionTaskEntity = {
      id: `inspection-${randomUUID()}`,
      tenantId: input.tenantId,
      storeId: input.storeId,
      equipmentId: input.equipmentId,
      equipmentName: input.equipmentName,
      assigneeId: input.assigneeId,
      assigneeName: input.assigneeName,
      scheduledAt: scheduledAt.toISOString(),
      status: 'scheduled',
      createdAt: now,
      updatedAt: now
    }

    inspectionTaskStore.set(task.id, task)
    return { ...task }
  }

  listInspectionTasks(
    tenantId: string,
    filter?: { status?: InspectionTaskStatus; equipmentId?: string }
  ): InspectionTaskEntity[] {
    return Array.from(inspectionTaskStore.values())
      .filter((task) => task.tenantId === tenantId)
      .filter((task) => (filter?.status ? task.status === filter.status : true))
      .filter((task) => (filter?.equipmentId ? task.equipmentId === filter.equipmentId : true))
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .map((task) => ({ ...task }))
  }

  getInspectionTask(id: string, tenantId: string): InspectionTaskEntity | undefined {
    const task = inspectionTaskStore.get(id)
    if (!task || task.tenantId !== tenantId) return undefined
    return { ...task }
  }

  sendInspectionReminder(id: string, tenantId: string, now: string = new Date().toISOString()): InspectionTaskEntity {
    const task = this.assertOwned(id, tenantId)
    if (task.status === 'completed') {
      throw new Error(`Inspection task already completed: ${id}`)
    }

    const reminderAt = new Date(now).toISOString()
    this.notificationService?.send({
      channel: NotificationChannelType.InApp,
      scopeType: FoundationScopeType.Tenant,
      tenantId: task.tenantId,
      storeId: task.storeId,
      recipient: task.assigneeId,
      payload: {
        type: 'inspection_reminder',
        taskId: task.id,
        equipmentId: task.equipmentId,
        equipmentName: task.equipmentName,
        scheduledAt: task.scheduledAt
      },
      scheduledAt: reminderAt
    })

    task.status = 'reminded'
    task.reminderSentAt = reminderAt
    task.updatedAt = reminderAt
    inspectionTaskStore.set(task.id, task)
    return { ...task }
  }

  sweepDueInspectionReminders(now: string = new Date().toISOString()): {
    scanned: number
    reminded: number
    tasks: InspectionTaskEntity[]
  } {
    const tasks = Array.from(inspectionTaskStore.values())
      .filter((task) => task.status === 'scheduled')
      .filter((task) => task.scheduledAt <= now)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

    const remindedTasks = tasks.map((task) =>
      this.sendInspectionReminder(task.id, task.tenantId, now)
    )

    return {
      scanned: tasks.length,
      reminded: remindedTasks.length,
      tasks: remindedTasks
    }
  }

  recordInspectionResult(
    id: string,
    tenantId: string,
    input: RecordInspectionResultInput
  ): InspectionTaskEntity {
    const task = this.assertOwned(id, tenantId)
    if (task.status === 'completed') {
      throw new Error(`Inspection task already completed: ${id}`)
    }

    const recordedAt = new Date().toISOString()
    const result: InspectionTaskResult = {
      status: input.status,
      note: input.note,
      inspectorId: input.inspectorId,
      inspectorName: input.inspectorName,
      recordedAt
    }

    task.result = result
    task.status = 'completed'
    task.completedAt = recordedAt
    task.updatedAt = recordedAt
    inspectionTaskStore.set(task.id, task)
    return { ...task }
  }

  createCleanSchedule(input: CreateCleanScheduleInput): CleanScheduleEntity {
    const scheduledDate = this.normalizeDate(input.scheduledDate, 'scheduledDate must be a valid date')
    const shiftName = input.shiftName.trim()
    const shiftTime = input.shiftTime.trim()

    if (!shiftName) {
      throw new Error('shiftName is required')
    }
    if (!shiftTime) {
      throw new Error('shiftTime is required')
    }

    const now = new Date().toISOString()
    const schedule: CleanScheduleEntity = {
      id: `clean-${randomUUID()}`,
      tenantId: input.tenantId,
      storeId: input.storeId,
      assigneeId: input.assigneeId,
      assigneeName: input.assigneeName,
      shiftName,
      shiftTime,
      scheduledDate,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now
    }

    cleanScheduleStore.set(schedule.id, schedule)
    return { ...schedule }
  }

  listCleanSchedules(
    tenantId: string,
    filter?: {
      status?: CleanScheduleStatus
      scheduledDate?: string
      assigneeId?: string
      areaCode?: string
    }
  ): CleanScheduleEntity[] {
    return Array.from(cleanScheduleStore.values())
      .filter((schedule) => schedule.tenantId === tenantId)
      .filter((schedule) => (filter?.status ? schedule.status === filter.status : true))
      .filter((schedule) => (filter?.scheduledDate ? schedule.scheduledDate === filter.scheduledDate : true))
      .filter((schedule) => (filter?.assigneeId ? schedule.assigneeId === filter.assigneeId : true))
      .filter((schedule) => (filter?.areaCode ? schedule.areaCode === filter.areaCode : true))
      .sort((a, b) => `${a.scheduledDate}${a.shiftTime}`.localeCompare(`${b.scheduledDate}${b.shiftTime}`))
      .map((schedule) => ({ ...schedule }))
  }

  getCleanSchedule(id: string, tenantId: string): CleanScheduleEntity | undefined {
    const schedule = cleanScheduleStore.get(id)
    if (!schedule || schedule.tenantId !== tenantId) return undefined
    return { ...schedule }
  }

  assignCleanArea(
    id: string,
    tenantId: string,
    input: AssignCleanAreaInput
  ): CleanScheduleEntity {
    const schedule = this.assertCleanOwned(id, tenantId)
    if (schedule.status === 'checked_in') {
      throw new Error(`Clean schedule already checked in: ${id}`)
    }

    const areaCode = input.areaCode.trim()
    const areaName = input.areaName.trim()
    if (!areaCode) {
      throw new Error('areaCode is required')
    }
    if (!areaName) {
      throw new Error('areaName is required')
    }

    const assignedAt = this.normalizeTimestamp(
      input.assignedAt,
      'assignedAt must be a valid datetime'
    )

    schedule.areaCode = areaCode
    schedule.areaName = areaName
    schedule.status = 'assigned'
    schedule.assignedAt = assignedAt
    schedule.updatedAt = assignedAt

    this.notificationService?.send({
      channel: NotificationChannelType.InApp,
      scopeType: FoundationScopeType.Tenant,
      tenantId: schedule.tenantId,
      storeId: schedule.storeId,
      recipient: schedule.assigneeId,
      payload: {
        type: 'clean_schedule_assignment',
        cleanScheduleId: schedule.id,
        scheduledDate: schedule.scheduledDate,
        shiftName: schedule.shiftName,
        shiftTime: schedule.shiftTime,
        areaCode,
        areaName
      },
      scheduledAt: assignedAt
    })

    cleanScheduleStore.set(schedule.id, schedule)
    return { ...schedule }
  }

  checkInCleanSchedule(
    id: string,
    tenantId: string,
    input: CheckInCleanScheduleInput
  ): CleanScheduleEntity {
    const schedule = this.assertCleanOwned(id, tenantId)
    if (schedule.status !== 'assigned') {
      throw new Error(`Clean schedule cannot check in from status ${schedule.status}`)
    }
    if (schedule.assigneeId !== input.cleanerId) {
      throw new Error(`Clean schedule assignee mismatch: ${id}`)
    }

    const checkedInAt = this.normalizeTimestamp(
      input.checkedInAt,
      'checkedInAt must be a valid datetime'
    )

    schedule.status = 'checked_in'
    schedule.checkIn = {
      cleanerId: input.cleanerId,
      cleanerName: input.cleanerName,
      checkedInAt,
      note: input.note?.trim() || undefined
    }
    schedule.updatedAt = checkedInAt
    cleanScheduleStore.set(schedule.id, schedule)
    return { ...schedule }
  }

  createRepairOrder(input: CreateRepairOrderInput): RepairOrderEntity {
    const issueDescription = input.issueDescription.trim()
    if (!issueDescription) {
      throw new Error('issueDescription is required')
    }

    if (input.inspectionTaskId) {
      this.assertOwned(input.inspectionTaskId, input.tenantId)
    }

    const now = new Date().toISOString()
    const order: RepairOrderEntity = {
      id: `repair-${randomUUID()}`,
      tenantId: input.tenantId,
      storeId: input.storeId,
      inspectionTaskId: input.inspectionTaskId,
      equipmentId: input.equipmentId,
      equipmentName: input.equipmentName,
      issueDescription,
      reporterId: input.reporterId,
      reporterName: input.reporterName,
      status: 'open',
      createdAt: now,
      updatedAt: now
    }

    repairOrderStore.set(order.id, order)
    return { ...order }
  }

  listRepairOrders(
    tenantId: string,
    filter?: { status?: RepairOrderStatus; equipmentId?: string; assigneeId?: string }
  ): RepairOrderEntity[] {
    return Array.from(repairOrderStore.values())
      .filter((order) => order.tenantId === tenantId)
      .filter((order) => (filter?.status ? order.status === filter.status : true))
      .filter((order) => (filter?.equipmentId ? order.equipmentId === filter.equipmentId : true))
      .filter((order) => (filter?.assigneeId ? order.assigneeId === filter.assigneeId : true))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((order) => ({ ...order }))
  }

  getRepairOrder(id: string, tenantId: string): RepairOrderEntity | undefined {
    const order = repairOrderStore.get(id)
    if (!order || order.tenantId !== tenantId) return undefined
    return { ...order }
  }

  assignRepairOrder(
    id: string,
    tenantId: string,
    input: AssignRepairOrderInput
  ): RepairOrderEntity {
    const order = this.assertRepairOwned(id, tenantId)
    if (order.status !== 'open' && order.status !== 'assigned') {
      throw new Error(`Repair order cannot be assigned from status ${order.status}`)
    }

    const assignedAt = this.normalizeTimestamp(
      input.assignedAt,
      'assignedAt must be a valid datetime'
    )

    order.assigneeId = input.assigneeId
    order.assigneeName = input.assigneeName
    order.status = 'assigned'
    order.assignedAt = assignedAt
    order.updatedAt = assignedAt

    this.notificationService?.send({
      channel: NotificationChannelType.InApp,
      scopeType: FoundationScopeType.Tenant,
      tenantId: order.tenantId,
      storeId: order.storeId,
      recipient: input.assigneeId,
      payload: {
        type: 'repair_assignment',
        repairOrderId: order.id,
        inspectionTaskId: order.inspectionTaskId,
        equipmentId: order.equipmentId,
        equipmentName: order.equipmentName,
        issueDescription: order.issueDescription
      },
      scheduledAt: assignedAt
    })

    repairOrderStore.set(order.id, order)
    return { ...order }
  }

  startRepairOrder(
    id: string,
    tenantId: string,
    input: StartRepairOrderInput = {}
  ): RepairOrderEntity {
    const order = this.assertRepairOwned(id, tenantId)
    if (order.status !== 'assigned') {
      throw new Error(`Repair order cannot start from status ${order.status}`)
    }

    const startedAt = this.normalizeTimestamp(
      input.startedAt,
      'startedAt must be a valid datetime'
    )

    order.status = 'in_progress'
    order.startedAt = startedAt
    order.updatedAt = startedAt
    repairOrderStore.set(order.id, order)
    return { ...order }
  }

  completeRepairOrder(
    id: string,
    tenantId: string,
    input: CompleteRepairOrderInput
  ): RepairOrderEntity {
    const order = this.assertRepairOwned(id, tenantId)
    if (order.status !== 'in_progress') {
      throw new Error(`Repair order cannot complete from status ${order.status}`)
    }

    const completionNote = input.completionNote.trim()
    if (!completionNote) {
      throw new Error('completionNote is required')
    }

    const completedAt = this.normalizeTimestamp(
      input.completedAt,
      'completedAt must be a valid datetime'
    )

    order.assigneeId = input.technicianId
    order.assigneeName = input.technicianName
    order.status = 'completed'
    order.completedAt = completedAt
    order.completionNote = completionNote
    order.updatedAt = completedAt
    repairOrderStore.set(order.id, order)
    return { ...order }
  }

  verifyRepairOrder(
    id: string,
    tenantId: string,
    input: VerifyRepairOrderInput
  ): RepairOrderEntity {
    const order = this.assertRepairOwned(id, tenantId)
    if (order.status !== 'completed') {
      throw new Error(`Repair order cannot verify from status ${order.status}`)
    }

    const note = input.note.trim()
    if (!note) {
      throw new Error('verification note is required')
    }

    const verifiedAt = this.normalizeTimestamp(
      input.verifiedAt,
      'verifiedAt must be a valid datetime'
    )

    order.status = 'verified'
    order.verification = {
      verifierId: input.verifierId,
      verifierName: input.verifierName,
      note,
      verifiedAt
    }
    order.updatedAt = verifiedAt
    repairOrderStore.set(order.id, order)
    return { ...order }
  }

  createMaterialRequest(input: CreateMaterialRequestInput): MaterialRequestEntity {
    const purpose = input.purpose.trim()
    if (!purpose) {
      throw new Error('purpose is required')
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new Error('items are required')
    }

    const items = input.items.map((item, index) => this.normalizeMaterialRequestItem(item, index))
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const now = new Date().toISOString()
    const request: MaterialRequestEntity = {
      id: `material-${randomUUID()}`,
      tenantId: input.tenantId,
      storeId: input.storeId,
      requesterId: input.requesterId,
      requesterName: input.requesterName,
      department: input.department?.trim() || undefined,
      purpose,
      status: 'pending_approval',
      items,
      totalQuantity,
      createdAt: now,
      updatedAt: now
    }

    materialRequestStore.set(request.id, request)
    return {
      ...request,
      items: request.items.map((item) => ({ ...item }))
    }
  }

  listMaterialRequests(
    tenantId: string,
    filter?: {
      status?: MaterialRequestStatus
      requesterId?: string
      category?: string
    }
  ): MaterialRequestEntity[] {
    return Array.from(materialRequestStore.values())
      .filter((request) => request.tenantId === tenantId)
      .filter((request) => (filter?.status ? request.status === filter.status : true))
      .filter((request) => (filter?.requesterId ? request.requesterId === filter.requesterId : true))
      .filter((request) =>
        filter?.category
          ? request.items.some((item) => item.category === filter.category)
          : true
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((request) => ({
        ...request,
        items: request.items.map((item) => ({ ...item })),
        approval: request.approval ? { ...request.approval } : undefined,
        outbound: request.outbound ? { ...request.outbound } : undefined
      }))
  }

  getMaterialRequest(id: string, tenantId: string): MaterialRequestEntity | undefined {
    const request = materialRequestStore.get(id)
    if (!request || request.tenantId !== tenantId) return undefined
    return {
      ...request,
      items: request.items.map((item) => ({ ...item })),
      approval: request.approval ? { ...request.approval } : undefined,
      outbound: request.outbound ? { ...request.outbound } : undefined
    }
  }

  approveMaterialRequest(
    id: string,
    tenantId: string,
    input: ApproveMaterialRequestInput
  ): MaterialRequestEntity {
    const request = this.assertMaterialOwned(id, tenantId)
    if (request.status !== 'pending_approval') {
      throw new Error(`Material request cannot be approved from status ${request.status}`)
    }

    const note = input.note.trim()
    if (!note) {
      throw new Error('approval note is required')
    }

    const approvedAt = this.normalizeTimestamp(
      input.approvedAt,
      'approvedAt must be a valid datetime'
    )

    request.status = 'approved'
    request.approval = {
      approverId: input.approverId,
      approverName: input.approverName,
      note,
      approvedAt
    }
    request.updatedAt = approvedAt
    materialRequestStore.set(request.id, request)

    return {
      ...request,
      items: request.items.map((item) => ({ ...item })),
      approval: request.approval ? { ...request.approval } : undefined
    }
  }

  outboundMaterialRequest(
    id: string,
    tenantId: string,
    input: OutboundMaterialRequestInput
  ): MaterialRequestEntity {
    const request = this.assertMaterialOwned(id, tenantId)
    if (request.status !== 'approved') {
      throw new Error(`Material request cannot outbound from status ${request.status}`)
    }

    const outboundAt = this.normalizeTimestamp(
      input.outboundAt,
      'outboundAt must be a valid datetime'
    )

    request.status = 'outbound'
    request.outbound = {
      operatorId: input.operatorId,
      operatorName: input.operatorName,
      warehouseCode: input.warehouseCode?.trim() || undefined,
      note: input.note?.trim() || undefined,
      outboundAt
    }
    request.updatedAt = outboundAt
    materialRequestStore.set(request.id, request)

    return {
      ...request,
      items: request.items.map((item) => ({ ...item })),
      approval: request.approval ? { ...request.approval } : undefined,
      outbound: request.outbound ? { ...request.outbound } : undefined
    }
  }

  // ════════════════════════════════════════════════
  //  设备维保 (MaintenanceOrder) - P-30 扩展
  //  状态机: pending → in_progress → pending_acceptance → completed
  // ════════════════════════════════════════════════

  createMaintenanceOrder(input: CreateMaintenanceOrderInput): MaintenanceOrderEntity {
    const issueDescription = input.issueDescription.trim()
    if (!issueDescription) {
      throw new Error('issueDescription is required')
    }

    const now = new Date().toISOString()
    const order: MaintenanceOrderEntity = {
      id: `mnt-${randomUUID()}`,
      tenantId: input.tenantId,
      storeId: input.storeId,
      equipmentId: input.equipmentId,
      equipmentName: input.equipmentName,
      issueDescription,
      status: 'pending',
      reporterId: input.reporterId,
      reporterName: input.reporterName,
      createdAt: now,
      updatedAt: now,
    }
    maintenanceOrderStore.set(order.id, order)
    return { ...order }
  }

  listMaintenanceOrders(
    tenantId: string,
    filter?: { status?: MaintenanceOrderStatus; equipmentId?: string; assigneeId?: string }
  ): MaintenanceOrderEntity[] {
    return Array.from(maintenanceOrderStore.values())
      .filter((o) => o.tenantId === tenantId)
      .filter((o) => (filter?.status ? o.status === filter.status : true))
      .filter((o) => (filter?.equipmentId ? o.equipmentId === filter.equipmentId : true))
      .filter((o) => (filter?.assigneeId ? o.assigneeId === filter.assigneeId : true))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((o) => ({ ...o }))
  }

  getMaintenanceOrder(id: string, tenantId: string): MaintenanceOrderEntity | undefined {
    const order = maintenanceOrderStore.get(id)
    if (!order || order.tenantId !== tenantId) return undefined
    return { ...order }
  }

  /** pending → in_progress: 开始维保 */
  startMaintenanceOrder(
    id: string,
    tenantId: string,
    input: StartMaintenanceOrderInput
  ): MaintenanceOrderEntity {
    const order = this.assertMaintenanceOwned(id, tenantId)
    if (order.status !== 'pending') {
      throw new Error(`Maintenance order cannot start from status ${order.status}`)
    }

    const startedAt = this.normalizeTimestamp(input.startedAt, 'startedAt must be a valid datetime')
    order.status = 'in_progress'
    order.assigneeId = input.assigneeId
    order.assigneeName = input.assigneeName
    order.startedAt = startedAt
    order.updatedAt = startedAt
    maintenanceOrderStore.set(order.id, order)
    return { ...order }
  }

  /** in_progress → pending_acceptance: 完成维保，待验收 */
  completeMaintenanceOrder(
    id: string,
    tenantId: string,
    input: CompleteMaintenanceOrderInput
  ): MaintenanceOrderEntity {
    const order = this.assertMaintenanceOwned(id, tenantId)
    if (order.status !== 'in_progress') {
      throw new Error(`Maintenance order cannot complete from status ${order.status}`)
    }

    const completionNote = input.completionNote.trim()
    if (!completionNote) {
      throw new Error('completionNote is required')
    }

    const completedAt = this.normalizeTimestamp(input.completedAt, 'completedAt must be a valid datetime')
    order.status = 'pending_acceptance'
    order.completionNote = completionNote
    order.completedAt = completedAt
    order.updatedAt = completedAt
    maintenanceOrderStore.set(order.id, order)
    return { ...order }
  }

  /** pending_acceptance → completed: 验收通过 */
  acceptMaintenanceOrder(
    id: string,
    tenantId: string,
    input: AcceptMaintenanceOrderInput
  ): MaintenanceOrderEntity {
    const order = this.assertMaintenanceOwned(id, tenantId)
    if (order.status !== 'pending_acceptance') {
      throw new Error(`Maintenance order cannot be accepted from status ${order.status}`)
    }

    const acceptedAt = this.normalizeTimestamp(input.acceptedAt, 'acceptedAt must be a valid datetime')
    order.status = 'completed'
    order.acceptanceNote = input.acceptanceNote
    order.acceptedAt = acceptedAt
    order.acceptedBy = input.acceptedBy
    order.updatedAt = acceptedAt
    maintenanceOrderStore.set(order.id, order)
    return { ...order }
  }

  // ════════════════════════════════════════════════
  //  耗材采购 (Procurement) - P-30 扩展, 对接 P-37 审批流
  //  状态机: draft → pending_approval → approved/rejected → ordered → received
  // ════════════════════════════════════════════════

  createProcurementRequest(input: CreateProcurementRequestInput): ProcurementRequestEntity {
    const purpose = input.purpose.trim()
    if (!purpose) {
      throw new Error('purpose is required')
    }

    const now = new Date().toISOString()
    const request: ProcurementRequestEntity = {
      id: `proc-${randomUUID()}`,
      tenantId: input.tenantId,
      storeId: input.storeId,
      requesterId: input.requesterId,
      requesterName: input.requesterName,
      department: input.department?.trim() || undefined,
      purpose,
      vendorName: input.vendorName?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }
    procurementRequestStore.set(request.id, request)
    return { ...request }
  }

  listProcurementRequests(
    tenantId: string,
    filter?: { status?: ProcurementRequestStatus; requesterId?: string }
  ): ProcurementRequestEntity[] {
    return Array.from(procurementRequestStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (filter?.status ? r.status === filter.status : true))
      .filter((r) => (filter?.requesterId ? r.requesterId === filter.requesterId : true))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((r) => ({ ...r, approval: r.approval ? { ...r.approval } : undefined }))
  }

  getProcurementRequest(id: string, tenantId: string): ProcurementRequestEntity | undefined {
    const request = procurementRequestStore.get(id)
    if (!request || request.tenantId !== tenantId) return undefined
    return {
      ...request,
      approval: request.approval ? { ...request.approval } : undefined,
      orderRecord: request.orderRecord ? { ...request.orderRecord } : undefined,
      receiveRecord: request.receiveRecord ? { ...request.receiveRecord } : undefined,
    }
  }

  /** draft → pending_approval: 提交审批（对接 P-37 GovernanceApproval） */
  submitProcurementRequest(id: string, tenantId: string): ProcurementRequestEntity {
    const request = this.assertProcurementOwned(id, tenantId)
    if (request.status !== 'draft') {
      throw new Error(`Procurement request cannot be submitted from status ${request.status}`)
    }

    request.status = 'pending_approval'
    request.updatedAt = new Date().toISOString()
    procurementRequestStore.set(request.id, request)
    return { ...request, approval: request.approval ? { ...request.approval } : undefined }
  }

  /** pending_approval → approved: 审批通过（可记录P-37审批工单号） */
  approveProcurementRequest(
    id: string,
    tenantId: string,
    input: ApproveProcurementRequestInput
  ): ProcurementRequestEntity {
    const request = this.assertProcurementOwned(id, tenantId)
    if (request.status !== 'pending_approval') {
      throw new Error(`Procurement request cannot be approved from status ${request.status}`)
    }

    const approvedAt = this.normalizeTimestamp(input.approvedAt, 'approvedAt must be a valid datetime')
    request.status = 'approved'
    request.approval = {
      approvalTicket: input.approvalTicket,
      approverId: input.approverId,
      approverName: input.approverName,
      note: input.note,
      approvedAt,
    }
    request.updatedAt = approvedAt
    procurementRequestStore.set(request.id, request)
    return {
      ...request,
      approval: { ...request.approval },
    }
  }

  /** pending_approval → rejected: 审批拒绝 */
  rejectProcurementRequest(
    id: string,
    tenantId: string,
    input: RejectProcurementRequestInput
  ): ProcurementRequestEntity {
    const request = this.assertProcurementOwned(id, tenantId)
    if (request.status !== 'pending_approval') {
      throw new Error(`Procurement request cannot be rejected from status ${request.status}`)
    }

    const rejectedAt = this.normalizeTimestamp(input.rejectedAt, 'rejectedAt must be a valid datetime')
    request.status = 'rejected'
    request.notes = input.reason
    request.updatedAt = rejectedAt
    procurementRequestStore.set(request.id, request)
    return { ...request }
  }

  /** approved → ordered: 下单采购 */
  orderProcurementRequest(
    id: string,
    tenantId: string,
    input: OrderProcurementInput
  ): ProcurementRequestEntity {
    const request = this.assertProcurementOwned(id, tenantId)
    if (request.status !== 'approved') {
      throw new Error(`Procurement request cannot be ordered from status ${request.status}`)
    }

    const orderedAt = this.normalizeTimestamp(input.orderedAt, 'orderedAt must be a valid datetime')
    request.status = 'ordered'
    request.orderRecord = {
      orderNumber: input.orderNumber,
      vendorName: input.vendorName,
      orderedAt,
      operatorId: input.operatorId,
      operatorName: input.operatorName,
    }
    request.updatedAt = orderedAt
    procurementRequestStore.set(request.id, request)
    return {
      ...request,
      orderRecord: { ...request.orderRecord },
      approval: request.approval ? { ...request.approval } : undefined,
    }
  }

  /** ordered → received: 收货入库 */
  receiveProcurementRequest(
    id: string,
    tenantId: string,
    input: ReceiveProcurementInput
  ): ProcurementRequestEntity {
    const request = this.assertProcurementOwned(id, tenantId)
    if (request.status !== 'ordered') {
      throw new Error(`Procurement request cannot be received from status ${request.status}`)
    }

    const receivedAt = this.normalizeTimestamp(input.receivedAt, 'receivedAt must be a valid datetime')
    request.status = 'received'
    request.receiveRecord = {
      receivedAt,
      receivedBy: input.receivedBy,
      receivedByName: input.receivedByName,
      note: input.note?.trim() || undefined,
    }
    request.updatedAt = receivedAt
    procurementRequestStore.set(request.id, request)
    return {
      ...request,
      receiveRecord: { ...request.receiveRecord },
      approval: request.approval ? { ...request.approval } : undefined,
      orderRecord: request.orderRecord ? { ...request.orderRecord } : undefined,
    }
  }

  resetStoreForTests(): void {
    inspectionTaskStore.clear()
    cleanScheduleStore.clear()
    repairOrderStore.clear()
    materialRequestStore.clear()
    maintenanceOrderStore.clear()
    procurementRequestStore.clear()
    supplierStore.clear()
    supplierContractStore.clear()
    supplierEvaluationStore.clear()
    inventoryReservationStore.clear()
    schedulePlanStore.clear()
    scheduleTaskLogStore.clear()
  }

  // ════════════════════════════════════════════════
  //  供应商管理 (Supplier) - P-30 Phase 60%
  // ════════════════════════════════════════════════

  createSupplier(input: {
    tenantId: string
    code: string
    name: string
    category: string
    status?: SupplierStatus
    creditLevel?: CreditLevel
    address?: string
    mainProducts?: string[]
    cooperationYears?: number
    notes?: string
  }): Supplier {
    const now = new Date().toISOString()
    const supplier: Supplier = {
      id: `supp-${randomUUID()}`,
      tenantId: input.tenantId,
      code: input.code,
      name: input.name,
      category: input.category,
      status: input.status ?? 'active',
      creditLevel: input.creditLevel ?? 'B',
      contacts: [],
      address: input.address,
      mainProducts: input.mainProducts ?? [],
      cooperationYears: input.cooperationYears ?? 0,
      averageScore: 0,
      evaluationCount: 0,
      activeContracts: 0,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    }
    supplierStore.set(supplier.id, supplier)
    return { ...supplier, contacts: [...supplier.contacts] }
  }

  getSupplier(id: string, tenantId: string): Supplier | undefined {
    const s = supplierStore.get(id)
    if (!s || s.tenantId !== tenantId) return undefined
    return { ...s, contacts: [...s.contacts] }
  }

  listSuppliers(
    tenantId: string,
    filter?: {
      status?: SupplierStatus
      creditLevel?: CreditLevel
      category?: string
      search?: string
    },
  ): Supplier[] {
    return Array.from(supplierStore.values())
      .filter((s) => s.tenantId === tenantId)
      .filter((s) => (filter?.status ? s.status === filter.status : true))
      .filter((s) => (filter?.creditLevel ? s.creditLevel === filter.creditLevel : true))
      .filter((s) => (filter?.category ? s.category === filter.category : true))
      .filter((s) =>
        filter?.search
          ? s.name.toLowerCase().includes(filter.search.toLowerCase()) ||
            s.code.toLowerCase().includes(filter.search.toLowerCase())
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => ({ ...s, contacts: [...s.contacts] }))
  }

  updateSupplier(
    id: string,
    tenantId: string,
    patch: Partial<Pick<Supplier, 'name' | 'category' | 'status' | 'creditLevel' | 'address' | 'mainProducts' | 'cooperationYears' | 'notes'>>,
  ): Supplier {
    const s = this.assertSupplierOwned(id, tenantId)
    const updated: Supplier = {
      ...s,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    supplierStore.set(id, updated)
    return { ...updated, contacts: [...updated.contacts] }
  }

  deleteSupplier(id: string, tenantId: string): boolean {
    const s = this.getSupplier(id, tenantId)
    if (!s) return false
    supplierStore.delete(id)
    return true
  }

  addSupplierContact(
    supplierId: string,
    tenantId: string,
    contact: { name: string; phone: string; email?: string; position?: string },
  ): Supplier {
    const s = this.assertSupplierOwned(supplierId, tenantId)
    s.contacts.push({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      position: contact.position,
    })
    s.updatedAt = new Date().toISOString()
    supplierStore.set(supplierId, s)
    return { ...s, contacts: [...s.contacts] }
  }

  addSupplierContract(
    supplierId: string,
    tenantId: string,
    input: {
      type: 'annual' | 'quarterly' | 'project' | 'one_time'
      contractNumber: string
      startDate: string
      endDate: string
      amount: number
      autoRenew?: boolean
      terms?: string
      signedAt?: string
    },
  ): SupplierContract {
    const s = this.assertSupplierOwned(supplierId, tenantId)
    const now = new Date().toISOString()
    const contract: SupplierContract = {
      id: `scont-${randomUUID()}`,
      supplierId,
      type: input.type,
      contractNumber: input.contractNumber,
      startDate: input.startDate,
      endDate: input.endDate,
      amount: input.amount,
      autoRenew: input.autoRenew ?? false,
      terms: input.terms,
      signedAt: input.signedAt ?? now,
    }
    supplierContractStore.set(contract.id, contract)
    s.activeContracts = Array.from(supplierContractStore.values()).filter(
      (c) => c.supplierId === supplierId && new Date(c.endDate) > new Date(),
    ).length
    s.updatedAt = now
    supplierStore.set(supplierId, s)
    return { ...contract }
  }

  listSupplierContracts(supplierId: string, tenantId: string): SupplierContract[] {
    this.assertSupplierOwned(supplierId, tenantId)
    return Array.from(supplierContractStore.values())
      .filter((c) => c.supplierId === supplierId)
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((c) => ({ ...c }))
  }

  evaluateSupplier(
    supplierId: string,
    tenantId: string,
    input: {
      evaluatorId: string
      evaluatorName: string
      qualityScore: number
      deliveryScore: number
      serviceScore: number
      priceScore: number
      comment: string
    },
  ): SupplierEvaluation {
    const s = this.assertSupplierOwned(supplierId, tenantId)
    const now = new Date().toISOString()
    const evaluation: SupplierEvaluation = {
      id: `seval-${randomUUID()}`,
      supplierId,
      evaluatorId: input.evaluatorId,
      evaluatorName: input.evaluatorName,
      qualityScore: input.qualityScore,
      deliveryScore: input.deliveryScore,
      serviceScore: input.serviceScore,
      priceScore: input.priceScore,
      comment: input.comment,
      evaluatedAt: now,
    }
    supplierEvaluationStore.set(evaluation.id, evaluation)

    // Recalculate average
    const allEvals = Array.from(supplierEvaluationStore.values()).filter((e) => e.supplierId === supplierId)
    const avg =
      allEvals.reduce((sum, e) => sum + e.qualityScore + e.deliveryScore + e.serviceScore + e.priceScore, 0) /
      (allEvals.length * 4)
    s.averageScore = Math.round(avg * 10) / 10
    s.evaluationCount = allEvals.length
    s.updatedAt = now
    supplierStore.set(supplierId, s)
    return { ...evaluation }
  }

  listSupplierEvaluations(supplierId: string, tenantId: string): SupplierEvaluation[] {
    this.assertSupplierOwned(supplierId, tenantId)
    return Array.from(supplierEvaluationStore.values())
      .filter((e) => e.supplierId === supplierId)
      .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))
      .map((e) => ({ ...e }))
  }

  getSupplierMetrics(tenantId: string): SupplierMetrics {
    const suppliers = Array.from(supplierStore.values()).filter((s) => s.tenantId === tenantId)
    const byCreditLevel: Record<CreditLevel, number> = { A: 0, B: 0, C: 0, D: 0 }
    const byCategory: Record<string, number> = {}
    let avgScoreSum = 0
    let avgScoreCount = 0
    for (const s of suppliers) {
      byCreditLevel[s.creditLevel] = (byCreditLevel[s.creditLevel] ?? 0) + 1
      byCategory[s.category] = (byCategory[s.category] ?? 0) + 1
      if (s.evaluationCount > 0) {
        avgScoreSum += s.averageScore
        avgScoreCount++
      }
    }
    const totalContracts = Array.from(supplierContractStore.values()).filter(
      (c) => suppliers.some((s) => s.id === c.supplierId),
    ).length
    const activeContracts = Array.from(supplierContractStore.values()).filter(
      (c) =>
        suppliers.some((s) => s.id === c.supplierId) && new Date(c.endDate) > new Date(),
    ).length
    return {
      total: suppliers.length,
      active: suppliers.filter((s) => s.status === 'active').length,
      byCreditLevel,
      byCategory,
      avgScore: avgScoreCount > 0 ? Math.round((avgScoreSum / avgScoreCount) * 10) / 10 : 0,
      totalContracts,
      activeContracts,
    }
  }

  // ════════════════════════════════════════════════
  //  库存预留 (Inventory Reservation) - P-30 Phase 60%
  // ════════════════════════════════════════════════

  checkInventoryAvailability(
    tenantId: string,
    items: Array<{ itemId: string; itemName: string; quantity: number }>,
    warehouseCode?: string,
  ): InventoryCheckResult[] {
    // Simulated inventory check
    const simulatedStock: Record<string, number> = {
      'STK-005': 50,
      'STK-008': 100,
      'STK-012': 30,
      'STK-020': 10,
      'STK-025': 200,
    }
    return items.map((item) => {
      const available = simulatedStock[item.itemId] ?? 0
      return {
        itemId: item.itemId,
        itemName: item.itemName,
        requestedQuantity: item.quantity,
        availableQuantity: available,
        sufficient: available >= item.quantity,
        warehouseCode: warehouseCode ?? 'WH-MAIN',
      }
    })
  }

  createInventoryReservation(input: {
    tenantId: string
    materialRequestId?: string
    procurementRequestId?: string
    warehouseCode: string
    expiresAt: string
    operatorId: string
    operatorName: string
    note?: string
    items: Array<{
      itemId: string
      itemName: string
      category: string
      quantity: number
      unit: string
    }>
  }): InventoryReservation {
    // Check availability first
    const checks = this.checkInventoryAvailability(
      input.tenantId,
      input.items.map((i) => ({ itemId: i.itemId, itemName: i.itemName, quantity: i.quantity })),
      input.warehouseCode,
    )
    const insufficient = checks.filter((c) => !c.sufficient)
    if (insufficient.length > 0) {
      throw new Error(
        `Insufficient inventory: ${insufficient.map((c) => `${c.itemName} (need ${c.requestedQuantity}, avail ${c.availableQuantity})`).join(', ')}`,
      )
    }

    const now = new Date().toISOString()
    const reservation: InventoryReservation = {
      id: `res-${randomUUID()}`,
      tenantId: input.tenantId,
      materialRequestId: input.materialRequestId,
      procurementRequestId: input.procurementRequestId,
      reservationCode: `RES-${Date.now().toString(36).toUpperCase()}`,
      status: 'active',
      items: input.items.map((i) => ({ ...i })),
      warehouseCode: input.warehouseCode,
      expiresAt: input.expiresAt,
      operatorId: input.operatorId,
      operatorName: input.operatorName,
      note: input.note,
      createdAt: now,
      updatedAt: now,
    }
    inventoryReservationStore.set(reservation.id, reservation)
    return {
      ...reservation,
      items: reservation.items.map((i) => ({ ...i })),
    }
  }

  getInventoryReservation(id: string, tenantId: string): InventoryReservation | undefined {
    const r = inventoryReservationStore.get(id)
    if (!r || r.tenantId !== tenantId) return undefined
    return { ...r, items: r.items.map((i) => ({ ...i })) }
  }

  listInventoryReservations(
    tenantId: string,
    filter?: { status?: ReservationStatus; warehouseCode?: string; materialRequestId?: string },
  ): InventoryReservation[] {
    return Array.from(inventoryReservationStore.values())
      .filter((r) => r.tenantId === tenantId)
      .filter((r) => (filter?.status ? r.status === filter.status : true))
      .filter((r) => (filter?.warehouseCode ? r.warehouseCode === filter.warehouseCode : true))
      .filter((r) => (filter?.materialRequestId ? r.materialRequestId === filter.materialRequestId : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => ({ ...r, items: r.items.map((i) => ({ ...i })) }))
  }

  cancelInventoryReservation(id: string, tenantId: string): InventoryReservation {
    const r = inventoryReservationStore.get(id)
    if (!r || r.tenantId !== tenantId) throw new Error(`Inventory reservation not found: ${id}`)
    if (r.status !== 'active') {
      throw new Error(`Cannot cancel reservation with status ${r.status}`)
    }
    r.status = 'cancelled'
    r.updatedAt = new Date().toISOString()
    inventoryReservationStore.set(id, r)
    return { ...r, items: r.items.map((i) => ({ ...i })) }
  }

  fulfillInventoryReservation(id: string, tenantId: string): InventoryReservation {
    const r = inventoryReservationStore.get(id)
    if (!r || r.tenantId !== tenantId) throw new Error(`Inventory reservation not found: ${id}`)
    if (r.status !== 'active') {
      throw new Error(`Cannot fulfill reservation with status ${r.status}`)
    }
    r.status = 'fulfilled'
    r.updatedAt = new Date().toISOString()
    inventoryReservationStore.set(id, r)
    return { ...r, items: r.items.map((i) => ({ ...i })) }
  }

  // ════════════════════════════════════════════════
  //  设备巡检定时调度 (SchedulePlan) - P-30 Phase 60%
  // ════════════════════════════════════════════════

  createSchedulePlan(input: {
    tenantId: string
    storeId?: string
    name: string
    equipmentId: string
    equipmentName: string
    checkType: string
    cronExpression: string
    assigneeId: string
    assigneeName: string
    notes?: string
  }): SchedulePlan {
    const now = new Date().toISOString()
    const plan: SchedulePlan = {
      id: `splan-${randomUUID()}`,
      tenantId: input.tenantId,
      storeId: input.storeId,
      name: input.name,
      equipmentId: input.equipmentId,
      equipmentName: input.equipmentName,
      checkType: input.checkType,
      cronExpression: input.cronExpression,
      assigneeId: input.assigneeId,
      assigneeName: input.assigneeName,
      status: 'active',
      notes: input.notes,
      createdBy: input.tenantId,
      createdAt: now,
      updatedAt: now,
    }
    schedulePlanStore.set(plan.id, plan)
    return { ...plan }
  }

  getSchedulePlan(id: string, tenantId: string): SchedulePlan | undefined {
    const plan = schedulePlanStore.get(id)
    if (!plan || plan.tenantId !== tenantId) return undefined
    return { ...plan }
  }

  listSchedulePlans(
    tenantId: string,
    filter?: { status?: SchedulePlanStatus; equipmentId?: string; checkType?: string; assigneeId?: string },
  ): SchedulePlan[] {
    return Array.from(schedulePlanStore.values())
      .filter((p) => p.tenantId === tenantId)
      .filter((p) => (filter?.status ? p.status === filter.status : true))
      .filter((p) => (filter?.equipmentId ? p.equipmentId === filter.equipmentId : true))
      .filter((p) => (filter?.checkType ? p.checkType === filter.checkType : true))
      .filter((p) => (filter?.assigneeId ? p.assigneeId === filter.assigneeId : true))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({ ...p }))
  }

  updateSchedulePlan(
    id: string,
    tenantId: string,
    patch: Partial<Pick<SchedulePlan, 'name' | 'status' | 'cronExpression' | 'assigneeId' | 'assigneeName' | 'notes' | 'nextRunAt'>>,
  ): SchedulePlan {
    const plan = this.assertSchedulePlanOwned(id, tenantId)
    const updated: SchedulePlan = {
      ...plan,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    schedulePlanStore.set(id, updated)
    return { ...updated }
  }

  deleteSchedulePlan(id: string, tenantId: string): boolean {
    const plan = this.getSchedulePlan(id, tenantId)
    if (!plan) return false
    schedulePlanStore.delete(id)
    return true
  }

  /** 执行调度计划，生成检查日志 */
  executeSchedulePlan(
    id: string,
    tenantId: string,
    input: {
      executorId: string
      executorName: string
      resultStatus?: 'normal' | 'warning' | 'fault'
      resultNote?: string
    },
  ): ScheduleTaskLog {
    const plan = this.assertSchedulePlanOwned(id, tenantId)
    const now = new Date().toISOString()

    const log: ScheduleTaskLog = {
      id: `slog-${randomUUID()}`,
      planId: id,
      tenantId,
      equipmentId: plan.equipmentId,
      equipmentName: plan.equipmentName,
      status: 'completed',
      resultStatus: input.resultStatus ?? 'normal',
      resultNote: input.resultNote,
      executorId: input.executorId,
      executorName: input.executorName,
      scheduledAt: plan.nextRunAt ?? now,
      executedAt: now,
      createdAt: now,
    }
    scheduleTaskLogStore.set(log.id, log)

    plan.lastRunAt = now
    plan.updatedAt = now
    schedulePlanStore.set(id, plan)

    return { ...log }
  }

  listScheduleTaskLogs(
    planId: string,
    tenantId: string,
    limit = 20,
  ): ScheduleTaskLog[] {
    return Array.from(scheduleTaskLogStore.values())
      .filter((l) => l.planId === planId && l.tenantId === tenantId)
      .sort((a, b) => b.executedAt!.localeCompare(a.executedAt!))
      .slice(0, limit)
      .map((l) => ({ ...l }))
  }

  getSchedulePlanMetrics(tenantId: string): SchedulePlanMetrics {
    const plans = Array.from(schedulePlanStore.values()).filter((p) => p.tenantId === tenantId)
    const logs = Array.from(scheduleTaskLogStore.values()).filter((l) => l.tenantId === tenantId)
    return {
      total: plans.length,
      active: plans.filter((p) => p.status === 'active').length,
      paused: plans.filter((p) => p.status === 'paused').length,
      totalExecutions: logs.length,
      completedExecutions: logs.filter((l) => l.status === 'completed').length,
      failedExecutions: logs.filter((l) => l.status === 'failed').length,
    }
  }

  /** 基于cron表达式计算下次执行时间 */
  computeNextRun(
    planId: string,
    tenantId: string,
    referenceTime: string = new Date().toISOString(),
  ): SchedulePlan {
    const plan = this.assertSchedulePlanOwned(planId, tenantId)
    // Simple cron simulation: advance by interval based on cron parts
    // For the purpose of P-30 Phase 60%, we simulate by advancing time
    const parts = plan.cronExpression.split(/\s+/)
    const ref = new Date(referenceTime)
    let next = new Date(ref)

    if (parts.length >= 5) {
      const [, , dayOfMonth, , dayOfWeek] = parts
      if (dayOfWeek === '*' && dayOfMonth === '*') {
        // Daily: next run = tomorrow
        next.setDate(next.getDate() + 1)
      } else if (dayOfWeek !== '*') {
        // Weekly: +7 days
        next.setDate(next.getDate() + 7)
      } else if (dayOfMonth !== '*') {
        // Monthly: +30 days
        next.setDate(next.getDate() + 30)
      } else {
        next.setDate(next.getDate() + 1)
      }
    } else {
      next.setDate(next.getDate() + 1)
    }

    plan.nextRunAt = next.toISOString()
    plan.updatedAt = ref.toISOString()
    schedulePlanStore.set(planId, plan)
    return { ...plan }
  }

  /** 批量扫描并触发到期的调度计划 */
  sweepDueSchedules(now: string = new Date().toISOString()): {
    scanned: number
    triggered: number
    logs: ScheduleTaskLog[]
  } {
    const duePlans = Array.from(schedulePlanStore.values())
      .filter((p) => p.status === 'active')
      .filter(
        (p) =>
          !p.nextRunAt || new Date(p.nextRunAt) <= new Date(now),
      )

    const logs: ScheduleTaskLog[] = []
    for (const plan of duePlans) {
      const log = this.executeSchedulePlan(plan.id, plan.tenantId, {
        executorId: plan.assigneeId,
        executorName: plan.assigneeName,
        resultStatus: undefined, // auto-trigger, no result yet
        resultNote: 'Auto-triggered by sweep',
      })
      logs.push(log)
      this.computeNextRun(plan.id, plan.tenantId, now)
    }

    return {
      scanned: duePlans.length,
      triggered: logs.length,
      logs,
    }
  }

  private assertOwned(id: string, tenantId: string): InspectionTaskEntity {
    const task = inspectionTaskStore.get(id)
    if (!task || task.tenantId !== tenantId) {
      throw new Error(`Inspection task not found: ${id}`)
    }
    return task
  }

  private assertRepairOwned(id: string, tenantId: string): RepairOrderEntity {
    const order = repairOrderStore.get(id)
    if (!order || order.tenantId !== tenantId) {
      throw new Error(`Repair order not found: ${id}`)
    }
    return order
  }

  private assertCleanOwned(id: string, tenantId: string): CleanScheduleEntity {
    const schedule = cleanScheduleStore.get(id)
    if (!schedule || schedule.tenantId !== tenantId) {
      throw new Error(`Clean schedule not found: ${id}`)
    }
    return schedule
  }

  private assertMaterialOwned(id: string, tenantId: string): MaterialRequestEntity {
    const request = materialRequestStore.get(id)
    if (!request || request.tenantId !== tenantId) {
      throw new Error(`Material request not found: ${id}`)
    }
    return request
  }

  private assertMaintenanceOwned(id: string, tenantId: string): MaintenanceOrderEntity {
    const order = maintenanceOrderStore.get(id)
    if (!order || order.tenantId !== tenantId) {
      throw new Error(`Maintenance order not found: ${id}`)
    }
    return order
  }

  private assertProcurementOwned(id: string, tenantId: string): ProcurementRequestEntity {
    const request = procurementRequestStore.get(id)
    if (!request || request.tenantId !== tenantId) {
      throw new Error(`Procurement request not found: ${id}`)
    }
    return request
  }

  private normalizeMaterialRequestItem(
    item: CreateMaterialRequestInput['items'][number],
    index: number
  ): MaterialRequestItem {
    const itemId = item.itemId.trim()
    const itemName = item.itemName.trim()
    const category = item.category.trim()
    const unit = item.unit.trim()

    if (!itemId) {
      throw new Error(`items[${index}].itemId is required`)
    }
    if (!itemName) {
      throw new Error(`items[${index}].itemName is required`)
    }
    if (!category) {
      throw new Error(`items[${index}].category is required`)
    }
    if (!unit) {
      throw new Error(`items[${index}].unit is required`)
    }
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error(`items[${index}].quantity must be greater than 0`)
    }

    return {
      itemId,
      itemName,
      category,
      unit,
      quantity: item.quantity
    }
  }

  private assertSupplierOwned(id: string, tenantId: string): Supplier {
    const s = supplierStore.get(id)
    if (!s || s.tenantId !== tenantId) {
      throw new Error(`Supplier not found: ${id}`)
    }
    return s
  }

  private assertSchedulePlanOwned(id: string, tenantId: string): SchedulePlan {
    const plan = schedulePlanStore.get(id)
    if (!plan || plan.tenantId !== tenantId) {
      throw new Error(`Schedule plan not found: ${id}`)
    }
    return plan
  }

  private normalizeTimestamp(raw: string | undefined, errorMessage: string): string {
    const normalized = new Date(raw ?? new Date().toISOString())
    if (Number.isNaN(normalized.getTime())) {
      throw new Error(errorMessage)
    }
    return normalized.toISOString()
  }

  private normalizeDate(raw: string, errorMessage: string): string {
    const normalized = new Date(`${raw}T00:00:00.000Z`)
    if (Number.isNaN(normalized.getTime())) {
      throw new Error(errorMessage)
    }
    return normalized.toISOString().slice(0, 10)
  }
}
