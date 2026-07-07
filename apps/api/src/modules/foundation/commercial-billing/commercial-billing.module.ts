import { Global, Module } from '@nestjs/common'
import { InMemoryBillingMeter, DefaultPricingEngine, BillingServiceImpl } from './billing.service'
import { BillingWall } from './billing-wall'

/**
 * CommercialBillingModule · 商业化计费 (P3-4)
 *
 * 包含:
 *  - InMemoryBillingMeter: 计量 (记录 + 聚合)
 *  - DefaultPricingEngine: 计价 (FREE / FLAT / PER_UNIT / TIERED)
 *  - BillingServiceImpl: 出账 + 钱包 + 计费墙
 *  - BillingWall: 业务侧调用入口 (guard / recordUsage / settle)
 *
 * 集成:
 *  - cashier / payment / lyt 模块注入 BillingWall
 *  - 月底 cron 调 BillingWall.settle
 *  - admin-web 可查 BillingWall.getUsageReport
 */
@Global()
@Module({
  providers: [
    InMemoryBillingMeter,
    DefaultPricingEngine,
    BillingServiceImpl,
    BillingWall
  ],
  exports: [
    InMemoryBillingMeter,
    DefaultPricingEngine,
    BillingServiceImpl,
    BillingWall
  ]
})
export class CommercialBillingModule {}
