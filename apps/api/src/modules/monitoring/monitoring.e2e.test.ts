import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Monitoring 监控告警模块 HTTP 链路
 *
 * 链路:
 *   HTTP → NestJS Testing Module → MonitoringController → MonitoringService
 *
 * 验证:
 *   - GET/POST metrics 端点
 *   - CRUD alert rules
 *   - Alert trigger / silence / audit
 *   - Validation error handling
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import { Module, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { APP_PIPE } from '@nestjs/core'
import { MonitoringController } from './monitoring.controller'
import { MonitoringService } from './monitoring.service'

@Module({
  controllers: [MonitoringController],
  providers: [
    MonitoringService,
    { provide: APP_PIPE, useFactory: () => new ValidationPipe({ whitelist: true, transform: true }) },
  ],
})
class TestMonitoringModule {}

describe('Monitoring E2E', () => {
  let app: any
  let httpServer: any

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestMonitoringModule],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()
    httpServer = app.getHttpServer()
  })

  afterAll(async () => {
    await app?.close()
  })

  /* ── Metrics ── */

  it('GET /monitoring/metrics returns built-in metric definitions', async () => {
    const res = await request(httpServer).get('/monitoring/metrics')

    assert.equal(res.status, 200)
    assert.ok(res.body.items.length >= 9)
    const names = res.body.items.map((i: any) => i.name)
    assert.ok(names.includes('http.request.count'))
    assert.ok(names.includes('cpu.usage_percent'))
    assert.ok(names.includes('memory.usage_mb'))
  })

  it('POST /monitoring/metrics/record records a metric point', async () => {
    const res = await request(httpServer)
      .post('/monitoring/metrics/record')
      .send({ name: 'http.request.count', value: 1, labels: { method: 'GET', path: '/api/e2e' } })
      .set('Content-Type', 'application/json')

    assert.equal(res.status, 201)
    assert.equal(res.body.name, 'http.request.count')
    assert.equal(res.body.value, 1)
    assert.ok(res.body.timestamp)
  })

  it('POST /monitoring/metrics/record handles zero value', async () => {
    const res = await request(httpServer)
      .post('/monitoring/metrics/record')
      .send({ name: 'http.error.rate', value: 0, labels: { path: '/' } })
      .set('Content-Type', 'application/json')

    assert.equal(res.status, 201)
    assert.equal(res.body.value, 0)
  })

  it('POST /monitoring/metrics/record-batch records multiple points', async () => {
    const res = await request(httpServer)
      .post('/monitoring/metrics/record-batch')
      .send({
        points: [
          { name: 'cpu.usage_percent', value: 45, labels: {} },
          { name: 'memory.usage_mb', value: 2048, labels: {} },
        ],
      })
      .set('Content-Type', 'application/json')

    assert.equal(res.status, 201)
    assert.equal(res.body.count, 2)
  })

  it('GET /monitoring/metrics/:name returns metric details', async () => {
    // First record a point
    await request(httpServer)
      .post('/monitoring/metrics/record')
      .send({ name: 'cpu.usage_percent', value: 50, labels: { host: 'web-1' } })
      .set('Content-Type', 'application/json')

    const res = await request(httpServer).get('/monitoring/metrics/cpu.usage_percent')

    assert.equal(res.status, 200)
    assert.equal(res.body.name, 'cpu.usage_percent')
    assert.ok(res.body.definition)
    assert.ok(res.body.points.length > 0)
  })

  it('GET /monitoring/metrics/:name returns null definition for unknown metric', async () => {
    const res = await request(httpServer).get('/monitoring/metrics/e2e.unknown.metric')

    assert.equal(res.status, 200)
    assert.equal(res.body.definition, null)
    assert.equal(res.body.points.length, 0)
  })

  /* ── Alert Rules ── */

  it('GET /monitoring/rules returns seeded rules', async () => {
    const res = await request(httpServer).get('/monitoring/rules')

    assert.equal(res.status, 200)
    assert.ok(res.body.items.length >= 3)
    const names = res.body.items.map((r: any) => r.name)
    assert.ok(names.includes('高错误率告警'))
    assert.ok(names.includes('AI 延迟告警'))
    assert.ok(names.includes('CPU 高占用'))
  })

  it('POST /monitoring/rules/create creates a new rule', async () => {
    const res = await request(httpServer)
      .post('/monitoring/rules/create')
      .send({
        name: 'E2E 自定义告警',
        metric: 'memory.usage_mb',
        comparator: 'gt',
        threshold: 4096,
        durationSec: 60,
        severity: 'error',
        channels: ['in_app', 'email'],
        enabled: true,
        createdBy: 'e2e-test',
      })
      .set('Content-Type', 'application/json')

    // The controller passes the body through — no DTO validation pipe blocking
    assert.equal(res.status, 201)
    assert.ok(res.body.id)
    assert.ok(res.body.id.startsWith('rule-'))
    assert.equal(res.body.name, 'E2E 自定义告警')
    assert.equal(res.body.threshold, 4096)
    assert.equal(res.body.createdBy, 'e2e-test')
  })

  it('POST /monitoring/rules/:id/update updates an existing rule', async () => {
    // Create a rule first
    const createRes = await request(httpServer)
      .post('/monitoring/rules/create')
      .send({
        name: '待更新',
        metric: 'memory.usage_mb',
        comparator: 'gt',
        threshold: 3000,
        durationSec: 30,
        severity: 'warning',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'e2e-test',
      })
      .set('Content-Type', 'application/json')
    const ruleId = createRes.body.id

    const res = await request(httpServer)
      .post(`/monitoring/rules/${ruleId}/update`)
      .send({ threshold: 5000, name: '已更新' })
      .set('Content-Type', 'application/json')

    assert.equal(res.status, 201)
    assert.equal(res.body.name, '已更新')
    assert.equal(res.body.threshold, 5000)
  })

  it('POST /monitoring/rules/:id/update returns 400 for unknown rule', async () => {
    const res = await request(httpServer)
      .post('/monitoring/rules/nonexistent-rule-id/update')
      .send({ threshold: 100 })
      .set('Content-Type', 'application/json')

    assert.equal(res.status, 400)
  })

  /* ── Alerts ── */

  it('GET /monitoring/alerts returns empty initially', async () => {
    const res = await request(httpServer).get('/monitoring/alerts')

    assert.equal(res.status, 200)
    assert.equal(res.body.items.length, 0)
  })

  it('triggers alert when metric exceeds threshold with instant-firing rule', async () => {
    // Create a rule with durationSec=0 (instant fire)
    const ruleRes = await request(httpServer)
      .post('/monitoring/rules/create')
      .send({
        name: 'E2E Instant Alert',
        metric: 'http.error.rate',
        comparator: 'gt',
        threshold: 0.01,
        durationSec: 0,
        severity: 'critical',
        channels: ['webhook'],
        enabled: true,
        createdBy: 'e2e-test',
      })
      .set('Content-Type', 'application/json')

    // Record a point that exceeds threshold
    await request(httpServer)
      .post('/monitoring/metrics/record')
      .send({ name: 'http.error.rate', value: 0.05, labels: { path: '/api/e2e' } })
      .set('Content-Type', 'application/json')

    // The service evaluates rules synchronously on recordMetric, so alert should be firing
    const alertsRes = await request(httpServer).get('/monitoring/alerts')
    const firingAlerts = alertsRes.body.items.filter((a: any) => a.status === 'firing')
    const errorRateAlerts = firingAlerts.filter((a: any) => a.ruleName === 'E2E Instant Alert')
    assert.ok(errorRateAlerts.length > 0)
    assert.equal(errorRateAlerts[0].severity, 'critical')
    assert.equal(errorRateAlerts[0].threshold, 0.01)
  })

  it('POST /monitoring/alerts/:id/silence silences a firing alert', async () => {
    const allRes = await request(httpServer).get('/monitoring/alerts?status=firing')
    const alerts = allRes.body.items
    if (alerts.length === 0) return

    const alertId = alerts[0].id
    const res = await request(httpServer)
      .post(`/monitoring/alerts/${alertId}/silence`)
      .send({ durationSec: 3600, operator: 'e2e-test', reason: '维护窗口' })
      .set('Content-Type', 'application/json')

    assert.equal(res.status, 201)
    assert.equal(res.body.status, 'silenced')
    assert.ok(res.body.silencedUntil)
  })

  it('POST /monitoring/alerts/:id/silence returns 400 for unknown alert', async () => {
    const res = await request(httpServer)
      .post('/monitoring/alerts/nonexistent-alert-id/silence')
      .send({ durationSec: 3600, operator: 'test' })
      .set('Content-Type', 'application/json')

    assert.equal(res.status, 400)
  })

  /* ── Audit ── */

  it('GET /monitoring/alerts/:id/audit returns audit logs', async () => {
    const allRes = await request(httpServer).get('/monitoring/alerts')
    const alerts = allRes.body.items
    if (alerts.length === 0) return

    const alertId = alerts[0].id
    const res = await request(httpServer).get(`/monitoring/alerts/${alertId}/audit`)

    assert.equal(res.status, 200)
    assert.ok(res.body.items.length >= 1)
    const actions = res.body.items.map((l: any) => l.action)
    assert.ok(actions.includes('fire'))
  })

  /* ── Full E2E Flow ── */

  it('E2E: complete metric→alert→silence→audit flow', async () => {
    // Use a unique metric name to avoid interference from other tests
    const uniqueMetric = `e2e.flow.cpu.${Date.now()}`

    // 1. Create a rule
    const createRuleRes = await request(httpServer)
      .post('/monitoring/rules/create')
      .send({
        name: 'E2E Complete Flow',
        metric: uniqueMetric,
        comparator: 'gt',
        threshold: 50,
        durationSec: 0,
        severity: 'error',
        channels: ['in_app'],
        enabled: true,
        createdBy: 'e2e-test',
      })
      .set('Content-Type', 'application/json')

    const ruleId = createRuleRes.body.id

    // 2. Record metric that triggers alert
    await request(httpServer)
      .post('/monitoring/metrics/record')
      .send({ name: uniqueMetric, value: 95, labels: { host: 'e2e-flow-server' } })
      .set('Content-Type', 'application/json')

    // 3. Verify alert is firing
    const alertsRes = await request(httpServer).get('/monitoring/alerts')
    const flowAlert = alertsRes.body.items.find(
      (a: any) => a.ruleId === ruleId && a.status === 'firing',
    )
    assert.ok(flowAlert, 'Alert should be firing')

    // 4. Silence the alert
    const silenceRes = await request(httpServer)
      .post(`/monitoring/alerts/${flowAlert.id}/silence`)
      .send({ durationSec: 300, operator: 'e2e-test', reason: 'E2E flow test' })
      .set('Content-Type', 'application/json')

    assert.equal(silenceRes.body.status, 'silenced')

    // 5. Check audit logs
    const auditRes = await request(httpServer).get(`/monitoring/alerts/${flowAlert.id}/audit`)
    const auditActions = auditRes.body.items.map((l: any) => l.action)
    assert.ok(auditActions.includes('fire'))
    assert.ok(auditActions.includes('silence'))
  })
})
