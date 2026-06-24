"use strict";
/**
 * metrics.service.test.ts — MetricsService 单元测试
 *
 * 覆盖:
 *   - Counter / Gauge / Histogram 注册与操作
 *   - 重复注册保护 (冲突类型抛错)
 *   - Prometheus 文本渲染格式
 *   - reset / listMetrics
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
const metrics_service_1 = require("./metrics.service");
function freshService() {
    // 构造时已自动注册 5 个默认 metric;
    // 调用 reset() 清空,得到一个干净的 service 用于本测试
    const svc = new metrics_service_1.MetricsService();
    svc.reset();
    return svc;
}
(0, node_test_1.describe)('MetricsService — 注册', () => {
    (0, node_test_1.default)('registerCounter 注册并返回 counter', () => {
        const svc = freshService();
        const counter = svc.registerCounter('test_counter', 'Test counter help');
        strict_1.default.ok(counter);
        strict_1.default.equal(counter.type, 'counter');
        strict_1.default.equal(counter.name, 'test_counter');
    });
    (0, node_test_1.default)('registerGauge 注册并返回 gauge', () => {
        const svc = freshService();
        const gauge = svc.registerGauge('test_gauge', 'Test gauge help');
        strict_1.default.ok(gauge);
        strict_1.default.equal(gauge.type, 'gauge');
    });
    (0, node_test_1.default)('registerHistogram 注册并返回 histogram', () => {
        const svc = freshService();
        const hist = svc.registerHistogram('test_hist', 'Test histogram help');
        strict_1.default.ok(hist);
        strict_1.default.equal(hist.type, 'histogram');
        strict_1.default.ok(hist.buckets.length >= 5);
    });
    (0, node_test_1.default)('registerHistogram 支持自定义桶', () => {
        const svc = freshService();
        const hist = svc.registerHistogram('custom_hist', 'Custom buckets', [1, 10, 100]);
        strict_1.default.deepEqual(hist.buckets, [1, 10, 100]);
    });
    (0, node_test_1.default)('重复注册同名的相同类型返回现有实例', () => {
        const svc = freshService();
        const c1 = svc.registerCounter('dup', 'help');
        const c2 = svc.registerCounter('dup', 'help');
        strict_1.default.equal(c1, c2);
    });
    (0, node_test_1.default)('重复注册同名的不同类型抛出错误', () => {
        const svc = freshService();
        svc.registerCounter('conflict', 'first');
        strict_1.default.throws(() => svc.registerGauge('conflict', 'second'), /already registered as/);
    });
    (0, node_test_1.default)('registerDefaultMetrics 注册 5 个默认指标', () => {
        const svc = freshService();
        (0, metrics_service_1.registerDefaultMetrics)(svc);
        const names = svc.listMetrics();
        strict_1.default.equal(names.length, 5);
        strict_1.default.ok(names.includes('http_requests_total'));
        strict_1.default.ok(names.includes('http_request_duration_ms'));
        strict_1.default.ok(names.includes('http_active_connections'));
        strict_1.default.ok(names.includes('http_exceptions_total'));
        strict_1.default.ok(names.includes('process_uptime_seconds'));
    });
});
(0, node_test_1.describe)('MetricsService — Counter 操作', () => {
    (0, node_test_1.default)('incrementCounter 默认步长为 1', () => {
        const svc = freshService();
        svc.registerCounter('req', 'requests');
        svc.incrementCounter('req', { method: 'GET' });
        const render = svc.render();
        strict_1.default.ok(render.includes('req{method="GET"} 1'));
    });
    (0, node_test_1.default)('incrementCounter 支持自定义步长', () => {
        const svc = freshService();
        svc.registerCounter('req', 'requests');
        svc.incrementCounter('req', { method: 'POST' }, 5);
        svc.incrementCounter('req', { method: 'POST' }, 3);
        const render = svc.render();
        strict_1.default.ok(render.includes('req{method="POST"} 8'));
    });
    (0, node_test_1.default)('未注册 counter 抛错', () => {
        const svc = freshService();
        strict_1.default.throws(() => svc.incrementCounter('nope'), /not registered/);
    });
});
(0, node_test_1.describe)('MetricsService — Gauge 操作', () => {
    (0, node_test_1.default)('setGauge 设置值', () => {
        const svc = freshService();
        svc.registerGauge('conn', 'connections');
        svc.setGauge('conn', {}, 42);
        const render = svc.render();
        strict_1.default.ok(render.includes('conn 42'));
    });
    (0, node_test_1.default)('setGauge 覆盖值', () => {
        const svc = freshService();
        svc.registerGauge('conn', 'connections');
        svc.setGauge('conn', { pool: 'main' }, 10);
        svc.setGauge('conn', { pool: 'main' }, 20);
        const render = svc.render();
        strict_1.default.ok(render.includes('conn{pool="main"} 20'));
    });
    (0, node_test_1.default)('未注册 gauge 抛错', () => {
        const svc = freshService();
        strict_1.default.throws(() => svc.setGauge('nope', {}, 0), /not registered/);
    });
});
(0, node_test_1.describe)('MetricsService — Histogram 操作', () => {
    (0, node_test_1.default)('observeHistogram 记录值', () => {
        const svc = freshService();
        svc.registerHistogram('latency', 'latency help');
        svc.observeHistogram('latency', 12, { path: '/foo' });
        const render = svc.render();
        // 注意: labels 中 path 后于 le（桶标签）, 因为 serialize 排序是字母序
        strict_1.default.ok(render.includes('latency_count{path="/foo"} 1'), `render:\n${render}`);
        strict_1.default.ok(render.includes('latency_sum{path="/foo"} 12'), `render:\n${render}`);
    });
    (0, node_test_1.default)('observeHistogram 多值汇总', () => {
        const svc = freshService();
        svc.registerHistogram('latency', 'latency help');
        svc.observeHistogram('latency', 5, { method: 'GET', path: '/bar' });
        svc.observeHistogram('latency', 15, { method: 'GET', path: '/bar' });
        const render = svc.render();
        strict_1.default.ok(render.includes('latency_count{method="GET",path="/bar"} 2'), `render:\n${render}`);
        strict_1.default.ok(render.includes('latency_sum{method="GET",path="/bar"} 20'), `render:\n${render}`);
    });
    (0, node_test_1.default)('buckets 分桶正确', () => {
        const svc = freshService();
        svc.registerHistogram('latency', 'latency', [5, 10, 25]);
        svc.observeHistogram('latency', 3, {});
        svc.observeHistogram('latency', 12, {});
        const render = svc.render();
        const lines = render.split('\n');
        // le 排序在 path 前，但这里没传 labels
        const bucket5 = lines.find(l => l.startsWith('latency_bucket{le="5"}'));
        strict_1.default.ok(bucket5, `expected bucket5 line, got:\n${render}`);
        strict_1.default.match(bucket5, / 1$/);
        const bucketInf = lines.find(l => l.startsWith('latency_bucket{le="+Inf"}'));
        strict_1.default.ok(bucketInf);
        strict_1.default.match(bucketInf, / 2$/);
    });
    (0, node_test_1.default)('未注册 histogram 抛错', () => {
        const svc = freshService();
        strict_1.default.throws(() => svc.observeHistogram('nope', 1), /not registered/);
    });
});
(0, node_test_1.describe)('MetricsService — render 输出格式', () => {
    (0, node_test_1.default)('HELP 和 TYPE 行正确', () => {
        const svc = freshService();
        svc.registerCounter('c', 'counter help');
        const render = svc.render();
        strict_1.default.ok(render.includes('# HELP c counter help'));
        strict_1.default.ok(render.includes('# TYPE c counter'));
    });
    (0, node_test_1.default)('空 metrics 渲染仅为换行', () => {
        const svc = freshService();
        const render = svc.render();
        strict_1.default.equal(render, '\n');
    });
    (0, node_test_1.default)('换行符结尾', () => {
        const svc = freshService();
        svc.registerCounter('c', 'help');
        const render = svc.render();
        strict_1.default.ok(render.endsWith('\n'));
    });
});
(0, node_test_1.describe)('MetricsService — 管理方法', () => {
    (0, node_test_1.default)('listMetrics 返回已注册指标名称', () => {
        const svc = freshService();
        svc.registerCounter('a', 'help a');
        svc.registerGauge('b', 'help b');
        const names = svc.listMetrics();
        strict_1.default.ok(names.includes('a'));
        strict_1.default.ok(names.includes('b'));
        strict_1.default.equal(names.length, 2);
    });
    (0, node_test_1.default)('reset 清空所有指标', () => {
        const svc = freshService();
        svc.registerCounter('a', 'help');
        svc.reset();
        strict_1.default.equal(svc.listMetrics().length, 0);
    });
});
(0, node_test_1.describe)('MetricsService — 标签编码', () => {
    (0, node_test_1.default)('标签值中特殊字符正确转义', () => {
        const svc = freshService();
        svc.registerCounter('test', 'test help');
        svc.incrementCounter('test', { path: '/a"b\nc\\d' });
        const render = svc.render();
        strict_1.default.ok(render.includes('path="/a\\"b\\nc\\\\d"'));
    });
    (0, node_test_1.default)('空 labels 渲染时不带花括号', () => {
        const svc = freshService();
        svc.registerGauge('g', 'help');
        svc.setGauge('g', {}, 1);
        const render = svc.render();
        strict_1.default.ok(render.includes('g 1'));
        strict_1.default.ok(!render.includes('g{}'));
    });
});
//# sourceMappingURL=metrics.service.test.js.map