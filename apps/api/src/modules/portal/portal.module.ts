import { Global, Module } from '@nestjs/common'
import { FoundationModule } from '../foundation/foundation.module'
import { MarketModule } from '../market/market.module'
import { TenantConfigModule } from '../tenant-config/tenant-config.module'
import { PortalController } from './portal.controller'
import { PortalService } from './portal.service'

@Global()
@Module({
  imports: [FoundationModule, MarketModule, TenantConfigModule],
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService]
})
export class PortalModule {}
