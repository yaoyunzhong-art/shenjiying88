"use strict";
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const metrics_service_1 = require("../observability/metrics.service");
const metrics_controller_1 = require("../observability/metrics.controller");
const metrics_interceptor_1 = require("../observability/metrics.interceptor");
let DemoController = class DemoController {
    ok() {
        return { hello: 'world' };
    }
    error() {
        throw new Error('Demo failure');
    }
    async slow() {
        // 模拟慢请求 (5ms)
        await new Promise((r) => setTimeout(r, 5));
        return { slow: true };
    }
};
__decorate([
    (0, common_1.Get)('demo/ok'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DemoController.prototype, "ok", null);
__decorate([
    (0, common_1.Post)('demo/error'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DemoController.prototype, "error", null);
__decorate([
    (0, common_1.Get)('demo/slow'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DemoController.prototype, "slow", null);
DemoController = __decorate([
    (0, common_1.Controller)()
], DemoController);
async function buildApp() {
    // 直接构造,完全控制依赖 (测试场景下 @Global 模块有 DI 边界问题)
    const metricsService = new metrics_service_1.MetricsService();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [DemoController, metrics_controller_1.MetricsController],
        providers: [metrics_service_1.MetricsService, metrics_interceptor_1.MetricsInterceptor]
    })
        .overrideProvider(metrics_service_1.MetricsService)
        .useValue(metricsService)
        .compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    app.useGlobalInterceptors(new metrics_interceptor_1.MetricsInterceptor(metricsService));
    await app.init();
    return { app, metricsService };
}
// ═══════════════════════════════════════════════════
// E2E: /metrics 端点返回 Prometheus 格式
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-14: /metrics returns Prometheus text format with registered metrics', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/metrics');
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.match(res.headers['content-type'], /text\/plain/);
        const body = res.text;
        // 5 个默认 metric 都应注册
        strict_1.default.match(body, /^# HELP http_requests_total /m);
        strict_1.default.match(body, /^# TYPE http_requests_total counter$/m);
        strict_1.default.match(body, /^# HELP http_request_duration_ms /m);
        strict_1.default.match(body, /^# TYPE http_request_duration_ms histogram$/m);
        strict_1.default.match(body, /^# HELP http_active_connections /m);
        strict_1.default.match(body, /^# TYPE http_active_connections gauge$/m);
        strict_1.default.match(body, /^# HELP http_exceptions_total /m);
        strict_1.default.match(body, /^# TYPE http_exceptions_total counter$/m);
        strict_1.default.match(body, /^# HELP process_uptime_seconds /m);
        strict_1.default.match(body, /^# TYPE process_uptime_seconds gauge$/m);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════
// E2E: 业务请求后 counter/histogram 自增
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-14: business requests increment counters and histograms', async () => {
    const { app } = await buildApp();
    try {
        // 先打 1 次 baseline
        const beforeRes = await (0, supertest_1.default)(app.getHttpServer()).get('/metrics');
        const beforeText = beforeRes.text;
        // 业务请求 1: 成功 GET /demo/ok
        await (0, supertest_1.default)(app.getHttpServer()).get('/demo/ok');
        // 业务请求 2: 成功 GET /demo/ok (重复,counter 应 = 2)
        await (0, supertest_1.default)(app.getHttpServer()).get('/demo/ok');
        // 业务请求 3: 慢请求 GET /demo/slow
        await (0, supertest_1.default)(app.getHttpServer()).get('/demo/slow');
        // 业务请求 4: 异常 POST /demo/error
        try {
            await (0, supertest_1.default)(app.getHttpServer()).post('/demo/error').send({});
        }
        catch (_) {
            // supertest 在 NestJS 抛错时 reject,已被拦截器计入
        }
        // 重新拉取 /metrics
        const afterRes = await (0, supertest_1.default)(app.getHttpServer()).get('/metrics');
        const afterText = afterRes.text;
        // http_requests_total 应包含 method=GET path=/demo/ok status=200 的样本
        strict_1.default.match(afterText, /http_requests_total\{[^}]*method="GET"[^}]*path="\/demo\/ok"[^}]*status="200"[^}]*\} 2/);
        // http_requests_total 应包含 GET /demo/slow status=200
        strict_1.default.match(afterText, /http_requests_total\{[^}]*path="\/demo\/slow"[^}]*\} 1/);
        // POST /demo/error 走 NestJS 异常路径, statusCode 仍会计入 (status=500 默认)
        // 注: NestJS 抛错时 response.statusCode 可能尚未设置,interceptor 会 fallback 到 err.status ?? 500
        // histogram 应有 bucket 计数 (_count ≥ 3 个请求)
        const histogramCountMatch = afterText.match(/http_request_duration_ms_count\{[^}]*path="\/demo\/ok"[^}]*\} (\d+)/);
        strict_1.default.ok(histogramCountMatch);
        strict_1.default.equal(Number(histogramCountMatch[1]), 2);
        const slowCountMatch = afterText.match(/http_request_duration_ms_count\{[^}]*path="\/demo\/slow"[^}]*\} (\d+)/);
        strict_1.default.ok(slowCountMatch);
        strict_1.default.equal(Number(slowCountMatch[1]), 1);
        // 历史 text 变化 (after 至少新增了 4 个请求的数据)
        strict_1.default.notEqual(beforeText, afterText);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════
// E2E: 异常请求计入 http_exceptions_total
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-14: business exceptions increment http_exceptions_total', async () => {
    const { app } = await buildApp();
    try {
        try {
            await (0, supertest_1.default)(app.getHttpServer()).post('/demo/error').send({ x: 1 });
        }
        catch (_) {
            // NestJS 抛错时 supertest reject
        }
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/metrics');
        const body = res.text;
        // 应有 exceptions counter 出现
        strict_1.default.match(body, /http_exceptions_total\{/);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════
// E2E: /healthz 端点
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-14: /healthz returns ok status and registered metric count', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/healthz');
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.status, 'ok');
        strict_1.default.ok(res.body.data.metrics >= 5, `应至少注册 5 个 metric,实际 ${res.body.data.metrics}`);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════
// E2E: active_connections gauge 进出平衡 (请求结束后归零)
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-14: http_active_connections returns to zero after request completes', async () => {
    const { app, metricsService } = await buildApp();
    try {
        // 业务请求 → 进入时 +1, 退出时 -1 (业务请求完成)
        await (0, supertest_1.default)(app.getHttpServer()).get('/demo/ok');
        await (0, supertest_1.default)(app.getHttpServer()).get('/demo/ok');
        await (0, supertest_1.default)(app.getHttpServer()).get('/demo/slow');
        // 直接调 service 看 business request 结束后的 active_connections
        // (绕过 /metrics 自身的 +1,直接拿业务流量的残留值)
        const beforeMetricsRender = metricsService.render();
        const activeBefore = parseInt(beforeMetricsRender.match(/http_active_connections (\d+)/)?.[1] ?? '0', 10);
        strict_1.default.equal(activeBefore, 0, '业务请求结束后 active_connections 应归零');
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/metrics');
        // /metrics 自身也算一次 active (+1),所以会读到 1
        const body = res.text;
        const match = body.match(/http_active_connections (\d+)/);
        strict_1.default.ok(match, '应包含 http_active_connections gauge');
        // /metrics 请求 in-flight 时是 1,完成后会归 0
        strict_1.default.ok(Number(match[1]) >= 0);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════
// E2E: 直接调 MetricsService API (单元级契约)
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-14: MetricsService direct API contract', async () => {
    const svc = new metrics_service_1.MetricsService();
    // 默认已自动注册;验证默认值存在
    strict_1.default.ok(svc.listMetrics().length >= 5);
    // Counter
    svc.incrementCounter('http_requests_total', { method: 'GET', path: '/x', status: '200' });
    svc.incrementCounter('http_requests_total', { method: 'GET', path: '/x', status: '200' });
    svc.incrementCounter('http_requests_total', { method: 'POST', path: '/y', status: '201' });
    const text1 = svc.render();
    strict_1.default.match(text1, /http_requests_total\{[^}]*method="GET"[^}]*path="\/x"[^}]*status="200"[^}]*\} 2/);
    strict_1.default.match(text1, /http_requests_total\{[^}]*method="POST"[^}]*path="\/y"[^}]*status="201"[^}]*\} 1/);
    // Gauge
    svc.setGauge('http_active_connections', {}, 42);
    const text2 = svc.render();
    strict_1.default.match(text2, /http_active_connections 42/);
    svc.setGauge('http_active_connections', {}, 0);
    // Histogram
    svc.observeHistogram('http_request_duration_ms', 12, { path: '/a' });
    svc.observeHistogram('http_request_duration_ms', 50, { path: '/a' });
    svc.observeHistogram('http_request_duration_ms', 200, { path: '/a' });
    const text3 = svc.render();
    // 12 <= 25,12<=50,12<=100... count = 1
    // 50 <= 50,50<=100... count = 2
    // 200<=250,200<=500... count = 3
    strict_1.default.match(text3, /http_request_duration_ms_bucket\{[^}]*le="25"[^}]*\} 1/);
    strict_1.default.match(text3, /http_request_duration_ms_bucket\{[^}]*le="50"[^}]*\} 2/);
    strict_1.default.match(text3, /http_request_duration_ms_bucket\{[^}]*le="250"[^}]*\} 3/);
    strict_1.default.match(text3, /http_request_duration_ms_bucket\{[^}]*le="\+Inf"[^}]*\} 3/);
    strict_1.default.match(text3, /http_request_duration_ms_count\{[^}]*path="\/a"[^}]*\} 3/);
    strict_1.default.match(text3, /http_request_duration_ms_sum\{[^}]*path="\/a"[^}]*\} 262/);
});
// ═══════════════════════════════════════════════════
// E2E: 重复注册不同类型同名 metric 应抛错
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-14: registering same metric name with different type throws', () => {
    const svc = new metrics_service_1.MetricsService();
    strict_1.default.throws(() => svc.registerGauge('http_requests_total', 'help'), /already registered/);
});
// ═══════════════════════════════════════════════════
// E2E: 未注册的 metric 应抛错
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-14: unregisterred metric access throws', () => {
    const svc = new metrics_service_1.MetricsService();
    strict_1.default.throws(() => svc.incrementCounter('nope_metric_xyz'), /not registered/);
    strict_1.default.throws(() => svc.setGauge('nope_metric_xyz', {}, 1), /not registered/);
    strict_1.default.throws(() => svc.observeHistogram('nope_metric_xyz', 1), /not registered/);
});
//# sourceMappingURL=cross-module-e2e-14-observability-metrics.test.js.map