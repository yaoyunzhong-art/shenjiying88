"use strict";
/**
 * metrics.dto.test.ts — DTO 类型契约测试
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
(0, node_test_1.describe)('metrics.dto — MetricsListResponse', () => {
    (0, node_test_1.default)('包含 metrics 列表和 count', () => {
        const resp = {
            metrics: ['http_requests_total', 'http_active_connections'],
            count: 2
        };
        strict_1.default.equal(resp.count, 2);
        strict_1.default.equal(resp.metrics.length, 2);
    });
    (0, node_test_1.default)('空指标列表合法', () => {
        const resp = { metrics: [], count: 0 };
        strict_1.default.equal(resp.count, 0);
        strict_1.default.deepEqual(resp.metrics, []);
    });
});
(0, node_test_1.describe)('metrics.dto — HealthzResponse', () => {
    (0, node_test_1.default)('正常状态包含 uptime', () => {
        const resp = { status: 'ok', metrics: 5, uptimeSeconds: 7200 };
        strict_1.default.equal(resp.status, 'ok');
        strict_1.default.equal(resp.uptimeSeconds, 7200);
    });
    (0, node_test_1.default)('支持 degraded/down 状态', () => {
        const degraded = { status: 'degraded', metrics: 3, uptimeSeconds: 60 };
        const down = { status: 'down', metrics: 0, uptimeSeconds: 0 };
        strict_1.default.equal(degraded.status, 'degraded');
        strict_1.default.equal(down.status, 'down');
    });
});
(0, node_test_1.describe)('metrics.dto — CreateAlertRuleRequest', () => {
    (0, node_test_1.default)('完整创建请求必须包含所有必填字段', () => {
        const req = {
            name: 'high_error_rate',
            metricName: 'http_exceptions_total',
            operator: '>',
            threshold: 100,
            duration: '5m',
            severity: 'warning',
            description: '5分钟异常超限'
        };
        strict_1.default.equal(req.name, 'high_error_rate');
        strict_1.default.equal(req.severity, 'warning');
        strict_1.default.equal(req.description, '5分钟异常超限');
    });
    (0, node_test_1.default)('description 可选', () => {
        const req = {
            name: 'critical_latency',
            metricName: 'http_request_duration_ms',
            operator: '>',
            threshold: 5000,
            duration: '1m',
            severity: 'critical'
        };
        strict_1.default.equal(req.description, undefined);
    });
});
(0, node_test_1.describe)('metrics.dto — UpdateAlertRuleRequest', () => {
    (0, node_test_1.default)('所有字段可选', () => {
        const req = { threshold: 200 };
        strict_1.default.equal(req.threshold, 200);
        strict_1.default.equal(req.name, undefined);
        strict_1.default.equal(req.severity, undefined);
    });
});
(0, node_test_1.describe)('metrics.dto — AlertRuleResponse', () => {
    (0, node_test_1.default)('继承 CreateAlertRuleRequest 并增加系统字段', () => {
        const resp = {
            id: 'rule-1',
            name: 'high_error_rate',
            metricName: 'http_exceptions_total',
            operator: '>',
            threshold: 100,
            duration: '5m',
            severity: 'warning',
            description: '异常超限',
            enabled: true,
            createdAt: '2026-06-24T00:00:00.000Z',
            updatedAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(resp.id, 'rule-1');
        strict_1.default.equal(resp.enabled, true);
        strict_1.default.ok(resp.createdAt);
        strict_1.default.ok(resp.updatedAt);
    });
    (0, node_test_1.default)('disabled 规则也合法', () => {
        const resp = {
            id: 'rule-2',
            name: 'old_rule',
            metricName: 'process_uptime_seconds',
            operator: '<',
            threshold: 0,
            duration: '1m',
            severity: 'info',
            enabled: false,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-01T00:00:00.000Z'
        };
        strict_1.default.equal(resp.enabled, false);
    });
});
//# sourceMappingURL=metrics.dto.test.js.map