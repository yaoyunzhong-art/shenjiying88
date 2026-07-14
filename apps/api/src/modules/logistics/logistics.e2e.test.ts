import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Body, Get, Headers, Param, Post, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { LogisticsService } from './logistics.service'
import { NotificationService } from '../notification/notification.service'

@Controller('logistics')
class TestLogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Post('inspections')
  create(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createInspectionTask({ ...body, tenantId })
  }

  @Get('inspections')
  list(@Headers('x-tenant-id') tenantId: string, @Query('status') status?: any) {
    return this.logisticsService.listInspectionTasks(tenantId, { status })
  }

  @Post('inspections/:id/remind')
  remind(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.logisticsService.sendInspectionReminder(id, tenantId, body?.now)
  }

  @Post('inspections/:id/result')
  result(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.logisticsService.recordInspectionResult(id, tenantId, body)
  }

  @Post('clean-schedules')
  createClean(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createCleanSchedule({ ...body, tenantId })
  }

  @Get('clean-schedules')
  listCleans(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: any,
    @Query('scheduledDate') scheduledDate?: string,
    @Query('areaCode') areaCode?: string
  ) {
    return this.logisticsService.listCleanSchedules(tenantId, { status, scheduledDate, areaCode })
  }

  @Post('clean-schedules/:id/assign-area')
  assignClean(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.logisticsService.assignCleanArea(id, tenantId, body)
  }

  @Post('clean-schedules/:id/check-in')
  checkInClean(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.logisticsService.checkInCleanSchedule(id, tenantId, body)
  }

  @Post('repairs')
  createRepair(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createRepairOrder({ ...body, tenantId })
  }

  @Get('repairs')
  listRepairs(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: any,
    @Query('assigneeId') assigneeId?: string
  ) {
    return this.logisticsService.listRepairOrders(tenantId, { status, assigneeId })
  }

  @Post('repairs/:id/assign')
  assignRepair(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.logisticsService.assignRepairOrder(id, tenantId, body)
  }

  @Post('repairs/:id/start')
  startRepair(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.logisticsService.startRepairOrder(id, tenantId, body)
  }

  @Post('repairs/:id/complete')
  completeRepair(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.logisticsService.completeRepairOrder(id, tenantId, body)
  }

  @Post('repairs/:id/verify')
  verifyRepair(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.logisticsService.verifyRepairOrder(id, tenantId, body)
  }

  @Post('material-requests')
  createMaterialRequest(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createMaterialRequest({ ...body, tenantId })
  }

  @Get('material-requests')
  listMaterialRequests(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: any,
    @Query('requesterId') requesterId?: string,
    @Query('category') category?: string
  ) {
    return this.logisticsService.listMaterialRequests(tenantId, { status, requesterId, category })
  }

  @Post('material-requests/:id/approve')
  approveMaterialRequest(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.logisticsService.approveMaterialRequest(id, tenantId, body)
  }

  @Post('material-requests/:id/outbound')
  outboundMaterialRequest(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.logisticsService.outboundMaterialRequest(id, tenantId, body)
  }
}

async function buildApp() {
  const notifications: any[] = []
  const notificationStub = {
    send(input: any) {
      notifications.push(input)
      return { id: `dispatch-${notifications.length}` }
    }
  }

  const moduleRef = await Test.createTestingModule({
    controllers: [TestLogisticsController],
    providers: [
      LogisticsService,
      { provide: NotificationService, useValue: notificationStub }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  const service = moduleRef.get(LogisticsService)
  service.resetStoreForTests()
  return { app, notifications }
}

describe('logistics inspection e2e', () => {
  it('创建巡检任务后可以发送提醒并回写状态', async () => {
    const { app, notifications } = await buildApp()
    try {
      const createRes = await request(app.getHttpServer())
        .post('/logistics/inspections')
        .set('x-tenant-id', 'tenant-p30')
        .send({
          storeId: 'store-a',
          equipmentId: 'equip-a',
          equipmentName: '设备A',
          assigneeId: 'worker-01',
          assigneeName: '王工',
          scheduledAt: '2026-07-14T18:00:00.000Z'
        })

      assert.equal(createRes.statusCode, 201)
      assert.equal(createRes.body.status, 'scheduled')

      const remindRes = await request(app.getHttpServer())
        .post(`/logistics/inspections/${createRes.body.id}/remind`)
        .set('x-tenant-id', 'tenant-p30')
        .send({ now: '2026-07-14T18:00:00.000Z' })

      assert.equal(remindRes.statusCode, 201)
      assert.equal(remindRes.body.status, 'reminded')
      assert.equal(notifications.length, 1)
      assert.equal(notifications[0].recipient, 'worker-01')

      const listRes = await request(app.getHttpServer())
        .get('/logistics/inspections?status=reminded')
        .set('x-tenant-id', 'tenant-p30')

      assert.equal(listRes.statusCode, 200)
      assert.equal(listRes.body.length, 1)
    } finally {
      await app.close()
    }
  })

  it('记录巡检结果后任务变为已巡检', async () => {
    const { app } = await buildApp()
    try {
      const createRes = await request(app.getHttpServer())
        .post('/logistics/inspections')
        .set('x-tenant-id', 'tenant-p30')
        .send({
          equipmentId: 'equip-a',
          equipmentName: '设备A',
          assigneeId: 'worker-01',
          assigneeName: '王工',
          scheduledAt: '2026-07-14T18:00:00.000Z'
        })

      const resultRes = await request(app.getHttpServer())
        .post(`/logistics/inspections/${createRes.body.id}/result`)
        .set('x-tenant-id', 'tenant-p30')
        .send({
          status: 'normal',
          note: '设备A=正常',
          inspectorId: 'worker-01',
          inspectorName: '王工'
        })

      assert.equal(resultRes.statusCode, 201)
      assert.equal(resultRes.body.status, 'completed')
      assert.equal(resultRes.body.result.status, 'normal')
      assert.match(resultRes.body.result.note, /正常/)
      assert.ok(resultRes.body.completedAt)
    } finally {
      await app.close()
    }
  })

  it('报修后可派单给维修工并按人过滤', async () => {
    const { app, notifications } = await buildApp()
    try {
      const createRes = await request(app.getHttpServer())
        .post('/logistics/repairs')
        .set('x-tenant-id', 'tenant-p30')
        .send({
          storeId: 'store-a',
          equipmentId: 'machine-b',
          equipmentName: '机器B',
          issueDescription: '机器B不转',
          reporterId: 'guide-01',
          reporterName: '小李'
        })

      assert.equal(createRes.statusCode, 201)
      assert.equal(createRes.body.status, 'open')

      const assignRes = await request(app.getHttpServer())
        .post(`/logistics/repairs/${createRes.body.id}/assign`)
        .set('x-tenant-id', 'tenant-p30')
        .send({
          assigneeId: 'repairer-c',
          assigneeName: '维修工C',
          assignedAt: '2026-07-14T19:00:00.000Z'
        })

      assert.equal(assignRes.statusCode, 201)
      assert.equal(assignRes.body.status, 'assigned')
      assert.equal(assignRes.body.assigneeName, '维修工C')
      assert.equal(notifications.length, 1)
      assert.equal(notifications[0].recipient, 'repairer-c')

      const listRes = await request(app.getHttpServer())
        .get('/logistics/repairs?status=assigned&assigneeId=repairer-c')
        .set('x-tenant-id', 'tenant-p30')

      assert.equal(listRes.statusCode, 200)
      assert.equal(listRes.body.length, 1)
      assert.equal(listRes.body[0].equipmentName, '机器B')
    } finally {
      await app.close()
    }
  })

  it('维修完成后可验收并回写 verified', async () => {
    const { app } = await buildApp()
    try {
      const createRes = await request(app.getHttpServer())
        .post('/logistics/repairs')
        .set('x-tenant-id', 'tenant-p30')
        .send({
          equipmentId: 'machine-b',
          equipmentName: '机器B',
          issueDescription: '机器B不转',
          reporterId: 'guide-01',
          reporterName: '小李'
        })

      await request(app.getHttpServer())
        .post(`/logistics/repairs/${createRes.body.id}/assign`)
        .set('x-tenant-id', 'tenant-p30')
        .send({
          assigneeId: 'repairer-c',
          assigneeName: '维修工C'
        })

      const startRes = await request(app.getHttpServer())
        .post(`/logistics/repairs/${createRes.body.id}/start`)
        .set('x-tenant-id', 'tenant-p30')
        .send({
          startedAt: '2026-07-14T19:10:00.000Z'
        })

      assert.equal(startRes.statusCode, 201)
      assert.equal(startRes.body.status, 'in_progress')

      const completeRes = await request(app.getHttpServer())
        .post(`/logistics/repairs/${createRes.body.id}/complete`)
        .set('x-tenant-id', 'tenant-p30')
        .send({
          completionNote: '更换驱动电机',
          technicianId: 'repairer-c',
          technicianName: '维修工C',
          completedAt: '2026-07-14T19:40:00.000Z'
        })

      assert.equal(completeRes.statusCode, 201)
      assert.equal(completeRes.body.status, 'completed')

      const verifyRes = await request(app.getHttpServer())
        .post(`/logistics/repairs/${createRes.body.id}/verify`)
        .set('x-tenant-id', 'tenant-p30')
        .send({
          verifierId: 'manager-01',
          verifierName: '店长',
          note: '复测通过',
          verifiedAt: '2026-07-14T19:50:00.000Z'
        })

      assert.equal(verifyRes.statusCode, 201)
      assert.equal(verifyRes.body.status, 'verified')
      assert.equal(verifyRes.body.verification.verifierName, '店长')
      assert.equal(verifyRes.body.verification.note, '复测通过')
    } finally {
      await app.close()
    }
  })

  it('创建清洁排班后可分配区域并按区域过滤', async () => {
    const { app, notifications } = await buildApp()
    try {
      const createRes = await request(app.getHttpServer())
        .post('/logistics/clean-schedules')
        .set('x-tenant-id', 'tenant-p30')
        .send({
          storeId: 'store-a',
          assigneeId: 'cleaner-01',
          assigneeName: '张保洁',
          shiftName: '早班',
          shiftTime: '06:00-14:00',
          scheduledDate: '2026-07-15'
        })

      assert.equal(createRes.statusCode, 201)
      assert.equal(createRes.body.status, 'scheduled')

      const assignRes = await request(app.getHttpServer())
        .post(`/logistics/clean-schedules/${createRes.body.id}/assign-area`)
        .set('x-tenant-id', 'tenant-p30')
        .send({
          areaCode: 'area-restroom',
          areaName: '洗手间',
          assignedAt: '2026-07-15T05:50:00.000Z'
        })

      assert.equal(assignRes.statusCode, 201)
      assert.equal(assignRes.body.status, 'assigned')
      assert.equal(assignRes.body.areaName, '洗手间')
      assert.equal(notifications.length, 1)
      assert.equal(notifications[0].recipient, 'cleaner-01')

      const listRes = await request(app.getHttpServer())
        .get('/logistics/clean-schedules?status=assigned&scheduledDate=2026-07-15&areaCode=area-restroom')
        .set('x-tenant-id', 'tenant-p30')

      assert.equal(listRes.statusCode, 200)
      assert.equal(listRes.body.length, 1)
      assert.equal(listRes.body[0].assigneeName, '张保洁')
    } finally {
      await app.close()
    }
  })

  it('保洁签到后清洁排班状态变为 checked_in', async () => {
    const { app } = await buildApp()
    try {
      const createRes = await request(app.getHttpServer())
        .post('/logistics/clean-schedules')
        .set('x-tenant-id', 'tenant-p30')
        .send({
          assigneeId: 'cleaner-01',
          assigneeName: '张保洁',
          shiftName: '早班',
          shiftTime: '06:00-14:00',
          scheduledDate: '2026-07-15'
        })

      await request(app.getHttpServer())
        .post(`/logistics/clean-schedules/${createRes.body.id}/assign-area`)
        .set('x-tenant-id', 'tenant-p30')
        .send({
          areaCode: 'area-restroom',
          areaName: '洗手间'
        })

      const checkInRes = await request(app.getHttpServer())
        .post(`/logistics/clean-schedules/${createRes.body.id}/check-in`)
        .set('x-tenant-id', 'tenant-p30')
        .send({
          cleanerId: 'cleaner-01',
          cleanerName: '张保洁',
          checkedInAt: '2026-07-15T05:58:00.000Z',
          note: '已到岗开工'
        })

      assert.equal(checkInRes.statusCode, 201)
      assert.equal(checkInRes.body.status, 'checked_in')
      assert.equal(checkInRes.body.checkIn.cleanerName, '张保洁')
      assert.equal(checkInRes.body.checkIn.note, '已到岗开工')
    } finally {
      await app.close()
    }
  })

  it('物料申领可完成审批并按条件筛选', async () => {
    const { app } = await buildApp()
    try {
      const createRes = await request(app.getHttpServer())
        .post('/logistics/material-requests')
        .set('x-tenant-id', 'tenant-p30')
        .send({
          storeId: 'store-a',
          requesterId: 'cleaner-01',
          requesterName: '张保洁',
          department: '清洁组',
          purpose: '补充洗手间与前台清洁耗材',
          items: [
            {
              itemId: 'STK-008',
              itemName: '抹布',
              category: '耗材',
              unit: '条',
              quantity: 8
            },
            {
              itemId: 'STK-012',
              itemName: '免洗洗手液',
              category: '耗材',
              unit: '瓶',
              quantity: 3
            }
          ]
        })

      assert.equal(createRes.statusCode, 201)
      assert.equal(createRes.body.status, 'pending_approval')
      assert.equal(createRes.body.totalQuantity, 11)

      const approveRes = await request(app.getHttpServer())
        .post(`/logistics/material-requests/${createRes.body.id}/approve`)
        .set('x-tenant-id', 'tenant-p30')
        .send({
          approverId: 'manager-01',
          approverName: '店长',
          note: '门店日耗正常，同意发放',
          approvedAt: '2026-07-15T08:10:00.000Z'
        })

      assert.equal(approveRes.statusCode, 201)
      assert.equal(approveRes.body.status, 'approved')
      assert.equal(approveRes.body.approval.approverName, '店长')

      const listRes = await request(app.getHttpServer())
        .get('/logistics/material-requests?status=approved&requesterId=cleaner-01&category=耗材')
        .set('x-tenant-id', 'tenant-p30')

      assert.equal(listRes.statusCode, 200)
      assert.equal(listRes.body.length, 1)
      assert.equal(listRes.body[0].requesterName, '张保洁')
    } finally {
      await app.close()
    }
  })

  it('物料申领审批通过后可执行出库', async () => {
    const { app } = await buildApp()
    try {
      const createRes = await request(app.getHttpServer())
        .post('/logistics/material-requests')
        .set('x-tenant-id', 'tenant-p30')
        .send({
          requesterId: 'cleaner-01',
          requesterName: '张保洁',
          purpose: '晚班补充清洁物料',
          items: [
            {
              itemId: 'STK-005',
              itemName: 'VR清洁套装',
              category: '耗材',
              unit: '套',
              quantity: 2
            }
          ]
        })

      await request(app.getHttpServer())
        .post(`/logistics/material-requests/${createRes.body.id}/approve`)
        .set('x-tenant-id', 'tenant-p30')
        .send({
          approverId: 'manager-01',
          approverName: '店长',
          note: '同意领用'
        })

      const outboundRes = await request(app.getHttpServer())
        .post(`/logistics/material-requests/${createRes.body.id}/outbound`)
        .set('x-tenant-id', 'tenant-p30')
        .send({
          operatorId: 'keeper-01',
          operatorName: '仓管员',
          warehouseCode: 'WH-CLEAN',
          note: '已按审批数量出库',
          outboundAt: '2026-07-15T08:30:00.000Z'
        })

      assert.equal(outboundRes.statusCode, 201)
      assert.equal(outboundRes.body.status, 'outbound')
      assert.equal(outboundRes.body.outbound.operatorName, '仓管员')
      assert.equal(outboundRes.body.outbound.warehouseCode, 'WH-CLEAN')

      const listRes = await request(app.getHttpServer())
        .get('/logistics/material-requests?status=outbound')
        .set('x-tenant-id', 'tenant-p30')

      assert.equal(listRes.statusCode, 200)
      assert.equal(listRes.body.length, 1)
      assert.equal(listRes.body[0].outbound.operatorId, 'keeper-01')
    } finally {
      await app.close()
    }
  })
})
