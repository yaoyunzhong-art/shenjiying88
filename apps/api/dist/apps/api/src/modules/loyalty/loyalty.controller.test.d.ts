/**
 * 🐜 自动: [loyalty] [D] controller spec 补全增强
 *
 * 原有覆盖 (保留): metadata 验证 / listPointsLedger / listCouponRedemptions /
 *   listBlindboxFulfillments / listSettlements / multi-tenant isolation / error resilience
 *
 * 新增 (此补全):
 *   - coupon-plans CRUD: registerCouponPlan / listCouponPlans / getCouponPlan / activateCouponPlan
 *   - blindbox-plans CRUD: registerBlindboxPlan / listBlindboxPlans / getBlindboxPlan / activateBlindboxPlan
 *   - issue coupon: issueCoupon (正例+反例+边界)
 *   - issue blindbox: issueBlindbox (正例+反例+边界)
 *   - 所有端点 metadata 验证
 */
import 'reflect-metadata';
//# sourceMappingURL=loyalty.controller.test.d.ts.map