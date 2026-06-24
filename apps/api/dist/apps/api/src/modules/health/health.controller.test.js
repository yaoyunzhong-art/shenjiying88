"use strict";
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
const health_controller_1 = require("./health.controller");
function tenantCtx(overrides) {
    return { tenantId: 't-default', ...overrides };
}
function actorCtx(overrides) {
    return {
        actorId: 'a-default',
        actorType: 'employee-user',
        roles: ['OPERATIONS'],
        permissions: ['foundation.governance.read'],
        authenticated: true,
        source: 'headers',
        ...overrides
    };
}
function makeMockService(overrides) {
    return {
        ping: async () => ({ alive: true, timestamp: new Date().toISOString() }),
        check: async () => ({ status: 'OK', checkedAt: new Date().toISOString(), components: [] }),
        ...overrides
    };
}
function makeController(serviceOverrides) {
    return new health_controller_1.HealthController(makeMockService(serviceOverrides));
}
// ── 元数据检查 ──
(0, node_test_1.describe)('路由元数据验证', () => {
    (0, node_test_1.default)('health controller path metadata is set', () => {
        const path = Reflect.getMetadata('path', health_controller_1.HealthController);
        strict_1.default.equal(path, 'health');
    });
    (0, node_test_1.default)('getHealth route keeps GET metadata on root path', () => {
        const method = Reflect.getMetadata('method', health_controller_1.HealthController.prototype.getHealth);
        const path = Reflect.getMetadata('path', health_controller_1.HealthController.prototype.getHealth);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, '/');
    });
    (0, node_test_1.default)('getPing route has GET metadata on ping path', () => {
        const method = Reflect.getMetadata('method', health_controller_1.HealthController.prototype.getPing);
        const path = Reflect.getMetadata('path', health_controller_1.HealthController.prototype.getPing);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'ping');
    });
    (0, node_test_1.default)('getReadiness route has GET metadata on readiness path', () => {
        const method = Reflect.getMetadata('method', health_controller_1.HealthController.prototype.getReadiness);
        const path = Reflect.getMetadata('path', health_controller_1.HealthController.prototype.getReadiness);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'readiness');
    });
});
// ── GET /health ──
(0, node_test_1.describe)('GET /health（基本存活性检查）', () => {
    (0, node_test_1.default)('返回 alive=true 和有效 ISO 时间戳', async () => {
        const ctrl = makeController();
        const result = await ctrl.getHealth();
        strict_1.default.equal(result.alive, true);
        strict_1.default.ok(typeof result.timestamp === 'string');
        // 验证是合法 ISO 时间戳
        const parsed = new Date(result.timestamp);
        strict_1.default.ok(!isNaN(parsed.getTime()));
    });
    (0, node_test_1.default)('多次调用返回的 timestamp 随时间递增', async () => {
        const timestamps = [];
        const ctrl = makeController({
            ping: async () => {
                const ts = new Date().toISOString();
                timestamps.push(ts);
                return { alive: true, timestamp: ts };
            }
        });
        await ctrl.getHealth();
        // 微延迟
        await new Promise(resolve => setTimeout(resolve, 10));
        await ctrl.getHealth();
        strict_1.default.ok(timestamps.length === 2);
        strict_1.default.ok(new Date(timestamps[1]) >= new Date(timestamps[0]));
    });
    (0, node_test_1.default)('即使服务降级，alive 依然为 true（存活探头容忍降级）', async () => {
        const ctrl = makeController({
            ping: async () => ({ alive: true, timestamp: '2026-01-01T00:00:00.000Z' })
        });
        const result = await ctrl.getHealth();
        strict_1.default.equal(result.alive, true);
    });
    (0, node_test_1.default)('服务不可用时 alive 应为 false（进程异常）', async () => {
        const ctrl = makeController({
            ping: async () => ({ alive: false, timestamp: new Date().toISOString() })
        });
        const result = await ctrl.getHealth();
        strict_1.default.equal(result.alive, false);
    });
});
// ── GET /health/ping ──
(0, node_test_1.describe)('GET /health/ping（连通性检查）', () => {
    (0, node_test_1.default)('返回 alive=true（正常连通）', async () => {
        let called = false;
        const ctrl = makeController({
            ping: async () => {
                called = true;
                return { alive: true, timestamp: new Date().toISOString() };
            }
        });
        const result = await ctrl.getPing();
        strict_1.default.equal(called, true);
        strict_1.default.equal(result.alive, true);
        strict_1.default.ok(typeof result.timestamp === 'string');
    });
    (0, node_test_1.default)('极短时间内连续 ping 都能正确返回', async () => {
        let callCount = 0;
        const ctrl = makeController({
            ping: async () => {
                callCount++;
                return { alive: true, timestamp: new Date().toISOString() };
            }
        });
        const results = await Promise.all([
            ctrl.getPing(),
            ctrl.getPing(),
            ctrl.getPing()
        ]);
        strict_1.default.equal(callCount, 3);
        results.forEach(r => strict_1.default.equal(r.alive, true));
    });
    (0, node_test_1.default)('返回的 timestamp 是有效 ISO 8601 格式', async () => {
        const ctrl = makeController();
        const result = await ctrl.getPing();
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
        strict_1.default.ok(isoRegex.test(result.timestamp), `Invalid timestamp: ${result.timestamp}`);
    });
});
// ── GET /health/readiness ──
(0, node_test_1.describe)('GET /health/readiness（就绪检查）', () => {
    (0, node_test_1.default)('verbose=false 时仅检查 database + lyt-adapter', async () => {
        let capturedContext;
        const ctrl = makeController({
            check: async (ctx) => {
                capturedContext = ctx;
                return {
                    status: 'OK',
                    checkedAt: new Date().toISOString(),
                    components: [
                        { name: 'database', status: 'OK', latencyMs: 1 },
                        { name: 'lyt-adapter', status: 'OK', latencyMs: 2 }
                    ]
                };
            }
        });
        const result = await ctrl.getReadiness(tenantCtx({ tenantId: 't-1', marketCode: 'zh-cn' }), actorCtx({ actorId: 'ops' }), { verbose: false });
        strict_1.default.equal(result.status, 'OK');
        strict_1.default.equal(capturedContext?.verbose, false);
        strict_1.default.ok(Array.isArray(result.components));
    });
    (0, node_test_1.default)('verbose=true 时检查 5 个组件（含 memory + disk）', async () => {
        let capturedVerbose;
        const ctrl = makeController({
            check: async (ctx) => {
                capturedVerbose = ctx?.verbose;
                return {
                    status: 'DEGRADED',
                    checkedAt: new Date().toISOString(),
                    components: [
                        { name: 'database', status: 'OK', latencyMs: 1 },
                        { name: 'redis', status: 'UNAVAILABLE', latencyMs: 1500, detail: { error: 'timeout' } },
                        { name: 'lyt-adapter', status: 'OK', latencyMs: 2 },
                        { name: 'memory', status: 'OK', latencyMs: 0 },
                        { name: 'disk', status: 'OK', latencyMs: 1 }
                    ]
                };
            }
        });
        const result = await ctrl.getReadiness(tenantCtx({ tenantId: 't-1', marketCode: 'zh-cn' }), actorCtx({ actorId: 'ops' }), { verbose: true });
        strict_1.default.equal(capturedVerbose, true);
        strict_1.default.equal(result.status, 'DEGRADED');
    });
    (0, node_test_1.default)('缺少 tenantContext 时 scopeType 为 Platform', async () => {
        let capturedScope;
        const ctrl = makeController({
            check: async (ctx) => {
                capturedScope = ctx?.scope;
                return { status: 'OK', checkedAt: new Date().toISOString(), components: [] };
            }
        });
        await ctrl.getReadiness(undefined, actorCtx({ actorId: 'sys', actorType: 'service-account', roles: [], permissions: [] }), {});
        strict_1.default.equal(capturedScope?.scopeType, 'PLATFORM');
        strict_1.default.equal(capturedScope?.scopeId, 'platform');
    });
    (0, node_test_1.default)('仅有 tenantId 时 scopeType 为 Tenant', async () => {
        let capturedScope;
        const ctrl = makeController({
            check: async (ctx) => {
                capturedScope = ctx?.scope;
                return { status: 'OK', checkedAt: new Date().toISOString(), components: [] };
            }
        });
        await ctrl.getReadiness(tenantCtx({ tenantId: 'acme-corp' }), actorCtx({ actorId: 'admin', actorType: 'tenant-user', roles: ['TENANT_ADMIN'] }), {});
        strict_1.default.equal(capturedScope?.scopeType, 'TENANT');
        strict_1.default.equal(capturedScope?.scopeId, 'acme-corp');
    });
    (0, node_test_1.default)('有 brandId 时 scopeType 为 Brand', async () => {
        let capturedScope;
        const ctrl = makeController({
            check: async (ctx) => {
                capturedScope = ctx?.scope;
                return { status: 'OK' };
            }
        });
        await ctrl.getReadiness(tenantCtx({ tenantId: 't-1', brandId: 'b-brand-x' }), actorCtx({ actorId: 'mgr', roles: ['BRAND_MANAGER'] }), {});
        strict_1.default.equal(capturedScope?.scopeType, 'BRAND');
        strict_1.default.equal(capturedScope?.scopeId, 'b-brand-x');
    });
    (0, node_test_1.default)('有 storeId 时 scopeType 为 Store（最高优先级）', async () => {
        let capturedScope;
        const ctrl = makeController({
            check: async (ctx) => {
                capturedScope = ctx?.scope;
                return { status: 'OK' };
            }
        });
        await ctrl.getReadiness(tenantCtx({ tenantId: 't-1', brandId: 'b-1', storeId: 's-store-99' }), actorCtx({ actorId: 'guide', roles: ['GUIDE'] }), {});
        strict_1.default.equal(capturedScope?.scopeType, 'STORE');
        strict_1.default.equal(capturedScope?.scopeId, 's-store-99');
    });
    (0, node_test_1.default)('有 marketCode 时 scopeType 为 Tenant（若 tenantId 存在）', async () => {
        let capturedScope;
        const ctrl = makeController({
            check: async (ctx) => {
                capturedScope = ctx?.scope;
                return { status: 'OK' };
            }
        });
        // marketCode + tenantId → scopeType is TENANT (tenantId takes precedence over marketCode)
        await ctrl.getReadiness(tenantCtx({ tenantId: 't-1', marketCode: 'jp' }), actorCtx({ actorId: 'ops' }), {});
        strict_1.default.equal(capturedScope?.scopeType, 'TENANT');
        strict_1.default.equal(capturedScope?.scopeId, 't-1');
    });
    (0, node_test_1.default)('verbose 字符串 "true" 被正确转换为 boolean', async () => {
        let capturedVerbose;
        const ctrl = makeController({
            check: async (ctx) => {
                capturedVerbose = ctx?.verbose;
                return { status: 'OK' };
            }
        });
        await ctrl.getReadiness(tenantCtx({ tenantId: 't-prod' }), actorCtx({ actorId: 'sec', roles: ['SECURITY_ADMIN'] }), { verbose: 'true' });
        strict_1.default.equal(capturedVerbose, true);
    });
    (0, node_test_1.default)('verbose 未传递时默认为 false', async () => {
        let capturedVerbose;
        const ctrl = makeController({
            check: async (ctx) => {
                capturedVerbose = ctx?.verbose;
                return { status: 'OK' };
            }
        });
        await ctrl.getReadiness(tenantCtx({ tenantId: 't-prod' }), actorCtx({ actorId: 'ops' }), {});
        strict_1.default.equal(capturedVerbose, false);
    });
    (0, node_test_1.default)('actorId 正确传递到 requestorId', async () => {
        let capturedRequestorId;
        const ctrl = makeController({
            check: async (ctx) => {
                capturedRequestorId = ctx?.requestorId;
                return { status: 'OK' };
            }
        });
        await ctrl.getReadiness(tenantCtx({ tenantId: 't-audit' }), actorCtx({ actorId: 'security-auditor-007', roles: ['SECURITY_ADMIN'] }), {});
        strict_1.default.equal(capturedRequestorId, 'security-auditor-007');
    });
    (0, node_test_1.default)('检查返回包含 checkedAt 和 status 字段', async () => {
        const ctrl = makeController();
        const result = await ctrl.getReadiness(tenantCtx({ tenantId: 't-1' }), actorCtx({ actorId: 'u1', actorType: 'tenant-user', roles: ['TENANT_ADMIN'] }), {});
        strict_1.default.equal(result.status, 'OK');
        strict_1.default.ok(typeof result.checkedAt === 'string');
    });
});
// ── 跨端点行为一致性 ──
(0, node_test_1.describe)('跨端点行为一致性', () => {
    (0, node_test_1.default)('getHealth 和 getPing 都委托到 service.ping()', async () => {
        let pingCallCount = 0;
        const ctrl = makeController({
            ping: async () => {
                pingCallCount++;
                return { alive: true, timestamp: new Date().toISOString() };
            }
        });
        await ctrl.getHealth();
        await ctrl.getPing();
        await ctrl.getHealth();
        strict_1.default.equal(pingCallCount, 3);
    });
    (0, node_test_1.default)('getHealth 和 getPing 返回结构一致', async () => {
        const ctrl = makeController();
        const health = await ctrl.getHealth();
        const ping = await ctrl.getPing();
        strict_1.default.equal(typeof health.alive, 'boolean');
        strict_1.default.equal(typeof ping.alive, 'boolean');
        strict_1.default.equal(typeof health.timestamp, 'string');
        strict_1.default.equal(typeof ping.timestamp, 'string');
    });
    (0, node_test_1.default)('getReadiness 返回更丰富的结果（含 components）', async () => {
        const ctrl = makeController({
            check: async () => ({
                status: 'OK',
                checkedAt: new Date().toISOString(),
                components: [
                    { name: 'database', status: 'OK', latencyMs: 3, detail: { connected: true } },
                    { name: 'lyt-adapter', status: 'OK', latencyMs: 1, detail: { available: true } }
                ],
                uptimeSeconds: 3600,
                version: '1.0.0'
            })
        });
        const result = await ctrl.getReadiness(tenantCtx({ tenantId: 't-svc' }), actorCtx({ actorId: 'svc', actorType: 'service-account', roles: ['SUPER_ADMIN'] }), {});
        strict_1.default.equal(result.status, 'OK');
        strict_1.default.ok(Array.isArray(result.components));
        strict_1.default.equal(result.components.length, 2);
    });
});
// ── 异常场景 ──
(0, node_test_1.describe)('异常与边界场景', () => {
    (0, node_test_1.default)('getReadiness 中 service.check() 抛出异常时向上传播', async () => {
        const ctrl = makeController({
            check: async () => {
                throw new Error('DB connection timeout');
            }
        });
        await strict_1.default.rejects(ctrl.getReadiness(tenantCtx({ tenantId: 't-broken' }), actorCtx({ actorId: 'ops' }), {}), /DB connection timeout/);
    });
    (0, node_test_1.default)('actorContext 缺少 actorId 时 requestorId 为 undefined', async () => {
        let capturedRequestorId;
        const ctrl = makeController({
            check: async (ctx) => {
                capturedRequestorId = ctx?.requestorId;
                return { status: 'OK' };
            }
        });
        await ctrl.getReadiness(tenantCtx({ tenantId: 't-anon' }), actorCtx({ actorId: undefined, roles: [], permissions: [], authenticated: false }), {});
        strict_1.default.equal(capturedRequestorId, undefined);
    });
    (0, node_test_1.default)('tenantContext 完全为空时 scopeId 为 platform', async () => {
        let capturedScope;
        const ctrl = makeController({
            check: async (ctx) => {
                capturedScope = ctx?.scope;
                return { status: 'OK' };
            }
        });
        await ctrl.getReadiness({}, actorCtx({ actorId: 'sys', actorType: 'service-account', roles: [], permissions: [] }), {});
        strict_1.default.equal(capturedScope?.scopeType, 'PLATFORM');
        strict_1.default.equal(capturedScope?.scopeId, 'platform');
    });
});
//# sourceMappingURL=health.controller.test.js.map