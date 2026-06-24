import { Global, Module } from '@nestjs/common'
import { FoundationModule } from '../foundation/foundation.module'
import { MarketController } from './market.controller'
import { MarketService } from './market.service'

@Global()
@Module({
  imports: [FoundationModule],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService]
})
export class MarketModule {}
