import { Module } from '@nestjs/common'
import { StoreRankController } from './store-rank.controller'
import { StoreRankService } from './store-rank.service'

@Module({
  controllers: [StoreRankController],
  providers: [StoreRankService],
  exports: [StoreRankService],
})
export class StoreRankModule {}
