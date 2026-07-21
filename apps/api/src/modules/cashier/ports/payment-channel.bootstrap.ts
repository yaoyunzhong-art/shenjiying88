import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { MockPaymentGateway } from '../payment.service'
import { PaymentChannelRegistry } from './payment-channel.registry'
import type { PaymentChannelConfig, PaymentChannelPort } from './payment-channel.port'
import type { PaymentMethod } from '@m5/types'

/**
 * PaymentChannelBootstrap · 启动时注册默认 Mock 通道
 *
 * 设计目的:
 *   - 默认租户 ('default') 自动有 WECHAT/ALIPAY/CARD 3 个 mock 通道
 *   - 真实租户在生产环境由 admin-web 配置后台 → 调 register API 注册真实通道
 *   - 当前 MVP: 所有租户 fallback 到 'default' 租户的通道
 *
 * 后续 (P2):
 *   - 接入 TenantConfigService, 启动时按 tenantId 批量注册
 *   - 真实通道 (WeChatPayGateway/AlipayGateway) 由 bootstrap 注册
 */

const DEFAULT_TENANT_ID = 'default'
const DEFAULT_METHODS: PaymentMethod[] = ['WECHAT', 'ALIPAY', 'CARD']

@Injectable()
export class PaymentChannelBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(PaymentChannelBootstrap.name)

  constructor(
    private readonly mockGateway: MockPaymentGateway,
    private readonly registry: PaymentChannelRegistry
  ) {}

  onApplicationBootstrap(): void {
    if (!this.mockGateway || typeof this.mockGateway.createPrepay !== 'function') {
      this.logger.warn('Mock payment gateway unavailable, skip default mock channel bootstrap')
      return
    }

    for (const method of DEFAULT_METHODS) {
      this.registerMockChannel(DEFAULT_TENANT_ID, method, 0)
    }
    this.logger.log(
      `Bootstrapped ${DEFAULT_METHODS.length} default mock channels for tenant=${DEFAULT_TENANT_ID}`
    )
  }

  /**
   * 外部 (admin-web / bootstrap script) 注册真实通道
   * 流程:
   *   1. 创建 WeChatPayGateway/AlipayGateway 实例
   *   2. 包装成 PaymentChannelPort (tenantId + config)
   *   3. 调用 registry.register(port)
   */
  registerMockChannel(tenantId: string, method: PaymentMethod, priority: number): void {
    const gatewayName =
      typeof this.mockGateway?.gatewayName === 'string' && this.mockGateway.gatewayName.length > 0
        ? this.mockGateway.gatewayName
        : 'mock'

    const config: PaymentChannelConfig = {
      tenantId,
      channel: method,
      priority,
      enabled: true,
      isHealthy: true,
      consecutiveFailures: 0
    }
    const port: PaymentChannelPort = {
      ...config,
      gatewayName,
      tenantId,
      config,
      createPrepay: (order, m) => this.mockGateway.createPrepay(order, m),
      query: (providerTxnId) => this.mockGateway.query(providerTxnId),
      refund: (input) => this.mockGateway.refund(input),
      healthCheck: async () => ({ healthy: true, latencyMs: 0 }),
      recordFailure: () => undefined,
      recordSuccess: () => undefined
    }
    this.registry.register(port)
  }
}
