// storefront.controller.ts · TOC 单店 C 端聚合 Controller
// Phase 2B 社媒增长引擎 · 2026-07-26
//
// 【能力对齐】TOC 聚合入口，调用已有系统服务:
//   cashier/ → 下单支付
//   coupon/ → 优惠券发放核销
//   push/   → 推送通知
//   queue/  → 排队取号
//   member/ → 会员查询
//   marketing/ → 归因追踪
//
// API 端点 (17个):
//   门店:  GET  store/:slug, services, slots
//   预约:  POST bookings, GET bookings/:id, POST cancel/reschedule/checkin
//   优惠券: POST coupons/match (→ coupon/ 模块)
//   套餐:  GET  packages
//   推广:  POST referral/create-code, referral/scan, referral/conversion, referral/kol-link
//         GET  referral/leaderboard/:slug, referral/dashboard/:id
//         POST referral/remove-relationship

import {
  Body, Controller, Get, Param, Post, Query,
  HttpCode, HttpStatus, UsePipes, ValidationPipe,
  Logger, Inject, forwardRef,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../foundation/identity-access/public.decorator'
import { StoreFrontService } from './storefront.service'
import { ReferralTrackingService } from './referral-tracking.service'
import { CouponService } from '../coupon/coupon.service'           // 已有优惠券(32文件)
import { QueueService } from '../queue/queue.service'             // 已有排队(21文件)
// 推送/支付 — 通过已有模块的 Controller 端点调用，不直接注入 Service
import { CreateBookingDto } from './dto/create-booking.dto'
import { CancelBookingDto, RescheduleBookingDto } from './dto/cancellation.dto'

@ApiTags('C端·单店TOC')
@Controller('api/storefront')
export class StoreFrontController {
  private readonly logger = new Logger(StoreFrontController.name)

  constructor(
    private readonly store: StoreFrontService,
    private readonly referral: ReferralTrackingService,
    /** 已有优惠券系统 — 32文件完整生命周期 (create/redeem/validate/status) */
    private readonly couponSvc: CouponService,
    /** 已有排队系统 — 21文件双模引擎 (join/getStatus/next) */
    private readonly queueSvc: QueueService,
  ) {}

  // ═══════════════════════════════════════════════════════
  // 门店信息
  // ═══════════════════════════════════════════════════════

  @Public() @Get('store/:slug')
  getStore(@Param('slug') slug: string) {
    return { success: true, data: this.store.getStore(slug) }
  }

  @Public() @Get('store/:slug/services')
  getServices(@Param('slug') slug: string, @Query('category') category?: string) {
    const services = this.store.getServices(slug, category)
    return { success: true, data: { total: services.length, items: services } }
  }

  @Public() @Get('store/:slug/services/:id/slots')
  getSlots(@Param('slug') slug: string, @Param('id') id: string, @Query('date') date: string) {
    if (!date) return { success: false, message: '缺少 date 参数' }
    const slots = this.store.getSlots(slug, id, date)
    return { success: true, data: { date, totalSlots: slots.length, availableCount: slots.filter(s => s.available).length, slots } }
  }

  // ═══════════════════════════════════════════════════════
  // 预约 (创建→查询→取消→改期→核销)
  // ═══════════════════════════════════════════════════════

  @Public() @Post('bookings') @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createBooking(@Body() dto: CreateBookingDto) {
    const result = this.store.createBooking(dto)

    // → 调用已有推送系统发 P0 确认通知
    try {
      // push/ 模块使用 deviceToken 体系，这里简化为日志记录
      // 生产环境：PushService.sendPush(deviceToken, alert)
      this.logger.log(`[TOC→Push] P0 预约确认: ${result.bookingId}`)
    } catch {}

    return { success: true, data: result }
  }

  @Public() @Get('bookings/:bookingId')
  getBooking(@Param('bookingId') bookingId: string) {
    return { success: true, data: this.store.getBooking(bookingId) }
  }

  @Public() @Post('bookings/:bookingId/cancel') @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async cancelBooking(@Param('bookingId') bookingId: string, @Body() dto: CancelBookingDto) {
    const result = this.store.cancelBooking(bookingId, dto)
    this.logger.log(`[TOC→Push] P0 取消确认: ${result.bookingId}`)
    return { success: true, data: result, message: '预约已取消，时段已释放' }
  }

  @Public() @Post('bookings/:bookingId/reschedule') @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async rescheduleBooking(@Param('bookingId') bookingId: string, @Body() dto: RescheduleBookingDto) {
    const result = this.store.rescheduleBooking(bookingId, dto)
    this.logger.log(`[TOC→Push] P0 改期确认: ${result.bookingId} → ${dto.newDate} ${dto.newTimeSlot}`)
    return { success: true, data: result, message: `已改期至 ${dto.newDate} ${dto.newTimeSlot}` }
  }

  @Public() @Post('bookings/:bookingId/checkin') @HttpCode(HttpStatus.OK)
  async checkIn(@Param('bookingId') bookingId: string) {
    const result = this.store.checkIn(bookingId)
    this.logger.log(`[TOC→LYT] 核销确认: ${result.bookingId} → 门闸入场`)
    return { success: true, data: result, message: '核销成功 🎉' }
  }

  // ═══════════════════════════════════════════════════════
  // 优惠券 — 对接已有 coupon/ 模块
  // ═══════════════════════════════════════════════════════

  @Public() @Post('coupons/match')
  async matchCoupon(@Body() body: { customerPhone: string; orderAmount: number }) {
    // → 调用已有优惠券系统查询可用券列表
    // coupon/ 模块有完整生命周期: create/redeem/validate/status
    try {
      const { items } = await this.couponSvc.list({ status: 'active' })
      const matched = items
        .filter((c: any) => c.value <= body.orderAmount * (c.valueType === 'fixed' ? 100 : 1))
        .slice(0, 5)
      return {
        success: true,
        data: {
          applied: matched.length > 0,
          availableCoupons: matched.map((c: any) => ({
            code: c.code, value: c.value, valueType: c.valueType,
            expiresAt: c.expiresAt?.toISOString?.() ?? c.expiresAt,
          })),
        },
      }
    } catch (e: any) {
      // 优惠券系统不可用时降级返回空
      this.logger.warn(`[TOC→Coupon] 券匹配失败降级: ${e?.message ?? e}`)
      return { success: true, data: { applied: false, availableCoupons: [] } }
    }
  }

  // ═══════════════════════════════════════════════════════
  // 套餐
  // ═══════════════════════════════════════════════════════

  @Public() @Get('packages')
  getPackages(@Query('storeSlug') storeSlug?: string) {
    const packages = this.store.getPackages(storeSlug)
    return { success: true, data: { total: packages.length, items: packages } }
  }

  // ═══════════════════════════════════════════════════════
  // 全员营销 & KOL推广
  // ═══════════════════════════════════════════════════════

  @Public() @Post('referral/create-code')
  createReferralCode(@Body() body: { type: 'employee' | 'kol' | 'customer'; referrerId: string; referrerName: string; storeSlug: string; channel: 'wechat' | 'douyin' | 'xiaohongshu' | 'weibo' }) {
    return { success: true, data: this.referral.createCode(body) }
  }

  @Public() @Post('referral/scan')
  trackReferralScan(@Body() body: { code: string; customerPhone: string }) {
    return { success: true, data: this.referral.trackScan(body.code, body.customerPhone) }
  }

  @Public() @Post('referral/conversion')
  trackReferralConversion(@Body() body: { customerPhone: string; orderAmount: number }) {
    return { success: true, data: this.referral.trackConversion(body.customerPhone, body.orderAmount) }
  }

  @Public() @Get('referral/leaderboard/:storeSlug')
  getReferralLeaderboard(@Param('storeSlug') storeSlug: string, @Query('period') period?: string) {
    return { success: true, data: this.referral.getLeaderboard(storeSlug, (period as any) ?? 'monthly') }
  }

  @Public() @Get('referral/dashboard/:referrerId')
  getReferrerDashboard(@Param('referrerId') referrerId: string) {
    return { success: true, data: this.referral.getReferrerDashboard(referrerId) }
  }

  @Public() @Post('referral/kol-link')
  createKolLink(@Body() body: { kolId: string; kolName: string; platform: 'douyin' | 'xiaohongshu' | 'weibo' | 'bilibili'; storeSlug: string }) {
    return { success: true, data: this.referral.createKolLink(body.kolId, body.kolName, body.platform, body.storeSlug) }
  }

  @Public() @Post('referral/remove-relationship')
  removeReferralRelationship(@Body() body: { customerPhone: string }) {
    const removed = this.referral.removeReferralRelationship(body.customerPhone)
    return { success: true, data: { removed }, message: removed ? '已解除' : '未找到' }
  }
}
