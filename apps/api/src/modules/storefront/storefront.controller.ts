// storefront.controller.ts · 门店 C 端 Controller
// Phase 1 核心交易闭环 · 2026-07-26
//
// API 端点:
//   GET  /api/storefront/store/:slug         — 门店信息
//   GET  /api/storefront/store/:slug/services — 项目列表
//   GET  /api/storefront/store/:slug/services/:id/slots — 时段查询
//   POST /api/storefront/bookings            — 创建预约
//   GET  /api/storefront/packages            — 套餐列表
//
// 所有端点标记 @Public()（C端页面无需登录）

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../foundation/identity-access/public.decorator'
import { StoreFrontService } from './storefront.service'
import { CreateBookingDto } from './dto/create-booking.dto'

@ApiTags('C端·门店前台')
@Controller('api/storefront')
export class StoreFrontController {
  constructor(private readonly storeFrontService: StoreFrontService) {}

  // ── 1. 门店信息 ────────────────────────────────────────────

  /**
   * GET /api/storefront/store/:slug
   *
   * 返回门店基本信息：名称、地址、评分、营业时间、联系电话、封面图
   */
  @Public()
  @Get('store/:slug')
  @ApiOperation({ summary: '获取门店信息' })
  getStore(@Param('slug') slug: string) {
    const store = this.storeFrontService.getStore(slug)
    return {
      success: true,
      data: store,
    }
  }

  // ── 2. 项目列表 ────────────────────────────────────────────

  /**
   * GET /api/storefront/store/:slug/services
   *
   * 返回该门店的服务项目列表
   * 支持 category 参数过滤: sports / leisure / family / team / birthday
   */
  @Public()
  @Get('store/:slug/services')
  @ApiOperation({ summary: '获取服务项目列表' })
  getServices(
    @Param('slug') slug: string,
    @Query('category') category?: string,
  ) {
    const services = this.storeFrontService.getServices(slug, category)
    return {
      success: true,
      data: {
        total: services.length,
        items: services,
      },
    }
  }

  // ── 3. 时段查询 ────────────────────────────────────────────

  /**
   * GET /api/storefront/store/:slug/services/:id/slots?date=YYYY-MM-DD
   *
   * 返回某项目在指定日期的可选时段（30分钟粒度）
   */
  @Public()
  @Get('store/:slug/services/:id/slots')
  @ApiOperation({ summary: '查询可选时段' })
  getSlots(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    if (!date) {
      return {
        success: false,
        message: '缺少 date 参数，格式: YYYY-MM-DD',
      }
    }

    const slots = this.storeFrontService.getSlots(slug, id, date)
    const availableCount = slots.filter((s) => s.available).length

    return {
      success: true,
      data: {
        date,
        totalSlots: slots.length,
        availableCount,
        slots,
      },
    }
  }

  // ── 4. 创建预约 ────────────────────────────────────────────

  /**
   * POST /api/storefront/bookings
   *
   * 创建预约，返回 bookingId / qrCode / paymentUrl
   */
  @Public()
  @Post('bookings')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: '创建预约' })
  createBooking(@Body() dto: CreateBookingDto) {
    const result = this.storeFrontService.createBooking(dto)
    return {
      success: true,
      data: result,
    }
  }

  // ── 5. 套餐列表 ────────────────────────────────────────────

  /**
   * GET /api/storefront/packages?storeSlug=xxx
   *
   * 返回套餐列表：单人 / 亲子 / 团体 / 限时
   */
  @Public()
  @Get('packages')
  @ApiOperation({ summary: '获取套餐列表' })
  getPackages(@Query('storeSlug') storeSlug?: string) {
    const packages = this.storeFrontService.getPackages(storeSlug)
    return {
      success: true,
      data: {
        total: packages.length,
        items: packages,
      },
    }
  }
}
