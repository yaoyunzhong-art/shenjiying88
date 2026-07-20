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
}
