/**
 * E2E: Workbench 工作台 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → WorkbenchService → MarketService + PortalService + FoundationService
 *
 * 验证:
 *   - bootstrap 返回 tenant/brand/store portal + market profile + role workbenches
 *   - getRoleWorkbenches 返回所有角色
 *   - checkCapability 按角色判断能力
 *   - 跨租户 / 跨市场差异
 */
import 'reflect-metadata';
//# sourceMappingURL=workbench.e2e.test.d.ts.map