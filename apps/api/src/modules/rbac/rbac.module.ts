// RBACModule · 5级权限体系
// 2026-07-06
// 职责: 基于角色的访问控制，权限继承，多租户支持

import { Module } from '@nestjs/common'
import { RBACController } from './rbac.controller'
import { RBACService } from './rbac.service'

@Module({
  controllers: [RBACController],
  providers: [RBACService],
  exports: [RBACService],
})
export class RBACModule {}
