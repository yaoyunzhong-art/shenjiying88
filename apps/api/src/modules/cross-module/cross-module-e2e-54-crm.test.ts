import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Cross-module #54 — CRM 客户管理 → 交互记录 → 工单 全链路
 *
 * 链路:
 *   1. CrmService.create (创建客户)
 *   2. CrmService.list (列出/搜索/过滤)
 *   3. CrmService.updateEngagementScore (评分更新)
 *   4. CrmService.addInteraction (交互记录)
 *   5. CrmService.addNote (备注)
 *   6. CrmService.addTag (标签)
 *   7. CrmService.createTicket → updateTicketStatus (工单闭环)
 *   8. CrmService.markCustomer (状态标记)
 *   9. CrmService.getStats (统计)
 *   10. CrmService.delete (删除)
 *
 * 验证:
 *   - 客户创建后能搜索到
 *   - 评分 clamp 到 0-100
 *   - 交互记录可追加和查看
 *   - 工单状态流转 open→in_progress→resolved→closed
 *   - 标记 churned 后评分降低
 *   - 标签去重和不重复
 *   - 统计信息准确
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { CrmService, type CrmCustomerStatus, type TicketPriority, type TicketStatus, type CrmInteraction, type CreateCustomerDto, type UpdateCustomerDto } from '../crm/crm.service'

// ─── TestController ───

@Controller('crm-e2e-54')
class TestE2eController {
  constructor(
    @Inject(CrmService) private readonly svc: CrmService,
  ) {}

  @Get('customers')
  list(@Query('status') status?: CrmCustomerStatus, @Query('search') search?: string) {
    const customers = this.svc.list(status, search)
    return { success: true, data: { customers, total: customers.length } }
  }

  @Post('customers')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateCustomerDto) {
    return { success: true, data: this.svc.create(body) }
  }

  @Get('customers/:id')
  get(@Param('id') id: string) {
    return { success: true, data: this.svc.getById(id) }
  }

  @Put('customers/:id')
  update(@Param('id') id: string, @Body() body: UpdateCustomerDto) {
    return { success: true, data: this.svc.update(id, body) }
  }

  @Delete('customers/:id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string) {
    const idBefore = id
    this.svc.delete(id)
    return { success: true, data: { id: idBefore, deleted: true } }
  }

  @Patch('customers/:id/score')
  updateScore(@Param('id') id: string, @Body() body: { delta: number }) {
    return { success: true, data: this.svc.updateEngagementScore(id, body.delta) }
  }

  @Put('customers/:id/score')
  setScore(@Param('id') id: string, @Body() body: { score: number }) {
    return { success: true, data: this.svc.setEngagementScore(id, body.score) }
  }

  @Post('customers/:id/interactions')
  addInteraction(@Param('id') id: string, @Body() body: { type: CrmInteraction['type']; summary: string; details: string; createdBy: string }) {
    return { success: true, data: this.svc.addInteraction(id, body) }
  }

  @Get('customers/:id/interactions')
  listInteractions(@Param('id') id: string) {
    const interactions = this.svc.listInteractions(id)
    return { success: true, data: { interactions, total: interactions.length } }
  }

  @Post('customers/:id/tickets')
  createTicket(@Param('id') id: string, @Body() body: { subject: string; description: string; priority: TicketPriority; assignedTo: string }) {
    return { success: true, data: this.svc.createTicket(id, body) }
  }

  @Get('customers/:id/tickets')
  listTickets(@Param('id') id: string) {
    const tickets = this.svc.listTickets(id)
    return { success: true, data: { tickets, total: tickets.length } }
  }

  @Patch('customers/:id/tickets/:ticketId')
  updateTicketStatus(@Param('id') id: string, @Param('ticketId') ticketId: string, @Body() body: { status: TicketStatus }) {
    return { success: true, data: this.svc.updateTicketStatus(id, ticketId, body.status) }
  }

  @Post('customers/:id/notes')
  addNote(@Param('id') id: string, @Body() body: { content: string; createdBy: string }) {
    return { success: true, data: this.svc.addNote(id, body.content, body.createdBy) }
  }

  @Get('customers/:id/notes')
  listNotes(@Param('id') id: string) {
    const notes = this.svc.listNotes(id)
    return { success: true, data: { notes, total: notes.length } }
  }

  @Post('customers/:id/tags')
  addTag(@Param('id') id: string, @Body() body: { tag: string }) {
    return { success: true, data: this.svc.addTag(id, body.tag) }
  }

  @Delete('customers/:id/tags/:tag')
  removeTag(@Param('id') id: string, @Param('tag') tag: string) {
    return { success: true, data: this.svc.removeTag(id, tag) }
  }

  @Patch('customers/:id/status')
  markStatus(@Param('id') id: string, @Body() body: { status: CrmCustomerStatus }) {
    return { success: true, data: this.svc.markCustomer(id, body.status) }
  }

  @Get('stats')
  getStats() {
    return { success: true, data: this.svc.getStats() }
  }
}

async function buildApp() {
  // Fresh service per app so each test starts clean
  const crmService = new CrmService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestE2eController],
    providers: [
      { provide: CrmService, useValue: crmService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, crmService }
}

async function getFirstCustomerId(app: any): Promise<string> {
  const res = await request(app.getHttpServer()).get('/crm-e2e-54/customers')
  return res.body.data.customers[0].id
}

// ═══════════════ E2E Tests ═══════════════

it('e2e-54: default list has 3 customers', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/crm-e2e-54/customers')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.total, 3)
  } finally {
    await app.close()
  }
})

it('e2e-54: create then search new customer', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/crm-e2e-54/customers')
      .send({ name: 'E2E客户', email: 'e2e@test.com', phone: '19900000001' })
    assert.equal(createRes.statusCode, 201)
    const newId = createRes.body.data.id

    const searchRes = await request(app.getHttpServer())
      .get('/crm-e2e-54/customers?search=E2E')
    assert.equal(searchRes.body.data.total, 1)
    assert.equal(searchRes.body.data.customers[0].id, newId)
  } finally {
    await app.close()
  }
})

it('e2e-54: filter by lead status', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/crm-e2e-54/customers?status=lead')
    const customers = res.body.data.customers
    assert.ok(customers.length >= 1)
    assert.ok(customers.every((c: any) => c.status === 'lead'))
  } finally {
    await app.close()
  }
})

it('e2e-54: get customer by id returns full profile', async () => {
  const { app } = await buildApp()
  try {
    const cid = await getFirstCustomerId(app)
    const res = await request(app.getHttpServer()).get(`/crm-e2e-54/customers/${cid}`)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.id, cid)
    assert.ok(typeof res.body.data.name === 'string')
    assert.ok(typeof res.body.data.engagementScore === 'number')
  } finally {
    await app.close()
  }
})

it('e2e-54: update customer name and tags', async () => {
  const { app } = await buildApp()
  try {
    const cid = await getFirstCustomerId(app)
    const res = await request(app.getHttpServer())
      .put(`/crm-e2e-54/customers/${cid}`)
      .send({ name: '新名字', tags: ['vip', 'gold'] })
    assert.equal(res.body.data.name, '新名字')
    assert.ok(res.body.data.tags.includes('vip'))
  } finally {
    await app.close()
  }
})

it('e2e-54: delete customer then 404', async () => {
  const { app } = await buildApp()
  try {
    const cid = await getFirstCustomerId(app)
    const delRes = await request(app.getHttpServer())
      .delete(`/crm-e2e-54/customers/${cid}`)
    assert.equal(delRes.statusCode, 200)
    assert.equal(delRes.body.data.deleted, true)

    const getRes = await request(app.getHttpServer())
      .get(`/crm-e2e-54/customers/${cid}`)
    assert.equal(getRes.statusCode, 404) // Nest returns 404 for NotFoundException
  } finally {
    await app.close()
  }
})

it('e2e-54: engagement score delta updates', async () => {
  const { app } = await buildApp()
  try {
    const cid = await getFirstCustomerId(app)
    const before = (await request(app.getHttpServer()).get(`/crm-e2e-54/customers/${cid}`)).body.data.engagementScore

    const res = await request(app.getHttpServer())
      .patch(`/crm-e2e-54/customers/${cid}/score`)
      .send({ delta: -20 })
    assert.equal(res.body.data.engagementScore, before - 20)
  } finally {
    await app.close()
  }
})

it('e2e-54: score clamped to 0-100', async () => {
  const { app } = await buildApp()
  try {
    const cid = await getFirstCustomerId(app)

    const low = await request(app.getHttpServer())
      .patch(`/crm-e2e-54/customers/${cid}/score`)
      .send({ delta: -999 })
    assert.equal(low.body.data.engagementScore, 0)

    const high = await request(app.getHttpServer())
      .put(`/crm-e2e-54/customers/${cid}/score`)
      .send({ score: 999 })
    assert.equal(high.body.data.engagementScore, 100)
  } finally {
    await app.close()
  }
})

it('e2e-54: interaction CRUD (add + list)', async () => {
  const { app } = await buildApp()
  try {
    const cid = await getFirstCustomerId(app)

    // Add first interaction
    const int1 = await request(app.getHttpServer())
      .post(`/crm-e2e-54/customers/${cid}/interactions`)
      .send({ type: 'call', summary: '电话咨询', details: '咨询套餐价格', createdBy: 'sales-01' })
    assert.equal(int1.statusCode, 201)
    assert.equal(int1.body.data.summary, '电话咨询')

    // Add second interaction
    await request(app.getHttpServer())
      .post(`/crm-e2e-54/customers/${cid}/interactions`)
      .send({ type: 'email', summary: '发送报价', details: '已发送VIP报价单', createdBy: 'sales-01' })

    // List interactions
    const listRes = await request(app.getHttpServer())
      .get(`/crm-e2e-54/customers/${cid}/interactions`)
    assert.equal(listRes.body.data.total, 2)
  } finally {
    await app.close()
  }
})

it('e2e-54: notes CRUD (add + list)', async () => {
  const { app } = await buildApp()
  try {
    const cid = await getFirstCustomerId(app)

    const n1 = await request(app.getHttpServer())
      .post(`/crm-e2e-54/customers/${cid}/notes`)
      .send({ content: '客户偏好靠窗座位', createdBy: 'sales-01' })
    assert.equal(n1.statusCode, 201)
    assert.equal(n1.body.data.content, '客户偏好靠窗座位')

    const n2 = await request(app.getHttpServer())
      .post(`/crm-e2e-54/customers/${cid}/notes`)
      .send({ content: '客户有儿童', createdBy: 'sales-02' })
    assert.equal(n2.body.data.content, '客户有儿童')

    const listRes = await request(app.getHttpServer())
      .get(`/crm-e2e-54/customers/${cid}/notes`)
    assert.equal(listRes.body.data.total, 2)
  } finally {
    await app.close()
  }
})

it('e2e-54: tag add/remove/duplicate', async () => {
  const { app } = await buildApp()
  try {
    const cid = await getFirstCustomerId(app)

    // Add tag
    await request(app.getHttpServer())
      .post(`/crm-e2e-54/customers/${cid}/tags`)
      .send({ tag: 'premium' })
    let getRes = await request(app.getHttpServer()).get(`/crm-e2e-54/customers/${cid}`)
    assert.ok(getRes.body.data.tags.includes('premium'))

    // Duplicate tag (should not duplicate)
    await request(app.getHttpServer())
      .post(`/crm-e2e-54/customers/${cid}/tags`)
      .send({ tag: 'premium' })
    getRes = await request(app.getHttpServer()).get(`/crm-e2e-54/customers/${cid}`)
    const count = getRes.body.data.tags.filter((t: string) => t === 'premium').length
    assert.equal(count, 1)

    // Remove tag
    await request(app.getHttpServer())
      .delete(`/crm-e2e-54/customers/${cid}/tags/premium`)
    getRes = await request(app.getHttpServer()).get(`/crm-e2e-54/customers/${cid}`)
    assert.ok(!getRes.body.data.tags.includes('premium'))
  } finally {
    await app.close()
  }
})

it('e2e-54: full ticket lifecycle', async () => {
  const { app } = await buildApp()
  try {
    const cid = await getFirstCustomerId(app)

    // Create ticket
    const createRes = await request(app.getHttpServer())
      .post(`/crm-e2e-54/customers/${cid}/tickets`)
      .send({ subject: 'E2E测试工单', description: '全链路测试', priority: 'high', assignedTo: 'dev-team' })
    assert.equal(createRes.statusCode, 201)
    assert.equal(createRes.body.data.status, 'open')
    const ticketId = createRes.body.data.id

    // Mark in progress
    const inProg = await request(app.getHttpServer())
      .patch(`/crm-e2e-54/customers/${cid}/tickets/${ticketId}`)
      .send({ status: 'in_progress' })
    assert.equal(inProg.body.data.status, 'in_progress')

    // Resolve
    const resolved = await request(app.getHttpServer())
      .patch(`/crm-e2e-54/customers/${cid}/tickets/${ticketId}`)
      .send({ status: 'resolved' })
    assert.equal(resolved.body.data.status, 'resolved')

    // Close
    const closed = await request(app.getHttpServer())
      .patch(`/crm-e2e-54/customers/${cid}/tickets/${ticketId}`)
      .send({ status: 'closed' })
    assert.equal(closed.body.data.status, 'closed')
    assert.ok(closed.body.data.closedAt)
  } finally {
    await app.close()
  }
})

it('e2e-54: mark customer as churned reduces score', async () => {
  const { app } = await buildApp()
  try {
    const cid = await getFirstCustomerId(app)
    const before = (await request(app.getHttpServer()).get(`/crm-e2e-54/customers/${cid}`)).body.data

    const markRes = await request(app.getHttpServer())
      .patch(`/crm-e2e-54/customers/${cid}/status`)
      .send({ status: 'churned' })
    assert.equal(markRes.body.data.status, 'churned')
    assert.ok(markRes.body.data.engagementScore <= 20)
  } finally {
    await app.close()
  }
})

it('e2e-54: stats endpoint returns aggregated data', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/crm-e2e-54/stats')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.total, 3)
    assert.ok(res.body.data.byStatus.active >= 2)
    assert.ok(res.body.data.byStatus.lead >= 1)
    assert.ok(res.body.data.avgScore > 0)
    assert.ok(res.body.data.totalSpentCents > 0)
  } finally {
    await app.close()
  }
})

it('e2e-54: stats syncs after create and delete', async () => {
  const { app, crmService } = await buildApp()
  try {
    const before = (await request(app.getHttpServer()).get('/crm-e2e-54/stats')).body.data.total

    // Create
    await request(app.getHttpServer())
      .post('/crm-e2e-54/customers')
      .send({ name: 'StatsTest', email: 'stats@test.com', phone: '' })
    const afterCreate = (await request(app.getHttpServer()).get('/crm-e2e-54/stats')).body.data.total
    assert.equal(afterCreate, before + 1)

    // The 4th customer
    const last = crmService.list().slice(-1)[0]
    await request(app.getHttpServer())
      .delete(`/crm-e2e-54/customers/${last.id}`)
    const afterDelete = (await request(app.getHttpServer()).get('/crm-e2e-54/stats')).body.data.total
    assert.equal(afterDelete, before)
  } finally {
    await app.close()
  }
})
