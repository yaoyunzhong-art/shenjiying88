/**
 * venue.controller.ts — P-25 场地管理控制器 + V24 场地预订端点
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CreateVenueDto, UpdateVenueDto, CreateVenueBookingDto } from './venue.dto'
import { VenueShift, VenueStatus, VenueType } from './venue.entity'
import { VenueService } from './venue.service'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('venue')
@UseGuards(TenantGuard)
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  // ── 场地 CRUD ──────────────────────────────────────────────────────

  @Post()
  create(@Body() body: CreateVenueDto) {
    try {
      return this.venueService.create({
        name: body.name,
        type: body.type,
        capacity: body.capacity,
        priceCents: body.priceCents,
        timeSlotPricing: body.timeSlotPricing,
        holidayPricing: body.holidayPricing,
        tags: body.tags,
        description: body.description,
      })
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException('创建场地失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.venueService.list({
      type: type as VenueType,
      status: status as VenueStatus,
      search,
    })
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    try {
      return this.venueService.getById(id)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND)
      }
      throw new HttpException('获取场地失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateVenueDto) {
    try {
      return this.venueService.update(id, {
        name: body.name,
        type: body.type,
        capacity: body.capacity,
        priceCents: body.priceCents,
        status: body.status,
        timeSlotPricing: body.timeSlotPricing,
        holidayPricing: body.holidayPricing,
        tags: body.tags,
        description: body.description,
      })
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException('更新场地失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    try {
      this.venueService.delete(id)
      return { success: true }
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND)
      }
      throw new HttpException('删除场地失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  场地预订
  // ═══════════════════════════════════════════════════════════════════

  @Post('booking')
  createBooking(@Body() body: CreateVenueBookingDto) {
    try {
      return this.venueService.createBooking({
        venueId: body.venueId,
        userId: body.userId,
        userName: body.userName,
        date: body.date,
        shift: body.shift,
        startTime: body.startTime,
        endTime: body.endTime,
        priceCents: body.priceCents,
        depositCents: body.depositCents,
        guestCount: body.guestCount,
        remark: body.remark,
      })
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException('创建预订失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get('booking/list')
  findAllBookings(
    @Query('venueId') venueId?: string,
    @Query('userId') userId?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('shift') shift?: string,
  ) {
    return this.venueService.listBookings({
      venueId,
      userId,
      date,
      status: status as VenueStatus,
      shift: shift as VenueShift,
    })
  }

  @Get('booking/:id')
  getBookingById(@Param('id') id: string) {
    try {
      return this.venueService.getBookingById(id)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND)
      }
      throw new HttpException('获取预订详情失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('booking/:id/confirm')
  confirmBooking(@Param('id') id: string) {
    try {
      return this.venueService.confirmBooking(id)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException('确认预订失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('booking/:id/start')
  startBooking(@Param('id') id: string) {
    try {
      return this.venueService.startBooking(id)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException('开始使用场地失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('booking/:id/complete')
  completeBooking(@Param('id') id: string) {
    try {
      return this.venueService.completeBooking(id)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException('完成预订失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post('booking/:id/cancel')
  cancelBooking(@Param('id') id: string, @Body('reason') reason?: string) {
    try {
      return this.venueService.cancelBooking(id, reason)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException('取消预订失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Get('booking/:venueId/availability')
  getAvailability(@Param('venueId') venueId: string, @Query('date') date: string) {
    if (!date) {
      throw new HttpException('date 参数不能为空', HttpStatus.BAD_REQUEST)
    }
    try {
      return this.venueService.getVenueAvailability(venueId, date)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND)
      }
      throw new HttpException('查询可用时段失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Post(':id/release')
  releaseVenue(@Param('id') id: string) {
    try {
      const result = this.venueService.releaseVenue(id)
      return { success: result }
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.NOT_FOUND)
      }
      throw new HttpException('释放场地失败', HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
