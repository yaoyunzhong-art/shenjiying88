import { Injectable, Logger, OnApplicationBootstrap, Optional } from "@nestjs/common"
import { PrismaService } from '../../prisma/prisma.service'
import type { IdentityVerificationRecord, MinorAccessLog } from './minor-protection.entity'
import { setVerificationStoreEntry, setAccessLogStoreEntry, clearVerificationStore, clearAccessLogStore } from './minor-protection.service'

@Injectable()
export class MinorProtectionPrismaStore implements OnApplicationBootstrap {
  private readonly logger = new Logger(MinorProtectionPrismaStore.name)

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.loadAllData()
    this.logger.log('Minor protection data loaded from database')
  }

  async loadAllData(): Promise<void> {
    clearVerificationStore()
    clearAccessLogStore()

    const verifications = await this.prisma?.minorIdentityVerification.findMany() ?? []
    for (const v of verifications) {
      setVerificationStoreEntry(v.id, {
        id: v.id, tenantId: v.tenantId, memberId: v.memberId,
        method: v.method as any, identityNumber: v.identityNumber,
        name: v.name, isMinor: v.isMinor, birthday: v.birthday,
        guardianConsent: v.guardianConsent, verifiedAt: v.verifiedAt.toISOString(),
        expiresAt: v.expiresAt.toISOString(), createdAt: v.createdAt.toISOString(),
      })
    }

    const logs = await this.prisma?.minorAccessLog.findMany() ?? []
    for (const l of logs) {
      setAccessLogStoreEntry(l.tenantId, { ...l as any, action: l.action as MinorAccessLog["action"], createdAt: l.createdAt.toISOString() })
    }

    this.logger.log(`Loaded ${verifications.length} verifications, ${logs.length} access logs`)
  }

  /** Fire-and-forget: persist verification to DB */
  async persistVerification(record: IdentityVerificationRecord): Promise<void> {
    try {
      await this.prisma?.minorIdentityVerification.upsert({
        where: { id: record.id },
        create: { ...record, verifiedAt: new Date(record.verifiedAt), expiresAt: new Date(record.expiresAt) },
        update: { isMinor: record.isMinor, guardianConsent: record.guardianConsent },
      })
    } catch (err) {
      this.logger.error(`persistVerification failed: ${record.id}`, (err as Error).message)
    }
  }

  /** Fire-and-forget: persist access log to DB */
  async persistAccessLog(log: MinorAccessLog): Promise<void> {
    try {
      await this.prisma?.minorAccessLog.create({ data: log })
    } catch (err) {
      this.logger.error(`persistAccessLog failed: ${log.id}`, (err as Error).message)
    }
  }
}
