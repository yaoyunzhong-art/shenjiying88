import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { toCollabProjectContract } from './collab.contract'
import { CreateCollabProjectDto, UpdateCollabProjectDto, CollabProjectFilterDto } from './collab.dto'
import { CollabStatus } from './collab.entity'
import { CollabService } from './collab.service'

@UseGuards(TenantGuard)
@Controller('collab-projects')
export class CollabController {
  constructor(private readonly collabService: CollabService) {}

  @Post()
  create(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateCollabProjectDto
  ) {
    const project = this.collabService.create({
      tenantContext,
      name: body.name,
      brandId: body.brandId,
      brandName: body.brandName,
      startDate: body.startDate,
      endDate: body.endDate,
      revenueShareRate: body.revenueShareRate,
      budget: body.budget,
      description: body.description,
    })
    return toCollabProjectContract(project)
  }

  @Get()
  findAll(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() filter?: CollabProjectFilterDto
  ) {
    const projects = this.collabService.findAll(tenantContext.tenantId, filter)
    return projects.map((p) => toCollabProjectContract(p))
  }

  @Get('count-by-status')
  countByStatus(@TenantContext() tenantContext: RequestTenantContext) {
    return this.collabService.countByStatus(tenantContext.tenantId)
  }

  @Get(':projectId')
  findById(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('projectId') projectId: string
  ) {
    const project = this.collabService.findById(projectId, tenantContext.tenantId)
    return project ? toCollabProjectContract(project) : null
  }

  @Patch(':projectId')
  update(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('projectId') projectId: string,
    @Body() body: UpdateCollabProjectDto
  ) {
    const project = this.collabService.update(projectId, tenantContext.tenantId, {
      name: body.name,
      brandId: body.brandId,
      brandName: body.brandName,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status,
      revenueShareRate: body.revenueShareRate,
      budget: body.budget,
      description: body.description,
    })
    return toCollabProjectContract(project)
  }

  @Patch(':projectId/status')
  updateStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('projectId') projectId: string,
    @Body('status') status: CollabStatus
  ) {
    const project = this.collabService.update(projectId, tenantContext.tenantId, { status })
    return toCollabProjectContract(project)
  }

  @Delete(':projectId')
  delete(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('projectId') projectId: string
  ) {
    this.collabService.delete(projectId, tenantContext.tenantId)
    return { success: true, projectId }
  }
}
