import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { FoundationModule } from '../foundation/foundation.module'
import { LoyaltyModule } from '../loyalty/loyalty.module'
import { MemberModule } from '../member/member.module'
import { TransactionsModule } from '../transactions/transactions.module'
import { CampaignModule } from '../campaign/campaign.module'
import { PrismaModule } from '../../prisma/prisma.module'
import { MockLytAdapter } from './adapters/mock-lyt.adapter'
import { RealLytAdapter } from './adapters/real-lyt.adapter'
import { SandboxLytAdapter } from './adapters/sandbox-lyt.adapter'
import { LytAdapterRegistry } from './lyt-adapter.registry'
import { LytConnectionManager } from './lyt-connection.manager'
import { LytController } from './lyt.controller'
import { LytGovernanceQueryService } from './lyt-governance-query.service'
import { LytService } from './lyt.service'

@Global()
@Module({
  imports: [
    ConfigModule,
    FoundationModule,
    LoyaltyModule,
    MemberModule,
    TransactionsModule,
    CampaignModule,
    PrismaModule
  ],
  controllers: [LytController],
  providers: [
    MockLytAdapter,
    SandboxLytAdapter,
    RealLytAdapter,
    LytAdapterRegistry,
    LytConnectionManager,
    LytGovernanceQueryService,
    LytService
  ],
  exports: [
    MockLytAdapter,
    SandboxLytAdapter,
    RealLytAdapter,
    LytAdapterRegistry,
    LytConnectionManager,
    LytGovernanceQueryService,
    LytService
  ]
})
export class LytModule {}
