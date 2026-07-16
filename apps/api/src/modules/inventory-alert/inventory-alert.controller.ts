import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { AlertQueryDto, AlertSummaryDto, CreateInventoryAlertDto, InventoryAlertDto, InventoryAlertListDto } from './inventory-alert.dto'
import { InventoryAlertService } from './inventory-alert.service'

@ApiTags('库存预警分析')
@ApiBearerAuth()
@Controller('inventory-alert')
export class InventoryAlertController {
  constructor(private readonly service: InventoryAlertService) {}

  @Get()
  @ApiOperation({ summary: '获取库存预警列表' })
  @ApiOkResponse({ type: InventoryAlertListDto })
  list(
    @TenantContext() ctx: RequestTenantContext,
    @Query() query: AlertQueryDto = {} as AlertQueryDto,
  ): InventoryAlertListDto {
    const result = this.service.list(ctx, query)
    return {
      items: result.items as unknown as InventoryAlertDto[],
      total: result.total,
      offset: result.offset,
      limit: result.limit,
    }
  }

  @Get('summary')
  @ApiOperation({ summary: '获取预警统计汇总' })
  @ApiOkResponse({ type: AlertSummaryDto })
  summary(@TenantContext() ctx: RequestTenantContext): AlertSummaryDto {
    return this.service.getSummary(ctx) as AlertSummaryDto
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单条预警详情' })
  @ApiOkResponse({ type: InventoryAlertDto })
  getById(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
  ): InventoryAlertDto {
    return this.service.getById(id, ctx) as unknown as InventoryAlertDto
  }

  @Post()
  @ApiOperation({ summary: '创建库存预警' })
  @ApiOkResponse({ type: InventoryAlertDto })
  create(
    @TenantContext() ctx: RequestTenantContext,
    @Body() body: CreateInventoryAlertDto,
  ): InventoryAlertDto {
    return this.service.create(ctx, body) as unknown as InventoryAlertDto
  }
}
