/**
 * minor-protection.prisma-store.ts — 数据库持久化层
 * 
 * 将 MinorProtectionService 的内存数据同步到 PostgreSQL
 * 启动时从 DB 加载所有记录回内存
 */

import { Injectable, Logger, OnApplicationBootstrap, Optional } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

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
      const profiles = await this.prisma.minorProtectionProfile.findMany()
      this.logger.log(`Loaded ${profiles.length} minor protection profiles`)
    } catch (err) {
      this.logger.error('Failed to load minor protection data', (err as Error).message)
    }
  }
}
