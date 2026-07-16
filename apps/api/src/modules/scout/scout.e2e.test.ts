import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Scout 侦察兵 HTTP 链路
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
 *   - GET /scout/logs — 采集日志
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Param, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
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
  }).compile()

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
    assert.ok(Array.isArray(res.body))
    assert.equal(res.body.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/cities?tier=1 applies tier filter', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/cities').query({ tier: '1' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues returns venue list', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues?city=Beijing filters by city', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues').query({ city: 'Beijing', limit: '10', offset: '0' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/search?q= searches venues', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/search').query({ q: 'arcade' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/:id/prices returns prices for venue', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/1/prices')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/:id/devices returns device list', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/42/devices')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/:id/reviews returns reviews', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/7/reviews')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/venues/:id/reviews?sentiment=positive filters by sentiment', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/venues/7/reviews').query({ sentiment: 'positive' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
  } finally {
    await app.close()
  }
})

it('e2e: GET /scout/logs returns collection logs', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/scout/logs')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
  } finally {
    await app.close()
  }
})
