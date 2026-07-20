/**
 * rls.controller.ts — RLS API 端点
 *
 * 🐜 V18: CRUD增强 + 3项租户隔离增强端点
 *   - 完整CRUD: GET/POST/PUT/DELETE policy
 *   - 隔离增强: 连接池 / verifyTenant / 审计日志
 *
 * 🐜 V17: P-31 RLS Extension
 *
 * 端点:
 *   GET    /api/rls/status         — 查询 RLS 状态
 *   POST   /api/rls/enable         — 为指定表启用 RLS
 *   POST   /api/rls/policy         — 创建 tenantId 过滤策略
 *   POST   /api/rls/verify         — 验证 tenantId 过滤
 *   POST   /api/rls/setup          — 一键设置 RLS + 策略 + Force
 *   GET    /api/rls/policy         — 查询指定策略详情
 *   GET    /api/rls/policies       — 列出指定表所有策略
 *   PUT    /api/rls/policy         — 更新指定策略
 *   DELETE /api/rls/policy         — 删除指定策略
 *   POST   /api/rls/pool/init      — 初始化租户连接池
 *   POST   /api/rls/verify/access  — 验证用户-租户访问权限
 *   GET    /api/rls/audit          — 查询租户审计日志
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { RlsService } from './rls.helper'
import {
  CreatePolicyDto,
  DeletePolicyDto,
  EnableRlsDto,
  GetAuditLogDto,
  GetPolicyDto,
  InitPoolDto,
  ListPoliciesDto,
  RlsStatusQueryDto,
  SetupIsolationDto,
  UpdatePolicyDto,
  VerifyAccessDto,
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
   * GET /api/rls/policy
   * 查询指定策略详情。
   */
  @Get('policy')
  async getPolicy(@Query() query: GetPolicyDto) {
    const policy = await this.rlsService.getPolicy(
      query.tableName,
      query.policyName,
      query.schema,
    )
    if (!policy) {
      return {
        success: false,
        message: `Policy "${query.policyName}" not found on "${query.tableName}"`,
        data: null,
      }
    }
    return {
      success: true,
      data: policy,
    }
  }

  /**
   * GET /api/rls/policies
   * 列出指定表的所有策略。
   */
  @Get('policies')
  async listPolicies(@Query() query: ListPoliciesDto) {
    const policies = await this.rlsService.listPolicies(
      query.tableName,
      query.schema,
    )
    return {
      success: true,
      data: {
        tableName: query.tableName,
        policies,
        total: policies.length,
      },
    }
  }

  /**
   * PUT /api/rls/policy
   * 更新指定策略（修改隔离列或重建）。
   */
  @Put('policy')
  @HttpCode(HttpStatus.OK)
  async updatePolicy(@Body() body: UpdatePolicyDto) {
    await this.rlsService.updatePolicy(
      body.tableName,
      body.policyName,
      body.tenantColumn,
      body.schema,
    )
    return {
      success: true,
      message: `Policy "${body.policyName}" updated on "${body.tableName}"`,
      data: {
        tableName: body.tableName,
        policyName: body.policyName,
        tenantColumn: body.tenantColumn ?? 'tenantId',
        schema: body.schema ?? 'public',
      },
    }
  }

  /**
   * DELETE /api/rls/policy
   * 删除指定策略。
   */
  @Delete('policy')
  @HttpCode(HttpStatus.OK)
  async deletePolicy(@Body() body: DeletePolicyDto) {
    await this.rlsService.deletePolicy(
      body.tableName,
      body.policyName,
      body.schema,
    )
    return {
      success: true,
      message: `Policy "${body.policyName}" deleted from "${body.tableName}"`,
      data: {
        tableName: body.tableName,
        policyName: body.policyName,
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

  // ─── V18: 3项租户隔离增强 ─────────────────────────────────

  /**
   * POST /api/rls/pool/init
   * 初始化指定 tenant 的连接池。
   * 隔离增强a: 连接池隔离(per-tenant connection pool)。
   */
  @Post('pool/init')
  @HttpCode(HttpStatus.OK)
  async initTenantPool(@Body() body: InitPoolDto) {
    this.rlsService.initTenantPool(body.tenantId)
    const snapshot = this.rlsService.getTenantPoolSnapshot()
    const poolEntry = snapshot.find((e) => e.tenantId === body.tenantId)
    return {
      success: true,
      message: `Connection pool initialized for tenant "${body.tenantId}"`,
      data: poolEntry ?? { tenantId: body.tenantId },
    }
  }

  /**
   * POST /api/rls/verify/access
   * 验证用户是否有权限访问指定 tenant。
   * 隔离增强b: verifyTenant 中间件逻辑。
   */
  @Post('verify/access')
  @HttpCode(HttpStatus.OK)
  async verifyTenantAccess(@Body() body: VerifyAccessDto) {
    const result = await this.rlsService.verifyTenantAccess(
      body.tenantId,
      body.userId,
    )
    return {
      success: true,
      data: {
        allowed: result.allowed,
        tenantId: result.tenantId,
        reason: result.reason,
      },
    }
  }

  /**
   * GET /api/rls/audit
   * 查询租户审计日志。
   * 隔离增强c: 租户审计索引（操作日志记录）。
   */
  @Get('audit')
  async getAuditLogs(@Query() query: GetAuditLogDto) {
    const logs = this.rlsService.getAuditLogs(query.tenantId, query.limit)
    return {
      success: true,
      data: {
        logs,
        total: logs.length,
        tenantId: query.tenantId ?? null,
      },
    }
  }

  // ─── V19: 多租户集成示例 ───────────────────────────────────

  /**
   * POST /api/rls/tenant/context
   * 多租户集成示例: 设置租户上下文并执行隔离查询。
   * 演示 DAO/Repository 中 tenantId 透传的标准模式。
   *
   * 请求示例:
   *   {
   *     "tenantId": "t-store-a",
   *     "tableName": "members"
   *   }
   *
   * 响应:
   *   {
   *     "success": true,
   *     "data": {
   *       "tenantId": "t-store-a",
   *       "contextSet": true,
   *       "tenantFilter": "\"tenantId\" = 't-store-a'",
   *       "pools": [ ... ]
   *     }
   *   }
   */
  @Post('tenant/context')
  @HttpCode(HttpStatus.OK)
  async setTenantContext(
    @Body() body: { tenantId: string; tableName?: string }
  ) {
    const { tenantId, tableName } = body
    if (!tenantId) {
      return {
        success: false,
        message: 'tenantId is required',
      }
    }

    // 1. 设置租户上下文
    await this.rlsService.setTenantContext(tenantId)

    // 2. 构建 tenantId 过滤条件（供 DAO/Repository 使用）
    const tenantFilter = this.rlsService.buildTenantFilter(tenantId)
    const tenantFilterWithAlias = this.rlsService.buildTenantFilter(tenantId, 't')

    // 3. 初始化/刷新租户连接池追踪
    this.rlsService.initTenantPool(tenantId)
    const pools = this.rlsService.getTenantPoolSnapshot()

    // 4. 审计记录
    await this.rlsService.logAudit(
      tenantId,
      'TENANT_CONTEXT_SET',
      tableName ?? '*',
      null,
      `Tenant context set via API demo endpoint`
    )

    return {
      success: true,
      data: {
        tenantId,
        contextSet: true,
        tenantFilter,
        tenantFilterWithAlias,
        poolActive: true,
        pools,
      },
    }
  }

  /**
   * GET /api/rls/tenant/pools
   * 查看所有活跃的租户连接池（观测性端点）。
   */
  @Get('tenant/pools')
  async getTenantPools() {
    const pools = this.rlsService.getTenantPoolSnapshot()
    return {
      success: true,
      data: {
        pools,
        total: pools.length,
      },
    }
  }

  /**
   * DELETE /api/rls/tenant/pool
   * 释放指定租户的连接池。
   */
  @Delete('tenant/pool')
  @HttpCode(HttpStatus.OK)
  async releaseTenantPool(@Body() body: { tenantId: string }) {
    const released = this.rlsService.releaseTenantPool(body.tenantId)
    return {
      success: released,
      message: released
        ? `Pool released for tenant "${body.tenantId}"`
        : `No pool found for tenant "${body.tenantId}"`,
      data: { tenantId: body.tenantId, released },
    }
  }
}
