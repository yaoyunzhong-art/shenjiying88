// storefront.controller.ts · 门店 C 端 Controller
// Phase 2A 交易闭环硬化 · 2026-07-26
//
// API 端点 (合计 11 个):
//   GET    /api/storefront/store/:slug                       — 门店信息
//   GET    /api/storefront/store/:slug/services              — 项目列表
//   GET    /api/storefront/store/:slug/services/:id/slots    — 时段查询
//   POST   /api/storefront/bookings                          — 创建预约
//   GET    /api/storefront/bookings/:bookingId               — 查询预约
//   POST   /api/storefront/bookings/:bookingId/cancel        — 取消预约
//   POST   /api/storefront/bookings/:bookingId/reschedule    — 改期
//   POST   /api/storefront/bookings/:bookingId/checkin       — 核销确认
//   POST   /api/storefront/coupons/match                     — 优惠券匹配
//   GET    /api/storefront/packages                          — 套餐列表
//
// 所有端点标记 @Public()（C端页面无需登录）
//
// 宪法§16.1: P0交易类推送 → 邮件(必发) + App + 短信备选
// 宪法§16.2: P0/P1邮件不可关闭
// 宪法§14: LYT门闸联动, 核销Webhook → M5异步更新券状态

import {
  Body, Controller, Get, Param, Post, Query,
  HttpCode, HttpStatus, UsePipes, ValidationPipe,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../foundation/identity-access/public.decorator'
import { StoreFrontService } from './storefront.service'
import { CouponService } from './coupon.service'
import { NotificationService } from './notification.service'
import { CreateBookingDto } from './dto/create-booking.dto'
import { CancelBookingDto, RescheduleBookingDto } from './dto/cancellation.dto'

@ApiTags('C端·门店前台')
@Controller('api/storefront')
export class StoreFrontController {
  constructor(
    private readonly storeFrontService: StoreFrontService,
    private readonly couponService: CouponService,
    private readonly notification: NotificationService,
  ) {}

  // ── 1. 门店信息 ────────────────────────────────────────────

  @Public()
  @Get('store/:slug')
  @ApiOperation({ summary: '获取门店信息' })
  getStore(@Param('slug') slug: string) {
    return { success: true, data: this.storeFrontService.getStore(slug) }
  }

  // ── 2. 项目列表 ────────────────────────────────────────────

  @Public()
  @Get('store/:slug/services')
  @ApiOperation({ summary: '获取服务项目列表' })
  getServices(@Param('slug') slug: string, @Query('category') category?: string) {
    const services = this.storeFrontService.getServices(slug, category)
    return { success: true, data: { total: services.length, items: services } }
  }

  // ── 3. 时段查询 ────────────────────────────────────────────

  @Public()
  @Get('store/:slug/services/:id/slots')
  @ApiOperation({ summary: '查询可选时段' })
  getSlots(@Param('slug') slug: string, @Param('id') id: string, @Query('date') date: string) {
    if (!date) return { success: false, message: '缺少 date 参数，格式: YYYY-MM-DD' }
    const slots = this.storeFrontService.getSlots(slug, id, date)
    return { success: true, data: { date, totalSlots: slots.length, availableCount: slots.filter(s => s.available).length, slots } }
  }

  // ── 4. 创建预约（含推送 + 优惠券） ──────────────────────────

  @Public()
  @Post('bookings')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: '创建预约' })
  async createBooking(@Body() dto: CreateBookingDto) {
    // 1. 创建预约
    const result = this.storeFrontService.createBooking(dto)

    // 2. 优惠券匹配返回（不阻塞预约流程）
    let couponMatch = null
    try {
      couponMatch = this.couponService.matchBestCoupon(dto.customerPhone, result.amount)
    } catch (e) { /* 优惠券匹配失败不阻塞 */ }

    // 3. P0 推送（即时，异步不阻塞响应）
    this.notification.sendBookingConfirmed({
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      storeName: result.storeName,
      serviceName: result.serviceName,
      bookingId: result.bookingId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      amount: result.amount,
      qrCode: result.qrCode,
    }).catch(() => { /* 推送失败不阻塞 */ })

    return {
      success: true,
      data: {
        ...result,
        couponMatch,
      },
    }
  }

  // ── 5. 查询预约状态 ────────────────────────────────────────

  @Public()
  @Get('bookings/:bookingId')
  @ApiOperation({ summary: '查询预约状态' })
  getBooking(@Param('bookingId') bookingId: string) {
    const booking = this.storeFrontService.getBooking(bookingId)
    return { success: true, data: booking }
  }

  // ── 6. 取消预约 ────────────────────────────────────────────

  @Public()
  @Post('bookings/:bookingId/cancel')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: '取消预约' })
  async cancelBooking(@Param('bookingId') bookingId: string, @Body() dto: CancelBookingDto) {
    const result = this.storeFrontService.cancelBooking(bookingId, dto)

    // P0 推送
    this.notification.sendCancelled({
      customerName: result.customerName,
      customerPhone: result.customerPhone,
      storeName: result.storeName,
      serviceName: result.serviceName,
      bookingId: result.bookingId,
      date: result.date,
      timeSlot: result.timeSlot,
      amount: result.amount,
      qrCode: '',
    }).catch(() => {})

    return { success: true, data: result, message: '预约已取消，时段已释放' }
  }

  // ── 7. 改期 ────────────────────────────────────────────────

  @Public()
  @Post('bookings/:bookingId/reschedule')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: '改期' })
  async rescheduleBooking(@Param('bookingId') bookingId: string, @Body() dto: RescheduleBookingDto) {
    const result = this.storeFrontService.rescheduleBooking(bookingId, dto)

    // P0 推送
    this.notification.sendRescheduled({
      customerName: result.customerName,
      customerPhone: result.customerPhone,
      storeName: result.storeName,
      serviceName: result.serviceName,
      bookingId: result.bookingId,
      date: dto.newDate,
      timeSlot: dto.newTimeSlot,
      amount: result.amount,
      qrCode: '',
    }, dto.newDate, dto.newTimeSlot).catch(() => {})

    return { success: true, data: result, message: `已改期至 ${dto.newDate} ${dto.newTimeSlot}` }
  }

  // ── 8. 核销确认 ────────────────────────────────────────────

  /**
   * POST /api/storefront/bookings/:bookingId/checkin
   *
   * 门闸扫码时调用，验证QR码 → 更新状态 → 发送核销确认推送
   * 宪法§14: Webhook推送通行事件, 标记门店
   */
  @Public()
  @Post('bookings/:bookingId/checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '核销确认（门闸扫码回调）' })
  async checkIn(@Param('bookingId') bookingId: string) {
    const result = this.storeFrontService.checkIn(bookingId)

    this.notification.sendCheckInConfirmed({
      customerName: result.customerName,
      customerPhone: result.customerPhone,
      storeName: result.storeName,
      serviceName: result.serviceName,
      bookingId: result.bookingId,
      date: result.date,
      timeSlot: result.timeSlot,
      amount: result.amount,
      qrCode: '',
    }).catch(() => {})

    return { success: true, data: result, message: '核销成功，欢迎入场 🎉' }
  }

  // ── 9. 优惠券智能匹配 ──────────────────────────────────────

  @Public()
  @Post('coupons/match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '优惠券智能匹配' })
  matchCoupon(@Body() body: { customerPhone: string; orderAmount: number }) {
    const result = this.couponService.matchBestCoupon(body.customerPhone, body.orderAmount)
    return { success: true, data: result }
  }

  // ── 10. 套餐列表 ───────────────────────────────────────────

  @Public()
  @Get('packages')
  @ApiOperation({ summary: '获取套餐列表' })
  getPackages(@Query('storeSlug') storeSlug?: string) {
    const packages = this.storeFrontService.getPackages(storeSlug)
    return { success: true, data: { total: packages.length, items: packages } }
  }
}
