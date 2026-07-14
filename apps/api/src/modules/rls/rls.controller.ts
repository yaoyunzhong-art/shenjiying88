/**
 * rls.controller.ts — RLS API 端点
 *
 * 🐜 V17: P-31 RLS Extension
 *
 * 端点:
 *   GET    /api/rls/status      — 查询 RLS 状态
 *   POST   /api/rls/enable      — 为指定表启用 RLS
 *   POST   /api/rls/policy      — 创建 tenantId 过滤策略
 *   POST   /api/rls/verify      — 验证 tenantId 过滤
 *   POST   /api/rls/setup       — 一键设置 RLS + 策略 + Force
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { RlsService } from './rls.helper'
import {
  CreatePolicyDto,
  EnableRlsDto,
  RlsStatusQueryDto,
  SetupIsolationDto,
  VerifyFilterDto,
} from './rls.dto'

@Controller('api/rls')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class RlsController {
  constructor(private readonly rlsService: RlsService) {}

  /**
   * GET /api/rls/status
   * 查询 RLS 启用状态。可选 query.table 指定表名。
   */
  @Get('status')
  async getStatus(@Query() query: RlsStatusQueryDto) {
    const tables = await this.rlsService.getStatus(query.table)
    return {
      success: true,
      data: {
        tables,
        total: tables.length,
      },
    }
  }

  /**
   * POST /api/rls/enable
   * 为指定表启用 RLS（ALTER TABLE ... ENABLE ROW LEVEL SECURITY）。
   */
  @Post('enable')
  @HttpCode(HttpStatus.OK)
  async enableRls(@Body() body: EnableRlsDto) {
    await this.rlsService.enableRls(body.tableName)
    return {
      success: true,
      message: `RLS enabled on "${body.tableName}"`,
      data: { tableName: body.tableName, rlsEnabled: true },
    }
  }

  /**
   * POST /api/rls/policy
   * 为指定表创建 tenantId 隔离策略。
   */
  @Post('policy')
  @HttpCode(HttpStatus.OK)
  async createPolicy(@Body() body: CreatePolicyDto) {
    await this.rlsService.createPolicy(
      body.tableName,
      body.policyName,
      body.tenantColumn,
      body.schema,
    )
    const policyName = body.policyName ?? 'tenant_isolation'
    return {
      success: true,
      message: `Policy "${policyName}" created on "${body.tableName}"`,
      data: {
        tableName: body.tableName,
        policyName,
        tenantColumn: body.tenantColumn ?? 'tenantId',
        schema: body.schema ?? 'public',
      },
    }
  }

  /**
   * POST /api/rls/verify
   * 验证 tenantId 过滤：返回其他 tenant 的数据行数（0 表示隔离正确）。
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyFilter(@Body() body: VerifyFilterDto) {
    const result = await this.rlsService.verifyTenantFilter(
      body.tableName,
      body.tenantId,
      body.tenantColumn,
      body.schema,
    )
    const isolated = result.leakedRows === 0
    return {
      success: true,
      data: {
        tableName: body.tableName,
        tenantId: body.tenantId,
        leakedRows: result.leakedRows,
        isolated,
      },
    }
  }

  /**
   * POST /api/rls/setup
   * 一键设置：启用 RLS + 创建策略 + 强制 RLS。
   */
  @Post('setup')
  @HttpCode(HttpStatus.OK)
  async setupIsolation(@Body() body: SetupIsolationDto) {
    const result = await this.rlsService.setupTenantIsolation(
      body.tableName,
      body.tenantColumn,
      body.policyName,
      body.schema,
    )
    return {
      success: true,
      message: `Tenant isolation fully configured on "${body.tableName}"`,
      data: {
        tableName: body.tableName,
        ...result,
      },
    }
  }
}
