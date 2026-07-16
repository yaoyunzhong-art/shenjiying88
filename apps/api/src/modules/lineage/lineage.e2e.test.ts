import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Lineage 数据血缘 HTTP 链路
 *
 * 链路:
 *   HTTP → LineageController → DataLineageTracker + ImpactAnalyzer + SensitiveDataClassifier + DataFlowMonitor + ComplianceReporter
 *
 * 验证:
 *   - 字段血缘追踪(注册/上游查询/下游查询/全图)
 *   - 影响分析(变更影响/风险等级)
 *   - 敏感数据分类(自动分类/批量分类/更新)
 *   - 数据流监控(追踪/暴露风险)
 *   - 合规报告(GDPR/合规分数)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { LineageController } from './lineage.controller'
import { DataLineageTracker, ImpactAnalyzer } from './data-lineage.service'
import {
  SensitiveDataClassifier,
  DataFlowMonitor,
  ComplianceReporter,
} from './sensitive-data.service'

async function buildApp() {
  const lineageTracker = new DataLineageTracker()
  const impactAnalyzer = new ImpactAnalyzer(lineageTracker)
  const classifier = new SensitiveDataClassifier()
  const flowMonitor = new DataFlowMonitor()
  const complianceReporter = new ComplianceReporter(classifier, flowMonitor)

  const moduleRef = await Test.createTestingModule({
    controllers: [LineageController],
    providers: [
      { provide: DataLineageTracker, useValue: lineageTracker },
      { provide: ImpactAnalyzer, useValue: impactAnalyzer },
      { provide: SensitiveDataClassifier, useValue: classifier },
      { provide: DataFlowMonitor, useValue: flowMonitor },
      { provide: ComplianceReporter, useValue: complianceReporter },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, lineageTracker, impactAnalyzer }
}

beforeEach(() => {
  // 重置测试状态(如果在这些类中有 clear 方法)
})

it('e2e: 字段注册→血缘边创建→上游查询→下游查询→全图', async () => {
  const { app } = await buildApp()
  try {
    // 1. 注册字段
    const regRes = await request(app.getHttpServer())
      .post('/lineage/fields/register')
      .send({ tableName: 'orders', fieldName: 'customer_id' })
    assert.equal(regRes.statusCode, 201)
    assert.equal(regRes.body.success, true)

    // 2. 注册血缘边: customers.id -> orders.customer_id
    const edgeRes = await request(app.getHttpServer())
      .post('/lineage/edges')
      .send({
        type: 'DIRECT',
        from: { tableName: 'customers', fieldName: 'id' },
        to: { tableName: 'orders', fieldName: 'customer_id' },
      })
    assert.equal(edgeRes.statusCode, 201)
    assert.equal(edgeRes.body.success, true)

    // 3. 注册第二层: orders.customer_id -> reports.customer_name
    await request(app.getHttpServer())
      .post('/lineage/edges')
      .send({
        type: 'TRANSFORM',
        from: { tableName: 'orders', fieldName: 'customer_id' },
        to: { tableName: 'reports', fieldName: 'customer_name' },
        transform: 'CONCAT(first_name, last_name)',
      })

    // 4. 上游查询: reports.customer_name 的上游应是 orders.customer_id
    const upstreamRes = await request(app.getHttpServer())
      .get('/lineage/lineage/reports/customer_name')
    assert.equal(upstreamRes.statusCode, 200)
    assert.equal(upstreamRes.body.success, true)
    assert.ok(upstreamRes.body.data.length >= 1)

    // 5. 下游查询: customers.id 的下游应是 orders.customer_id
    const downstreamRes = await request(app.getHttpServer())
      .get('/lineage/downstream/customers/id')
    assert.equal(downstreamRes.statusCode, 200)
    assert.ok(downstreamRes.body.data.length >= 1)

    // 6. 获取血缘全图
    const graphRes = await request(app.getHttpServer())
      .get('/lineage/graph')
    assert.equal(graphRes.statusCode, 200)
    assert.ok(graphRes.body.data.nodeCount >= 3)
  } finally {
    await app.close()
  }
})

it('e2e: 影响分析评估字段变更风险', async () => {
  const { app } = await buildApp()
  try {
    // 构建影响分析场景
    await request(app.getHttpServer())
      .post('/lineage/edges')
      .send({
        type: 'DIRECT',
        from: { tableName: 'source', fieldName: 'sensitive_field' },
        to: { tableName: 'core', fieldName: 'sensitive_field' },
      })
    await request(app.getHttpServer())
      .post('/lineage/edges')
      .send({
        type: 'DIRECT',
        from: { tableName: 'core', fieldName: 'sensitive_field' },
        to: { tableName: 'dashboard', fieldName: 'display_field' },
      })

    // 影响分析
    const impactRes = await request(app.getHttpServer())
      .post('/lineage/impact')
      .send({ field: { tableName: 'source', fieldName: 'sensitive_field' } })
    assert.equal(impactRes.statusCode, 201)
    assert.equal(impactRes.body.success, true)
    assert.ok(impactRes.body.data.downstreamFields.length >= 1)
    assert.ok(impactRes.body.data.upstreamFields.length >= 0)
    assert.equal(typeof impactRes.body.data.riskLevel, 'string')
  } finally {
    await app.close()
  }
})

it('e2e: 敏感数据自动分类与批量分类', async () => {
  const { app } = await buildApp()
  try {
    // 1. 单字段自动分类
    const classifyRes = await request(app.getHttpServer())
      .post('/lineage/classify')
      .send({ tableName: 'users', fieldName: 'phone_number' })
    assert.equal(classifyRes.statusCode, 201)
    assert.equal(classifyRes.body.data.category, 'PII')
    assert.equal(classifyRes.body.data.level, 'restricted')
    assert.equal(classifyRes.body.data.autoClassified, true)

    // 2. 按样本数据分类
    const sampleRes = await request(app.getHttpServer())
      .post('/lineage/classify')
      .send({ tableName: 'contacts', fieldName: 'mobile', sampleData: '13800138000' })
    assert.equal(sampleRes.statusCode, 201)
    assert.equal(sampleRes.body.data.level, 'confidential')

    // 3. 批量分类
    const batchRes = await request(app.getHttpServer())
      .post('/lineage/classify/batch')
      .send([
        { tableName: 'users', fieldName: 'email' },
        { tableName: 'payments', fieldName: 'credit_card' },
        { tableName: 'users', fieldName: 'name' },
      ])
    assert.equal(batchRes.statusCode, 201)
    assert.equal(batchRes.body.data.length, 3)
    assert.equal(batchRes.body.data[0].category, 'PII')
    assert.equal(batchRes.body.data[1].category, 'FINANCIAL')

    // 4. 查询分类结果
    const getRes = await request(app.getHttpServer())
      .get('/lineage/classify/users/phone_number')
    assert.equal(getRes.statusCode, 200)
    assert.equal(getRes.body.data.category, 'PII')
  } finally {
    await app.close()
  }
})

it('e2e: 敏感字段分类更新与列表查询', async () => {
  const { app } = await buildApp()
  try {
    // 先自动分类
    await request(app.getHttpServer())
      .post('/lineage/classify')
      .send({ tableName: 'users', fieldName: 'phone' })

    // 手动更新级别
    const updateRes = await request(app.getHttpServer())
      .post('/lineage/classify/update')
      .send({ tableName: 'users', fieldName: 'phone', level: 'internal' })
    assert.equal(updateRes.statusCode, 201)
    assert.equal(updateRes.body.data.level, 'internal')
    assert.equal(updateRes.body.data.autoClassified, false)

    // 列出敏感字段
    const listRes = await request(app.getHttpServer())
      .get('/lineage/classify/sensitive/users')
    assert.equal(listRes.statusCode, 200)
    assert.ok(listRes.body.data.length >= 1)

    // 获取全部分类
    const allRes = await request(app.getHttpServer())
      .get('/lineage/classify/all')
    assert.equal(allRes.statusCode, 200)
    assert.ok(allRes.body.data.length >= 1)
  } finally {
    await app.close()
  }
})

it('e2e: 数据流追踪与暴露风险检测', async () => {
  const { app } = await buildApp()
  try {
    // 追踪数据流
    const flowRes = await request(app.getHttpServer())
      .post('/lineage/flows/track')
      .send({
        fromTable: 'users',
        fromField: 'email',
        toTable: 'reports',
        toField: 'email',
        via: 'foreign_key',
      })
    assert.equal(flowRes.statusCode, 201)
    assert.equal(flowRes.body.success, true)

    // 获取报告
    const reportRes = await request(app.getHttpServer())
      .get('/lineage/flows/report')
    assert.equal(reportRes.statusCode, 200)
    assert.ok(reportRes.body.data.edges.length >= 1)

    // 暴露风险
    const riskRes = await request(app.getHttpServer())
      .get('/lineage/flows/risks')
    assert.equal(riskRes.statusCode, 200)
    assert.ok(Array.isArray(riskRes.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: 合规报告与合规分数', async () => {
  const { app } = await buildApp()
  try {
    // 分类一些字段
    await request(app.getHttpServer())
      .post('/lineage/classify')
      .send({ tableName: 'users', fieldName: 'email' })
    await request(app.getHttpServer())
      .post('/lineage/classify')
      .send({ tableName: 'users', fieldName: 'phone' })

    // 合规报告
    const reportRes = await request(app.getHttpServer())
      .get('/lineage/compliance/report')
    assert.equal(reportRes.statusCode, 200)
    assert.ok(typeof reportRes.body.data.compliant === 'boolean')
    assert.equal(typeof reportRes.body.data.reportId, 'string')

    // 合规分数
    const scoreRes = await request(app.getHttpServer())
      .get('/lineage/compliance/score')
    assert.equal(scoreRes.statusCode, 200)
    assert.ok(typeof scoreRes.body.data.score === 'number')

    // 违规列表
    const violRes = await request(app.getHttpServer())
      .get('/lineage/compliance/violations')
    assert.equal(violRes.statusCode, 200)
    assert.ok(Array.isArray(violRes.body.data))

    // 按 ID 查询报告
    const idRes = await request(app.getHttpServer())
      .get('/lineage/compliance/report/report-001')
    assert.equal(idRes.statusCode, 200)
    assert.equal(idRes.body.data.requestedReportId, 'report-001')
  } finally {
    await app.close()
  }
})
