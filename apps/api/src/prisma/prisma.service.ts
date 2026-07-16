import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[debug:init] PrismaService.onModuleInit begin')
    }
    try {
      await this.$connect()
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        throw error
      }
      console.warn(
        `[PrismaService] dev-mode connect skipped: ${(error as Error).message}`,
      )
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[debug:init] PrismaService.onModuleInit end')
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
