"use strict";
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
exports.registerDefaultMetrics = registerDefaultMetrics;
const common_1 = require("@nestjs/common");
let MetricsService = class MetricsService {
    metrics = new Map();
    DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    constructor(skipDefaults) {
        // 构造时自动注册默认 metrics（测试中可传入 false 跳过）
        if (!skipDefaults) {
            registerDefaultMetrics(this);
        }
    }
    /**
     * 注册或获取已存在的 Counter
     */
    registerCounter(name, help) {
        const existing = this.metrics.get(name);
        if (existing) {
            if (existing.type !== 'counter')
                throw new Error(`Metric ${name} already registered as ${existing.type}`);
            return existing;
        }
        const counter = { type: 'counter', name, help, values: new Map() };
        this.metrics.set(name, counter);
        return counter;
    }
    /**
     * 注册或获取已存在的 Gauge
     */
    registerGauge(name, help) {
        const existing = this.metrics.get(name);
        if (existing) {
            if (existing.type !== 'gauge')
                throw new Error(`Metric ${name} already registered as ${existing.type}`);
            return existing;
        }
        const gauge = { type: 'gauge', name, help, values: new Map() };
        this.metrics.set(name, gauge);
        return gauge;
    }
    /**
     * 注册或获取已存在的 Histogram (默认桶: 5/10/25/50/100/250/500/1000/2500/5000/10000 ms)
     */
    registerHistogram(name, help, buckets = this.DEFAULT_BUCKETS) {
        const existing = this.metrics.get(name);
        if (existing) {
            if (existing.type !== 'histogram')
                throw new Error(`Metric ${name} already registered as ${existing.type}`);
            return existing;
        }
        const histogram = {
            type: 'histogram',
            name,
            help,
            labelNames: [],
            buckets: [...buckets].sort((a, b) => a - b),
            observations: new Map(),
            counts: new Map(),
            sums: new Map()
        };
        this.metrics.set(name, histogram);
        return histogram;
    }
    /**
     * 增加 counter
     */
    incrementCounter(name, labels = {}, delta = 1) {
        const counter = this.metrics.get(name);
        if (!counter)
            throw new Error(`Counter ${name} not registered`);
        const key = this.serializeLabels(labels);
        counter.values.set(key, (counter.values.get(key) ?? 0) + delta);
    }
    /**
     * 设置 gauge 值
     */
    setGauge(name, labels = {}, value) {
        const gauge = this.metrics.get(name);
        if (!gauge)
            throw new Error(`Gauge ${name} not registered`);
        const key = this.serializeLabels(labels);
        gauge.values.set(key, value);
    }
    /**
     * 记录 histogram 观测值
     */
    observeHistogram(name, value, labels = {}) {
        const histogram = this.metrics.get(name);
        if (!histogram)
            throw new Error(`Histogram ${name} not registered`);
        const key = this.serializeLabels(labels);
        if (!histogram.observations.has(key))
            histogram.observations.set(key, []);
        histogram.observations.get(key).push(value);
        histogram.counts.set(key, (histogram.counts.get(key) ?? 0) + 1);
        histogram.sums.set(key, (histogram.sums.get(key) ?? 0) + value);
    }
    /**
     * 以 Prometheus text 格式 (v0.0.4) 输出所有 metrics
     */
    render() {
        const lines = [];
        for (const metric of this.metrics.values()) {
            lines.push(`# HELP ${metric.name} ${metric.help}`);
            lines.push(`# TYPE ${metric.name} ${metric.type}`);
            if (metric.type === 'counter' || metric.type === 'gauge') {
                for (const [key, value] of metric.values.entries()) {
                    const labels = key ? `{${key}}` : '';
                    lines.push(`${metric.name}${labels} ${value}`);
                }
            }
            else if (metric.type === 'histogram') {
                for (const [key, observations] of metric.observations.entries()) {
                    const labelsObj = this.deserializeLabels(key);
                    // 每个桶
                    for (const bucket of metric.buckets) {
                        const leLabels = { ...labelsObj, le: String(bucket) };
                        const count = observations.filter((v) => v <= bucket).length;
                        lines.push(`${metric.name}_bucket${this.formatLabels(leLabels)} ${count}`);
                    }
                    // +Inf 桶 (所有观测值都满足)
                    const infLabels = { ...labelsObj, le: '+Inf' };
                    lines.push(`${metric.name}_bucket${this.formatLabels(infLabels)} ${observations.length}`);
                    // sum / count
                    const sum = observations.reduce((s, v) => s + v, 0);
                    const countLabels = { ...labelsObj };
                    lines.push(`${metric.name}_sum${this.formatLabels(countLabels)} ${sum}`);
                    lines.push(`${metric.name}_count${this.formatLabels(countLabels)} ${observations.length}`);
                }
            }
        }
        return lines.join('\n') + '\n';
    }
    /**
     * 清空所有 metrics (测试用)
     */
    reset() {
        this.metrics.clear();
    }
    /**
     * 列出所有已注册的 metric 名称
     */
    listMetrics() {
        return Array.from(this.metrics.keys());
    }
    serializeLabels(labels) {
        const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
        if (entries.length === 0)
            return '';
        return entries.map(([k, v]) => `${k}="${this.escapeLabelValue(String(v))}"`).join(',');
    }
    formatLabels(labels) {
        const keys = Object.keys(labels);
        if (keys.length === 0)
            return '';
        return `{${this.serializeLabels(labels)}}`;
    }
    deserializeLabels(serialized) {
        if (!serialized)
            return {};
        const result = {};
        const regex = /(\w+)="([^"]*)"/g;
        let match;
        while ((match = regex.exec(serialized)) !== null) {
            result[match[1]] = match[2];
        }
        return result;
    }
    escapeLabelValue(value) {
        return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Boolean])
], MetricsService);
/**
 * 模块级默认 metrics 注册 — 通常在 MetricsService 启动时调用一次
 */
function registerDefaultMetrics(service) {
    service.registerCounter('http_requests_total', 'Total number of HTTP requests handled, labeled by method, path, status.');
    service.registerHistogram('http_request_duration_ms', 'HTTP request latency in milliseconds, labeled by method and path.');
    service.registerGauge('http_active_connections', 'Number of in-flight HTTP requests.');
    service.registerCounter('http_exceptions_total', 'Total number of HTTP request exceptions, labeled by method, path, kind.');
    service.registerGauge('process_uptime_seconds', 'Process uptime in seconds since service start.');
}
//# sourceMappingURL=metrics.service.js.map