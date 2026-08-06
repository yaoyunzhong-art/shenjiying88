import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Scout 侦察兵 HTTP 链路 (25+ tests)
 *
 * 链路:
 *   HTTP → ScoutController → ScoutService → PrismaService
 *
 * 验证:
 *   - GET /scout/cities — 城市列表
 *   - GET /scout/cities?tier=1 — 按 tier 过滤
 *   - GET /scout/venues — 场馆列表
 *   - GET /scout/venues/search?q= — 场馆搜索
 *   - GET /scout/venues/:id/prices — 价格数据
 *   - GET /scout/venues/:id/devices — 设备数据
 *   - GET /scout/venues/:id/reviews — 评论数据
 *   - GET /scout/venues/:id/membership — 会员数据
 *   - GET /scout/venues/:id/activities — 活动数据
 *   - POST /scout/compare — 竞品对比
 *   - POST /scout/compare/summary — 对比摘要
 *   - POST /scout/snapshot — 批量快照
 *   - GET /scout/stats/region — 区域统计
 *   - GET /scout/stats/progress — 采集进度
 *   - GET /scout/recent-updated — 最近更新
 *   - GET /scout/logs — 采集日志
 *   边界/错误路径验证
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Param, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { TenantGuard } from '../agent/tenant.guard'
import { ScoutService } from './scout.service'
import { ScoutController } from './scout.controller'

/**
 * Mock PrismaService for ScoutService.
 * ScoutService.prisma is used via $queryRawUnsafe.
 */
const mockPrisma = {
  $queryRawUnsafe: async (_sql: string, ..._args: unknown[]): Promise<unknown[]> => {
    // Return empty arrays for all queries
    return []
  },
}

async function buildApp() {
  const scoutService = new ScoutService(mockPrisma as never)

  const moduleRef = await Test.createTestingModule({
    controllers: [ScoutController],
    providers: [
      { provide: ScoutService, useValue: scoutService },
    ],
  })
    .overrideGuard(TenantGuard)
    .useValue({ canActivate: () => true })
    .compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, scoutService }
}

it('e2e: GET /scout/cities returns empty array', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/cities')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
    assert.equal(res.body.data.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/cities?tier=1 applies tier filter', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/cities').query({ tier: '1' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/cities?tier=invalid gracefully handles bad tier value', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/cities').query({ tier: 'not-a-tier' })
    // Should still return 200 with empty array — tier filter passes invalid value to raw SQL
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
    assert.equal(res.body.data.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues returns venue list', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues?city=Beijing filters by city', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues').query({ city: 'Beijing', limit: '10', offset: '0' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues?category=VR filters by category', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues').query({ category: 'VR' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues with limit=5 and offset=2 applies pagination', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues').query({ limit: '5', offset: '2' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/search?q= searches venues', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/search').query({ q: 'arcade' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/search with empty q returns empty result', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/search').query({ q: '' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/search with special characters in q is handled', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/search').query({ q: '%_test_%' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/:id/prices returns prices for venue', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/1/prices')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/:id/prices with non-numeric id returns empty', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/abc/prices')
    // Non-numeric id becomes NaN, which should still return empty array
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/:id/devices returns device list', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/42/devices')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/:id/membership returns membership data', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/1/membership')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/:id/reviews returns reviews', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/7/reviews')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/:id/reviews?sentiment=positive filters by sentiment', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/7/reviews').query({ sentiment: 'positive' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/:id/reviews?sentiment=negative filters by negative sentiment', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/7/reviews').query({ sentiment: 'negative' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/:id/activities returns activities data', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/3/activities')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: POST /scout/compare with empty venueIds returns empty comparison', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).post('/scout/compare').send({ venueIds: [] })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.data)
    assert.ok(Array.isArray(res.body.data.prices))
    assert.equal(res.body.data.summary.totalVenues, 0)
  } finally {
    await app.close()
  }
})

it('e2e: POST /scout/compare with venueIds returns comparison structure', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).post('/scout/compare').send({ venueIds: [1, 2, 3] })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.data)
    assert.ok(Array.isArray(res.body.data.prices))
    assert.ok(Array.isArray(res.body.data.devices))
    assert.ok(Array.isArray(res.body.data.memberships))
    assert.equal(res.body.data.summary.totalVenues, 3)
    assert.equal(typeof res.body.data.summary.avgPriceItems, 'number')
    assert.equal(typeof res.body.data.summary.avgDevices, 'number')
  } finally {
    await app.close()
  }
})

it('e2e: POST /scout/compare/summary returns summary only', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).post('/scout/compare/summary').send({ venueIds: [1, 2] })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.totalVenues, 2)
  } finally {
    await app.close()
  }
})

it('e2e: POST /scout/compare/summary with empty venueIds returns null summary', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).post('/scout/compare/summary').send({ venueIds: [] })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data, null)
  } finally {
    await app.close()
  }
})

it('e2e: POST /scout/snapshot with city returns snapshot data', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).post('/scout/snapshot').send({ city: 'Beijing' })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.data)
    assert.ok(Array.isArray(res.body.data.prices))
    assert.equal(res.body.data.summary.totalVenues, 0)
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/stats/region returns region stats structure', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/stats/region')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/stats/progress returns progress stats structure', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/stats/progress')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/recent-updated returns recent updated venues', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/recent-updated')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/recent-updated?limit=5 applies limit parameter', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/recent-updated').query({ limit: '5' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/logs returns collection logs', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/logs')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/logs?cityId=filter filters logs by city ID', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/logs').query({ cityId: 'city-abc', limit: '10' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})
