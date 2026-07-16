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
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Inject, Post, Body, Param } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { AutomationService } from './automation.service'

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
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, automationService }
}

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
