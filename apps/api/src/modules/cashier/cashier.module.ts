import { Module } from '@nestjs/common'
import { LoyaltyModule } from '../loyalty/loyalty.module'
import { MemberModule } from '../member/member.module'
import { OrderService } from './order.service'
import { PaymentService, MockPaymentGateway } from './payment.service'
import { RefundService } from './refund.service'
import { CashierController } from './cashier.controller'
import { CashierBillingController } from './cashier-billing.controller'
import { CashierSseController } from './cashier.sse'
import { CashierEventEmitter } from './cashier.events'
import { CashierService } from './cashier.service'
import { PaymentChannelRegistry } from './ports/payment-channel.registry'
import { PaymentChannelBootstrap } from './ports/payment-channel.bootstrap'
import { CashierToLytBridge } from './bridges/cashier-to-lyt.bridge'
import { LytToCashierBridge } from './bridges/lyt-to-cashier.bridge'
import { InventoryItemModule } from '../inventory/inventory-item.module'
import { CommercialBillingModule } from '../foundation/commercial-billing/commercial-billing.module'

/**
 * P0-A1: Cache-aside 模式持久化
 *
 * 存储模型:
 *   orderStore   (in-memory Map)  ​↔  Redis(cashier:order:<orderId>)
 *   paymentStore (in-memory Map)  ​↔  Redis(cashier:payment:<paymentId>)
 *
 * 写入策略 (write-through):
 *   1. 写入 in-memory Map (始终成功)
 *   2. 异步写入 Redis (fire-and-forget, 不阻塞主流程)
 *
 * 读取策略 (cache-aside):
 *   1. 优先查 in-memory Map
 *   2. Miss 则查 Redis
 *   3. Redis hit → 回填 Map → 返回
 *   4. Redis miss → undefined
 *
 * 测试模式: CacheService 不可用(未注入)时降级为纯内存,与旧行为一致。
 * CashierService.spec.ts 使用内联存储不依赖本 Service 实例,不受影响。
 */

/**
 * Phase-35 T158-T164 + P3-5: 收银台模块
 *
 * 包含:
 *  - Service: OrderService + PaymentService + RefundService + MockPaymentGateway
 *  - Controller: CashierController (11 endpoint, TenantGuard 强制注入)
 *  - BillingController: CashierBillingController (P3-5, 6 admin 端点)
 *  - SSE: CashierSseController (Phase-35 T164, 3 SSE 端点 + Last-Event-ID 重连)
 *  - EventEmitter: CashierEventEmitter (RxJS Subject + in-memory EventStore)
 *  - PaymentChannelRegistry: 多租户通道注册表 (P0-2.5, 主备路由 + 熔断)
 *  - PaymentChannelBootstrap: onApplicationBootstrap 注册 Mock 通道
 *  - CashierToLytBridge: cashier → LYT 事件桥 (P1-1.2)
 *  - LytToCashierBridge: LYT → cashier 事件桥 (P1-1.3)
 * 依赖: Member/Loyalty 模块为真实支付结算链提供会员校验与积分结算
 *       CommercialBillingModule 提供 BillingWall (P3-5, 调用方付费拦截)
 */
@Module({
  imports: [MemberModule, LoyaltyModule, InventoryItemModule, CommercialBillingModule],
  controllers: [CashierController, CashierBillingController, CashierSseController],
  providers: [
    CashierService,
    OrderService,
    PaymentService,
    RefundService,
    MockPaymentGateway,
    CashierEventEmitter,  // Phase-35 T164: SSE 事件总线
    PaymentChannelRegistry,  // P0-2.5: 多租户通道注册表
    PaymentChannelBootstrap,  // P0-2.5: 启动时注册 Mock 通道
    {
      provide: CashierToLytBridge,
      useFactory: () =>
        new CashierToLytBridge(
          {
            resolveLytAdapter: () => null as never,
          },
        ),
    },  // P1-1.2: cashier → LYT
    {
      provide: LytToCashierBridge,
      useFactory: () =>
        new LytToCashierBridge(
          {
            syncMemberProfile: async () => ({ updated: false }),
            syncExternalOrder: async () => ({ cashierOrderId: '' }),
            recordGatePass: async () => ({ recorded: false }),
          },
        ),
    }  // P1-1.3: LYT → cashier
  ],
  exports: [
    CashierService,
    OrderService,
    PaymentService,
    RefundService,
    CashierEventEmitter,
    PaymentChannelRegistry,  // P0-2.5: 暴露给其他模块
    CashierToLytBridge,  // P1-1.2: 暴露给 OrderService
    LytToCashierBridge  // P1-1.3: 暴露给 Webhook 路由
  ]
})
export class CashierModule {}
