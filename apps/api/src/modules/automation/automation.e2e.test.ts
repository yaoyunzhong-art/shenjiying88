import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Automation 自动化规则引擎 HTTP 链路
 *
 * 链路:
 *   HTTP → AutomationController → AutomationService
 *
 * 验证:
 *   - 规则创建与查询
 *   - 规则评估（条件匹配/不匹配）
 *   - 工作流创建与状态流转
 *   - 任务列表过滤
 *   - 规则禁用/动作触发
 *   - 边界与异常场景
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Inject, Post, Body, Param, Patch, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { AutomationService } from './automation.service'
import type { ActionType, WorkflowStatus, AutomationJob } from './automation.service'

@Controller('test/automation')
class TestAutomationController {
  constructor(
    @Inject(AutomationService) private readonly svc: AutomationService,
  ) {}

  @Get('rules')
  listRules() {
    const rules = this.svc.listAllRules()
    return { success: true, data: { rules, total: rules.length } }
  }

  @Get('rules/:id')
  getRule(@Param('id') id: string) {
    const rule = this.svc.getRule(id)
    if (!rule) {
      return { success: false, message: `规则 ${id} 不存在`, data: null }
    }
    return { success: true, data: rule }
  }

  @Post('rules')
  createRule(@Body() body: { name: string; description: string; conditions: unknown[]; actions: unknown[]; enabled: boolean; priority: number }) {
    const rule = this.svc.addRule({
      name: body.name,
      description: body.description,
      conditions: body.conditions as never,
      actions: body.actions as never,
      enabled: body.enabled,
      priority: body.priority,
    })
    return { success: true, data: rule }
  }

  @Post('rules/:id/evaluate')
  evaluateRule(@Param('id') id: string, @Body() body: { context: { data: Record<string, unknown>; timestamp: string } }) {
    const result = this.svc.evaluateRule(id, body.context)
    return { success: true, data: result }
  }

  @Post('workflows')
  createWorkflow(@Body() body: { name: string; ruleId: string }) {
    const wf = this.svc.createWorkflow(body.name, body.ruleId)
    return { success: true, data: wf }
  }

  @Get('workflows/:id')
  getWorkflow(@Param('id') id: string) {
    const wf = this.svc.getWorkflowStatus(id)
    if (!wf) {
      return { success: false, message: `工作流 ${id} 不存在`, data: null }
    }
    return { success: true, data: wf }
  }

  @Patch('workflows/:id/status')
  updateWorkflowStatus(@Param('id') id: string, @Body() body: { status: WorkflowStatus; progress?: number }) {
    const wf = this.svc.updateWorkflowStatus(id, body.status, body.progress)
    if (!wf) {
      return { success: false, message: `工作流 ${id} 不存在`, data: null }
    }
    return { success: true, data: wf }
  }

  @Post('workflows/:workflowId/jobs')
  createJob(@Param('workflowId') workflowId: string, @Body() body: { ruleId: string; type: AutomationJob['type']; context: { data: Record<string, unknown>; timestamp: string } }) {
    const job = this.svc.createJob(workflowId, body.ruleId, body.type, body.context)
    return { success: true, data: job }
  }

  @Get('jobs')
  listJobs(@Query() query: { status?: AutomationJob['status']; type?: AutomationJob['type']; limit?: string }) {
    const limit = query.limit ? parseInt(query.limit, 10) : undefined
    const jobs = this.svc.listJobs({
      status: query.status,
      type: query.type,
      limit: limit && !isNaN(limit) ? limit : undefined,
    })
    return { success: true, data: { jobs, total: jobs.length } }
  }
}



async function buildApp() {
  const automationService = new AutomationService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestAutomationController],
    providers: [
      { provide: AutomationService, useValue: automationService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, automationService }
}

// ────────────── 正例 (Positive) ──────────────

it('e2e: list default rules returns three rules', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/automation/rules')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.total, 3)
    assert.equal(res.body.data.rules.length, 3)
    assert.ok(res.body.data.rules.some((r: any) => r.name.includes('高票客户')))
  } finally {
    await app.close()
  }
})

it('e2e: create rule then evaluate with matching context', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/test/automation/rules')
      .send({
        name: '大额订单审批',
        description: '金额超5万需审批',
        conditions: [{ field: 'order.amount', op: 'gt' as const, value: 50000 }],
        actions: [{ type: 'send_notification' as const, params: { channel: 'email' } }],
        enabled: true,
        priority: 7,
      })
    assert.equal(createRes.statusCode, 201)
    const ruleId = createRes.body.data.id

    const evalRes = await request(app.getHttpServer())
      .post(`/test/automation/rules/${ruleId}/evaluate`)
      .send({
        context: { data: { order: { amount: 60000 } }, timestamp: new Date().toISOString() },
      })
    assert.equal(evalRes.body.data.matched, true)
    assert.equal(evalRes.body.data.triggeredActions.length, 1)
  } finally {
    await app.close()
  }
})

it('e2e: workflow create then query status', async () => {
  const { app } = await buildApp()
  try {
    const wfRes = await request(app.getHttpServer())
      .post('/test/automation/workflows')
      .send({ name: '夜间批处理', ruleId: 'rule_001' })
    assert.equal(wfRes.statusCode, 201)
    const workflowId = wfRes.body.data.id

    const getRes = await request(app.getHttpServer()).get(`/test/automation/workflows/${workflowId}`)
    assert.equal(getRes.body.data.status, 'idle')
    assert.equal(getRes.body.data.name, '夜间批处理')
  } finally {
    await app.close()
  }
})

it('e2e: evaluate with non-matching context returns no triggers', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/automation/rules/rule_001/evaluate')
      .send({
        context: { data: { customer: { score: 3 } }, timestamp: new Date().toISOString() },
      })
    assert.equal(res.body.data.matched, false)
    assert.equal(res.body.data.conditionsMet, 0)
    assert.equal(res.body.data.triggeredActions.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: nonexistent rule returns not-matched result', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/automation/rules/nonexistent/evaluate')
      .send({
        context: { data: {}, timestamp: new Date().toISOString() },
      })
    assert.equal(res.body.data.matched, false)
    assert.equal(res.body.data.ruleName, 'unknown')
  } finally {
    await app.close()
  }
})

it('e2e: get rule by id returns correct rule details', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/automation/rules/rule_002')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.name, '异常订单告警')
    assert.equal(res.body.data.conditions.length, 2)
    assert.equal(res.body.data.actions.length, 2)
    assert.equal(res.body.data.enabled, true)
  } finally {
    await app.close()
  }
})

it('e2e: rule evaluation with AND conditions all match triggers actions', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/automation/rules/rule_002/evaluate')
      .send({
        context: { data: { order: { amount: 200000, risk_flag: true } }, timestamp: new Date().toISOString() },
      })
    assert.equal(res.body.data.matched, true)
    assert.equal(res.body.data.conditionsMet, 2)
    assert.equal(res.body.data.triggeredActions.length, 2)
    assert.deepEqual(res.body.data.triggeredActions, ['send_email', 'send_notification'])
  } finally {
    await app.close()
  }
})

it('e2e: create job and verify it appears in job list', async () => {
  const { app } = await buildApp()
  try {
    const wfRes = await request(app.getHttpServer())
      .post('/test/automation/workflows')
      .send({ name: '批处理任务', ruleId: 'rule_003' })
    const workflowId = wfRes.body.data.id

    const jobRes = await request(app.getHttpServer())
      .post(`/test/automation/workflows/${workflowId}/jobs`)
      .send({ ruleId: 'rule_003', type: 'scheduled', context: { data: {}, timestamp: new Date().toISOString() } })
    assert.equal(jobRes.statusCode, 201)
    assert.equal(jobRes.body.data.status, 'pending')

    const listRes = await request(app.getHttpServer()).get('/test/automation/jobs')
    assert.equal(listRes.statusCode, 200)
    assert.ok(listRes.body.data.total >= 1)
  } finally {
    await app.close()
  }
})

it('e2e: update workflow status to running then completed progresses correctly', async () => {
  const { app } = await buildApp()
  try {
    const wfRes = await request(app.getHttpServer())
      .post('/test/automation/workflows')
      .send({ name: '状态流转测试', ruleId: 'rule_001' })
    const workflowId = wfRes.body.data.id

    const runRes = await request(app.getHttpServer())
      .patch(`/test/automation/workflows/${workflowId}/status`)
      .send({ status: 'running', progress: 30 })
    assert.equal(runRes.body.data.status, 'running')
    assert.equal(runRes.body.data.progress, 30)

    const doneRes = await request(app.getHttpServer())
      .patch(`/test/automation/workflows/${workflowId}/status`)
      .send({ status: 'completed', progress: 100 })
    assert.equal(doneRes.body.data.status, 'completed')
    assert.equal(doneRes.body.data.progress, 100)
  } finally {
    await app.close()
  }
})

it('e2e: create rule with high priority and get by id', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/test/automation/rules')
      .send({
        name: '紧急安全规则',
        description: '安全事件即时响应',
        conditions: [{ field: 'security.level', op: 'gte' as const, value: 9 }],
        actions: [{ type: 'send_notification' as const, params: { channel: 'pagerduty' } }],
        enabled: true,
        priority: 100,
      })
    assert.equal(createRes.statusCode, 201)
    const ruleId = createRes.body.data.id

    const getRes = await request(app.getHttpServer()).get(`/test/automation/rules/${ruleId}`)
    assert.equal(getRes.body.data.name, '紧急安全规则')
    assert.equal(getRes.body.data.priority, 100)
  } finally {
    await app.close()
  }
})

// ────────────── 反例 (Negative) ──────────────

it('e2e: get non-existent rule returns null data', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/automation/rules/missing_rule')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, false)
    assert.equal(res.body.data, null)
  } finally {
    await app.close()
  }
})

it('e2e: evaluate disabled rule returns not-matched', async () => {
  const { app } = await buildApp()
  try {
    // First create a disabled rule
    const createRes = await request(app.getHttpServer())
      .post('/test/automation/rules')
      .send({
        name: '已禁用规则',
        description: '此规则已禁用',
        conditions: [{ field: 'always', op: 'eq' as const, value: true }],
        actions: [{ type: 'log_event' as const, params: {} }],
        enabled: false,
        priority: 1,
      })
    const ruleId = createRes.body.data.id

    const evalRes = await request(app.getHttpServer())
      .post(`/test/automation/rules/${ruleId}/evaluate`)
      .send({
        context: { data: { always: true }, timestamp: new Date().toISOString() },
      })
    assert.equal(evalRes.body.data.matched, false)
    assert.equal(evalRes.body.data.triggeredActions.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: get non-existent workflow returns null data', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/automation/workflows/missing_wf')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, false)
    assert.equal(res.body.data, null)
  } finally {
    await app.close()
  }
})

it('e2e: update non-existent workflow status returns null', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .patch('/test/automation/workflows/missing_wf/status')
      .send({ status: 'running' })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, false)
  } finally {
    await app.close()
  }
})

it('e2e: rule evaluation with single condition NOT met returns matched=false', async () => {
  const { app } = await buildApp()
  try {
    // rule_001 requires customer.score >= 9, but score is 5
    const res = await request(app.getHttpServer())
      .post('/test/automation/rules/rule_001/evaluate')
      .send({
        context: { data: { customer: { score: 5 } }, timestamp: new Date().toISOString() },
      })
    assert.equal(res.body.data.matched, false)
    assert.equal(res.body.data.conditionsMet, 0)
  } finally {
    await app.close()
  }
})

// ────────────── 边界 (Boundary) ──────────────

it('e2e: rule evaluation at exact boundary threshold (gte=9, score=9)', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/automation/rules/rule_001/evaluate')
      .send({
        context: { data: { customer: { score: 9 } }, timestamp: new Date().toISOString() },
      })
    assert.equal(res.body.data.matched, true)
    assert.equal(res.body.data.conditionsMet, 1)
  } finally {
    await app.close()
  }
})

it('e2e: rule evaluation at exact boundary below threshold (gte=9, score=8)', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/automation/rules/rule_001/evaluate')
      .send({
        context: { data: { customer: { score: 8 } }, timestamp: new Date().toISOString() },
      })
    assert.equal(res.body.data.matched, false)
    assert.equal(res.body.data.conditionsMet, 0)
  } finally {
    await app.close()
  }
})

it('e2e: workflow progress clamped at 0-100 range', async () => {
  const { app } = await buildApp()
  try {
    const wfRes = await request(app.getHttpServer())
      .post('/test/automation/workflows')
      .send({ name: '进度边界测试', ruleId: 'rule_001' })
    const workflowId = wfRes.body.data.id

    const overRes = await request(app.getHttpServer())
      .patch(`/test/automation/workflows/${workflowId}/status`)
      .send({ status: 'running', progress: 999 })
    assert.equal(overRes.body.data.progress, 100)

    const underRes = await request(app.getHttpServer())
      .patch(`/test/automation/workflows/${workflowId}/status`)
      .send({ status: 'running', progress: -50 })
    assert.equal(underRes.body.data.progress, 0)
  } finally {
    await app.close()
  }
})

it('e2e: empty context data returns no conditions met', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/automation/rules/rule_003/evaluate')
      .send({
        context: { data: {}, timestamp: new Date().toISOString() },
      })
    // rule_003 looks for ticket.age_hours and ticket.status
    assert.equal(res.body.data.matched, false)
    assert.equal(res.body.data.conditionsMet, 0)
  } finally {
    await app.close()
  }
})

it('e2e: list jobs filtered by type returns only matching jobs', async () => {
  const { app } = await buildApp()
  try {
    const wfRes = await request(app.getHttpServer())
      .post('/test/automation/workflows')
      .send({ name: '过滤测试', ruleId: 'rule_001' })
    const workflowId = wfRes.body.data.id

    // Create triggered jobs
    await request(app.getHttpServer())
      .post(`/test/automation/workflows/${workflowId}/jobs`)
      .send({ ruleId: 'rule_001', type: 'triggered', context: { data: {}, timestamp: new Date().toISOString() } })

    const filtered = await request(app.getHttpServer()).get('/test/automation/jobs?type=triggered')
    assert.equal(filtered.statusCode, 200)
    assert.equal(filtered.body.data.jobs.every((j: any) => j.type === 'triggered'), true)
  } finally {
    await app.close()
  }
})

it('e2e: list jobs filtered by status returns only pending jobs', async () => {
  const { app } = await buildApp()
  try {
    const wfRes = await request(app.getHttpServer())
      .post('/test/automation/workflows')
      .send({ name: '状态过滤', ruleId: 'rule_001' })
    const workflowId = wfRes.body.data.id

    await request(app.getHttpServer())
      .post(`/test/automation/workflows/${workflowId}/jobs`)
      .send({ ruleId: 'rule_001', type: 'manual', context: { data: {}, timestamp: new Date().toISOString() } })

    const filtered = await request(app.getHttpServer()).get('/test/automation/jobs?status=pending')
    assert.equal(filtered.statusCode, 200)
    assert.ok(filtered.body.data.total >= 1)
    assert.equal(filtered.body.data.jobs.every((j: any) => j.status === 'pending'), true)
  } finally {
    await app.close()
  }
})

it('e2e: rule_003 IN operator matches correct values', async () => {
  const { app } = await buildApp()
  try {
    // rule_003: ticket.status IN ['open', 'pending']
    const res = await request(app.getHttpServer())
      .post('/test/automation/rules/rule_003/evaluate')
      .send({
        context: { data: { ticket: { age_hours: 30, status: 'open' } }, timestamp: new Date().toISOString() },
      })
    assert.equal(res.body.data.matched, true)
  } finally {
    await app.close()
  }
})

it('e2e: rule_003 IN operator non-matching returns false', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/automation/rules/rule_003/evaluate')
      .send({
        context: { data: { ticket: { age_hours: 30, status: 'closed' } }, timestamp: new Date().toISOString() },
      })
    assert.equal(res.body.data.matched, false)
  } finally {
    await app.close()
  }
})

it('e2e: evaluates rule with not_contains operator correctly', async () => {
  const { app } = await buildApp()
  try {
    // Create rule with not_contains
    const createRes = await request(app.getHttpServer())
      .post('/test/automation/rules')
      .send({
        name: '排除测试规则',
        description: '非测试域名触发',
        conditions: [{ field: 'email', op: 'not_contains' as const, value: 'test.com' }],
        actions: [{ type: 'log_event' as const, params: { level: 'info' } }],
        enabled: true,
        priority: 3,
      })
    const ruleId = createRes.body.data.id

    // Not matching - contains test.com
    const noMatch = await request(app.getHttpServer())
      .post(`/test/automation/rules/${ruleId}/evaluate`)
      .send({ context: { data: { email: 'user@test.com' }, timestamp: new Date().toISOString() } })
    assert.equal(noMatch.body.data.matched, false)

    // Matching - does not contain test.com
    const match = await request(app.getHttpServer())
      .post(`/test/automation/rules/${ruleId}/evaluate`)
      .send({ context: { data: { email: 'user@company.com' }, timestamp: new Date().toISOString() } })
    assert.equal(match.body.data.matched, true)
  } finally {
    await app.close()
  }
})

it('e2e: disabled rule returned via getRule with enabled=false', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/test/automation/rules')
      .send({
        name: '临时禁用规则',
        description: '测试禁用',
        conditions: [{ field: 'a', op: 'eq' as const, value: 1 }],
        actions: [{ type: 'log_event' as const, params: {} }],
        enabled: false,
        priority: 1,
      })
    const ruleId = createRes.body.data.id

    const getRes = await request(app.getHttpServer()).get(`/test/automation/rules/${ruleId}`)
    assert.equal(getRes.body.data.enabled, false)
  } finally {
    await app.close()
  }
})
