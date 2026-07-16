import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Db-Knowledge 数据库知识库 HTTP 链路
 *
 * 链路:
 *   HTTP → DbKnowledgeController → DbKnowledgeService (降级友好: DB不可用时返回空值)
 *
 * 验证:
 *   - 服务状态查询
 *   - 知识文档全文搜索
 *   - 文档按种类查询
 *   - 专家查询
 *   - 验收脉冲查询
 *   - 活跃阶段查询
 *   - 反模式/正向模式查询
 *   - 竞品场馆按城市查询
 *   - 今日简报查询
 *   - 搜索日志写入
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { DbKnowledgeController } from './db-knowledge.controller'
import { DbKnowledgeService } from './db-knowledge.service'

async function buildApp() {
  const dbKnowledgeService = new DbKnowledgeService()

  const moduleRef = await Test.createTestingModule({
    controllers: [DbKnowledgeController],
    providers: [
      { provide: DbKnowledgeService, useValue: dbKnowledgeService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, dbKnowledgeService }
}

it('e2e: 服务状态返回可用性标记', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/db-knowledge/status')
    assert.equal(res.statusCode, 200)
    // DB 不可用时不抛异常，返回 false
    assert.equal(typeof res.body.available, 'boolean')
  } finally {
    await app.close()
  }
})

it('e2e: 全文搜索降级返回空数组（DB不可用时）', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/db-knowledge/search?query=test&kind=spec&limit=5')
    // DB 不可用时返回空数组而非抛异常
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
    assert.equal(res.body.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: 按种类查询文档降级返回空数组', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/db-knowledge/documents/spec')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
    assert.equal(res.body.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: 专家查询降级返回空数组', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/db-knowledge/experts')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
    assert.equal(res.body.length, 0)

    // 带 groupId 过滤也正常工作
    const filtered = await request(app.getHttpServer())
      .get('/db-knowledge/experts?groupId=backend')
    assert.equal(filtered.statusCode, 200)
    assert.ok(Array.isArray(filtered.body))
  } finally {
    await app.close()
  }
})

it('e2e: 验收脉冲查询降级返回空数组', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/db-knowledge/pulses?limit=10')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
    assert.equal(res.body.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: 活跃阶段查询降级返回空数组', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/db-knowledge/phases')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
    assert.equal(res.body.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: 模式查询支持类型过滤', async () => {
  const { app } = await buildApp()
  try {
    // 不传 type 返回全部
    const allRes = await request(app.getHttpServer())
      .get('/db-knowledge/patterns')
    assert.equal(allRes.statusCode, 200)
    assert.ok(Array.isArray(allRes.body))

    // 按 type 过滤
    const antiRes = await request(app.getHttpServer())
      .get('/db-knowledge/patterns?type=anti-pattern')
    assert.equal(antiRes.statusCode, 200)
    assert.ok(Array.isArray(antiRes.body))
  } finally {
    await app.close()
  }
})

it('e2e: 竞品场馆按城市查询降级返回空数组', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/db-knowledge/venues?city=深圳')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
    assert.equal(res.body.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: 今日简报降级提示无数据', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/db-knowledge/brief/today')
    assert.equal(res.statusCode, 200)
    // DB 不可用返回 { message: ... }
    assert.ok(typeof res.body.message === 'string')
  } finally {
    await app.close()
  }
})

it('e2e: 搜索日志静默降级', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/db-knowledge/search/log')
      .send({ query: 'test query', count: 5, durationMs: 100 })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.logged, true)
  } finally {
    await app.close()
  }
})
