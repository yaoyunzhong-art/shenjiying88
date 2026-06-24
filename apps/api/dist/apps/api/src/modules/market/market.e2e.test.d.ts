/**
 * E2E: Market 市场配置 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → MarketService
 *
 * 验证:
 *   - bootstrap 返回支持的市场 / 默认市场 / foundation 依赖
 *   - scope 路由 (tenant/brand/store) 透传 scope + 返回市场画像 + 覆盖
 *   - portal 路由返回市场基础字段
 *   - 跨市场隔离: cn-mainland vs us-default 时区 / 货币
 */
import 'reflect-metadata';
//# sourceMappingURL=market.e2e.test.d.ts.map