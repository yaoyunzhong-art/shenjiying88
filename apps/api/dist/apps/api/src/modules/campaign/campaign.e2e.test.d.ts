/**
 * E2E: Campaign 编排引擎 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → CampaignService → MemberService/LoyaltyService
 *
 * 验证:
 *   - Campaign register / list / get / status 完整 CRUD
 *   - evaluateTriggers HTTP 端点
 *   - dispatches 列表 / 按 planId 过滤
 *   - 状态机转换守卫
 *   - 幂等性（同 planId+actionIndex+memberId+orderId 不重复派发）
 *   - 条件匹配（MinOrderAmount, BrandScope）
 *   - brand scope 自动从 tenantContext 派生
 */
import 'reflect-metadata';
//# sourceMappingURL=campaign.e2e.test.d.ts.map