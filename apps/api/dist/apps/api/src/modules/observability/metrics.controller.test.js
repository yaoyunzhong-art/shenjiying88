"use strict";
/**
 * metrics.controller.test.ts — MetricsController 单元测试
 *
 * 覆盖:
 *   - GET /metrics 路由装饰器存在
 *   - GET /healthz 路由装饰器存在
 *   - getMetrics 返回 Prometheus 文本格式
 *   - getHealth 返回 { status, metrics }
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
const metrics_controller_1 = require("./metrics.controller");
const metrics_service_1 = require("./metrics.service");
function makeController() {
    const service = new metrics_service_1.MetricsService();
    return new metrics_controller_1.MetricsController(service);
}
(0, node_test_1.describe)('MetricsController — 路由装饰器', () => {
    (0, node_test_1.default)('getMetrics 有 @Get("metrics") 装饰器', () => {
        const path = Reflect.getMetadata('path', metrics_controller_1.MetricsController.prototype.getMetrics);
        const method = Reflect.getMetadata('method', metrics_controller_1.MetricsController.prototype.getMetrics);
        strict_1.default.equal(method, 0, '应使用 GET (RequestMethod.GET = 0)');
        strict_1.default.ok(typeof path === 'string', 'path 应为字符串');
        strict_1.default.ok(path.includes('metrics'), `path 应包含 "metrics",实际 ${path}`);
    });
    (0, node_test_1.default)('getHealth 有 @Get("healthz") 装饰器', () => {
        const path = Reflect.getMetadata('path', metrics_controller_1.MetricsController.prototype.getHealth);
        const method = Reflect.getMetadata('method', metrics_controller_1.MetricsController.prototype.getHealth);
        strict_1.default.equal(method, 0);
        strict_1.default.ok(path.includes('healthz'), `path 应包含 "healthz",实际 ${path}`);
    });
});
(0, node_test_1.describe)('MetricsController — GET /healthz', () => {
    (0, node_test_1.default)('有注册指标时返回 5', () => {
        const controller = makeController();
        const health = controller.getHealth();
        strict_1.default.equal(health.status, 'ok');
        strict_1.default.equal(health.metrics, 5);
    });
    (0, node_test_1.default)('reset 后返回 0', () => {
        const service = new metrics_service_1.MetricsService();
        const controller = new metrics_controller_1.MetricsController(service);
        service.reset();
        const health = controller.getHealth();
        strict_1.default.equal(health.metrics, 0);
    });
});
(0, node_test_1.describe)('MetricsController — GET /metrics', () => {
    (0, node_test_1.default)('未注册指标时输出仅含 HEADER 空行', async () => {
        const service = new metrics_service_1.MetricsService();
        service.reset();
        const controller = new metrics_controller_1.MetricsController(service);
        let body = '';
        const headers = {};
        const res = {
            setHeader: (k, v) => { headers[k] = v; },
            send: (b) => { body = b; }
        };
        await controller.getMetrics(res);
        strict_1.default.equal(headers['Content-Type'], 'text/plain; version=0.0.4; charset=utf-8');
        // render() on empty service returns "\n" only
        strict_1.default.equal(body, '\n');
    });
    (0, node_test_1.default)('注册指标后渲染 Prometheus 文本', async () => {
        const controller = makeController();
        let body = '';
        const res = {
            setHeader: () => { },
            send: (b) => { body = b; }
        };
        await controller.getMetrics(res);
        strict_1.default.ok(body.includes('# HELP http_requests_total'));
        strict_1.default.ok(body.includes('# TYPE http_requests_total counter'));
        strict_1.default.ok(body.includes('# HELP http_request_duration_ms'));
        strict_1.default.ok(body.includes('process_uptime_seconds'));
    });
});
//# sourceMappingURL=metrics.controller.test.js.map