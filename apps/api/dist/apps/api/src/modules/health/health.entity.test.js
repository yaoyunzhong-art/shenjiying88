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
const health_entity_1 = require("./health.entity");
function makeComponent(overrides = {}) {
    return {
        name: 'test-component',
        status: health_entity_1.HealthStatus.Ok,
        latencyMs: 10,
        ...overrides
    };
}
(0, node_test_1.describe)('health.entity: HealthStatus enum', () => {
    (0, node_test_1.default)('has three status values', () => {
        strict_1.default.equal(health_entity_1.HealthStatus.Ok, 'OK');
        strict_1.default.equal(health_entity_1.HealthStatus.Degraded, 'DEGRADED');
        strict_1.default.equal(health_entity_1.HealthStatus.Unavailable, 'UNAVAILABLE');
    });
});
(0, node_test_1.describe)('health.entity: toHealthCheckResult', () => {
    (0, node_test_1.default)('aggregates all-OK components as OK', () => {
        const components = [
            makeComponent({ name: 'db' }),
            makeComponent({ name: 'redis' }),
            makeComponent({ name: 'lyt' })
        ];
        const result = (0, health_entity_1.toHealthCheckResult)(components, {
            uptimeSeconds: 3600,
            version: '1.0.0'
        });
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
        strict_1.default.equal(result.components.length, 3);
        strict_1.default.ok(result.checkedAt);
        strict_1.default.equal(result.uptimeSeconds, 3600);
        strict_1.default.equal(result.version, '1.0.0');
    });
    (0, node_test_1.default)('aggregates with DEGRADED when one component is degraded', () => {
        const components = [
            makeComponent({ name: 'db', status: health_entity_1.HealthStatus.Ok }),
            makeComponent({ name: 'redis', status: health_entity_1.HealthStatus.Degraded, latencyMs: 500 }),
            makeComponent({ name: 'lyt', status: health_entity_1.HealthStatus.Ok })
        ];
        const result = (0, health_entity_1.toHealthCheckResult)(components, {
            uptimeSeconds: 100,
            version: '2.0.0'
        });
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Degraded);
    });
    (0, node_test_1.default)('aggregates with UNAVAILABLE when one component is unavailable', () => {
        const components = [
            makeComponent({ name: 'db', status: health_entity_1.HealthStatus.Ok }),
            makeComponent({ name: 'redis', status: health_entity_1.HealthStatus.Unavailable }),
            makeComponent({ name: 'lyt', status: health_entity_1.HealthStatus.Ok })
        ];
        const result = (0, health_entity_1.toHealthCheckResult)(components, {
            uptimeSeconds: 50,
            version: '3.0.0'
        });
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Unavailable);
    });
    (0, node_test_1.default)('UNAVAILABLE takes priority over DEGRADED', () => {
        const components = [
            makeComponent({ name: 'db', status: health_entity_1.HealthStatus.Unavailable }),
            makeComponent({ name: 'redis', status: health_entity_1.HealthStatus.Degraded })
        ];
        const result = (0, health_entity_1.toHealthCheckResult)(components, {
            uptimeSeconds: 10,
            version: '4.0.0'
        });
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Unavailable);
    });
    (0, node_test_1.default)('sets lytMode and sampleMember when provided', () => {
        const components = [makeComponent()];
        const member = {
            memberId: 'm-001',
            nickname: 'TestUser',
            levelName: 'VIP'
        };
        const result = (0, health_entity_1.toHealthCheckResult)(components, {
            uptimeSeconds: 100,
            version: '1.0.0',
            lytMode: 'mock',
            sampleMember: member
        });
        strict_1.default.equal(result.lytMode, 'mock');
        strict_1.default.ok(result.sampleMember);
        strict_1.default.equal(result.sampleMember.memberId, 'm-001');
        strict_1.default.equal(result.sampleMember.nickname, 'TestUser');
        strict_1.default.equal(result.sampleMember.levelName, 'VIP');
    });
    (0, node_test_1.default)('checkedAt is ISO date string', () => {
        const result = (0, health_entity_1.toHealthCheckResult)([makeComponent()], {
            uptimeSeconds: 1,
            version: '1.0.0'
        });
        strict_1.default.ok(!isNaN(Date.parse(result.checkedAt)));
    });
    (0, node_test_1.default)('empty components list yields OK', () => {
        const result = (0, health_entity_1.toHealthCheckResult)([], {
            uptimeSeconds: 0,
            version: '0.0.0'
        });
        strict_1.default.equal(result.status, health_entity_1.HealthStatus.Ok);
        strict_1.default.equal(result.components.length, 0);
    });
});
(0, node_test_1.describe)('health.entity: isHealthy', () => {
    (0, node_test_1.default)('returns true for OK status', () => {
        const result = {
            status: health_entity_1.HealthStatus.Ok,
            checkedAt: new Date().toISOString(),
            uptimeSeconds: 1,
            components: [],
            version: '1.0.0'
        };
        strict_1.default.equal((0, health_entity_1.isHealthy)(result), true);
    });
    (0, node_test_1.default)('returns false for DEGRADED status', () => {
        const result = {
            status: health_entity_1.HealthStatus.Degraded,
            checkedAt: new Date().toISOString(),
            uptimeSeconds: 1,
            components: [],
            version: '1.0.0'
        };
        strict_1.default.equal((0, health_entity_1.isHealthy)(result), false);
    });
    (0, node_test_1.default)('returns false for UNAVAILABLE status', () => {
        const result = {
            status: health_entity_1.HealthStatus.Unavailable,
            checkedAt: new Date().toISOString(),
            uptimeSeconds: 1,
            components: [],
            version: '1.0.0'
        };
        strict_1.default.equal((0, health_entity_1.isHealthy)(result), false);
    });
});
(0, node_test_1.describe)('health.entity: isDegraded', () => {
    (0, node_test_1.default)('returns true for DEGRADED status', () => {
        const result = {
            status: health_entity_1.HealthStatus.Degraded,
            checkedAt: new Date().toISOString(),
            uptimeSeconds: 1,
            components: [],
            version: '1.0.0'
        };
        strict_1.default.equal((0, health_entity_1.isDegraded)(result), true);
    });
    (0, node_test_1.default)('returns false for OK status', () => {
        const result = {
            status: health_entity_1.HealthStatus.Ok,
            checkedAt: new Date().toISOString(),
            uptimeSeconds: 1,
            components: [],
            version: '1.0.0'
        };
        strict_1.default.equal((0, health_entity_1.isDegraded)(result), false);
    });
    (0, node_test_1.default)('returns false for UNAVAILABLE status', () => {
        const result = {
            status: health_entity_1.HealthStatus.Unavailable,
            checkedAt: new Date().toISOString(),
            uptimeSeconds: 1,
            components: [],
            version: '1.0.0'
        };
        strict_1.default.equal((0, health_entity_1.isDegraded)(result), false);
    });
});
//# sourceMappingURL=health.entity.test.js.map