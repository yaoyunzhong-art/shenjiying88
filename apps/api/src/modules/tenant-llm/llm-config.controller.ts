/**
 * Phase-35: 智能体接入模块 - LLM配置控制器
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common'
import { TenantLLMService } from './llm-config.service'
// @ts-ignore
import { TenantScopeGuard } from '../../agent/tenant.guard'
import {
  CreateLLMConfigRequest,
  UpdateLLMConfigRequest,
  ApplyLLMConfigRequest,
} from './llm-config.entity'

@Controller('llm')
@UseGuards(TenantScopeGuard)
export class TenantLLMController {
  constructor(private readonly llmService: TenantLLMService) {}

  /**
   * 获取当前站点的所有LLM配置
   */
  @Get('configs')
  async getConfigs(
    @Headers('x-tenant-id') tenantId: string,
    @Query('siteId') siteId?: string
  ) {
    return this.llmService.getConfigs(tenantId, siteId)
  }

  /**
   * 获取单个LLM配置
   */
  @Get('configs/:id')
  async getConfig(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string
  ) {
    const config = await this.llmService.getConfig(id, tenantId)
    if (!config) {
      return { error: '配置不存在' }
    }
    return config
  }

  /**
   * 创建LLM配置
   */
  @Post('configs')
  async createConfig(
    @Headers('x-tenant-id') tenantId: string,
    @Body() request: CreateLLMConfigRequest
  ) {
    return this.llmService.createConfig(tenantId, request)
  }

  /**
   * 更新LLM配置
   */
  @Put('configs/:id')
  async updateConfig(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body() updates: UpdateLLMConfigRequest
  ) {
    return this.llmService.updateConfig(id, tenantId, updates)
  }

  /**
   * 删除LLM配置
   */
  @Delete('configs/:id')
  async deleteConfig(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string
  ) {
    const deleted = await this.llmService.deleteConfig(id, tenantId)
    return { deleted }
  }

  /**
   * 提交接入申请
   */
  @Post('configs/:id/apply')
  async applyConfig(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body() request: ApplyLLMConfigRequest
  ) {
    return this.llmService.applyConfig(id, tenantId, request)
  }

  /**
   * 审批配置（平台管理员）
   */
  @Post('configs/:id/approve')
  async approveConfig(
    @Param('id') id: string,
    @Body() body: {
      approved: boolean
      approvedBy: string
      permissions?: string[]
      actorRole?: string
      reason?: string
    }
  ) {
    return this.llmService.approveConfig(id, body.approvedBy, body.approved, {
      permissions: body.permissions,
      actorRole: body.actorRole,
      reason: body.reason,
    })
  }

  /**
   * 获取调用统计
   */
  @Get('stats')
  async getStats(
    @Headers('x-tenant-id') tenantId: string,
    @Query('configId') configId?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string
  ) {
    return this.llmService.getStats(tenantId, configId, periodStart, periodEnd)
  }

  /**
   * 获取调用日志
   */
  @Get('logs')
  async getCallLogs(
    @Headers('x-tenant-id') tenantId: string,
    @Query('configId') configId?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string
  ) {
    return this.llmService.getCallLogs(tenantId, configId, periodStart, periodEnd)
  }

  /**
   * 获取审批与治理审计日志
   */
  @Get('audit-logs')
  async getAuditLogs(
    @Headers('x-tenant-id') tenantId: string,
    @Query('configId') configId?: string
  ) {
    return this.llmService.getAuditLogs(tenantId, configId)
  }
}
