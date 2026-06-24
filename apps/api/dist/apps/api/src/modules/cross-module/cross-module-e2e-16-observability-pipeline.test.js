"use strict";
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const api_1 = require("@opentelemetry/api");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const logger_service_1 = require("../observability/logger/logger.service");
const tracing_service_1 = require("../observability/tracing/tracing.service");
const metrics_service_1 = require("../observability/metrics.service");
const metrics_controller_1 = require("../observability/metrics.controller");
const exporter = new sdk_trace_base_1.InMemorySpanExporter();
api_1.trace.setGlobalTracerProvider(new sdk_trace_base_1.BasicTracerProvider({ spanProcessors: [new sdk_trace_base_1.SimpleSpanProcessor(exporter)] }));
function findSpan(spans, name) {
    return spans.find((s) => s.name === name);
}
function buildCapturingStream() {
    const lines = [];
    return {
        lines,
        stream: {
            write: (s) => {
                for (const l of s.split('\n'))
                    if (l.trim())
                        lines.push(l);
                return true;
            },
        },
    };
}
let TestController = class TestController {
    logger;
    tracing;
    metrics;
    constructor(logger, tracing, metrics) {
        this.logger = logger;
        this.tracing = tracing;
        this.metrics = metrics;
        this.metrics.registerCounter('test_requests', 'Test request counter');
        this.metrics.registerHistogram('test_duration_ms', 'Test duration histogram');
        this.metrics.registerGauge('test_connections', 'Test connections gauge');
    }
    logInfo(body) {
        this.logger.info({ action: body.action, userId: body.userId }, body.msg);
        return { ok: true };
    }
    logChild(body) {
        this.logger
            .child({ requestId: body.requestId, tenantId: body.tenantId })
            .info({ orderId: body.orderId }, 'child log with bindings');
        return { ok: true };
    }
    logRedact() {
        this.logger.info({ password: 'secret123', token: 'tkn_abc' }, 'sensitive');
        return { ok: true };
    }
    async traceNormal(body) {
        return this.tracing.withSpan(body.spanName ?? 'test.normal', async (span) => {
            span.setAttribute('tenantId', body.tenantId);
            return { value: body.data ?? 1 };
        });
    }
    async traceError(body) {
        try {
            await this.tracing.withSpan('test.error', async () => {
                throw new Error(body.msg ?? 'boom');
            });
        }
        catch {
            /* expected */
        }
        return { handled: true };
    }
    incCounter(body) {
        this.metrics.incrementCounter('test_requests', {
            method: 'POST',
            path: '/test',
            status: '200',
        });
        return { ok: true };
    }
    obsHistogram(body) {
        this.metrics.observeHistogram('test_duration_ms', body.value ?? 50, { path: '/test' });
        return { ok: true };
    }
    setGaugeVal(body) {
        this.metrics.setGauge('test_connections', {}, body.value ?? 42);
        return { ok: true };
    }
    renderMetrics() {
        return { text: this.metrics.render() };
    }
    async obsPipeline(body) {
        const reqLogger = this.logger.child({ requestId: body.requestId });
        this.metrics.incrementCounter('test_requests', {
            method: 'POST',
            path: '/chain/obs-pipeline',
            status: '200',
        });
        await this.tracing.withSpan('chain.obs', async (span) => {
            span.setAttribute('tenantId', body.tenantId);
            await this.tracing.withSpan('chain.obs.inner', async (innerSpan) => {
                innerSpan.setAttribute('count', body.count ?? 1);
                reqLogger.info({ action: 'inner-ok' }, 'inner log');
                this.metrics.observeHistogram('test_duration_ms', 50 + Math.random() * 100, {
                    path: '/chain/obs-pipeline',
                });
            });
        });
        this.metrics.setGauge('test_connections', {}, 1);
        return { ok: true };
    }
};
__decorate([
    (0, common_1.Post)('log/info'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "logInfo", null);
__decorate([
    (0, common_1.Post)('log/child'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "logChild", null);
__decorate([
    (0, common_1.Post)('log/redact'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestController.prototype, "logRedact", null);
__decorate([
    (0, common_1.Post)('trace/normal'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "traceNormal", null);
__decorate([
    (0, common_1.Post)('trace/error'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "traceError", null);
__decorate([
    (0, common_1.Post)('metrics/counter'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "incCounter", null);
__decorate([
    (0, common_1.Post)('metrics/histogram'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "obsHistogram", null);
__decorate([
    (0, common_1.Post)('metrics/gauge'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "setGaugeVal", null);
__decorate([
    (0, common_1.Get)('metrics/render'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestController.prototype, "renderMetrics", null);
__decorate([
    (0, common_1.Post)('chain/obs-pipeline'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "obsPipeline", null);
TestController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)(logger_service_1.LoggerService)),
    __param(1, (0, common_1.Inject)(tracing_service_1.TracingService)),
    __param(2, (0, common_1.Inject)(metrics_service_1.MetricsService)),
    __metadata("design:paramtypes", [typeof (_a = typeof logger_service_1.LoggerService !== "undefined" && logger_service_1.LoggerService) === "function" ? _a : Object, typeof (_b = typeof tracing_service_1.TracingService !== "undefined" && tracing_service_1.TracingService) === "function" ? _b : Object, metrics_service_1.MetricsService])
], TestController);
async function buildApp() {
    const { lines, stream } = buildCapturingStream();
    const logger = new logger_service_1.LoggerService({ level: 'trace', pretty: false, redactPaths: ['password', 'token'], serviceName: 'e2e-test' }, stream);
    const tracing = new tracing_service_1.TracingService('e2e');
    const metrics = new metrics_service_1.MetricsService(false);
    exporter.reset();
    const module = await testing_1.Test.createTestingModule({
        controllers: [TestController, metrics_controller_1.MetricsController],
        providers: [
            { provide: logger_service_1.LoggerService, useValue: logger },
            { provide: tracing_service_1.TracingService, useValue: tracing },
            { provide: metrics_service_1.MetricsService, useValue: metrics },
        ],
    }).compile();
    const app = module.createNestApplication();
    app.use((_r, _s, n) => n());
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, lines, metrics };
}
function getData(res) {
    return res.body?.data ?? res.body;
}
// ── Tests ──
(0, node_test_1.default)('跨模块链#16 正例: Logger info/child/redact', async () => {
    const { app, lines } = await buildApp();
    const srv = app.getHttpServer();
    try {
        const n = lines.length;
        await (0, supertest_1.default)(srv).post('/log/info').send({ action: 'login', msg: 'hello' }).expect(201);
        await (0, supertest_1.default)(srv)
            .post('/log/child')
            .send({ requestId: 'r1', tenantId: 't1', orderId: 'o1' })
            .expect(201);
        await (0, supertest_1.default)(srv).post('/log/redact').expect(201);
        strict_1.default.ok(lines.length >= n + 3);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('跨模块链#16 正例: child logger 继承 bindings', async () => {
    const { app, lines } = await buildApp();
    const srv = app.getHttpServer();
    try {
        const n = lines.length;
        await (0, supertest_1.default)(srv)
            .post('/log/child')
            .send({ requestId: 'r2', tenantId: 't2', orderId: 'o2' })
            .expect(201);
        const l = lines.slice(n).find((x) => x.includes('child log with bindings'));
        strict_1.default.ok(l);
        const p = JSON.parse(l);
        strict_1.default.equal(p.requestId, 'r2');
        strict_1.default.equal(p.tenantId, 't2');
        strict_1.default.equal(p.orderId, 'o2');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('跨模块链#16 正例: redact 生效', async () => {
    const { app, lines } = await buildApp();
    const srv = app.getHttpServer();
    try {
        const n = lines.length;
        await (0, supertest_1.default)(srv).post('/log/redact').expect(201);
        const l = lines.slice(n).find((x) => x.includes('sensitive'));
        strict_1.default.ok(l);
        const p = JSON.parse(l);
        strict_1.default.match(String(p.password), /REDACTED/i, 'password 应被 redact');
        strict_1.default.match(String(p.token), /REDACTED/i, 'token 应被 redact');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('跨模块链#16 正例: TracingService.withSpan 正常/异常', async () => {
    const { app } = await buildApp();
    const srv = app.getHttpServer();
    try {
        exporter.reset();
        await (0, supertest_1.default)(srv)
            .post('/trace/normal')
            .send({ spanName: 'my.op', tenantId: 't1', data: 42 })
            .expect(201);
        await (0, supertest_1.default)(srv).post('/trace/error').send({ msg: 'fail' }).expect(201);
        const spans = exporter.getFinishedSpans();
        const n = findSpan(spans, 'my.op');
        strict_1.default.ok(n, `应有 my.op: ${spans.map((s) => s.name)}`);
        strict_1.default.equal(n.status.code, 1);
        const e = findSpan(spans, 'test.error');
        strict_1.default.ok(e, `应有 test.error: ${spans.map((s) => s.name)}`);
        strict_1.default.equal(e.status.code, 2);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('跨模块链#16 正例: Metrics counter/histogram/gauge', async () => {
    const { app } = await buildApp();
    const srv = app.getHttpServer();
    try {
        for (let i = 0; i < 3; i++)
            await (0, supertest_1.default)(srv).post('/metrics/counter').expect(201);
        await (0, supertest_1.default)(srv).post('/metrics/histogram').send({ value: 50 }).expect(201);
        await (0, supertest_1.default)(srv).post('/metrics/gauge').send({ value: 42 }).expect(201);
        const r = await (0, supertest_1.default)(srv).get('/metrics/render').expect(200);
        const text = getData(r).text;
        strict_1.default.ok(text.includes('test_requests'), `缺少 test_requests: ${text}`);
        strict_1.default.ok(text.includes('test_duration_ms'), `缺少 test_duration_ms`);
        strict_1.default.ok(text.includes('test_connections'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('跨模块链#16 正例: GET /metrics Prometheus 格式', async () => {
    const { app } = await buildApp();
    const srv = app.getHttpServer();
    try {
        const r = await (0, supertest_1.default)(srv).get('/metrics').expect(200);
        strict_1.default.ok(r.text.includes('HELP'));
        strict_1.default.ok(r.text.includes('TYPE'));
        strict_1.default.ok(r.text.includes('http_requests_total'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('跨模块链#16 复合: Logger+Tracing+Metrics 同时工作', async () => {
    const { app } = await buildApp();
    const srv = app.getHttpServer();
    try {
        exporter.reset();
        await (0, supertest_1.default)(srv)
            .post('/chain/obs-pipeline')
            .send({ requestId: 'r-obs', tenantId: 't-obs', count: 5 })
            .expect(201);
        const spans = exporter.getFinishedSpans();
        strict_1.default.ok(findSpan(spans, 'chain.obs'));
        strict_1.default.ok(findSpan(spans, 'chain.obs.inner'));
        const r = await (0, supertest_1.default)(srv).get('/metrics/render').expect(200);
        strict_1.default.ok(getData(r).text.includes('test_requests'));
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=cross-module-e2e-16-observability-pipeline.test.js.map