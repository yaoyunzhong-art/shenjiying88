// rbac.controller.ts · RBAC 权限管理接口
// 2026-07-06 · 5级权限体系：assign/revoke/check/report

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common'
import { RBACService, Role, Permission, RBACAuthorizationError } from './rbac.service'
import {
  AssignRoleDto,
  RevokeRoleDto,
  CheckPermissionDto,
  RegisterPolicyDto,
  RegisterProtectedActionDto,
} from './rbac.dto'

@Controller('rbac')
export class RBACController {
  constructor(private readonly rbacService: RBACService) {}

  /**
   * POST /rbac/assign
   * 为用户分配角色
   */
  @Post('assign')
  @HttpCode(HttpStatus.OK)
  async assignRole(@Body() body: AssignRoleDto) {
    try {
      const assignment = this.rbacService.assignRole(
        body.userId,
        body.role as Role,
        body.tenantId,
        body.assignedBy || 'api',
      )
      return {
        success: true,
        data: {
          userId: assignment.userId,
          role: assignment.role,
          tenantId: assignment.tenantId,
          assignedAt: assignment.assignedAt,
          assignedBy: assignment.assignedBy,
        },
      }
    } catch (error) {
      if (error instanceof RBACAuthorizationError) {
        throw new BadRequestException(error.message)
      }
      throw new InternalServerErrorException('Failed to assign role')
    }
  }

  /**
   * POST /rbac/revoke
   * 撤销用户角色
   */
  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  async revokeRole(@Body() body: RevokeRoleDto) {
    try {
      this.rbacService.revokeRole(body.userId, body.tenantId)
      return {
        success: true,
        message: body.tenantId
          ? `Role revoked for user ${body.userId} in tenant ${body.tenantId}`
          : `Global role revoked for user ${body.userId}`,
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to revoke role')
    }
  }

  /**
   * GET /rbac/roles/:userId
   * 查询用户的角色分配
   */
  @Get('roles/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserRoles(@Param('userId') userId: string) {
    const roles = this.rbacService.getUserRoles(userId)
    return {
      success: true,
      data: roles.map((r) => ({
        userId: r.userId,
        role: r.role,
        tenantId: r.tenantId,
        assignedAt: r.assignedAt,
        assignedBy: r.assignedBy,
      })),
    }
  }

  /**
   * POST /rbac/check
   * 检查用户是否有某权限
   */
  @Post('check')
  @HttpCode(HttpStatus.OK)
  async checkPermission(@Body() body: CheckPermissionDto) {
    const allowed = this.rbacService.checkPermission(
      body.userId,
      body.permission as Permission,
      body.tenantId,
    )
    return {
      success: true,
      data: {
        allowed,
        reason: allowed ? undefined : `Permission '${body.permission}' denied`,
      },
    }
  }

  /**
   * POST /rbac/authorize
   * 验证权限，无权限时返回错误而非抛出异常
   */
  @Post('authorize')
  @HttpCode(HttpStatus.OK)
  async authorize(@Body() body: CheckPermissionDto) {
    try {
      this.rbacService.authorize(body.userId, body.permission as Permission, body.tenantId)
      return {
        success: true,
        data: { authorized: true },
      }
    } catch (error) {
      if (error instanceof RBACAuthorizationError) {
        throw new BadRequestException(error.message)
      }
      throw new InternalServerErrorException('Authorization check failed')
    }
  }

  /**
   * GET /rbac/report/:userId
   * 获取用户权限报告
   */
  @Get('report/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserReport(@Param('userId') userId: string) {
    const report = this.rbacService.getUserPermissionReport(userId)
    return {
      success: true,
      data: {
        roles: report.roles.map((r) => ({
          userId: r.userId,
          role: r.role,
          tenantId: r.tenantId,
          assignedAt: r.assignedAt,
          assignedBy: r.assignedBy,
        })),
        effectivePermissions: report.effectivePermissions,
        deniedPermissions: report.deniedPermissions,
      },
    }
  }

  /**
   * GET /rbac/permissions/:role
   * 获取角色的所有权限
   */
  @Get('permissions/:role')
  @HttpCode(HttpStatus.OK)
  async getRolePermissions(@Param('role') role: string) {
    const validRoles: Role[] = ['owner', 'admin', 'manager', 'staff', 'guest']
    if (!validRoles.includes(role as Role)) {
      throw new BadRequestException(
        `Invalid role '${role}'. Must be one of: ${validRoles.join(', ')}`,
      )
    }
    const permissions = this.rbacService.getRolePermissions(role as Role)
    const hasPerm = (perm: Permission) => this.rbacService.hasPermission(role as Role, perm)
    return {
      success: true,
      data: {
        role,
        permissions,
        permissionCount: permissions.length,
      },
    }
  }

  /**
   * POST /rbac/policy
   * 注册自定义角色策略
   */
  @Post('policy')
  @HttpCode(HttpStatus.OK)
  async registerPolicy(@Body() body: RegisterPolicyDto) {
    try {
      this.rbacService.registerPolicy({
        role: body.role as Role,
        permissions: body.permissions as Permission[],
        deniedPermissions: body.deniedPermissions as Permission[] | undefined,
      })
      return {
        success: true,
        message: `Policy registered for role '${body.role}'`,
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to register policy')
    }
  }

  /**
   * POST /rbac/protected-actions
   * 注册 Controller 受保护动作
   */
  @Post('protected-actions')
  @HttpCode(HttpStatus.OK)
  async registerProtectedActions(@Body() body: RegisterProtectedActionDto) {
    try {
      this.rbacService.registerProtectedActions(
        body.controllerName,
        body.actions as Record<string, Permission[]>,
      )
      return {
        success: true,
        message: `Protected actions registered for '${body.controllerName}'`,
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to register protected actions')
    }
  }

  /**
   * GET /rbac/protected-actions/:controllerName
   * 获取 Controller 受保护动作
   */
  @Get('protected-actions/:controllerName')
  @HttpCode(HttpStatus.OK)
  async getProtectedActions(@Param('controllerName') controllerName: string) {
    const actions = this.rbacService.getProtectedActions(controllerName)
    const result: Record<string, Permission[]> = {}
    for (const [method, perms] of actions) {
      result[method] = perms
    }
    return {
      success: true,
      data: {
        controllerName,
        actions: result,
      },
    }
  }
}
