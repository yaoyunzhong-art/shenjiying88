import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type {
  LytFixtureImportPlanDto,
  LytFixtureImportPreviewDto,
  LytFixtureCompareDto,
  LytWebhookDrillDto,
  LytWebhookFixtureReplayDto,
  LytWebhookIngestDto
} from './lyt.dto'
import { LytService } from './lyt.service'
import type { LytDevice } from './lyt.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('lyt')
@UseGuards(TenantGuard)
export class LytController {
  constructor(private readonly lytService: LytService) {}

  @Get('fixtures')
  getFixtures(
    @Query('transport') transport?: string,
    @Query('capability') capability?: string
  ) {
    return this.lytService.getFixtures({ transport, capability })
  }

  @Get('fixtures/summary')
  getFixtureSummary(
    @Query('transport') transport?: string,
    @Query('capability') capability?: string
  ) {
    return this.lytService.getFixtureSummary({ transport, capability })
  }

  @Get('fixtures/:key')
  getFixture(@Param('key') key: string) {
    return this.lytService.getFixture(key)
  }

  @Post('fixtures/:key/compare')
  compareFixture(@Param('key') key: string, @Body() body: LytFixtureCompareDto) {
    return this.lytService.compareFixtureInput(key, body)
  }

  @Post('fixtures/:key/import-preview')
  importFixturePreview(@Param('key') key: string, @Body() body: LytFixtureImportPreviewDto) {
    return this.lytService.previewFixtureImport(key, body)
  }

  @Post('fixtures/:key/import-plan')
  importFixturePlan(@Param('key') key: string, @Body() body: LytFixtureImportPlanDto) {
    return this.lytService.planFixtureImport(key, body)
  }

  @Get('bootstrap')
  getBootstrap() {
    return this.lytService.getBootstrap()
  }

  @Get('connection/:storeId')
  async getConnection(
    @Param('storeId') storeId: string,
    @TenantContext() tenantContext: RequestTenantContext | undefined
  ) {
    return this.lytService.getConnection(storeId, tenantContext)
  }

  @Get('connection/:storeId/readiness')
  async getConnectionCapabilityReadiness(
    @Param('storeId') storeId: string,
    @TenantContext() tenantContext: RequestTenantContext | undefined
  ) {
    return this.lytService.getConnectionCapabilityReadiness(storeId, tenantContext)
  }

  @Get('connection/:storeId/access-view')
  async getStoreCapabilityAccessView(
    @Param('storeId') storeId: string,
    @TenantContext() tenantContext: RequestTenantContext | undefined
  ) {
    return this.lytService.getStoreCapabilityAccessView(storeId, tenantContext)
  }

  @Get('connection/:storeId/adapter')
  async getAdapterSelection(
    @Param('storeId') storeId: string,
    @TenantContext() tenantContext: RequestTenantContext | undefined
  ) {
    return this.lytService.getAdapterSelection(storeId, tenantContext)
  }

  @Get('connection/governance-summary')
  async getConnectionGovernanceSummary(@TenantContext() tenantContext: RequestTenantContext | undefined) {
    return this.lytService.getConnectionGovernanceSummary(tenantContext)
  }

  @Get('connection/governance-alerts')
  async getConnectionGovernanceAlerts(@TenantContext() tenantContext: RequestTenantContext | undefined) {
    return this.lytService.getConnectionGovernanceAlerts(tenantContext)
  }

  @Get('devices/:deviceId/status')
  async getDeviceStatus(@Param('deviceId') deviceId: string) {
    const adapter = this.lytService.getAdapter()
    return adapter.getDeviceStatus(deviceId)
  }

  @Post('devices/health-summary')
  getDeviceHealthSummary(
    @Body() body: { devices: LytDevice[]; thresholdMinutes?: number }
  ) {
    return this.lytService.getDeviceHealthSummary(body.devices, body.thresholdMinutes)
  }

  @Post('webhooks/callback')
  async acceptWebhook(@Body() body: LytWebhookIngestDto) {
    return this.lytService.acceptWebhook(body)
  }

  @Post('webhooks/drill')
  async drillWebhook(@Body() body: LytWebhookDrillDto) {
    return this.lytService.drillWebhook(body)
  }

  @Post('webhooks/replay-fixture')
  async replayWebhookFixture(@Body() body: LytWebhookFixtureReplayDto) {
    return this.lytService.replayWebhookFixture(body)
  }
}
