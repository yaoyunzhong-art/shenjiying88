import { Module, Optional } from '@nestjs/common'
import { MinorProtectionController } from './minor-protection.controller'
import { MinorProtectionService } from './minor-protection.service'
import { MinorProtectionPrismaStore } from './minor-protection.prisma-store'

@Module({
  controllers: [MinorProtectionController],
  providers: [
    MinorProtectionService,
    MinorProtectionPrismaStore,
  ],
  exports: [MinorProtectionService, MinorProtectionPrismaStore],
})
export class MinorProtectionModule {}
