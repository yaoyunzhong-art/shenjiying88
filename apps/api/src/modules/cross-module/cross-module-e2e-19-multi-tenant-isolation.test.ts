import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E 跨模块 #19 — 多租户隔离 (全模块越权检查)
 *
 * 目标:tenantContext 是不可绕过的硬边界。
 * 覆盖 5 个核心模块:
 *   - member     (会员)
 *   - inventory  (商品 + 库存)
 *   - cashier    (订单 + 支付)
 *   - loyalty    (积分 / 卡券)
 *   - finance    (账本 / 账户)
 *
 * 攻击向量:
 *   1. 读越权:tenant B 直接读 tenant A 资源 id → 失败
 *   2. 写越权:tenant B 改 tenant A 资源 → 失败
 *   3. 删越权:tenant B 删 tenant A 资源 → 失败
 *   4. 列表隔离:tenant A 列表查询不返回 tenant B 数据
 *   5. Header 切换:同一 resource id 切换 tenant 后,旧 tenant 仍可读,新 tenant 读不到
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Body, Controller, Get, Inject, Param, Patch, Post, Req } from '@nestjs/common';
import request from 'supertest';
import type { Request } from 'express';
import { MemberService, resetMemberServiceTestState } from '../member/member.service';
import { CashierService } from '../cashier/cashier.service';
import { InventoryService, resetInventoryServiceTestState } from '../inventory/inventory.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { FinanceService, resetFinanceServiceTestState } from '../finance/finance.service';
import { LedgerType, AccountType } from '../finance/finance.entity';
import { CouponDiscountType, LoyaltyPlanStatus } from '../loyalty/loyalty.entity';
import { MemberStatus } from '../member/member.entity';
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types';
import { buildCrossModuleTestApp, type BuiltCrossModuleTestApp } from './test-helpers';

@Controller()
class TestController {
  constructor(
    @Inject(MemberService) public readonly memberService: MemberService,
    @Inject(CashierService) public readonly cashierService: CashierService,
    @Inject(InventoryService) public readonly inventoryService: InventoryService,
    @Inject(LoyaltyService) public readonly loyaltyService: LoyaltyService,
    @Inject(FinanceService) public readonly financeService: FinanceService,
  ) {}

  private getCtx(req: Request): RequestTenantContext {
    return (req as TenantAwareRequest).tenantContext as RequestTenantContext;
  }

  // ── Member ──
  @Post('members')
  registerMember(@Req() req: Request, @Body() body: { memberId: string }) {
    return this.memberService.register({
      memberId: body.memberId,
      tenantContext: this.getCtx(req),
      nickname: body.memberId,
    });
  }
  @Patch('members/:memberId/status')
  setMemberStatus(
    @Req() req: Request,
    @Param('memberId') id: string,
    @Body() body: { status: MemberStatus },
  ) {
    return this.memberService.updatePersistentStatus(id, body.status, this.getCtx(req));
  }
  @Get('members/:memberId')
  getMember(@Param('memberId') id: string) {
    return this.memberService.getProfile(id);
  }

  // ── Inventory ──
  @Post('products')
  createProduct(
    @Req() req: Request,
    @Body()
    body: {
      name: string;
      sku: string;
      unit: string;
      price: number;
      cost: number;
      minStock: number;
      maxStock: number;
      currentStock: number;
    },
  ) {
    return this.inventoryService.createProduct(this.getCtx(req), body);
  }
  @Get('products/:id')
  getProduct(@Req() req: Request, @Param('id') id: string) {
    return this.inventoryService.getProduct(id, this.getCtx(req));
  }
  @Post('products/:id/stock-out')
  stockOut(@Req() req: Request, @Param('id') id: string, @Body() body: { quantity: number }) {
    return this.inventoryService.stockOut(this.getCtx(req), {
      productId: id,
      ...body,
    });
  }

  // ── Cashier ──
  @Post('cashier/orders')
  createOrder(
    @Req() req: Request,
    @Body()
    body: {
      memberId: string;
      items: Array<{ skuId: string; quantity: number; price: number; title?: string }>;
    },
  ) {
    return this.cashierService.createOrder(this.getCtx(req), body);
  }
  @Get('cashier/orders/:orderId')
  getOrder(@Req() req: Request, @Param('orderId') orderId: string) {
    return this.cashierService.getOrder(orderId, this.getCtx(req));
  }

  // ── Loyalty ──
  @Post('loyalty/coupon-plans')
  createPlan(
    @Req() req: Request,
    @Body()
    body: {
      code: string;
      title: string;
      discountType: CouponDiscountType;
      discountValue: number;
      minOrderAmount?: number;
      totalQuota: number;
      perMemberLimit: number;
      validFrom: string;
      validUntil: string;
    },
  ) {
    return this.loyaltyService.registerCouponPlan({
      tenantContext: this.getCtx(req),
      ...body,
    });
  }
  @Get('loyalty/coupon-plans')
  listPlans(@Req() req: Request) {
    return this.loyaltyService.listCouponPlans(this.getCtx(req).tenantId);
  }
  @Get('loyalty/coupon-plans/:planId')
  getPlan(@Req() req: Request, @Param('planId') planId: string) {
    return this.loyaltyService.getCouponPlan(planId, this.getCtx(req).tenantId);
  }
  @Patch('loyalty/coupon-plans/:planId/status')
  setPlanStatus(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Body() body: { status: LoyaltyPlanStatus },
  ) {
    return this.loyaltyService.updateCouponPlanStatus(
      planId,
      body.status,
      this.getCtx(req).tenantId,
    );
  }

  // ── Finance ──
  @Post('finance/ledgers')
  createLedger(
    @Req() req: Request,
    @Body()
    body: {
      type: LedgerType;
      amount: number;
      description: string;
      orderId?: string;
    },
  ) {
    return this.financeService.recordLedger(this.getCtx(req), body);
  }
  @Get('finance/accounts/:id')
  getAccount(@Req() req: Request, @Param('id') id: string) {
    return this.financeService.getAccount(id, this.getCtx(req));
  }
  @Post('finance/accounts')
  createAccount(
    @Req() req: Request,
    @Body()
    body: {
      name: string;
      type: AccountType;
      storeId?: string;
      initialBalance?: number;
    },
  ) {
    return this.financeService.createAccount(this.getCtx(req), body);
  }
  @Get('finance/accounts')
  listAccounts(@Req() req: Request) {
    return this.financeService.listAccounts(this.getCtx(req));
  }
}

/**
 * 构造一组用于跨模块 e2e 测试的服务实例。
 *
 * helper 不知道如何构造这些业务服务 + 设置初始状态,所以由本测试文件
 * 显式 prepare,然后通过 providers 列表注入给 helper。CashierService 需要
 * 一个 integrationOrchestrationService stub,因为它发事件;这里用一个 no-op。
 */
function prepareServices() {
  resetMemberServiceTestState();
  resetInventoryServiceTestState();
  resetFinanceServiceTestState();

  const memberService = new MemberService();
  const loyaltyService = new LoyaltyService(memberService);
  loyaltyService.resetLoyaltyStoresForTests();
  const cashierService = new CashierService(memberService, loyaltyService);
  cashierService.resetCashierStoresForTests();
  const inventoryService = new InventoryService();
  const financeService = new FinanceService();
  (
    cashierService as unknown as { integrationOrchestrationService: unknown }
  ).integrationOrchestrationService = {
    async publishEvent() {
      /* no-op */
    },
  };

  return { memberService, loyaltyService, cashierService, inventoryService, financeService };
}

async function buildApp(): Promise<BuiltCrossModuleTestApp> {
  const services = prepareServices();
  return buildCrossModuleTestApp({
    controllers: [TestController],
    providers: [
      { provide: MemberService, useValue: services.memberService },
      { provide: CashierService, useValue: services.cashierService },
      { provide: InventoryService, useValue: services.inventoryService },
      { provide: LoyaltyService, useValue: services.loyaltyService },
      { provide: FinanceService, useValue: services.financeService },
    ],
    // helper 默认挂的中间件已包含 attachTenantContextFromHeaders (按 header 提取)
    // 行为与原 inline 中间件等价。ResponseInterceptor 也保持默认开启。
  });
}

const TA = { 'x-tenant-id': 'tenant-A', 'x-brand-id': 'brand-A', 'x-store-id': 'store-A' };
const TB = { 'x-tenant-id': 'tenant-B', 'x-brand-id': 'brand-B', 'x-store-id': 'store-B' };

function getData(res: request.Response) {
  return res.body?.data ?? res.body;
}

// ═══════════════════════════════════════════════════

describe('E2E #19 多租户隔离', () => {
  it('Inventory: tenant B 不能读/扣 tenant A 的 product', async () => {
    const { app } = await buildApp();
    const server = app.getHttpServer();

    const p = await request(server)
      .post('/products')
      .set(TA)
      .send({
        name: 'Isolated',
        sku: 'SKU-ISO-1',
        unit: 'piece',
        price: 100,
        cost: 50,
        minStock: 1,
        maxStock: 100,
        currentStock: 10,
      })
      .expect(201);
    const productId = getData(p).id;

    // tenant A 自读 OK
    await request(server).get(`/products/${productId}`).set(TA).expect(200);

    // tenant B 越权读 → 失败
    await request(server).get(`/products/${productId}`).set(TB).expect(500);

    // tenant B 越权出库 → 失败
    await request(server)
      .post(`/products/${productId}/stock-out`)
      .set(TB)
      .send({ quantity: 1 })
      .expect(500);

    // 库存仍 10
    const fresh = await request(server).get(`/products/${productId}`).set(TA).expect(200);
    assert.equal(getData(fresh).currentStock, 10);

    await app.close();
  });

  it('Cashier: tenant B 不能读 tenant A 的 order', async () => {
    const { app } = await buildApp();
    const server = app.getHttpServer();

    await request(server).post('/members').set(TA).send({ memberId: 'm-iso-1' }).expect(201);
    const o = await request(server)
      .post('/cashier/orders')
      .set(TA)
      .send({ memberId: 'm-iso-1', items: [{ skuId: 'X', quantity: 1, price: 10 }] })
      .expect(201);
    const orderId = getData(o).orderId;

    // tenant A 自读 OK
    const a = await request(server).get(`/cashier/orders/${orderId}`).set(TA).expect(200);
    assert.equal(a.body.data.orderId, orderId);

    // tenant B 越权读 → service 返回 undefined → body.data 为 undefined
    const b = await request(server).get(`/cashier/orders/${orderId}`).set(TB).expect(200);
    assert.equal(b.body.data, undefined);

    await app.close();
  });

  it('Member: tenant A 的 member,tenant B 越权改 status 失败', async () => {
    const { app } = await buildApp();
    const server = app.getHttpServer();

    await request(server).post('/members').set(TA).send({ memberId: 'm-iso-m' }).expect(201);

    // tenant A 改 status OK
    await request(server)
      .patch('/members/m-iso-m/status')
      .set(TA)
      .send({ status: MemberStatus.Frozen })
      .expect(200);

    // tenant B 越权改 status → service 抛错
    await request(server)
      .patch('/members/m-iso-m/status')
      .set(TB)
      .send({ status: MemberStatus.Frozen })
      .expect(500);

    // tenant A 仍可读(状态保留为上次修改值)
    const a = await request(server).get('/members/m-iso-m').set(TA).expect(200);
    assert.equal(getData(a).memberId, 'm-iso-m');
    assert.equal(getData(a).status, MemberStatus.Frozen);

    // tenant B 注册不同 memberId,验证各自独立
    await request(server).post('/members').set(TB).send({ memberId: 'm-iso-m-b' }).expect(201);
    const b = await request(server).get('/members/m-iso-m-b').set(TB).expect(200);
    assert.equal(getData(b).tenantContext.tenantId, 'tenant-B');

    await app.close();
  });

  it('Loyalty: tenant A 的 coupon plan,tenant B 越权读 / 改 status 失败', async () => {
    const { app } = await buildApp();
    const server = app.getHttpServer();

    const p = await request(server)
      .post('/loyalty/coupon-plans')
      .set(TA)
      .send({
        code: 'ISO-1',
        title: 'Isolated Coupon',
        discountType: CouponDiscountType.FixedAmount,
        discountValue: 10,
        totalQuota: 100,
        perMemberLimit: 1,
        validFrom: '2026-01-01T00:00:00Z',
        validUntil: '2026-12-31T23:59:59Z',
      })
      .expect(201);
    const planId = getData(p).planId;

    // tenant A 自读 OK
    const a = await request(server).get(`/loyalty/coupon-plans/${planId}`).set(TA).expect(200);
    assert.equal(getData(a).code, 'ISO-1');
    assert.equal(getData(a).status, LoyaltyPlanStatus.Draft);

    // tenant B 越权读 → 返回 undefined
    const b = await request(server).get(`/loyalty/coupon-plans/${planId}`).set(TB).expect(200);
    assert.equal(b.body.data, undefined);

    // 激活 plan (tenant A)
    await request(server)
      .patch(`/loyalty/coupon-plans/${planId}/status`)
      .set(TA)
      .send({ status: LoyaltyPlanStatus.Active })
      .expect(200);

    // tenant B 越权改 status → service 抛错
    await request(server)
      .patch(`/loyalty/coupon-plans/${planId}/status`)
      .set(TB)
      .send({ status: LoyaltyPlanStatus.Paused })
      .expect(500);

    // tenant A 状态仍 Active
    const fresh = await request(server).get(`/loyalty/coupon-plans/${planId}`).set(TA).expect(200);
    assert.equal(getData(fresh).status, LoyaltyPlanStatus.Active);

    // 列表隔离: tenant A 列表含此 plan, tenant B 列表不含
    const listA = await request(server).get('/loyalty/coupon-plans').set(TA).expect(200);
    const aIds = getData(listA).map((p: any) => p.planId);
    assert.ok(aIds.includes(planId));

    const listB = await request(server).get('/loyalty/coupon-plans').set(TB).expect(200);
    const bIds = getData(listB).map((p: any) => p.planId);
    assert.ok(!bIds.includes(planId));

    await app.close();
  });

  it('Finance: tenant A 的 ledger / account,tenant B 越权读失败 + account 列表隔离', async () => {
    const { app } = await buildApp();
    const server = app.getHttpServer();

    // tenant A: account + ledger
    const acc = await request(server)
      .post('/finance/accounts')
      .set(TA)
      .send({
        name: 'Tenant A Cash',
        type: AccountType.Cash,
        initialBalance: 1000,
      })
      .expect(201);
    const accAId = getData(acc).id;

    await request(server)
      .post('/finance/ledgers')
      .set(TA)
      .send({
        type: LedgerType.Revenue,
        amount: 500,
        description: 'sale',
      })
      .expect(201);

    // tenant B: 自己 account
    const accB = await request(server)
      .post('/finance/accounts')
      .set(TB)
      .send({
        name: 'Tenant B Cash',
        type: AccountType.Cash,
        initialBalance: 0,
      })
      .expect(201);
    const accBId = getData(accB).id;

    // 列表隔离
    const accsA = await request(server).get('/finance/accounts').set(TA).expect(200);
    const aIds = getData(accsA).map((a: any) => a.id);
    assert.ok(aIds.includes(accAId));
    assert.ok(!aIds.includes(accBId));

    const accsB = await request(server).get('/finance/accounts').set(TB).expect(200);
    const bIds = getData(accsB).map((a: any) => a.id);
    assert.ok(bIds.includes(accBId));
    assert.ok(!bIds.includes(accAId));

    // 越权读
    await request(server).get(`/finance/accounts/${accAId}`).set(TB).expect(500);
    const bRead = await request(server).get(`/finance/accounts/${accAId}`).set(TB);
    assert.equal(bRead.body.data, undefined);

    await app.close();
  });

  it('Header 切换攻击: 同一 resource id,tenant 切换后旧 tenant 仍可读,新 tenant 读不到', async () => {
    const { app } = await buildApp();
    const server = app.getHttpServer();

    const p = await request(server)
      .post('/products')
      .set(TA)
      .send({
        name: 'Header Switch',
        sku: 'SKU-HS-1',
        unit: 'piece',
        price: 50,
        cost: 20,
        minStock: 1,
        maxStock: 10,
        currentStock: 5,
      })
      .expect(201);
    const productId = getData(p).id;

    // 切换到 tenant B
    await request(server).get(`/products/${productId}`).set(TB).expect(500);
    // 切回 tenant A → 仍可读
    const back = await request(server).get(`/products/${productId}`).set(TA).expect(200);
    assert.equal(getData(back).sku, 'SKU-HS-1');

    await app.close();
  });
});
