import { Global, Module } from '@nestjs/common'
import { FoundationModule } from '../foundation/foundation.module'
import { MarketModule } from '../market/market.module'
import { PortalController } from './portal.controller'
import { PortalService } from './portal.service'

@Global()
@Module({
  imports: [FoundationModule, MarketModule],
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService]
})
export class PortalModule {}
