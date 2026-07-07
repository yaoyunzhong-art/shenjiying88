// PermissionModule · Phase-FP 全端标准化 P0
// 创建: 2026-07-03
// 状态: IMPLEMENTED
// 职责: 统一权限控制服务 - RBAC/ABAC权限校验

import { Module } from '@nestjs/common'
import { PermissionController } from './permission.controller'
import { PermissionService } from './permission.service'
import { RbacService } from './rbac.service'
import { DataScopeService } from './data-scope.service'

@Module({
  controllers: [PermissionController],
  providers: [
    PermissionService,
    RbacService,
    DataScopeService,
  ],
  exports: [
    PermissionService,
    RbacService,
    DataScopeService,
  ],
})
export class PermissionModule {}
