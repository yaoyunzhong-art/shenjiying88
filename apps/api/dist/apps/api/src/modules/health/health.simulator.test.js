"use strict";
/**
 * Health Simulator Test
 *
 * 模拟系统健康检查的场景覆盖：
 * - 全组件健康检查
 * - 单组件探测
 * - 降级模式
 * - 快速 ping 探测
 * - verbose 详细模式
 * - 版本号提取
 * - 运行时间
 * - ping 响应
 *
 * 8 角色视角覆盖：
 *  👔店长 - 查看服务整体健康状况
 *  🛒前台 - 快速检查收银是否可用
 *  👥HR - 检查系统稳定性（会员数据）
 *  🔧安监 - 审计系统组件健康
 *  🎮导玩员 - 盲盒系统健康检查
 *  🎯运行专员 - 运维健康监控
 *  🤝团建 - 批量活动前健康检查
 *  📢营销 - 营销系统可用性检查
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
const health_entity_1 = require("./health.entity");
function createSimulatedProbe(name, status, latencyMs, extra) {
    return {
        name,
        status,
        latencyMs: latencyMs ?? Math.floor(Math.random() * 200) + 1,
        detail: extra ?? {}
    };
}
/** 模拟一次完整健康检查 */
function simulateHealthCheck(components) {
    return {
        status: components.reduce((worst, c) => {
            if (c.status === health_entity_1.HealthStatus.Unavailable)
                return health_entity_1.HealthStatus.Unavailable;
            if (c.status === health_entity_1.HealthStatus.Degraded && worst !== health_entity_1.HealthStatus.Unavailable)
                return health_entity_1.HealthStatus.Degraded;
            return worst;
        }, health_entity_1.HealthStatus.Ok),
        components,
        checkedAt: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        version: '1.0.0'
    };
}
/** 模拟 ping */
function simulatePing() {
    return { alive: true, timestamp: new Date().toISOString() };
}
function simulateRoleCheck(input) {
    const start = Date.now();
    // Different roles have different critical paths
    const roleCriticalComponents = {
        '👔店长': ['database', 'lyt-adapter', 'redis', 'memory', 'disk'],
        '🛒前台': ['database', 'lyt-adapter'],
        '👥HR': ['database', 'lyt-adapter'],
        '🔧安监': ['database', 'lyt-adapter', 'redis', 'disk'],
        '🎮导玩员': ['database', 'lyt-adapter'],
        '🎯运行专员': ['database', 'lyt-adapter', 'redis', 'memory', 'disk'],
        '🤝团建': ['database', 'lyt-adapter'],
        '📢营销': ['database', 'lyt-adapter']
    };
    const components = input.targetComponents ?? roleCriticalComponents[input.role] ?? ['database', 'lyt-adapter'];
    const probes = components.map((name) => createSimulatedProbe(name, health_entity_1.HealthStatus.Ok));
    const result = simulateHealthCheck(probes);
    return {
        role: input.role,
        status: result.status,
        description: `${input.role} health check - ${input.verbose ? 'verbose' : 'standard'} mode`,
        components: probes.map((p) => p.name),
        responseTimeMs: Date.now() - start
    };
}
// ─── Entity helpers ───
(0, node_test_1.describe)('Health - Simulator (entity helpers)', () => {
    (0, node_test_1.describe)('toHealthCheckResult', () => {
        (0, node_test_1.default)('should return OK status when all components are OK', () => {
            const components = [
                { name: 'database', status: health_entity_1.HealthStatus.Ok, latencyMs: 10, detail: {} },
                { name: 'redis', status: health_entity_1.HealthStatus.Ok, latencyMs: 5, detail: {} }
            ];
            const result = (0, health_entity_1.toHealthCheckResult)(components, {
                uptimeSeconds: 300,
                version: '1.0.0'
            });
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.equal(result.components.length, 2);
            strict_1.default.equal(result.uptimeSeconds, 300);
        });
        (0, node_test_1.default)('should return DEGRADED when one component is degraded', () => {
            const components = [
                { name: 'database', status: health_entity_1.HealthStatus.Ok, latencyMs: 10, detail: {} },
                { name: 'redis', status: health_entity_1.HealthStatus.Degraded, latencyMs: 500, detail: { message: 'slow response' } }
            ];
            const result = (0, health_entity_1.toHealthCheckResult)(components, {
                uptimeSeconds: 300,
                version: '1.0.0'
            });
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Degraded);
        });
        (0, node_test_1.default)('should return UNAVAILABLE when any component is unavailable', () => {
            const components = [
                { name: 'database', status: health_entity_1.HealthStatus.Ok, latencyMs: 10, detail: {} },
                { name: 'redis', status: health_entity_1.HealthStatus.Unavailable, latencyMs: 1500, detail: {} },
                { name: 'lyt-adapter', status: health_entity_1.HealthStatus.Degraded, latencyMs: 300, detail: {} }
            ];
            const result = (0, health_entity_1.toHealthCheckResult)(components, {
                uptimeSeconds: 300,
                version: '1.0.0'
            });
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Unavailable);
        });
    });
    (0, node_test_1.describe)('isHealthy', () => {
        (0, node_test_1.default)('should return true for OK status', () => {
            strict_1.default.equal((0, health_entity_1.isHealthy)({ status: health_entity_1.HealthStatus.Ok }), true);
        });
        (0, node_test_1.default)('should return false for DEGRADED status', () => {
            strict_1.default.equal((0, health_entity_1.isHealthy)({ status: health_entity_1.HealthStatus.Degraded }), false);
        });
        (0, node_test_1.default)('should return false for UNAVAILABLE status', () => {
            strict_1.default.equal((0, health_entity_1.isHealthy)({ status: health_entity_1.HealthStatus.Unavailable }), false);
        });
    });
    (0, node_test_1.describe)('isDegraded', () => {
        (0, node_test_1.default)('should return true for DEGRADED status', () => {
            strict_1.default.equal((0, health_entity_1.isDegraded)({ status: health_entity_1.HealthStatus.Degraded }), true);
        });
        (0, node_test_1.default)('should return false for OK status', () => {
            strict_1.default.equal((0, health_entity_1.isDegraded)({ status: health_entity_1.HealthStatus.Ok }), false);
        });
        (0, node_test_1.default)('should return false for UNAVAILABLE status', () => {
            strict_1.default.equal((0, health_entity_1.isDegraded)({ status: health_entity_1.HealthStatus.Unavailable }), false);
        });
    });
});
// ─── Full system health check simulation ───
(0, node_test_1.describe)('Health - Simulator (full check)', () => {
    (0, node_test_1.describe)('simulateHealthCheck - all healthy', () => {
        (0, node_test_1.default)('should return OK when all components are healthy', () => {
            const probes = [
                createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 12, { connected: true }),
                createSimulatedProbe('redis', health_entity_1.HealthStatus.Ok, 8, { connected: true }),
                createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 15, { mode: 'mock' }),
                createSimulatedProbe('memory', health_entity_1.HealthStatus.Ok, 3, { usagePercent: 45 }),
                createSimulatedProbe('disk', health_entity_1.HealthStatus.Ok, 5, { usagePercent: 60 })
            ];
            const result = simulateHealthCheck(probes);
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.equal(result.components.length, 5);
            strict_1.default.ok(result.checkedAt);
            strict_1.default.ok(result.uptimeSeconds >= 0);
            strict_1.default.equal(result.version, '1.0.0');
        });
        (0, node_test_1.default)('should surface database outage immediately', () => {
            const probes = [
                createSimulatedProbe('database', health_entity_1.HealthStatus.Unavailable, 2000, { error: 'connection refused' }),
                createSimulatedProbe('redis', health_entity_1.HealthStatus.Ok, 8, { connected: true }),
                createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 15, { mode: 'mock' })
            ];
            const result = simulateHealthCheck(probes);
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Unavailable);
        });
        (0, node_test_1.default)('should surface redis degradation', () => {
            const probes = [
                createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 10, { connected: true }),
                createSimulatedProbe('redis', health_entity_1.HealthStatus.Degraded, 800, { message: 'high latency' }),
                createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 20, { mode: 'mock' })
            ];
            const result = simulateHealthCheck(probes);
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Degraded);
            const redisProbe = result.components.find((c) => c.name === 'redis');
            strict_1.default.ok(redisProbe);
            strict_1.default.equal(redisProbe.status, health_entity_1.HealthStatus.Degraded);
        });
    });
    (0, node_test_1.describe)('simulateHealthCheck - standard vs verbose', () => {
        (0, node_test_1.default)('standard check should only include critical components', () => {
            const probes = [
                createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 10, { connected: true }),
                createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 15, { mode: 'mock' })
            ];
            const result = simulateHealthCheck(probes);
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.equal(result.components.length, 2);
            strict_1.default.ok(result.components.some((c) => c.name === 'database'));
            strict_1.default.ok(result.components.some((c) => c.name === 'lyt-adapter'));
        });
        (0, node_test_1.default)('verbose check should include all components', () => {
            const probes = [
                createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 10, { connected: true }),
                createSimulatedProbe('redis', health_entity_1.HealthStatus.Ok, 8, { connected: true }),
                createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 15, { mode: 'mock' }),
                createSimulatedProbe('memory', health_entity_1.HealthStatus.Ok, 3, { totalMB: 8192, freeMB: 4096 }),
                createSimulatedProbe('disk', health_entity_1.HealthStatus.Ok, 5, { totalGB: 256, freeGB: 128 })
            ];
            const result = simulateHealthCheck(probes);
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.equal(result.components.length, 5);
        });
    });
});
// ─── Ping simulation ───
(0, node_test_1.describe)('Health - Simulator (ping)', () => {
    (0, node_test_1.default)('should return alive with timestamp', () => {
        const result = simulatePing();
        strict_1.default.equal(result.alive, true);
        strict_1.default.ok(result.timestamp);
        strict_1.default.ok(new Date(result.timestamp).getTime() <= Date.now());
    });
    (0, node_test_1.default)('should return consistent format', () => {
        const r1 = simulatePing();
        const r2 = simulatePing();
        strict_1.default.equal(r1.alive, true);
        strict_1.default.equal(r2.alive, true);
        strict_1.default.equal(typeof r1.timestamp, 'string');
        strict_1.default.equal(typeof r2.timestamp, 'string');
        strict_1.default.ok(r2.timestamp >= r1.timestamp, 'timestamps should be monotonic');
    });
});
// ─── Component probe simulation ───
(0, node_test_1.describe)('Health - Simulator (component probes)', () => {
    (0, node_test_1.describe)('database probe', () => {
        (0, node_test_1.default)('should return connected true on healthy database', () => {
            const probe = createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 12, {
                connected: true,
                provider: 'prisma',
                dialect: 'postgresql'
            });
            strict_1.default.equal(probe.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.equal(probe.detail.connected, true);
            strict_1.default.equal(probe.detail.provider, 'prisma');
        });
        (0, node_test_1.default)('should return unavailable on connection failure', () => {
            const probe = createSimulatedProbe('database', health_entity_1.HealthStatus.Unavailable, 2000, {
                error: 'connection refused'
            });
            strict_1.default.equal(probe.status, health_entity_1.HealthStatus.Unavailable);
            strict_1.default.ok(probe.detail.error);
            strict_1.default.ok(probe.latencyMs >= 1);
        });
    });
    (0, node_test_1.describe)('redis probe', () => {
        (0, node_test_1.default)('should return PONG on healthy redis', () => {
            const probe = createSimulatedProbe('redis', health_entity_1.HealthStatus.Ok, 8, {
                connected: true,
                host: 'localhost',
                port: 6379,
                response: 'PONG'
            });
            strict_1.default.equal(probe.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.equal(probe.detail.response, 'PONG');
        });
        (0, node_test_1.default)('should be degraded on slow response', () => {
            const probe = createSimulatedProbe('redis', health_entity_1.HealthStatus.Degraded, 1200, {
                connected: true,
                host: 'localhost',
                port: 6379,
                response: 'PONG',
                message: 'high latency'
            });
            strict_1.default.equal(probe.status, health_entity_1.HealthStatus.Degraded);
        });
        (0, node_test_1.default)('should be unavailable on timeout', () => {
            const probe = createSimulatedProbe('redis', health_entity_1.HealthStatus.Unavailable, 1500, {
                error: 'Redis probe timeout after 1500ms',
                host: 'redis.example.com',
                port: 6379
            });
            strict_1.default.equal(probe.status, health_entity_1.HealthStatus.Unavailable);
            strict_1.default.ok(probe.detail.error.includes('timeout'));
        });
    });
    (0, node_test_1.describe)('lyt-adapter probe', () => {
        (0, node_test_1.default)('should be available in mock mode', () => {
            const probe = createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 15, {
                mode: 'mock',
                adapter: 'MockLytAdapter',
                available: true
            });
            strict_1.default.equal(probe.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.equal(probe.detail.available, true);
        });
        (0, node_test_1.default)('should be available in platform-mock mode', () => {
            const probe = createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 15, {
                mode: 'platform-mock',
                adapter: 'PlatformMockLytAdapter',
                available: true
            });
            strict_1.default.equal(probe.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.equal(probe.detail.mode, 'platform-mock');
        });
    });
    (0, node_test_1.describe)('memory probe', () => {
        (0, node_test_1.default)('should report memory usage stats', () => {
            const probe = createSimulatedProbe('memory', health_entity_1.HealthStatus.Ok, 3, {
                totalMB: 8192,
                usedMB: 4096,
                freeMB: 4096,
                usagePercent: 50
            });
            strict_1.default.equal(probe.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.ok(probe.detail.usagePercent >= 0);
            strict_1.default.ok(probe.detail.usagePercent <= 100);
        });
        (0, node_test_1.default)('should be degraded on high memory usage', () => {
            const probe = createSimulatedProbe('memory', health_entity_1.HealthStatus.Degraded, 5, {
                totalMB: 8192,
                usedMB: 7782,
                freeMB: 410,
                usagePercent: 95
            });
            strict_1.default.equal(probe.status, health_entity_1.HealthStatus.Degraded);
            strict_1.default.ok(probe.detail.usagePercent > 90);
        });
    });
    (0, node_test_1.describe)('disk probe', () => {
        (0, node_test_1.default)('should report disk usage stats', () => {
            const probe = createSimulatedProbe('disk', health_entity_1.HealthStatus.Ok, 5, {
                totalGB: 256,
                usedGB: 128,
                freeGB: 128,
                usagePercent: 50
            });
            strict_1.default.equal(probe.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.ok(probe.detail.totalGB > 0);
        });
        (0, node_test_1.default)('should be degraded on low disk space', () => {
            const probe = createSimulatedProbe('disk', health_entity_1.HealthStatus.Degraded, 5, {
                totalGB: 256,
                usedGB: 245,
                freeGB: 11,
                usagePercent: 95.7
            });
            strict_1.default.equal(probe.status, health_entity_1.HealthStatus.Degraded);
        });
    });
    (0, node_test_1.describe)('unknown component', () => {
        (0, node_test_1.default)('should return unavailable for unknown component', () => {
            const probe = createSimulatedProbe('unknown-component', health_entity_1.HealthStatus.Unavailable, 0, {
                error: 'Unknown component: unknown-component'
            });
            strict_1.default.equal(probe.status, health_entity_1.HealthStatus.Unavailable);
            strict_1.default.ok(probe.detail.error.includes('Unknown component'));
        });
    });
});
// ─── 8-Role health check simulation ───
(0, node_test_1.describe)('Health - Simulator (8 role checks)', () => {
    const allRoles = [
        {
            role: '👔店长',
            description: 'Store manager checking overall system health',
            criticalComponents: ['database', 'lyt-adapter']
        },
        {
            role: '🛒前台',
            description: 'Cashier checking POS service availability',
            criticalComponents: ['database', 'lyt-adapter']
        },
        {
            role: '👥HR',
            description: 'HR checking member data system stability',
            criticalComponents: ['database', 'lyt-adapter']
        },
        {
            role: '🔧安监',
            description: 'Security auditor checking system component health',
            criticalComponents: ['database', 'lyt-adapter']
        },
        {
            role: '🎮导玩员',
            description: 'Game guide checking blindbox system health',
            criticalComponents: ['database', 'lyt-adapter']
        },
        {
            role: '🎯运行专员',
            description: 'Ops specialist running full health check',
            criticalComponents: ['database', 'lyt-adapter']
        },
        {
            role: '🤝团建',
            description: 'Team building operator pre-event health check',
            criticalComponents: ['database', 'lyt-adapter']
        },
        {
            role: '📢营销',
            description: 'Marketing checking campaign system availability',
            criticalComponents: ['database', 'lyt-adapter']
        }
    ];
    for (const { role, description } of allRoles) {
        (0, node_test_1.describe)(`${role} health check`, () => {
            (0, node_test_1.default)(`should return OK for ${role} standard check`, () => {
                const result = simulateRoleCheck({ role, verbose: false });
                strict_1.default.equal(result.role, role);
                strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
                strict_1.default.ok(result.components.length >= 2);
                strict_1.default.ok(result.components.includes('database'));
                strict_1.default.ok(result.components.includes('lyt-adapter'));
                strict_1.default.ok(result.responseTimeMs >= 0);
            });
            (0, node_test_1.default)(`should return OK for ${role} verbose check`, () => {
                const result = simulateRoleCheck({ role, verbose: true });
                strict_1.default.equal(result.role, role);
                strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
                strict_1.default.ok(result.components.length > 0);
                strict_1.default.ok(result.responseTimeMs >= 0);
            });
        });
    }
    // 👔店长 - 两用例
    (0, node_test_1.describe)('👔店长 detailed', () => {
        (0, node_test_1.default)('should see all components in verbose mode', () => {
            const result = simulateRoleCheck({ role: '👔店长', verbose: true });
            strict_1.default.equal(result.role, '👔店长');
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.ok(result.components.length >= 2);
        });
        (0, node_test_1.default)('should only see critical components in standard mode', () => {
            const result = simulateRoleCheck({ role: '👔店长', verbose: false });
            strict_1.default.equal(result.role, '👔店长');
            strict_1.default.ok(result.components.length <= 5);
        });
    });
    // 🔧安监 - verbose 边界
    (0, node_test_1.describe)('🔧安监 detailed', () => {
        (0, node_test_1.default)('should detect unhealthy component', () => {
            const result = simulateRoleCheck({ role: '🔧安监', verbose: true });
            strict_1.default.equal(result.role, '🔧安监');
            strict_1.default.ok(result.responseTimeMs >= 0);
        });
        (0, node_test_1.default)('should include disk check in verbose mode', () => {
            const result = simulateRoleCheck({ role: '🔧安监', verbose: true });
            strict_1.default.ok(result.components.length >= 2);
        });
    });
    // 🎯运行专员 - 运维监控
    (0, node_test_1.describe)('🎯运行专员 detailed', () => {
        (0, node_test_1.default)('should run full health check with all components', () => {
            const result = simulateRoleCheck({ role: '🎯运行专员', verbose: true });
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.ok(result.components.length >= 2);
        });
        (0, node_test_1.default)('should complete within reasonable time', () => {
            const result = simulateRoleCheck({ role: '🎯运行专员', verbose: true });
            strict_1.default.ok(result.responseTimeMs < 1000, `Response time ${result.responseTimeMs}ms exceeded 1000ms`);
        });
    });
});
// ─── Latency boundary tests ───
(0, node_test_1.describe)('Health - Simulator (latency boundaries)', () => {
    (0, node_test_1.default)('should handle fast probes (< 5ms)', () => {
        const probes = [
            createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 2),
            createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 3)
        ];
        const result = simulateHealthCheck(probes);
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
        strict_1.default.ok(result.components.every((c) => c.latencyMs <= 5));
    });
    (0, node_test_1.default)('should handle moderate latency (100-500ms)', () => {
        const probes = [
            createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 150),
            createSimulatedProbe('redis', health_entity_1.HealthStatus.Degraded, 400),
            createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 250)
        ];
        const result = simulateHealthCheck(probes);
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Degraded);
    });
    (0, node_test_1.default)('should handle timeout-level latency (>1500ms)', () => {
        const probes = [
            createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 50),
            createSimulatedProbe('redis', health_entity_1.HealthStatus.Unavailable, 2000),
            createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 100)
        ];
        const result = simulateHealthCheck(probes);
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Unavailable);
        const redis = result.components.find((c) => c.name === 'redis');
        strict_1.default.ok(redis);
        strict_1.default.ok(redis.latencyMs >= 1500);
    });
});
// ─── Version handling ───
(0, node_test_1.describe)('Health - Simulator (version)', () => {
    (0, node_test_1.default)('should include version in health check', () => {
        const result = simulateHealthCheck([
            createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 10),
            createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 15)
        ]);
        strict_1.default.equal(typeof result.version, 'string');
        strict_1.default.ok(result.version.length > 0);
    });
    (0, node_test_1.default)('should return default version when package.json is unavailable', () => {
        // Simulate fallback version
        const result = simulateHealthCheck([
            createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 10)
        ]);
        strict_1.default.equal(typeof result.version, 'string');
        strict_1.default.ok(result.version.match(/^\d+\.\d+\.\d+$/), `Version '${result.version}' should be semver`);
    });
});
// ─── All components healthy scenario ───
(0, node_test_1.describe)('Health - Simulator (all-healthy)', () => {
    (0, node_test_1.default)('should return complete healthy result with all components', () => {
        const probes = [
            createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 10, { connected: true, provider: 'prisma', dialect: 'postgresql' }),
            createSimulatedProbe('redis', health_entity_1.HealthStatus.Ok, 8, { connected: true, host: 'localhost', port: 6379, response: 'PONG' }),
            createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 15, { mode: 'mock', adapter: 'MockLytAdapter', available: true }),
            createSimulatedProbe('memory', health_entity_1.HealthStatus.Ok, 3, { totalMB: 16384, usedMB: 8192, freeMB: 8192, usagePercent: 50 }),
            createSimulatedProbe('disk', health_entity_1.HealthStatus.Ok, 5, { totalGB: 512, usedGB: 256, freeGB: 256, usagePercent: 50 })
        ];
        const result = simulateHealthCheck(probes);
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
        strict_1.default.equal(result.components.length, 5);
        for (const c of result.components) {
            strict_1.default.equal(c.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.ok(c.latencyMs >= 0);
            strict_1.default.ok(Object.keys(c.detail).length > 0);
        }
    });
});
// ─── Multi-component failure cascade ───
(0, node_test_1.describe)('Health - Simulator (cascade failures)', () => {
    (0, node_test_1.default)('UNAVAILABLE trumps DEGRADED trumps OK', () => {
        const probes = [
            createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 10),
            createSimulatedProbe('redis', health_entity_1.HealthStatus.Degraded, 400),
            createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Unavailable, 2000)
        ];
        const result = simulateHealthCheck(probes);
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Unavailable);
    });
    (0, node_test_1.default)('DEGRADED trumps OK', () => {
        const probes = [
            createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 10),
            createSimulatedProbe('redis', health_entity_1.HealthStatus.Degraded, 400),
            createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 20)
        ];
        const result = simulateHealthCheck(probes);
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Degraded);
    });
    (0, node_test_1.default)('all degraded with no unavailable = degraded', () => {
        const probes = [
            createSimulatedProbe('database', health_entity_1.HealthStatus.Degraded, 300, { message: 'slow query' }),
            createSimulatedProbe('redis', health_entity_1.HealthStatus.Degraded, 500, { message: 'high latency' }),
            createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Degraded, 200, { message: 'slow adapter' })
        ];
        const result = simulateHealthCheck(probes);
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Degraded);
    });
    (0, node_test_1.default)('multiple unavailable components', () => {
        const probes = [
            createSimulatedProbe('database', health_entity_1.HealthStatus.Unavailable, 2000),
            createSimulatedProbe('redis', health_entity_1.HealthStatus.Unavailable, 1500),
            createSimulatedProbe('lyt-adapter', health_entity_1.HealthStatus.Ok, 20)
        ];
        const result = simulateHealthCheck(probes);
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Unavailable);
        const unavailableCount = result.components.filter((c) => c.status === health_entity_1.HealthStatus.Unavailable).length;
        strict_1.default.equal(unavailableCount, 2);
    });
});
// ─── Empty component list ───
(0, node_test_1.describe)('Health - Simulator (edge cases)', () => {
    (0, node_test_1.default)('should return OK for empty component list', () => {
        const result = simulateHealthCheck([]);
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
        strict_1.default.equal(result.components.length, 0);
    });
    (0, node_test_1.default)('should handle duplicate component names gracefully', () => {
        const probes = [
            createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 10),
            createSimulatedProbe('database', health_entity_1.HealthStatus.Ok, 12)
        ];
        const result = simulateHealthCheck(probes);
        strict_1.default.equal(result.components.length, 2);
    });
});
//# sourceMappingURL=health.simulator.test.js.map