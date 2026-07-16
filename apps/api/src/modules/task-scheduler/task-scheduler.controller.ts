import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  BatchTaskStatusDto,
  CreateTaskDto,
  TaskQueryDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
} from './task-scheduler.dto'
import { TaskSchedulerService } from './task-scheduler.service'

@Controller('task-scheduler')
export class TaskSchedulerController {
  constructor(private readonly taskService: TaskSchedulerService) {}

  // ── CRUD ──

  @Post()
  createTask(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateTaskDto
  ) {
    return this.taskService.createTask({
      tenantId: tenantContext.tenantId,
      name: body.name,
      type: body.type,
      priority: body.priority,
      cronExpr: body.cronExpr,
      assignedTo: body.assignedTo,
      startTime: body.startTime,
      endTime: body.endTime,
      description: body.description,
    })
  }

  @Get()
  listTasks(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: TaskQueryDto
  ) {
    return this.taskService.listTasks(tenantContext.tenantId, {
      status: query.status,
      type: query.type,
      priority: query.priority,
      assignedTo: query.assignedTo,
    })
  }

  @Get(':taskId')
  getTask(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('taskId') taskId: string
  ) {
    const task = this.taskService.getTask(taskId, tenantContext.tenantId)
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }
    return task
  }

  @Patch(':taskId')
  updateTask(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('taskId') taskId: string,
    @Body() body: UpdateTaskDto
  ) {
    return this.taskService.updateTask(taskId, tenantContext.tenantId, body)
  }

  @Delete(':taskId')
  deleteTask(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('taskId') taskId: string
  ) {
    this.taskService.deleteTask(taskId, tenantContext.tenantId)
    return { success: true }
  }

  // ── Status management ──

  @Patch(':taskId/status')
  updateTaskStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('taskId') taskId: string,
    @Body() body: UpdateTaskStatusDto
  ) {
    return this.taskService.updateTaskStatus(
      taskId,
      body.status,
      tenantContext.tenantId
    )
  }

  @Post('batch-status')
  batchUpdateStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: BatchTaskStatusDto
  ) {
    return this.taskService.batchUpdateStatus(
      body.taskIds,
      body.status,
      tenantContext.tenantId
    )
  }

  // ── Scheduling views ──

  @Get('views/pending')
  getPendingTasks(
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.taskService.getPendingTasks(tenantContext.tenantId)
  }

  @Get('views/recurring')
  getRecurringTasks(
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.taskService.getRecurringTasks(tenantContext.tenantId)
  }

  @Get('views/shifts')
  getShiftTasks(
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.taskService.getShiftTasks(tenantContext.tenantId)
  }

  @Get('assignee/:assignedTo')
  getTaskByAssignee(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('assignedTo') assignedTo: string
  ) {
    return this.taskService.getTaskByAssignee(assignedTo, tenantContext.tenantId)
  }
}
