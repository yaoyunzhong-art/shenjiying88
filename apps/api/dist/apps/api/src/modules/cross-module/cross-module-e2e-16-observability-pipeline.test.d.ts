/**
 * E2E 跨模块 #16 — Observability 管道: Logger → Tracing → Metrics 联动
 *
 * 链路:
 *   LoggerService (info/child/redact/error)
 *   → TracingService (withSpan 正常/异常)
 *   → MetricsService (counter/gauge/histogram → render)
 *   → MetricsController.getMetrics (/metrics Prometheus 格式)
 *
 * 验证:
 *   - Logger 级别正确, child logger 继承 bindings, redact 敏感字段
 *   - Tracing span 正常 + 异常 (ERROR)
 *   - Metrics 多类型 + Prometheus 格式输出
 *   - 三门面不互相污染
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module-e2e-16-observability-pipeline.test.d.ts.map