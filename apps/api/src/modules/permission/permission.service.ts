// permission.service.ts · 统一权限控制服务
// Phase-FP P0 · 2026-07-03

import { Injectable, Logger } from '@nestjs/common'
import { RbacService } from './rbac.service'
import { DataScopeService } from './data-scope.service'
import {
  PermissionContext,
  PermissionCheckRequest,
  PermissionCheckResult,
  ActionType,
} from './permission.types'

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name)

  constructor(
    private readonly rbacService: RbacService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * 检查权限
   */
  checkPermission(request: PermissionCheckRequest): PermissionCheckResult {
    const { context, resource, action } = request

    // 1. 检查RBAC权限
    const rbacResult = this.rbacService.checkPermission(context, resource, action)

    if (!rbacResult.allowed) {
      return {
        allowed: false,
        reason: rbacResult.reason,
        requiredPermissions: [`${resource}:${action}`],
        evaluatedAt: Date.now(),
      }
    }

    // 2. 获取数据范围
    const dataScope = this.dataScopeService.getDataScope(context)

    // 3. 检查资源归属 (如果提供了resourceId)
    if (request.resourceId && request.data) {
      const canAccess = this.dataScopeService.canAccessResource(
        context,
        request.data.tenantId || context.tenantId,
        request.data.brandId || context.brandId,
        request.data.storeId || context.storeId,
      )

      if (!canAccess) {
        return {
          allowed: false,
          reason: 'Resource access denied by data scope',
          dataScope,
          evaluatedAt: Date.now(),
        }
      }
    }

    return {
      allowed: true,
      reason: 'Permission granted',
      dataScope,
      evaluatedAt: Date.now(),
    }
  }

  /**
   * 快速权限检查 (仅RBAC)
   */
  quickCheck(context: PermissionContext, resource: string, action: string): boolean {
    return this.rbacService.checkPermission(
      context,
      resource,
      action as ActionType,
    ).allowed
  }

  /**
   * 获取用户有效权限列表
   */
  getUserPermissions(context: PermissionContext): string[] {
    return this.rbacService.resolveUserPermissions(context)
  }

  /**
   * 获取用户数据范围
   */
  getUserDataScope(context: PermissionContext) {
    return this.dataScopeService.getDataScope(context)
  }

  /**
   * 批量检查权限
   */
  batchCheck(requests: PermissionCheckRequest[]): PermissionCheckResult[] {
    return requests.map((req) => this.checkPermission(req))
  }

  /**
   * 获取所有可用角色
   */
  getAllRoles() {
    return this.rbacService.getAllRoles()
  }

  /**
   * 获取所有可用权限
   */
  getAllPermissions() {
    return this.rbacService.getAllPermissions()
  }
}
