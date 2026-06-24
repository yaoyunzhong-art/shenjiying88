/**
 * 跨模块 E2E 测试链 #5: Loyalty + Campaign + Analytics 联动
 *
 * 链路:
 *   HTTP → TenantContext → LoyaltyService (plan + issue)
 *                        → CampaignService (evaluate + dispatch awardPoints/issueCoupon)
 *                        → AnalyticsService (snapshot + diagnostics)
 *
 * 验证:
 *   - 创建 CouponPlan → 状态激活 → Campaign 通过 payment.success 触发自动发券
 *   - 触发 AwardPoints 后 member 积分变化被 Analytics 聚合
 *   - 多次发券后 coupon 配额下降被 Analytics 监控
 *   - 跨模块 tenant 隔离：tenant-B 不能消费 tenant-A 的券或看到它的指标
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module-e2e-3-loyalty-campaign-analytics.test.d.ts.map