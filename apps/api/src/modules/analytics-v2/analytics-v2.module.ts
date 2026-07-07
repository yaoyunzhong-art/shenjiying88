import { Module } from '@nestjs/common'
import { AnalyticsV2Controller } from './analytics-v2.controller'
import { EventCollector } from './event-collector'
import { CDCStream } from './cdc-stream'
import { CohortAnalyzer } from './cohort-analyzer'
import { FunnelCalculator } from './funnel-calculator'
import { CohortService } from './services/cohort.service'
import { FunnelService } from './services/funnel.service'
import { RetentionService } from './services/retention.service'
import { MetricsService } from './services/metrics.service'
import { EventAdapter } from './datasources/event.adapter'
import { CDCAdapter } from './datasources/cdc.adapter'
import { CohortAdapter } from './datasources/cohort.adapter'
import { FunnelAdapter } from './datasources/funnel.adapter'
import { RetentionAdapter } from './datasources/retention.adapter'

/**
 * Phase-43 T173: AnalyticsV2Module (数据分析模块)
 *
 * 15 providers:
 *  - 5 adapters (event / cdc / cohort / funnel / retention)
 *  - 4 engines (event-collector / cdc-stream / cohort-analyzer / funnel-calculator)
 *  - 4 services (cohort / funnel / retention / metrics)
 *  - 1 controller
 */
@Module({
  controllers: [AnalyticsV2Controller],
  providers: [
    // 5 adapters
    EventAdapter,
    CDCAdapter,
    CohortAdapter,
    FunnelAdapter,
    RetentionAdapter,
    // 4 engines
    EventCollector,
    CDCStream,
    CohortAnalyzer,
    FunnelCalculator,
    // 4 services
    CohortService,
    FunnelService,
    RetentionService,
    MetricsService,
    // Controller (export for service injection)
    AnalyticsV2Controller
  ],
  exports: [
    EventCollector,
    CDCStream,
    CohortService,
    FunnelService,
    RetentionService,
    MetricsService
  ]
})
export class AnalyticsV2Module {}