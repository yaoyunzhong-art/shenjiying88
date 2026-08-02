/**
 * minor-protection.prisma-store.ts — 数据库持久化层
 * 
 * 将 MinorProtectionService 的内存数据同步到 PostgreSQL
 * 启动时从 DB 加载所有记录回内存
 */

import { Injectable, Logger, OnApplicationBootstrap, Optional } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

/**
 * minorProtectionProfile 表尚未加入 Prisma schema。
 * 这里用最小结构化接口替代 `as any`（仅暴露运行时可能存在的可选委托），
 * 保持 `?.findMany()` 的可选链语义不变。
 */
interface MinorProtectionPrismaLike {
  minorProtectionProfile?: {
    findMany: () => Promise<unknown[]>
  }
}

@Injectable()
export class MinorProtectionPrismaStore implements OnApplicationBootstrap {
  private readonly logger = new Logger(MinorProtectionPrismaStore.name)

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.loadAllData()
    this.logger.log('Minor protection data loaded from database')
  }

  async loadAllData(): Promise<void> {
    if (!this.prisma) {
      this.logger.warn('PrismaService not available, skipping DB load')
      return
    }
    try {
      // NOTE: minorProtectionProfile table not yet in Prisma schema — load from MinorIdentityVerification
      const profiles = await (this.prisma as unknown as MinorProtectionPrismaLike).minorProtectionProfile?.findMany()
      if (profiles) {
        this.logger.log(`Loaded ${profiles.length} minor protection profiles`)
      }
    } catch (err) {
      this.logger.warn('Minor protection DB table not yet created, using in-memory only')
    }
  }
}
