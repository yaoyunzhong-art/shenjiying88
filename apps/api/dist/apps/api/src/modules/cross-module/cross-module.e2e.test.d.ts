/**
 * E2E: Cross-Module 跨模块验证 HTTP 链路
 *
 * 链路:
 *   HTTP → CrossModuleController → CrossModuleService → CrossModuleChain entities
 *
 * 验证:
 *   - GET /cross-module/chain-status - 列出所有跨模块链路
 *   - POST /cross-module/validate - 验证指定链路
 *   - POST /cross-module/validate?chainName=xxx - 验证单条链路
 *   - 响应格式一致性
 *   - 空参数边界
 *   - 8 角色权限验证
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module.e2e.test.d.ts.map