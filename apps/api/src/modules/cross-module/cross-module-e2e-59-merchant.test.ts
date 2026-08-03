import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Cross-module #59 — 商户/供应商管理全链路
 *
 * 链路:
 *   1. POST /suppliers-e2e-59/suppliers (创建供应商)
 *   2. GET /suppliers-e2e-59/suppliers (列表/搜索/过滤)
 *   3. GET /suppliers-e2e-59/suppliers/:id (详情)
 *   4. PATCH /suppliers-e2e-59/suppliers/:id (更新)
 *   5. DELETE /suppliers-e2e-59/suppliers/:id (删除)
 *   6. 多租户隔离 (tenant-001 vs tenant-002)
 *   7. 状态切换 Active → Inactive → Suspended
 *   8. 评级管理 A → C
 *   9. 搜索/分类筛选
 *   10. 级联: 创建后更新状态 → 删除 → 不可访问
 *
 * 验证:
 *   - 创建供应商返回完整字段
 *   - 列表支持 status/rating/category/search 过滤
 *   - 更新支持部分字段
 *   - 删除后不可访问
 *   - 多租户数据完全隔离
 *   - 状态字段单向非法状态转换
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
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { SupplierManagerService } from '../supplier-manager/supplier-manager.service'
import {
  SupplierStatus,
  SupplierRating,
  type Supplier,
} from '../supplier-manager/supplier-manager.entity'

// ─── TestController ───

@Controller('suppliers-e2e-59')
class TestE2eController {
  constructor(private readonly svc: SupplierManagerService) {}

  @Post('suppliers')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: {
    tenantId: string
    name: string
    code: string
    contactPerson: string
    phone: string
    email: string
    address: string
    category: string
    status?: SupplierStatus
    rating?: SupplierRating
    remark?: string
  }): { success: boolean; data: Supplier } {
    return { success: true, data: this.svc.createSupplier(body) }
  }

  @Get('suppliers')
  list(
    @Query('tenantId') tenantId: string,
    @Query('status') status?: SupplierStatus,
    @Query('rating') rating?: SupplierRating,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ): { success: boolean; data: Supplier[]; total: number } {
    const suppliers = this.svc.listSuppliers(tenantId, {
      status,
      rating,
      category,
      search,
    })
    return { success: true, data: suppliers, total: suppliers.length }
  }

  @Get('suppliers/:id')
  get(
    @Query('tenantId') tenantId: string,
    @Param('id') id: string,
  ): { success: boolean; data: Supplier | null } {
    const supplier = this.svc.getSupplier(id, tenantId)
    if (!supplier) {
      return { success: false, data: null }
    }
    return { success: true, data: supplier }
  }

  @Patch('suppliers/:id')
  update(
    @Query('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string
      code: string
      contactPerson: string
      phone: string
      email: string
      address: string
      status: SupplierStatus
      rating: SupplierRating
      category: string
      remark: string
    }>,
  ): { success: boolean; data: Supplier } {
    return { success: true, data: this.svc.updateSupplier(id, tenantId, body) }
  }

  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.OK)
  delete(
    @Query('tenantId') tenantId: string,
    @Param('id') id: string,
  ): { success: boolean; data: { deleted: boolean } } {
    this.svc.deleteSupplier(id, tenantId)
    return { success: true, data: { deleted: true } }
  }
}

// ── Reset module-level store between tests ──

beforeEach(() => {
  const tmp = new SupplierManagerService()
  tmp.resetSupplierStoresForTests()
})

async function buildApp() {
  const service = new SupplierManagerService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestE2eController],
    providers: [
      { provide: SupplierManagerService, useValue: service },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, service }
}

const T1 = 'tenant-001'
const T2 = 'tenant-002'

function createPayload(overrides: Record<string, string> = {}) {
  return {
    tenantId: T1,
    name: '测试供应商',
    code: 'SUP-E2E',
    contactPerson: '张三',
    phone: '13800138000',
    email: 'zhangsan@test.com',
    address: '测试地址',
    category: '电子元器件',
    ...overrides,
  }
}

async function createSupplier(app: any, payload?: any): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/suppliers-e2e-59/suppliers')
    .send(payload ?? createPayload())
  return res.body.data.id
}

// ═══════════════ E2E Tests ═══════════════

it('e2e-59: create supplier returns full supplier with defaults', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/suppliers-e2e-59/suppliers')
      .send(createPayload())

    assert.equal(res.statusCode, 201)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.name, '测试供应商')
    assert.equal(res.body.data.code, 'SUP-E2E')
    assert.equal(res.body.data.status, SupplierStatus.Active)
    assert.equal(res.body.data.rating, SupplierRating.B)
    assert.equal(res.body.data.tenantId, T1)
    assert.ok(res.body.data.id.startsWith('supplier-'))
    assert.ok(typeof res.body.data.createdAt === 'string')
    assert.ok(typeof res.body.data.updatedAt === 'string')
  } finally {
    await app.close()
  }
})

it('e2e-59: create supplier with custom status and rating', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/suppliers-e2e-59/suppliers')
      .send(createPayload({
        status: SupplierStatus.Inactive,
        rating: SupplierRating.A,
        remark: 'VIP测试供应商',
      }))

    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.status, SupplierStatus.Inactive)
    assert.equal(res.body.data.rating, SupplierRating.A)
    assert.equal(res.body.data.remark, 'VIP测试供应商')
  } finally {
    await app.close()
  }
})

it('e2e-59: list suppliers returns all for tenant (seeded)', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/suppliers-e2e-59/suppliers?tenantId=' + T1)

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.total, 24) // seeded 24 mock suppliers
    assert.ok(res.body.data.every((s: Supplier) => s.tenantId === T1))
  } finally {
    await app.close()
  }
})

it('e2e-59: list suppliers after creating one shows correct total', async () => {
  const { app } = await buildApp()
  try {
    const before = await request(app.getHttpServer())
      .get('/suppliers-e2e-59/suppliers?tenantId=' + T1)
    assert.equal(before.body.total, 24)

    await createSupplier(app)

    const after = await request(app.getHttpServer())
      .get('/suppliers-e2e-59/suppliers?tenantId=' + T1)
    assert.equal(after.body.total, 25)
  } finally {
    await app.close()
  }
})

it('e2e-59: list filtered by status returns correct results', async () => {
  const { app } = await buildApp()
  try {
    const activeRes = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers?tenantId=${T1}&status=${SupplierStatus.Active}`)
    assert.ok(activeRes.body.data.every((s: Supplier) => s.status === SupplierStatus.Active))

    const inactiveRes = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers?tenantId=${T1}&status=${SupplierStatus.Inactive}`)
    assert.ok(inactiveRes.body.data.every((s: Supplier) => s.status === SupplierStatus.Inactive))
    assert.ok(inactiveRes.body.total >= 3)
  } finally {
    await app.close()
  }
})

it('e2e-59: list filtered by rating', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers?tenantId=${T1}&rating=${SupplierRating.A}`)
    assert.ok(res.body.data.every((s: Supplier) => s.rating === SupplierRating.A))
    assert.ok(res.body.total > 0)
  } finally {
    await app.close()
  }
})

it('e2e-59: list filtered by category', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers?tenantId=${T1}&category=电子元器件`)
    assert.equal(res.body.total, 3)
  } finally {
    await app.close()
  }
})

it('e2e-59: search by name returns matching suppliers', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers?tenantId=${T1}&search=华强`)
    assert.equal(res.body.total, 1)
    assert.equal(res.body.data[0].name, '深圳华强电子')
  } finally {
    await app.close()
  }
})

it('e2e-59: search by code', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers?tenantId=${T1}&search=SUP-005`)
    assert.equal(res.body.total, 1)
    assert.equal(res.body.data[0].code, 'SUP-005')
  } finally {
    await app.close()
  }
})

it('e2e-59: search by phone', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers?tenantId=${T1}&search=13800138001`)
    assert.equal(res.body.total, 1)
  } finally {
    await app.close()
  }
})

it('e2e-59: get supplier by id returns full profile', async () => {
  const { app } = await buildApp()
  try {
    const id = await createSupplier(app)
    const res = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers/${id}?tenantId=${T1}`)

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.id, id)
    assert.equal(res.body.data.name, '测试供应商')
    assert.equal(res.body.data.tenantId, T1)
  } finally {
    await app.close()
  }
})

it('e2e-59: get non-existent supplier returns null', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers/nonexistent?tenantId=${T1}`)
    assert.equal(res.body.success, false)
    assert.equal(res.body.data, null)
  } finally {
    await app.close()
  }
})

it('e2e-59: update supplier name and rating', async () => {
  const { app } = await buildApp()
  try {
    const id = await createSupplier(app)

    const res = await request(app.getHttpServer())
      .patch(`/suppliers-e2e-59/suppliers/${id}?tenantId=${T1}`)
      .send({ name: '更新名称', rating: SupplierRating.A })

    assert.equal(res.body.success, true)
    assert.equal(res.body.data.name, '更新名称')
    assert.equal(res.body.data.rating, SupplierRating.A)
  } finally {
    await app.close()
  }
})

it('e2e-59: update supplier status transition Active → Suspended', async () => {
  const { app } = await buildApp()
  try {
    const id = await createSupplier(app, createPayload({ status: SupplierStatus.Active }))

    const res = await request(app.getHttpServer())
      .patch(`/suppliers-e2e-59/suppliers/${id}?tenantId=${T1}`)
      .send({ status: SupplierStatus.Suspended })

    assert.equal(res.body.data.status, SupplierStatus.Suspended)
  } finally {
    await app.close()
  }
})

it('e2e-59: delete supplier then not found', async () => {
  const { app } = await buildApp()
  try {
    const id = await createSupplier(app)

    const delRes = await request(app.getHttpServer())
      .delete(`/suppliers-e2e-59/suppliers/${id}?tenantId=${T1}`)
    assert.equal(delRes.statusCode, 200)
    assert.equal(delRes.body.data.deleted, true)

    const getRes = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers/${id}?tenantId=${T1}`)
    assert.equal(getRes.body.success, false)
    assert.equal(getRes.body.data, null)
  } finally {
    await app.close()
  }
})

it('e2e-59: multi-tenant isolation — tenant-001 cannot access tenant-002 supplier', async () => {
  const { app } = await buildApp()
  try {
    // Create supplier under tenant-002
    const createInT2 = await request(app.getHttpServer())
      .post('/suppliers-e2e-59/suppliers')
      .send(createPayload({ tenantId: T2, name: 'T2供应商' }))
    const t2Id = createInT2.body.data.id

    // tenant-001 tries to access it
    const getAsT1 = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers/${t2Id}?tenantId=${T1}`)
    assert.equal(getAsT1.body.success, false)
    assert.equal(getAsT1.body.data, null)
  } finally {
    await app.close()
  }
})

it('e2e-59: multi-tenant isolation — lists are separate', async () => {
  const { app } = await buildApp()
  try {
    // tenant-001 gets seeded data
    const t1List = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers?tenantId=${T1}`)
    assert.equal(t1List.body.total, 24)

    // tenant-002 gets nothing
    const t2List = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers?tenantId=${T2}`)
    assert.equal(t2List.body.total, 0)

    // Create for tenant-002
    await request(app.getHttpServer())
      .post('/suppliers-e2e-59/suppliers')
      .send(createPayload({ tenantId: T2, name: 'T2独资' }))

    const t2ListAfter = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers?tenantId=${T2}`)
    assert.equal(t2ListAfter.body.total, 1)
  } finally {
    await app.close()
  }
})

it('e2e-59: full lifecycle — create, update, list, delete', async () => {
  const { app } = await buildApp()
  try {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/suppliers-e2e-59/suppliers')
      .send(createPayload({ name: '全生命周期供应商' }))
    assert.equal(createRes.statusCode, 201)
    const id = createRes.body.data.id

    // 2. Toggle status: Active → Inactive → Suspended
    let s1 = await request(app.getHttpServer())
      .patch(`/suppliers-e2e-59/suppliers/${id}?tenantId=${T1}`)
      .send({ status: SupplierStatus.Inactive })
    assert.equal(s1.body.data.status, SupplierStatus.Inactive)

    let s2 = await request(app.getHttpServer())
      .patch(`/suppliers-e2e-59/suppliers/${id}?tenantId=${T1}`)
      .send({ status: SupplierStatus.Suspended })
    assert.equal(s2.body.data.status, SupplierStatus.Suspended)

    // 3. Search confirms it's there
    const searchRes = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers?tenantId=${T1}&search=全生命周期`)
    assert.equal(searchRes.body.total, 1)

    // 4. Delete
    await request(app.getHttpServer())
      .delete(`/suppliers-e2e-59/suppliers/${id}?tenantId=${T1}`)

    // 5. Confirm deleted
    const getRes = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers/${id}?tenantId=${T1}`)
    assert.equal(getRes.body.success, false)
  } finally {
    await app.close()
  }
})

it('e2e-59: list returns sorted by name ascending', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get(`/suppliers-e2e-59/suppliers?tenantId=${T1}`)
    const names = res.body.data.map((s: Supplier) => s.name)
    for (let i = 1; i < names.length; i++) {
      assert.ok(names[i - 1].localeCompare(names[i]) <= 0)
    }
  } finally {
    await app.close()
  }
})
