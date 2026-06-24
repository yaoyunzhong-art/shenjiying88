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
const health_service_1 = require("./health.service");
const health_entity_1 = require("./health.entity");
(0, node_test_1.describe)('HealthService', () => {
    let service;
    function createService() {
        const service = new health_service_1.HealthService({
            getAdapter: () => ({
                getMember: async (memberId) => ({
                    memberId,
                    nickname: 'Mock Member',
                    levelName: 'SVIP Seed',
                }),
            }),
            getBootstrap: () => ({
                adapter: 'MockLytAdapter',
                foundationDependencies: ['foundation'],
                foundationContracts: ['member.read'],
            }),
        }, {
            $queryRaw: async () => [{ ready: 1 }],
        });
        service.pingTcpPort = async () => undefined;
        return service;
    }
    (0, node_test_1.default)('can be instantiated', () => {
        service = createService();
        strict_1.default.ok(service);
        strict_1.default.ok(service instanceof health_service_1.HealthService);
    });
    (0, node_test_1.describe)('check()', () => {
        (0, node_test_1.default)('returns OK status for default components', async () => {
            service = createService();
            const result = await service.check();
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.ok(result.checkedAt);
            strict_1.default.ok(result.uptimeSeconds >= 0);
            strict_1.default.ok(result.version);
            strict_1.default.equal(result.lytMode, 'mock');
        });
        (0, node_test_1.default)('returns components array with required entries', async () => {
            service = createService();
            const result = await service.check();
            strict_1.default.ok(Array.isArray(result.components));
            strict_1.default.ok(result.components.length >= 2);
            strict_1.default.ok(result.components.some((c) => c.name === 'database'));
            strict_1.default.ok(result.components.some((c) => c.name === 'lyt-adapter'));
        });
        (0, node_test_1.default)('each component has status and latencyMs', async () => {
            service = createService();
            const result = await service.check();
            for (const component of result.components) {
                strict_1.default.ok(typeof component.status === 'string');
                strict_1.default.ok(typeof component.latencyMs === 'number');
                strict_1.default.ok(typeof component.name === 'string');
            }
        });
        (0, node_test_1.default)('verbose mode includes more components', async () => {
            service = createService();
            service.pingRedis = async () => 'PONG';
            const result = await service.check({ scope: { scopeType: 'TENANT' }, verbose: true });
            strict_1.default.ok(result.components.length >= 4);
            strict_1.default.ok(result.components.some((c) => c.name === 'redis'));
            strict_1.default.ok(result.components.some((c) => c.name === 'memory'));
            strict_1.default.ok(result.components.some((c) => c.name === 'disk'));
            strict_1.default.equal(result.sampleMember?.memberId, 'seed-member-001');
        });
        (0, node_test_1.default)('non-verbose mode excludes extra components', async () => {
            service = createService();
            const result = await service.check();
            const extraComponents = result.components.filter((c) => c.name === 'redis' || c.name === 'memory' || c.name === 'disk');
            strict_1.default.equal(extraComponents.length, 0);
            strict_1.default.equal(result.sampleMember, undefined);
        });
        (0, node_test_1.default)('returns valid ISO date for checkedAt', async () => {
            service = createService();
            const result = await service.check();
            strict_1.default.ok(!isNaN(Date.parse(result.checkedAt)));
        });
    });
    (0, node_test_1.describe)('ping()', () => {
        (0, node_test_1.default)('returns alive=true for healthy system', async () => {
            service = createService();
            const result = await service.ping();
            strict_1.default.equal(result.alive, true);
            strict_1.default.ok(result.timestamp);
            strict_1.default.ok(!isNaN(Date.parse(result.timestamp)));
        });
        (0, node_test_1.default)('returns alive=true even when readiness dependencies are unavailable', async () => {
            service = createService();
            service.prismaService.$queryRaw = async () => {
                throw new Error('database down');
            };
            const result = await service.ping();
            strict_1.default.equal(result.alive, true);
            strict_1.default.ok(!isNaN(Date.parse(result.timestamp)));
        });
    });
    (0, node_test_1.describe)('checkComponent()', () => {
        (0, node_test_1.default)('database returns OK with detail', async () => {
            let queryCalls = 0;
            service = createService();
            service.prismaService.$queryRaw = async () => {
                queryCalls += 1;
                return [{ ready: 1 }];
            };
            const result = await service.checkComponent('database');
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.equal(result.name, 'database');
            strict_1.default.ok(result.latencyMs >= 0);
            strict_1.default.ok(result.detail);
            strict_1.default.equal(result.detail.connected, true);
            strict_1.default.equal(result.detail.dialect, 'postgresql');
            strict_1.default.equal(result.detail.provider, 'prisma');
            strict_1.default.equal(queryCalls, 1);
        });
        (0, node_test_1.default)('redis returns OK with detail', async () => {
            const originalHost = process.env.REDIS_HOST;
            const originalPort = process.env.REDIS_PORT;
            process.env.REDIS_HOST = 'redis.internal';
            process.env.REDIS_PORT = '6380';
            service = createService();
            try {
                ;
                service.pingRedis = async () => 'PONG';
                const result = await service.checkComponent('redis');
                strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
                strict_1.default.equal(result.name, 'redis');
                strict_1.default.equal(result.detail.connected, true);
                strict_1.default.equal(result.detail.host, 'redis.internal');
                strict_1.default.equal(result.detail.port, 6380);
                strict_1.default.equal(result.detail.response, 'PONG');
            }
            finally {
                if (originalHost !== undefined)
                    process.env.REDIS_HOST = originalHost;
                else
                    delete process.env.REDIS_HOST;
                if (originalPort !== undefined)
                    process.env.REDIS_PORT = originalPort;
                else
                    delete process.env.REDIS_PORT;
            }
        });
        (0, node_test_1.default)('lyt-adapter returns mock mode', async () => {
            service = createService();
            const result = await service.checkComponent('lyt-adapter');
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.equal(result.name, 'lyt-adapter');
            strict_1.default.equal(result.detail.mode, 'mock');
            strict_1.default.equal(result.detail.available, true);
            strict_1.default.equal(result.detail.adapter, 'MockLytAdapter');
        });
        (0, node_test_1.default)('memory returns OK with detail', async () => {
            service = createService();
            const result = await service.checkComponent('memory');
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.equal(result.name, 'memory');
            strict_1.default.ok(typeof result.detail.totalMB === 'number');
            strict_1.default.ok(typeof result.detail.usedMB === 'number');
            strict_1.default.ok(typeof result.detail.freeMB === 'number');
            strict_1.default.ok(typeof result.detail.usagePercent === 'number');
        });
        (0, node_test_1.default)('disk returns OK with detail', async () => {
            service = createService();
            const result = await service.checkComponent('disk');
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
            strict_1.default.equal(result.name, 'disk');
            strict_1.default.ok(typeof result.detail.totalGB === 'number');
            strict_1.default.ok(typeof result.detail.usedGB === 'number');
            strict_1.default.ok(typeof result.detail.freeGB === 'number');
            strict_1.default.ok(typeof result.detail.usagePercent === 'number');
        });
        (0, node_test_1.default)('database returns Unavailable when prisma probe fails', async () => {
            service = createService();
            service.prismaService.$queryRaw = async () => {
                throw new Error('database down');
            };
            const result = await service.checkComponent('database');
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Unavailable);
            strict_1.default.equal(result.detail.error, 'database down');
        });
        (0, node_test_1.default)('redis returns Unavailable when ping fails', async () => {
            service = createService();
            service.pingRedis = async () => {
                throw new Error('redis down');
            };
            const result = await service.checkComponent('redis');
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Unavailable);
            strict_1.default.equal(result.detail.error, 'redis down');
        });
        (0, node_test_1.default)('unknown component returns Unavailable', async () => {
            service = createService();
            const result = await service.checkComponent('unknown-component');
            strict_1.default.equal(result.status, health_entity_1.HealthStatus.Unavailable);
            strict_1.default.equal(result.name, 'unknown-component');
            strict_1.default.ok(result.detail);
        });
    });
    (0, node_test_1.describe)('uptime tracking', () => {
        (0, node_test_1.default)('uptimeSeconds is non-negative and increases', async () => {
            service = createService();
            const result1 = await service.check();
            // Wait a tiny bit
            await new Promise((resolve) => setTimeout(resolve, 50));
            const result2 = await service.check();
            strict_1.default.ok(result1.uptimeSeconds >= 0);
            // uptime should be same or greater (could be same if within same second)
            strict_1.default.ok(result2.uptimeSeconds >= result1.uptimeSeconds);
        });
    });
});
//# sourceMappingURL=health.service.test.js.map