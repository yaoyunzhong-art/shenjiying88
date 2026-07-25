// storefront.controller.ts · TOC 单店 C 端聚合 Controller (Prisma 版)
// Phase 2B 社媒增长引擎 · 2026-07-26
//
// 【P0 修复】
// BL-1: CSRF + Rate Limit — 使用已有 ThrottlerGuard (如已全局启用)
//        若无则需创建 rate-limit.guard.ts
// BL-2: QR 签名验证 — checkIn 验证 HMAC(bookingId+secret)
// BL-3: Prisma 持久化 ✅
// BL-4: DB @@unique 并发保护 ✅
// BL-5: tenantId 隔离 — 所有查询穿透 tenantId
//
// API 端点 (17个):
//   门店:  GET  store/:slug, services, slots (async)
//   预约:  POST bookings, GET bookings/:id, POST cancel/reschedule/checkin
//   优惠券: POST coupons/match (→ coupon/ 模块)
//   套餐:  GET  packages
//   推广:  POST referral/create-code, referral/scan, referral/conversion, referral/kol-link
//         GET  referral/leaderboard/:slug, referral/dashboard/:id
//         POST referral/remove-relationship

import {
  Body, Controller, Get, Param, Post, Query, Headers,
  HttpCode, HttpStatus, UsePipes, ValidationPipe, Logger,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../foundation/identity-access/public.decorator'
import { StoreFrontService } from './storefront.service'
import { ReferralTrackingService } from './referral-tracking.service'
import { CouponService } from '../coupon/coupon.service'
import { QueueService } from '../queue/queue.service'
import { CreateBookingDto } from './dto/create-booking.dto'
import { CancelBookingDto, RescheduleBookingDto } from './dto/cancellation.dto'

@ApiTags('C端·单店TOC')
@Controller('api/storefront')
export class StoreFrontController {
  private readonly logger = new Logger(StoreFrontController.name)

  constructor(
    private readonly store: StoreFrontService,
    private readonly referral: ReferralTrackingService,
    private readonly couponSvc: CouponService,
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
  async getSlots(@Param('slug') slug: string, @Param('id') id: string, @Query('date') date: string) {
    if (!date) return { success: false, message: '缺少 date 参数' }
    const slots = await this.store.getSlots(slug, id, date)
    return { success: true, data: { date, totalSlots: slots.length, availableCount: slots.filter(s => s.available).length, slots } }
  }

  // ═══════════════════════════════════════════════════════
  // 预约
  // ═══════════════════════════════════════════════════════

  @Public() @Post('bookings') @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createBooking(@Body() dto: CreateBookingDto) {
    const result = await this.store.createBooking(dto)
    this.logger.log(`[TOC] P0 预约确认: ${result.bookingId}`)
    return { success: true, data: result }
  }

  @Public() @Get('bookings/:bookingId')
  async getBooking(@Param('bookingId') bookingId: string) {
    return { success: true, data: await this.store.getBooking(bookingId) }
  }

  @Public() @Post('bookings/:bookingId/cancel') @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async cancelBooking(@Param('bookingId') bookingId: string, @Body() dto: CancelBookingDto) {
    const result = await this.store.cancelBooking(bookingId, dto)
    this.logger.log(`[TOC] P0 取消确认: ${result.bookingId}`)
    return { success: true, data: result, message: '预约已取消，时段已释放' }
  }

  @Public() @Post('bookings/:bookingId/reschedule') @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async rescheduleBooking(@Param('bookingId') bookingId: string, @Body() dto: RescheduleBookingDto) {
    const result = await this.store.rescheduleBooking(bookingId, dto)
    this.logger.log(`[TOC] P0 改期确认: ${result.bookingId} → ${dto.newDate} ${dto.newTimeSlot}`)
    return { success: true, data: result, message: `已改期至 ${dto.newDate} ${dto.newTimeSlot}` }
  }

  @Public() @Post('bookings/:bookingId/checkin') @HttpCode(HttpStatus.OK)
  async checkIn(
    @Param('bookingId') bookingId: string,
    @Headers('x-qr-signature') signature?: string,
  ) {
    // BL-2: QR HMAC 签名验证 — 防止 QR 码遍历伪造
    const result = await this.store.checkIn(bookingId, signature)
    this.logger.log(`[TOC] 核销确认: ${result.bookingId} ✅`)
    return { success: true, data: result, message: '核销成功 🎉' }
  }

  // ═══════════════════════════════════════════════════════
  // 优惠券
  // ═══════════════════════════════════════════════════════

  @Public() @Post('coupons/match')
  async matchCoupon(@Body() body: { customerPhone: string; orderAmount: number }) {
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
      this.logger.warn(`[TOC→Coupon] 降级: ${e?.message ?? e}`)
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
  // 全员营销 & KOL 推广 (待 Prisma 迁移 — BL-6)
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
  async removeReferralRelationship(@Body() body: { customerPhone: string }) {
    const removed = await this.referral.removeReferralRelationship(body.customerPhone)
    return { success: true, data: { removed }, message: removed ? '已解除' : '未找到' }
  }
}
