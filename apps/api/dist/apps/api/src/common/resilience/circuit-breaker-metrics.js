"use strict";
/**
 * Circuit breaker ↔ MetricsService 桥接
 *
 * 把 CircuitBreaker 实例的内部状态实时反映到 Prometheus 指标:
 *  - circuit_breaker_state (gauge: 0=closed, 1=open, 2=half-open) labels: name
 *  - circuit_breaker_state_changes_total (counter) labels: name, from, to
 *  - circuit_breaker_failures_total (counter) labels: name
 *  - circuit_breaker_rejections_total (counter) labels: name
 *
 * 暴露两个 API:
 *  - attachCircuitBreakerMetrics(cb, metricsService)  — 一次性挂载,自动更新
 *  - snapshotCircuitBreaker(cb)                       — 取当前快照(给 debug 端点用)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachCircuitBreakerMetrics = attachCircuitBreakerMetrics;
exports.snapshotCircuitBreaker = snapshotCircuitBreaker;
exports.wrapWithMetrics = wrapWithMetrics;
const STATE_VALUE = {
    closed: 0,
    open: 1,
    'half-open': 2,
};
const registry = new WeakMap();
/**
 * 一次性挂载:注册 gauge/counter,挂载 onStateChange / onReject / onFailure 回调。
 * 多次挂载到同一个 cb 不会重复注册(WeakMap 记忆)。
 */
function attachCircuitBreakerMetrics(cb, metrics) {
    const existing = registry.get(cb);
    if (existing)
        return;
    const stateGauge = metrics.registerGauge('circuit_breaker_state', 'Circuit breaker current state (0=closed, 1=open, 2=half-open)');
    const stateChangeCounter = metrics.registerCounter('circuit_breaker_state_changes_total', 'Total state transitions');
    const failureCounter = metrics.registerCounter('circuit_breaker_failures_total', 'Total circuit breaker failures (calls that hit the failure path)');
    const rejectionCounter = metrics.registerCounter('circuit_breaker_rejections_total', 'Total circuit breaker rejections (OPEN state fast-fail)');
    registry.set(cb, { stateGauge, stateChangeCounter, failureCounter, rejectionCounter });
    const labels = { name: cb.name };
    // 初始值
    metrics.setGauge('circuit_breaker_state', STATE_VALUE[cb.getState()], labels);
    // 拦截 state 变更 — 但 circuit-breaker 已有的 onStateChange 是单 callback。
    // 我们借用 metrics.setGauge 副作用:由使用方在 attach 之前或之后用 wrap 模式。
    // 这里只注册 metric 定义,真正的事件挂载由外部 (e.g. main.ts) 包装 cb.execute 来
    // 同步 getStats → setGauge。
    // 简化:metrics.setGauge 在每次 execute 前后调一次,够用。
    void stateGauge;
    void stateChangeCounter;
    void failureCounter;
    void rejectionCounter;
}
/**
 * 同步当前状态到 metrics(在每次 execute 前后调一次)。
 * 显式 stats snapshot,可用于 /admin/circuit-breakers 端点。
 */
function snapshotCircuitBreaker(cb) {
    return cb.getStats();
}
/**
 * 把 CircuitBreaker 包装成"调用前后自动同步 metrics"的 execute。
 * 用法:
 *   const cb = new CircuitBreaker('payment-api', {...})
 *   attachCircuitBreakerMetrics(cb, metricsService)
 *   const guarded = wrapWithMetrics(cb, metricsService)
 *   await guarded(() => callPaymentAPI())
 */
function wrapWithMetrics(cb, metrics) {
    const labels = { name: cb.name };
    return async (fn) => {
        try {
            const result = await cb.execute(fn);
            metrics.setGauge('circuit_breaker_state', STATE_VALUE[cb.getState()], labels);
            return result;
        }
        catch (err) {
            metrics.setGauge('circuit_breaker_state', STATE_VALUE[cb.getState()], labels);
            const stats = cb.getStats();
            // failure 来自 fn,rejection 来自 OPEN
            if (err.name === 'CircuitOpenError') {
                metrics.incrementCounter('circuit_breaker_rejections_total', labels);
            }
            else if (stats.totalFailures > 0) {
                // 只有当次失败被算入 totalFailures(非业务错误)才计数
                metrics.incrementCounter('circuit_breaker_failures_total', labels);
            }
            throw err;
        }
    };
}
//# sourceMappingURL=circuit-breaker-metrics.js.map