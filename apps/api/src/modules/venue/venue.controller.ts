/**
 * venue.controller.ts — P-25 场地管理控制器
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
import { CreateVenueDto, UpdateVenueDto } from './venue.dto'
import { VenueService } from './venue.service'
import { TenantGuard } from '../agent/tenant.guard';

@Controller('venue')
@UseGuards(TenantGuard)
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

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
      type: type as any,
      status: status as any,
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
}
