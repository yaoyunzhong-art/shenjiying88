"use strict";
/**
 * metrics.entity.test.ts — 可观测性模块实体/类型契约测试
 *
 * 覆盖 MetricDefinition 枚举、MetricsReport 接口、AlertRule 类型
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const metrics_entity_1 = require("./metrics.entity");
(0, node_test_1.describe)('metrics.entity — METRIC_TYPE enum', () => {
    (0, node_test_1.default)('每个枚举值对应既定字符串', () => {
        strict_1.default.equal(metrics_entity_1.METRIC_TYPE.COUNTER, 'counter');
        strict_1.default.equal(metrics_entity_1.METRIC_TYPE.GAUGE, 'gauge');
        strict_1.default.equal(metrics_entity_1.METRIC_TYPE.HISTOGRAM, 'histogram');
    });
    (0, node_test_1.default)('枚举值是只读的，不可反向查找', () => {
        // TypeScript 数值枚举才有 reverse mapping，字符串枚举没有
        strict_1.default.equal(Object.keys(metrics_entity_1.METRIC_TYPE).length, 3);
    });
});
(0, node_test_1.describe)('metrics.entity — MetricsReport 类型契约', () => {
    (0, node_test_1.default)('完整报告 shape 可以通过类型检查', () => {
        const now = new Date().toISOString();
        const report = {
            generatedAt: now,
            totalMetrics: 3,
            snapshots: [
                {
                    name: 'http_requests_total',
                    type: metrics_entity_1.METRIC_TYPE.COUNTER,
                    help: 'Total HTTP requests',
                    labels: { method: 'GET', path: '/api/foo', status: '200' },
                    value: 42
                },
                {
                    name: 'http_active_connections',
                    type: metrics_entity_1.METRIC_TYPE.GAUGE,
                    help: 'Active connections',
                    labels: {},
                    value: 3
                },
                {
                    name: 'http_request_duration_ms',
                    type: metrics_entity_1.METRIC_TYPE.HISTOGRAM,
                    help: 'Request latency',
                    labels: { method: 'POST', path: '/api/bar' },
                    value: 150,
                    buckets: { '5': 0, '10': 0, '25': 1, '+Inf': 1 },
                    sum: 150,
                    count: 1
                }
            ]
        };
        strict_1.default.equal(report.totalMetrics, 3);
        strict_1.default.equal(report.snapshots.length, 3);
        strict_1.default.equal(report.snapshots[0]?.type, metrics_entity_1.METRIC_TYPE.COUNTER);
        strict_1.default.equal(report.snapshots[0]?.value, 42);
        strict_1.default.equal(report.snapshots[2]?.type, metrics_entity_1.METRIC_TYPE.HISTOGRAM);
        strict_1.default.equal(report.snapshots[2]?.buckets?.['+Inf'], 1);
    });
    (0, node_test_1.default)('最小报告只含生成时间即可', () => {
        const report = {
            generatedAt: new Date().toISOString(),
            totalMetrics: 0,
            snapshots: []
        };
        strict_1.default.equal(report.totalMetrics, 0);
        strict_1.default.equal(report.snapshots.length, 0);
    });
});
(0, node_test_1.describe)('metrics.entity — MetricSnapshot 类型契约', () => {
    (0, node_test_1.default)('Counter 快照不需要 buckets/sum/count', () => {
        const snapshot = {
            name: 'http_exceptions_total',
            type: metrics_entity_1.METRIC_TYPE.COUNTER,
            help: 'HTTP exceptions',
            labels: { method: 'GET', kind: 'Error' },
            value: 5
        };
        strict_1.default.equal(snapshot.name, 'http_exceptions_total');
        strict_1.default.equal(snapshot.value, 5);
        strict_1.default.equal(snapshot.buckets, undefined);
        strict_1.default.equal(snapshot.sum, undefined);
        strict_1.default.equal(snapshot.count, undefined);
    });
    (0, node_test_1.default)('Gauge 快照带空 labels', () => {
        const snapshot = {
            name: 'process_uptime_seconds',
            type: metrics_entity_1.METRIC_TYPE.GAUGE,
            help: 'Uptime',
            labels: {},
            value: 3600
        };
        strict_1.default.equal(snapshot.value, 3600);
        strict_1.default.deepEqual(snapshot.labels, {});
    });
    (0, node_test_1.default)('Histogram 快照包含分布信息', () => {
        const snapshot = {
            name: 'http_request_duration_ms',
            type: metrics_entity_1.METRIC_TYPE.HISTOGRAM,
            help: 'Duration',
            labels: { method: 'GET', path: '/metrics' },
            value: 0,
            buckets: { '5': 0, '10': 3, '+Inf': 5 },
            sum: 120,
            count: 5
        };
        strict_1.default.equal(snapshot.buckets?.['10'], 3);
        strict_1.default.equal(snapshot.count, 5);
        strict_1.default.equal(snapshot.sum, 120);
    });
});
(0, node_test_1.describe)('metrics.entity — AlertRule 类型契约', () => {
    (0, node_test_1.default)('完整告警规则定义', () => {
        const rule = {
            name: 'high_error_rate',
            metricName: 'http_exceptions_total',
            operator: '>',
            threshold: 100,
            duration: '5m',
            severity: 'warning',
            description: '5分钟内异常请求超过100次'
        };
        strict_1.default.equal(rule.name, 'high_error_rate');
        strict_1.default.equal(rule.metricName, 'http_exceptions_total');
        strict_1.default.equal(rule.operator, '>');
        strict_1.default.equal(rule.threshold, 100);
        strict_1.default.equal(rule.duration, '5m');
    });
    (0, node_test_1.default)('告警规则支持最小字段定义', () => {
        const rule = {
            name: 'critical_latency',
            metricName: 'http_request_duration_ms',
            operator: '>',
            threshold: 5000,
            duration: '1m',
            severity: 'critical'
        };
        // description 可选
        strict_1.default.equal(rule.description, undefined);
    });
});
//# sourceMappingURL=metrics.entity.test.js.map