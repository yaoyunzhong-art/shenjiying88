import { Global, Module } from '@nestjs/common'
import { LYTPlatform } from './lyt-platform'
import { MockAltPlatform } from './mock-alt-platform'
import { BasePlatformRegistry } from './base-platform.registry'
import { CanaryRouter } from './canary-router'

/**
 * PlatformAbstractionsModule · 第二底座接入 (P3)
 *
 * 包含:
 *  - LYTPlatform: 神机营现有底座适配器 (P3-1.2)
 *  - MockAltPlatform: 备用底座模拟器 (P3-1.3)
 *  - BasePlatformRegistry: 多底座注册 + 路由 + 熔断 + 限流 + 降级 (P3-1.4)
 *  - CanaryRouter: 灰度发布 (5%/25%/50%/100% + hash) (P3-2.2)
 *
 * 使用:
 *   - 业务层注入 BasePlatformRegistry 调 route + dispatchXxx
 *   - CanaryRouter 由外部决策层注入并驱动 registry.routeTo
 */
@Global()
@Module({
  providers: [
    LYTPlatform,
    MockAltPlatform,
    BasePlatformRegistry,
    CanaryRouter
  ],
  exports: [
    LYTPlatform,
    MockAltPlatform,
    BasePlatformRegistry,
    CanaryRouter
  ]
})
export class PlatformAbstractionsModule {}
