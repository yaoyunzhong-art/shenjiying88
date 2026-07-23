import { describe, it } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ValidationPipe } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor'
import { IdentityAccessGuard } from './identity-access.guard'
import { IdentityAccessService } from './identity-access.service'
import { CashierController } from '../../cashier/cashier.controller'
import { CashierService } from '../../cashier/cashier.service'
import { OrderService } from '../../cashier/order.service'
import { PaymentService } from '../../cashier/payment.service'
import { RefundService } from '../../cashier/refund.service'
import { InventoryItemService } from '../../inventory/inventory-item.service'
import { MemberController } from '../../member/member.controller'
import { MemberService, resetMemberServiceTestState } from '../../member/member.service'
import type { TenantAwareRequest } from '../../tenant/tenant.types'

function attachActorContext(req: unknown, _res: unknown, next: () => void) {
  const request = req as TenantAwareRequest & {
    headers: Record<string, string | string[] | undefined>
  }
  const roleHeader = request.headers['x-roles']
  const permissionHeader = request.headers['x-permissions']

  request.actorContext = {
    actorId: String(request.headers['x-actor-id'] ?? ''),
    actorType: 'platform-user',
    roles: typeof roleHeader === 'string' ? roleHeader.split(',').map((item) => item.trim()).filter(Boolean) : [],
    permissions:
      typeof permissionHeader === 'string'
        ? permissionHeader.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
    authenticated: Boolean(request.headers['x-actor-id']),
    source: 'headers',
    tenantId: typeof request.headers['x-tenant-id'] === 'string' ? request.headers['x-tenant-id'] : undefined,
  }
  next()
}

function createCashierService(memberService: MemberService) {
  const cashierService = {
    memberService,
  } as unknown as CashierService
  return cashierService
}

function createInventoryService() {
  const inventoryItemService = new InventoryItemService()
  inventoryItemService.create({
    tenantId: 'tenant-A',
    sku: 'SKU-001',
    name: 'Arcade Ticket',
    totalQty: 10,
    unitPriceCents: 990,
  })
  return inventoryItemService
}

async function buildApp() {
  resetMemberServiceTestState()
  const memberService = new MemberService()
  memberService.register({
    memberId: 'member-001',
    nickname: '测试会员',
    tenantContext: {
      tenantId: 'tenant-A',
      brandId: 'brand-A',
      storeId: 'store-A',
      marketCode: 'cn-mainland',
    },
  })

  const inventoryItemService = createInventoryService()

  const moduleRef = await Test.createTestingModule({
    controllers: [CashierController, MemberController],
    providers: [
      Reflector,
      IdentityAccessService,
      { provide: CashierService, useValue: createCashierService(memberService) },
      { provide: MemberService, useValue: memberService },
      { provide: InventoryItemService, useValue: inventoryItemService },
      { provide: OrderService, useValue: {} },
      { provide: PaymentService, useValue: {} },
      { provide: RefundService, useValue: {} },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachActorContext)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalGuards(new IdentityAccessGuard(app.get(Reflector), app.get(IdentityAccessService)))
  await app.init()

  return app
}

describe('Public endpoints remain tenant-scoped', () => {
  it('e2e: GET /cashier/members/lookup without tenant header is still rejected', async () => {
    const app = await buildApp()
    try {
      const res = await request(app.getHttpServer()).get('/cashier/members/lookup').query({ q: 'member-001' })

      assert.equal(res.statusCode, 401)
      assert.equal(res.body.message, 'Missing x-tenant-id header')
      assert.equal(res.body.error, 'Unauthorized')
    } finally {
      await app.close()
    }
  })

  it('e2e: GET /cashier/products/SKU-001 without tenant header is still rejected', async () => {
    const app = await buildApp()
    try {
      const res = await request(app.getHttpServer()).get('/cashier/products/SKU-001')

      assert.equal(res.statusCode, 401)
      assert.equal(res.body.message, 'Missing x-tenant-id header')
      assert.equal(res.body.error, 'Unauthorized')
    } finally {
      await app.close()
    }
  })

  it('e2e: POST /members/register without tenant header is still rejected', async () => {
    const app = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/members/register')
        .send({ memberId: 'member-002', nickname: '新会员' })

      assert.equal(res.statusCode, 401)
      assert.equal(res.body.message, 'Missing x-tenant-id header')
      assert.equal(res.body.error, 'Unauthorized')
    } finally {
      await app.close()
    }
  })
})
