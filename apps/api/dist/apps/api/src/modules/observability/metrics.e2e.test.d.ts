/**
 * E2E: Metrics 可观测性 HTTP 链路
 *
 * 验证:
 *   - GET /healthz 返回 { status, metrics }
 *   - GET /metrics 返回 Prometheus text/plain 格式 (v0.0.4)
 *   - 默认注册 5 个指标 HELP/TYPE
 *   - 路径路由正确: /healthz AND /metrics
 *   - 不带认证也可访问
 *   - reset 后重新注册仍工作
 */
import 'reflect-metadata';
//# sourceMappingURL=metrics.e2e.test.d.ts.map