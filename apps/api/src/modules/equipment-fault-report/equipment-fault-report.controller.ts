import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  FaultQueryDto,
  FaultReportDto,
  FaultReportListDto,
  FaultSummaryDto,
  CreateFaultReportDto,
} from './equipment-fault-report.dto'
import { EquipmentFaultReportService } from './equipment-fault-report.service'

@ApiTags('设备故障报表')
@ApiBearerAuth()
@Controller('equipment-fault-report')
export class EquipmentFaultReportController {
  constructor(private readonly service: EquipmentFaultReportService) {}

  @Get()
  @ApiOperation({ summary: '获取设备故障列表' })
  @ApiOkResponse({ type: FaultReportListDto })
  list(
    @TenantContext() ctx: RequestTenantContext,
    @Query() query: FaultQueryDto = {} as FaultQueryDto,
  ): FaultReportListDto {
    const result = this.service.list(ctx, query)
    return {
      items: result.items as unknown as FaultReportDto[],
      total: result.total,
      offset: result.offset,
      limit: result.limit,
    }
  }

  @Get('summary')
  @ApiOperation({ summary: '获取故障统计汇总' })
  @ApiOkResponse({ type: FaultSummaryDto })
  summary(@TenantContext() ctx: RequestTenantContext): FaultSummaryDto {
    return this.service.getSummary(ctx) as FaultSummaryDto
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个故障详情' })
  @ApiOkResponse({ type: FaultReportDto })
  getById(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
  ): FaultReportDto {
    return this.service.getById(id, ctx) as unknown as FaultReportDto
  }

  @Post()
  @ApiOperation({ summary: '创建设备故障报告' })
  @ApiOkResponse({ type: FaultReportDto })
  create(
    @TenantContext() ctx: RequestTenantContext,
    @Body() body: CreateFaultReportDto,
  ): FaultReportDto {
    return this.service.create(ctx, body) as unknown as FaultReportDto
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除设备故障报告' })
  delete(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
  ): { success: boolean } {
    this.service.delete(id, ctx)
    return { success: true }
  }
}
