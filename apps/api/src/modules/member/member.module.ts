import { Module } from '@nestjs/common'
import { MemberController } from './member.controller'
import { MemberConfigController } from './member-config.controller'
import { MemberService } from './member.service'
import { MemberConfigService } from './member-config'
import { MemberApprovalOutcomeRecorder } from './member-approval-recorder'
import { MemberDormancyService } from './member-dormancy.service'
import { MemberDormancyCron } from './member-dormancy.cron'
import { MemberDormancyController } from './member-dormancy.controller'
import { MemberCrossTenantService } from './member.cross-tenant'
import { MemberCrossTenantController } from './member.cross-tenant.controller'
import { GovernanceApprovalModule } from '../foundation/governance-approval/governance-approval.module'
import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module'

@Module({
  imports: [GovernanceApprovalModule, MarketingMetricsModule],
  controllers: [
    MemberController,
    MemberConfigController,
    MemberDormancyController,    // T166-2: 休眠状态机 HTTP 接口 (5 endpoint)
    MemberCrossTenantController  // T166-3: 跨租户识别 HTTP 接口 (4 endpoint)
  ],
  providers: [
    MemberService,
    MemberConfigService,
    MemberApprovalOutcomeRecorder,
    MemberDormancyService,    // T166-2: 状态机 service
    MemberDormancyCron,       // T166-2: cron 调度
    MemberCrossTenantService  // T166-3: 跨租户识别 service
  ],
  exports: [
    MemberService,
    MemberConfigService,
    MemberApprovalOutcomeRecorder,
    MemberDormancyService,
    MemberDormancyCron,
    MemberCrossTenantService  // T166-3: 暴露给订单/支付模块 (跨租户会员识别)
  ]
})
export class MemberModule {}
