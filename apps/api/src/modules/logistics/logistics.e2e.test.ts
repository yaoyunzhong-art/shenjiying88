import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Body, Get, Headers, Param, Post, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { LogisticsService } from './logistics.service'
import { NotificationService } from '../notification/notification.service'

@Controller('logistics/inspections')
class TestLogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createInspectionTask({ ...body, tenantId })
  }

  @Get()
  list(@Headers('x-tenant-id') tenantId: string, @Query('status') status?: any) {
    return this.logisticsService.listInspectionTasks(tenantId, { status })
  }

  @Post(':id/remind')
  remind(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.logisticsService.sendInspectionReminder(id, tenantId, body?.now)
  }

  @Post(':id/result')
  result(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.logisticsService.recordInspectionResult(id, tenantId, body)
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
})
