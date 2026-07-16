/**
 * Sprint 3 Phase 2 - License 续费管理 Module
 *
 * 集成:
 * - TypeORM 实体 (LicenseRenewalRecord + RenewalNotification)
 * - 续费管理 Service / Controller
 * - LicenseRenewalJob 定时任务
 */

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NotificationModule } from '../notification/notification.module'
import { LicenseRenewalController } from './license-renewal.controller'
import { LicenseRenewalService } from './license-renewal.service'
import { LicenseRenewalJob } from './license-renewal.job'
import { LicenseRenewalRecord } from './entities/license-renewal-record.entity'
import { RenewalNotification } from './entities/renewal-notification.entity'

@Module({
  imports: [
    NotificationModule,
    TypeOrmModule.forFeature([LicenseRenewalRecord, RenewalNotification]),
  ],
  controllers: [LicenseRenewalController],
  providers: [LicenseRenewalService, LicenseRenewalJob],
  exports: [LicenseRenewalService, LicenseRenewalJob],
})
export class LicenseRenewalModule {}
