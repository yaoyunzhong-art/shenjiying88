import { Controller, Get, Query } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { GetDiagnosticsDto, GetOperationSnapshotDto, GetRecommendationsDto } from './analytics.dto'
import { AnalyticsService } from './analytics.service'

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('snapshot')
  getOperationSnapshot(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: GetOperationSnapshotDto
  ) {
    return this.analyticsService.getOperationSnapshot(tenantContext, {
      scope: query.scope,
      brandId: query.brandId,
      storeId: query.storeId
    })
  }

  @Get('diagnostics')
  getDiagnostics(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: GetDiagnosticsDto
  ) {
    return this.analyticsService.getDiagnostics(tenantContext, {
      scope: query.scope,
      brandId: query.brandId,
      storeId: query.storeId
    })
  }

  @Get('recommendations')
  getRecommendations(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: GetRecommendationsDto
  ) {
    return this.analyticsService.getRecommendations(tenantContext, {
      scope: query.scope,
      brandId: query.brandId,
      storeId: query.storeId
    })
  }
}
