/**
 * E2E: Health 健康检查 HTTP 链路
 *
 * 链路:
 *   HTTP → HealthController → HealthService → PrismaService / LytService / Redis / Disk / Memory
 *
 * 验证:
 *   - GET /health - 基础连通性 (ping)
 *   - GET /health/ping - 别名连通性
 *   - GET /health/readiness - 完整健康检查 (含组件探测)
 *   - GET /health/readiness?verbose=true - 详细模式
 *   - 数据库组件探测
 *   - LYT 适配器组件探测
 *   - 降级状态检测
 *   - 未授权访问 readiness 返回 403/401
 */
import 'reflect-metadata';
//# sourceMappingURL=health.e2e.test.d.ts.map