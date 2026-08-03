import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { TenantGuard } from '../agent/tenant.guard'

import {
  CreateInspectionRecordDto,
  UpdateInspectionRecordDto,
  InspectionRecordQueryDto,
  CreatePatrolTaskDto,
  UpdatePatrolTaskDto,
  PatrolTaskQueryDto,
  CreateRectificationRecordDto,
  UpdateRectificationRecordDto,
  RectificationQueryDto,
} from './quality.dto'

import { PatrolArea, PatrolTaskPriority, RectificationStatus, Severity } from './quality.entity'
import { InspectionType } from '../quality-inspection/quality-inspection.entity'
import { QualityService } from './quality.service'

@Controller('quality')
@UseGuards(TenantGuard)
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  // ═══════════════════════════════════════════════════════════════════
  // 1. Inspection Records (delegated back to quality-inspection)
  // ═══════════════════════════════════════════════════════════════════

  @Post('inspections')
  createInspection(
    @TenantContext() tenant: RequestTenantContext,
    @Body() body: CreateInspectionRecordDto
  ) {
    return this.qualityService.inspection.createInspection({
      tenantId: tenant.tenantId,
      inspectNo: body.inspectNo,
      type: body.type,
      itemName: body.itemName,
      itemBatch: body.itemBatch,
      result: body.result,
      severity: body.severity,
      defects: body.defects,
      inspector: body.inspector,
      inspectedAt: body.inspectedAt,
      notes: body.notes,
    })
  }

  @Get('inspections')
  listInspections(
    @TenantContext() tenant: RequestTenantContext,
    @Query() query: InspectionRecordQueryDto
  ) {
    return this.qualityService.inspection.listInspections(tenant.tenantId, {
      type: query.type,
      result: query.result,
      severity: query.severity,
      inspector: query.inspector,
      search: query.search,
    })
  }

  @Get('inspections/:inspectId')
  getInspection(
    @TenantContext() tenant: RequestTenantContext,
    @Param('inspectId') inspectId: string
  ) {
    const record = this.qualityService.inspection.getInspection(inspectId, tenant.tenantId)
    if (!record) {
      throw new Error(`Inspection record not found: ${inspectId}`)
    }
    return record
  }

  @Patch('inspections/:inspectId')
  updateInspection(
    @TenantContext() tenant: RequestTenantContext,
    @Param('inspectId') inspectId: string,
    @Body() body: UpdateInspectionRecordDto
  ) {
    return this.qualityService.inspection.updateInspection(inspectId, tenant.tenantId, body)
  }

  @Delete('inspections/:inspectId')
  deleteInspection(
    @TenantContext() tenant: RequestTenantContext,
    @Param('inspectId') inspectId: string
  ) {
    this.qualityService.inspection.deleteInspection(inspectId, tenant.tenantId)
    return { success: true }
  }

  // ── Inspection query views ──

  @Get('inspections/views/failed')
  getFailedInspections(
    @TenantContext() tenant: RequestTenantContext
  ) {
    return this.qualityService.inspection.getFailedInspections(tenant.tenantId)
  }

  @Get('inspections/views/pass-rate')
  getPassRate(
    @TenantContext() tenant: RequestTenantContext
  ) {
    return this.qualityService.inspection.getPassRate(tenant.tenantId)
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. Patrol Tasks  — 巡查任务
  // ═══════════════════════════════════════════════════════════════════

  @Post('patrol-tasks')
  createPatrolTask(
    @TenantContext() tenant: RequestTenantContext,
    @Body() body: CreatePatrolTaskDto
  ) {
    return this.qualityService.createPatrolTask({
      tenantId: tenant.tenantId,
      patrolNo: body.patrolNo,
      title: body.title,
      description: body.description,
      area: body.area,
      priority: body.priority,
      checkItems: body.checkItems,
      assignedTo: body.assignedTo,
      scheduledAt: body.scheduledAt,
      notes: body.notes,
    })
  }

  @Get('patrol-tasks')
  listPatrolTasks(
    @TenantContext() tenant: RequestTenantContext,
    @Query() query: PatrolTaskQueryDto
  ) {
    return this.qualityService.listPatrolTasks(tenant.tenantId, {
      status: query.status,
      area: query.area,
      priority: query.priority,
      assignedTo: query.assignedTo,
      search: query.search,
    })
  }

  @Get('patrol-tasks/:patrolId')
  getPatrolTask(
    @TenantContext() tenant: RequestTenantContext,
    @Param('patrolId') patrolId: string
  ) {
    const task = this.qualityService.getPatrolTask(patrolId, tenant.tenantId)
    if (!task) {
      throw new Error(`Patrol task not found: ${patrolId}`)
    }
    return task
  }

  @Patch('patrol-tasks/:patrolId')
  updatePatrolTask(
    @TenantContext() tenant: RequestTenantContext,
    @Param('patrolId') patrolId: string,
    @Body() body: UpdatePatrolTaskDto
  ) {
    return this.qualityService.updatePatrolTask(patrolId, tenant.tenantId, body)
  }

  @Delete('patrol-tasks/:patrolId')
  deletePatrolTask(
    @TenantContext() tenant: RequestTenantContext,
    @Param('patrolId') patrolId: string
  ) {
    this.qualityService.deletePatrolTask(patrolId, tenant.tenantId)
    return { success: true }
  }

  // ── Patrol query views ──

  @Get('patrol-tasks/views/pending')
  getPendingPatrolTasks(
    @TenantContext() tenant: RequestTenantContext
  ) {
    return this.qualityService.getPendingPatrolTasks(tenant.tenantId)
  }

  @Get('patrol-tasks/views/overdue')
  getOverduePatrolTasks(
    @TenantContext() tenant: RequestTenantContext
  ) {
    return this.qualityService.getOverduePatrolTasks(tenant.tenantId)
  }

  @Get('patrol-tasks/area/:area')
  getPatrolTasksByArea(
    @TenantContext() tenant: RequestTenantContext,
    @Param('area') area: string
  ) {
    return this.qualityService.listPatrolTasks(tenant.tenantId, {
      area: area as PatrolArea,
    })
  }

  // ═══════════════════════════════════════════════════════════════════
  // 3. Rectification Records  — 整改记录
  // ═══════════════════════════════════════════════════════════════════

  @Post('rectifications')
  createRectification(
    @TenantContext() tenant: RequestTenantContext,
    @Body() body: CreateRectificationRecordDto
  ) {
    return this.qualityService.createRectificationRecord({
      tenantId: tenant.tenantId,
      rectificationNo: body.rectificationNo,
      sourceInspectionId: body.sourceInspectionId,
      sourceInspectNo: body.sourceInspectNo,
      title: body.title,
      description: body.description,
      severity: body.severity,
      responsiblePerson: body.responsiblePerson,
      actions: body.actions,
      deadline: body.deadline,
      notes: body.notes,
    })
  }

  @Get('rectifications')
  listRectifications(
    @TenantContext() tenant: RequestTenantContext,
    @Query() query: RectificationQueryDto
  ) {
    return this.qualityService.listRectificationRecords(tenant.tenantId, {
      status: query.status,
      severity: query.severity,
      responsiblePerson: query.responsiblePerson,
      search: query.search,
    })
  }

  @Get('rectifications/:rectId')
  getRectification(
    @TenantContext() tenant: RequestTenantContext,
    @Param('rectId') rectId: string
  ) {
    const record = this.qualityService.getRectificationRecord(rectId, tenant.tenantId)
    if (!record) {
      throw new Error(`Rectification record not found: ${rectId}`)
    }
    return record
  }

  @Patch('rectifications/:rectId')
  updateRectification(
    @TenantContext() tenant: RequestTenantContext,
    @Param('rectId') rectId: string,
    @Body() body: UpdateRectificationRecordDto
  ) {
    return this.qualityService.updateRectificationRecord(rectId, tenant.tenantId, body)
  }

  @Delete('rectifications/:rectId')
  deleteRectification(
    @TenantContext() tenant: RequestTenantContext,
    @Param('rectId') rectId: string
  ) {
    this.qualityService.deleteRectificationRecord(rectId, tenant.tenantId)
    return { success: true }
  }

  // ── Rectification query views ──

  @Get('rectifications/views/open')
  getOpenRectifications(
    @TenantContext() tenant: RequestTenantContext
  ) {
    return this.qualityService.getOpenRectificationRecords(tenant.tenantId)
  }

  @Get('rectifications/views/overdue')
  getOverdueRectifications(
    @TenantContext() tenant: RequestTenantContext
  ) {
    return this.qualityService.getOverdueRectificationRecords(tenant.tenantId)
  }

  @Get('rectifications/views/stats')
  getRectificationStats(
    @TenantContext() tenant: RequestTenantContext
  ) {
    return this.qualityService.getRectificationStats(tenant.tenantId)
  }
}
