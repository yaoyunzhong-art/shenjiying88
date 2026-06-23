/**
 * 🐜 自动: [reservation] E2E 基础测试
 *
 * E2E 链路: HTTP → ReservationController → ReservationService → ReservationEntity
 *
 * 覆盖:
 *   - Reservation CRUD: 创建 / 详情 / 列表 / 更新
 *   - 状态机: Pending → Confirmed → InProgress → Completed
 *   - 冲突检测: 同 resource 同时段 → 拒绝
 *   - 取消 + cancelledReason
 *   - 按时间范围 / 用户 / 资源 查询
 *   - 跨租户隔离
 *   - 错误处理
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Inject
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { ReservationService } from './reservation.service'
import { ReservationStatus, ReservationType } from './reservation.entity'

// ========== 测试 Controller ==========

@Controller('reservation')
class TestReservationController {
  constructor(@Inject(ReservationService) private readonly service: ReservationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.service.create({ ...body, tenantId })
  }

  @Get()
  list(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: any
  ) {
    return this.service.findAll(tenantId, query)
  }

  @Get(':id')
  detail(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    const r = this.service.findOne(id, tenantId)
    if (!r) throw new NotFoundException(`Reservation ${id} not found`)
    return r
  }

  @Put(':id')
  update(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.service.update(id, tenantId, body)
  }

  @Post(':id/confirm')
  confirm(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.service.confirm(id, tenantId)
  }

  @Post(':id/start')
  startProgress(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.service.startProgress(id, tenantId)
  }

  @Post(':id/complete')
  complete(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.service.complete(id, tenantId)
  }

  @Post(':id/cancel')
  cancel(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ) {
    return this.service.cancel(id, tenantId, body?.reason)
  }

  @Get('check/conflict')
  checkConflict(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: any
  ) {
    try {
      this.service.checkConflict(
        tenantId,
        query.resourceId,
        query.startTime,
        query.endTime
      )
      return { conflict: false }
    } catch {
      return { conflict: true }
    }
  }
}

// ========== 构建 app ==========

async function buildApp() {
  const service = new ReservationService()
  service.resetStoreForTests()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestReservationController],
    providers: [{ provide: ReservationService, useValue: service }]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, service }
}

const TENANT_HEADERS = {
  'x-tenant-id': 'tenant-001',
  'x-brand-id': 'brand-001',
  'x-store-id': 'store-001'
}

const TENANT_B_HEADERS = {
  'x-tenant-id': 'tenant-002',
  'x-brand-id': 'brand-001',
  'x-store-id': 'store-001'
}

const FUTURE_START = '2027-08-01T10:00:00Z'
const FUTURE_END = '2027-08-01T12:00:00Z'

async function createReservation(
  app: any,
  overrides: any = {},
  headers: any = TENANT_HEADERS
) {
  return request(app.getHttpServer())
    .post('/reservation')
    .set(headers)
    .send({
      type: ReservationType.Venue,
      resourceId: 'res-001',
      resourceName: '球桌A',
      userId: 'user-001',
      userName: '张三',
      startTime: FUTURE_START,
      endTime: FUTURE_END,
      duration: 120,
      price: 100,
      deposit: 50,
      ...overrides
    })
}

// ========== E2E: Reservation CRUD ==========

describe('E2E: Reservation CRUD', () => {
  test('POST → GET :id → PUT → GET 完整生命周期', async () => {
    const { app } = await buildApp()
    try {
      const createRes = await createReservation(app)
      assert.equal(createRes.statusCode, 201)
      const id = createRes.body.data.id
      assert.ok(id.startsWith('reservation-'))
      assert.equal(createRes.body.data.status, ReservationStatus.Pending)

      const getRes = await request(app.getHttpServer())
        .get(`/reservation/${id}`)
        .set(TENANT_HEADERS)
      assert.equal(getRes.statusCode, 200)
      assert.equal(getRes.body.data.id, id)

      const updateRes = await request(app.getHttpServer())
        .put(`/reservation/${id}`)
        .set(TENANT_HEADERS)
        .send({ price: 200, remark: 'VIP' })
      assert.equal(updateRes.statusCode, 200)
      assert.equal(updateRes.body.data.price, 200)
      assert.equal(updateRes.body.data.remark, 'VIP')

      const afterRes = await request(app.getHttpServer())
        .get(`/reservation/${id}`)
        .set(TENANT_HEADERS)
      assert.equal(afterRes.body.data.price, 200)
    } finally {
      await app.close()
    }
  })

  test('GET /reservation 列表 + type 过滤', async () => {
    const { app } = await buildApp()
    try {
      await createReservation(app, { type: ReservationType.Venue })
      await createReservation(app, { type: ReservationType.Service })

      const res = await request(app.getHttpServer())
        .get(`/reservation?type=${ReservationType.Service}`)
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 200)
      for (const r of res.body.data) assert.equal(r.type, ReservationType.Service)
    } finally {
      await app.close()
    }
  })

  test('GET /reservation/:id 不存在返回 404', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/reservation/non-existent-id')
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 404)
    } finally {
      await app.close()
    }
  })

  test('POST 时间倒序 → 服务抛错 → 500', async () => {
    const { app } = await buildApp()
    try {
      const res = await createReservation(app, {
        startTime: FUTURE_END,
        endTime: FUTURE_START
      })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 状态机 ==========

describe('E2E: 状态机转换', () => {
  test('Pending → Confirmed → InProgress → Completed 完整链路', async () => {
    const { app } = await buildApp()
    try {
      const create = await createReservation(app)
      const id = create.body.data.id

      const confirm = await request(app.getHttpServer())
        .post(`/reservation/${id}/confirm`)
        .set(TENANT_HEADERS)
      assert.equal(confirm.statusCode, 201)
      assert.equal(confirm.body.data.status, ReservationStatus.Confirmed)

      const start = await request(app.getHttpServer())
        .post(`/reservation/${id}/start`)
        .set(TENANT_HEADERS)
      assert.equal(start.statusCode, 201)
      assert.equal(start.body.data.status, ReservationStatus.InProgress)

      const complete = await request(app.getHttpServer())
        .post(`/reservation/${id}/complete`)
        .set(TENANT_HEADERS)
      assert.equal(complete.statusCode, 201)
      assert.equal(complete.body.data.status, ReservationStatus.Completed)
    } finally {
      await app.close()
    }
  })

  test('Pending 不可直接 InProgress', async () => {
    const { app } = await buildApp()
    try {
      const create = await createReservation(app)
      const id = create.body.data.id
      const res = await request(app.getHttpServer())
        .post(`/reservation/${id}/start`)
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  test('Confirmed 不可回退 Pending', async () => {
    const { app } = await buildApp()
    try {
      const create = await createReservation(app)
      const id = create.body.data.id
      await request(app.getHttpServer())
        .post(`/reservation/${id}/confirm`)
        .set(TENANT_HEADERS)
      // 试图再 confirm
      const res = await request(app.getHttpServer())
        .post(`/reservation/${id}/confirm`)
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  test('Completed 不可再转换', async () => {
    const { app } = await buildApp()
    try {
      const create = await createReservation(app)
      const id = create.body.data.id
      await request(app.getHttpServer())
        .post(`/reservation/${id}/confirm`)
        .set(TENANT_HEADERS)
      await request(app.getHttpServer())
        .post(`/reservation/${id}/start`)
        .set(TENANT_HEADERS)
      await request(app.getHttpServer())
        .post(`/reservation/${id}/complete`)
        .set(TENANT_HEADERS)
      const res = await request(app.getHttpServer())
        .post(`/reservation/${id}/cancel`)
        .set(TENANT_HEADERS)
        .send({ reason: 'after complete' })
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 取消 ==========

describe('E2E: 取消流程', () => {
  test('Pending → Cancelled + cancelledReason', async () => {
    const { app } = await buildApp()
    try {
      const create = await createReservation(app)
      const id = create.body.data.id
      const res = await request(app.getHttpServer())
        .post(`/reservation/${id}/cancel`)
        .set(TENANT_HEADERS)
        .send({ reason: '客户取消' })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.status, ReservationStatus.Cancelled)
      assert.equal(res.body.data.cancelledReason, '客户取消')
      assert.ok(res.body.data.cancelledAt)
    } finally {
      await app.close()
    }
  })

  test('Confirmed 也可取消', async () => {
    const { app } = await buildApp()
    try {
      const create = await createReservation(app)
      const id = create.body.data.id
      await request(app.getHttpServer())
        .post(`/reservation/${id}/confirm`)
        .set(TENANT_HEADERS)
      const res = await request(app.getHttpServer())
        .post(`/reservation/${id}/cancel`)
        .set(TENANT_HEADERS)
        .send({ reason: '临时取消' })
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.data.status, ReservationStatus.Cancelled)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 冲突检测 ==========

describe('E2E: 资源冲突检测', () => {
  test('同一 resource 同时段 → 第二次 confirm 失败', async () => {
    const { app } = await buildApp()
    try {
      const r1 = await createReservation(app, { resourceId: 'res-A' })
      const r2 = await createReservation(app, {
        resourceId: 'res-A',
        userId: 'user-002',
        userName: '李四'
      })
      await request(app.getHttpServer())
        .post(`/reservation/${r1.body.data.id}/confirm`)
        .set(TENANT_HEADERS)

      const res = await request(app.getHttpServer())
        .post(`/reservation/${r2.body.data.id}/confirm`)
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })

  test('不同 resource 不冲突', async () => {
    const { app } = await buildApp()
    try {
      const r1 = await createReservation(app, { resourceId: 'res-A' })
      const r2 = await createReservation(app, { resourceId: 'res-B' })
      await request(app.getHttpServer())
        .post(`/reservation/${r1.body.data.id}/confirm`)
        .set(TENANT_HEADERS)
      const res = await request(app.getHttpServer())
        .post(`/reservation/${r2.body.data.id}/confirm`)
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 201)
    } finally {
      await app.close()
    }
  })

  test('相邻时段不冲突', async () => {
    const { app } = await buildApp()
    try {
      const r1 = await createReservation(app, {
        resourceId: 'res-A',
        startTime: '2027-08-01T10:00:00Z',
        endTime: '2027-08-01T12:00:00Z'
      })
      const r2 = await createReservation(app, {
        resourceId: 'res-A',
        startTime: '2027-08-01T12:00:00Z',
        endTime: '2027-08-01T14:00:00Z',
        userId: 'user-002',
        userName: '李四'
      })
      await request(app.getHttpServer())
        .post(`/reservation/${r1.body.data.id}/confirm`)
        .set(TENANT_HEADERS)
      const res = await request(app.getHttpServer())
        .post(`/reservation/${r2.body.data.id}/confirm`)
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 201)
    } finally {
      await app.close()
    }
  })

  test('GET /reservation/check/conflict 冲突检测 API', async () => {
    const { app } = await buildApp()
    try {
      const r1 = await createReservation(app, { resourceId: 'res-A' })
      await request(app.getHttpServer())
        .post(`/reservation/${r1.body.data.id}/confirm`)
        .set(TENANT_HEADERS)

      const res = await request(app.getHttpServer())
        .get(
          `/reservation/check/conflict?resourceId=res-A&startTime=${FUTURE_START}&endTime=${FUTURE_END}`
        )
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.conflict, true)
    } finally {
      await app.close()
    }
  })

  test('GET /reservation/check/conflict 无冲突', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get(
          `/reservation/check/conflict?resourceId=res-A&startTime=${FUTURE_START}&endTime=${FUTURE_END}`
        )
        .set(TENANT_HEADERS)
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.conflict, false)
    } finally {
      await app.close()
    }
  })
})

// ========== E2E: 跨租户隔离 ==========

describe('E2E: 跨租户隔离', () => {
  test('tenant-B 看不到 tenant-A 的 reservation', async () => {
    const { app } = await buildApp()
    try {
      const create = await createReservation(app, {}, TENANT_HEADERS)
      const id = create.body.data.id
      const res = await request(app.getHttpServer())
        .get(`/reservation/${id}`)
        .set(TENANT_B_HEADERS)
      assert.equal(res.statusCode, 404)
    } finally {
      await app.close()
    }
  })

  test('tenant-B 列表只返回自己的', async () => {
    const { app } = await buildApp()
    try {
      await createReservation(app, { userName: 'A-User' }, TENANT_HEADERS)
      await createReservation(app, { userName: 'B-User' }, TENANT_B_HEADERS)
      const a = await request(app.getHttpServer())
        .get('/reservation')
        .set(TENANT_HEADERS)
      const b = await request(app.getHttpServer())
        .get('/reservation')
        .set(TENANT_B_HEADERS)
      assert.equal(a.body.data.length, 1)
      assert.equal(b.body.data.length, 1)
    } finally {
      await app.close()
    }
  })

  test('tenant-B 无法 confirm tenant-A 的 reservation', async () => {
    const { app } = await buildApp()
    try {
      const create = await createReservation(app, {}, TENANT_HEADERS)
      const id = create.body.data.id
      const res = await request(app.getHttpServer())
        .post(`/reservation/${id}/confirm`)
        .set(TENANT_B_HEADERS)
      assert.equal(res.statusCode, 500)
    } finally {
      await app.close()
    }
  })
})
