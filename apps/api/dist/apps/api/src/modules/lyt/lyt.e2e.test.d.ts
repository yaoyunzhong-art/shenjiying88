/**
 * E2E: LYT 连接编排引擎 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → LytService → Mock adapters
 *
 * 验证:
 *   - fixtures 列表 / 摘要 / 单个获取
 *   - fixture compare / import-preview / import-plan
 *   - bootstrap 端点
 *   - connection 查询（storeId / readiness / access-view / adapter）
 *   - governance summary / alerts
 *   - device status 查询
 *   - webhooks callback / drill / replay-fixture
 *   - 参数校验（缺少必需参数返回 400）
 *   - 边界情况（不存在的 fixture key、空 tenantContext）
 */
import 'reflect-metadata';
//# sourceMappingURL=lyt.e2e.test.d.ts.map