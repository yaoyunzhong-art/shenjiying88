/**
 * rls.module.ts — RLS 模块
 *
 * 🐜 V17: P-31 RLS Extension
 *
 * 提供 RLS 策略管理功能：状态查询、启用、策略创建、隔离验证。
 */

import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { RlsController } from './rls.controller'
import { RlsService } from './rls.helper'

@Module({
  imports: [PrismaModule],
  controllers: [RlsController],
  providers: [RlsService],
  exports: [RlsService],
})
export class RlsModule {}
