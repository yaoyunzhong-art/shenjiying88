import { Global, Module } from '@nestjs/common'
import { FoundationModule } from '../foundation/foundation.module'
import { MarketModule } from '../market/market.module'
import { SaasAdvancedModule } from '../saas-advanced/saas-advanced.module'
import { TenantConfigModule } from '../tenant-config/tenant-config.module'
import { PortalController } from './portal.controller'
import { PortalService } from './portal.service'

@Global()
@Module({
  imports: [FoundationModule, MarketModule, TenantConfigModule, SaasAdvancedModule],
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService]
})
export class PortalModule {}
