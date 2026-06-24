"use strict";
/**
 * metrics.simulator.test.ts — 可观测性模块模拟场景测试
 *
 * 模拟典型 HTTP 请求经过 MetricsInterceptor 时的行为：
 *   - 正常请求流经 interceptor 产生 counter / histogram
 *   - 异常请求流经 interceptor 产生例外计数
 *   - 多个并发请求的正确 gauge 值
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
const rxjs_1 = require("rxjs");
const metrics_service_1 = require("./metrics.service");
const metrics_interceptor_1 = require("./metrics.interceptor");
function mockExecutionContext(method, path, statusCode) {
    return {
        getType: () => 'http',
        switchToHttp: () => ({
            getRequest: () => ({
                method,
                path,
                route: { path }
            }),
            getResponse: () => ({
                statusCode
            })
        })
    };
}
function mockNextHandler(returnValue, error) {
    return {
        handle: () => error ? (0, rxjs_1.throwError)(() => error) : (0, rxjs_1.of)(returnValue)
    };
}
(0, node_test_1.describe)('MetricsInterceptor — 正常请求', () => {
    (0, node_test_1.default)('成功请求增加 counter 和 histogram', async () => {
        const service = new metrics_service_1.MetricsService();
        service.registerCounter('http_requests_total', '');
        service.registerHistogram('http_request_duration_ms', '');
        service.registerGauge('http_active_connections', '');
        service.setGauge('http_active_connections', {}, 0);
        const interceptor = new metrics_interceptor_1.MetricsInterceptor(service);
        const ctx = mockExecutionContext('GET', '/api/test', 200);
        const next = mockNextHandler({ data: 'ok' });
        await interceptor.intercept(ctx, next).toPromise();
        const render = service.render();
        strict_1.default.ok(render.includes('http_requests_total{method="GET",path="/api/test",status="200"} 1'));
        strict_1.default.ok(render.includes('http_request_duration_ms'));
    });
    (0, node_test_1.default)('非 HTTP 请求跳过拦截器', () => {
        const service = new metrics_service_1.MetricsService();
        const interceptor = new metrics_interceptor_1.MetricsInterceptor(service);
        const ctx = {
            getType: () => 'ws',
            switchToHttp: () => { throw new Error('should not be called'); }
        };
        const next = mockNextHandler('ws-data');
        const result = interceptor.intercept(ctx, next);
        strict_1.default.ok(result instanceof rxjs_1.Observable);
    });
});
(0, node_test_1.describe)('MetricsInterceptor — 异常请求', () => {
    (0, node_test_1.default)('抛出异常的请求增加例外计数器', async () => {
        const service = new metrics_service_1.MetricsService();
        service.registerCounter('http_requests_total', '');
        service.registerCounter('http_exceptions_total', '');
        service.registerHistogram('http_request_duration_ms', '');
        service.registerGauge('http_active_connections', '');
        service.setGauge('http_active_connections', {}, 0);
        const interceptor = new metrics_interceptor_1.MetricsInterceptor(service);
        const ctx = mockExecutionContext('POST', '/api/error', 500);
        const next = mockNextHandler(undefined, new Error('test error'));
        // 等待 Observable 完成 (即使有 error tap 也会跑);
        // 用 firstValueFrom + catchError 而不是 toPromise,避免 await 抛出导致断言跳过
        const { firstValueFrom } = await Promise.resolve().then(() => __importStar(require('rxjs')));
        const { catchError } = await Promise.resolve().then(() => __importStar(require('rxjs/operators')));
        await firstValueFrom(interceptor.intercept(ctx, next).pipe(catchError(() => (0, rxjs_1.of)(undefined))));
        const render = service.render();
        strict_1.default.ok(render.includes('http_exceptions_total{kind="Error",method="POST",path="/api/error"} 1'), `render 应包含 http_exceptions_total,实际:\n${render}`);
        strict_1.default.ok(render.includes('http_requests_total{method="POST",path="/api/error",status="500"} 1'), `render 应包含 http_requests_total 异常样本,实际:\n${render}`);
    });
});
(0, node_test_1.describe)('MetricsInterceptor — active connections gauge', () => {
    (0, node_test_1.default)('并发请求时 active_connections 正确增减', async () => {
        const service = new metrics_service_1.MetricsService();
        service.registerCounter('http_requests_total', '');
        service.registerHistogram('http_request_duration_ms', '');
        service.registerGauge('http_active_connections', '');
        service.setGauge('http_active_connections', {}, 0);
        const interceptor = new metrics_interceptor_1.MetricsInterceptor(service);
        const ctx = mockExecutionContext('GET', '/api/foo', 200);
        const next = mockNextHandler({});
        // active_connections 进入时 +1，完成时 -1
        await interceptor.intercept(ctx, next).toPromise();
        const render = service.render();
        // 最终应为 0 (gauge 在请求处理完毕后回调 -1)
        const gaugeLine = render.split('\n').find(l => l.startsWith('http_active_connections'));
        strict_1.default.ok(gaugeLine);
        // 值为 0 或合理的数值
        const value = Number(gaugeLine.split(' ').pop());
        strict_1.default.equal(value, 0);
    });
});
//# sourceMappingURL=metrics.simulator.test.js.map