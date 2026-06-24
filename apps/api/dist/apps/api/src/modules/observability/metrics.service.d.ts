/**
 * 轻量级 Prometheus 兼容 metrics 服务
 *
 * 设计目标:
 *   - 零外部依赖 (不使用 prom-client)
 *   - 支持 Counter / Gauge / Histogram 三种基本类型
 *   - 输出 Prometheus 文本格式 (text/plain; version=0.0.4)
 *   - 全局单例,通过 MetricsModule 注入
 *
 * 使用:
 *   metricsService.incrementCounter('http_requests_total', { method: 'GET', path: '/foo', status: '200' })
 *   metricsService.observeHistogram('http_request_duration_ms', 12.3, { path: '/foo' })
 *   metricsService.setGauge('active_connections', 42)
 */
interface Counter {
    type: 'counter';
    name: string;
    help: string;
    values: Map<string, number>;
}
interface Gauge {
    type: 'gauge';
    name: string;
    help: string;
    values: Map<string, number>;
}
interface Histogram {
    type: 'histogram';
    name: string;
    help: string;
    labelNames: string[];
    buckets: number[];
    observations: Map<string, number[]>;
    counts: Map<string, number>;
    sums: Map<string, number>;
}
export declare class MetricsService {
    private readonly metrics;
    private readonly DEFAULT_BUCKETS;
    constructor(skipDefaults?: boolean);
    /**
     * 注册或获取已存在的 Counter
     */
    registerCounter(name: string, help: string): Counter;
    /**
     * 注册或获取已存在的 Gauge
     */
    registerGauge(name: string, help: string): Gauge;
    /**
     * 注册或获取已存在的 Histogram (默认桶: 5/10/25/50/100/250/500/1000/2500/5000/10000 ms)
     */
    registerHistogram(name: string, help: string, buckets?: number[]): Histogram;
    /**
     * 增加 counter
     */
    incrementCounter(name: string, labels?: Record<string, string | number>, delta?: number): void;
    /**
     * 设置 gauge 值
     */
    setGauge(name: string, labels: Record<string, string | number> | undefined, value: number): void;
    /**
     * 记录 histogram 观测值
     */
    observeHistogram(name: string, value: number, labels?: Record<string, string | number>): void;
    /**
     * 以 Prometheus text 格式 (v0.0.4) 输出所有 metrics
     */
    render(): string;
    /**
     * 清空所有 metrics (测试用)
     */
    reset(): void;
    /**
     * 列出所有已注册的 metric 名称
     */
    listMetrics(): string[];
    private serializeLabels;
    private formatLabels;
    private deserializeLabels;
    private escapeLabelValue;
}
/**
 * 模块级默认 metrics 注册 — 通常在 MetricsService 启动时调用一次
 */
export declare function registerDefaultMetrics(service: MetricsService): void;
export {};
//# sourceMappingURL=metrics.service.d.ts.map