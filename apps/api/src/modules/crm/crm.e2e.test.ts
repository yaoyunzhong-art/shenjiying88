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
 *   - 客户创建/更新/删除
 *   - 标签管理
 *   - 备注管理
 *   - 边界与异常场景
 *
 * 注意: ResponseInterceptor 会包装响应, 实际数据在 res.body.data
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Delete } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
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

  @Post('customers')
  createCustomer(@Body() body: { name: string; email: string; phone: string; status?: CrmCustomerStatus }) {
    const customer = this.svc.create(body)
    return { success: true, data: customer }
  }

  @Patch('customers/:id')
  updateCustomer(@Param('id') id: string, @Body() body: { name?: string; email?: string; status?: CrmCustomerStatus }) {
    const customer = this.svc.update(id, body)
    return { success: true, data: customer }
  }

  @Delete('customers/:id')
  deleteCustomer(@Param('id') id: string) {
    this.svc.delete(id)
    return { success: true, data: null }
  }

  @Post('customers/:id/tags')
  addTag(@Param('id') id: string, @Body() body: { tag: string }) {
    const customer = this.svc.addTag(id, body.tag)
    return { success: true, data: customer }
  }

  @Delete('customers/:id/tags/:tag')
  removeTag(@Param('id') id: string, @Param('tag') tag: string) {
    const customer = this.svc.removeTag(id, tag)
    return { success: true, data: customer }
  }

  @Post('customers/:id/mark')
  markCustomer(@Param('id') id: string, @Body() body: { status: CrmCustomerStatus }) {
    const customer = this.svc.markCustomer(id, body.status)
    return { success: true, data: customer }
  }

  @Post('customers/:id/notes')
  addNote(@Param('id') id: string, @Body() body: { content: string; createdBy: string }) {
    const note = this.svc.addNote(id, body.content, body.createdBy)
    return { success: true, data: note }
  }

  @Get('customers/:id/notes')
  listNotes(@Param('id') id: string) {
    return { success: true, data: { notes: this.svc.listNotes(id) } }
  }

  @Get('customers/:id/tickets')
  listTickets(@Param('id') id: string) {
    return { success: true, data: { tickets: this.svc.listTickets(id) } }
  }

  @Get('customers/:id/interactions')
  listInteractions(@Param('id') id: string) {
    return { success: true, data: { interactions: this.svc.listInteractions(id) } }
  }

  @Get('stats')
  getStats() {
    return { success: true, data: this.svc.getStats() }
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
  await app.init()
  return { app, crmService }
}

// ────────────── 正例 (Positive) ──────────────

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
    const beforeScore = customers[0].engagementScore

    const res = await request(app.getHttpServer())
      .patch(`/test/crm/customers/${customerId}/score`)
      .send({ delta: 10 })
    assert.equal(res.body.data.engagementScore, beforeScore + 10)
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

it('e2e: create new customer with valid data', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/crm/customers')
      .send({ name: '赵六', email: 'zhao@example.com', phone: '13900004444', status: 'active' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.name, '赵六')
    assert.equal(res.body.data.status, 'active')
    assert.equal(res.body.data.engagementScore, 0)
  } finally {
    await app.close()
  }
})

it('e2e: update customer name and email', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[0].id

    const res = await request(app.getHttpServer())
      .patch(`/test/crm/customers/${customerId}`)
      .send({ name: '张三改', email: 'zhang_new@example.com' })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.name, '张三改')
    assert.equal(res.body.data.email, 'zhang_new@example.com')
  } finally {
    await app.close()
  }
})

it('e2e: add and remove tag on customer', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[1].id

    const addRes = await request(app.getHttpServer())
      .post(`/test/crm/customers/${customerId}/tags`)
      .send({ tag: 'premium' })
    assert.equal(addRes.statusCode, 201)
    assert.ok(addRes.body.data.tags.includes('premium'))

    const removeRes = await request(app.getHttpServer())
      .delete(`/test/crm/customers/${customerId}/tags/premium`)
    assert.equal(removeRes.statusCode, 200)
    assert.equal(removeRes.body.data.tags.includes('premium'), false)
  } finally {
    await app.close()
  }
})

it('e2e: mark customer status to churned reduces score', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[0].id

    const res = await request(app.getHttpServer())
      .post(`/test/crm/customers/${customerId}/mark`)
      .send({ status: 'churned' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.status, 'churned')
    assert.ok(res.body.data.engagementScore <= 20)
  } finally {
    await app.close()
  }
})

it('e2e: add and list notes for customer', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[0].id

    const noteRes = await request(app.getHttpServer())
      .post(`/test/crm/customers/${customerId}/notes`)
      .send({ content: '重要客户需要跟进', createdBy: 'admin-01' })
    assert.equal(noteRes.statusCode, 201)
    assert.equal(noteRes.body.data.content, '重要客户需要跟进')

    const listRes = await request(app.getHttpServer()).get(`/test/crm/customers/${customerId}/notes`)
    assert.equal(listRes.body.data.notes.length, 1)
  } finally {
    await app.close()
  }
})

// ────────────── 反例 (Negative) ──────────────

it('e2e: get non-existent customer returns 404', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/crm/customers/nonexistent')
    assert.equal(res.statusCode, 404)
  } finally {
    await app.close()
  }
})

it('e2e: create customer with empty name throws error', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/crm/customers')
      .send({ name: '', email: 'test@test.com' })
    assert.equal(res.statusCode, 409) // ConflictException
  } finally {
    await app.close()
  }
})

it('e2e: create customer with empty email throws error', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/crm/customers')
      .send({ name: 'Test', email: '' })
    assert.equal(res.statusCode, 409)
  } finally {
    await app.close()
  }
})

it('e2e: delete non-existent customer returns 404', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).delete('/test/crm/customers/nonexistent')
    assert.equal(res.statusCode, 404)
  } finally {
    await app.close()
  }
})

it('e2e: update ticket status for non-existent ticket returns 404', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[0].id

    const res = await request(app.getHttpServer())
      .patch(`/test/crm/customers/${customerId}/tickets/nonexistent`)
      .send({ status: 'closed' })
    assert.equal(res.statusCode, 404)
  } finally {
    await app.close()
  }
})

it('e2e: add empty tag throws error', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[0].id

    const res = await request(app.getHttpServer())
      .post(`/test/crm/customers/${customerId}/tags`)
      .send({ tag: '' })
    assert.equal(res.statusCode, 409)
  } finally {
    await app.close()
  }
})

// ────────────── 边界 (Boundary) ──────────────

it('e2e: engagement score clamped at maximum 100 on positive delta', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[0].id

    // First set score high
    await request(app.getHttpServer())
      .patch(`/test/crm/customers/${customerId}/score`)
      .send({ delta: 50 })
    const res = await request(app.getHttpServer())
      .patch(`/test/crm/customers/${customerId}/score`)
      .send({ delta: 50 })
    assert.ok(res.body.data.engagementScore <= 100)
  } finally {
    await app.close()
  }
})

it('e2e: engagement score clamped at minimum 0 on negative delta', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[0].id

    const res = await request(app.getHttpServer())
      .patch(`/test/crm/customers/${customerId}/score`)
      .send({ delta: -200 })
    assert.equal(res.body.data.engagementScore, 0)
  } finally {
    await app.close()
  }
})

it('e2e: search with empty string returns all customers', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/crm/customers?search=')
    assert.equal(res.body.data.total, 3)
  } finally {
    await app.close()
  }
})

it('e2e: filter by status lead returns only lead customers', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/crm/customers?status=lead')
    assert.equal(res.body.data.total, 1)
    assert.equal(res.body.data.customers[0].name, '王五')
  } finally {
    await app.close()
  }
})

it('e2e: create ticket with empty subject throws error', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[0].id

    const res = await request(app.getHttpServer())
      .post(`/test/crm/customers/${customerId}/tickets`)
      .send({ subject: '', description: 'test', priority: 'low', assignedTo: 'dev' })
    assert.equal(res.statusCode, 409)
  } finally {
    await app.close()
  }
})

it('e2e: create customer with default status lead', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/crm/customers')
      .send({ name: 'DefaultLead', email: 'lead@test.com', phone: '13900005555' })
    assert.equal(res.body.data.status, 'lead')
    assert.equal(res.body.data.engagementScore, 0)
  } finally {
    await app.close()
  }
})

it('e2e: delete existing customer then verify removed', async () => {
  const { app, crmService } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/test/crm/customers')
      .send({ name: 'ToDelete', email: 'delete@test.com', status: 'active' })
    const customerId = createRes.body.data.id

    const delRes = await request(app.getHttpServer()).delete(`/test/crm/customers/${customerId}`)
    assert.equal(delRes.statusCode, 200)

    // Try to get deleted customer should 404
    const getRes = await request(app.getHttpServer()).get(`/test/crm/customers/${customerId}`)
    assert.equal(getRes.statusCode, 404)
  } finally {
    await app.close()
  }
})

it('e2e: add multiple tags on customer', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customerId = crmService.list()[0].id

    await request(app.getHttpServer())
      .post(`/test/crm/customers/${customerId}/tags`)
      .send({ tag: 'vip' })
    await request(app.getHttpServer())
      .post(`/test/crm/customers/${customerId}/tags`)
      .send({ tag: 'enterprise' })
    await request(app.getHttpServer())
      .post(`/test/crm/customers/${customerId}/tags`)
      .send({ tag: 'churned' })

    const getRes = await request(app.getHttpServer()).get(`/test/crm/customers/${customerId}`)
    const tags = getRes.body.data.tags
    assert.ok(tags.includes('vip'))
    assert.ok(tags.includes('enterprise'))
    assert.ok(tags.includes('churned'))
  } finally {
    await app.close()
  }
})

it('e2e: mark customer active and verify score unaffected', async () => {
  const { app, crmService } = await buildApp()
  try {
    const customers = crmService.list()
    const customerId = customers[0].id
    const originalScore = customers[0].engagementScore

    const res = await request(app.getHttpServer())
      .post(`/test/crm/customers/${customerId}/mark`)
      .send({ status: 'active' })
    assert.equal(res.body.data.status, 'active')
    // Score unchanged when marking to active (not churned)
    assert.equal(res.body.data.engagementScore, originalScore)
  } finally {
    await app.close()
  }
})

it('e2e: stats returns aggregated data after multiple operations', async () => {
  const { app } = await buildApp()
  try {
    // Create a customer, add a ticket and an interaction
    const createRes = await request(app.getHttpServer())
      .post('/test/crm/customers')
      .send({ name: 'StatsUser', email: 'stats@test.com', status: 'active' })
    const newId = createRes.body.data.id

    await request(app.getHttpServer())
      .post(`/test/crm/customers/${newId}/tickets`)
      .send({ subject: 'Stats ticket', description: 'test', priority: 'low', assignedTo: 'dev' })

    const statsRes = await request(app.getHttpServer()).get('/test/crm/stats')
    assert.equal(statsRes.statusCode, 200)
    assert.equal(statsRes.body.data.total, 4)
    assert.equal(statsRes.body.data.totalTickets, 1) // original customers have 0, +1 new = 1
  } finally {
    await app.close()
  }
})
