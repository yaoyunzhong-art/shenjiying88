/**
 * 付费授权 - Module (V9 需求 2 · V10 Day 17 Phase 88)
 *
 * 集成:
 * - TypeORM 实体 (License + LicenseAuditLog)
 * - Repository 层
 * - 激活码服务
 */

import { Module, Global } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LicenseService } from './license.service'
import { LicenseController } from './license.controller'
import { LicenseGuard } from './license.guard'
import { LicenseOrmEntity, LicenseAuditLogOrmEntity } from './entities'
import { LicenseRepository } from './repositories/license.repository'
import { LicenseAuditLogRepository } from './repositories/license-audit-log.repository'
import { ActivationCodeService } from './services/activation-code.service'

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([LicenseOrmEntity, LicenseAuditLogOrmEntity]),
  ],
  controllers: [LicenseController],
  providers: [
    LicenseService,
    LicenseGuard,
    LicenseRepository,
    LicenseAuditLogRepository,
    ActivationCodeService,
  ],
  exports: [LicenseService, LicenseGuard, ActivationCodeService],
})
export class LicenseModule {}