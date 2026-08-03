import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  SatisfactionQueryDto,
  SatisfactionDto,
  SatisfactionListDto,
  SatisfactionSummaryDto,
  CreateSatisfactionDto,
} from './customer-satisfaction.dto'
import { CustomerSatisfactionService } from './customer-satisfaction.service'

@ApiTags('客户满意度调查')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('customer-satisfaction')
export class CustomerSatisfactionController {
  constructor(private readonly service: CustomerSatisfactionService) {}

  @Get()
  @ApiOperation({ summary: '获取客户满意度列表' })
  @ApiOkResponse({ type: SatisfactionListDto })
  list(
    @TenantContext() ctx: RequestTenantContext,
    @Query() query: SatisfactionQueryDto = {} as SatisfactionQueryDto,
  ): SatisfactionListDto {
    const result = this.service.list(ctx, query)
    return {
      items: result.items as unknown as SatisfactionDto[],
      total: result.total,
    }
  }

  @Get('summary')
  @ApiOperation({ summary: '获取满意度汇总' })
  @ApiOkResponse({ type: SatisfactionSummaryDto })
  summary(@TenantContext() ctx: RequestTenantContext): SatisfactionSummaryDto {
    return this.service.getSummary(ctx) as SatisfactionSummaryDto
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个满意度详情' })
  @ApiOkResponse({ type: SatisfactionDto })
  getById(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
  ): SatisfactionDto {
    return this.service.getById(id, ctx) as unknown as SatisfactionDto
  }

  @Post()
  @ApiOperation({ summary: '创建客户满意度记录' })
  @ApiOkResponse({ type: SatisfactionDto })
  create(
    @TenantContext() ctx: RequestTenantContext,
    @Body() body: CreateSatisfactionDto,
  ): SatisfactionDto {
    return this.service.create(ctx, body) as unknown as SatisfactionDto
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除客户满意度记录' })
  delete(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
  ): { success: boolean } {
    this.service.delete(id, ctx)
    return { success: true }
  }
}
