import { Module } from '@nestjs/common'
import { MinorProtectionController } from './minor-protection.controller'
import { MinorProtectionService } from './minor-protection.service'

@Module({
  controllers: [MinorProtectionController],
  providers: [MinorProtectionService],
  exports: [MinorProtectionService],
})
export class MinorProtectionModule {}
