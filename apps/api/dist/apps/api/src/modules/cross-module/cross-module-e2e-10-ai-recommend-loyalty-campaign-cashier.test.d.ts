/**
 * E2E 跨模块 #10 — AI 推荐 → 会员 → 营销 → 收银 联动
 *
 * 链路:
 *   HTTP → TestController
 *     → AiRecommendService.generateRecommendations (策略: hybrid)
 *     → MemberService.register + addPoints (前置准备)
 *     → CashierService.createOrder + createPayment + applyPaymentCallback
 *       · 发布 cashier.order-created / cashier.payment-created / cashier.payment-succeeded
 *     → CampaignService.registerCampaign (策略) + evaluateTriggers('cashier.payment-succeeded')
 *       · 匹配成功 → dispatchAction AwardPoints → MemberService.awardPoints
 *       · 触发 loyalty 积分入账 → member 状态升级
 *     → AiRecommendService.generateRecommendations (再次) → 个性化结果不同
 *
 * 验证:
 *   - 冷启动: 新会员无 profile → popularity fallback
 *   - 个性化: 有 profile + 积分 → hybrid 策略产出 content-based 个性化
 *   - 营销触发: payment.success 事件 → AwardPoints 派发 → 会员积分变化
 *   - 营销条件: MinOrderAmount 不满足 → 不触发
 *   - 跨租户隔离: 租户 B 看不到租户 A 的策略 / 推荐 / 营销
 *   - 幂等: 同 orderId 二次 evaluateTriggers → 跳过重复派发
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module-e2e-10-ai-recommend-loyalty-campaign-cashier.test.d.ts.map