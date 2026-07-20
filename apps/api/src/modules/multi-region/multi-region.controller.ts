/**
 * multi-region.controller.ts
 * 用途: 多区域 REST API 控制器
 */
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, , UseGuards } from '@nestjs/common'
import {
  BatchCheckHealthDto,
  CanMigrateDto,
  CheckHealthDto,
  ConfigureFailoverDto,
  FailoverCheckDto,
  PinTenantDto,
  RegisterEndpointDto,
  RouteQueryDto,
  SetHealthDto,
  UpdateEndpointDto,
} from './multi-region.dto'
import {
  ALL_REGIONS,
  Region,
  TenantRegionPin,
} from './multi-region.entity'
import { FailoverService } from './failover.service'
import { MultiRegionService } from './multi-region.service'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('multi-region')
@UseGuards(TenantGuard)
export class MultiRegionController {
  constructor(
    private readonly regions: MultiRegionService,
    private readonly failover: FailoverService,
  ) {}

  // ── Endpoint management ──

  @Get('endpoints')
  listEndpoints() {
    return this.regions.listEndpoints()
  }

  @Get('endpoints/:region')
  getEndpoint(@Param('region') region: Region) {
    const ep = this.regions.getEndpoint(region)
    return ep ?? { error: `region ${region} not found` }
  }

  @Post('endpoints')
  registerEndpoint(@Body() body: RegisterEndpointDto) {
    this.regions.registerEndpoint({
      region: body.region,
      baseUrl: body.baseUrl,
      latencyMs: body.latencyMs,
      enabled: body.enabled ?? true,
    })
    return { ok: true, region: body.region }
  }

  @Patch('endpoints/:region')
  updateEndpoint(
    @Param('region') region: Region,
    @Body() body: UpdateEndpointDto,
  ) {
    const existing = this.regions.getEndpoint(region)
    if (!existing) {
      return { error: `region ${region} not found` }
    }
    this.regions.registerEndpoint({
      ...existing,
      baseUrl: body.baseUrl ?? existing.baseUrl,
      latencyMs: body.latencyMs ?? existing.latencyMs,
      enabled: body.enabled ?? existing.enabled,
    })
    return { ok: true, region }
  }

  // ── Routing ──

  @Get('route')
  route(@Query() query: RouteQueryDto) {
    const decision = this.regions.route(query.clientIp, query.tenantId)
    return decision
  }

  @Get('route/latency')
  routeByLatency() {
    return this.regions.routeByLatency()
  }

  // ── GeoIP ──

  @Get('geo/:ip')
  geoLookup(@Param('ip') ip: string) {
    return this.regions.geoLookup(ip)
  }

  // ── Tenant pinning ──

  @Post('tenants/pin')
  pinTenant(@Body() body: PinTenantDto) {
    this.regions.pinTenantToRegion(body.tenantId, body.region)
    return { ok: true, tenantId: body.tenantId, region: body.region }
  }

  @Delete('tenants/:tenantId/pin')
  unpinTenant(@Param('tenantId') tenantId: string) {
    this.regions.unpinTenant(tenantId)
    return { ok: true }
  }

  @Get('tenants')
  listPinnedTenants(): TenantRegionPin[] {
    return this.regions.listPinnedTenants().map((t) => ({
      ...t,
      pinnedAt: new Date().toISOString(),
    }))
  }

  @Get('tenants/:tenantId/region')
  getTenantRegion(@Param('tenantId') tenantId: string) {
    const region = this.regions.getTenantRegion(tenantId)
    return region ? { tenantId, region } : { tenantId, region: null }
  }

  // ── Health ──

  @Post('health')
  setHealth(@Body() body: SetHealthDto) {
    this.regions.setRegionHealth(body.region, body.status)
    return { ok: true, region: body.region, status: body.status }
  }

  @Get('health')
  getAllHealth() {
    const result: Record<string, unknown> = {}
    for (const r of ALL_REGIONS) {
      result[r] = {
        region: r,
        health: this.regions.getRegionHealth(r),
        failoverState: this.failover.getState(r),
      }
    }
    return result
  }

  @Get('health/:region')
  getHealth(@Param('region') region: Region) {
    return {
      region,
      health: this.regions.getRegionHealth(region),
      failoverState: this.failover.getState(region),
      lastHealth: this.failover.getLastHealth(region),
    }
  }

  // ── Failover ──

  @Post('failover/check')
  async failoverCheck(@Body() body: FailoverCheckDto) {
    if (body.region) {
      const result = await this.failover.checkHealth(body.region, body.forceOk)
      return result
    }
    return this.failover.checkAll(body.forceOk ? { cn: true, us: true, eu: true, jp: true } : undefined)
  }

  @Post('failover/configure')
  configureFailover(@Body() body: ConfigureFailoverDto) {
    this.failover.configure({
      failureThreshold: body.failureThreshold,
      checkIntervalMs: body.checkIntervalMs,
    })
    return { ok: true }
  }

  @Get('failover/state')
  getFailoverStates() {
    return this.failover.getAllStates()
  }

  @Get('failover/events')
  getFailoverEvents(@Query('region') region?: Region) {
    if (region) {
      return this.failover.getEventsByRegion(region)
    }
    return this.failover.getEvents()
  }

  @Get('failover/healthy')
  getHealthyRegions() {
    return { healthyRegions: this.failover.getHealthyRegions() }
  }

  // ── Data residency ──

  @Get('can-migrate')
  canMigrate(@Query() query: CanMigrateDto) {
    const allowed = this.regions.canMigrateToRegion(query.tenantId, query.targetRegion)
    return { tenantId: query.tenantId, targetRegion: query.targetRegion, allowed }
  }

  // ── Batch health check ──

  @Post('failover/batch-check')
  async batchCheck(@Body() body: BatchCheckHealthDto) {
    return this.failover.checkAll(body.forceOkMap as any)
  }
}
