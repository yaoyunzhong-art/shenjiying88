/**
 * empower-card.module.ts — 赋能卡片模块 (ADR-045)
 * 不依赖 Prisma，直接使用 pg-pool
 */

import { Module } from '@nestjs/common'
import { EmpowerCardController } from './empower-card.controller'
import { EmpowerCardService } from './empower-card.service'

@Module({
  controllers: [EmpowerCardController],
  providers: [EmpowerCardService],
  exports: [EmpowerCardService],
})
export class EmpowerCardModule {}
