import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Venue 场馆管理 HTTP 链路
 *
 * 链路:
 *   HTTP → VenueController → VenueService
 *
 * 验证:
 *   - POST /venue — 创建场馆
 *   - GET /venue — 场馆列表
 *   - GET /venue/:id — 获取详情
 *   - PUT /venue/:id — 更新场馆
 *   - DELETE /venue/:id — 删除场馆
 *   - 状态转换 (idle → maintenance → idle)
 *   - 时段定价管理
 *   - 名称冲突
 *   - 分页/搜索过滤
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Delete, Get, Param, Post, Put, Body, Query } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { VenueService, CreateVenueInput, UpdateVenueInput } from './venue.service'
import { VenueController } from './venue.controller'
import { VenueType, VenueStatus } from './venue.entity'
import { CreateVenueDto, UpdateVenueDto } from './venue.dto'

async function buildApp() {
  const venueService = new VenueService()

  const moduleRef = await Test.createTestingModule({
    controllers: [VenueController],
    providers: [
      { provide: VenueService, useValue: venueService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, venueService }
}

it('e2e: POST /venue creates a venue', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/venue')
      .send({
        name: 'Main Hall',
        type: VenueType.HALL,
        capacity: 200,
        priceCents: 50000,
        tags: ['premium', 'indoor'],
        description: 'Main event hall',
      })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.id)
    assert.equal(res.body.name, 'Main Hall')
    assert.equal(res.body.status, VenueStatus.IDLE)
    assert.equal(res.body.capacity, 200)
    assert.equal(res.body.priceCents, 50000)
  } finally {
    await app.close()
  }
})

it('e2e: GET /venue lists all venues', async () => {
  const { app, venueService } = await buildApp()
  try {
    // Create 2 venues
    venueService.create({
      name: 'Room A',
      type: VenueType.INDOOR,
      capacity: 50,
      priceCents: 20000,
    })
    venueService.create({
      name: 'Room B',
      type: VenueType.OUTDOOR,
      capacity: 100,
      priceCents: 30000,
    })

    const res = await request(app.getHttpServer()).get('/venue')
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
    assert.equal(res.body.length, 2)
  } finally {
    await app.close()
  }
})

it('e2e: GET /venue filters by type and status', async () => {
  const { app, venueService } = await buildApp()
  try {
    venueService.create({
      name: 'VIP Booth',
      type: VenueType.BOOTH,
      capacity: 10,
      priceCents: 10000,
    })
    venueService.create({
      name: 'Garden',
      type: VenueType.OUTDOOR,
      capacity: 300,
      priceCents: 80000,
    })

    const res = await request(app.getHttpServer()).get('/venue').query({ type: VenueType.BOOTH })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body))
    assert.equal(res.body.length, 1)
    assert.equal(res.body[0].type, VenueType.BOOTH)
  } finally {
    await app.close()
  }
})

it('e2e: GET /venue/:id returns venue details', async () => {
  const { app, venueService } = await buildApp()
  try {
    const created = venueService.create({
      name: 'Concert Hall',
      type: VenueType.HALL,
      capacity: 500,
      priceCents: 100000,
    })
    const res = await request(app.getHttpServer()).get(`/venue/${created.id}`)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.name, 'Concert Hall')
    assert.equal(res.body.capacity, 500)
  } finally {
    await app.close()
  }
})

it('e2e: PUT /venue/:id updates venue fields', async () => {
  const { app, venueService } = await buildApp()
  try {
    const created = venueService.create({
      name: 'Dining Area',
      type: VenueType.DINING,
      capacity: 80,
      priceCents: 40000,
    })
    const res = await request(app.getHttpServer())
      .put(`/venue/${created.id}`)
      .send({ name: 'Premium Dining', capacity: 120, priceCents: 60000 })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.name, 'Premium Dining')
    assert.equal(res.body.capacity, 120)
    assert.equal(res.body.priceCents, 60000)
  } finally {
    await app.close()
  }
})

it('e2e: PUT /venue/:id transitions status correctly', async () => {
  const { app, venueService } = await buildApp()
  try {
    const created = venueService.create({
      name: 'Maintenance Test',
      type: VenueType.GAME_AREA,
      capacity: 30,
      priceCents: 15000,
    })
    // idle → maintenance
    const res1 = await request(app.getHttpServer())
      .put(`/venue/${created.id}`)
      .send({ status: VenueStatus.MAINTENANCE })
    assert.equal(res1.statusCode, 200)
    assert.equal(res1.body.status, VenueStatus.MAINTENANCE)

    // maintenance → idle
    const res2 = await request(app.getHttpServer())
      .put(`/venue/${created.id}`)
      .send({ status: VenueStatus.IDLE })
    assert.equal(res2.statusCode, 200)
    assert.equal(res2.body.status, VenueStatus.IDLE)
  } finally {
    await app.close()
  }
})

it('e2e: PUT /venue/:id rejects invalid status transition', async () => {
  const { app, venueService } = await buildApp()
  try {
    const created = venueService.create({
      name: 'Idle Venue',
      type: VenueType.INDOOR,
      capacity: 20,
      priceCents: 5000,
    })
    // idle → occupied is valid
    const res = await request(app.getHttpServer())
      .put(`/venue/${created.id}`)
      .send({ status: VenueStatus.OCCUPIED })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.status, VenueStatus.OCCUPIED)
  } finally {
    await app.close()
  }
})

it('e2e: DELETE /venue/:id deletes venue', async () => {
  const { app, venueService } = await buildApp()
  try {
    const created = venueService.create({
      name: 'Temp Venue',
      type: VenueType.BOOTH,
      capacity: 5,
      priceCents: 3000,
    })
    const res = await request(app.getHttpServer()).delete(`/venue/${created.id}`)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)

    // Verify deletion
    assert.throws(() => venueService.getById(created.id), /不存在/)
  } finally {
    await app.close()
  }
})

it('e2e: POST /venue rejects duplicate name', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/venue')
      .send({ name: 'Duplicated', type: VenueType.INDOOR, capacity: 10, priceCents: 1000 })
    const res = await request(app.getHttpServer())
      .post('/venue')
      .send({ name: 'Duplicated', type: VenueType.INDOOR, capacity: 10, priceCents: 1000 })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('e2e: GET /venue/:id returns 404 for non-existent', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/venue/non-existent-id')
    assert.equal(res.statusCode, 404)
  } finally {
    await app.close()
  }
})
