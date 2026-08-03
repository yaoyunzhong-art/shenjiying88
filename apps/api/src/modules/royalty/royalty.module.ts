import { Module } from '@nestjs/common'
import { RoyaltyController } from './royalty.controller'
import { RoyaltyService } from './royalty.service'

@Module({
  controllers: [RoyaltyController],
  providers: [RoyaltyService],
  exports: [RoyaltyService],
})
export class RoyaltyModule {}
