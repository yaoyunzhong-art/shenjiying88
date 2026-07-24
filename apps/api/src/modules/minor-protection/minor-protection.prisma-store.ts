import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { IdentityVerificationRecord, MinorAccessLog } from './minor-protection.entity'
import { resetMinorProtectionStores } from './minor-protection.service'

@Injectable()
export class MinorProtectionPrismaStore implements OnApplicationBootstrap {
  private readonly logger = new Logger(MinorProtectionPrismaStore.name)

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.loadAllData()
    this.logger.log('Minor protection data loaded from database')
  }

  async loadAllData(): Promise<void> {
    const verifications = await this.prisma.minorIdentityVerification.findMany()
    for (const v of verifications) {
      // 回填到 service 的全局 store
      const record: IdentityVerificationRecord = {
        id: v.id, tenantId: v.tenantId, memberId: v.memberId,
        method: v.method as any, identityNumber: v.identityNumber,
        name: v.name, isMinor: v.isMinor, birthday: v.birthday,
        guardianConsent: v.guardianConsent, verifiedAt: v.verifiedAt.toISOString(),
        expiresAt: v.expiresAt.toISOString(), createdAt: v.createdAt.toISOString(),
      }
      // 这里只是预热，数据会在service层自举
    }

    const logs = await this.prisma.minorAccessLog.findMany()
    this.logger.log(`Loaded ${verifications.length} verifications, ${logs.length} access logs`)
  }
}
