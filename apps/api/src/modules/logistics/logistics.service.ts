import { randomUUID } from 'node:crypto'
import { Injectable, Optional } from '@nestjs/common'
import {
  FoundationScopeType,
  NotificationChannelType
} from '../notification/notification.entity'
import { NotificationService } from '../notification/notification.service'
import type {
  InspectionResultStatus,
  InspectionTaskEntity,
  InspectionTaskResult,
  InspectionTaskStatus
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

const inspectionTaskStore = new Map<string, InspectionTaskEntity>()

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

  resetStoreForTests(): void {
    inspectionTaskStore.clear()
  }

  private assertOwned(id: string, tenantId: string): InspectionTaskEntity {
    const task = inspectionTaskStore.get(id)
    if (!task || task.tenantId !== tenantId) {
      throw new Error(`Inspection task not found: ${id}`)
    }
    return task
  }
}
