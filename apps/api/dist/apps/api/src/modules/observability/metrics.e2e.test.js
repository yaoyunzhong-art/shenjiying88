"use strict";
/**
 * E2E: Metrics 可观测性 HTTP 链路
 *
 * 验证:
 *   - GET /healthz 返回 { status, metrics }
 *   - GET /metrics 返回 Prometheus text/plain 格式 (v0.0.4)
 *   - 默认注册 5 个指标 HELP/TYPE
 *   - 路径路由正确: /healthz AND /metrics
 *   - 不带认证也可访问
 *   - reset 后重新注册仍工作
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
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const metrics_service_1 = require("./metrics.service");
const metrics_controller_1 = require("./metrics.controller");
async function createTestApp() {
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [metrics_controller_1.MetricsController],
        providers: [metrics_service_1.MetricsService],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
}
// ── 基本路由 ──
(0, node_test_1.default)('E2E: GET /healthz 返回 200 和健康状态', async () => {
    const app = await createTestApp();
    const httpServer = app.getHttpServer();
    const res = await (0, supertest_1.default)(httpServer).get('/healthz').expect(200);
    strict_1.default.ok(res.body, '应返回 body');
    strict_1.default.equal(res.body.status, 'ok', 'status 应为 "ok"');
    strict_1.default.equal(typeof res.body.metrics, 'number', 'metrics 应为数字');
    strict_1.default.equal(res.body.metrics, 5, '默认应有 5 个已注册指标');
    await app.close();
});
(0, node_test_1.default)('E2E: GET /healthz 重复调用始终返回同一格式', async () => {
    const app = await createTestApp();
    const httpServer = app.getHttpServer();
    const res1 = await (0, supertest_1.default)(httpServer).get('/healthz').expect(200);
    const res2 = await (0, supertest_1.default)(httpServer).get('/healthz').expect(200);
    strict_1.default.equal(res1.body.status, 'ok');
    strict_1.default.equal(res2.body.status, 'ok');
    strict_1.default.equal(typeof res1.body.metrics, 'number');
    strict_1.default.equal(typeof res2.body.metrics, 'number');
    await app.close();
});
// ── /metrics Prometheus 格式 ──
(0, node_test_1.default)('E2E: GET /metrics 返回 text/plain 格式', async () => {
    const app = await createTestApp();
    const httpServer = app.getHttpServer();
    const res = await (0, supertest_1.default)(httpServer).get('/metrics').expect(200);
    const ct = res.headers['content-type'] ?? '';
    strict_1.default.ok(ct.includes('text/plain'), `Content-Type 应包含 text/plain, 实际: ${ct}`);
    const body = res.text;
    strict_1.default.ok(typeof body === 'string', 'body 应为字符串');
    strict_1.default.ok(body.length > 0, 'body 不应为空');
    strict_1.default.ok(body.includes('# HELP'), '应包含 HELP 注释行');
    strict_1.default.ok(body.includes('# TYPE'), '应包含 TYPE 注释行');
    await app.close();
});
(0, node_test_1.default)('E2E: /metrics 包含全部 5 个默认指标', async () => {
    const app = await createTestApp();
    const httpServer = app.getHttpServer();
    const res = await (0, supertest_1.default)(httpServer).get('/metrics').expect(200);
    const body = res.text;
    const expected = [
        { name: 'http_requests_total', type: 'counter' },
        { name: 'http_request_duration_ms', type: 'histogram' },
        { name: 'http_active_connections', type: 'gauge' },
        { name: 'http_exceptions_total', type: 'counter' },
        { name: 'process_uptime_seconds', type: 'gauge' },
    ];
    for (const { name, type } of expected) {
        strict_1.default.ok(body.includes(`# TYPE ${name} ${type}`), `缺少 TYPE ${name} ${type}`);
        strict_1.default.ok(body.includes(`# HELP ${name}`), `缺少 HELP ${name}`);
    }
    await app.close();
});
(0, node_test_1.default)('E2E: /metrics 初始时无数据行 (仅 HELP/TYPE)', async () => {
    const app = await createTestApp();
    const httpServer = app.getHttpServer();
    const res = await (0, supertest_1.default)(httpServer).get('/metrics').expect(200);
    const dataLines = res.text
        .split('\n')
        .filter((l) => /^[a-zA-Z_]/.test(l) && !l.startsWith('#'));
    strict_1.default.equal(dataLines.length, 0, '初始时不应有 metric 数据行');
    await app.close();
});
(0, node_test_1.default)('E2E: /metrics 内容以换行结尾', async () => {
    const app = await createTestApp();
    const httpServer = app.getHttpServer();
    const res = await (0, supertest_1.default)(httpServer).get('/metrics').expect(200);
    strict_1.default.ok(res.text.endsWith('\n'), '输出应以换行结尾');
    await app.close();
});
// ── 服务操作影响 ──
(0, node_test_1.default)('E2E: reset() 后 getHealth 返回 metrics=0', async () => {
    const app = await createTestApp();
    const httpServer = app.getHttpServer();
    const service = app.get(metrics_service_1.MetricsService);
    service.reset();
    const res = await (0, supertest_1.default)(httpServer).get('/healthz').expect(200);
    strict_1.default.equal(res.body.metrics, 0, 'reset 后 metrics 应为 0');
    await app.close();
});
(0, node_test_1.default)('E2E: reset + registerDefaultMetrics 后恢复 5 个指标', async () => {
    const app = await createTestApp();
    const httpServer = app.getHttpServer();
    const service = app.get(metrics_service_1.MetricsService);
    service.reset();
    const { registerDefaultMetrics } = await Promise.resolve().then(() => __importStar(require('./metrics.service')));
    registerDefaultMetrics(service);
    const res = await (0, supertest_1.default)(httpServer).get('/healthz').expect(200);
    strict_1.default.equal(res.body.metrics, 5, '重新注册后 metrics 应为 5');
    // /metrics 输出中也应包含 5 个 TYPE
    const res2 = await (0, supertest_1.default)(httpServer).get('/metrics').expect(200);
    const typeCount = (res2.text.match(/# TYPE /g) || []).length;
    strict_1.default.equal(typeCount, 5, '应输出 5 个 TYPE 行');
    await app.close();
});
// ── 无认证 ──
(0, node_test_1.default)('E2E: 健康检查和 metrics 端点无需认证', async () => {
    const app = await createTestApp();
    const httpServer = app.getHttpServer();
    await (0, supertest_1.default)(httpServer).get('/healthz').expect(200);
    await (0, supertest_1.default)(httpServer).get('/metrics').expect(200);
    await app.close();
});
// ── 注入 metrics 后直接验证 ──
(0, node_test_1.default)('E2E: 手动构造数据后 /metrics 输出值行', async () => {
    const app = await createTestApp();
    const httpServer = app.getHttpServer();
    // 直接操作 service 写入 counter
    const service = app.get(metrics_service_1.MetricsService);
    service.incrementCounter('http_requests_total', { method: 'TEST', path: '/foo', status: '200' });
    const res = await (0, supertest_1.default)(httpServer).get('/metrics').expect(200);
    const body = res.text;
    // 应有带标签的 http_requests_total 行
    const dataLine = body.split('\n').find((l) => l.startsWith('http_requests_total{'));
    strict_1.default.ok(dataLine, '手动写入后应有数据行');
    strict_1.default.ok(dataLine.includes('method="TEST"'), '应包含 method 标签');
    strict_1.default.ok(dataLine.includes('path="/foo"'), '应包含 path 标签');
    strict_1.default.ok(dataLine.endsWith(' 1'), 'counter 值应为 1');
    await app.close();
});
//# sourceMappingURL=metrics.e2e.test.js.map