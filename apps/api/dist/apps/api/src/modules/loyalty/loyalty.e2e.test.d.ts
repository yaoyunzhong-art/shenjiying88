/**
 * E2E-level: Loyalty 积分会员 service 层测试
 *
 * 链路:
 *   LoyaltyService
 *     → listPointsLedger / listCouponRedemptions / listBlindboxFulfillments / listSettlements
 *     → registerCouponPlan / listCouponPlans / getCouponPlan / activateCouponPlan / issueCoupon
 *     → registerBlindboxPlan / listBlindboxPlans / getBlindboxPlan / activateBlindboxPlan / issueBlindbox
 *     → settlePaidOrder / settleFailedOrder / refundRollback
 *
 * 验证:
 *   - 列表查询初始为空
 *   - 注册 Coupon Plan 后列表可查
 *   - Coupon Plan 状态激活
 *   - 发放优惠券成功
 *   - 注册盲盒计划
 *   - settlePaidOrder 创建积分、优惠券赎回、盲盒履约
 *   - settleFailedOrder 释放优惠券
 *   - 租户隔离
 *   - 边界: 无效 planId
 */
export {};
//# sourceMappingURL=loyalty.e2e.test.d.ts.map