/**
 * audit.module.ts - 审计日志模块
 * 用途: 全链路审计追踪模块定义
 */

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuditLogEntity } from './audit.entity'
import { AuditService } from './audit.service'
import { AuditController } from './audit.controller'

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
