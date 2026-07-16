import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  DeviceUsageQueryDto,
  DeviceUsageDto,
  DeviceUsageListDto,
  DeviceUsageSummaryDto,
  CreateDeviceUsageDto,
} from './device-usage-report.dto'
import { DeviceUsageReportService } from './device-usage-report.service'

@ApiTags('设备使用率分析')
@ApiBearerAuth()
@Controller('device-usage-report')
export class DeviceUsageReportController {
  constructor(private readonly service: DeviceUsageReportService) {}

  @Get()
  @ApiOperation({ summary: '获取设备使用率列表' })
  @ApiOkResponse({ type: DeviceUsageListDto })
  list(
    @TenantContext() ctx: RequestTenantContext,
    @Query() query: DeviceUsageQueryDto = {} as DeviceUsageQueryDto,
  ): DeviceUsageListDto {
    const result = this.service.list(ctx, query)
    return {
      items: result.items as unknown as DeviceUsageDto[],
      total: result.total,
    }
  }

  @Get('summary')
  @ApiOperation({ summary: '获取设备使用率汇总' })
  @ApiOkResponse({ type: DeviceUsageSummaryDto })
  summary(@TenantContext() ctx: RequestTenantContext): DeviceUsageSummaryDto {
    return this.service.getSummary(ctx) as DeviceUsageSummaryDto
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个设备使用率详情' })
  @ApiOkResponse({ type: DeviceUsageDto })
  getById(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
  ): DeviceUsageDto {
    return this.service.getById(id, ctx) as unknown as DeviceUsageDto
  }

  @Post()
  @ApiOperation({ summary: '创建设备使用率记录' })
  @ApiOkResponse({ type: DeviceUsageDto })
  create(
    @TenantContext() ctx: RequestTenantContext,
    @Body() body: CreateDeviceUsageDto,
  ): DeviceUsageDto {
    return this.service.create(ctx, body) as unknown as DeviceUsageDto
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除设备使用率记录' })
  delete(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
  ): { success: boolean } {
    this.service.delete(id, ctx)
    return { success: true }
  }
}
