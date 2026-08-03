import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  TeamBuildingService,
  type TeamBuildingPlan,
  type TeamBuildingType,
  type TeamBuildingStats,
} from './team-building.service'
import type {
  RecommendRequest,
  RecommendResult,
  EquipmentCheckResult,
  TeamBuildingEvent,
  LockedEquipment,
  TeamBuildingReport,
  CrmSyncRecord,
  TeamBuildingDashboard,
  SatisfactionBreakdown,
} from './team-building.entity'
import { TenantGuard } from '../agent/tenant.guard';

@Controller('team-building')
@UseGuards(TenantGuard)
export class TeamBuildingController {
  constructor(private readonly service: TeamBuildingService) {}

  /**
   * GET /api/v1/team-building
   * 团建方案列表
   */
  @Get()
  findAll(
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
    @Query('type') type?: TeamBuildingType,
    @Query('search') search?: string,
  ): TeamBuildingPlan[] {
    return this.service.findAll(tenantId, { type, search })
  }

  /**
   * GET /api/v1/team-building/stats
   * 团建统计数据
   */
  @Get('stats')
  getStats(
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
  ): TeamBuildingStats {
    return this.service.getStats(tenantId)
  }

  /**
   * GET /api/v1/team-building/types
   * 团建类型标签映射
   */
  @Get('types')
  getTypes(): Record<TeamBuildingType, string> {
    return this.service.getTypeLabels()
  }

  /**
   * GET /api/v1/team-building/:id
   * 团建方案详情
   */
  @Get(':id')
  findById(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
  ): TeamBuildingPlan | undefined {
    const plan = this.service.findById(id, tenantId)
    if (!plan) {
      throw new Error(`Team-building plan not found: ${id}`)
    }
    return plan
  }

  /**
   * POST /api/v1/team-building
   * 创建团建方案
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
    @Body()
    body: {
      name: string
      type: TeamBuildingType
      location: string
      budget: number
      expectedParticipants: number
      description: string
      recommendedSeason?: string
      remark?: string
    },
  ): TeamBuildingPlan {
    return this.service.create({ tenantId, ...body })
  }

  /**
   * PATCH /api/v1/team-building/:id
   * 更新团建方案
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
    @Body()
    body: Partial<{
      name: string
      type: TeamBuildingType
      location: string
      budget: number
      expectedParticipants: number
      description: string
      recommendedSeason: string
      remark: string
    }>,
  ): TeamBuildingPlan {
    return this.service.update(id, tenantId, body)
  }

  /**
   * DELETE /api/v1/team-building/:id
   * 删除团建方案
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
  ): void {
    this.service.delete(id, tenantId)
  }

  // ═══════════════════════════════════════════════════════════════════
  // WP-16: 方案推荐 · 设备校验 · 活动管理 · 报告 · CRM · 看板
  // ═══════════════════════════════════════════════════════════════════

  /**
   * POST /api/v1/team-building/recommend
   * 团建方案智能推荐
   */
  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  recommend(
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
    @Body() body: RecommendRequest,
  ): RecommendResult[] {
    return this.service.recommendPlans(tenantId, body)
  }

  /**
   * POST /api/v1/team-building/check-equipment
   * 设备库存校验
   */
  @Post('check-equipment')
  @HttpCode(HttpStatus.OK)
  checkEquipment(
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
    @Body() body: { planId: string; date: string; participants: number },
  ): EquipmentCheckResult {
    return this.service.checkEquipment(body.planId, tenantId, body.date, body.participants)
  }

  /**
   * POST /api/v1/team-building/events
   * 创建团建活动事件
   */
  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  createEvent(
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
    @Body() body: {
      planId: string
      name: string
      eventDate: string
      participants: number
      participantMemberIds?: string[]
      remark?: string
    },
  ): TeamBuildingEvent {
    return this.service.createEvent({ tenantId, ...body })
  }

  /**
   * GET /api/v1/team-building/events
   * 团建活动事件列表
   */
  @Get('events')
  getAllEvents(
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): TeamBuildingEvent[] {
    return this.service.getEvents(tenantId, { status, fromDate, toDate })
  }

  /**
   * GET /api/v1/team-building/events/:id
   * 团建活动事件详情
   */
  @Get('events/:id')
  getEventById(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
  ): TeamBuildingEvent {
    return this.service.getEventById(id, tenantId)
  }

  /**
   * PATCH /api/v1/team-building/events/:id
   * 更新团建活动事件
   */
  @Patch('events/:id')
  updateEvent(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
    @Body() body: Partial<{
      name: string
      eventDate: string
      participants: number
      status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
      participantMemberIds: string[]
      remark: string
    }>,
  ): TeamBuildingEvent {
    return this.service.updateEvent(id, tenantId, body)
  }

  /**
   * POST /api/v1/team-building/events/:id/complete
   * 完成团建活动（记录实际数据）
   */
  @Post('events/:id/complete')
  @HttpCode(HttpStatus.OK)
  completeEvent(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
    @Body() body: {
      actualParticipants: number
      totalSpend: number
      avgSatisfaction: number
      satisfactionBreakdown?: SatisfactionBreakdown
    },
  ): TeamBuildingEvent {
    return this.service.completeEvent(id, tenantId, body)
  }

  /**
   * POST /api/v1/team-building/events/:id/lock
   * 锁定活动设备
   */
  @Post('events/:id/lock')
  @HttpCode(HttpStatus.OK)
  lockEquipment(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
    @Body() body: { items: LockedEquipment[] },
  ): void {
    this.service.lockEquipment(id, tenantId, body.items)
  }

  /**
   * POST /api/v1/team-building/events/:id/unlock
   * 解锁活动设备
   */
  @Post('events/:id/unlock')
  @HttpCode(HttpStatus.OK)
  unlockEquipment(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
  ): void {
    this.service.unlockEquipment(id, tenantId)
  }

  /**
   * POST /api/v1/team-building/events/:id/report
   * 生成团建报告
   */
  @Post('events/:id/report')
  @HttpCode(HttpStatus.CREATED)
  generateReport(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
  ): TeamBuildingReport {
    return this.service.generateReport(id, tenantId)
  }

  /**
   * GET /api/v1/team-building/reports/:id
   * 查看团建报告
   */
  @Get('reports/:id')
  getReport(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
  ): TeamBuildingReport {
    return this.service.getReport(id, tenantId)
  }

  /**
   * POST /api/v1/team-building/events/:id/sync-crm
   * 同步团建数据到CRM
   */
  @Post('events/:id/sync-crm')
  @HttpCode(HttpStatus.OK)
  syncToCrm(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
  ): CrmSyncRecord {
    return this.service.syncToCrm(id, tenantId)
  }

  /**
   * GET /api/v1/team-building/events/:id/sync-status
   * 查看CRM同步状态
   */
  @Get('events/:id/sync-status')
  getSyncStatus(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
  ): CrmSyncRecord | null {
    return this.service.getSyncStatus(id, tenantId)
  }

  /**
   * GET /api/v1/team-building/dashboard
   * 团建月度看板
   */
  @Get('dashboard')
  getDashboard(
    @Headers('x-tenant-id') tenantId: string = 'tenant-001',
    @Query('month') month?: string,
  ): TeamBuildingDashboard {
    return this.service.getDashboard(tenantId, month)
  }
}
