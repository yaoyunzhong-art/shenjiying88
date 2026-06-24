import { Body, Controller, Get } from '@nestjs/common'
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
    @Body() body: GetOperationSnapshotDto
  ) {
    return this.analyticsService.getOperationSnapshot(tenantContext, {
      scope: body.scope,
      brandId: body.brandId,
      storeId: body.storeId
    })
  }

  @Get('diagnostics')
  getDiagnostics(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: GetDiagnosticsDto
  ) {
    return this.analyticsService.getDiagnostics(tenantContext, {
      scope: body.scope,
      brandId: body.brandId,
      storeId: body.storeId
    })
  }

  @Get('recommendations')
  getRecommendations(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: GetRecommendationsDto
  ) {
    return this.analyticsService.getRecommendations(tenantContext, {
      scope: body.scope,
      brandId: body.brandId,
      storeId: body.storeId
    })
  }
}
