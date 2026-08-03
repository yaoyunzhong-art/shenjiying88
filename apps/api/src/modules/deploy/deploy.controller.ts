// deploy.controller.ts - 部署模块 REST 控制器
import { Controller, Post, Get, Body, Param, UsePipes, ValidationPipe, HttpCode, HttpStatus, NotFoundException, UseGuards } from '@nestjs/common'
import { DeployService } from './deploy.service'
import { GeneratePlanDto, DeployPlanDto, ServerSpecDto, CostQueryDto, ResourceQueryDto } from './deploy.dto'
import type { DeploymentPlan, MonthlyCost, DeploymentQuote, PreflightCheckResult, ResourceSpec } from './deploy.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('deploy')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class DeployController {
  constructor(private readonly deployService: DeployService) {}

  /** 生成部署方案 */
  @Post('plan')
  @HttpCode(HttpStatus.OK)
  generatePlan(@Body() body: GeneratePlanDto): DeploymentPlan {
    return this.deployService.generatePlan(body.mode, body.size, body.options)
  }

  /** 获取部署方案详情 */
  @Get('plan/:planId')
  getPlan(@Param('planId') planId: string): DeploymentPlan {
    const plan = this.deployService.getPlan(planId)
    if (!plan) {
      throw new NotFoundException(`部署方案 ${planId} 不存在`)
    }
    return plan
  }

  /** 部署前检查（飞前检查） */
  @Post('preflight')
  @HttpCode(HttpStatus.OK)
  preflightCheck(@Body() spec: ServerSpecDto): PreflightCheckResult {
    return this.deployService.preflightCheck({
      cpu: spec.cpu,
      memory: spec.memory,
      storage: spec.storage,
      os: spec.os,
      privateNetwork: spec.privateNetwork ?? true,
      publicIP: spec.publicIP ?? true,
    })
  }

  /** 计算资源规格 */
  @Post('resources')
  @HttpCode(HttpStatus.OK)
  calculateResources(@Body() query: ResourceQueryDto): ResourceSpec {
    return this.deployService.calculateResources(query.size, query.mode)
  }

  /** 执行部署 */
  @Post('plan/:planId/deploy')
  @HttpCode(HttpStatus.OK)
  async deploy(@Param('planId') planId: string): Promise<{ status: string }> {
    const status = await this.deployService.deploy(planId)
    return { status }
  }

  /** 停止部署 */
  @Post('plan/:planId/stop')
  @HttpCode(HttpStatus.OK)
  async stop(@Param('planId') planId: string): Promise<{ status: string }> {
    await this.deployService.stop(planId)
    return { status: this.deployService.getStatus(planId) }
  }

  /** 回滚部署 */
  @Post('plan/:planId/rollback')
  @HttpCode(HttpStatus.OK)
  async rollback(@Param('planId') planId: string): Promise<{ status: string }> {
    await this.deployService.rollback(planId)
    return { status: this.deployService.getStatus(planId) }
  }

  /** 获取部署状态 */
  @Get('plan/:planId/status')
  getStatus(@Param('planId') planId: string): { planId: string; status: string } {
    return { planId, status: this.deployService.getStatus(planId) }
  }

  /** 估算月度成本 */
  @Post('cost')
  @HttpCode(HttpStatus.OK)
  estimateMonthlyCost(@Body() query: CostQueryDto): MonthlyCost {
    return this.deployService.estimateMonthlyCost(query.size, query.mode)
  }

  /** 生成报价单 */
  @Post('quote')
  @HttpCode(HttpStatus.OK)
  generateQuote(@Body() query: CostQueryDto): DeploymentQuote {
    return this.deployService.generateQuote(query.size, query.mode)
  }
}
