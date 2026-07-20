import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Patch,
  Query,
  Delete
} from '@nestjs/common'
import { LogisticsService } from './logistics.service'
import type {
  CleanScheduleStatus,
  MaintenanceOrderStatus,
  MaterialRequestStatus,
  ProcurementRequestStatus,
  RepairOrderStatus
} from './logistics.entity'
import type {
  SupplierStatus,
  CreditLevel,
} from './logistics.supplier.entity'
import type {
  ReservationStatus,
} from './logistics.inventory.entity'
import type {
  SchedulePlanStatus,
} from './logistics.schedule.entity'
import type {
  FeedbackScore,
  AlertTriggerType,
} from './logistics.phase-p30-80.entity'

@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Post('inspections')
  create(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createInspectionTask({
      tenantId,
      storeId: body.storeId,
      equipmentId: body.equipmentId,
      equipmentName: body.equipmentName,
      assigneeId: body.assigneeId,
      assigneeName: body.assigneeName,
      scheduledAt: body.scheduledAt
    })
  }

  @Get('inspections')
  list(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: 'scheduled' | 'reminded' | 'completed',
    @Query('equipmentId') equipmentId?: string
  ) {
    return this.logisticsService.listInspectionTasks(tenantId, { status, equipmentId })
  }

  @Get('inspections/:id')
  detail(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getInspectionTask(id, tenantId) ?? null
  }

  @Post('inspections/:id/remind')
  remind(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { now?: string }
  ) {
    return this.logisticsService.sendInspectionReminder(id, tenantId, body?.now)
  }

  @Post('inspections/sweep/reminders')
  sweep(@Body() body: { now?: string }) {
    return this.logisticsService.sweepDueInspectionReminders(body?.now)
  }

  @Post('inspections/:id/result')
  recordResult(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      status: 'normal' | 'warning' | 'fault'
      note: string
      inspectorId: string
      inspectorName: string
    }
  ) {
    return this.logisticsService.recordInspectionResult(id, tenantId, body)
  }

  @Post('clean-schedules')
  createCleanSchedule(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createCleanSchedule({
      tenantId,
      storeId: body.storeId,
      assigneeId: body.assigneeId,
      assigneeName: body.assigneeName,
      shiftName: body.shiftName,
      shiftTime: body.shiftTime,
      scheduledDate: body.scheduledDate
    })
  }

  @Get('clean-schedules')
  listCleanSchedules(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: CleanScheduleStatus,
    @Query('scheduledDate') scheduledDate?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('areaCode') areaCode?: string
  ) {
    return this.logisticsService.listCleanSchedules(tenantId, {
      status,
      scheduledDate,
      assigneeId,
      areaCode
    })
  }

  @Get('clean-schedules/:id')
  cleanScheduleDetail(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getCleanSchedule(id, tenantId) ?? null
  }

  @Post('clean-schedules/:id/assign-area')
  assignCleanArea(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { areaCode: string; areaName: string; assignedAt?: string }
  ) {
    return this.logisticsService.assignCleanArea(id, tenantId, body)
  }

  @Post('clean-schedules/:id/check-in')
  checkInCleanSchedule(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      cleanerId: string
      cleanerName: string
      checkedInAt?: string
      note?: string
    }
  ) {
    return this.logisticsService.checkInCleanSchedule(id, tenantId, body)
  }

  @Post('repairs')
  createRepairOrder(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createRepairOrder({
      tenantId,
      storeId: body.storeId,
      inspectionTaskId: body.inspectionTaskId,
      equipmentId: body.equipmentId,
      equipmentName: body.equipmentName,
      issueDescription: body.issueDescription,
      reporterId: body.reporterId,
      reporterName: body.reporterName
    })
  }

  @Get('repairs')
  listRepairOrders(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: RepairOrderStatus,
    @Query('equipmentId') equipmentId?: string,
    @Query('assigneeId') assigneeId?: string
  ) {
    return this.logisticsService.listRepairOrders(tenantId, { status, equipmentId, assigneeId })
  }

  @Get('repairs/:id')
  repairDetail(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getRepairOrder(id, tenantId) ?? null
  }

  @Post('repairs/:id/assign')
  assignRepairOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { assigneeId: string; assigneeName: string; assignedAt?: string }
  ) {
    return this.logisticsService.assignRepairOrder(id, tenantId, body)
  }

  @Post('repairs/:id/start')
  startRepairOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { startedAt?: string }
  ) {
    return this.logisticsService.startRepairOrder(id, tenantId, body)
  }

  @Post('repairs/:id/complete')
  completeRepairOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      completionNote: string
      technicianId: string
      technicianName: string
      completedAt?: string
    }
  ) {
    return this.logisticsService.completeRepairOrder(id, tenantId, body)
  }

  @Post('repairs/:id/verify')
  verifyRepairOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { verifierId: string; verifierName: string; note: string; verifiedAt?: string }
  ) {
    return this.logisticsService.verifyRepairOrder(id, tenantId, body)
  }

  @Post('material-requests')
  createMaterialRequest(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createMaterialRequest({
      tenantId,
      storeId: body.storeId,
      requesterId: body.requesterId,
      requesterName: body.requesterName,
      department: body.department,
      purpose: body.purpose,
      items: body.items
    })
  }

  @Get('material-requests')
  listMaterialRequests(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: MaterialRequestStatus,
    @Query('requesterId') requesterId?: string,
    @Query('category') category?: string
  ) {
    return this.logisticsService.listMaterialRequests(tenantId, {
      status,
      requesterId,
      category
    })
  }

  @Get('material-requests/:id')
  materialRequestDetail(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getMaterialRequest(id, tenantId) ?? null
  }

  @Post('material-requests/:id/approve')
  approveMaterialRequest(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { approverId: string; approverName: string; note: string; approvedAt?: string }
  ) {
    return this.logisticsService.approveMaterialRequest(id, tenantId, body)
  }

  @Post('material-requests/:id/outbound')
  outboundMaterialRequest(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      operatorId: string
      operatorName: string
      warehouseCode?: string
      note?: string
      outboundAt?: string
    }
  ) {
    return this.logisticsService.outboundMaterialRequest(id, tenantId, body)
  }

  // ═══════════════════════════════════════════
  //  设备维保 (MaintenanceOrder)
  // ═══════════════════════════════════════════

  @Post('maintenance-orders')
  createMaintenanceOrder(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createMaintenanceOrder({
      tenantId,
      storeId: body.storeId,
      equipmentId: body.equipmentId,
      equipmentName: body.equipmentName,
      issueDescription: body.issueDescription,
      reporterId: body.reporterId,
      reporterName: body.reporterName,
    })
  }

  @Get('maintenance-orders')
  listMaintenanceOrders(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: MaintenanceOrderStatus,
    @Query('equipmentId') equipmentId?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.logisticsService.listMaintenanceOrders(tenantId, { status, equipmentId, assigneeId })
  }

  @Get('maintenance-orders/:id')
  getMaintenanceOrder(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getMaintenanceOrder(id, tenantId) ?? null
  }

  @Post('maintenance-orders/:id/start')
  startMaintenanceOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { assigneeId: string; assigneeName: string; startedAt?: string }
  ) {
    return this.logisticsService.startMaintenanceOrder(id, tenantId, body)
  }

  @Post('maintenance-orders/:id/complete')
  completeMaintenanceOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { completionNote: string; completedAt?: string }
  ) {
    return this.logisticsService.completeMaintenanceOrder(id, tenantId, body)
  }

  @Post('maintenance-orders/:id/accept')
  acceptMaintenanceOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { acceptedBy: string; acceptanceNote: string; acceptedAt?: string }
  ) {
    return this.logisticsService.acceptMaintenanceOrder(id, tenantId, body)
  }

  // ═══════════════════════════════════════════
  //  耗材采购 (对接 P-37 审批流)
  // ═══════════════════════════════════════════

  @Post('procurement-requests')
  createProcurementRequest(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createProcurementRequest({
      tenantId,
      storeId: body.storeId,
      requesterId: body.requesterId,
      requesterName: body.requesterName,
      department: body.department,
      purpose: body.purpose,
      vendorName: body.vendorName,
      notes: body.notes,
    })
  }

  @Get('procurement-requests')
  listProcurementRequests(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: ProcurementRequestStatus,
    @Query('requesterId') requesterId?: string,
  ) {
    return this.logisticsService.listProcurementRequests(tenantId, { status, requesterId })
  }

  @Get('procurement-requests/:id')
  getProcurementRequest(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getProcurementRequest(id, tenantId) ?? null
  }

  @Post('procurement-requests/:id/submit')
  submitProcurementRequest(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.submitProcurementRequest(id, tenantId)
  }

  @Post('procurement-requests/:id/approve')
  approveProcurementRequest(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { approverId: string; approverName: string; note: string; approvalTicket?: string; approvedAt?: string }
  ) {
    return this.logisticsService.approveProcurementRequest(id, tenantId, body)
  }

  @Post('procurement-requests/:id/reject')
  rejectProcurementRequest(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { rejecterId: string; rejecterName: string; reason: string }
  ) {
    return this.logisticsService.rejectProcurementRequest(id, tenantId, body)
  }

  @Post('procurement-requests/:id/order')
  orderProcurementRequest(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { orderNumber: string; vendorName: string; operatorId: string; operatorName: string }
  ) {
    return this.logisticsService.orderProcurementRequest(id, tenantId, body)
  }

  @Post('procurement-requests/:id/receive')
  receiveProcurementRequest(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { receivedBy: string; receivedByName: string; note?: string }
  ) {
    return this.logisticsService.receiveProcurementRequest(id, tenantId, body)
  }

  // ═══════════════════════════════════════════
  //  供应商管理 (Supplier) - P-30 Phase 60%
  // ═══════════════════════════════════════════

  @Post('suppliers')
  createSupplier(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: {
      code: string
      name: string
      category: string
      status?: SupplierStatus
      creditLevel?: CreditLevel
      address?: string
      mainProducts?: string[]
      cooperationYears?: number
      notes?: string
    }
  ) {
    return this.logisticsService.createSupplier({ tenantId, ...body })
  }

  @Get('suppliers')
  listSuppliers(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: SupplierStatus,
    @Query('creditLevel') creditLevel?: CreditLevel,
    @Query('category') category?: string,
    @Query('search') search?: string
  ) {
    return this.logisticsService.listSuppliers(tenantId, { status, creditLevel, category, search })
  }

  @Get('suppliers/:id')
  getSupplier(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getSupplier(id, tenantId) ?? null
  }

  @Patch('suppliers/:id')
  updateSupplier(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.logisticsService.updateSupplier(id, tenantId, body)
  }

  @Delete('suppliers/:id')
  deleteSupplier(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    const result = this.logisticsService.deleteSupplier(id, tenantId)
    return { success: result }
  }

  @Post('suppliers/:id/contacts')
  addSupplierContact(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { name: string; phone: string; email?: string; position?: string }
  ) {
    return this.logisticsService.addSupplierContact(id, tenantId, body)
  }

  @Post('suppliers/:id/contracts')
  addSupplierContract(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      type: 'annual' | 'quarterly' | 'project' | 'one_time'
      contractNumber: string
      startDate: string
      endDate: string
      amount: number
      autoRenew?: boolean
      terms?: string
      signedAt?: string
    }
  ) {
    return this.logisticsService.addSupplierContract(id, tenantId, body)
  }

  @Get('suppliers/:id/contracts')
  listSupplierContracts(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.listSupplierContracts(id, tenantId)
  }

  @Post('suppliers/:id/evaluations')
  evaluateSupplier(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      evaluatorId: string
      evaluatorName: string
      qualityScore: number
      deliveryScore: number
      serviceScore: number
      priceScore: number
      comment: string
    }
  ) {
    return this.logisticsService.evaluateSupplier(id, tenantId, body)
  }

  @Get('suppliers/:id/evaluations')
  listSupplierEvaluations(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.listSupplierEvaluations(id, tenantId)
  }

  @Get('suppliers/metrics')
  getSupplierMetrics(@Headers('x-tenant-id') tenantId: string) {
    return this.logisticsService.getSupplierMetrics(tenantId)
  }

  // ═══════════════════════════════════════════
  //  库存预留 (Inventory Reservation) - P-30 Phase 60%
  // ═══════════════════════════════════════════

  @Post('inventory/check')
  checkInventory(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: {
      items: Array<{ itemId: string; itemName: string; quantity: number }>
      warehouseCode?: string
    }
  ) {
    return this.logisticsService.checkInventoryAvailability(tenantId, body.items, body.warehouseCode)
  }

  @Post('inventory/reservations')
  createReservation(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: {
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
    }
  ) {
    return this.logisticsService.createInventoryReservation({ tenantId, ...body })
  }

  @Get('inventory/reservations')
  listReservations(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: ReservationStatus,
    @Query('warehouseCode') warehouseCode?: string,
    @Query('materialRequestId') materialRequestId?: string
  ) {
    return this.logisticsService.listInventoryReservations(tenantId, {
      status,
      warehouseCode,
      materialRequestId,
    })
  }

  @Get('inventory/reservations/:id')
  getReservation(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getInventoryReservation(id, tenantId) ?? null
  }

  @Post('inventory/reservations/:id/cancel')
  cancelReservation(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.cancelInventoryReservation(id, tenantId)
  }

  @Post('inventory/reservations/:id/fulfill')
  fulfillReservation(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.fulfillInventoryReservation(id, tenantId)
  }

  // ═══════════════════════════════════════════
  //  设备巡检定时调度 (SchedulePlan) - P-30 Phase 60%
  // ═══════════════════════════════════════════

  @Post('schedule-plans')
  createSchedulePlan(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: {
      name: string
      equipmentId: string
      equipmentName: string
      checkType: string
      cronExpression: string
      assigneeId: string
      assigneeName: string
      storeId?: string
      notes?: string
    }
  ) {
    return this.logisticsService.createSchedulePlan({ tenantId, ...body })
  }

  @Get('schedule-plans')
  listSchedulePlans(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: SchedulePlanStatus,
    @Query('equipmentId') equipmentId?: string,
    @Query('checkType') checkType?: string,
    @Query('assigneeId') assigneeId?: string
  ) {
    return this.logisticsService.listSchedulePlans(tenantId, { status, equipmentId, checkType, assigneeId })
  }

  @Get('schedule-plans/:id')
  getSchedulePlan(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getSchedulePlan(id, tenantId) ?? null
  }

  @Patch('schedule-plans/:id')
  updateSchedulePlan(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.logisticsService.updateSchedulePlan(id, tenantId, body)
  }

  @Delete('schedule-plans/:id')
  deleteSchedulePlan(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    const result = this.logisticsService.deleteSchedulePlan(id, tenantId)
    return { success: result }
  }

  @Post('schedule-plans/:id/compute-next-run')
  computeNextRun(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { referenceTime?: string }
  ) {
    return this.logisticsService.computeNextRun(id, tenantId, body.referenceTime)
  }

  @Post('schedule-plans/sweep')
  sweepDueSchedules(@Body() body: { now?: string }) {
    return this.logisticsService.sweepDueSchedules(body.now)
  }

  @Post('schedule-plans/:id/execute')
  executeSchedulePlan(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      executorId: string
      executorName: string
      resultStatus?: 'normal' | 'warning' | 'fault'
      resultNote?: string
    }
  ) {
    return this.logisticsService.executeSchedulePlan(id, tenantId, body)
  }

  @Get('schedule-plans/:id/logs')
  listScheduleTaskLogs(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Query('limit') limit?: string
  ) {
    return this.logisticsService.listScheduleTaskLogs(id, tenantId, limit ? parseInt(limit, 10) : 20)
  }

  @Get('schedule-plans/metrics')
  getSchedulePlanMetrics(@Headers('x-tenant-id') tenantId: string) {
    return this.logisticsService.getSchedulePlanMetrics(tenantId)
  }

  // ═══════════════════════════════════════════
  //  维修反馈闭环 (RepairFeedback + RepairKnowledge) - P-30 Phase 80%
  // ═══════════════════════════════════════════

  @Post('repair-feedbacks')
  createRepairFeedback(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: {
      repairOrderId: string
      maintenanceOrderId?: string
      score: FeedbackScore
      comment: string
      reviewerId: string
      reviewerName: string
      timely: boolean
      qualitySatisfied: boolean
    }
  ) {
    return this.logisticsService.createRepairFeedback({ tenantId, ...body })
  }

  @Get('repair-feedbacks')
  listRepairFeedbacks(
    @Headers('x-tenant-id') tenantId: string,
    @Query('score') score?: string,
    @Query('repairOrderId') repairOrderId?: string,
  ) {
    return this.logisticsService.listRepairFeedbacks(tenantId, {
      score: score ? parseInt(score, 10) as FeedbackScore : undefined,
      repairOrderId,
    })
  }

  @Get('repair-feedbacks/:id')
  getRepairFeedback(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getRepairFeedback(id, tenantId) ?? null
  }

  @Post('repair-knowledge')
  createRepairKnowledge(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: {
      repairOrderId: string
      maintenanceOrderId?: string
      equipmentId: string
      equipmentName: string
      issueType: string
      issueDescription: string
      rootCause: string
      solution: string
      partsUsed?: string[]
      repairHours?: number
      technicianId: string
      technicianName: string
      isCommonCase?: boolean
      tags?: string[]
    }
  ) {
    return this.logisticsService.createRepairKnowledge({ tenantId, ...body })
  }

  @Get('repair-knowledge')
  listRepairKnowledge(
    @Headers('x-tenant-id') tenantId: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('issueType') issueType?: string,
    @Query('tag') tag?: string,
    @Query('search') search?: string,
  ) {
    return this.logisticsService.listRepairKnowledge(tenantId, { equipmentId, issueType, tag, search })
  }

  @Get('repair-knowledge/:id')
  getRepairKnowledge(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getRepairKnowledge(id, tenantId) ?? null
  }

  @Patch('repair-knowledge/:id')
  updateRepairKnowledge(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.logisticsService.updateRepairKnowledge(id, tenantId, body)
  }

  // ═══════════════════════════════════════════
  //  耗材库存预警 (ConsumableAlertRule) - P-30 Phase 80%
  //  对接 P-37 inventory-alert
  // ═══════════════════════════════════════════

  @Post('consumable-alert-rules')
  createConsumableAlertRule(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: {
      itemId: string
      itemName: string
      triggerType: AlertTriggerType
      threshold: number
      alertLevel: 'info' | 'warning' | 'critical'
      notifyUserIds?: string[]
    }
  ) {
    return this.logisticsService.createConsumableAlertRule({ tenantId, ...body })
  }

  @Get('consumable-alert-rules')
  listConsumableAlertRules(@Headers('x-tenant-id') tenantId: string) {
    return this.logisticsService.listConsumableAlertRules(tenantId)
  }

  @Patch('consumable-alert-rules/:id')
  updateConsumableAlertRule(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.logisticsService.updateConsumableAlertRule(id, tenantId, body)
  }

  @Delete('consumable-alert-rules/:id')
  deleteConsumableAlertRule(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    const result = this.logisticsService.deleteConsumableAlertRule(id, tenantId)
    return { success: result }
  }

  @Post('consumable-alerts/check')
  checkConsumableAlerts(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { itemId: string; itemName: string; currentStock: number }
  ) {
    return this.logisticsService.checkConsumableAlerts({ tenantId, ...body })
  }

  @Get('consumable-alerts')
  listConsumableAlerts(
    @Headers('x-tenant-id') tenantId: string,
    @Query('resolved') resolved?: string,
    @Query('alertLevel') alertLevel?: string,
    @Query('triggerType') triggerType?: string,
  ) {
    return this.logisticsService.listConsumableAlerts(tenantId, {
      resolved: resolved !== undefined ? resolved === 'true' : undefined,
      alertLevel,
      triggerType,
    })
  }

  @Post('consumable-alerts/:id/resolve')
  resolveConsumableAlert(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { resolvedBy: string }
  ) {
    return this.logisticsService.resolveConsumableAlert(id, tenantId, body.resolvedBy)
  }

  // ═══════════════════════════════════════════
  //  场馆巡检记录 - P-30 Phase 80%
  // ═══════════════════════════════════════════

  @Post('venue-inspections')
  createVenueInspectionRecord(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: {
      storeId: string
      planType: 'daily' | 'weekly' | 'monthly'
      inspectorId: string
      inspectorName: string
      environmentScore: number
      equipmentScore: number
      safetyScore: number
      notes: string
      issues: Array<{
        category: string
        description: string
        severity: 'low' | 'medium' | 'high'
        resolved?: boolean
      }>
    }
  ) {
    return this.logisticsService.createVenueInspectionRecord({ tenantId, ...body })
  }

  @Get('venue-inspections')
  listVenueInspectionRecords(
    @Headers('x-tenant-id') tenantId: string,
    @Query('storeId') storeId?: string,
    @Query('planType') planType?: 'daily' | 'weekly' | 'monthly',
    @Query('inspectorId') inspectorId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.logisticsService.listVenueInspectionRecords(tenantId, {
      storeId, planType, inspectorId,
      limit: limit ? parseInt(limit, 10) : undefined,
    })
  }

  @Get('venue-inspections/trend')
  getVenueInspectionTrend(
    @Headers('x-tenant-id') tenantId: string,
    @Query('storeId') storeId?: string,
    @Query('months') months?: string,
  ) {
    return this.logisticsService.getVenueInspectionTrendData(tenantId, storeId, months ? parseInt(months, 10) : 3)
  }

  // ═══════════════════════════════════════════
  //  后勤报表 API - P-30 Phase 80%
  // ═══════════════════════════════════════════

  @Get('reports')
  getLogisticsReport(@Headers('x-tenant-id') tenantId: string) {
    return this.logisticsService.getLogisticsReport(tenantId)
  }
}
