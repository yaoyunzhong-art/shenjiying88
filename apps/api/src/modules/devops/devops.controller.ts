/**
 * devops.controller.ts — DevOps CI/CD 运维 API
 *
 * 🐜 V17: 模块补齐 — CRUD 增强
 *
 * 端点:
 *   GET    /api/devops/status              — 运维服务状态
 *   GET    /api/devops/pipelines           — 流水线列表
 *   POST   /api/devops/pipelines           — 创建流水线
 *   GET    /api/devops/pipelines/:id       — 流水线详情
 *   PUT    /api/devops/pipelines/:id       — 更新流水线
 *   DELETE /api/devops/pipelines/:id       — 删除流水线
 *   POST   /api/devops/pipelines/:id/trigger — 触发流水线
 *   GET    /api/devops/pipelines/:id/status  — 流水线状态
 *   GET    /api/devops/deployments         — 部署列表
 *   POST   /api/devops/deployments         — 创建部署
 *   GET    /api/devops/deployments/:id     — 部署详情
 *   GET    /api/devops/builds              — 构建列表
 *   POST   /api/devops/builds              — 创建构建
 *   GET    /api/devops/builds/:id          — 构建详情
 *   POST   /api/devops/actions             — 执行运维操作
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { DevopsService } from './devops.service'
import type {
  CreatePipelineDto,
  UpdatePipelineDto,
  PipelineResponse,
  PipelineListResponse,
  CreateDeploymentDto,
  DeploymentResponse,
  DeploymentListResponse,
  CreateBuildJobDto,
  BuildJobResponse,
  BuildJobListResponse,
  ExecuteActionDto,
} from './devops.dto'

@ApiTags('devops')
@Controller('devops')
export class DevopsController {
  constructor(private readonly devopsService: DevopsService) {}

  /** GET /devops/status */
  @Get('status')
  @ApiOperation({ summary: 'DevOps 运维服务状态' })
  getStatus() {
    return this.devopsService.getStatus()
  }

  // ── Pipelines ──

  /** GET /devops/pipelines */
  @Get('pipelines')
  @ApiOperation({ summary: '流水线列表' })
  async listPipelines(): Promise<PipelineListResponse> {
    const items = this.devopsService.listPipelines()
    return { items, total: items.length }
  }

  /** POST /devops/pipelines */
  @Post('pipelines')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建流水线' })
  createPipeline(@Body() body: CreatePipelineDto): PipelineResponse {
    return this.devopsService.createPipeline(body)
  }

  /** GET /devops/pipelines/:id */
  @Get('pipelines/:id')
  @ApiOperation({ summary: '流水线详情' })
  getPipeline(@Param('id') id: string): PipelineResponse {
    return this.devopsService.getPipeline(id)
  }

  /** PUT /devops/pipelines/:id */
  @Put('pipelines/:id')
  @ApiOperation({ summary: '更新流水线' })
  updatePipeline(
    @Param('id') id: string,
    @Body() body: UpdatePipelineDto,
  ): PipelineResponse {
    return this.devopsService.updatePipeline(id, body)
  }

  /** DELETE /devops/pipelines/:id */
  @Delete('pipelines/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除流水线' })
  async deletePipeline(@Param('id') id: string): Promise<void> {
    this.devopsService.deletePipeline(id)
  }

  /** POST /devops/pipelines/:id/trigger */
  @Post('pipelines/:id/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '触发流水线运行' })
  triggerPipeline(@Param('id') id: string): PipelineResponse {
    return this.devopsService.triggerPipeline(id)
  }

  /** GET /devops/pipelines/:id/status */
  @Get('pipelines/:id/status')
  @ApiOperation({ summary: '查询流水线状态' })
  getPipelineStatus(@Param('id') id: string) {
    return this.devopsService.getPipelineStatus(id)
  }

  // ── Deployments ──

  /** GET /devops/deployments */
  @Get('deployments')
  @ApiOperation({ summary: '部署列表' })
  async listDeployments(): Promise<DeploymentListResponse> {
    const items = this.devopsService.listDeployments()
    return { items, total: items.length }
  }

  /** POST /devops/deployments */
  @Post('deployments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建部署' })
  createDeployment(@Body() body: CreateDeploymentDto): DeploymentResponse {
    return this.devopsService.createDeployment(body)
  }

  /** GET /devops/deployments/:id */
  @Get('deployments/:id')
  @ApiOperation({ summary: '部署详情' })
  getDeployment(@Param('id') id: string): DeploymentResponse {
    return this.devopsService.getDeployment(id)
  }

  // ── Build Jobs ──

  /** GET /devops/builds */
  @Get('builds')
  @ApiOperation({ summary: '构建作业列表' })
  async listBuildJobs(): Promise<BuildJobListResponse> {
    const items = this.devopsService.listBuildJobs()
    return { items, total: items.length }
  }

  /** POST /devops/builds */
  @Post('builds')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建构建作业' })
  createBuildJob(@Body() body: CreateBuildJobDto): BuildJobResponse {
    return this.devopsService.createBuildJob(body)
  }

  /** GET /devops/builds/:id */
  @Get('builds/:id')
  @ApiOperation({ summary: '构建作业详情' })
  getBuildJob(@Param('id') id: string): BuildJobResponse {
    return this.devopsService.getBuildJob(id)
  }

  // ── Actions ──

  /** POST /devops/actions */
  @Post('actions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '执行运维操作' })
  executeAction(@Body() body: ExecuteActionDto) {
    return this.devopsService.executeAction(body)
  }
}
