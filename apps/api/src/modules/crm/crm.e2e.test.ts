import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: CRM 客户管理 HTTP 链路
 *
 * 链路:
 *   HTTP → TestCrmController → CrmService
 *
 * 验证:
 *   - 客户列表与搜索
 *   - 客户评分更新
 *   - 交互记录创建
 *   - 工单创建与状态流转
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Inject, Post, Patch, Body, Param, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { CrmService, type CrmCustomerStatus, type TicketPriority, type TicketStatus, type CrmInteraction } from './crm.service'

@Controller('test/crm')
class TestCrmController {
  constructor(
    @Inject(CrmService) private readonly svc: CrmService,
  ) {}

  @Get('customers')
  listCustomers(@Query('status') status?: CrmCustomerStatus, @Query('search') search?: string) {
    const customers = this.svc.list(status, search)
    return { success: true, data: { customers, total: customers.length } }
  }

  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    const customer = this.svc.getById(id)
    return { success: true, data: customer }
  }

  @Patch('customers/:id/score')
  updateScore(@Param('id') id: string, @Body() body: { delta: number }) {
    const customer = this.svc.updateEngagementScore(id, body.delta)
    return { success: true, data: customer }
  }

  @Post('customers/:id/interactions')
  addInteraction(@Param('id') id: string, @Body() body: { type: CrmInteraction['type']; summary: string; details: string; createdBy: string }) {
    const interaction = this.svc.addInteraction(id, body)
    return { success: true, data: interaction }
  }

  @Post('customers/:id/tickets')
  createTicket(@Param('id') id: string, @Body() body: { subject: string; description: string; priority: TicketPriority; assignedTo: string }) {
    const ticket = this.svc.createTicket(id, body)
    return { success: true, data: ticket }
  }

  @Patch('customers/:id/tickets/:ticketId')
  updateTicketStatus(@Param('id') id: string, @Param('ticketId') ticketId: string, @Body() body: { status: TicketStatus }) {
    const ticket = this.svc.updateTicketStatus(id, ticketId, body.status)
    return { success: true, data: ticket }
  }
}

async function buildApp() {
  const crmService = new CrmService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestCrmController],
    providers: [
      { provide: CrmService, useValue: crmService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, crmService }
}

it('e2e: list customers returns 3 defaults', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/crm/customers')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.total, 3)
    assert.ok(res.body.data.customers.some((c: any) => c.name === '张三'))
  } finally {
    await app.close()
  }
})

it('e2e: search customer by name', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/crm/customers?search=李四')
    assert.equal(res.body.data.total, 1)
    assert.equal(res.body.data.customers[0].email, 'li@example.com')
  } finally {
    await app.close()
  }
})

it('e2e: update engagement score then verify', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[0].id

    const res = await request(app.getHttpServer())
      .patch(`/test/crm/customers/${customerId}/score`)
      .send({ delta: 10 })
    assert.equal(res.body.data.engagementScore, customers[0].engagementScore + 10)
  } finally {
    await app.close()
  }
})

it('e2e: create interaction and ticket for customer', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[0].id

    const intRes = await request(app.getHttpServer())
      .post(`/test/crm/customers/${customerId}/interactions`)
      .send({ type: 'call', summary: '售前咨询', details: '客户咨询产品功能', createdBy: 'sales-01' })
    assert.equal(intRes.statusCode, 201)
    assert.equal(intRes.body.data.summary, '售前咨询')

    const tikRes = await request(app.getHttpServer())
      .post(`/test/crm/customers/${customerId}/tickets`)
      .send({ subject: '功能需求', description: '需要批量导入功能', priority: 'medium', assignedTo: 'dev-01' })
    assert.equal(tikRes.statusCode, 201)
    assert.equal(tikRes.body.data.status, 'open')
  } finally {
    await app.close()
  }
})

it('e2e: create ticket then resolve and close', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[0].id

    const tikRes = await request(app.getHttpServer())
      .post(`/test/crm/customers/${customerId}/tickets`)
      .send({ subject: 'Bug修复', description: '页面加载超时', priority: 'high', assignedTo: 'dev-02' })
    const ticketId = tikRes.body.data.id

    const closeRes = await request(app.getHttpServer())
      .patch(`/test/crm/customers/${customerId}/tickets/${ticketId}`)
      .send({ status: 'closed' })
    assert.equal(closeRes.body.data.status, 'closed')
    assert.ok(closeRes.body.data.closedAt)
  } finally {
    await app.close()
  }
})
