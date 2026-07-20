import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  EmployeePerformanceQueryDto,
  EmployeePerformanceDto,
  EmployeePerformanceListDto,
  PerformanceSummaryDto,
  CreateEmployeePerformanceDto,
} from './employee-performance-review.dto'
import { EmployeePerformanceReviewService } from './employee-performance-review.service'

@ApiTags('员工绩效评估')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('employee-performance')
export class EmployeePerformanceReviewController {
  constructor(private readonly service: EmployeePerformanceReviewService) {}

  @Get()
  @ApiOperation({ summary: '获取员工绩效列表' })
  @ApiOkResponse({ type: EmployeePerformanceListDto })
  list(
    @TenantContext() ctx: RequestTenantContext,
    @Query() query: EmployeePerformanceQueryDto = {} as EmployeePerformanceQueryDto,
  ): EmployeePerformanceListDto {
    const result = this.service.list(ctx, query)
    return {
      items: result.items as unknown as EmployeePerformanceDto[],
      total: result.total,
    }
  }

  @Get('summary')
  @ApiOperation({ summary: '获取绩效汇总' })
  @ApiOkResponse({ type: PerformanceSummaryDto })
  summary(@TenantContext() ctx: RequestTenantContext): PerformanceSummaryDto {
    return this.service.getSummary(ctx) as PerformanceSummaryDto
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个员工绩效详情' })
  @ApiOkResponse({ type: EmployeePerformanceDto })
  getById(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
  ): EmployeePerformanceDto {
    return this.service.getById(id, ctx) as unknown as EmployeePerformanceDto
  }

  @Post()
  @ApiOperation({ summary: '创建员工绩效记录' })
  @ApiOkResponse({ type: EmployeePerformanceDto })
  create(
    @TenantContext() ctx: RequestTenantContext,
    @Body() body: CreateEmployeePerformanceDto,
  ): EmployeePerformanceDto {
    return this.service.create(ctx, body) as unknown as EmployeePerformanceDto
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除员工绩效记录' })
  delete(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
  ): { success: boolean } {
    this.service.delete(id, ctx)
    return { success: true }
  }
}
