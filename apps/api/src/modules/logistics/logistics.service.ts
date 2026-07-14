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
  MaterialRequestEntity,
  MaterialRequestItem,
  MaterialRequestStatus,
  RepairOrderEntity,
  RepairOrderStatus
} from './logistics.entity'

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

const inspectionTaskStore = new Map<string, InspectionTaskEntity>()
const cleanScheduleStore = new Map<string, CleanScheduleEntity>()
const repairOrderStore = new Map<string, RepairOrderEntity>()
const materialRequestStore = new Map<string, MaterialRequestEntity>()

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

  resetStoreForTests(): void {
    inspectionTaskStore.clear()
    cleanScheduleStore.clear()
    repairOrderStore.clear()
    materialRequestStore.clear()
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
