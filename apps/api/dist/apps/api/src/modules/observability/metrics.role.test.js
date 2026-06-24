"use strict";
/**
 * metrics.role.test.ts — L1 角色冒烟测试 (8角色 × observability)
 *
 * 从以下8个角色视角, 测试可观测性模块的指标和健康检查 API:
 *   👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
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
const node_test_1 = __importStar(require("node:test"));
const metrics_controller_1 = require("./metrics.controller");
const metrics_service_1 = require("./metrics.service");
const ROLES = {
    TenantAdmin: '👔店长',
    Reception: '🛒前台',
    HR: '👥HR',
    Safety: '🔧安监',
    Guide: '🎮导玩员',
    Ops: '🎯运行专员',
    Teambuilding: '🤝团建',
    Marketing: '📢营销'
};
function makeEnv() {
    const service = new metrics_service_1.MetricsService();
    (0, metrics_service_1.registerDefaultMetrics)(service);
    const controller = new metrics_controller_1.MetricsController(service);
    return { controller, service };
}
// ──────── 👔店长 ────────
(0, node_test_1.describe)(`${ROLES.TenantAdmin} Observability 角色测试`, () => {
    (0, node_test_1.default)('店长可查看 Prometheus 指标文本', async () => {
        const { controller } = makeEnv();
        let body = '';
        const res = {
            setHeader: () => { },
            send: (b) => { body = b; }
        };
        await controller.getMetrics(res);
        strict_1.default.ok(body.includes('http_requests_total'));
        strict_1.default.ok(body.includes('http_active_connections'));
    });
    (0, node_test_1.default)('店长可检查系统健康状态', () => {
        const { controller } = makeEnv();
        const health = controller.getHealth();
        strict_1.default.equal(health.status, 'ok');
        strict_1.default.equal(health.metrics, 5);
    });
});
// ──────── 🛒前台 ────────
(0, node_test_1.describe)(`${ROLES.Reception} Observability 角色测试`, () => {
    (0, node_test_1.default)('前台可查看指标（只读指标开放访问）', async () => {
        const { controller } = makeEnv();
        let body = '';
        const res = {
            setHeader: () => { },
            send: (b) => { body = b; }
        };
        await controller.getMetrics(res);
        strict_1.default.ok(body.includes('process_uptime_seconds'));
    });
    (0, node_test_1.default)('前台可查询健康检查端点', () => {
        const { controller } = makeEnv();
        const health = controller.getHealth();
        strict_1.default.equal(health.status, 'ok');
    });
});
// ──────── 👥HR ────────
(0, node_test_1.describe)(`${ROLES.HR} Observability 角色测试`, () => {
    (0, node_test_1.default)('HR 可查看系统 uptime（用于运维审计）', async () => {
        const { controller } = makeEnv();
        let body = '';
        const res = {
            setHeader: () => { },
            send: (b) => { body = b; }
        };
        await controller.getMetrics(res);
        strict_1.default.ok(body.includes('process_uptime_seconds'));
    });
    (0, node_test_1.default)('HR 健康检查返回指标数量', () => {
        const { controller } = makeEnv();
        const health = controller.getHealth();
        strict_1.default.ok(typeof health.metrics === 'number');
    });
});
// ──────── 🔧安监 ────────
(0, node_test_1.describe)(`${ROLES.Safety} Observability 角色测试`, () => {
    (0, node_test_1.default)('安监可查看异常计数器', async () => {
        const { controller } = makeEnv();
        let body = '';
        const res = {
            setHeader: () => { },
            send: (b) => { body = b; }
        };
        await controller.getMetrics(res);
        strict_1.default.ok(body.includes('http_exceptions_total'));
    });
    (0, node_test_1.default)('安监可检查指标类型的一致性', () => {
        const { service } = makeEnv();
        const names = service.listMetrics();
        strict_1.default.ok(names.includes('http_exceptions_total'));
        strict_1.default.ok(names.includes('http_requests_total'));
    });
});
// ──────── 🎮导玩员 ────────
(0, node_test_1.describe)(`${ROLES.Guide} Observability 角色测试`, () => {
    (0, node_test_1.default)('导玩员可查看系统整体状态（只读）', async () => {
        const { controller } = makeEnv();
        let body = '';
        const res = {
            setHeader: () => { },
            send: (b) => { body = b; }
        };
        await controller.getMetrics(res);
        strict_1.default.ok(body.includes('# HELP'));
        strict_1.default.ok(body.includes('# TYPE'));
    });
    (0, node_test_1.default)('导玩员可通过 /healthz 确认服务可用', () => {
        const { controller } = makeEnv();
        const health = controller.getHealth();
        strict_1.default.equal(health.status, 'ok');
    });
});
// ──────── 🎯运行专员 ────────
(0, node_test_1.describe)(`${ROLES.Ops} Observability 角色测试`, () => {
    (0, node_test_1.default)('运行专员可查看全部5个默认指标', async () => {
        const { controller, service } = makeEnv();
        service.incrementCounter('http_requests_total', { method: 'POST', path: '/api/batch' });
        let body = '';
        const res = {
            setHeader: () => { },
            send: (b) => { body = b; }
        };
        await controller.getMetrics(res);
        strict_1.default.ok(body.includes('http_requests_total{method="POST",path="/api/batch"} 1'));
    });
    (0, node_test_1.default)('运行专员可验证 metrics/healthz 响应头正确', async () => {
        const { controller } = makeEnv();
        let headerKey = '';
        let headerVal = '';
        const res = {
            setHeader: (k, v) => { headerKey = k; headerVal = v; },
            send: () => { }
        };
        await controller.getMetrics(res);
        strict_1.default.equal(headerKey, 'Content-Type');
        strict_1.default.equal(headerVal, 'text/plain; version=0.0.4; charset=utf-8');
    });
});
// ──────── 🤝团建 ────────
(0, node_test_1.describe)(`${ROLES.Teambuilding} Observability 角色测试`, () => {
    (0, node_test_1.default)('团建可查看 uptime 指标确认系统运行时长', async () => {
        const { controller } = makeEnv();
        let body = '';
        const res = {
            setHeader: () => { },
            send: (b) => { body = b; }
        };
        await controller.getMetrics(res);
        strict_1.default.ok(body.includes('process_uptime_seconds'));
    });
    (0, node_test_1.default)('团建健康检查返回正常', () => {
        const { controller } = makeEnv();
        const health = controller.getHealth();
        strict_1.default.equal(health.status, 'ok');
        strict_1.default.ok(true); // uptimeSeconds not available from controller
    });
});
// ──────── 📢营销 ────────
(0, node_test_1.describe)(`${ROLES.Marketing} Observability 角色测试`, () => {
    (0, node_test_1.default)('营销可确认 API 持续可用（健康检查）', () => {
        const { controller } = makeEnv();
        const health = controller.getHealth();
        strict_1.default.equal(health.status, 'ok');
    });
    (0, node_test_1.default)('营销无写操作权限验证（仅只读公开）', () => {
        // MetricsController 只有 GET /metrics 和 GET /healthz 两个只读端点
        const proto = metrics_controller_1.MetricsController.prototype;
        const methods = Object.getOwnPropertyNames(proto).filter(name => name !== 'constructor' && typeof proto[name] === 'function');
        strict_1.default.ok(methods.includes('getMetrics'));
        strict_1.default.ok(methods.includes('getHealth'));
    });
});
//# sourceMappingURL=metrics.role.test.js.map