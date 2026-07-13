import { Module } from '@nestjs/common'
import { FoundationModule } from '../foundation/foundation.module'
import { MarketModule } from '../market/market.module'
import { PortalModule } from '../portal/portal.module'
import { TenantConfigModule } from '../tenant-config/tenant-config.module'
import { WorkbenchController } from './workbench.controller'
import { WorkbenchService } from './workbench.service'

@Module({
  imports: [FoundationModule, MarketModule, PortalModule, TenantConfigModule],
  controllers: [WorkbenchController],
  providers: [WorkbenchService]
})
export class WorkbenchModule {}
