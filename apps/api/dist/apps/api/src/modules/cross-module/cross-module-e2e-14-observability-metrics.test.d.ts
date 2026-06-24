/**
 * E2E 跨模块 #14 — Observability: Prometheus /metrics + HTTP 拦截器
 *
 * 链路:
 *   HTTP → MetricsController.getMetrics (text/plain Prometheus 格式)
 *     · 校验 # HELP / # TYPE 头部 + 实际数值
 *   HTTP → 任意业务 endpoint (触发 MetricsInterceptor 计数)
 *     · http_requests_total{method, path, status} 自增
 *     · http_request_duration_ms{method, path} 记录延迟
 *     · http_active_connections gauge 进/出平衡
 *   业务异常 → http_exceptions_total{method, path, kind} 自增
 *
 * 验证:
 *   - GET /metrics 返回 200 + text/plain; version=0.0.4
 *   - 包含 5 个默认指标 (http_requests_total, http_request_duration_ms,
 *     http_active_connections, http_exceptions_total, process_uptime_seconds)
 *   - 业务请求后, counter 数值正确增加
 *   - histogram bucket 计数与 _count / _sum 字段一致
 *   - GET /healthz 返回 { status: 'ok', metrics: N }
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module-e2e-14-observability-metrics.test.d.ts.map