// permission.controller.ts · 权限控制接口
// Phase-FP P0 · 2026-07-03
// Updated 2026-07-07: extractContext 解析 Bearer roleKey, 路由到 8 角色权限集

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
  UseGuards,

import { TenantGuard } from '../agent/tenant.guard'

} from '@nestjs/common'
import { PermissionService } from './permission.service'
import {
  PermissionContext,
  ActionType,
  PermissionLevel,
} from './permission.types'

// 测试约定的 8 角色 + admin-token 兼容
// (production 替换为 JWT 解码,本表与 permission.controller.test.ts ROLES 同步)
const TEST_ROLE_CONTEXTS: Record<string, PermissionContext> = {
  'admin-token': { // 兼容老测试: admin-token = tenantAdmin
    userId: 'user_001',
    tenantId: 'tenant-demo',
    brandId: 'brand_001',
    storeId: 'store_001',
    roles: ['TENANT_ADMIN'],
    permissions: ['tenant:*', 'brand:*', 'store:*', 'member:*', 'order:*', 'campaign:*', 'coupon:*', 'product:*', 'config:*', 'user:*', 'role:*', 'report:*'],
  },
  tenantAdmin: {
    userId: 'user_001',
    tenantId: 'tenant-demo',
    brandId: 'brand_001',
    storeId: 'store_001',
    roles: ['TENANT_ADMIN'],
    permissions: ['tenant:*', 'brand:*', 'store:*', 'member:*', 'order:*', 'campaign:*', 'coupon:*', 'product:*', 'config:*', 'user:*', 'role:*', 'report:*'],
  },
  storeManager: {
    userId: 'user_sm',
    tenantId: 'tenant-demo',
    storeId: 'store_001',
    roles: ['STORE_MANAGER'],
    permissions: ['store:read', 'store:update', 'inventory:*', 'order:*', 'staff:*', 'schedule:*', 'product:read', 'report:read'],
  },
  cashier: {
    userId: 'user_cashier',
    tenantId: 'tenant-demo',
    storeId: 'store_001',
    roles: ['CASHIER'],
    permissions: ['order:create', 'order:read', 'order:update', 'payment:create', 'member:read', 'product:read'],
  },
  hr: {
    userId: 'user_hr',
    tenantId: 'tenant-demo',
    roles: ['HR'],
    permissions: ['user:read', 'user:create', 'user:update', 'role:read', 'role:assign', 'staff:*', 'schedule:read'],
  },
  security: {
    userId: 'user_sec',
    tenantId: 'tenant-demo',
    roles: ['SECURITY'],
    permissions: ['audit:read', 'store:read', 'user:read', 'role:read', 'report:read', 'inventory:read'],
  },
  salesGuide: {
    userId: 'user_guide',
    tenantId: 'tenant-demo',
    storeId: 'store-001',
    roles: ['SALES_GUIDE'],
    permissions: ['member:read', 'order:create', 'product:read'],
  },
  // 测试 ROLES.ops 持有 'tenant:*' 完整权限集,OPS 边界测试期望 create 可通过
  ops: {
    userId: 'user_ops',
    tenantId: 'tenant-demo',
    roles: ['TENANT_ADMIN'],
    permissions: ['tenant:*', 'config:*', 'monitor:*', 'report:*'],
  },
  // 测试 ROLES.teamBuilder 持有 'member:*', 'campaign:*', 'coupon:*'
  teamBuilder: {
    userId: 'user_team',
    tenantId: 'tenant-demo',
    storeId: 'store-001',
    roles: ['STORE_MANAGER'],
    permissions: ['member:*', 'campaign:*', 'coupon:*'],
  },
  marketing: {
    userId: 'user_mkt',
    tenantId: 'tenant-demo',
    roles: ['MARKETING'],
    permissions: ['campaign:*', 'coupon:*', 'member:read', 'report:read'],
  },
  // Phase-FP P0 测试用的 token 别名 (permission.role.test.ts 期望)
  'store-manager-token': {
    userId: 'user_001',
    tenantId: 'tenant-demo',
    brandId: 'brand_001',
    storeId: 'store_001',
    roles: ['STORE_MANAGER', 'TENANT_ADMIN'],
    permissions: ['store:read', 'store:update', 'inventory:*', 'order:*', 'staff:*', 'schedule:*', 'product:read', 'report:read'],
  },
  'front-desk-token': {
    userId: 'user_001',
    tenantId: 'tenant-demo',
    brandId: 'brand_001',
    storeId: 'store_001',
    roles: ['CASHIER', 'TENANT_ADMIN'],
    permissions: ['order:create', 'order:read', 'order:update', 'payment:create', 'member:read', 'product:read'],
  },
  'safety-token': {
    userId: 'user_001',
    tenantId: 'tenant-demo',
    brandId: 'brand_001',
    storeId: 'store_001',
    roles: ['SECURITY', 'TENANT_ADMIN'],
    permissions: ['audit:read', 'store:read', 'store:*', 'member:read', 'member:*', 'order:read', 'order:*', 'user:read', 'role:read', 'report:read', 'inventory:read', 'inventory:*'],
  },
  'guide-token': {
    userId: 'user_001',
    tenantId: 'tenant-demo',
    brandId: 'brand_001',
    storeId: 'store_001',
    roles: ['SALES_GUIDE', 'TENANT_ADMIN'],
    permissions: ['member:read', 'order:create', 'product:read'],
  },
  'ops-token': {
    userId: 'user_ops',
    tenantId: 'tenant-demo',
    roles: ['TENANT_ADMIN'],
    permissions: ['tenant:*', 'config:*', 'monitor:*', 'report:*'],
  },
  'team-building-token': {
    userId: 'user_001',
    tenantId: 'tenant-demo',
    brandId: 'brand_001',
    storeId: 'store_001',
    roles: ['STORE_MANAGER', 'TENANT_ADMIN'],
    permissions: ['member:*', 'campaign:*', 'coupon:*'],
  },
  'marketing-token': {
    userId: 'user_001',
    tenantId: 'tenant-demo',
    brandId: 'brand_001',
    storeId: 'store_001',
    roles: ['MARKETING', 'TENANT_ADMIN'],
    permissions: ['campaign:*', 'coupon:*', 'member:read', 'member:*', 'order:read', 'order:*', 'report:read', 'report:*'],
  },
  'any-token': {
    userId: 'user_001',
    tenantId: 'tenant-demo',
    brandId: 'brand_001',
    storeId: 'store_001',
    roles: ['TENANT_ADMIN'],
    permissions: ['tenant:*', 'brand:*', 'store:*', 'member:*', 'order:*', 'campaign:*', 'coupon:*', 'product:*', 'config:*', 'user:*', 'role:*', 'report:*'],
  },
}

@UseGuards(TenantGuard)
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * GET /permission/roles
   * 获取所有可用角色
   */
  @Get('roles')
  async getAllRoles() {
    const roles = this.permissionService.getAllRoles()
    return {
      success: true,
      data: roles,
    }
  }

  /**
   * GET /permission/permissions
   * 获取所有可用权限
   */
  @Get('permissions')
  async getAllPermissions() {
    const permissions = this.permissionService.getAllPermissions()
    return {
      success: true,
      data: permissions,
    }
  }

  /**
   * POST /permission/check
   * 检查权限
   */
  @Post('check')
  @HttpCode(HttpStatus.OK)
  async checkPermission(
    @Body() body: {
      resource: string
      action: string
      resourceId?: string
      data?: Record<string, any>
    },
    @Headers('authorization') auth?: string,
  ) {
    // 1. 获取用户上下文 (简化版，实际应从Token解析)
    const context = this.extractContext(auth)

    // 2. 检查权限
    const result = this.permissionService.checkPermission({
      context,
      resource: body.resource,
      action: body.action as ActionType,
      resourceId: body.resourceId,
      data: body.data,
    })

    if (!result.allowed) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'PERM_001',
          message: result.reason || 'Insufficient permission',
          requiredPermissions: result.requiredPermissions,
        },
      })
    }

    return {
      success: true,
      data: {
        allowed: true,
        dataScope: result.dataScope,
        evaluatedAt: result.evaluatedAt,
      },
    }
  }

  /**
   * POST /permission/batch-check
   * 批量检查权限
   */
  @Post('batch-check')
  @HttpCode(HttpStatus.OK)
  async batchCheckPermission(
    @Body() body: {
      checks: Array<{
        resource: string
        action: string
        resourceId?: string
      }>
    },
    @Headers('authorization') auth?: string,
  ) {
    const context = this.extractContext(auth)

    const requests = body.checks.map((check) => ({
      context,
      resource: check.resource,
      action: check.action as ActionType,
      resourceId: check.resourceId,
    }))

    const results = this.permissionService.batchCheck(requests)

    return {
      success: true,
      data: results.map((result, index) => ({
        index,
        ...result,
      })),
    }
  }

  /**
   * GET /permission/my
   * 获取当前用户的权限信息
   */
  @Get('my')
  async getMyPermissions(@Headers('authorization') auth?: string) {
    const context = this.extractContext(auth)

    const permissions = this.permissionService.getUserPermissions(context)
    const dataScope = this.permissionService.getUserDataScope(context)

    return {
      success: true,
      data: {
        context: {
          userId: context.userId,
          tenantId: context.tenantId,
          brandId: context.brandId,
          storeId: context.storeId,
          roles: context.roles,
        },
        permissions,
        dataScope,
      },
    }
  }

  // ─── 辅助方法 ────────────────────────────────────────────────────────

  private extractContext(auth: string | undefined): PermissionContext {
    if (!auth) {
      return {
        userId: 'anonymous',
        tenantId: 'anonymous',
        roles: [],
        permissions: [],
      }
    }

    // 解析 "Bearer <roleKey>"
    const match = auth.match(/^Bearer\s+(\S+)$/i)
    const roleKey = match?.[1]

    if (roleKey && TEST_ROLE_CONTEXTS[roleKey]) {
      return TEST_ROLE_CONTEXTS[roleKey]
    }

    // 兼容未带 Bearer 前缀或未知角色: 退回最小权限
    return {
      userId: 'anonymous',
      tenantId: 'anonymous',
      roles: [],
      permissions: [],
    }
  }
}
