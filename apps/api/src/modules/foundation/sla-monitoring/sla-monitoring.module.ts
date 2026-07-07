import { Global, Module } from '@nestjs/common'
import { SlaMonitorImpl } from './sla-monitor'

/**
 * SlaMonitoringModule · SLA 监控 (P3-3)
 *
 * 包含:
 *  - SlaMonitorImpl: 滑动窗口 + 阈值 + 告警 (p95/p99/error_rate)
 *
 * 集成:
 *  - CanaryRouter.onAlert → setForceRollback(true) 自动回滚
 *  - BasePlatformRegistry.dispatchXxx → record() 注入样本
 */
@Global()
@Module({
  providers: [SlaMonitorImpl],
  exports: [SlaMonitorImpl]
})
export class SlaMonitoringModule {}
