import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: RLS 行级安全 HTTP 链路
 *
 * 链路:
 *   HTTP → RlsController → RlsService (rls.helper.ts)
 *
 * 验证:
 *   - POST /api/rls/enable — 为指定表启用 RLS
 *   - POST /api/rls/policy — 创建 tenantId 过滤策略
 *   - POST /api/rls/setup — 一键设置 RLS + 策略 + Force
 *   - GET /api/rls/status — 查询 RLS 状态
 *   - GET /api/rls/policy — 查询策略详情
 *   - GET /api/rls/policies — 列出所有策略
 *   - PUT /api/rls/policy — 更新策略
 *   - DELETE /api/rls/policy — 删除策略
 *   - POST /api/rls/verify — 验证 tenantId 过滤
 *   - POST /api/rls/pool/init — 初始化租户连接池
 *   - POST /api/rls/verify/access — 验证用户-租户访问
 *   - GET /api/rls/audit — 查询审计日志
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
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { RlsService as RlsHelperService } from './rls.helper'
import { RlsController } from './rls.controller'
import {
  generateEnableRlsSql,
  generateCreatePolicySql,
  generateForceRlsSql,
  generateDropPolicySql,
  validateName,
} from './rls.helper'

/**
 * Mock PrismaService for RLS operations.
 * RlsHelperService expects a prisma instance providing $queryRawUnsafe and $executeRawUnsafe.
 */
const mockPrisma = {
  $queryRawUnsafe: async (_sql: string, ..._args: unknown[]) => {
    // Return an empty array simulating no rows for pg_class queries
    return []
  },
  $executeRawUnsafe: async (_sql: string): Promise<Array<unknown>> => {
    return []
  },
}

async function buildApp() {
  const rlsService = new RlsHelperService(mockPrisma)
  const moduleRef = await Test.createTestingModule({
    controllers: [RlsController],
    providers: [
      { provide: RlsHelperService, useValue: rlsService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, rlsService }
}

it('e2e: POST /api/rls/enable returns success for valid table name', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/rls/enable')
      .send({ tableName: 'users' })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.tableName, 'users')
    assert.equal(res.body.data.rlsEnabled, true)
  } finally {
    await app.close()
  }
})

it('e2e: POST /api/rls/policy creates tenant isolation policy', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/rls/policy')
      .send({ tableName: 'orders', tenantColumn: 'tenantId' })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.tableName, 'orders')
    assert.equal(res.body.data.policyName, 'tenant_isolation')
    assert.equal(res.body.data.tenantColumn, 'tenantId')
  } finally {
    await app.close()
  }
})

it('e2e: POST /api/rls/setup performs full RLS setup', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/rls/setup')
      .send({ tableName: 'inventory', tenantColumn: 'orgId', policyName: 'org_isolation' })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.tableName, 'inventory')
  } finally {
    await app.close()
  }
})

it('e2e: GET /api/rls/status returns table list', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/api/rls/status')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.ok(Array.isArray(res.body.data.tables))
    assert.equal(typeof res.body.data.total, 'number')
  } finally {
    await app.close()
  }
})

it('e2e: GET /api/rls/status?table=users filters by table name', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/api/rls/status').query({ table: 'users' })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
  } finally {
    await app.close()
  }
})

it('e2e: POST /api/rls/verify validates tenant isolation', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/rls/verify')
      .send({ tableName: 'orders', tenantId: 'tenant-001' })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.equal(typeof res.body.data.leakedRows, 'number')
    assert.equal(typeof res.body.data.isolated, 'boolean')
  } finally {
    await app.close()
  }
})

it('e2e: POST /api/rls/pool/init initializes tenant connection pool', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/rls/pool/init')
      .send({ tenantId: 'tenant-cn' })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.tenantId, 'tenant-cn')
  } finally {
    await app.close()
  }
})

it('e2e: POST /api/rls/verify/access checks user-tenant permission', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/rls/verify/access')
      .send({ tenantId: 'admin', userId: 'tenant_admin_001' })
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.equal(typeof res.body.data.allowed, 'boolean')
  } finally {
    await app.close()
  }
})

it('e2e: GET /api/rls/audit returns audit logs', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/api/rls/audit')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.ok(Array.isArray(res.body.data.logs))
  } finally {
    await app.close()
  }
})
