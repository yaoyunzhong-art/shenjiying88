// permission.controller.ts · 权限控制接口
// Phase-FP P0 · 2026-07-03

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
} from '@nestjs/common'
import { PermissionService } from './permission.service'
import {
  PermissionContext,
  ActionType,
  PermissionLevel,
} from './permission.types'

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
          roles: context.roles,
        },
        permissions,
        dataScope,
      },
    }
  }

  // ─── 辅助方法 ────────────────────────────────────────────────────────

  private extractContext(auth: string | undefined): PermissionContext {
    // 简化版 - 实际应从JWT Token解析
    // 这里使用Header中的 x-user-id, x-tenant-id 等

    if (!auth) {
      // 返回匿名上下文
      return {
        userId: 'anonymous',
        tenantId: 'anonymous',
        roles: [],
        permissions: [],
      }
    }

    // 简化解析 - 实际应使用JWT解码
    return {
      userId: 'user_001',
      tenantId: 'tenant-demo',
      brandId: 'brand_001',
      storeId: 'store_001',
      roles: ['TENANT_ADMIN'],
      permissions: ['tenant:*', 'brand:*', 'store:*', 'member:*', 'order:*'],
    }
  }
}
