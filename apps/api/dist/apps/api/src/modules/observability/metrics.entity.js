"use strict";
/**
 * metrics.entity.ts — 可观测性领域类型定义
 *
 * 为 MetricsController / MetricsService 提供类型化契约：
 *   - MetricDefinition: 指标定义元数据
 *   - MetricsReport:   Prometheus 渲染结构包装
 *   - AlertRule:        告警规则定义
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.METRIC_TYPE = void 0;
// ── Metric Type 枚举 ──
exports.METRIC_TYPE = {
    COUNTER: 'counter',
    GAUGE: 'gauge',
    HISTOGRAM: 'histogram'
};
//# sourceMappingURL=metrics.entity.js.map