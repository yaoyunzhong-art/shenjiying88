/**
 * coupon.controller.ts · Coupon REST Controller (Phase-17)
 *
 * 跨门店优惠券 API 端点:
 *   POST   /coupons             创建优惠券
 *   GET    /coupons             列表查询
 *   GET    /coupons/:id         详情
 *   PATCH  /coupons/:id/status  更新状态
 *   POST   /coupons/redeem      核销 (跨门店)
 *   POST   /coupons/batch-redeem 批量核销
 *
 * 设计依据: spec.md §1.1.2 · E40 P0 跨门店优惠券
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { CouponService } from './coupon.service'
import {
  CreateCouponDto,
  UpdateCouponStatusDto,
  RedeemCouponDto,
  BatchRedeemDto,
  ListCouponDto,
} from './coupon.dto'
import {
  toCouponContract,
  toCouponListContract,
} from './coupon.contract'
import type {
  CouponListContract,
  CouponContract,
  RedeemResponse,
} from './coupon.contract'

@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  /**
   * POST /coupons
   * 创建新优惠券
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCouponDto): Promise<CouponContract> {
    // TODO: Pulse-68 创建逻辑
    // const entity = this.couponService.create(body);
    // return toCouponContract(entity);
    throw new Error('NOT_IMPLEMENTED · Pulse-68 T2')
  }

  /**
   * GET /coupons
   * 查询优惠券列表
   */
  @Get()
  async list(@Query() query: ListCouponDto): Promise<CouponListContract> {
    // TODO: Pulse-68 查询逻辑
    // const { items, total } = await this.couponService.list(query);
    // return toCouponListContract(items, total, query.page ?? 1, query.pageSize ?? 20);
    return toCouponListContract([], 0, query.page ?? 1, query.pageSize ?? 20)
  }

  /**
   * GET /coupons/:id
   * 优惠券详情
   */
  @Get(':id')
  async get(@Param('id') id: string): Promise<CouponContract | null> {
    // TODO: Pulse-68 详情查询
    // const entity = await this.couponService.findById(id);
    // return entity ? toCouponContract(entity) : null;
    return null
  }

  /**
   * PATCH /coupons/:id/status
   * 更新优惠券状态 (暂停/恢复)
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateCouponStatusDto,
  ): Promise<CouponContract> {
    // TODO: Pulse-68 状态更新逻辑
    // const entity = await this.couponService.updateStatus(id, body.status);
    // return toCouponContract(entity);
    throw new Error('NOT_IMPLEMENTED · Pulse-68 T2')
  }

  /**
   * POST /coupons/redeem
   * 跨门店核销
   */
  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  async redeem(@Body() body: RedeemCouponDto): Promise<RedeemResponse> {
    return this.couponService.redeemCrossStore({
      userId: body.userId,
      couponCode: body.couponCode,
      storeId: body.storeId,
      orderAmount: body.orderAmount,
      orderId: body.orderId,
      idempotencyKey: body.idempotencyKey,
      category: body.category,
    })
  }

  /**
   * POST /coupons/batch-redeem
   * 批量核销
   */
  @Post('batch-redeem')
  @HttpCode(HttpStatus.OK)
  async batchRedeem(@Body() body: BatchRedeemDto) {
    const results = await this.couponService.batchRedeem(
      body.redemptions.map((r) => ({
        userId: r.userId,
        couponCode: r.couponCode,
        storeId: r.storeId,
        orderAmount: r.orderAmount,
        orderId: r.orderId,
        idempotencyKey: r.idempotencyKey,
        category: r.category,
      })),
    )
    return {
      results,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    }
  }
}
